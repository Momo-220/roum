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
  getLiveCompanySettings,
  getAdminDestinations,
  OfficialTariff,
} from "@/shared";

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());
  const [settings, setSettings] = useState<Record<string, string>>(() => getLiveCompanySettings());

  // Synchronisation temps réel avec le Dashboard Admin & la Base de Données
  useEffect(() => {
    // 1. Paramètres entreprise (Wave, Orange Money, Maroc)
    fetch("/api/v1/public/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings((prev) => ({ ...prev, ...d.settings }));
          localStorage.setItem("roum_company_settings", JSON.stringify(d.settings));
        }
      })
      .catch(() => {});

    // 2. Grille tarifaire officielle en direct
    const loadApiTariffs = () => {
      fetch("/api/v1/public/tariffs")
        .then((r) => r.json())
        .then((d) => {
          if (d.tariffs && Array.isArray(d.tariffs) && d.tariffs.length > 0) {
            const mapped: OfficialTariff[] = d.tariffs.map((t: any) => ({
              id: t.tariff_id || t.id,
              origin_country: t.origin_country || "",
              origin_city: t.origin_city || "",
              destination_country: t.destination_country || "",
              destination_city: t.destination_city || "",
              shipping_mode_name: t.mode_name || t.shipping_mode_name || t.service_name || "",
              service_name: t.service_name || t.mode_name || t.shipping_mode_name || "",
              shipping_mode_type: (t.mode_type || t.shipping_mode_type || "AIR") as "AIR" | "SEA",
              category_tag: t.category_tag || "",
              pricing_basis: t.pricing_basis || (t.mode_type === "SEA" || t.shipping_mode_type === "SEA" ? "PER_CBM" : "PER_KG"),
              currency: t.currency || "FCFA",
              price_per_unit_minor: Number(t.price_per_unit_minor) || 0,
              minimum_charge_minor: t.minimum_charge_minor !== undefined ? Number(t.minimum_charge_minor) : undefined,
              estimated_days_min: Number(t.estimated_days_min) || 3,
              estimated_days_max: Number(t.estimated_days_max) || 7,
              flyer_source: t.flyer_source || "",
              secondary_display: t.secondary_display || "",
              note: t.note || "",
              is_active: t.is_active !== undefined ? Number(t.is_active) : 1,
            }));
            setTariffs(mapped);
            localStorage.setItem("roum_tariffs_data", JSON.stringify(mapped));
          }
        })
        .catch(() => {});
    };

    loadApiTariffs();

    const handleSync = () => {
      setTariffs(getLiveTariffs());
      setSettings(getLiveCompanySettings());
      loadApiTariffs();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("roum_tariffs_updated", handleSync);
    window.addEventListener("focus", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("roum_tariffs_updated", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, []);

  const [origin, setOrigin] = useState("Chine");
  const [destination, setDestination] = useState("Côte d'Ivoire");
  const [formulaKey, setFormulaKey] = useState("express");
  const [weight, setWeight] = useState(5);
  const [cbm, setCbm] = useState(0.5);
  const [docCount, setDocCount] = useState(1);

  // Extraction 100% dynamique : SEULEMENT les destinations configurées dans l'Admin
  const getDestinationsForOrigin = (orig: string) => {
    return getAdminDestinations(tariffs, orig);
  };

  const handleOriginChange = (newOrigin: string) => {
    setOrigin(newOrigin);
    const availableDests = getAdminDestinations(tariffs, newOrigin);
    if (availableDests.length > 0 && !availableDests.includes(destination)) {
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

  // Maintient la destination sélectionnée toujours alignée avec les destinations configurées par l'Admin
  useEffect(() => {
    const validDests = getAdminDestinations(tariffs, origin);
    if (validDests.length > 0 && !validDests.includes(destination)) {
      setDestination(validDests[0]);
    }
  }, [tariffs, origin, destination]);

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
      label: `Transport Aérien Régulier (10 000 FCFA / kg)`,
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
        backgroundColor: "transparent",
        color: "var(--c-text-main)",
        minHeight: "calc(100vh - 110px)",
        padding: "24px 16px 110px 16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* Titre & Explications Limpides */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div className="client-eyebrow" style={{ justifyContent: "center", marginBottom: "12px" }}>
              <span style={{ color: "var(--c-accent-red)" }}>●</span>
              <span>SIMULATEUR DE COTATION IMMÉDIATE</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--c-font-display)",
                fontSize: "clamp(1.4rem, 4.4vw, 2.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: "var(--c-text-main)",
                margin: "0 0 10px 0",
              }}
            >
              Estimez le Prix Exact de votre Colis
            </h1>

            <p style={{ fontSize: "1.02rem", color: "var(--c-text-muted)", margin: "0 auto", maxWidth: "660px", lineHeight: 1.55 }}>
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

              {/* 3. Formule / Moyen de transport selon la destination */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                  3. Formule &amp; Moyen de transport
                </label>
                <div style={{ display: "grid", gap: "8px" }}>
                  {origin === "Maroc" && (() => {
                    let matched = findTariff(tariffs, "maroc", destination);
                    if (!matched) {
                      if (destination === "Côte d'Ivoire") matched = findTariff(tariffs, "maroc", "ci") || findTariff(tariffs, "maroc", "abidjan");
                      else if (destination === "Sénégal") matched = findTariff(tariffs, "maroc", "sn") || findTariff(tariffs, "maroc", "dakar");
                      else if (destination === "Mali") matched = findTariff(tariffs, "maroc", "ml") || findTariff(tariffs, "maroc", "bamako");
                      else if (destination === "Burkina Faso") matched = findTariff(tariffs, "maroc", "bf") || findTariff(tariffs, "maroc", "ouaga");
                      else if (destination === "Gabon") matched = findTariff(tariffs, "maroc", "ga") || findTariff(tariffs, "maroc", "libreville");
                    }
                    const rate = matched?.price_per_unit_minor ? (matched.price_per_unit_minor / 100).toLocaleString("fr-FR") : (destination === "Côte d'Ivoire" ? "6 500" : "7 000");

                    return [
                      { key: "subsaharien", label: `Groupage Aérien Casablanca ➔ ${destination} (5 jours)`, note: `Vol direct · ${rate} FCFA/kg` },
                    ];
                  })().map((f) => (
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

                  {origin === "Chine" && (() => {
                      const exp = findTariff(tariffs, "chine", "express");
                      const nor = findTariff(tariffs, "chine", "normale");
                      const bat = findTariff(tariffs, "chine", "batterie");
                      const tch = findTariff(tariffs, "chine", "ordinateur");
                      const sea = findTariff(tariffs, "chine", "bateau");

                      const expRate = exp ? (exp.price_per_unit_minor / 100).toLocaleString("fr-FR") : "12 000";
                      const norRate = nor ? (nor.price_per_unit_minor / 100).toLocaleString("fr-FR") : "10 000";
                      const batRate = bat ? (bat.price_per_unit_minor / 100).toLocaleString("fr-FR") : "14 000";
                      const tchRate = tch ? (tch.price_per_unit_minor / 100).toLocaleString("fr-FR") : "50 000";
                      const seaRate = sea ? (sea.price_per_unit_minor / 100).toLocaleString("fr-FR") : "300 000";

                      return [
                        { key: "express", label: "Voie Express Avion (4-5 jours)", note: `Ultra rapide · ${expRate} F/kg` },
                        { key: "normal", label: "Voie Normale Avion (2 semaines)", note: `Économique · ${norRate} F/kg` },
                        { key: "battery", label: "Batteries, Crèmes & Liquides", note: `Réglementé · ${batRate} F/kg` },
                        { key: "tech", label: "Pièces Ordinateur & Téléphones", note: `Sécurisé · ${tchRate} F le carton` },
                        { key: "sea", label: "Par Bateau au Mètre Cube (m³)", note: `Gros cartons · ${seaRate} F/m³` },
                      ];
                    })().map((f) => (
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

                    {(origin.includes("Dubaï") || origin.includes("Émirats")) && (() => {
                      const exp = findTariff(tariffs, "émirat", "express") || findTariff(tariffs, "duba", "express");
                      const nor = findTariff(tariffs, "émirat", "normale") || findTariff(tariffs, "duba", "normale");
                      const spe = findTariff(tariffs, "émirat", "spécial") || findTariff(tariffs, "duba", "spécial");
                      const sea = findTariff(tariffs, "émirat", "bateau") || findTariff(tariffs, "duba", "bateau");

                      const expRate = exp ? (exp.price_per_unit_minor / 100).toLocaleString("fr-FR") : "12 000";
                      const norRate = nor ? (nor.price_per_unit_minor / 100).toLocaleString("fr-FR") : "10 000";
                      const speRate = spe ? (spe.price_per_unit_minor / 100).toLocaleString("fr-FR") : "14 000";
                      const seaRate = sea ? (sea.price_per_unit_minor / 100).toLocaleString("fr-FR") : "300 000";

                      return [
                        { key: "express", label: "Voie Express Dubaï (4-5 jours)", note: `Vol direct · ${expRate} F/kg` },
                        { key: "normal", label: "Voie Normale Dubaï (2 semaines)", note: `Standard · ${norRate} F/kg` },
                        { key: "special", label: "Parfums & Cosmétiques Dubaï", note: `Spécial · ${speRate} F/kg` },
                        { key: "sea", label: "Par Bateau au Mètre Cube (m³)", note: `Jebel Ali · ${seaRate} F/m³` },
                      ];
                    })().map((f) => (
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

                    {(origin === "France" || destination === "France") && (() => {
                      const div = findTariff(tariffs, "france", "divers");
                      const cos = findTariff(tariffs, "france", "cosmétique");
                      const doc = findTariff(tariffs, "france", "document");

                      const divRate = div ? (div.price_per_unit_minor / 100).toLocaleString("fr-FR") : "8 500";
                      const cosRate = cos ? (cos.price_per_unit_minor / 100).toLocaleString("fr-FR") : "9 000";
                      const docRate = doc ? (doc.price_per_unit_minor / 100).toLocaleString("fr-FR") : "13 000";

                      return [
                        { key: "divers", label: "Colis Divers & Vêtements", note: `${divRate} F / 12 € le kg` },
                        { key: "cosm", label: "Cosmétiques & Liquides", note: `${cosRate} F / 14 € le kg` },
                        { key: "doc", label: "Document Administratif & Pli", note: `${docRate} F / 20 € le pli` },
                      ];
                    })().map((f) => (
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
                    Retrait : <strong>Gratuit en agence locale ou livraison à destination</strong>
                  </div>
                </div>

                {/* Moyens de Paiement Autorisés configurés par l'Admin */}
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #D1D5DB" }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", color: "#111827", letterSpacing: "0.04em", marginBottom: "8px" }}>
                    Moyens de Règlement Acceptés (Configurés par la Direction) :
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px", fontSize: "0.78rem" }}>
                    {settings.payment_wave_ci && (
                      <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
                        <strong style={{ color: "#1D4ED8" }}>Wave : </strong>
                        <span>{settings.payment_wave_ci}</span>
                      </div>
                    )}
                    {settings.payment_orange_money_ci && (
                      <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
                        <strong style={{ color: "#EA580C" }}>Orange Money : </strong>
                        <span>{settings.payment_orange_money_ci}</span>
                      </div>
                    )}
                    {settings.payment_morocco_bank && (
                      <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
                        <strong style={{ color: "#B91C1C" }}>Maroc : </strong>
                        <span>{settings.payment_morocco_bank}</span>
                      </div>
                    )}
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
