import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRouter } from "./routes/health";
import { publicRouter } from "./routes/public";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// En-têtes de sécurité HTTP (Durcissement OWASP)
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("X-XSS-Protection", "0");
});

// Middleware CORS restreint aux origines autorisées
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (!origin) return "*";
      const allowed = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://roumtransit.com",
        "https://www.roumtransit.com",
        "https://admin.roumtransit.com",
      ];
      if (allowed.includes(origin) || c.env?.ENVIRONMENT !== "production") {
        return origin;
      }
      return "https://roumtransit.com";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

// Route de base et santé
app.route("/", healthRouter);

// Routes publiques (suivi direct, tarifs, devis)
app.route("/api/public", publicRouter);
app.route("/api/v1/public", publicRouter);

// Routes d'authentification
app.route("/api/auth", authRouter);
app.route("/api/v1/auth", authRouter);

// Routes d'administration sécurisées
app.route("/api/admin", adminRouter);
app.route("/api/v1/admin", adminRouter);

// Gestionnaire 404
app.notFound((c) => {
  return c.json({ error: "Route introuvable sur l'API ROUM_TRANSIT." }, 404);
});

// Gestionnaire d'erreurs global (masque les détails internes SQL/stack en production)
app.onError((err, c) => {
  console.error("Erreur serveur :", err);
  const isProd = c.env?.ENVIRONMENT === "production";
  return c.json(
    {
      error: isProd
        ? "Une erreur interne est survenue. L'équipe technique a été notifiée."
        : err.message || "Une erreur inattendue est survenue.",
    },
    500
  );
});

export default app;
