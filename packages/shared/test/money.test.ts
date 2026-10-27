import { describe, expect, it } from "vitest";
import { CURRENCIES, formatMoney, isCurrencyCode, parseAmountToMinor } from "../src/money";

describe("parseAmountToMinor", () => {
  it.each([
    ["12.50", "USD", 1250],
    ["12,50", "USD", 1250],
    ["12.5", "USD", 1250],
    ["12", "USD", 1200],
    ["0", "USD", 0],
    ["0.1", "USD", 10],
    ["15000", "XOF", 15000],
    ["15 000", "XOF", 15000],
    ["15\u202F000", "XOF", 15000], // espace fine insécable produite par Intl en français
    ["1000000", "GNF", 1000000],
  ] as const)("%j %s -> %d", (input, currency, expected) => {
    expect(parseAmountToMinor(input, currency)).toBe(expected);
  });

  it("ne produit aucune erreur d'arrondi flottant (0.1 + 0.2)", () => {
    const a = parseAmountToMinor("0.1", "USD");
    const b = parseAmountToMinor("0.2", "USD");
    expect(a! + b!).toBe(30);
  });

  it.each([
    ["12.505", "USD"], // trop de décimales
    ["15000.5", "XOF"], // le franc CFA n'a pas de centimes
    ["-5", "USD"],
    ["abc", "USD"],
    ["1.2.3", "USD"],
    ["", "USD"],
    ["1e5", "USD"],
    ["99999999999999999999", "USD"], // dépasse les entiers sûrs
  ] as const)("refuse %j %s", (input, currency) => {
    expect(parseAmountToMinor(input, currency)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formate selon les décimales de la devise", () => {
    expect(formatMoney(1250, "USD")).toContain("12,50");
    expect(formatMoney(15000, "XOF")).not.toContain(",");
  });

  it("refuse un montant non entier", () => {
    expect(() => formatMoney(12.5, "USD")).toThrow();
  });
});

describe("devises", () => {
  it("chaque code est un code ISO 4217 à 3 lettres majuscules", () => {
    for (const code of Object.keys(CURRENCIES)) {
      expect(code).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("isCurrencyCode ne se laisse pas tromper par les propriétés héritées", () => {
    expect(isCurrencyCode("USD")).toBe(true);
    expect(isCurrencyCode("toString")).toBe(false);
    expect(isCurrencyCode("usd")).toBe(false);
  });
});
