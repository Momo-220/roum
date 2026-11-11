/**
 * Ticket de caisse d'une commande Roum Boutique : bande de papier étroite, bords dentelés,
 * texte à chasse fixe, code-barres de la référence. Même moteur que les reçus Roum Transit.
 */

import type { ShopOrder, ShopOrderStatus } from "@/shared/shop";
import { assemblePdf, createPdfPage, formatFcfa, textWidth, wrap, type PdfImage, type PdfLink } from "./pdfCore";

type Page = ReturnType<typeof createPdfPage>;

const PAGE_W = 252;
const PAPER_X = 12;
const PAPER_W = PAGE_W - PAPER_X * 2;
const LEFT = 26;
const RIGHT = PAGE_W - 26;
const WIDTH = RIGHT - LEFT;

const BG = "#EFE8DE";
const PAPER = "#FFFFFF";
const SHADOW = "#E2D7C8";
const INK = "#2A1E17";
const MUTED = "#857667";
const DASH = "#C9BBA9";

const STATUS: Record<ShopOrderStatus, { title: string; label: string; bg: string; color: string }> = {
  AWAITING_PAYMENT: { title: "BON DE COMMANDE", label: "En attente de paiement", bg: "#F3EBDF", color: "#6B5844" },
  PROOF_SENT: { title: "BON DE COMMANDE", label: "Paiement en vérification", bg: "#F3EBDF", color: "#6B5844" },
  CONFIRMED: { title: "TICKET DE CAISSE", label: "Payé", bg: "#E6F4EA", color: "#1E7A43" },
  SHIPPED: { title: "TICKET DE CAISSE", label: "Payé · expédiée", bg: "#E6F4EA", color: "#1E7A43" },
  DELIVERED: { title: "TICKET DE CAISSE", label: "Payé · livrée", bg: "#E6F4EA", color: "#1E7A43" },
  CANCELLED: { title: "COMMANDE ANNULÉE", label: "Annulée", bg: "#FBEAEA", color: "#A12B2B" },
};

// Code 39 : 9 éléments par caractère (barre, espace, barre…), « 1 » = élément large.
const CODE39: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000", "4": "000110001",
  "5": "100110000", "6": "001110000", "7": "000100101", "8": "100100100", "9": "001100100",
  A: "100001001", B: "001001001", C: "101001000", D: "000011001", E: "100011000", F: "001011000",
  G: "000001101", H: "100001100", I: "001001100", J: "000011100", K: "100000011", L: "001000011",
  M: "101000010", N: "000010011", O: "100010010", P: "001010010", Q: "000000111", R: "100000110",
  S: "001000110", T: "000010110", U: "110000001", V: "011000001", W: "111000000", X: "010010001",
  Y: "110010000", Z: "011010000", "-": "010000101", ".": "110000100", " ": "011000100", "*": "010010100",
};

export interface ShopTicketData {
  order: ShopOrder;
  /** Numéro WhatsApp de la boutique, tel que la gérante l'a saisi. */
  supportPhone?: string;
  trackingUrl: string;
}

function formatDate(value: string): string {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("fr-FR")} ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

const amount = (value: number) => formatFcfa(value).replace(" FCFA", "");

