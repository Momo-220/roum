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
    `*Cliquez sur votre numéro de suivi pour voir l'avancement en direct :*`,
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
    `*Cliquez ici pour suivre votre dossier en direct (${codeForTracking}) :*`,
    `${trackingUrl}`,
    ``,
    `Merci pour votre confiance. Nous restons à votre écoute pour la suite des opérations.`,
    `Cordialement,`,
    `*La Direction ROUM TRANSIT*`,
  ].filter((l) => l !== null);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Construit le lien autonome et cliquable vers la page de règlement & upload de preuve de paiement
 * d'une commande (/services/commande?pay=RM-...).
 */
export function getPaymentPageUrl(params: {
  reference: string;
  clientName?: string;
  clientPhone?: string;
  destination?: string;
  shippingMode?: string;
  weightKg?: number;
  volumeCbm?: number;
  goodsTotalFcfa?: number;
  shippingFeeFcfa?: number;
  totalAmountFcfa?: number;
  productName?: string;
  productQuantity?: string | number;
  productImage?: string;
  optionType?: string;
}): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://roum-transit.pages.dev";
  const sp = new URLSearchParams();
  sp.set("pay", (params.reference || "").trim());
  if (params.clientName) sp.set("name", params.clientName.trim());
  if (params.clientPhone) sp.set("phone", params.clientPhone.trim());
  if (params.destination) sp.set("dest", params.destination.trim());
  if (params.shippingMode) sp.set("mode", params.shippingMode.trim());
  if (typeof params.weightKg === "number" && params.weightKg > 0) sp.set("weight", String(params.weightKg));
  if (typeof params.volumeCbm === "number" && params.volumeCbm > 0) sp.set("cbm", String(params.volumeCbm));
  if (typeof params.goodsTotalFcfa === "number" && params.goodsTotalFcfa > 0) sp.set("goods", String(Math.round(params.goodsTotalFcfa)));
  if (typeof params.shippingFeeFcfa === "number" && params.shippingFeeFcfa > 0) sp.set("ship", String(Math.round(params.shippingFeeFcfa)));
  if (typeof params.totalAmountFcfa === "number" && params.totalAmountFcfa > 0) sp.set("total", String(Math.round(params.totalAmountFcfa)));
  if (params.productName) sp.set("title", params.productName.trim().substring(0, 120));
  if (params.productQuantity) sp.set("qty", String(params.productQuantity));
  if (params.productImage && !params.productImage.startsWith("data:")) {
    sp.set("img", params.productImage);
  }
  if (params.optionType) sp.set("opt", params.optionType);
  return `${origin}/services/commande?${sp.toString()}`;
}

