import { Hono } from "hono";
import type { Env } from "../types";

export const healthRouter = new Hono<{ Bindings: Env }>();

healthRouter.get("/", (c) => {
  if (c.env?.ENVIRONMENT !== "production") {
    return c.redirect("http://localhost:3000/admin");
  }
  return c.json({
    status: "ok",
    app: c.env.APP_NAME || "ROUM_TRANSIT_API",
    env: c.env.ENVIRONMENT || "development",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/health", (c) => {
  return c.json({
    status: "ok",
    app: c.env.APP_NAME || "ROUM_TRANSIT_API",
    env: c.env.ENVIRONMENT || "development",
    timestamp: new Date().toISOString(),
  });
});
