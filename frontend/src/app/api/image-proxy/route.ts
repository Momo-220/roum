import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let targetUrl = rawUrl.trim();
  if (targetUrl.startsWith("//")) {
    targetUrl = "https:" + targetUrl;
  }

  if (!/^https?:\/\//i.test(targetUrl)) {
    return new NextResponse("Invalid url", { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    let referer = `${parsed.protocol}//${parsed.hostname}/`;
    if (parsed.hostname.includes("cbu01") || parsed.hostname.includes("1688")) {
      referer = "https://detail.1688.com/";
    } else if (parsed.hostname.includes("alicdn") || parsed.hostname.includes("alibaba")) {
      referer = "https://www.alibaba.com/";
    } else if (parsed.hostname.includes("taobao") || parsed.hostname.includes("tmall")) {
      referer = "https://item.taobao.com/";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const resp = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: referer,
      },
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return new NextResponse("Upstream image fetch failed", { status: resp.status });
    }

    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buffer = await resp.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Error fetching image", { status: 502 });
  }
}

