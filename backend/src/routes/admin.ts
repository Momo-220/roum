import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  PERMISSIONS,
  SUPER_ADMIN_ROLE_ID,
  isPermissionCode,
  generateTrackingNumber,
  type TransportType,
} from "../shared";
import { hashPassword, verifyJwt, resolveJwtSecret, sanitizeCsvCell } from "../crypto";
import {
  cancelRequestOfShipment,
  cancelShipmentOfRequest,
  findOrCreateRoute,
  mirrorClientToRequests,
  mirrorShipmentToRequest,
  parseDestination,
  parseMeta,
  paymentMethodFromSelection,
  paymentStatusStatement,
  singleParcelWeightStatement,
  toAdminRequest,
} from "../requests";
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

function hasAnyPermission(c: { get: (k: "user") => UserSession }, ...codes: string[]): boolean {
  return codes.some((code) => checkPermission(c, code));
}

function auditStatement(
  c: { env: Env },
  user: UserSession,
  action: string,
  entityType: string,
  entityId: string,
  details: unknown,
): D1PreparedStatement {
  return c.env.DB.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), user.userId, action, entityType, entityId, JSON.stringify(details));
}

/** Compteurs de tous les domaines : l'admin ne recharge que ce qui a réellement changé. */
adminRouter.get("/sync", async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT scope, version FROM sync_versions`).all<{ scope: string; version: number }>();
  c.header("Cache-Control", "no-store");
  return c.json({ versions: Object.fromEntries(results.map((r) => [r.scope, r.version])) });
});

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
      s.id, s.tracking_number, s.current_status,
      s.current_status as current_status_code,
      COALESCE(st.label_public, s.current_status) as status_label,
      COALESCE(st.label_public, s.current_status) as current_status_label,
      s.total_parcels_count, s.total_weight_kg, s.total_volume_cbm,
      s.estimated_price_minor, s.final_price_minor, s.currency, s.payment_status,
      s.created_at, s.updated_at,
      COALESCE(c.full_name, 'Client ROUM') as client_name,
      COALESCE(c.phone_whatsapp, '') as client_phone,
      COALESCE(c.country, r.destination_country, 'Côte d''Ivoire') as client_country,
      COALESCE(c.city, r.destination_city, 'Abidjan') as client_city,
      COALESCE(r.origin_country, 'Chine') as origin_country,
      COALESCE(r.origin_city, 'Guangzhou') as origin_city,
      COALESCE(r.destination_country, 'Côte d''Ivoire') as destination_country,
      COALESCE(r.destination_city, 'Abidjan') as destination_city,
      COALESCE(sm.name, 'Voie Aérienne Express') as shipping_mode_name,
      COALESCE(sm.type, 'AIR') as shipping_mode_type,
      s.shipping_mode_id, s.route_id, s.client_id, s.sender_name, s.sender_phone
    FROM shipments s
    LEFT JOIN shipment_statuses st ON s.current_status = st.code
    LEFT JOIN clients c ON s.client_id = c.id
    LEFT JOIN routes r ON s.route_id = r.id
    LEFT JOIN shipping_modes sm ON s.shipping_mode_id = sm.id
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

  query += ` ORDER BY s.created_at DESC LIMIT 1000`;

  const { results: shipments } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ shipments });
});

const createShipmentSchema = z.object({
  client: z.object({
    full_name: z.string().min(2),
    phone_whatsapp: z.string().min(3, "Numéro WhatsApp requis").max(60),
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
  currency: z.string().default("FCFA"),
});

adminRouter.post("/shipments", zValidator("json", createShipmentSchema), async (c) => {
  if (!checkPermission(c, "shipments.create")) {
    return c.json({ error: "Permission insuffisante (shipments.create requise)." }, 403);
  }

  const user = c.get("user");
  const data = c.req.valid("json");

  // Vérification du mode de transport pour générer le tracking number (avec fallback résilient)
  let validModeId = data.shipping_mode_id;
  let mode = await c.env.DB.prepare(`SELECT id, type FROM shipping_modes WHERE id = ?`).bind(validModeId).first<{ id: string; type: TransportType }>();
  if (!mode) {
    validModeId = validModeId.includes("SEA") || validModeId.includes("MARITIME") ? "SEA_LCL" : "AIR_EXPRESS";
    mode = await c.env.DB.prepare(`SELECT id, type FROM shipping_modes WHERE id = ?`).bind(validModeId).first<{ id: string; type: TransportType }>();
  }
  const transportType: TransportType = mode?.type || (validModeId.includes("SEA") ? "SEA" : "AIR");

  // Vérification de la route avec fallback résilient
  let validRouteId = data.route_id;
  const routeCheck = await c.env.DB.prepare(`SELECT id FROM routes WHERE id = ?`).bind(validRouteId).first<{ id: string }>();
  if (!routeCheck) {
    const fallbackRoute = await c.env.DB.prepare(`SELECT id FROM routes LIMIT 1`).first<{ id: string }>();
    if (fallbackRoute?.id) validRouteId = fallbackRoute.id;
  }

  const trackingNumber = generateTrackingNumber(transportType);
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
      ) VALUES (?, ?, ?, ?, ?, 'RECEIVED_AT_HUB', ?, ?, ?, ?, ?, 'PENDING', ?)
    `).bind(
      shipmentId,
      trackingNumber,
      clientId,
      validRouteId,
      validModeId,
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
      VALUES (?, ?, 'RECEIVED_AT_HUB', ?, 'Dossier créé', ?)
    `).bind(
      crypto.randomUUID(),
      shipmentId,
      user.hubLocation || "Bureau Central",
      user.userId
    )
  );

  statements.push(auditStatement(c, user, "shipment.create", "shipment", shipmentId, { tracking_number: trackingNumber }));

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

  const shipmentExists = await c.env.DB.prepare(`SELECT id FROM shipments WHERE id = ?`).bind(shipmentId).first();
  if (!shipmentExists) {
    return c.json({ error: "Expédition introuvable." }, 404);
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

  if (new_status === "CANCELLED") {
    statements.push(cancelRequestOfShipment(c.env.DB, shipmentId));
  }

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: `Statut mis à jour vers ${new_status}.` });
});

/**
 * Modification d'une expédition (Admin -> SQLite D1 -> Client Tracking)
 * Un changement de statut est tracé dans la timeline pour que le client voie la même chose que l'admin.
 */
adminRouter.patch("/shipments/:id", async (c) => {
  if (!hasAnyPermission(c, "shipments.edit", "shipments.status.update", "shipments.create")) {
    return c.json({ error: "Permission insuffisante (shipments.edit requise)." }, 403);
  }
  const user = c.get("user");
  const shipmentId = c.req.param("id");
  const body = await c.req.json<any>().catch(() => ({}));

  const existing = await c.env.DB.prepare(`
    SELECT * FROM shipments WHERE id = ? OR UPPER(tracking_number) = UPPER(?) LIMIT 1
  `).bind(shipmentId, shipmentId).first<any>();
  if (!existing) {
    return c.json({ error: "Expédition introuvable." }, 404);
  }

  const toNumber = (value: unknown, fallback: number) => {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const nextStatus: string = body.current_status || existing.current_status;
  const priceMinor = Math.round(toNumber(body.estimated_price_minor, existing.estimated_price_minor ?? 0));
  const finalMinor = Math.round(toNumber(body.final_price_minor, existing.final_price_minor ?? 0));
  const payStatus: string = body.payment_status || existing.payment_status;
  if (!["PENDING", "PARTIAL", "PAID", "ON_DELIVERY"].includes(payStatus)) {
    return c.json({ error: "État de paiement inconnu." }, 400);
  }

  const moneyChanged =
    priceMinor !== (existing.estimated_price_minor ?? 0) ||
    finalMinor !== (existing.final_price_minor ?? 0) ||
    payStatus !== existing.payment_status;
  if (moneyChanged && !checkPermission(c, "finance.edit")) {
    return c.json({ error: "Permission insuffisante (finance.edit requise pour modifier un montant)." }, 403);
  }

  const statusChanged = nextStatus !== existing.current_status;
  if (statusChanged) {
    if (!user.isSuperAdmin && !user.allowedStatuses.includes(nextStatus) && !user.allowedStatuses.includes("*")) {
      return c.json({ error: `Votre rôle (${user.roleName}) n'est pas autorisé à appliquer le statut : ${nextStatus}` }, 403);
    }
    const statusRow = await c.env.DB.prepare(`SELECT code FROM shipment_statuses WHERE code = ? AND is_active = 1`).bind(nextStatus).first();
    if (!statusRow) {
      return c.json({ error: "Statut inexistant ou inactif." }, 400);
    }
  }

  const weightKg = toNumber(body.total_weight_kg, existing.total_weight_kg ?? 0);
  const volumeCbm = toNumber(body.total_volume_cbm, existing.total_volume_cbm ?? 0);

  // Un changement d'origine ou de destination rattache l'expédition à la bonne liaison.
  let routeId: string = existing.route_id;
  let destinationLabel: string | null = null;
  const route = await c.env.DB.prepare(`SELECT * FROM routes WHERE id = ?`).bind(existing.route_id).first<any>();
  const originCountry = String(body.origin_country || route?.origin_country || "").trim();
  const destination = parseDestination(body.destination_country || route?.destination_country);
  if (originCountry !== route?.origin_country || destination.country !== route?.destination_country) {
    routeId = await findOrCreateRoute(c.env.DB, {
      originCountry,
      originCity: originCountry === route?.origin_country ? route?.origin_city : null,
      destinationCountry: destination.country,
      destinationCity: destination.city,
    });
    destinationLabel = destination.city ? `${destination.country} — ${destination.city}` : destination.country;
  }

  const priceChanged = priceMinor !== (existing.estimated_price_minor ?? 0) || finalMinor !== (existing.final_price_minor ?? 0);
  const effectivePriceMinor = finalMinor || priceMinor;

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE shipments
      SET current_status = ?,
          route_id = ?,
          total_weight_kg = ?,
          total_volume_cbm = ?,
          estimated_price_minor = ?,
          final_price_minor = ?,
          payment_status = ?,
          currency = ?,
          sender_name = COALESCE(?, sender_name),
          sender_phone = COALESCE(?, sender_phone),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      nextStatus,
      routeId,
      weightKg,
      volumeCbm,
      priceMinor,
      finalMinor,
      payStatus,
      body.currency || existing.currency,
      body.sender_name ?? null,
      body.sender_phone ?? null,
      existing.id
    ),
    singleParcelWeightStatement(c.env.DB, existing.id, weightKg),
    mirrorShipmentToRequest(c.env.DB, existing.id, {
      weightKg: weightKg !== (existing.total_weight_kg ?? 0) ? weightKg : null,
      volumeCbm: volumeCbm !== (existing.total_volume_cbm ?? 0) ? volumeCbm : null,
      clientName: body.client_name || null,
      clientPhone: body.client_phone || null,
      destination: destinationLabel,
      totalFcfa: priceChanged ? effectivePriceMinor / 100 : null,
    }),
    auditStatement(c, user, "shipment.update", "shipment", existing.id, { current_status: nextStatus, final_price_minor: finalMinor }),
  ];

  // Un nouveau prix change ce qui reste à payer, sauf si l'admin vient de fixer lui-même l'état du paiement.
  if (priceChanged && payStatus === existing.payment_status) {
    statements.push(paymentStatusStatement(c.env.DB, existing.id));
  }
  if (nextStatus === "CANCELLED") {
    statements.push(cancelRequestOfShipment(c.env.DB, existing.id));
  }

  if (statusChanged) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        existing.id,
        nextStatus,
        user.hubLocation || "Bureau Central",
        body.status_comment || null,
        user.userId
      )
    );
  }

  if (existing.client_id && (body.client_name || body.client_phone)) {
    statements.push(
      c.env.DB.prepare(`
        UPDATE clients
        SET full_name = COALESCE(?, full_name),
            phone_whatsapp = COALESCE(?, phone_whatsapp),
            city = COALESCE(?, city),
            country = COALESCE(?, country),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        body.client_name || null,
        body.client_phone || null,
        body.client_city || null,
        body.client_country || null,
        existing.client_id
      ),
      mirrorClientToRequests(c.env.DB, existing.client_id, body.client_name, body.client_phone)
    );
  }

  await c.env.DB.batch(statements);
  return c.json({ success: true, shipment_id: existing.id, message: "Expédition mise à jour en base." });
});

adminRouter.delete("/shipments/:id", async (c) => {
  if (!hasAnyPermission(c, "shipments.cancel", "shipments.edit")) {
    return c.json({ error: "Permission insuffisante (shipments.cancel requise)." }, 403);
  }
  const user = c.get("user");
  const shipmentId = c.req.param("id");
  const existing = await c.env.DB.prepare(`
    SELECT id, tracking_number FROM shipments WHERE id = ? OR UPPER(tracking_number) = UPPER(?) LIMIT 1
  `).bind(shipmentId, shipmentId).first<{ id: string; tracking_number: string }>();
  if (!existing) {
    return c.json({ error: "Expédition introuvable." }, 404);
  }

  const linkedPayments = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM payments WHERE shipment_id = ?`)
    .bind(existing.id)
    .first<{ total: number }>();
  if ((linkedPayments?.total || 0) > 0) {
    return c.json(
      { error: "Cette expédition a des paiements enregistrés. Annulez-la plutôt que de la supprimer afin de conserver la comptabilité." },
      409
    );
  }

  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM tracking_events WHERE shipment_id = ?`).bind(existing.id),
    c.env.DB.prepare(`DELETE FROM parcels WHERE shipment_id = ?`).bind(existing.id),
    c.env.DB.prepare(`DELETE FROM shipments WHERE id = ?`).bind(existing.id),
    c.env.DB.prepare(`
      UPDATE customer_requests
      SET shipment_id = NULL, tracking_number = NULL, status = 'IN_REVIEW', updated_at = datetime('now')
      WHERE shipment_id = ?
    `).bind(existing.id),
    auditStatement(c, user, "shipment.delete", "shipment", existing.id, { tracking_number: existing.tracking_number }),
  ]);
  return c.json({ success: true, message: "Expédition supprimée." });
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
    singleParcelWeightStatement(c.env.DB, shipmentId, Math.round(data.total_weight_kg * 100) / 100),
    mirrorShipmentToRequest(c.env.DB, shipmentId, {
      weightKg: Math.round(data.total_weight_kg * 100) / 100,
      volumeCbm: data.total_volume_cbm ?? null,
      totalFcfa: data.final_price_minor ? data.final_price_minor / 100 : null,
    }),
  ];

  if (data.final_price_minor) {
    statements.push(paymentStatusStatement(c.env.DB, shipmentId));
  }
  if (data.status === "CANCELLED") {
    statements.push(cancelRequestOfShipment(c.env.DB, shipmentId));
  }

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

const REQUEST_STATUSES = ["NEW", "IN_REVIEW", "QUOTE_SENT", "CONVERTED", "CLOSED", "CANCELLED"] as const;

const VERSION_CONFLICT_ERROR =
  "Ce dossier vient d'être modifié par ailleurs. Les données ont été actualisées : vérifiez-les puis réessayez.";

async function findRequest(c: { env: Env }, identifier: string) {
  return c.env.DB.prepare(`
    SELECT r.*, u.full_name as assigned_to_name
    FROM customer_requests r
    LEFT JOIN users u ON r.assigned_to_user_id = u.id
    WHERE r.id = ? OR UPPER(r.reference) = UPPER(?)
    LIMIT 1
  `).bind(identifier, identifier).first<any>();
}

async function loadLatestProof(c: { env: Env }, requestId: string) {
  return c.env.DB.prepare(`
    SELECT id, file_name, mime_type, chunk_count FROM payment_proofs
    WHERE request_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1
  `).bind(requestId).first<{ id: string; file_name: string; mime_type: string; chunk_count: number }>();
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
      u.full_name as assigned_to_name,
      (SELECT p.file_name FROM payment_proofs p WHERE p.request_id = r.id ORDER BY p.created_at DESC, p.rowid DESC LIMIT 1) as proof_name,
      (SELECT p.mime_type FROM payment_proofs p WHERE p.request_id = r.id ORDER BY p.created_at DESC, p.rowid DESC LIMIT 1) as proof_mime
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

  query += ` ORDER BY r.created_at DESC LIMIT 1000`;

  const [{ results: rows }, { results: allItems }] = await Promise.all([
    c.env.DB.prepare(query).bind(...params).all<any>(),
    c.env.DB.prepare(`SELECT * FROM request_items ORDER BY request_id, item_index ASC`).all<any>(),
  ]);

  const itemsByRequest = new Map<string, any[]>();
  for (const item of allItems) {
    const bucket = itemsByRequest.get(item.request_id) || [];
    bucket.push(item);
    itemsByRequest.set(item.request_id, bucket);
  }

  const requests = rows.map((row) => {
    const { proof_name, proof_mime, ...rest } = row;
    return toAdminRequest(rest, itemsByRequest.get(row.id) || [], {
      has_proof: Boolean(proof_name),
      name: proof_name,
      mime: proof_mime,
    });
  });
  return c.json({ requests });
});

adminRouter.get("/requests/:id", async (c) => {
  if (!checkPermission(c, "requests.view") && !checkPermission(c, "quotes.view")) {
    return c.json({ error: "Permission insuffisante." }, 403);
  }

  const request = await findRequest(c, c.req.param("id"));
  if (!request) {
    return c.json({ error: "Demande introuvable." }, 404);
  }

  const { results: items } = await c.env.DB.prepare(`
    SELECT * FROM request_items WHERE request_id = ? ORDER BY item_index ASC
  `).bind(request.id).all();

  const proof = await loadLatestProof(c, request.id);
  const dto = toAdminRequest(request, items as any[], { has_proof: Boolean(proof), name: proof?.file_name, mime: proof?.mime_type });

  if (proof) {
    const { results: chunks } = await c.env.DB.prepare(`
      SELECT data FROM payment_proof_chunks WHERE proof_id = ? ORDER BY chunk_index ASC
    `).bind(proof.id).all<{ data: string }>();
    dto.payment_receipt_url = `data:${proof.mime_type};base64,${chunks.map((chunk) => chunk.data).join("")}`;
  }

  return c.json({ request: dto, items });
});

const quoteSchema = z.object({
  estimatedWeightKg: z.number().nonnegative().nullish(),
  estimatedCbm: z.number().nonnegative().nullish(),
  goodsTotalFcfa: z.number().nonnegative().optional(),
  shippingFeeFcfa: z.number().nonnegative().optional(),
  totalAmountFcfa: z.number().positive("Le total du devis doit être supérieur à 0."),
  shippingModeName: z.string().max(160).nullish(),
  expectedVersion: z.number().int().optional(),
});

/**
 * ÉTAPE 2 (Admin ➔ Base de données ➔ Client) :
 * Enregistre le poids estimé et le devis. Un dossier déjà converti garde son statut.
 */
adminRouter.patch("/requests/:reference/quote", zValidator("json", quoteSchema), async (c) => {
  if (!hasAnyPermission(c, "requests.process", "quotes.process")) {
    return c.json({ error: "Permission insuffisante (requests.process requise)." }, 403);
  }

  const user = c.get("user");
  const body = c.req.valid("json");
  const existing = await findRequest(c, (c.req.param("reference") || "").trim());
  if (!existing) {
    return c.json({ error: "Demande introuvable." }, 404);
  }
  if (body.expectedVersion !== undefined && body.expectedVersion !== existing.row_version) {
    return c.json({ error: VERSION_CONFLICT_ERROR, conflict: true }, 409);
  }

  const currentMeta = parseMeta(existing);
  const nextMeta = {
    ...currentMeta,
    __roum_meta: true,
    total_goods_fcfa: body.goodsTotalFcfa ?? currentMeta.total_goods_fcfa ?? 0,
    shipping_fee_fcfa: body.shippingFeeFcfa ?? currentMeta.shipping_fee_fcfa ?? 0,
    total_amount_fcfa: body.totalAmountFcfa,
    shipping_mode_name: body.shippingModeName || currentMeta.shipping_mode_name,
  };

  const nextStatus = existing.status === "CONVERTED" ? "CONVERTED" : "QUOTE_SENT";

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE customer_requests
      SET estimated_weight_kg = ?,
          estimated_cbm = ?,
          status = ?,
          metadata_json = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.estimatedWeightKg !== undefined ? body.estimatedWeightKg : existing.estimated_weight_kg,
      body.estimatedCbm !== undefined ? body.estimatedCbm : existing.estimated_cbm,
      nextStatus,
      JSON.stringify(nextMeta),
      existing.id
    ),
    auditStatement(c, user, "request.quote", "request", existing.id, { total_amount_fcfa: body.totalAmountFcfa }),
  ];

  // Dossier déjà en expédition : le suivi, le prix et ce qui reste à payer suivent le devis.
  if (existing.shipment_id) {
    const priceMinor = Math.round(body.totalAmountFcfa * 100);
    statements.push(
      c.env.DB.prepare(`
        UPDATE shipments
        SET total_weight_kg = COALESCE(?, total_weight_kg),
            total_volume_cbm = COALESCE(?, total_volume_cbm),
            estimated_price_minor = ?,
            final_price_minor = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(body.estimatedWeightKg ?? null, body.estimatedCbm ?? null, priceMinor, priceMinor, existing.shipment_id),
      paymentStatusStatement(c.env.DB, existing.shipment_id)
    );
    if (body.estimatedWeightKg) {
      statements.push(singleParcelWeightStatement(c.env.DB, existing.shipment_id, body.estimatedWeightKg));
    }
  }

  await c.env.DB.batch(statements);

  const updated = await findRequest(c, existing.id);
  return c.json({ success: true, request: toAdminRequest(updated) });
});

