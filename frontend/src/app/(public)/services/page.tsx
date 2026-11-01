"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  PackageCheck,
  Search,
  Plane,
  Ship,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  MapPin,
  FileText,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { buildWhatsAppUrl } from "@/shared";

type ServiceTab = "alibaba" | "forwarding" | "tracking";

function ServicesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ServiceTab | null;
  const [activeTab, setActiveTab] = useState<ServiceTab>("alibaba");

  useEffect(() => {
    if (tabParam === "alibaba" || tabParam === "forwarding" || tabParam === "tracking") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // État formulaire Alibaba
  const [aliProductUrl, setAliProductUrl] = useState("");
  const [aliQuantity, setAliQuantity] = useState("");
  const [aliSpecs, setAliSpecs] = useState("");
  const [aliDestination, setAliDestination] = useState("Côte d'Ivoire");
  const [aliTransportMode, setAliTransportMode] = useState<"AIR" | "SEA">("AIR");
  const [aliName, setAliName] = useState("");
  const [aliPhone, setAliPhone] = useState("");
  const [aliEmail, setAliEmail] = useState("");
  const [aliSubmitting, setAliSubmitting] = useState(false);
  const [aliSuccess, setAliSuccess] = useState<{
    ref: string;
    waUrl: string;
  } | null>(null);
  const [aliError, setAliError] = useState("");

  // État formulaire Fournisseur Existant (Transitaire)
  const [fwdOrigin, setFwdOrigin] = useState("Chine");
  const [fwdDestination, setFwdDestination] = useState("Côte d'Ivoire");
  const [fwdTransportMode, setFwdTransportMode] = useState<"AIR" | "SEA">("AIR");
  const [fwdDescription, setFwdDescription] = useState("");
  const [fwdSupplierInfo, setFwdSupplierInfo] = useState("");
  const [fwdWeight, setFwdWeight] = useState("");
  const [fwdCbm, setFwdCbm] = useState("");
  const [fwdName, setFwdName] = useState("");
  const [fwdPhone, setFwdPhone] = useState("");
  const [fwdEmail, setFwdEmail] = useState("");
  const [fwdSubmitting, setFwdSubmitting] = useState(false);
  const [fwdSuccess, setFwdSuccess] = useState<{
    ref: string;
    waUrl: string;
    shippingMark: string;
    warehouseAddress: string;
  } | null>(null);
  const [fwdError, setFwdError] = useState("");

  const [copiedMark, setCopiedMark] = useState(false);

  // Destinations adaptatives selon l'origine
  const getDestinationsForOrigin = (orig: string) => {
    if (orig === "Chine") {
      return ["Côte d'Ivoire", "Niger", "Sénégal", "Mali"];
    }
    if (orig === "Côte d'Ivoire") {
      return ["France", "Maroc", "Gabon", "Sénégal", "Mali"];
    }
    if (orig === "Maroc") {
      return ["Côte d'Ivoire"];
    }
    return ["Côte d'Ivoire", "Niger", "Sénégal", "Mali"];
  };

  const handleOriginChange = (newOrigin: string) => {
    setFwdOrigin(newOrigin);
    const dests = getDestinationsForOrigin(newOrigin);
    if (!dests.includes(fwdDestination)) {
      setFwdDestination(dests[0]);
    }
  };

  // Soumission Formulaire Alibaba
  const handleAlibabaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAliError("");

    if (!aliName.trim() || !aliPhone.trim()) {
      setAliError("Veuillez renseigner votre nom et votre numéro WhatsApp.");
      return;
    }
    if (!aliProductUrl.trim() && !aliSpecs.trim()) {
      setAliError("Veuillez renseigner le lien du produit Alibaba ou décrire les articles à commander.");
      return;
    }

    setAliSubmitting(true);
    try {
      const res = await fetch("/api/v1/public/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "ALIBABA",
          client_name: aliName.trim(),
          client_phone: aliPhone.trim(),
          client_email: aliEmail.trim() || undefined,
          origin_country: "Chine",
          destination_country: aliDestination,
          shipping_mode_id: aliTransportMode === "AIR" ? "AIR_EXPRESS" : "SEA_LCL",
          product_url: aliProductUrl.trim(),
          product_quantity: aliQuantity.trim() || "1",
          product_specs: aliSpecs.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Impossible d'enregistrer votre demande.");
      }

      setAliSuccess({
        ref: json.quote_reference,
        waUrl: json.whatsapp_url,
      });
    } catch (err: any) {
      setAliError(err.message || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setAliSubmitting(false);
    }
  };

  // Soumission Formulaire Transitaire (Fournisseur Déjà Présent)
  const handleForwardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFwdError("");

    if (!fwdName.trim() || !fwdPhone.trim()) {
      setFwdError("Veuillez renseigner votre nom et votre numéro WhatsApp.");
      return;
    }
    if (!fwdDescription.trim()) {
      setFwdError("Veuillez décrire brièvement la marchandise à transporter.");
      return;
    }

    setFwdSubmitting(true);
    try {
      const weightNum = parseFloat(fwdWeight);
      const cbmNum = parseFloat(fwdCbm);

      const res = await fetch("/api/v1/public/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "FORWARDING",
          client_name: fwdName.trim(),
          client_phone: fwdPhone.trim(),
          client_email: fwdEmail.trim() || undefined,
          origin_country: fwdOrigin,
          destination_country: fwdDestination,
          shipping_mode_id: fwdTransportMode === "AIR" ? "AIR_EXPRESS" : "SEA_LCL",
          cargo_type: fwdDescription.trim(),
          supplier_info: fwdSupplierInfo.trim(),
          estimated_weight_kg: !isNaN(weightNum) && weightNum > 0 ? weightNum : undefined,
          estimated_cbm: !isNaN(cbmNum) && cbmNum > 0 ? cbmNum : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Impossible d'enregistrer votre expédition.");
      }

      setFwdSuccess({
        ref: json.quote_reference,
        waUrl: json.whatsapp_url,
        shippingMark: json.warehouse_china?.shipping_mark || `ROUM / ${json.quote_reference} / ${fwdName.toUpperCase()}`,
        warehouseAddress: json.warehouse_china?.address || "Guangzhou Baiyun Logistics Center, District de Baiyun, Guangzhou, Guangdong, Chine",
      });
    } catch (err: any) {
      setFwdError(err.message || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setFwdSubmitting(false);
    }
  };

  const handleCopyMark = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMark(true);
    setTimeout(() => setCopiedMark(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "48px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* En-tête éditorial */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "9999px",
                backgroundColor: "#F3F4F6",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "14px",
              }}
            >
              Services Opérationnels ROUM TRANSIT
            </div>

            <h1
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "#111827",
                margin: "0 auto 16px auto",
                maxWidth: "840px",
                textWrap: "balance",
              }}
            >
              Trois grands services conçus pour sécuriser vos approvisionnements
            </h1>

            <p
              style={{
                fontSize: "1.08rem",
                color: "#4B5563",
                maxWidth: "680px",
                margin: "0 auto",
                lineHeight: 1.6,
                textWrap: "pretty",
              }}
            >
              Que vous souhaitiez commander sur Alibaba, transporter des marchandises déjà achetées ou suivre votre colis en direct, choisissez votre option ci-dessous.
            </p>
          </div>

          {/* Sélecteur des 3 Grands Services */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
              marginBottom: "36px",
            }}
          >
            {/* Bouton Onglet 1 */}
            <button
              type="button"
              onClick={() => setActiveTab("alibaba")}
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: activeTab === "alibaba" ? "2px solid #111827" : "1px solid #E5E7EB",
                backgroundColor: activeTab === "alibaba" ? "#111827" : "#FFFFFF",
                color: activeTab === "alibaba" ? "#FFFFFF" : "#111827",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: activeTab === "alibaba" ? "0 4px 14px rgba(17, 24, 39, 0.12)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <ShoppingBag size={20} color={activeTab === "alibaba" ? "#FFFFFF" : "#111827"} />
                <span style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8 }}>
                  Service 01
                </span>
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "4px" }}>
                Commander sur Alibaba
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.85, lineHeight: 1.4 }}>
                Recherche, négociation, paiement fournisseur en Yuans et acheminement complet.
              </div>
            </button>

            {/* Bouton Onglet 2 */}
            <button
              type="button"
              onClick={() => setActiveTab("forwarding")}
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: activeTab === "forwarding" ? "2px solid #111827" : "1px solid #E5E7EB",
                backgroundColor: activeTab === "forwarding" ? "#111827" : "#FFFFFF",
                color: activeTab === "forwarding" ? "#FFFFFF" : "#111827",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: activeTab === "forwarding" ? "0 4px 14px rgba(17, 24, 39, 0.12)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <PackageCheck size={20} color={activeTab === "forwarding" ? "#FFFFFF" : "#111827"} />
                <span style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8 }}>
                  Service 02
                </span>
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "4px" }}>
                J&apos;ai déjà mon fournisseur
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.85, lineHeight: 1.4 }}>
                Adresse entrepôt en Chine, identification colis, groupage et expédition aérienne ou maritime.
              </div>
            </button>

            {/* Bouton Onglet 3 */}
            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: activeTab === "tracking" ? "2px solid #111827" : "1px solid #E5E7EB",
                backgroundColor: activeTab === "tracking" ? "#111827" : "#FFFFFF",
                color: activeTab === "tracking" ? "#FFFFFF" : "#111827",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: activeTab === "tracking" ? "0 4px 14px rgba(17, 24, 39, 0.12)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Search size={20} color={activeTab === "tracking" ? "#FFFFFF" : "#111827"} />
                <span style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8 }}>
                  Service 03
                </span>
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "4px" }}>
                Suivre une commande ou un colis
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.85, lineHeight: 1.4 }}>
                Traçabilité des 9 étapes : de la commande à la remise en main propre.
              </div>
            </button>
          </div>

          {/* CONTENU SERVICE 1 : COMMANDER SUR ALIBABA */}
          {activeTab === "alibaba" && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "36px 30px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                marginBottom: "56px",
              }}
            >
              <div style={{ maxWidth: "860px", margin: "0 auto" }}>
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    Service 01 · Achat & Transit Clé en Main
                  </div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                    Commander des produits sur Alibaba avec ROUM TRANSIT
                  </h2>
                  <p style={{ fontSize: "1rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                    Ce service s&apos;adresse aux commerçants et particuliers qui souhaitent acheter des marchandises sur Alibaba mais qui ont besoin d&apos;accompagnement pour sécuriser la commande, régler le fournisseur en Chine et organiser le transport jusqu&apos;à destination.
                  </p>
                </div>

                {/* Les 10 étapes du fonctionnement */}
                <div
                  style={{
                    backgroundColor: "#FAF9F6",
                    border: "1px solid #E5E7EB",
                    borderRadius: "14px",
                    padding: "24px",
                    marginBottom: "36px",
                  }}
                >
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#111827", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Comment fonctionne ce service (Les étapes) :
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "14px",
                      fontSize: "0.86rem",
                      color: "#374151",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>1.</span>
                      <span>Vous indiquez le lien du produit Alibaba ou fournissez les photos.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>2.</span>
                      <span>Vous précisez la quantité, modèles, couleurs, tailles et spécifications.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>3.</span>
                      <span>Vous renseignez vos coordonnées et votre pays de destination.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>4.</span>
                      <span>ROUM TRANSIT examine votre demande et contacte le fournisseur en Chine.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>5.</span>
                      <span>Notre équipe prépare un devis clair : prix des produits + frais de transport.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>6.</span>
                      <span>Après votre accord, ROUM effectue la commande et le paiement en Yuans (RMB).</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>7.</span>
                      <span>Les marchandises sont réceptionnées et contrôlées à notre entrepôt en Chine.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>8.</span>
                      <span>Nous organisons le transport vers votre destination (avion ou bateau).</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>9.</span>
                      <span>Vous suivez l&apos;avancement en temps réel sur le site.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>10.</span>
                      <span>Retrait sécurisé à l&apos;agence ou livraison avec dédouanement garanti.</span>
                    </div>
                  </div>
                </div>

                {/* Formulaire réel interactif */}
                {aliSuccess ? (
                  <div
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "14px",
                      padding: "28px",
                      textAlign: "center",
                    }}
                  >
                    <CheckCircle2 size={36} color="#16A34A" style={{ margin: "0 auto 12px auto" }} />
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#166534", margin: "0 0 8px 0" }}>
                      Demande de commande Alibaba enregistrée !
                    </h3>
                    <p style={{ fontSize: "0.94rem", color: "#166534", margin: "0 0 18px 0" }}>
                      Numéro de dossier attribué : <strong>{aliSuccess.ref}</strong>
                    </p>
                    <p style={{ fontSize: "0.88rem", color: "#374151", maxWidth: "520px", margin: "0 auto 24px auto", lineHeight: 1.5 }}>
                      Notre équipe logistique en Chine étudie votre lien produit et prépare votre devis complet (marchandises + transport). Cliquez ci-dessous pour confirmer directement sur WhatsApp.
                    </p>
                    <a
                      href={aliSuccess.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="roum-btn-primary"
                      style={{ display: "inline-flex", padding: "12px 24px", fontSize: "0.92rem" }}
                    >
                      <MessageCircle size={16} />
                      <span>Confirmer ma commande sur WhatsApp</span>
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleAlibabaSubmit} style={{ display: "grid", gap: "18px" }}>
                    <div style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", borderBottom: "1px solid #E5E7EB", paddingBottom: "10px" }}>
                      Formulaire : « Je souhaite commander sur Alibaba »
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                        Lien du produit sur Alibaba ou description de l&apos;article *
                      </label>
                      <input
                        type="text"
                        value={aliProductUrl}
                        onChange={(e) => setAliProductUrl(e.target.value)}
                        placeholder="Ex : https://french.alibaba.com/p-detail/... ou Description précise du produit"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          height: "46px",
                          padding: "0 14px",
                          fontSize: "14px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "8px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Quantité souhaitée
                        </label>
                        <input
                          type="text"
                          value={aliQuantity}
                          onChange={(e) => setAliQuantity(e.target.value)}
                          placeholder="Ex : 50 pièces / 3 cartons"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Mode de transport souhaité
                        </label>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={() => setAliTransportMode("AIR")}
                            style={{
                              flex: 1,
                              height: "46px",
                              borderRadius: "8px",
                              border: aliTransportMode === "AIR" ? "2px solid #111827" : "1px solid #D1D5DB",
                              backgroundColor: aliTransportMode === "AIR" ? "#111827" : "#FFFFFF",
                              color: aliTransportMode === "AIR" ? "#FFFFFF" : "#111827",
                              fontWeight: 700,
                              fontSize: "0.86rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <Plane size={16} />
                            <span>Avion (Express)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAliTransportMode("SEA")}
                            style={{
                              flex: 1,
                              height: "46px",
                              borderRadius: "8px",
                              border: aliTransportMode === "SEA" ? "2px solid #111827" : "1px solid #D1D5DB",
                              backgroundColor: aliTransportMode === "SEA" ? "#111827" : "#FFFFFF",
                              color: aliTransportMode === "SEA" ? "#FFFFFF" : "#111827",
                              fontWeight: 700,
                              fontSize: "0.86rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <Ship size={16} />
                            <span>Bateau (CBM)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                        Caractéristiques (Modèles, couleurs, tailles, spécifications)
                      </label>
                      <textarea
                        value={aliSpecs}
                        onChange={(e) => setAliSpecs(e.target.value)}
                        rows={3}
                        placeholder="Ex : Modèle noir et blanc, tailles M et L, 220V, prise européenne..."
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 14px",
                          fontSize: "14px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "8px",
                          outline: "none",
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Destination finale *
                        </label>
                        <select
                          value={aliDestination}
                          onChange={(e) => setAliDestination(e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            outline: "none",
                            fontWeight: 600,
                          }}
                        >
                          <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                          <option value="Niger">Niger (Niamey)</option>
                          <option value="Sénégal">Sénégal (Dakar)</option>
                          <option value="Mali">Mali (Bamako)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Votre nom complet *
                        </label>
                        <input
                          type="text"
                          value={aliName}
                          onChange={(e) => setAliName(e.target.value)}
                          placeholder="Ex : Kouamé Jean"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Téléphone WhatsApp *
                        </label>
                        <input
                          type="tel"
                          value={aliPhone}
                          onChange={(e) => setAliPhone(e.target.value)}
                          placeholder="Ex : +225 07 00 00 00 00"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {aliError && (
                      <div style={{ fontSize: "0.84rem", color: "#DC2626", fontWeight: 600 }}>
                        {aliError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={aliSubmitting}
                      className="roum-btn-primary"
                      style={{
                        padding: "14px 24px",
                        fontSize: "0.94rem",
                        marginTop: "8px",
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      <span>{aliSubmitting ? "Enregistrement en cours..." : "Transmettre ma demande et recevoir mon devis"}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* CONTENU SERVICE 2 : J'AI DÉJÀ MON FOURNISSEUR (FRET TRANSITAIRE) */}
          {activeTab === "forwarding" && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "36px 30px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                marginBottom: "56px",
              }}
            >
              <div style={{ maxWidth: "860px", margin: "0 auto" }}>
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    Service 02 · Réception Magasin & Fret International
                  </div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                    Faire transporter ses marchandises avec fournisseur existant
                  </h2>
                  <p style={{ fontSize: "1rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                    Ce service s&apos;adresse aux clients qui ont déjà trouvé leur fournisseur ou déjà payé leurs marchandises en Chine, au Maroc ou en Côte d&apos;Ivoire, et qui recherchent un transitaire fiable pour réceptionner, contrôler, peser et expédier leurs colis.
                  </p>
                </div>

                {/* Les 10 étapes du fonctionnement */}
                <div
                  style={{
                    backgroundColor: "#FAF9F6",
                    border: "1px solid #E5E7EB",
                    borderRadius: "14px",
                    padding: "24px",
                    marginBottom: "36px",
                  }}
                >
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#111827", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Comment fonctionne ce service (Les étapes) :
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "14px",
                      fontSize: "0.86rem",
                      color: "#374151",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>1.</span>
                      <span>Vous renseignez votre pays de départ et votre pays de destination.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>2.</span>
                      <span>Vous décrivez les marchandises que vous souhaitez transporter.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>3.</span>
                      <span>Vous indiquez les informations disponibles sur votre fournisseur.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>4.</span>
                      <span>Vous précisez le poids ou les dimensions estimées des colis.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>5.</span>
                      <span>ROUM TRANSIT vous communique les coordonnées précises de l&apos;entrepôt.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>6.</span>
                      <span>Vous transmettez l&apos;adresse et votre code de marquage à votre fournisseur.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>7.</span>
                      <span>Dès livraison au magasin, l&apos;équipe ROUM identifie et pèse vos colis.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>8.</span>
                      <span>ROUM organise l&apos;expédition par avion ou bateau selon votre choix.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>9.</span>
                      <span>Vous consultez chaque étape du transport avec votre numéro de suivi.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: 800, color: "#111827" }}>10.</span>
                      <span>Vos colis sont mis à disposition à l&apos;agence avec dédouanement 100% inclus.</span>
                    </div>
                  </div>
                </div>

                {/* Formulaire réel interactif Transitaire */}
                {fwdSuccess ? (
                  <div
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "14px",
                      padding: "28px",
                    }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                      <CheckCircle2 size={36} color="#16A34A" style={{ margin: "0 auto 10px auto" }} />
                      <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#166534", margin: "0 0 6px 0" }}>
                        Dossier d&apos;expédition créé : {fwdSuccess.ref}
                      </h3>
                      <p style={{ fontSize: "0.92rem", color: "#166534", margin: 0 }}>
                        Voici les informations à communiquer dès aujourd&apos;hui à votre fournisseur :
                      </p>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        padding: "18px",
                        marginBottom: "20px",
                        fontSize: "0.88rem",
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ color: "#111827" }}>1. Code de marquage obligatoire (Shipping Mark) :</strong>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "#F3F4F6",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            marginTop: "6px",
                          }}
                        >
                          <span>{fwdSuccess.shippingMark}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMark(fwdSuccess.shippingMark)}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#111827",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                            }}
                          >
                            {copiedMark ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                            <span>{copiedMark ? "Copié" : "Copier"}</span>
                          </button>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>
                          (À faire inscrire au marqueur noir sur chaque carton par le fournisseur).
                        </span>
                      </div>

                      <div>
                        <strong style={{ color: "#111827" }}>2. Adresse de l&apos;entrepôt de réception :</strong>
                        <div style={{ backgroundColor: "#F3F4F6", padding: "8px 12px", borderRadius: "6px", marginTop: "6px", color: "#374151" }}>
                          {fwdSuccess.warehouseAddress}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <a
                        href={fwdSuccess.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="roum-btn-primary"
                        style={{ display: "inline-flex", padding: "12px 24px", fontSize: "0.92rem" }}
                      >
                        <MessageCircle size={16} />
                        <span>Contacter l&apos;équipe pour confirmer la réception</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleForwardingSubmit} style={{ display: "grid", gap: "18px" }}>
                    <div style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", borderBottom: "1px solid #E5E7EB", paddingBottom: "10px" }}>
                      Formulaire : « J&apos;ai déjà mon fournisseur, je recherche un transitaire »
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Pays de départ *
                        </label>
                        <select
                          value={fwdOrigin}
                          onChange={(e) => handleOriginChange(e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            outline: "none",
                            fontWeight: 600,
                          }}
                        >
                          <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                          <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                          <option value="Maroc">Maroc (Casablanca)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Pays de destination *
                        </label>
                        <select
                          value={fwdDestination}
                          onChange={(e) => setFwdDestination(e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            outline: "none",
                            fontWeight: 600,
                          }}
                        >
                          {getDestinationsForOrigin(fwdOrigin).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Mode de transport
                        </label>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={() => setFwdTransportMode("AIR")}
                            style={{
                              flex: 1,
                              height: "46px",
                              borderRadius: "8px",
                              border: fwdTransportMode === "AIR" ? "2px solid #111827" : "1px solid #D1D5DB",
                              backgroundColor: fwdTransportMode === "AIR" ? "#111827" : "#FFFFFF",
                              color: fwdTransportMode === "AIR" ? "#FFFFFF" : "#111827",
                              fontWeight: 700,
                              fontSize: "0.86rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <Plane size={16} />
                            <span>Avion</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFwdTransportMode("SEA")}
                            style={{
                              flex: 1,
                              height: "46px",
                              borderRadius: "8px",
                              border: fwdTransportMode === "SEA" ? "2px solid #111827" : "1px solid #D1D5DB",
                              backgroundColor: fwdTransportMode === "SEA" ? "#111827" : "#FFFFFF",
                              color: fwdTransportMode === "SEA" ? "#FFFFFF" : "#111827",
                              fontWeight: 700,
                              fontSize: "0.86rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <Ship size={16} />
                            <span>Bateau</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                        Description des marchandises à transporter *
                      </label>
                      <input
                        type="text"
                        value={fwdDescription}
                        onChange={(e) => setFwdDescription(e.target.value)}
                        placeholder="Ex : Vêtements, chaussures, cartons d'accessoires de téléphone, quincaillerie..."
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          height: "46px",
                          padding: "0 14px",
                          fontSize: "14px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "8px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                        Informations disponibles sur votre fournisseur
                      </label>
                      <input
                        type="text"
                        value={fwdSupplierInfo}
                        onChange={(e) => setFwdSupplierInfo(e.target.value)}
                        placeholder="Ex : Nom de l'usine, ville en Chine (Yiwu / Shenzhen), contact WeChat ou téléphone"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          height: "46px",
                          padding: "0 14px",
                          fontSize: "14px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "8px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Poids estimé (en kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={fwdWeight}
                          onChange={(e) => setFwdWeight(e.target.value)}
                          placeholder="Ex : 25"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Volume estimé en mètre cube (CBM)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={fwdCbm}
                          onChange={(e) => setFwdCbm(e.target.value)}
                          placeholder="Ex : 1.2"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Votre nom complet *
                        </label>
                        <input
                          type="text"
                          value={fwdName}
                          onChange={(e) => setFwdName(e.target.value)}
                          placeholder="Ex : Aminata Koné"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                          Téléphone WhatsApp *
                        </label>
                        <input
                          type="tel"
                          value={fwdPhone}
                          onChange={(e) => setFwdPhone(e.target.value)}
                          placeholder="Ex : +225 01 00 00 00 00"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {fwdError && (
                      <div style={{ fontSize: "0.84rem", color: "#DC2626", fontWeight: 600 }}>
                        {fwdError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={fwdSubmitting}
                      className="roum-btn-primary"
                      style={{
                        padding: "14px 24px",
                        fontSize: "0.94rem",
                        marginTop: "8px",
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      <span>{fwdSubmitting ? "Génération du dossier en cours..." : "Obtenir les informations de l'entrepôt en Chine"}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* CONTENU SERVICE 3 : SUIVRE UNE COMMANDE OU UN COLIS */}
          {activeTab === "tracking" && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "36px 30px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                marginBottom: "56px",
              }}
            >
              <div style={{ maxWidth: "860px", margin: "0 auto" }}>
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    Service 03 · Traçabilité Intégrale
                  </div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                    Suivre une commande ou un colis
                  </h2>
                  <p style={{ fontSize: "1rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                    Ce service permet aux clients de consulter l&apos;état d&apos;avancement de leurs commandes et de leurs marchandises à tout moment sans devoir contacter systématiquement le service commercial.
                  </p>
                </div>

                {/* Recherche rapide */}
                <div
                  style={{
                    backgroundColor: "#FAF9F6",
                    border: "1px solid #D1D5DB",
                    borderRadius: "14px",
                    padding: "24px",
                    marginBottom: "36px",
                  }}
                >
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
                    Accéder à l&apos;outil de suivi en direct :
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link
                      href="/tracking"
                      className="roum-btn-primary"
                      style={{ padding: "12px 24px", fontSize: "0.92rem" }}
                    >
                      <Search size={16} />
                      <span>Ouvrir l&apos;écran de suivi de colis</span>
                    </Link>
                  </div>
                </div>

                {/* Les 9 étapes clés du suivi */}
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#111827", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Les 9 étapes de suivi d&apos;une commande et d&apos;une expédition :
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {[
                      { step: "01", title: "Demande reçue", desc: "La commande ou la demande de transport est enregistrée dans le système." },
                      { step: "02", title: "Devis envoyé", desc: "Le montant détaillé des marchandises et du transport est communiqué au client." },
                      { step: "03", title: "Paiement confirmé", desc: "Le règlement est validé et les fonds sont alloués aux opérations." },
                      { step: "04", title: "Commande effectuée", desc: "L'équipe ROUM achète les articles auprès du fournisseur en Chine." },
                      { step: "05", title: "Marchandises reçues en Chine", desc: "Les colis sont réceptionnés au magasin, pesés et identifiés." },
                      { step: "06", title: "Colis expédié", desc: "La marchandise est scellée et en vol aérien ou à bord du navire cargo." },
                      { step: "07", title: "Colis arrivé à destination", desc: "Arrivée sur le sol de destination et formalités de dédouanement." },
                      { step: "08", title: "Colis disponible pour retrait", desc: "Le colis est prêt en agence à Bingerville ou au hub local." },
                      { step: "09", title: "Colis livré", desc: "Remise officielle en main propre au client destinataire." },
                    ].map((item) => (
                      <div
                        key={item.step}
                        style={{
                          backgroundColor: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: "#FFFFFF",
                            backgroundColor: "#111827",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            flexShrink: 0,
                          }}
                        >
                          {item.step}
                        </span>
                        <div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6B7280", lineHeight: 1.45 }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4 : LES MOYENS DE TRANSPORT PROPOSÉS */}
          <div style={{ marginBottom: "56px" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Logistique Internationale
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                Les deux moyens de transport proposés
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Transport Aérien */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #111827",
                  borderRadius: "14px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Plane size={24} color="#FFFFFF" />
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Transport Aérien (Par Avion)
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Idéal pour l&apos;expédition rapide des marchandises légères, des vêtements, des téléphones, ordinateurs et colis urgents. Départs réguliers garantis.
                  </p>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "6px 12px", borderRadius: "8px", display: "inline-block", marginBottom: "20px" }}>
                    Délai express : 4 à 5 jours
                  </div>
                </div>

                <Link
                  href="/tariffs"
                  className="roum-btn-primary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", justifyContent: "center" }}
                >
                  <span>Consulter les tarifs aériens</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Transport Maritime */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Ship size={24} color="#FFFFFF" />
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Transport Maritime (Par Bateau)
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Le choix économique par excellence pour les gros volumes, cartons encombrants, meubles, machines et conteneurs complets. Facturation au mètre cube (CBM).
                  </p>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "6px 12px", borderRadius: "8px", display: "inline-block", marginBottom: "20px" }}>
                    Délai conteneur : 35 à 45 jours
                  </div>
                </div>

                <Link
                  href="/tariffs"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", justifyContent: "center" }}
                >
                  <span>Estimer mon volume en CBM</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* SECTION 5 : LES DESTINATIONS DESSERVIES DU PROJET */}
          <div
            style={{
              backgroundColor: "#FAF9F6",
              border: "1px solid #E5E7EB",
              borderRadius: "16px",
              padding: "32px 28px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Réseau Opérationnel
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                Les destinations desservies mentionnées dans le projet
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "18px",
              }}
            >
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "6px" }}>
                  Pays de départ
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
                  Chine (Guangzhou / Yiwu)
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "6px" }}>
                  Destinations desservies
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                  Côte d&apos;Ivoire, Niger, Sénégal et Mali
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "6px" }}>
                  Pays de départ
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
                  Côte d&apos;Ivoire (Abidjan)
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "6px" }}>
                  Destinations desservies
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                  France, Maroc, Gabon, Sénégal et Mali
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "6px" }}>
                  Pays de départ
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
                  Maroc (Casablanca)
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "6px" }}>
                  Destinations desservies
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                  Côte d&apos;Ivoire
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Chargement des services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
