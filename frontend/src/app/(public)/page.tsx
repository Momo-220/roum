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
  PackageCheck,
  ShieldCheck,
  Scale,
  Clock,
  MapPin,
  HelpCircle,
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
  const [simMode, setSimMode] = useState<"AIR" | "SEA">("AIR");
  const [simWeight, setSimWeight] = useState(5);
  const [simCbm, setSimCbm] = useState(0.5);

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
      setTrackingError("Veuillez entrer un numéro de suivi valide (Ex : RM-AIR-2610-K8P9Q2).");
      return;
    }

    router.push(`/tracking/${normalized}`);
  };

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Calcul direct et transparent
  const estimateCost = () => {
    if (simMode === "SEA") {
      const amount = Math.round(simCbm * 300000);
      return {
        amountFcfa: Math.max(150000, amount),
        duration: "35 à 45 jours",
        description: "Groupage maritime en conteneur sécurisé",
      };
    }

    // Fret aérien par pays
    let ratePerKg = 10000;
    let duration = "4 à 5 jours";

    if (simOrigin === "Maroc") {
      ratePerKg = 6500;
      duration = "5 jours chrono";
    } else if (simOrigin === "France") {
      ratePerKg = 8500;
      duration = "3 à 5 jours";
    } else if (simOrigin === "Chine" || simOrigin.includes("Dubaï")) {
      ratePerKg = 10000;
      duration = "4 à 5 jours";
    }

    return {
      amountFcfa: simWeight * ratePerKg,
      duration,
      description: `Fret aérien express (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
    };
  };

  const estimate = estimateCost();

  const getSimulatorWaUrl = () => {
    const text = `Bonjour Roum Transit, je souhaite faire une expédition :\n- Origine : ${simOrigin}\n- Destination : ${simDest}\n- Moyen : ${simMode === "AIR" ? "Avion (Fret Aérien)" : "Bateau (Fret Maritime)"}\n- Quantité : ${simMode === "SEA" ? simCbm + " m³" : simWeight + " kg"}\n- Estimation : ~${estimate.amountFcfa.toLocaleString("fr-FR")} FCFA (Douane incluse)\n- Délai prévu : ${estimate.duration}`;
    return buildWhatsAppUrl("+2250153638569", text);
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", color: "#111827", minHeight: "100vh" }}>
      {/* ============================================================
          HERO : MESSAGE PERTINENT, CLAIR & CHAMP DE SUIVI DIRECT
          ============================================================ */}
      <section
        id="hero"
        style={{
          padding: "60px 20px 64px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
          <ScrollReveal>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "9999px",
                backgroundColor: "#F3F4F6",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "16px",
              }}
            >
              Fret International Simple & Direct
            </div>

            <h1
              style={{
                fontSize: "clamp(2.1rem, 4.8vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 auto 18px auto",
                maxWidth: "880px",
                textWrap: "balance",
              }}
            >
              Vos colis de Chine, Dubaï, Maroc et France livrés à Abidjan.
            </h1>

            <p
              style={{
                fontSize: "clamp(1.02rem, 1.6vw, 1.18rem)",
                lineHeight: 1.6,
                color: "#4B5563",
                maxWidth: "680px",
                margin: "0 auto 36px auto",
                textWrap: "pretty",
              }}
            >
              Vous achetez chez vos fournisseurs, ils déposent dans nos magasins, nous pesons et nous expédions. Aucun frais caché : le dédouanement est déjà compris dans le tarif.
            </p>

            {/* FORMULAIRE DE RECHERCHE DE COLIS SIMPLE */}
            <div
              id="tracking"
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                backgroundColor: "#FFFFFF",
                border: "1px solid #D1D5DB",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.05)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>
                Suivre l&apos;arrivée d&apos;un colis
              </div>

              <form onSubmit={handleTrackingSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => {
                      setTrackingInput(e.target.value);
                      if (trackingError) setTrackingError("");
                    }}
                    placeholder="Numéro de colis (Ex : RM-AIR-2610-K8P9Q2)"
                    style={{
                      flex: "1 1 240px",
                      height: "48px",
                      padding: "0 14px",
                      fontSize: "16px", // 16px empêche l'auto-zoom iPhone
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      color: "#111827",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                      fontWeight: 600,
                    }}
                  />

                  <button
                    type="submit"
                    className="roum-btn-primary"
                    style={{
                      height: "48px",
                      padding: "0 22px",
                      fontSize: "0.9rem",
                    }}
                  >
                    <Search size={16} />
                    <span>Rechercher</span>
                  </button>
                </div>

                {trackingError && (
                  <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600, marginTop: "4px" }}>
                    {trackingError}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#6B7280", marginTop: "4px" }}>
                  <span>Exemple de test :</span>
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
          SECTION SERVICES : CLAIRE, SANS EMOJIS, AVEC BOUTONS D'ACTION
          ============================================================ */}
      <section
        id="services"
        style={{
          padding: "72px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#F9FAFB",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Ce que nous faisons
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
                Nos Services de Transport
              </h2>
              <p style={{ fontSize: "1rem", color: "#4B5563", maxWidth: "600px", margin: "0 auto", lineHeight: 1.5 }}>
                Des solutions simples et adaptées au poids, au délai et au budget de chacun.
              </p>
            </div>
          </ScrollReveal>

          {/* Grille des 4 services */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Service 1 : Avion */}
            <ScrollReveal delay={40}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Plane size={22} color="#FFFFFF" />
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Fret Aérien Express (Avion)
                  </h3>

                  <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    La solution la plus rapide pour vos téléphones, ordinateurs, vêtements et petits colis urgents.
                  </p>

                  <div style={{ fontSize: "0.82rem", color: "#111827", fontWeight: 700, marginBottom: "20px" }}>
                    Délai : 4 à 5 jours seulement
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSimMode("AIR");
                    scrollToElement("tariffs");
                  }}
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem" }}
                >
                  <span>Calculer le prix avion</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </ScrollReveal>

            {/* Service 2 : Bateau */}
            <ScrollReveal delay={80}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Ship size={22} color="#FFFFFF" />
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Fret Maritime (Bateau)
                  </h3>

                  <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Le moyen le plus économique pour les gros cartons, meubles, machines et marchandises au mètre cube (CBM).
                  </p>

                  <div style={{ fontSize: "0.82rem", color: "#111827", fontWeight: 700, marginBottom: "20px" }}>
                    Délai : 35 à 45 jours par conteneur
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSimMode("SEA");
                    scrollToElement("tariffs");
                  }}
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem" }}
                >
                  <span>Calculer le prix bateau</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </ScrollReveal>

            {/* Service 3 : Réception Fournisseurs */}
            <ScrollReveal delay={120}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <PackageCheck size={22} color="#FFFFFF" />
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Réception Magasin & Contrôle
                  </h3>

                  <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Nos équipes reçoivent vos achats de 1688, Taobao ou fournisseurs, les vérifient et les pèsent sur place.
                  </p>

                  <div style={{ fontSize: "0.82rem", color: "#111827", fontWeight: 700, marginBottom: "20px" }}>
                    Pesée exacte garantie à 100%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => scrollToElement("warehouses")}
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem" }}
                >
                  <span>Voir les adresses magasins</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </ScrollReveal>

            {/* Service 4 : Dédouanement & Retrait */}
            <ScrollReveal delay={160}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <ShieldCheck size={22} color="#FFFFFF" />
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Douane Comprise & Retrait Agence
                  </h3>

                  <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Zéro mauvaise surprise à l&apos;arrivée. Vous retirez vos colis directement à notre agence d&apos;Abidjan Bingerville.
                  </p>

                  <div style={{ fontSize: "0.82rem", color: "#111827", fontWeight: 700, marginBottom: "20px" }}>
                    Formalités et taxes incluses
                  </div>
                </div>

                <a
                  href="https://wa.me/2250153638569?text=Bonjour%20Roum%20Transit,%20j%27ai%20une%20question%20sur%20vos%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem", textDecoration: "none" }}
                >
                  <MessageCircle size={14} />
                  <span>Poser une question</span>
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION COMMENT ÇA MARCHE : SIMPLE COMME UN JEU D'ENFANT
          ============================================================ */}
      <section
        style={{
          padding: "68px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: "44px" }}>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                En 3 étapes faciles
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.7rem, 3vw, 2.2rem)",
                  fontWeight: 800,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Comment envoyer un colis ?
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "24px",
              }}
            >
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "24px",
                  backgroundColor: "#FAFAFA",
                }}
              >
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
                  1. Vous achetez
                </div>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.55, margin: 0 }}>
                  Vous passez commande chez votre fournisseur et vous lui donnez l&apos;adresse de notre magasin avec votre nom.
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "24px",
                  backgroundColor: "#FAFAFA",
                }}
              >
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
                  2. Nous recevons
                </div>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.55, margin: 0 }}>
                  Dès réception dans notre entrepôt, nous pesons votre colis et nous vous remettons votre numéro de suivi officiel.
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "24px",
                  backgroundColor: "#FAFAFA",
                }}
              >
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
                  3. Vous récupérez
                </div>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.55, margin: 0 }}>
                  Votre colis arrive à Abidjan. Vous recevez un message et venez le retirer tranquillement à notre agence.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION SIMULATEUR DE TARIFS DIRECT
          ============================================================ */}
      <section
        id="tariffs"
        style={{
          padding: "72px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#F9FAFB",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Calculateur Transparent
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#111827",
                  margin: "0 0 10px 0",
                }}
              >
                Estimer le prix de votre colis
              </h2>
              <p style={{ fontSize: "0.98rem", color: "#4B5563", margin: 0 }}>
                Choisissez votre pays de départ et le poids pour voir le prix total avec douane incluse.
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
              {/* Panneau Réglages */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                    Pays de départ (Où se trouve votre fournisseur ?)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "0 10px", height: "46px" }}>
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
                        color: "#111827",
                        outline: "none",
                        fontWeight: 700,
                      }}
                    >
                      <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                      <option value="Émirats Arabes Unis (Dubaï)">Dubaï (Émirats Arabes Unis)</option>
                      <option value="Maroc">Maroc (Casablanca)</option>
                      <option value="France">France (Paris)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                    Moyen de transport
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setSimMode("AIR")}
                      className={simMode === "AIR" ? "roum-btn-primary" : "roum-btn-secondary"}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "0.85rem" }}
                    >
                      <Plane size={15} />
                      <span>Avion (Express)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimMode("SEA")}
                      className={simMode === "SEA" ? "roum-btn-primary" : "roum-btn-secondary"}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "0.85rem" }}
                    >
                      <Ship size={15} />
                      <span>Bateau (Maritime)</span>
                    </button>
                  </div>
                </div>

                {simMode === "AIR" ? (
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
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
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                      Volume estimé (en m³ / CBM)
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
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "26px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: "6px" }}>
                    Prix total estimé (douane incluse)
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(2rem, 3.4vw, 2.8rem)",
                      fontWeight: 800,
                      color: "#111827",
                      lineHeight: 1.1,
                      margin: "0 0 10px 0",
                    }}
                    className="tabular-nums"
                  >
                    {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                  </div>

                  <div style={{ fontSize: "0.88rem", color: "#374151", marginBottom: "14px" }}>
                    {estimate.description}
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "#4B5563", borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                    Délai prévu : <strong>{estimate.duration}</strong><br />
                    Lieu de retrait : <strong>Agence Roum Transit Abidjan Bingerville</strong>
                  </div>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <a
                    href={getSimulatorWaUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="roum-btn-primary"
                    style={{ width: "100%", height: "48px", boxSizing: "border-box" }}
                  >
                    <MessageCircle size={16} />
                    <span>Confirmer ce devis sur WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION ADRESSES DES MAGASINS
          ============================================================ */}
      <section
        id="warehouses"
        style={{
          padding: "72px 20px",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: "44px" }}>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Pour vos fournisseurs
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#111827",
                  margin: "0 0 10px 0",
                }}
              >
                Nos Adresses de Réception
              </h2>
              <p style={{ fontSize: "0.98rem", color: "#4B5563", margin: 0 }}>
                Donnez ces adresses à vos vendeurs en ajoutant toujours votre nom pour identifier vos colis.
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
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CircularFlag countryCode="CN" size={18} />
                  <strong style={{ fontSize: "1rem", color: "#111827" }}>Guangzhou (Chine)</strong>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Baiyun District, Guangzhou City, Guangdong Province, China. Réception directe de 1688 et Taobao.
                </p>
                <div style={{ fontSize: "0.75rem", color: "#1F2937", background: "#F3F4F6", padding: "8px 10px", borderRadius: "6px", marginBottom: "16px", fontWeight: 700 }}>
                  Marquage : ROUM TRANSIT / [Votre Nom]
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy("cn", "Guangzhou Warehouse, Baiyun District, Guangzhou City, Guangdong Province, China — ROUM TRANSIT")}
                className="roum-btn-secondary"
                style={{ width: "100%", fontSize: "0.8rem", padding: "8px 12px" }}
              >
                {copiedKey === "cn" ? <Check size={13} color="#15803D" /> : <Copy size={13} />}
                <span>{copiedKey === "cn" ? "Adresse copiée !" : "Copier l'adresse Chine"}</span>
              </button>
            </div>

            {/* Dubaï */}
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CircularFlag countryCode="AE" size={18} />
                  <strong style={{ fontSize: "1rem", color: "#111827" }}>Dubaï (Émirats)</strong>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Deira Wholesale Cargo Hub, Dubai, UAE. Pour vos commandes de parfumerie, cosmétiques et électronique.
                </p>
                <div style={{ fontSize: "0.75rem", color: "#1F2937", background: "#F3F4F6", padding: "8px 10px", borderRadius: "6px", marginBottom: "16px", fontWeight: 700 }}>
                  Marquage : ROUM TRANSIT DUBAI / [Votre Nom]
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy("ae", "Deira Cargo Hub, Dubai, UAE — ROUM TRANSIT DUBAI")}
                className="roum-btn-secondary"
                style={{ width: "100%", fontSize: "0.8rem", padding: "8px 12px" }}
              >
                {copiedKey === "ae" ? <Check size={13} color="#15803D" /> : <Copy size={13} />}
                <span>{copiedKey === "ae" ? "Adresse copiée !" : "Copier l'adresse Dubaï"}</span>
              </button>
            </div>

            {/* Maroc */}
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CircularFlag countryCode="MA" size={18} />
                  <strong style={{ fontSize: "1rem", color: "#111827" }}>Casablanca (Maroc)</strong>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Zone Industrielle Ain Sebaa, Casablanca, Maroc. Départ régulier express en 5 jours chrono.
                </p>
                <div style={{ fontSize: "0.75rem", color: "#1F2937", background: "#F3F4F6", padding: "8px 10px", borderRadius: "6px", marginBottom: "16px", fontWeight: 700 }}>
                  Marquage : ROUM TRANSIT MAROC / [Votre Nom]
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy("ma", "Zone Industrielle Ain Sebaa, Casablanca, Maroc — ROUM TRANSIT")}
                className="roum-btn-secondary"
                style={{ width: "100%", fontSize: "0.8rem", padding: "8px 12px" }}
              >
                {copiedKey === "ma" ? <Check size={13} color="#15803D" /> : <Copy size={13} />}
                <span>{copiedKey === "ma" ? "Adresse copiée !" : "Copier l'adresse Maroc"}</span>
              </button>
            </div>

            {/* France */}
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CircularFlag countryCode="FR" size={18} />
                  <strong style={{ fontSize: "1rem", color: "#111827" }}>Paris (France)</strong>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Plateforme Logistique Paris Île-de-France. Expédition directe vers Abidjan pour colis et documents.
                </p>
                <div style={{ fontSize: "0.75rem", color: "#1F2937", background: "#F3F4F6", padding: "8px 10px", borderRadius: "6px", marginBottom: "16px", fontWeight: 700 }}>
                  Marquage : ROUM TRANSIT PARIS / [Votre Nom]
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy("fr", "Plateforme Logistique Paris Île-de-France — ROUM TRANSIT PARIS")}
                className="roum-btn-secondary"
                style={{ width: "100%", fontSize: "0.8rem", padding: "8px 12px" }}
              >
                {copiedKey === "fr" ? <Check size={13} color="#15803D" /> : <Copy size={13} />}
                <span>{copiedKey === "fr" ? "Adresse copiée !" : "Copier l'adresse France"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION POURQUOI ROUM TRANSIT ? (SIMPLE & RASSURANT)
          ============================================================ */}
      <section
        id="exigence"
        style={{
          padding: "72px 20px 84px 20px",
          backgroundColor: "#FAFAFA",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h2
                style={{
                  fontSize: "clamp(1.7rem, 3vw, 2.2rem)",
                  fontWeight: 800,
                  color: "#111827",
                  margin: "0 0 10px 0",
                }}
              >
                Pourquoi choisir Roum Transit ?
              </h2>
              <p style={{ fontSize: "0.96rem", color: "#4B5563", margin: 0 }}>
                Notre engagement pour que chacun de vos colis arrive en toute sérénité.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <Scale size={18} color="#111827" />
                </div>
                <strong style={{ fontSize: "0.95rem", color: "#111827", display: "block", marginBottom: "6px" }}>Pesée Exacte</strong>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
                  Vos colis sont pesés avec rigueur. Vous payez exactement ce que pèse votre marchandise, rien de plus.
                </p>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <PackageCheck size={18} color="#111827" />
                </div>
                <strong style={{ fontSize: "0.95rem", color: "#111827", display: "block", marginBottom: "6px" }}>Suivi Unitaire</strong>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
                  Un numéro de bordereau pour suivre votre paquet du magasin jusqu&apos;à l&apos;arrivée à Abidjan.
                </p>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <Clock size={18} color="#111827" />
                </div>
                <strong style={{ fontSize: "0.95rem", color: "#111827", display: "block", marginBottom: "6px" }}>Délais Respectés</strong>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
                  Des départs réguliers chaque semaine pour que vos articles arrivent à temps sans attente inutile.
                </p>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <MapPin size={18} color="#111827" />
                </div>
                <strong style={{ fontSize: "0.95rem", color: "#111827", display: "block", marginBottom: "6px" }}>Agence Locale</strong>
                <p style={{ fontSize: "0.82rem", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
                  Une équipe physique à Abidjan Bingerville prête à vous accueillir et disponible sur WhatsApp.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
