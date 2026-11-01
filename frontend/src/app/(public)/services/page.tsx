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
  Search,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

type ActiveMode = "browse" | "alibaba" | "forwarding";

function ServicesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeMode, setActiveMode] = useState<ActiveMode>("browse");

  useEffect(() => {
    if (tabParam === "alibaba") setActiveMode("alibaba");
    else if (tabParam === "forwarding") setActiveMode("forwarding");
    else setActiveMode("browse");
  }, [tabParam]);

  // Formulaire Alibaba
  const [aliProductUrl, setAliProductUrl] = useState("");
  const [aliQuantity, setAliQuantity] = useState("");
  const [aliSpecs, setAliSpecs] = useState("");
  const [aliDestination, setAliDestination] = useState("Côte d'Ivoire");
  const [aliName, setAliName] = useState("");
  const [aliPhone, setAliPhone] = useState("");
  const [aliSubmitting, setAliSubmitting] = useState(false);
  const [aliSuccess, setAliSuccess] = useState<{ ref: string; waUrl: string } | null>(null);
  const [aliError, setAliError] = useState("");

  // Formulaire Transit / Fournisseur
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

  const handleAlibabaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAliError("");
    if (!aliName.trim() || !aliPhone.trim()) {
      setAliError("Nom et WhatsApp obligatoires.");
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
          origin_country: "Chine",
          destination_country: aliDestination,
          shipping_mode_id: "AIR_EXPRESS",
          product_url: aliProductUrl.trim(),
          product_quantity: aliQuantity.trim() || "1",
          product_specs: aliSpecs.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur enregistrement.");
      setAliSuccess({ ref: json.quote_reference, waUrl: json.whatsapp_url });
    } catch (err: any) {
      setAliError(err.message || "Erreur de connexion.");
    } finally {
      setAliSubmitting(false);
    }
  };

  const handleForwardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFwdError("");
    if (!fwdName.trim() || !fwdPhone.trim()) {
      setFwdError("Nom et WhatsApp obligatoires.");
      return;
    }
    setFwdSubmitting(true);
    try {
      const res = await fetch("/api/v1/public/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "FORWARDING",
          client_name: fwdName.trim(),
          client_phone: fwdPhone.trim(),
          origin_country: fwdOrigin,
          destination_country: fwdDestination,
          shipping_mode_id: fwdTransportMode === "AIR" ? "AIR_EXPRESS" : "SEA_LCL",
          cargo_type: fwdDescription.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur enregistrement.");
      setFwdSuccess({
        ref: json.quote_reference,
        waUrl: json.whatsapp_url,
        shippingMark: json.warehouse_china?.shipping_mark || `ROUM / ${json.quote_reference} / ${fwdName.toUpperCase()}`,
        warehouseAddress: json.warehouse_china?.address || "Guangzhou Baiyun Logistics Center, Guangzhou, Chine",
      });
    } catch (err: any) {
      setFwdError(err.message || "Erreur de connexion.");
    } finally {
      setFwdSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "40px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* En-tête Bref & Pesant */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
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
                marginBottom: "12px",
              }}
            >
              Services Officiels
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 0 10px 0",
              }}
            >
              Tous nos Services de Transit & Groupage
            </h1>

            <p style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "600px", margin: "0 auto" }}>
              Achat sur Alibaba, transit Chine, groupage Maroc et groupage France avec dédouanement garanti.
            </p>
          </div>

          {/* Grille des 4 Grands Services Réels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "18px",
              marginBottom: "36px",
            }}
          >
            {/* 1. Alibaba */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: activeMode === "alibaba" ? "2px solid #111827" : "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <ShoppingBag size={20} color="#FFFFFF" />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                  Commander sur Alibaba
                </h2>
                <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                  Paiement de vos fournisseurs en Yuans (RMB) et livraison directe à Abidjan.
                </p>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "16px" }}>
                  Accompagnement Achat
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveMode(activeMode === "alibaba" ? "browse" : "alibaba")}
                className={activeMode === "alibaba" ? "roum-btn-primary" : "roum-btn-secondary"}
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", justifyContent: "center" }}
              >
                <span>{activeMode === "alibaba" ? "Fermer le formulaire" : "Lancer une commande"}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 2. Transit Chine */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: activeMode === "forwarding" ? "2px solid #111827" : "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <PackageCheck size={20} color="#FFFFFF" />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                  Transit & Fret Chine
                </h2>
                <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                  Réception magasins Guangzhou et Yiwu. Fret avion (4j) ou conteneur bateau (35j).
                </p>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "16px" }}>
                  Magasins Baiyun & Yiwu
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveMode(activeMode === "forwarding" ? "browse" : "forwarding")}
                className={activeMode === "forwarding" ? "roum-btn-primary" : "roum-btn-secondary"}
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", justifyContent: "center" }}
              >
                <span>{activeMode === "forwarding" ? "Fermer le formulaire" : "Adresse entrepôt Chine"}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 3. Groupage Maroc */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <Plane size={20} color="#FFFFFF" />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                  Groupage Maroc (Casablanca)
                </h2>
                <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                  Casablanca vers Abidjan, Bamako, Dakar, Ouaga et Libreville.
                </p>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "16px" }}>
                  5 jours garantis · 6 500 F/kg
                </div>
              </div>

              <Link
                href="/tariffs"
                className="roum-btn-secondary"
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", justifyContent: "center" }}
              >
                <span>Calculer le prix Maroc</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* 4. Groupage France */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <Plane size={20} color="#FFFFFF" />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                  Groupage France (Paris ↔ Abidjan)
                </h2>
                <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                  Colis personnels, cosmétiques (9 000 F/kg) et plis express (13 000 F).
                </p>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "16px" }}>
                  3 à 5 jours de vol
                </div>
              </div>

              <Link
                href="/tariffs"
                className="roum-btn-secondary"
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", justifyContent: "center" }}
              >
                <span>Calculer le prix France</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Formulaire Déroulé : Alibaba */}
          {activeMode === "alibaba" && (
            <div
              style={{
                backgroundColor: "#FAF9F6",
                border: "1px solid #D1D5DB",
                borderRadius: "14px",
                padding: "24px",
                marginBottom: "36px",
                maxWidth: "720px",
                margin: "0 auto 36px auto",
              }}
            >
              {aliSuccess ? (
                <div style={{ textAlign: "center", padding: "12px" }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ margin: "0 auto 10px auto" }} />
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", marginBottom: "6px" }}>
                    Dossier créé : {aliSuccess.ref}
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#4B5563", marginBottom: "16px" }}>
                    Notre équipe prépare votre devis sous 24h.
                  </p>
                  <a
                    href={aliSuccess.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="roum-btn-primary"
                    style={{ display: "inline-flex", padding: "10px 20px", fontSize: "0.88rem" }}
                  >
                    <MessageCircle size={15} />
                    <span>Confirmer sur WhatsApp</span>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleAlibabaSubmit} style={{ display: "grid", gap: "12px" }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                    Formulaire Commande Alibaba
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                      Lien du produit Alibaba ou description *
                    </label>
                    <input
                      type="text"
                      value={aliProductUrl}
                      onChange={(e) => setAliProductUrl(e.target.value)}
                      placeholder="Collez le lien du produit ou décrivez l'article"
                      style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Quantité
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
                        Destination
                      </label>
                      <select
                        value={aliDestination}
                        onChange={(e) => setAliDestination(e.target.value)}
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", backgroundColor: "#FFFFFF", boxSizing: "border-box" }}
                      >
                        <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                        <option value="Niger">Niger (Niamey)</option>
                        <option value="Sénégal">Sénégal (Dakar)</option>
                        <option value="Mali">Mali (Bamako)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Votre Nom *
                      </label>
                      <input
                        type="text"
                        value={aliName}
                        onChange={(e) => setAliName(e.target.value)}
                        placeholder="Nom complet"
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={aliPhone}
                        onChange={(e) => setAliPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {aliError && <div style={{ fontSize: "0.8rem", color: "#DC2626", fontWeight: 600 }}>{aliError}</div>}

                  <button
                    type="submit"
                    disabled={aliSubmitting}
                    className="roum-btn-primary"
                    style={{ height: "44px", justifyContent: "center", fontSize: "0.88rem", marginTop: "4px" }}
                  >
                    <span>{aliSubmitting ? "Envoi..." : "Envoyer ma demande de devis"}</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Formulaire Déroulé : Transit Chine */}
          {activeMode === "forwarding" && (
            <div
              style={{
                backgroundColor: "#FAF9F6",
                border: "1px solid #D1D5DB",
                borderRadius: "14px",
                padding: "24px",
                marginBottom: "36px",
                maxWidth: "720px",
                margin: "0 auto 36px auto",
              }}
            >
              {fwdSuccess ? (
                <div style={{ textAlign: "center", padding: "12px" }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ margin: "0 auto 10px auto" }} />
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                    Dossier Transit : {fwdSuccess.ref}
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB", margin: "14px 0", textAlign: "left", fontSize: "0.84rem" }}>
                    <div><strong>Code à coller sur vos cartons :</strong></div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, margin: "4px 0" }}>{fwdSuccess.shippingMark}</div>
                    <div style={{ marginTop: "8px" }}><strong>Adresse magasin Chine :</strong></div>
                    <div style={{ color: "#4B5563" }}>{fwdSuccess.warehouseAddress}</div>
                  </div>
                  <a
                    href={fwdSuccess.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="roum-btn-primary"
                    style={{ display: "inline-flex", padding: "10px 20px", fontSize: "0.88rem" }}
                  >
                    <MessageCircle size={15} />
                    <span>Transmettre sur WhatsApp</span>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleForwardingSubmit} style={{ display: "grid", gap: "12px" }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                    Obtenir l&apos;adresse de livraison magasin
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Pays de départ
                      </label>
                      <select
                        value={fwdOrigin}
                        onChange={(e) => setFwdOrigin(e.target.value)}
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", backgroundColor: "#FFFFFF", boxSizing: "border-box" }}
                      >
                        <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                        <option value="Maroc">Maroc (Casablanca)</option>
                        <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Destination
                      </label>
                      <select
                        value={fwdDestination}
                        onChange={(e) => setFwdDestination(e.target.value)}
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", backgroundColor: "#FFFFFF", boxSizing: "border-box" }}
                      >
                        <option value="Côte d'Ivoire">Côte d&apos;Ivoire</option>
                        <option value="Mali">Mali</option>
                        <option value="Sénégal">Sénégal</option>
                        <option value="Niger">Niger</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                      Marchandises à transporter *
                    </label>
                    <input
                      type="text"
                      value={fwdDescription}
                      onChange={(e) => setFwdDescription(e.target.value)}
                      placeholder="Ex : Vêtements, chaussures, cartons d'accessoires..."
                      style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        Votre Nom *
                      </label>
                      <input
                        type="text"
                        value={fwdName}
                        onChange={(e) => setFwdName(e.target.value)}
                        placeholder="Nom complet"
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={fwdPhone}
                        onChange={(e) => setFwdPhone(e.target.value)}
                        placeholder="+225 01 00 00 00 00"
                        style={{ width: "100%", height: "42px", padding: "0 12px", border: "1px solid #D1D5DB", borderRadius: "8px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {fwdError && <div style={{ fontSize: "0.8rem", color: "#DC2626", fontWeight: 600 }}>{fwdError}</div>}

                  <button
                    type="submit"
                    disabled={fwdSubmitting}
                    className="roum-btn-primary"
                    style={{ height: "44px", justifyContent: "center", fontSize: "0.88rem", marginTop: "4px" }}
                  >
                    <span>{fwdSubmitting ? "Génération..." : "Obtenir mon adresse magasin"}</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Bandeau Destinations Express */}
          <div
            style={{
              backgroundColor: "#FAF9F6",
              border: "1px solid #E5E7EB",
              borderRadius: "14px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Couloirs Actifs
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
              Chine · Dubaï · Maroc · France vers Côte d&apos;Ivoire et Afrique
            </div>
            <p style={{ fontSize: "0.86rem", color: "#4B5563", margin: "0 0 16px 0" }}>
              Tous les tarifs comprennent le dédouanement complet. Retrait à Bingerville Carrefour Safari.
            </p>
            <Link
              href="/tariffs"
              className="roum-btn-primary"
              style={{ display: "inline-flex", padding: "10px 20px", fontSize: "0.88rem" }}
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
