import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRouter } from "./routes/health";
import { publicRouter } from "./routes/public";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// Middleware CORS universel (autorise le site public et le panneau d'administration)
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
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

// Gestionnaire d'erreurs global
app.onError((err, c) => {
  console.error("Erreur serveur :", err);
  return c.json(
    {
      error: err.message || "Une erreur inattendue est survenue.",
    },
    500
  );
});

export default app;
