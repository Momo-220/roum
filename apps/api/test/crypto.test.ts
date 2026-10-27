import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, signJwt, verifyJwt } from "../src/crypto";

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
