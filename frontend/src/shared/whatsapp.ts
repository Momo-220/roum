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
    return "https://wa.me/2250153638569";
  }
  const text = message?.trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

type MessageLine = string | null | undefined | false;

const SIGNATURE = "ROUM TRANSIT";
const REPLY_HINT = "Une question ? Répondez simplement à ce message.";

/** Assemble un message : les lignes vides en trop disparaissent quand une information manque. */
export function joinMessageLines(lines: MessageLine[]): string {
  return lines
    .filter((line): line is string => typeof line === "string")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Ouvre la conversation avec un client. Sans numéro valide, WhatsApp laisse choisir le contact. */
function clientChatUrl(phone: string | undefined, lines: MessageLine[]): string {
  const normalized = normalizePhone(phone || "");
  const digits = normalized ? normalized.slice(1) : (phone || "").replace(/[^0-9]/g, "").replace(/^00/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(joinMessageLines(lines))}`;
}

function greeting(clientName?: string): string {
  const name = (clientName || "").trim();
  return !name || /^(cher\(e\) )?client(e)?$|^cher client$/i.test(name) ? "Bonjour," : `Bonjour ${name},`;
}

export function formatFcfaText(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} FCFA`;
}

/** Message de l'agence au client : où en est son colis. */
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
  const trackingCode = (params.trackingNumber || "").trim();
  const weightVol =
    params.weightOrVolume ||
    [
      params.weightKg ? `${String(params.weightKg).replace(".", ",")} kg` : null,
      params.volumeCbm ? `${String(params.volumeCbm).replace(".", ",")} m³` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return clientChatUrl(params.phone || params.clientPhone, [
    greeting(params.clientName),
    "",
    params.statusLabel
      ? `Votre colis *${trackingCode}* : *${params.statusLabel}*.`
      : `Voici le suivi de votre colis *${trackingCode}*.`,
    "",
    (params.origin || params.destination) && `Trajet : ${params.origin || "Chine"} → ${params.destination || "Afrique"}`,
    params.shippingMode && `Transport : ${params.shippingMode}${weightVol ? ` (${weightVol})` : ""}`,
    params.shippingMark && `Marquage : ${params.shippingMark}`,
    params.amountLabel && `Montant : *${params.amountLabel}*`,
    "",
    "Suivre mon colis :",
    getTrackingPageUrl(trackingCode),
    "",
    REPLY_HINT,
    SIGNATURE,
  ]);
}

/** Message de l'agence au client : où en est son dossier (commande, virement en Chine). */
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
  const code = (params.trackingNumber || params.reference || "").trim();
  const amountText =
    params.amountFormatted ||
    (typeof params.totalAmountFcfa === "number" && params.totalAmountFcfa > 0
      ? formatFcfaText(params.totalAmountFcfa)
      : undefined);
  const rmbText = params.rmbFormatted || params.rmbAmount;

  return clientChatUrl(params.phone || params.clientPhone, [
    greeting(params.clientName),
    "",
    params.statusLabel
      ? `Votre dossier *${params.reference}* : *${params.statusLabel}*.`
      : `Voici où en est votre dossier *${params.reference}*.`,
    "",
    params.trackingNumber && `Numéro de suivi : *${params.trackingNumber}*`,
    params.serviceLabel && `Service : ${params.serviceLabel}`,
    params.productName && `Article : ${params.productName}`,
    params.destination && `Destination : ${params.destination}`,
    params.shippingMark && `Marquage : ${params.shippingMark}`,
    rmbText && `Montant usine : ${rmbText}`,
    amountText && `Total : *${amountText}*`,
    "",
    "Suivre mon dossier :",
    getTrackingPageUrl(code),
    "",
    REPLY_HINT,
    SIGNATURE,
  ]);
}

/**
 * Construit le lien autonome et cliquable vers la page de règlement & upload de preuve de paiement
 * d'une commande (/services/commande?pay=RM-...).
 */