interface ShipmentFromRequest {
  shippingModeId: string;
  routeId: string;
  weightKg: number;
  volumeCbm: number;
  priceMinor: number;
  currency: string;
  packageLabel: string;
  description: string | null;
  status: "RECEIVED_AT_HUB" | "DRAFT";
  location: string;
  comment: string;
  paid: boolean;
  metadata: Record<string, any>;
}

/**
 * Crée l'expédition d'un dossier en une seule transaction : client, expédition, colis, suivi, paiement
 * et mise à jour du dossier réussissent ou échouent ensemble. L'index unique `source_request_id` garantit
 * qu'un dossier ne produit jamais deux expéditions, même si deux personnes confirment au même moment.
 */
async function createShipmentFromRequest(c: { env: Env }, user: UserSession, request: any, input: ShipmentFromRequest) {
  const db = c.env.DB;
  const destination = parseDestination(request.destination_country);

  let clientId: string | null = request.client_id || null;
  const statements: D1PreparedStatement[] = [];

  if (!clientId) {
    const found = await db.prepare(`SELECT id FROM clients WHERE phone_whatsapp = ? LIMIT 1`)
      .bind(request.client_phone)
      .first<{ id: string }>();
    if (found?.id) {
      clientId = found.id;
    } else {
      clientId = crypto.randomUUID();
      statements.push(
        db.prepare(`
          INSERT INTO clients (id, full_name, phone_whatsapp, email, city, country)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          clientId,
          request.client_name,
          request.client_phone,
          request.client_email || null,
          destination.city,
          destination.country || "Non précisé"
        )
      );
    }
  }

  const mode = await db.prepare(`SELECT type FROM shipping_modes WHERE id = ?`).bind(input.shippingModeId).first<{ type: TransportType }>();
  if (!mode) throw new Error("Mode de transport inconnu.");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shipmentId = crypto.randomUUID();
    const trackingNumber = generateTrackingNumber(mode.type);
    const batch = [...statements];

    batch.push(
      db.prepare(`
        INSERT INTO shipments (
          id, tracking_number, client_id, route_id, shipping_mode_id,
          current_status, total_parcels_count, total_weight_kg, total_volume_cbm,
          estimated_price_minor, final_price_minor, currency, payment_status, created_by_user_id, source_request_id
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        shipmentId,
        trackingNumber,
        clientId,
        input.routeId,
        input.shippingModeId,
        input.status,
        input.weightKg,
        input.volumeCbm,
        input.priceMinor,
        input.paid ? input.priceMinor : null,
        input.currency,
        input.paid ? "PAID" : "PENDING",
        user.userId,
        request.id
      ),
      db.prepare(`
        INSERT INTO parcels (id, shipment_id, parcel_index, package_label, weight_kg, description)
        VALUES (?, ?, 1, ?, ?, ?)
      `).bind(crypto.randomUUID(), shipmentId, input.packageLabel, input.weightKg, input.description),
      db.prepare(`
        INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), shipmentId, input.status, input.location, input.comment, user.userId)
    );

    if (input.paid) {
      batch.push(
        db.prepare(`
          INSERT INTO payments (
            id, shipment_id, client_id, amount_minor, currency, payment_method, payment_type,
            reference_code, status, receipt_notes, recorded_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, 'FULL', ?, 'CONFIRMED', ?, ?)
        `).bind(
          crypto.randomUUID(),
          shipmentId,
          clientId,
          input.priceMinor,
          input.currency,
          paymentMethodFromSelection(input.metadata.payment_method_selected),
          request.reference,
          `Encaissement confirmé pour le dossier ${request.reference}`,
          user.userId
        )
      );
    }

    batch.push(
      db.prepare(`
        UPDATE customer_requests
        SET status = 'CONVERTED',
            client_id = ?,
            shipment_id = ?,
            tracking_number = ?,
            estimated_weight_kg = COALESCE(?, estimated_weight_kg),
            estimated_cbm = COALESCE(?, estimated_cbm),
            metadata_json = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        clientId,
        shipmentId,
        trackingNumber,
        input.weightKg || null,
        input.volumeCbm || null,
        JSON.stringify({ ...input.metadata, __roum_meta: true, tracking_number: trackingNumber }),
        request.id
      ),
      auditStatement(c, user, "request.convert", "request", request.id, {
        tracking_number: trackingNumber,
        paid: input.paid,
        price_minor: input.priceMinor,
      })
    );

    try {
      await db.batch(batch);
      return { shipmentId, trackingNumber };
    } catch (err: any) {
      const message = String(err?.message || "");
      if (message.includes("source_request_id")) {
        const winner = await db.prepare(`SELECT id, tracking_number FROM shipments WHERE source_request_id = ?`)
          .bind(request.id)
          .first<{ id: string; tracking_number: string }>();
        if (winner) return { shipmentId: winner.id, trackingNumber: winner.tracking_number };
      }
      if (!message.includes("shipments.tracking_number")) throw err;
    }
  }

  throw new Error("Impossible de générer un numéro de suivi unique.");
}

const confirmTrackingSchema = z.object({
  weightKg: z.number().nonnegative().nullish(),
  volumeCbm: z.number().nonnegative().nullish(),
  goodsTotalFcfa: z.number().nonnegative().optional(),
  shippingFeeFcfa: z.number().nonnegative().optional(),
  totalAmountFcfa: z.number().positive("Enregistrez d'abord un devis avec un montant.").optional(),
  expectedVersion: z.number().int().optional(),
});

/**
 * ÉTAPE 3 (Admin ➔ Base de données ➔ Client Tracking) :
 * Confirme l'encaissement. Le numéro de suivi est attribué ici par le serveur, et l'appel est rejouable :
 * un second clic renvoie le même numéro sans créer ni expédition ni paiement supplémentaire.
 */
adminRouter.post("/requests/:reference/confirm-tracking", zValidator("json", confirmTrackingSchema), async (c) => {
  if (!checkPermission(c, "finance.edit")) {
    return c.json({ error: "Permission insuffisante (finance.edit requise)." }, 403);
  }

  const user = c.get("user");
  const body = c.req.valid("json");
  const request = await findRequest(c, (c.req.param("reference") || "").trim());
  if (!request) {
    return c.json({ error: "Demande introuvable." }, 404);
  }

  if (request.shipment_id && request.tracking_number) {
    return c.json({
      success: true,
      already_confirmed: true,
      tracking_number: request.tracking_number,
      request: toAdminRequest(request),
      message: `Encaissement déjà confirmé : suivi ${request.tracking_number}.`,
    });
  }

  if (body.expectedVersion !== undefined && body.expectedVersion !== request.row_version) {
    return c.json({ error: VERSION_CONFLICT_ERROR, conflict: true }, 409);
  }

  const meta = parseMeta(request);
  const totalFcfa = Number(body.totalAmountFcfa ?? meta.total_amount_fcfa) || 0;
  if (totalFcfa <= 0) {
    return c.json({ error: "Enregistrez d'abord un devis avec un montant avant de confirmer l'encaissement." }, 400);
  }

  const destination = parseDestination(request.destination_country);
  const routeId = await findOrCreateRoute(c.env.DB, {
    originCountry: request.origin_country || "Chine",
    originCity: request.origin_city,
    destinationCountry: destination.country || "Côte d'Ivoire",
    destinationCity: destination.city,
  });

  const isSea = meta.shipping_mode_type === "SEA" || String(meta.shipping_mode_name || "").toLowerCase().includes("maritime");
  const shippingModeId = request.shipping_mode_id || (isSea ? "SEA_LCL" : "AIR_EXPRESS");
  const productName = meta.product_name || `Colis ${request.reference}`;

  const created = await createShipmentFromRequest(c, user, request, {
    shippingModeId,
    routeId,
    weightKg: Number(body.weightKg ?? request.estimated_weight_kg) || 0,
    volumeCbm: Number(body.volumeCbm ?? request.estimated_cbm) || 0,
    priceMinor: Math.round(totalFcfa * 100),
    currency: "FCFA",
    packageLabel: productName,
    description: request.description || productName,
    status: "RECEIVED_AT_HUB",
    location: isSea ? "Entrepôt Yiwu (Chine)" : "Entrepôt Guangzhou Baiyun (Chine)",
    comment: `Paiement confirmé · Dossier ${request.reference} activé et pris en charge à l'entrepôt ROUM TRANSIT`,
    paid: true,
    metadata: {
      ...meta,
      total_goods_fcfa: body.goodsTotalFcfa ?? meta.total_goods_fcfa ?? 0,
      shipping_fee_fcfa: body.shippingFeeFcfa ?? meta.shipping_fee_fcfa ?? 0,
      total_amount_fcfa: totalFcfa,
    },
  });

  const updated = await findRequest(c, request.id);
  return c.json({
    success: true,
    tracking_number: created.trackingNumber,
    shipment_id: created.shipmentId,
    request: toAdminRequest(updated),
    message: `Encaissement confirmé et numéro de suivi ${created.trackingNumber} enregistré en base de données.`,
  });
});

const updateRequestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES, { message: "Statut de dossier inconnu." }),
  admin_notes: z.string().max(4000).optional(),
});

