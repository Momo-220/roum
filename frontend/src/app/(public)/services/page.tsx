"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  PackageCheck,
  Plane,
  Ship,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Copy,
  Check,
  Zap,
  BatteryCharging,
  Laptop,
  FileText,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CircularFlag } from "@/components/CircularFlag";
import {
  getLiveTariffs,
  findTariff,
  formatTariffPrice,
  saveClientRequest,
  OfficialTariff,
} from "@/shared";

type ServiceTab = "all" | "transit" | "alibaba" | "colis" | "china" | "dubai" | "morocco" | "france";

function ServicesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Filtre actif parmi les 3 grandes catégories
  const [activeTab, setActiveTab] = useState<ServiceTab>("all");

  // Formulaire actuellement ouvert (accordéon)
  const [openedForm, setOpenedForm] = useState<"alibaba" | "forwarding" | null>(null);

  // Tarifs en direct synchronisés avec le Dashboard Admin
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());

  useEffect(() => {
    if (tabParam === "alibaba") {
      setActiveTab("alibaba");
      setOpenedForm("alibaba");
    } else if (tabParam === "transit") {
      setActiveTab("transit");
    } else if (tabParam === "colis" || tabParam === "france") {
      setActiveTab("colis");
    } else if (tabParam === "forwarding" || tabParam === "chine" || tabParam === "china") {
      setActiveTab("china");
      setOpenedForm("forwarding");
    } else if (tabParam === "dubai") {
      setActiveTab("dubai");
      setOpenedForm("forwarding");
    } else if (tabParam === "morocco" || tabParam === "maroc") {
      setActiveTab("morocco");
    }
  }, [tabParam]);

  // Synchronisation continue en temps réel avec le Dashboard Admin (écoute les changements de tarifs)
  useEffect(() => {
    const handleSync = () => {
      setTariffs(getLiveTariffs());
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  // --- ÉTATS DU FORMULAIRE ALIBABA ---
  const [aliProductUrl, setAliProductUrl] = useState("");
  const [aliQuantity, setAliQuantity] = useState("");
  const [aliSpecs, setAliSpecs] = useState("");
  const [aliDestination, setAliDestination] = useState("Côte d'Ivoire");
  const [aliName, setAliName] = useState("");
  const [aliPhone, setAliPhone] = useState("");
  const [aliSubmitting, setAliSubmitting] = useState(false);
  const [aliSuccess, setAliSuccess] = useState<{ ref: string; waUrl: string } | null>(null);
  const [aliError, setAliError] = useState("");

  // --- ÉTATS DU FORMULAIRE ACHAT ET ENVOIS (CHINE, DUBAÏ, MAROC, FRANCE) ---
  const [fwdOrigin, setFwdOrigin] = useState("Chine");
  const [fwdDestination, setFwdDestination] = useState("Côte d'Ivoire");
  const [fwdTransportMode, setFwdTransportMode] = useState<"AIR" | "SEA">("AIR");
  const [fwdDescription, setFwdDescription] = useState("");
  const [fwdName, setFwdName] = useState("");
  const [fwdPhone, setFwdPhone] = useState("");
  const [fwdSubmitting, setFwdSubmitting] = useState(false);
  const [fwdSuccess, setFwdSuccess] = useState<{
    ref: string;
    waUrl: string;
    shippingMark: string;
    warehouseAddress: string;
  } | null>(null);
  const [fwdError, setFwdError] = useState("");
  const [copiedMark, setCopiedMark] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  // Soumission Formulaire Alibaba
  const handleAlibabaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAliError("");
    if (!aliName.trim() || !aliPhone.trim()) {
      setAliError("Veuillez renseigner votre Nom et votre numéro WhatsApp.");
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

  // Soumission Formulaire Expédition et Transit
  const handleForwardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFwdError("");
    if (!fwdName.trim() || !fwdPhone.trim()) {
      setFwdError("Veuillez renseigner votre Nom et votre numéro WhatsApp.");
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
        shipping_mode_type: fwdTransportMode,
        cargo_type: fwdDescription.trim() || "Colis et marchandises ordinaires",
      });

      setFwdSuccess({
        ref: res.reference,
        waUrl: res.whatsappUrl,
        shippingMark: res.shippingMark,
        warehouseAddress: res.warehouseAddress,
      });
    } catch (err: any) {
      setFwdError(err.message || "Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setFwdSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, isAddress: boolean = false) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isAddress) {
        setCopiedAddr(true);
        setTimeout(() => setCopiedAddr(false), 2000);
      } else {
        setCopiedMark(true);
        setTimeout(() => setCopiedMark(false), 2000);
      }
    }
  };

  // --- TARIFS DYNAMIQUES EXTRAITS DE L'ADMIN EN TEMPS RÉEL ---
  // Chine
  const cnNormal = findTariff(tariffs, "chine", "normale");
  const cnExpress = findTariff(tariffs, "chine", "express");
  const cnBattery = findTariff(tariffs, "chine", "batterie");
  const cnTech = findTariff(tariffs, "chine", "ordinateur");
  const cnSea = findTariff(tariffs, "chine", "bateau");

  // Dubaï
  const aeExpress = findTariff(tariffs, "émirat", "express") || findTariff(tariffs, "duba", "express");
  const aeNormal = findTariff(tariffs, "émirat", "normale") || findTariff(tariffs, "duba", "normale");
  const aeSpecial = findTariff(tariffs, "émirat", "spécial") || findTariff(tariffs, "duba", "spécial");
  const aeSea = findTariff(tariffs, "émirat", "bateau") || findTariff(tariffs, "duba", "bateau");

  // Maroc
  const maCi = findTariff(tariffs, "maroc", "abidjan") || findTariff(tariffs, "maroc", "côte d'ivoire");
  const maSn = findTariff(tariffs, "maroc", "dakar") || findTariff(tariffs, "maroc", "sénégal");
  const maMl = findTariff(tariffs, "maroc", "bamako") || findTariff(tariffs, "maroc", "mali");
  const maBf = findTariff(tariffs, "maroc", "ouaga") || findTariff(tariffs, "maroc", "burkina");
  const maGa = findTariff(tariffs, "maroc", "libreville") || findTariff(tariffs, "maroc", "gabon");

  // France
  const frCiDivers = findTariff(tariffs, "france", "divers");
  const frCiCosm = findTariff(tariffs, "france", "cosmétique");
  const frCiDoc = findTariff(tariffs, "france", "document");

  return (
    <div
      style={{
        backgroundColor: "transparent",
        color: "var(--c-text-main)",
        minHeight: "calc(100vh - 110px)",
        padding: "24px 16px 110px 16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* En-tête éditorial style Linea */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.76rem",
                fontFamily: "var(--c-font-mono)",
                fontWeight: 700,
                color: "var(--c-text-light)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              <span style={{ color: "var(--c-accent-red)" }}>●</span>
              <span>SERVICES & GRILLES CARGO OFFICIELLES</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--c-font-display)",
                fontSize: "clamp(1.4rem, 4.4vw, 2.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
                color: "var(--c-text-main)",
                margin: "0 0 16px 0",
              }}
            >
              Tous nos Services de Transit & Centrale d&apos;Achat
            </h1>

            <p style={{ fontSize: "1.06rem", color: "var(--c-text-muted)", maxWidth: "680px", margin: "0 auto", lineHeight: 1.6 }}>
              Chine, Dubaï, Maroc et France vers la Côte d&apos;Ivoire et l&apos;Afrique.
              <strong> Douane entièrement comprise</strong>, sans frais caché à l&apos;arrivée.
            </p>
          </div>

          {/* Filtres par boutons "Pills" pour naviguer facilement */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "36px",
            }}
          >
            {[
              { id: "all", label: "Tous nos Services" },
              { id: "alibaba", label: "Achat Assisté Alibaba & 1688" },
              { id: "transit", label: "Transit International (Chine, Dubaï, Maroc)" },
              { id: "colis", label: "Envoi de Colis (Paris ↔ Abidjan)" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setActiveTab(btn.id as ServiceTab)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "9999px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: activeTab === btn.id ? "1px solid var(--c-text-main)" : "1px solid var(--c-border)",
                  backgroundColor: activeTab === btn.id ? "var(--c-text-main)" : "#FFFFFF",
                  color: activeTab === btn.id ? "#FAF5F0" : "var(--c-text-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Bandeau d'engagement sobre intégré dans le flux sans aucun cadran lourd */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
              padding: "20px 0",
              borderTop: "1px solid var(--c-border)",
              borderBottom: "1px solid var(--c-border)",
              marginBottom: "44px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShieldCheck size={20} color="#166534" />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--c-text-main)" }}>Douane 100% comprise</div>
                <div style={{ fontSize: "0.78rem", color: "var(--c-text-muted)" }}>Zéro mauvaise surprise à la réception</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <MapPin size={20} color="var(--c-text-main)" />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--c-text-main)" }}>Retrait ou Livraison</div>
                <div style={{ fontSize: "0.78rem", color: "var(--c-text-muted)" }}>Agence de destination ou domicile</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Clock size={20} color="var(--c-text-main)" />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--c-text-main)" }}>Délais garantis</div>
                <div style={{ fontSize: "0.78rem", color: "var(--c-text-muted)" }}>Avion 4 à 6 jours · Bateau régulier</div>
              </div>
            </div>
          </div>

          {/* LISTE DES 5 GRANDS SERVICES EXACTS DU DASHBOARD ADMIN */}
          <div style={{ display: "grid", gap: "28px", marginBottom: "44px" }}>
            {/* ========================================================
                1. SERVICE ALIBABA : ACHAT ASSISTÉ & PAIEMENT FOURNISSEUR
               ======================================================== */}
            {(activeTab === "all" || activeTab === "alibaba") && (
              <article
                style={{
                  backgroundColor: "#FFFFFF",
                  border: openedForm === "alibaba" ? "1px solid var(--c-text-main)" : "1px solid var(--c-border)",
                  borderRadius: "14px",
                  padding: "32px 28px",
                  boxShadow: "0 2px 10px rgba(27, 20, 17, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "10px", backgroundColor: "var(--c-text-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingBag size={22} color="#FFFFFF" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.74rem", fontFamily: "var(--c-font-mono)", fontWeight: 700, textTransform: "uppercase", color: "var(--c-text-light)", letterSpacing: "0.08em" }}>
                        Service 02 · Centrale d&apos;Achat
                      </div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--c-text-main)", margin: "3px 0 0 0", fontFamily: "var(--c-font-display)", letterSpacing: "-0.03em" }}>
                        Commander sur Alibaba (Nous payons votre fournisseur)
                      </h2>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--c-text-main)", backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border)", padding: "5px 12px", borderRadius: "9999px" }}>
                    Paiement en Yuans (RMB) garanti
                  </span>
                </div>

                <p style={{ fontSize: "0.96rem", color: "var(--c-text-muted)", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: "860px" }}>
                  Vous avez repéré un article sur <strong>Alibaba, Taobao ou 1688</strong> mais vous n&apos;avez pas de moyen de paiement en Chine ?
                  Roum Transit paie votre fournisseur directement en Yuans chinois (RMB), réceptionne vos colis dans nos magasins de Guangzhou ou Yiwu,
                  vérifie la conformité et vous livre en toute sécurité à Abidjan et partout en Afrique de l&apos;Ouest.
                </p>

                {/* Détails de ce qui est inclus */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    backgroundColor: "var(--c-bg)",
                    border: "1px solid var(--c-border)",
                    padding: "16px",
                    borderRadius: "10px",
                    marginBottom: "22px",
                  }}
                >
                  <div style={{ fontSize: "0.84rem", color: "var(--c-text-muted)" }}>
                    <strong style={{ color: "var(--c-text-main)" }}>1. Négociation & Paiement :</strong> Règlement direct de l&apos;usine chinoise.
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--c-text-muted)" }}>
                    <strong style={{ color: "var(--c-text-main)" }}>2. Contrôle Magasin :</strong> Photos et vérification à Guangzhou / Yiwu.
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--c-text-muted)" }}>
                    <strong style={{ color: "var(--c-text-main)" }}>3. Douane Comprise :</strong> Aucun frais surprise lors du retrait.
                  </div>
                </div>

                {/* Bouton d'action pour ouvrir le formulaire */}
                <button
                  type="button"
                  onClick={() => setOpenedForm(openedForm === "alibaba" ? null : "alibaba")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "11px 22px",
                    borderRadius: "9999px",
                    backgroundColor: openedForm === "alibaba" ? "#FFFFFF" : "var(--c-text-main)",
                    color: openedForm === "alibaba" ? "var(--c-text-main)" : "#FAF5F0",
                    border: "1px solid var(--c-text-main)",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{openedForm === "alibaba" ? "Masquer le formulaire" : "Lancer ma commande Alibaba"}</span>
                  <ArrowRight size={14} />
                </button>

                {/* FORMULAIRE ALIBABA INTÉGRÉ */}
                {openedForm === "alibaba" && (
                  <div
                    style={{
                      marginTop: "24px",
                      paddingTop: "24px",
                      borderTop: "1px solid var(--c-border)",
                    }}
                  >
                    {aliSuccess ? (
                      <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", padding: "20px", borderRadius: "12px", textAlign: "center" }}>
                        <CheckCircle2 size={36} color="#16A34A" style={{ margin: "0 auto 8px auto" }} />
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#166534", marginBottom: "4px" }}>
                          Commande enregistrée avec succès : {aliSuccess.ref}
                        </div>
                        <p style={{ fontSize: "0.86rem", color: "#15803D", marginBottom: "16px" }}>
                          Votre demande est bien visible dans le tableau de bord de nos équipes. Vous pouvez continuer sur WhatsApp pour valider la facture proforma.
                        </p>
                        <a
                          href={aliSuccess.waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "11px 22px",
                            borderRadius: "9999px",
                            backgroundColor: "#25D366",
                            color: "#FFFFFF",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <MessageCircle size={15} />
                          <span>Confirmer avec mon conseiller sur WhatsApp</span>
                        </a>
                      </div>
                    ) : (
                      <form onSubmit={handleAlibabaSubmit} style={{ display: "grid", gap: "14px", maxWidth: "720px" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
                          Formulaire Commande Alibaba & Chine
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                            Lien du produit sur Alibaba ou description *
                          </label>
                          <input
                            type="text"
                            required
                            value={aliProductUrl}
                            onChange={(e) => setAliProductUrl(e.target.value)}
                            placeholder="Collez le lien de l'article ou décrivez votre produit"
                            style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                              Quantité souhaitée
                            </label>
                            <input
                              type="text"
                              value={aliQuantity}
                              onChange={(e) => setAliQuantity(e.target.value)}
                              placeholder="Ex : 50 pièces"
                              style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                              Destination de livraison
                            </label>
                            <select
                              value={aliDestination}
                              onChange={(e) => setAliDestination(e.target.value)}
                              style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", backgroundColor: "#FFFFFF", boxSizing: "border-box" }}
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
                          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                            Spécifications particulières (couleurs, tailles, modèles)
                          </label>
                          <input
                            type="text"
                            value={aliSpecs}
                            onChange={(e) => setAliSpecs(e.target.value)}
                            placeholder="Ex : Modèle noir, taille L, avec chargeur européen"
                            style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                              Votre Nom Complet *
                            </label>
                            <input
                              type="text"
                              required
                              value={aliName}
                              onChange={(e) => setAliName(e.target.value)}
                              placeholder="Nom et Prénom"
                              style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                              Numéro WhatsApp *
                            </label>
                            <input
                              type="tel"
                              required
                              value={aliPhone}
                              onChange={(e) => setAliPhone(e.target.value)}
                              placeholder="+225 07 00 00 00 00"
                              style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                        {aliError && <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600 }}>{aliError}</div>}

                        <button
                          type="submit"
                          disabled={aliSubmitting}
                          style={{
                            height: "46px",
                            borderRadius: "9999px",
                            backgroundColor: "var(--c-text-main)",
                            color: "#FAF5F0",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            marginTop: "6px",
                            transition: "opacity 0.15s ease",
                          }}
                        >
                          <span>{aliSubmitting ? "Enregistrement en cours..." : "Transmettre ma demande d'achat"}</span>
                          <ArrowRight size={14} />
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </article>
            )}

            {/* ========================================================
                2. SERVICE CHINE : TRANSIT GUANGZHOU & YIWU
               ======================================================== */}
            {(activeTab === "all" || activeTab === "transit" || activeTab === "china") && (
              <article
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--c-border)",
                  borderRadius: "14px",
                  padding: "32px 28px",
                  boxShadow: "0 2px 10px rgba(27, 20, 17, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "10px", backgroundColor: "var(--c-text-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircularFlag countryCode="CN" size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.74rem", fontFamily: "var(--c-font-mono)", fontWeight: 700, textTransform: "uppercase", color: "var(--c-text-light)", letterSpacing: "0.08em" }}>
                        Transit & Magasins Chine
                      </div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--c-text-main)", margin: "3px 0 0 0", fontFamily: "var(--c-font-display)", letterSpacing: "-0.03em" }}>
                        Transit Chine (Guangzhou & Yiwu)
                      </h2>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--c-text-main)", backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border)", padding: "5px 12px", borderRadius: "9999px" }}>
                    Magasins Baiyun & Yiwu ouverts 7j/7
                  </span>
                </div>

                <p style={{ fontSize: "0.96rem", color: "var(--c-text-muted)", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: "860px" }}>
                  Vous passez vous-même commande auprès de vos usines ou fournisseurs en Chine ?
                  Donnez-leur simplement l&apos;adresse de nos magasins partenaires à <strong>Guangzhou</strong> et à <strong>Yiwu</strong> avec votre code client.
                  Dès réception, nous pesons, consolidons vos cartons et expédions par avion ou par bateau avec dédouanement total.
                </p>

                {/* Grille des 5 Formules Réelles Synchronisées avec l'Admin */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                  {/* Voie Normale */}
                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Plane size={16} color="var(--c-text-main)" />
                        <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Voie Normale par Avion</strong>
                      </div>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        12 à 14 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(cnNormal?.price_per_unit_minor || 1000000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Vêtements, chaussures, mèches et marchandises générales ordinaires.
                    </p>
                  </div>

                  {/* Voie Express */}
                  <div style={{ border: "1px solid var(--c-text-main)", borderRadius: "10px", padding: "14px", backgroundColor: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Zap size={16} color="#D97706" />
                        <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Voie Express par Avion</strong>
                      </div>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>
                        4 à 5 jours chrono
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(cnExpress?.price_per_unit_minor || 1200000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Livraison ultra-rapide par vol direct pour vos colis urgents.
                    </p>
                  </div>

                  {/* Batteries & Compléments */}
                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <BatteryCharging size={16} color="var(--c-text-main)" />
                        <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Batteries & Crèmes</strong>
                      </div>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        7 à 10 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(cnBattery?.price_per_unit_minor || 1400000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Compléments alimentaires, batteries et cosmétiques liquides.
                    </p>
                  </div>

                  {/* Pièces Informatiques */}
                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Laptop size={16} color="var(--c-text-main)" />
                        <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Ordinateurs & High-Tech</strong>
                      </div>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        Sécurisé
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(cnTech?.price_per_unit_minor || 5000000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ carton</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Pièces détachées, écrans et appareils électroniques avec calage anti-choc.
                    </p>
                  </div>

                  {/* Bateau CBM */}
                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Ship size={16} color="var(--c-text-main)" />
                        <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Par Bateau (Au mètre cube)</strong>
                      </div>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        35 à 45 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(cnSea?.price_per_unit_minor || 30000000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ m³</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      La solution la plus économique pour les gros cartons et palettes volumineuses.
                    </p>
                  </div>
                </div>

                {/* Boutons d'action pour la Chine */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFwdOrigin("Chine");
                      setOpenedForm(openedForm === "forwarding" && fwdOrigin === "Chine" ? null : "forwarding");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--c-text-main)",
                      color: "#FAF5F0",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Obtenir l&apos;adresse du magasin Chine</span>
                    <ArrowRight size={14} />
                  </button>
                  <Link
                    href="/tariffs"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "#FFFFFF",
                      color: "var(--c-text-main)",
                      border: "1px solid var(--c-border)",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Simulateur de prix précis</span>
                  </Link>
                </div>
              </article>
            )}

            {/* ========================================================
                3. SERVICE DUBAÏ : TRANSIT ÉMIRATS ARABES UNIS
               ======================================================== */}
            {(activeTab === "all" || activeTab === "transit" || activeTab === "dubai") && (
              <article
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--c-border)",
                  borderRadius: "14px",
                  padding: "32px 28px",
                  boxShadow: "0 2px 10px rgba(27, 20, 17, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "10px", backgroundColor: "var(--c-text-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircularFlag countryCode="AE" size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.74rem", fontFamily: "var(--c-font-mono)", fontWeight: 700, textTransform: "uppercase", color: "var(--c-text-light)", letterSpacing: "0.08em" }}>
                        Transit Émirats
                      </div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--c-text-main)", margin: "3px 0 0 0", fontFamily: "var(--c-font-display)", letterSpacing: "-0.03em" }}>
                        Transit Dubaï (Émirats Arabes Unis)
                      </h2>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--c-text-main)", backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border)", padding: "5px 12px", borderRadius: "9999px" }}>
                    Départ Dubaï DXB & Port Jebel Ali
                  </span>
                </div>

                <p style={{ fontSize: "0.96rem", color: "var(--c-text-muted)", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: "860px" }}>
                  Pour tous vos achats effectués à <strong>Dubaï (marchés de Deira, Al Sabkha, Naif)</strong> :
                  parfumerie fine, cosmétiques, bijoux, téléphones et prêt-à-porter.
                  Déposez vos marchandises à notre agence de Deira ou faites livrer directement par vos fournisseurs émiratis.
                </p>

                {/* Grille des 4 Formules Dubaï Synchronisées avec l'Admin */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ border: "1px solid var(--c-text-main)", borderRadius: "10px", padding: "14px", backgroundColor: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Voie Express Dubaï</strong>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>
                        4 à 5 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(aeExpress?.price_per_unit_minor || 1200000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Vol direct quotidien depuis l&apos;aéroport de Dubaï vers Abidjan.
                    </p>
                  </div>

                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Voie Normale Dubaï</strong>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        10 à 14 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(aeNormal?.price_per_unit_minor || 1000000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Envoi groupé hebdomadaire régulier et économique.
                    </p>
                  </div>

                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Parfums & Cosmétiques</strong>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        7 à 10 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(aeSpecial?.price_per_unit_minor || 1400000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Parfumerie de luxe, huiles de parfum et cosmétiques des Émirats.
                    </p>
                  </div>

                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Par Bateau Dubaï (m³)</strong>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        30 à 40 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(aeSea?.price_per_unit_minor || 30000000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ m³</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Départ port Jebel Ali au mètre cube pour vos gros volumes.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFwdOrigin("Émirats Arabes Unis (Dubaï)");
                      setOpenedForm(openedForm === "forwarding" && fwdOrigin.includes("Dubaï") ? null : "forwarding");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--c-text-main)",
                      color: "#FAF5F0",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Obtenir l&apos;adresse du magasin Dubaï</span>
                    <ArrowRight size={14} />
                  </button>
                  <Link
                    href="/tariffs"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "#FFFFFF",
                      color: "var(--c-text-main)",
                      border: "1px solid var(--c-border)",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Calculer mon tarif Dubaï</span>
                  </Link>
                </div>
              </article>
            )}

            {/* ========================================================
                4. SERVICE MAROC : GROUPAGE CASABLANCA VERS 5 PAYS
               ======================================================== */}
            {(activeTab === "all" || activeTab === "transit" || activeTab === "morocco") && (
              <article
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--c-border)",
                  borderRadius: "14px",
                  padding: "32px 28px",
                  boxShadow: "0 2px 10px rgba(27, 20, 17, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "10px", backgroundColor: "var(--c-text-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircularFlag countryCode="MA" size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.74rem", fontFamily: "var(--c-font-mono)", fontWeight: 700, textTransform: "uppercase", color: "var(--c-text-light)", letterSpacing: "0.08em" }}>
                        Groupage Aérien Express
                      </div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--c-text-main)", margin: "3px 0 0 0", fontFamily: "var(--c-font-display)", letterSpacing: "-0.03em" }}>
                        Groupage Maroc Express (Casablanca vers 5 Pays)
                      </h2>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534", backgroundColor: "#DCFCE7", padding: "5px 12px", borderRadius: "9999px" }}>
                    5 Jours Chrono Garantis
                  </span>
                </div>

                <p style={{ fontSize: "0.96rem", color: "var(--c-text-muted)", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: "860px" }}>
                  Roum Transit est le <strong>leader du transport aérien groupé depuis le Maroc</strong>.
                  Chaque semaine, nous assurons des départs d&apos;avion directs depuis notre plateforme de Casablanca (Zone Industrielle Ain Sebaa)
                  vers 5 capitales africaines avec remise rapide et dédouanement garanti.
                </p>

                {/* Grille des 5 destinations depuis Casablanca */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "24px" }}>
                  {[
                    { country: "Côte d'Ivoire", city: "Abidjan", code: "CI", price: maCi?.price_per_unit_minor || 650000 },
                    { country: "Sénégal", city: "Dakar", code: "SN", price: maSn?.price_per_unit_minor || 700000 },
                    { country: "Mali", city: "Bamako", code: "ML", price: maMl?.price_per_unit_minor || 700000 },
                    { country: "Burkina Faso", city: "Ouagadougou", code: "BF", price: maBf?.price_per_unit_minor || 750000 },
                    { country: "Gabon", city: "Libreville", code: "GA", price: maGa?.price_per_unit_minor || 750000 },
                  ].map((dst) => (
                    <div key={dst.code} style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px 12px", backgroundColor: "var(--c-bg)", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                        <CircularFlag countryCode={dst.code} size={20} />
                      </div>
                      <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--c-text-main)" }}>{dst.city}</div>
                      <div style={{ fontSize: "0.74rem", color: "var(--c-text-muted)", marginBottom: "4px" }}>{dst.country}</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--c-text-main)", fontFamily: "var(--c-font-display)" }}>
                        {formatTariffPrice(dst.price)} <span style={{ fontSize: "0.74rem", color: "var(--c-text-muted)", fontWeight: 500 }}>/ kg</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 600, marginTop: "2px" }}>
                        5 jours chrono
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFwdOrigin("Maroc");
                      setOpenedForm(openedForm === "forwarding" && fwdOrigin === "Maroc" ? null : "forwarding");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--c-text-main)",
                      color: "#FAF5F0",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Déposer un colis à Casablanca</span>
                    <ArrowRight size={14} />
                  </button>
                  <Link
                    href="/tariffs"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "#FFFFFF",
                      color: "var(--c-text-main)",
                      border: "1px solid var(--c-border)",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Simulateur Groupage Maroc</span>
                  </Link>
                </div>
              </article>
            )}

            {/* ========================================================
                5. SERVICE FRANCE : ENVOI DE COLIS PARIS ↔ ABIDJAN
               ======================================================== */}
            {(activeTab === "all" || activeTab === "colis" || activeTab === "france") && (
              <article
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--c-border)",
                  borderRadius: "14px",
                  padding: "32px 28px",
                  boxShadow: "0 2px 10px rgba(27, 20, 17, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "10px", backgroundColor: "var(--c-text-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircularFlag countryCode="FR" size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.74rem", fontFamily: "var(--c-font-mono)", fontWeight: 700, textTransform: "uppercase", color: "var(--c-text-light)", letterSpacing: "0.08em" }}>
                        Envoi de Colis & Plis
                      </div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--c-text-main)", margin: "3px 0 0 0", fontFamily: "var(--c-font-display)", letterSpacing: "-0.03em" }}>
                        Envoi de Colis France (Paris ↔ Abidjan)
                      </h2>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--c-text-main)", backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border)", padding: "5px 12px", borderRadius: "9999px" }}>
                    3 à 5 Jours de Vol
                  </span>
                </div>

                <p style={{ fontSize: "0.96rem", color: "var(--c-text-muted)", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: "860px" }}>
                  Ligne aérienne régulière opérant <strong>dans les deux sens</strong> :
                  de <strong>Paris vers Abidjan</strong> ou d&apos;<strong>Abidjan vers Paris</strong>.
                  Idéal pour envoyer vos effets personnels, valises, produits de beauté ou vos documents administratifs urgents en toute sérénité.
                </p>

                {/* Les 3 formules officielles France */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Articles Ordinaires & Vêtements</strong>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        3 à 5 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(frCiDivers?.price_per_unit_minor || 850000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ 12 € le kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Colis personnels, vêtements, valises, chaussures et cadeaux.
                    </p>
                  </div>

                  <div style={{ border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px", backgroundColor: "var(--c-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Cosmétiques, Beurres & Liquides</strong>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#EAE6DF", color: "var(--c-text-main)", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        3 à 5 jours
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(frCiCosm?.price_per_unit_minor || 900000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ 14 € le kg</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Crèmes, huiles végétales, beurre de karité et produits capillaires sécurisés.
                    </p>
                  </div>

                  <div style={{ border: "1px solid var(--c-text-main)", borderRadius: "10px", padding: "14px", backgroundColor: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--c-text-main)" }}>Document Administratif & Pli</strong>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>
                        2 à 3 jours chrono
                      </span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: "4px 0", fontFamily: "var(--c-font-display)" }}>
                      {formatTariffPrice(frCiDoc?.price_per_unit_minor || 1300000)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--c-text-muted)" }}>/ 20 € le pli</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-text-muted)", margin: 0 }}>
                      Passeports, attestations, dossiers d&apos;études et contrats remis sous pli scellé.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFwdOrigin("France");
                      setOpenedForm(openedForm === "forwarding" && fwdOrigin === "France" ? null : "forwarding");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--c-text-main)",
                      color: "#FAF5F0",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Expédier depuis Paris ou Abidjan</span>
                    <ArrowRight size={14} />
                  </button>
                  <Link
                    href="/tariffs"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 22px",
                      borderRadius: "9999px",
                      backgroundColor: "#FFFFFF",
                      color: "var(--c-text-main)",
                      border: "1px solid var(--c-border)",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>Simuler le tarif Paris ↔ Abidjan</span>
                  </Link>
                </div>
              </article>
            )}
          </div>

          {/* ========================================================
              FORMULAIRE TRANSIT DÉROULÉ (CHINE, DUBAÏ, MAROC, FRANCE)
             ======================================================== */}
          {openedForm === "forwarding" && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--c-border)",
                borderRadius: "14px",
                padding: "32px 28px",
                marginBottom: "40px",
                maxWidth: "760px",
                margin: "0 auto 40px auto",
                boxShadow: "0 4px 20px -2px rgba(27, 20, 17, 0.05)",
              }}
            >
              {fwdSuccess ? (
                <div style={{ textAlign: "center", padding: "10px" }}>
                  <CheckCircle2 size={40} color="#166534" style={{ margin: "0 auto 10px auto" }} />
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--c-text-main)", marginBottom: "6px", fontFamily: "var(--c-font-display)" }}>
                    Dossier Prêt : {fwdSuccess.ref}
                  </div>
                  <p style={{ fontSize: "0.92rem", color: "var(--c-text-muted)", marginBottom: "20px" }}>
                    Votre dossier a été transmis directement au tableau de bord de nos équipes.
                    Voici vos instructions d&apos;expédition :
                  </p>

                  <div style={{ backgroundColor: "var(--c-bg)", padding: "18px", borderRadius: "10px", border: "1px solid var(--c-border)", textAlign: "left", marginBottom: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--c-text-main)" }}>Code à inscrire sur tous vos cartons :</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fwdSuccess.shippingMark, false)}
                        style={{ border: "none", background: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--c-text-main)", fontWeight: 700 }}
                      >
                        {copiedMark ? <Check size={13} color="#166534" /> : <Copy size={13} />}
                        <span>{copiedMark ? "Copié !" : "Copier le code"}</span>
                      </button>
                    </div>
                    <div style={{ fontFamily: "var(--c-font-mono)", fontWeight: 700, fontSize: "1.05rem", color: "var(--c-text-main)", padding: "10px 14px", backgroundColor: "#FFFFFF", border: "1px solid var(--c-border)", borderRadius: "8px", marginBottom: "16px" }}>
                      {fwdSuccess.shippingMark}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--c-text-main)" }}>Adresse de livraison du magasin :</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fwdSuccess.warehouseAddress, true)}
                        style={{ border: "none", background: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--c-text-main)", fontWeight: 700 }}
                      >
                        {copiedAddr ? <Check size={13} color="#166534" /> : <Copy size={13} />}
                        <span>{copiedAddr ? "Copiée !" : "Copier l'adresse"}</span>
                      </button>
                    </div>
                    <div style={{ fontSize: "0.88rem", color: "var(--c-text-muted)", lineHeight: 1.55, padding: "10px 14px", backgroundColor: "#FFFFFF", border: "1px solid var(--c-border)", borderRadius: "8px" }}>
                      {fwdSuccess.warehouseAddress}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                    <a
                      href={fwdSuccess.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "11px 22px",
                        borderRadius: "9999px",
                        backgroundColor: "#25D366",
                        color: "#FFFFFF",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      <MessageCircle size={15} />
                      <span>Transmettre à mon conseiller sur WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setFwdSuccess(null)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "11px 20px",
                        borderRadius: "9999px",
                        backgroundColor: "#FFFFFF",
                        color: "var(--c-text-main)",
                        border: "1px solid var(--c-border)",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <span>Faire une autre demande</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForwardingSubmit} style={{ display: "grid", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                      Obtenir l&apos;adresse magasin & mon code carton
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenedForm(null)}
                      style={{ background: "none", border: "none", fontSize: "0.8rem", color: "#6B7280", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Fermer
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Pays de départ *
                      </label>
                      <select
                        value={fwdOrigin}
                        onChange={(e) => setFwdOrigin(e.target.value)}
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", backgroundColor: "#FFFFFF", boxSizing: "border-box" }}
                      >
                        <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                        <option value="Émirats Arabes Unis (Dubaï)">Émirats Arabes Unis (Dubaï)</option>
                        <option value="Maroc">Maroc (Casablanca)</option>
                        <option value="France">France (Paris)</option>
                        <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Destination *
                      </label>
                      <select
                        value={fwdDestination}
                        onChange={(e) => setFwdDestination(e.target.value)}
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", backgroundColor: "#FFFFFF", boxSizing: "border-box" }}
                      >
                        <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                        <option value="Sénégal">Sénégal (Dakar)</option>
                        <option value="Mali">Mali (Bamako)</option>
                        <option value="Burkina Faso">Burkina Faso (Ouagadougou)</option>
                        <option value="Gabon">Gabon (Libreville)</option>
                        <option value="France">France (Paris)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                      Mode de Transport
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setFwdTransportMode("AIR")}
                        style={{
                          height: "42px",
                          borderRadius: "8px",
                          border: fwdTransportMode === "AIR" ? "2px solid #111827" : "1px solid #D1D5DB",
                          backgroundColor: fwdTransportMode === "AIR" ? "#111827" : "#FFFFFF",
                          color: fwdTransportMode === "AIR" ? "#FFFFFF" : "#374151",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Plane size={15} />
                        <span>Par Avion (Rapide)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFwdTransportMode("SEA")}
                        style={{
                          height: "42px",
                          borderRadius: "8px",
                          border: fwdTransportMode === "SEA" ? "2px solid #111827" : "1px solid #D1D5DB",
                          backgroundColor: fwdTransportMode === "SEA" ? "#111827" : "#FFFFFF",
                          color: fwdTransportMode === "SEA" ? "#FFFFFF" : "#374151",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Ship size={15} />
                        <span>Par Bateau (Gros volume)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                      Que souhaitez-vous transporter ? *
                    </label>
                    <input
                      type="text"
                      required
                      value={fwdDescription}
                      onChange={(e) => setFwdDescription(e.target.value)}
                      placeholder="Ex : Vêtements, chaussures, cartons de mèches, sacs, ordinateurs..."
                      style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Votre Nom Complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={fwdName}
                        onChange={(e) => setFwdName(e.target.value)}
                        placeholder="Ex : Koffi Kouassi"
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Votre Numéro WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={fwdPhone}
                        onChange={(e) => setFwdPhone(e.target.value)}
                        placeholder="+225 01 00 00 00 00"
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {fwdError && <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600 }}>{fwdError}</div>}

                  <button
                    type="submit"
                    disabled={fwdSubmitting}
                    style={{
                      height: "46px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--c-text-main)",
                      color: "#FAF5F0",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "6px",
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    <span>{fwdSubmitting ? "Génération en cours..." : "Générer mon adresse magasin & code carton"}</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Bandeau de clôture vers le simulateur */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--c-border)",
              borderRadius: "14px",
              padding: "28px 24px",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(27, 20, 17, 0.03)",
            }}
          >
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", marginBottom: "6px", fontFamily: "var(--c-font-display)" }}>
              Vous connaissez le poids ou les dimensions de votre colis ?
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--c-text-muted)", margin: "0 0 18px 0" }}>
              Utilisez notre simulateur transparent pour calculer exactement le tarif avec dédouanement inclus.
            </p>
            <Link
              href="/tariffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 24px",
                borderRadius: "9999px",
                backgroundColor: "var(--c-text-main)",
                color: "#FAF5F0",
                fontSize: "0.88rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>Accéder au simulateur de prix</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Chargement...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
