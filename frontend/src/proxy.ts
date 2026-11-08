import { NextResponse, type NextRequest } from "next/server";

/**
 * Entrée de l'espace de gestion.
 *
 * /admin affiche directement la page de connexion. Les données restent protégées par l'API :
 * elle exige le compte du gérant à chaque requête et bloque en base les essais répétés de mot de passe.
 * Les anciens liens /acces/<clé> mènent simplement à /admin.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/acces")) {
    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:";
    const host = request.headers.get("host") ?? request.nextUrl.host;
    // Adresse complète, prise sur celle réellement utilisée : localhost, réseau local ou domaine.
    const response = NextResponse.redirect(`${isHttps ? "https" : "http"}://${host}/admin`, 307);
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  const response = NextResponse.next();
  // L'espace de gestion n'a rien à faire dans les moteurs de recherche.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/acces/:path*"],
};