export function getPaymentPageUrl(params: { reference: string; accessKey?: string | null }): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://roum-transit.pages.dev";
  // Le lien ne transporte aucun montant : la page lit le dossier en base, seule source de vérité.
  const sp = new URLSearchParams();
  sp.set("pay", (params.reference || "").trim());
  if (params.accessKey) sp.set("key", params.accessKey);
  return `${origin}/services/commande?${sp.toString()}`;
}

/** Étape 2 : l'agence envoie le devis, le lien de paiement et ses comptes officiels. */
export function buildAdminQuotePaymentWhatsAppUrl(params: {
  clientPhone: string;
  clientName?: string;
  reference: string;
  productName?: string;
  productQuantity?: string | number;
  destination?: string;
  shippingMode?: string;
  estimatedWeightKg?: number;
  estimatedCbm?: number;
  goodsTotalFcfa?: number;
  shippingFeeFcfa?: number;
  totalAmountFcfa: number;
  waveNumber?: string;
  orangeNumber?: string;
  moroccoRib?: string;
  accessKey?: string | null;
}): string {
  const paymentUrl = getPaymentPageUrl({ reference: params.reference, accessKey: params.accessKey });
  const quantity = Number(params.productQuantity);
  const hasGoods = typeof params.goodsTotalFcfa === "number" && params.goodsTotalFcfa > 0;
  const hasShipping = typeof params.shippingFeeFcfa === "number" && params.shippingFeeFcfa > 0;

  return clientChatUrl(params.clientPhone, [
    greeting(params.clientName),
    "",
    `Votre devis est prêt pour le dossier *${params.reference}*.`,
    "",
    params.productName && `Article : ${params.productName}${quantity > 1 ? ` (${quantity} pièces)` : ""}`,
    params.destination && `Destination : ${params.destination}`,
    params.shippingMode && `Transport : ${params.shippingMode}`,
    params.estimatedCbm
      ? `Volume estimé : ${params.estimatedCbm} m³`
      : `Poids estimé : ${params.estimatedWeightKg || 1} kg`,
    "",
    hasGoods && `Marchandises : ${formatFcfaText(params.goodsTotalFcfa!)}`,
    hasShipping && `Transport et douane : ${formatFcfaText(params.shippingFeeFcfa!)}`,
    `*Total à régler : ${formatFcfaText(params.totalAmountFcfa)}*`,
    "",
    "Payez et envoyez votre preuve de paiement ici :",
    paymentUrl,
    "",
    params.waveNumber && `Wave : ${params.waveNumber}`,
    params.orangeNumber && `Orange Money : ${params.orangeNumber}`,
    params.moroccoRib && `Compte Maroc : ${params.moroccoRib}`,
    "",
    "Dès que votre paiement est confirmé, vous recevez votre numéro de suivi.",
    REPLY_HINT,
    SIGNATURE,
  ]);
}

/** Étape 3 : l'agence confirme le paiement et donne le numéro de suivi. */
export function buildAdminPaymentConfirmedTrackingWhatsAppUrl(params: {
  clientPhone: string;
  clientName?: string;
  reference: string;
  trackingNumber: string;
  productName?: string;
  destination?: string;
  shippingMode?: string;
  weightOrVolume?: string;
  totalAmountFcfa?: number;
  shippingMark?: string;
}): string {
  const paid = typeof params.totalAmountFcfa === "number" && params.totalAmountFcfa > 0;

  return clientChatUrl(params.clientPhone, [
    greeting(params.clientName),
    "",
    paid
      ? `Votre paiement de *${formatFcfaText(params.totalAmountFcfa!)}* est bien reçu, merci !`
      : "Votre paiement est bien reçu, merci !",
    "",
    `Votre numéro de suivi : *${params.trackingNumber}*`,
    "",
    params.productName && `Article : ${params.productName}`,
    params.destination && `Destination : ${params.destination}`,
    params.shippingMode &&
      `Transport : ${params.shippingMode}${params.weightOrVolume ? ` (${params.weightOrVolume})` : ""}`,
    params.shippingMark && `Marquage : ${params.shippingMark}`,
    "",
    "Suivre mon colis :",
    getTrackingPageUrl(params.trackingNumber),
    "",
    REPLY_HINT,
    SIGNATURE,
  ]);
}
