import type { Metadata } from "next";
import Link from "next/link";
import { PublicCatalogProvider } from "@/shared/usePublicCatalog";
import { ShopProvider } from "@/shared/useShop";
import { ShopBottomNav, ShopFooter } from "@/components/shop/ShopChrome";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { RoumBoutiqueLogo } from "@/components/shop/RoumBoutiqueLogo";

export const metadata: Metadata = {
  title: "ROUM BOUTIQUE — Chaussures, sacs et vêtements",
  description:
    "Roum Boutique : chaussures, sacs et vêtements. Commandez en ligne, payez par Wave, Orange Money ou compte Maroc, faites-vous livrer.",
};

const SHOP_STYLES = `
  .rb-root { display: flex; flex-direction: column; }
  .rb-main { flex: 1; width: 100%; max-width: 1160px; margin: 0 auto; padding: 22px 20px 48px; box-sizing: border-box; }

  /* Boutons : ceux de Roum Transit (crème en relief, ou beige plein). */
  .rb-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 26px;
    border: 1px solid #DCCDB6; border-radius: 9999px; background: #FFFBF4; box-shadow: 0 12px 24px -16px rgba(107, 88, 68, 0.6);
    color: #3A2A21; font: inherit; font-size: 0.97rem; font-weight: 700; text-decoration: none; cursor: pointer;
    touch-action: manipulation; transition: transform 0.15s ease, background 0.15s ease;
  }
  .rb-btn:hover { background: #F3EBDF; }
  .rb-btn:active { transform: scale(0.98); }
  .rb-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .rb-btn-soft { min-height: 48px; padding: 0 20px; border-color: transparent; background: #EADDCB; box-shadow: none; }
  .rb-btn-soft:hover { background: #E0D1BB; }
  .rb-btn-block { display: flex; width: 100%; }

  .rb-kicker {
    display: inline-flex; align-items: center; gap: 6px; font-family: var(--c-font-mono); font-size: 0.72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em; color: var(--c-text-light);
  }
  .rb-kicker::before { content: "●"; color: var(--c-accent); }
  .rb-root .rb-title {
    margin: 8px 0 10px; color: var(--c-text-main); font-family: var(--c-font-display);
    font-size: clamp(2.1rem, 5vw, 3.2rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05;
  }
  .rb-root .rb-h2 { margin: 0 0 14px; color: var(--c-accent); font-family: var(--c-font-display); font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }
  .rb-lead { margin: 0; color: var(--c-text-muted); font-size: 1.05rem; line-height: 1.55; max-width: 620px; }
  .rb-muted { color: var(--c-text-light); }

  .rb-price { display: inline-flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-weight: 800; color: var(--c-text-main); }
  .rb-price s { color: var(--c-text-light); font-weight: 500; font-size: 0.86em; }
  .rb-badge { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 9999px; font-size: 0.74rem; font-weight: 800; }
  .rb-badge-promo { background: #FFFBF4; color: #3A2A21; box-shadow: 0 6px 14px -8px rgba(58, 42, 33, 0.45); }
  .rb-badge-out, .rb-badge-low { background: rgba(255, 251, 244, 0.94); color: #6B5844; box-shadow: 0 6px 14px -8px rgba(58, 42, 33, 0.35); }

  /* Choix en pilule : ceux du formulaire d'envoi Roum Transit. */
  .rb-choice {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 18px;
    border: 1px solid #DCCDB6; border-radius: 9999px; background: transparent; color: var(--c-text-muted);
    font: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer; touch-action: manipulation;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .rb-choice:hover { background: #F3EBDF; }
  .rb-choice.active { border-color: #EADDCB; background: #EADDCB; color: #3A2A21; font-weight: 700; }

  .rb-input, .rb-select, .rb-textarea {
    width: 100%; box-sizing: border-box; min-height: 52px; padding: 0 20px; border: 1px solid #DCCDB6; border-radius: 9999px;
    background: #FFFFFF; color: #3A2A21; font: inherit; font-size: 16px; outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .rb-textarea { min-height: 96px; padding: 14px 20px; border-radius: 22px; resize: vertical; }
  .rb-input:focus, .rb-select:focus, .rb-textarea:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(107, 88, 68, 0.14); }
  .rb-input::placeholder, .rb-textarea::placeholder { color: #A99A90; }
  .rb-label { display: block; margin: 0 0 8px 4px; color: #3A2A21; font-size: 0.95rem; font-weight: 700; }
  .rb-field { margin-bottom: 16px; }
  .rb-error { margin: 12px 0; padding: 12px 18px; border-radius: 20px; background: #FBEAEA; color: #A12B2B; font-size: 0.95rem; font-weight: 600; }

  /* Les pages Suivi gardent leurs propres marges, comme côté Roum Transit. */
  .rb-main:has(.tk-root), .rb-main:has(.snake-horizontal-viewport) { max-width: none; padding: 0; }

  @media (max-width: 640px) {
    .rb-main { padding: 14px 16px 40px; }
  }
`;

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicCatalogProvider>
      <ShopProvider>
        {/* Écriture pinceau du mot « boutique » dans le logo. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" precedence="default" />
        <div className="client-portal rb-root">
          {/* En-tête de Roum Transit : le logo seul, posé sur le fond lin. */}
          <header style={{ backgroundColor: "transparent", padding: "18px 24px 10px 24px", position: "relative", zIndex: 50 }}>
            <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", alignItems: "center" }}>
              <Link href="/boutique" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }} title="ROUM BOUTIQUE">
                <RoumBoutiqueLogo width={82} />
              </Link>
            </div>
          </header>
          <main className="rb-main">{children}</main>
          <ShopBottomNav />
          <WhatsAppFloatingButton
            message="Bonjour ROUM BOUTIQUE, j'ai une question sur un article."
            label="Écrire à Roum Boutique sur WhatsApp"
          />
          <ShopFooter />
        </div>
        <style dangerouslySetInnerHTML={{ __html: SHOP_STYLES }} />
      </ShopProvider>
    </PublicCatalogProvider>
  );
}
