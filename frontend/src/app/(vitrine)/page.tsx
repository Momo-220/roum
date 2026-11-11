"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { normalizeTrackingInput } from "@/shared";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { useShop } from "@/shared/useShop";
import { shopImageUrl } from "@/shared/shop";
import { siteImage, siteImageKey, siteText } from "@/shared/siteContent";
import { RoumBoutiqueLogo } from "@/components/shop/RoumBoutiqueLogo";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";

/** Espace insécable avant « ? ! : ; » : la ponctuation ne part jamais seule à la ligne. */
const frenchSpaces = (text: string) => text.replace(/ ([?!:;])/g, "\u00A0$1");

/** Accueil Roum : deux portes, Roum Transit et Roum Boutique. Tout le texte se change dans « Contenu du site ». */
export default function VitrinePage() {
  const router = useRouter();
  const { settings } = usePublicCatalog();
  const { catalog } = useShop();
  const [tracking, setTracking] = useState("");
  const [trackingError, setTrackingError] = useState("");

  // Carte Boutique : son image à elle, sinon la photo du premier article en vente.
  const firstPhoto = catalog?.products.find((p) => p.images.length > 0)?.images[0];
  const boutiqueImage = settings[siteImageKey("vitrine_boutique")]
    ? siteImage(settings, "vitrine_boutique")
    : firstPhoto
      ? shopImageUrl(firstPhoto)
      : "";

  const submitTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeTrackingInput(tracking);
    if (!normalized) {
      setTrackingError("Numéro invalide (Ex : RM-AIR-2610-K8P9Q2 ou RB-2611-K8P9Q2).");
      return;
    }
    router.push(`/tracking/${normalized}`);
  };

  return (
    <div className="client-portal vt-root">
      <main className="vt-main">
        <header className="vt-head">
          <span className="vt-mark" role="img" aria-label="Roum">
            <img src="/images/roum-logo-transparent.png" alt="" aria-hidden="true" />
          </span>
          <span className="vt-kicker">{siteText(settings, "vitrine_kicker")}</span>
          <h1 className="vt-title">{frenchSpaces(siteText(settings, "vitrine_title"))}</h1>
          <p className="vt-text">{siteText(settings, "vitrine_text")}</p>
        </header>

        <div className="vt-cards">
          <Link href="/transit" className="vt-card">
            <span className="vt-photo">
              <img className="vt-img" src={siteImage(settings, "vitrine_transit")} alt="" />
            </span>
            <span className="vt-body">
              <img src="/images/roum-logo-transparent.png" alt="Roum Transit" className="vt-brand-transit" />
              <span className="vt-card-text">{siteText(settings, "vitrine_transit_text")}</span>
              <span className="vt-cta">
                {siteText(settings, "vitrine_transit_cta")}
                <ArrowRight size={17} />
              </span>
            </span>
          </Link>

          <Link href="/boutique" className="vt-card">
            <span className="vt-photo">
              {boutiqueImage ? (
                <img className="vt-img" src={boutiqueImage} alt="" />
              ) : (
                <span className="vt-photo-empty">
                  <RoumBoutiqueLogo width={170} />
                </span>
              )}
            </span>
            <span className="vt-body">
              {boutiqueImage && (
                <span className="vt-brand-boutique">
                  <RoumBoutiqueLogo width={84} />
                </span>
              )}
              <span className="vt-card-text">{siteText(settings, "vitrine_boutique_text")}</span>
              <span className="vt-cta">
                {siteText(settings, "vitrine_boutique_cta")}
                <ArrowRight size={17} />
              </span>
            </span>
          </Link>
        </div>

        <section className="vt-track">
          <p>{frenchSpaces(siteText(settings, "vitrine_tracking"))}</p>
          <form className="vt-track-form" onSubmit={submitTracking}>
            <Search size={16} />
            <input
              value={tracking}
              onChange={(e) => {
                setTracking(e.target.value);
                if (trackingError) setTrackingError("");
              }}
              placeholder="RM-AIR-… ou RB-…"
              aria-label="Numéro de colis ou de commande"
              autoCapitalize="characters"
            />
            <button type="submit">Suivre</button>
          </form>
          {trackingError && <p className="vt-error">{trackingError}</p>}
        </section>
      </main>

      <footer className="vt-footer">
        <div className="vt-footer-inner">
          <span>© {new Date().getFullYear()} ROUM</span>
          <nav>
            <Link href="/transit">Roum Transit</Link>
            <Link href="/boutique">Roum Boutique</Link>
            <Link href="/tracking">Suivi</Link>
          </nav>
        </div>
      </footer>

      <WhatsAppFloatingButton message="Bonjour ROUM, j'ai une question." label="Écrire à Roum sur WhatsApp" />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .vt-root { display: flex; flex-direction: column; }
        .vt-main { flex: 1; width: 100%; max-width: 1080px; margin: 0 auto; padding: 40px 20px 56px; box-sizing: border-box; }

        .vt-head { display: flex; flex-direction: column; align-items: center; max-width: 640px; margin: 0 auto 40px; text-align: center; }
        .vt-mark { display: block; width: 116px; aspect-ratio: 801 / 268; overflow: hidden; margin-bottom: 22px; }
        .vt-mark img { display: block; width: 100%; height: auto; }
        .vt-kicker {
          display: inline-flex; align-items: center; gap: 6px; font-family: var(--c-font-mono); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.09em; color: var(--c-text-light);
        }
        .vt-kicker::before { content: "●"; color: var(--c-accent); }
        .vt-root .vt-title {
          margin: 10px 0 12px; color: var(--c-text-main); font-family: var(--c-font-display);
          font-size: clamp(2.3rem, 6vw, 3.6rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.03;
        }
        .vt-text { margin: 0; color: var(--c-text-muted); font-size: 1.08rem; line-height: 1.55; }

        .vt-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
        .vt-card {
          display: flex; flex-direction: column; overflow: hidden; border: 1px solid #EFE6D9; border-radius: 30px;
          background: linear-gradient(180deg, #FFFDF9 0%, #FBF3E8 100%); color: inherit; text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .vt-photo { position: relative; display: block; aspect-ratio: 4 / 3; overflow: hidden; background: #F3EBDF; }
        .vt-img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 0.45s ease; }
        .vt-photo-empty {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle at 30% 25%, #FFFBF4 0%, #F3EBDF 55%, #EADDCB 100%);
        }
        .vt-brand-transit { display: block; height: 46px; width: auto; align-self: flex-start; }
        .vt-brand-boutique { display: inline-flex; align-self: flex-start; }
        .vt-body { flex: 1; display: flex; flex-direction: column; gap: 18px; padding: 22px 24px 24px; }
        .vt-card-text { color: var(--c-text-muted); font-size: 1.03rem; line-height: 1.5; }
        .vt-cta {
          align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; min-height: 48px; margin-top: auto; padding: 0 22px;
          border-radius: 9999px; background: #EADDCB; color: #3A2A21; font-size: 0.95rem; font-weight: 700; transition: background 0.15s ease;
        }
        .vt-cta svg { transition: transform 0.2s ease; }
        .vt-card:hover .vt-cta { background: #E0D1BB; }

        .vt-track { max-width: 540px; margin: 46px auto 0; text-align: center; }
        .vt-track > p { margin: 0 0 14px; color: var(--c-text-muted); font-size: 0.98rem; font-weight: 600; }
        .vt-track-form {
          display: flex; align-items: center; gap: 10px; padding: 5px 6px 5px 18px; border-radius: 9999px;
          background: var(--c-surface); box-shadow: 0 6px 24px -2px rgba(27, 20, 17, 0.08); color: var(--c-text-light);
        }
        .vt-track-form input {
          flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--c-text-main);
          font-family: var(--c-font-mono); font-size: 16px;
        }
        .vt-track-form input::placeholder { color: #A99A90; }
        .vt-track-form button {
          min-height: 42px; padding: 0 20px; border: 0; border-radius: 9999px; background: #EADDCB; color: #3A2A21;
          font: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease;
        }
        .vt-track-form button:hover { background: #E0D1BB; }
        .vt-error { margin: 10px 0 0; color: #A12B2B; font-size: 0.86rem; font-weight: 600; }

        .vt-footer { border-top: 1px solid rgba(28, 25, 23, 0.08); background: #F7F5F0; padding: 26px 24px 30px; }
        .vt-footer-inner {
          max-width: 1080px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 18px;
          color: #78716C; font-family: var(--c-font-mono); font-size: 0.72rem;
        }
        .vt-footer nav { display: flex; flex-wrap: wrap; gap: 18px; font-family: var(--c-font-sans); font-size: 0.82rem; }
        .vt-footer a { color: #57534E; text-decoration: none; }
        .vt-footer a:hover { color: var(--c-accent); }

        @media (max-width: 760px) {
          .vt-main { padding: 28px 16px 44px; }
          .vt-head { margin-bottom: 28px; }
          .vt-mark { width: 100px; margin-bottom: 18px; }
          .vt-cards { grid-template-columns: minmax(0, 1fr); gap: 16px; }
          .vt-photo { aspect-ratio: 16 / 10; }
          .vt-card { border-radius: 26px; }
          .vt-body { padding: 18px 18px 20px; gap: 14px; }
          .vt-cta { align-self: stretch; justify-content: center; }
          .vt-track { margin-top: 36px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vt-card, .vt-img, .vt-cta svg { transition: none; }
        }
      `,
        }}
      />
    </div>
  );
}
