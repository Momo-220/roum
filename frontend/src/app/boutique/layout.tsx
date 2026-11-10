import type { Metadata } from "next";
import Link from "next/link";
import { PublicCatalogProvider } from "@/shared/usePublicCatalog";
import { ShopProvider } from "@/shared/useShop";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { RoumBoutiqueLogo } from "@/components/shop/RoumBoutiqueLogo";

export const metadata: Metadata = {
  title: "ROUM BOUTIQUE — Chaussures, sacs et vêtements",
  description:
    "Roum Boutique : chaussures, sacs et vêtements. Commandez en ligne, payez par Wave, Orange Money ou compte Maroc, faites-vous livrer.",
};

const SHOP_STYLES = `
  .rb-root { min-height: 100vh; display: flex; flex-direction: column; background: #FAF5F0; color: #3A2A21; }
  .rb-main { flex: 1; width: 100%; max-width: 1160px; margin: 0 auto; padding: 8px 20px 96px; box-sizing: border-box; }

  .rb-logo { display: inline-flex; flex-direction: column; align-items: center; line-height: 1; }
  .rb-logo-top { display: block; width: 100%; aspect-ratio: 801 / 268; overflow: hidden; }
  .rb-logo-top img { display: block; width: 100%; height: auto; }
  .rb-logo-word {
    margin-top: -0.18em; color: #141010; white-space: nowrap;
    font-family: 'Kaushan Script', 'Brush Script MT', cursive; font-weight: 400; letter-spacing: 0.01em;
  }

  .rb-header { position: sticky; top: 0; z-index: 60; background: rgba(250, 245, 240, 0.92); backdrop-filter: blur(10px); }
  .rb-header-inner { max-width: 1160px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .rb-header-logo { display: inline-flex; text-decoration: none; }
  .rb-header-nav { display: flex; align-items: center; gap: 8px; }
  .rb-header-link, .rb-cart-pill {
    display: inline-flex; align-items: center; gap: 7px; min-height: 42px; padding: 0 16px; border-radius: 9999px;
    color: #3A2A21; text-decoration: none; font-size: 0.88rem; font-weight: 700;
  }
  .rb-header-link:hover { background: #F3EBDF; }
  .rb-cart-pill { background: #3A2A21; color: #FFFBF4; }
  .rb-cart-count { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 9999px; background: #EADDCB; color: #3A2A21; display: inline-flex; align-items: center; justify-content: center; font-size: 0.76rem; }

  .rb-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 22px;
    border: 0; border-radius: 9999px; background: #3A2A21; color: #FFFBF4; font: inherit; font-size: 0.95rem; font-weight: 700;
    text-decoration: none; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease;
  }
  .rb-btn:hover { background: #2A1E17; }
  .rb-btn:active { transform: scale(0.98); }
  .rb-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .rb-btn-soft { background: #EADDCB; color: #3A2A21; }
  .rb-btn-soft:hover { background: #E0D1BB; }
  .rb-btn-block { display: flex; width: 100%; }

  .rb-kicker { color: #6B5844; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .rb-title { margin: 6px 0 8px; font-family: var(--c-font-display); font-size: clamp(1.8rem, 5vw, 2.8rem); line-height: 1.08; letter-spacing: -0.03em; }
  .rb-lead { margin: 0; color: #5C4F48; font-size: 1rem; line-height: 1.55; max-width: 620px; }
  .rb-muted { color: #8C7D75; }

  .rb-price { display: inline-flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-weight: 800; color: #1B1411; }
  .rb-price s { color: #8C7D75; font-weight: 500; font-size: 0.86em; }
  .rb-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9999px; font-size: 0.74rem; font-weight: 800; }
  .rb-badge-promo { background: #3A2A21; color: #FFFBF4; }
  .rb-badge-out { background: #EFE6D9; color: #6B5844; }
  .rb-badge-low { background: #F3EBDF; color: #6B5844; }

  .rb-input, .rb-select, .rb-textarea {
    width: 100%; box-sizing: border-box; min-height: 50px; padding: 12px 18px; border: 1px solid #EADFD3; border-radius: 9999px;
    background: #FFFFFF; color: #1B1411; font: inherit; font-size: 1rem; outline: none;
  }
  .rb-textarea { border-radius: 20px; min-height: 90px; resize: vertical; }
  .rb-input:focus, .rb-select:focus, .rb-textarea:focus { border-color: #6B5844; }
  .rb-label { display: block; margin: 0 0 6px 4px; font-size: 0.84rem; font-weight: 700; color: #3A2A21; }
  .rb-field { margin-bottom: 14px; }
  .rb-error { margin: 10px 0; padding: 12px 16px; border-radius: 16px; background: #FBEAEA; color: #A12B2B; font-size: 0.9rem; font-weight: 600; }

  .rb-footer { border-top: 1px solid #EADFD3; background: #F5EFE8; padding: 30px 20px 110px; }
  .rb-footer-inner { max-width: 1160px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; font-size: 0.86rem; color: #5C4F48; }
  .rb-footer a { color: #3A2A21; font-weight: 700; text-decoration: none; }

  @media (max-width: 640px) {
    .rb-main { padding: 4px 16px 96px; }
    .rb-header-inner { padding: 10px 16px; }
    .rb-header-link span { display: none; }
    .rb-header-link { padding: 0 12px; }
  }
`;

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicCatalogProvider>
      <ShopProvider>
        {/* Écriture pinceau du mot « boutique » dans le logo. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" precedence="default" />
        <div className="rb-root">
          <ShopHeader />
          <main className="rb-main">{children}</main>
          <footer className="rb-footer">
            <div className="rb-footer-inner">
              <RoumBoutiqueLogo width={84} />
              <span>
                Paiement Wave, Orange Money ou compte Maroc · Livraison suivie ·{" "}
                <Link href="/">Roum Transit</Link>
              </span>
            </div>
          </footer>
          <WhatsAppFloatingButton
            message="Bonjour ROUM BOUTIQUE, j'ai une question sur un article."
            label="Écrire à Roum Boutique sur WhatsApp"
          />
        </div>
        <style dangerouslySetInnerHTML={{ __html: SHOP_STYLES }} />
      </ShopProvider>
    </PublicCatalogProvider>
  );
}
