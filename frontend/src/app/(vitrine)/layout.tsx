import type { Metadata } from "next";
import { PublicCatalogProvider } from "@/shared/usePublicCatalog";
import { ShopProvider } from "@/shared/useShop";

export const metadata: Metadata = {
  title: "ROUM — Transit & Boutique",
  description:
    "Roum Transit fait venir vos marchandises de Chine et d'ailleurs. Roum Boutique vend chaussures, sacs et vêtements, livrés chez vous.",
};

/** La première page du site : le visiteur choisit Roum Transit ou Roum Boutique. */
export default function VitrineLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicCatalogProvider>
      <ShopProvider>
        {/* Écriture pinceau du mot « boutique » dans le logo. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" precedence="default" />
        {children}
      </ShopProvider>
    </PublicCatalogProvider>
  );
}
