import { NextRequest, NextResponse } from "next/server";

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  label: string;
  price: number;
  currency: "RMB" | "USD" | "EUR" | "FCFA";
}

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&eacute;/gi, "é")
    .replace(/&egrave;/gi, "è")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&agrave;/gi, "à")
    .replace(/&acirc;/gi, "â")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&icirc;/gi, "î")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&ucirc;/gi, "û")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Nettoie et valide une URL d'image produit extraite du HTML/JSON
 * Rejette strictement les icônes UI, sprites (-tps-), logos et captchas.
 */
function cleanProductImageUrl(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let candidate = raw
    .trim()
    .replace(/\\\//g, "/")
    .replace(/\\u002[fF]/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/gi, "&")
    .replace(/^["'\\]+|["'\\]+$/g, "");

  if (candidate.startsWith("//")) {
    candidate = "https:" + candidate;
  }

  if (!/^https?:\/\//i.test(candidate) || candidate.length < 20) {
    return "";
  }

  const lower = candidate.toLowerCase();
  const forbiddenPatterns = [
    "tps-",
    "-tps-",
    "favicon",
    "logo",
    "avatar",
    "qrcode",
    "punish",
    "nocaptcha",
    "captcha",
    "loading",
    "placeholder",
    "spacer",
    "blank.",
    "pixel",
    "sprite",
    "o1cn01yymrnh1th65jnfjzu",
    "o1cn01qosgmf2alhxk0qwrf",
    ".svg",
    ".gif",
    ".ico",
  ];

  for (const pat of forbiddenPatterns) {
    if (lower.includes(pat)) return "";
  }

  // Supprimer les suffixes de redimensionnement miniature d'Alicdn (.jpg_350x350.jpg, .jpg_720x720q50.jpg_.webp, etc.)
  // sans jamais doubler l'extension .jpg
  candidate = candidate.replace(/\.(jpg|jpeg|png|webp)_[A-Za-z0-9_.-]+$/i, ".$1");
  candidate = candidate.replace(/\.(jpg|jpeg|png)\.(webp|avif)$/i, ".$1");

  return candidate;
}

/**
 * Extrait la première vraie photo d'article depuis le code source HTML/JSON de la page
 */
function extractProductImageFromHtml(html: string): string {
  const unescaped = html
    .replace(/\\\//g, "/")
    .replace(/\\u002[fF]/g, "/")
    .replace(/&amp;/gi, "&");

  // 1. Balises Meta OpenGraph / Twitter / Preload
  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["'](?:twitter:image|og:image|image)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["'](?:twitter:image|og:image|image)["']/i,
    /<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']preload["'][^>]+as=["']image["']/i,
    /<link[^>]+as=["']image["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ];

  for (const regex of metaPatterns) {
    const m = unescaped.match(regex);
    if (m && m[1]) {
      const cleaned = cleanProductImageUrl(m[1]);
      if (cleaned) return cleaned;
    }
  }

  // 2. Structures JSON-LD (schema.org Product) et window.detailData (Alibaba / 1688 / AliExpress / Taobao)
  const jsonArrayPatterns = [
    /"imagePathList"\s*:\s*\[\s*"([^"]+)"/i,
    /"imageList"\s*:\s*\[\s*"([^"]+)"/i,
    /"images"\s*:\s*\[\s*"([^"]+)"/i,
    /"image"\s*:\s*\[\s*"([^"]+)"/i,
    /"summImagePathList"\s*:\s*\[\s*"([^"]+)"/i,
  ];

  for (const regex of jsonArrayPatterns) {
    const matches = unescaped.matchAll(new RegExp(regex.source, "gi"));
    for (const m of matches) {
      if (m && m[1]) {
        const cleaned = cleanProductImageUrl(m[1]);
        if (cleaned) return cleaned;
      }
    }
  }

  const jsonFieldPatterns = [
    /"summImagePath"\s*:\s*"([^"]+)"/i,
    /"mainImage"\s*:\s*"([^"]+)"/i,
    /"originalImageUrl"\s*:\s*"([^"]+)"/i,
    /"imagePath"\s*:\s*"([^"]+)"/i,
    /"imageUrl"\s*:\s*"([^"]+)"/i,
    /"picUrl"\s*:\s*"([^"]+)"/i,
    /"itemPic"\s*:\s*"([^"]+)"/i,
    /"imgUrl"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*"([^"]+)"/i,
  ];

  for (const regex of jsonFieldPatterns) {
    const matches = unescaped.matchAll(new RegExp(regex.source, "gi"));
    for (const m of matches) {
      if (m && m[1]) {
        const cleaned = cleanProductImageUrl(m[1]);
        if (cleaned) return cleaned;
      }
    }
  }

  // 3. Recherche directe des photos marchands Alibaba (@sc04/kf/, kf/) et 1688 (img/ibank/)
  const kfMatches = unescaped.match(
    /(?:https?:)?\/\/(?:[a-z0-9-]+\.)?(?:alicdn|cbu01)\.com\/(?:@sc0[1-9]\/)?(?:kf|img\/ibank)\/[A-Za-z0-9/_-]+\.(?:jpg|jpeg|png|webp)(?:_[A-Za-z0-9_.-]+)?/gi
  );
  if (kfMatches) {
    for (const rawUrl of kfMatches) {
      const cleaned = cleanProductImageUrl(rawUrl);
      if (cleaned) return cleaned;
    }
  }

  // 4. Recherche des photos produits Taobao / Tmall / Alibaba (bao/uploaded, imgextra)
  const baoMatches = unescaped.match(
    /(?:https?:)?\/\/(?:[a-z0-9-]+\.)?(?:alicdn|taobaocdn)\.com\/(?:bao\/uploaded|imgextra)\/[A-Za-z0-9/_-]+\.(?:jpg|jpeg|png|webp)(?:_[A-Za-z0-9_.-]+)?/gi
  );
  if (baoMatches) {
    for (const rawUrl of baoMatches) {
      const cleaned = cleanProductImageUrl(rawUrl);
      if (cleaned) return cleaned;
    }
  }

  // 5. Made-in-China ou autres plateformes e-commerce
  const micMatches = unescaped.match(
    /(?:https?:)?\/\/image\.made-in-china\.com\/[A-Za-z0-9/_-]+\.(?:jpg|jpeg|png|webp)/gi
  );
  if (micMatches) {
    for (const rawUrl of micMatches) {
      const cleaned = cleanProductImageUrl(rawUrl);
      if (cleaned) return cleaned;
    }
  }

  return "";
}

