import { z } from "zod";

/**
 * Montants d'argent.
 *
 * RÈGLE : les montants sont stockés en ENTIERS, en unités mineures (centimes), jamais en nombres
 * à virgule. Avec des nombres à virgule, 0.1 + 0.2 = 0.30000000000000004 : des erreurs d'arrondi
 * finissent toujours par apparaître sur les factures et totaux.
 *
 * Le nombre de décimales dépend de la devise (norme ISO 4217) :
 *   - USD 12,50 $ -> 1250
 *   - XOF 15 000 F CFA -> 15000 (le franc CFA n'a pas de centimes)
 */
export const CURRENCIES = {
  USD: { decimals: 2, label: "Dollar américain" },
  EUR: { decimals: 2, label: "Euro" },
  CNY: { decimals: 2, label: "Yuan chinois" },
  AED: { decimals: 2, label: "Dirham des Émirats" },
  MAD: { decimals: 2, label: "Dirham marocain" },
  XOF: { decimals: 0, label: "Franc CFA (BCEAO)" },
  XAF: { decimals: 0, label: "Franc CFA (BEAC)" },
  GNF: { decimals: 0, label: "Franc guinéen" },
} as const satisfies Record<string, { decimals: number; label: string }>;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as [CurrencyCode, ...CurrencyCode[]];

export const currencySchema = z.enum(CURRENCY_CODES);

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && Object.hasOwn(CURRENCIES, value);
}

/**
 * Convertit une saisie décimale ("12,50", "12.5", "15 000") en unités mineures entières.
 * Travaille sur la chaîne de caractères, sans passer par un nombre à virgule.
 * Renvoie `null` si la saisie est invalide, négative, ou a trop de décimales pour la devise.
 */
export function parseAmountToMinor(input: string, currency: CurrencyCode): number | null {
  const { decimals } = CURRENCIES[currency];
  const cleaned = input.trim().replace(/[\s\u00A0\u202F]/g, "").replace(",", ".");
  const match = /^(\d+)(?:\.(\d+))?$/.exec(cleaned);
  if (!match) return null;

  const integerPart = match[1] ?? "";
  const fractionPart = match[2] ?? "";
  if (fractionPart.length > decimals) return null;

  const minor = Number(integerPart + fractionPart.padEnd(decimals, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Affiche un montant stocké en unités mineures, ex. formatMoney(1250, "USD") -> "12,50 $US". */
export function formatMoney(minor: number, currency: CurrencyCode, locale = "fr-FR"): string {
  if (!Number.isSafeInteger(minor)) {
    throw new Error("Montant invalide : un entier en unités mineures est attendu.");
  }
  const { decimals } = CURRENCIES[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(minor / 10 ** decimals);
}

/** Montant en unités mineures : entier, positif ou nul. */
export const minorAmountSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
