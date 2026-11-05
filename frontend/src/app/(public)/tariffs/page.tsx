"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plane,
  Ship,
  MessageCircle,
  Scale,
  ShieldCheck,
  Zap,
  BatteryCharging,
  Laptop,
  FileText,
  CheckCircle2,
  Download,
  Printer,
  ArrowRight,
  MapPin,
  Clock,
  Package,
} from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  getLiveTariffs,
  findTariff,
  getLiveCompanySettings,
  getAdminDestinations,
  OfficialTariff,
} from "@/shared";
import {
  RoumReceiptData,
  downloadOfficialReceiptPdf,
  printOfficialReceipt,
  buildClientReceiptWhatsAppUrl,
} from "@/utils/receiptPdf";

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());
  const [settings, setSettings] = useState<Record<string, string>>(() => getLiveCompanySettings());

  // Synchronisation temps réel avec le Dashboard Admin & la Base de Données SQLite D1
  useEffect(() => {
    // 1. Paramètres entreprise (Wave, Orange Money, Maroc) depuis SQLite D1
    fetch("/api/v1/public/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings((prev) => ({ ...prev, ...d.settings }));
          localStorage.setItem("roum_company_settings", JSON.stringify(d.settings));
        }
      })
      .catch(() => {});

    // 2. Grille tarifaire officielle en direct depuis SQLite D1
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
              pricing_basis:
                t.pricing_basis ||
                (t.mode_type === "SEA" || t.shipping_mode_type === "SEA" ? "PER_CBM" : "PER_KG"),
              currency: t.currency || "FCFA",
              price_per_unit_minor: Number(t.price_per_unit_minor) || 0,
              minimum_charge_minor:
                t.minimum_charge_minor !== undefined ? Number(t.minimum_charge_minor) : undefined,
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
  const [catalogHub, setCatalogHub] = useState<"all" | "chine" | "dubai" | "maroc" | "france">("all");

  const getDestinationsForOrigin = (orig: string) => {
    return getAdminDestinations(tariffs, orig);
  };

  const handleOriginChange = (newOrigin: string) => {
    setOrigin(newOrigin);
    const availableDests = getAdminDestinations(tariffs, newOrigin);
    if (availableDests.length > 0 && !availableDests.includes(destination)) {
      setDestination(availableDests[0]);
    }
    if (newOrigin === "Chine") {
      setFormulaKey("express");
      setCatalogHub("chine");
    } else if (newOrigin.includes("Dubaï") || newOrigin.includes("Émirats")) {
      setFormulaKey("express");
      setCatalogHub("dubai");
    } else if (newOrigin === "Maroc") {
      setFormulaKey("subsaharien");
      setCatalogHub("maroc");
    } else {
      setFormulaKey("divers");
      setCatalogHub("france");
    }
  };

  useEffect(() => {
    const validDests = getAdminDestinations(tariffs, origin);
    if (validDests.length > 0 && !validDests.includes(destination)) {
      setDestination(validDests[0]);
    }
  }, [tariffs, origin, destination]);

  const calculateEstimate = () => {
    if (origin === "Maroc") {
      let matched = findTariff(tariffs, "maroc", destination);
      if (!matched) {
        if (destination === "Côte d'Ivoire")
          matched = findTariff(tariffs, "maroc", "ci") || findTariff(tariffs, "maroc", "abidjan");
        else if (destination === "Sénégal")
          matched = findTariff(tariffs, "maroc", "sn") || findTariff(tariffs, "maroc", "dakar");
        else if (destination === "Mali")
          matched = findTariff(tariffs, "maroc", "ml") || findTariff(tariffs, "maroc", "bamako");
        else if (destination === "Burkina Faso")
          matched = findTariff(tariffs, "maroc", "bf") || findTariff(tariffs, "maroc", "ouaga");
        else if (destination === "Gabon")
          matched = findTariff(tariffs, "maroc", "ga") || findTariff(tariffs, "maroc", "libreville");
      }
      const rateMinor = matched?.price_per_unit_minor || (destination === "Côte d'Ivoire" ? 650000 : 700000);
      const ratePerKg = rateMinor / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "5 jours garantis",
        label: `Groupage Aérien Casablanca vers ${destination}`,
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
        mode: "AIR" as const,
      };
    }

    if (origin === "Chine") {
      if (formulaKey === "sea") {
        const matched = findTariff(tariffs, "chine", "bateau");
        const ratePerCbm = (matched?.price_per_unit_minor || 30000000) / 100;
        return {
          amountFcfa: Math.round(cbm * ratePerCbm),
          duration: "35 à 45 jours de mer",
          label: "Voie Maritime Groupage Conteneur (CBM)",
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
          label: "Pièces d'ordinateur & High-Tech sécurisé",
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
          label: "Batteries, Compléments & Cosmétiques",
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      if (formulaKey === "normal") {
        const matched = findTariff(tariffs, "chine", "normale");
        const ratePerKg = (matched?.price_per_unit_minor || 1000000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "10 à 14 jours",
          label: "Voie Normale Aérienne Économique",
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      const matched = findTariff(tariffs, "chine", "express");
      const ratePerKg = (matched?.price_per_unit_minor || 1200000) / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "4 à 5 jours chrono",
        label: "Voie Express Aérienne Rapide",
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
        mode: "AIR" as const,
      };
    }

    if (origin.includes("Dubaï") || origin.includes("Émirats")) {
      if (formulaKey === "sea") {
        const matched =
          findTariff(tariffs, "émirat", "bateau") || findTariff(tariffs, "duba", "bateau");
        const ratePerCbm = (matched?.price_per_unit_minor || 30000000) / 100;
        return {
          amountFcfa: Math.round(cbm * ratePerCbm),
          duration: "30 à 40 jours de mer",
          label: "Voie Maritime Groupage depuis Dubaï",
          rateFormatted: `${ratePerCbm.toLocaleString("fr-FR")} FCFA / m³`,
          mode: "SEA" as const,
        };
      }
      if (formulaKey === "special") {
        const matched =
          findTariff(tariffs, "émirat", "spécial") || findTariff(tariffs, "duba", "spécial");
        const ratePerKg = (matched?.price_per_unit_minor || 1400000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "7 à 10 jours",
          label: "Parfums & Marchandises Spéciales Dubaï",
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      if (formulaKey === "normal") {
        const matched =
          findTariff(tariffs, "émirat", "normale") || findTariff(tariffs, "duba", "normale");
        const ratePerKg = (matched?.price_per_unit_minor || 1000000) / 100;
        return {
          amountFcfa: weight * ratePerKg,
          duration: "10 à 14 jours",
          label: "Voie Normale Aérienne Dubaï",
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
          mode: "AIR" as const,
        };
      }
      const matched =
        findTariff(tariffs, "émirat", "express") || findTariff(tariffs, "duba", "express");
      const ratePerKg = (matched?.price_per_unit_minor || 1200000) / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "4 à 5 jours",
        label: "Voie Express Dubaï DXB",
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA / kg`,
        mode: "AIR" as const,
      };
    }

    if (origin === "France" || destination === "France") {
      if (formulaKey === "doc") {
        const matched = findTariff(tariffs, "france", "document");
        const rateUnit = (matched?.price_per_unit_minor || 1300000) / 100;
        return {
          amountFcfa: docCount * rateUnit,
          duration: "2 à 3 jours chrono",
          label: "Document Administratif & Pli Urgent",
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
          label: "Cosmétiques, Beurres & Liquides",
          rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA (14 €) / kg`,
          mode: "AIR" as const,
        };
      }
      const matched = findTariff(tariffs, "france", "divers");
      const ratePerKg = (matched?.price_per_unit_minor || 850000) / 100;
      return {
        amountFcfa: weight * ratePerKg,
        duration: "3 à 5 jours",
        label: "Colis Divers & Vêtements",
        rateFormatted: `${ratePerKg.toLocaleString("fr-FR")} FCFA (12 €) / kg`,
        mode: "AIR" as const,
      };
    }

    return {
      amountFcfa: weight * 10000,
      duration: "4 à 5 jours",
      label: "Transport Aérien Régulier",
      rateFormatted: "10 000 FCFA / kg",
      mode: "AIR" as const,
    };
  };

  const estimate = calculateEstimate();

  const getQuoteReceiptData = (): RoumReceiptData => {
    let qtyDesc = `${weight} kg`;
    if (formulaKey === "sea") qtyDesc = `${cbm} m³ (CBM)`;
    else if (formulaKey === "doc" || formulaKey === "tech") qtyDesc = `${docCount} unité(s)`;

    return {
      receiptTitle: "DEVIS OFFICIEL DE TRANSIT & DÉDOUANEMENT",
      reference: `DEVIS-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      clientName: "Client ROUM TRANSIT",
      clientPhone: "Confirmation via WhatsApp",
      origin,
      destination,
      optionType: "devis_tarif",
      transportMode: `${estimate.label} (${estimate.rateFormatted}) — Délai : ${estimate.duration}`,
      weightOrVolume: qtyDesc,
      shippingFeeFcfa: estimate.amountFcfa,
      grandTotalFcfa: estimate.amountFcfa,
      paymentMethodLabel: "Wave / Orange Money / Virement bancaire (100% Douane comprise)",
    };
  };

  const getWaLink = () => {
    const receiptData = getQuoteReceiptData();
    const agencyPhone = settings.whatsapp_number?.trim() || "2250153638569";
    return buildClientReceiptWhatsAppUrl(receiptData, agencyPhone);
  };

  const ORIGIN_HUBS = [
    { name: "Chine", shortLabel: "Chine", sub: "Guangzhou · Yiwu", flag: "cn" },
    { name: "Émirats Arabes Unis (Dubaï)", shortLabel: "Dubaï", sub: "Deira DXB", flag: "ae" },
    { name: "Maroc", shortLabel: "Maroc", sub: "Casablanca", flag: "ma" },
    { name: "France", shortLabel: "France", sub: "Paris CDG", flag: "fr" },
    { name: "Côte d'Ivoire", shortLabel: "Côte d'Ivoire", sub: "Abidjan", flag: "ci" },
  ];

  const getFormulasForOrigin = () => {
    if (origin === "Maroc") {
      let matched = findTariff(tariffs, "maroc", destination);
      if (!matched) {
        if (destination === "Côte d'Ivoire")
          matched = findTariff(tariffs, "maroc", "ci") || findTariff(tariffs, "maroc", "abidjan");
        else if (destination === "Sénégal")
          matched = findTariff(tariffs, "maroc", "sn") || findTariff(tariffs, "maroc", "dakar");
        else if (destination === "Mali")
          matched = findTariff(tariffs, "maroc", "ml") || findTariff(tariffs, "maroc", "bamako");
        else if (destination === "Burkina Faso")
          matched = findTariff(tariffs, "maroc", "bf") || findTariff(tariffs, "maroc", "ouaga");
        else if (destination === "Gabon")
          matched = findTariff(tariffs, "maroc", "ga") || findTariff(tariffs, "maroc", "libreville");
      }
      const rate = matched?.price_per_unit_minor
        ? (matched.price_per_unit_minor / 100).toLocaleString("fr-FR")
        : destination === "Côte d'Ivoire"
        ? "6 500"
        : "7 000";

      return [
        {
          key: "subsaharien",
          label: `Groupage Aérien Casablanca vers ${destination}`,
          delay: "5 jours garantis",
          price: `${rate} FCFA / kg`,
          mode: "AIR",
        },
      ];
    }

    if (origin === "Chine") {
      const exp = findTariff(tariffs, "chine", "express");
      const nor = findTariff(tariffs, "chine", "normale");
      const bat = findTariff(tariffs, "chine", "batterie");
      const tch = findTariff(tariffs, "chine", "ordinateur");
      const sea = findTariff(tariffs, "chine", "bateau");

      return [
        {
          key: "express",
          label: "Voie Express Avion",
          delay: "4 à 5 jours",
          price: `${exp ? (exp.price_per_unit_minor / 100).toLocaleString("fr-FR") : "12 000"} FCFA / kg`,
          mode: "AIR",
        },
        {
          key: "normal",
          label: "Voie Normale Avion",
          delay: "10 à 14 jours",
          price: `${nor ? (nor.price_per_unit_minor / 100).toLocaleString("fr-FR") : "10 000"} FCFA / kg`,
          mode: "AIR",
        },
        {
          key: "battery",
          label: "Batteries, Crèmes & Liquides",
          delay: "7 à 10 jours",
          price: `${bat ? (bat.price_per_unit_minor / 100).toLocaleString("fr-FR") : "14 000"} FCFA / kg`,
          mode: "AIR",
        },
        {
          key: "tech",
          label: "Pièces Ordinateur & High-Tech",
          delay: "4 à 7 jours",
          price: `${tch ? (tch.price_per_unit_minor / 100).toLocaleString("fr-FR") : "50 000"} FCFA / carton`,
          mode: "AIR",
        },
        {
          key: "sea",
          label: "Voie Maritime Conteneur (CBM)",
          delay: "35 à 45 jours",
          price: `${sea ? (sea.price_per_unit_minor / 100).toLocaleString("fr-FR") : "300 000"} FCFA / m³`,
          mode: "SEA",
        },
      ];
    }

    if (origin.includes("Dubaï") || origin.includes("Émirats")) {
      const exp =
        findTariff(tariffs, "émirat", "express") || findTariff(tariffs, "duba", "express");
      const nor =
        findTariff(tariffs, "émirat", "normale") || findTariff(tariffs, "duba", "normale");
      const spe =
        findTariff(tariffs, "émirat", "spécial") || findTariff(tariffs, "duba", "spécial");
      const sea =
        findTariff(tariffs, "émirat", "bateau") || findTariff(tariffs, "duba", "bateau");

      return [
        {
          key: "express",
          label: "Voie Express Dubaï DXB",
          delay: "4 à 5 jours",
          price: `${exp ? (exp.price_per_unit_minor / 100).toLocaleString("fr-FR") : "12 000"} FCFA / kg`,
          mode: "AIR",
        },
        {
          key: "normal",
          label: "Voie Normale Dubaï",
          delay: "10 à 14 jours",
          price: `${nor ? (nor.price_per_unit_minor / 100).toLocaleString("fr-FR") : "10 000"} FCFA / kg`,
          mode: "AIR",
        },
        {
          key: "special",
          label: "Parfums & Cosmétiques Dubaï",
          delay: "7 à 10 jours",
          price: `${spe ? (spe.price_per_unit_minor / 100).toLocaleString("fr-FR") : "14 000"} FCFA / kg`,
          mode: "AIR",
        },
        {
          key: "sea",
          label: "Voie Maritime Jebel Ali (CBM)",
          delay: "30 à 40 jours",
          price: `${sea ? (sea.price_per_unit_minor / 100).toLocaleString("fr-FR") : "300 000"} FCFA / m³`,
          mode: "SEA",
        },
      ];
    }

    const div = findTariff(tariffs, "france", "divers");
    const cos = findTariff(tariffs, "france", "cosmétique");
    const doc = findTariff(tariffs, "france", "document");

    return [
      {
        key: "divers",
        label: "Colis Divers & Vêtements",
        delay: "3 à 5 jours",
        price: `${div ? (div.price_per_unit_minor / 100).toLocaleString("fr-FR") : "8 500"} FCFA (12 €) / kg`,
        mode: "AIR",
      },
      {
        key: "cosm",
        label: "Cosmétiques & Liquides",
        delay: "3 à 5 jours",
        price: `${cos ? (cos.price_per_unit_minor / 100).toLocaleString("fr-FR") : "9 000"} FCFA (14 €) / kg`,
        mode: "AIR",
      },
      {
        key: "doc",
        label: "Document Administratif & Pli",
        delay: "2 à 3 jours",
        price: `${doc ? (doc.price_per_unit_minor / 100).toLocaleString("fr-FR") : "13 000"} FCFA (20 €) / pli`,
        mode: "AIR",
      },
    ];
  };

  const filteredCatalogTariffs = tariffs.filter((t) => {
    if (catalogHub === "all") return true;
    const o = (t.origin_country || "").toLowerCase();
    if (catalogHub === "chine") return o.includes("chine");
    if (catalogHub === "dubai") return o.includes("duba") || o.includes("émirat");
    if (catalogHub === "maroc") return o.includes("maroc");
    return o.includes("france") || (t.destination_country || "").toLowerCase().includes("france");
  });

  return (
    <div className="tariffs-minimal-root">
      <div className="tariffs-minimal-container">
        <ScrollReveal>
          {/* EN-TÊTE MINIMALISTE SOBRE */}
          <header className="tariffs-minimal-header">
            <div className="tariffs-minimal-eyebrow">
              <span>SIMULATEUR &amp; GRILLE TARIFAIRE OFFICIELLE</span>
            </div>
            <h1 className="tariffs-minimal-title">Tarifs de Transit &amp; Dédouanement</h1>
            <p className="tariffs-minimal-subtitle">
              Calculez le coût exact de votre expédition ou consultez la grille officielle synchronisée avec l&apos;agence.
              Dédouanement 100 % inclus, sans frais cachés.
            </p>
          </header>

          {/* GRILLE PRINCIPALE : SIMULATEUR (GAUCHE) + RÉCAPITULATIF DEVIS SOBRE (DROITE) */}
          <div className="tariffs-minimal-layout">
            {/* PANNEAU GAUCHE : CONFIGURATEUR */}
            <section className="tariffs-config-card">
              {/* 1. Hub de départ */}
              <div className="t-step-group">
                <div className="t-step-label-row">
                  <span className="t-step-index">01</span>
                  <span className="t-step-title">Pays de départ</span>
                </div>
                <div className="t-hubs-grid">
                  {ORIGIN_HUBS.map((hub) => {
                    const isSelected = origin === hub.name;
                    return (
                      <button
                        key={hub.name}
                        type="button"
                        onClick={() => handleOriginChange(hub.name)}
                        className={`t-hub-btn ${isSelected ? "active" : ""}`}
                      >
                        <div className="t-hub-btn-top">
                          <CircularFlag code={hub.flag} size={16} />
                          <span className="t-hub-btn-name">{hub.shortLabel}</span>
                        </div>
                        <span className="t-hub-btn-sub">{hub.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Destination */}
              <div className="t-step-group">
                <div className="t-step-label-row">
                  <span className="t-step-index">02</span>
                  <span className="t-step-title">Destination</span>
                </div>
                <div className="t-dest-list">
                  {getDestinationsForOrigin(origin).map((dst) => {
                    const isSelected = destination === dst;
                    return (
                      <button
                        key={dst}
                        type="button"
                        onClick={() => setDestination(dst)}
                        className={`t-dest-btn ${isSelected ? "active" : ""}`}
                      >
                        <CircularFlag countryName={dst} size={14} />
                        <span>{dst}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Mode de transport */}
              <div className="t-step-group">
                <div className="t-step-label-row">
                  <span className="t-step-index">03</span>
                  <span className="t-step-title">Formule d&apos;expédition</span>
                </div>
                <div className="t-formula-list">
                  {getFormulasForOrigin().map((f) => {
                    const isSelected = formulaKey === f.key;
                    const IconComp =
                      f.mode === "SEA"
                        ? Ship
                        : f.key === "battery"
                        ? BatteryCharging
                        : f.key === "tech"
                        ? Laptop
                        : f.key === "doc"
                        ? FileText
                        : Plane;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFormulaKey(f.key)}
                        className={`t-formula-item ${isSelected ? "active" : ""}`}
                      >
                        <div className="t-formula-left">
                          <div className="t-formula-icon">
                            <IconComp size={15} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="t-formula-name">{f.label}</div>
                            <div className="t-formula-delay">Délai : {f.delay}</div>
                          </div>
                        </div>
                        <div className="t-formula-rate">{f.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Quantité / Poids / Volume */}
              <div className="t-step-group" style={{ marginBottom: 0 }}>
                <div className="t-step-label-row">
                  <span className="t-step-index">04</span>
                  <span className="t-step-title">
                    {formulaKey === "sea"
                      ? "Volume estimé (m³)"
                      : formulaKey === "doc" || formulaKey === "tech"
                      ? "Nombre d'unités / plis"
                      : "Poids estimé (kg)"}
                  </span>
                </div>

                {formulaKey === "sea" ? (
                  <div className="t-qty-box">
                    <div className="t-qty-input-wrap">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={cbm || ""}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          const v = parseFloat(cleaned);
                          setCbm(Number.isFinite(v) && v > 0 ? v : 0.1);
                        }}
                        className="t-qty-input tabular-nums"
                      />
                      <span className="t-qty-unit">m³ (CBM)</span>
                    </div>
                    <div className="t-qty-presets">
                      {[0.5, 1, 2, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCbm(preset)}
                          className={`t-preset-chip ${cbm === preset ? "active" : ""}`}
                        >
                          {preset} m³
                        </button>
                      ))}
                    </div>
                  </div>
                ) : formulaKey === "doc" || formulaKey === "tech" ? (
                  <div className="t-qty-box">
                    <div className="t-qty-input-wrap">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={docCount || ""}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          const v = parseInt(cleaned, 10);
                          setDocCount(Number.isFinite(v) && v >= 1 ? v : 1);
                        }}
                        className="t-qty-input tabular-nums"
                      />
                      <span className="t-qty-unit">unité(s)</span>
                    </div>
                    <div className="t-qty-presets">
                      {[1, 2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDocCount(preset)}
                          className={`t-preset-chip ${docCount === preset ? "active" : ""}`}
                        >
                          {preset} {preset > 1 ? "unités" : "unité"}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="t-qty-box">
                    <div className="t-qty-input-wrap">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={weight || ""}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          const v = parseFloat(cleaned);
                          setWeight(Number.isFinite(v) && v > 0 ? v : 1);
                        }}
                        className="t-qty-input tabular-nums"
                      />
                      <span className="t-qty-unit">Kilogrammes (kg)</span>
                    </div>
                    <div className="t-qty-presets">
                      {[1, 5, 10, 25, 50, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWeight(preset)}
                          className={`t-preset-chip ${weight === preset ? "active" : ""}`}
                        >
                          {preset} kg
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* PANNEAU DROIT : CARTE DE DEVIS MINIMALISTE CLAIRE (ZÉRO ORANGE, ZÉRO LUEUR) */}
            <aside className="tariffs-summary-card">
              <div>
                <div className="t-summary-top-tag">
                  <ShieldCheck size={14} />
                  <span>ESTIMATION OFFICIELLE · DOUANE INCLUSE</span>
                </div>

                <div className="t-summary-amount-block">
                  <span className="t-summary-caption">Montant total estimé</span>
                  <div className="t-summary-price tabular-nums">
                    {estimate.amountFcfa.toLocaleString("fr-FR")} <span className="t-summary-currency">FCFA</span>
                  </div>
                  <p className="t-summary-service-label">{estimate.label}</p>
                </div>

                <div className="t-summary-specs">
                  <div className="t-spec-row">
                    <span className="t-spec-key">Corridor</span>
                    <span className="t-spec-val">
                      <CircularFlag countryName={origin} size={13} />
                      <span>{origin.includes("Dubaï") ? "Dubaï" : origin}</span>
                      <ArrowRight size={12} />
                      <CircularFlag countryName={destination} size={13} />
                      <strong>{destination}</strong>
                    </span>
                  </div>
                  <div className="t-spec-row">
                    <span className="t-spec-key">Tarif unitaire</span>
                    <span className="t-spec-val tabular-nums">{estimate.rateFormatted}</span>
                  </div>
                  <div className="t-spec-row">
                    <span className="t-spec-key">Délai estimé</span>
                    <span className="t-spec-val">{estimate.duration}</span>
                  </div>
                  <div className="t-spec-row">
                    <span className="t-spec-key">Règlement</span>
                    <span className="t-spec-val">Wave · Orange Money · Virement</span>
                  </div>
                </div>
              </div>

              <div className="t-summary-actions">
                <a
                  href={getWaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-btn-primary"
                >
                  <MessageCircle size={16} />
                  <span>Envoyer ce devis sur WhatsApp</span>
                </a>

                <div className="t-btn-secondary-grid">
                  <button
                    type="button"
                    onClick={() => downloadOfficialReceiptPdf(getQuoteReceiptData())}
                    className="t-btn-outline"
                  >
                    <Download size={14} />
                    <span>Télécharger PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => printOfficialReceipt(getQuoteReceiptData())}
                    className="t-btn-outline"
                  >
                    <Printer size={14} />
                    <span>Imprimer</span>
                  </button>
                </div>

                <div className="t-summary-footer-link">
                  <span>Commander un article sur Alibaba / 1688 ?</span>
                  <Link href="/services/commande" className="t-inline-link">
                    <span>Ouvrir le formulaire</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {/* GRILLE COMPLÈTE DES TARIFS OFFICIELS (SYNCHRONISÉE À 100 % AVEC L'ADMIN) */}
          <section className="tariffs-directory-section">
            <div className="tariffs-directory-header">
              <div>
                <span className="tariffs-directory-eyebrow">
                   BASE DE DONNÉES SYNCHRONISÉE ({filteredCatalogTariffs.length} TARIFS)
                </span>
                <h2 className="tariffs-directory-title">Grille Tarifaire Officielle</h2>
              </div>

              <div className="tariffs-filter-tabs">
                <button
                  type="button"
                  onClick={() => setCatalogHub("all")}
                  className={`t-filter-tab ${catalogHub === "all" ? "active" : ""}`}
                >
                  <span>Tous ({tariffs.length})</span>
                </button>
                {(
                  [
                    { key: "chine", label: "Chine", flag: "cn", originName: "Chine" },
                    { key: "dubai", label: "Dubaï", flag: "ae", originName: "Émirats Arabes Unis (Dubaï)" },
                    { key: "maroc", label: "Maroc", flag: "ma", originName: "Maroc" },
                    { key: "france", label: "France", flag: "fr", originName: "France" },
                  ] as const
                ).map((hub) => (
                  <button
                    key={hub.key}
                    type="button"
                    onClick={() => {
                      setCatalogHub(hub.key);
                      handleOriginChange(hub.originName);
                    }}
                    className={`t-filter-tab ${catalogHub === hub.key ? "active" : ""}`}
                  >
                    <CircularFlag code={hub.flag} size={13} />
                    <span>{hub.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="tariffs-cards-grid">
              {filteredCatalogTariffs.map((t) => {
                const isSea = t.shipping_mode_type === "SEA" || t.pricing_basis === "PER_CBM";
                const unitLabel =
                  t.pricing_basis === "PER_CBM"
                    ? "/ m³"
                    : t.pricing_basis === "PER_UNIT"
                    ? "/ unité"
                    : "/ kg";
                const priceMajor = Math.round((t.price_per_unit_minor || 0) / 100);
                return (
                  <div key={t.id} className="t-rate-card">
                    <div className="t-rate-card-head">
                      <div className="t-rate-corridor">
                        <CircularFlag countryName={t.origin_country || "Chine"} size={14} />
                        <span>{t.origin_country?.includes("Émirats") ? "Dubaï" : t.origin_country}</span>
                        <ArrowRight size={12} color="#6E675F" />
                        <CircularFlag countryName={t.destination_country || "Côte d'Ivoire"} size={14} />
                        <strong>{t.destination_country}</strong>
                      </div>
                      <span className="t-rate-badge">
                        {isSea ? <Ship size={11} /> : <Plane size={11} />}
                        <span>{isSea ? "Maritime" : "Aérien"}</span>
                      </span>
                    </div>

                    <div className="t-rate-service">
                      {t.service_name || t.shipping_mode_name}
                    </div>

                    <div className="t-rate-price-line tabular-nums">
                      <span className="t-rate-price-val">
                        {priceMajor.toLocaleString("fr-FR")} {t.currency || "FCFA"}
                      </span>
                      <span className="t-rate-price-unit">{unitLabel}</span>
                      {t.secondary_display && (
                        <span className="t-rate-secondary">{t.secondary_display}</span>
                      )}
                    </div>

                    <div className="t-rate-card-foot">
                      <span className="t-rate-meta">
                        <Clock size={12} />
                        <span>
                          {t.estimated_days_min} à {t.estimated_days_max} jours
                        </span>
                      </span>
                      <span className="t-rate-meta">
                        <CheckCircle2 size={12} />
                        <span>Douane incluse</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </ScrollReveal>
      </div>

      {/* STYLES MINIMALISTES ÉPURÉS — ZÉRO ORANGE, ZÉRO LUEUR, ZÉRO DÉPASSEMENT */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tariffs-minimal-root {
          color: #181512;
          min-height: calc(100vh - 110px);
          padding: 36px 18px 110px 18px;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .tariffs-minimal-container {
          max-width: 1120px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .tariffs-minimal-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .tariffs-minimal-eyebrow {
          display: inline-block;
          font-family: var(--c-font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6E675F;
          background: #F2EFE9;
          border: 1px solid #E5E0D8;
          padding: 5px 12px;
          border-radius: 9999px;
          margin-bottom: 14px;
        }

        .tariffs-minimal-title {
          font-family: var(--c-font-display);
          font-size: clamp(1.75rem, 3.6vw, 2.45rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: #181512;
          margin: 0 auto 10px auto;
          max-width: 720px;
        }

        .tariffs-minimal-subtitle {
          font-size: 0.95rem;
          color: #6E675F;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.55;
        }

        .tariffs-minimal-layout {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 20px;
          margin-bottom: 28px;
          align-items: start;
        }

        .tariffs-config-card {
          grid-column: span 7;
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 16px;
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          box-sizing: border-box;
          min-width: 0;
        }

        .t-step-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .t-step-label-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .t-step-index {
          font-family: var(--c-font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          color: #181512;
          background: #F2EFE9;
          border: 1px solid #E5E0D8;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .t-step-title {
          font-size: 0.86rem;
          font-weight: 700;
          color: #181512;
        }

        .t-hubs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .t-hub-btn {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #E5E0D8;
          background: #FAF8F5;
          color: #181512;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          box-sizing: border-box;
        }

        .t-hub-btn:hover {
          border-color: #181512;
        }

        .t-hub-btn.active {
          background: #181512;
          color: #FFFFFF;
          border-color: #181512;
        }

        .t-hub-btn-top {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .t-hub-btn-name {
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .t-hub-btn-sub {
          font-size: 0.68rem;
          color: #6E675F;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .t-hub-btn.active .t-hub-btn-sub {
          color: rgba(255, 255, 255, 0.72);
        }

        .t-dest-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .t-dest-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 8px;
          border: 1px solid #E5E0D8;
          background: #FAF8F5;
          color: #181512;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .t-dest-btn:hover {
          border-color: #181512;
        }

        .t-dest-btn.active {
          background: #181512;
          color: #FFFFFF;
          border-color: #181512;
        }

        .t-formula-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .t-formula-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid #E5E0D8;
          background: #FAF8F5;
          color: #181512;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          box-sizing: border-box;
          min-width: 0;
        }

        .t-formula-item:hover {
          border-color: #181512;
        }

        .t-formula-item.active {
          background: #FFFFFF;
          border: 1.5px solid #181512;
        }

        .t-formula-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .t-formula-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #F2EFE9;
          color: #181512;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .t-formula-item.active .t-formula-icon {
          background: #181512;
          color: #FFFFFF;
        }

        .t-formula-name {
          font-size: 0.84rem;
          font-weight: 700;
          color: #181512;
        }

        .t-formula-delay {
          font-size: 0.72rem;
          color: #6E675F;
        }

        .t-formula-rate {
          font-family: var(--c-font-mono);
          font-size: 0.76rem;
          font-weight: 700;
          color: #181512;
          background: #F2EFE9;
          border: 1px solid #E5E0D8;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .t-formula-item.active .t-formula-rate {
          background: #181512;
          color: #FFFFFF;
          border-color: #181512;
        }

        .t-qty-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .t-qty-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .t-qty-input {
          flex: 1;
          height: 42px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid #D5CFC5;
          background: #FAF8F5;
          font-size: 1rem;
          font-weight: 700;
          color: #181512;
          box-sizing: border-box;
          min-width: 0;
        }

        .t-qty-input:focus {
          outline: none;
          border-color: #181512;
          background: #FFFFFF;
        }

        .t-qty-unit {
          font-family: var(--c-font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          color: #6E675F;
          background: #FAF8F5;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #E5E0D8;
          white-space: nowrap;
        }

        .t-qty-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .t-preset-chip {
          padding: 5px 11px;
          border-radius: 6px;
          border: 1px solid #E5E0D8;
          background: #FFFFFF;
          color: #6E675F;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .t-preset-chip.active {
          background: #181512;
          color: #FFFFFF;
          border-color: #181512;
        }

        /* CARTE RÉCAPITULATIF DEVIS (DROITE - 5 COLONNES) */
        .tariffs-summary-card {
          grid-column: span 5;
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 16px;
          padding: 26px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 22px;
          box-sizing: border-box;
          min-width: 0;
        }

        .t-summary-top-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #181512;
          background: #F2EFE9;
          border: 1px solid #E5E0D8;
          padding: 5px 10px;
          border-radius: 6px;
        }

        .t-summary-amount-block {
          margin-top: 18px;
          padding-bottom: 18px;
          border-bottom: 1px solid #EDEAE4;
        }

        .t-summary-caption {
          font-family: var(--c-font-mono);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6E675F;
          display: block;
        }

        .t-summary-price {
          font-family: var(--c-font-display);
          font-size: clamp(1.9rem, 3.2vw, 2.5rem);
          font-weight: 800;
          color: #181512;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 6px 0;
        }

        .t-summary-currency {
          font-size: 1.1rem;
          font-weight: 700;
          color: #6E675F;
        }

        .t-summary-service-label {
          font-size: 0.84rem;
          color: #6E675F;
          margin: 0;
          line-height: 1.4;
        }

        .t-summary-specs {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .t-spec-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.8rem;
          padding-bottom: 8px;
          border-bottom: 1px dashed #EDEAE4;
          flex-wrap: wrap;
        }

        .t-spec-key {
          color: #6E675F;
          font-weight: 500;
        }

        .t-spec-val {
          color: #181512;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .t-summary-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .t-btn-primary {
          height: 44px;
          border-radius: 10px;
          background: #181512;
          color: #FFFFFF;
          font-size: 0.84rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }

        .t-btn-primary:hover {
          opacity: 0.9;
        }

        .t-btn-secondary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .t-btn-outline {
          height: 38px;
          border-radius: 8px;
          border: 1px solid #E5E0D8;
          background: #FAF8F5;
          color: #181512;
          font-size: 0.78rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .t-btn-outline:hover {
          border-color: #181512;
          background: #FFFFFF;
        }

        .t-summary-footer-link {
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px solid #EDEAE4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.76rem;
          color: #6E675F;
        }

        .t-inline-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #181512;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* GRILLE COMPLÈTE DES TARIFS */
        .tariffs-directory-section {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 16px;
          padding: 26px;
          box-sizing: border-box;
        }

        .tariffs-directory-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding-bottom: 18px;
          border-bottom: 1px solid #EDEAE4;
          margin-bottom: 20px;
        }

        .tariffs-directory-eyebrow {
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #6E675F;
          display: block;
          margin-bottom: 4px;
        }

        .tariffs-directory-title {
          font-family: var(--c-font-display);
          font-size: 1.25rem;
          font-weight: 800;
          color: #181512;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .tariffs-filter-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .t-filter-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid #E5E0D8;
          background: #FAF8F5;
          color: #6E675F;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .t-filter-tab:hover {
          color: #181512;
          border-color: #181512;
        }

        .t-filter-tab.active {
          background: #181512;
          color: #FFFFFF;
          border-color: #181512;
        }

        .tariffs-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
          gap: 12px;
        }

        .t-rate-card {
          background: #FAF8F5;
          border: 1px solid #E5E0D8;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          box-sizing: border-box;
          min-width: 0;
        }

        .t-rate-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        .t-rate-corridor {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.76rem;
          font-weight: 600;
          color: #181512;
          min-width: 0;
          flex-wrap: wrap;
        }

        .t-rate-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          color: #181512;
        }

        .t-rate-service {
          font-size: 0.85rem;
          font-weight: 700;
          color: #181512;
          line-height: 1.35;
        }

        .t-rate-price-line {
          display: flex;
          align-items: baseline;
          gap: 5px;
          flex-wrap: wrap;
        }

        .t-rate-price-val {
          font-family: var(--c-font-display);
          font-size: 1.2rem;
          font-weight: 800;
          color: #181512;
        }

        .t-rate-price-unit {
          font-size: 0.76rem;
          font-weight: 600;
          color: #6E675F;
        }

        .t-rate-secondary {
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 600;
          color: #6E675F;
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .t-rate-card-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #EAE5DC;
          font-size: 0.72rem;
          color: #6E675F;
          flex-wrap: wrap;
        }

        .t-rate-meta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        @media (max-width: 960px) {
          .tariffs-config-card,
          .tariffs-summary-card {
            grid-column: span 12;
          }
        }

        @media (max-width: 600px) {
          .tariffs-config-card,
          .tariffs-summary-card,
          .tariffs-directory-section {
            padding: 18px;
          }
          .t-btn-secondary-grid {
            grid-template-columns: 1fr;
          }
        }
      `,
        }}
      />
    </div>
  );
}
