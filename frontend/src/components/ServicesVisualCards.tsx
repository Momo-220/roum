"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, X } from "lucide-react";

interface ServiceOption {
  tag: string;
  desc: string;
}

interface ServiceItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  ctaText: string;
  options?: ServiceOption[];
  features: string[];
  metrics: { label: string; value: string }[];
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: "achats",
    badge: "Alibaba, 1688 & Taobao · Paiement Yuans RMB",
    title: "Centrale d'Achat",
    subtitle: "Règlement Mobile Money & négociation Chine",
    description:
      "Achetez directement sur Alibaba, 1688 et Taobao sans blocage bancaire international. Vous réglez en FCFA par Mobile Money (Wave, Orange Money, MTN, Moov) à taux négocié. Notre équipe en Chine paie votre fournisseur en Yuans (RMB), réceptionne vos cartons dans nos entrepôts de Guangzhou et Yiwu, puis assure l'expédition sécurisée avec dédouanement inclus.",
    image: "/images/services/achats.jpg",
    href: "/services?tab=alibaba",
    ctaText: "Lancer une commande Alibaba",
    options: [
      {
        tag: "Option 1 · Sans fournisseur",
        desc: "Vous n'avez pas de fournisseur ? Nous cherchons le produit, vérifions la fiabilité de l'usine chinoise et négocions le tarif direct usine.",
      },
      {
        tag: "Option 2 · Avec fournisseur",
        desc: "Vous avez déjà votre fournisseur ? Transmettez-nous son contact ou sa facture proforma, nous payons immédiatement en Yuans (RMB).",
      },
    ],
    features: [
      "Paiement en FCFA par Mobile Money (Wave, Orange, MTN, Moov)",
      "Zéro carte bancaire internationale requise",
      "Option 1 : Sourcing & négociation directe en usine",
      "Option 2 : Règlement Yuans RMB sous 24h pour votre fournisseur",
      "Réception, photos & pesée vidéo en entrepôt à Guangzhou/Yiwu",
      "Transit automatique vers l'Afrique avec dédouanement inclus",
    ],
    metrics: [
      { label: "Paiement client", value: "Mobile Money (FCFA)" },
      { label: "Règlement usine", value: "Yuans (RMB) en Chine" },
    ],
  },
  {
    id: "maritime",
    badge: "Bateau · Dès 300 000 FCFA / m³",
    title: "Voie Maritime",
    subtitle: "Groupage CBM & Conteneurs FCL",
    description:
      "Acheminement maritime par conteneurs sécurisés ou groupage au mètre cube (CBM) depuis Ningbo, Yiwu et Guangzhou. La solution la plus économique pour machines, équipements et gros volumes commerciaux, avec dédouanement 100% compris jusqu'à notre agence de Bingerville Carrefour Safari.",
    image: "/images/services/maritime.jpg",
    href: "/tariffs?mode=SEA",
    ctaText: "Estimer mon fret maritime",
    features: [
      "Groupage au mètre cube (CBM) sans minimum lourd",
      "Dédouanement et taxes de port intégralement compris",
      "Scellés de sécurité numérotés et suivi de conteneur en direct",
      "Départs maritimes hebdomadaires depuis Guangzhou et Yiwu",
      "Retrait direct en agence à Bingerville ou livraison",
    ],
    metrics: [
      { label: "Délai moyen", value: "35 à 45 jours" },
      { label: "Tarif groupage", value: "Dès 300 000 FCFA / m³" },
    ],
  },
  {
    id: "aerien",
    badge: "Avion · Express 4 à 5 Jours Chrono",
    title: "Voie Aérienne",
    subtitle: "Chine, Dubaï, Paris & Casablanca",
    description:
      "Vols réguliers chaque semaine pour vos colis urgents, échantillons, téléphones, cosmétiques et compléments. Deux formules adaptées : Voie Express (4 à 5 jours chrono) ou Voie Normale économique (12 à 14 jours). Dédouanement complet inclus au kilo avec pesée vidéo certifiée dès réception en magasin.",
    image: "/images/services/aerien.jpg",
    href: "/tariffs?mode=AIR",
    ctaText: "Calculer mon tarif aérien",
    features: [
      "Voie Express (4 à 5 j) & Voie Normale économique (12 à 14 j)",
      "Liaisons régulières Chine (CAN), Dubaï (DXB), Paris & Maroc",
      "Dédouanement intégral compris dans le prix au kilo",
      "Enregistrement vidéo de la pesée dès arrivée en entrepôt",
      "Retrait immédiat à Bingerville Carrefour Safari",
    ],
    metrics: [
      { label: "Délai express", value: "4 à 5 jours ouvrés" },
      { label: "Tarif indicatif", value: "Dès 10 000 FCFA / kg" },
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
      {/* En-tête de section éditorial */}
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
          DISPOSITION DESKTOP (> 860px)
         ======================================================== */}
      <div className="desktop-cards-container">
        <div className={`desktop-grid ${activeId !== null ? "has-active" : "is-default"}`}>
          {SERVICES_DATA.map((service) => {
            const isExpanded = activeId === service.id;
            const isStackedSquare = activeId !== null && !isExpanded;
            const isHovered = hoveredCard === service.id;
            const placementStyle = getDesktopGridPlacement(service.id);

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
                {/* 1. Photographie de fond */}
                <img
                  src={service.image}
                  alt={service.title}
                  className="service-card-bg-image"
                  style={{
                    transform: isExpanded ? "scale(1.05)" : isHovered ? "scale(1.03)" : "scale(1.0)",
                  }}
                />

                {/* 2. Scrim Gradient Cinématographique */}
                <div
                  className="service-card-scrim"
                  style={{
                    background: isExpanded
                      ? "linear-gradient(to right, rgba(20, 13, 9, 0.96) 0%, rgba(20, 13, 9, 0.90) 45%, rgba(20, 13, 9, 0.82) 100%)"
                      : isStackedSquare
                      ? "linear-gradient(to top, rgba(20, 13, 9, 0.95) 0%, rgba(20, 13, 9, 0.55) 50%, rgba(20, 13, 9, 0.1) 100%)"
                      : "linear-gradient(to top, rgba(20, 13, 9, 0.95) 0%, rgba(20, 13, 9, 0.58) 45%, rgba(20, 13, 9, 0.08) 72%, rgba(0, 0, 0, 0.2) 100%)",
                  }}
                />

                {/* BOUTON FERMER STRICTEMENT À L'EXTRÉMITÉ SUPÉRIEURE DROITE */}
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
                    <X size={16} />
                  </button>
                )}

                {/* 3. Contenu de la carte (Plein cadre absolu : 100% hauteur garantie) */}
                <div
                  className={`service-card-content ${
                    isExpanded ? "content-expanded" : isStackedSquare ? "content-stacked" : "content-default"
                  }`}
                >
                  {/* Haut : Titre Badge pur (SANS CONTOUR, SANS FOND, SANS POINT VERT) */}
                  <div className="service-card-top-bar">
                    <div className="service-micro-badge">
                      <span>{service.badge}</span>
                    </div>
                  </div>

                  {/* Bas : Corps selon état */}
                  {isStackedSquare ? (
                    <div className="service-stacked-bottom">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="service-title-stacked">{service.title}</h3>
                        <p className="service-subtitle-stacked">{service.subtitle}</p>
                      </div>
                      {/* Flèche d'ouverture de la carte */}
                      <div className={`service-action-badge ${isHovered ? "is-hovered" : ""}`}>
                        <ArrowDownRight size={16} strokeWidth={2.4} />
                      </div>
                    </div>
                  ) : !isExpanded ? (
                    /* Vue au repos : Flèche d'origine qui ouvre la carte au clic */
                    <div className="service-default-bottom">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="service-title-default">{service.title}</h3>
                        <p className="service-subtitle-default">{service.subtitle}</p>
                      </div>
                      {/* Flèche d'origine rétablie */}
                      <div className={`service-action-badge ${isHovered ? "is-hovered" : ""}`}>
                        <ArrowDownRight size={18} strokeWidth={2.4} />
                      </div>
                    </div>
                  ) : (
                    /* Vue étendue complète : ZÉRO CADRE, POINTS ÉLÉGANTS, BOUTON REDIRECTION PROÉMINENT */
                    <div className="service-expanded-body">
                      <div>
                        <h3 className="service-title-expanded">{service.title}</h3>
                        <p className="service-desc-expanded">{service.description}</p>
                      </div>

                      {/* Les 2 Options Spécifiques (Alibaba) : ZÉRO CADRE, TYPOGRAPHIE PURE */}
                      {service.options && (
                        <div className="service-options-container">
                          {service.options.map((opt, oIdx) => (
                            <div key={oIdx} className="service-option-item">
                              <span className="service-option-tag">{opt.tag}</span>
                              <p className="service-option-desc">{opt.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Métriques : ÉPURÉES EN LIGNE SANS CADRE NI BOÎTE */}
                      <div className="service-metrics-row">
                        {service.metrics.map((m, idx) => (
                          <div key={idx} className="service-metric-item">
                            <span className="service-metric-label">{m.label} :</span>
                            <span className="service-metric-value">{m.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Points / Caractéristiques : AVEC DE VRAIS POINTS (AUCUN CHECK VERT) */}
                      <div className="service-features-grid">
                        {service.features.map((feat, idx) => (
                          <div key={idx} className="service-feature-row">
                            <span className="service-feature-dot" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bouton de Redirection Sans Contour (Uniquement quand ça déplie) */}
                      <div style={{ paddingTop: "10px" }}>
                        <Link href={service.href} className="service-cta-button">
                          <span>{service.ctaText}</span>
                          <ArrowRight size={16} />
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
          DISPOSITION MOBILE (< 860px)
         ======================================================== */}
      <div className="mobile-cards-container">
        {activeId === null ? (
          <div className="mobile-horizontal-scroll">
            {SERVICES_DATA.map((service) => (
              <div
                key={service.id}
                onClick={(e) => handleCardClick(service.id, e)}
                className="mobile-card-slide"
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="service-card-bg-image"
                />
                <div
                  className="service-card-scrim"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(20, 13, 9, 0.95) 0%, rgba(20, 13, 9, 0.58) 45%, rgba(20, 13, 9, 0.08) 72%, rgba(0, 0, 0, 0.2) 100%)",
                  }}
                />
                <div className="service-card-content content-default">
                  <div className="service-card-top-bar">
                    <div className="service-micro-badge">
                      <span>{service.badge}</span>
                    </div>
                  </div>
                  <div className="service-default-bottom">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="service-title-default">{service.title}</h3>
                      <p className="service-subtitle-default">{service.subtitle}</p>
                    </div>
                    {/* Flèche d'origine mobile qui ouvre la carte */}
                    <div className="service-action-badge">
                      <ArrowDownRight size={18} strokeWidth={2.4} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mobile-active-layout">
            {(() => {
              const activeService = SERVICES_DATA.find((s) => s.id === activeId)!;
              return (
                <div className="mobile-active-card">
                  <img
                    src={activeService.image}
                    alt={activeService.title}
                    className="service-card-bg-image"
                  />
                  <div
                    className="service-card-scrim"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(20, 13, 9, 0.96) 0%, rgba(20, 13, 9, 0.90) 100%)",
                    }}
                  />

                  {/* Bouton croix strictement à l'extrémité sur mobile */}
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="service-close-button"
                    title="Fermer"
                    aria-label="Fermer"
                  >
                    <X size={16} />
                  </button>

                  <div className="service-card-content content-expanded">
                    <div className="service-card-top-bar">
                      <div className="service-micro-badge">
                        <span>{activeService.badge}</span>
                      </div>
                    </div>

                    <div className="service-expanded-body">
                      <div>
                        <h3 className="service-title-expanded">{activeService.title}</h3>
                        <p className="service-desc-expanded">{activeService.description}</p>
                      </div>

                      {/* Les 2 Options Spécifiques (Alibaba) : ZÉRO CADRE */}
                      {activeService.options && (
                        <div className="service-options-container">
                          {activeService.options.map((opt, oIdx) => (
                            <div key={oIdx} className="service-option-item">
                              <span className="service-option-tag">{opt.tag}</span>
                              <p className="service-option-desc">{opt.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Métriques épurées sans boîte */}
                      <div className="service-metrics-row">
                        {activeService.metrics.map((m, idx) => (
                          <div key={idx} className="service-metric-item">
                            <span className="service-metric-label">{m.label} :</span>
                            <span className="service-metric-value">{m.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Points au lieu de checks */}
                      <div className="service-features-grid">
                        {activeService.features.map((feat, idx) => (
                          <div key={idx} className="service-feature-row">
                            <span className="service-feature-dot" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bouton de redirection déployé sans contour */}
                      <div style={{ paddingTop: "10px" }}>
                        <Link href={activeService.href} className="service-cta-button">
                          <span>{activeService.ctaText}</span>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Deux autres cartes en carrés en-dessous */}
            <div className="mobile-secondary-squares-row">
              {SERVICES_DATA.filter((s) => s.id !== activeId).map((service) => (
                <div
                  key={service.id}
                  onClick={(e) => handleCardClick(service.id, e)}
                  className="mobile-square-card"
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className="service-card-bg-image"
                  />
                  <div
                    className="service-card-scrim"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(20, 13, 9, 0.95) 0%, rgba(20, 13, 9, 0.55) 50%, rgba(20, 13, 9, 0.15) 100%)",
                    }}
                  />
                  <div className="service-card-content content-stacked">
                    <div className="service-card-top-bar">
                      <div className="service-micro-badge">
                        <span>{service.badge.split(" · ")[0]}</span>
                      </div>
                    </div>
                    <div className="service-stacked-bottom">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="service-title-stacked" style={{ fontSize: "1.02rem" }}>
                          {service.title}
                        </h3>
                        <p className="service-subtitle-stacked" style={{ fontSize: "0.7rem" }}>
                          {service.subtitle}
                        </p>
                      </div>
                      <div className="service-action-badge" style={{ width: "32px", height: "32px" }}>
                        <ArrowDownRight size={15} strokeWidth={2.4} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          STYLES CSS RESPONSIFS ET ANIMATIONS FLUIDES
         ======================================================== */}
      <style jsx>{`
        .services-section-wrapper {
          margin-bottom: 56px;
        }

        .services-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .services-eyebrow {
          display: inline-block;
          font-size: 0.74rem;
          font-family: var(--c-font-mono);
          font-weight: 700;
          color: var(--c-text-light);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .services-heading {
          font-family: var(--c-font-display);
          font-size: clamp(1.6rem, 3.8vw, 2.6rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.035em;
          color: var(--c-text-main);
          margin: 0 auto 10px auto;
          max-width: 760px;
        }

        .services-subtext {
          font-size: clamp(0.85rem, 1.4vw, 0.96rem);
          color: var(--c-text-muted);
          max-width: 580px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Desktop Layout */
        .desktop-cards-container {
          display: block;
        }

        .mobile-cards-container {
          display: none;
        }

        .desktop-grid {
          display: grid;
          width: 100%;
          gap: 18px;
          height: 430px;
          transition: grid-template-columns 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .desktop-grid.is-default {
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: 1fr;
        }

        .desktop-grid.has-active {
          grid-template-columns: 2.2fr 1fr;
          grid-template-rows: 1fr 1fr;
          height: 560px;
        }

        .service-card-item {
          position: relative;
          border-radius: 26px;
          overflow: hidden;
          cursor: pointer;
          background-color: #1B1411;
          border: none !important;
          box-shadow: 0 10px 30px -8px rgba(27, 20, 17, 0.14);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s ease;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }

        .service-card-item:hover {
          box-shadow: 0 18px 40px -8px rgba(27, 20, 17, 0.24);
        }

        .service-card-item.is-expanded {
          box-shadow: 0 22px 48px -8px rgba(20, 13, 9, 0.32);
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

        /* Conteneur plein cadre avec position absolue : zéro décalage */
        .service-card-content {
          position: absolute;
          inset: 0;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-sizing: border-box;
        }

        .content-default {
          padding: 24px 22px;
        }

        .content-stacked {
          padding: 16px 18px;
        }

        .content-expanded {
          padding: 26px 28px;
        }

        .service-card-top-bar {
          display: flex;
          justifyContent: space-between;
          align-items: center;
          width: 100%;
        }

        /* Titre haut de carte : AUCUN CONTOUR, AUCUN FOND, JUSTE LE TITRE TEXTE */
        .service-micro-badge {
          display: inline-block;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          padding: 0 !important;
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.73rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: var(--c-font-mono);
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6);
        }

        /* BOUTON FERMER : STRICTEMENT À L'EXTRÉMITÉ SUPÉRIEURE DROITE */
        .service-close-button {
          position: absolute;
          top: 22px;
          right: 22px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.2);
          border: none !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 25;
          transition: all 0.2s ease;
        }

        .service-close-button:hover {
          background-color: rgba(255, 255, 255, 0.38);
          transform: scale(1.08);
        }

        /* Bas de carte par défaut : STRICTEMENT EN BAS AVEC MARGIN-TOP AUTO */
        .service-default-bottom {
          margin-top: auto;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          width: 100%;
        }

        .service-stacked-bottom {
          margin-top: auto;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
        }

        .service-title-default {
          font-family: var(--c-font-display);
          font-size: clamp(1.35rem, 1.9vw, 1.7rem);
          font-weight: 700;
          line-height: 1.14;
          letter-spacing: -0.03em;
          color: #FFFFFF;
          margin: 0 0 5px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .service-subtitle-default {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.88);
          line-height: 1.4;
          margin: 0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
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
          color: rgba(255, 255, 255, 0.84);
          line-height: 1.3;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Action Badge Flèche D'ORIGINE : OUVERTURE DE CARTE AU CLIC */
        .service-action-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: none !important;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .service-card-item:hover .service-action-badge,
        .service-action-badge.is-hovered {
          background-color: #FFFFFF;
          color: #140D09;
          transform: scale(1.08);
        }

        /* Corps Étendu */
        .service-expanded-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          animation: cardSmoothReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .service-title-expanded {
          font-family: var(--c-font-display);
          font-size: clamp(1.5rem, 2.3vw, 1.95rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.035em;
          color: #FFFFFF;
          margin: 0 0 6px 0;
        }

        .service-desc-expanded {
          font-size: 0.86rem;
          line-height: 1.46;
          color: rgba(255, 255, 255, 0.92);
          max-width: 620px;
          margin: 0;
        }

        /* Options 1 et 2 pour Alibaba : ZÉRO CADRE, TYPOGRAPHIE PURE */
        .service-options-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 10px 16px;
        }

        .service-option-item {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        .service-option-tag {
          display: block;
          font-size: 0.74rem;
          font-family: var(--c-font-mono);
          font-weight: 700;
          color: #FFA066;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }

        .service-option-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.38;
          margin: 0;
        }

        /* Métriques : ZÉRO CADRE, ZÉRO BOÎTE */
        .service-metrics-row {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
        }

        .service-metric-item {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
        }

        .service-metric-label {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
          font-family: var(--c-font-mono);
          letter-spacing: 0.05em;
        }

        .service-metric-value {
          font-family: 'Bricolage Grotesque', var(--font-display), sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          color: #FFFFFF;
          font-variant-numeric: tabular-nums;
        }

        /* Caractéristiques : LISTE AVEC POINTS (ZÉRO CHECK VERT) */
        .service-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 7px 16px;
        }

        .service-feature-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .service-feature-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.85);
          display: inline-block;
          flex-shrink: 0;
        }

        /* Bouton de Redirection Sans Contour (Uniquement quand ça déplie) */
        .service-cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 24px;
          border-radius: 9999px;
          background-color: #FFFFFF;
          color: #140D09;
          border: none !important;
          font-size: 0.84rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, background-color 0.2s ease;
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
            RESPONSIVE MOBILE (< 860px)
           ======================================================== */
        @media (max-width: 860px) {
          .desktop-cards-container {
            display: none !important;
          }

          .mobile-cards-container {
            display: block !important;
          }

          .service-close-button {
            top: 16px !important;
            right: 16px !important;
            width: 32px !important;
            height: 32px !important;
          }

          .mobile-horizontal-scroll {
            display: flex;
            gap: 14px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            padding: 4px 16px 14px 16px;
            margin: 0 -16px;
          }

          .mobile-horizontal-scroll::-webkit-scrollbar {
            display: none;
          }

          .mobile-card-slide {
            flex: 0 0 84%;
            max-width: 310px;
            height: 380px;
            scroll-snap-align: center;
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            background-color: #1B1411;
            border: none !important;
            box-shadow: 0 10px 28px -6px rgba(27, 20, 17, 0.16);
            cursor: pointer;
            box-sizing: border-box;
          }

          .mobile-active-layout {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .mobile-active-card {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            background-color: #1B1411;
            border: none !important;
            box-shadow: 0 14px 34px -8px rgba(20, 13, 9, 0.32);
            min-height: 480px;
            animation: cardSmoothReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .mobile-active-card .service-features-grid {
            grid-template-columns: 1fr !important;
          }

          .mobile-secondary-squares-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .mobile-square-card {
            position: relative;
            height: 145px;
            border-radius: 18px;
            overflow: hidden;
            background-color: #1B1411;
            border: none !important;
            box-shadow: 0 6px 18px -4px rgba(27, 20, 17, 0.12);
            cursor: pointer;
          }
        }
      `}</style>
    </section>
  );
}