export function buildShopTicketPdf(data: ShopTicketData, logo?: PdfImage): Uint8Array {
  const { order } = data;
  const status = STATUS[order.status];
  const draws: Array<(page: Page, y: (offset: number) => number) => void> = [];
  const links: Array<{ offset: number; height: number; url: string }> = [];
  let cursor = 0;

  const add = (draw: (page: Page, y: (offset: number) => number, at: number) => void, height: number) => {
    const at = cursor;
    draws.push((page, y) => draw(page, y, at));
    cursor += height;
  };
  const space = (height: number) => {
    cursor += height;
  };
  const center = (text: string, size: number, font: "regular" | "bold" | "mono", color = INK, spacing = 0, gapAfter = 4) =>
    add((p, y, at) => p.text(PAGE_W / 2, y(at + size), text, size, font, color, { align: "center", spacing }), size + gapAfter);
  const dashed = () =>
    add((p, y, at) => {
      for (let x = LEFT; x < RIGHT; x += 6) p.strokeLine(x, y(at + 6), Math.min(x + 3, RIGHT), y(at + 6), DASH, 0.8);
    }, 14);
  const row = (label: string, value: string, opts: { bold?: boolean; size?: number } = {}) => {
    const size = opts.size ?? 7.6;
    const valueWidth = textWidth(value, size, opts.bold ? "bold" : "mono");
    const labelLines = wrap(label, WIDTH - valueWidth - 12, size, opts.bold ? "bold" : "regular", 2);
    const height = labelLines.length * (size + 3) + 3;
    add((p, y, at) => {
      labelLines.forEach((line, index) => p.text(LEFT, y(at + size + index * (size + 3)), line, size, opts.bold ? "bold" : "regular", opts.bold ? INK : MUTED));
      p.text(RIGHT, y(at + size), value, size, opts.bold ? "bold" : "mono", INK, { align: "right" });
    }, height);
  };

  // En-tête : logo, nom, contact.
  space(30);
  const logoHeight = 46;
  add((p, y, at) => {
    if (logo) {
      const w = (logoHeight * logo.width) / logo.height;
      p.image("Logo", PAGE_W / 2 - w / 2, y(at + logoHeight), w, logoHeight);
    } else {
      p.text(PAGE_W / 2, y(at + 20), "Roum boutique", 18, "bold", INK, { align: "center" });
    }
  }, logoHeight + 10);
  center("ROUM BOUTIQUE", 7, "mono", INK, 1.6, 4);
  if (data.supportPhone) center(`WhatsApp ${data.supportPhone}`, 7, "regular", MUTED, 0, 2);
  space(6);
  dashed();

  center(status.title, 11, "bold", INK, 1.4, 8);
  row("N°", order.reference);
  row("Date", formatDate(order.createdAt));
  row("Client", order.customer.name);
  row("Téléphone", order.customer.phone);
  row("Livraison à", [order.customer.city, order.customer.country].filter(Boolean).join(", "));
  space(2);
  dashed();

  // Articles.
  for (const item of order.items) {
    const nameLines = wrap(item.productName, WIDTH, 8.4, "bold", 2);
    const variant = [item.color, item.size].filter(Boolean).join(" · ");
    add((p, y, at) => {
      nameLines.forEach((line, index) => p.text(LEFT, y(at + 8.4 + index * 11), line, 8.4, "bold", INK));
    }, nameLines.length * 11 + 1);
    if (variant) add((p, y, at) => p.text(LEFT, y(at + 7.4), variant, 7.4, "regular", MUTED), 11);
    add((p, y, at) => {
      p.text(LEFT, y(at + 7.6), `${item.quantity} x ${amount(item.unitPriceFcfa)}`, 7.6, "mono", MUTED);
      p.text(RIGHT, y(at + 7.6), amount(item.lineTotalFcfa), 7.6, "mono", INK, { align: "right" });
    }, 16);
  }
  dashed();

  row("Sous-total", amount(order.itemsFcfa));
  row(order.delivery.label, amount(order.delivery.priceFcfa));
  space(4);
  add((p, y, at) => {
    p.strokeLine(LEFT, y(at), RIGHT, y(at), INK, 0.8);
    p.strokeLine(LEFT, y(at + 2.4), RIGHT, y(at + 2.4), INK, 0.8);
  }, 10);
  add((p, y, at) => {
    p.text(LEFT, y(at + 13), "TOTAL", 13, "bold", INK, { spacing: 0.6 });
    p.text(RIGHT, y(at + 13), formatFcfa(order.totalFcfa), 13, "bold", INK, { align: "right" });
  }, 22);
  dashed();

  row("Paiement", order.paymentMethod || "Wave, Orange Money ou virement");
  add((p, y, at) => {
    p.text(LEFT, y(at + 11), "Statut", 7.6, "regular", MUTED);
    const w = textWidth(status.label, 7.6, "bold") + 18;
    p.pill(RIGHT - w, y(at + 15), w, 15, status.bg);
    p.text(RIGHT - w / 2, y(at + 10.4), status.label, 7.6, "bold", status.color, { align: "center" });
  }, 22);
  if (order.trackingNumber) row("Suivi du colis", order.trackingNumber);
  space(2);
  dashed();

  // Code-barres Code 39 de la référence.
  const code = `*${order.reference.toUpperCase().replace(/[^0-9A-Z.\- ]/g, "")}*`;
  const narrowCount = [...code].reduce((sum, char) => {
    const pattern = CODE39[char] ?? CODE39["-"]!;
    return sum + [...pattern].reduce((s, bit) => s + (bit === "1" ? 2.5 : 1), 0) + 1;
  }, 0);
  const narrow = Math.min(1.1, WIDTH / narrowCount);
  const barHeight = 36;
  add((p, y, at) => {
    let x = PAGE_W / 2 - (narrowCount * narrow) / 2;
    for (const char of code) {
      const pattern = CODE39[char] ?? CODE39["-"]!;
      [...pattern].forEach((bit, index) => {
        const w = (bit === "1" ? 2.5 : 1) * narrow;
        if (index % 2 === 0) p.fillRect(x, y(at + barHeight), w, barHeight, INK);
        x += w;
      });
      x += narrow;
    }
  }, barHeight + 6);
  center(order.reference, 8, "mono", INK, 2.2, 12);

  center("MERCI POUR VOTRE ACHAT !", 9, "bold", INK, 1, 7);
  center("Suivez votre commande en ligne :", 7, "regular", MUTED, 0, 3);
  const urlLines = wrap(data.trackingUrl, WIDTH, 6.6, "mono", 2);
  const urlAt = cursor;
  urlLines.forEach((line) => center(line, 6.6, "mono", INK, 0, 3));
  links.push({ offset: urlAt, height: cursor - urlAt, url: data.trackingUrl });
  space(22);

  // Hauteur connue : on pose le papier, ses dents, puis le contenu.
  const paperHeight = cursor;
  const pageHeight = paperHeight + 28;
  const y = (offset: number) => pageHeight - 14 - offset;
  const page = createPdfPage();
  page.fillRect(0, 0, PAGE_W, pageHeight, BG);
  page.fillRect(PAPER_X + 2, 12, PAPER_W, paperHeight, SHADOW);
  page.fillRect(PAPER_X, 14, PAPER_W, paperHeight, PAPER);
  const teeth = 8;
  for (let x = PAPER_X; x < PAPER_X + PAPER_W; x += teeth) {
    const right = Math.min(x + teeth, PAPER_X + PAPER_W);
    page.fillPoly([[x, y(0)], [right, y(0)], [(x + right) / 2, y(0) - 5]], BG);
    page.fillPoly([[x, y(paperHeight)], [right, y(paperHeight)], [(x + right) / 2, y(paperHeight) + 5]], BG);
  }
  for (const draw of draws) draw(page, y);

  const pdfLinks: PdfLink[] = links.map((l) => ({ rect: [LEFT, y(l.offset + l.height), RIGHT, y(l.offset)], url: l.url }));
  return assemblePdf(page.cmds.join("\n"), { Logo: logo }, {}, pdfLinks, { width: PAGE_W, height: pageHeight });
}

