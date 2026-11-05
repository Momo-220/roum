import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  PERMISSIONS,
  SUPER_ADMIN_ROLE_ID,
  isPermissionCode,
  generateTrackingNumber,
  phoneSchema,
  type TransportType,
} from "../shared";
import { hashPassword, verifyJwt, resolveJwtSecret, sanitizeCsvCell } from "../crypto";
import type { Env, UserSession } from "../types";

export const adminRouter = new Hono<{ Bindings: Env; Variables: { user: UserSession } }>();

/**
 * Middleware d'authentification pour toutes les routes /admin
 */
adminRouter.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const cookieToken = getCookie(c, "roum_session");
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookieToken;

  if (!token) {
    return c.json({ error: "Authentification requise." }, 401);
  }

  // Session locale de développement (uniquement hors production)
  if (token === "roum_local_admin_session" && c.env.ENVIRONMENT !== "production") {
    c.set("user", {
      userId: "user-superadmin-01",
      email: "ceo@roumtransit.com",
      fullName: "Madame Marouba",
      roleId: SUPER_ADMIN_ROLE_ID,
      roleName: "CEO",
      isSuperAdmin: true,
      hubLocation: "Abidjan / Bamako",
      permissions: ["*"],
      allowedStatuses: ["*"],
    });
    return await next();
  }

  const jwtSecret = resolveJwtSecret(c.env);
  const payload = await verifyJwt<{ sub: string; exp: number }>(token, jwtSecret);

  if (!payload || !payload.sub || Date.now() > payload.exp) {
    return c.json({ error: "Session invalide ou expirée." }, 401);
  }

  // Vérification en base en temps réel
  const user = await c.env.DB.prepare(`
    SELECT 
      u.id, u.email, u.full_name, u.role_id, u.hub_location, u.is_active,
      r.name as role_name, r.is_active as role_is_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).bind(payload.sub).first<{
    id: string;
    email: string;
    full_name: string;
    role_id: string;
    hub_location: string | null;
    is_active: number;
    role_name: string;
    role_is_active: number;
  }>();

  if (!user || user.is_active !== 1 || user.role_is_active !== 1) {
    return c.json({ error: "Accès refusé : compte désactivé." }, 403);
  }

  const isSuperAdmin = user.role_id === SUPER_ADMIN_ROLE_ID;

  const { results: permRows } = await c.env.DB.prepare(`
    SELECT permission_code FROM role_permissions WHERE role_id = ?
  `).bind(user.role_id).all<{ permission_code: string }>();

  const { results: statusRows } = await c.env.DB.prepare(`
    SELECT status_code FROM role_allowed_statuses WHERE role_id = ?
  `).bind(user.role_id).all<{ status_code: string }>();

  c.set("user", {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    roleId: user.role_id,
    roleName: user.role_name,
    isSuperAdmin,
    hubLocation: user.hub_location,
    permissions: isSuperAdmin ? ["*"] : permRows.map((r) => r.permission_code),
    allowedStatuses: isSuperAdmin ? ["*"] : statusRows.map((r) => r.status_code),
  });

  return await next();
});

// Helper de vérification de permission
function checkPermission(c: { get: (k: "user") => UserSession }, requiredPermission: string): boolean {
  const user = c.get("user");
  if (user.isSuperAdmin) return true;
  return user.permissions.includes(requiredPermission) || user.permissions.includes("*");
}

/* ==========================================================================
   1. GESTION DES PERMISSIONS & RÔLES DYNAMIQUES (Super Admin Uniquement)
   ========================================================================== */

adminRouter.get("/permissions", (c) => {
  const user = c.get("user");
  if (!user.isSuperAdmin) {
    return c.json({ error: "Réservé au Super Administrateur." }, 403);
  }
  return c.json({ permissions: PERMISSIONS });
});

adminRouter.get("/roles", async (c) => {
  const user = c.get("user");
  if (!user.isSuperAdmin) {
    return c.json({ error: "Réservé au Super Administrateur." }, 403);
  }

  const { results: roles } = await c.env.DB.prepare(`
    SELECT r.id, r.name, r.description, r.is_system, r.is_active, r.created_at,
           (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as users_count
    FROM roles r
    ORDER BY r.is_system DESC, r.name ASC
  `).all();

  // Attachement des permissions et statuts pour chaque rôle
  const enriched = await Promise.all(
    roles.map(async (r: any) => {
      const { results: perms } = await c.env.DB.prepare(`
        SELECT permission_code FROM role_permissions WHERE role_id = ?
      `).bind(r.id).all();
      const { results: statuses } = await c.env.DB.prepare(`
        SELECT status_code FROM role_allowed_statuses WHERE role_id = ?
      `).bind(r.id).all();

      return {
        ...r,
        permissions: perms.map((p: any) => p.permission_code),
        allowed_statuses: statuses.map((s: any) => s.status_code),
      };
    })
  );

  return c.json({ roles: enriched });
});

const createRoleSchema = z.object({
  name: z.string().min(2, "Nom de rôle requis"),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  allowed_statuses: z.array(z.string()),
});

adminRouter.post("/roles", zValidator("json", createRoleSchema), async (c) => {
  const user = c.get("user");
  if (!user.isSuperAdmin) {
    return c.json({ error: "Réservé au Super Administrateur." }, 403);
  }

  const data = c.req.valid("json");
  const roleId = crypto.randomUUID();

  // Validation stricte des permissions contre le catalogue
  for (const code of data.permissions) {
    if (!isPermissionCode(code)) {
      return c.json({ error: `Code de permission inconnu : ${code}` }, 400);
    }
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      INSERT INTO roles (id, name, description, is_system, is_active)
      VALUES (?, ?, ?, 0, 1)
    `).bind(roleId, data.name.trim(), data.description || null),
  ];

  for (const perm of data.permissions) {
    statements.push(
      c.env.DB.prepare(`INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)`).bind(roleId, perm)
    );
  }

  for (const status of data.allowed_statuses) {
    statements.push(
      c.env.DB.prepare(`INSERT INTO role_allowed_statuses (role_id, status_code) VALUES (?, ?)`).bind(roleId, status)
    );
  }

  // Audit log
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
      VALUES (?, ?, 'role.create', 'role', ?, ?)
    `).bind(crypto.randomUUID(), user.userId, roleId, JSON.stringify({ name: data.name }))
  );

  await c.env.DB.batch(statements);

  return c.json({ success: true, role_id: roleId, message: "Rôle créé avec succès." }, 201);
});

/* ==========================================================================
   2. GESTION DES EMPLOYÉS (Super Admin Uniquement)
   ========================================================================== */

adminRouter.get("/users", async (c) => {
  const user = c.get("user");
  if (!user.isSuperAdmin) {
    return c.json({ error: "Réservé au Super Administrateur." }, 403);
  }

  const { results: users } = await c.env.DB.prepare(`
    SELECT u.id, u.email, u.full_name, u.role_id, r.name as role_name,
           u.hub_location, u.is_active, u.created_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `).all();

  return c.json({ users });
});

const createUserSchema = z.object({
  email: z.string().email("Email invalide").max(160),
  password: z.string().min(8, "Mot de passe de 8 caractères minimum requis").max(128, "Mot de passe trop long"),
  full_name: z.string().min(2, "Nom complet requis").max(120),
  role_id: z.string().min(1, "Rôle requis").max(80),
  hub_location: z.string().max(120).optional(),
});

adminRouter.post("/users", zValidator("json", createUserSchema), async (c) => {
  const currentUser = c.get("user");
  if (!currentUser.isSuperAdmin) {
    return c.json({ error: "Réservé au Super Administrateur." }, 403);
  }

  const data = c.req.valid("json");
  const roleExists = await c.env.DB.prepare(`SELECT id FROM roles WHERE id = ? AND is_active = 1`).bind(data.role_id).first();
  if (!roleExists) {
    return c.json({ error: "Rôle inexistant ou inactif." }, 400);
  }

  const newUserId = crypto.randomUUID();
  const passwordHash = await hashPassword(data.password);

  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role_id, hub_location, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).bind(
        newUserId,
        data.email.trim().toLowerCase(),
        passwordHash,
        data.full_name.trim(),
        data.role_id,
        data.hub_location || null
      ),
      c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
        VALUES (?, ?, 'user.create', 'user', ?, ?)
      `).bind(
        crypto.randomUUID(),
        currentUser.userId,
        newUserId,
        JSON.stringify({ email: data.email.trim().toLowerCase(), role_id: data.role_id })
      ),
    ]);

    return c.json({ success: true, user_id: newUserId, message: "Utilisateur créé avec succès." }, 201);
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint failed: users.email")) {
      return c.json({ error: "Cet email est déjà utilisé par un autre compte." }, 409);
    }
    throw err;
  }
});

/* ==========================================================================
   3. GESTION DES EXPÉDITIONS & COLIS (Permissions dédiées)
   ========================================================================== */

