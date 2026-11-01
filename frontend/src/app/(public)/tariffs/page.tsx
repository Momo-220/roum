"use client";

import { useState, useEffect } from "react";
import { Plane, Ship, MessageCircle, Scale, ShieldCheck, Zap, BatteryCharging, Laptop, FileText, CheckCircle2 } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  getLiveTariffs,
  findTariff,
  formatTariffPrice,
  saveClientRequest,
  OfficialTariff,
} from "@/shared";

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());

  // Synchronisation temps réel avec le Dashboard Admin
  useEffect(() => {
    const handleSync = () => {
      setTariffs(getLiveTariffs());
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  const [origin, setOrigin] = useState("Chine");
  const [destination, setDestination] = useState("Côte d'Ivoire");
  const [formulaKey, setFormulaKey] = useState("express");
  const [weight, setWeight] = useState(5);
  const [cbm, setCbm] = useState(0.5);
  const [docCount, setDocCount] = useState(1);

  // Mise à jour des destinations selon le pays de départ
  const getDestinationsForOrigin = (orig: string) => {
    if (orig === "Chine") {
      return ["Côte d'Ivoire", "Sénégal", "Mali", "Niger", "Burkina Faso"];
    }
    if (orig.includes("Dubaï") || orig.includes("Émirats")) {
      return ["Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso"];
    }
    if (orig === "Maroc") {
      return ["Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso", "Gabon"];
    }
    if (orig === "France") {
      return ["Côte d'Ivoire"];
    }
    if (orig === "Côte d'Ivoire") {
      return ["France", "Maroc", "Sénégal", "Mali"];
    }
    return ["Côte d'Ivoire"];
  };

  const handleOriginChange = (newOrigin: string) => {
    setOrigin(newOrigin);
    const availableDests = getDestinationsForOrigin(newOrigin);
    if (!availableDests.includes(destination)) {
      setDestination(availableDests[0]);
    }
    // Réinitialise la formule par défaut selon le pays
    if (newOrigin === "Chine" || newOrigin.includes("Dubaï")) {
      setFormulaKey("express");
    } else if (newOrigin === "Maroc") {
      setFormulaKey("subsaharien");
    } else {
      setFormulaKey("divers");
    }
  };

  // Calcul du montant dynamique en lisant les tarifs réels de l'admin
  const calculateEstimate = () => {
    // 1. CAS DU MAROC : Tarif selon la destination exacte
    if (origin === "Maroc") {
      let matched = findTariff(tariffs, "maroc", destination);
      if (!matched) {
        if (destination === "Côte d'Ivoire") matched = findTariff(tariffs, "maroc", "ci") || findTariff(tariffs, "maroc", "abidjan");
        else if (destination === "Sénégal") matched = findTariff(tariffs, "maroc", "sn") || findTariff(tariffs, "maroc", "dakar");
        else if (destination === "Mali") matched = findTariff(tariffs, "maroc", "ml") || findTariff(tariffs, "maroc", "bamako");
        else if (destination === "Burkina Faso") matched = findTariff(tariffs, "maroc", "bf") || findTariff(tariffs, "maroc", "ouaga");
        else if (destination === "Gabon") matched = findTariff(tariffs, "maroc", "ga") || findTariff(tariffs, "maroc", "libreville");
      }
      const rateMinor = matched?.price_per_unit_minor || (destination === "Côte d'Ivoire" ? 650000 : 700000);
      const ratePerKg = rateMinor / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "5 jours chrono garantis",
        label: `Groupage Aérien Casablanca ➔ ${destination} (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
        mode: "AIR" as const,
      };
    }

    // 2. CAS DE LA CHINE
    if (origin === "Chine") {
      if (formulaKey === "sea") {
        const matched = findTariff(tariffs, "chine", "bateau");
        const ratePerCbm = (matched?.price_per_unit_minor || 30000000) / 100;
        return {
          amountFcfa: Math.round(cbm * ratePerCbm),
          duration: "35 à 45 jours de mer",
          label: `Par Bateau conteneur au mètre cube (${ratePerCbm.toLocaleString("fr-FR")} FCFA / m³)`,
          rateFormatted: `${ratePerCbm.toLocaleString("fr-FR")} FCFA / m³`,
          mode: "SEA" as const,
        };
      }
      if (formulaKey === "tech") {
        const matched = findTariff(tariffs, "chine", "ordinateur");
        const rateUnit = (matched?.price_per_unit_minor || 5000000) / 100;
        return {
          amountFcfa: docCount * rateUnit,
          duration: "4 à 7 jours",
          label: `Pièces d'ordinateur & High-Tech (${rateUnit.toLocaleString("fr-FR")} FCFA le carton sécurisé)`,
          rateFormatted: `${rateUnit.toLocaleString("fr-FR")} FCFA / carton`,
          mode: "AIR" as const,
        };
      }
      if (formulaKey === "battery") {
        const matched = findTariff(tariffs, "chine", "batterie");
        const ratePerKg = (matched?.price_per_unit_minor || 1400000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "7 à 10 jours",
          label: `Batteries, Compléments & Crèmes (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      if (formulaKey === "normal") {
        const matched = findTariff(tariffs, "chine", "normale");
        const ratePerKg = (matched?.price_per_unit_minor || 1000000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "12 à 14 jours",
          label: `Voie Normale Aérienne Économique (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      // Express par défaut
      const matched = findTariff(tariffs, "chine", "express");
      const ratePerKg = (matched?.price_per_unit_minor || 1200000) / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "4 à 5 jours chrono",
        label: `Voie Express Aérienne Rapide (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
        mode: "AIR" as const,
      };
    }

    // 3. CAS DE DUBAÏ
    if (origin.includes("Dubaï") || origin.includes("Émirats")) {
      if (formulaKey === "sea") {
        const matched = findTariff(tariffs, "émirat", "bateau") || findTariff(tariffs, "duba", "bateau");
        const ratePerCbm = (matched?.price_per_unit_minor || 30000000) / 100;
        return {
          amountFcfa: Math.round(cbm * ratePerCbm),
          duration: "30 à 40 jours de mer",
          label: `Par Bateau depuis Dubaï (${ratePerCbm.toLocaleString("fr-FR")} FCFA / m³)`,
          rateFormatted: `${ratePerCbm.toLocaleString("fr-FR")} FCFA / m³`,
          mode: "SEA" as const,
        };
      }
      if (formulaKey === "special") {
        const matched = findTariff(tariffs, "émirat", "spécial") || findTariff(tariffs, "duba", "spécial");
        const ratePerKg = (matched?.price_per_unit_minor || 1400000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "7 à 10 jours",
          label: `Parfums & Marchandises Spéciales Dubaï (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      if (formulaKey === "normal") {
        const matched = findTariff(tariffs, "émirat", "normale") || findTariff(tariffs, "duba", "normale");
        const ratePerKg = (matched?.price_per_unit_minor || 1000000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "10 à 14 jours",
          label: `Voie Normale Dubaï (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      // Express
      const matched = findTariff(tariffs, "émirat", "express") || findTariff(tariffs, "duba", "express");
      const ratePerKg = (matched?.price_per_unit_minor || 1200000) / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "4 à 5 jours",
        label: `Voie Express Dubaï DXB (${ratePerKg.toLocaleString("fr-FR")} FCFA / kg)`,
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
        mode: "AIR" as const,
      };
    }

    // 4. CAS DE LA FRANCE (OU CÔTE D'IVOIRE VERS FRANCE)
    if (origin === "France" || destination === "France") {
      if (formulaKey === "doc") {
        const matched = findTariff(tariffs, "france", "document");
        const rateUnit = (matched?.price_per_unit_minor || 1300000) / 100;
        return {
          amountFcfa: docCount * rateUnit,
          duration: "2 à 3 jours chrono",
          label: `Document Administratif & Pli Urgent (${rateUnit.toLocaleString("fr-FR")} FCFA / 20 € le pli)`,
          rateFormatted: `${rateUnit.toLocaleString("fr-FR")} FCFA (20 €) / pli`,
          mode: "AIR" as const,
        };
      }
      if (formulaKey === "cosm") {
        const matched = findTariff(tariffs, "france", "cosmétique");
        const ratePerKg = (matched?.price_per_unit_minor || 900000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "3 à 5 jours",
          label: `Cosmétiques, Beurres & Liquides (${ratePerKg.toLocaleString("fr-FR")} FCFA / 14 € le kg)`,
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA (14 €) / kg`,
          mode: "AIR" as const,
        };
      }
      // Divers articles par défaut
      const matched = findTariff(tariffs, "france", "divers");
      const ratePerKg = (matched?.price_per_unit_minor || 850000) / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "3 à 5 jours",
        label: `Colis Divers & Vêtements (${ratePerKg.toLocaleString("fr-FR")} FCFA / 12 € le kg)`,
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA (12 €) / kg`,
        mode: "AIR" as const,
      };
    }

    // Fallback standard
    return {
      amountFcfa: weight * 10000,
      duration: "4 à 5 jours",
      label: `Fret Aérien Régulier (10 000 FCFA / kg)`,
      rateFormatted: "10 000 FCFA / kg",
      mode: "AIR" as const,
    };
  };

  const estimate = calculateEstimate();

  const getWaLink = () => {
    let qtyDesc = `${weight} kg`;
    if (formulaKey === "sea") qtyDesc = `${cbm} m³`;
    else if (formulaKey === "doc" || formulaKey === "tech") qtyDesc = `${docCount} unité(s)`;

    const text = `Bonjour Roum Transit, je souhaite une confirmation de devis :\n- Origine : ${origin}\n- Destination : ${destination}\n- Formule : ${estimate.label}\n- Quantité : ${qtyDesc}\n- Total estimé : ${estimate.amountFcfa.toLocaleString("fr-FR")} FCFA (Douane comprise)\n- Délai garanti : ${estimate.duration}`;
    return `https://wa.me/2250153638569?text=${encodeURIComponent(text)}`;
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "36px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* Titre & Explications Limpides */}
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
              Calculateur Transparent
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 2.9rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 0 10px 0",
              }}
            >
              Estimez le Prix Exact de votre Colis
            </h1>

            <p style={{ fontSize: "1.02rem", color: "#4B5563", margin: "0 auto", maxWidth: "660px", lineHeight: 1.55 }}>
              Sélectionnez votre pays de départ, votre destination et votre type de marchandises.
              Le tarif affiché <strong>inclut 100% des frais de douane</strong>, sans mauvaise surprise.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
              alignItems: "stretch",
            }}
          >
            {/* Colonne Paramètres du calcul */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              {/* 1. Pays de Départ */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                  1. Pays de départ
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                  {[
                    { name: "Chine", label: "Chine (Guangzhou / Yiwu)" },
                    { name: "Émirats Arabes Unis (Dubaï)", label: "Dubaï (Émirats)" },
                    { name: "Maroc", label: "Maroc (Casablanca)" },
                    { name: "France", label: "France (Paris)" },
                    { name: "Côte d'Ivoire", label: "Côte d'Ivoire" },
                  ].map((p) => {
                    const isSelected = origin === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleOriginChange(p.name)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: isSelected ? "2px solid #111827" : "1px solid #E5E7EB",
                          backgroundColor: isSelected ? "#111827" : "#FAF9F6",
                          color: isSelected ? "#FFFFFF" : "#374151",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Destination */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                  2. Destination d&apos;arrivée
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    fontSize: "0.9rem",
                    backgroundColor: "#FFFFFF",
                    fontWeight: 600,
                  }}
                >
                  {getDestinationsForOrigin(origin).map((dst) => (
                    <option key={dst} value={dst}>
                      {dst}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Formule / Type de Marchandises selon le pays de départ */}
              {origin !== "Maroc" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                    3. Formule & Type d&apos;envoi
                  </label>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {origin === "Chine" && [
                      { key: "express", label: "Voie Express Avion (4-5 jours)", note: "Ultra rapide · 12 000 F/kg" },
                      { key: "normal", label: "Voie Normale Avion (2 semaines)", note: "Économique · 10 000 F/kg" },
                      { key: "battery", label: "Batteries, Crèmes & Liquides", note: "Réglementé · 14 000 F/kg" },
                      { key: "tech", label: "Pièces Ordinateur & Téléphones", note: "Sécurisé · 50 000 F le carton" },
                      { key: "sea", label: "Par Bateau au Mètre Cube (m³)", note: "Gros cartons · 300 000 F/m³" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFormulaKey(f.key)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: formulaKey === f.key ? "2px solid #111827" : "1px solid #E5E7EB",
                          backgroundColor: formulaKey === f.key ? "#FAF9F6" : "#FFFFFF",
                          color: "#111827",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>{f.label}</span>
                        <span style={{ fontSize: "0.76rem", color: "#6B7280" }}>{f.note}</span>
                      </button>
                    ))}

                    {(origin.includes("Dubaï") || origin.includes("Émirats")) && [
                      { key: "express", label: "Voie Express Dubaï (4-5 jours)", note: "Vol direct · 12 000 F/kg" },
                      { key: "normal", label: "Voie Normale Dubaï (2 semaines)", note: "Standard · 10 000 F/kg" },
                      { key: "special", label: "Parfums & Cosmétiques Dubaï", note: "Spécial · 14 000 F/kg" },
                      { key: "sea", label: "Par Bateau au Mètre Cube (m³)", note: "Jebel Ali · 300 000 F/m³" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFormulaKey(f.key)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: formulaKey === f.key ? "2px solid #111827" : "1px solid #E5E7EB",
                          backgroundColor: formulaKey === f.key ? "#FAF9F6" : "#FFFFFF",
                          color: "#111827",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>{f.label}</span>
                        <span style={{ fontSize: "0.76rem", color: "#6B7280" }}>{f.note}</span>
                      </button>
                    ))}

                    {(origin === "France" || destination === "France") && [
                      { key: "divers", label: "Colis Divers & Vêtements", note: "8 500 F / 12 € le kg" },
                      { key: "cosm", label: "Cosmétiques & Liquides", note: "9 000 F / 14 € le kg" },
                      { key: "doc", label: "Document Administratif & Pli", note: "13 000 F / 20 € le pli" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFormulaKey(f.key)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: formulaKey === f.key ? "2px solid #111827" : "1px solid #E5E7EB",
                          backgroundColor: formulaKey === f.key ? "#FAF9F6" : "#FFFFFF",
                          color: "#111827",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>{f.label}</span>
                        <span style={{ fontSize: "0.76rem", color: "#6B7280" }}>{f.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Saisie Quantité (kg, m³ ou unités) */}
              <div>
                {formulaKey === "sea" ? (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                      Volume estimé en Mètre Cube (m³)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={cbm}
                      onChange={(e) => setCbm(Math.max(0.1, Number(e.target.value)))}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "1rem",
                        fontWeight: 700,
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.74rem", color: "#6B7280", marginTop: "4px", display: "block" }}>
                      Exemple : un grand carton de 1m x 1m x 1m = 1 m³.
                    </span>
                  </div>
                ) : formulaKey === "doc" || formulaKey === "tech" ? (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                      Nombre de plis / cartons
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={docCount}
                      onChange={(e) => setDocCount(Math.max(1, Number(e.target.value)))}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "1rem",
                        fontWeight: 700,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                      Poids estimé (en kg)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={weight}
                      onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid #D1D5DB",
                        fontSize: "1rem",
                        fontWeight: 700,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Résultat & Devis immédiat */}
            <div
              style={{
                backgroundColor: "#FAF9F6",
                border: "2px solid #111827",
                borderRadius: "16px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  Montant Total Estimé (Douane Comprise)
                </div>

                <div
                  style={{
                    fontSize: "clamp(2.4rem, 3.8vw, 3.2rem)",
                    fontWeight: 800,
                    color: "#111827",
                    lineHeight: 1.1,
                    margin: "0 0 10px 0",
                  }}
                  className="tabular-nums"
                >
                  {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                </div>

                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#374151", marginBottom: "18px" }}>
                  {estimate.label}
                </div>

                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px", display: "grid", gap: "10px", fontSize: "0.85rem", color: "#4B5563" }}>
                  <div>
                    Trajet officiel : <strong>{origin} ➔ {destination}</strong>
                  </div>
                  <div>
                    Délai de livraison : <strong>{estimate.duration}</strong>
                  </div>
                  <div>
                    Dédouanement : <strong style={{ color: "#166534" }}>100% Inclus (Zéro frais caché)</strong>
                  </div>
                  <div>
                    Retrait : <strong>Gratuit agence Bingerville Safari ou livraison</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <a
                  href={getWaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="roum-btn-primary"
                  style={{ width: "100%", height: "48px", boxSizing: "border-box", fontSize: "0.92rem", justifyContent: "center" }}
                >
                  <MessageCircle size={16} />
                  <span>Confirmer ce calcul sur WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
