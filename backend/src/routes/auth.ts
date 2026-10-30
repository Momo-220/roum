import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SUPER_ADMIN_ROLE_ID } from "../shared";
import {
  verifyPassword,
  signJwt,
  verifyJwt,
  resolveJwtSecret,
  checkRateLimit,
  resetRateLimit,
} from "../crypto";
import type { Env, UserSession } from "../types";

export const authRouter = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  email: z.string().email("Email invalide").max(160),
  password: z.string().min(1, "Mot de passe requis").max(256),
});

/**
 * 1. Connexion (Login) protégée contre le bruteforce
 */
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const clientIp =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "local-ip";
  const normalizedEmail = email.trim().toLowerCase();
  const rateKeyIp = `login:${clientIp}:${normalizedEmail}`;
  const rateKeyAccount = `login:account:${normalizedEmail}`;

  // Protection Anti-Bruteforce double : max 5 essais par IP ET max 10 essais par compte sur 15 minutes
  const rateCheckIp = checkRateLimit(rateKeyIp, 5, 15 * 60 * 1000);
  const rateCheckAccount = checkRateLimit(rateKeyAccount, 10, 15 * 60 * 1000);
  if (!rateCheckIp.allowed || !rateCheckAccount.allowed) {
    const retrySec = Math.max(rateCheckIp.retryAfterSec, rateCheckAccount.retryAfterSec);
    c.header("Retry-After", String(retrySec));
    return c.json(
      {
        error: `Trop de tentatives de connexion. Veuillez patienter ${Math.ceil(retrySec / 60)} minute(s) avant de réessayer.`,
      },
      429
    );
  }

  const jwtSecret = resolveJwtSecret(c.env);

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

  // Réinitialise le compteur d'échecs après authentification réussie
  resetRateLimit(rateKeyIp);
  resetRateLimit(rateKeyAccount);

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

  const nowMs = Date.now();
  const ttlMs = 1000 * 60 * 60 * 12; // 12 heures (au lieu de 7 jours)
  const tokenPayload = {
    sub: user.id,
    email: user.email,
    roleId: user.role_id,
    iat: nowMs,
    jti: crypto.randomUUID(),
    exp: nowMs + ttlMs,
  };

  const token = await signJwt(tokenPayload, jwtSecret);

  // Cookie HttpOnly sécurisé contre le vol XSS
  setCookie(c, "roum_session", token, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === "production",
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  const session: UserSession = {
    userId: user.id,
    email: user.email,
    fullName: isSuperAdmin ? "Madame Marouba" : user.full_name,
    roleId: user.role_id,
    roleName: isSuperAdmin ? "CEO" : user.role_name,
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
  const cookieToken = getCookie(c, "roum_session");
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookieToken;

  if (!token) {
    return c.json({ error: "Non authentifié." }, 401);
  }

  // Session locale de développement (uniquement hors production)
  if (token === "roum_local_admin_session" && c.env.ENVIRONMENT !== "production") {
    const devSession: UserSession = {
      userId: "user-ceo-marouba",
      email: "ceo@roumtransit.com",
      fullName: "Madame Marouba",
      roleId: SUPER_ADMIN_ROLE_ID,
      roleName: "CEO",
      isSuperAdmin: true,
      hubLocation: "Abidjan / Bamako",
      permissions: ["*"],
      allowedStatuses: ["*"],
    };
    return c.json({ user: devSession });
  }

  const jwtSecret = resolveJwtSecret(c.env);
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
    fullName: isSuperAdmin ? "Madame Marouba" : user.full_name,
    roleId: user.role_id,
    roleName: isSuperAdmin ? "CEO" : user.role_name,
    isSuperAdmin,
    hubLocation: user.hub_location,
    permissions,
    allowedStatuses,
  };

  return c.json({ user: session });
});

/**
 * 3. Déconnexion (invalidation du cookie HttpOnly)
 */
authRouter.post("/logout", (c) => {
  deleteCookie(c, "roum_session", { path: "/" });
  return c.json({ success: true });
});
