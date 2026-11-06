/**
 * Devis et reçus ROUM TRANSIT au format facture.
 *
 * Tant qu'un dossier n'a pas de numéro de suivi, le client reçoit ce document.
 * Dès que le numéro existe, il reçoit l'étiquette colis (shippingLabelPdf.ts).
 */

import {
  assemblePdf,
  createPdfPage,
  formatFcfa,
  PDF_COLORS,
  textWidth,
  truncate,
  wrap,
  type PdfImage,
} from "./pdfCore";

export interface InvoiceLine {
  title: string;
  detail?: string;
  quantity?: string | number;
  amountFcfa?: number;
  /** Affiché à la place du montant quand il n'est pas encore connu. */
  amountLabel?: string;
}

export interface InvoiceData {
  title: string;
  reference: string;
  date: string;
  companyName: string;
  supportPhone: string;
  clientName?: string;
  clientPhone?: string;
  origin: string;
  destination: string;
  weightOrVolume: string;
  shippingMark?: string;
  lines: InvoiceLine[];
  totalFcfa?: number;
  totalLabel: string;
  paymentLabel?: string;
  statusLabel?: string;
  message: string;
  cta?: string;
  ctaUrl?: string;
  whatsappUrl: string;
}

const { ink: INK, muted: MUTED, line: LINE, accent: ACCENT, accentTint: ACCENT_TINT } = PDF_COLORS;

/** Fond du document, aussi posé derrière le logo. */
export const INVOICE_BACKGROUND = "#FFFFFF";

const MARGIN = 44;
const RIGHT = 551;
const WIDTH = RIGHT - MARGIN;

