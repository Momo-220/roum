import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SUPER_ADMIN_ROLE_ID } from "@roum/shared";
import { verifyPassword, signJwt, verifyJwt } from "../crypto";
import type { Env, UserSession } from "../types";

export const authRouter = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

/**
 * 1. Connexion (Login)
 */
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const jwtSecret = c.env.JWT_SECRET || "roum-default-dev-secret-key-32chars!";

  // Recherche de l'utilisateur actif
  const user = await c.env.DB.prepare(`
    SELECT 
      u.id, u.email, u.password_hash, u.full_name, u.role_id, u.hub_location, u.is_active,
      r.name as role_name, r.is_system as role_is_system, r.is_active as role_is_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.email) = LOWER(?)
  `).bind(email.trim()).first<{
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    role_id: string;
    hub_location: string | null;
    is_active: number;
    role_name: string;
    role_is_system: number;
    role_is_active: number;
  }>();

  if (!user || user.is_active !== 1 || user.role_is_active !== 1) {
    return c.json({ error: "Identifiants invalides ou compte inactif." }, 401);
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    return c.json({ error: "Identifiants invalides ou compte inactif." }, 401);
  }

  const isSuperAdmin = user.role_id === SUPER_ADMIN_ROLE_ID;

  // Lecture des permissions en base
  const { results: permRows } = await c.env.DB.prepare(`
    SELECT permission_code FROM role_permissions WHERE role_id = ?
  `).bind(user.role_id).all<{ permission_code: string }>();

  // Lecture des statuts autorisés
  const { results: statusRows } = await c.env.DB.prepare(`
    SELECT status_code FROM role_allowed_statuses WHERE role_id = ?
  `).bind(user.role_id).all<{ status_code: string }>();

  const permissions = isSuperAdmin ? ["*"] : permRows.map((r) => r.permission_code);
  const allowedStatuses = isSuperAdmin ? ["*"] : statusRows.map((r) => r.status_code);

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    roleId: user.role_id,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 jours
  };

  const token = await signJwt(tokenPayload, jwtSecret);

  const session: UserSession = {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    roleId: user.role_id,
    roleName: user.role_name,
    isSuperAdmin,
    hubLocation: user.hub_location,
    permissions,
    allowedStatuses,
  };

  return c.json({
    token,
    user: session,
  });
});

/**
 * 2. Vérification de session en temps réel (GET /me)
 * Re-lit toujours les permissions et l'état actif en base de données.
 */
authRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Non authentifié." }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET || "roum-default-dev-secret-key-32chars!";
  const payload = await verifyJwt<{ sub: string; exp: number }>(token, jwtSecret);

  if (!payload || !payload.sub || Date.now() > payload.exp) {
    return c.json({ error: "Session expirée ou invalide." }, 401);
  }

  // Re-lecture en base de données en temps réel
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
    return c.json({ error: "Compte désactivé ou rôle inactif." }, 401);
  }

  const isSuperAdmin = user.role_id === SUPER_ADMIN_ROLE_ID;

  const { results: permRows } = await c.env.DB.prepare(`
    SELECT permission_code FROM role_permissions WHERE role_id = ?
  `).bind(user.role_id).all<{ permission_code: string }>();

  const { results: statusRows } = await c.env.DB.prepare(`
    SELECT status_code FROM role_allowed_statuses WHERE role_id = ?
  `).bind(user.role_id).all<{ status_code: string }>();

  const permissions = isSuperAdmin ? ["*"] : permRows.map((r) => r.permission_code);
  const allowedStatuses = isSuperAdmin ? ["*"] : statusRows.map((r) => r.status_code);

  const session: UserSession = {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    roleId: user.role_id,
    roleName: user.role_name,
    isSuperAdmin,
    hubLocation: user.hub_location,
    permissions,
    allowedStatuses,
  };

  return c.json({ user: session });
});
