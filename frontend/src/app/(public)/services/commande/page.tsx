"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Upload,
  Trash2,
  Package,
  MessageCircle,
} from "lucide-react";
import {
  saveClientRequest,
  getLiveCompanySettings,
  getLiveTariffs,
  getAdminDestinationsDetailed,
  findTariff,
  OfficialTariff,
} from "@/shared";
import { WaveLogo, OrangeMoneyLogo } from "@/components/PaymentLogos";
import { CircularFlag } from "@/components/CircularFlag";

interface ExtractedProduct {
  platform: string;
  title: string;
  image: string;
  price: number;
  currency: string;
  originalUrl: string;
}

function CommandeFormContent() {
  const [option, setOption] = useState<"sans_fournisseur" | "avec_fournisseur">("sans_fournisseur");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    reference: string;
    trackingNumber: string;
    shippingMark: string;
    whatsappUrl: string;
    totalAmount?: number;
    receiptName?: string;
    option: "sans_fournisseur" | "avec_fournisseur";
    destination: string;
    shippingModeDesc: string;
  } | null>(null);

  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);
  const [copiedPay, setCopiedPay] = useState<string | null>(null);

  // Paramètres synchronisés avec l'Admin
  const [settings, setSettings] = useState<Record<string, string>>(() => getLiveCompanySettings());
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());

  useEffect(() => {
    fetch("/api/public/tariffs")
      .then((r) => r.json())
      .then((d) => {
        if (d.tariffs && Array.isArray(d.tariffs) && d.tariffs.length > 0) {
          const mapped: OfficialTariff[] = d.tariffs.map((t: any) => ({
            id: t.id || t.tariff_id,
            origin_country: t.origin_country || "Chine",
            origin_city: t.origin_city || "",
            destination_country: t.destination_country || "Côte d'Ivoire",
            destination_city: t.destination_city || "",
            shipping_mode_name: t.shipping_mode_name || t.mode_name || "Transport",
            shipping_mode_type: (t.shipping_mode_type || t.mode_type || "AIR") as "AIR" | "SEA",
            category_tag: t.category_tag || "",
            pricing_basis: (t.pricing_basis || "PER_KG") as any,
            currency: t.currency || "FCFA",
            price_per_unit_minor: t.price_per_unit_minor || 0,
            minimum_charge_minor: t.minimum_charge_minor || 0,
            estimated_days_min: t.estimated_days_min || 7,
            estimated_days_max: t.estimated_days_max || 14,
            note: t.note || "",
            is_active: t.is_active ?? 1,
          }));
          setTariffs(mapped);
          try {
            localStorage.setItem("roum_tariffs_data", JSON.stringify(mapped));
          } catch {}
        }
      })
      .catch(() => {});

    const handleSync = () => {
      setTariffs(getLiveTariffs());
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("roum_tariffs_updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("roum_tariffs_updated", handleSync);
    };
  }, []);

  // Uniquement les destinations configurées côté Admin (Chine)
  const adminDestinations = useMemo(() => {
    return getAdminDestinationsDetailed(tariffs, "Chine");
  }, [tariffs]);

  // Champs de contact & destination
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [destinationCity, setDestinationCity] = useState(
    adminDestinations[0]?.label || "Côte d'Ivoire — Abidjan"
  );

  useEffect(() => {
    if (adminDestinations.length > 0) {
      const match = adminDestinations.some(
        (d) => d.label === destinationCity || d.country === destinationCity || destinationCity.includes(d.country)
      );
      if (!match) {
        setDestinationCity(adminDestinations[0].label);
      }
    }
  }, [adminDestinations, destinationCity]);

  const currentDestCountry = useMemo(() => {
    const found = adminDestinations.find((d) => d.label === destinationCity);
    return found ? found.country : destinationCity.split("—")[0].split("(")[0].trim();
  }, [adminDestinations, destinationCity]);

  // Tarifs dynamiques depuis l'Admin
  const matchedExpress = useMemo(() => {
    return (
      tariffs.find(
        (t) =>
          (t.origin_country || "").toLowerCase().includes("chine") &&
          (t.destination_country || "").toLowerCase().includes(currentDestCountry.toLowerCase()) &&
          ((t.shipping_mode_name || "").toLowerCase().includes("express") ||
            (t.category_tag || "").toLowerCase().includes("express") ||
            (t.id || "").toLowerCase().includes("express"))
      ) || findTariff(tariffs, "chine", "express")
    );
  }, [tariffs, currentDestCountry]);

  const matchedStandard = useMemo(() => {
    return (
      tariffs.find(
        (t) =>
          (t.origin_country || "").toLowerCase().includes("chine") &&
          (t.destination_country || "").toLowerCase().includes(currentDestCountry.toLowerCase()) &&
          ((t.shipping_mode_name || "").toLowerCase().includes("normale") ||
            (t.shipping_mode_name || "").toLowerCase().includes("standard") ||
            (t.category_tag || "").toLowerCase().includes("standard") ||
            (t.id || "").toLowerCase().includes("normal"))
      ) || findTariff(tariffs, "chine", "normale")
    );
  }, [tariffs, currentDestCountry]);

  const matchedSpecial = useMemo(() => {
    return (
      tariffs.find(
        (t) =>
          (t.origin_country || "").toLowerCase().includes("chine") &&
          (t.destination_country || "").toLowerCase().includes(currentDestCountry.toLowerCase()) &&
          ((t.shipping_mode_name || "").toLowerCase().includes("batterie") ||
            (t.shipping_mode_name || "").toLowerCase().includes("spécial") ||
            (t.category_tag || "").toLowerCase().includes("batterie") ||
            (t.category_tag || "").toLowerCase().includes("spécial") ||
            (t.id || "").toLowerCase().includes("special"))
      ) || findTariff(tariffs, "chine", "batterie") || findTariff(tariffs, "chine", "spécial")
    );
  }, [tariffs, currentDestCountry]);

  const matchedSea = useMemo(() => {
    return (
      tariffs.find(
        (t) =>
          (t.origin_country || "").toLowerCase().includes("chine") &&
          (t.destination_country || "").toLowerCase().includes(currentDestCountry.toLowerCase()) &&
          ((t.shipping_mode_name || "").toLowerCase().includes("bateau") ||
            (t.shipping_mode_name || "").toLowerCase().includes("maritime") ||
            (t.category_tag || "").toLowerCase().includes("maritime") ||
            t.shipping_mode_type === "SEA" ||
            (t.id || "").toLowerCase().includes("sea"))
      ) || findTariff(tariffs, "chine", "bateau")
    );
  }, [tariffs, currentDestCountry]);

  const getSafeRate = (tariff: any, defaultVal: number): number => {
    if (!tariff) return defaultVal;
    if (typeof tariff.price_per_unit === "number" && tariff.price_per_unit > 0) {
      return Math.round(tariff.price_per_unit);
    }
    const minor = Number(tariff.price_per_unit_minor) || 0;
    if (minor <= 0) return defaultVal;
    if (minor >= 50000) {
      return Math.round(minor / 100);
    }
    return minor;
  };

  const rateAirExpress = useMemo(() => getSafeRate(matchedExpress, 12000), [matchedExpress]);
  const rateAirStandard = useMemo(() => getSafeRate(matchedStandard, 10000), [matchedStandard]);
  const rateAirSpecial = useMemo(() => getSafeRate(matchedSpecial, 14000), [matchedSpecial]);
  const rateSea = useMemo(() => getSafeRate(matchedSea, 300000), [matchedSea]);

  // Moyen de transport choisi
  const [selectedTransportMode, setSelectedTransportMode] = useState<"AIR_EXPRESS" | "AIR_STANDARD" | "AIR_SPECIAL" | "SEA">("AIR_EXPRESS");
  const [packageWeight, setPackageWeight] = useState<number>(5);
  const [packageVolume, setPackageVolume] = useState<number>(0.1);

  const transportModeLabel = useMemo(() => {
    if (selectedTransportMode === "AIR_EXPRESS") return "Avion Express (4 à 5 jours)";
    if (selectedTransportMode === "AIR_STANDARD") return "Avion Normal (10 à 14 jours)";
    if (selectedTransportMode === "AIR_SPECIAL") return "Avion Spécial Batteries & Liquides (7 à 10 jours)";
    return "Voie Maritime Groupage (35 à 45 jours)";
  }, [selectedTransportMode]);

  const transportUnitRateFormatted = useMemo(() => {
    if (selectedTransportMode === "AIR_EXPRESS") return `${rateAirExpress.toLocaleString("fr-FR")} FCFA / kg`;
    if (selectedTransportMode === "AIR_STANDARD") return `${rateAirStandard.toLocaleString("fr-FR")} FCFA / kg`;
    if (selectedTransportMode === "AIR_SPECIAL") return `${rateAirSpecial.toLocaleString("fr-FR")} FCFA / kg`;
    return `${rateSea.toLocaleString("fr-FR")} FCFA / m³`;
  }, [selectedTransportMode, rateAirExpress, rateAirStandard, rateAirSpecial, rateSea]);

  const shippingQuote = useMemo(() => {
    if (selectedTransportMode === "AIR_EXPRESS") {
      return Math.round((packageWeight || 1) * rateAirExpress);
    }
    if (selectedTransportMode === "AIR_STANDARD") {
      return Math.round((packageWeight || 1) * rateAirStandard);
    }
    if (selectedTransportMode === "AIR_SPECIAL") {
      return Math.round((packageWeight || 1) * rateAirSpecial);
    }
    return Math.round((packageVolume || 0.1) * rateSea);
  }, [selectedTransportMode, packageWeight, packageVolume, rateAirExpress, rateAirStandard, rateAirSpecial, rateSea]);

  // Option 1 : Sans fournisseur
  const [productLink, setProductLink] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productUnitPrice, setProductUnitPrice] = useState<number>(15);
  const [productCurrency, setProductCurrency] = useState<"RMB" | "USD" | "FCFA">("RMB");

  // Option 2 : Avec fournisseur
  const [clientShippingMark, setClientShippingMark] = useState("");
  const [paidToSupplier, setPaidToSupplier] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");

  // Analyse du lien
  const [extracting, setExtracting] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Paiement & Reçu (Option 1)
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>("wave");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchLiveSettings = async () => {
      try {
        const res = await fetch(`/api/v1/public/settings?_t=${Date.now()}`);
        if (res.ok) {
          const d = await res.json();
          if (d?.settings) {
            setSettings(d.settings);
            localStorage.setItem("roum_company_settings", JSON.stringify(d.settings));
          }
        }
      } catch {}
    };
    fetchLiveSettings();
  }, []);

  const activePaymentMethods = useMemo(() => {
    const list: Array<{
      id: string;
      label: string;
      type: string;
      accountNumber: string;
      accountHolder: string;
      color: string;
      copyValue: string;
      logo: React.ReactNode;
    }> = [];

    const waveNum = settings.payment_wave_ci?.trim();
    if (waveNum) {
      list.push({
        id: "wave",
        label: "Wave",
        type: "Mobile Money",
        accountNumber: waveNum,
        accountHolder: settings.payment_wave_name?.trim() || "ROUM TRANSIT SARL",
        color: "#1D4ED8",
        copyValue: waveNum,
        logo: <WaveLogo size={24} />,
      });
    }

    const omNum = settings.payment_orange_money_ci?.trim();
    if (omNum) {
      list.push({
        id: "orange",
        label: "Orange Money",
        type: "Transfert direct",
        accountNumber: omNum,
        accountHolder: settings.payment_orange_name?.trim() || "ROUM TRANSIT INTERNATIONAL",
        color: "#EA580C",
        copyValue: omNum,
        logo: <OrangeMoneyLogo size={24} />,
      });
    }

    const moroccoBank = settings.payment_morocco_bank?.trim();
    const moroccoRib = settings.payment_morocco_rib?.trim();
    if (moroccoBank || moroccoRib) {
      list.push({
        id: "morocco",
        label: moroccoBank || "Compte Maroc",
        type: "Casablanca",
        accountNumber: moroccoRib || moroccoBank || "",
        accountHolder: settings.payment_morocco_holder?.trim() || "ROUM TRANSIT MAROC",
        color: "#B91C1C",
        copyValue: moroccoRib || moroccoBank || "",
        logo: <CircularFlag countryCode="MA" size={24} />,
      });
    }
    return list;
  }, [settings]);

  useEffect(() => {
    if (activePaymentMethods.length > 0) {
      const exists = activePaymentMethods.some((m) => m.id === selectedPayMethod);
      if (!exists) setSelectedPayMethod(activePaymentMethods[0].id);
    }
  }, [activePaymentMethods, selectedPayMethod]);

  const handleExtractProduct = async (urlToExtract?: string) => {
    const targetUrl = urlToExtract || productLink;
    if (!targetUrl.trim() || !targetUrl.startsWith("http")) return;

    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      if (!res.ok) throw new Error("Échec d'analyse");
      const data: ExtractedProduct = await res.json();
      setExtractedProduct(data);
      if (data.title && !productQuery) setProductQuery(data.title);
      if (data.price && data.price > 0) {
        setProductUnitPrice(data.price);
        setProductCurrency((data.currency as "RMB" | "USD" | "FCFA") || "RMB");
      }
    } catch {
      setExtractError("Lien non analysé automatiquement. Renseignez le titre et le prix.");
    } finally {
      setExtracting(false);
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (maximum 10 Mo).");
      return;
    }
    setReceiptFile(file);
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReceiptDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptDataUrl(null);
    setReceiptFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rmbRate = 95;
  const usdRate = 620;
  const unitPriceFCFA = Math.round(
    productUnitPrice * (productCurrency === "USD" ? usdRate : productCurrency === "RMB" ? rmbRate : 1)
  );
  const totalArticlesFCFA = unitPriceFCFA * (productQuantity || 1);
  const grandTotalFCFA = totalArticlesFCFA + shippingQuote;

  const copyText = (val: string, key: "tracking" | "mark") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      if (key === "tracking") {
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
      } else {
        setCopiedMark(true);
        setTimeout(() => setCopiedMark(false), 2000);
      }
    }
  };

  const copyPayMethod = (key: string, val: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      setCopiedPay(key);
      setTimeout(() => setCopiedPay(null), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert("Veuillez renseigner votre nom complet.");
      return;
    }
    if (!clientPhone.trim()) {
      alert("Veuillez renseigner votre numéro WhatsApp.");
      return;
    }

    if (option === "sans_fournisseur") {
      if (!productLink.trim() && !productQuery.trim()) {
        alert("Veuillez renseigner le lien ou le nom du produit.");
        return;
      }
    } else {
      if (!clientShippingMark.trim()) {
        alert("Veuillez renseigner le Shipping Mark fourni par votre usine.");
        return;
      }
      if (!goodsDescription.trim()) {
        alert("Veuillez renseigner la description de votre marchandise.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let cargoDescription = "";
      if (option === "sans_fournisseur") {
        cargoDescription = `[SOURCING SANS FOURNISSEUR] Produit: ${productQuery.trim() || extractedProduct?.title || "Article Alibaba"} | Qté: ${productQuantity} | P.U: ${productUnitPrice} ${productCurrency} | Fret: ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`}) | Total: ${grandTotalFCFA.toLocaleString("fr-FR")} FCFA`;
      } else {
        cargoDescription = `[EXPÉDITION AVEC FOURNISSEUR] Shipping Mark: ${clientShippingMark.trim()} | Usine: ${paidToSupplier.trim() || "Déjà réglé"} | Colis: ${goodsDescription.trim()} | Fret: ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`} à ${transportUnitRateFormatted}) | Devis: ${shippingQuote.toLocaleString("fr-FR")} FCFA`;
      }

      const res = await saveClientRequest({
        service_type: "ALIBABA",
        option_type: option === "avec_fournisseur" ? "AVEC_FOURNISSEUR" : "SANS_FOURNISSEUR",
        shipping_mark: option === "avec_fournisseur" ? clientShippingMark.trim() : undefined,
        paid_to_supplier: option === "avec_fournisseur" ? paidToSupplier.trim() : undefined,
        rmb_amount: option === "avec_fournisseur" ? paidToSupplier.trim() : undefined,
        supplier_contact: option === "avec_fournisseur" ? clientShippingMark.trim() : undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        origin_country: "Chine",
        destination_country: destinationCity.trim(),
        product_url: productLink.trim(),
        product_image: extractedProduct?.image,
        product_name:
          productQuery.trim() ||
          extractedProduct?.title ||
          (option === "avec_fournisseur" ? goodsDescription.trim() : "Article Alibaba"),
        unit_price: option === "sans_fournisseur" ? productUnitPrice : undefined,
        unit_price_currency: option === "sans_fournisseur" ? productCurrency : undefined,
        total_goods_fcfa: option === "sans_fournisseur" ? totalArticlesFCFA : undefined,
        shipping_fee_fcfa: shippingQuote,
        total_amount_fcfa: option === "sans_fournisseur" ? grandTotalFCFA : shippingQuote,
        payment_method_selected: option === "sans_fournisseur" ? selectedPayMethod : "MOBILE_MONEY_ARRIVEE",
        payment_receipt_url: option === "sans_fournisseur" ? receiptDataUrl || undefined : undefined,
        payment_receipt_name: option === "sans_fournisseur" ? receiptFileName || undefined : undefined,
        product_quantity: String(productQuantity || 1),
        product_specs:
          option === "sans_fournisseur"
            ? `Mode: ${transportModeLabel} | Articles: ${totalArticlesFCFA.toLocaleString("fr-FR")} F | Fret: ${shippingQuote.toLocaleString("fr-FR")} F`
            : `Shipping Mark: ${clientShippingMark.trim()} | Payé usine: ${paidToSupplier.trim()} | Fret: ${shippingQuote.toLocaleString("fr-FR")} F`,
        shipping_mode_type: selectedTransportMode === "SEA" ? "SEA" : "AIR",
        shipping_mode_name: transportModeLabel,
        estimated_weight_kg: selectedTransportMode !== "SEA" ? packageWeight : undefined,
        estimated_cbm: selectedTransportMode === "SEA" ? packageVolume : undefined,
        cargo_type: cargoDescription,
      });

      let message = "";
      if (option === "sans_fournisseur") {
        message =
          `*NOUVELLE COMMANDE ROUM N° ${res.reference}*\n` +
          `• Client : ${clientName}\n` +
          `• Contact : ${clientPhone}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Mode : ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`})\n` +
          `• Article : ${productQuery || extractedProduct?.title || "Article Alibaba"}\n` +
          `• Quantité : ${productQuantity}\n` +
          `• Lien : ${productLink}\n` +
          `• Total : ${grandTotalFCFA.toLocaleString("fr-FR")} FCFA`;
      } else {
        message =
          `*DOSSIER EXPÉDITION N° ${res.reference}*\n` +
          `• N° Suivi : ${res.trackingNumber}\n` +
          `• Client : ${clientName}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Mode : ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`})\n` +
          `• Shipping Mark : ${clientShippingMark}\n` +
          `• Devis Transit : ${shippingQuote.toLocaleString("fr-FR")} FCFA\n` +
          `• Paiement : Mobile Money à l'arrivée`;
      }

      const customWaUrl = `https://wa.me/2250787994412?text=${encodeURIComponent(message)}`;

      setOrderResult({
        reference: res.reference,
        trackingNumber: res.trackingNumber,
        shippingMark: res.shippingMark,
        whatsappUrl: customWaUrl,
        totalAmount: option === "sans_fournisseur" ? grandTotalFCFA : shippingQuote,
        receiptName: receiptFileName,
        option,
        destination: destinationCity,
        shippingModeDesc: transportModeLabel,
      });
      setSubmitted(true);
      window.open(customWaUrl, "_blank");
    } catch (err) {
      console.error("Erreur enregistrement commande:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ios-page-wrap">
      <div className="ios-page-container">
        {/* Navigation retour discrète */}
        <div className="ios-top-nav">
          <Link href="/services" className="ios-back-link">
            <ArrowLeft size={16} />
            <span>Services</span>
          </Link>
        </div>

        {/* Titre minimaliste */}
        <div className="ios-header">
          <h1 className="ios-title">Passer une commande</h1>
          <p className="ios-subtitle">Achats et expéditions Chine vers l&apos;Afrique</p>
        </div>

        {submitted && orderResult ? (
          <div className="ios-card ios-success-card">
            <div className="ios-success-icon">
              <CheckCircle2 size={36} color="#16A34A" />
            </div>
            <h2 className="ios-success-title">
              {orderResult.option === "avec_fournisseur" ? "Dossier créé avec succès" : "Commande enregistrée"}
            </h2>
            <p className="ios-success-desc">
              Votre numéro officiel est généré et actif dans le système.
            </p>

            {/* Inset information */}
            <div className="ios-inset-box">
              <div className="ios-row-item">
                <span className="ios-item-label">
                  {orderResult.option === "avec_fournisseur" ? "N° de Suivi" : "Référence"}
                </span>
                <div className="ios-item-val-group">
                  <span className="ios-item-val mono">{orderResult.trackingNumber || orderResult.reference}</span>
                  <button
                    type="button"
                    onClick={() => copyText(orderResult.trackingNumber || orderResult.reference, "tracking")}
                    className="ios-copy-pill"
                  >
                    {copiedTracking ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                    <span>{copiedTracking ? "Copié" : "Copier"}</span>
                  </button>
                </div>
              </div>

              {orderResult.shippingMark && (
                <div className="ios-row-item">
                  <span className="ios-item-label">Shipping Mark</span>
                  <div className="ios-item-val-group">
                    <span className="ios-item-val mono">{orderResult.shippingMark}</span>
                    <button
                      type="button"
                      onClick={() => copyText(orderResult.shippingMark, "mark")}
                      className="ios-copy-pill"
                    >
                      {copiedMark ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                      <span>{copiedMark ? "Copié" : "Copier"}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="ios-row-item highlight">
                <span className="ios-item-label">
                  {orderResult.option === "avec_fournisseur" ? "Devis Transit estimé" : "Total à régler"}
                </span>
                <span className="ios-item-val bold">
                  {orderResult.totalAmount?.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>

            {orderResult.option === "avec_fournisseur" && (
              <p className="ios-note-subtle">
                Paiement par Wave ou Orange Money lors du retrait à l&apos;entrepôt ({orderResult.destination}).
              </p>
            )}

            <div className="ios-actions-stack">
              <Link
                href={`/tracking/${orderResult.trackingNumber || orderResult.reference}`}
                className="ios-btn-primary"
              >
                <Package size={16} />
                <span>Suivre mon colis</span>
              </Link>
              <a
                href={orderResult.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ios-btn-secondary"
              >
                <MessageCircle size={16} />
                <span>Contacter sur WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ios-form-root">
            {/* iOS Segmented Control (Option 1 vs Option 2) */}
            <div className="ios-segmented-control" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={option === "sans_fournisseur"}
                className={`ios-segmented-btn ${option === "sans_fournisseur" ? "active" : ""}`}
                onClick={() => setOption("sans_fournisseur")}
              >
                Option 1 · Sans Fournisseur
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={option === "avec_fournisseur"}
                className={`ios-segmented-btn ${option === "avec_fournisseur" ? "active" : ""}`}
                onClick={() => setOption("avec_fournisseur")}
              >
                Option 2 · Avec Fournisseur
              </button>
            </div>

            {/* Surface principale */}
            <div className="ios-card">
              {/* SECTION 1 : CONTACT & ACHEMINEMENT */}
              <div className="ios-section">
                <div className="ios-section-caption">Coordonnées &amp; Acheminement</div>

                <div className="ios-grid-2">
                  <div className="ios-field">
                    <label htmlFor="clientName">Nom complet</label>
                    <input
                      id="clientName"
                      type="text"
                      required
                      placeholder="Nom et prénom"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="ios-input"
                    />
                  </div>

                  <div className="ios-field">
                    <label htmlFor="clientPhone">WhatsApp</label>
                    <input
                      id="clientPhone"
                      type="tel"
                      required
                      placeholder="+225 07 00 00 00"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="ios-input"
                    />
                  </div>
                </div>

                <div className="ios-field">
                  <label htmlFor="destinationCity">Destination</label>
                  <select
                    id="destinationCity"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    className="ios-select"
                  >
                    {adminDestinations.map((d) => (
                      <option key={d.label} value={d.label}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Moyen de transport dans un menu déroulant natif iOS */}
                <div className="ios-field">
                  <label htmlFor="selectedTransportMode">Moyen de transport</label>
                  <select
                    id="selectedTransportMode"
                    value={selectedTransportMode}
                    onChange={(e) => setSelectedTransportMode(e.target.value as any)}
                    className="ios-select"
                  >
                    <option value="AIR_EXPRESS">
                      Voie Aérienne Express · 4 à 5 jours ({rateAirExpress.toLocaleString("fr-FR")} FCFA / kg)
                    </option>
                    <option value="AIR_STANDARD">
                      Voie Aérienne Normale · 10 à 14 jours ({rateAirStandard.toLocaleString("fr-FR")} FCFA / kg)
                    </option>
                    <option value="AIR_SPECIAL">
                      Spécial Batteries &amp; Liquides · 7 à 10 jours ({rateAirSpecial.toLocaleString("fr-FR")} FCFA / kg)
                    </option>
                    <option value="SEA">
                      Voie Maritime Groupage · 35 à 45 jours ({rateSea.toLocaleString("fr-FR")} FCFA / m³)
                    </option>
                  </select>
                </div>

                {/* Poids ou Volume */}
                <div className="ios-field">
                  <label htmlFor="packageWeightOrVolume">
                    {selectedTransportMode === "SEA" ? "Volume estimé (m³)" : "Poids estimé (kg)"}
                  </label>
                  {selectedTransportMode === "SEA" ? (
                    <input
                      id="packageWeightOrVolume"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={packageVolume}
                      onChange={(e) => setPackageVolume(parseFloat(e.target.value) || 0.1)}
                      placeholder="0.25"
                      className="ios-input"
                    />
                  ) : (
                    <input
                      id="packageWeightOrVolume"
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={packageWeight}
                      onChange={(e) => setPackageWeight(parseFloat(e.target.value) || 1)}
                      placeholder="5"
                      className="ios-input"
                    />
                  )}
                </div>
              </div>

              <div className="ios-divider" />

              {/* SECTION 2 : ARTICLES / FOURNISSEUR */}
              <div className="ios-section">
                <div className="ios-section-caption">
                  {option === "sans_fournisseur" ? "Détails de l'article" : "Marchandise & Fournisseur"}
                </div>

                {option === "sans_fournisseur" ? (
                  <>
                    <div className="ios-field">
                      <label htmlFor="productLink">Lien Alibaba, 1688 ou Taobao</label>
                      <div className="ios-input-action-group">
                        <input
                          id="productLink"
                          type="url"
                          placeholder="https://detail.1688.com/... ou alibaba"
                          value={productLink}
                          onChange={(e) => setProductLink(e.target.value)}
                          onBlur={() => {
                            if (productLink.startsWith("http") && !extractedProduct) {
                              handleExtractProduct(productLink);
                            }
                          }}
                          className="ios-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleExtractProduct()}
                          disabled={extracting || !productLink.trim()}
                          className="ios-btn-inline"
                        >
                          {extracting ? "..." : <Search size={14} />}
                        </button>
                      </div>
                      {extractError && <span className="ios-error-msg">{extractError}</span>}
                    </div>

                    {extractedProduct && (
                      <div className="ios-product-preview">
                        <img
                          src={extractedProduct.image}
                          alt={extractedProduct.title}
                          className="ios-product-thumb"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/services/sourcing_warehouse.jpg";
                          }}
                        />
                        <div className="ios-product-info">
                          <span className="ios-product-platform">{extractedProduct.platform}</span>
                          <span className="ios-product-title">{extractedProduct.title}</span>
                          <span className="ios-product-price">
                            {productUnitPrice} {productCurrency} (≈ {unitPriceFCFA.toLocaleString("fr-FR")} FCFA)
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="ios-field">
                      <label htmlFor="productQuery">Description de l&apos;article</label>
                      <input
                        id="productQuery"
                        type="text"
                        required
                        placeholder="Ex: Écrans iPhone, Vêtements, Pièces auto..."
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <div className="ios-grid-2">
                      <div className="ios-field">
                        <label htmlFor="productQuantity">Quantité</label>
                        <div className="ios-stepper">
                          <button
                            type="button"
                            onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                            className="ios-stepper-btn"
                          >
                            –
                          </button>
                          <input
                            id="productQuantity"
                            type="number"
                            min="1"
                            required
                            value={productQuantity}
                            onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="ios-stepper-input"
                          />
                          <button
                            type="button"
                            onClick={() => setProductQuantity((q) => q + 1)}
                            className="ios-stepper-btn"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="ios-field">
                        <label htmlFor="productUnitPrice">Prix unitaire usine</label>
                        <div className="ios-currency-row">
                          <input
                            id="productUnitPrice"
                            type="number"
                            step="any"
                            min="0.1"
                            required
                            value={productUnitPrice}
                            onChange={(e) => setProductUnitPrice(parseFloat(e.target.value) || 0)}
                            className="ios-input"
                          />
                          <select
                            value={productCurrency}
                            onChange={(e) => setProductCurrency(e.target.value as any)}
                            className="ios-select-compact"
                          >
                            <option value="RMB">¥ RMB</option>
                            <option value="USD">$ USD</option>
                            <option value="FCFA">FCFA</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ios-field">
                      <label htmlFor="clientShippingMark">Shipping Mark fournisseur</label>
                      <input
                        id="clientShippingMark"
                        type="text"
                        required
                        placeholder="Ex : ROUM-EXP-Jean ou code fourni par l'usine"
                        value={clientShippingMark}
                        onChange={(e) => setClientShippingMark(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <div className="ios-field">
                      <label htmlFor="paidToSupplier">Montant déjà payé au fournisseur</label>
                      <input
                        id="paidToSupplier"
                        type="text"
                        required
                        placeholder="Ex : 5 400 RMB ou 800 $"
                        value={paidToSupplier}
                        onChange={(e) => setPaidToSupplier(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <div className="ios-field">
                      <label htmlFor="goodsDescription">Description ou lien marchandise</label>
                      <input
                        id="goodsDescription"
                        type="text"
                        required
                        placeholder="Ex : 4 cartons pièces mécaniques ou lien Alibaba"
                        value={goodsDescription}
                        onChange={(e) => setGoodsDescription(e.target.value)}
                        className="ios-input"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="ios-divider" />

              {/* SECTION 3 : DEVIS ESTIMÉ */}
              <div className="ios-section">
                <div className="ios-section-caption">Devis estimé</div>

                <div className="ios-receipt">
                  <div className="ios-receipt-row">
                    <span>
                      Transport {transportModeLabel} ({selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`})
                    </span>
                    <span className="mono">{shippingQuote.toLocaleString("fr-FR")} FCFA</span>
                  </div>

                  {option === "sans_fournisseur" && (
                    <div className="ios-receipt-row">
                      <span>Articles ({productQuantity} pcs)</span>
                      <span className="mono">{totalArticlesFCFA.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )}

                  <div className="ios-receipt-divider" />

                  <div className="ios-receipt-row total">
                    <span>{option === "sans_fournisseur" ? "Total global estimé" : "Devis transport estimé"}</span>
                    <span className="bold">
                      {(option === "sans_fournisseur" ? grandTotalFCFA : shippingQuote).toLocaleString("fr-FR")}{" "}
                      <small>FCFA</small>
                    </span>
                  </div>
                </div>

                <p className="ios-note-subtle">
                  {option === "sans_fournisseur"
                    ? "Dédouanement complet inclus jusqu'à destination."
                    : `Paiement du fret par Wave ou Orange Money lors du retrait à ${destinationCity}.`}
                </p>
              </div>

              {/* SECTION 4 (Option 1 uniquement) : RÈGLEMENT */}
              {option === "sans_fournisseur" && (
                <>
                  <div className="ios-divider" />

                  <div className="ios-section">
                    <div className="ios-section-caption">Comptes de règlement</div>

                    <div className="ios-payment-list">
                      {activePaymentMethods.map((pm) => {
                        const isSelected = selectedPayMethod === pm.id;
                        return (
                          <div
                            key={pm.id}
                            className={`ios-payment-row ${isSelected ? "selected" : ""}`}
                            onClick={() => setSelectedPayMethod(pm.id)}
                          >
                            <div className="ios-pay-left">
                              {pm.logo}
                              <div>
                                <div className="ios-pay-name">{pm.label}</div>
                                <div className="ios-pay-num mono">{pm.accountNumber}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPayMethod(pm.id, pm.copyValue);
                              }}
                              className="ios-copy-pill"
                            >
                              {copiedPay === pm.id ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                              <span>{copiedPay === pm.id ? "Copié" : "Copier"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="ios-upload-wrap">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptChange}
                        style={{ display: "none" }}
                        id="receiptUpload"
                      />
                      {!receiptFile ? (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="ios-upload-btn"
                        >
                          <Upload size={14} />
                          <span>Joindre la preuve de paiement (optionnel)</span>
                        </button>
                      ) : (
                        <div className="ios-receipt-attached">
                          <span className="ios-receipt-name">{receiptFileName}</span>
                          <button type="button" onClick={handleRemoveReceipt} className="ios-receipt-remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* BOUTON D'ACTION PRINCIPAL */}
              <div className="ios-submit-wrap">
                <button type="submit" disabled={submitting} className="ios-submit-btn">
                  {submitting
                    ? "Enregistrement..."
                    : option === "sans_fournisseur"
                    ? "Valider ma commande"
                    : "Créer mon dossier d'expédition"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .ios-page-wrap {
          min-height: 100vh;
          background-color: #F2F2F7;
          padding: 24px 16px 80px 16px;
          color: #1C1C1E;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .ios-page-container {
          max-width: 580px;
          margin: 0 auto;
        }

        .ios-top-nav {
          margin-bottom: 12px;
        }

        .ios-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #CC4E16;
          font-size: 0.88rem;
          font-weight: 500;
          text-decoration: none;
          padding: 6px 0;
          transition: opacity 0.15s ease;
        }

        .ios-back-link:hover {
          opacity: 0.75;
        }

        .ios-header {
          margin-bottom: 20px;
        }

        .ios-title {
          font-size: 1.55rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #1C1C1E;
          margin: 0 0 4px 0;
          text-wrap: balance;
        }

        .ios-subtitle {
          font-size: 0.88rem;
          color: #8E8E93;
          margin: 0;
        }

        /* Segmented Control iOS */
        .ios-segmented-control {
          background: #E5E5EA;
          border-radius: 10px;
          padding: 2px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          margin-bottom: 16px;
        }

        .ios-segmented-btn {
          height: 36px;
          border: none;
          background: transparent;
          color: #636366;
          font-size: 0.82rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          padding: 0 8px;
        }

        .ios-segmented-btn.active {
          background: #FFFFFF;
          color: #1C1C1E;
          font-weight: 600;
          box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.1);
        }

        /* Carte de surface iOS */
        .ios-card {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          padding: 20px 18px;
        }

        .ios-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ios-section-caption {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8E8E93;
          margin-bottom: 2px;
        }

        .ios-divider {
          height: 1px;
          background-color: #EFEFF4;
          margin: 18px 0;
        }

        .ios-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 520px) {
          .ios-grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .ios-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ios-field label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #3A3A3C;
        }

        /* Inputs & Selects épurés iOS */
        .ios-input {
          width: 100%;
          height: 44px;
          padding: 0 13px;
          background: #F9F9FB;
          border: 1px solid #E5E5EA;
          border-radius: 11px;
          font-size: 0.92rem;
          color: #1C1C1E;
          outline: none;
          transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
          font-family: inherit;
        }

        .ios-input:focus {
          background: #FFFFFF;
          border-color: #CC4E16;
          box-shadow: 0 0 0 3px rgba(204, 78, 22, 0.12);
        }

        .ios-input::placeholder {
          color: #AEAEB2;
        }

        .ios-select {
          width: 100%;
          height: 44px;
          padding: 0 36px 0 13px;
          background: #F9F9FB url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 12px center;
          background-size: 14px;
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid #E5E5EA;
          border-radius: 11px;
          font-size: 0.88rem;
          color: #1C1C1E;
          outline: none;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .ios-select:focus {
          background-color: #FFFFFF;
          border-color: #CC4E16;
          box-shadow: 0 0 0 3px rgba(204, 78, 22, 0.12);
        }

        .ios-input-action-group {
          display: flex;
          gap: 6px;
        }

        .ios-btn-inline {
          height: 44px;
          padding: 0 14px;
          background: #F2F2F7;
          border: 1px solid #E5E5EA;
          border-radius: 11px;
          color: #3A3A3C;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-btn-inline:hover {
          background: #E5E5EA;
        }

        .ios-error-msg {
          font-size: 0.74rem;
          color: #DC2626;
        }

        /* Aperçu produit discret */
        .ios-product-preview {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F9F9FB;
          border: 1px solid #EFEFF4;
          border-radius: 11px;
          padding: 8px 10px;
        }

        .ios-product-thumb {
          width: 44px;
          height: 44px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .ios-product-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .ios-product-platform {
          font-size: 0.68rem;
          font-weight: 600;
          color: #16A34A;
          text-transform: uppercase;
        }

        .ios-product-title {
          font-size: 0.8rem;
          font-weight: 500;
          color: #1C1C1E;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ios-product-price {
          font-size: 0.76rem;
          color: #636366;
        }

        /* Stepper Quantité */
        .ios-stepper {
          display: flex;
          align-items: center;
          height: 44px;
          background: #F9F9FB;
          border: 1px solid #E5E5EA;
          border-radius: 11px;
          overflow: hidden;
        }

        .ios-stepper-btn {
          width: 40px;
          height: 100%;
          border: none;
          background: transparent;
          font-size: 1.1rem;
          color: #3A3A3C;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
        }

        .ios-stepper-btn:hover {
          background: #EFEFF4;
        }

        .ios-stepper-input {
          flex: 1;
          height: 100%;
          border: none;
          background: transparent;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
          color: #1C1C1E;
        }

        .ios-currency-row {
          display: flex;
          gap: 6px;
        }

        .ios-select-compact {
          width: 86px;
          height: 44px;
          padding: 0 6px;
          background: #F9F9FB;
          border: 1px solid #E5E5EA;
          border-radius: 11px;
          font-size: 0.84rem;
          color: #1C1C1E;
          outline: none;
          cursor: pointer;
        }

        /* Reçu / Devis Inset */
        .ios-receipt {
          background: #F9F9FB;
          border: 1px solid #EFEFF4;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ios-receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.84rem;
          color: #636366;
        }

        .ios-receipt-row.total {
          font-size: 0.92rem;
          color: #1C1C1E;
          font-weight: 600;
        }

        .ios-receipt-row.total .bold {
          font-size: 1.15rem;
          font-weight: 700;
          color: #CC4E16;
        }

        .ios-receipt-row.total small {
          font-size: 0.8rem;
          font-weight: 500;
        }

        .ios-receipt-divider {
          height: 1px;
          background-color: #E5E5EA;
          margin: 4px 0;
        }

        .ios-note-subtle {
          font-size: 0.76rem;
          color: #8E8E93;
          margin: 4px 0 0 2px;
        }

        /* Liste de paiement */
        .ios-payment-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ios-payment-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F9F9FB;
          border: 1px solid #EFEFF4;
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-payment-row.selected {
          border-color: #CC4E16;
          background: #FFFFFF;
        }

        .ios-pay-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ios-pay-name {
          font-size: 0.84rem;
          font-weight: 600;
          color: #1C1C1E;
        }

        .ios-pay-num {
          font-size: 0.78rem;
          color: #636366;
        }

        .ios-copy-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FFFFFF;
          border: 1px solid #E5E5EA;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 0.72rem;
          font-weight: 500;
          color: #3A3A3C;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .ios-copy-pill:hover {
          background: #F2F2F7;
        }

        .ios-upload-wrap {
          margin-top: 4px;
        }

        .ios-upload-btn {
          width: 100%;
          height: 42px;
          background: #F9F9FB;
          border: 1px dashed #D1D1D6;
          border-radius: 11px;
          color: #636366;
          font-size: 0.8rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-upload-btn:hover {
          background: #F2F2F7;
          border-color: #8E8E93;
        }

        .ios-receipt-attached {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F9F9FB;
          border: 1px solid #E5E5EA;
          border-radius: 11px;
          padding: 8px 12px;
        }

        .ios-receipt-name {
          font-size: 0.8rem;
          color: #1C1C1E;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ios-receipt-remove {
          background: transparent;
          border: none;
          color: #DC2626;
          cursor: pointer;
          padding: 4px;
        }

        /* Bouton principal */
        .ios-submit-wrap {
          margin-top: 20px;
        }

        .ios-submit-btn {
          width: 100%;
          height: 48px;
          background: #CC4E16;
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ios-submit-btn:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        .ios-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Success Card iOS */
        .ios-success-card {
          text-align: center;
          padding: 28px 20px;
        }

        .ios-success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #F0FDF4;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px auto;
        }

        .ios-success-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1C1C1E;
          margin: 0 0 6px 0;
        }

        .ios-success-desc {
          font-size: 0.84rem;
          color: #636366;
          margin: 0 0 18px 0;
        }

        .ios-inset-box {
          background: #F9F9FB;
          border: 1px solid #EFEFF4;
          border-radius: 12px;
          padding: 12px 14px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .ios-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.84rem;
        }

        .ios-item-label {
          color: #8E8E93;
        }

        .ios-item-val-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ios-item-val {
          color: #1C1C1E;
          font-weight: 500;
        }

        .ios-item-val.bold {
          font-weight: 700;
          color: #CC4E16;
          font-size: 1rem;
        }

        .ios-actions-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 18px;
        }

        .ios-btn-primary {
          width: 100%;
          height: 46px;
          background: #1C1C1E;
          color: #FFFFFF;
          border-radius: 11px;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }

        .ios-btn-primary:hover {
          opacity: 0.88;
        }

        .ios-btn-secondary {
          width: 100%;
          height: 46px;
          background: #F2F2F7;
          color: #1C1C1E;
          border-radius: 11px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }

        .ios-btn-secondary:hover {
          background: #E5E5EA;
        }

        .mono {
          font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.86rem;
        }
      `}</style>
    </div>
  );
}

export default function CommandePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8E8E93", fontSize: "0.9rem" }}>
          Chargement...
        </div>
      }
    >
      <CommandeFormContent />
    </Suspense>
  );
}
