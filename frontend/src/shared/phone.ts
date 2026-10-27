import { z } from "zod";

/**
 * Numéros de téléphone (WhatsApp) au format international E.164 : `+` puis 8 à 15 chiffres.
 *
 * Saisies tolérées puis normalisées :
 *   "+223 70 00 00 00"   -> "+22370000000"
 *   "00223-70.00.00.00"  -> "+22370000000"
 *   "(+86) 138 0013 8000" -> "+8613800138000"
 *
 * Un numéro sans indicatif pays (ex. "70000000") est REFUSÉ : impossible de deviner le pays
 * de façon fiable, et un lien WhatsApp vers le mauvais pays serait un bug silencieux.
 */
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(input: string): string | null {
  let value = input.trim().replace(/[\s.\-()/]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  return E164_REGEX.test(value) ? value : null;
}

export const phoneSchema = z.string().transform((value, ctx) => {
  const normalized = normalizePhone(value);
  if (normalized === null) {
    ctx.issues.push({
      code: "custom",
      input: value,
      message: "Numéro invalide : utilisez le format international avec l'indicatif pays (ex. +223 70 00 00 00).",
    });
    return z.NEVER;
  }
  return normalized;
});
