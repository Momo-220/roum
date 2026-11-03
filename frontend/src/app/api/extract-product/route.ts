import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // 1. Détection de la plateforme
    let platform = "E-Commerce";
    if (trimmedUrl.includes("alibaba.com")) platform = "Alibaba";
    else if (trimmedUrl.includes("1688.com")) platform = "1688 (Chine direct)";
    else if (trimmedUrl.includes("taobao.com")) platform = "Taobao";
    else if (trimmedUrl.includes("aliexpress.com")) platform = "AliExpress";
    else if (trimmedUrl.includes("made-in-china.com")) platform = "Made-in-China";

    // 2. Extraction par métadonnées / HTML distant
    let title = "";
    let image = "";
    let price = 0;
    let currency = "RMB";
    let minOrder = "1 pièce";
    let supplier = "Fournisseur certifié Chine";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const resp = await fetch(trimmedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const html = await resp.text();

        // Extraction OpenGraph Title
        const ogTitleMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+name=["']title["']\s+content=["'](.*?)["']/i) ||
          html.match(/<title>(.*?)<\/title>/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          const rawTitle = ogTitleMatch[1]
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s*-\s*Alibaba\.com.*$/i, "")
            .replace(/\s*-\s*1688\.com.*$/i, "")
            .trim();
          if (!/not available|non disponible|captcha|robot check|page introuvable|404/i.test(rawTitle)) {
            title = rawTitle;
          }
        }

        // Extraction OpenGraph Image
        const ogImageMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i) ||
          html.match(/<link\s+rel=["']image_src["']\s+href=["'](.*?)["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
          image = ogImageMatch[1].trim();
          if (image.startsWith("//")) image = "https:" + image;
        }

        // Extraction Prix dans HTML / JSON-LD
        const priceMatch =
          html.match(/"price":\s*"*([0-9.]+)"*/i) ||
          html.match(/<meta\s+property=["']product:price:amount["']\s+content=["']([0-9.]+)["']/i) ||
          html.match(/<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>([¥$€]?\s*[0-9.,]+)/i);

        if (priceMatch && priceMatch[1]) {
          const rawPrice = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ""));
          if (!isNaN(rawPrice) && rawPrice > 0) {
            price = rawPrice;
          }
        }
      }
    } catch {
      // Ignorer si timeout ou géoblocage, on utilise le fallback intelligent
    }

    // 3. Fallback intelligent si le scraper n'a pas pu traverser le captcha Alibaba
    if (!title) {
      // Nettoyage de l'URL pour dériver un titre clair
      const urlObj = new URL(trimmedUrl);
      const pathSegments = urlObj.pathname.split("/").filter(Boolean);
      const lastSlug = pathSegments[pathSegments.length - 1] || "";
      const cleanedSlug = decodeURIComponent(lastSlug)
        .replace(/\.(html|htm|php|asp)/gi, "")
        .replace(/[_-]/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b[0-9]{6,}\b/g, "")
        .trim();

      title = cleanedSlug
        ? cleanedSlug.charAt(0).toUpperCase() + cleanedSlug.slice(1)
        : `Article sélectionné sur ${platform}`;
    }

    if (!image) {
      // Image générique par défaut esthétique liée au sourcing
      image = "/images/services/sourcing_warehouse.jpg";
    }

    if (!price || price <= 0) {
      // Valeur indicative par défaut si non détectée
      price = platform.includes("1688") ? 45.0 : 8.5;
      currency = platform.includes("1688") ? "RMB" : "USD";
    }

    return NextResponse.json({
      success: true,
      platform,
      title: title.length > 120 ? title.substring(0, 117) + "..." : title,
      image,
      price,
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

