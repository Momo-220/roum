import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl } from "../src/whatsapp";
import { normalizePhone, phoneSchema } from "../src/phone";

describe("normalizePhone", () => {
  it.each([
    ["+22370000000", "+22370000000"],
    ["+223 70 00 00 00", "+22370000000"],
    ["00223-70.00.00.00", "+22370000000"],
    ["(+86) 138 0013 8000", "+8613800138000"],
    ["+971 50 123 4567", "+971501234567"],
    ["+212 6 12 34 56 78", "+212612345678"],
  ])("%j -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "70000000", // pas d'indicatif pays : refusé volontairement
    "+0223700000", // un indicatif ne commence jamais par 0
    "+1234567", // trop court
    "+1234567890123456", // trop long (> 15 chiffres)
    "+223 70 AB 00 00",
    "",
  ])("refuse %j", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("phoneSchema", () => {
  it("normalise une saisie valide", () => {
    expect(phoneSchema.parse("+223 70 00 00 00")).toBe("+22370000000");
  });

  it("renvoie un message d'erreur clair pour une saisie invalide", () => {
    const result = phoneSchema.safeParse("70000000");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("indicatif pays");
  });
});

describe("buildWhatsAppUrl", () => {
  it("construit un lien sans message", () => {
    expect(buildWhatsAppUrl("+223 70 00 00 00")).toBe("https://wa.me/22370000000");
  });

  it("encode correctement le message (accents, espaces, &, #, saut de ligne)", () => {
    const url = buildWhatsAppUrl("+22370000000", "Bonjour, colis n° RM-AIR-2610-K8P9Q2 & suivi #1\nMerci");
    expect(url).toBe(
      "https://wa.me/22370000000?text=" +
        encodeURIComponent("Bonjour, colis n° RM-AIR-2610-K8P9Q2 & suivi #1\nMerci"),
    );
    expect(new URL(url).searchParams.get("text")).toBe("Bonjour, colis n° RM-AIR-2610-K8P9Q2 & suivi #1\nMerci");
  });

  it("ignore un message vide ou composé d'espaces", () => {
    expect(buildWhatsAppUrl("+22370000000", "   ")).toBe("https://wa.me/22370000000");
  });

  it("refuse un numéro invalide plutôt que de produire un lien cassé", () => {
    expect(() => buildWhatsAppUrl("70000000")).toThrow();
  });
});