const KAUSHAN = "https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap";

/** Le logo « Roum boutique » dessiné sur fond blanc : le « Roum » d'origine et « boutique » au pinceau. */
async function boutiqueLogo(): Promise<PdfImage | undefined> {
  try {
    if (!document.querySelector(`link[href="${KAUSHAN}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = KAUSHAN;
      document.head.appendChild(link);
    }
    await Promise.race([document.fonts.load('200px "Kaushan Script"'), new Promise((r) => setTimeout(r, 1500))]);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = "/images/roum-logo-transparent.png";
    });
    const top = Math.round(img.naturalHeight * (268 / 486));
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = top + Math.round(img.naturalWidth * 0.245);
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.naturalWidth, top, 0, 0, img.naturalWidth, top);
    ctx.fillStyle = "#141010";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `${Math.round(img.naturalWidth * 0.25)}px "Kaushan Script", "Brush Script MT", cursive`;
    // La ligne de base laisse la place à la queue du « q ».
    ctx.fillText("boutique", canvas.width / 2, canvas.height - Math.round(img.naturalWidth * 0.07));
    const binary = atob(canvas.toDataURL("image/jpeg", 0.92).split(",")[1]!);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { bytes, width: canvas.width, height: canvas.height };
  } catch {
    return undefined;
  }
}

/** Télécharge le ticket de la commande sur l'appareil. */
export async function downloadShopTicket(order: ShopOrder, supportPhone?: string): Promise<void> {
  const trackingUrl = `${window.location.origin}/tracking/${encodeURIComponent(order.reference)}`;
  const bytes = buildShopTicketPdf({ order, supportPhone, trackingUrl }, await boutiqueLogo());
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ticket-ROUM-BOUTIQUE-${order.reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