adminRouter.get("/shipments", async (c) => {
  if (!checkPermission(c, "shipments.view")) {
    return c.json({ error: "Permission insuffisante (shipments.view requise)." }, 403);
  }

  const status = c.req.query("status");
  const search = c.req.query("search");

  let query = `
    SELECT 
      s.id, s.tracking_number, s.current_status, st.label_public as status_label,
      s.total_parcels_count, s.total_weight_kg, s.total_volume_cbm,
      s.estimated_price_minor, s.final_price_minor, s.currency, s.payment_status,
      s.created_at,
      c.full_name as client_name, c.phone_whatsapp as client_phone,
      r.origin_country, r.origin_city, r.destination_country, r.destination_city,
      sm.name as shipping_mode_name, sm.type as shipping_mode_type
    FROM shipments s
    JOIN shipment_statuses st ON s.current_status = st.code
    JOIN clients c ON s.client_id = c.id
    JOIN routes r ON s.route_id = r.id
    JOIN shipping_modes sm ON s.shipping_mode_id = sm.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ` AND s.current_status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (s.tracking_number LIKE ? OR c.full_name LIKE ? OR c.phone_whatsapp LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY s.created_at DESC LIMIT 50`;

  const { results: shipments } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ shipments });
});

const createShipmentSchema = z.object({
  client: z.object({
    full_name: z.string().min(2),
    phone_whatsapp: phoneSchema,
    email: z.string().email().optional().or(z.literal("")),
    country: z.string().min(2),
    city: z.string().optional(),
    address: z.string().optional(),
  }),
  route_id: z.string().min(1),
  shipping_mode_id: z.string().min(1),
  parcels: z.array(
    z.object({
      package_label: z.string().optional(),
      weight_kg: z.number().positive(),
      length_cm: z.number().positive().optional(),
      width_cm: z.number().positive().optional(),
      height_cm: z.number().positive().optional(),
      description: z.string().optional(),
    })
  ).min(1, "Au moins un colis requis"),
  estimated_price_minor: z.number().int().nonnegative().optional(),
  currency: z.string().default("USD"),
});

adminRouter.post("/shipments", zValidator("json", createShipmentSchema), async (c) => {
  if (!checkPermission(c, "shipments.create")) {
    return c.json({ error: "Permission insuffisante (shipments.create requise)." }, 403);
  }

  const user = c.get("user");
  const data = c.req.valid("json");

  // Vérification du mode de transport pour générer le tracking number
  const mode = await c.env.DB.prepare(`SELECT type FROM shipping_modes WHERE id = ?`).bind(data.shipping_mode_id).first<{ type: TransportType }>();
  if (!mode) {
    return c.json({ error: "Mode de transport inconnu." }, 400);
  }

  const trackingNumber = generateTrackingNumber(mode.type);
  const shipmentId = crypto.randomUUID();
  let clientId = crypto.randomUUID();

  // Recherche si le client existe déjà par téléphone WhatsApp
  const existingClient = await c.env.DB.prepare(`SELECT id FROM clients WHERE phone_whatsapp = ?`).bind(data.client.phone_whatsapp).first<{ id: string }>();
  if (existingClient) {
    clientId = existingClient.id;
  }

  let totalWeight = 0;
  let totalVolume = 0;
  for (const p of data.parcels) {
    totalWeight += p.weight_kg;
    if (p.length_cm && p.width_cm && p.height_cm) {
      totalVolume += (p.length_cm * p.width_cm * p.height_cm) / 1000000;
    }
  }

  const statements: D1PreparedStatement[] = [];

  // Création client si nouveau
  if (!existingClient) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO clients (id, full_name, phone_whatsapp, email, address, city, country)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        clientId,
        data.client.full_name,
        data.client.phone_whatsapp,
        data.client.email || null,
        data.client.address || null,
        data.client.city || null,
        data.client.country
      )
    );
  }

  // Insertion de l'expédition
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO shipments (
        id, tracking_number, client_id, route_id, shipping_mode_id,
        current_status, total_parcels_count, total_weight_kg, total_volume_cbm,
        estimated_price_minor, currency, payment_status, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, 'PENDING', ?)
    `).bind(
      shipmentId,
      trackingNumber,
      clientId,
      data.route_id,
      data.shipping_mode_id,
      data.parcels.length,
      Math.round(totalWeight * 100) / 100,
      Math.round(totalVolume * 10000) / 10000,
      data.estimated_price_minor || 0,
      data.currency,
      user.userId
    )
  );

  // Insertion des colis individuels
  data.parcels.forEach((p, index) => {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO parcels (id, shipment_id, parcel_index, package_label, weight_kg, length_cm, width_cm, height_cm, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        shipmentId,
        index + 1,
        p.package_label || `Colis ${index + 1}`,
        p.weight_kg,
        p.length_cm || null,
        p.width_cm || null,
        p.height_cm || null,
        p.description || null
      )
    );
  });

  // Événement de suivi initial
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
      VALUES (?, ?, 'DRAFT', ?, 'Dossier créé', ?)
    `).bind(
      crypto.randomUUID(),
      shipmentId,
      user.hubLocation || "Bureau Central",
      user.userId
    )
  );

  // Exécution atomique
  await c.env.DB.batch(statements);

  return c.json(
    {
      success: true,
      shipment_id: shipmentId,
      tracking_number: trackingNumber,
      message: "Expédition créée avec succès.",
    },
    201
  );
});

const updateStatusSchema = z.object({
  new_status: z.string().min(2),
  location: z.string().min(2, "Lieu requis"),
  comment: z.string().optional(),
});

adminRouter.patch("/shipments/:id/status", zValidator("json", updateStatusSchema), async (c) => {
  if (!checkPermission(c, "shipments.status.update")) {
    return c.json({ error: "Permission insuffisante (shipments.status.update requise)." }, 403);
  }

  const user = c.get("user");
  const shipmentId = c.req.param("id");
  const { new_status, location, comment } = c.req.valid("json");

  // Garde-fou RBAC : le rôle de l'utilisateur a-t-il le droit d'appliquer ce statut précis ?
  if (!user.isSuperAdmin && !user.allowedStatuses.includes(new_status) && !user.allowedStatuses.includes("*")) {
    return c.json(
      { error: `Votre rôle (${user.roleName}) n'est pas autorisé à appliquer le statut : ${new_status}` },
      403
    );
  }

  // Vérification existence du statut
  const statusExists = await c.env.DB.prepare(`SELECT code FROM shipment_statuses WHERE code = ? AND is_active = 1`).bind(new_status).first();
  if (!statusExists) {
    return c.json({ error: "Statut inexistant ou inactif." }, 400);
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE shipments 
      SET current_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(new_status, shipmentId),

    c.env.DB.prepare(`
      INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      shipmentId,
      new_status,
      location.trim(),
      comment?.trim() || null,
      user.userId
    ),
    c.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
      VALUES (?, ?, 'shipment.status', 'shipment', ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.userId,
      shipmentId,
      JSON.stringify({ new_status, location: location.trim() })
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: `Statut mis à jour vers ${new_status}.` });
});

/**
 * Détail complet d'une expédition avec ses colis, événements de suivi et paiements
 */
adminRouter.get("/shipments/:id", async (c) => {
  if (!checkPermission(c, "shipments.view")) {
    return c.json({ error: "Permission insuffisante (shipments.view requise)." }, 403);
  }

  const shipmentId = c.req.param("id");
  const shipment = await c.env.DB.prepare(`
    SELECT 
      s.*, st.label_public as status_label,
      c.full_name as client_name, c.phone_whatsapp as client_phone, c.email as client_email,
      c.city as client_city, c.country as client_country,
      r.origin_country, r.origin_city, r.destination_country, r.destination_city,
      sm.name as shipping_mode_name, sm.type as shipping_mode_type, sm.pricing_basis
    FROM shipments s
    LEFT JOIN shipment_statuses st ON s.current_status = st.code
    JOIN clients c ON s.client_id = c.id
    JOIN routes r ON s.route_id = r.id
    JOIN shipping_modes sm ON s.shipping_mode_id = sm.id
    WHERE s.id = ?
  `).bind(shipmentId).first();

  if (!shipment) {
    return c.json({ error: "Expédition introuvable." }, 404);
  }

  const [parcelsRes, eventsRes, paymentsRes] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM parcels WHERE shipment_id = ? ORDER BY parcel_index ASC`).bind(shipmentId).all(),
    c.env.DB.prepare(`
      SELECT t.*, u.full_name as recorded_by_name, st.label_public as status_label
      FROM tracking_events t
      LEFT JOIN users u ON t.recorded_by_user_id = u.id
      LEFT JOIN shipment_statuses st ON t.status = st.code
      WHERE t.shipment_id = ?
      ORDER BY t.event_timestamp DESC
    `).bind(shipmentId).all(),
    c.env.DB.prepare(`
      SELECT p.*, u.full_name as recorded_by_name
      FROM payments p
      LEFT JOIN users u ON p.recorded_by_user_id = u.id
      WHERE p.shipment_id = ?
      ORDER BY p.recorded_at DESC
    `).bind(shipmentId).all(),
  ]);

  return c.json({
    shipment,
    parcels: parcelsRes.results,
    tracking_events: eventsRes.results,
    payments: paymentsRes.results,
  });
});