/**
 * ÉTAPE 2 (Admin ➔ Client) :
 * Message WhatsApp courtois et détaillé envoyant le Devis Officiel (après estimation du poids par ROUM)
 * + les numéros de paiement + le LIEN DE REDIRECTION CLIQUABLE vers les moyens de paiement & preuve.
 */
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
  productImage?: string;
  optionType?: string;
}): string {
  const cleanPhone = (params.clientPhone || "").replace(/[^0-9]/g, "").replace(/^00/, "");
  const paymentUrl = getPaymentPageUrl({
    reference: params.reference,
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    destination: params.destination,
    shippingMode: params.shippingMode,
    weightKg: params.estimatedWeightKg,
    volumeCbm: params.estimatedCbm,
    goodsTotalFcfa: params.goodsTotalFcfa,
    shippingFeeFcfa: params.shippingFeeFcfa,
    totalAmountFcfa: params.totalAmountFcfa,
    productName: params.productName,
    productQuantity: params.productQuantity,
    productImage: params.productImage,
    optionType: params.optionType,
  });

  const weightLabel = params.estimatedCbm
    ? `${params.estimatedCbm} m³ (Volume estimé par ROUM)`
    : `${params.estimatedWeightKg || 1} kg (Poids estimé par ROUM)`;

  const waveNum = params.waveNumber || "+225 01 53 63 85 69";
  const orangeNum = params.orangeNumber || "#144*389278# / +225 07 48 29 11 00";
  const moroccoRib = params.moroccoRib || "230 780 0001234567890123 45";

  const lines = [
    `Bonjour ${params.clientName || "cher(e) client(e)"},`,
    ``,
    `Ici la Direction *ROUM TRANSIT INTERNATIONAL*.`,
    `Suite à l'analyse de votre commande *${params.reference}* et à l'estimation du poids de votre marchandise, voici votre *Devis Officiel* :`,
    ``,
    `*DÉTAIL DU DOSSIER :*`,
    `• Référence : *${params.reference}*`,
    params.productName ? `• Article : ${params.productName}` : null,
    params.productQuantity ? `• Quantité : ${params.productQuantity} unité(s)` : null,
    params.destination ? `• Destination : ${params.destination}` : null,
    params.shippingMode ? `• Mode d'acheminement : ${params.shippingMode}` : null,
    `• Poids / Volume estimé : *${weightLabel}*`,
    ``,
    `*DEVIS OFFICIEL À RÉGLER :*`,
    typeof params.goodsTotalFcfa === "number" && params.goodsTotalFcfa > 0
      ? `• Achat Marchandises : *${Math.round(params.goodsTotalFcfa).toLocaleString("fr-FR")} FCFA*`
      : null,
    typeof params.shippingFeeFcfa === "number" && params.shippingFeeFcfa > 0
      ? `• Transport & Douane (${weightLabel}) : *${Math.round(params.shippingFeeFcfa).toLocaleString("fr-FR")} FCFA*`
      : null,
    `• *TOTAL À PAYER : ${Math.round(params.totalAmountFcfa).toLocaleString("fr-FR")} FCFA*`,
    ``,
    `*COMPTES OFFICIELS DE RÈGLEMENT :*`,
    `• Wave Mobile Money : *${waveNum}*`,
    `• Orange Money : *${orangeNum}*`,
    `• Compte Maroc (RIB) : *${moroccoRib}*`,
    ``,
    `*Cliquez sur ce lien pour ouvrir votre moyen de paiement et joindre votre preuve de règlement :*`,
    `${paymentUrl}`,
    ``,
    `Dès confirmation de votre paiement, nous vous transmettrons votre *Numéro de Suivi Officiel* pour suivre votre colis en direct.`,
    `Cordialement,`,
    `*La Direction ROUM TRANSIT*`,
  ].filter((l) => l !== null);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * ÉTAPE 3 (Admin ➔ Client) :
 * Message WhatsApp confirmant l'encaissement du paiement et transmettant le NUMÉRO DE SUIVI CLIQUABLE
 * qui renvoie directement vers la page /tracking/[trackingNumber].
 */
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
  const cleanPhone = (params.clientPhone || "").replace(/[^0-9]/g, "").replace(/^00/, "");
  const trackingUrl = getTrackingPageUrl(params.trackingNumber);

  const lines = [
    `Bonjour ${params.clientName || "cher(e) client(e)"},`,
    ``,
    `*CONFIRMATION D'ENCAISSEMENT & ATTRIBUTION DU NUMÉRO DE SUIVI*`,
    `La Direction *ROUM TRANSIT INTERNATIONAL* vous confirme la bonne réception de votre paiement pour le dossier *${params.reference}*.`,
    ``,
    `*VOTRE EXPÉDITION EST ACTIVÉE :*`,
    `• N° de Suivi Officiel : *${params.trackingNumber}*`,
    params.shippingMark ? `• Shipping Mark : *${params.shippingMark}*` : null,
    params.productName ? `• Marchandise : ${params.productName}` : null,
    params.destination ? `• Destination : ${params.destination}` : null,
    params.shippingMode
      ? `• Acheminement : ${params.shippingMode}${params.weightOrVolume ? ` (${params.weightOrVolume})` : ""}`
      : null,
    typeof params.totalAmountFcfa === "number" && params.totalAmountFcfa > 0
      ? `• Montant encaissé : *${Math.round(params.totalAmountFcfa).toLocaleString("fr-FR")} FCFA* (Réglé)`
      : null,
    ``,
    `*Cliquez directement sur ce lien pour suivre votre colis en temps réel (${params.trackingNumber}) :*`,
    `${trackingUrl}`,
    ``,
    `Merci pour votre confiance !`,
    `*L'équipe ROUM TRANSIT INTERNATIONAL*`,
  ].filter((l) => l !== null);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