export function buildInvoicePdf(data: InvoiceData, logo?: PdfImage): Uint8Array {
  const page = createPdfPage();
  const { cmds, fillRect, strokeLine, roundedRect, pill, arrow, text, fittedLogo } = page;

  fillRect(0, 0, 595, 842, INVOICE_BACKGROUND);
  fillRect(0, 828, 595, 14, ACCENT);

  // --- En-tête ---
  fittedLogo("ImLogo", logo, MARGIN, 742, 64);

  let titleSize = 30;
  while (titleSize > 16 && textWidth(data.title, titleSize, "bold") > 300) titleSize -= 1;
  text(RIGHT, 780, data.title, titleSize, "bold", ACCENT, { align: "right" });
  text(RIGHT, 761, `N° ${data.reference}`, 10, "bold", INK, { align: "right" });
  text(RIGHT, 747, data.date, 9, "regular", MUTED, { align: "right" });

  // --- Émetteur et client ---
  const infoTop = 714;
  text(MARGIN, infoTop, "ÉMIS PAR", 7, "bold", MUTED, { spacing: 0.8 });
  text(MARGIN, infoTop - 15, data.companyName, 10.5, "bold", INK);
  text(MARGIN, infoTop - 28, "Aérien · Maritime · Douane incluse", 9, "regular", MUTED);
  text(MARGIN, infoTop - 41, `WhatsApp : ${data.supportPhone}`, 9, "regular", MUTED);

  if (data.clientName) {
    const clientX = 340;
    text(clientX, infoTop, "CLIENT", 7, "bold", MUTED, { spacing: 0.8 });
    text(clientX, infoTop - 15, truncate(data.clientName, RIGHT - clientX, 10.5, "bold"), 10.5, "bold", INK);
    if (data.clientPhone) {
      text(clientX, infoTop - 28, truncate(data.clientPhone, RIGHT - clientX, 9, "regular"), 9, "regular", MUTED);
    }
  }

  // --- Trajet ---
  const routeY = 600;
  const routeHeight = 52;
  const padding = 18;
  roundedRect(MARGIN, routeY, WIDTH, routeHeight, 14, "#F6F0E6");
  const column = (WIDTH - padding * 2) / 3;
  const routeCell = (index: number, label: string, value: string, color = INK) => {
    const x = MARGIN + padding + column * index;
    text(x, routeY + 33, label, 7, "bold", MUTED, { spacing: 0.8 });
    text(x, routeY + 16, truncate(value, column - 26, 11, "bold"), 11, "bold", color);
  };
  routeCell(0, "DÉPART", data.origin);
  arrow(MARGIN + padding + column - 24, routeY + 20, 14, ACCENT);
  routeCell(1, "ARRIVÉE", data.destination, ACCENT);
  routeCell(2, "POIDS / VOLUME", data.weightOrVolume);

  // --- Lignes de la facture ---
  const quantityX = 408;
  const headerY = 562;
  pill(MARGIN, headerY, WIDTH, 24, ACCENT);
  text(MARGIN + 16, headerY + 8.5, "DÉSIGNATION", 7.5, "bold", "#FFFFFF", { spacing: 0.8 });
  text(quantityX, headerY + 8.5, "QTÉ", 7.5, "bold", "#FFFFFF", { align: "center", spacing: 0.8 });
  text(RIGHT - 16, headerY + 8.5, "MONTANT", 7.5, "bold", "#FFFFFF", { align: "right", spacing: 0.8 });

  let y = headerY - 22;
  data.lines.forEach((line) => {
    const titleLines = wrap(line.title, 300, 10.5, "bold", 2);
    const detailLines = line.detail ? wrap(line.detail, 300, 8.5, "regular", 2) : [];

    titleLines.forEach((value, index) => text(MARGIN + 16, y - index * 14, value, 10.5, "bold", INK));
    detailLines.forEach((value, index) =>
      text(MARGIN + 16, y - titleLines.length * 14 - index * 12 + 2, value, 8.5, "regular", MUTED),
    );

    if (line.quantity !== undefined && line.quantity !== "") {
      text(quantityX, y, String(line.quantity), 10.5, "regular", INK, { align: "center" });
    }

    const hasAmount = Boolean(line.amountFcfa && line.amountFcfa > 0);
    text(
      RIGHT - 16,
      y,
      hasAmount ? formatFcfa(line.amountFcfa!) : line.amountLabel || "À estimer",
      10.5,
      hasAmount ? "bold" : "regular",
      hasAmount ? INK : MUTED,
      { align: "right" },
    );

    y -= titleLines.length * 14 + detailLines.length * 12 + 10;
    strokeLine(MARGIN, y + 6, RIGHT, y + 6, LINE, 0.7);
    y -= 14;
  });

  // --- Règlement et total ---
  const summaryTop = y - 34;
  const totalWidth = 238;
  const totalX = RIGHT - totalWidth;
  const hasTotal = Boolean(data.totalFcfa && data.totalFcfa > 0);

  text(MARGIN, summaryTop + 26, "RÈGLEMENT", 7, "bold", MUTED, { spacing: 0.8 });
  const paymentLines = wrap(data.paymentLabel || "Wave · Orange Money · Virement bancaire", 230, 9.5, "regular", 2);
  paymentLines.forEach((line, index) => text(MARGIN, summaryTop + 12 - index * 13, line, 9.5, "regular", INK));

  if (data.statusLabel) {
    const status = truncate(data.statusLabel, 200, 8.5, "bold");
    const statusWidth = textWidth(status, 8.5, "bold") + 22;
    const statusY = summaryTop + 12 - paymentLines.length * 13 - 12;
    pill(MARGIN, statusY, statusWidth, 18, ACCENT_TINT);
    text(MARGIN + 11, statusY + 6, status, 8.5, "bold", ACCENT);
  }

  pill(totalX, summaryTop - 8, totalWidth, 42, ACCENT);
  text(totalX + 20, summaryTop + 9, data.totalLabel, 8, "bold", "#EADDCB", { spacing: 0.7 });
  text(RIGHT - 20, summaryTop + 7, hasTotal ? formatFcfa(data.totalFcfa!) : "Sur devis", hasTotal ? 15 : 12, "bold", "#FFFFFF", {
    align: "right",
  });
  if (hasTotal) {
    text(RIGHT - 20, summaryTop - 22, "Douane incluse", 8.5, "regular", MUTED, { align: "right" });
  }

  // --- Marquage et message ---
  let noteY = summaryTop - 56;
  if (data.shippingMark) {
    text(MARGIN, noteY, "MARQUAGE CARTON", 7, "bold", MUTED, { spacing: 0.8 });
    text(MARGIN, noteY - 15, truncate(data.shippingMark, WIDTH, 10.5, "mono"), 10.5, "mono", INK);
    noteY -= 36;
  }
  wrap(data.message, WIDTH, 9.5, "regular", 2).forEach((line, index) => {
    text(MARGIN, noteY - index * 13, line, 9.5, "regular", MUTED);
  });

  // --- Boutons cliquables, juste sous le message ---
  const links = page.actionPills(297.5, noteY - 58, { cta: data.cta, ctaUrl: data.ctaUrl, whatsappUrl: data.whatsappUrl });

  // --- Pied de page ---
  strokeLine(MARGIN, 92, RIGHT, 92, LINE, 0.8);
  text(297.5, 74, `${data.companyName} · Chine · Dubaï · Maroc · France · Côte d'Ivoire`, 8.5, "bold", INK, {
    align: "center",
  });
  text(297.5, 61, "Merci de votre confiance.", 8.5, "regular", MUTED, { align: "center" });

  return assemblePdf(cmds.join("\n"), { ImLogo: logo }, {}, links);
}