adminRouter.patch("/requests/:id/status", zValidator("json", updateRequestStatusSchema), async (c) => {
  if (!checkPermission(c, "requests.process") && !checkPermission(c, "quotes.process")) {
    return c.json({ error: "Permission insuffisante (requests.process requise)." }, 403);
  }

  const user = c.get("user");
  const data = c.req.valid("json");
  const existing = await findRequest(c, c.req.param("id"));
  if (!existing) {
    return c.json({ error: "Demande introuvable." }, 404);
  }

  if (data.status === "CONVERTED" && !existing.shipment_id) {
    return c.json(
      { error: "Pour passer ce dossier en « payé », utilisez « Confirmer l'encaissement » : c'est ce qui crée l'expédition et le numéro de suivi." },
      409
    );
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE customer_requests
      SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now')
      WHERE id = ?
    `).bind(data.status, data.admin_notes ?? null, existing.id),
    auditStatement(c, user, "request.status", "request", existing.id, { from: existing.status, to: data.status }),
  ];

  if (data.status === "CANCELLED" && existing.shipment_id) {
    statements.push(...cancelShipmentOfRequest(c.env.DB, existing.shipment_id, user.userId, user.hubLocation || "Bureau Central"));
  }

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: `Demande ${existing.reference} mise à jour vers le statut ${data.status}.` });
});

/**
 * Mise à jour générique d'une demande client (Édition Admin ➔ SQLite D1)
 */
adminRouter.patch("/requests/:id", async (c) => {
  if (!checkPermission(c, "requests.process") && !checkPermission(c, "quotes.process")) {
    return c.json({ error: "Permission insuffisante (requests.process requise)." }, 403);
  }

  const user = c.get("user");
  const body = await c.req.json<any>().catch(() => ({}));
  const existing = await findRequest(c, c.req.param("id"));
  if (!existing) {
    return c.json({ error: "Demande introuvable." }, 404);
  }
  if (body.expected_version !== undefined && Number(body.expected_version) !== existing.row_version) {
    return c.json({ error: VERSION_CONFLICT_ERROR, conflict: true }, 409);
  }

  const nextStatus: string = body.status || existing.status;
  if (!(REQUEST_STATUSES as readonly string[]).includes(nextStatus)) {
    return c.json({ error: "Statut de dossier inconnu." }, 400);
  }
  if (nextStatus === "CONVERTED" && !existing.shipment_id) {
    return c.json({ error: "Utilisez « Confirmer l'encaissement » pour créer l'expédition et le numéro de suivi." }, 409);
  }

  const currentMeta = parseMeta(existing);
  const numberOr = (value: unknown, fallback: unknown) => {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const nextMeta = {
    ...currentMeta,
    __roum_meta: true,
    product_name: body.product_name || currentMeta.product_name,
    product_image: body.product_image || currentMeta.product_image,
    product_url: body.product_url || currentMeta.product_url,
    total_goods_fcfa: numberOr(body.total_goods_fcfa, currentMeta.total_goods_fcfa),
    shipping_fee_fcfa: numberOr(body.shipping_fee_fcfa, currentMeta.shipping_fee_fcfa),
    total_amount_fcfa: numberOr(body.total_amount_fcfa, currentMeta.total_amount_fcfa),
    shipping_mode_name: body.shipping_mode_name || currentMeta.shipping_mode_name,
  };

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE customer_requests
      SET
        client_name = COALESCE(?, client_name),
        client_phone = COALESCE(?, client_phone),
        client_email = COALESCE(?, client_email),
        origin_country = COALESCE(?, origin_country),
        destination_country = COALESCE(?, destination_country),
        status = ?,
        description = COALESCE(?, description),
        shipping_mark = COALESCE(?, shipping_mark),
        estimated_weight_kg = ?,
        estimated_cbm = ?,
        metadata_json = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.client_name?.trim() || null,
      body.client_phone?.trim() || null,
      body.client_email?.trim() || null,
      body.origin_country?.trim() || null,
      body.destination_country?.trim() || null,
      nextStatus,
      body.description || null,
      body.shipping_mark || null,
      numberOr(body.estimated_weight_kg, existing.estimated_weight_kg ?? null),
      numberOr(body.estimated_cbm, existing.estimated_cbm ?? null),
      JSON.stringify(nextMeta),
      existing.id
    ),
    auditStatement(c, user, "request.update", "request", existing.id, { status: nextStatus }),
  ];

  if (body.product_name || body.product_url) {
    statements.push(
      c.env.DB.prepare(`
        UPDATE request_items
        SET product_name = COALESCE(?, product_name), product_url = COALESCE(?, product_url)
        WHERE id = (SELECT id FROM request_items WHERE request_id = ? ORDER BY item_index ASC LIMIT 1)
      `).bind(body.product_name?.trim() || null, body.product_url?.trim() || null, existing.id)
    );
  }

  const nextName = body.client_name?.trim() || null;
  const nextPhone = body.client_phone?.trim() || null;
  if (existing.client_id && (nextName || nextPhone)) {
    statements.push(
      c.env.DB.prepare(`
        UPDATE clients
        SET full_name = COALESCE(?, full_name), phone_whatsapp = COALESCE(?, phone_whatsapp), updated_at = datetime('now')
        WHERE id = ?
      `).bind(nextName, nextPhone, existing.client_id)
    );
  }

  if (existing.shipment_id) {
    const nextWeight = numberOr(body.estimated_weight_kg, null) as number | null;
    if (nextWeight !== null) {
      statements.push(
        c.env.DB.prepare(`UPDATE shipments SET total_weight_kg = ?, updated_at = datetime('now') WHERE id = ?`).bind(nextWeight, existing.shipment_id),
        singleParcelWeightStatement(c.env.DB, existing.shipment_id, nextWeight)
      );
    }

    const nextDestination = body.destination_country?.trim();
    if (nextDestination && nextDestination !== existing.destination_country) {
      const parsed = parseDestination(nextDestination);
      const routeId = await findOrCreateRoute(c.env.DB, {
        originCountry: body.origin_country?.trim() || existing.origin_country || "Chine",
        destinationCountry: parsed.country,
        destinationCity: parsed.city,
      });
      statements.push(
        c.env.DB.prepare(`UPDATE shipments SET route_id = ?, updated_at = datetime('now') WHERE id = ?`).bind(routeId, existing.shipment_id)
      );
    }

    if (nextStatus === "CANCELLED") {
      statements.push(...cancelShipmentOfRequest(c.env.DB, existing.shipment_id, user.userId, user.hubLocation || "Bureau Central"));
    }
  }

  await c.env.DB.batch(statements);
  return c.json({ success: true, message: "Demande mise à jour avec succès dans SQLite D1." });
});

/**
 * Suppression d'une demande client (Admin ➔ SQLite D1)
 */
adminRouter.delete("/requests/:id", async (c) => {
  if (!checkPermission(c, "requests.process") && !checkPermission(c, "quotes.process")) {
    return c.json({ error: "Permission insuffisante (requests.process requise)." }, 403);
  }

  const user = c.get("user");
  const existing = await findRequest(c, c.req.param("id"));
  if (!existing) {
    return c.json({ error: "Demande introuvable." }, 404);
  }
  if (existing.shipment_id) {
    return c.json({ error: "Ce dossier a déjà une expédition active : il ne peut pas être supprimé." }, 409);
  }

  await c.env.DB.batch([
    c.env.DB.prepare(`
      DELETE FROM payment_proof_chunks
      WHERE proof_id IN (SELECT id FROM payment_proofs WHERE request_id = ?)
    `).bind(existing.id),
    c.env.DB.prepare(`DELETE FROM payment_proofs WHERE request_id = ?`).bind(existing.id),
    c.env.DB.prepare(`DELETE FROM request_items WHERE request_id = ?`).bind(existing.id),
    c.env.DB.prepare(`DELETE FROM customer_requests WHERE id = ?`).bind(existing.id),
    auditStatement(c, user, "request.delete", "request", existing.id, { reference: existing.reference }),
  ]);

  return c.json({ success: true, message: "Demande supprimée avec succès de SQLite D1." });
});

/**
 * Conversion d'une demande acceptée en expédition non encore payée
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
  const data = c.req.valid("json");
  const request = await findRequest(c, c.req.param("id"));
  if (!request) {
    return c.json({ error: "Demande introuvable." }, 404);
  }
  if (request.shipment_id && request.tracking_number) {
    return c.json({ success: true, shipment_id: request.shipment_id, tracking_number: request.tracking_number, message: "Dossier déjà converti." });
  }

  const routeExists = await c.env.DB.prepare(`SELECT id FROM routes WHERE id = ?`).bind(data.route_id).first();
  if (!routeExists) {
    return c.json({ error: "Liaison inconnue." }, 400);
  }
  const modeExists = await c.env.DB.prepare(`SELECT id FROM shipping_modes WHERE id = ?`).bind(data.shipping_mode_id).first();
  if (!modeExists) {
    return c.json({ error: "Mode de transport inconnu." }, 400);
  }

  const created = await createShipmentFromRequest(c, user, request, {
    shippingModeId: data.shipping_mode_id,
    routeId: data.route_id,
    weightKg: Math.round(data.weight_kg * 100) / 100,
    volumeCbm: data.volume_cbm ? Math.round(data.volume_cbm * 10000) / 10000 : 0,
    priceMinor: data.estimated_price_minor || 0,
    currency: data.currency,
    packageLabel: data.package_label || `Colis Demande ${request.reference}`,
    description: data.description || request.description || null,
    status: "DRAFT",
    location: user.hubLocation || "Bureau Central",
    comment: `Dossier créé suite à la conversion de la demande ${request.reference}`,
    paid: false,
    metadata: parseMeta(request),
  });

  return c.json({
    success: true,
    shipment_id: created.shipmentId,
    tracking_number: created.trackingNumber,
    message: `Demande ${request.reference} convertie avec succès en expédition ${created.trackingNumber}.`,
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

  query += ` ORDER BY c.created_at DESC LIMIT 1000`;

  const { results: clients } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ clients });
});

const createClientSchema = z.object({
  full_name: z.string().min(2, "Nom complet requis"),
  phone_whatsapp: z.string().min(3, "Numéro requis").max(60),
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
    data.phone_whatsapp.trim(),
    data.email || null,
    data.address || null,
    data.city || null,
    data.country.trim(),
    data.notes || null
  ).run();

  return c.json({ success: true, client_id: clientId, message: "Client créé avec succès." }, 201);
});

/**
 * Modification d'une fiche client (Admin ➔ SQLite D1)
 */
adminRouter.put("/clients/:id", async (c) => {
  if (!hasAnyPermission(c, "clients.edit", "clients.create")) {
    return c.json({ error: "Permission insuffisante (clients.edit requise)." }, 403);
  }

  const id = c.req.param("id");
  const data = await c.req.json<any>().catch(() => ({}));
  const phone = data.phone_whatsapp || data.phone || "";

  const existing = await c.env.DB.prepare(`SELECT id FROM clients WHERE id = ?`).bind(id).first<any>();
  if (!existing) {
    return c.json({ error: "Client introuvable." }, 404);
  }

  await c.env.DB.batch([
    c.env.DB.prepare(`
      UPDATE clients
      SET
        full_name = COALESCE(?, full_name),
        phone_whatsapp = COALESCE(?, phone_whatsapp),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.full_name?.trim() || null,
      phone?.trim() || null,
      data.email?.trim() || null,
      data.address?.trim() || null,
      data.city?.trim() || null,
      data.country?.trim() || null,
      data.notes?.trim() || null,
      id
    ),
    mirrorClientToRequests(c.env.DB, id, data.full_name?.trim() || null, phone?.trim() || null),
  ]);

  return c.json({ success: true, message: "Client mis à jour avec succès dans SQLite D1." });
});

