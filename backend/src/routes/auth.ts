import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SUPER_ADMIN_ROLE_ID } from "../shared";
import {
  verifyPassword,
  hashPassword,
  signJwt,
  verifyJwt,
  resolveJwtSecret,
  checkRateLimit,
  clientIpOf,
} from "../crypto";
import type { Env, UserSession } from "../types";

export const authRouter = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  email: z.string().email("Email invalide").max(160),
  password: z.string().min(1, "Mot de passe requis").max(256),
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
/** Échecs permis en 15 minutes : par visiteur sur un compte, puis pour le compte tous visiteurs confondus. */
const LOGIN_LIMITS = { visitor: 5, account: 20 };

/** Secondes à attendre si l'un des compteurs a atteint sa limite, sinon 0. */
async function loginWaitSeconds(db: D1Database, limits: Array<[string, number]>): Promise<number> {
  const now = Date.now();
  const { results } = await db
    .prepare(`SELECT key, failures, reset_at FROM login_attempts WHERE key IN (?, ?)`)
    .bind(...limits.map(([key]) => key))
    .all<{ key: string; failures: number; reset_at: number }>();

  let wait = 0;
  for (const row of results) {
    const max = limits.find(([key]) => key === row.key)?.[1] ?? Infinity;
    if (row.reset_at > now && row.failures >= max) {
      wait = Math.max(wait, Math.ceil((row.reset_at - now) / 1000));
    }
  }
  return wait;
}

async function recordLoginFailure(db: D1Database, keys: string[]): Promise<void> {
  const now = Date.now();
  await db.batch([
    ...keys.map((key) =>
      db.prepare(`
        INSERT INTO login_attempts (key, failures, reset_at) VALUES (?, 1, ?)
        ON CONFLICT(key) DO UPDATE SET
          failures = CASE WHEN login_attempts.reset_at <= ? THEN 1 ELSE login_attempts.failures + 1 END,
          reset_at = CASE WHEN login_attempts.reset_at <= ? THEN excluded.reset_at ELSE login_attempts.reset_at END
      `).bind(key, now + LOGIN_WINDOW_MS, now, now)
    ),
    // Les compteurs expirés depuis longtemps ne servent plus à rien.
    db.prepare(`DELETE FROM login_attempts WHERE reset_at <= ?`).bind(now - LOGIN_WINDOW_MS),
  ]);
}

/**
 * 1. Connexion (Login) protégée contre le bruteforce
 */
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const clientIp = clientIpOf(c);
  const normalizedEmail = email.trim().toLowerCase();
  const limits: Array<[string, number]> = [
    [`visitor:${clientIp}:${normalizedEmail}`, LOGIN_LIMITS.visitor],
    [`account:${normalizedEmail}`, LOGIN_LIMITS.account],
  ];
  const attemptKeys = limits.map(([key]) => key);

  const waitSec = await loginWaitSeconds(c.env.DB, limits);
  if (waitSec > 0) {
    c.header("Retry-After", String(waitSec));
    return c.json(
      {
        error: `Trop de tentatives de connexion. Veuillez patienter ${Math.ceil(waitSec / 60)} minute(s) avant de réessayer.`,
      },
      429
    );
  }

  const jwtSecret = resolveJwtSecret(c.env);

  // Recherche de l'utilisateur actif
  const user = await c.env.DB.prepare(`
    SELECT 
      u.id, u.email, u.password_hash, u.full_name, u.role_id, u.hub_location, u.is_active, u.avatar_data,
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
    avatar_data: string | null;
    role_name: string;
    role_is_system: number;
    role_is_active: number;
  }>();

  if (!user || user.is_active !== 1 || user.role_is_active !== 1) {
    await recordLoginFailure(c.env.DB, attemptKeys);
    return c.json({ error: "Identifiants invalides ou compte inactif." }, 401);
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    await recordLoginFailure(c.env.DB, attemptKeys);
    return c.json({ error: "Identifiants invalides ou compte inactif." }, 401);
  }

  // Une connexion réussie efface les échecs de ce visiteur et de ce compte.
  await c.env.DB.prepare(`DELETE FROM login_attempts WHERE key IN (?, ?)`).bind(...attemptKeys).run();

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
    avatarUrl: user.avatar_data ?? null,
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
    const account = await c.env.DB.prepare(`
      SELECT email, avatar_data FROM users WHERE role_id = ? LIMIT 1
    `).bind(SUPER_ADMIN_ROLE_ID).first<{ email: string; avatar_data: string | null }>();
    const devSession: UserSession = {
      userId: "user-superadmin-01",
      email: account?.email ?? "ceo@roumtransit.com",
      fullName: "Madame Marouba",
      roleId: SUPER_ADMIN_ROLE_ID,
      roleName: "CEO",
      isSuperAdmin: true,
      hubLocation: "Abidjan / Bamako",
      permissions: ["*"],
      allowedStatuses: ["*"],
      avatarUrl: account?.avatar_data ?? null,
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
      u.id, u.email, u.full_name, u.role_id, u.hub_location, u.is_active, u.avatar_data,
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
    avatar_data: string | null;
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
    avatarUrl: user.avatar_data ?? null,
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

const SESSION_ERROR = "Session expirée ou invalide. Veuillez vous reconnecter.";

/** Compte de la session en cours, ou null si elle est absente, expirée ou invalide. */
async function sessionUserId(c: Context<{ Bindings: Env }>): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : getCookie(c, "roum_session");
  if (!token) return null;

  if (token === "roum_local_admin_session" && c.env.ENVIRONMENT !== "production") {
    const ceo = await c.env.DB.prepare(`
      SELECT id FROM users WHERE role_id = ? OR LOWER(email) = 'ceo@roumtransit.com' LIMIT 1
    `).bind(SUPER_ADMIN_ROLE_ID).first<{ id: string }>();
    return ceo?.id ?? null;
  }

  const payload = await verifyJwt<{ sub: string; exp: number }>(token, resolveJwtSecret(c.env));
  if (!payload || !payload.sub || Date.now() > payload.exp) return null;
  return payload.sub;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères").max(256),
});

/**
 * 4. Modification sécurisée du mot de passe (POST /change-password)
 */
authRouter.post("/change-password", zValidator("json", changePasswordSchema), async (c) => {
  const { currentPassword, newPassword } = c.req.valid("json");
  const targetUserId = await sessionUserId(c);
  if (!targetUserId) {
    return c.json({ error: SESSION_ERROR }, 401);
  }

  const user = await c.env.DB.prepare(`
    SELECT id, email, password_hash FROM users WHERE id = ?
  `).bind(targetUserId).first<{ id: string; email: string; password_hash: string }>();

  if (!user) {
    return c.json({ error: "Utilisateur introuvable." }, 404);
  }

  const isMatch = await verifyPassword(currentPassword, user.password_hash);
  if (!isMatch) {
    return c.json({ error: "Le mot de passe actuel saisi est incorrect." }, 400);
  }

  const newHash = await hashPassword(newPassword);

  await c.env.DB.prepare(`
    UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(newHash, targetUserId).run();

  try {
    const auditId = `audit-${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, 'auth.change_password', 'user', ?, ?, datetime('now'))
    `).bind(
      auditId,
      targetUserId,
      targetUserId,
      JSON.stringify({ email: user.email, timestamp: new Date().toISOString() })
    ).run();
  } catch (err) {
    console.error("Erreur enregistrement audit log password change:", err);
  }

  return c.json({
    success: true,
    message: "Votre mot de passe a été modifié avec succès.",
  });
});

const changeEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(160),
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis").max(256),
});

/**
 * 5. Modification de l'e-mail de connexion (POST /change-email)
 * Les sessions suivent le compte par son identifiant : elles restent ouvertes après le changement.
 */
authRouter.post("/change-email", zValidator("json", changeEmailSchema), async (c) => {
  const { newEmail, currentPassword } = c.req.valid("json");
  const userId = await sessionUserId(c);
  if (!userId) {
    return c.json({ error: SESSION_ERROR }, 401);
  }

  const rateCheck = checkRateLimit(`change-email:${userId}`, 10, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json({ error: "Trop de tentatives. Veuillez patienter quelques minutes." }, 429);
  }

  const user = await c.env.DB.prepare(`
    SELECT id, email, password_hash FROM users WHERE id = ?
  `).bind(userId).first<{ id: string; email: string; password_hash: string }>();

  if (!user) {
    return c.json({ error: "Utilisateur introuvable." }, 404);
  }

  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    return c.json({ error: "Le mot de passe actuel saisi est incorrect." }, 400);
  }

  if (newEmail === user.email.toLowerCase()) {
    return c.json({ error: "C'est déjà votre adresse e-mail." }, 400);
  }

  const emailTaken = () => c.json({ error: "Cette adresse e-mail est déjà utilisée." }, 409);

  const existing = await c.env.DB.prepare(`
    SELECT id FROM users WHERE email = ? AND id <> ?
  `).bind(newEmail, userId).first();
  if (existing) return emailTaken();

  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`
        UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(newEmail, userId),
      c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
        VALUES (?, ?, 'auth.change_email', 'user', ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        userId,
        JSON.stringify({ old_email: user.email, new_email: newEmail })
      ),
    ]);
  } catch (err) {
    if (String(err).includes("UNIQUE")) return emailTaken();
    throw err;
  }

  return c.json({
    success: true,
    email: newEmail,
    message: "Votre adresse e-mail a été modifiée avec succès.",
  });
});

/** Une photo de profil compressée pèse quelques dizaines de Ko : cette limite laisse une large marge. */
const MAX_AVATAR_CHARS = 700_000;

const avatarSchema = z.object({
  avatar: z
    .string()
    .max(MAX_AVATAR_CHARS, "Photo trop lourde")
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Photo invalide")
    .nullable(),
});

/**
 * 6. Photo de profil (PUT /avatar), gardée en base pour la retrouver sur chaque appareil.
 * `null` retire la photo.
 */
authRouter.put("/avatar", zValidator("json", avatarSchema), async (c) => {
  const { avatar } = c.req.valid("json");
  const userId = await sessionUserId(c);
  if (!userId) {
    return c.json({ error: SESSION_ERROR }, 401);
  }

  await c.env.DB.prepare(`
    UPDATE users SET avatar_data = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(avatar, userId).run();

  return c.json({ success: true, avatarUrl: avatar });
});
