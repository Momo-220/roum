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
} from "lucide-react";
import { normalizeTrackingNumber, buildWhatsAppUrl } from "@/shared";
import { CircularFlag } from "@/components/CircularFlag";
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

  // État du simulateur dynamique
  const [simOrigin, setSimOrigin] = useState("Chine");
  const [simDest, setSimDest] = useState("Côte d'Ivoire");
  const [simMode, setSimMode] = useState<"AIR" | "SEA" | "ROAD">("AIR");
  const [simCategory, setSimCategory] = useState("express");
  const [simWeight, setSimWeight] = useState(10);
  const [simCbm, setSimCbm] = useState(1.0);
  const [simCurrency, setSimCurrency] = useState("FCFA");

  // Formatage des montants
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
        details: "Batteries, compléments & produits sous réglementation",
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
    <div style={{ backgroundColor: "#FFFFFF", color: "#111827", minHeight: "100vh" }}>
      {/* CONTENEUR PRINCIPAL CENTRÉ — SOBRE, MINIMALISTE ET ÉDITORIAL */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 20px 80px 20px" }}>
        
        {/* EN-TÊTE ÉDITORIAL */}
        <section style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <img
              src="/images/roum-logo-tight.png"
              alt="Roum Transit"
              style={{
                height: "64px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#6B7280",
              margin: "0 0 12px 0",
            }}
          >
            FRET INTERNATIONAL & TRANSIT SÉCURISÉ
          </p>

          <h1
            style={{
              fontSize: "clamp(1.9rem, 4vw, 2.7rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#111827",
              margin: "0 0 16px 0",
            }}
          >
            La rigueur logistique au service de vos expéditions
          </h1>

          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "#4B5563",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Acheminement direct depuis la Chine, les Émirats, le Maroc et l&apos;Europe vers l&apos;Afrique subsaharienne. Suivi en continu, traçabilité rigoureuse et engagement de délais.
          </p>
        </section>

        {/* SECTION 01 : SUIVI EN DIRECT */}
        <section id="tracking" style={{ marginBottom: "56px", borderTop: "1px solid #E5E7EB", paddingTop: "40px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9CA3AF" }}>01</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280" }}>
              SUIVI DU COLIS EN TEMPS RÉEL
            </span>
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 16px 0" }}>
            Localisez votre expédition
          </h2>

          <p style={{ fontSize: "0.92rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 20px 0" }}>
            Saisissez votre référence de bordereau pour consulter instantanément le statut physique, l&apos;entrepôt actuel et les dates d&apos;arrivée prévues.
          </p>

          <form onSubmit={handleTrackingSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                  placeholder="Ex : RM-AIR-2610-K8P9Q2"
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 16px",
                    fontSize: "16px", // 16px empêche le zoom involontaire sur iPhone
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    color: "#111827",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  height: "48px",
                  padding: "0 22px",
                  backgroundColor: "#111827",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  flexShrink: 0,
                  transition: "background-color 0.15s ease",
                }}
              >
                <Search size={16} />
                <span>Consulter</span>
              </button>
            </div>

            {trackingError && (
              <div style={{ fontSize: "0.82rem", color: "#DC2626", marginTop: "4px" }}>
                {trackingError}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "0.8rem", color: "#6B7280" }}>
              <span>Dossier témoin :</span>
              <button
                type="button"
                onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#111827",
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                RM-AIR-2610-K8P9Q2
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 02 : SIMULATEUR DE COTATIONS & GRILLES TARIFAIRES */}
        <section id="tariffs" style={{ marginBottom: "56px", borderTop: "1px solid #E5E7EB", paddingTop: "40px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9CA3AF" }}>02</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280" }}>
              TARIFICATION TRANSPARENTE
            </span>
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 16px 0" }}>
            Simulateur d&apos;expédition direct
          </h2>

          <p style={{ fontSize: "0.92rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 24px 0" }}>
            Tarifs réels appliqués sans intermédiaire. Sélectionnez votre couloir, votre mode d&apos;acheminement et votre volume.
          </p>

          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "24px",
              backgroundColor: "#FAFAFA",
            }}
          >
            {/* SÉLECTEUR DE CORRIDOR */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Pays d&apos;Expédition (Origine)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "0 12px", height: "46px" }}>
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
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Pays de Livraison (Destination)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "0 12px", height: "46px" }}>
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

            {/* CHOIX DU MODE DE TRANSPORT */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Mode de Transport
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { id: "AIR", label: "Aérien Express (4 - 5 jours)", icon: Plane },
                  { id: "SEA", label: "Maritime Groupage (300 000 F / CBM)", icon: Ship },
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
                        padding: "10px 14px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
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
                      <Icon size={14} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SÉLECTION DU VOLUME / POIDS SELON MODE */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              {simMode === "SEA" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                    Volume en mètre cube (CBM)
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
                      fontSize: "16px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      color: "#111827",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ) : (
                <>
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
                        height: "44px",
                        padding: "0 12px",
                        fontSize: "16px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        color: "#111827",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                      Catégorie de Marchandise
                    </label>
                    <select
                      value={simCategory}
                      onChange={(e) => setSimCategory(e.target.value)}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 12px",
                        fontSize: "15px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        color: "#111827",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="express">Marchandises Générales (Express 4j)</option>
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

            {/* RÉSULTAT DU CALCUL */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                padding: "20px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", display: "block", marginBottom: "4px" }}>
                  Estimation Tout Compris · Dédouanement Inclus
                </span>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                  {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                </div>
                <div style={{ fontSize: "0.85rem", color: "#4B5563", marginTop: "2px" }}>
                  {estimate.details} · <strong>Délai : {estimate.duration}</strong>
                </div>
              </div>

              <a
                href={getSimulatorWaUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  height: "46px",
                  padding: "0 20px",
                  backgroundColor: "#111827",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <MessageCircle size={16} />
                <span>Confirmer sur WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 03 : RÉSEAU D'ENTREPÔTS INTERNATIONAUX */}
        <section id="warehouses" style={{ marginBottom: "56px", borderTop: "1px solid #E5E7EB", paddingTop: "40px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9CA3AF" }}>03</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280" }}>
              RÉSEAU INTERNATIONAL
            </span>
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 16px 0" }}>
            Nos magasins de groupage stratégiques
          </h2>

          <p style={{ fontSize: "0.92rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 24px 0" }}>
            Des infrastructures de réception dédiées dans chaque carrefour mondial du commerce, prêtes à recevoir vos commandes fournisseurs avec code client unique.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
            {/* Hub 1 : Chine */}
            <div style={{ padding: "18px", border: "1px solid #E5E7EB", borderRadius: "10px", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <CircularFlag countryCode="CN" size={18} />
                <strong style={{ fontSize: "0.95rem", color: "#111827" }}>Guangzhou & Yiwu (Chine)</strong>
              </div>
              <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                Point de consolidation principal pour vos achats 1688, Taobao et usines directes. Contrôle des colis, groupage et départs aériens réguliers 2 fois par semaine.
              </p>
            </div>

            {/* Hub 2 : Dubaï */}
            <div style={{ padding: "18px", border: "1px solid #E5E7EB", borderRadius: "10px", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <CircularFlag countryCode="AE" size={18} />
                <strong style={{ fontSize: "0.95rem", color: "#111827" }}>Dubaï (Émirats Arabes Unis)</strong>
              </div>
              <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                Plateforme logistique pour la parfumerie, l&apos;électronique de luxe et les pièces détachées. Acheminement rapide vers l&apos;Afrique de l&apos;Ouest en 4 à 6 jours.
              </p>
            </div>

            {/* Hub 3 : Maroc */}
            <div style={{ padding: "18px", border: "1px solid #E5E7EB", borderRadius: "10px", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <CircularFlag countryCode="MA" size={18} />
                <strong style={{ fontSize: "0.95rem", color: "#111827" }}>Casablanca (Maroc)</strong>
              </div>
              <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                Liaison exclusive 5 jours chrono vers 5 pays d&apos;Afrique subsaharienne (Côte d&apos;Ivoire, Sénégal, Mali, Burkina Faso, Gabon). Rigueur d&apos;expédition garantie.
              </p>
            </div>

            {/* Hub 4 : France */}
            <div style={{ padding: "18px", border: "1px solid #E5E7EB", borderRadius: "10px", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <CircularFlag countryCode="FR" size={18} />
                <strong style={{ fontSize: "0.95rem", color: "#111827" }}>Paris (France)</strong>
              </div>
              <p style={{ fontSize: "0.84rem", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                Ligne aérienne directe Paris ↔ Abidjan. Gestion des documents confidentiels, produits de parapharmacie et effets personnels avec règlement en euros ou FCFA.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 04 : L'ENGAGEMENT OPÉRATIONNEL (STYLE ÉDITORIAL DE LA RÉFÉRENCE) */}
        <section style={{ borderTop: "1px solid #E5E7EB", paddingTop: "40px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9CA3AF" }}>04</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6B7280" }}>
              EXIGENCE OPÉRATIONNELLE
            </span>
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 24px 0" }}>
            La démarche de fiabilité Roum Transit
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "4px" }}>01</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                Pesée certifiée & Contrôle
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                Chaque colis entrant en magasin fait l&apos;objet d&apos;une pesée précise et d&apos;une vérification physique de son conditionnement. Zéro surfacturation, facturation au poids réel.
              </p>
            </div>

            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "4px" }}>02</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                Numéro de suivi unique
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                Dès la prise en charge, une référence de bordereau standardisée vous est remise. Votre dossier est tracé à chaque étape clé (réception, départ en vol/mer, douane, agence).
              </p>
            </div>

            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "4px" }}>03</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                Délais maîtrisés
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                Nos plannings d&apos;embarquement sont fixes et respectés. 4 à 5 jours en aérien express, 5 jours chrono depuis le Maroc, et 35 à 45 jours par conteneur maritime.
              </p>
            </div>

            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", marginBottom: "4px" }}>04</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                Assistance continue 7j/7
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                Une équipe opérationnelle dédiée à votre écoute directe par WhatsApp et à l&apos;agence d&apos;Abidjan Bingerville pour retirer vos colis en toute sérénité.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
