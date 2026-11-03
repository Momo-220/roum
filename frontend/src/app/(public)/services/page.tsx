"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Ship,
  Plane,
  ShoppingBag,
  ShieldCheck,
  Scale,
  MapPin,
  Clock,
  ArrowRight,
  MessageCircle,
  Check,
  Sparkles,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

interface ServiceBlock {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  priceHighlight: string;
  features: string[];
  waMessage: string;
}

const SERVICES_CATALOG: ServiceBlock[] = [
  {
    id: "maritime",
    badge: "Voie Maritime · Groupage CBM & Conteneurs FCL",
    title: "Transport Maritime International",
    subtitle: "Chine (Ningbo, Guangzhou, Yiwu) & Dubaï ➔ Côte d'Ivoire & Afrique",
    description:
      "La solution la plus économique et robuste pour vos marchandises lourdes, machines, outillage, pièces volumineuses et gros stocks. Vos colis sont soigneusement scellés en conteneurs maritimes et dédouanés intégralement au port d'Abidjan.",
    image: "/images/services/maritime.jpg",
    priceHighlight: "Dès 300 000 FCFA / m³ (CBM)",
    features: [
      "Groupage au mètre cube (CBM) sans minimum lourd exigé",
      "Dédouanement 100% inclus jusqu'à notre agence de Bingerville",
      "Traçabilité par conteneur et scellés de sécurité garantis",
      "Départs réguliers chaque semaine depuis les ports de Ningbo & Yiwu",
    ],
    waMessage:
      "Bonjour Roum Transit, je souhaite des informations pour une expédition par voie maritime (bateau).",
  },
  {
    id: "aerien",
    badge: "Voie Aérienne · Express 3 à 5 Jours",
    title: "Fret Aérien Express Régulier",
    subtitle: "Chine, Dubaï, France (Paris) & Maroc (Casablanca) ➔ Abidjan",
    description:
      "Vols cargos réguliers chaque semaine pour vos commandes urgentes, téléphones, électronique de valeur, cosmétiques et prêt-à-porter. Vos colis sont filmés et pesés dès leur arrivée dans nos entrepôts de départ pour une sérénité totale.",
    image: "/images/services/aerien.jpg",
    priceHighlight: "Dès 10 000 FCFA / kg (Tout compris)",
    features: [
      "Vols directs réguliers chaque semaine vers Abidjan",
      "Délais express de 3 à 5 jours ouvrés chrono garantis",
      "Pesée vidéo certifiée transmise dès réception en entrepôt",
      "Dédouanement complet inclus au kilo (zéro taxe à l'arrivée)",
    ],
    waMessage:
      "Bonjour Roum Transit, je souhaite des informations sur le fret aérien express.",
  },
  {
    id: "alibaba",
    badge: "Centrale d'Achat · Paiement Fournisseurs en Yuans",
    title: "Achat Assisté Alibaba, 1688 & Taobao",
    subtitle: "Paiement direct en Yuans (RMB) · Contrôle qualité en usine",
    description:
      "Vous avez repéré des articles sur Alibaba, 1688 ou Taobao mais vous n'avez pas de compte bancaire en Chine ? Vous réglez en FCFA à Abidjan à taux négocié, nos équipes sur place à Guangzhou paient directement votre usine en Yuans et contrôlent vos colis.",
    image: "/images/services/achats.jpg",
    priceHighlight: "Règlement en FCFA · Paiement en RMB en Chine",
    features: [
      "Paiement direct de vos fournisseurs sans carte bancaire internationale",
      "Inspection visuelle et photos des cartons dès réception en magasin",
      "Groupage immédiat et acheminement direct par avion ou bateau",
      "Assistance dédiée pour négocier avec les usines chinoises",
    ],
    waMessage:
      "Bonjour Roum Transit, je souhaite être accompagné pour un achat assisté sur Alibaba / 1688.",
  },
  {
    id: "lignes-speciales",
    badge: "Lignes Régionales Dédiées · Maroc & France",
    title: "Liaisons Spécifiques Casablanca & Paris",
    subtitle: "Maroc ➔ Abidjan en 5 jours & Navette Paris Île-de-France",
    description:
      "Des corridors logistiques dédiés pour vos besoins spécifiques : groupage express depuis Casablanca (cosmétiques, huiles, prêt-à-porter marocain) et transport de colis personnels, plis et valises depuis Paris vers Abidjan.",
    image: "/images/services/aerien.jpg",
    priceHighlight: "Maroc : dès 6 500 F/kg · Paris : dès 8 500 F/kg",
    features: [
      "Ligne Casablanca ➔ Abidjan : départ hebdomadaire, 5 jours chrono garantis",
      "Ligne Paris Île-de-France : plis administratifs et colis personnels réguliers",
      "Dédouanement intégralement inclus dans chaque expédition",
      "Retrait rapide à l'agence de Bingerville ou livraison à domicile",
    ],
    waMessage:
      "Bonjour Roum Transit, je souhaite des renseignements sur la ligne Maroc / France.",
  },
];

function ServicesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam === "alibaba") {
      const el = document.getElementById("service-alibaba");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [tabParam]);

  return (
    <div className="services-page-wrapper">
      <div className="services-container">
        {/* ========================================================
            EN-TÊTE ÉDITORIAL SOBRE & HARMONIEUX (PAS DE JOURNAL)
           ======================================================== */}
        <ScrollReveal>
          <header className="services-hero">
            <div className="services-eyebrow">
              <span className="eyebrow-dot">●</span>
              <span>CATALOGUE OFFICIEL ROUM TRANSIT</span>
            </div>

            <h1 className="services-hero-title">
              <span className="hero-line">Transport international &amp; centrale d&apos;achat</span>
              <span className="hero-line">direct vers l&apos;Afrique.</span>
            </h1>

            <p className="services-hero-sub">
              Maritime, Aérien et Achat assisté en Chine, Dubaï, Maroc et France.
              <strong> Dédouanement 100% inclus</strong>, sans mauvaise surprise à l&apos;arrivée.
            </p>
          </header>
        </ScrollReveal>

        {/* ========================================================
            ENGAGEMENTS TRANSVERSAUX (SANS CADRAN, PUR & FLUIDE)
           ======================================================== */}
        <ScrollReveal>
          <div className="services-guarantees-bar">
            <div className="guarantee-col">
              <div className="guarantee-icon-box">
                <ShieldCheck size={20} color="#140D09" strokeWidth={2.2} />
              </div>
              <div className="guarantee-info">
                <div className="guarantee-title">Douane 100% Comprise</div>
                <div className="guarantee-desc">Zéro taxe ni frais caché à la livraison</div>
              </div>
            </div>

            <div className="guarantee-col">
              <div className="guarantee-icon-box">
                <Scale size={20} color="#140D09" strokeWidth={2.2} />
              </div>
              <div className="guarantee-info">
                <div className="guarantee-title">Pesée Vidéo Certifiée</div>
                <div className="guarantee-desc">Colis pesés et filmés dès l&apos;entrepôt</div>
              </div>
            </div>

            <div className="guarantee-col">
              <div className="guarantee-icon-box">
                <MapPin size={20} color="#140D09" strokeWidth={2.2} />
              </div>
              <div className="guarantee-info">
                <div className="guarantee-title">Agence à Abidjan</div>
                <div className="guarantee-desc">Bingerville Carrefour Safari ou domicile</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ========================================================
            LISTE VERTICALE DES SERVICES (NATURELLE, SANS FORMULAIRE)
           ======================================================== */}
        <div className="services-vertical-list">
          {SERVICES_CATALOG.map((service, index) => {
            const waUrl = `https://wa.me/2250153638569?text=${encodeURIComponent(service.waMessage)}`;

            return (
              <ScrollReveal key={service.id}>
                <article id={`service-${service.id}`} className="service-vertical-card">
                  {/* Visuel Cinématographique Grand Format */}
                  <div className="service-media-frame">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="service-media-image"
                    />
                    <div className="service-media-overlay" />
                    <div className="service-media-badge">
                      <span className="badge-dot" />
                      <span>{service.badge}</span>
                    </div>
                  </div>

                  {/* Corps Éditorial du Service */}
                  <div className="service-body">
                    <div className="service-header-group">
                      <div className="service-index-tag">0{index + 1} / SERVICE OFFICIEL</div>
                      <h2 className="service-display-title">{service.title}</h2>
                      <div className="service-route-sub">{service.subtitle}</div>
                    </div>

                    <p className="service-text-desc">{service.description}</p>

                    {/* Liste des Garanties Clés */}
                    <div className="service-features-list">
                      {service.features.map((feat, fIdx) => (
                        <div key={fIdx} className="service-feature-row">
                          <div className="service-check-icon">
                            <Check size={11} color="#FFFFFF" strokeWidth={3} />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Ligne Tarif & Action WhatsApp Directe */}
                    <div className="service-action-footer">
                      <div className="service-price-pill">
                        <span className="price-label">Tarif indicatif</span>
                        <strong className="price-value">{service.priceHighlight}</strong>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="service-whatsapp-cta"
                        title="Échanger directement avec notre équipe"
                      >
                        <MessageCircle size={16} />
                        <span>Échanger sur WhatsApp</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        {/* ========================================================
            BLOC FINAL D'ACCOMPAGNEMENT DIRECT (SANS FORMULAIRE LOURD)
           ======================================================== */}
        <ScrollReveal>
          <div className="services-footer-banner">
            <div className="footer-banner-content">
              <div className="footer-banner-tag">ASSISTANCE PERSONNALISÉE 7J/7</div>
              <h3 className="footer-banner-title">Une question sur vos colis ou une expédition ?</h3>
              <p className="footer-banner-desc">
                Notre agence d&apos;Abidjan (Bingerville Carrefour Safari) et nos équipes de transit
                à Guangzhou, Dubaï et Paris vous conseillent immédiatement sans formalités complexes.
              </p>
              <div className="footer-banner-actions">
                <a
                  href="https://wa.me/2250153638569?text=Bonjour%20Roum%20Transit,%20je%20souhaite%20un%20conseil%20personnalis%C3%A9%20pour%20mon%20envoi."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-cta-primary"
                >
                  <MessageCircle size={16} />
                  <span>Contacter l&apos;équipe sur WhatsApp</span>
                </a>
                <Link href="/tariffs" className="banner-cta-secondary">
                  <span>Consulter la grille des tarifs</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ========================================================
          STYLES CSS ÉDITORIAUX & ULTRA-RESPONSIVES
          (Zéro sensation de zoom, flux vertical aéré, proportions naturelles)
         ======================================================== */}
      <style jsx>{`
        .services-page-wrapper {
          background-color: transparent;
          color: var(--c-text-main);
          min-height: calc(100vh - 110px);
          padding: 24px 16px 110px 16px;
          box-sizing: border-box;
        }

        .services-container {
          max-width: 900px;
          margin: 0 auto;
        }

        /* En-tête Hero */
        .services-hero {
          text-align: center;
          margin-bottom: 32px;
        }

        .services-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-family: var(--c-font-mono);
          font-weight: 700;
          color: var(--c-text-light);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .eyebrow-dot {
          color: var(--c-accent-red);
          font-size: 0.65rem;
        }

        .services-hero-title {
          font-family: var(--c-font-display);
          font-size: clamp(1.4rem, 4.2vw, 2.7rem);
          font-weight: 700;
          letter-spacing: -0.035em;
          line-height: 1.15;
          color: var(--c-text-main);
          margin: 0 0 12px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-line {
          display: block;
          white-space: nowrap;
        }

        .services-hero-sub {
          font-size: clamp(0.88rem, 1.6vw, 1.02rem);
          color: var(--c-text-muted);
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.55;
        }

        /* Barre des 3 garanties frameless */
        .services-guarantees-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 22px 0;
          border-top: 1px solid rgba(28, 25, 23, 0.08);
          border-bottom: 1px solid rgba(28, 25, 23, 0.08);
          margin-bottom: 40px;
        }

        .guarantee-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .guarantee-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(20, 13, 9, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .guarantee-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #140D09;
          letter-spacing: -0.01em;
          margin-bottom: 2px;
        }

        .guarantee-desc {
          font-size: 0.78rem;
          color: #57534E;
          line-height: 1.35;
        }

        /* Liste verticale des services */
        .services-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 44px;
          margin-bottom: 48px;
        }

        .service-vertical-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 36px;
          border-bottom: 1px solid rgba(28, 25, 23, 0.08);
        }

        .service-vertical-card:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        /* Cadre média cinématographique */
        .service-media-frame {
          position: relative;
          width: 100%;
          height: 240px;
          border-radius: 22px;
          overflow: hidden;
          background-color: #1B1411;
          box-shadow: 0 8px 24px -4px rgba(27, 20, 17, 0.12);
        }

        .service-media-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .service-media-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.25) 0%,
            rgba(20, 13, 9, 0.6) 100%
          );
        }

        .service-media-badge {
          position: absolute;
          bottom: 16px;
          left: 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background-color: rgba(20, 13, 9, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: var(--c-font-mono);
          z-index: 2;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #22C55E;
          display: inline-block;
        }

        /* Corps du service */
        .service-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .service-header-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .service-index-tag {
          font-size: 0.7rem;
          font-family: var(--c-font-mono);
          font-weight: 700;
          color: var(--c-text-light);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .service-display-title {
          font-family: var(--c-font-display);
          font-size: clamp(1.28rem, 2.8vw, 1.85rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.18;
          color: var(--c-text-main);
          margin: 0;
        }

        .service-route-sub {
          font-size: 0.86rem;
          font-weight: 600;
          color: #78716C;
        }

        .service-text-desc {
          font-size: 0.92rem;
          line-height: 1.55;
          color: #57534E;
          margin: 0;
        }

        /* Liste des points clés */
        .service-features-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 18px;
        }

        .service-feature-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #44403C;
        }

        .service-check-icon {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background-color: #140D09;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Ligne Tarif & CTA WhatsApp */
        .service-action-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding-top: 6px;
        }

        .service-price-pill {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .price-label {
          font-size: 0.68rem;
          font-family: var(--c-font-mono);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #78716C;
        }

        .price-value {
          font-size: 1.05rem;
          font-weight: 800;
          color: #140D09;
          font-family: var(--c-font-display);
          letter-spacing: -0.02em;
        }

        .service-whatsapp-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          background-color: #140D09;
          color: #FFFFFF;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(20, 13, 9, 0.16);
          transition: transform 0.16s ease, opacity 0.16s ease;
        }

        .service-whatsapp-cta:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        /* Bannière d'assistance finale */
        .services-footer-banner {
          background-color: #FAF5F0;
          border: 1px solid rgba(28, 25, 23, 0.08);
          border-radius: 22px;
          padding: 28px 24px;
          text-align: center;
        }

        .footer-banner-tag {
          font-size: 0.7rem;
          font-family: var(--c-font-mono);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--c-text-light);
          margin-bottom: 8px;
        }

        .footer-banner-title {
          font-family: var(--c-font-display);
          font-size: clamp(1.2rem, 2.5vw, 1.55rem);
          font-weight: 700;
          color: #140D09;
          letter-spacing: -0.03em;
          margin: 0 0 8px 0;
        }

        .footer-banner-desc {
          font-size: 0.88rem;
          color: #57534E;
          line-height: 1.55;
          max-width: 620px;
          margin: 0 auto 20px auto;
        }

        .footer-banner-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .banner-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 9999px;
          background-color: #140D09;
          color: #FFFFFF;
          font-size: 0.84rem;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }

        .banner-cta-primary:hover {
          opacity: 0.9;
        }

        .banner-cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 11px 20px;
          border-radius: 9999px;
          background-color: #FFFFFF;
          color: #140D09;
          border: 1px solid rgba(28, 25, 23, 0.14);
          font-size: 0.84rem;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }

        .banner-cta-secondary:hover {
          background-color: #F7F5F0;
        }

        /* ========================================================
            RESPONSIVE MOBILE (< 768px)
           ======================================================== */
        @media (max-width: 768px) {
          .services-page-wrapper {
            padding: 20px 14px 110px 14px;
          }

          .services-hero {
            margin-bottom: 24px;
          }

          .hero-line {
            white-space: normal;
          }

          .services-guarantees-bar {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 18px 0;
            margin-bottom: 32px;
          }

          .services-vertical-list {
            gap: 36px;
            margin-bottom: 36px;
          }

          .service-vertical-card {
            padding-bottom: 28px;
          }

          .service-media-frame {
            height: 190px;
            border-radius: 18px;
          }

          .service-features-list {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .service-action-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .service-whatsapp-cta {
            justify-content: center;
            width: 100%;
            box-sizing: border-box;
          }

          .banner-cta-primary,
          .banner-cta-secondary {
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Chargement...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