/**
 * Réception physique et pesée réelle au magasin / hub
 */
const shipmentIntakeSchema = z.object({
  total_weight_kg: z.number().positive("Poids réel supérieur à 0 requis"),
  total_volume_cbm: z.number().nonnegative().optional(),
  hub_location: z.string().min(2, "Lieu d'entrepôt requis"),
  status: z.string().default("RECEIVED_AT_HUB"),
  comment: z.string().optional(),
  final_price_minor: z.number().int().nonnegative().optional(),
});

adminRouter.patch("/shipments/:id/intake", zValidator("json", shipmentIntakeSchema), async (c) => {
  if (!checkPermission(c, "shipments.status.update")) {
    return c.json({ error: "Permission insuffisante (shipments.status.update requise)." }, 403);
  }

  const user = c.get("user");
  const shipmentId = c.req.param("id");
  const data = c.req.valid("json");

  // Garde-fou RBAC : vérification du statut autorisé pour le rôle
  if (!user.isSuperAdmin && !user.allowedStatuses.includes(data.status) && !user.allowedStatuses.includes("*")) {
    return c.json(
      { error: `Votre rôle (${user.roleName}) n'est pas autorisé à appliquer le statut : ${data.status}` },
      403
    );
  }

  // Garde-fou RBAC Financier : modifier final_price_minor exige finance.edit
  if (data.final_price_minor !== undefined && !checkPermission(c, "finance.edit")) {
    return c.json({ error: "Permission insuffisante (finance.edit requise pour modifier le prix final)." }, 403);
  }

  const statusExists = await c.env.DB.prepare(`SELECT code FROM shipment_statuses WHERE code = ? AND is_active = 1`).bind(data.status).first();
  if (!statusExists) {
    return c.json({ error: "Statut inexistant ou inactif." }, 400);
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE shipments 
      SET 
        total_weight_kg = ?,
        total_volume_cbm = COALESCE(?, total_volume_cbm),
        current_status = ?,
        final_price_minor = COALESCE(?, final_price_minor),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      Math.round(data.total_weight_kg * 100) / 100,
      data.total_volume_cbm !== undefined ? Math.round(data.total_volume_cbm * 10000) / 10000 : null,
      data.status,
      data.final_price_minor || null,
      shipmentId
    ),
    c.env.DB.prepare(`
      INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      shipmentId,
      data.status,
      data.hub_location.trim(),
      data.comment?.trim() || `Réception physique et pesée réelle au magasin (${data.total_weight_kg} kg${data.total_volume_cbm ? `, ${data.total_volume_cbm} m³` : ""})`,
      user.userId
    ),
    c.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
      VALUES (?, ?, 'shipment.intake', 'shipment', ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.userId,
      shipmentId,
      JSON.stringify({ total_weight_kg: data.total_weight_kg, status: data.status, final_price_minor: data.final_price_minor })
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: "Réception physique et pesée enregistrées avec succès." });
});

/* ==========================================================================
   4. GESTION DES STATUTS D'EXPÉDITION
   ========================================================================== */

adminRouter.get("/statuses", async (c) => {
  const { results: statuses } = await c.env.DB.prepare(`
    SELECT code, label_public, description, sort_order, is_final, is_system, is_active
    FROM shipment_statuses
    ORDER BY sort_order ASC
  `).all();

  return c.json({ statuses });
});

/* ==========================================================================
   5. TABLEAU DE BORD (KPIs & Statistiques globales)
   ========================================================================== */

adminRouter.get("/stats", async (c) => {
  if (!checkPermission(c, "dashboard.view")) {
    return c.json({ error: "Permission insuffisante (dashboard.view requise)." }, 403);
  }

  const [shipmentsCount, activeShipments, clientsCount, requestsCount, pendingRequests, confirmedPayments, pendingPayments, tasksCount] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM shipments`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM shipments WHERE current_status NOT IN ('DELIVERED', 'CANCELLED')`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM clients`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM customer_requests`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM customer_requests WHERE status IN ('NEW', 'IN_REVIEW')`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount_minor), 0) as total FROM payments WHERE status = 'CONFIRMED'`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount_minor), 0) as total FROM payments WHERE status = 'PENDING'`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM tasks WHERE status != 'DONE'`).first<{ total: number }>(),
  ]);

  return c.json({
    stats: {
      total_shipments: shipmentsCount?.total || 0,
      active_shipments: activeShipments?.total || 0,
      total_clients: clientsCount?.total || 0,
      total_requests: requestsCount?.total || 0,
      pending_requests: pendingRequests?.total || 0,
      total_payments_minor: confirmedPayments?.total || 0,
      pending_payments_minor: pendingPayments?.total || 0,
      pending_tasks: tasksCount?.total || 0,
    },
  });
});

/* ==========================================================================
   6. DEMANDES CLIENTS REÇUES (Alibaba, Transit Fournisseur, Expéditions)
   ========================================================================== */

function unpackAdminRequestRow(row: any, items: any[] = []) {
  if (!row) return null;
  let meta: Record<string, any> = {};
  if (typeof row.admin_notes === "string" && row.admin_notes.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(row.admin_notes);
      if (parsed && typeof parsed === "object" && parsed.__roum_meta) {
        meta = parsed;
      }
    } catch {}
  }
  const firstItem = items[0] || {};
  return {
    ...row,
    ...meta,
    id: row.id,
    reference: row.reference,
    request_type: row.request_type,
    client_name: row.client_name,
    client_phone: row.client_phone,
    client_email: row.client_email,
    origin_country: row.origin_country,
    destination_country: row.destination_country,
    status: row.status,
    created_at: row.created_at,
    estimated_weight_kg: row.estimated_weight_kg ?? meta.estimated_weight_kg ?? null,
    estimated_cbm: row.estimated_cbm ?? meta.estimated_cbm ?? null,
    description: row.description,
    shipping_mark: row.shipping_mark || meta.shipping_mark || null,
    product_name: meta.product_name || firstItem.product_name || null,
    product_url: meta.product_url || firstItem.product_url || "",
    product_quantity: meta.product_quantity || (firstItem.quantity ? String(firstItem.quantity) : "1"),
    product_image: meta.product_image || null,
    items: items.length > 0 ? items : meta.items || [],
  };
}

adminRouter.get("/requests", async (c) => {
  if (!checkPermission(c, "requests.view") && !checkPermission(c, "quotes.view")) {
    return c.json({ error: "Permission insuffisante (requests.view requise)." }, 403);
  }

  const status = c.req.query("status");
  const type = c.req.query("type");
  const search = c.req.query("search");

  let query = `
    SELECT 
      r.*,
      u.full_name as assigned_to_name
    FROM customer_requests r
    LEFT JOIN users u ON r.assigned_to_user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ` AND r.status = ?`;
    params.push(status);
  }
  if (type) {
    query += ` AND r.request_type = ?`;
    params.push(type);
  }
  if (search) {
    query += ` AND (r.reference LIKE ? OR r.client_name LIKE ? OR r.client_phone LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY r.created_at DESC LIMIT 100`;

  const { results: rows } = await c.env.DB.prepare(query).bind(...params).all();
  const requests = await Promise.all(
    ((rows as any[]) || []).map(async (r) => {
      const { results: items } = await c.env.DB.prepare(
        `SELECT * FROM request_items WHERE request_id = ? ORDER BY item_index ASC`
      ).bind(r.id).all();
      return unpackAdminRequestRow(r, items as any[]);
    })
  );
  return c.json({ requests });
});

adminRouter.get("/requests/:id", async (c) => {
  if (!checkPermission(c, "requests.view") && !checkPermission(c, "quotes.view")) {
    return c.json({ error: "Permission insuffisante." }, 403);
  }

  const id = c.req.param("id");
  const request = await c.env.DB.prepare(`
    SELECT r.*, u.full_name as assigned_to_name
    FROM customer_requests r
    LEFT JOIN users u ON r.assigned_to_user_id = u.id
    WHERE r.id = ? OR UPPER(r.reference) = UPPER(?)
    LIMIT 1
  `).bind(id, id).first<any>();

  if (!request) {
    return c.json({ error: "Demande introuvable." }, 404);
  }

  const { results: items } = await c.env.DB.prepare(`
    SELECT * FROM request_items WHERE request_id = ? ORDER BY item_index ASC
  `).bind(request.id).all();

  return c.json({ request: unpackAdminRequestRow(request, items as any[]), items });
});

/**
 * ÉTAPE 2 (Admin ➔ Base de données ➔ Client) :
 * Enregistre le poids estimé, le prix marchandise, le fret et le total devis dans SQLite D1
 */