function parseNumericPrice(raw: string | number | undefined): number {
  if (typeof raw === "number") return isNaN(raw) ? 0 : raw;
  if (!raw || typeof raw !== "string") return 0;
  // Gérer les formats "1,302.26" ou "1 302,26" ou "4500.00"
  let cleaned = raw.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return 0;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      // Format européen 1.302,26
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Format US 1,302.26
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts[parts.length - 1].length === 2) {
      cleaned = cleaned.replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? 0 : num;
}

/**
 * Extrait la vraie devise et les vraies tranches de prix B2B (MOQ / paliers de quantité)
 * depuis le HTML/JSON Alibaba, 1688, Taobao, AliExpress et Made-in-China.
 * ZÉRO faux rabais inventé : seuls les prix réels de la page fournisseur sont retournés.
 */
function extractPricingAndTiersFromHtml(
  html: string,
  isChineseDomestic: boolean
): {
  price: number;
  currency: "RMB" | "USD" | "EUR" | "FCFA";
  minOrder: string;
  priceTiers: PriceTier[];
} {
  // Devise par défaut selon la plateforme :
  // - 1688 / Taobao / Tmall (marché domestique chinois) = RMB (¥)
  // - Alibaba.com / AliExpress / Made-in-China (international) = USD ($)
  let detectedCurrency: "RMB" | "USD" | "EUR" | "FCFA" = isChineseDomestic ? "RMB" : "USD";

  // 1. Détection de la devise réelle dans JSON-LD / Meta / detailData
  const currencyMatch =
    html.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/i) ||
    html.match(/<meta[^>]+property=["'](?:product|og):price:currency["'][^>]+content=["']([A-Z]{3})["']/i) ||
    html.match(/"currencyCode"\s*:\s*"([A-Z]{3})"/i);

  if (currencyMatch && currencyMatch[1]) {
    const code = currencyMatch[1].toUpperCase();
    if (code === "CNY" || code === "RMB") detectedCurrency = "RMB";
    else if (code === "EUR") detectedCurrency = "EUR";
    else if (code === "USD") detectedCurrency = "USD";
    else if (code === "XOF" || code === "XAF" || code === "CFA") detectedCurrency = "FCFA";
  }

  const rawTiers: Array<{ minQty: number; maxQty: number | null; price: number }> = [];
  let usedDollarPrice = false;

  // 2. Paliers officiels Alibaba dans window.detailData (productLadderPrices / ladderPrices / priceRangeList)
  const ladderBlocks = [
    ...Array.from(html.matchAll(/"(?:productLadderPrices|ladderPrices|ladderPrice|priceRangeList|skuPriceList)"\s*:\s*\[([\s\S]*?)\]/gi)).map((m) => m[1]),
  ];
  const ladderSearchSource = ladderBlocks.length > 0 ? ladderBlocks.join("\n") : html;

  // 2.a. Paliers avec "dollarPrice" (toujours en USD sur Alibaba.com)
  const dollarLadderRegex =
    /\{[^{}]*?"(?:min|minQuantity|minAmount|startQuantity|minOrderQuantity)"\s*:\s*"?(\d+)"?[^{}]*?(?:"(?:max|maxQuantity|maxAmount|endQuantity)"\s*:\s*"?(-?\d+)"?[^{}]*?)?"dollarPrice"\s*:\s*"?([0-9.,]+)"?[^{}]*?\}/gi;
  for (const m of ladderSearchSource.matchAll(dollarLadderRegex)) {
    const minQ = parseInt(m[1], 10);
    const maxQ = m[2] ? parseInt(m[2], 10) : null;
    const p = parseNumericPrice(m[3]);
    if (minQ > 0 && p > 0) {
      usedDollarPrice = true;
      rawTiers.push({
        minQty: minQ,
        maxQty: maxQ && maxQ >= minQ ? maxQ : null,
        price: p,
      });
    }
  }

  // Inverse : "dollarPrice" avant "min"
  if (rawTiers.length === 0) {
    const revDollarLadderRegex =
      /\{[^{}]*?"dollarPrice"\s*:\s*"?([0-9.,]+)"?[^{}]*?"(?:min|minQuantity|minAmount|startQuantity|minOrderQuantity)"\s*:\s*"?(\d+)"?(?:[^{}]*?"(?:max|maxQuantity|maxAmount|endQuantity)"\s*:\s*"?(-?\d+)"?)?[^{}]*?\}/gi;
    for (const m of ladderSearchSource.matchAll(revDollarLadderRegex)) {
      const p = parseNumericPrice(m[1]);
      const minQ = parseInt(m[2], 10);
      const maxQ = m[3] ? parseInt(m[3], 10) : null;
      if (minQ > 0 && p > 0) {
        usedDollarPrice = true;
        rawTiers.push({
          minQty: minQ,
          maxQty: maxQ && maxQ >= minQ ? maxQ : null,
          price: p,
        });
      }
    }
  }

  // 2.b. Paliers avec clés explicites de quantité (minQuantity / startQuantity / minOrderQuantity, ou min+max dans un bloc ladder)
  if (rawTiers.length === 0) {
    const explicitTierRegex =
      ladderBlocks.length > 0
        ? /\{[^{}]*?"(?:minQuantity|minAmount|startQuantity|minOrderQuantity|min)"\s*:\s*"?(\d+)"?[^{}]*?(?:"(?:maxQuantity|maxAmount|endQuantity|max)"\s*:\s*"?(-?\d+)"?[^{}]*?)?"(?:price|discountPrice|originalPrice)"\s*:\s*"?([0-9.,]+)"?[^{}]*?\}/gi
        : /\{[^{}]*?"(?:minQuantity|minAmount|startQuantity|minOrderQuantity)"\s*:\s*"?(\d+)"?[^{}]*?(?:"(?:maxQuantity|maxAmount|endQuantity|max)"\s*:\s*"?(-?\d+)"?[^{}]*?)?"(?:price|discountPrice|originalPrice)"\s*:\s*"?([0-9.,]+)"?[^{}]*?\}/gi;

    for (const m of ladderSearchSource.matchAll(explicitTierRegex)) {
      const minQ = parseInt(m[1], 10);
      const maxQ = m[2] ? parseInt(m[2], 10) : null;
      const p = parseNumericPrice(m[3]);
      if (minQ > 0 && p > 0) {
        rawTiers.push({
          minQty: minQ,
          maxQty: maxQ && maxQ >= minQ ? maxQ : null,
          price: p,
        });
      }
    }
  }

  if (rawTiers.length === 0) {
    const reverseTierRegex =
      ladderBlocks.length > 0
        ? /\{[^{}]*?"(?:price|discountPrice|originalPrice)"\s*:\s*"?([0-9.,]+)"?[^{}]*?"(?:minQuantity|minAmount|startQuantity|minOrderQuantity|min)"\s*:\s*"?(\d+)"?(?:[^{}]*?"(?:maxQuantity|maxAmount|endQuantity|max)"\s*:\s*"?(-?\d+)"?)?[^{}]*?\}/gi
        : /\{[^{}]*?"(?:price|discountPrice|originalPrice)"\s*:\s*"?([0-9.,]+)"?[^{}]*?"(?:minQuantity|minAmount|startQuantity|minOrderQuantity)"\s*:\s*"?(\d+)"?(?:[^{}]*?"(?:maxQuantity|maxAmount|endQuantity|max)"\s*:\s*"?(-?\d+)"?)?[^{}]*?\}/gi;

    for (const m of ladderSearchSource.matchAll(reverseTierRegex)) {
      const p = parseNumericPrice(m[1]);
      const minQ = parseInt(m[2], 10);
      const maxQ = m[3] ? parseInt(m[3], 10) : null;
      if (minQ > 0 && p > 0) {
        rawTiers.push({
          minQty: minQ,
          maxQty: maxQ && maxQ >= minQ ? maxQ : null,
          price: p,
        });
      }
    }
  }

  // 3. Format 1688 : "priceRange": [[1, 45.0], [10, 42.0], [50, 39.0]]
  if (rawTiers.length === 0) {
    const rangeArrayMatch = html.match(/"priceRange"\s*:\s*\[(\s*\[[\s\S]*?\]\s*)\]/i);
    if (rangeArrayMatch && rangeArrayMatch[1]) {
      const pairRegex = /\[\s*"?(\d+)"?\s*,\s*"?([0-9.]+)"?\s*\]/g;
      const pairs: Array<{ minQty: number; price: number }> = [];
      for (const pm of rangeArrayMatch[1].matchAll(pairRegex)) {
        const minQ = parseInt(pm[1], 10);
        const p = parseNumericPrice(pm[2]);
        if (minQ > 0 && p > 0) pairs.push({ minQty: minQ, price: p });
      }
      pairs.sort((a, b) => a.minQty - b.minQty);
      for (let i = 0; i < pairs.length; i++) {
        const next = pairs[i + 1];
        rawTiers.push({
          minQty: pairs[i].minQty,
          maxQty: next ? next.minQty - 1 : null,
          price: pairs[i].price,
        });
      }
    }
  }

  // Si on a utilisé "dollarPrice", la devise est obligatoirement USD
  if (usedDollarPrice) {
    detectedCurrency = "USD";
  } else {
    // Vérifier le symbole monétaire dans formatPrice s'il est présent dans le bloc ladder
    const formatPriceMatch = ladderSearchSource.match(/"formatPrice"\s*:\s*"([^"]+)"/i);
    if (formatPriceMatch && formatPriceMatch[1]) {
      const fp = formatPriceMatch[1];
      if (/FCFA|CFA|XOF|XAF/i.test(fp)) detectedCurrency = "FCFA";
      else if (/€|EUR/i.test(fp)) detectedCurrency = "EUR";
      else if (/\$|USD/i.test(fp)) detectedCurrency = "USD";
      else if (/[¥￥]|RMB|CNY/i.test(fp)) detectedCurrency = "RMB";
    }
  }

  // 4. Extraction depuis les blocs JSON-LD (<script type="application/ld+json">) et balises Meta
  let lowPrice = 0;
  let highPrice = 0;
  let singlePrice = 0;

  const ldJsonMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldJsonMatches) {
    const block = m[1] || "";
    if (!/"(?:Product|Offer|AggregateOffer)"/i.test(block)) continue;

    const ldCurr = block.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/i);
    if (ldCurr && ldCurr[1] && !usedDollarPrice) {
      const c = ldCurr[1].toUpperCase();
      if (c === "CNY" || c === "RMB") detectedCurrency = "RMB";
      else if (c === "EUR") detectedCurrency = "EUR";
      else if (c === "USD") detectedCurrency = "USD";
      else if (c === "XOF" || c === "XAF" || c === "CFA") detectedCurrency = "FCFA";
    }

    const lp = block.match(/"lowPrice"\s*:\s*"?([0-9.,]+)"?/i);
    const hp = block.match(/"highPrice"\s*:\s*"?([0-9.,]+)"?/i);
    const sp = block.match(/"price"\s*:\s*"?([0-9.,]+)"?/i);

    if (lp && !lowPrice) lowPrice = parseNumericPrice(lp[1]);
    if (hp && !highPrice) highPrice = parseNumericPrice(hp[1]);
    if (sp && !singlePrice) singlePrice = parseNumericPrice(sp[1]);
  }

  if (!lowPrice) {
    const lowPriceMatch = html.match(/"lowPrice"\s*:\s*"?([0-9.,]+)"?/i);
    if (lowPriceMatch) lowPrice = parseNumericPrice(lowPriceMatch[1]);
  }
  if (!highPrice) {
    const highPriceMatch = html.match(/"highPrice"\s*:\s*"?([0-9.,]+)"?/i);
    if (highPriceMatch) highPrice = parseNumericPrice(highPriceMatch[1]);
  }
  if (!singlePrice) {
    const metaPriceMatch =
      html.match(/<meta[^>]+property=["'](?:product|og):price:amount["'][^>]+content=["']([0-9.,]+)["']/i) ||
      html.match(/"(?:minPrice|fobPrice|promotionPrice|skuPrice)"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/i) ||
      html.match(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/i);
    if (metaPriceMatch) singlePrice = parseNumericPrice(metaPriceMatch[1]);
  }

  // Dédoublonner et trier les paliers trouvés
  const uniqueMap = new Map<number, { minQty: number; maxQty: number | null; price: number }>();
  for (const t of rawTiers) {
    if (!uniqueMap.has(t.minQty)) {
      uniqueMap.set(t.minQty, t);
    }
  }
  let sortedTiers = Array.from(uniqueMap.values()).sort((a, b) => a.minQty - b.minQty).slice(0, 5);

  // Si on a une vraie fourchette fournisseur (lowPrice et highPrice différents sur la fiche) mais pas le tableau détaillé :
  // on affiche uniquement les 2 bornes réelles du fournisseur (sans inventer de faux paliers intermédiaires)
  if (sortedTiers.length === 0 && lowPrice > 0 && highPrice > 0 && highPrice > lowPrice) {
    sortedTiers = [
      { minQty: 1, maxQty: 1, price: highPrice },
      { minQty: 2, maxQty: null, price: lowPrice },
    ];
  } else if (sortedTiers.length === 0) {
    // Prix unique réel sur la page fournisseur : ZÉRO rabais inventé (-5%/-10% supprimés)
    const basePrice = highPrice || lowPrice || singlePrice;
    if (basePrice > 0) {
      sortedTiers = [{ minQty: 1, maxQty: null, price: basePrice }];
    }
  }

  // Compléter les maxQty manquants entre paliers consécutifs
  for (let i = 0; i < sortedTiers.length; i++) {
    if (i < sortedTiers.length - 1 && sortedTiers[i].maxQty === null) {
      sortedTiers[i].maxQty = Math.max(sortedTiers[i].minQty, sortedTiers[i + 1].minQty - 1);
    }
  }

  const formattedTiers: PriceTier[] = sortedTiers.map((t) => {
    let label = "";
    if (t.maxQty && t.maxQty > t.minQty) {
      label = `${t.minQty} – ${t.maxQty} pièces`;
    } else if (t.maxQty && t.maxQty === t.minQty) {
      label = `${t.minQty} pièce${t.minQty > 1 ? "s" : ""}`;
    } else {
      label = `≥ ${t.minQty} pièce${t.minQty > 1 ? "s" : ""}`;
    }
    return {
      minQty: t.minQty,
      maxQty: t.maxQty,
      label,
      price: t.price,
      currency: detectedCurrency,
    };
  });

  const primaryPrice =
    formattedTiers.length > 0
      ? formattedTiers[0].price
      : highPrice || lowPrice || singlePrice || 0;

  const minOrderQty = formattedTiers.length > 0 ? formattedTiers[0].minQty : 1;

  return {
    price: primaryPrice,
    currency: detectedCurrency,
    minOrder: `${minOrderQty} pièce${minOrderQty > 1 ? "s" : ""}`,
    priceTiers: formattedTiers,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    // Extraire l'URL si l'utilisateur a collé un texte de partage complet (ex: depuis l'application mobile Alibaba/1688)
    let trimmedUrl = url.trim();
    const embeddedUrlMatch = trimmedUrl.match(/https?:\/\/[^\s"'<>]+/i);
    if (embeddedUrlMatch && embeddedUrlMatch[0]) {
      trimmedUrl = embeddedUrlMatch[0];
    }

    // 1. Cas direct : l'utilisateur a collé l'adresse directe d'une image produit
    if (
      /\.(jpg|jpeg|png|webp|avif)($|\?)/i.test(trimmedUrl) ||
      trimmedUrl.includes("alicdn.com/imgextra/") ||
      trimmedUrl.includes("alicdn.com/@sc") ||
      trimmedUrl.includes("alicdn.com/kf/") ||
      trimmedUrl.includes("cbu01.alicdn.com/")
    ) {
      const directImage =
        cleanProductImageUrl(trimmedUrl) ||
        (trimmedUrl.startsWith("//") ? "https:" + trimmedUrl : trimmedUrl);
      const proxiedDirect = directImage
        ? `/api/image-proxy?url=${encodeURIComponent(directImage)}`
        : "";
      return NextResponse.json({
        success: true,
        platform: "Image Produit",
        title: "Article extrait du lien",
        image: proxiedDirect,
        rawImage: directImage,
        price: 0,
        currency: "USD",
        minOrder: "1 pièce",
        priceTiers: [],
        supplier: "Fournisseur Chine",
        originalUrl: trimmedUrl,
      });
    }

    // 2. Détection de la plateforme
    let platform = "Alibaba";
    const isChineseDomestic =
      trimmedUrl.includes("1688.com") ||
      trimmedUrl.includes("taobao.com") ||
      trimmedUrl.includes("tmall.com");

    if (trimmedUrl.includes("1688.com")) platform = "1688 (Usine Chine)";
    else if (trimmedUrl.includes("taobao.com") || trimmedUrl.includes("tmall.com")) platform = "Taobao";
    else if (trimmedUrl.includes("aliexpress.com")) platform = "AliExpress";
    else if (trimmedUrl.includes("made-in-china.com")) platform = "Made-in-China";
    else if (trimmedUrl.includes("alibaba.com")) platform = "Alibaba";

    // 3. Extraction par métadonnées / HTML distant (avec User-Agent Desktop Chrome pour recevoir le DOM complet)
    let title = "";
    let image = "";
    let price = 0;
    let currency: "RMB" | "USD" | "EUR" | "FCFA" = isChineseDomestic ? "RMB" : "USD";
    let minOrder = "1 pièce";
    let priceTiers: PriceTier[] = [];
    const supplier = "Fournisseur certifié Chine";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const resp = await fetch(trimmedUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const html = await resp.text();

        // 3.1. Extraction OpenGraph Title ou balise <title>
        const ogTitleMatch =
          html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
          html.match(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

        if (ogTitleMatch && ogTitleMatch[1]) {
          const rawTitle = decodeHtmlEntities(ogTitleMatch[1])
            .replace(/\s*-\s*Alibaba\.com.*$/i, "")
            .replace(/\s*-\s*Buy\s+.*?\s+on\s+Alibaba\.com.*$/i, "")
            .replace(/\s*-\s*1688\.com.*$/i, "")
            .replace(/\s+/g, " ")
            .trim();
          if (
            rawTitle &&
            !/not available|non disponible|captcha|robot check|page introuvable|404|login|security verification/i.test(
              rawTitle
            )
          ) {
            title = rawTitle;
          }
        }

        // 3.2. Extraction de la vraie photo de l'article depuis le HTML / JSON
        image = extractProductImageFromHtml(html);

        // 3.3. Extraction des tranches de prix (MOQ / paliers fournisseurs) et de la devise
        const pricingInfo = extractPricingAndTiersFromHtml(html, isChineseDomestic);
        price = pricingInfo.price;
        currency = pricingInfo.currency;
        minOrder = pricingInfo.minOrder;
        priceTiers = pricingInfo.priceTiers;
      }
    } catch {
      // Poursuivre vers l'extraction du titre via le slug de l'URL si le réseau expire
    }

    // 4. Titre extrait depuis le slug de l'URL si absent du HTML
    if (!title) {
      try {
        const urlObj = new URL(trimmedUrl);
        const pathSegments = urlObj.pathname.split("/").filter(Boolean);
        const lastSlug = pathSegments[pathSegments.length - 1] || "";
        const decodedSlug = decodeURIComponent(lastSlug);
        const cleanedSlug = decodeHtmlEntities(decodedSlug)
          .replace(/\.(html|htm|php|asp)/gi, "")
          .replace(/^detail-/gi, "")
          .replace(/[_-]/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b[0-9]{7,}\b/g, "")
          .replace(/\s+/g, " ")
          .trim();

        title = cleanedSlug
          ? cleanedSlug.charAt(0).toUpperCase() + cleanedSlug.slice(1)
          : `Article sélectionné sur ${platform}`;
      } catch {
        title = `Article sélectionné sur ${platform}`;
      }
    }

    title = decodeHtmlEntities(title);

    // ZÉRO fausse image de remplacement : on retourne uniquement la vraie photo extraite du lien (ou "" si absente)
    const proxiedImage = image
      ? `/api/image-proxy?url=${encodeURIComponent(image)}`
      : "";

    return NextResponse.json({
      success: true,
      platform,
      title: title.length > 140 ? title.substring(0, 137) + "..." : title,
      image: proxiedImage,
      rawImage: image,
      price: price > 0 ? price : 0,
      currency,
      minOrder,
      priceTiers,
      supplier,
      originalUrl: trimmedUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Impossible d'analyser ce lien", details: error?.message },
      { status: 500 }
    );
  }
}
