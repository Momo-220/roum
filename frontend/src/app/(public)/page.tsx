"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plane,
  Ship,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Calculator,
  MessageCircle,
  Clock,
  Package,
  Zap,
  CheckCircle2,
  BatteryCharging,
  Laptop,
  Award,
  FileText,
  Truck,
  Globe,
} from "lucide-react";
import { normalizeTrackingNumber, buildWhatsAppUrl } from "@/shared";
import { CircularFlag } from "@/components/CircularFlag";
import {
  STRATEGIC_HUBS,
  AFRICAN_COUNTRIES,
  ALL_WORLD_COUNTRIES,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
} from "@/data/countries";

export default function HomePage() {
  const router = useRouter();

  // État du formulaire de suivi
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");

  // État du simulateur de devis aligné sur les flyers officiels ROUM TRANSIT
  const [simOrigin, setSimOrigin] = useState("Chine");
  const [simDest, setSimDest] = useState("Côte d'Ivoire");
  const [simMode, setSimMode] = useState<"AIR" | "SEA" | "ROAD">("AIR");
  const [simCategory, setSimCategory] = useState("express");
  const [simWeight, setSimWeight] = useState(10);
  const [simCbm, setSimCbm] = useState(1.0);
  const [simCurrency, setSimCurrency] = useState("FCFA");

  // Conversion de devise avec Franc CFA en monnaie par défaut
  const formatSimulatorPrice = (amountFcfa: number, currency: string = "FCFA"): string => {
    if (currency === "FCFA") return `${Math.round(amountFcfa).toLocaleString("fr-FR")} FCFA`;
    if (currency === "EUR") return `${(amountFcfa / 655.957).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} €`;
    if (currency === "USD") return `$${(amountFcfa / 600).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`;
    if (currency === "AED") return `${(amountFcfa / 163).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Dhs`;
    if (currency === "MAD") return `${(amountFcfa / 60).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} DH`;
    if (currency === "GBP") return `£${(amountFcfa / 760).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`;
    if (currency === "CNY") return `¥${(amountFcfa / 84).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`;
    return `${Math.round(amountFcfa).toLocaleString("fr-FR")} ${currency}`;
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");

    const normalized = normalizeTrackingNumber(trackingInput);
    if (!normalized) {
      setTrackingError(
        "Numéro de suivi invalide. Format attendu : RM-AIR-2610-XXXXXX ou RM-SEA-2610-XXXXXX."
      );
      return;
    }

    router.push(`/tracking/${normalized}`);
  };

  // Calcul d'estimation dynamique exact selon les grilles tarifaires des flyers
  const estimateCost = () => {
    const isParisCorridor =
      (simOrigin === "France" && simDest === "Côte d'Ivoire") ||
      (simOrigin === "Côte d'Ivoire" && simDest === "France");
    const isMoroccoCorridor = simOrigin === "Maroc";

    // 1. Corridors Paris ↔ Abidjan
    if (isParisCorridor) {
      if (simCategory === "doc") {
        return {
          amountFcfa: 13000,
          amountEur: 20,
          currency: "FCFA",
          duration: "3 à 5 jours",
          unit: "13 000 FCFA / 20 € (pli express)",
          details: "Document administratif ou pli urgent",
        };
      }
      if (simCategory === "cosmetic") {
        const totalFcfa = simWeight * 9000;
        const totalEur = simWeight * 14;
        return {
          amountFcfa: totalFcfa,
          amountEur: totalEur,
          currency: "FCFA",
          duration: "3 à 5 jours",
          unit: "9 000 FCFA / 14 € par kg",
          details: "Cosmétique, liquides & soins",
        };
      }
      // Divers articles
      const totalFcfa = simWeight * 8500;
      const totalEur = simWeight * 12;
      return {
        amountFcfa: totalFcfa,
        amountEur: totalEur,
        currency: "FCFA",
        duration: "3 à 5 jours",
        unit: "8 500 FCFA / 12 € par kg",
        details: "Divers articles, vêtements, colis perso",
      };
    }

    // 2. Corridor Maroc ➔ Afrique Subsaharienne (5 jours garantis)
    if (isMoroccoCorridor) {
      let rate = 7000;
      if (simDest === "Côte d'Ivoire") rate = 6500;
      if (simDest === "Burkina Faso" || simDest === "Gabon") rate = 7500;
      const totalFcfa = simWeight * rate;
      return {
        amountFcfa: totalFcfa,
        amountEur: null,
        currency: "FCFA",
        duration: "5 jours garantis",
        unit: `${rate.toLocaleString("fr-FR")} FCFA / kg`,
        details: "N°1 du Groupage Aérien Subsaharien (Maroc ➔ Afrique)",
      };
    }

    // 3. Voie Terrestre
    if (simMode === "ROAD") {
      const totalFcfa = simWeight * 5000;
      return {
        amountFcfa: totalFcfa,
        amountEur: null,
        currency: "FCFA",
        duration: "7 à 12 jours",
        unit: "5 000 FCFA / kg",
        details: "Voie Terrestre Transfrontalière sécurisée",
      };
    }

    // 4. Voie Maritime (Chine ou Dubaï ou International)
    if (simMode === "SEA") {
      const totalFcfa = Math.round(simCbm * 300000);
      return {
        amountFcfa: totalFcfa,
        amountEur: null,
        currency: "FCFA",
        duration: "35 à 45 jours",
        unit: "300 000 FCFA / m³ (CBM)",
        details: "Voie Maritime (LCL conteneur sécurisé)",
      };
    }

    // 5. Aérien Chine / Dubaï / International
    if (simCategory === "pc") {
      return {
        amountFcfa: 50000,
        amountEur: null,
        currency: "FCFA",
        duration: "4 à 7 jours",
        unit: "50 000 FCFA (pièce)",
        details: "Pièce d'ordinateur & matériel high-tech",
      };
    }
    if (simCategory === "battery") {
      const totalFcfa = simWeight * 14000;
      return {
        amountFcfa: totalFcfa,
        amountEur: null,
        currency: "FCFA",
        duration: "7 à 10 jours",
        unit: "14 000 FCFA / kg",
        details: "Compléments alimentaires & Batteries sous réglementation",
      };
    }
    if (simCategory === "normal") {
      const totalFcfa = simWeight * 10000;
      return {
        amountFcfa: totalFcfa,
        amountEur: null,
        currency: "FCFA",
        duration: "2 semaines",
        unit: "10 000 FCFA / kg",
        details: "Voie Normale Économique",
      };
    }

    // Voie Express par défaut (12 000 F)
    const totalFcfa = simWeight * 12000;
    return {
      amountFcfa: totalFcfa,
      amountEur: null,
      currency: "FCFA",
      duration: "4 jours",
      unit: "12 000 FCFA / kg",
      details: "Voie Express Ultra-Rapide",
    };
  };

  const estimate = estimateCost();

  const getSimulatorWaUrl = () => {
    const text = `Bonjour ROUM TRANSIT, je souhaite un devis pour une expédition :\n- Départ : ${simOrigin}\n- Destination : ${simDest}\n- Mode : ${simMode === "AIR" ? "Voie Aérienne" : simMode === "SEA" ? "Voie Maritime" : "Voie Terrestre"}\n- Quantité : ${simMode === "SEA" ? simCbm + " m³" : simWeight + " kg"}\nEstimation indicative : ~${estimate.amountFcfa.toLocaleString("fr-FR")} FCFA ${simCurrency !== "FCFA" ? `(${formatSimulatorPrice(estimate.amountFcfa, simCurrency)})` : ""}\nDélai prévu : ${estimate.duration}`;
    return buildWhatsAppUrl("+2250153638569", text);
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section
        style={{
          padding: "70px 0 50px 0",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="container" style={{ maxWidth: "860px" }}>
          {/* Logo Officiel Imposant */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "26px" }}>
            <img
              src="/images/roum-logo-tight.png"
              alt="Logo Officiel Roum Transit"
              style={{
                width: "100%",
                maxWidth: "320px",
                height: "auto",
                objectFit: "contain",
                display: "block",
                filter: "drop-shadow(0 10px 24px rgba(0, 0, 0, 0.08))",
              }}
            />
          </div>

          {/* Badge Top */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              color: "var(--brown-dark)",
              fontSize: "0.82rem",
              fontWeight: "600",
              marginBottom: "24px",
            }}
          >
            <ShieldCheck size={16} color="var(--brown-light)" />
            Transport International & Sourcing Sécurisé
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
              lineHeight: "1.15",
              marginBottom: "20px",
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            Expédiez depuis la Chine, Dubaï et le Maroc vers l&apos;Afrique
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              marginBottom: "36px",
              maxWidth: "680px",
              margin: "0 auto 36px auto",
            }}
          >
            Suivi transparent de vos colis en temps réel, tarifs négociés au kilo ou au m³,
            et assistance continue sur WhatsApp de l&apos;enlèvement à la livraison.
          </p>

          {/* Formulaire de Suivi Direct (Tracking) */}
          <div
            id="tracking"
            className="card-clean"
            style={{
              padding: "26px",
              maxWidth: "680px",
              margin: "0 auto",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "var(--brown-dark)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Search size={18} color="var(--brown-light)" />
              Suivre un Colis en Direct
            </div>

            <form
              onSubmit={handleTrackingSubmit}
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                className="input-clean"
                placeholder="Ex : RM-AIR-2610-K8P9Q2 ou numéro reçu par SMS/WhatsApp"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                style={{
                  flex: "1 1 300px",
                  fontSize: "0.95rem",
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: "0 0 auto", padding: "10px 22px" }}
              >
                Localiser mon Colis
                <ArrowRight size={17} />
              </button>
            </form>

            {trackingError && (
              <div
                style={{
                  marginTop: "12px",
                  color: "var(--state-danger-text)",
                  background: "var(--state-danger-bg)",
                  border: "1px solid var(--state-danger-border)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.82rem",
                  fontWeight: "500",
                }}
              >
                {trackingError}
              </div>
            )}

            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-light)",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>Accès direct sans mot de passe requis.</span>
              <span>
                Exemple de test :{" "}
                <button
                  type="button"
                  onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brown-light)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: "600",
                    fontFamily: "inherit",
                  }}
                >
                  RM-AIR-2610-K8P9Q2
                </button>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section id="services" style={{ padding: "60px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                color: "var(--brown-light)",
                fontWeight: "700",
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "8px",
              }}
            >
              Nos Solutions Logistiques
            </div>
            <h2 style={{ fontSize: "2rem", color: "var(--text-main)" }}>
              Du petit colis e-commerce au conteneur complet
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Service 1 : Aérien */}
            <div className="card-clean" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  color: "var(--brown-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <Plane size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "10px", color: "var(--text-main)" }}>
                Voie Aérienne Express & Standard
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                Vols réguliers au départ de Guangzhou, Yiwu et Dubaï. Idéal pour les échantillons,
                l&apos;électronique, les vêtements urgents et pièces détachées.
              </p>
              <div style={{ color: "var(--brown-dark)", fontWeight: "600", fontSize: "0.85rem" }}>
                Délais indicatifs : 3 à 7 jours ouvrés
              </div>
            </div>

            {/* Service 2 : Maritime */}
            <div className="card-clean" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  color: "var(--brown-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <Ship size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "10px", color: "var(--text-main)" }}>
                Maritime Groupage (LCL) & FCL
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                Optimisez vos coûts pour les gros volumes. Vous ne payez que le volume (CBM) réellement
                occupé dans nos conteneurs sécurisés avec dédouanement inclus.
              </p>
              <div style={{ color: "var(--brown-dark)", fontWeight: "600", fontSize: "0.85rem" }}>
                Tarification avantageuse au m³ (CBM)
              </div>
            </div>

            {/* Service 3 : Achat & Sourcing */}
            <div className="card-clean" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  color: "var(--brown-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <ShoppingBag size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "10px", color: "var(--text-main)" }}>
                Achats & Sourcing Usines
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                Accompagnement sur les marchés de gros (1688, Taobao, marchés de Dubaï). Nous réglons
                vos fournisseurs en devises locales et inspectons la marchandise avant expédition.
              </p>
              <div style={{ color: "var(--brown-dark)", fontWeight: "600", fontSize: "0.85rem" }}>
                Paiement sécurisé des fournisseurs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIMULATEUR DE DEVIS INTERACTIF */}
      <section
        id="tariffs"
        style={{
          padding: "60px 0",
        }}
      >
        <div className="container">
          <div
            className="card-clean"
            style={{
              padding: "40px 32px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "36px",
                alignItems: "center",
              }}
            >
              {/* Formulaire simulateur */}
              <div>
                <div
                  style={{
                    color: "var(--brown-light)",
                    fontWeight: "700",
                    fontSize: "0.82rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Calculator size={17} />
                  Simulateur Tarifaire Gratuit
                </div>
                <h2 style={{ fontSize: "1.8rem", marginBottom: "16px", color: "var(--text-main)" }}>
                  Estimez le coût de votre expédition en 3 clics
                </h2>

                <div style={{ display: "grid", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px", fontWeight: "600" }}>
                        <CircularFlag countryName={simOrigin} size={16} />
                        Départ (Origine)
                      </label>
                      <select
                        className="input-clean"
                        value={simOrigin}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSimOrigin(val);
                          if (val === "France" && simDest === "France") setSimDest("Côte d'Ivoire");
                          if (val === "Côte d'Ivoire" && simDest !== "France") setSimDest("France");
                        }}
                      >
                        <optgroup label="Hubs Stratégiques Roum">
                          {STRATEGIC_HUBS.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Destinations Principales (Afrique)">
                          {AFRICAN_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Tous les pays (Monde)">
                          {ALL_WORLD_COUNTRIES.filter(
                            (c) =>
                              !STRATEGIC_HUBS.some((h) => h.code === c.code) &&
                              !AFRICAN_COUNTRIES.some((a) => a.code === c.code)
                          ).map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px", fontWeight: "600" }}>
                        <CircularFlag countryName={simDest} size={16} />
                        Arrivée (Destination)
                      </label>
                      <select
                        className="input-clean"
                        value={simDest}
                        onChange={(e) => setSimDest(e.target.value)}
                      >
                        <optgroup label="Destinations Principales (Afrique)">
                          {AFRICAN_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Hubs Stratégiques & International">
                          {STRATEGIC_HUBS.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Tous les pays (Monde)">
                          {ALL_WORLD_COUNTRIES.filter(
                            (c) =>
                              !STRATEGIC_HUBS.some((h) => h.code === c.code) &&
                              !AFRICAN_COUNTRIES.some((a) => a.code === c.code)
                          ).map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Mode de transport (Voie Aérienne / Maritime / Terrestre) */}
                  <div>
                    <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                      Mode d&apos;Acheminement
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setSimMode("AIR")}
                        className="btn"
                        style={{
                          background: simMode === "AIR" ? "var(--brown-dark)" : "#FFFFFF",
                          color: simMode === "AIR" ? "#FAF8F5" : "var(--text-main)",
                          border: `1px solid ${simMode === "AIR" ? "var(--brown-dark)" : "var(--border-light)"}`,
                          padding: "8px 10px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <Plane size={15} />
                        Voie Aérienne
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimMode("SEA")}
                        className="btn"
                        style={{
                          background: simMode === "SEA" ? "var(--brown-dark)" : "#FFFFFF",
                          color: simMode === "SEA" ? "#FAF8F5" : "var(--text-main)",
                          border: `1px solid ${simMode === "SEA" ? "var(--brown-dark)" : "var(--border-light)"}`,
                          padding: "8px 10px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <Ship size={15} />
                        Voie Maritime
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimMode("ROAD")}
                        className="btn"
                        style={{
                          background: simMode === "ROAD" ? "var(--brown-dark)" : "#FFFFFF",
                          color: simMode === "ROAD" ? "#FAF8F5" : "var(--text-main)",
                          border: `1px solid ${simMode === "ROAD" ? "var(--brown-dark)" : "var(--border-light)"}`,
                          padding: "8px 10px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <Truck size={15} />
                        Voie Terrestre
                      </button>
                    </div>
                  </div>

                  {/* Devise d'affichage (Défaut : FCFA) */}
                  <div>
                    <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                      Devise d&apos;affichage (Défaut : Franc CFA)
                    </label>
                    <select
                      className="input-clean"
                      value={simCurrency}
                      onChange={(e) => setSimCurrency(e.target.value)}
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name} {c.isDefault ? "(Par Défaut)" : `(${c.symbol})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type d'article selon le corridor */}
                  {(simOrigin === "France" || simDest === "France") ? (
                    <div>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                        Catégorie d&apos;article (Abidjan ↔ Paris)
                      </label>
                      <select
                        className="input-clean"
                        value={simCategory}
                        onChange={(e) => setSimCategory(e.target.value)}
                      >
                        <option value="standard">Divers Articles — 8 500 F / 12 € kg</option>
                        <option value="cosmetic">Cosmétique et Liquide — 9 000 F / 14 € kg</option>
                        <option value="doc">Document Administratif — 13 000 F / 20 €</option>
                      </select>
                    </div>
                  ) : simMode === "AIR" ? (
                    <div>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                        Option & Type de marchandise
                      </label>
                      <select
                        className="input-clean"
                        value={simCategory}
                        onChange={(e) => setSimCategory(e.target.value)}
                      >
                        <option value="express">Voie Express (4 jours) — 12 000 FCFA/kg</option>
                        <option value="normal">Voie Normale (2 semaines) — 10 000 FCFA/kg</option>
                        <option value="battery">Complément alimentaire + Batterie — 14 000 FCFA/kg</option>
                        <option value="pc">Pièce d&apos;ordinateur & High-Tech — 50 000 FCFA</option>
                      </select>
                    </div>
                  ) : simMode === "ROAD" ? (
                    <div>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                        Type de marchandise
                      </label>
                      <select className="input-clean" disabled value="general">
                        <option value="general">Marchandises Générales (Voie Terrestre) — 5 000 FCFA/kg</option>
                      </select>
                    </div>
                  ) : null}

                  {/* Curseur de quantité */}
                  {(simMode === "AIR" || simMode === "ROAD" || simOrigin === "Maroc" || simOrigin === "France" || simDest === "France") && simCategory !== "doc" && simCategory !== "pc" ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Poids estimé (kg)</span>
                        <strong style={{ color: "var(--brown-dark)" }}>{simWeight} kg</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="150"
                        value={simWeight}
                        onChange={(e) => setSimWeight(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brown-dark)", cursor: "pointer" }}
                      />
                    </div>
                  ) : simMode === "SEA" ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Volume estimé (m³ / CBM)</span>
                        <strong style={{ color: "var(--brown-dark)" }}>{simCbm} m³</strong>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="15"
                        step="0.1"
                        value={simCbm}
                        onChange={(e) => setSimCbm(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brown-dark)", cursor: "pointer" }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Résultat visuel & Action WhatsApp */}
              <div
                style={{
                  background: "var(--bg-subtle)",
                  padding: "32px 28px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px", fontWeight: "600" }}>
                  Coût estimé selon la grille officielle
                </div>
                <div
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: "800",
                    color: "var(--brown-dark)",
                    lineHeight: "1.1",
                    marginBottom: "6px",
                  }}
                >
                  ~{formatSimulatorPrice(estimate.amountFcfa, simCurrency)}
                </div>
                {simCurrency !== "FCFA" && (
                  <div style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Équivalent : ~{estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                  </div>
                )}
                {estimate.amountEur && simCurrency === "FCFA" && (
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#2563eb", marginBottom: "8px" }}>
                    équivalent : ~{estimate.amountEur.toLocaleString("fr-FR")} €
                  </div>
                )}
                <div style={{ fontSize: "0.85rem", color: "var(--brown-dark)", fontWeight: "600", marginBottom: "4px" }}>
                  {estimate.unit}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "18px" }}>
                  <Clock size={14} /> Délai de livraison prévu : <strong>{estimate.duration}</strong>
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginBottom: "20px",
                    lineHeight: "1.4",
                  }}
                >
                  {estimate.details} • Tarifs officiels Roum Transit garantis sans surprise.
                </div>

                <a
                  href={getSimulatorWaUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ width: "100%", padding: "12px", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <img src="/images/whatsapp.png" alt="WhatsApp" style={{ width: 18, height: 18, objectFit: "contain", display: "block" }} />
                  Valider ce Devis sur WhatsApp (+225)
                </a>
              </div>
            </div>

            {/* Showcase des 3 Grilles Tarifaires Réelles des Flyers */}
            <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid var(--border-light)" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--brown-light)",
                    fontWeight: "700",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "6px",
                  }}
                >
                  Grilles Tarifaires Officielles En Agence
                </div>
                <h3 style={{ fontSize: "1.4rem", color: "var(--text-main)" }}>
                  Consultez les prix officiels de nos 3 liaisons stratégiques
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* Carte 1 : Chine & Dubaï */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    borderRadius: "16px",
                    padding: "22px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#16a34a", background: "#f0fdf4", padding: "4px 10px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <CircularFlag countryCode="CN" size={16} />
                      <CircularFlag countryCode="AE" size={16} />
                      <span>Chine & Dubaï ➔ Afrique</span>
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Award size={13} color="var(--brown-dark)" /> Tarifs Officiels
                    </span>
                  </div>
                  <h4 style={{ fontSize: "1.05rem", color: "var(--text-main)", marginBottom: "12px" }}>
                    Transport & Import-Export
                  </h4>
                  <div style={{ display: "grid", gap: "8px", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Zap size={15} color="#d97706" /> Voie Express (4 jours)
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>12 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Plane size={15} color="#2563eb" /> Voie Normale (2 sem.)
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>10 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <BatteryCharging size={15} color="#16a34a" /> Batteries & Compléments
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>14 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Laptop size={15} color="#7c3aed" /> Pièces d&apos;ordinateur
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>50 000 F</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Ship size={15} color="#0284c7" /> Voie Maritime (Le CBM)
                      </span>
                      <strong style={{ color: "#2563eb" }}>300 000 F / m³</strong>
                    </div>
                  </div>
                </div>

                {/* Carte 2 : Maroc Subsaharien */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    borderRadius: "16px",
                    padding: "22px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#c2410c", background: "#fff7ed", padding: "4px 10px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <CircularFlag countryCode="MA" size={16} />
                      <span>Maroc ➔ 5 Pays d&apos;Afrique</span>
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#c2410c", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} /> 5 Jours Chrono
                    </span>
                  </div>
                  <h4 style={{ fontSize: "1.05rem", color: "var(--text-main)", marginBottom: "12px" }}>
                    N°1 du Groupage Aérien
                  </h4>
                  <div style={{ display: "grid", gap: "8px", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag countryCode="CI" size={16} /> Côte d&apos;Ivoire
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>6 500 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag countryCode="SN" size={16} /> Sénégal
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>7 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag countryCode="ML" size={16} /> Mali
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>7 000 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag countryCode="BF" size={16} /> Burkina Faso
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>7 500 F / kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CircularFlag countryCode="GA" size={16} /> Gabon
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>7 500 F / kg</strong>
                    </div>
                  </div>
                </div>

                {/* Carte 3 : Paris ↔ Abidjan */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    borderRadius: "16px",
                    padding: "22px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#4f46e5", background: "#eef2ff", padding: "4px 10px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <CircularFlag countryCode="FR" size={16} />
                      <ArrowRight size={12} />
                      <CircularFlag countryCode="CI" size={16} />
                      <span>Paris ↔ Abidjan</span>
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)" }}>
                      Double Devise F/€
                    </span>
                  </div>
                  <h4 style={{ fontSize: "1.05rem", color: "var(--text-main)", marginBottom: "12px" }}>
                    Logistics & Transport Bilatéral
                  </h4>
                  <div style={{ display: "grid", gap: "8px", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShoppingBag size={15} color="#4f46e5" /> Divers Articles
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>8 500 F / 12 € kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Package size={15} color="var(--brown-dark)" /> Cosmétique & Liquide
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>9 000 F / 14 € kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-light)" }}>
                      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileText size={15} color="#0284c7" /> Document Administratif
                      </span>
                      <strong style={{ color: "var(--brown-dark)" }}>13 000 F / 20 €</strong>
                    </div>
                    <div style={{ paddingTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Award size={13} color="var(--brown-dark)" /> Agence : Abidjan Bingerville
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MessageCircle size={13} color="#16a34a" /> WhatsApp : +225 01 53 63 85 69
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NOTRE PARCOURS EN 4 ÉTAPES */}
      <section style={{ padding: "60px 0 80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "10px", color: "var(--text-main)" }}>
              Comment fonctionne votre expédition ?
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Un processus simple, tracé et sécurisé de bout en bout.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                step: "01",
                title: "Dépôt au Hub",
                desc: "Votre colis est réceptionné à notre entrepôt (Guangzhou, Dubaï ou Casablanca), pesé, mesuré et étiqueté.",
              },
              {
                step: "02",
                title: "Code Unique & Suivi",
                desc: "Vous recevez votre référence unique (ex: RM-AIR-2610-XXXXXX) pour suivre chaque étape en ligne.",
              },
              {
                step: "03",
                title: "Transit & Douane",
                desc: "Acheminement direct et prise en charge intégrale des formalités de douane par nos déclarants.",
              },
              {
                step: "04",
                title: "Livraison Locale",
                desc: "Retrait dans nos agences locales en Afrique ou livraison directe à votre boutique ou domicile.",
              },
            ].map((s) => (
              <div key={s.step} className="card-clean" style={{ padding: "24px" }}>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "800",
                    color: "var(--brown-light)",
                    marginBottom: "10px",
                  }}
                >
                  {s.step}
                </div>
                <h4 style={{ fontSize: "1.05rem", marginBottom: "6px", color: "var(--text-main)" }}>{s.title}</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
