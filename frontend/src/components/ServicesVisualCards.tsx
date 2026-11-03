"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight } from "lucide-react";

interface ServiceCardItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  features?: string[];
}

const SERVICES_DATA: ServiceCardItem[] = [
  {
    id: "achats",
    badge: "Alibaba & 1688 · Paiement RMB",
    title: "Centrale d'Achat",
    subtitle: "Paiement fournisseurs & contrôle qualité.",
    image: "/images/services/achats.jpg",
    href: "/services?tab=alibaba",
  },
  {
    id: "maritime",
    badge: "Bateau · Dès 350 000 F / CBM",
    title: "Voie Maritime",
    subtitle: "Chine vers Abidjan, Bamako & Dakar.",
    image: "/images/services/maritime.jpg",
    href: "/tariffs?mode=SEA",
  },
  {
    id: "aerien",
    badge: "Avion · 3 à 5 Jours Chrono",
    title: "Voie Aérienne",
    subtitle: "Chine, Dubaï, France & Maroc direct.",
    image: "/images/services/aerien.jpg",
    href: "/tariffs?mode=AIR",
  },
];

export function ServicesVisualCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section style={{ marginBottom: "56px" }}>
      {/* En-tête de section éditorial style Roum Transit */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: "0.75rem",
            fontFamily: "var(--c-font-mono)",
            fontWeight: 700,
            color: "var(--c-text-light)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          01 / NOS VOIES DE TRANSPORT OFFICIELLES
        </div>
        <h2
          style={{
            fontFamily: "var(--c-font-display)",
            fontSize: "clamp(1.6rem, 3.8vw, 2.6rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.035em",
            color: "var(--c-text-main)",
            margin: "0 auto 12px auto",
            maxWidth: "760px",
          }}
        >
          Choisissez votre mode d&apos;acheminement direct vers l&apos;Afrique.
        </h2>
        <p
          style={{
            fontSize: "0.98rem",
            color: "var(--c-text-muted)",
            maxWidth: "620px",
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          Tarifs négociés, transit sous scellés et <strong>dédouanement entièrement inclus</strong> jusqu&apos;à notre agence de Bingerville.
        </p>
      </div>

      {/* Grille Desktop / Scroll Horizontal Mobile (Zero débordement, Snap-scroll fluide) */}
      <div className="services-cards-grid">
        {SERVICES_DATA.map((service) => {
          const isHovered = hoveredCard === service.id;

          return (
            <Link
              key={service.id}
              href={service.href}
              onMouseEnter={() => setHoveredCard(service.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="service-visual-card"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "410px",
                borderRadius: "26px",
                overflow: "hidden",
                textDecoration: "none",
                border: "1px solid rgba(28, 25, 23, 0.09)",
                boxShadow: isHovered
                  ? "0 22px 44px -10px rgba(27, 20, 17, 0.22), 0 4px 12px -2px rgba(27, 20, 17, 0.08)"
                  : "0 10px 30px -8px rgba(27, 20, 17, 0.12), 0 2px 8px -2px rgba(27, 20, 17, 0.04)",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease",
                backgroundColor: "#1B1411",
                boxSizing: "border-box",
              }}
            >
              {/* Image d'arrière-plan en plein cadre avec zoom cinématique doux */}
              <img
                src={service.image}
                alt={service.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: isHovered ? "scale(1.05)" : "scale(1.0)",
                  zIndex: 1,
                }}
              />

              {/* Scrim Gradient Cinématographique (Assombri en bas pour lisibilité absolue du titre) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(20, 13, 9, 0.95) 0%, rgba(20, 13, 9, 0.58) 45%, rgba(20, 13, 9, 0.08) 72%, rgba(0, 0, 0, 0.25) 100%)",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />

              {/* HAUT : Micro Badge Pilule Dépoli STRICTEMENT EN HAUT */}
              <div
                style={{
                  position: "relative",
                  zIndex: 3,
                  padding: "20px 22px",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.32)",
                    color: "#FFFFFF",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "var(--c-font-mono)",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#22C55E",
                      display: "inline-block",
                    }}
                  />
                  <span>{service.badge}</span>
                </div>
              </div>

              {/* BAS : Titre + Sous-titre + Bouton Cercle Dépoli avec Flèche STRICTEMENT EN BAS */}
              <div
                style={{
                  position: "relative",
                  zIndex: 3,
                  padding: "24px 22px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginTop: "auto",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "var(--c-font-display)",
                      fontSize: "clamp(1.4rem, 2vw, 1.75rem)",
                      fontWeight: 700,
                      lineHeight: 1.15,
                      letterSpacing: "-0.03em",
                      color: "#FFFFFF",
                      margin: "0 0 6px 0",
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    {service.title}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(255, 255, 255, 0.88)",
                      lineHeight: 1.45,
                      margin: 0,
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    {service.subtitle}
                  </p>
                </div>

                {/* Bouton Circulaire Glassmorphism */}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: isHovered ? "#FFFFFF" : "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: isHovered
                      ? "1px solid #FFFFFF"
                      : "1px solid rgba(255, 255, 255, 0.38)",
                    color: isHovered ? "#140D09" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: isHovered
                      ? "0 6px 20px rgba(255, 255, 255, 0.35)"
                      : "0 4px 12px rgba(0, 0, 0, 0.25)",
                    transform: isHovered ? "scale(1.08)" : "scale(1.0)",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <ArrowDownRight
                    size={20}
                    strokeWidth={2.4}
                    style={{
                      transform: isHovered ? "translate(1px, 1px)" : "translate(0, 0)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Style CSS Responsive : Grille Desktop 3 colonnes, Scroll snap fluide Mobile */}
      <style jsx>{`
        .services-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          position: relative;
        }

        @media (max-width: 860px) {
          .services-cards-grid {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 4px 16px 18px 16px !important;
            margin: 0 -16px !important;
            gap: 14px !important;
            scrollbar-width: none !important;
          }
          .services-cards-grid::-webkit-scrollbar {
            display: none !important;
          }
          :global(.service-visual-card) {
            flex: 0 0 84% !important;
            max-width: 310px !important;
            height: 370px !important;
            scroll-snap-align: center !important;
          }
        }
      `}</style>
    </section>
  );
}