/**
 * Suppression d'un client (Admin ➔ SQLite D1)
 */
adminRouter.delete("/clients/:id", async (c) => {
  if (!hasAnyPermission(c, "clients.edit")) {
    return c.json({ error: "Permission insuffisante (clients.edit requise)." }, 403);
  }

  const id = c.req.param("id");
  const links = await c.env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM shipments WHERE client_id = ?1) +
      (SELECT COUNT(*) FROM payments WHERE client_id = ?1) AS total
  `).bind(id).first<{ total: number }>();
  if ((links?.total || 0) > 0) {
    return c.json({ error: "Ce client a des expéditions ou des paiements : il ne peut pas être supprimé." }, 409);
  }

  await c.env.DB.prepare(`DELETE FROM clients WHERE id = ?`).bind(id).run();
  return c.json({ success: true, message: "Client supprimé de SQLite D1." });
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
      COALESCE(t.category_tag, sm.name, 'Standard') as shipping_mode_name,
      COALESCE(t.category_tag, sm.name, 'Standard') as service_name,
      COALESCE(sm.type, 'AIR') as shipping_mode_type,
      COALESCE(sm.pricing_basis, 'PER_KG') as pricing_basis
    FROM tariffs t
    LEFT JOIN routes r ON t.route_id = r.id
    LEFT JOIN shipping_modes sm ON t.shipping_mode_id = sm.id
    WHERE t.is_active = 1
    ORDER BY r.origin_country ASC, t.id ASC
  `).all();
  return c.json({ tariffs });
});

