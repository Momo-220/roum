"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Plane,
  Ship,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Clock,
  X,
  ExternalLink,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CircularFlag } from "@/components/CircularFlag";
import {
  getLiveTariffs,
  findTariff,
  saveClientRequest,
  OfficialTariff,
} from "@/shared";

function ServicesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  // Tarifs en direct synchronisés avec le Dashboard Admin
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());

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

  // Synchronisation avec l'admin storage
  useEffect(() => {
    const handleSync = () => {
      setTariffs(getLiveTariffs());
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

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
      chinese: "广州市白云区石井街道大冈东街42号 (ROUM TRANSIT)",
      contact: "Contact Réception : +86 138 0000 0000 · Scellés Roum",
      mark: "ROUM / [VOTRE-NOM] / [VOTRE-VILLE] / [AIR ou BATEAU]",
    },
    yiwu: {
      city: "Yiwu (Chine)",
      name: "Entrepôt Yiwu International Trade City",
      chinese: "浙江省金华市义乌市稠江街道长春小区 (ROUM TRANSIT)",
      contact: "Contact Réception : +86 139 1111 2222 · Dépôt Yiwu",
      mark: "ROUM / [VOTRE-NOM] / [VOTRE-VILLE] / [AIR ou BATEAU]",
    },
    dubai: {
      city: "Dubaï (Émirats Arabes Unis)",
      name: "Comptoir Dubaï Deira Creek",
      chinese: "Al Sabkha Road, Deira Wholesale Market, Dubai, UAE",
      contact: "Contact Dubaï : +971 50 000 0000 · Agence Deira",
      mark: "ROUM / [VOTRE-NOM] / [VOTRE-VILLE] / AIR-DXB",
    },
    paris: {
      city: "Paris (France)",
      name: "Point Collecte Île-de-France",
      chinese: "Plateforme Cargo Roissy CDG / Dépôt Paris Île-de-France",
      contact: "Permanence France : +33 7 00 00 00 00",
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
            {/* CARTE 1 (60% LARGEUR) : CENTRALE D'ACHAT ALIBABA & 1688 */}
            <article className="bento-card card-alibaba">
              <img
                src="/images/services/achats.jpg"
                alt="Centrale d'Achat Alibaba & Sourcing"
                className="bento-card-bg"
              />
              <div className="bento-scrim" />
              <div className="bento-content" style={{ justifyContent: "flex-end" }}>
                <div>
                  <h2 className="bento-card-title">Centrale d&apos;Achat</h2>
                  <p className="bento-card-subtitle">
                    Achetez sans carte bancaire internationale. Nous négocions et réglons vos fournisseurs chinois en Yuans sous 24h.
                  </p>

                  <div className="options-duo">
                    <div className="option-box">
                      <span className="option-tag">Option 1 · Sans fournisseur</span>
                      <p className="option-desc">Sourcing usine certifiée &amp; négociation du meilleur tarif.</p>
                    </div>
                    <div className="option-box">
                      <span className="option-tag">Option 2 · Avec fournisseur</span>
                      <p className="option-desc">Règlement direct de votre proforma en Yuans RMB sous 24h.</p>
                    </div>
                  </div>

                  <div className="bento-bottom-row">
                    <div className="bento-bullet" style={{ whiteSpace: "nowrap" }}>
                      <span className="bento-bullet-dot" />
                      <span>Règlement : <strong>Wave · Orange Money · Maroc</strong></span>
                    </div>
                    <Link
                      href="/services/commande"
                      className="bento-cta-pill"
                      style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "#FFFFFF", textDecoration: "none", fontWeight: 700, fontSize: "0.84rem", whiteSpace: "nowrap" }}
                    >
                      <span style={{ marginRight: "8px" }}>Lancer une commande</span>
                      <ArrowRight size={15} style={{ flexShrink: 0 }} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 2 (40% LARGEUR) : VOIE AÉRIENNE EXPRESS */}
            <article className="bento-card card-aerien">
              <img
                src="/images/services/aerien_new.jpg"
                alt="Fret Aérien Express Cargo"
                className="bento-card-bg"
              />
              <div className="bento-scrim" />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span className="green-dot" />
                    <span>AVION EXPRESS · DÉPARTS HEBDOMADAIRES</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title">Voie Aérienne</h2>
                  <div className="bento-stat-highlight">4 À 5 JOURS</div>
                  <p className="bento-card-subtitle">
                    Chine, Dubaï, France &amp; Maroc direct. Plis urgents, téléphones &amp; colis réguliers.
                  </p>

                  <div className="bento-bullets">
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Pesée vidéo certifiée dès réception en magasin</span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Dédouanement complet inclus au kilo</span>
                    </div>
                  </div>

                  <div className="bento-bottom-row">
                    <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.72)" }}>
                      Départs hebdomadaires
                    </span>
                    <Link
                      href="/tariffs?mode=AIR"
                      className="bento-cta-pill"
                      style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "#FFFFFF", textDecoration: "none", fontWeight: 700, fontSize: "0.84rem", whiteSpace: "nowrap" }}
                    >
                      <span style={{ marginRight: "8px" }}>Voir les tarifs</span>
                      <ArrowRight size={15} style={{ flexShrink: 0 }} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 3 (60% LARGEUR) : VOIE MARITIME CBM (JUSTE APRÈS LA VOIE AÉRIENNE) */}
            <article className="bento-card card-maritime">
              <img
                src="/images/services/maritime_new.jpg"
                alt="Fret Maritime Porte-conteneurs"
                className="bento-card-bg"
              />
              <div className="bento-scrim" />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span className="green-dot" />
                    <span>BATEAU · GROUPAGE CBM &amp; CONTENEURS</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title">Voie Maritime</h2>
                  <div className="bento-stat-highlight">DÈS 300 000 FCFA / M³</div>
                  <p className="bento-card-subtitle">
                    Acheminement économique par conteneur complet ou groupage au m³ depuis Guangzhou, Ningbo et Yiwu.
                  </p>

                  <div className="options-duo" style={{ marginBottom: "10px" }}>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Délai moyen : 35 à 45 jours</span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Douane &amp; manutention portuaire incluses</span>
                    </div>
                  </div>

                  <div className="bento-bottom-row">
                    <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.72)" }}>
                      Scellés sécurisés &amp; suivi direct
                    </span>
                    <Link
                      href="/tariffs?mode=SEA"
                      className="bento-cta-pill"
                      style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "#FFFFFF", textDecoration: "none", fontWeight: 700, fontSize: "0.84rem", whiteSpace: "nowrap" }}
                    >
                      <span style={{ marginRight: "8px" }}>Voir les tarifs maritimes</span>
                      <ArrowRight size={15} style={{ flexShrink: 0 }} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 4 (40% LARGEUR) : COMPTOIRS INTERNATIONAUX REGROUPÉS (DUBAÏ, FRANCE, MAROC) */}
            <article className="bento-card card-international">
              <img
                src="/images/services/international_points.jpg"
                alt="Comptoirs Internationaux Roum Transit"
                className="bento-card-bg"
              />
              <div className="bento-scrim" />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <CircularFlag code="ae" size={13} />
                      <span>DUBAÏ</span>
                      <span>·</span>
                      <CircularFlag code="fr" size={13} />
                      <span>FRANCE</span>
                      <span>·</span>
                      <CircularFlag code="ma" size={13} />
                      <span>MAROC</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title">Comptoirs Internationaux</h2>
                  <div className="bento-stat-highlight" style={{ fontSize: "1.42rem", color: "#FFA066" }}>
                    3 PAYS DESSERVIS
                  </div>
                  <p className="bento-card-subtitle">
                    Expéditions directes vers l&apos;Afrique depuis nos comptoirs de réception et ramassage partenaires.
                  </p>

                  <div className="bento-bullets">
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag code="ae" size={14} />
                        <strong>Dubaï :</strong> Deira Wholesale · Téléphones &amp; High-Tech
                      </span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag code="fr" size={14} />
                        <strong>France :</strong> Paris &amp; Île-de-France · Dès 8 500 FCFA/kg
                      </span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag code="ma" size={14} />
                        <strong>Maroc :</strong> Casablanca direct vers 5 capitales africaines
                      </span>
                    </div>
                  </div>

                  <div className="bento-bottom-row">
                    <Link
                      href="/tariffs"
                      className="bento-cta-pill"
                      style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "#FFFFFF", textDecoration: "none", fontWeight: 700, fontSize: "0.84rem", whiteSpace: "nowrap" }}
                    >
                      <span style={{ marginRight: "8px" }}>Voir les tarifs des comptoirs</span>
                      <ArrowRight size={15} style={{ flexShrink: 0 }} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* ========================================================
              SECTION ÉTIQUETTE LOGISTIQUE / SHIPPING MARK (BOARDING PASS)
             ======================================================== */}
          <div className="shipping-pass-block">
            <div className="pass-tabs-header">
              <div className="pass-header-info">
                <span className="pass-label">INSTRUCTIONS DE MARQUAGE CARTON OBLIGATOIRE</span>
                <h3 className="pass-headline">Adresses d&apos;Entrepôts &amp; Étiquette Fournisseur</h3>
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
                  <span>{copiedAddr ? "Adresse copiée dans le presse-papier !" : "Copier l'adresse pour mon fournisseur"}</span>
                </button>
              </div>

              {/* Côté Droit : Modèle de Shipping Mark */}
              <div className="pass-mark-col">
                <div className="pass-mark-header">
                  <span>MARQUAGE OBLIGATOIRE SUR CHAQUE CARTON</span>
                </div>
                <div className="pass-mark-box">
                  <code>{WAREHOUSES[activeWarehouse].mark}</code>
                </div>
                <p className="pass-mark-hint">
                  Indiquez ce marquage à votre fournisseur ou collez-le sur chaque colis pour un traçage immédiat à l&apos;arrivée.
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(WAREHOUSES[activeWarehouse].mark, false)}
                  className="pass-copy-btn-secondary"
                >
                  {copiedMark ? <Check size={14} color="#166534" /> : <Copy size={14} />}
                  <span>{copiedMark ? "Modèle copié !" : "Copier le modèle de marquage"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              BANDEAU DE GARANTIES ÉDITORIAL
             ======================================================== */}
          <div className="services-guarantees-bar">
            <div className="guarantee-item">
              <ShieldCheck size={22} color="#166534" />
              <div>
                <div className="guarantee-title">Douane 100% comprise</div>
                <div className="guarantee-desc">Zéro frais surprise à l&apos;arrivée à destination</div>
              </div>
            </div>
            <div className="guarantee-item">
              <MapPin size={22} color="var(--c-text-main)" />
              <div>
                <div className="guarantee-title">Pesée Vidéo Magasin</div>
                <div className="guarantee-desc">Colis pesés et filmés dès réception en entrepôt</div>
              </div>
            </div>
            <div className="guarantee-item">
              <Clock size={22} color="var(--c-text-main)" />
              <div>
                <div className="guarantee-title">Délais scellés</div>
                <div className="guarantee-desc">Avion 4 à 5 jours chrono · Bateau hebdomadaire</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>





      {/* ========================================================
          STYLES CSS INLINE RESPONSIVE & ÉDITORIAL
         ======================================================== */}
      <style jsx>{`
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
          color: #CC4E16;
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

        /* GRILLE BENTO */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 18px;
          margin-bottom: 32px;
        }

        .bento-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background-color: #1A130F;
          color: #FFFFFF;
          min-height: 340px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 30px -8px rgba(20, 13, 9, 0.14);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
          cursor: pointer;
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

        .bento-scrim {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            to top,
            rgba(20, 13, 9, 0.96) 0%,
            rgba(20, 13, 9, 0.64) 50%,
            rgba(20, 13, 9, 0.2) 100%
          );
          pointer-events: none;
        }

        .bento-content {
          position: relative;
          z-index: 3;
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .bento-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          width: max-content;
        }

        .bento-tag .green-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #22C55E;
        }

        .bento-card-title {
          font-family: var(--c-font-display);
          font-size: 1.55rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: #FFFFFF;
          margin: 0 0 6px 0;
        }

        .bento-card-subtitle {
          font-size: 0.84rem;
          color: rgba(255, 255, 255, 0.84);
          line-height: 1.4;
          margin: 0 0 14px 0;
          max-width: 480px;
        }

        .bento-stat-highlight {
          font-family: var(--c-font-display);
          font-size: 1.7rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #FFFFFF;
          margin: 8px 0;
          line-height: 1;
        }

        .bento-bullets {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
        }

        .bento-bullet {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.92);
        }

        .bento-bullet-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #FFA066;
          flex-shrink: 0;
        }

        .bento-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 16px;
          flex-wrap: nowrap;
        }

        .arrow-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          border: none;
          flex-shrink: 0;
          transition: all 0.2s ease;
          text-decoration: none;
          cursor: pointer;
        }

        .bento-card:hover .arrow-btn {
          background: #FFFFFF;
          color: #140D09;
          transform: scale(1.08);
        }

        .bento-cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          color: #FFFFFF;
          font-size: 0.84rem;
          font-weight: 700;
          text-decoration: none;
          border: none;
          padding: 4px 0;
          cursor: pointer;
          white-space: nowrap !important;
          flex-shrink: 0;
          transition: color 0.18s ease;
        }

        .bento-cta-pill:hover {
          color: #FFA066;
        }

        :global(.bento-cta-pill span) {
          margin-right: 8px !important;
        }

        :global(.bento-cta-pill svg) {
          margin-left: 6px !important;
          flex-shrink: 0 !important;
          transition: transform 0.18s ease !important;
        }

        :global(.bento-cta-pill:hover svg) {
          transform: translateX(5px) !important;
        }

        /* SPANS ASYMÉTRIQUES */
        .card-alibaba {
          grid-column: span 7;
          min-height: 380px;
        }

        .card-aerien {
          grid-column: span 5;
          min-height: 380px;
        }

        .card-maritime {
          grid-column: span 7;
          min-height: 360px;
        }

        .card-international {
          grid-column: span 5;
          min-height: 360px;
        }

        .options-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 12px 0;
        }

        .option-box {
          border-left: 2px solid #FFA066;
          padding-left: 10px;
        }

        .option-tag {
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          color: #FFA066;
          display: block;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .option-desc {
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.88);
          line-height: 1.35;
          margin: 0;
        }

        /* SECTION SHIPPING PASS / BOARDING PASS */
        .shipping-pass-block {
          margin-top: 24px;
          background-color: #FFFFFF;
          border-radius: 20px;
          padding: 26px 30px;
          box-shadow: 0 4px 24px rgba(20, 13, 9, 0.05);
          border: 1px solid rgba(20, 13, 9, 0.06);
        }

        .pass-tabs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(20, 13, 9, 0.08);
          margin-bottom: 20px;
        }

        .pass-label {
          font-family: var(--c-font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--c-text-light);
          text-transform: uppercase;
          display: block;
          margin-bottom: 3px;
        }

        .pass-headline {
          font-family: var(--c-font-display);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--c-text-main);
          margin: 0;
        }

        .pass-warehouse-capsules {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pass-capsule-btn {
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 600;
          border: 1px solid rgba(20, 13, 9, 0.12);
          background-color: transparent;
          color: var(--c-text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pass-capsule-btn.active {
          background-color: var(--c-text-main);
          color: #FAF6F0;
          border-color: var(--c-text-main);
        }

        .pass-body-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .pass-tag-title {
          font-family: var(--c-font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--c-text-main);
          margin-bottom: 6px;
        }

        .pass-chinese-address {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--c-text-main);
          line-height: 1.5;
          margin-bottom: 8px;
          background: #FAF6F0;
          padding: 12px 14px;
          border-radius: 10px;
          border-left: 3px solid #CC4E16;
        }

        .pass-contact-note {
          font-size: 0.78rem;
          color: var(--c-text-muted);
          margin-bottom: 14px;
        }

        .pass-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 9999px;
          background-color: var(--c-text-main);
          color: #FAF6F0;
          border: none;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .pass-copy-btn:hover {
          background-color: #2D1E16;
        }

        .pass-mark-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #FAF6F0;
          padding: 18px 20px;
          border-radius: 14px;
        }

        .pass-mark-header {
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--c-text-light);
          margin-bottom: 8px;
        }

        .pass-mark-box code {
          font-family: var(--c-font-mono);
          font-size: 0.86rem;
          font-weight: 700;
          color: #CC4E16;
          display: block;
          word-break: break-all;
          margin-bottom: 10px;
        }

        .pass-mark-hint {
          font-size: 0.76rem;
          color: var(--c-text-muted);
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .pass-copy-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9999px;
          background: #FFFFFF;
          color: var(--c-text-main);
          border: 1px solid rgba(20, 13, 9, 0.14);
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          width: max-content;
        }

        /* BANDEAU DE GARANTIES */
        .services-guarantees-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          padding: 30px 0;
          border-top: 1px solid rgba(20, 13, 9, 0.08);
          margin-top: 36px;
        }

        .guarantee-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .guarantee-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--c-text-main);
        }

        .guarantee-desc {
          font-size: 0.78rem;
          color: var(--c-text-muted);
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
          color: #CC4E16;
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

          /* FLUX VERTICAL ULTRA-AÉRÉ : UNE CARTE PAR LIGNE, ZÉRO COMPRESSION */
          .bento-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 22px !important;
            margin-bottom: 48px !important;
            width: 100% !important;
          }

          .card-alibaba,
          .card-aerien,
          .card-maritime,
          .card-international {
            width: 100% !important;
            min-height: 310px !important;
            grid-column: auto !important;
          }

          .bento-card {
            border-radius: 24px !important;
            box-shadow: 0 12px 36px -8px rgba(20, 13, 9, 0.28) !important;
          }

          .bento-content {
            padding: 26px 20px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            min-height: 310px !important;
            box-sizing: border-box !important;
          }

          .bento-tag {
            font-size: 0.68rem !important;
            padding: 5px 12px !important;
            gap: 6px !important;
            letter-spacing: 0.06em !important;
            margin-bottom: 14px !important;
          }

          .bento-card-title {
            font-size: 1.45rem !important;
            font-weight: 800 !important;
            line-height: 1.2 !important;
            margin-bottom: 6px !important;
          }

          .bento-card-subtitle {
            font-size: 0.84rem !important;
            line-height: 1.45 !important;
            margin-bottom: 14px !important;
            color: rgba(255, 255, 255, 0.88) !important;
            display: block !important;
          }

          .bento-stat-highlight {
            font-size: 1.55rem !important;
            font-weight: 800 !important;
            margin: 6px 0 10px 0 !important;
            line-height: 1 !important;
            color: #FFA066 !important;
          }

          .options-duo {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            margin: 12px 0 16px 0 !important;
          }

          .option-box {
            padding: 8px 10px !important;
            border-radius: 10px !important;
          }

          .option-tag {
            font-size: 0.66rem !important;
            font-weight: 700 !important;
          }

          .option-desc {
            font-size: 0.72rem !important;
            line-height: 1.3 !important;
          }

          .bento-bullets {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            margin: 10px 0 14px 0 !important;
          }

          .bento-bullet {
            font-size: 0.76rem !important;
            gap: 8px !important;
            line-height: 1.35 !important;
          }

          .bento-bullet strong {
            font-weight: 700 !important;
          }

          .bento-bottom-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 14px !important;
            margin-top: 14px !important;
            flex-wrap: nowrap !important;
          }

          .bento-bottom-row span {
            font-size: 0.74rem !important;
          }

          .bento-cta-pill {
            background: transparent !important;
            color: #FFFFFF !important;
            padding: 4px 0 !important;
            font-size: 0.82rem !important;
            gap: 12px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }

          :global(.bento-cta-pill span) {
            margin-right: 8px !important;
          }

          :global(.bento-cta-pill svg) {
            margin-left: 6px !important;
            flex-shrink: 0 !important;
          }

          .arrow-btn {
            width: 38px !important;
            height: 38px !important;
            border-radius: 50% !important;
            flex-shrink: 0 !important;
          }

          .arrow-btn svg {
            width: 17px !important;
            height: 17px !important;
          }

          /* SECTION BORDEREAU / SHIPPING PASS BIEN ESPACÉE */
          .shipping-pass-block {
            padding: 26px 20px !important;
            border-radius: 24px !important;
            margin-top: 48px !important;
          }

          .pass-body-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 22px !important;
          }

          .pass-tabs-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            margin-bottom: 22px !important;
          }

          .pass-warehouse-capsules {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            padding-bottom: 6px !important;
            width: 100% !important;
            gap: 8px !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }

        @media (max-width: 640px) {
          .options-duo {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }

          .bento-content {
            padding: 22px 16px !important;
          }

          .bento-card-title {
            font-size: 1.35rem !important;
          }

          .bento-stat-highlight {
            font-size: 1.35rem !important;
          }

          .bento-bottom-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .bento-cta-pill {
            width: auto !important;
            background: transparent !important;
            color: #FFFFFF !important;
            justify-content: flex-start !important;
            padding: 4px 0 !important;
            font-size: 0.84rem !important;
            gap: 12px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
          }

          :global(.bento-cta-pill span) {
            margin-right: 8px !important;
          }

          :global(.bento-cta-pill svg) {
            margin-left: 6px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
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