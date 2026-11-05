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
  const [catalogHub, setCatalogHub] = useState<"chine" | "dubai" | "maroc" | "france">("chine");

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
        duration: "5 jours chrono garantis",
        label: `Groupage Aérien Casablanca ➔ ${destination}`,
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
          label: `Groupage Aérien Casablanca ➔ ${destination}`,
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
    const o = (t.origin_country || "").toLowerCase();
    if (catalogHub === "chine") return o.includes("chine");
    if (catalogHub === "dubai") return o.includes("duba") || o.includes("émirat");
    if (catalogHub === "maroc") return o.includes("maroc");
    return o.includes("france") || (t.destination_country || "").toLowerCase().includes("france");
  });

  return (
    <div className="services-page-root">
      <div className="services-container">
        <ScrollReveal>
          {/* ========================================================
              EN-TÊTE ÉDITORIAL LUXE (IDENTIQUE À LA PAGE SERVICES)
             ======================================================== */}
          <header className="services-header">
            <div className="services-badge-category">
              <span className="dot">●</span>
              <span>02 / SIMULATEUR &amp; GRILLE TARIFAIRE OFFICIELLE</span>
            </div>
            <h1 className="services-title">Estimez le Tarif Exact de votre Colis.</h1>
            <p className="services-desc">
              Sélectionnez votre hub de départ, votre destination et votre voie d&apos;acheminement.
              <strong> Dédouanement 100% inclus</strong>, sans aucun frais caché à l&apos;arrivée.
            </p>
          </header>

          {/* ========================================================
              GRILLE BENTO ASYMÉTRIQUE (CONFIGURATEUR 7 COL + CARTE DEVIS 5 COL)
             ======================================================== */}
          <div className="bento-grid">
            {/* CARTE GAUCHE (7 COLONNES) : CONFIGURATEUR INTERACTIF ÉDITORIAL */}
            <section className="bento-config-panel">
              {/* 1. Hub de départ */}
              <div className="config-step-block">
                <div className="config-step-header">
                  <span className="config-step-num">01</span>
                  <span className="config-step-title">Hub de départ international</span>
                </div>
                <div className="hub-capsules-grid">
                  {ORIGIN_HUBS.map((hub) => {
                    const isSelected = origin === hub.name;
                    return (
                      <button
                        key={hub.name}
                        type="button"
                        onClick={() => handleOriginChange(hub.name)}
                        className={`hub-capsule-card ${isSelected ? "active" : ""}`}
                      >
                        <div className="hub-capsule-top">
                          <CircularFlag code={hub.flag} size={18} />
                          <span className="hub-capsule-name">{hub.shortLabel}</span>
                        </div>
                        <span className="hub-capsule-sub">{hub.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Destination d'arrivée */}
              <div className="config-step-block">
                <div className="config-step-header">
                  <span className="config-step-num">02</span>
                  <span className="config-step-title">Destination d&apos;arrivée</span>
                </div>
                <div className="dest-pills-wrap">
                  {getDestinationsForOrigin(origin).map((dst) => {
                    const isSelected = destination === dst;
                    return (
                      <button
                        key={dst}
                        type="button"
                        onClick={() => setDestination(dst)}
                        className={`dest-pill-btn ${isSelected ? "active" : ""}`}
                      >
                        <CircularFlag countryName={dst} size={15} />
                        <span>{dst}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Voie d'acheminement & Formule */}
              <div className="config-step-block">
                <div className="config-step-header">
                  <span className="config-step-num">03</span>
                  <span className="config-step-title">Voie d&apos;acheminement &amp; Formule</span>
                </div>
                <div className="formulas-stack">
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
                        className={`formula-row-card ${isSelected ? "active" : ""}`}
                      >
                        <div className="formula-row-left">
                          <div className={`formula-icon-box ${isSelected ? "active" : ""}`}>
                            <IconComp size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="formula-row-label">{f.label}</div>
                            <div className="formula-row-delay">Délai moyen : {f.delay}</div>
                          </div>
                        </div>
                        <div className="formula-row-price">{f.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Poids, Volume ou Nombre de plis */}
              <div className="config-step-block" style={{ marginBottom: 0 }}>
                <div className="config-step-header">
                  <span className="config-step-num">04</span>
                  <span className="config-step-title">
                    {formulaKey === "sea"
                      ? "Volume estimé en Mètre Cube (m³)"
                      : formulaKey === "doc" || formulaKey === "tech"
                      ? "Nombre de plis ou cartons sécurisés"
                      : "Poids estimé du colis (en kg)"}
                  </span>
                </div>

                {formulaKey === "sea" ? (
                  <div className="qty-control-wrap">
                    <div className="qty-input-row">
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
                        className="qty-number-input tabular-nums"
                      />
                      <span className="qty-unit-badge">m³ (CBM)</span>
                    </div>
                    <div className="qty-presets-row">
                      {[0.5, 1, 2, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCbm(preset)}
                          className={`qty-preset-pill ${cbm === preset ? "active" : ""}`}
                        >
                          {preset} m³
                        </button>
                      ))}
                    </div>
                  </div>
                ) : formulaKey === "doc" || formulaKey === "tech" ? (
                  <div className="qty-control-wrap">
                    <div className="qty-input-row">
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
                        className="qty-number-input tabular-nums"
                      />
                      <span className="qty-unit-badge">unité(s)</span>
                    </div>
                    <div className="qty-presets-row">
                      {[1, 2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDocCount(preset)}
                          className={`qty-preset-pill ${docCount === preset ? "active" : ""}`}
                        >
                          {preset} {preset > 1 ? "unités" : "unité"}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="qty-control-wrap">
                    <div className="qty-input-row">
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
                        className="qty-number-input tabular-nums"
                      />
                      <span className="qty-unit-badge">Kilogrammes (kg)</span>
                    </div>
                    <div className="qty-presets-row">
                      {[1, 5, 10, 25, 50, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWeight(preset)}
                          className={`qty-preset-pill ${weight === preset ? "active" : ""}`}
                        >
                          {preset} kg
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CARTE DROITE (5 COLONNES) : CARTE BENTO SOMBRE DEVIS OFFICIEL */}
            <article className="bento-card card-quote-result">
              <img
                src={
                  estimate.mode === "SEA"
                    ? "/images/services/maritime_new.jpg"
                    : "/images/services/aerien_new.jpg"
                }
                alt="Cotation Officielle Roum Transit"
                className="bento-card-bg"
              />
              <div className="bento-scrim-strong" />
              <div className="bento-content">
                <div>
                  <div className="bento-tag">
                    <span className="green-dot" />
                    <span>COTATION CERTIFIÉE · DOUANE 100% INCLUSE</span>
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <div className="quote-eyebrow-label">MONTANT TOTAL ESTIMÉ</div>
                    <div className="bento-stat-highlight tabular-nums" style={{ color: "#FFA066", fontSize: "clamp(2rem, 3.4vw, 2.7rem)", margin: "6px 0 8px 0" }}>
                      {estimate.amountFcfa.toLocaleString("fr-FR")} FCFA
                    </div>
                    <p className="bento-card-subtitle" style={{ marginBottom: "14px" }}>
                      {estimate.label}
                    </p>
                  </div>

                  <div className="options-duo" style={{ marginTop: "10px", marginBottom: "14px" }}>
                    <div className="option-box">
                      <span className="option-tag">Corridor Officiel</span>
                      <p className="option-desc" style={{ display: "inline-flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                        <CircularFlag countryName={origin} size={13} />
                        <span>{origin.includes("Dubaï") ? "Dubaï" : origin}</span>
                        <span>➔</span>
                        <CircularFlag countryName={destination} size={13} />
                        <strong>{destination}</strong>
                      </p>
                    </div>
                    <div className="option-box">
                      <span className="option-tag">Délai &amp; Tarif</span>
                      <p className="option-desc">
                        {estimate.duration} · <strong>{estimate.rateFormatted}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="bento-bullets">
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Dédouanement complet inclus (Zéro frais surprise)</span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>Pesée vidéo certifiée dès réception en entrepôt</span>
                    </div>
                    <div className="bento-bullet">
                      <span className="bento-bullet-dot" />
                      <span>
                        Règlement :{" "}
                        <strong>
                          Wave ({settings.payment_wave_ci || "+225 01 53 63 85 69"}) · Orange Money · Maroc
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="quote-actions-stack">
                  <div className="quote-pdf-row">
                    <button
                      type="button"
                      onClick={() => downloadOfficialReceiptPdf(getQuoteReceiptData())}
                      className="quote-glass-btn"
                    >
                      <Download size={14} />
                      <span>Télécharger PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => printOfficialReceipt(getQuoteReceiptData())}
                      className="quote-glass-btn"
                    >
                      <Printer size={14} />
                      <span>Imprimer Devis</span>
                    </button>
                  </div>

                  <a
                    href={getWaLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quote-wa-primary-btn"
                  >
                    <MessageCircle size={17} />
                    <span>Envoyer ce devis par WhatsApp à l&apos;agence</span>
                  </a>

                  <div className="bento-bottom-row" style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.72)" }}>
                      Vous avez un lien Alibaba / 1688 ?
                    </span>
                    <Link href="/services/commande" className="bento-cta-pill">
                      <span>Commander un article</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* ========================================================
              BLOC GRILLE TARIFAIRE PAR CORRIDOR (STYLE BOARDING PASS DE /SERVICES)
             ======================================================== */}
          <div className="shipping-pass-block">
            <div className="pass-tabs-header">
              <div className="pass-header-info">
                <span className="pass-label">GRILLE TARIFAIRE OFFICIELLE SYNCHRONISÉE EN DIRECT</span>
                <h3 className="pass-headline">Catalogue des Tarifs par Hub de Départ</h3>
              </div>

              <div className="pass-warehouse-capsules">
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
                    className={`pass-capsule-btn ${catalogHub === hub.key ? "active" : ""}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <CircularFlag code={hub.flag} size={14} />
                    <span>{hub.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="tariff-catalog-grid">
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
                  <div key={t.id} className="tariff-catalog-card">
                    <div className="tariff-card-top">
                      <div className="tariff-corridor-badge">
                        <CircularFlag countryName={t.origin_country || "Chine"} size={14} />
                        <span>{t.origin_country?.includes("Émirats") ? "Dubaï" : t.origin_country}</span>
                        <span style={{ color: "#CC4E16" }}>➔</span>
                        <CircularFlag countryName={t.destination_country || "Côte d'Ivoire"} size={14} />
                        <strong>{t.destination_country}</strong>
                      </div>
                      <span className={`tariff-mode-pill ${isSea ? "sea" : "air"}`}>
                        {isSea ? <Ship size={12} /> : <Plane size={12} />}
                        <span>{isSea ? "Bateau" : "Avion"}</span>
                      </span>
                    </div>

                    <div className="tariff-service-title">
                      {t.service_name || t.shipping_mode_name}
                    </div>

                    <div className="tariff-price-row tabular-nums">
                      <span className="tariff-price-amount">
                        {priceMajor.toLocaleString("fr-FR")} {t.currency || "FCFA"}
                      </span>
                      <span className="tariff-price-unit">{unitLabel}</span>
                      {t.secondary_display && (
                        <span className="tariff-secondary-pill">{t.secondary_display}</span>
                      )}
                    </div>

                    <div className="tariff-card-footer">
                      <span className="tariff-delay-text">
                        <Clock size={12} />
                        <span>
                          Délai : {t.estimated_days_min} à {t.estimated_days_max} jours
                        </span>
                      </span>
                      <span className="tariff-customs-tag">
                        <CheckCircle2 size={12} color="#166534" />
                        <span>Douane incluse</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================
              BANDEAU DE GARANTIES ÉDITORIAL (IDENTIQUE À /SERVICES)
             ======================================================== */}
          <div className="services-guarantees-bar">
            <div className="guarantee-item">
              <ShieldCheck size={22} color="#166534" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="guarantee-title">Douane 100% comprise</div>
                <div className="guarantee-desc">Zéro frais surprise à l&apos;arrivée à destination</div>
              </div>
            </div>
            <div className="guarantee-item">
              <MapPin size={22} color="var(--c-text-main)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="guarantee-title">Pesée Vidéo Magasin</div>
                <div className="guarantee-desc">Colis pesés et filmés dès réception en entrepôt</div>
              </div>
            </div>
            <div className="guarantee-item">
              <Clock size={22} color="var(--c-text-main)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="guarantee-title">Délais scellés</div>
                <div className="guarantee-desc">Avion 4 à 5 jours chrono · Bateau hebdomadaire</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ========================================================
          STYLES CSS ÉDITORIAUX BENTO (ALIGNÉS SUR LA PAGE SERVICES)
         ======================================================== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .services-page-root {
          background-color: transparent;
          color: var(--c-text-main);
          min-height: calc(100vh - 110px);
          padding: 32px 18px 120px 18px;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .services-container {
          max-width: 1140px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .services-header {
          text-align: center;
          margin-bottom: 38px;
        }

        .services-badge-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--c-text-light);
          margin-bottom: 12px;
        }

        .services-badge-category .dot {
          color: #CC4E16;
        }

        .services-title {
          font-family: var(--c-font-display);
          font-size: clamp(1.8rem, 4vw, 2.7rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.12;
          color: var(--c-text-main);
          margin: 0 auto 12px auto;
          max-width: 780px;
        }

        .services-desc {
          font-size: 0.98rem;
          color: var(--c-text-muted);
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* GRILLE BENTO 12 COLONNES */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 18px;
          margin-bottom: 32px;
          align-items: stretch;
        }

        /* PANNEAU CONFIGURATEUR (7 COLONNES) */
        .bento-config-panel {
          grid-column: span 7;
          background-color: #FFFFFF;
          border-radius: 24px;
          padding: 26px 28px;
          border: 1px solid rgba(20, 13, 9, 0.08);
          box-shadow: 0 10px 30px -8px rgba(20, 13, 9, 0.06);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 20px;
          box-sizing: border-box;
          min-width: 0;
        }

        .config-step-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .config-step-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .config-step-num {
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 800;
          color: #CC4E16;
          background: rgba(204, 78, 22, 0.1);
          padding: 2px 7px;
          border-radius: 9999px;
          letter-spacing: 0.06em;
        }

        .config-step-title {
          font-size: 0.84rem;
          font-weight: 800;
          color: #140D09;
          letter-spacing: -0.01em;
        }

        .hub-capsules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
          gap: 8px;
        }

        .hub-capsule-card {
          padding: 10px 12px;
          border-radius: 14px;
          border: 1.5px solid rgba(20, 13, 9, 0.1);
          background-color: #FAF7F2;
          color: #140D09;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s ease;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          box-sizing: border-box;
        }

        .hub-capsule-card:hover {
          border-color: rgba(204, 78, 22, 0.45);
        }

        .hub-capsule-card.active {
          background-color: #1A130F;
          color: #FFFFFF;
          border-color: #1A130F;
          box-shadow: 0 6px 16px rgba(26, 19, 15, 0.18);
        }

        .hub-capsule-top {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .hub-capsule-name {
          font-size: 0.82rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hub-capsule-sub {
          font-size: 0.68rem;
          color: var(--c-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hub-capsule-card.active .hub-capsule-sub {
          color: #FFA066;
        }

        .dest-pills-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dest-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 9999px;
          border: 1.5px solid rgba(20, 13, 9, 0.1);
          background-color: #FAF7F2;
          color: #140D09;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .dest-pill-btn.active {
          background-color: #1A130F;
          color: #FFFFFF;
          border-color: #1A130F;
        }

        .formulas-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .formula-row-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          border: 1.5px solid rgba(20, 13, 9, 0.09);
          background-color: #FAF7F2;
          color: #140D09;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s ease;
          box-sizing: border-box;
          min-width: 0;
        }

        .formula-row-card.active {
          background-color: #FFFFFF;
          border-color: #CC4E16;
          box-shadow: 0 4px 14px rgba(204, 78, 22, 0.12);
        }

        .formula-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .formula-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(20, 13, 9, 0.06);
          color: #140D09;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .formula-icon-box.active {
          background: #1A130F;
          color: #FFA066;
        }

        .formula-row-label {
          font-size: 0.84rem;
          font-weight: 800;
          color: #140D09;
        }

        .formula-row-delay {
          font-size: 0.72rem;
          color: var(--c-text-muted);
        }

        .formula-row-price {
          font-family: var(--c-font-mono);
          font-size: 0.78rem;
          font-weight: 800;
          color: #CC4E16;
          background: rgba(204, 78, 22, 0.1);
          padding: 4px 10px;
          border-radius: 9999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .qty-control-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .qty-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .qty-number-input {
          flex: 1;
          height: 44px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(20, 13, 9, 0.15);
          background: #FAF7F2;
          font-size: 1.05rem;
          font-weight: 800;
          color: #140D09;
          box-sizing: border-box;
          min-width: 0;
        }

        .qty-unit-badge {
          font-family: var(--c-font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--c-text-muted);
          background: #FAF7F2;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(20, 13, 9, 0.08);
          white-space: nowrap;
        }

        .qty-presets-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .qty-preset-pill {
          padding: 5px 12px;
          border-radius: 9999px;
          border: 1px solid rgba(20, 13, 9, 0.12);
          background: #FFFFFF;
          color: var(--c-text-secondary);
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .qty-preset-pill.active {
          background: #1A130F;
          color: #FFFFFF;
          border-color: #1A130F;
        }

        /* CARTE DROITE BENTO (5 COLONNES) */
        .bento-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background-color: #1A130F;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 30px -8px rgba(20, 13, 9, 0.18);
          box-sizing: border-box;
          min-width: 0;
        }

        .card-quote-result {
          grid-column: span 5;
        }

        .bento-card-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          opacity: 0.35;
        }

        .bento-scrim-strong {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            180deg,
            rgba(26, 19, 15, 0.86) 0%,
            rgba(20, 13, 9, 0.96) 60%,
            rgba(20, 13, 9, 0.99) 100%
          );
          pointer-events: none;
        }

        .bento-content {
          position: relative;
          z-index: 3;
          padding: 26px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          min-width: 0;
        }

        .bento-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.92);
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(10px);
          width: max-content;
          max-width: 100%;
        }

        .bento-tag .green-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #22C55E;
          flex-shrink: 0;
        }

        .quote-eyebrow-label {
          font-family: var(--c-font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.68);
          text-transform: uppercase;
        }

        .bento-stat-highlight {
          font-family: var(--c-font-display);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }

        .bento-card-subtitle {
          font-size: 0.86rem;
          color: rgba(255, 255, 255, 0.88);
          line-height: 1.4;
          margin: 0;
        }

        .options-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .option-box {
          border-left: 2px solid #FFA066;
          padding-left: 10px;
          min-width: 0;
        }

        .option-tag {
          font-family: var(--c-font-mono);
          font-size: 0.66rem;
          font-weight: 700;
          color: #FFA066;
          display: block;
          margin-bottom: 3px;
          text-transform: uppercase;
        }

        .option-desc {
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.35;
          margin: 0;
        }

        .bento-bullets {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 8px;
        }

        .bento-bullet {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }

        .bento-bullet-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #FFA066;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .quote-actions-stack {
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quote-pdf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .quote-glass-btn {
          height: 40px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .quote-glass-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .quote-wa-primary-btn {
          height: 46px;
          border-radius: 9999px;
          background: #CC4E16;
          color: #FFFFFF;
          font-size: 0.86rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 8px 20px rgba(204, 78, 22, 0.35);
          transition: all 0.2s ease;
        }

        .quote-wa-primary-btn:hover {
          background: #E05A1E;
          transform: translateY(-1px);
        }

        .bento-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .bento-cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #FFA066;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
        }

        /* BLOC CATALOGUE DES TARIFS (STYLE BOARDING PASS DE /SERVICES) */
        .shipping-pass-block {
          margin-top: 24px;
          background-color: #FFFFFF;
          border-radius: 20px;
          padding: 26px 30px;
          box-shadow: 0 4px 24px rgba(20, 13, 9, 0.05);
          border: 1px solid rgba(20, 13, 9, 0.07);
          box-sizing: border-box;
        }

        .pass-tabs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px dashed rgba(20, 13, 9, 0.14);
          margin-bottom: 22px;
        }

        .pass-label {
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #CC4E16;
          display: block;
          margin-bottom: 4px;
        }

        .pass-headline {
          font-family: var(--c-font-display);
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--c-text-main);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .pass-warehouse-capsules {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pass-capsule-btn {
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid rgba(20, 13, 9, 0.12);
          background-color: #FAF7F2;
          color: var(--c-text-secondary);
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .pass-capsule-btn.active {
          background-color: #140D09;
          color: #FFFFFF;
          border-color: #140D09;
        }

        .tariff-catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .tariff-catalog-card {
          background: #FAF7F2;
          border: 1px solid rgba(20, 13, 9, 0.08);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          box-sizing: border-box;
          min-width: 0;
        }

        .tariff-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tariff-corridor-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.76rem;
          font-weight: 700;
          color: #140D09;
        }

        .tariff-mode-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .tariff-mode-pill.air {
          background: rgba(204, 78, 22, 0.12);
          color: #CC4E16;
        }

        .tariff-mode-pill.sea {
          background: rgba(15, 118, 110, 0.12);
          color: #0F766E;
        }

        .tariff-service-title {
          font-size: 0.88rem;
          font-weight: 800;
          color: #140D09;
          line-height: 1.3;
        }

        .tariff-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
        }

        .tariff-price-amount {
          font-family: var(--c-font-display);
          font-size: 1.25rem;
          font-weight: 800;
          color: #140D09;
        }

        .tariff-price-unit {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--c-text-muted);
        }

        .tariff-secondary-pill {
          font-family: var(--c-font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          color: #CC4E16;
          background: rgba(204, 78, 22, 0.1);
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .tariff-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(20, 13, 9, 0.06);
          font-size: 0.72rem;
          color: var(--c-text-muted);
          flex-wrap: wrap;
        }

        .tariff-delay-text,
        .tariff-customs-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }

        /* BANDEAU GARANTIES */
        .services-guarantees-bar {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(20, 13, 9, 0.07);
          border-radius: 16px;
          padding: 18px 24px;
          box-sizing: border-box;
        }

        .guarantee-item {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .guarantee-title {
          font-size: 0.86rem;
          font-weight: 800;
          color: var(--c-text-main);
        }

        .guarantee-desc {
          font-size: 0.76rem;
          color: var(--c-text-muted);
        }

        @media (max-width: 960px) {
          .bento-config-panel,
          .card-quote-result {
            grid-column: span 12;
          }
          .services-guarantees-bar {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .bento-config-panel,
          .bento-content,
          .shipping-pass-block {
            padding: 18px;
          }
          .options-duo,
          .quote-pdf-row {
            grid-template-columns: 1fr;
          }
        }
      `,
        }}
      />
    </div>
  );
}
