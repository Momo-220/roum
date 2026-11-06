import { getTrackingPageUrl } from "@/shared/whatsapp";
import { buildInvoicePdf, INVOICE_BACKGROUND, type InvoiceData, type InvoiceLine } from "./invoicePdf";
import { buildShippingLabelPdf, PAGE_BACKGROUND, type PdfImage, type ShippingLabelData } from "./shippingLabelPdf";

export interface RoumReceiptData {
  documentTitle?: string;
  receiptTitle?: string;
  reference: string;
  trackingNumber?: string;
  shippingMark?: string;
  createdAt?: string;
  date?: string;
  clientName: string;
  clientPhone: string;
  originCountry?: string;
  origin?: string;
  destination: string;
  transportMode: string;
  weightOrVolume: string;
  optionType:
    | "sans_fournisseur"
    | "avec_fournisseur"
    | "devis"
    | "devis_tarif"
    | "envoi_colis"
    | "suivi"
    | "suivi_colis";
  productTitle?: string;
  productPlatform?: string;
  productUrl?: string;
  productImage?: string;
  quantity?: number | string;
  unitPriceFormatted?: string;
  unitPriceLabel?: string;
  activeTierLabel?: string;
  supplierInfo?: string;
  paidToSupplierLabel?: string;
  supplierContact?: string;
  goodsTotalFcfa?: number;
  shippingFeeFcfa?: number;
  totalAmountFcfa?: number;
  grandTotalFcfa?: number;
  paymentMethodLabel?: string;
  paymentStatusLabel?: string;
  receiptAttachedName?: string;
  /** Numéro WhatsApp configuré par l'administration. */
  supportPhone?: string;
  /** Nom de l'entreprise configuré par l'administration. */
  companyName?: string;
}

const DEFAULT_SUPPORT_PHONE = "+225 01 53 63 85 69";

function normalizeReceiptData(raw: RoumReceiptData) {
  return {
    ...raw,
    documentTitle: raw.documentTitle || raw.receiptTitle,
    createdAt: raw.createdAt || raw.date,
    originCountry: raw.originCountry || raw.origin || "Chine",
    productTitle: raw.productTitle || "Marchandises & Colis",
    unitPriceFormatted: raw.unitPriceFormatted || raw.unitPriceLabel,
    supplierInfo:
      raw.supplierInfo ||
      [
        raw.paidToSupplierLabel ? `Réglé usine: ${raw.paidToSupplierLabel}` : null,
        raw.supplierContact ? `Contact: ${raw.supplierContact}` : null,
      ]
        .filter(Boolean)
        .join(" · ") ||
      undefined,
    totalAmountFcfa:
      typeof raw.totalAmountFcfa === "number"
        ? raw.totalAmountFcfa
        : typeof raw.grandTotalFcfa === "number"
        ? raw.grandTotalFcfa
        : raw.shippingFeeFcfa || 0,
  };
}

function formatNumberFr(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const LOGO_SOURCE = "/images/roum-logo-transparent.png";
const logoCache = new Map<string, Promise<PdfImage | undefined>>();

/** Pose le logo sur la couleur de son fond : le format JPEG du PDF ne gère pas la transparence. */
function loadLogo(background: string): Promise<PdfImage | undefined> {
  const cached = logoCache.get(background);
  if (cached) return cached;

  const pending = new Promise<PdfImage | undefined>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(undefined);
        return;
      }
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const binary = atob(canvas.toDataURL("image/jpeg", 0.92).split(",")[1]!);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      resolve({ bytes, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => resolve(undefined);
    img.src = LOGO_SOURCE;
  });

  logoCache.set(background, pending);
  return pending;
}

