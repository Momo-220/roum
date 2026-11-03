"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

interface ServiceItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  ctaText: string;
  features: string[];
  metrics: { label: string; value: string }[];
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: "maritime",
    badge: "Bateau · Groupage & Conteneurs",
    title: "Voie Maritime",
    subtitle: "Chine vers Abidjan, Bamako & Dakar",
    description:
      "Acheminement par conteneurs sécurisés (FCL) ou groupage au mètre cube (LCL / CBM). La solution idéale pour machines lourdes et gros volumes avec dédouanement complet inclus au port.",
    image: "/images/services/maritime.jpg",
    href: "/tariffs?mode=SEA",
    ctaText: "Estimer mon fret maritime",
    features: [
      "Groupage au mètre cube (CBM) sans minimum lourd",
      "Dédouanement 100% inclus jusqu'à Bingerville",
      "Scellés de sécurité & traçabilité par conteneur",
      "Départs réguliers chaque semaine de Ningbo & Yiwu",
    ],
    metrics: [
      { label: "Délai moyen", value: "30 - 45 jours" },
      { label: "Tarif indicatif", value: "Dès 350 000 F / CBM" },
    ],
  },
  {
    id: "aerien",
    badge: "Avion · Express 3 à 5 Jours",
    title: "Voie Aérienne",
    subtitle: "Chine, Dubaï, France & Maroc direct",
    description:
      "Vols cargos réguliers chaque semaine pour vos colis urgents, échantillons, téléphones et cosmétiques. Pesée certifiée et retrait immédiat en agence sans tracasseries.",
    image: "/images/services/aerien.jpg",
    href: "/tariffs?mode=AIR",
    ctaText: "Calculer mon tarif aérien",
    features: [
      "Vols directs chaque semaine vers l'Afrique",
      "Délai express garanti de 3 à 5 jours ouvrés",
      "Liaisons Paris, Casablanca, Dubaï & Guangzhou",
      "Dédouanement intégral compris dans le prix au kilo",
    ],
    metrics: [
      { label: "Délai express", value: "3 à 5 jours" },
      { label: "Retrait", value: "Bingerville Carrefour Safari" },
    ],
  },
  {
    id: "achats",
    badge: "Alibaba & 1688 · Paiement RMB",
    title: "Centrale d'Achat",
    subtitle: "Paiement fournisseurs & contrôle qualité",
    description:
      "Achetez sur Alibaba, 1688 et Taobao sans blocage bancaire international. Vous réglez en FCFA à Abidjan, notre bureau en Chine paie votre usine en Yuans (RMB) et inspecte vos cartons.",
    image: "/images/services/achats.jpg",
    href: "/services?tab=alibaba",
    ctaText: "Lancer un achat assisté",
    features: [
      "Paiement direct de vos fournisseurs en Yuans (RMB)",
      "Zéro carte bancaire internationale requise",
      "Vérification & inspection des colis en entrepôt",
      "Transit automatique vers l'Afrique dès validation",
    ],
    metrics: [
      { label: "Devise réglée", value: "Yuans RMB en Chine" },
      { label: "Règlement client", value: "FCFA à Abidjan" },
    ],
  },
];

