"use client";

import { useState } from "react";
import { Plane, Ship, MessageCircle, Scale, ShieldCheck } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { buildWhatsAppUrl } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function TariffsPage() {
  const [origin, setOrigin] = useState("Chine");
  const [mode, setMode] = useState<"AIR" | "SEA">("AIR");
  const [weight, setWeight] = useState(5);
  const [cbm, setCbm] = useState(0.5);

  const calculateTotal = () => {
    if (mode === "SEA") {
      const amount = Math.round(cbm * 300000);
      return {
        amountFcfa: Math.max(150000, amount),
        duration: "35 à 45 jours",
        label: "Groupage maritime en conteneur",
      };
    }

    let rate = 10000;
    let duration = "4 à 5 jours";

    if (origin === "Maroc") {
      rate = 6500;
      duration = "5 jours chrono";
    } else if (origin === "France") {
      rate = 8500;
      duration = "3 à 5 jours";
    } else if (origin === "Chine" || origin.includes("Dubaï")) {
      rate = 10000;
      duration = "4 à 5 jours";
    }

    return {
      amountFcfa: weight * rate,
      duration,
      label: `Fret aérien express (${rate.toLocaleString("fr-FR")} FCFA / kg)`,
    };
  };

  const estimate = calculateTotal();

  const getWaLink = () => {
    const text = `Bonjour Roum Transit, je souhaite une confirmation de devis :\n- Origine : ${origin}\n- Destination : Abidjan (Côte d'Ivoire)\n- Mode : ${mode === "AIR" ? "Avion" : "Bateau"}\n- Quantité : ${mode === "SEA" ? cbm + " m³" : weight + " kg"}\n- Total estimé : ${estimate.amountFcfa.toLocaleString("fr-FR")} FCFA (Douane comprise)\n- Délai : ${estimate.duration}`;
    return buildWhatsAppUrl("+2250153638569", text);
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "48px 20px 64px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
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
              Calcul Transparent
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 0 12px 0",
              }}
            >
              Estimer le Prix de votre Envoi
            </h1>

            <p style={{ fontSize: "1.02rem", color: "#4B5563", margin: 0, lineHeight: 1.55 }}>
              Choisissez d&apos;où part votre colis et sa quantité pour voir le montant total avec douane comprise.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              alignItems: "stretch",
            }}
          >
            {/* Panneau de sélection */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                  1. D&apos;où part votre colis ?
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "0 12px", height: "46px" }}>
                  <CircularFlag countryName={origin} size={18} />
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    style={{
                      border: "none",
                      backgroundColor: "transparent",
                      width: "100%",
                      height: "100%",
                      fontSize: "15px",
                      color: "#111827",
                      outline: "none",
                      fontWeight: 700,
                    }}
                  >
                    <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                    <option value="Émirats Arabes Unis (Dubaï)">Dubaï (Émirats)</option>
                    <option value="Maroc">Maroc (Casablanca)</option>
                    <option value="France">France (Paris)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                  2. Par quel moyen souhaitez-vous envoyer ?
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setMode("AIR")}
                    className={mode === "AIR" ? "roum-btn-primary" : "roum-btn-secondary"}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "0.85rem" }}
                  >
                    <Plane size={15} />
                    <span>Avion (4 à 5j)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("SEA")}
                    className={mode === "SEA" ? "roum-btn-primary" : "roum-btn-secondary"}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "0.85rem" }}
                  >
                    <Ship size={15} />
                    <span>Bateau (35 à 45j)</span>
                  </button>
                </div>
              </div>

              {mode === "AIR" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                    3. Poids estimé (en kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 12px",
                      fontSize: "16px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      color: "#111827",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                    3. Volume estimé (en m³ / CBM)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={cbm}
                    onChange={(e) => setCbm(Math.max(0.1, Number(e.target.value)))}
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 12px",
                      fontSize: "16px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      color: "#111827",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Panneau Résultat */}
            <div
              style={{
                backgroundColor: "#FAFAFA",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 16px -2px rgba(0,0,0,0.04)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "8px" }}>
                  Montant total à payer à l&apos;arrivée
                </div>

                <div
                  style={{
                    fontSize: "clamp(2.2rem, 3.6vw, 2.9rem)",
                    fontWeight: 800,
                    color: "#111827",
                    lineHeight: 1.1,
                    margin: "0 0 10px 0",
                  }}
                  className="tabular-nums"
                >
                  {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                </div>

                <div style={{ fontSize: "0.92rem", color: "#374151", marginBottom: "16px" }}>
                  {estimate.label}
                </div>

                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px", display: "grid", gap: "8px", fontSize: "0.84rem", color: "#4B5563" }}>
                  <div>
                    Délai d&apos;arrivée : <strong>{estimate.duration}</strong>
                  </div>
                  <div>
                    Dédouanement : <strong>100% Inclus (Zéro taxe supplémentaire)</strong>
                  </div>
                  <div>
                    Point de retrait : <strong>Agence Abidjan Bingerville</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <a
                  href={getWaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="roum-btn-primary"
                  style={{ width: "100%", height: "48px", boxSizing: "border-box", fontSize: "0.92rem" }}
                >
                  <MessageCircle size={16} />
                  <span>Confirmer ce devis sur WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