function supportWhatsAppUrl(supportPhone: string, code: string): string {
  const message = `Bonjour ROUM TRANSIT, j'ai une question sur mon dossier ${code}.`;
  return `https://wa.me/${supportPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

function defaultDate(): string {
  return new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Étiquette colis : uniquement quand le dossier a un numéro de suivi. */
function toLabelData(raw: RoumReceiptData, tracking: string): ShippingLabelData {
  const data = normalizeReceiptData(raw);
  const supportPhone = data.supportPhone || DEFAULT_SUPPORT_PHONE;

  return {
    kicker: "ÉTIQUETTE D'EXPÉDITION",
    codeLabel: "NUMÉRO DE SUIVI",
    trackingCta: "Suivre mon colis",
    headline: "Votre colis est entre de bonnes mains.",
    message: "Merci de votre confiance. Votre numéro suffit pour suivre votre colis à tout moment.",
    date: data.createdAt || defaultDate(),
    reference: data.reference,
    code: tracking,
    trackingUrl: getTrackingPageUrl(tracking),
    whatsappUrl: supportWhatsAppUrl(supportPhone, tracking),
    origin: data.originCountry || "Chine",
    destination: data.destination,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    transportMode: data.transportMode,
    weightOrVolume: data.weightOrVolume,
    shippingMark: data.shippingMark,
    productTitle: data.productTitle,
    quantity: data.quantity,
    paymentLabel: data.paymentMethodLabel,
    goodsFcfa: data.goodsTotalFcfa,
    shippingFcfa: data.shippingFeeFcfa,
    totalFcfa: data.totalAmountFcfa,
    statusLabel: data.paymentStatusLabel,
    supportPhone,
    companyName: data.companyName || "ROUM TRANSIT INTERNATIONAL",
  };
}

/** Format facture : devis, demande et reçus, tant qu'il n'y a pas de numéro de suivi. */
function toInvoiceData(raw: RoumReceiptData): InvoiceData {
  const data = normalizeReceiptData(raw);
  const supportPhone = data.supportPhone || DEFAULT_SUPPORT_PHONE;
  const isTariffQuote = data.optionType === "devis_tarif";
  const isQuote = isTariffQuote || data.optionType === "devis";
  const isParcel = data.optionType === "envoi_colis";

  const copy = isQuote
    ? {
        title: "DEVIS",
        totalLabel: "TOTAL ESTIMÉ",
        message: "Ce montant est une estimation : le poids réel est confirmé à la réception du colis.",
      }
    : isParcel
    ? {
        title: "DEMANDE DE DEVIS",
        totalLabel: "TOTAL",
        message: "Nous vérifions le poids de votre colis et vous envoyons votre devis sur WhatsApp.",
      }
    : {
        title: data.receiptAttachedName ? "REÇU DE PAIEMENT" : "REÇU DE COMMANDE",
        totalLabel: "TOTAL",
        message: "Votre numéro de suivi vous sera envoyé dès la confirmation de votre règlement.",
      };

  const lines: InvoiceLine[] = [];
  if (raw.productTitle) {
    lines.push({
      title: raw.productTitle,
      detail: [data.unitPriceFormatted, data.activeTierLabel, data.supplierInfo].filter(Boolean).join(" · ") || undefined,
      quantity: data.quantity,
      amountFcfa: data.goodsTotalFcfa,
      amountLabel: isParcel ? "—" : "À estimer",
    });
  }
  lines.push({
    title: "Transport et dédouanement",
    detail: data.transportMode,
    quantity: 1,
    amountFcfa: data.shippingFeeFcfa,
  });

  return {
    ...copy,
    reference: data.reference,
    date: data.createdAt || defaultDate(),
    companyName: data.companyName || "ROUM TRANSIT INTERNATIONAL",
    supportPhone,
    clientName: data.clientName || undefined,
    clientPhone: data.clientPhone || undefined,
    origin: data.originCountry || "Chine",
    destination: data.destination,
    weightOrVolume: data.weightOrVolume,
    shippingMark: data.shippingMark,
    lines,
    totalFcfa: data.totalAmountFcfa,
    paymentLabel: data.paymentMethodLabel,
    statusLabel: data.paymentStatusLabel,
    // Un devis calculé sur la page Tarifs n'est pas enregistré : il n'a pas encore de dossier à ouvrir.
    cta: isTariffQuote ? undefined : "Voir mon dossier",
    ctaUrl: isTariffQuote ? undefined : getTrackingPageUrl(data.reference),
    whatsappUrl: supportWhatsAppUrl(supportPhone, data.reference),
  };
}

/** Avec un numéro de suivi : étiquette colis. Sans numéro : devis ou reçu au format facture. */
export async function generateOfficialPdfBlob(rawData: RoumReceiptData): Promise<Blob> {
  const tracking = rawData.trackingNumber?.trim();
  let bytes: Uint8Array;

  if (tracking) {
    const [onPage, onLabel] = await Promise.all([loadLogo(PAGE_BACKGROUND), loadLogo("#FFFFFF")]);
    bytes = buildShippingLabelPdf(toLabelData(rawData, tracking), { onPage, onLabel });
  } else {
    bytes = buildInvoicePdf(toInvoiceData(rawData), await loadLogo(INVOICE_BACKGROUND));
  }

  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

function pdfFileName(data: RoumReceiptData): string {
  const code = (data.trackingNumber || data.reference || "DOSSIER").replace(/[^A-Za-z0-9_-]/g, "");
  if (data.trackingNumber?.trim()) return `Etiquette-ROUM-TRANSIT-${code}.pdf`;
  const isQuote = data.optionType === "devis" || data.optionType === "devis_tarif";
  return `${isQuote ? "Devis" : "Recu"}-ROUM-TRANSIT-${code}.pdf`;
}

/**
 * Télécharge le PDF du dossier sur l'appareil du client.
 */
export async function downloadOfficialReceiptPdf(data: RoumReceiptData): Promise<void> {
  const blob = await generateOfficialPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFileName(data);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Ouvre le PDF du dossier dans un nouvel onglet, prêt à être imprimé.
 * L'onglet est ouvert tout de suite : après une attente, le navigateur le bloquerait.
 */
export async function printOfficialReceipt(rawData: RoumReceiptData): Promise<void> {
  const win = window.open("", "_blank");
  if (!win) {
    await downloadOfficialReceiptPdf(rawData);
    return;
  }
  const blob = await generateOfficialPdfBlob(rawData);
  win.location.href = URL.createObjectURL(blob);
}

/**
 * Construit le message WhatsApp courtois, structuré et complet permettant au client
 * d'envoyer son reçu officiel + lien de suivi cliquable directement à l'agence ROUM TRANSIT
 */
export function buildClientReceiptWhatsAppUrl(
  rawData: RoumReceiptData,
  agencyPhone = "2250153638569"
): string {
  const data = normalizeReceiptData(rawData);
  const hasActiveTracking = Boolean(data.trackingNumber && data.trackingNumber.trim());
  const trackingCode = (data.trackingNumber || data.reference || "").trim();
  const trackingUrl = getTrackingPageUrl(trackingCode);
  const cleanPhone = agencyPhone.replace(/[^0-9]/g, "");

  const headerTitle =
    data.optionType === "avec_fournisseur"
      ? `*FICHE DE DOSSIER D'EXPÉDITION N° ${data.reference}*`
      : data.optionType === "devis" || data.optionType === "devis_tarif"
      ? `*CONFIRMATION DE DEVIS TRANSIT N° ${data.reference}*`
      : data.optionType === "suivi" || data.optionType === "suivi_colis"
      ? `*DEMANDE D'ASSISTANCE SUIVI COLIS N° ${trackingCode}*`
      : data.optionType === "envoi_colis"
      ? `*DEMANDE D'ENVOI DE COLIS — DOSSIER N° ${data.reference}*`
      : data.receiptAttachedName
      ? `*CONFIRMATION DE PAIEMENT & PREUVE JOINTE — DOSSIER N° ${data.reference}*`
      : `*DEMANDE DE COMMANDE & DEVIS POIDS — DOSSIER N° ${data.reference}*`;

  const lines = [
    `Bonjour l'équipe *ROUM TRANSIT INTERNATIONAL*,`,
    `Je vous transmets le récapitulatif officiel de mon dossier enregistré sur votre plateforme :`,
    ``,
    headerTitle,
    `• Référence Dossier : *${data.reference}*`,
    hasActiveTracking ? `• N° de Suivi Officiel : *${data.trackingNumber}*` : null,
    data.shippingMark ? `• Shipping Mark : *${data.shippingMark}*` : null,
    data.clientName ? `• Client : ${data.clientName} (${data.clientPhone})` : null,
    `• Corridor : ${data.originCountry || "Chine"} ➔ ${data.destination}`,
    `• Mode de transport choisi : ${data.transportMode}${data.weightOrVolume ? ` (${data.weightOrVolume})` : ""}`,
    ``,
    `*DÉTAILS DE LA MARCHANDISE :*`,
    `• Article : ${data.productTitle}`,
    data.quantity ? `• Quantité : ${data.quantity} unité(s)` : null,
    data.unitPriceFormatted
      ? `• Prix unitaire fournisseur : ${data.unitPriceFormatted}${data.activeTierLabel ? ` (Tranche ${data.activeTierLabel})` : ""}`
      : null,
    data.supplierInfo ? `• Infos fournisseur : ${data.supplierInfo}` : null,
    data.productUrl ? `• Lien article : ${data.productUrl}` : null,
    ``,
    `*RÉCAPITULATIF FINANCIER :*`,
    data.goodsTotalFcfa && data.goodsTotalFcfa > 0
      ? `• Sous-total Marchandises : ${formatNumberFr(data.goodsTotalFcfa)} FCFA`
      : null,
    data.shippingFeeFcfa && data.shippingFeeFcfa > 0
      ? `• Fret & Douane : ${formatNumberFr(data.shippingFeeFcfa)} FCFA`
      : `• Fret & Douane : À estimer par ROUM TRANSIT selon le poids réel du colis`,
    data.totalAmountFcfa && data.totalAmountFcfa > 0
      ? `• *${data.shippingFeeFcfa && data.shippingFeeFcfa > 0 ? "TOTAL À RÉGLER" : "SOUS-TOTAL MARCHANDISE"} : ${formatNumberFr(data.totalAmountFcfa)} FCFA*`
      : null,
    data.paymentMethodLabel ? `• Moyen de paiement : ${data.paymentMethodLabel}` : null,
    data.receiptAttachedName ? `• Preuve de paiement jointe : Oui (${data.receiptAttachedName})` : null,
    ...(hasActiveTracking
      ? [
          ``,
          `*Lien direct de suivi du colis (${trackingCode}) :*`,
          `${trackingUrl}`,
        ]
      : []),
    ``,
    data.receiptAttachedName
      ? `J'ai joint ma preuve de paiement sur la plateforme. Merci de confirmer l'encaissement et de m'envoyer mon Numéro de Suivi Officiel. Cordialement !`
      : hasActiveTracking
      ? `Merci de bien vouloir me confirmer la bonne réception de ce reçu. Cordialement !`
      : `Merci d'estimer le poids de mon colis et de m'envoyer le devis complet avec le lien de paiement. Cordialement !`,
  ].filter((l) => l !== null);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

