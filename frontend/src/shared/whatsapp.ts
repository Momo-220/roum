import { normalizePhone } from "./phone";

/**
 * Construit un lien WhatsApp "click-to-chat" (gratuit, sans API WhatsApp Business).
 * Format officiel : https://wa.me/<chiffres sans + ni 0 initial>?text=<message encodé>
 *
 * Lève une erreur si le numéro est invalide : un lien cassé ne doit jamais être affiché.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  if (normalized === null) {
    throw new Error("Numéro WhatsApp invalide : format international requis (ex. +22370000000).");
  }
  const digits = normalized.slice(1);
  const text = message?.trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}