export function ServicesVisualCards() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleCardClick = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".service-cta-button") || target.closest(".service-close-button")) {
      return;
    }
    setActiveId((prev) => (prev === id ? null : id));
  };

  // Placement CSS Grid pour le mode Desktop
  const getGridPlacement = (serviceId: string): React.CSSProperties => {
    if (activeId === null) {
      const idx = SERVICES_DATA.findIndex((s) => s.id === serviceId);
      return {
        gridColumn: `${idx + 1} / ${idx + 2}`,
        gridRow: "1 / 2",
      };
    }

    if (activeId === serviceId) {
      return {
        gridColumn: "1 / 2",
        gridRow: "1 / 3",
      };
    }

    const inactiveCards = SERVICES_DATA.filter((s) => s.id !== activeId);
    const inactiveIndex = inactiveCards.findIndex((s) => s.id === serviceId);

    return {
      gridColumn: "2 / 3",
      gridRow: inactiveIndex === 0 ? "1 / 2" : "2 / 3",
    };
  };

  return (
    <section className="services-section-wrapper">
      {/* En-tête de section équilibré (Tailles normales et élégantes) */}
      <div className="services-header">
        <div className="services-eyebrow">
          01 / NOS VOIES DE TRANSPORT OFFICIELLES
        </div>
        <h2 className="services-heading">
          Choisissez votre mode d&apos;acheminement direct vers l&apos;Afrique.
        </h2>
        <p className="services-subtext">
          Touchez un service pour dérouler ses détails, délais et garanties.
        </p>
      </div>

      {/* ========================================================
          GRILLE FLUIDE DES SERVICES :
          - Desktop : Carte active étendue à gauche + 2 carrés superposés à droite
          - Mobile : Cartes compactes flexibles avec déroulement accordéon fluide
         ======================================================== */}
      <div
        className={`services-grid-container ${activeId !== null ? "has-active" : "is-default"}`}
      >
        {SERVICES_DATA.map((service) => {
          const isExpanded = activeId === service.id;
          const isStackedSquare = activeId !== null && !isExpanded;
          const isHovered = hoveredCard === service.id;
          const placementStyle = getGridPlacement(service.id);

          return (
            <div
              key={service.id}
              onClick={(e) => handleCardClick(service.id, e)}
              onMouseEnter={() => setHoveredCard(service.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`service-card-item ${
                isExpanded ? "is-expanded" : isStackedSquare ? "is-stacked-square" : "is-default-card"
              }`}
              style={placementStyle}
            >
              {/* 1. Photographie de fond (Zoom progressif doux) */}
              <img
                src={service.image}
                alt={service.title}
                className="service-card-bg-image"
                style={{
                  transform: isExpanded
                    ? "scale(1.06)"
                    : isHovered
                    ? "scale(1.04)"
                    : "scale(1.0)",
                }}
              />

              {/* 2. Scrim Gradient de Contraste Doux (Signature Roum) */}
              <div
                className="service-card-scrim"
                style={{
                  background: isExpanded
                    ? "linear-gradient(to right, rgba(20, 13, 9, 0.96) 0%, rgba(20, 13, 9, 0.90) 45%, rgba(20, 13, 9, 0.82) 100%)"
                    : isStackedSquare
                    ? "linear-gradient(to top, rgba(20, 13, 9, 0.94) 0%, rgba(20, 13, 9, 0.55) 50%, rgba(20, 13, 9, 0.15) 100%)"
                    : "linear-gradient(to top, rgba(20, 13, 9, 0.94) 0%, rgba(20, 13, 9, 0.55) 45%, rgba(20, 13, 9, 0.12) 75%, rgba(0, 0, 0, 0.2) 100%)",
                }}
              />

              {/* 3. Contenu de la carte */}
              <div
                className={`service-card-content ${
                  isExpanded ? "content-expanded" : isStackedSquare ? "content-stacked" : "content-default"
                }`}
              >
                {/* Ligne Supérieure : Micro-tag ou Bouton de fermeture */}
                <div className="service-card-top-bar">
                  <div className="service-micro-badge">
                    <span className="service-badge-dot" />
                    <span>{service.badge}</span>
                  </div>

                  {/* Bouton pour replier quand la carte est dépliée */}
                  {isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveId(null);
                      }}
                      className="service-close-button"
                      title="Replier ce volet"
                      aria-label="Fermer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* ========================================================
                    CORPS DE LA CARTE :
                    1. isStackedSquare : Format carré compact superposé
                    2. isExpanded : Grand rectangle détaillé avec métriques & CTA
                    3. isDefaultCard : Format compact au repos
                   ======================================================== */}
                {isStackedSquare ? (
                  /* Format Carré Compact Superposé */
                  <div className="service-stacked-bottom">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="service-title-stacked">
                        {service.title}
                      </h3>
                      <p className="service-subtitle-stacked">
                        {service.subtitle}
                      </p>
                    </div>

                    <div className={`service-action-badge ${isHovered ? "is-hovered" : ""}`}>
                      <ArrowDownRight
                        size={16}
                        strokeWidth={2.4}
                        style={{
                          transform: isHovered ? "translate(1px, 1px)" : "translate(0, 0)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </div>
                  </div>
                ) : !isExpanded ? (
                  /* Format par Défaut (3 colonnes Desktop / 3 cartes mobiles) */
                  <div className="service-default-bottom">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="service-title-default">
                        {service.title}
                      </h3>
                      <p className="service-subtitle-default">
                        {service.subtitle}
                      </p>
                    </div>

                    <div className={`service-action-badge ${isHovered ? "is-hovered" : ""}`}>
                      <ArrowDownRight
                        size={18}
                        strokeWidth={2.4}
                        style={{
                          transform: isHovered ? "translate(1px, 1px)" : "translate(0, 0)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Format Grand Rectangle Déroulé avec détails */
                  <div className="service-expanded-body">
                    <div>
                      <h3 className="service-title-expanded">
                        {service.title}
                      </h3>
                      <p className="service-desc-expanded">
                        {service.description}
                      </p>
                    </div>

                    {/* Métriques Clés */}
                    <div className="service-metrics-row">
                      {service.metrics.map((m, idx) => (
                        <div key={idx} className="service-metric-item">
                          <span className="service-metric-label">{m.label}</span>
                          <span className="service-metric-value">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Garanties */}
                    <div className="service-features-grid">
                      {service.features.map((feat, idx) => (
                        <div key={idx} className="service-feature-row">
                          <div className="service-feature-check">
                            <Check size={10} color="#FFFFFF" strokeWidth={3} />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bouton CTA */}
                    <div style={{ paddingTop: "4px" }}>
                      <Link href={service.href} className="service-cta-button">
                        <span>{service.ctaText}</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          STYLES CSS RESPONSIFS ET ANIMATIONS FLUIDES
         ======================================================== */}
      <style jsx>{`
        .services-section-wrapper {
          margin-bottom: 48px;
        }

        .services-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .services-eyebrow {
          display: inline-block;
          font-size: 0.72rem;
          font-family: var(--c-font-mono);
          font-weight: 700;
          color: var(--c-text-light);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .services-heading {
          font-family: var(--c-font-display);
          font-size: clamp(1.28rem, 3.2vw, 2.2rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.035em;
          color: var(--c-text-main);
          margin: 0 auto 8px auto;
          max-width: 680px;
        }

        .services-subtext {
          font-size: clamp(0.82rem, 1.4vw, 0.92rem);
          color: var(--c-text-muted);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.45;
        }

        /* Desktop Grid */
        .services-grid-container {
          display: grid;
          width: 100%;
          gap: 16px;
          height: 460px;
          transition: grid-template-columns 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      grid-template-rows 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .services-grid-container.is-default {
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: 1fr;
        }

        .services-grid-container.has-active {
          grid-template-columns: 2.15fr 1fr;
          grid-template-rows: 1fr 1fr;
        }

        .service-card-item {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          cursor: pointer;
          background-color: #1B1411;
          border: 1px solid rgba(28, 25, 23, 0.1);
          box-shadow: 0 8px 24px -4px rgba(27, 20, 17, 0.1);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.25s ease,
                      border-color 0.2s ease,
                      border-radius 0.25s ease;
          width: 100%;
          height: 100%;
        }

        .service-card-item:hover {
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 14px 32px -6px rgba(27, 20, 17, 0.2);
        }

        .service-card-item.is-expanded {
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 20px 44px -8px rgba(20, 13, 9, 0.28);
        }

        .service-card-item.is-stacked-square {
          border-radius: 20px;
        }

        .service-card-bg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }

        .service-card-scrim {
          position: absolute;
          inset: 0;
          z-index: 2;
          transition: background 0.4s ease;
          pointer-events: none;
        }

        .service-card-content {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-sizing: border-box;
        }

        .content-default {
          padding: 20px;
        }

        .content-stacked {
          padding: 14px 16px;
        }

        .content-expanded {
          padding: 24px;
        }

        .service-card-top-bar {
          display: flex;
          justifyContent: space-between;
          align-items: center;
          width: 100%;
        }

        .service-micro-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: var(--c-font-mono);
        }

        .service-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #22C55E;
          display: inline-block;
        }

        .service-close-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(10px);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .service-close-button:hover {
          background-color: rgba(255, 255, 255, 0.38);
          transform: scale(1.08);
        }

        /* Bottom rows */
        .service-stacked-bottom,
        .service-default-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
        }

        .service-title-stacked {
          font-family: var(--c-font-display);
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #FFFFFF;
          margin: 0 0 3px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .service-subtitle-stacked {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.3;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .service-title-default {
          font-family: var(--c-font-display);
          font-size: clamp(1.22rem, 1.6vw, 1.55rem);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: #FFFFFF;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .service-subtitle-default {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.35;
          margin: 0;
        }

        .service-action-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .service-action-badge.is-hovered {
          background-color: #FFFFFF;
          color: #140D09;
          border-color: #FFFFFF;
          transform: scale(1.08);
        }

        /* Expanded Body */
        .service-expanded-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          animation: cardSmoothReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .service-title-expanded {
          font-family: var(--c-font-display);
          font-size: clamp(1.4rem, 2.2vw, 1.85rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.035em;
          color: #FFFFFF;
          margin: 0 0 6px 0;
        }

        .service-desc-expanded {
          font-size: 0.88rem;
          line-height: 1.48;
          color: rgba(255, 255, 255, 0.9);
          max-width: 640px;
          margin: 0;
        }

        .service-metrics-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .service-metric-item {
          background-color: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 5px 10px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .service-metric-label {
          font-size: 0.64rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          font-family: var(--c-font-mono);
          letter-spacing: 0.05em;
        }

        .service-metric-value {
          font-size: 0.82rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .service-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 6px 12px;
        }

        .service-feature-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.88);
        }

        .service-feature-check {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #22C55E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .service-cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          background-color: #FFFFFF;
          color: #140D09;
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
          transition: transform 0.18s ease, background-color 0.18s ease;
        }

        .service-cta-button:hover {
          transform: translateX(3px);
          background-color: #FAF5F0;
        }

        @keyframes cardSmoothReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ========================================================
            RESPONSIVE MOBILE : Cartes flexibles et adaptatives
           ======================================================== */
        @media (max-width: 860px) {
          .services-section-wrapper {
            margin-bottom: 36px;
          }

          .services-grid-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            height: auto !important;
          }

          .service-card-item {
            grid-column: auto !important;
            grid-row: auto !important;
            width: 100% !important;
            border-radius: 20px !important;
            transition: min-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease !important;
          }

          .service-card-item.is-default-card {
            height: 175px !important;
          }

          .service-card-item.is-stacked-square {
            height: 130px !important;
          }

          .service-card-item.is-expanded {
            height: auto !important;
            min-height: 420px !important;
          }

          .content-default {
            padding: 16px !important;
          }

          .content-stacked {
            padding: 12px 14px !important;
          }

          .content-expanded {
            padding: 18px !important;
          }

          .service-features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
