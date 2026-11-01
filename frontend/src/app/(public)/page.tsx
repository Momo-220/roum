"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plane,
  Ship,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  Scale,
  Clock,
  PackageCheck,
  Lock,
  Phone,
  Zap,
} from "lucide-react";
import { normalizeTrackingNumber, buildWhatsAppUrl } from "@/shared";
import { CircularFlag } from "@/components/CircularFlag";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  STRATEGIC_HUBS,
  AFRICAN_COUNTRIES,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
} from "@/data/countries";

export default function HomePage() {
  const router = useRouter();

  // État du suivi de colis
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");

  // État de copie d'adresses d'entrepôts
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // État du simulateur dynamique
  const [simOrigin, setSimOrigin] = useState("Chine");
  const [simDest, setSimDest] = useState("Côte d'Ivoire");
  const [simMode, setSimMode] = useState<"AIR" | "SEA" | "ROAD">("AIR");
  const [simCategory, setSimCategory] = useState("express");
  const [simWeight, setSimWeight] = useState(10);
  const [simCbm, setSimCbm] = useState(1.0);
  const [simCurrency, setSimCurrency] = useState("FCFA");

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");

    const normalized = normalizeTrackingNumber(trackingInput);
    if (!normalized) {
      setTrackingError("Veuillez saisir un numéro de suivi valide (Ex : RM-AIR-2610-K8P9Q2).");
      return;
    }

    router.push(`/tracking/${normalized}`);
  };

  // Calcul exact aligné sur les grilles tarifaires officielles
  const estimateCost = () => {
    const isParisCorridor =
      (simOrigin === "France" && simDest === "Côte d'Ivoire") ||
      (simOrigin === "Côte d'Ivoire" && simDest === "France");
    const isMoroccoCorridor = simOrigin === "Maroc";

    // 1. France ↔ Côte d'Ivoire
    if (isParisCorridor) {
      if (simCategory === "doc") {
        return {
          amountFcfa: 13000,
          currency: "FCFA",
          duration: "3 à 5 jours",
          unit: "13 000 FCFA / 20 €",
          details: "Pli ou document administratif express",
        };
      }
      if (simCategory === "cosmetic") {
        return {
          amountFcfa: simWeight * 9000,
          currency: "FCFA",
          duration: "3 à 5 jours",
          unit: "9 000 FCFA / kg",
          details: "Cosmétiques, liquides & soins",
        };
      }
      return {
        amountFcfa: simWeight * 8500,
        currency: "FCFA",
        duration: "3 à 5 jours",
        unit: "8 500 FCFA / kg",
        details: "Articles divers & effets personnels",
      };
    }

    // 2. Maroc ➔ Afrique Subsaharienne
    if (isMoroccoCorridor) {
      let rate = 7000;
      if (simDest === "Côte d'Ivoire") rate = 6500;
      if (simDest === "Burkina Faso" || simDest === "Gabon") rate = 7500;
      return {
        amountFcfa: simWeight * rate,
        currency: "FCFA",
        duration: "5 jours chrono",
        unit: `${rate.toLocaleString("fr-FR")} FCFA / kg`,
        details: "Groupage Aérien Express Maroc ➔ Afrique",
      };
    }

    // 3. Voie Terrestre
    if (simMode === "ROAD") {
      return {
        amountFcfa: simWeight * 5000,
        currency: "FCFA",
        duration: "7 à 12 jours",
        unit: "5 000 FCFA / kg",
        details: "Fret terrestre transfrontalier sécurisé",
      };
    }

    // 4. Voie Maritime
    if (simMode === "SEA") {
      return {
        amountFcfa: Math.round(simCbm * 300000),
        currency: "FCFA",
        duration: "35 à 45 jours",
        unit: "300 000 FCFA / m³ (CBM)",
        details: "Groupage maritime en conteneur sécurisé",
      };
    }

    // 5. Aérien Chine & Dubaï
    if (simCategory === "pc") {
      return {
        amountFcfa: 50000,
        currency: "FCFA",
        duration: "4 à 7 jours",
        unit: "50 000 FCFA / pièce",
        details: "Pièce d'ordinateur & équipement high-tech",
      };
    }
    if (simCategory === "battery") {
      return {
        amountFcfa: simWeight * 14000,
        currency: "FCFA",
        duration: "7 à 10 jours",
        unit: "14 000 FCFA / kg",
        details: "Batteries, compléments & produits spéciaux",
      };
    }
    if (simCategory === "normal") {
      return {
        amountFcfa: simWeight * 10000,
        currency: "FCFA",
        duration: "12 à 14 jours",
        unit: "10 000 FCFA / kg",
        details: "Voie normale économique",
      };
    }

    return {
      amountFcfa: simWeight * 12000,
      currency: "FCFA",
      duration: "4 à 5 jours",
      unit: "12 000 FCFA / kg",
      details: "Voie express prioritaire",
    };
  };

  const estimate = estimateCost();

  const getSimulatorWaUrl = () => {
    const text = `Bonjour ROUM TRANSIT,\nJe souhaite valider une expédition :\n- Trajet : ${simOrigin} ➔ ${simDest}\n- Mode : ${simMode === "AIR" ? "Voie Aérienne" : simMode === "SEA" ? "Voie Maritime" : "Voie Terrestre"}\n- Volume : ${simMode === "SEA" ? simCbm + " m³" : simWeight + " kg"}\n- Estimation : ~${estimate.amountFcfa.toLocaleString("fr-FR")} FCFA\n- Délai : ${estimate.duration}`;
    return buildWhatsAppUrl("+2250153638569", text);
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", color: "#18181B", minHeight: "100vh" }}>
      {/* ============================================================
          HERO SECTION — GRANDEUR NATURE, TITRE PESANT & SUIVI MOBILE
          ============================================================ */}
      <section
        style={{
          borderBottom: "1px solid rgba(28, 25, 23, 0.08)",
          background: "radial-gradient(ellipse at 50% 0%, #FFFFFF 0%, #FAF8F5 60%, #F5F1EA 100%)",
          padding: "72px 24px 88px 24px",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <ScrollReveal>
            {/* Tagline de Direction */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "9999px",
                background: "#FFFFFF",
                border: "1px solid rgba(28, 25, 23, 0.09)",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
                fontSize: "0.74rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#4B5563",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#059669",
                  boxShadow: "0 0 0 2px rgba(5, 150, 105, 0.2)",
                }}
              />
              <span>Fret International & Approvisionnement Direct</span>
            </div>

            {/* Titre Display Pesant & Autoritaire */}
            <h1
              style={{
                fontSize: "clamp(2.4rem, 5.8vw, 4.4rem)",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                color: "#18181B",
                margin: "0 0 24px 0",
                maxWidth: "1020px",
                textWrap: "balance",
              }}
            >
              La rigueur logistique mondiale au service de vos expéditions.
            </h1>

            {/* Sous-titre sobre et clair */}
            <p
              style={{
                fontSize: "clamp(1.02rem, 1.8vw, 1.25rem)",
                lineHeight: 1.6,
                color: "#4B5563",
                maxWidth: "760px",
                margin: "0 0 44px 0",
                textWrap: "pretty",
              }}
            >
              Acheminement direct et sécurisé depuis la Chine (Guangzhou & Yiwu), Dubaï, le Maroc et la France vers l&apos;Afrique subsaharienne. Pesée certifiée, traçabilité unitaire en temps réel et dédouanement intégral inclus.
            </p>

            {/* ============================================================
                BOÎTE DE SUIVI EN DIRECT — ERGONOMIE MOBILE & DESKTOP PARFAITE
                ============================================================ */}
            <div
              id="tracking"
              style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "1px solid rgba(28, 25, 23, 0.11)",
                boxShadow: "0 20px 48px -12px rgba(28, 25, 23, 0.08), 0 2px 6px rgba(28, 25, 23, 0.03)",
                padding: "28px 24px",
                maxWidth: "760px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#FAF8F5",
                      border: "1px solid rgba(28, 25, 23, 0.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#18181B",
                    }}
                  >
                    <Search size={14} strokeWidth={2.4} />
                  </span>
                  <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "#18181B" }}>
                    Localiser une expédition en direct
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 600 }}>
                  Mise à jour en temps réel
                </span>
              </div>

              <form onSubmit={handleTrackingSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ position: "relative", flex: "1 1 280px" }}>
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => {
                        setTrackingInput(e.target.value);
                        if (trackingError) setTrackingError("");
                      }}
                      placeholder="Ex : RM-AIR-2610-K8P9Q2"
                      style={{
                        width: "100%",
                        height: "52px",
                        padding: "0 18px",
                        fontSize: "16px", // Empêche l'auto-zoom d'iOS Safari sur smartphone
                        border: "1px solid rgba(28, 25, 23, 0.16)",
                        borderRadius: "14px",
                        color: "#18181B",
                        backgroundColor: "#FAF9F7",
                        outline: "none",
                        boxSizing: "border-box",
                        fontWeight: 600,
                        transition: "all 0.16s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#18181B";
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(24, 24, 27, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(28, 25, 23, 0.16)";
                        e.currentTarget.style.backgroundColor = "#FAF9F7";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-mobile-touch"
                    style={{
                      height: "52px",
                      padding: "0 28px",
                      backgroundColor: "#18181B",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "14px",
                      fontSize: "0.92rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "9px",
                      flexShrink: 0,
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
                      transition: "all 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#000000";
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.22)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#18181B";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.15)";
                    }}
                  >
                    <span>Consulter le statut</span>
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </button>
                </div>

                {trackingError && (
                  <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600, marginTop: "2px" }}>
                    {trackingError}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#6B7280" }}>
                    <span>Numéro témoin :</span>
                    <button
                      type="button"
                      onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "#18181B",
                        fontWeight: 700,
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                      }}
                    >
                      RM-AIR-2610-K8P9Q2
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "0.74rem", color: "#4B5563" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <CheckCircle2 size={13} color="#059669" />
                      Dédouanement inclus
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <CheckCircle2 size={13} color="#059669" />
                      Assurance intégrée
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 01 : LES 4 COULOIRS INTERNATIONAUX (GRILLE ARCHITECTURALE)
          ============================================================ */}
      <section
        id="corridors"
        style={{
          padding: "96px 24px",
          borderBottom: "1px solid rgba(28, 25, 23, 0.08)",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "52px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#18181B" }}>01</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280" }}>
                  LIGNES DIRECTES & CORRIDORS STRATÉGIQUES
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.9rem, 3.6vw, 2.7rem)",
                  fontWeight: 800,
                  color: "#18181B",
                  letterSpacing: "-0.03em",
                  margin: "0 0 14px 0",
                  lineHeight: 1.15,
                }}
              >
                4 plateformes d&apos;embarquement vers l&apos;Afrique
              </h2>
              <p style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "680px", margin: 0, lineHeight: 1.6 }}>
                Des rotations hebdomadaires cadencées depuis nos entrepôts de groupage pour garantir la régularité absolue de vos réapprovisionnements.
              </p>
            </div>
          </ScrollReveal>

          {/* Grille 4 colonnes grandeur nature */}
          <div className="public-grid-4">
            {/* Couloir 1 : Chine */}
            <ScrollReveal delay={50}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <CircularFlag countryCode="CN" size={26} />
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", background: "rgba(5, 150, 105, 0.08)", color: "#059669", fontSize: "0.72rem", fontWeight: 800 }}>
                      2 vols / sem.
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#18181B", margin: "0 0 6px 0", letterSpacing: "-0.015em" }}>
                    Chine ➔ Afrique
                  </h3>
                  <p style={{ fontSize: "0.84rem", color: "#6B7280", margin: "0 0 18px 0" }}>
                    Entrepôts de groupage Guangzhou & Yiwu
                  </p>

                  <div style={{ display: "grid", gap: "10px", borderTop: "1px solid rgba(28, 25, 23, 0.06)", paddingTop: "14px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Voie express prioritaire :</span>
                      <strong style={{ color: "#18181B" }}>4 à 5 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Voie normale économique :</span>
                      <strong style={{ color: "#18181B" }}>12 à 14 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Conteneur maritime (CBM) :</span>
                      <strong style={{ color: "#18181B" }}>35 - 45 jours</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ background: "#FAF9F7", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(28, 25, 23, 0.06)", marginBottom: "14px" }}>
                    <div style={{ fontSize: "0.7rem", color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Tarif officiel</div>
                    <div style={{ fontSize: "1.08rem", fontWeight: 800, color: "#18181B" }}>
                      Dès 10 000 FCFA <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6B7280" }}>/ kg</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSimOrigin("Chine");
                      const el = document.getElementById("tariffs");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      background: "transparent",
                      border: "1px solid rgba(28, 25, 23, 0.16)",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#18181B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#18181B";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#18181B";
                    }}
                  >
                    <span>Simuler ce couloir</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 2 : Dubaï */}
            <ScrollReveal delay={120}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <CircularFlag countryCode="AE" size={26} />
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", background: "rgba(217, 119, 6, 0.09)", color: "#D97706", fontSize: "0.72rem", fontWeight: 800 }}>
                      Fret & Shopping
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#18181B", margin: "0 0 6px 0", letterSpacing: "-0.015em" }}>
                    Dubaï ➔ Afrique
                  </h3>
                  <p style={{ fontSize: "0.84rem", color: "#6B7280", margin: "0 0 18px 0" }}>
                    Entrepôt Deira & Cargo Dubaï
                  </p>

                  <div style={{ display: "grid", gap: "10px", borderTop: "1px solid rgba(28, 25, 23, 0.06)", paddingTop: "14px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Voie express Émirats :</span>
                      <strong style={{ color: "#18181B" }}>4 à 5 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Parfumerie & Spéciaux :</span>
                      <strong style={{ color: "#18181B" }}>7 à 10 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Bateau Dubaï (Le CBM) :</span>
                      <strong style={{ color: "#18181B" }}>30 - 40 jours</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ background: "#FAF9F7", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(28, 25, 23, 0.06)", marginBottom: "14px" }}>
                    <div style={{ fontSize: "0.7rem", color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Tarif officiel</div>
                    <div style={{ fontSize: "1.08rem", fontWeight: 800, color: "#18181B" }}>
                      Dès 10 000 FCFA <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6B7280" }}>/ kg</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSimOrigin("Émirats Arabes Unis (Dubaï)");
                      const el = document.getElementById("tariffs");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      background: "transparent",
                      border: "1px solid rgba(28, 25, 23, 0.16)",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#18181B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#18181B";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#18181B";
                    }}
                  >
                    <span>Simuler ce couloir</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 3 : Maroc */}
            <ScrollReveal delay={190}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <CircularFlag countryCode="MA" size={26} />
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", background: "rgba(5, 150, 105, 0.08)", color: "#059669", fontSize: "0.72rem", fontWeight: 800 }}>
                      5 jours chrono
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#18181B", margin: "0 0 6px 0", letterSpacing: "-0.015em" }}>
                    Maroc ➔ 5 Pays
                  </h3>
                  <p style={{ fontSize: "0.84rem", color: "#6B7280", margin: "0 0 18px 0" }}>
                    Casablanca ➔ CI, SN, ML, BF, GA
                  </p>

                  <div style={{ display: "grid", gap: "10px", borderTop: "1px solid rgba(28, 25, 23, 0.06)", paddingTop: "14px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Côte d&apos;Ivoire (Abidjan) :</span>
                      <strong style={{ color: "#18181B" }}>6 500 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Sénégal & Mali :</span>
                      <strong style={{ color: "#18181B" }}>7 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Burkina Faso & Gabon :</span>
                      <strong style={{ color: "#18181B" }}>7 500 F / kg</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ background: "#FAF9F7", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(28, 25, 23, 0.06)", marginBottom: "14px" }}>
                    <div style={{ fontSize: "0.7rem", color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Tarif officiel</div>
                    <div style={{ fontSize: "1.08rem", fontWeight: 800, color: "#18181B" }}>
                      Dès 6 500 FCFA <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6B7280" }}>/ kg</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSimOrigin("Maroc");
                      const el = document.getElementById("tariffs");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      background: "transparent",
                      border: "1px solid rgba(28, 25, 23, 0.16)",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#18181B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#18181B";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#18181B";
                    }}
                  >
                    <span>Simuler ce couloir</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 4 : France */}
            <ScrollReveal delay={260}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <CircularFlag countryCode="FR" size={26} />
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", background: "rgba(28, 25, 23, 0.06)", color: "#18181B", fontSize: "0.72rem", fontWeight: 800 }}>
                      Paris ↔ Abidjan
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#18181B", margin: "0 0 6px 0", letterSpacing: "-0.015em" }}>
                    France ↔ Abidjan
                  </h3>
                  <p style={{ fontSize: "0.84rem", color: "#6B7280", margin: "0 0 18px 0" }}>
                    Liaison directe aérienne bi-directionnelle
                  </p>

                  <div style={{ display: "grid", gap: "10px", borderTop: "1px solid rgba(28, 25, 23, 0.06)", paddingTop: "14px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Articles divers & effets :</span>
                      <strong style={{ color: "#18181B" }}>8 500 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Cosmétiques & soins :</span>
                      <strong style={{ color: "#18181B" }}>9 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
                      <span style={{ color: "#4B5563" }}>Documents express (pli) :</span>
                      <strong style={{ color: "#18181B" }}>13 000 F forfait</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ background: "#FAF9F7", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(28, 25, 23, 0.06)", marginBottom: "14px" }}>
                    <div style={{ fontSize: "0.7rem", color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Tarif officiel</div>
                    <div style={{ fontSize: "1.08rem", fontWeight: 800, color: "#18181B" }}>
                      Dès 8 500 FCFA <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6B7280" }}>/ kg</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSimOrigin("France");
                      const el = document.getElementById("tariffs");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      background: "transparent",
                      border: "1px solid rgba(28, 25, 23, 0.16)",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#18181B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#18181B";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#18181B";
                    }}
                  >
                    <span>Simuler ce couloir</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 02 : SIMULATEUR DYNAMIQUE DE COTATION (GRAND FORMAT)
          ============================================================ */}
      <section
        id="tariffs"
        style={{
          padding: "96px 24px",
          borderBottom: "1px solid rgba(28, 25, 23, 0.08)",
          backgroundColor: "#FAF9F6",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "52px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#18181B" }}>02</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280" }}>
                  ESTIMATION INSTANTANÉE EN LIGNE
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.9rem, 3.6vw, 2.7rem)",
                  fontWeight: 800,
                  color: "#18181B",
                  letterSpacing: "-0.03em",
                  margin: "0 0 14px 0",
                  lineHeight: 1.15,
                }}
              >
                Simulateur de fret transparent sans surprise
              </h2>
              <p style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "680px", margin: 0, lineHeight: 1.6 }}>
                Sélectionnez votre couloir et votre type de marchandise. Nos cotations incluent la pesée certifiée et les frais de douane à destination.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "28px",
                alignItems: "start",
              }}
            >
              {/* Formulaire Contrôles de simulation */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(28, 25, 23, 0.09)",
                  borderRadius: "24px",
                  padding: "32px 28px",
                  boxShadow: "0 8px 30px -10px rgba(28, 25, 23, 0.05)",
                }}
              >
                {/* 1. Origine & Destination */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "22px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Pays de Départ (Origine)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#FAF9F7", border: "1px solid rgba(28, 25, 23, 0.12)", borderRadius: "12px", padding: "0 14px", height: "48px" }}>
                      <CircularFlag countryName={simOrigin} size={18} />
                      <select
                        value={simOrigin}
                        onChange={(e) => setSimOrigin(e.target.value)}
                        style={{
                          border: "none",
                          backgroundColor: "transparent",
                          width: "100%",
                          height: "100%",
                          fontSize: "15px",
                          color: "#18181B",
                          outline: "none",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                        <option value="Émirats Arabes Unis (Dubaï)">Émirats Arabes Unis (Dubaï)</option>
                        <option value="Maroc">Maroc (Casablanca)</option>
                        <option value="France">France (Paris)</option>
                        <option value="Turquie">Turquie (Istanbul)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Pays de Livraison (Arrivée)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#FAF9F7", border: "1px solid rgba(28, 25, 23, 0.12)", borderRadius: "12px", padding: "0 14px", height: "48px" }}>
                      <CircularFlag countryName={simDest} size={18} />
                      <select
                        value={simDest}
                        onChange={(e) => setSimDest(e.target.value)}
                        style={{
                          border: "none",
                          backgroundColor: "transparent",
                          width: "100%",
                          height: "100%",
                          fontSize: "15px",
                          color: "#18181B",
                          outline: "none",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {AFRICAN_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.name} ({c.hubCity || c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Mode de transport */}
                <div style={{ marginBottom: "22px" }}>
                  <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Mode d&apos;acheminement
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { id: "AIR", label: "Aérien Express (4 - 5j)", icon: Plane },
                      { id: "SEA", label: "Maritime Groupage (CBM)", icon: Ship },
                      { id: "ROAD", label: "Terrestre Transfrontalier", icon: Truck },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = simMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSimMode(mode.id as any)}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            border: isSelected ? "1px solid #18181B" : "1px solid rgba(28, 25, 23, 0.12)",
                            backgroundColor: isSelected ? "#18181B" : "#FFFFFF",
                            color: isSelected ? "#FFFFFF" : "#374151",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Icon size={14} strokeWidth={2.2} />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Poids & Catégorie */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  {simMode === "SEA" ? (
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "6px" }}>
                        Volume en mètre cube (m³ / CBM)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={simCbm}
                        onChange={(e) => setSimCbm(Math.max(0.1, Number(e.target.value)))}
                        style={{
                          width: "100%",
                          height: "48px",
                          padding: "0 14px",
                          fontSize: "16px",
                          border: "1px solid rgba(28, 25, 23, 0.12)",
                          borderRadius: "12px",
                          backgroundColor: "#FAF9F7",
                          color: "#18181B",
                          boxSizing: "border-box",
                          fontWeight: 700,
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "6px" }}>
                          Poids estimé (en kg)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={simWeight}
                          onChange={(e) => setSimWeight(Math.max(1, Number(e.target.value)))}
                          style={{
                            width: "100%",
                            height: "48px",
                            padding: "0 14px",
                            fontSize: "16px",
                            border: "1px solid rgba(28, 25, 23, 0.12)",
                            borderRadius: "12px",
                            backgroundColor: "#FAF9F7",
                            color: "#18181B",
                            boxSizing: "border-box",
                            fontWeight: 700,
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "6px" }}>
                          Type de Marchandise
                        </label>
                        <select
                          value={simCategory}
                          onChange={(e) => setSimCategory(e.target.value)}
                          style={{
                            width: "100%",
                            height: "48px",
                            padding: "0 14px",
                            fontSize: "15px",
                            border: "1px solid rgba(28, 25, 23, 0.12)",
                            borderRadius: "12px",
                            backgroundColor: "#FAF9F7",
                            color: "#18181B",
                            outline: "none",
                            boxSizing: "border-box",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <option value="express">Marchandises Générales (Express 4-5j)</option>
                          <option value="normal">Marchandises Générales (Normale 2 sem)</option>
                          <option value="battery">Batteries & Compléments alimentaires</option>
                          <option value="pc">Pièces d&apos;ordinateur & Matériel High-Tech</option>
                          <option value="cosmetic">Cosmétiques & Produits de beauté</option>
                          <option value="doc">Pli & Document Administratif</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Panneau de Résultat Exécutif (Grand Format) */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(28, 25, 23, 0.1)",
                  borderRadius: "24px",
                  padding: "34px 30px",
                  boxShadow: "0 16px 40px -12px rgba(28, 25, 23, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "24px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7280" }}>
                      ESTIMATION OFFICIELLE TOUT COMPRIS
                    </span>
                    <span style={{ padding: "4px 9px", borderRadius: "9999px", background: "rgba(5, 150, 105, 0.08)", color: "#059669", fontSize: "0.72rem", fontWeight: 800 }}>
                      Dédouanement Inclus
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(2.2rem, 4vw, 3rem)",
                      fontWeight: 800,
                      color: "#18181B",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                      margin: "0 0 10px 0",
                    }}
                    className="tabular-nums"
                  >
                    {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                  </div>

                  <p style={{ fontSize: "0.92rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                    {estimate.details} · <strong>Délai garanti : {estimate.duration}</strong>
                  </p>

                  <div style={{ display: "grid", gap: "8px", borderTop: "1px solid rgba(28, 25, 23, 0.06)", paddingTop: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#374151" }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>Trajet : <strong>{simOrigin} ➔ {simDest}</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#374151" }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>Volume calculé : <strong>{simMode === "SEA" ? `${simCbm} m³` : `${simWeight} kg`}</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#374151" }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>Retrait physique en agence à Abidjan ou livraison domicile</span>
                    </div>
                  </div>
                </div>

                <a
                  href={getSimulatorWaUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mobile-touch"
                  style={{
                    width: "100%",
                    height: "52px",
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    borderRadius: "14px",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.16s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#000000";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#18181B";
                    e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.15)";
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Valider cette expédition sur WhatsApp</span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 03 : ENTREPÔTS MONDIAUX & ADRESSES DE RÉCEPTION
          ============================================================ */}
      <section
        id="warehouses"
        style={{
          padding: "96px 24px",
          borderBottom: "1px solid rgba(28, 25, 23, 0.08)",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "52px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#18181B" }}>03</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280" }}>
                  RÉSEAU D&apos;ENTREPÔTS INTERNATIONAUX
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.9rem, 3.6vw, 2.7rem)",
                  fontWeight: 800,
                  color: "#18181B",
                  letterSpacing: "-0.03em",
                  margin: "0 0 14px 0",
                  lineHeight: 1.15,
                }}
              >
                Adresses exactes pour vos fournisseurs
              </h2>
              <p style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "680px", margin: 0, lineHeight: 1.6 }}>
                Copiez en 1 clic l&apos;adresse de groupage pour la coller à vos expéditeurs (1688, Taobao, usines ou transitaires). N&apos;oubliez jamais d&apos;ajouter votre code client (Shipping Mark) sur vos cartons.
              </p>
            </div>
          </ScrollReveal>

          <div className="public-grid-4">
            {/* Hub 1 : Chine */}
            <ScrollReveal delay={60}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <CircularFlag countryCode="CN" size={22} />
                    <strong style={{ fontSize: "1.05rem", color: "#18181B" }}>Guangzhou (Chine)</strong>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                    Baiyun District, Guangzhou City, Guangdong Province. Réception colis fournisseurs & inspection pesée.
                  </p>
                  <div style={{ background: "#FAF9F7", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(28, 25, 23, 0.08)", fontSize: "0.76rem", color: "#374151", marginBottom: "16px" }}>
                    <strong>Mention obligatoire :</strong><br />
                    ROUM TRANSIT / [Votre Nom & Téléphone]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("cn", "Guangzhou Warehouse, Baiyun District, Guangzhou City, Guangdong Province, China — ROUM TRANSIT")}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(28, 25, 23, 0.16)",
                    background: copiedKey === "cn" ? "rgba(5, 150, 105, 0.09)" : "#FFFFFF",
                    color: copiedKey === "cn" ? "#059669" : "#18181B",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedKey === "cn" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === "cn" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Hub 2 : Dubaï */}
            <ScrollReveal delay={130}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <CircularFlag countryCode="AE" size={22} />
                    <strong style={{ fontSize: "1.05rem", color: "#18181B" }}>Dubaï (Émirats)</strong>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                    Deira Wholesale District, Dubaï Cargo Hub. Parfumerie, cosmétiques de luxe et équipements informatiques.
                  </p>
                  <div style={{ background: "#FAF9F7", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(28, 25, 23, 0.08)", fontSize: "0.76rem", color: "#374151", marginBottom: "16px" }}>
                    <strong>Mention obligatoire :</strong><br />
                    ROUM TRANSIT DUBAI / [Votre Nom & Contact]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("ae", "Deira Cargo Hub, Dubai, UAE — ROUM TRANSIT DUBAI")}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(28, 25, 23, 0.16)",
                    background: copiedKey === "ae" ? "rgba(5, 150, 105, 0.09)" : "#FFFFFF",
                    color: copiedKey === "ae" ? "#059669" : "#18181B",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedKey === "ae" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === "ae" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Hub 3 : Maroc */}
            <ScrollReveal delay={200}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <CircularFlag countryCode="MA" size={22} />
                    <strong style={{ fontSize: "1.05rem", color: "#18181B" }}>Casablanca (Maroc)</strong>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                    Zone Industrielle Ain Sebaa, Casablanca. Groupage subsaharien express départ hebdomadaire garanti.
                  </p>
                  <div style={{ background: "#FAF9F7", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(28, 25, 23, 0.08)", fontSize: "0.76rem", color: "#374151", marginBottom: "16px" }}>
                    <strong>Mention obligatoire :</strong><br />
                    ROUM TRANSIT CASABLANCA / [Votre Nom]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("ma", "Zone Industrielle Ain Sebaa, Casablanca, Maroc — ROUM TRANSIT")}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(28, 25, 23, 0.16)",
                    background: copiedKey === "ma" ? "rgba(5, 150, 105, 0.09)" : "#FFFFFF",
                    color: copiedKey === "ma" ? "#059669" : "#18181B",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedKey === "ma" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === "ma" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Hub 4 : France */}
            <ScrollReveal delay={270}>
              <div className="public-card" style={{ padding: "26px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <CircularFlag countryCode="FR" size={22} />
                    <strong style={{ fontSize: "1.05rem", color: "#18181B" }}>Paris (France)</strong>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                    Plateforme logistique Île-de-France. Réception colis France métropolitaine & expédition express vers Abidjan.
                  </p>
                  <div style={{ background: "#FAF9F7", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(28, 25, 23, 0.08)", fontSize: "0.76rem", color: "#374151", marginBottom: "16px" }}>
                    <strong>Mention obligatoire :</strong><br />
                    ROUM TRANSIT PARIS / [Votre Nom & Tel]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("fr", "Plateforme Logistique Paris Île-de-France — ROUM TRANSIT PARIS")}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(28, 25, 23, 0.16)",
                    background: copiedKey === "fr" ? "rgba(5, 150, 105, 0.09)" : "#FFFFFF",
                    color: copiedKey === "fr" ? "#059669" : "#18181B",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedKey === "fr" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === "fr" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 04 : LA DÉMARCHE DE DIRECTION (STYLE ÉDITORIAL SWISS)
          ============================================================ */}
      <section
        id="exigence"
        style={{
          padding: "96px 24px",
          borderBottom: "1px solid rgba(28, 25, 23, 0.08)",
          backgroundColor: "#FAF9F6",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "52px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#18181B" }}>04</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280" }}>
                  CHARTE D&apos;EXIGENCE & SÉCURITÉ
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.9rem, 3.6vw, 2.7rem)",
                  fontWeight: 800,
                  color: "#18181B",
                  letterSpacing: "-0.03em",
                  margin: "0 0 14px 0",
                  lineHeight: 1.15,
                }}
              >
                La Rigueur Opérationnelle Roum Transit
              </h2>
              <p style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "680px", margin: 0, lineHeight: 1.6 }}>
                Fondée sur une transparence sans compromis, notre démarche logistique élimine toute incertitude de vos importations.
              </p>
            </div>
          </ScrollReveal>

          <div className="public-grid-4">
            <ScrollReveal delay={50}>
              <div style={{ borderTop: "2px solid #18181B", paddingTop: "20px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#9CA3AF", marginBottom: "8px" }} className="tabular-nums">01</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#18181B", margin: "0 0 10px 0" }}>
                  Pesée Certifiée & Contrôle
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0 }}>
                  Chaque colis entrant en magasin fait l&apos;objet d&apos;une pesée officielle et d&apos;un constat photographique de son conditionnement. Zéro surfacturation, facturation stricte au poids réel.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div style={{ borderTop: "2px solid #18181B", paddingTop: "20px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#9CA3AF", marginBottom: "8px" }} className="tabular-nums">02</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#18181B", margin: "0 0 10px 0" }}>
                  Traçabilité Unitaire
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0 }}>
                  Dès la réception au magasin de départ, une référence de bordereau unique vous est délivrée. Votre expédition est suivie à chaque jalon clé (magasin, vol/navire, douane, agence).
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={190}>
              <div style={{ borderTop: "2px solid #18181B", paddingTop: "20px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#9CA3AF", marginBottom: "8px" }} className="tabular-nums">03</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#18181B", margin: "0 0 10px 0" }}>
                  Dédouanement Garanti
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0 }}>
                  Toutes nos cotations intègrent l&apos;intégralité des formalités portuaires et aéroportuaires. Aucun frais surprise à l&apos;arrivée : vous retirez votre marchandise en toute sérénité.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={260}>
              <div style={{ borderTop: "2px solid #18181B", paddingTop: "20px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#9CA3AF", marginBottom: "8px" }} className="tabular-nums">04</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#18181B", margin: "0 0 10px 0" }}>
                  Permanence & Agence 7j/7
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0 }}>
                  Une équipe opérationnelle dédiée disponible en continu sur WhatsApp et physiquement à l&apos;agence d&apos;Abidjan Bingerville pour retirer vos colis en mains propres.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 05 : CALL TO ACTION DIRECT WHATSAPP (NOIR OBSIDIENNE)
          ============================================================ */}
      <section
        style={{
          padding: "80px 24px",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <ScrollReveal>
            <div
              style={{
                backgroundColor: "#18181B",
                borderRadius: "28px",
                padding: "64px 40px",
                color: "#FFFFFF",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "36px",
                boxShadow: "0 24px 60px -15px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div style={{ maxWidth: "680px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.1)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#A1A1AA",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                  Permanence Opérationnelle Active
                </div>

                <h2
                  style={{
                    fontSize: "clamp(2rem, 3.8vw, 3rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    margin: "0 0 14px 0",
                    lineHeight: 1.1,
                  }}
                >
                  Une expédition urgente ou un conteneur à planifier ?
                </h2>

                <p style={{ color: "#D4D4D8", fontSize: "1.05rem", lineHeight: 1.6, margin: 0 }}>
                  Contactez directement nos responsables de fret à Abidjan, Guangzhou et Dubaï pour une cotation personnalisée immédiate.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0 }}>
                <a
                  href="https://wa.me/2250153638569"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mobile-touch"
                  style={{
                    height: "54px",
                    padding: "0 32px",
                    backgroundColor: "#FFFFFF",
                    color: "#18181B",
                    borderRadius: "9999px",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.16s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 22px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
                  }}
                >
                  <MessageCircle size={18} color="#18181B" />
                  <span>Démarrer sur WhatsApp</span>
                  <ArrowRight size={16} strokeWidth={2.4} />
                </a>

                <div style={{ textAlign: "center", fontSize: "0.78rem", color: "#A1A1AA" }}>
                  Ligne directe : +225 01 53 638 569 (7j/7)
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
