import { getTrackingPageUrl } from "@/shared/whatsapp";

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
}

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

/**
 * Convertit une chaîne UTF-8 en WinAnsi (ISO-8859-1) propre pour les polices PDF standard Helvetica
 */
function toPdfSafeText(input: string): string {
  if (!input) return "";
  const normalized = input
    .replace(/[\u202F\u00A0]/g, " ")
    .replace(/➔|→|➜/g, "->")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/≈/g, "~")
    .replace(/[•·]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/¥/g, "RMB ")
    .replace(/€/g, "EUR ");

  let out = "";
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code >= 32 && code <= 255) {
      out += normalized[i];
    } else {
      out += " ";
    }
  }
  return out
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatNumberFr(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Génère un véritable fichier PDF 1.4 vectoriel officiel ROUM TRANSIT INTERNATIONAL
 * (Zéro dépendance externe, compatible tous navigateurs iOS, Android, macOS, Windows)
 */
export function generateOfficialPdfBlob(rawData: RoumReceiptData): Blob {
  const data = normalizeReceiptData(rawData);
  const hasActiveTracking = Boolean(data.trackingNumber && data.trackingNumber.trim());
  const trackingCode = hasActiveTracking ? data.trackingNumber!.trim() : data.reference;
  const trackingUrl = getTrackingPageUrl(trackingCode);
  const dateStr =
    data.createdAt ||
    new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const docTitle =
    data.documentTitle ||
    (data.optionType === "avec_fournisseur"
      ? "BORDEREAU OFFICIEL DE DOSSIER D'EXPEDITION"
      : data.optionType === "devis" || data.optionType === "devis_tarif"
      ? "CERTIFICAT DE COTATION & DEVIS TRANSIT"
      : data.optionType === "suivi" || data.optionType === "suivi_colis"
      ? "FICHE OFFICIELLE DE SUIVI LOGISTIQUE"
      : "RECU OFFICIEL DE COMMANDE & SOURCING");

  const cmds: string[] = [];

  const rectFill = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    cmds.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    cmds.push(`${x} ${y} ${w} ${h} re f`);
  };

  const rectStroke = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
    lineWidth = 0.8
  ) => {
    cmds.push(`${lineWidth} w`);
    cmds.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    cmds.push(`${x} ${y} ${w} ${h} re S`);
  };

  const line = (x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, lw = 0.6) => {
    cmds.push(`${lw} w`);
    cmds.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    cmds.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const text = (
    x: number,
    y: number,
    str: string,
    size = 10,
    bold = false,
    r = 0.11,
    g = 0.09,
    b = 0.08
  ) => {
    const font = bold ? "/F2" : "/F1";
    cmds.push("BT");
    cmds.push(`${font} ${size} Tf`);
    cmds.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    cmds.push(`${x} ${y} Td`);
    cmds.push(`(${toPdfSafeText(str)}) Tj`);
    cmds.push("ET");
  };

  // Page A4 : 595 x 842 pt
  // Fond crème léger en haut
  rectFill(0, 742, 595, 100, 0.11, 0.09, 0.08); // Bandeau Anthracite #1C1815
  rectFill(0, 738, 595, 4, 0.773, 0.635, 0.396); // Liseré Or #C5A265

  // En-tête ROUM TRANSIT INTERNATIONAL
  text(40, 800, "ROUM TRANSIT INTERNATIONAL", 18, true, 0.98, 0.97, 0.96);
  text(
    40,
    782,
    "Centrale d'Achat Chine (Alibaba / 1688) - Fret Aerien & Maritime - Dedouanement Inclus",
    9,
    false,
    0.85,
    0.82,
    0.78
  );
  text(40, 762, docTitle, 11, true, 0.773, 0.635, 0.396);
  text(400, 800, `Date : ${dateStr}`, 9, false, 0.9, 0.88, 0.85);
  text(400, 784, `Ref : ${data.reference}`, 10, true, 1, 1, 1);

  // Bloc Références & N° de Suivi Officiel
  rectFill(40, 658, 515, 64, 0.969, 0.961, 0.941); // #F7F5F0
  rectStroke(40, 658, 515, 64, 0.85, 0.82, 0.78, 0.8);

  text(
    54,
    704,
    hasActiveTracking ? "NUMERO DE SUIVI OFFICIEL" : "REFERENCE DE DOSSIER OFFICIEL",
    8,
    true,
    0.45,
    0.42,
    0.39
  );
  text(54, 686, trackingCode, 15, true, 0.11, 0.09, 0.08);
  text(
    54,
    668,
    hasActiveTracking
      ? `Lien de suivi direct : ${trackingUrl}`
      : "N de suivi attribue des confirmation du reglement par la Direction ROUM",
    8.5,
    false,
    0.145,
    0.388,
    0.922
  );

  if (data.shippingMark) {
    text(340, 704, "SHIPPING MARK (MARQUAGE CARTON)", 8, true, 0.45, 0.42, 0.39);
    text(340, 686, data.shippingMark, 11, true, 0.76, 0.25, 0.05);
  } else {
    text(360, 704, "STATUT DU DOSSIER", 8, true, 0.45, 0.42, 0.39);
    text(360, 686, data.paymentStatusLabel || "ENREGISTRE & ACTIF", 11, true, 0.086, 0.639, 0.29);
  }

  // Section 1 : Coordonnées Client & Acheminement
  text(40, 634, "1. COORDONNEES CLIENT & ITINERAIRE LOGISTIQUE", 10, true, 0.11, 0.09, 0.08);
  line(40, 628, 555, 628, 0.85, 0.82, 0.78, 0.8);

  rectFill(40, 540, 515, 80, 1, 1, 1);
  rectStroke(40, 540, 515, 80, 0.88, 0.86, 0.83, 0.7);

  text(54, 600, "Client :", 9, true, 0.45, 0.42, 0.39);
  text(135, 600, data.clientName || "Client Roum Transit", 9.5, true, 0.11, 0.09, 0.08);

  text(54, 580, "WhatsApp :", 9, true, 0.45, 0.42, 0.39);
  text(135, 580, data.clientPhone || "-", 9.5, false, 0.11, 0.09, 0.08);

  text(54, 560, "Corridor :", 9, true, 0.45, 0.42, 0.39);
  text(135, 560, `${data.originCountry || "Chine"} -> ${data.destination}`, 9.5, true, 0.11, 0.09, 0.08);

  text(310, 600, "Mode de transport :", 9, true, 0.45, 0.42, 0.39);
  text(410, 600, (data.transportMode || "Avion Express").substring(0, 28), 9.5, true, 0.11, 0.09, 0.08);

  text(310, 580, "Poids / Volume :", 9, true, 0.45, 0.42, 0.39);
  text(410, 580, data.weightOrVolume || "1 kg", 9.5, false, 0.11, 0.09, 0.08);

  text(310, 560, "Douane :", 9, true, 0.45, 0.42, 0.39);
  text(410, 560, "100% Incluse (Zero frais cache)", 9, true, 0.086, 0.639, 0.29);

  // Section 2 : Détail de la Marchandise / Article
  text(40, 514, "2. DETAIL DE L'ARTICLE & FOURNISSEUR", 10, true, 0.11, 0.09, 0.08);
  line(40, 508, 555, 508, 0.85, 0.82, 0.78, 0.8);

  rectFill(40, 405, 515, 95, 1, 1, 1);
  rectStroke(40, 405, 515, 95, 0.88, 0.86, 0.83, 0.7);

  const cleanTitle = (data.productTitle || "Marchandise generale").substring(0, 78);
  text(54, 480, "Designation :", 9, true, 0.45, 0.42, 0.39);
  text(135, 480, cleanTitle, 9.5, true, 0.11, 0.09, 0.08);

  text(54, 460, "Plateforme :", 9, true, 0.45, 0.42, 0.39);
  text(135, 460, data.productPlatform || "Alibaba / 1688 (Chine)", 9.5, false, 0.11, 0.09, 0.08);

  text(310, 460, "Quantite :", 9, true, 0.45, 0.42, 0.39);
  text(410, 460, `${data.quantity || 1} unite(s)`, 9.5, true, 0.11, 0.09, 0.08);

  if (data.unitPriceFormatted) {
    text(54, 440, "Prix unitaire :", 9, true, 0.45, 0.42, 0.39);
    text(
      135,
      440,
      `${data.unitPriceFormatted}${data.activeTierLabel ? ` (Tranche ${data.activeTierLabel})` : ""}`,
      9.5,
      true,
      0.76,
      0.25,
      0.05
    );
  } else if (data.supplierInfo) {
    text(54, 440, "Infos Usine :", 9, true, 0.45, 0.42, 0.39);
    text(135, 440, data.supplierInfo.substring(0, 65), 9.5, false, 0.11, 0.09, 0.08);
  }

  if (data.productUrl) {
    text(54, 420, "Lien article :", 9, true, 0.45, 0.42, 0.39);
    text(135, 420, data.productUrl.substring(0, 72), 8, false, 0.35, 0.35, 0.35);
  }

  // Section 3 : Récapitulatif Financier
  text(40, 380, "3. RECAPITULATIF FINANCIER & REGLEMENT", 10, true, 0.11, 0.09, 0.08);
  line(40, 374, 555, 374, 0.85, 0.82, 0.78, 0.8);

  rectFill(40, 235, 515, 130, 0.969, 0.961, 0.941);
  rectStroke(40, 235, 515, 130, 0.85, 0.82, 0.78, 0.8);

  let currentY = 342;
  if (typeof data.goodsTotalFcfa === "number" && data.goodsTotalFcfa > 0) {
    text(56, currentY, "Sous-total Achat Marchandises (Usine Chine)", 9.5, false, 0.3, 0.28, 0.26);
    text(430, currentY, `${formatNumberFr(data.goodsTotalFcfa)} FCFA`, 10, true, 0.11, 0.09, 0.08);
    currentY -= 24;
  }

  if (typeof data.shippingFeeFcfa === "number" && data.shippingFeeFcfa > 0) {
    text(56, currentY, `Frais de Transport & Dedouanement (${data.weightOrVolume})`, 9.5, false, 0.3, 0.28, 0.26);
    text(430, currentY, `${formatNumberFr(data.shippingFeeFcfa)} FCFA`, 10, true, 0.11, 0.09, 0.08);
    currentY -= 24;
  }

  line(56, currentY + 8, 539, currentY + 8, 0.8, 0.77, 0.73, 0.8);

  // Bandeau Total Général
  rectFill(52, 248, 491, 38, 0.11, 0.09, 0.08);
  text(
    66,
    263,
    data.optionType === "avec_fournisseur"
      ? "TOTAL TRANSIT ESTIMATIF (A REGLER AU RETRAIT)"
      : "MONTANT TOTAL OFFICIEL (DOUANE COMPRISE)",
    10,
    true,
    0.98,
    0.97,
    0.96
  );
  text(415, 262, `${formatNumberFr(data.totalAmountFcfa)} FCFA`, 13, true, 0.773, 0.635, 0.396);

  // Mode de paiement & Sceau Officiel
  rectFill(40, 145, 515, 72, 1, 1, 1);
  rectStroke(40, 145, 515, 72, 0.88, 0.86, 0.83, 0.7);

  text(54, 195, "Mode de reglement :", 9, true, 0.45, 0.42, 0.39);
  text(
    160,
    195,
    data.paymentMethodLabel ||
      (data.optionType === "avec_fournisseur"
        ? "Wave / Orange Money au retrait en agence"
        : "Wave Mobile Money / Orange Money / Virement Maroc"),
    9.5,
    true,
    0.11,
    0.09,
    0.08
  );

  text(54, 175, "Preuve / Quittance :", 9, true, 0.45, 0.42, 0.39);
  text(
    160,
    175,
    data.receiptAttachedName
      ? `Jointe au dossier (${data.receiptAttachedName})`
      : "Verifiee par le service financier Roum Transit",
    9,
    false,
    0.086,
    0.639,
    0.29
  );

  text(
    54,
    157,
    "Garantie : Pesee video certifiee en magasin et suivi en temps reel sur le portail officiel.",
    8.5,
    false,
    0.45,
    0.42,
    0.39
  );

  // Tampon officiel en bas à droite
  rectStroke(395, 155, 145, 50, 0.086, 0.639, 0.29, 1.4);
  text(412, 186, "ROUM TRANSIT CERTIFIE", 8.5, true, 0.086, 0.639, 0.29);
  text(422, 172, "DOSSIER OFFICIEL", 8, true, 0.086, 0.639, 0.29);
  text(416, 161, `REF: ${data.reference}`, 7.5, false, 0.086, 0.639, 0.29);

  // Pied de page
  line(40, 115, 555, 115, 0.85, 0.82, 0.78, 0.6);
  text(
    40,
    98,
    "ROUM TRANSIT INTERNATIONAL - Chine (Guangzhou / Yiwu) - Dubai - France - Maroc - Cote d'Ivoire",
    8.5,
    true,
    0.3,
    0.28,
    0.26
  );
  text(
    40,
    84,
    `Assistance WhatsApp Direction : +225 07 87 99 44 12 / +225 01 53 63 85 69 | Suivi en ligne : ${trackingUrl}`,
    8,
    false,
    0.45,
    0.42,
    0.39
  );

  const streamContent = cmds.join("\n");

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n"
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n"
  );
  objects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n"
  );
  objects.push(
    `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }

  return new Blob([bytes], { type: "application/pdf" });
}

/**
 * Télécharge directement le fichier PDF officiel sur l'appareil du client
 */
export function downloadOfficialReceiptPdf(data: RoumReceiptData): void {
  const blob = generateOfficialPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const code = (data.trackingNumber || data.reference || "DOSSIER").replace(/[^A-Za-z0-9_-]/g, "");
  a.href = url;
  a.download = `Recu-ROUM-TRANSIT-${code}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Ouvre une fenêtre d'impression A4 haute précision pour imprimer le reçu (ou l'enregistrer en PDF)
 */
