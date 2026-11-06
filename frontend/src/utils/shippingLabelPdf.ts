/**
 * Étiquette d'expédition ROUM TRANSIT au format PDF.
 *
 * Réservée aux colis qui ont un numéro de suivi : le numéro est copiable, les boutons sont cliquables
 * et le code-barres est un dessin net à toute taille. Devis et reçus passent par invoicePdf.ts.
 */

import {
  assemblePdf,
  colorOf,
  createPdfPage,
  formatFcfa,
  PDF_COLORS,
  round,
  textWidth,
  truncate,
  wrap,
  type PdfImage,
  type PdfLink,
  type Point,
  type Shading,
} from "./pdfCore";

export type { PdfImage };

export interface ShippingLabelData {
  /** Titre court du document, en haut de page. */
  kicker: string;
  date: string;
  reference: string;
  codeLabel: string;
  code: string;
  headline: string;
  message: string;
  trackingUrl: string;
  /** Texte du bouton de suivi. Sans texte, pas de bouton : un devis n'a pas encore de page de suivi. */
  trackingCta?: string;
  whatsappUrl: string;
  origin: string;
  destination: string;
  clientName?: string;
  clientPhone?: string;
  transportMode: string;
  weightOrVolume: string;
  shippingMark?: string;
  productTitle?: string;
  quantity?: string | number;
  paymentLabel?: string;
  goodsFcfa?: number;
  shippingFcfa?: number;
  totalFcfa?: number;
  statusLabel?: string;
  supportPhone: string;
  companyName: string;
}

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

/** Encode un texte en Code 128 B. Renvoie les largeurs alternées barre / espace, en modules. */
export function code128Modules(text: string): number[] {
  const values = Array.from(text)
    .map((char) => char.charCodeAt(0) - 32)
    .filter((value) => value >= 0 && value <= 94);
  const startB = 104;
  const checksum = values.reduce((sum, value, index) => sum + value * (index + 1), startB) % 103;
  const sequence = [startB, ...values, checksum, 106];
  return sequence.flatMap((value) => Array.from(CODE128_PATTERNS[value]!, Number));
}

const { ink: INK, muted: MUTED, line: LINE, accent: ACCENT, accentTint: ACCENT_TINT } = PDF_COLORS;

/** Fond de page, aussi posé derrière le logo : le JPEG du PDF ne gère pas la transparence. */
export const PAGE_BACKGROUND = "#FAF5F0";

/** Teintes du carton kraft. */
const KRAFT = {
  frontLow: "#C99D66",
  frontHigh: "#DDB988",
  topNear: "#E2BE8E",
  topFar: "#F0D9B5",
  sideNear: "#B98B58",
  sideFar: "#A0744A",
  edgeLight: "#F6E6CC",
  edgeDark: "#A97F4F",
  tapeTop: "#C9A06C",
  tapeFront: "#BC9160",
  print: "#6F4E2B",
  shadow: "#6B4A2E",
};

