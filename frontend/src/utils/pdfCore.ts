/**
 * Noyau d'écriture des PDF ROUM TRANSIT (étiquette colis, devis et reçus).
 *
 * Aucune dépendance : le texte reste du vrai texte, copiable, et les boutons sont de vrais liens.
 */

import { WHATSAPP_BUBBLE_PATH, WHATSAPP_LOGO_SIZE, WHATSAPP_PHONE_PATH } from "../shared/whatsapp-logo";

export interface PdfImage {
  bytes: Uint8Array;
  width: number;
  height: number;
}

export type FontName = "regular" | "bold" | "mono";

export type Point = [number, number];

export interface Shading {
  from: Point;
  to: Point;
  start: string;
  end: string;
}

export interface PdfLink {
  rect: number[];
  url: string;
}

const FONT_RESOURCES: Record<FontName, string> = { regular: "/F1", bold: "/F2", mono: "/F3" };

/** Couleurs de la marque dans les PDF : bleu pétrole, beige du logo et encre chaude. */
export const PDF_COLORS = {
  ink: "#3A2A21",
  muted: "#857667",
  line: "#E8DECF",
  accent: "#1E4D5B",
  accentTint: "#E4EDED",
  beige: "#EADDCB",
  whatsapp: "#25D366",
};

const INK = PDF_COLORS.ink;
const WHATSAPP_GREEN = PDF_COLORS.whatsapp;

const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
  556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
  260, 334, 584,
];

const HELVETICA_BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833,
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611,
  556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389,
  280, 389, 584,
];

/** Ramène le texte à l'encodage des polices PDF standard, sans perdre les accents français. */
export function toWinAnsi(input: string): string {
  const normalized = String(input ?? "")
    .replace(/[  ]/g, " ")
    .replace(/➔|→|➜/g, "->")
    .replace(/[•·]/g, "·")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/¥/g, "RMB ")
    .replace(/€/g, "EUR ");
  return Array.from(normalized, (char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code <= 255 ? char : " ";
  }).join("");
}

export function textWidth(text: string, size: number, font: FontName, spacing = 0): number {
  const clean = toWinAnsi(text).normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (font === "mono") return clean.length * size * 0.6 + clean.length * spacing;
  const widths = font === "bold" ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS;
  let total = 0;
  for (const char of clean) total += widths[char.charCodeAt(0) - 32] ?? 556;
  return (total / 1000) * size + clean.length * spacing;
}

