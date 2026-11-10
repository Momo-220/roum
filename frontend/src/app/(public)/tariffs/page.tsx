"use client";

import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { siteText } from "@/shared/siteContent";
import { getSupportPhoneDigits } from "@/shared";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plane,
  Ship,
  BatteryCharging,
  Laptop,
  FileText,
  Download,
  Printer,
  ArrowRight,
  Package,
} from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { GaugeControl } from "@/components/GaugeControl";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  findTariff,
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
  const { tariffs, settings } = usePublicCatalog();

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
      reference: `DEVIS-${new Date().toISOString().slice(0, 16).replace(/\D/g, "")}`,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      clientName: "",
      clientPhone: "",
      origin,
      destination,
      optionType: "devis_tarif",
      transportMode: `${estimate.label} (${estimate.rateFormatted}) — Délai : ${estimate.duration}`,
      weightOrVolume: qtyDesc,
      shippingFeeFcfa: estimate.amountFcfa,
      grandTotalFcfa: estimate.amountFcfa,
      paymentMethodLabel: "Wave / Orange Money / Virement bancaire (100% Douane comprise)",
      supportPhone: settings.whatsapp_official_number,
    };
  };

  // Le formulaire d'envoi reprend ce que le client vient de régler sur la jauge.
  const getSendParcelLink = () => {
    const params = new URLSearchParams({ depart: origin, arrivee: destination, mode: estimate.mode });
    if (estimate.mode === "SEA") params.set("volume", String(cbm));
    else if (formulaKey !== "doc" && formulaKey !== "tech") params.set("poids", String(weight));
    return `/services/envoi?${params.toString()}`;
  };

  const getWaLink = () => {
    const receiptData = getQuoteReceiptData();
    return buildClientReceiptWhatsAppUrl(receiptData, getSupportPhoneDigits(settings));
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
    const o = (t.origin_country || "").toLowerCase();
    if (catalogHub === "chine") return o.includes("chine");
    if (catalogHub === "dubai") return o.includes("duba") || o.includes("émirat");
    if (catalogHub === "maroc") return o.includes("maroc");
    return o.includes("france") || (t.destination_country || "").toLowerCase().includes("france");
  });

  // Une seule ligne par service, regroupée par trajet : le trajet n'est plus répété sur chaque tarif.
  const catalogGroups = filteredCatalogTariffs.reduce<Array<{ route: string; items: OfficialTariff[] }>>(
    (groups, tariff) => {
      const from = tariff.origin_country?.includes("Émirats") ? "Dubaï" : tariff.origin_country;
      const route = `${from} → ${tariff.destination_country}`;
      const group = groups.find((entry) => entry.route === route);
      if (group) group.items.push(tariff);
      else groups.push({ route, items: [tariff] });
      return groups;
    },
    []
  );

  const quantityUnit = formulaKey === "sea" ? "m³" : formulaKey === "doc" || formulaKey === "tech" ? "unité(s)" : "kg";

  return (
    <div className="tz-root">
      <div className="tz-container">
        <ScrollReveal>
          <header className="tz-header">
            <span className="tz-eyebrow">{siteText(settings, "tariffs_kicker")}</span>
            <h1 className="tz-title">{siteText(settings, "tariffs_title")}</h1>
            <p className="tz-lead">{siteText(settings, "tariffs_text")}</p>
          </header>

          <div className="tz-layout">
            <section className="tz-config" aria-label="Calculateur de tarif">
              <div className="tz-step">
                <h2 className="tz-step-title">D&apos;où part votre colis&nbsp;?</h2>
                <div className="tz-tabs">
                  {ORIGIN_HUBS.map((hub) => (
                    <button
                      key={hub.name}
                      type="button"
                      onClick={() => handleOriginChange(hub.name)}
                      className={`tz-tab ${origin === hub.name ? "active" : ""}`}
                    >
                      <CircularFlag code={hub.flag} size={18} />
                      <span>{hub.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="tz-step">
                <h2 className="tz-step-title">Où va-t-il&nbsp;?</h2>
                <div className="tz-tabs">
                  {getDestinationsForOrigin(origin).map((dst) => (
                    <button
                      key={dst}
                      type="button"
                      onClick={() => setDestination(dst)}
                      className={`tz-tab ${destination === dst ? "active" : ""}`}
                    >
                      <CircularFlag countryName={dst} size={18} />
                      <span>{dst}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="tz-step">
                <h2 className="tz-step-title">Quelle formule&nbsp;?</h2>
                <div className="tz-formulas" role="radiogroup" aria-label="Formule d'expédition">
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
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setFormulaKey(f.key)}
                        className={`tz-formula ${isSelected ? "active" : ""}`}
                      >
                        <IconComp size={19} strokeWidth={1.9} className="tz-formula-icon" />
                        <span className="tz-formula-text">
                          <span className="tz-formula-name">{f.label}</span>
                          <span className="tz-formula-delay">{f.delay}</span>
                        </span>
                        <span className="tz-formula-price">{f.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="tz-step">
                {formulaKey === "sea" ? (
                  <GaugeControl
                    label="Volume estimé"
                    value={cbm}
                    min={0.1}
                    max={20}
                    step={0.1}
                    unit="m³"
                    ticks={[1, 5, 10, 15, 20]}
                    onChange={setCbm}
                  />
                ) : formulaKey === "doc" || formulaKey === "tech" ? (
                  <GaugeControl
                    label="Nombre d'unités"
                    value={docCount}
                    min={1}
                    max={50}
                    step={1}
                    unit="unité(s)"
                    ticks={[1, 10, 20, 30, 40, 50]}
                    onChange={setDocCount}
                  />
                ) : (
                  <GaugeControl
                    label="Poids estimé"
                    value={weight}
                    min={1}
                    max={200}
                    step={1}
                    unit="kg"
                    ticks={[1, 50, 100, 150, 200]}
                    onChange={setWeight}
                  />
                )}
              </div>

              <p className="tz-inline-total">
                <span>Estimation pour {formulaKey === "sea" ? cbm : formulaKey === "doc" || formulaKey === "tech" ? docCount : weight} {quantityUnit}</span>
                <strong className="tabular-nums">{Math.round(estimate.amountFcfa).toLocaleString("fr-FR")} FCFA</strong>
              </p>
            </section>

            <aside className="tz-ticket" aria-label="Estimation">
              <span className="tz-ticket-label">Votre estimation</span>
              <div className="tz-ticket-price tabular-nums">
                {Math.round(estimate.amountFcfa).toLocaleString("fr-FR")}
                <span>FCFA</span>
              </div>
              <p className="tz-ticket-note">Douane incluse, aucun frais caché.</p>

              <dl className="tz-ticket-facts">
                <div>
                  <dt>Trajet</dt>
                  <dd>
                    <CircularFlag countryName={origin} size={15} />
                    {origin.includes("Dubaï") ? "Dubaï" : origin}
                    <ArrowRight size={13} />
                    <CircularFlag countryName={destination} size={15} />
                    {destination}
                  </dd>
                </div>
                <div>
                  <dt>Tarif</dt>
                  <dd className="tabular-nums">{estimate.rateFormatted}</dd>
                </div>
                <div>
                  <dt>Délai</dt>
                  <dd>{estimate.duration}</dd>
                </div>
              </dl>

              <Link href={getSendParcelLink()} className="tz-send">
                <Package size={18} />
                <span>Envoyer un colis</span>
              </Link>

              <WhatsAppButton href={getWaLink()} label="Recevoir ce devis" block />

              <div className="tz-ticket-links">
                <button type="button" onClick={() => downloadOfficialReceiptPdf(getQuoteReceiptData())}>
                  <Download size={15} />
                  <span>PDF</span>
                </button>
                <button type="button" onClick={() => printOfficialReceipt(getQuoteReceiptData())}>
                  <Printer size={15} />
                  <span>Imprimer</span>
                </button>
                <Link href="/services/commande">
                  <span>Commander</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </aside>
          </div>

          <section className="tz-catalog">
            <div className="tz-catalog-head">
              <h2>Grille tarifaire</h2>
              <p>Tous nos prix incluent le dédouanement.</p>
            </div>

            <div className="tz-tabs tz-catalog-tabs">
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
                  className={`tz-tab ${catalogHub === hub.key ? "active" : ""}`}
                >
                  <CircularFlag code={hub.flag} size={18} />
                  <span>{hub.label}</span>
                </button>
              ))}
            </div>

            {catalogGroups.map((group) => (
              <div key={group.route} className="tz-group">
                <h3 className="tz-group-title">{group.route}</h3>
                <ul className="tz-rates">
                  {group.items.map((t) => {
                    const isSea = t.shipping_mode_type === "SEA" || t.pricing_basis === "PER_CBM";
                    const basis = String(t.pricing_basis);
                    const unitLabel = basis === "PER_CBM" ? "m³" : basis === "PER_KG" ? "kg" : "unité";
                    const name = (t.service_name || t.shipping_mode_name || "")
                      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
                      .trim();
                    return (
                      <li key={t.id} className="tz-rate">
                        {isSea ? <Ship size={17} strokeWidth={1.9} /> : <Plane size={17} strokeWidth={1.9} />}
                        <span className="tz-rate-name">
                          {name}
                          <small>
                            {t.estimated_days_min === t.estimated_days_max
                              ? `${t.estimated_days_min} jours`
                              : `${t.estimated_days_min} à ${t.estimated_days_max} jours`}
                          </small>
                        </span>
                        <span className="tz-rate-price tabular-nums">
                          {Math.round((t.price_per_unit_minor || 0) / 100).toLocaleString("fr-FR")} {t.currency || "FCFA"}
                          <small>/ {unitLabel}</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </ScrollReveal>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tz-root {
          --tz-ink: #3A2A21;
          --tz-muted: #7D6E64;
          --tz-faint: #A99A90;
          --tz-line: #EADFD3;
          --tz-accent: #6B5844;
          --tz-accent-deep: #3A2A21;
          --tz-tint: #F3EBDF;
          --tz-sand: #EFE6D9;
          color: var(--tz-ink);
          padding: 44px 20px 40px;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .tz-container {
          max-width: 1080px;
          margin: 0 auto;
        }

        .tz-header {
          max-width: 620px;
          margin-bottom: 44px;
        }

        .tz-eyebrow {
          display: block;
          margin-bottom: 10px;
          color: var(--tz-accent);
          font-size: 0.86rem;
          font-weight: 700;
        }

        .client-portal .tz-title {
          margin: 0 0 12px;
          color: var(--tz-ink);
          font-family: var(--c-font-display);
          font-size: clamp(2rem, 5vw, 3.1rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.08;
        }

        .tz-lead {
          margin: 0;
          color: var(--tz-muted);
          font-size: 1.05rem;
          line-height: 1.5;
        }

        .tz-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
          gap: 64px;
          align-items: start;
        }

        .tz-config {
          display: flex;
          flex-direction: column;
          gap: 34px;
          min-width: 0;
        }

        .tz-step {
          min-width: 0;
        }

        .client-portal .tz-step-title {
          margin: 0 0 12px;
          color: var(--tz-ink);
          font-family: var(--c-font-sans);
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0;
        }

        .tz-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tz-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 14px 0 10px;
          border: 0;
          border-radius: 9999px;
          background: transparent;
          color: var(--tz-muted);
          font-size: 0.93rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
        }

        .tz-tab:hover {
          background: var(--tz-sand);
        }

        .tz-tab.active {
          background: #EADDCB;
          color: var(--tz-ink);
          font-weight: 700;
        }

        .tz-formulas {
          display: flex;
          flex-direction: column;
        }

        .tz-formula {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 14px 12px;
          border: 0;
          border-bottom: 1px solid var(--tz-line);
          background: transparent;
          color: var(--tz-ink);
          text-align: left;
          cursor: pointer;
          transition: background 0.18s ease;
        }

        .tz-formula:last-child {
          border-bottom: 0;
        }

        .tz-formula:hover {
          background: rgba(245, 234, 223, 0.5);
        }

        .tz-formula.active {
          border-bottom-color: transparent;
          border-radius: 9999px;
          background: var(--tz-tint);
        }

        .tz-formula-icon {
          color: var(--tz-faint);
        }

        .tz-formula.active .tz-formula-icon,
        .tz-formula.active .tz-formula-price {
          color: var(--tz-accent);
        }

        .tz-formula-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .tz-formula-name {
          font-size: 0.97rem;
          font-weight: 700;
        }

        .tz-formula-delay {
          color: var(--tz-muted);
          font-size: 0.83rem;
        }

        .tz-formula-price {
          color: var(--tz-ink);
          font-size: 0.93rem;
          font-weight: 700;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .tz-inline-total {
          display: none;
        }

        .tz-ticket {
          position: sticky;
          top: 28px;
          padding: 30px;
          border-radius: 28px;
          border: 1px solid #EFE6D9;
          background: linear-gradient(165deg, #FFFDF9 0%, #FBF3E8 100%);
          box-shadow: 0 22px 44px -30px rgba(58, 42, 33, 0.45);
          color: var(--tz-ink);
          min-width: 0;
        }

        .tz-ticket-label {
          color: var(--tz-accent);
          font-size: 0.9rem;
          font-weight: 700;
        }

        .tz-ticket-price {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 2px 8px;
          margin-top: 6px;
          color: var(--tz-ink);
          font-family: var(--c-font-display);
          font-size: clamp(2.5rem, 5vw, 3.4rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.02;
        }

        .tz-ticket-price span {
          color: var(--tz-accent);
          font-size: 1.1rem;
          letter-spacing: 0;
        }

        .tz-ticket-note {
          margin: 8px 0 22px;
          color: var(--tz-muted);
          font-size: 0.9rem;
        }

        .tz-ticket-facts {
          margin: 0 0 22px;
        }

        .tz-ticket-facts > div {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 14px;
          padding: 11px 0;
          border-top: 1px solid rgba(58, 42, 33, 0.1);
        }

        .tz-ticket-facts dt {
          flex-shrink: 0;
          color: var(--tz-muted);
          font-size: 0.87rem;
        }

        .tz-ticket-facts dd {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          margin: 0;
          color: var(--tz-ink);
          font-size: 0.9rem;
          font-weight: 700;
          text-align: right;
        }


        .tz-ticket-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .tz-ticket-links button,
        .tz-ticket-links a {
          flex: 1 1 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 44px;
          padding: 0 14px;
          border: 0;
          border-radius: 9999px;
          background: #F3EBDF;
          color: var(--tz-ink);
          font-size: 0.88rem;
          font-weight: 700;
          white-space: nowrap;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .tz-ticket-links button:hover,
        .tz-ticket-links a:hover {
          background: #EADDCB;
        }

        .tz-send {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 52px;
          margin-bottom: 10px;
          padding: 0 20px;
          border-radius: 9999px;
          background: #EADDCB;
          color: var(--tz-ink);
          font-size: 0.97rem;
          font-weight: 800;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .tz-send:hover {
          background: #E0D1BB;
          transform: translateY(-1px);
        }

        .tz-send:active {
          transform: scale(0.98);
        }

        .tz-catalog {
          max-width: 760px;
          margin: 84px auto 0;
        }

        .tz-catalog-head {
          margin-bottom: 18px;
        }

        .client-portal .tz-catalog-head h2 {
          margin: 0 0 4px;
          color: var(--tz-ink);
          font-family: var(--c-font-display);
          font-size: clamp(1.6rem, 4vw, 2.1rem);
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .tz-catalog-head p {
          margin: 0;
          color: var(--tz-muted);
        }

        .tz-catalog-tabs {
          margin-bottom: 26px;
        }

        .tz-group {
          margin-bottom: 30px;
        }

        .client-portal .tz-group-title {
          margin: 0 0 4px;
          color: var(--tz-accent-deep);
          font-family: var(--c-font-sans);
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0;
        }

        .tz-rates {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .tz-rate {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--tz-line);
          color: var(--tz-faint);
        }

        .tz-rate:last-child {
          border-bottom: 0;
        }

        .tz-rate-name {
          color: var(--tz-ink);
          font-size: 0.97rem;
          font-weight: 600;
        }

        .tz-rate-name small {
          display: block;
          margin-top: 1px;
          color: var(--tz-muted);
          font-size: 0.82rem;
          font-weight: 400;
        }

        .tz-rate-price {
          color: var(--tz-ink);
          font-size: 1rem;
          font-weight: 800;
          text-align: right;
          white-space: nowrap;
        }

        .tz-rate-price small {
          margin-left: 3px;
          color: var(--tz-muted);
          font-size: 0.8rem;
          font-weight: 500;
        }

        @media (max-width: 900px) {
          .tz-root {
            padding-top: 30px;
          }

          .tz-header {
            margin-bottom: 30px;
          }

          .tz-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 26px;
          }

          .tz-ticket {
            position: static;
            padding: 24px 20px;
            border-radius: 24px;
          }

          .tz-inline-total {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
            margin: -14px 0 0;
            color: var(--tz-muted);
            font-size: 0.9rem;
          }

          .tz-inline-total strong {
            color: var(--tz-accent);
            font-size: 1.05rem;
            white-space: nowrap;
          }

          .tz-catalog {
            margin-top: 60px;
          }
        }

        @media (max-width: 520px) {
          .tz-formula {
            grid-template-columns: auto minmax(0, 1fr);
            row-gap: 3px;
          }

          .tz-formula-price {
            grid-column: 2;
          }

          .tz-rate {
            gap: 10px;
          }
        }
      `,
        }}
      />
    </div>
  );
}