/** Suite pseudo-aléatoire fixe : le carton est identique à chaque téléchargement. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

export function buildShippingLabelPdf(
  data: ShippingLabelData,
  images: { onPage?: PdfImage; onLabel?: PdfImage } = {},
): Uint8Array {
  const page = createPdfPage();
  const { cmds, fillRect, fillPoly, strokeLine, roundedRect, pill, shade, softEllipse, arrow, withAlpha, text, fittedLogo } = page;

  // --- Fond et en-tête ---
  fillRect(0, 0, 595, 842, PAGE_BACKGROUND);

  fittedLogo("ImPage", images.onPage, 44, 770, 54);
  text(551, 806, data.kicker, 8.5, "bold", ACCENT, { align: "right", spacing: 0.9 });
  text(551, 792, data.date, 9, "regular", MUTED, { align: "right" });
  text(551, 779, `Réf. ${data.reference}`, 9, "bold", INK, { align: "right" });

  // --- Carton 3D : face avant, dessus et côté ---
  const front = { x: 74, y: 322, w: 372, h: 330 };
  const depth = { x: 74, y: 56 };
  const frontRight = front.x + front.w;
  const frontTop = front.y + front.h;

  const shadings: Record<string, Shading> = {
    ShFront: { from: [0, front.y], to: [0, frontTop], start: KRAFT.frontLow, end: KRAFT.frontHigh },
    ShTop: { from: [0, frontTop], to: [0, frontTop + depth.y], start: KRAFT.topNear, end: KRAFT.topFar },
    ShSide: { from: [frontRight, 0], to: [frontRight + depth.x, 0], start: KRAFT.sideNear, end: KRAFT.sideFar },
  };

  // Ombre au sol, faite de voiles superposés.
  for (let layer = 0; layer < 12; layer += 1) {
    withAlpha("A03", () => softEllipse(306, front.y + 2, 200 + layer * 3.6, 12 + layer * 1.5, "#4A3A28"));
  }

  const topA: Point = [front.x, frontTop];
  const topB: Point = [frontRight, frontTop];
  const topC: Point = [frontRight + depth.x, frontTop + depth.y];
  const topD: Point = [front.x + depth.x, frontTop + depth.y];

  shade("ShTop", [topA, topB, topC, topD]);
  shade("ShSide", [[frontRight, front.y], [frontRight + depth.x, front.y + depth.y], topC, topB]);
  shade("ShFront", [[front.x, front.y], [frontRight, front.y], topB, topA]);

  // Fibres du carton kraft, à peine visibles.
  const random = seededRandom(20261105);
  withAlpha("A30", () => {
    for (let fibre = 0; fibre < 120; fibre += 1) {
      const x = front.x + 4 + random() * (front.w - 16);
      const y = front.y + 4 + random() * (front.h - 8);
      const length = 3 + random() * 7;
      strokeLine(x, y, x + length, y + (random() - 0.5) * 1.6, random() > 0.5 ? KRAFT.edgeDark : KRAFT.edgeLight, 0.35);
    }
  });

  // Les deux rabats du dessus se rejoignent sous le ruban : le rabat droit reçoit moins de lumière.
  const tapeHalf = 30;
  const tapeCenter = front.x + front.w / 2;
  const tapeLeft = tapeCenter - tapeHalf;
  const tapeRight = tapeCenter + tapeHalf;
  withAlpha("A03", () => {
    for (let veil = 0; veil < 3; veil += 1) {
      fillPoly([[tapeRight, frontTop], topB, topC, [tapeRight + depth.x, frontTop + depth.y]], KRAFT.shadow);
    }
  });

  // Nom imprimé sur le rabat gauche, dans la perspective du dessus.
  const topScale = 0.62;
  cmds.push(`q 1 0 ${(depth.x / depth.y) * topScale} ${topScale} ${front.x + 24} ${frontTop + 15} cm`);
  text(0, 0, "ROUM TRANSIT", 14, "bold", KRAFT.tapeTop, { spacing: 1.2 });
  cmds.push("Q");

  // Épaisseur du carton sur les arêtes.
  strokeLine(topA[0], topA[1], topB[0], topB[1], KRAFT.edgeLight, 1.3);
  strokeLine(topA[0], topA[1] - 1.8, topB[0], topB[1] - 1.8, KRAFT.edgeDark, 0.5);
  strokeLine(topB[0], topB[1], topC[0], topC[1], KRAFT.edgeLight, 0.8);
  strokeLine(topB[0], topB[1], frontRight, front.y, KRAFT.edgeLight, 0.9);
  strokeLine(topB[0] + 1.6, topB[1] + 1, frontRight + 1.6, front.y + 1, KRAFT.edgeDark, 0.5);

  // Ruban adhésif qui ferme le carton et retombe sur la face avant.
  fillPoly(
    [
      [tapeLeft, frontTop],
      [tapeRight, frontTop],
      [tapeRight + depth.x, frontTop + depth.y],
      [tapeLeft + depth.x, frontTop + depth.y],
    ],
    KRAFT.tapeTop,
  );
  fillRect(tapeLeft, frontTop - 18, tapeHalf * 2, 18, KRAFT.tapeFront);
  withAlpha("A12", () => fillRect(tapeLeft, frontTop - 20, tapeHalf * 2, 2, KRAFT.shadow));
  withAlpha("A30", () => {
    fillPoly(
      [
        [tapeLeft + 8, frontTop],
        [tapeLeft + 18, frontTop],
        [tapeLeft + 18 + depth.x, frontTop + depth.y],
        [tapeLeft + 8 + depth.x, frontTop + depth.y],
      ],
      "#FFFFFF",
    );
    fillRect(tapeLeft + 8, frontTop - 18, 10, 18, "#FFFFFF");
  });

  // Côté du carton : poignée découpée et consignes imprimées, dans la perspective de la face.
  const sideScale = 0.62;
  const skew = (depth.y / depth.x) * sideScale;
  const onSide = (x: number, y: number, draw: () => void) => {
    cmds.push(`q ${sideScale} ${round(skew)} 0 1 ${x} ${y} cm`);
    draw();
    cmds.push("Q");
  };

  onSide(frontRight + 15, front.y + 248, () => {
    roundedRect(0, 0, 72, 15, 7.5, KRAFT.print);
    withAlpha("A30", () => roundedRect(0, 8, 72, 7, 3.5, "#000000"));
  });

  onSide(frontRight + 26, front.y + 66, () => {
    for (const x of [8, 26]) {
      cmds.push(
        `q 2.2 w 1 J 1 j ${colorOf(KRAFT.print)} RG ${x} 0 m ${x} 20 l S ${x - 6} 13 m ${x} 21 l ${x + 6} 13 l S Q`,
      );
    }
  });
  onSide(frontRight + 26, front.y + 44, () => text(0, 0, "FRAGILE", 11, "bold", KRAFT.print, { spacing: 1.4 }));
  onSide(frontRight + 26, front.y + 27, () => text(0, 0, "ROUM TRANSIT", 7.5, "bold", KRAFT.print, { spacing: 0.8 }));

  // --- Étiquette collée sur le carton ---
  const hasClient = Boolean(data.clientName);
  const stickerHeight = hasClient ? 284 : 272;
  const sticker = {
    x: front.x + 20,
    y: front.y + (front.h - 18 - stickerHeight) / 2,
    w: front.w - 40,
    h: stickerHeight,
  };
  const inner = { left: sticker.x + 20, right: sticker.x + sticker.w - 20 };
  const innerWidth = inner.right - inner.left;
  const stickerTop = sticker.y + sticker.h;

  withAlpha("A12", () => {
    roundedRect(sticker.x + 1.5, sticker.y - 3, sticker.w, sticker.h, 12, KRAFT.shadow);
  });
  roundedRect(sticker.x, sticker.y, sticker.w, sticker.h, 12, "#FFFFFF");

  fittedLogo("ImLabel", images.onLabel, inner.left, stickerTop - 48, 36);
  text(inner.right, stickerTop - 27, data.companyName, 8, "bold", INK, { align: "right" });
  text(inner.right, stickerTop - 38, "Aérien · Maritime · Douane incluse", 7.5, "regular", MUTED, { align: "right" });

  text(inner.left, stickerTop - 67, data.codeLabel, 7, "bold", MUTED, { spacing: 0.8 });
  let codeSize = 25;
  while (codeSize > 12 && textWidth(data.code, codeSize, "mono") > innerWidth) codeSize -= 0.5;
  text(inner.left, stickerTop - 91, data.code, codeSize, "mono", INK);

  // Code-barres scannable.
  const modules = code128Modules(data.code);
  const moduleCount = modules.reduce((sum, width) => sum + width, 0);
  const moduleWidth = innerWidth / moduleCount;
  const barTop = stickerTop - 99;
  const barHeight = 38;
  let cursor = inner.left;
  modules.forEach((width, index) => {
    const barWidth = width * moduleWidth;
    if (index % 2 === 0) fillRect(cursor, barTop - barHeight, barWidth, barHeight, INK);
    cursor += barWidth;
  });

  // Trajet, en grand : c'est ce qu'on lit en premier sur un carton.
  const routeTop = barTop - barHeight - 11;
  const columnX = inner.left + innerWidth * 0.5;
  const columnWidth = innerWidth * 0.5 - 8;

  strokeLine(inner.left, routeTop, inner.right, routeTop, LINE, 0.7);
  text(inner.left, routeTop - 14, "DE", 7, "bold", MUTED, { spacing: 0.8 });
  text(inner.left, routeTop - 29, truncate(data.origin, columnWidth - 22, 12, "bold"), 12, "bold", INK);
  arrow(columnX - 25, routeTop - 25, 15, ACCENT);
  text(columnX, routeTop - 14, "VERS", 7, "bold", MUTED, { spacing: 0.8 });
  text(columnX, routeTop - 29, truncate(data.destination, columnWidth, 12, "bold"), 12, "bold", ACCENT);

  const detailTop = routeTop - 39;
  strokeLine(inner.left, detailTop, inner.right, detailTop, LINE, 0.7);

  // Le détail entre parenthèses (« Bateau / CBM ») ne tient pas sur l'étiquette.
  const transport = data.transportMode.replace(/\s*\(.*\)/, "");

  if (hasClient) {
    text(inner.left, detailTop - 14, "DESTINATAIRE", 7, "bold", MUTED, { spacing: 0.8 });
    text(inner.left, detailTop - 27, truncate(data.clientName!, columnWidth, 10, "bold"), 10, "bold", INK);
    text(inner.left, detailTop - 39, truncate(data.clientPhone || "", columnWidth, 9, "regular"), 9, "regular", MUTED);
  } else {
    text(inner.left, detailTop - 14, "POIDS / VOLUME", 7, "bold", MUTED, { spacing: 0.8 });
    text(inner.left, detailTop - 27, truncate(data.weightOrVolume, columnWidth, 10, "bold"), 10, "bold", INK);
  }

  text(columnX, detailTop - 14, "TRANSPORT", 7, "bold", MUTED, { spacing: 0.8 });
  text(columnX, detailTop - 27, truncate(transport, columnWidth, 10, "bold"), 10, "bold", INK);
  if (hasClient) {
    text(columnX, detailTop - 39, truncate(data.weightOrVolume, columnWidth, 9, "regular"), 9, "regular", MUTED);
  }

  // Marquage à écrire sur le colis, ou article si aucun marquage n'existe.
  const markTop = detailTop - (hasClient ? 49 : 37);
  const markBottom = markTop - 40;
  roundedRect(inner.left - 8, markBottom, innerWidth + 16, 34, 8, ACCENT_TINT);
  text(inner.left + 2, markBottom + 22, data.shippingMark ? "MARQUAGE CARTON" : "CONTENU", 6.5, "bold", ACCENT, { spacing: 0.7 });
  text(
    inner.left + 2,
    markBottom + 9,
    truncate(data.shippingMark || data.productTitle || "Marchandises", innerWidth - 8, 9.5, "bold"),
    9.5,
    "bold",
    ACCENT,
  );

  // --- Message et boutons cliquables, en pilules ---
  text(297.5, 268, data.headline, 17, "bold", INK, { align: "center" });
  text(297.5, 250, data.message, 9.5, "regular", MUTED, { align: "center" });

  const links: PdfLink[] = page.actionPills(297.5, 204, {
    cta: data.trackingCta,
    ctaUrl: data.trackingUrl,
    whatsappUrl: data.whatsappUrl,
  });

  // --- Récapitulatif ---
  strokeLine(44, 180, 551, 180, LINE, 0.8);
  text(44, 164, "ARTICLE", 7, "bold", MUTED, { spacing: 0.8 });
  const titleLines = wrap(data.productTitle || "Marchandises", 215, 10, "bold", 2);
  titleLines.forEach((line, index) => text(44, 150 - index * 13, line, 10, "bold", INK));
  if (data.quantity) {
    text(44, 150 - titleLines.length * 13, `Quantité : ${data.quantity}`, 9, "regular", MUTED);
  }

  text(280, 164, "RÈGLEMENT", 7, "bold", MUTED, { spacing: 0.8 });
  const paymentLines = wrap(data.paymentLabel || "Wave · Orange Money · Virement", 135, 9, "regular", 2);
  paymentLines.forEach((line, index) => text(280, 150 - index * 12, line, 9, "regular", INK));
  if (data.goodsFcfa && data.goodsFcfa > 0) {
    text(280, 150 - paymentLines.length * 12, `Marchandises : ${formatFcfa(data.goodsFcfa)}`, 8, "regular", MUTED);
  }
  if (data.shippingFcfa && data.shippingFcfa > 0) {
    text(280, 150 - (paymentLines.length + 1) * 12, `Transport : ${formatFcfa(data.shippingFcfa)}`, 8, "regular", MUTED);
  }

  if (data.totalFcfa && data.totalFcfa > 0) {
    text(551, 164, "TOTAL", 7, "bold", MUTED, { align: "right", spacing: 0.8 });
    text(551, 142, formatFcfa(data.totalFcfa), 18, "bold", ACCENT, { align: "right" });
    text(551, 127, "Douane incluse", 8.5, "regular", MUTED, { align: "right" });
  } else if (data.statusLabel) {
    text(551, 164, "STATUT", 7, "bold", MUTED, { align: "right", spacing: 0.8 });
    const status = truncate(data.statusLabel, 130, 9, "bold");
    const statusWidth = textWidth(status, 9, "bold") + 24;
    pill(551 - statusWidth, 138, statusWidth, 20, ACCENT_TINT);
    text(551 - statusWidth / 2, 145, status, 9, "bold", ACCENT, { align: "center" });
  }

  // --- Pied de page ---
  strokeLine(44, 104, 551, 104, LINE, 0.8);
  text(297.5, 86, `${data.companyName} · Chine · Dubaï · Maroc · France · Côte d'Ivoire`, 8.5, "bold", INK, {
    align: "center",
  });
  text(297.5, 73, `Assistance WhatsApp : ${data.supportPhone}`, 8.5, "regular", MUTED, { align: "center" });

  return assemblePdf(cmds.join("\n"), { ImPage: images.onPage, ImLabel: images.onLabel }, shadings, links);
}