adminRouter.patch("/requests/:reference/quote", async (c) => {
  const ref = (c.req.param("reference") || "").trim();
  if (!ref) return c.json({ error: "Référence requise." }, 400);

  const body = await c.req.json<any>().catch(() => ({}));
  const existing = await c.env.DB.prepare(`
    SELECT * FROM customer_requests WHERE UPPER(reference) = UPPER(?) OR id = ? LIMIT 1
  `).bind(ref, ref).first<any>();

  let currentMeta: Record<string, any> = { __roum_meta: true };
  if (existing && typeof existing.admin_notes === "string" && existing.admin_notes.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(existing.admin_notes);
      if (parsed && typeof parsed === "object") {
        currentMeta = { ...parsed, __roum_meta: true };
      }
    } catch {}
  }

  const nextMeta = {
    ...currentMeta,
    ...(body.metadata || {}),
    total_goods_fcfa: body.goodsTotalFcfa !== undefined ? Number(body.goodsTotalFcfa) : currentMeta.total_goods_fcfa,
    shipping_fee_fcfa: body.shippingFeeFcfa !== undefined ? Number(body.shippingFeeFcfa) : currentMeta.shipping_fee_fcfa,
    total_amount_fcfa: body.totalAmountFcfa !== undefined ? Number(body.totalAmountFcfa) : currentMeta.total_amount_fcfa,
    shipping_mode_name: body.shippingModeName || currentMeta.shipping_mode_name,
    tracking_number: body.trackingNumber || currentMeta.tracking_number || null,
  };

  const nextStatus = body.status || (existing?.status === "CONVERTED" ? "CONVERTED" : "QUOTE_SENT");
  const weightKg = body.estimatedWeightKg !== undefined ? body.estimatedWeightKg : existing?.estimated_weight_kg ?? null;
  const cbmVal = body.estimatedCbm !== undefined ? body.estimatedCbm : existing?.estimated_cbm ?? null;

  if (existing) {
    await c.env.DB.prepare(`
      UPDATE customer_requests
      SET estimated_weight_kg = ?,
          estimated_cbm = ?,
          status = ?,
          admin_notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(weightKg, cbmVal, nextStatus, JSON.stringify(nextMeta), existing.id).run();

    const updated = await c.env.DB.prepare(`SELECT * FROM customer_requests WHERE id = ?`).bind(existing.id).first<any>();
    return c.json({ success: true, request: unpackAdminRequestRow(updated) });
  } else {
    const id = crypto.randomUUID();
    const fb = body.metadata || {};
    await c.env.DB.prepare(`
      INSERT INTO customer_requests (
        id, reference, client_name, client_phone, request_type,
        origin_country, destination_country, description,
        estimated_weight_kg, estimated_cbm, status, admin_notes
      ) VALUES (?, ?, ?, ?, 'ALIBABA', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      ref,
      fb.client_name || "Client ROUM",
      fb.client_phone || "+22500000000",
      fb.origin_country || "Chine",
      fb.destination_country || "Côte d'Ivoire",
      fb.description || fb.product_name || "Commande client",
      weightKg,
      cbmVal,
      nextStatus,
      JSON.stringify(nextMeta)
    ).run();

    const created = await c.env.DB.prepare(`SELECT * FROM customer_requests WHERE id = ?`).bind(id).first<any>();
    return c.json({ success: true, request: unpackAdminRequestRow(created) }, 201);
  }
});

/**
 * ÉTAPE 3 (Admin ➔ Base de données ➔ Client Tracking) :
 * Confirme l'encaissement, attribue le Tracking Number officiel et crée l'expédition active dans SQLite D1
 */
adminRouter.post("/requests/:reference/confirm-tracking", async (c) => {
  const user = c.get("user");
  const ref = (c.req.param("reference") || "").trim();
  if (!ref) return c.json({ error: "Référence requise." }, 400);

  const body = await c.req.json<any>().catch(() => ({}));
  const trackingNumber = (body.trackingNumber || "").trim();
  if (!trackingNumber) return c.json({ error: "Numéro de suivi requis." }, 400);

  const existingReq = await c.env.DB.prepare(`
    SELECT * FROM customer_requests WHERE UPPER(reference) = UPPER(?) OR id = ? LIMIT 1
  `).bind(ref, ref).first<any>();

  let currentMeta: Record<string, any> = { __roum_meta: true };
  if (existingReq && typeof existingReq.admin_notes === "string" && existingReq.admin_notes.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(existingReq.admin_notes);
      if (parsed && typeof parsed === "object") {
        currentMeta = { ...parsed, __roum_meta: true };
      }
    } catch {}
  }

  const nextMeta = {
    ...currentMeta,
    ...(body.metadata || {}),
    tracking_number: trackingNumber,
    total_goods_fcfa: body.goodsTotalFcfa ?? currentMeta.total_goods_fcfa ?? 0,
    shipping_fee_fcfa: body.shippingFeeFcfa ?? currentMeta.shipping_fee_fcfa ?? 0,
    total_amount_fcfa: body.totalAmountFcfa ?? currentMeta.total_amount_fcfa ?? 0,
  };

  if (existingReq) {
    await c.env.DB.prepare(`
      UPDATE customer_requests
      SET status = 'CONVERTED',
          estimated_weight_kg = COALESCE(?, estimated_weight_kg),
          estimated_cbm = COALESCE(?, estimated_cbm),
          admin_notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.weightKg ?? null,
      body.volumeCbm ?? null,
      JSON.stringify(nextMeta),
      existingReq.id
    ).run();
  }

  // Création ou mise à jour de l'expédition active dans `shipments` pour que /tracking/RM-... fonctionne en base
  const clientName = body.clientName || existingReq?.client_name || "Client ROUM";
  const clientPhone = body.clientPhone || existingReq?.client_phone || "+22500000000";
  const destRaw = String(body.destination || existingReq?.destination_country || "Côte d'Ivoire — Abidjan");
  const destCountry = destRaw.split("—")[0]?.trim() || "Côte d'Ivoire";
  const destCity = destRaw.split("—")[1]?.trim() || "Abidjan";
  const origCountry = String(body.origin || existingReq?.origin_country || "Chine").trim();
  const isSea = body.isSea === true || trackingNumber.includes("-SEA-");
  const modeId = isSea ? "SEA_LCL" : "AIR_EXPRESS";

  // 1. Client
  let clientId = existingReq?.client_id || null;
  if (!clientId) {
    const foundClient = await c.env.DB.prepare(`SELECT id FROM clients WHERE phone_whatsapp = ? LIMIT 1`).bind(clientPhone).first<{ id: string }>();
    if (foundClient?.id) {
      clientId = foundClient.id;
    } else {
      clientId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO clients (id, full_name, phone_whatsapp, city, country)
        VALUES (?, ?, ?, ?, ?)
      `).bind(clientId, clientName, clientPhone, destCity, destCountry).run();
    }
  }

  // 2. Route
  let routeId = "route-cn-ci-gz";
  const foundRoute = await c.env.DB.prepare(`
    SELECT id FROM routes WHERE LOWER(origin_country) = LOWER(?) AND LOWER(destination_country) = LOWER(?) LIMIT 1
  `).bind(origCountry, destCountry).first<{ id: string }>();
  if (foundRoute?.id) {
    routeId = foundRoute.id;
  } else {
    const anyRoute = await c.env.DB.prepare(`SELECT id FROM routes LIMIT 1`).first<{ id: string }>();
    if (anyRoute?.id) routeId = anyRoute.id;
  }

  // 3. Shipment
  const existingShip = await c.env.DB.prepare(`SELECT id FROM shipments WHERE UPPER(tracking_number) = UPPER(?) LIMIT 1`).bind(trackingNumber).first<{ id: string }>();
  const weightVal = Number(body.weightKg) || 2;
  const volVal = Number(body.volumeCbm) || 0.05;
  const priceMinor = Math.round((Number(body.totalAmountFcfa) || 0) * 100);

  if (!existingShip) {
    const shipmentId = crypto.randomUUID();
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO shipments (
          id, tracking_number, client_id, route_id, shipping_mode_id,
          current_status, total_parcels_count, total_weight_kg, total_volume_cbm,
          estimated_price_minor, final_price_minor, currency, payment_status, created_by_user_id
        ) VALUES (?, ?, ?, ?, ?, 'RECEIVED_AT_HUB', 1, ?, ?, ?, ?, 'FCFA', 'PAID', ?)
      `).bind(
        shipmentId,
        trackingNumber,
        clientId,
        routeId,
        modeId,
        weightVal,
        volVal,
        priceMinor,
        priceMinor,
        user?.userId || "user-superadmin-01"
      ),
      c.env.DB.prepare(`
        INSERT INTO parcels (id, shipment_id, parcel_index, package_label, weight_kg, volume_cbm, description)
        VALUES (?, ?, 1, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        shipmentId,
        body.productName || `Colis ${ref}`,
        weightVal,
        volVal,
        body.description || body.productName || "Marchandise commandée"
      ),
      c.env.DB.prepare(`
        INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
        VALUES (?, ?, 'RECEIVED_AT_HUB', ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        shipmentId,
        isSea ? "Entrepôt Yiwu (Chine)" : "Entrepôt Guangzhou Baiyun (Chine)",
        `Paiement confirmé · Dossier ${ref} activé et pris en charge à l'entrepôt ROUM TRANSIT`,
        user?.userId || "user-superadmin-01"
      ),
    ]);
  }

  return c.json({
    success: true,
    tracking_number: trackingNumber,
    message: `Encaissement confirmé et numéro de suivi ${trackingNumber} enregistré en base de données.`,
  });
});

const updateRequestStatusSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "QUOTE_SENT", "CONVERTED", "CLOSED", "CANCELLED"]),
  admin_notes: z.string().optional(),
});

adminRouter.patch("/requests/:id/status", zValidator("json", updateRequestStatusSchema), async (c) => {
  if (!checkPermission(c, "requests.process") && !checkPermission(c, "quotes.process")) {
    return c.json({ error: "Permission insuffisante (requests.process requise)." }, 403);
  }

  const id = c.req.param("id");
  const data = c.req.valid("json");

  await c.env.DB.prepare(`
    UPDATE customer_requests
    SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now')
    WHERE id = ?
  `).bind(data.status, data.admin_notes || null, id).run();

  return c.json({ success: true, message: `Demande mise à jour vers le statut ${data.status}.` });
});

/**
 * Conversion d'une demande acceptée en expédition officielle
 */
const convertRequestSchema = z.object({
  shipping_mode_id: z.string().min(1, "Mode de transport requis"),
  route_id: z.string().min(1, "Liaison requise"),
  weight_kg: z.number().positive("Poids réel supérieur à 0 requis"),
  volume_cbm: z.number().nonnegative().optional(),
  package_label: z.string().optional(),
  description: z.string().optional(),
  estimated_price_minor: z.number().int().nonnegative().optional(),
  currency: z.string().default("FCFA"),
});

adminRouter.post("/requests/:id/convert", zValidator("json", convertRequestSchema), async (c) => {
  if (!checkPermission(c, "shipments.create")) {
    return c.json({ error: "Permission insuffisante (shipments.create requise)." }, 403);
  }

  const user = c.get("user");
  const requestId = c.req.param("id");
  const data = c.req.valid("json");

  const reqRow = await c.env.DB.prepare(`SELECT * FROM customer_requests WHERE id = ?`).bind(requestId).first<any>();
  if (!reqRow) {
    return c.json({ error: "Demande introuvable." }, 404);
  }

  const mode = await c.env.DB.prepare(`SELECT type FROM shipping_modes WHERE id = ?`).bind(data.shipping_mode_id).first<{ type: TransportType }>();
  if (!mode) {
    return c.json({ error: "Mode de transport inconnu." }, 400);
  }

  const trackingNumber = generateTrackingNumber(mode.type);
  const shipmentId = crypto.randomUUID();
  let clientId = reqRow.client_id;

  if (!clientId) {
    const existingClient = await c.env.DB.prepare(`SELECT id FROM clients WHERE phone_whatsapp = ?`).bind(reqRow.client_phone).first<{ id: string }>();
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      clientId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO clients (id, full_name, phone_whatsapp, email, country)
        VALUES (?, ?, ?, ?, ?)
      `).bind(clientId, reqRow.client_name, reqRow.client_phone, reqRow.client_email || null, reqRow.destination_country || "Mali").run();
    }
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      INSERT INTO shipments (
        id, tracking_number, client_id, route_id, shipping_mode_id,
        current_status, total_parcels_count, total_weight_kg, total_volume_cbm,
        estimated_price_minor, currency, payment_status, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, 'DRAFT', 1, ?, ?, ?, ?, 'PENDING', ?)
    `).bind(
      shipmentId,
      trackingNumber,
      clientId,
      data.route_id,
      data.shipping_mode_id,
      Math.round(data.weight_kg * 100) / 100,
      data.volume_cbm ? Math.round(data.volume_cbm * 10000) / 10000 : 0,
      data.estimated_price_minor || 0,
      data.currency,
      user.userId
    ),
    c.env.DB.prepare(`
      INSERT INTO parcels (id, shipment_id, parcel_index, package_label, weight_kg, length_cm, width_cm, height_cm, description)
      VALUES (?, ?, 1, ?, ?, null, null, null, ?)
    `).bind(
      crypto.randomUUID(),
      shipmentId,
      data.package_label || `Colis Demande ${reqRow.reference}`,
      Math.round(data.weight_kg * 100) / 100,
      data.description || reqRow.description || null
    ),
    c.env.DB.prepare(`
      INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
      VALUES (?, ?, 'DRAFT', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      shipmentId,
      user.hubLocation || "Bureau Central",
      `Dossier créé suite à la conversion de la demande ${reqRow.reference}`,
      user.userId
    ),
    c.env.DB.prepare(`
      UPDATE customer_requests
      SET status = 'CONVERTED', admin_notes = COALESCE(admin_notes || ' | ', '') || 'Converti en expédition ' || ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(trackingNumber, requestId),
  ];

  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    shipment_id: shipmentId,
    tracking_number: trackingNumber,
    message: `Demande ${reqRow.reference} convertie avec succès en expédition ${trackingNumber}.`,
  }, 201);
});

/* ==========================================================================
   7. RÉPERTOIRE DES CLIENTS
   ========================================================================== */