const createTariffSchema = z.object({
  route_id: z.string().nullish(),
  origin_country: z.string().nullish(),
  origin_city: z.string().nullish(),
  destination_country: z.string().nullish(),
  destination_city: z.string().nullish(),
  shipping_mode_id: z.string().nullish(),
  transport_mode: z.string().nullish(),
  shipping_mode_type: z.string().nullish(),
  currency: z.string().default("FCFA"),
  price_per_unit_minor: z.number().int().positive("Prix unitaire requis"),
  minimum_charge_minor: z.number().int().nonnegative().nullish(),
  estimated_days_min: z.number().int().positive().nullish(),
  estimated_days_max: z.number().int().positive().nullish(),
  category_tag: z.string().nullish(),
  service_name: z.string().nullish(),
  note: z.string().nullish(),
});

/** Traduit un mode demandé vers un mode existant, ou `null` si la demande ne précise rien. */
async function resolveTariffMode(db: D1Database, requested: unknown): Promise<string | null> {
  if (!requested || typeof requested !== "string") return null;
  if (requested === "SEA" || requested === "SEA_LCL" || requested === "SEA_GROUPAGE") return "SEA_LCL";
  const row = await db.prepare("SELECT id FROM shipping_modes WHERE id = ?").bind(requested).first<{ id: string }>();
  return row?.id || null;
}