export function printOfficialReceipt(rawData: RoumReceiptData): void {
  const data = normalizeReceiptData(rawData);
  const trackingCode = data.trackingNumber || data.reference;
  const trackingUrl = getTrackingPageUrl(trackingCode);
  const dateStr =
    data.createdAt ||
    new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const win = window.open("", "_blank", "width=860,height=920");
  if (!win) {
    downloadOfficialReceiptPdf(data);
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Reçu Officiel ROUM TRANSIT - ${trackingCode}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      background: #FAF8F5;
      color: #1C1815;
      padding: 28px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 760px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid #E5E0D8;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    .header {
      background: #1C1815;
      color: #FAF8F5;
      padding: 24px 28px;
      border-bottom: 4px solid #C5A265;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-sub { font-size: 12px; color: #D6CFC7; margin-top: 4px; }
    .doc-badge {
      display: inline-block;
      margin-top: 8px;
      background: rgba(197, 162, 101, 0.2);
      color: #E5C58B;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .body { padding: 26px 28px; }
    .ref-banner {
      background: #F7F5F0;
      border: 1px solid #E5E0D8;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 22px;
    }
    .ref-label { font-size: 11px; font-weight: 700; color: #716C65; text-transform: uppercase; letter-spacing: 0.05em; }
    .ref-value { font-size: 20px; font-weight: 800; color: #1C1815; font-family: ui-monospace, monospace; margin-top: 2px; }
    .track-link { font-size: 12px; color: #2563EB; text-decoration: underline; margin-top: 4px; display: inline-block; }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #716C65;
      border-bottom: 1px solid #ECE8E1;
      padding-bottom: 6px;
      margin: 18px 0 12px 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      font-size: 13.5px;
    }
    .row-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #F0ECE4; }
    .row-label { color: #716C65; font-weight: 500; }
    .row-val { color: #1C1815; font-weight: 700; text-align: right; }
    .product-box {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #FAF8F5;
      border: 1px solid #ECE8E1;
      border-radius: 14px;
      padding: 14px;
    }
    .product-box img {
      width: 76px;
      height: 76px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid #E5E0D8;
      background: #FFF;
    }
    .total-box {
      margin-top: 18px;
      background: #1C1815;
      color: #FAF8F5;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-amount { font-size: 22px; font-weight: 800; color: #E5C58B; }
    .footer {
      margin-top: 22px;
      padding-top: 14px;
      border-top: 1px solid #ECE8E1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      color: #716C65;
    }
    .stamp {
      border: 2px solid #16A34A;
      color: #16A34A;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    @media print {
      body { background: #FFF; padding: 0; }
      .sheet { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand-title">ROUM TRANSIT INTERNATIONAL</div>
        <div class="brand-sub">Centrale d'Achat Chine (Alibaba / 1688) · Fret Aérien & Maritime · Douane 100% Incluse</div>
        <span class="doc-badge">${data.documentTitle || "Reçu Officiel & Bon de Suivi"}</span>
      </div>
      <div style="text-align: right; font-size: 12px;">
        <div>Émis le : <strong>${dateStr}</strong></div>
        <div style="margin-top: 4px;">Réf : <strong>${data.reference}</strong></div>
      </div>
    </div>
    <div class="body">
      <div class="ref-banner">
        <div>
          <div class="ref-label">Numéro de Suivi Officiel</div>
          <div class="ref-value">${trackingCode}</div>
          <a class="track-link" href="${trackingUrl}">${trackingUrl}</a>
        </div>
        ${
          data.shippingMark
            ? `<div style="text-align: right;">
                <div class="ref-label">Shipping Mark (Carton)</div>
                <div class="ref-value" style="font-size: 15px; color: #C2410C;">${data.shippingMark}</div>
              </div>`
            : `<div class="stamp">✓ DOSSIER OFFICIEL ACTIF</div>`
        }
      </div>

      <div class="section-title">1. Coordonnées Client & Acheminement</div>
      <div class="grid-2">
        <div class="row-item"><span class="row-label">Client</span><span class="row-val">${data.clientName}</span></div>
        <div class="row-item"><span class="row-label">WhatsApp</span><span class="row-val">${data.clientPhone}</span></div>
        <div class="row-item"><span class="row-label">Itinéraire</span><span class="row-val">${data.originCountry} ➔ ${data.destination}</span></div>
        <div class="row-item"><span class="row-label">Mode de transport</span><span class="row-val">${data.transportMode} (${data.weightOrVolume})</span></div>
      </div>

      <div class="section-title">2. Détails de la Marchandise</div>
      <div class="product-box">
        ${data.productImage ? `<img src="${data.productImage}" alt="Article" />` : ""}
        <div style="flex: 1;">
          <div style="font-weight: 800; font-size: 15px; margin-bottom: 4px;">${data.productTitle}</div>
          <div style="font-size: 12.5px; color: #524B43;">
            Quantité : <strong>${data.quantity || 1}</strong>
            ${data.unitPriceFormatted ? ` · Prix unitaire : <strong>${data.unitPriceFormatted}</strong>` : ""}
            ${data.activeTierLabel ? ` (Tranche : ${data.activeTierLabel})` : ""}
          </div>
          ${data.supplierInfo ? `<div style="font-size: 12px; color: #716C65; margin-top: 3px;">${data.supplierInfo}</div>` : ""}
        </div>
      </div>

      <div class="section-title">3. Récapitulatif Financier (FCFA)</div>
      <div>
        ${
          data.goodsTotalFcfa && data.goodsTotalFcfa > 0
            ? `<div class="row-item"><span class="row-label">Sous-total Marchandises (Usine Chine)</span><span class="row-val">${formatNumberFr(data.goodsTotalFcfa)} FCFA</span></div>`
            : ""
        }
        ${
          data.shippingFeeFcfa && data.shippingFeeFcfa > 0
            ? `<div class="row-item"><span class="row-label">Frais de Transport & Dédouanement (${data.weightOrVolume})</span><span class="row-val">${formatNumberFr(data.shippingFeeFcfa)} FCFA</span></div>`
            : ""
        }
        <div class="row-item"><span class="row-label">Mode de règlement</span><span class="row-val">${data.paymentMethodLabel || "Wave / Orange Money / Virement"}</span></div>
      </div>

      <div class="total-box">
        <div>
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #D6CFC7;">
            ${data.optionType === "avec_fournisseur" ? "Total Transit Estimé (Douane Comprise)" : "Total Général à Régler (Douane Comprise)"}
          </div>
          <div style="font-size: 11px; color: #A39D93; margin-top: 2px;">Aucun frais caché à l'arrivée</div>
        </div>
        <div class="total-amount">${formatNumberFr(data.totalAmountFcfa)} FCFA</div>
      </div>

      <div class="footer">
        <div>
          <strong>ROUM TRANSIT INTERNATIONAL</strong> · Assistance WhatsApp : +225 07 87 99 44 12
        </div>
        <div class="stamp">CERTIFIÉ ROUM TRANSIT</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

/**
 * Construit le message WhatsApp courtois, structuré et complet permettant au client
 * d'envoyer son reçu officiel + lien de suivi cliquable directement à l'agence ROUM TRANSIT
 */
export function buildClientReceiptWhatsAppUrl(
  rawData: RoumReceiptData,
  agencyPhone = "2250787994412"
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
    `• Client : ${data.clientName} (${data.clientPhone})`,
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

