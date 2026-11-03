"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  getLiveTariffs,
  findTariff,
  saveClientRequest,
  OfficialTariff,
} from "@/shared";

function ServicesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Tarifs en direct synchronisés avec le Dashboard Admin
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());

  // Modale de demande express
  const [activeModal, setActiveModal] = useState<"alibaba" | "forwarding" | null>(null);

  // Entrepôt actif dans la section Shipping Mark
  const [activeWarehouse, setActiveWarehouse] = useState<"guangzhou" | "yiwu" | "dubai" | "paris">("guangzhou");
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);

  // Synchronisation des paramètres d'URL (?tab=alibaba ou ?tab=forwarding)
  useEffect(() => {
    if (tabParam === "alibaba") {
      setActiveModal("alibaba");
    } else if (tabParam === "forwarding" || tabParam === "chine" || tabParam === "dubai") {
      setActiveModal("forwarding");
    }
  }, [tabParam]);

  // Synchronisation avec l'admin storage
  useEffect(() => {
    const handleSync = () => {
      setTariffs(getLiveTariffs());
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  // --- FORMULAIRE ALIBABA ---
  const [aliProductUrl, setAliProductUrl] = useState("");
  const [aliQuantity, setAliQuantity] = useState("");
  const [aliSpecs, setAliSpecs] = useState("");
  const [aliDestination, setAliDestination] = useState("Côte d'Ivoire");
  const [aliName, setAliName] = useState("");
  const [aliPhone, setAliPhone] = useState("");
  const [aliSubmitting, setAliSubmitting] = useState(false);
  const [aliSuccess, setAliSuccess] = useState<{ ref: string; waUrl: string } | null>(null);
  const [aliError, setAliError] = useState("");

  const handleAlibabaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAliError("");
    if (!aliName.trim() || !aliPhone.trim()) {
      setAliError("Veuillez renseigner votre Nom et numéro WhatsApp.");
      return;
    }
    setAliSubmitting(true);
    try {
      const res = await saveClientRequest({
        service_type: "ALIBABA",
        client_name: aliName.trim(),
        client_phone: aliPhone.trim(),
        origin_country: "Chine",
        destination_country: aliDestination,
        product_url: aliProductUrl.trim(),
        product_quantity: aliQuantity.trim() || "1",
        product_specs: aliSpecs.trim(),
        cargo_type: `Achat Alibaba : ${aliProductUrl.trim() || "Articles divers"}`,
      });
      setAliSuccess({ ref: res.reference, waUrl: res.whatsappUrl });
    } catch (err: any) {
      setAliError(err.message || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setAliSubmitting(false);
    }
  };

  // --- FORMULAIRE FORWARDING / TRANSIT DIRECT ---
  const [fwdOrigin, setFwdOrigin] = useState("Chine");
  const [fwdDestination, setFwdDestination] = useState("Côte d'Ivoire");
  const [fwdMode, setFwdMode] = useState<"AIR" | "SEA">("AIR");
  const [fwdDescription, setFwdDescription] = useState("");
  const [fwdName, setFwdName] = useState("");
  const [fwdPhone, setFwdPhone] = useState("");
  const [fwdSubmitting, setFwdSubmitting] = useState(false);
  const [fwdSuccess, setFwdSuccess] = useState<{ ref: string; waUrl: string } | null>(null);
  const [fwdError, setFwdError] = useState("");

  const handleForwardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFwdError("");
    if (!fwdName.trim() || !fwdPhone.trim()) {
      setFwdError("Veuillez renseigner votre Nom et numéro WhatsApp.");
      return;
    }
    setFwdSubmitting(true);
    try {
      let sType: "FORWARDING" | "DUBAI" | "MAROC" | "FRANCE" = "FORWARDING";
      if (fwdOrigin.includes("Dubaï")) sType = "DUBAI";
      else if (fwdOrigin.includes("Maroc")) sType = "MAROC";
      else if (fwdOrigin.includes("France")) sType = "FRANCE";

      const res = await saveClientRequest({
        service_type: sType,
        client_name: fwdName.trim(),
        client_phone: fwdPhone.trim(),
        origin_country: fwdOrigin,
        destination_country: fwdDestination,
        shipping_mode_type: fwdMode,
        cargo_type: fwdDescription.trim() || "Colis et marchandises ordinaires",
      });
      setFwdSuccess({ ref: res.reference, waUrl: res.whatsappUrl });
    } catch (err: any) {
      setFwdError(err.message || "Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setFwdSubmitting(false);
    }
  };

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
      contact: "Contact Réception : +86 139 1111 2222 · Hub Yiwu",
      mark: "ROUM / [VOTRE-NOM] / [VOTRE-VILLE] / [AIR ou BATEAU]",
    },
    dubai: {
      city: "Dubaï (Émirats Arabes Unis)",
      name: "Comptoir Dubaï Deira Creek",
      chinese: "Al Sabkha Road, Deira Wholesale Market, Dubai, UAE",
      contact: "Contact Dubaï : +971 50 000 0000 · Hub Deira",
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
            <article
              className="bento-card card-alibaba"
              onClick={() => setActiveModal("alibaba")}
            >
              <img
                src="/images/services/achats.jpg"
                alt="Centrale d'Achat Alibaba"
                className="bento-card-bg"
              />
              <div className="bento-scrim" />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span className="green-dot" />
                    <span>ALIBABA, 1688 &amp; TAOBAO · PAIEMENT RMB</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title">Centrale d&apos;Achat</h2>
                  <p className="bento-card-subtitle">
                    Achetez sans carte bancaire internationale. Nous payons votre fournisseur chinois en Yuans sous 24h et contrôlons vos colis en entrepôt.
                  </p>

                  <div className="options-duo">
                    <div className="option-box">
                      <span className="option-tag">Option 1 · Sans fournisseur</span>
                      <p className="option-desc">Sourcing produit &amp; négociation directe en usine.</p>
                    </div>
                    <div className="option-box">
                      <span className="option-tag">Option 2 · Avec fournisseur</span>
                      <p className="option-desc">Règlement direct de votre proforma en Yuans RMB.</p>
                    </div>
                  </div>

                  <div className="bento-bottom-row">
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Règlement client : <strong>100% Mobile Money (Wave, Orange, MTN)</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModal("alibaba");
                      }}
                      className="bento-cta-pill"
                    >
                      <span>Lancer une commande</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 2 (40% LARGEUR, CARRÉE ÉLANCÉE) : VOIE AÉRIENNE EXPRESS */}
            <article className="bento-card card-aerien">
              <img
                src="/images/services/aerien.jpg"
                alt="Fret Aérien Express"
                className="bento-card-bg"
              />
              <div className="bento-scrim" />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span className="green-dot" />
                    <span>AVION EXPRESS</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title">Voie Aérienne</h2>
                  <div className="bento-stat-highlight">4 À 5 JOURS</div>
                  <p className="bento-card-subtitle" style={{ marginBottom: "8px" }}>
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
                      className="arrow-btn"
                      title="Voir les tarifs aériens"
                      aria-label="Voir les tarifs aériens"
                    >
                      <ArrowRight size={17} strokeWidth={2.4} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 3 (40% LARGEUR COMPACTE) : DUBAÏ DEIRA */}
            <article
              className="bento-card card-dubai"
              onClick={() => {
                setFwdOrigin("Dubaï (Émirats Arabes Unis)");
                setActiveModal("forwarding");
              }}
            >
              <div
                className="bento-scrim"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(35, 23, 16, 0.96) 0%, rgba(20, 13, 9, 0.98) 100%)",
                }}
              />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span>🇦🇪 ÉMIRATS ARABES UNIS</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title">Comptoir Dubaï</h2>
                  <div className="bento-stat-highlight" style={{ fontSize: "1.45rem", color: "#FFA066" }}>
                    DEIRA WHOLESALE
                  </div>
                  <p className="bento-card-subtitle">
                    Téléphones neufs &amp; reconditionnés, PC et cosmétiques. Ramassage direct dans les boutiques de Deira et expédition express.
                  </p>

                  <div className="bento-bullets">
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Transit express 4 à 6 jours ouvrés</span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Groupage maritime disponible</span>
                    </div>
                  </div>

                  <div className="bento-bottom-row">
                    <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.72)" }}>
                      Hub Deira Creek
                    </span>
                    <div className="arrow-btn">
                      <ArrowRight size={17} strokeWidth={2.4} />
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 4 (60% LARGEUR PANORAMIQUE) : VOIE MARITIME CBM */}
            <article className="bento-card card-maritime">
              <img
                src="/images/services/maritime.jpg"
                alt="Fret Maritime Groupage"
                className="bento-card-bg"
              />
              <div className="bento-scrim" />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span className="green-dot" />
                    <span>BATEAU · GROUPAGE CBM &amp; FCL</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title">Voie Maritime</h2>
                  <div className="bento-stat-highlight">DÈS 300 000 FCFA / M³</div>
                  <p className="bento-card-subtitle">
                    Acheminement économique par conteneur complet ou groupage au m³ depuis Guangzhou, Ningbo et Yiwu.
                    Idéal pour machines industrielles, matières premières et commerces.
                  </p>

                  <div className="options-duo" style={{ marginBottom: "10px" }}>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Délai moyen : 35 à 45 jours</span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Douane &amp; taxes de port incluses</span>
                    </div>
                  </div>

                  <div className="bento-bottom-row">
                    <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.72)" }}>
                      Scellés numérotés &amp; suivi en direct
                    </span>
                    <Link href="/tariffs?mode=SEA" className="bento-cta-pill">
                      <span>Voir les tarifs maritimes</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 5 (50% LARGEUR) : LIGNE PARIS ↔ AFRIQUE */}
            <article
              className="bento-card card-paris"
              onClick={() => {
                setFwdOrigin("France (Paris)");
                setActiveModal("forwarding");
              }}
            >
              <div
                className="bento-scrim"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(28, 20, 16, 0.95) 0%, rgba(18, 12, 9, 0.98) 100%)",
                }}
              />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span>🇫🇷 LIGNE FRANCE ↔ AFRIQUE</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title" style={{ fontSize: "1.35rem" }}>
                    Colis Paris ↔ Afrique
                  </h2>
                  <div className="bento-stat-highlight" style={{ fontSize: "1.25rem" }}>
                    8 500 FCFA / KG (12 €)
                  </div>
                  <p className="bento-card-subtitle">
                    Plis express, effets personnels, produits parapharmacie. Dépôt facile en Île-de-France ou ramassage.
                  </p>
                  <div className="bento-bottom-row">
                    <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.72)" }}>
                      Départs chaque semaine
                    </span>
                    <div className="arrow-btn">
                      <ArrowRight size={17} strokeWidth={2.4} />
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* CARTE 6 (50% LARGEUR) : LIGNE MAROC CASABLANCA */}
            <article
              className="bento-card card-maroc"
              onClick={() => {
                setFwdOrigin("Maroc (Casablanca)");
                setActiveModal("forwarding");
              }}
            >
              <div
                className="bento-scrim"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(28, 20, 16, 0.95) 0%, rgba(18, 12, 9, 0.98) 100%)",
                }}
              />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span>🇲🇦 LIGNE MAROC · CASABLANCA</span>
                  </div>
                </div>

                <div>
                  <h2 className="bento-card-title" style={{ fontSize: "1.35rem" }}>
                    Hub Maghreb ➔ Afrique
                  </h2>
                  <div className="bento-stat-highlight" style={{ fontSize: "1.15rem", color: "#FFA066" }}>
                    5 PAYS DESSERVIS
                  </div>
                  <p className="bento-card-subtitle">
                    Liaison directe depuis Casablanca vers Abidjan, Dakar, Bamako, Ouagadougou et Libreville.
                  </p>
                  <div className="bento-bottom-row">
                    <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.72)" }}>
                      Groupage régulier direct
                    </span>
                    <div className="arrow-btn">
                      <ArrowRight size={17} strokeWidth={2.4} />
                    </div>
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
                  >
                    {key === "guangzhou"
                      ? "🇨🇳 Guangzhou"
                      : key === "yiwu"
                      ? "🇨🇳 Yiwu"
                      : key === "dubai"
                      ? "🇦🇪 Dubaï"
                      : "🇫🇷 Paris"}
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
          MODALE EXPRESS ALIBABA (DRAWER ÉLÉGANT SANS CASSER LA PAGE)
         ======================================================== */}
      {activeModal === "alibaba" && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="modal-badge">
              <span className="green-dot" />
              <span>CENTRALE D&apos;ACHAT ALIBABA &amp; 1688</span>
            </div>

            <h3 className="modal-title">Lancer une commande assistée</h3>
            <p className="modal-desc">
              Nous réglons votre fournisseur chinois en Yuans (RMB) sous 24h. Vous payez en FCFA par Mobile Money.
            </p>

            {aliSuccess ? (
              <div className="modal-success-box">
                <CheckCircle2 size={38} color="#16A34A" style={{ margin: "0 auto 8px auto" }} />
                <div className="modal-success-title">
                  Commande enregistrée : {aliSuccess.ref}
                </div>
                <p className="modal-success-desc">
                  Votre demande est directement visible dans le tableau de bord de nos équipes. Continuez sur WhatsApp pour valider la facture proforma.
                </p>
                <a
                  href={aliSuccess.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-wa-btn"
                >
                  <MessageCircle size={16} />
                  <span>Confirmer sur WhatsApp avec mon conseiller</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleAlibabaSubmit} className="modal-form">
                <div>
                  <label className="modal-label">Lien du produit sur Alibaba, 1688 ou description *</label>
                  <input
                    type="text"
                    required
                    value={aliProductUrl}
                    onChange={(e) => setAliProductUrl(e.target.value)}
                    placeholder="Collez le lien de l'article ou décrivez votre article"
                    className="modal-input"
                  />
                </div>

                <div className="modal-input-grid">
                  <div>
                    <label className="modal-label">Quantité souhaitée</label>
                    <input
                      type="text"
                      value={aliQuantity}
                      onChange={(e) => setAliQuantity(e.target.value)}
                      placeholder="Ex : 50 pièces"
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="modal-label">Destination finale</label>
                    <select
                      value={aliDestination}
                      onChange={(e) => setAliDestination(e.target.value)}
                      className="modal-input"
                    >
                      <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                      <option value="Sénégal">Sénégal (Dakar)</option>
                      <option value="Mali">Mali (Bamako)</option>
                      <option value="Niger">Niger (Niamey)</option>
                      <option value="Burkina Faso">Burkina Faso (Ouagadougou)</option>
                      <option value="Gabon">Gabon (Libreville)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="modal-label">Spécifications (couleurs, tailles, modèles)</label>
                  <input
                    type="text"
                    value={aliSpecs}
                    onChange={(e) => setAliSpecs(e.target.value)}
                    placeholder="Ex : Couleur noire, taille L, prise européenne"
                    className="modal-input"
                  />
                </div>

                <div className="modal-input-grid">
                  <div>
                    <label className="modal-label">Votre Nom Complet *</label>
                    <input
                      type="text"
                      required
                      value={aliName}
                      onChange={(e) => setAliName(e.target.value)}
                      placeholder="Nom &amp; Prénom"
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="modal-label">Numéro WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={aliPhone}
                      onChange={(e) => setAliPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="modal-input"
                    />
                  </div>
                </div>

                {aliError && <div className="modal-error">{aliError}</div>}

                <button type="submit" disabled={aliSubmitting} className="modal-submit-btn">
                  <span>{aliSubmitting ? "Enregistrement en cours..." : "Transmettre ma demande d'achat"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODALE EXPRESS TRANSIT & EXPÉDITION
         ======================================================== */}
      {activeModal === "forwarding" && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="modal-badge">
              <span>EXPÉDITION &amp; TRANSIT CARGO</span>
            </div>

            <h3 className="modal-title">Expédier un colis ({fwdOrigin})</h3>
            <p className="modal-desc">
              Réception en entrepôt, pesée vidéo certifiée et dédouanement 100% compris jusqu&apos;à destination.
            </p>

            {fwdSuccess ? (
              <div className="modal-success-box">
                <CheckCircle2 size={38} color="#16A34A" style={{ margin: "0 auto 8px auto" }} />
                <div className="modal-success-title">
                  Dossier créé : {fwdSuccess.ref}
                </div>
                <p className="modal-success-desc">
                  Votre demande d&apos;expédition a été enregistrée. Validez votre étiquette avec notre conseiller sur WhatsApp.
                </p>
                <a
                  href={fwdSuccess.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-wa-btn"
                >
                  <MessageCircle size={16} />
                  <span>Obtenir mon étiquette sur WhatsApp</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleForwardingSubmit} className="modal-form">
                <div className="modal-input-grid">
                  <div>
                    <label className="modal-label">Pays de départ *</label>
                    <select
                      value={fwdOrigin}
                      onChange={(e) => setFwdOrigin(e.target.value)}
                      className="modal-input"
                    >
                      <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                      <option value="Dubaï (Émirats Arabes Unis)">Dubaï (Deira Market)</option>
                      <option value="France (Paris)">France (Paris Île-de-France)</option>
                      <option value="Maroc (Casablanca)">Maroc (Casablanca)</option>
                    </select>
                  </div>
                  <div>
                    <label className="modal-label">Mode d&apos;envoi</label>
                    <select
                      value={fwdMode}
                      onChange={(e) => setFwdMode(e.target.value as "AIR" | "SEA")}
                      className="modal-input"
                    >
                      <option value="AIR">Avion Express (4 à 5 jours)</option>
                      <option value="SEA">Bateau Groupage CBM (35 à 45 jours)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="modal-label">Description des marchandises</label>
                  <input
                    type="text"
                    value={fwdDescription}
                    onChange={(e) => setFwdDescription(e.target.value)}
                    placeholder="Ex : Vêtements, pièces électroniques, cosmétiques"
                    className="modal-input"
                  />
                </div>

                <div className="modal-input-grid">
                  <div>
                    <label className="modal-label">Votre Nom Complet *</label>
                    <input
                      type="text"
                      required
                      value={fwdName}
                      onChange={(e) => setFwdName(e.target.value)}
                      placeholder="Nom &amp; Prénom"
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="modal-label">Numéro WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={fwdPhone}
                      onChange={(e) => setFwdPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="modal-input"
                    />
                  </div>
                </div>

                {fwdError && <div className="modal-error">{fwdError}</div>}

                <button type="submit" disabled={fwdSubmitting} className="modal-submit-btn">
                  <span>{fwdSubmitting ? "Enregistrement..." : "Valider ma demande d'expédition"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
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
          gap: 6px;
          padding: 9px 18px;
          border-radius: 9999px;
          background: #FFFFFF;
          color: #140D09;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .bento-cta-pill:hover {
          transform: scale(1.03);
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

        .card-dubai {
          grid-column: span 5;
          min-height: 360px;
        }

        .card-maritime {
          grid-column: span 7;
          min-height: 360px;
        }

        .card-paris {
          grid-column: span 6;
          min-height: 280px;
        }

        .card-maroc {
          grid-column: span 6;
          min-height: 280px;
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

        /* RESPONSIVE MOBILE */
        @media (max-width: 900px) {
          .card-alibaba,
          .card-aerien,
          .card-dubai,
          .card-maritime,
          .card-paris,
          .card-maroc {
            grid-column: span 12 !important;
            min-height: 320px;
          }

          .bento-grid {
            gap: 14px;
          }

          .options-duo {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .pass-body-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .shipping-pass-block {
            padding: 20px 18px;
          }

          .modal-input-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .bento-bottom-row {
            flex-wrap: wrap;
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