import { NextRequest, NextResponse } from "next/server";

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
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
      const directImage = cleanProductImageUrl(trimmedUrl) || (trimmedUrl.startsWith("//") ? "https:" + trimmedUrl : trimmedUrl);
      return NextResponse.json({
        success: true,
        platform: "Image Produit",
        title: "Article extrait du lien",
        image: directImage,
        price: 0,
        currency: "RMB",
        minOrder: "1 pièce",
        supplier: "Fournisseur Chine",
        originalUrl: trimmedUrl,
      });
    }

    // 2. Détection de la plateforme
    let platform = "Alibaba";
    if (trimmedUrl.includes("1688.com")) platform = "1688 (Chine direct)";
    else if (trimmedUrl.includes("taobao.com") || trimmedUrl.includes("tmall.com")) platform = "Taobao";
    else if (trimmedUrl.includes("aliexpress.com")) platform = "AliExpress";
    else if (trimmedUrl.includes("made-in-china.com")) platform = "Made-in-China";
    else if (trimmedUrl.includes("alibaba.com")) platform = "Alibaba";

    // 3. Extraction par métadonnées / HTML distant (avec User-Agent Desktop Chrome pour recevoir le DOM complet)
    let title = "";
    let image = "";
    let price = 0;
    const currency = platform.includes("1688") || platform.includes("Taobao") ? "RMB" : "RMB";
    const minOrder = "1 pièce";
    const supplier = "Fournisseur Chine";

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

        // 3.3. Extraction Prix dans HTML / JSON
        const priceMatch =
          html.match(/"price"\s*:\s*"*([0-9]+(?:\.[0-9]+)?)"*/i) ||
          html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([0-9.]+)["']/i) ||
          html.match(/<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>([¥$€]?\s*[0-9.,]+)/i);

        if (priceMatch && priceMatch[1]) {
          const rawPrice = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ""));
          if (!isNaN(rawPrice) && rawPrice > 0) {
            price = rawPrice;
          }
        }
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
      title: title.length > 120 ? title.substring(0, 117) + "..." : title,
      image: proxiedImage,
      rawImage: image,
      price: price > 0 ? price : 0,
      currency,
      minOrder,
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