adminRouter.get("/clients", async (c) => {
  if (!checkPermission(c, "clients.view")) {
    return c.json({ error: "Permission insuffisante (clients.view requise)." }, 403);
  }

  const search = c.req.query("search");
  let query = `
    SELECT 
      c.id, c.full_name, c.phone_whatsapp, c.email, c.city, c.country, c.created_at,
      (SELECT COUNT(*) FROM shipments s WHERE s.client_id = c.id) as shipments_count,
      (SELECT COUNT(*) FROM customer_requests r WHERE r.client_id = c.id) as requests_count
    FROM clients c
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ` AND (c.full_name LIKE ? OR c.phone_whatsapp LIKE ? OR c.email LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY c.created_at DESC LIMIT 50`;

  const { results: clients } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ clients });
});

const createClientSchema = z.object({
  full_name: z.string().min(2, "Nom complet requis"),
  phone_whatsapp: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  country: z.string().min(2, "Pays requis"),
  city: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

adminRouter.post("/clients", zValidator("json", createClientSchema), async (c) => {
  if (!checkPermission(c, "clients.create")) {
    return c.json({ error: "Permission insuffisante (clients.create requise)." }, 403);
  }

  const data = c.req.valid("json");
  const clientId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO clients (id, full_name, phone_whatsapp, email, address, city, country, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    clientId,
    data.full_name.trim(),
    data.phone_whatsapp,
    data.email || null,
    data.address || null,
    data.city || null,
    data.country.trim(),
    data.notes || null
  ).run();

  return c.json({ success: true, client_id: clientId, message: "Client créé avec succès." }, 201);
});

/* ==========================================================================
   8. ROUTES, MODES DE TRANSPORT & TARIFS
   ========================================================================== */

adminRouter.get("/routes", async (c) => {
  const { results: routes } = await c.env.DB.prepare(`
    SELECT id, origin_country, origin_city, destination_country, destination_city, is_active
    FROM routes
    WHERE is_active = 1
    ORDER BY origin_country ASC, destination_country ASC
  `).all();
  return c.json({ routes });
});

adminRouter.get("/modes", async (c) => {
  const { results: modes } = await c.env.DB.prepare(`
    SELECT id, name, type, pricing_basis, is_active, sort_order
    FROM shipping_modes
    WHERE is_active = 1
    ORDER BY sort_order ASC
  `).all();
  return c.json({ modes });
});

adminRouter.get("/tariffs", async (c) => {
  const { results: tariffs } = await c.env.DB.prepare(`
    SELECT 
      t.id, t.currency, t.price_per_unit_minor, t.minimum_charge_minor,
      t.estimated_days_min, t.estimated_days_max, t.category_tag, t.note, t.is_active,
      COALESCE(r.origin_country, 'Chine') as origin_country,
      r.origin_city,
      COALESCE(r.destination_country, 'Côte d''Ivoire') as destination_country,
      r.destination_city,
      COALESCE(sm.name, t.category_tag, 'Standard') as shipping_mode_name,
      COALESCE(sm.name, t.category_tag, 'Standard') as service_name,
      COALESCE(sm.type, 'AIR') as shipping_mode_type,
      COALESCE(sm.pricing_basis, 'PER_KG') as pricing_basis
    FROM tariffs t
    LEFT JOIN routes r ON t.route_id = r.id
    LEFT JOIN shipping_modes sm ON t.shipping_mode_id = sm.id
    ORDER BY r.origin_country ASC, sm.name ASC
  `).all();
  return c.json({ tariffs });
});

const createTariffSchema = z.object({
  route_id: z.string().optional(),
  origin_country: z.string().optional(),
  origin_city: z.string().optional(),
  destination_country: z.string().optional(),
  destination_city: z.string().optional(),
  shipping_mode_id: z.string().min(1, "Mode de transport requis"),
  currency: z.string().default("FCFA"),
  price_per_unit_minor: z.number().int().positive("Prix unitaire requis"),
  minimum_charge_minor: z.number().int().nonnegative().optional(),
  estimated_days_min: z.number().int().positive().optional(),
  estimated_days_max: z.number().int().positive().optional(),
  category_tag: z.string().optional(),
  note: z.string().optional(),
});

adminRouter.post("/tariffs", zValidator("json", createTariffSchema), async (c) => {
  if (!checkPermission(c, "config.tariffs")) {
    return c.json({ error: "Permission insuffisante (config.tariffs requise)." }, 403);
  }

  const data = c.req.valid("json");
  let routeId = data.route_id;

  // Si pays de départ et pays d'arrivée sont saisis directement, on trouve ou crée la liaison
  if (!routeId && data.origin_country && data.destination_country) {
    const origCountry = data.origin_country.trim();
    const destCountry = data.destination_country.trim();
    const origCity = data.origin_city?.trim() || null;
    const destCity = data.destination_city?.trim() || null;

    const existing = await c.env.DB.prepare(`
      SELECT id FROM routes 
      WHERE LOWER(origin_country) = LOWER(?) AND LOWER(destination_country) = LOWER(?)
      LIMIT 1
    `).bind(origCountry, destCountry).first<{ id: string }>();

    if (existing?.id) {
      routeId = existing.id;
    } else {
      routeId = `route-${crypto.randomUUID().slice(0, 8)}`;
      await c.env.DB.prepare(`
        INSERT INTO routes (id, origin_country, origin_city, destination_country, destination_city, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(routeId, origCountry, origCity, destCountry, destCity).run();
    }
  }

  if (!routeId) {
    return c.json({ error: "Veuillez sélectionner ou renseigner un pays de départ et un pays de destination." }, 400);
  }

  let validModeId = "AIR_STANDARD";
  if (data.shipping_mode_id) {
    const requestedMode = data.shipping_mode_id;
    if (requestedMode === "SEA" || requestedMode === "SEA_LCL" || requestedMode === "SEA_GROUPAGE") {
      validModeId = "SEA_LCL";
    } else if (requestedMode === "AIR_EXPRESS") {
      validModeId = "AIR_EXPRESS";
    } else if (requestedMode === "AIR_SPECIAL") {
      validModeId = "AIR_SPECIAL";
    } else if (requestedMode === "AIR_TECH") {
      validModeId = "AIR_TECH";
    } else if (requestedMode === "AIR_COSMETIC") {
      validModeId = "AIR_COSMETIC";
    } else if (requestedMode === "AIR_DOC") {
      validModeId = "AIR_DOC";
    } else {
      const modeRow = await c.env.DB.prepare("SELECT id FROM shipping_modes WHERE id = ?").bind(requestedMode).first<{ id: string }>();
      if (modeRow?.id) validModeId = modeRow.id;
    }
  }

  const tariffId = crypto.randomUUID();

  try {
    await c.env.DB.prepare(`
      INSERT INTO tariffs (
        id, route_id, shipping_mode_id, currency, price_per_unit_minor,
        minimum_charge_minor, estimated_days_min, estimated_days_max,
        category_tag, note, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      tariffId,
      routeId,
      validModeId,
      data.currency || "FCFA",
      data.price_per_unit_minor,
      data.minimum_charge_minor || 0,
      data.estimated_days_min || null,
      data.estimated_days_max || null,
      data.category_tag || null,
      data.note || null
    ).run();

    return c.json({ success: true, tariff_id: tariffId, message: "Tarif enregistré avec succès." }, 201);
  } catch (err: any) {
    return c.json({ error: `Erreur base de données lors de la création : ${err?.message || "Erreur interne"}` }, 500);
  }
});

adminRouter.put("/tariffs/batch", async (c) => {
  if (!checkPermission(c, "config.tariffs")) {
    return c.json({ error: "Permission insuffisante (config.tariffs requise)." }, 403);
  }

  const user = c.get("user");
  const body = await c.req.json<{ tariffs: any[] }>().catch(() => ({ tariffs: [] }));
  const items = Array.isArray(body?.tariffs) ? body.tariffs : [];

  if (items.length === 0) {
    return c.json({ success: true, count: 0, message: "Aucune modification à enregistrer." });
  }

  const legacyMap: Record<string, string> = {
    "tariff-flyer-cn-express": "tariff-cn-ci-express",
    "tariff-flyer-cn-normal": "tariff-cn-ci-normal",
    "tariff-flyer-cn-special": "tariff-cn-ci-special",
    "tariff-flyer-cn-tech": "tariff-cn-ci-tech",
    "tariff-flyer-cn-sea": "tariff-cn-ci-sea",
    "tariff-flyer-ae-express": "tariff-ae-ci-express",
    "tariff-flyer-ae-normal": "tariff-ae-ci-normal",
    "tariff-flyer-ae-special": "tariff-ae-ci-special",
    "tariff-flyer-ae-sea": "tariff-ae-ci-sea",
    "tariff-flyer-ma-ci": "tariff-ma-ci-sub",
    "tariff-flyer-ma-sn": "tariff-ma-sn-sub",
    "tariff-flyer-ma-ml": "tariff-ma-ml-sub",
    "tariff-flyer-ma-bf": "tariff-ma-bf-sub",
    "tariff-flyer-ma-ga": "tariff-ma-ga-sub",
    "tariff-flyer-fr-ci-divers": "tariff-fr-ci-divers",
    "tariff-flyer-fr-ci-cosm": "tariff-fr-ci-cosmetic",
    "tariff-flyer-fr-ci-doc": "tariff-fr-ci-doc",
    "tariff-flyer-ci-fr-divers": "tariff-ci-fr-divers",
    "tariff-flyer-ci-fr-cosm": "tariff-ci-fr-cosmetic",
    "tariff-flyer-ci-fr-doc": "tariff-ci-fr-doc",
  };

  const statements: any[] = [];
  for (const item of items) {
    if (!item.id) continue;
    const resolvedId = legacyMap[item.id] || item.id;
    statements.push(
      c.env.DB.prepare(`
        UPDATE tariffs 
        SET price_per_unit_minor = COALESCE(?, price_per_unit_minor),
            minimum_charge_minor = COALESCE(?, minimum_charge_minor),
            currency = COALESCE(?, currency),
            estimated_days_min = COALESCE(?, estimated_days_min),
            estimated_days_max = COALESCE(?, estimated_days_max),
            note = COALESCE(?, note),
            category_tag = COALESCE(?, category_tag),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        item.price_per_unit_minor !== undefined ? Number(item.price_per_unit_minor) : null,
        item.minimum_charge_minor !== undefined ? Number(item.minimum_charge_minor) : null,
        item.currency || null,
        item.estimated_days_min !== undefined ? Number(item.estimated_days_min) : null,
        item.estimated_days_max !== undefined ? Number(item.estimated_days_max) : null,
        item.note !== undefined ? String(item.note) : null,
        item.category_tag !== undefined ? String(item.category_tag) : null,
        resolvedId
      )
    );
  }

  if (statements.length > 0) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
        VALUES (?, ?, 'tariffs.batch_update', 'tariff', 'batch', ?)
      `).bind(crypto.randomUUID(), user?.userId || "admin", JSON.stringify({ count: statements.length }))
    );
    await c.env.DB.batch(statements);
  }

  return c.json({ success: true, count: items.length, message: `${items.length} tarifs mis à jour simultanément avec succès.` });
});

adminRouter.put("/tariffs/:id", async (c) => {
  if (!checkPermission(c, "config.tariffs")) {
    return c.json({ error: "Permission insuffisante (config.tariffs requise)." }, 403);
  }

  const user = c.get("user");
  const rawId = c.req.param("id");
  const legacyMap: Record<string, string> = {
    "tariff-flyer-cn-express": "tariff-cn-ci-express",
    "tariff-flyer-cn-normal": "tariff-cn-ci-normal",
    "tariff-flyer-cn-special": "tariff-cn-ci-special",
    "tariff-flyer-cn-tech": "tariff-cn-ci-tech",
    "tariff-flyer-cn-sea": "tariff-cn-ci-sea",
    "tariff-flyer-ae-express": "tariff-ae-ci-express",
    "tariff-flyer-ae-normal": "tariff-ae-ci-normal",
    "tariff-flyer-ae-special": "tariff-ae-ci-special",
    "tariff-flyer-ae-sea": "tariff-ae-ci-sea",
    "tariff-flyer-ma-ci": "tariff-ma-ci-sub",
    "tariff-flyer-ma-sn": "tariff-ma-sn-sub",
    "tariff-flyer-ma-ml": "tariff-ma-ml-sub",
    "tariff-flyer-ma-bf": "tariff-ma-bf-sub",
    "tariff-flyer-ma-ga": "tariff-ma-ga-sub",
    "tariff-flyer-fr-ci-divers": "tariff-fr-ci-divers",
    "tariff-flyer-fr-ci-cosm": "tariff-fr-ci-cosmetic",
    "tariff-flyer-fr-ci-doc": "tariff-fr-ci-doc",
    "tariff-flyer-ci-fr-divers": "tariff-ci-fr-divers",
    "tariff-flyer-ci-fr-cosm": "tariff-ci-fr-cosmetic",
    "tariff-flyer-ci-fr-doc": "tariff-ci-fr-doc",
  };
  const tariffId = legacyMap[rawId] || rawId;
  const body = await c.req.json<any>().catch(() => ({}));

  let validModeId = "AIR_STANDARD";
  const requestedMode = body.shipping_mode_id || body.transport_mode;
  if (requestedMode) {
    if (requestedMode === "SEA" || requestedMode === "SEA_LCL" || requestedMode === "SEA_GROUPAGE") {
      validModeId = "SEA_LCL";
    } else if (requestedMode === "AIR_EXPRESS") {
      validModeId = "AIR_EXPRESS";
    } else if (requestedMode === "AIR_SPECIAL") {
      validModeId = "AIR_SPECIAL";
    } else if (requestedMode === "AIR_TECH") {
      validModeId = "AIR_TECH";
    } else if (requestedMode === "AIR_COSMETIC") {
      validModeId = "AIR_COSMETIC";
    } else if (requestedMode === "AIR_DOC") {
      validModeId = "AIR_DOC";
    } else {
      const modeRow = await c.env.DB.prepare("SELECT id FROM shipping_modes WHERE id = ?").bind(requestedMode).first<{ id: string }>();
      if (modeRow?.id) validModeId = modeRow.id;
    }
  }

  try {
    const existing = await c.env.DB.prepare("SELECT id, route_id FROM tariffs WHERE id = ?").bind(tariffId).first<{ id: string; route_id: string }>();

    if (existing) {
      await c.env.DB.batch([
        c.env.DB.prepare(`
          UPDATE tariffs 
          SET price_per_unit_minor = COALESCE(?, price_per_unit_minor),
              minimum_charge_minor = COALESCE(?, minimum_charge_minor),
              currency = COALESCE(?, currency),
              estimated_days_min = COALESCE(?, estimated_days_min),
              estimated_days_max = COALESCE(?, estimated_days_max),
              note = COALESCE(?, note),
              category_tag = COALESCE(?, category_tag),
              shipping_mode_id = COALESCE(?, shipping_mode_id),
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          body.price_per_unit_minor !== undefined ? Number(body.price_per_unit_minor) : null,
          body.minimum_charge_minor !== undefined ? Number(body.minimum_charge_minor) : null,
          body.currency || "FCFA",
          body.estimated_days_min !== undefined ? Number(body.estimated_days_min) : null,
          body.estimated_days_max !== undefined ? Number(body.estimated_days_max) : null,
          body.note !== undefined ? String(body.note) : null,
          body.category_tag || body.service_name || null,
          validModeId,
          tariffId
        ),
        c.env.DB.prepare(`
          INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
          VALUES (?, ?, 'tariff.update', 'tariff', ?, ?)
        `).bind(crypto.randomUUID(), user?.userId || "admin", tariffId, JSON.stringify(body)),
      ]);

      if (body.origin_country || body.destination_country) {
        await c.env.DB.prepare(`
          UPDATE routes
          SET origin_country = COALESCE(?, origin_country),
              destination_country = COALESCE(?, destination_country)
          WHERE id = ?
        `).bind(body.origin_country || null, body.destination_country || null, existing.route_id).run();
      }
    } else {
      // Upsert pour les tarifs par défaut / créés côté interface
      let routeId = "route-default";
      const origCountry = (body.origin_country || "Chine").trim();
      const destCountry = (body.destination_country || "Côte d'Ivoire").trim();
      const existingRoute = await c.env.DB.prepare(`
        SELECT id FROM routes WHERE LOWER(origin_country) = LOWER(?) AND LOWER(destination_country) = LOWER(?) LIMIT 1
      `).bind(origCountry, destCountry).first<{ id: string }>();

      if (existingRoute?.id) {
        routeId = existingRoute.id;
      } else {
        routeId = `route-${crypto.randomUUID().slice(0, 8)}`;
        await c.env.DB.prepare(`
          INSERT INTO routes (id, origin_country, origin_city, destination_country, destination_city, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
        `).bind(routeId, origCountry, body.origin_city || null, destCountry, body.destination_city || null).run();
      }

      await c.env.DB.prepare(`
        INSERT INTO tariffs (
          id, route_id, shipping_mode_id, currency, price_per_unit_minor,
          minimum_charge_minor, estimated_days_min, estimated_days_max,
          category_tag, note, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        tariffId,
        routeId,
        validModeId,
        body.currency || "FCFA",
        body.price_per_unit_minor || 0,
        body.minimum_charge_minor || 0,
        body.estimated_days_min || null,
        body.estimated_days_max || null,
        body.category_tag || body.service_name || null,
        body.note || null
      ).run();

      await c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
        VALUES (?, ?, 'tariff.create_upsert', 'tariff', ?, ?)
      `).bind(crypto.randomUUID(), user?.userId || "admin", tariffId, JSON.stringify(body)).run();
    }

    return c.json({ success: true, message: "Tarif mis à jour avec succès." });
  } catch (err: any) {
    return c.json({ error: `Erreur SQLite D1 lors de la mise à jour : ${err?.message || "Erreur interne"}` }, 500);
  }
});

