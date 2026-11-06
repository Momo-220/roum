import { describe, expect, it } from "vitest";
import {
  checkClientRateLimit,
  clientIpOf,
  hashPassword,
  signJwt,
  verifyJwt,
  verifyPassword,
} from "../src/crypto";

describe("WebCrypto Password Hashing", () => {
  it("hache et vérifie un mot de passe avec succès", async () => {
    const password = "MonSuperMotDePasse2026!";
    const hash = await hashPassword(password);

    expect(hash.startsWith("pbkdf2:100000:")).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("MauvaisMotDePasse", hash);
    expect(isInvalid).toBe(false);
  });

  it("génère des sels différents pour un même mot de passe", async () => {
    const password = "MemeMotDePasse";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });
});

describe("WebCrypto JWT", () => {
  it("signe et vérifie un jeton JWT", async () => {
    const secret = "secret-tres-securise-2026";
    const payload = { userId: "user-123", email: "admin@roum.com", exp: Date.now() + 3600000 };

    const token = await signJwt(payload, secret);
    expect(token.split(".").length).toBe(3);

    const decoded = await verifyJwt<typeof payload>(token, secret);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("user-123");
    expect(decoded?.email).toBe("admin@roum.com");

    const invalidSecretDecoded = await verifyJwt(token, "autre-secret");
    expect(invalidSecretDecoded).toBeNull();
  });
});

describe("Limites par visiteur derrière Vercel", () => {
  const requestFrom = (connection: string, forwardedFor?: string) => ({
    req: {
      header: (name: string) =>
        name === "CF-Connecting-IP" ? connection : name === "X-Forwarded-For" ? forwardedFor : undefined,
    },
  });
  const uniqueScope = (name: string) => `${name}-${Math.random()}`;

  it("lit la vraie adresse du client, pas celle de Vercel", () => {
    expect(clientIpOf(requestFrom("76.76.21.21", "41.207.1.1, 76.76.21.21"))).toBe("41.207.1.1");
  });

  it("se rabat sur la connexion quand aucun proxy n'est passé par là", () => {
    expect(clientIpOf(requestFrom("41.207.1.1"))).toBe("41.207.1.1");
  });

  it("ne fait pas partager la limite aux clients qui passent par Vercel", () => {
    const scope = uniqueScope("clients");
    const first = requestFrom("76.76.21.21", "41.207.1.1, 76.76.21.21");
    const second = requestFrom("76.76.21.21", "41.207.2.2, 76.76.21.21");

    expect(checkClientRateLimit(first, scope, 2, 60_000).allowed).toBe(true);
    expect(checkClientRateLimit(first, scope, 2, 60_000).allowed).toBe(true);
    expect(checkClientRateLimit(first, scope, 2, 60_000).allowed).toBe(false);
    expect(checkClientRateLimit(second, scope, 2, 60_000).allowed).toBe(true);
  });

  it("plafonne une connexion qui invente son adresse à chaque requête", () => {
    const scope = uniqueScope("usurpation");
    const attempts = Array.from({ length: 60 }, (_, index) =>
      checkClientRateLimit(requestFrom("203.0.113.9", `10.0.0.${index}`), scope, 1, 60_000).allowed
    );

    expect(attempts.filter(Boolean)).toHaveLength(50);
  });
});
