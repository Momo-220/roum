"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plane,
  Ship,
  Truck,
  ArrowRight,
  Copy,
  Check,
  MessageCircle,
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

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
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
          duration: "3 à 5 jours",
          details: "Pli ou document administratif express",
        };
      }
      if (simCategory === "cosmetic") {
        return {
          amountFcfa: simWeight * 9000,
          duration: "3 à 5 jours",
          details: "Cosmétiques, liquides & soins",
        };
      }
      return {
        amountFcfa: simWeight * 8500,
        duration: "3 à 5 jours",
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
        duration: "5 jours chrono",
        details: "Groupage Aérien Express Maroc ➔ Afrique",
      };
    }

    // 3. Voie Terrestre
    if (simMode === "ROAD") {
      return {
        amountFcfa: simWeight * 5000,
        duration: "7 à 12 jours",
        details: "Fret terrestre transfrontalier sécurisé",
      };
    }

    // 4. Voie Maritime
    if (simMode === "SEA") {
      return {
        amountFcfa: Math.round(simCbm * 300000),
        duration: "35 à 45 jours",
        details: "Groupage maritime en conteneur sécurisé",
      };
    }

    // 5. Aérien Chine & Dubaï
    if (simCategory === "pc") {
      return {
        amountFcfa: 50000,
        duration: "4 à 7 jours",
        details: "Pièce d'ordinateur & équipement high-tech",
      };
    }
    if (simCategory === "battery") {
      return {
        amountFcfa: simWeight * 14000,
        duration: "7 à 10 jours",
        details: "Batteries, compléments & produits spéciaux",
      };
    }
    if (simCategory === "normal") {
      return {
        amountFcfa: simWeight * 10000,
        duration: "12 à 14 jours",
        details: "Voie normale économique",
      };
    }

    return {
      amountFcfa: simWeight * 12000,
      duration: "4 à 5 jours",
      details: "Voie express prioritaire",
    };
  };

  const estimate = estimateCost();

  const getSimulatorWaUrl = () => {
    const text = `Bonjour ROUM TRANSIT,\nJe souhaite valider une expédition :\n- Trajet : ${simOrigin} ➔ ${simDest}\n- Mode : ${simMode === "AIR" ? "Voie Aérienne" : simMode === "SEA" ? "Voie Maritime" : "Voie Terrestre"}\n- Volume : ${simMode === "SEA" ? simCbm + " m³" : simWeight + " kg"}\n- Estimation : ~${estimate.amountFcfa.toLocaleString("fr-FR")} FCFA\n- Délai : ${estimate.duration}`;
    return buildWhatsAppUrl("+2250153638569", text);
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", color: "#111827", minHeight: "100vh" }}>
      {/* ============================================================
          HERO : DESIGN ÉPURÉ, GRANDEUR NATURE, SANS CLIGNOTANTS
          ============================================================ */}
      <section
        style={{
          borderBottom: "1px solid #E5E7EB",
          padding: "64px 20px 72px 20px",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "14px", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280" }}>
              ROUM TRANSIT INTERNATIONAL
            </div>

            <h1
              style={{
                fontSize: "clamp(2.4rem, 5.2vw, 4.2rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 0 20px 0",
                maxWidth: "960px",
                textWrap: "balance",
              }}
            >
              Fret maritime & aérien direct vers l&apos;Afrique.
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 1.6vw, 1.18rem)",
                lineHeight: 1.6,
                color: "#4B5563",
                maxWidth: "720px",
                margin: "0 0 36px 0",
              }}
            >
              Acheminement régulier depuis la Chine, Dubaï, le Maroc et la France. Pesée certifiée en magasin, traçabilité continue et dédouanement tout compris.
            </p>

            {/* FORMULAIRE DE SUIVI DE COLIS DIRECT & SIMPLE */}
            <div
              id="tracking"
              style={{
                maxWidth: "680px",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "20px",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>
                Suivre une expédition
              </div>

              <form onSubmit={handleTrackingSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ position: "relative", flex: "1 1 260px" }}>
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => {
                        setTrackingInput(e.target.value);
                        if (trackingError) setTrackingError("");
                      }}
                      placeholder="N° de bordereau (Ex : RM-AIR-2610-K8P9Q2)"
                      style={{
                        width: "100%",
                        height: "48px",
                        padding: "0 14px",
                        fontSize: "16px", // 16px empêche le zoom sur iPhone
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        color: "#111827",
                        backgroundColor: "#FFFFFF",
                        outline: "none",
                        boxSizing: "border-box",
                        fontWeight: 500,
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      height: "48px",
                      padding: "0 24px",
                      backgroundColor: "#111827",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      flexShrink: 0,
                    }}
                  >
                    <Search size={15} />
                    <span>Rechercher</span>
                  </button>
                </div>

                {trackingError && (
                  <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600, marginTop: "2px" }}>
                    {trackingError}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#6B7280", marginTop: "4px" }}>
                  <span>Dossier témoin :</span>
                  <button
                    type="button"
                    onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#111827",
                      fontWeight: 700,
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                    }}
                  >
                    RM-AIR-2610-K8P9Q2
                  </button>
                </div>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 01 : GRILLE DES COULOIRS & DÉLAIS
          ============================================================ */}
      <section
        id="corridors"
        style={{
          padding: "80px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827" }}>01</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280" }}>
                  COULOIRS & DÉLAIS
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.025em",
                  margin: "0 0 10px 0",
                }}
              >
                Liaisons régulières vers l&apos;Afrique
              </h2>
              <p style={{ fontSize: "0.98rem", color: "#4B5563", maxWidth: "640px", margin: 0, lineHeight: 1.5 }}>
                Départs hebdomadaires planifiés depuis nos entrepôts de consolidation.
              </p>
            </div>
          </ScrollReveal>

          {/* Grille des 4 couloirs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Couloir 1 : Chine */}
            <ScrollReveal delay={40}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <CircularFlag countryCode="CN" size={20} />
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Chine ➔ Afrique
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Guangzhou & Yiwu (2 départs / semaine)
                  </div>

                  <div style={{ display: "grid", gap: "8px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Voie express :</span>
                      <strong style={{ color: "#111827" }}>4 - 5 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Voie normale :</span>
                      <strong style={{ color: "#111827" }}>12 - 14 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Par Bateau (CBM) :</span>
                      <strong style={{ color: "#111827" }}>35 - 45 jours</strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 600 }}>Tarif de base</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                    Dès 10 000 FCFA / kg
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 2 : Dubaï */}
            <ScrollReveal delay={90}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <CircularFlag countryCode="AE" size={20} />
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Dubaï ➔ Afrique
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Cargo Dubaï & Deira
                  </div>

                  <div style={{ display: "grid", gap: "8px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Voie express :</span>
                      <strong style={{ color: "#111827" }}>4 - 5 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Marchandises spéciales :</span>
                      <strong style={{ color: "#111827" }}>7 - 10 jours</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Bateau Dubaï :</span>
                      <strong style={{ color: "#111827" }}>30 - 40 jours</strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 600 }}>Tarif de base</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                    Dès 10 000 FCFA / kg
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 3 : Maroc */}
            <ScrollReveal delay={140}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <CircularFlag countryCode="MA" size={20} />
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Maroc ➔ 5 Pays
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Casablanca (5 jours chrono)
                  </div>

                  <div style={{ display: "grid", gap: "8px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Côte d&apos;Ivoire :</span>
                      <strong style={{ color: "#111827" }}>6 500 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Sénégal & Mali :</span>
                      <strong style={{ color: "#111827" }}>7 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Burkina & Gabon :</span>
                      <strong style={{ color: "#111827" }}>7 500 F / kg</strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 600 }}>Tarif de base</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                    Dès 6 500 FCFA / kg
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 4 : France */}
            <ScrollReveal delay={190}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <CircularFlag countryCode="FR" size={20} />
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      France ↔ Abidjan
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Ligne aérienne directe Paris
                  </div>

                  <div style={{ display: "grid", gap: "8px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Articles divers :</span>
                      <strong style={{ color: "#111827" }}>8 500 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Cosmétiques :</span>
                      <strong style={{ color: "#111827" }}>9 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Plis / Documents :</span>
                      <strong style={{ color: "#111827" }}>13 000 F forfait</strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 600 }}>Tarif de base</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                    Dès 8 500 FCFA / kg
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 02 : SIMULATEUR TARIFAIRE SIMPLE & DIRECT
          ============================================================ */}
      <section
        id="tariffs"
        style={{
          padding: "80px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FAFAFA",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827" }}>02</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280" }}>
                  SIMULATEUR DE COTATION
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.025em",
                  margin: "0 0 10px 0",
                }}
              >
                Calculer une expédition
              </h2>
              <p style={{ fontSize: "0.98rem", color: "#4B5563", maxWidth: "640px", margin: 0, lineHeight: 1.5 }}>
                Estimation directe selon les grilles en vigueur. Frais de douane inclus.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                alignItems: "start",
              }}
            >
              {/* Formulaire de saisie */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "18px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase" }}>
                      Départ (Origine)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "0 10px", height: "44px" }}>
                      <CircularFlag countryName={simOrigin} size={16} />
                      <select
                        value={simOrigin}
                        onChange={(e) => setSimOrigin(e.target.value)}
                        style={{
                          border: "none",
                          backgroundColor: "transparent",
                          width: "100%",
                          height: "100%",
                          fontSize: "14px",
                          color: "#111827",
                          outline: "none",
                          fontWeight: 600,
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
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase" }}>
                      Arrivée (Destination)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "0 10px", height: "44px" }}>
                      <CircularFlag countryName={simDest} size={16} />
                      <select
                        value={simDest}
                        onChange={(e) => setSimDest(e.target.value)}
                        style={{
                          border: "none",
                          backgroundColor: "transparent",
                          width: "100%",
                          height: "100%",
                          fontSize: "14px",
                          color: "#111827",
                          outline: "none",
                          fontWeight: 600,
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

                {/* Mode de transport */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase" }}>
                    Mode de transport
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { id: "AIR", label: "Aérien Express (4 - 5j)", icon: Plane },
                      { id: "SEA", label: "Maritime (CBM)", icon: Ship },
                      { id: "ROAD", label: "Terrestre", icon: Truck },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = simMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSimMode(mode.id as any)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            border: isSelected ? "1px solid #111827" : "1px solid #D1D5DB",
                            backgroundColor: isSelected ? "#111827" : "#FFFFFF",
                            color: isSelected ? "#FFFFFF" : "#374151",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Icon size={13} />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Poids / Catégorie */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                  {simMode === "SEA" ? (
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                        Volume en m³ (CBM)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={simCbm}
                        onChange={(e) => setSimCbm(Math.max(0.1, Number(e.target.value)))}
                        style={{
                          width: "100%",
                          height: "44px",
                          padding: "0 12px",
                          fontSize: "15px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "8px",
                          backgroundColor: "#FFFFFF",
                          color: "#111827",
                          boxSizing: "border-box",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                          Poids (kg)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={simWeight}
                          onChange={(e) => setSimWeight(Math.max(1, Number(e.target.value)))}
                          style={{
                            width: "100%",
                            height: "44px",
                            padding: "0 12px",
                            fontSize: "15px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            color: "#111827",
                            boxSizing: "border-box",
                            fontWeight: 600,
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                          Catégorie
                        </label>
                        <select
                          value={simCategory}
                          onChange={(e) => setSimCategory(e.target.value)}
                          style={{
                            width: "100%",
                            height: "44px",
                            padding: "0 12px",
                            fontSize: "14px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            color: "#111827",
                            outline: "none",
                            boxSizing: "border-box",
                            fontWeight: 600,
                          }}
                        >
                          <option value="express">Marchandises Générales (Express 4-5j)</option>
                          <option value="normal">Marchandises Générales (Normale 2 sem)</option>
                          <option value="battery">Batteries & Compléments</option>
                          <option value="pc">Pièces d&apos;ordinateur & High-Tech</option>
                          <option value="cosmetic">Cosmétiques & Beauté</option>
                          <option value="doc">Pli & Document Administratif</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Résultat Devis */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "26px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "20px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: "8px" }}>
                    Montant estimé (tout compris)
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(2rem, 3.6vw, 2.6rem)",
                      fontWeight: 800,
                      color: "#111827",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                      margin: "0 0 10px 0",
                    }}
                    className="tabular-nums"
                  >
                    {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                  </div>

                  <div style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.5 }}>
                    {estimate.details} · <strong>Délai : {estimate.duration}</strong>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "12px", borderTop: "1px solid #F3F4F6", paddingTop: "10px" }}>
                    Dédouanement complet inclus. Retrait en agence à Abidjan Bingerville.
                  </div>
                </div>

                <a
                  href={getSimulatorWaUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    height: "48px",
                    backgroundColor: "#111827",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <MessageCircle size={16} />
                  <span>Valider sur WhatsApp</span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 03 : ENTREPÔTS & ADRESSES DE RÉCEPTION
          ============================================================ */}
      <section
        id="warehouses"
        style={{
          padding: "80px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827" }}>03</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280" }}>
                  ENTREPÔTS & GROUPAGE
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.025em",
                  margin: "0 0 10px 0",
                }}
              >
                Adresses de réception pour vos fournisseurs
              </h2>
              <p style={{ fontSize: "0.98rem", color: "#4B5563", maxWidth: "640px", margin: 0, lineHeight: 1.5 }}>
                Transmettez ces adresses à vos expéditeurs avec votre nom et numéro de téléphone en Shipping Mark.
              </p>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Chine */}
            <ScrollReveal delay={40}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "22px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="CN" size={18} />
                    <strong style={{ fontSize: "0.96rem", color: "#111827" }}>Guangzhou (Chine)</strong>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    Baiyun District, Guangzhou City, Guangdong Province, China. Réception & consolidation 1688 / Taobao.
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", background: "#F9FAFB", padding: "8px 10px", borderRadius: "8px", marginBottom: "16px" }}>
                    Marquage colis : <strong>ROUM TRANSIT / [Votre Nom]</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("cn", "Guangzhou Warehouse, Baiyun District, Guangzhou City, Guangdong Province, China — ROUM TRANSIT")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    backgroundColor: copiedKey === "cn" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "cn" ? "#15803D" : "#111827",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {copiedKey === "cn" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "cn" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Dubaï */}
            <ScrollReveal delay={90}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "22px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="AE" size={18} />
                    <strong style={{ fontSize: "0.96rem", color: "#111827" }}>Dubaï (Émirats)</strong>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    Deira Wholesale District, Dubaï Cargo Hub. Parfumerie, cosmétiques et électronique.
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", background: "#F9FAFB", padding: "8px 10px", borderRadius: "8px", marginBottom: "16px" }}>
                    Marquage colis : <strong>ROUM TRANSIT DUBAI / [Votre Nom]</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("ae", "Deira Cargo Hub, Dubai, UAE — ROUM TRANSIT DUBAI")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    backgroundColor: copiedKey === "ae" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "ae" ? "#15803D" : "#111827",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {copiedKey === "ae" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "ae" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Maroc */}
            <ScrollReveal delay={140}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "22px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="MA" size={18} />
                    <strong style={{ fontSize: "0.96rem", color: "#111827" }}>Casablanca (Maroc)</strong>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    Zone Industrielle Ain Sebaa, Casablanca. Groupage subsaharien express départ garanti.
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", background: "#F9FAFB", padding: "8px 10px", borderRadius: "8px", marginBottom: "16px" }}>
                    Marquage colis : <strong>ROUM TRANSIT MAROC / [Votre Nom]</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("ma", "Zone Industrielle Ain Sebaa, Casablanca, Maroc — ROUM TRANSIT")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    backgroundColor: copiedKey === "ma" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "ma" ? "#15803D" : "#111827",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {copiedKey === "ma" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "ma" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* France */}
            <ScrollReveal delay={190}>
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "22px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="FR" size={18} />
                    <strong style={{ fontSize: "0.96rem", color: "#111827" }}>Paris (France)</strong>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    Plateforme logistique Île-de-France. Expédition aérienne directe vers Abidjan.
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", background: "#F9FAFB", padding: "8px 10px", borderRadius: "8px", marginBottom: "16px" }}>
                    Marquage colis : <strong>ROUM TRANSIT PARIS / [Votre Nom]</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("fr", "Plateforme Logistique Paris Île-de-France — ROUM TRANSIT PARIS")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    backgroundColor: copiedKey === "fr" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "fr" ? "#15803D" : "#111827",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {copiedKey === "fr" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "fr" ? "Adresse copiée !" : "Copier l'adresse"}</span>
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 04 : LA DÉMARCHE (STYLE DE LA RÉFÉRENCE UTILISATEUR)
          ============================================================ */}
      <section
        id="exigence"
        style={{
          padding: "80px 20px 96px 20px",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "48px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280", marginBottom: "8px" }}>
                DOCUMENTATION
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.025em",
                  margin: 0,
                }}
              >
                La Démarche Opérationnelle
              </h2>
            </div>
          </ScrollReveal>

          {/* Grille 4 colonnes épurée comme la référence du fondateur */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "36px 28px",
            }}
          >
            <ScrollReveal delay={40}>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "6px" }} className="tabular-nums">01</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Pesée Certifiée & Rigueur
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                  Chaque colis entrant en magasin fait l&apos;objet d&apos;une pesée officielle et d&apos;une vérification physique de son conditionnement. Zéro surfacturation, facturation stricte au poids réel.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={90}>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "6px" }} className="tabular-nums">02</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Traçabilité Unitaire
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                  Dès la prise en charge, une référence de bordereau standardisée vous est remise. Votre dossier est tracé à chaque étape clé (réception magasin, vol/mer, douane, mise à disposition en agence).
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "6px" }} className="tabular-nums">03</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Transparence des Délais
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                  Nos plannings d&apos;embarquement sont réguliers et tenus : 4 à 5 jours en aérien express, 5 jours chrono depuis le Maroc, et 35 à 45 jours par conteneur maritime groupé.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={190}>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "6px" }} className="tabular-nums">04</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Disponibilité & Permanence
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                  Une équipe opérationnelle dédiée à votre écoute directe par WhatsApp et à l&apos;agence d&apos;Abidjan Bingerville pour retirer vos colis en toute sérénité.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
