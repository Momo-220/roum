"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Scale,
  MapPin,
} from "lucide-react";
import { normalizeTrackingNumber } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";
import { WorldMap } from "@/components/WorldMap";
import { ServicesVisualCards } from "@/components/ServicesVisualCards";

export default function HomePage() {
  const router = useRouter();

  // Suivi rapide de colis
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");
    const normalized = normalizeTrackingNumber(trackingInput);
    if (!normalized) {
      setTrackingError("Numéro de colis invalide (Ex : RM-AIR-2610-K8P9Q2).");
      return;
    }
    router.push(`/tracking/${normalized}`);
  };

  return (
    <div className="home-main-wrapper">
      {/* ========================================================
          HERO : TITRE STRICTEMENT SUR DEUX LIGNES HARMONIEUSES
          (Épuré, proportions naturelles, zéro sensation de zoom excessif)
         ======================================================== */}
      <ScrollReveal>
        <section className="hero-section">
          {/* Titre Majeur Garanti sur 2 Lignes Équilibrées */}
          <div className="hero-title-container">
            <h1 className="hero-headline-two-lines">
              <span className="hero-line">Transport maritime &amp; aérien</span>
              <span className="hero-line">direct vers l&apos;Afrique.</span>
            </h1>
          </div>

          {/* Carte Mondiale d'Arrière-Plan (Compacte et proportionnée) */}
          <div className="hero-map-wrapper">
            <WorldMap lineColor="#0EA5E9" />
          </div>

          {/* Module de Recherche de Colis (Épuré & élégant) */}
          <div className="hero-search-wrapper">
            <form onSubmit={handleTrackingSubmit} className="hero-search-form">
              <Search size={16} color="#8C7D75" style={{ marginRight: "10px", flexShrink: 0 }} />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => {
                  setTrackingInput(e.target.value);
                  if (trackingError) setTrackingError("");
                }}
                placeholder="Numéro de bordereau (Ex : RM-AIR-2610-K8P9Q2)"
                className="hero-search-input"
              />
              <button type="submit" className="hero-search-submit">
                Suivre
              </button>
            </form>

            {trackingError && (
              <div style={{ fontSize: "0.78rem", color: "#DC2626", marginTop: "6px", fontWeight: 500, textAlign: "center" }}>
                {trackingError}
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* ========================================================
          CATALOGUE VISUEL DES SERVICES : CARTES CINÉMATOGRAPHIQUES
          - Desktop : Carte active étendue à gauche + 2 carrés superposés à droite
          - Mobile : Même logique fluide, aérée et bien espacée
         ======================================================== */}
      <ScrollReveal>
        <ServicesVisualCards />
      </ScrollReveal>

      {/* ========================================================
          ENGAGEMENTS & FIABILITÉ ROUM TRANSIT (SANS CADRAN, PUR & AÉRÉ)
         ======================================================== */}
      <ScrollReveal>
        <section className="guarantees-section-frameless">
          <div className="guarantees-grid">
            <div className="guarantee-item">
              <div className="guarantee-icon-wrapper">
                <ShieldCheck size={20} color="#140D09" strokeWidth={2.2} />
              </div>
              <div className="guarantee-title">Douane 100% Comprise</div>
              <p className="guarantee-desc">
                Zéro mauvaise surprise à l&apos;arrivée. Dédouanement intégral inclus.
              </p>
            </div>

            <div className="guarantee-item">
              <div className="guarantee-icon-wrapper">
                <Scale size={20} color="#140D09" strokeWidth={2.2} />
              </div>
              <div className="guarantee-title">Pesée Vidéo Certifiée</div>
              <p className="guarantee-desc">
                Colis pesés et filmés en entrepôt dès réception pour votre sérénité.
              </p>
            </div>

            <div className="guarantee-item">
              <div className="guarantee-icon-wrapper">
                <MapPin size={20} color="#140D09" strokeWidth={2.2} />
              </div>
              <div className="guarantee-title">Agence à Abidjan</div>
              <p className="guarantee-desc">
                Retrait direct à Bingerville Carrefour Safari ou livraison à domicile.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ========================================================
          STYLES ADAPTATIFS DESKTOP & MOBILE
         ======================================================== */}
      <style jsx>{`
        .home-main-wrapper {
          max-width: 1120px;
          margin: 0 auto;
          padding: 24px 16px 40px 16px;
          box-sizing: border-box;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 36px;
          position: relative;
        }

        .hero-title-container {
          position: relative;
          z-index: 1;
          max-width: 920px;
          margin: 0 auto;
          padding: 8px 4px 0 4px;
        }

        /* Titre sur EXACTEMENT 2 Lignes Équilibrées */
        .hero-headline-two-lines {
          font-family: var(--c-font-display);
          font-weight: 700;
          letter-spacing: -0.035em;
          color: var(--c-text-main);
          margin: 0 auto;
          font-size: clamp(1.4rem, 4.4vw, 2.8rem);
          line-height: 1.14;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-line {
          display: block;
          white-space: nowrap;
        }

        .hero-map-wrapper {
          width: 100%;
          max-width: 960px;
          margin: -24px auto 0 auto;
          position: relative;
          z-index: 2;
          pointer-events: none;
          max-height: 160px;
          overflow: hidden;
          mask-image: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.22) 0%,
            rgba(0, 0, 0, 0.6) 20%,
            #000000 45%,
            #000000 75%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.22) 0%,
            rgba(0, 0, 0, 0.6) 20%,
            #000000 45%,
            #000000 75%,
            transparent 100%
          );
        }

        .hero-search-wrapper {
          max-width: 520px;
          margin: -10px auto 0 auto;
          position: relative;
          z-index: 10;
          padding: 0 4px;
        }

        .hero-search-form {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid var(--c-border);
          border-radius: 9999px;
          padding: 5px 6px 5px 16px;
          box-shadow: 0 4px 18px -2px rgba(27, 20, 17, 0.06);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .hero-search-form:focus-within {
          border-color: rgba(20, 13, 9, 0.4);
          box-shadow: 0 6px 22px -2px rgba(27, 20, 17, 0.12);
        }

        .hero-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.84rem;
          font-family: var(--c-font-mono);
          background-color: transparent;
          color: var(--c-text-main);
          min-width: 0;
        }

        .hero-search-submit {
          background-color: var(--c-text-main);
          color: var(--c-bg);
          border: none;
          border-radius: 9999px;
          padding: 8px 18px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s ease, transform 0.15s ease;
          flex-shrink: 0;
        }

        .hero-search-submit:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .guarantees-section-frameless {
          margin-top: 28px;
          padding-top: 32px;
          border-top: 1px solid rgba(28, 25, 23, 0.08);
          background: transparent;
        }

        .guarantees-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          text-align: center;
        }

        .guarantee-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .guarantee-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: rgba(20, 13, 9, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .guarantee-title {
          font-family: var(--c-font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: #140D09;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .guarantee-desc {
          font-size: 0.84rem;
          color: #57534E;
          margin: 0;
          line-height: 1.48;
          max-width: 290px;
        }

        @media (max-width: 860px) {
          .guarantees-section-frameless {
            margin-top: 20px;
            padding-top: 24px;
          }

          .guarantees-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }

          .guarantee-icon-wrapper {
            width: 40px;
            height: 40px;
            margin-bottom: 10px;
          }

          .guarantee-title {
            font-size: 1rem;
          }

          .guarantee-desc {
            font-size: 0.82rem;
            max-width: 320px;
          }
        }

        /* Desktop Spacing */
        @media (min-width: 860px) {
          .home-main-wrapper {
            padding: 36px 24px 60px 24px;
          }

          .hero-section {
            margin-bottom: 56px;
          }

          .hero-map-wrapper {
            margin: clamp(-90px, -7vw, -45px) auto 0 auto;
            max-height: none;
            overflow: visible;
          }

          .hero-search-wrapper {
            margin: clamp(-32px, -3vw, -12px) auto 0 auto;
            padding: 0;
          }

          .hero-search-form {
            padding: 6px 8px 6px 20px;
          }

          .hero-search-input {
            font-size: 0.88rem;
          }

          .hero-search-submit {
            padding: 10px 22px;
            font-size: 0.86rem;
          }
        }
      `}</style>
    </div>
  );
}
