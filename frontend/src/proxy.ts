import { NextResponse, type NextRequest } from "next/server";

/**
 * Porte de l'espace de gestion.
 *
 * Pour un client, /admin n'existe pas : même page introuvable que n'importe quelle adresse inconnue.
 * La direction entre une fois par le lien secret /acces/<clé>, qui dépose un cookie sur son appareil.
 * Sans clé configurée sur le serveur, la porte reste fermée pour tout le monde.
 *
 * Cette porte cache l'interface ; la protection des données reste assurée par l'API, qui exige
 * le compte de la direction pour chaque requête.
 */

const GATE_COOKIE = "roum_espace_gestion";
const ENTRY_PREFIX = "/acces/";
const MIN_KEY_LENGTH = 32;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function notFound(request: NextRequest) {
  return NextResponse.rewrite(new URL("/page-introuvable", request.url), { status: 404 });
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

/** Le cookie contient une empreinte : la clé elle-même ne quitte jamais le serveur. */
async function gateFingerprint(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`roum-gate:${key}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function proxy(request: NextRequest) {
  const key = process.env.ADMIN_ACCESS_KEY ?? "";
  if (key.length < MIN_KEY_LENGTH) return notFound(request);

  const { pathname } = request.nextUrl;
  const fingerprint = await gateFingerprint(key);

  if (pathname.startsWith(ENTRY_PREFIX)) {
    if (!sameText(pathname.slice(ENTRY_PREFIX.length), key)) return notFound(request);

    const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:";
    const host = request.headers.get("host") ?? request.nextUrl.host;

    // On garde l'adresse réellement utilisée : localhost, adresse du réseau local ou domaine.
    const response = NextResponse.redirect(`${isHttps ? "https" : "http"}://${host}/admin`, 303);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(GATE_COOKIE, fingerprint, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/admin",
      maxAge: THIRTY_DAYS,
    });
    return response;
  }

  if (!sameText(request.cookies.get(GATE_COOKIE)?.value ?? "", fingerprint)) return notFound(request);

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/acces/:path*"],
};
