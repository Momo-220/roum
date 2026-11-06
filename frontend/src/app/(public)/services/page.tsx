"use client";

import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { getStartingOffers } from "@/shared";
import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Plane,
  Ship,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CircularFlag } from "@/components/CircularFlag";
import {
  findTariff,
  OfficialTariff,
} from "@/shared";

interface RouteEnd {
  label: string;
  value: ReactNode;
}

interface ServiceCardProps {
  className: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  index: string;
  tag: string;
  title: string;
  text: string;
  from: RouteEnd;
  through: string;
  to: RouteEnd;
  /** Le prix d'appel, mis en avant dans une pilule claire. */
  highlight?: string;
  chips: string[];
  href: string;
  cta: string;
}

/** Carte photo : un titre, une phrase, et le trajet du service dessiné comme une ligne. */
function ServiceCard({
  className,
  image,
  imageAlt,
  imagePosition,
  index,
  tag,
  title,
  text,
  from,
  through,
  to,
  highlight,
  chips,
  href,
  cta,
}: ServiceCardProps) {
  return (
    <article className={`bento-card ${className}`}>
      <img src={image} alt={imageAlt} className="bento-card-bg" style={{ objectPosition: imagePosition }} />
      <div className="bento-scrim" />

      <div className="bento-content">
        <div className="bento-top">
          <span className="bento-index">{index}</span>
          <span className="bento-tag">{tag}</span>
        </div>

        <div className="bento-main">
          <h2 className="bento-card-title">{title}</h2>
          <p className="bento-card-subtitle">{text}</p>

          <div className="route-line">
            <div className="route-end">
              <small>{from.label}</small>
              <strong>{from.value}</strong>
            </div>
            <div className="route-track">
              <i className="route-dash" />
              <strong>{through}</strong>
              <i className="route-dash" />
            </div>
            <div className="route-end route-end-last">
              <small>{to.label}</small>
              <strong>{to.value}</strong>
            </div>
          </div>

          <ul className="bento-chips">
            {highlight && <li className="bento-chip-highlight">{highlight}</li>}
            {chips.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>

          <Link href={href} className="bento-cta-pill">
            <span>{cta}</span>
            <ArrowRight size={15} style={{ flexShrink: 0 }} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ServicesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  // Tarifs en direct synchronisés avec le Dashboard Admin
  const { tariffs, settings } = usePublicCatalog();
  const offers = getStartingOffers(tariffs);

  // Entrepôt actif dans la section Shipping Mark
  const [activeWarehouse, setActiveWarehouse] = useState<"guangzhou" | "yiwu" | "dubai" | "paris">("guangzhou");
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);

  // Synchronisation des paramètres d'URL (?tab=alibaba ou ?tab=forwarding) vers la sous-page dédiée
  useEffect(() => {
    if (tabParam === "alibaba") {
      router.push("/services/commande");
    } else if (tabParam === "forwarding" || tabParam === "chine" || tabParam === "dubai" || tabParam === "france" || tabParam === "maroc") {
      router.push("/tariffs");
    }
  }, [tabParam, router]);

  // Copie dans le presse-papier
  const copyToClipboard = (text: string, isAddr: boolean) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isAddr) {
        setCopiedAddr(true);
        setTimeout(() => setCopiedAddr(false), 2200);
      } else {
        setCopiedMark(true);
        setTimeout(() => setCopiedMark(false), 2200);
      }
    }
  };

  // Données des entrepôts
  const WAREHOUSES = {
    guangzhou: {
      city: "Guangzhou (Chine)",
      name: "Magasin Central Guangzhou Baiyun",
      chinese: settings.warehouse_china_address,
      contact: `Contact Réception : ${settings.warehouse_china_contact}`,
      mark: settings.warehouse_china_shipping_mark,
    },
    yiwu: {
      city: "Yiwu (Chine)",
      name: "Entrepôt Yiwu International Trade City",
      chinese: "浙江省金华市义乌市稠江街道长春小区 (ROUM TRANSIT)",
      contact: "Contact Réception : +86 139 1111 2222 · Dépôt Yiwu",
      mark: settings.warehouse_china_shipping_mark,
    },
    dubai: {
      city: "Dubaï (Émirats Arabes Unis)",
      name: "Comptoir Dubaï Deira Creek",
      chinese: settings.warehouse_dubai_address,
      contact: `Contact Dubaï : ${settings.warehouse_dubai_contact}`,
      mark: "ROUM / [VOTRE-NOM] / [VOTRE-VILLE] / AIR-DXB",
    },
    paris: {
      city: "Paris (France)",
      name: "Point Collecte Île-de-France",
      chinese: settings.agency_paris_address,
      contact: `Permanence France : ${settings.agency_paris_contact}`,
      mark: "ROUM / [VOTRE-NOM] / [VOTRE-VILLE] / AIR-PARIS",
    },
  };

  return (
    <div className="services-page-root">
      <div className="services-container">
        <ScrollReveal>
          {/* ========================================================
              EN-TÊTE ÉDITORIAL LUXE (STYLE PAGE D'ACCUEIL)
             ======================================================== */}
          <header className="services-header">
            <div className="services-badge-category">
              <span className="dot">●</span>
              <span>01 / CATALOGUE LOGISTIQUE OFFICIEL</span>
            </div>
            <h1 className="services-title">Nos Voies & Services d&apos;Acheminement.</h1>
            <p className="services-desc">
              Règlement de vos usines chinoises en Yuans, fret maritime et fret aérien direct.
              <strong> Dédouanement 100% inclus</strong> jusqu&apos;à votre destination finale.
            </p>
          </header>

          {/* ========================================================
              GRILLE BENTO ASYMÉTRIQUE DYNAMIQUE
             ======================================================== */}
          <div className="bento-grid">
            <ServiceCard
              className="card-alibaba"
              image="/images/services/achat.jpg"
              imageAlt="Cartons ouverts vus de dessus"
              index="01"
              tag="Achats en Chine"
              title="Centrale d'Achat"
              text="Payez en FCFA par Wave ou Orange Money, sans carte internationale. Nous réglons votre usine."
              from={{ label: "Vous payez", value: "FCFA" }}
              through="24 h"
              to={{ label: "L'usine reçoit", value: "Yuans" }}
              chips={["Sans fournisseur : on trouve l'usine", "Avec fournisseur : on paie votre proforma"]}
              href="/services/commande"
              cta="Lancer une commande"
            />

            <ServiceCard
              className="card-aerien"
              image="/images/services/aerien-hublot.jpg"
              imageAlt="Aile d'avion vue par le hublot, au-dessus des nuages"
              imagePosition="50% 22%"
              index="02"
              tag="Par les airs"
              title="Voie Aérienne"
              text="Plis urgents, téléphones et colis réguliers, au départ de quatre pays."
              from={{ label: "Depuis", value: "4 pays" }}
              through={`${offers.express?.delay || "4 à 5"} jours`}
              to={{ label: "Vers", value: "L'Afrique" }}
              highlight={offers.express ? `Dès ${offers.express.price} FCFA / kg` : undefined}
              chips={["Douane incluse", "Pesée vidéo"]}
              href="/tariffs?mode=AIR"
              cta="Voir les tarifs"
            />

            <ServiceCard
              className="card-maritime"
              image="/images/services/maritime-ciel.jpg"
              imageAlt="Navire chargé de conteneurs vu du ciel, sur une mer bleu profond"
              imagePosition="60% 0%"
              index="03"
              tag="Par la mer"
              title="Voie Maritime"
              text="Groupage au m³ ou conteneur complet, depuis Guangzhou, Ningbo et Yiwu."
              from={{ label: "Depuis", value: "Chine" }}
              through={`${offers.sea?.delay || "35 à 45"} jours`}
              to={{ label: "Vers", value: "L'Afrique" }}
              highlight={`Dès ${offers.sea?.price || "300 000"} FCFA / m³`}
              chips={["Douane incluse", "Scellés et suivi"]}
              href="/tariffs?mode=SEA"
              cta="Voir les tarifs"
            />

            <ServiceCard
              className="card-international"
              image="/images/services/international_points.jpg"
              imageAlt="Ville vue d'en haut au coucher du soleil"
              imagePosition="60% 40%"
              index="04"
              tag="Nos comptoirs"
              title="Comptoirs Internationaux"
              text="Déposez votre colis près de chez vous : il part directement vers l'Afrique."
              from={{
                label: "Depuis",
                value: (
                  <span className="route-flags">
                    <CircularFlag code="ae" size={22} />
                    <CircularFlag code="fr" size={22} />
                    <CircularFlag code="ma" size={22} />
                  </span>
                ),
              }}
              through="3 pays"
              to={{ label: "Vers", value: "L'Afrique" }}
              chips={[
                "Dubaï : high-tech",
                offers.france ? `Paris : dès ${offers.france.price} FCFA / kg` : "Paris et Île-de-France",
                "Casablanca : 5 capitales",
              ]}
              href="/tariffs"
              cta="Voir les tarifs"
            />
          </div>

          {/* ========================================================
              SECTION DÉPÔTS : ADRESSE ET MARQUAGE DES CARTONS
             ======================================================== */}
          <div className="shipping-pass-block">
            <div className="pass-tabs-header">
              <div className="pass-header-info">
                <span className="pass-label">Vos adresses de réception</span>
                <h3 className="pass-headline">Nos dépôts &amp; le marquage des cartons</h3>
              </div>

              {/* Sélecteur d'entrepôt en capsule */}
              <div className="pass-warehouse-capsules">
                {(["guangzhou", "yiwu", "dubai", "paris"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveWarehouse(key)}
                    className={`pass-capsule-btn ${activeWarehouse === key ? "active" : ""}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {key === "guangzhou" ? (
                      <>
                        <CircularFlag code="cn" size={14} />
                        <span>Guangzhou</span>
                      </>
                    ) : key === "yiwu" ? (
                      <>
                        <CircularFlag code="cn" size={14} />
                        <span>Yiwu</span>
                      </>
                    ) : key === "dubai" ? (
                      <>
                        <CircularFlag code="ae" size={14} />
                        <span>Dubaï</span>
                      </>
                    ) : (
                      <>
                        <CircularFlag code="fr" size={14} />
                        <span>Paris</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pass-body-grid">
              {/* Côté Gauche : Adresse pour le fournisseur */}
              <div className="pass-details-col">
                <div className="pass-tag-title">{WAREHOUSES[activeWarehouse].name}</div>
                <div className="pass-chinese-address">
                  {WAREHOUSES[activeWarehouse].chinese}
                </div>
                <div className="pass-contact-note">
                  {WAREHOUSES[activeWarehouse].contact}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${WAREHOUSES[activeWarehouse].chinese}\n${WAREHOUSES[activeWarehouse].contact}`,
                      true
                    )
                  }
                  className="pass-copy-btn"
                >
                  {copiedAddr ? <Check size={14} color="#166534" /> : <Copy size={14} />}
                  <span>{copiedAddr ? "Adresse copiée" : "Copier l'adresse"}</span>
                </button>
              </div>

              {/* Côté Droit : Modèle de Shipping Mark */}
              <div className="pass-mark-col">
                <div className="pass-mark-header">
                  <span>À inscrire sur chaque carton</span>
                </div>
                <div className="pass-mark-box">
                  <code>{WAREHOUSES[activeWarehouse].mark}</code>
                </div>
                <p className="pass-mark-hint">
                  Donnez ce marquage à votre fournisseur : nous reconnaissons votre colis dès son arrivée.
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(WAREHOUSES[activeWarehouse].mark, false)}
                  className="pass-copy-btn-secondary"
                >
                  {copiedMark ? <Check size={14} color="#166534" /> : <Copy size={14} />}
                  <span>{copiedMark ? "Marquage copié" : "Copier le marquage"}</span>
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>





      {/* ========================================================
          STYLES CSS INLINE RESPONSIVE & ÉDITORIAL
         ======================================================== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .services-page-root {
          background-color: transparent;
          color: var(--c-text-main);
          min-height: calc(100vh - 110px);
          padding: 32px 18px 120px 18px;
          box-sizing: border-box;
        }

        .services-container {
          max-width: 1140px;
          margin: 0 auto;
        }

        .services-header {
          text-align: center;
          margin-bottom: 38px;
        }

        .services-badge-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--c-text-light);
          margin-bottom: 12px;
        }

        .services-badge-category .dot {
          color: #1E4D5B;
        }

        .services-title {
          font-family: var(--c-font-display);
          font-size: clamp(1.8rem, 4vw, 2.7rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.12;
          color: var(--c-text-main);
          margin: 0 auto 12px auto;
          max-width: 780px;
        }

        .services-desc {
          font-size: 0.98rem;
          color: var(--c-text-muted);
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* CARTES PHOTO */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 18px;
          margin-bottom: 32px;
        }

        .bento-card {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 470px;
          border-radius: 28px;
          overflow: hidden;
          background-color: #1A130F;
          color: #FFFFFF;
          box-shadow: 0 10px 30px -8px rgba(20, 13, 9, 0.14);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
        }

        .bento-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px -10px rgba(20, 13, 9, 0.26);
        }

        .bento-card-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bento-card:hover .bento-card-bg {
          transform: scale(1.04);
        }

        /* La photo respire en haut : seul le bas s'assombrit, là où se trouve le texte. */
        .bento-scrim {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            to top,
            rgba(20, 13, 9, 0.94) 0%,
            rgba(20, 13, 9, 0.8) 46%,
            rgba(20, 13, 9, 0.26) 76%,
            rgba(20, 13, 9, 0.28) 100%
          );
          pointer-events: none;
        }

        .bento-content {
          position: relative;
          z-index: 3;
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 28px;
          padding: 24px 26px 26px;
        }

        .bento-top {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--c-font-mono);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
        }

        .bento-index {
          color: #EADDCB;
        }

        .bento-tag {
          color: #FFFFFF;
        }

        .bento-main {
          min-width: 0;
        }

        .bento-card-title {
          margin: 0 0 8px;
          color: #FFFFFF;
          font-family: var(--c-font-display);
          font-size: clamp(1.85rem, 3.3vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.05;
        }

        .bento-card-subtitle {
          max-width: 460px;
          margin: 0 0 22px;
          color: rgba(255, 255, 255, 0.86);
          font-size: 0.95rem;
          line-height: 1.45;
        }

        /* Le trajet du service, dessiné comme une ligne de voyage */
        .route-line {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          margin-bottom: 18px;
        }

        .route-end {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          gap: 3px;
          min-width: 0;
        }

        .route-end-last {
          align-items: flex-end;
          text-align: right;
        }

        .route-end small {
          color: rgba(255, 255, 255, 0.68);
          font-size: 0.76rem;
          font-weight: 500;
        }

        .route-end strong {
          color: #FFFFFF;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
        }

        .route-flags {
          display: inline-flex;
          gap: 4px;
        }

        .route-track {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 1px;
        }

        .route-track strong {
          color: #EADDCB;
          font-family: var(--c-font-display);
          font-size: clamp(1.15rem, 2.2vw, 1.45rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          white-space: nowrap;
        }

        .route-dash {
          position: relative;
          flex: 1;
          min-width: 12px;
          border-top: 2px dotted rgba(255, 255, 255, 0.55);
        }

        .route-dash:first-child::before,
        .route-dash:last-child::after {
          content: "";
          position: absolute;
          top: -5px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #EADDCB;
        }

        .route-dash:first-child::before {
          left: 0;
        }

        .route-dash:last-child::after {
          right: 0;
        }

        .bento-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0 0 18px;
          padding: 0;
          list-style: none;
        }

        .bento-chips li {
          padding: 6px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.14);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          color: #FFFFFF;
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1.25;
        }

        .bento-chips .bento-chip-highlight {
          background: #EADDCB;
          color: #1B1411;
          font-weight: 800;
        }

        /* 7 colonnes puis 5 : un rythme asymétrique, photo large et photo haute */
        .card-alibaba,
        .card-maritime {
          grid-column: span 7;
        }

        .card-aerien,
        .card-international {
          grid-column: span 5;
        }

        /* SECTION DÉPÔTS : de l'air et de grands textes, sans cadre */
        .shipping-pass-block {
          margin-top: 64px;
        }

        .pass-tabs-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 16px 28px;
          margin-bottom: 34px;
        }

        .pass-label {
          display: block;
          margin-bottom: 6px;
          color: var(--c-accent);
          font-size: 0.92rem;
          font-weight: 700;
        }

        .pass-headline {
          margin: 0;
          color: var(--c-text-main);
          font-family: var(--c-font-display);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }

        .pass-warehouse-capsules {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .pass-capsule-btn {
          flex-shrink: 0;
          min-height: 42px;
          padding: 0 16px 0 11px;
          border: 0;
          border-radius: 9999px;
          background: transparent;
          color: var(--c-text-muted);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .pass-capsule-btn:hover {
          background: #F3EBDF;
        }

        .pass-capsule-btn.active {
          background: #EADDCB;
          color: #3A2A21;
          font-weight: 700;
        }

        .pass-body-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 64px;
        }

        .pass-details-col,
        .pass-mark-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .pass-tag-title,
        .pass-mark-header {
          color: var(--c-accent);
          font-size: 0.92rem;
          font-weight: 700;
        }

        .pass-chinese-address {
          color: var(--c-text-main);
          font-family: var(--c-font-display);
          font-size: clamp(1.15rem, 2.3vw, 1.4rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .pass-contact-note,
        .pass-mark-hint {
          margin: 0;
          color: var(--c-text-muted);
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .pass-mark-box code {
          display: block;
          color: var(--c-text-main);
          font-family: var(--c-font-mono);
          font-size: clamp(1rem, 2vw, 1.15rem);
          font-weight: 700;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .pass-copy-btn,
        .pass-copy-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 46px;
          margin-top: 8px;
          padding: 0 22px;
          border-radius: 9999px;
          color: #3A2A21;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .pass-copy-btn {
          border: 0;
          background: #EADDCB;
        }

        .pass-copy-btn:hover {
          background: #E0D1BB;
        }

        .pass-copy-btn-secondary {
          border: 1px solid #DCCDB6;
          background: transparent;
        }

        .pass-copy-btn-secondary:hover {
          background: #F3EBDF;
        }

        /* MODALE DRAWER */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background-color: rgba(20, 13, 9, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal-card {
          position: relative;
          background-color: #FFFFFF;
          border-radius: 24px;
          padding: 32px 28px;
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 50px -10px rgba(0, 0, 0, 0.45);
          animation: modalAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background-color: #FAF6F0;
          color: var(--c-text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .modal-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          color: #1E4D5B;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .modal-badge .green-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #22C55E;
        }

        .modal-title {
          font-family: var(--c-font-display);
          font-size: 1.45rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--c-text-main);
          margin: 0 0 6px 0;
        }

        .modal-desc {
          font-size: 0.84rem;
          color: var(--c-text-muted);
          line-height: 1.45;
          margin: 0 0 20px 0;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .modal-input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .modal-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--c-text-main);
          margin-bottom: 4px;
        }

        .modal-input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid rgba(20, 13, 9, 0.16);
          border-radius: 10px;
          font-size: 0.84rem;
          box-sizing: border-box;
          background-color: #FAF6F0;
          color: var(--c-text-main);
          outline: none;
          transition: border-color 0.15s ease;
        }

        .modal-input:focus {
          border-color: #140D09;
          background-color: #FFFFFF;
        }

        .modal-error {
          font-size: 0.8rem;
          color: #DC2626;
          font-weight: 600;
        }

        .modal-submit-btn {
          height: 46px;
          border-radius: 9999px;
          background-color: #140D09;
          color: #FAF6F0;
          border: none;
          font-size: 0.86rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          margin-top: 6px;
          transition: background-color 0.15s ease;
        }

        .modal-submit-btn:hover {
          background-color: #2C1E17;
        }

        .modal-success-box {
          text-align: center;
          padding: 24px 16px;
          background-color: #F0FDF4;
          border-radius: 14px;
          border: 1px solid #BBF7D0;
        }

        .modal-success-title {
          font-family: var(--c-font-display);
          font-size: 1.15rem;
          font-weight: 800;
          color: #166534;
          margin-bottom: 6px;
        }

        .modal-success-desc {
          font-size: 0.84rem;
          color: #15803D;
          line-height: 1.45;
          margin-bottom: 16px;
        }

        .modal-wa-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 9999px;
          background-color: #25D366;
          color: #FFFFFF;
          font-size: 0.84rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);
        }

        /* RESPONSIVE MOBILE : LUXUEUX, AÉRÉ, BIEN ESPACÉ ET SANS COMPRESSION */
        @media (max-width: 1024px) {
          .services-page-root {
            padding: 28px 16px 120px 16px !important;
            overflow-x: hidden !important;
          }

          .services-header {
            margin-bottom: 32px !important;
          }

          .services-title {
            font-size: clamp(1.65rem, 5.5vw, 2.1rem) !important;
            margin-bottom: 12px !important;
            line-height: 1.18 !important;
          }

          .services-desc {
            font-size: 0.90rem !important;
            line-height: 1.5 !important;
          }

          /* Une carte par ligne */
          .card-alibaba,
          .card-aerien,
          .card-maritime,
          .card-international {
            grid-column: span 12;
          }

          .bento-card {
            min-height: 440px;
          }

          /* SECTION DÉPÔTS */
          .shipping-pass-block {
            margin-top: 48px;
          }

          .pass-body-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 36px;
          }

          .pass-tabs-header {
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 26px;
          }

          .pass-warehouse-capsules {
            flex-wrap: nowrap;
            width: 100%;
            padding-bottom: 4px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 640px) {
          .bento-grid {
            gap: 14px;
          }

          .bento-card {
            min-height: 460px;
            border-radius: 24px;
          }

          /* Sur téléphone, le texte occupe plus de hauteur : le fondu monte avec lui. */
          .bento-scrim {
            background: linear-gradient(
              to top,
              rgba(20, 13, 9, 0.96) 0%,
              rgba(20, 13, 9, 0.86) 56%,
              rgba(20, 13, 9, 0.34) 82%,
              rgba(20, 13, 9, 0.3) 100%
            );
          }

          .bento-content {
            padding: 20px 18px 20px;
          }

          .bento-card-subtitle {
            margin-bottom: 18px;
            font-size: 0.92rem;
          }

          .route-line {
            gap: 10px;
          }

          .route-track {
            gap: 8px;
          }

          .route-end strong {
            font-size: 0.92rem;
          }

          .bento-cta-pill {
            width: 100%;
            justify-content: center !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Chargement des services...
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}