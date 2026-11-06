import type { MetadataRoute } from "next";

/** Le logo affiché quand le site est ajouté à l'écran d'accueil d'un téléphone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ROUM TRANSIT",
    short_name: "Roum Transit",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF5F0",
    theme_color: "#FAF5F0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
