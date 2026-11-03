"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock,
  ShieldCheck,
  X,
  ChevronRight,
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
      "Acheminement par conteneurs sécurisés (FCL) ou groupage au mètre cube (LCL / CBM). La solution idéale pour les commerçants, machines lourdes et gros volumes avec dédouanement complet inclus au port.",
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
      "Vols cargos réguliers chaque semaine pour vos colis urgents, échantillons, valises, téléphones et cosmétiques. Pesée certifiée et retrait immédiat à notre agence sans formalités douanières complexes.",
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
      "Achetez directement sur Alibaba, 1688 et Taobao sans blocage bancaire international. Vous réglez en FCFA à Abidjan à taux négocié, notre bureau en Chine paie votre usine en Yuans (RMB) et vérifie vos cartons.",
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
  // Par défaut, le premier service peut être étendu ou null selon l'interaction.
  // Quand l'utilisateur clique sur une carte, elle se déploie en rectangle vers la droite.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleCardClick = (id: string, e: React.MouseEvent) => {
    // Si on clique sur le bouton de fermeture ou le CTA, laisser l'action se faire.
    const target = e.target as HTMLElement;
    if (target.closest(".service-cta-button") || target.closest(".service-close-button")) {
      return;
    }
    // Bascule : si déjà actif, referme, sinon déploie la carte sélectionnée vers la droite
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <section style={{ marginBottom: "64px" }}>
      {/* En-tête de section éditorial Roum Transit */}
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
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
            fontWeight: 700,
            lineHeight: 1.12,
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
          Touchez un service pour dérouler ses détails, délais et garanties.
        </p>
      </div>

      {/* ========================================================
          CONTENEUR FLUIDE À DÉPLOIEMENT VERS LA DROITE (ACCORDÉON HORIZONTAL)
          - Desktop : Déploiement horizontal fluide vers la droite (flex-grow)
          - Mobile : Déploiement vertical fluide avec détails immersifs
         ======================================================== */}
      <div className="services-interactive-wrapper">
        {SERVICES_DATA.map((service) => {
          const isExpanded = activeId === service.id;
          const isHovered = hoveredCard === service.id;

          return (
            <div
              key={service.id}
              onClick={(e) => handleCardClick(service.id, e)}
              onMouseEnter={() => setHoveredCard(service.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`service-morph-card ${isExpanded ? "is-expanded" : ""}`}
              style={{
                position: "relative",
                borderRadius: "28px",
                overflow: "hidden",
                cursor: "pointer",
                border: isExpanded
                  ? "1px solid rgba(255, 255, 255, 0.45)"
                  : "1px solid rgba(28, 25, 23, 0.09)",
                boxShadow: isExpanded
                  ? "0 24px 50px -10px rgba(20, 13, 9, 0.28), 0 8px 20px -4px rgba(20, 13, 9, 0.12)"
                  : isHovered
                  ? "0 16px 36px -8px rgba(27, 20, 17, 0.18)"
                  : "0 10px 30px -8px rgba(27, 20, 17, 0.12), 0 2px 8px -2px rgba(27, 20, 17, 0.04)",
                backgroundColor: "#1B1411",
                transition:
                  "flex 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease, box-shadow 0.4s ease, border-color 0.3s ease",
              }}
            >
              {/* 1. Photographie de fond (Même image, zoom progressif doux) */}
              <img
                src={service.image}
                alt={service.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: isExpanded ? "scale(1.08)" : isHovered ? "scale(1.04)" : "scale(1.0)",
                  transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  zIndex: 1,
                }}
              />

              {/* 2. Scrim Gradient de Contraste (Signature Roum) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: isExpanded
                    ? "linear-gradient(to right, rgba(20, 13, 9, 0.95) 0%, rgba(20, 13, 9, 0.88) 45%, rgba(20, 13, 9, 0.82) 100%)"
                    : "linear-gradient(to top, rgba(20, 13, 9, 0.94) 0%, rgba(20, 13, 9, 0.55) 45%, rgba(20, 13, 9, 0.12) 75%, rgba(0, 0, 0, 0.2) 100%)",
                  zIndex: 2,
                  transition: "background 0.5s ease",
                  pointerEvents: "none",
                }}
              />

              {/* 3. Contenu de la carte */}
              <div
                style={{
                  position: "relative",
                  zIndex: 3,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: isExpanded ? "26px" : "22px",
                  boxSizing: "border-box",
                }}
              >
                {/* Ligne Supérieure : Micro-tag ou Bouton de fermeture */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
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

                  {/* Bouton pour replier quand déplié */}
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
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        border: "1px solid rgba(255, 255, 255, 0.35)",
                        backdropFilter: "blur(12px)",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease, transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.35)";
                        e.currentTarget.style.transform = "scale(1.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                        e.currentTarget.style.transform = "scale(1.0)";
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* ========================================================
                    ZONE PRINCIPALE : DEUX ÉTATS (PLIÉ VS DÉROULÉ VERS LA DROITE)
                   ======================================================== */}
                {!isExpanded ? (
                  /* État Compact : Titre + Sous-titre + Bouton ArrowDownRight */
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: "14px",
                      width: "100%",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontFamily: "var(--c-font-display)",
                          fontSize: "clamp(1.35rem, 1.8vw, 1.7rem)",
                          fontWeight: 700,
                          lineHeight: 1.12,
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
                          lineHeight: 1.4,
                          margin: 0,
                          textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
                        }}
                      >
                        {service.subtitle}
                      </p>
                    </div>

                    {/* Badge Glassmorphism avec flèche diagonale qui invite à ouvrir */}
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: isHovered
                          ? "#FFFFFF"
                          : "rgba(255, 255, 255, 0.18)",
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
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
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
                ) : (
                  /* État Déroulé vers la Droite : Description complète + Garanties + CTA */
                  <div
                    className="service-expanded-body"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "18px",
                      width: "100%",
                      animation: "fadeInExpand 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontFamily: "var(--c-font-display)",
                          fontSize: "clamp(1.6rem, 2.4vw, 2.1rem)",
                          fontWeight: 700,
                          lineHeight: 1.1,
                          letterSpacing: "-0.035em",
                          color: "#FFFFFF",
                          margin: "0 0 8px 0",
                        }}
                      >
                        {service.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.94rem",
                          lineHeight: 1.55,
                          color: "rgba(255, 255, 255, 0.92)",
                          maxWidth: "680px",
                          margin: 0,
                        }}
                      >
                        {service.description}
                      </p>
                    </div>

                    {/* Métriques / Chiffres Clés en Badges Lin */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {service.metrics.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "10px",
                            padding: "6px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "rgba(255, 255, 255, 0.7)",
                              textTransform: "uppercase",
                              fontFamily: "var(--c-font-mono)",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {m.label}
                          </span>
                          <span
                            style={{
                              fontSize: "0.86rem",
                              fontWeight: 700,
                              color: "#FFFFFF",
                            }}
                          >
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Liste des Garanties avec Checkmarks */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "8px 14px",
                      }}
                    >
                      {service.features.map((feat, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "0.82rem",
                            color: "rgba(255, 255, 255, 0.9)",
                          }}
                        >
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              backgroundColor: "#22C55E",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Check size={11} color="#FFFFFF" strokeWidth={3} />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bouton CTA d'Action Finale vers la page */}
                    <div style={{ paddingTop: "8px" }}>
                      <Link
                        href={service.href}
                        className="service-cta-button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "12px 24px",
                          borderRadius: "9999px",
                          backgroundColor: "#FFFFFF",
                          color: "#140D09",
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
                          transition: "transform 0.2s ease, background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateX(4px)";
                          e.currentTarget.style.backgroundColor = "#FAF5F0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
                        }}
                      >
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

      {/* ========================================================
          STYLES CSS RESPONSIFS ET ANIMATIONS DE DÉPLOIEMENT
         ======================================================== */}
      <style jsx>{`
        /* Desktop : Accordéon horizontal fluide */
        .services-interactive-wrapper {
          display: flex;
          gap: 20px;
          width: 100%;
          min-height: 440px;
          align-items: stretch;
        }

        .service-morph-card {
          flex: 1;
          min-width: 0;
          height: 440px;
        }

        /* Quand une carte est cliquée, elle se déploie vers la droite */
        .service-morph-card.is-expanded {
          flex: 2.8;
        }

        @keyframes fadeInExpand {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile : Accordéon vertical fluide sous le pouce */
        @media (max-width: 860px) {
          .services-interactive-wrapper {
            flex-direction: column !important;
            gap: 16px !important;
            min-height: auto !important;
          }

          .service-morph-card {
            flex: none !important;
            width: 100% !important;
            height: 240px !important;
            transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease !important;
          }

          .service-morph-card.is-expanded {
            flex: none !important;
            width: 100% !important;
            height: 520px !important;
          }
        }
      `}</style>
    </section>
  );
}