adminRouter.delete("/tariffs/:id", async (c) => {
  if (!checkPermission(c, "config.tariffs")) {
    return c.json({ error: "Permission insuffisante (config.tariffs requise)." }, 403);
  }

  const user = c.get("user");
  const tariffId = c.req.param("id");
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM tariffs WHERE id = ?`).bind(tariffId),
      c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
        VALUES (?, ?, 'tariff.delete', 'tariff', ?, ?)
      `).bind(crypto.randomUUID(), user?.userId || "admin", tariffId, JSON.stringify({ tariff_id: tariffId })),
    ]);

    return c.json({ success: true, message: "Tarif supprimé avec succès." });
  } catch (err: any) {
    return c.json({ error: `Erreur lors de la suppression du tarif : ${err?.message || "Erreur interne"}` }, 500);
  }
});

/* ==========================================================================
   9. FINANCES & PAIEMENTS
   ========================================================================== */

adminRouter.get("/payments", async (c) => {
  if (!checkPermission(c, "finance.view")) {
    return c.json({ error: "Permission insuffisante (finance.view requise)." }, 403);
  }

  const { results: payments } = await c.env.DB.prepare(`
    SELECT 
      p.id, p.amount_minor, p.currency, p.payment_method, p.payment_type,
      p.reference_code, p.status, p.receipt_notes, p.recorded_at,
      c.full_name as client_name, c.phone_whatsapp as client_phone,
      s.tracking_number,
      u.full_name as recorded_by_name
    FROM payments p
    JOIN clients c ON p.client_id = c.id
    LEFT JOIN shipments s ON p.shipment_id = s.id
    JOIN users u ON p.recorded_by_user_id = u.id
    ORDER BY p.recorded_at DESC LIMIT 50
  `).all();

  return c.json({ payments });
});

const recordPaymentSchema = z.object({
  client_id: z.string().min(1, "Client requis"),
  shipment_id: z.string().optional(),
  amount_minor: z.number().int().positive("Montant requis"),
  currency: z.string().default("FCFA"),
  payment_method: z.enum(["CASH", "BANK_TRANSFER", "WAVE", "ORANGE_MONEY", "OTHER"]),
  payment_type: z.enum(["ADVANCE", "BALANCE", "FULL", "REFUND"]).default("ADVANCE"),
  reference_code: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED"]).default("PENDING"),
  receipt_notes: z.string().optional(),
});

adminRouter.post("/payments", zValidator("json", recordPaymentSchema), async (c) => {
  if (!checkPermission(c, "finance.edit")) {
    return c.json({ error: "Permission insuffisante (finance.edit requise)." }, 403);
  }

  const user = c.get("user");
  const data = c.req.valid("json");
  const paymentId = crypto.randomUUID();
  const paymentStatus = data.status || "PENDING";

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      INSERT INTO payments (
        id, shipment_id, client_id, amount_minor, currency,
        payment_method, payment_type, reference_code, status,
        receipt_notes, recorded_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      paymentId,
      data.shipment_id || null,
      data.client_id,
      data.amount_minor,
      data.currency,
      data.payment_method,
      data.payment_type,
      data.reference_code || null,
      paymentStatus,
      data.receipt_notes || null,
      user.userId
    ),
    c.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
      VALUES (?, ?, 'payment.record', 'payment', ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.userId,
      paymentId,
      JSON.stringify({ amount_minor: data.amount_minor, currency: data.currency, method: data.payment_method, status: paymentStatus })
    ),
  ];

  // Si le paiement est d'emblée confirmé et associé à une expédition
  if (paymentStatus === "CONFIRMED" && data.shipment_id) {
    if (data.payment_type === "FULL") {
      statements.push(
        c.env.DB.prepare(`
          UPDATE shipments SET payment_status = 'PAID', updated_at = datetime('now') WHERE id = ?
        `).bind(data.shipment_id)
      );
    } else if (data.payment_type === "ADVANCE") {
      statements.push(
        c.env.DB.prepare(`
          UPDATE shipments SET payment_status = 'PARTIAL', updated_at = datetime('now') WHERE id = ?
        `).bind(data.shipment_id)
      );
    }
  }

  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    payment_id: paymentId,
    message: paymentStatus === "CONFIRMED" ? "Paiement consigné et confirmé." : "Paiement consigné (en attente de vérification).",
  }, 201);
});

