import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  PERMISSIONS,
  SUPER_ADMIN_ROLE_ID,
  isPermissionCode,
  generateTrackingNumber,
  phoneSchema,
  type TransportType,
} from "@roum/shared";
import { hashPassword, verifyJwt } from "../crypto";
import type { Env, UserSession } from "../types";

export const adminRouter = new Hono<{ Bindings: Env; Variables: { user: UserSession } }>();

/**
 * Middleware d'authentification pour toutes les routes /admin
 */
adminRouter.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Authentification requise." }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET || "roum-default-dev-secret-key-32chars!";
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
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe de 8 caractères minimum requis"),
  full_name: z.string().min(2, "Nom complet requis"),
  role_id: z.string().min(1, "Rôle requis"),
  hub_location: z.string().optional(),
});

adminRouter.post("/users", zValidator("json", createUserSchema), async (c) => {
  const currentUser = c.get("user");
  if (!currentUser.isSuperAdmin) {
    return c.json({ error: "Réservé au Super Administrateur." }, 403);
  }

  const data = c.req.valid("json");
  const newUserId = crypto.randomUUID();
  const passwordHash = await hashPassword(data.password);

  try {
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role_id, hub_location, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      newUserId,
      data.email.trim().toLowerCase(),
      passwordHash,
      data.full_name.trim(),
      data.role_id,
      data.hub_location || null
    ).run();

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
      r.origin_country, r.destination_country,
      sm.name as shipping_mode_name
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
  ];

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: `Statut mis à jour vers ${new_status}.` });
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