const LEGACY_TARIFF_IDS: Record<string, string> = {
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

adminRouter.post("/tariffs", zValidator("json", createTariffSchema), async (c) => {
  if (!checkPermission(c, "config.tariffs")) {
    return c.json({ error: "Permission insuffisante (config.tariffs requise)." }, 403);
  }

  const data = c.req.valid("json");
  let routeId = data.route_id || undefined;

  // Si pays de départ et pays d'arrivée sont saisis directement, on trouve ou crée la liaison exacte
  if (!routeId && data.origin_country && data.destination_country) {
    routeId = await findOrCreateRoute(c.env.DB, {
      originCountry: data.origin_country.trim(),
      originCity: data.origin_city?.trim() || null,
      destinationCountry: data.destination_country.trim(),
      destinationCity: data.destination_city?.trim() || null,
    });
  }

  if (!routeId) {
    return c.json({ error: "Veuillez sélectionner ou renseigner un pays de départ et un pays de destination." }, 400);
  }

  const validModeId =
    (await resolveTariffMode(c.env.DB, data.shipping_mode_id || data.transport_mode || data.shipping_mode_type)) ||
    (data.shipping_mode_type === "SEA" ? "SEA_LCL" : "AIR_STANDARD");

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
      data.service_name || data.category_tag || null,
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

  const statements: any[] = [];
  for (const item of items) {
    if (!item.id) continue;
    const resolvedId = LEGACY_TARIFF_IDS[item.id] || item.id;
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
        item.service_name ? String(item.service_name) : item.category_tag !== undefined ? String(item.category_tag) : null,
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
  const tariffId = LEGACY_TARIFF_IDS[rawId] || rawId;
  const body = await c.req.json<any>().catch(() => ({}));

  // `null` conserve le mode actuel : modifier un prix ne doit jamais changer un tarif maritime en aérien.
  const validModeId = await resolveTariffMode(c.env.DB, body.shipping_mode_id || body.transport_mode);

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
          body.currency || null,
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

      // Une liaison peut servir à plusieurs tarifs : on rattache ce tarif à la bonne liaison sans toucher aux autres.
      if (body.origin_country || body.destination_country) {
        const currentRoute = await c.env.DB.prepare(`SELECT origin_country, destination_country FROM routes WHERE id = ?`)
          .bind(existing.route_id)
          .first<{ origin_country: string; destination_country: string }>();
        const origin = (body.origin_country || currentRoute?.origin_country || "").trim();
        const destination = (body.destination_country || currentRoute?.destination_country || "").trim();
        if (origin !== currentRoute?.origin_country || destination !== currentRoute?.destination_country) {
          const routeId = await findOrCreateRoute(c.env.DB, { originCountry: origin, destinationCountry: destination });
          await c.env.DB.prepare(`UPDATE tariffs SET route_id = ? WHERE id = ?`).bind(routeId, tariffId).run();
        }
      }
    } else {
      return c.json({ error: "Tarif introuvable." }, 404);
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
    ORDER BY p.recorded_at DESC LIMIT 1000
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

  if (data.shipment_id) {
    statements.push(paymentStatusStatement(c.env.DB, data.shipment_id));
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

  if (payment.shipment_id) {
    statements.push(paymentStatusStatement(c.env.DB, payment.shipment_id));
  }

  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    message: status === "CONFIRMED" ? "Paiement validé et confirmé avec succès." : `Statut du paiement mis à jour vers ${status}.`,
  });
});

/**
 * Modification complète d'un paiement (Admin ➔ SQLite D1)
 */
adminRouter.patch("/payments/:id", async (c) => {
  if (!checkPermission(c, "finance.edit")) {
    return c.json({ error: "Permission insuffisante (finance.edit requise)." }, 403);
  }

  const id = c.req.param("id");
  const data = await c.req.json<any>().catch(() => ({}));
  const amountMinor = data.amount_minor !== undefined ? Number(data.amount_minor) : (data.amount !== undefined ? Math.round(Number(data.amount) * 100) : null);

  const existing = await c.env.DB.prepare(`SELECT * FROM payments WHERE id = ?`).bind(id).first<any>();
  if (!existing) {
    return c.json({ error: "Paiement introuvable." }, 404);
  }

  let nextShipmentId: string | null = existing.shipment_id;
  const requestedTracking = typeof data.shipment_tracking === "string" ? data.shipment_tracking.trim() : undefined;
  if (requestedTracking) {
    const target = await c.env.DB.prepare(`SELECT id FROM shipments WHERE UPPER(tracking_number) = UPPER(?) LIMIT 1`)
      .bind(requestedTracking)
      .first<{ id: string }>();
    if (!target) {
      return c.json({ error: `Aucune expédition ne porte le numéro ${requestedTracking}.` }, 404);
    }
    nextShipmentId = target.id;
  }

  const paymentUpdate = c.env.DB.prepare(`
    UPDATE payments
    SET
      shipment_id = ?,
      amount_minor = COALESCE(?, amount_minor),
      currency = COALESCE(?, currency),
      payment_method = COALESCE(?, payment_method),
      payment_type = COALESCE(?, payment_type),
      reference_code = COALESCE(?, reference_code),
      status = COALESCE(?, status),
      receipt_notes = COALESCE(?, receipt_notes)
    WHERE id = ?
  `).bind(
    nextShipmentId,
    amountMinor,
    data.currency || null,
    data.payment_method || null,
    data.payment_type || null,
    data.reference_code || null,
    data.status || null,
    data.receipt_notes || null,
    id
  );

  const affectedShipments = new Set([existing.shipment_id, nextShipmentId].filter(Boolean) as string[]);
  await c.env.DB.batch([
    paymentUpdate,
    ...[...affectedShipments].map((shipmentId) => paymentStatusStatement(c.env.DB, shipmentId)),
  ]);

  return c.json({ success: true, message: "Paiement mis à jour avec succès dans SQLite D1." });
});

/**
 * Suppression d'un paiement (Admin ➔ SQLite D1)
 */
adminRouter.delete("/payments/:id", async (c) => {
  if (!checkPermission(c, "finance.edit")) {
    return c.json({ error: "Permission insuffisante (finance.edit requise)." }, 403);
  }

  const id = c.req.param("id");
  const existing = await c.env.DB.prepare(`SELECT shipment_id FROM payments WHERE id = ?`).bind(id).first<{ shipment_id: string | null }>();
  if (!existing) {
    return c.json({ error: "Paiement introuvable." }, 404);
  }

  const paymentDelete = c.env.DB.prepare(`DELETE FROM payments WHERE id = ?`).bind(id);
  await c.env.DB.batch(
    existing.shipment_id ? [paymentDelete, paymentStatusStatement(c.env.DB, existing.shipment_id)] : [paymentDelete]
  );
  return c.json({ success: true, message: "Paiement supprimé de SQLite D1." });
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

/**
 * Modification complète d'une tâche (Admin ➔ SQLite D1)
 */
adminRouter.patch("/tasks/:id", async (c) => {
  if (!checkPermission(c, "tasks.manage")) {
    return c.json({ error: "Permission insuffisante (tasks.manage requise)." }, 403);
  }

  const id = c.req.param("id");
  const data = await c.req.json<any>().catch(() => ({}));

  await c.env.DB.prepare(`
    UPDATE tasks
    SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      priority = COALESCE(?, priority),
      status = COALESCE(?, status),
      due_date = COALESCE(?, due_date),
      assigned_to_user_id = COALESCE(?, assigned_to_user_id),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    data.title?.trim() || null,
    data.description !== undefined ? (data.description || null) : null,
    data.category || null,
    data.priority || null,
    data.status || null,
    data.due_date || null,
    data.assigned_to_user_id || null,
    id
  ).run();

  return c.json({ success: true, message: "Tâche mise à jour avec succès dans SQLite D1." });
});

/**
 * Suppression d'une tâche (Admin ➔ SQLite D1)
 */
adminRouter.delete("/tasks/:id", async (c) => {
  if (!checkPermission(c, "tasks.manage")) {
    return c.json({ error: "Permission insuffisante." }, 403);
  }

  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM tasks WHERE id = ?`).bind(id).run();
  return c.json({ success: true, message: "Tâche supprimée de SQLite D1." });
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

adminRouter.put("/settings", zValidator("json", z.record(z.string().max(80), z.string().max(20000))), async (c) => {
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
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by_user_id = excluded.updated_by_user_id, updated_at = excluded.updated_at
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