/**
 * Validation ou rejet manuel d'un paiement après vérification
 */
const updatePaymentStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
  receipt_notes: z.string().optional(),
});

adminRouter.patch("/payments/:id/status", zValidator("json", updatePaymentStatusSchema), async (c) => {
  if (!checkPermission(c, "finance.edit")) {
    return c.json({ error: "Permission insuffisante (finance.edit requise)." }, 403);
  }

  const user = c.get("user");
  const paymentId = c.req.param("id");
  const { status, receipt_notes } = c.req.valid("json");

  const payment = await c.env.DB.prepare(`SELECT * FROM payments WHERE id = ?`).bind(paymentId).first<any>();
  if (!payment) {
    return c.json({ error: "Paiement introuvable." }, 404);
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE payments 
      SET status = ?, receipt_notes = COALESCE(?, receipt_notes)
      WHERE id = ?
    `).bind(status, receipt_notes || null, paymentId),
    c.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
      VALUES (?, ?, 'payment.status', 'payment', ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.userId,
      paymentId,
      JSON.stringify({ previous_status: payment.status, new_status: status })
    ),
  ];

  // Si le paiement devient confirmé et est rattaché à une expédition
  if (status === "CONFIRMED" && payment.shipment_id) {
    if (payment.payment_type === "FULL") {
      statements.push(
        c.env.DB.prepare(`UPDATE shipments SET payment_status = 'PAID', updated_at = datetime('now') WHERE id = ?`).bind(payment.shipment_id)
      );
    } else if (payment.payment_type === "ADVANCE") {
      statements.push(
        c.env.DB.prepare(`UPDATE shipments SET payment_status = 'PARTIAL', updated_at = datetime('now') WHERE id = ?`).bind(payment.shipment_id)
      );
    }
  }

  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    message: status === "CONFIRMED" ? "Paiement validé et confirmé avec succès." : `Statut du paiement mis à jour vers ${status}.`,
  });
});

/* ==========================================================================
   10. TÂCHES D'ÉQUIPE (Suivi & relance)
   ========================================================================== */

adminRouter.get("/tasks", async (c) => {
  if (!checkPermission(c, "tasks.manage") && !checkPermission(c, "dashboard.view")) {
    return c.json({ error: "Permission insuffisante (tasks.manage requise)." }, 403);
  }

  const { results: tasks } = await c.env.DB.prepare(`
    SELECT 
      t.id, t.title, t.description, t.category, t.priority, t.status, t.due_date, t.created_at,
      u.full_name as assigned_to_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to_user_id = u.id
    ORDER BY 
      CASE t.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END ASC,
      t.created_at DESC
  `).all();
  return c.json({ tasks });
});

const createTaskSchema = z.object({
  title: z.string().min(2, "Titre requis").max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(["GENERAL", "MISSING_INFO", "QUOTE_PREP", "PAYMENT_CHECK", "WAREHOUSE_CHECK"]).default("GENERAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigned_to_user_id: z.string().max(80).optional(),
  due_date: z.string().max(40).optional(),
});

adminRouter.post("/tasks", zValidator("json", createTaskSchema), async (c) => {
  if (!checkPermission(c, "tasks.manage")) {
    return c.json({ error: "Permission insuffisante (tasks.manage requise)." }, 403);
  }

  const user = c.get("user");
  const data = c.req.valid("json");
  const taskId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO tasks (id, title, description, category, priority, status, assigned_to_user_id, due_date, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, 'TODO', ?, ?, ?)
  `).bind(
    taskId,
    data.title.trim(),
    data.description || null,
    data.category,
    data.priority,
    data.assigned_to_user_id || null,
    data.due_date || null,
    user.userId
  ).run();

  return c.json({ success: true, task_id: taskId, message: "Tâche créée avec succès." }, 201);
});

adminRouter.patch("/tasks/:id/status", zValidator("json", z.object({ status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]) })), async (c) => {
  if (!checkPermission(c, "tasks.manage")) {
    return c.json({ error: "Permission insuffisante (tasks.manage requise)." }, 403);
  }

  const id = c.req.param("id");
  const { status } = c.req.valid("json");

  await c.env.DB.prepare(`
    UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(status, id).run();

  return c.json({ success: true, message: `Statut de la tâche mis à jour vers ${status}.` });
});

/* ==========================================================================
   11. PARAMÈTRES GÉNÉRAUX D'ENTREPRISE
   ========================================================================== */

adminRouter.get("/settings", async (c) => {
  if (!checkPermission(c, "settings.manage") && !checkPermission(c, "dashboard.view")) {
    return c.json({ error: "Permission insuffisante." }, 403);
  }
  const { results: settings } = await c.env.DB.prepare(`SELECT key, value FROM business_settings`).all();
  const map: Record<string, string> = {};
  for (const s of settings as any[]) {
    map[s.key] = s.value;
  }
  return c.json({ settings: map });
});

adminRouter.put("/settings", zValidator("json", z.record(z.string().max(80), z.string().max(1000))), async (c) => {
  const user = c.get("user");
  if (!user.isSuperAdmin && !checkPermission(c, "settings.manage")) {
    return c.json({ error: "Permission insuffisante (settings.manage requise)." }, 403);
  }

  const data = c.req.valid("json");
  const statements: D1PreparedStatement[] = [];

  for (const [key, value] of Object.entries(data)) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO business_settings (key, value, updated_by_user_id, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(key, value, user.userId)
    );
  }

  if (statements.length > 0) {
    await c.env.DB.batch(statements);
  }

  return c.json({ success: true, message: "Paramètres enregistrés avec succès." });
});

/* ==========================================================================
   12. JOURNAL D'AUDIT (Traçabilité des opérations sensibles)
   ========================================================================== */

adminRouter.get("/audit-logs", async (c) => {
  if (!checkPermission(c, "audit.view")) {
    return c.json({ error: "Permission insuffisante (audit.view requise)." }, 403);
  }

  const { results: logs } = await c.env.DB.prepare(`
    SELECT a.id, a.action, a.entity_type, a.entity_id, a.details_json, a.created_at,
           u.full_name as user_name, u.email as user_email
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC LIMIT 100
  `).all();

  return c.json({ logs });
});

/* ==========================================================================
   13. EXPORT CSV (Shipments - Protégé contre l'injection de formules CSV/DDE)
   ========================================================================== */

adminRouter.get("/exports/shipments.csv", async (c) => {
  if (!checkPermission(c, "exports.run")) {
    return c.text("Permission insuffisante", 403);
  }

  const { results: rows } = await c.env.DB.prepare(`
    SELECT 
      s.tracking_number, s.current_status, s.total_parcels_count, s.total_weight_kg,
      s.total_volume_cbm, s.final_price_minor, s.currency, s.payment_status, s.created_at,
      c.full_name as client_name, c.phone_whatsapp as client_phone,
      r.origin_country, r.destination_country, sm.name as shipping_mode
    FROM shipments s
    JOIN clients c ON s.client_id = c.id
    JOIN routes r ON s.route_id = r.id
    JOIN shipping_modes sm ON s.shipping_mode_id = sm.id
    ORDER BY s.created_at DESC
  `).all();

  const header = "Numéro Suivi,Statut,Client,Téléphone,Origine,Destination,Mode,Colis,Poids (kg),Volume (m3),Prix,Devise,Paiement,Date Création\n";
  const lines = (rows as any[]).map((r) => {
    return [
      sanitizeCsvCell(r.tracking_number),
      sanitizeCsvCell(r.current_status),
      sanitizeCsvCell(r.client_name),
      sanitizeCsvCell(r.client_phone),
      sanitizeCsvCell(r.origin_country),
      sanitizeCsvCell(r.destination_country),
      sanitizeCsvCell(r.shipping_mode),
      Number(r.total_parcels_count) || 0,
      Number(r.total_weight_kg) || 0,
      Number(r.total_volume_cbm) || 0,
      ((Number(r.final_price_minor) || 0) / 100).toFixed(2),
      sanitizeCsvCell(r.currency),
      sanitizeCsvCell(r.payment_status),
      sanitizeCsvCell(r.created_at),
    ].join(",");
  });

  const csv = header + lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="roum_shipments_${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});

