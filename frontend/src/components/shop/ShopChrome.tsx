"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReceiptText, Search, ShoppingBag, Store } from "lucide-react";
import { FloatingBottomNav } from "@/components/FloatingBottomNav";
import { useShop } from "@/shared/useShop";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { siteText } from "@/shared/siteContent";
import { RoumBoutiqueLogo } from "./RoumBoutiqueLogo";

/** La barre flottante de Roum Transit, avec les liens de la boutique. */
export function ShopBottomNav() {
  const pathname = usePathname() ?? "";
  const { cartCount } = useShop();
  return (
    <FloatingBottomNav
      items={[
        {
          id: "shop",
          label: "Boutique",
          icon: Store,
          href: "/boutique",
          isActive: pathname === "/boutique" || pathname.startsWith("/boutique/article"),
        },
        {
          id: "cart",
          label: "Panier",
          icon: ShoppingBag,
          href: "/boutique/panier",
          isActive: pathname.startsWith("/boutique/panier"),
          badge: cartCount,
        },
        { id: "tracking", label: "Suivi", icon: Search, href: "/boutique/suivi", isActive: pathname.startsWith("/boutique/suivi") },
        {
          id: "orders",
          label: "Commandes",
          icon: ReceiptText,
          href: "/boutique/commandes",
          isActive: pathname.startsWith("/boutique/commande"),
        },
      ]}
    />
  );
}

/** Même pied de page que Roum Transit ; la phrase se change dans « Contenu du site ». */
export function ShopFooter() {
  const { settings } = usePublicCatalog();
  const link = { textDecoration: "none", color: "inherit" } as const;
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(28, 25, 23, 0.08)",
        backgroundColor: "#F7F5F0",
        padding: "36px 24px 112px 24px",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RoumBoutiqueLogo width={62} />
            <span style={{ fontSize: "0.82rem", color: "#57534E" }}>{siteText(settings, "boutique_footer")}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", fontSize: "0.82rem", color: "#57534E" }}>
            <Link href="/boutique" style={link}>
              Boutique
            </Link>
            <Link href="/boutique/panier" style={link}>
              Panier
            </Link>
            <Link href="/boutique/suivi" style={link}>
              Suivi
            </Link>
            <Link href="/transit" style={link}>
              Roum Transit
            </Link>
          </div>
        </div>

        <div
          style={{
            paddingTop: "14px",
            borderTop: "1px solid rgba(28, 25, 23, 0.06)",
            fontSize: "0.72rem",
            color: "#78716C",
            fontFamily: "var(--c-font-mono)",
          }}
        >
          © {new Date().getFullYear()} ROUM BOUTIQUE
        </div>
      </div>
    </footer>
  );
}