export function truncate(text: string, maxWidth: number, size: number, font: FontName): string {
  if (textWidth(text, size, font) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && textWidth(`${cut}...`, size, font) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}...`;
}

export function wrap(text: string, maxWidth: number, size: number, font: FontName, maxLines: number): string[] {
  const lines: string[] = [];
  let current = "";
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  for (let index = 0; index < words.length; index += 1) {
    const candidate = current ? `${current} ${words[index]}` : words[index]!;
    if (textWidth(candidate, size, font) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = words[index]!;
    if (lines.length === maxLines - 1) {
      lines.push(truncate(words.slice(index).join(" "), maxWidth, size, font));
      return lines;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
}

export const round = (value: number) => Number(value.toFixed(3));

/** Couleur au format des ordres PDF : trois valeurs de 0 à 1. */
export function colorOf(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((part) => round(part / 255)).join(" ");
}

function shadingObject({ from, to, start, end }: Shading): string {
  return (
    `<< /ShadingType 2 /ColorSpace /DeviceRGB /Extend [true true] /Coords [${from[0]} ${from[1]} ${to[0]} ${to[1]}] ` +
    `/Function << /FunctionType 2 /Domain [0 1] /N 1 /C0 [${colorOf(start)}] /C1 [${colorOf(end)}] >> >>`
  );
}

/** Crée une page vierge et ses outils de dessin. Les ordres s'accumulent dans `cmds`. */
export function createPdfPage() {
  const cmds: string[] = [];

  const fillRect = (x: number, y: number, w: number, h: number, color: string) => {
    cmds.push(`${colorOf(color)} rg ${round(x)} ${round(y)} ${round(w)} ${round(h)} re f`);
  };

  const fillPoly = (points: Point[], color: string) => {
    const [first, ...rest] = points;
    cmds.push(
      `${colorOf(color)} rg ${round(first![0])} ${round(first![1])} m ${rest
        .map(([x, y]) => `${round(x)} ${round(y)} l`)
        .join(" ")} h f`,
    );
  };

  const strokeLine = (x1: number, y1: number, x2: number, y2: number, color: string, width = 0.6) => {
    cmds.push(`${width} w ${colorOf(color)} RG ${round(x1)} ${round(y1)} m ${round(x2)} ${round(y2)} l S`);
  };

  const roundedRect = (x: number, y: number, w: number, h: number, r: number, color: string) => {
    const k = r * 0.5523;
    const right = x + w;
    const top = y + h;
    cmds.push(
      [
        `${colorOf(color)} rg`,
        `${x + r} ${y} m`,
        `${right - r} ${y} l`,
        `${right - r + k} ${y} ${right} ${y + r - k} ${right} ${y + r} c`,
        `${right} ${top - r} l`,
        `${right} ${top - r + k} ${right - r + k} ${top} ${right - r} ${top} c`,
        `${x + r} ${top} l`,
        `${x + r - k} ${top} ${x} ${top - r + k} ${x} ${top - r} c`,
        `${x} ${y + r} l`,
        `${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y} c`,
        "h f",
      ].join(" "),
    );
  };

  const pillPath = (x: number, y: number, w: number, h: number) => {
    const r = h / 2;
    const k = r * 0.5523;
    const right = x + w;
    const top = y + h;
    return [
      `${round(x + r)} ${round(y)} m`,
      `${round(right - r)} ${round(y)} l`,
      `${round(right - r + k)} ${round(y)} ${round(right)} ${round(y + r - k)} ${round(right)} ${round(y + r)} c`,
      `${round(right)} ${round(y + r + k)} ${round(right - r + k)} ${round(top)} ${round(right - r)} ${round(top)} c`,
      `${round(x + r)} ${round(top)} l`,
      `${round(x + r - k)} ${round(top)} ${round(x)} ${round(y + r + k)} ${round(x)} ${round(y + r)} c`,
      `${round(x)} ${round(y + r - k)} ${round(x + r - k)} ${round(y)} ${round(x + r)} ${round(y)} c`,
      "h",
    ].join(" ");
  };

  const pill = (x: number, y: number, w: number, h: number, color: string, border?: string) => {
    if (border) cmds.push(`0.8 w ${colorOf(border)} RG`);
    cmds.push(`${colorOf(color)} rg ${pillPath(x, y, w, h)} ${border ? "B" : "f"}`);
  };

  const shade = (name: string, points: Point[]) => {
    const [first, ...rest] = points;
    cmds.push(
      `q ${round(first![0])} ${round(first![1])} m ${rest
        .map(([x, y]) => `${round(x)} ${round(y)} l`)
        .join(" ")} h W n /${name} sh Q`,
    );
  };

  const softEllipse = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    const kx = rx * 0.5523;
    const ky = ry * 0.5523;
    cmds.push(
      [
        `${colorOf(color)} rg ${round(cx - rx)} ${round(cy)} m`,
        `${round(cx - rx)} ${round(cy + ky)} ${round(cx - kx)} ${round(cy + ry)} ${round(cx)} ${round(cy + ry)} c`,
        `${round(cx + kx)} ${round(cy + ry)} ${round(cx + rx)} ${round(cy + ky)} ${round(cx + rx)} ${round(cy)} c`,
        `${round(cx + rx)} ${round(cy - ky)} ${round(cx + kx)} ${round(cy - ry)} ${round(cx)} ${round(cy - ry)} c`,
        `${round(cx - kx)} ${round(cy - ry)} ${round(cx - rx)} ${round(cy - ky)} ${round(cx - rx)} ${round(cy)} c`,
        "h f",
      ].join(" "),
    );
  };

  /** Trace le logo WhatsApp en vectoriel : il reste net à l'impression comme à l'écran. */
  const whatsappLogo = (x: number, y: number, size: number) => {
    const scale = size / WHATSAPP_LOGO_SIZE.height;
    const px = (value: number) => round(x + value * scale);
    const py = (value: number) => round(y + size - value * scale);

    const drawPath = (d: string, color: string) => {
      const tokens = d.match(/[MLCHVZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
      const ops: string[] = [];
      let index = 0;
      let cursor: Point = [0, 0];
      const next = () => Number(tokens[index++]);
      while (index < tokens.length) {
        const command = tokens[index++]!;
        if (command === "M" || command === "L") {
          cursor = [next(), next()];
          ops.push(`${px(cursor[0])} ${py(cursor[1])} ${command === "M" ? "m" : "l"}`);
        } else if (command === "H" || command === "V") {
          cursor = command === "H" ? [next(), cursor[1]] : [cursor[0], next()];
          ops.push(`${px(cursor[0])} ${py(cursor[1])} l`);
        } else if (command === "C") {
          const [a, b, c, d2, e, f] = [next(), next(), next(), next(), next(), next()];
          ops.push(`${px(a)} ${py(b)} ${px(c)} ${py(d2)} ${px(e)} ${py(f)} c`);
          cursor = [e, f];
        } else if (command === "Z") {
          ops.push("h");
        }
      }
      cmds.push(`${colorOf(color)} rg ${ops.join(" ")} f`);
    };

    drawPath(WHATSAPP_BUBBLE_PATH, WHATSAPP_GREEN);
    drawPath(WHATSAPP_PHONE_PATH, "#FFFFFF");
  };

  /** Petite flèche dessinée : les polices standard du PDF n'en ont pas. */
  const arrow = (x: number, y: number, length: number, color: string, width = 1.3) => {
    cmds.push(
      `q ${width} w 1 J 1 j ${colorOf(color)} RG ${round(x)} ${round(y)} m ${round(x + length)} ${round(y)} l S ` +
        `${round(x + length - 3)} ${round(y + 3)} m ${round(x + length)} ${round(y)} l ${round(x + length - 3)} ${round(y - 3)} l S Q`,
    );
  };

  const withAlpha = (name: "A03" | "A12" | "A30", draw: () => void) => {
    cmds.push(`q /${name} gs`);
    draw();
    cmds.push("Q");
  };

  const escapeText = (text: string) =>
    toWinAnsi(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const text = (
    x: number,
    y: number,
    value: string,
    size: number,
    font: FontName = "regular",
    color = INK,
    options: { align?: "left" | "center" | "right"; spacing?: number } = {},
  ) => {
    const spacing = options.spacing ?? 0;
    const width = textWidth(value, size, font, spacing);
    const left = options.align === "center" ? x - width / 2 : options.align === "right" ? x - width : x;
    cmds.push(
      `BT ${FONT_RESOURCES[font]} ${size} Tf ${spacing} Tc ${colorOf(color)} rg ${round(left)} ${round(y)} Td (${escapeText(value)}) Tj ET`,
    );
  };

  const image = (name: string, x: number, y: number, w: number, h: number) => {
    cmds.push(`q ${round(w)} 0 0 ${round(h)} ${round(x)} ${round(y)} cm /${name} Do Q`);
  };

  const fittedLogo = (name: string, source: PdfImage | undefined, x: number, y: number, height: number) => {
    if (source) {
      const width = (height * source.width) / source.height;
      image(name, x, y, width, height);
      return width;
    }
    text(x, y + height * 0.3, "ROUM TRANSIT", height * 0.42, "bold", INK);
    return height * 3;
  };

  /** Boutons pilule cliquables, centrés sur `centerX`. Renvoie les zones de lien. */
  const actionPills = (
    centerX: number,
    y: number,
    actions: { cta?: string; ctaUrl?: string; whatsappUrl: string },
  ): PdfLink[] => {
    const links: PdfLink[] = [];
    const height = 32;
    const gap = 10;
    const ctaWidth = actions.cta ? textWidth(actions.cta, 10.5, "bold") + 58 : 0;
    const whatsappWidth = textWidth("WhatsApp", 10.5, "bold") + 50;
    let x = centerX - (ctaWidth + whatsappWidth + (actions.cta ? gap : 0)) / 2;

    if (actions.cta && actions.ctaUrl) {
      pill(x, y, ctaWidth, height, PDF_COLORS.accent);
      text(x + 20, y + 12, actions.cta, 10.5, "bold", "#FFFFFF");
      arrow(x + ctaWidth - 31, y + 16, 12, "#FFFFFF");
      links.push({ rect: [x, y, x + ctaWidth, y + height].map(round), url: actions.ctaUrl });
      x += ctaWidth + gap;
    }

    pill(x, y, whatsappWidth, height, "#FFFFFF", PDF_COLORS.line);
    whatsappLogo(x + 8, y + 6, 20);
    text(x + 34, y + 12, "WhatsApp", 10.5, "bold", INK);
    links.push({ rect: [x, y, x + whatsappWidth, y + height].map(round), url: actions.whatsappUrl });
    return links;
  };

  return {
    cmds,
    fillRect,
    fillPoly,
    strokeLine,
    roundedRect,
    pill,
    shade,
    softEllipse,
    whatsappLogo,
    arrow,
    withAlpha,
    text,
    image,
    fittedLogo,
    actionPills,
  };
}

export function assemblePdf(
  content: string,
  images: Record<string, PdfImage | undefined>,
  shadings: Record<string, Shading>,
  links: PdfLink[],
): Uint8Array {
  const chunks: Array<string | Uint8Array> = [];
  const offsets: number[] = [];
  let size = 0;

  const write = (chunk: string | Uint8Array) => {
    chunks.push(chunk);
    size += chunk.length;
  };

  const addObject = (id: number, body: Array<string | Uint8Array>) => {
    offsets[id] = size;
    write(`${id} 0 obj\n`);
    body.forEach(write);
    write("\nendobj\n");
  };

  const imageObject = (source: PdfImage) => [
    `<< /Type /XObject /Subtype /Image /Width ${source.width} /Height ${source.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${source.bytes.length} >>\nstream\n`,
    source.bytes,
    "\nendstream",
  ];

  const escapeUrl = (url: string) => toWinAnsi(url).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  // Numérotation : 1 à 8 pour la structure, puis les images, puis un objet par lien.
  const FIRST_FREE_ID = 9;
  const imageEntries = Object.entries(images).flatMap(([name, source]) => (source ? [{ name, source }] : []));
  const imageId = (index: number) => FIRST_FREE_ID + index;
  const linkId = (index: number) => FIRST_FREE_ID + imageEntries.length + index;
  const objectCount = FIRST_FREE_ID - 1 + imageEntries.length + links.length;

  const xObjects = imageEntries.map(({ name }, index) => `/${name} ${imageId(index)} 0 R`).join(" ");
  const annots = links.map((_, index) => `${linkId(index)} 0 R`).join(" ");
  const shadingEntries = Object.entries(shadings)
    .map(([name, shading]) => `/${name} ${shadingObject(shading)}`)
    .join(" ");

  write("%PDF-1.4\n");
  addObject(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  addObject(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  addObject(3, [
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 8 0 R /Annots [${annots}] /Resources << ` +
      `/Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> /ExtGState 7 0 R /Shading << ${shadingEntries} >> /XObject << ${xObjects} >> >> >>`,
  ]);
  addObject(4, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"]);
  addObject(5, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"]);
  addObject(6, ["<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>"]);
  addObject(7, ["<< /A03 << /ca 0.03 /CA 0.03 >> /A12 << /ca 0.12 /CA 0.12 >> /A30 << /ca 0.3 /CA 0.3 >> >>"]);
  addObject(8, [`<< /Length ${content.length} >>\nstream\n`, content, "\nendstream"]);
  imageEntries.forEach(({ source }, index) => addObject(imageId(index), imageObject(source)));
  links.forEach(({ rect, url }, index) => {
    addObject(linkId(index), [
      `<< /Type /Annot /Subtype /Link /Rect [${rect.join(" ")}] /Border [0 0 0] /A << /Type /Action /S /URI /URI (${escapeUrl(url)}) >> >>`,
    ]);
  });

  const xrefStart = size;
  write(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= objectCount; id += 1) {
    write(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  write(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const bytes = new Uint8Array(size);
  let position = 0;
  for (const chunk of chunks) {
    if (typeof chunk === "string") {
      for (let index = 0; index < chunk.length; index += 1) bytes[position + index] = chunk.charCodeAt(index) & 0xff;
    } else {
      bytes.set(chunk, position);
    }
    position += chunk.length;
  }
  return bytes;
}
