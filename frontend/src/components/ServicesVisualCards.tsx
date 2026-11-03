"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, X } from "lucide-react";

interface ServiceItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  ctaText: string;
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: "maritime",
    badge: "Bateau · Groupage & Conteneurs",
    title: "Voie Maritime",
    subtitle: "Chine vers Abidjan, Bamako & Dakar",
    description:
      "Acheminement par conteneurs sécurisés ou groupage au mètre cube (CBM). Solution économique pour charges lourdes et gros volumes avec dédouanement intégral inclus jusqu'au retrait à Bingerville.",
    image: "/images/services/maritime.jpg",
    href: "/services?tab=transit",
    ctaText: "Découvrir la Voie Maritime",
  },
  {
    id: "aerien",
    badge: "Avion · Express 3 à 5 Jours",
    title: "Voie Aérienne",
    subtitle: "Chine, Dubaï, France & Maroc direct",
    description:
      "Vols cargos réguliers chaque semaine pour vos colis urgents, échantillons, téléphones et cosmétiques. Pesée certifiée en vidéo et mise à disposition rapide sans formalités douanières.",
    image: "/images/services/aerien.jpg",
    href: "/services?tab=colis",
    ctaText: "Découvrir la Voie Aérienne",
  },
  {
    id: "achats",
    badge: "Alibaba & 1688 · Paiement RMB",
    title: "Centrale d'Achat",
    subtitle: "Paiement fournisseurs & contrôle qualité",
    description:
      "Achetez sur Alibaba, 1688 et Taobao sans blocage bancaire international. Vous réglez en FCFA à Abidjan à taux direct, notre bureau en Chine paie votre usine en Yuans (RMB) et vérifie vos colis en entrepôt.",
    image: "/images/services/achats.jpg",
    href: "/services?tab=alibaba",
    ctaText: "Découvrir la Centrale d'Achat",
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

  // Placement CSS Grid pour Desktop
  const getDesktopGridPlacement = (serviceId: string): React.CSSProperties => {
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
      {/* En-tête de section équilibré */}
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
          DISPOSITION DESKTOP (> 860px) :
          - Par défaut : 3 cartes cinématographiques côte-à-côte bien espacées
          - Au clic : 1 grand rectangle à gauche + 2 carrés superposés à droite
         ======================================================== */}
      <div className="desktop-cards-container">
        <div
          className={`desktop-grid ${
            activeId === null ? "is-default" : "has-active"
          }`}
        >
          {SERVICES_DATA.map((service) => {
            const isExpanded = activeId === service.id;
            const isStackedSquare = activeId !== null && !isExpanded;
            const gridStyle = getDesktopGridPlacement(service.id);

            return (
              <div
                key={service.id}
                onClick={(e) => handleCardClick(service.id, e)}
                onMouseEnter={() => setHoveredCard(service.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={gridStyle}
                className={`service-card-item ${
                  isExpanded ? "is-expanded" : ""
                } ${isStackedSquare ? "is-stacked-square" : ""}`}
              >
                {/* Image de fond plein cadre */}
                <img
                  src={service.image}
                  alt={service.title}
                  className="service-card-bg-image"
                />

                {/* Dégradé cinématique sombre pour lisibilité 100% */}
                <div
                  className="service-card-scrim"
                  style={{
                    background: isExpanded
                      ? "linear-gradient(to bottom, rgba(20, 13, 9, 0.92) 0%, rgba(20, 13, 9, 0.97) 100%)"
                      : isStackedSquare
                      ? "linear-gradient(to top, rgba(20, 13, 9, 0.95) 0%, rgba(20, 13, 9, 0.6) 50%, rgba(20, 13, 9, 0.2) 100%)"
                      : "linear-gradient(to top, rgba(20, 13, 9, 0.94) 0%, rgba(20, 13, 9, 0.5) 45%, rgba(20, 13, 9, 0.12) 75%, rgba(0, 0, 0, 0.2) 100%)",
                  }}
                />

                {/* Contenu de la carte */}
                <div
                  className={`service-card-content ${
                    isExpanded
                      ? "content-expanded"
                      : isStackedSquare
                      ? "content-stacked"
                      : "content-default"
                  }`}
                >
                  {/* Barre supérieure : Badge / Bouton Fermer */}
                  <div className="service-card-top-bar">
                    <div className="service-micro-badge">
                      <span className="service-badge-dot" />
                      <span>
                        {isStackedSquare
                          ? service.badge.split(" · ")[0]
                          : service.badge}
                      </span>
                    </div>

                    {isExpanded && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(null);
                        }}
                        className="service-close-button"
                        aria-label="Fermer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Mode Repos (3 cartes) */}
                  {!isExpanded && !isStackedSquare && (
                    <div className="service-default-bottom">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="service-title-default">{service.title}</h3>
                        <p className="service-subtitle-default">{service.subtitle}</p>
                      </div>
                      <div
                        className={`service-action-badge ${
                          hoveredCard === service.id ? "is-hovered" : ""
                        }`}
                      >
                        <ArrowDownRight size={18} strokeWidth={2.4} />
                      </div>
                    </div>
                  )}

                  {/* Mode Carré Superposé (Quand un autre service est actif) */}
                  {isStackedSquare && (
                    <div className="service-stacked-bottom">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="service-title-stacked">{service.title}</h3>
                        <p className="service-subtitle-stacked">{service.subtitle}</p>
                      </div>
                      <div className="service-action-badge">
                        <ArrowDownRight size={16} strokeWidth={2.4} />
                      </div>
                    </div>
                  )}

                  {/* Mode Déplié (Grand Rectangle Actif) : Description sobre & ciblée */}
                  {isExpanded && (
                    <div className="service-expanded-body">
                      <div>
                        <h3 className="service-title-expanded">{service.title}</h3>
                        <p className="service-desc-expanded">{service.description}</p>
                      </div>
                      <div style={{ paddingTop: "8px" }}>
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
      </div>

      {/* ========================================================
          DISPOSITION MOBILE (<= 860px) :
          Déroulement 100% vertical, naturel et aéré (zéro swipe horizontal)
          - Chaque service s'affiche verticalement dans le flux normal
          - Un toucher déplie immédiatement la description du service en place
         ======================================================== */}
      <div className="mobile-cards-container">
        <div className="mobile-vertical-stack">
          {SERVICES_DATA.map((service) => {
            const isExpanded = activeId === service.id;

            return (
              <div
                key={service.id}
                onClick={(e) => handleCardClick(service.id, e)}
                className={`mobile-vertical-card ${
                  isExpanded ? "is-expanded" : ""
                }`}
              >
                {/* Image de fond */}
                <img
                  src={service.image}
                  alt={service.title}
                  className="service-card-bg-image"
                />

                {/* Dégradé sombre */}
                <div
                  className="service-card-scrim"
                  style={{
                    background: isExpanded
                      ? "linear-gradient(to bottom, rgba(20, 13, 9, 0.94) 0%, rgba(20, 13, 9, 0.98) 100%)"
                      : "linear-gradient(to top, rgba(20, 13, 9, 0.94) 0%, rgba(20, 13, 9, 0.55) 50%, rgba(20, 13, 9, 0.15) 80%, rgba(0, 0, 0, 0.2) 100%)",
                  }}
                />

                {/* Contenu */}
                <div className="mobile-card-inner">
                  {/* Barre supérieure avec badge et bouton fermer si ouvert */}
                  <div className="service-card-top-bar">
                    <div className="service-micro-badge">
                      <span className="service-badge-dot" />
                      <span>{service.badge}</span>
                    </div>

                    {isExpanded && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(null);
                        }}
                        className="service-close-button"
                        aria-label="Fermer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Vue Fermée : Titre, sous-titre et bouton flèche */}
                  {!isExpanded && (
                    <div className="mobile-card-bottom-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="service-title-default">{service.title}</h3>
                        <p className="service-subtitle-default">{service.subtitle}</p>
                      </div>
                      <div className="service-action-badge">
                        <ArrowDownRight size={18} strokeWidth={2.4} />
                      </div>
                    </div>
                  )}

                  {/* Vue Dépliée : Description fluide & bouton CTA direct */}
                  {isExpanded && (
                    <div className="mobile-expanded-content">
                      <div>
                        <h3 className="service-title-expanded">{service.title}</h3>
                        <p className="service-desc-expanded">{service.description}</p>
                      </div>
                      <div style={{ paddingTop: "10px" }}>
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
      </div>

      <style jsx>{`
        .services-section-wrapper {
          margin-top: 36px;
          margin-bottom: 24px;
        }

        .services-header {
          text-align: center;
          margin-bottom: 24px;
          padding: 0 12px;
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

        /* Desktop Layout (> 860px) */
        .desktop-cards-container {
          display: block;
        }

        .mobile-cards-container {
          display: none;
        }

        .desktop-grid {
          display: grid;
          width: 100%;
          gap: 16px;
          height: 460px;
          transition: grid-template-columns 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      grid-template-rows 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .desktop-grid.is-default {
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: 1fr;
        }

        .desktop-grid.has-active {
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
          padding: 22px;
        }

        .content-stacked {
          padding: 16px;
        }

        .content-expanded {
          padding: 28px;
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
          width: 38px;
          height: 38px;
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

        .service-expanded-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          animation: cardSmoothReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .service-title-expanded {
          font-family: var(--c-font-display);
          font-size: clamp(1.35rem, 2.2vw, 1.85rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.035em;
          color: #FFFFFF;
          margin: 0 0 8px 0;
        }

        .service-desc-expanded {
          font-size: 0.88rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.92);
          max-width: 620px;
          margin: 0;
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
            DISPOSITION MOBILE (<= 860px) : 
            100% Verticale, naturelle, sans swipe ni journal
           ======================================================== */
        @media (max-width: 860px) {
          .desktop-cards-container {
            display: none !important;
          }

          .mobile-cards-container {
            display: block !important;
          }

          .mobile-vertical-stack {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 0 4px;
          }

          .mobile-vertical-card {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            background-color: #1B1411;
            border: 1px solid rgba(28, 25, 23, 0.1);
            box-shadow: 0 8px 24px -4px rgba(27, 20, 17, 0.12);
            cursor: pointer;
            min-height: 220px;
            display: flex;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .mobile-vertical-card.is-expanded {
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 14px 32px -6px rgba(20, 13, 9, 0.3);
            min-height: 270px;
          }

          .mobile-card-inner {
            position: relative;
            z-index: 3;
            width: 100%;
            display: flex;
            flex-direction: column;
            justifyContent: space-between;
            padding: 18px;
            box-sizing: border-box;
          }

          .mobile-card-bottom-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 10px;
            width: 100%;
          }

          .mobile-expanded-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            animation: cardSmoothReveal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .mobile-expanded-content .service-title-expanded {
            font-size: 1.35rem;
            margin-bottom: 6px;
          }

          .mobile-expanded-content .service-desc-expanded {
            font-size: 0.84rem;
            line-height: 1.48;
          }
        }
      `}</style>
    </section>
  );
}

export default ServicesVisualCards;
