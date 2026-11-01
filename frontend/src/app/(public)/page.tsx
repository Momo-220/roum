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
          HERO : ARCHITECTURE ÉPURÉE & CADRAN DE SUIVI EN SUPERPOSITION
          ============================================================ */}
      <section
        style={{
          borderBottom: "1px solid #E5E7EB",
          padding: "72px 20px 84px 20px",
          backgroundColor: "#FFFFFF",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div className="roum-numero-ligne">
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#111827", letterSpacing: "0.14em" }}>
                ROUM TRANSIT INTERNATIONAL
              </span>
              <span style={{ fontSize: "0.72rem", color: "#6B7280", letterSpacing: "0.12em", marginLeft: "10px" }}>
                OPÉRATIONS CARGO MONDIALES
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.4rem, 5.2vw, 4.2rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 0 22px 0",
                maxWidth: "960px",
                textWrap: "balance",
              }}
            >
              Fret maritime & aérien direct vers l&apos;Afrique.
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 1.6vw, 1.18rem)",
                lineHeight: 1.65,
                color: "#4B5563",
                maxWidth: "740px",
                margin: "0 0 44px 0",
                textWrap: "pretty",
              }}
            >
              Acheminement régulier depuis la Chine, Dubaï, le Maroc et la France. Pesée certifiée en magasin, traçabilité unitaire continue et dédouanement tout compris.
            </p>

            {/* CADRAN DE SUIVI EN SUPERPOSITION ARCHITECTURALE */}
            <div
              id="tracking"
              className="roum-cadran"
              style={{
                maxWidth: "720px",
                padding: "30px 24px 22px 24px",
                marginTop: "16px",
              }}
            >
              {/* Badge superposé sur la bordure supérieure */}
              <div className="roum-badge-superpose">
                REGISTRE UNIFIÉ · CONTRÔLE DOUANIER & CARGO
              </div>

              {/* Badge supérieur droit */}
              <div className="roum-badge-superpose-right">
                BORDEREAU OFFICIEL
              </div>

              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "14px" }}>
                Suivre une expédition en temps réel
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
                      placeholder="N° de bordereau (Ex : RM-AIR-2610-K8P9Q2)"
                      style={{
                        width: "100%",
                        height: "48px",
                        padding: "0 16px",
                        fontSize: "16px", // 16px empêche le zoom sur iPhone
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        color: "#111827",
                        backgroundColor: "#FFFFFF",
                        outline: "none",
                        boxSizing: "border-box",
                        fontWeight: 600,
                        transition: "border-color 0.15s ease",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="roum-btn-primary"
                    style={{
                      height: "48px",
                      padding: "0 26px",
                      fontSize: "0.92rem",
                      flexShrink: 0,
                    }}
                  >
                    <Search size={16} />
                    <span>Rechercher</span>
                  </button>
                </div>

                {trackingError && (
                  <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 700, marginTop: "2px" }}>
                    {trackingError}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#6B7280", marginTop: "4px" }}>
                  <span>Dossier témoin :</span>
                  <button
                    type="button"
                    onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#111827",
                      fontWeight: 800,
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    RM-AIR-2610-K8P9Q2
                  </button>
                  <span style={{ color: "#9CA3AF" }}>· Consultation immédiate sans code secret</span>
                </div>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 01 : COULOIRS & DÉLAIS (CADRANS AVEC SUPERPOSITION)
          ============================================================ */}
      <section
        id="corridors"
        style={{
          padding: "84px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "44px" }}>
              <div className="roum-numero-ligne">
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>01</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280", marginLeft: "10px" }}>
                  COULOIRS STRATÉGIQUES & DÉLAIS D&apos;ACHEMINEMENT
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
              <p style={{ fontSize: "1rem", color: "#4B5563", maxWidth: "660px", margin: 0, lineHeight: 1.55 }}>
                Départs hebdomadaires planifiés depuis nos entrepôts de consolidation avec réceptions sécurisées.
              </p>
            </div>
          </ScrollReveal>

          {/* Grille des 4 couloirs avec superposition de médaillon drapeau */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "28px 22px",
            }}
          >
            {/* Couloir 1 : Chine */}
            <ScrollReveal delay={40}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 20px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                {/* Médaillon drapeau en superposition sur l'arête supérieure */}
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="CN" size={20} />
                </div>
                {/* Badge d'identification */}
                <div className="roum-badge-superpose-right">
                  CN · 01
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Chine ➔ Afrique
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Guangzhou & Yiwu (2 départs / semaine)
                  </div>

                  <div style={{ display: "grid", gap: "10px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "14px", marginBottom: "18px" }}>
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

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    margin: "0 -24px -20px -24px",
                    padding: "12px 24px",
                    borderRadius: "0 0 14px 14px",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>Tarif de base</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                    Dès 10 000 FCFA / kg
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 2 : Dubaï */}
            <ScrollReveal delay={90}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 20px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="AE" size={20} />
                </div>
                <div className="roum-badge-superpose-right">
                  AE · 02
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Dubaï ➔ Afrique
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Cargo Dubaï & Deira Wholesale
                  </div>

                  <div style={{ display: "grid", gap: "10px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "14px", marginBottom: "18px" }}>
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

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    margin: "0 -24px -20px -24px",
                    padding: "12px 24px",
                    borderRadius: "0 0 14px 14px",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>Tarif de base</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                    Dès 10 000 FCFA / kg
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 3 : Maroc */}
            <ScrollReveal delay={140}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 20px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="MA" size={20} />
                </div>
                <div className="roum-badge-superpose-right">
                  MA · 03
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Maroc ➔ 5 Pays
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Casablanca (5 jours chrono)
                  </div>

                  <div style={{ display: "grid", gap: "10px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "14px", marginBottom: "18px" }}>
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

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    margin: "0 -24px -20px -24px",
                    padding: "12px 24px",
                    borderRadius: "0 0 14px 14px",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>Tarif de base</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                    Dès 6 500 FCFA / kg
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Couloir 4 : France */}
            <ScrollReveal delay={190}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 20px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="FR" size={20} />
                </div>
                <div className="roum-badge-superpose-right">
                  FR · 04
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      France ↔ Abidjan
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "16px" }}>
                    Ligne aérienne directe Paris
                  </div>

                  <div style={{ display: "grid", gap: "10px", fontSize: "0.84rem", borderTop: "1px solid #F3F4F6", paddingTop: "14px", marginBottom: "18px" }}>
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

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    margin: "0 -24px -20px -24px",
                    padding: "12px 24px",
                    borderRadius: "0 0 14px 14px",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "#6B7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>Tarif de base</div>
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
          SECTION 02 : SIMULATEUR TARIFAIRE & BORDEREAU EN SUPERPOSITION
          ============================================================ */}
      <section
        id="tariffs"
        style={{
          padding: "84px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FAFAFA",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "40px" }}>
              <div className="roum-numero-ligne">
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>02</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280", marginLeft: "10px" }}>
                  SIMULATEUR DE COTATION IMMÉDIATE
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
              <p style={{ fontSize: "1rem", color: "#4B5563", maxWidth: "660px", margin: 0, lineHeight: 1.55 }}>
                Estimation directe selon les grilles en vigueur. Frais de dédouanement et sécurisation inclus.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "28px",
                alignItems: "stretch",
              }}
            >
              {/* Cadran gauche : Pupitre de Configuration */}
              <div
                className="roum-cadran"
                style={{
                  padding: "32px 26px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div className="roum-badge-superpose">
                  CONFIGURATION D&apos;EXPÉDITION
                </div>

                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px", marginTop: "4px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Départ (Origine)
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #D1D5DB", borderRadius: "10px", padding: "0 12px", height: "46px", backgroundColor: "#FFFFFF" }}>
                        <CircularFlag countryName={simOrigin} size={18} />
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
                            fontWeight: 700,
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
                        Arrivée (Destination)
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #D1D5DB", borderRadius: "10px", padding: "0 12px", height: "46px", backgroundColor: "#FFFFFF" }}>
                        <CircularFlag countryName={simDest} size={18} />
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
                            fontWeight: 700,
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

                  {/* Mode de transport avec boutons tactiles */}
                  <div style={{ marginBottom: "20px" }}>
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
                            className={isSelected ? "roum-btn-primary" : "roum-btn-secondary"}
                            style={{
                              padding: "9px 14px",
                              fontSize: "0.82rem",
                              borderRadius: "8px",
                            }}
                          >
                            <Icon size={14} />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Poids / Catégorie */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                    {simMode === "SEA" ? (
                      <div>
                        <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "8px", textTransform: "uppercase" }}>
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
                            height: "46px",
                            padding: "0 14px",
                            fontSize: "15px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "10px",
                            backgroundColor: "#FFFFFF",
                            color: "#111827",
                            boxSizing: "border-box",
                            fontWeight: 700,
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "8px", textTransform: "uppercase" }}>
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
                              height: "46px",
                              padding: "0 14px",
                              fontSize: "15px",
                              border: "1px solid #D1D5DB",
                              borderRadius: "10px",
                              backgroundColor: "#FFFFFF",
                              color: "#111827",
                              boxSizing: "border-box",
                              fontWeight: 700,
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#374151", marginBottom: "8px", textTransform: "uppercase" }}>
                            Nature de la marchandise
                          </label>
                          <select
                            value={simCategory}
                            onChange={(e) => setSimCategory(e.target.value)}
                            style={{
                              width: "100%",
                              height: "46px",
                              padding: "0 12px",
                              fontSize: "14px",
                              border: "1px solid #D1D5DB",
                              borderRadius: "10px",
                              backgroundColor: "#FFFFFF",
                              color: "#111827",
                              outline: "none",
                              boxSizing: "border-box",
                              fontWeight: 700,
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
              </div>

              {/* Cadran droit : Bordereau Officiel Superposé */}
              <div
                className="roum-bordereau-superpose"
                style={{
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div className="roum-badge-superpose">
                  BORDEREAU D&apos;ESTIMATION OFFICIEL
                </div>

                <div className="roum-badge-superpose-right">
                  DOUANE INCLUSE
                </div>

                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Montant estimé net
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(2.2rem, 3.8vw, 2.9rem)",
                      fontWeight: 800,
                      color: "#111827",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.05,
                      margin: "0 0 12px 0",
                    }}
                    className="tabular-nums"
                  >
                    {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                  </div>

                  <div style={{ fontSize: "0.92rem", color: "#374151", lineHeight: 1.55 }}>
                    {estimate.details} · <strong>Délai garanti : {estimate.duration}</strong>
                  </div>

                  {/* Ligne pointillée technique façon LTA */}
                  <div style={{ borderTop: "1.5px dashed #CBD5E1", margin: "18px 0" }} />

                  <div style={{ display: "grid", gap: "8px", fontSize: "0.82rem", color: "#4B5563" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Trajet :</span>
                      <strong style={{ color: "#111827" }}>{simOrigin} ➔ {simDest}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Conditionnement :</span>
                      <strong style={{ color: "#111827" }}>{simMode === "SEA" ? `${simCbm} m³` : `${simWeight} kg net`}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Point de retrait :</span>
                      <strong style={{ color: "#111827" }}>Agence Abidjan Bingerville</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <a
                    href={getSimulatorWaUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="roum-btn-primary"
                    style={{
                      width: "100%",
                      height: "48px",
                      fontSize: "0.92rem",
                      boxSizing: "border-box",
                    }}
                  >
                    <MessageCircle size={17} />
                    <span>Valider & Réserver sur WhatsApp</span>
                  </a>
                  <div style={{ textAlign: "center", fontSize: "0.74rem", color: "#9CA3AF", marginTop: "8px" }}>
                    Confirmation sans engagement · Assistance humaine directe
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 03 : ENTREPÔTS & ADRESSES DE RÉCEPTION (POCHOIR STENCIL)
          ============================================================ */}
      <section
        id="warehouses"
        style={{
          padding: "84px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "44px" }}>
              <div className="roum-numero-ligne">
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>03</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280", marginLeft: "10px" }}>
                  ENTREPÔTS MONDAUX & GROUPAGE SÉCURISÉ
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
              <p style={{ fontSize: "1rem", color: "#4B5563", maxWidth: "660px", margin: 0, lineHeight: 1.55 }}>
                Transmettez ces adresses à vos usines ou expéditeurs avec le marquage obligatoire en Shipping Mark.
              </p>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "28px 22px",
            }}
          >
            {/* Chine */}
            <ScrollReveal delay={40}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 22px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="CN" size={20} />
                </div>
                <div className="roum-badge-superpose-right">
                  HUB ASIE
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Guangzhou (Chine)
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 14px 0" }}>
                    Baiyun District, Guangzhou City, Guangdong Province, China. Réception & consolidation 1688 / Taobao.
                  </p>
                  <div className="roum-stencil-mark" style={{ marginBottom: "16px" }}>
                    SHIPPING MARK : ROUM TRANSIT / [VOTRE NOM]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("cn", "Guangzhou Warehouse, Baiyun District, Guangzhou City, Guangdong Province, China — ROUM TRANSIT")}
                  className="roum-btn-secondary"
                  style={{
                    width: "100%",
                    height: "42px",
                    backgroundColor: copiedKey === "cn" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "cn" ? "#15803D !important" : "#111827",
                    borderColor: copiedKey === "cn" ? "#86EFAC" : "#D1D5DB",
                    boxSizing: "border-box",
                  }}
                >
                  {copiedKey === "cn" ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                  <span>{copiedKey === "cn" ? "Adresse copiée !" : "Copier l'adresse de livraison"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Dubaï */}
            <ScrollReveal delay={90}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 22px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="AE" size={20} />
                </div>
                <div className="roum-badge-superpose-right">
                  HUB MOYEN-ORIENT
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Dubaï (Émirats)
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 14px 0" }}>
                    Deira Wholesale District, Dubaï Cargo Hub. Parfumerie, compléments, cosmétiques et électronique.
                  </p>
                  <div className="roum-stencil-mark" style={{ marginBottom: "16px" }}>
                    SHIPPING MARK : ROUM TRANSIT DUBAI / [VOTRE NOM]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("ae", "Deira Cargo Hub, Dubai, UAE — ROUM TRANSIT DUBAI")}
                  className="roum-btn-secondary"
                  style={{
                    width: "100%",
                    height: "42px",
                    backgroundColor: copiedKey === "ae" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "ae" ? "#15803D !important" : "#111827",
                    borderColor: copiedKey === "ae" ? "#86EFAC" : "#D1D5DB",
                    boxSizing: "border-box",
                  }}
                >
                  {copiedKey === "ae" ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                  <span>{copiedKey === "ae" ? "Adresse copiée !" : "Copier l'adresse de livraison"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Maroc */}
            <ScrollReveal delay={140}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 22px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="MA" size={20} />
                </div>
                <div className="roum-badge-superpose-right">
                  HUB MAGHREB
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Casablanca (Maroc)
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 14px 0" }}>
                    Zone Industrielle Ain Sebaa, Casablanca. Groupage subsaharien express départ garanti.
                  </p>
                  <div className="roum-stencil-mark" style={{ marginBottom: "16px" }}>
                    SHIPPING MARK : ROUM TRANSIT MAROC / [VOTRE NOM]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("ma", "Zone Industrielle Ain Sebaa, Casablanca, Maroc — ROUM TRANSIT")}
                  className="roum-btn-secondary"
                  style={{
                    width: "100%",
                    height: "42px",
                    backgroundColor: copiedKey === "ma" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "ma" ? "#15803D !important" : "#111827",
                    borderColor: copiedKey === "ma" ? "#86EFAC" : "#D1D5DB",
                    boxSizing: "border-box",
                  }}
                >
                  {copiedKey === "ma" ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                  <span>{copiedKey === "ma" ? "Adresse copiée !" : "Copier l'adresse de livraison"}</span>
                </button>
              </div>
            </ScrollReveal>

            {/* France */}
            <ScrollReveal delay={190}>
              <div
                className="roum-cadran"
                style={{
                  padding: "28px 24px 22px 24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div className="roum-flag-medaillon">
                  <CircularFlag countryCode="FR" size={20} />
                </div>
                <div className="roum-badge-superpose-right">
                  HUB EUROPE
                </div>

                <div>
                  <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Paris (France)
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 14px 0" }}>
                    Plateforme logistique Île-de-France. Expédition aérienne directe vers Abidjan.
                  </p>
                  <div className="roum-stencil-mark" style={{ marginBottom: "16px" }}>
                    SHIPPING MARK : ROUM TRANSIT PARIS / [VOTRE NOM]
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy("fr", "Plateforme Logistique Paris Île-de-France — ROUM TRANSIT PARIS")}
                  className="roum-btn-secondary"
                  style={{
                    width: "100%",
                    height: "42px",
                    backgroundColor: copiedKey === "fr" ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === "fr" ? "#15803D !important" : "#111827",
                    borderColor: copiedKey === "fr" ? "#86EFAC" : "#D1D5DB",
                    boxSizing: "border-box",
                  }}
                >
                  {copiedKey === "fr" ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                  <span>{copiedKey === "fr" ? "Adresse copiée !" : "Copier l'adresse de livraison"}</span>
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 04 : LA DÉMARCHE OPÉRATIONNELLE (DOCUMENTATION ARCHITECTURALE)
          Inspirée fidèlement de la planche Medscan de Mohamed Boubacar Seini
          ============================================================ */}
      <section
        id="exigence"
        style={{
          padding: "84px 20px 104px 20px",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "52px" }}>
              <div className="roum-numero-ligne">
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>04</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6B7280", marginLeft: "10px" }}>
                  DOCUMENTATION & ENGAGEMENT DU FONDATEUR
                </span>
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

          {/* Grille 4 colonnes éditoriales monumentales */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "40px 32px",
            }}
          >
            <ScrollReveal delay={40}>
              <div style={{ borderTop: "2px solid #111827", paddingTop: "18px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }} className="tabular-nums">
                  01
                </div>
                <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Pesée Certifiée & Rigueur
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0, textWrap: "pretty" }}>
                  Chaque colis entrant en magasin fait l&apos;objet d&apos;une pesée officielle et d&apos;une vérification physique de son conditionnement. Zéro surfacturation, facturation stricte au poids réel constaté.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={90}>
              <div style={{ borderTop: "2px solid #111827", paddingTop: "18px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }} className="tabular-nums">
                  02
                </div>
                <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Traçabilité Unitaire
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0, textWrap: "pretty" }}>
                  Dès la prise en charge, une référence de bordereau standardisée vous est remise. Votre dossier est tracé à chaque étape clé (réception magasin, vol/mer, douane, mise à disposition en agence).
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div style={{ borderTop: "2px solid #111827", paddingTop: "18px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }} className="tabular-nums">
                  03
                </div>
                <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Transparence des Délais
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0, textWrap: "pretty" }}>
                  Nos plannings d&apos;embarquement sont réguliers et tenus : 4 à 5 jours en aérien express, 5 jours chrono depuis le Maroc, et 35 à 45 jours par conteneur maritime groupé.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={190}>
              <div style={{ borderTop: "2px solid #111827", paddingTop: "18px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }} className="tabular-nums">
                  04
                </div>
                <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Disponibilité & Permanence
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.65, margin: 0, textWrap: "pretty" }}>
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
