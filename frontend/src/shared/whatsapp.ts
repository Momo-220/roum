import { normalizePhone } from "./phone";

/**
 * Retourne l'URL complète et cliquable vers la page Tracking d'un numéro de suivi ou d'une référence.
 * Dans WhatsApp, cette URL complète devient automatiquement un lien bleu cliquable.
 */
export function getTrackingPageUrl(trackingNumberOrRef?: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://roum-transit.pages.dev";
  const cleanCode = (trackingNumberOrRef || "").trim();
  if (!cleanCode) return `${origin}/tracking`;
  return `${origin}/tracking/${encodeURIComponent(cleanCode)}`;
}

/**
 * Construit un lien WhatsApp "click-to-chat" (gratuit, sans API WhatsApp Business).
 * Format officiel : https://wa.me/<chiffres sans + ni 0 initial>?text=<message encodé>
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const digits = normalized
    ? normalized.slice(1)
    : (phone || "").replace(/[^0-9]/g, "").replace(/^00/, "");
  if (!digits) {
    return "https://wa.me/2250787994412";
  }
  const text = message?.trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/**
 * Message WhatsApp courtois, détaillé et direct : Admin ➔ Client (pour une expédition / colis actif)
 * Inclut le lien de suivi cliquable qui renvoie directement vers /tracking/[trackingNumber].
 */
export function buildAdminShipmentWhatsAppUrl(params: {
  phone?: string;
  clientPhone?: string;
  clientName?: string;
  trackingNumber?: string;
  statusLabel?: string;
  origin?: string;
  destination?: string;
  shippingMode?: string;
  weightOrVolume?: string;
  weightKg?: number;
  volumeCbm?: number;
  amountLabel?: string;
  shippingMark?: string;
}): string {
  const rawPhone = params.phone || params.clientPhone || "";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "").replace(/^00/, "");
  const trackingCode = (params.trackingNumber || "").trim();
  const trackingUrl = getTrackingPageUrl(trackingCode);
  const weightVol =
    params.weightOrVolume ||
    [
      params.weightKg ? `${params.weightKg} kg` : null,
      params.volumeCbm ? `${params.volumeCbm} m³` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const lines = [
    `Bonjour ${params.clientName || "cher(e) client(e)"},`,
    ``,
    `Ici le service logistique *ROUM TRANSIT INTERNATIONAL* concernant le suivi de votre expédition :`,
    ``,
    `• N° de Suivi : *${trackingCode || "En cours"}*`,
    params.shippingMark ? `• Shipping Mark : *${params.shippingMark}*` : null,
    params.statusLabel ? `• Statut actuel : *${params.statusLabel}*` : null,
    params.origin || params.destination
      ? `• Corridor : ${params.origin || "Chine"} ➔ ${params.destination || "Afrique"}`
      : null,
    params.shippingMode
      ? `• Mode d'acheminement : ${params.shippingMode}${weightVol ? ` (${weightVol})` : ""}`
      : null,
    params.amountLabel ? `• Montant : *${params.amountLabel}*` : null,
    ``,
    `👉 *Cliquez sur votre numéro de suivi pour voir l'avancement en direct :*`,
    `${trackingUrl}`,
    ``,
    `Nous restons à votre entière disposition pour toute question.`,
    `Cordialement,`,
    `*L'équipe ROUM TRANSIT*`,
  ].filter((l) => l !== null);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Message WhatsApp courtois, détaillé et direct : Admin ➔ Client (pour une commande / sourcing / virement RMB)
 * Inclut le lien cliquable vers la page Tracking.
 */
export function buildAdminRequestWhatsAppUrl(params: {
  phone?: string;
  clientPhone?: string;
  clientName?: string;
  reference: string;
  trackingNumber?: string;
  serviceLabel?: string;
  productName?: string;
  destination?: string;
  amountFormatted?: string;
  totalAmountFcfa?: number;
  rmbFormatted?: string;
  rmbAmount?: string;
  shippingMark?: string;
  statusLabel?: string;
}): string {
  const rawPhone = params.phone || params.clientPhone || "";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "").replace(/^00/, "");
  const codeForTracking = (params.trackingNumber || params.reference || "").trim();
  const trackingUrl = getTrackingPageUrl(codeForTracking);
  const amountText =
    params.amountFormatted ||
    (typeof params.totalAmountFcfa === "number" && params.totalAmountFcfa > 0
      ? `${params.totalAmountFcfa.toLocaleString("fr-FR")} FCFA`
      : undefined);
  const rmbText = params.rmbFormatted || params.rmbAmount;

  const lines = [
    `Bonjour ${params.clientName || "cher(e) client(e)"},`,
    ``,
    `Ici la direction *ROUM TRANSIT INTERNATIONAL* concernant votre dossier :`,
    ``,
    `• Référence dossier : *${params.reference}*`,
    params.trackingNumber ? `• N° de Suivi Officiel : *${params.trackingNumber}*` : null,
    params.shippingMark ? `• Shipping Mark : *${params.shippingMark}*` : null,
    params.serviceLabel ? `• Opération : ${params.serviceLabel}` : null,
    params.productName ? `• Marchandise : ${params.productName}` : null,
    params.destination ? `• Destination : ${params.destination}` : null,
    rmbText ? `• Montant Usine : *${rmbText}*` : null,
    amountText ? `• Montant Total : *${amountText}*` : null,
    params.statusLabel ? `• Statut du dossier : *${params.statusLabel}*` : null,
    ``,
    `👉 *Cliquez ici pour suivre votre dossier en direct (${codeForTracking}) :*`,
    `${trackingUrl}`,
    ``,
    `Merci pour votre confiance. Nous restons à votre écoute pour la suite des opérations.`,
    `Cordialement,`,
    `*La Direction ROUM TRANSIT*`,
  ].filter((l) => l !== null);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
