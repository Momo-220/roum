"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Copy,
  Check,
  Search,
  Upload,
  FileText,
  Trash2,
  Package,
  Plane,
  Ship,
  Sparkles,
  ExternalLink,
  Coins,
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
  minOrder?: string;
  supplier?: string;
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

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);
  const [copiedPay, setCopiedPay] = useState<string | null>(null);

  // Paramètres de paiement synchronisés en direct avec l'Admin
  const [settings, setSettings] = useState<Record<string, string>>(() => getLiveCompanySettings());

  // Tarifs officiels synchronisés en temps réel avec l'Admin
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());

  useEffect(() => {
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

  // SEULEMENT les destinations configurées et gérées côté Admin (Origine Chine)
  const adminDestinations = useMemo(() => {
    return getAdminDestinationsDetailed(tariffs, "Chine");
  }, [tariffs]);

  // Form states communs
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [destinationCity, setDestinationCity] = useState(
    adminDestinations[0]?.label || "Côte d'Ivoire — Abidjan"
  );

  // Synchronisation dynamique : si l'admin modifie les destinations, ajuster automatiquement
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

  // Pays de destination ciblé
  const currentDestCountry = useMemo(() => {
    const found = adminDestinations.find((d) => d.label === destinationCity);
    return found ? found.country : destinationCity.split("—")[0].split("(")[0].trim();
  }, [adminDestinations, destinationCity]);

  // Tarifs spécifiques dynamiques depuis l'Admin
  const matchedExpress = useMemo(() => {
    return (
      tariffs.find(
        (t) =>
          (t.origin_country || "").toLowerCase().includes("chine") &&
          (t.destination_country || "").toLowerCase().includes(currentDestCountry.toLowerCase()) &&
          ((t.shipping_mode_name || "").toLowerCase().includes("express") ||
            (t.category_tag || "").toLowerCase().includes("express"))
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
            (t.shipping_mode_name || "").toLowerCase().includes("standard"))
      ) || findTariff(tariffs, "chine", "normale")
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
            t.shipping_mode_type === "SEA")
      ) || findTariff(tariffs, "chine", "bateau")
    );
  }, [tariffs, currentDestCountry]);

  const rateAirExpress = useMemo(() => {
    const minor = matchedExpress?.price_per_unit_minor || 1200000;
    return minor > 100000 ? Math.round(minor / 100) : minor;
  }, [matchedExpress]);

  const rateAirStandard = useMemo(() => {
    const minor = matchedStandard?.price_per_unit_minor || 950000;
    return minor > 100000 ? Math.round(minor / 100) : minor;
  }, [matchedStandard]);

  const rateSea = useMemo(() => {
    const minor = matchedSea?.price_per_unit_minor || 32000000;
    return minor > 100000 ? Math.round(minor / 100) : minor;
  }, [matchedSea]);

  // MOYEN DE TRANSPORT CHOISI APRÈS LA DESTINATION
  const [selectedTransportMode, setSelectedTransportMode] = useState<"AIR_EXPRESS" | "AIR_STANDARD" | "SEA">("AIR_EXPRESS");
  const [packageWeight, setPackageWeight] = useState<number>(5);
  const [packageVolume, setPackageVolume] = useState<number>(0.1);

  const transportModeLabel = useMemo(() => {
    if (selectedTransportMode === "AIR_EXPRESS") return "Avion Express Cargo (4 à 5 jours)";
    if (selectedTransportMode === "AIR_STANDARD") return "Avion Normal Standard (10 à 14 jours)";
    return "Bateau Maritime Groupage (35 à 45 jours)";
  }, [selectedTransportMode]);

  const transportUnitRateFormatted = useMemo(() => {
    if (selectedTransportMode === "AIR_EXPRESS") return `${rateAirExpress.toLocaleString("fr-FR")} FCFA / kg`;
    if (selectedTransportMode === "AIR_STANDARD") return `${rateAirStandard.toLocaleString("fr-FR")} FCFA / kg`;
    return `${rateSea.toLocaleString("fr-FR")} FCFA / m³`;
  }, [selectedTransportMode, rateAirExpress, rateAirStandard, rateSea]);

  // Calcul du montant de transport au poids ou au volume
  const shippingQuote = useMemo(() => {
    if (selectedTransportMode === "AIR_EXPRESS") {
      return Math.round((packageWeight || 1) * rateAirExpress);
    }
    if (selectedTransportMode === "AIR_STANDARD") {
      return Math.round((packageWeight || 1) * rateAirStandard);
    }
    return Math.round((packageVolume || 0.1) * rateSea);
  }, [selectedTransportMode, packageWeight, packageVolume, rateAirExpress, rateAirStandard, rateSea]);

  // Option 1 : Sans fournisseur (Sourcing & Achat complet)
  const [productLink, setProductLink] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productUnitPrice, setProductUnitPrice] = useState<number>(15);
  const [productCurrency, setProductCurrency] = useState<"RMB" | "USD" | "FCFA">("RMB");

  // Option 2 : Avec fournisseur (Fret & Transit seul, marchandises déjà payées)
  const [clientShippingMark, setClientShippingMark] = useState("");
  const [paidToSupplier, setPaidToSupplier] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");

  // État de l'analyse automatique du lien
  const [extracting, setExtracting] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Moyen de paiement choisi & preuve de reçu uploadée (Option 1 uniquement)
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>("wave");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronisation des coordonnées bancaires et Mobile Money
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchLiveSettings = async () => {
      try {
        const res = await fetch(`/api/v1/public/settings?_t=${Date.now()}`);
        if (res.ok) {
          const d = await res.json();
          if (d && d.settings) {
            setSettings(d.settings);
            localStorage.setItem("roum_company_settings", JSON.stringify(d.settings));
          }
        }
      } catch {}
    };

    fetchLiveSettings();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "roum_company_settings" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);

    const onLocalUpdated = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };
    window.addEventListener("roum:settings_updated", onLocalUpdated);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("roum_sync_bus");
      bc.onmessage = (event) => {
        if (event.data?.type === "SETTINGS_UPDATED" && event.data.settings) {
          setSettings(event.data.settings);
        }
      };
    } catch {}

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLiveSettings();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", fetchLiveSettings);

    const pollInterval = setInterval(fetchLiveSettings, 8000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("roum:settings_updated", onLocalUpdated);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", fetchLiveSettings);
      clearInterval(pollInterval);
      if (bc) bc.close();
    };
  }, []);

  // Moyens de paiement actifs (Wave, Orange Money, Maroc)
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
        logo: <WaveLogo size={32} />,
      });
    }

    const omNum = settings.payment_orange_money_ci?.trim();
    if (omNum) {
      list.push({
        id: "orange",
        label: "Orange Money",
        type: "Code Marchand & Transfert",
        accountNumber: omNum,
        accountHolder: settings.payment_orange_name?.trim() || "ROUM TRANSIT INTERNATIONAL",
        color: "#EA580C",
        copyValue: omNum,
        logo: <OrangeMoneyLogo size={32} />,
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
        logo: <CircularFlag countryCode="MA" size={32} />,
      });
    }

    return list;
  }, [settings]);

  useEffect(() => {
    if (activePaymentMethods.length > 0) {
      const exists = activePaymentMethods.some((m) => m.id === selectedPayMethod);
      if (!exists) {
        setSelectedPayMethod(activePaymentMethods[0].id);
      }
    }
  }, [activePaymentMethods, selectedPayMethod]);

  // Analyse du lien produit
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
      if (data.title && !productQuery) {
        setProductQuery(data.title);
      }
      if (data.price && data.price > 0) {
        setProductUnitPrice(data.price);
        setProductCurrency((data.currency as "RMB" | "USD" | "FCFA") || "RMB");
      }
    } catch {
      setExtractError("Impossible d'extraire automatiquement. Renseignez le titre et le prix manuellement.");
    } finally {
      setExtracting(false);
    }
  };

  // Reçu de paiement (Option 1)
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
    reader.onload = () => {
      setReceiptDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptDataUrl(null);
    setReceiptFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Option 1 calculs financiers
  const rmbRate = 95;
  const usdRate = 620;
  const unitPriceFCFA = Math.round(
    productUnitPrice * (productCurrency === "USD" ? usdRate : productCurrency === "RMB" ? rmbRate : 1)
  );
  const totalArticlesFCFA = unitPriceFCFA * (productQuantity || 1);
  const grandTotalFCFA = totalArticlesFCFA + shippingQuote;

  const copyPayMethod = (key: string, val: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      setCopiedPay(key);
      setTimeout(() => setCopiedPay(null), 2000);
    }
  };

  const copyText = (text: string, type: "ref" | "tracking" | "mark") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "ref") {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      } else if (type === "tracking") {
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
      } else {
        setCopiedMark(true);
        setTimeout(() => setCopiedMark(false), 2000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert("Veuillez renseigner votre nom et votre numéro WhatsApp.");
      return;
    }

    if (option === "avec_fournisseur") {
      if (!productLink.trim()) {
        alert("Veuillez renseigner le lien Alibaba ou 1688 de votre article.");
        return;
      }
      if (!clientShippingMark.trim()) {
        alert("Veuillez renseigner le Shipping Mark fourni par votre fournisseur chinois.");
        return;
      }
      if (!goodsDescription.trim()) {
        alert("Veuillez renseigner la nature ou description de la marchandise.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let cargoDescription = "";

      if (option === "sans_fournisseur") {
        cargoDescription = `[SOURCING ALIBABA CONFIRMÉ] Produit: ${productQuery.trim() || extractedProduct?.title || "Article Alibaba"} | Qté: ${productQuantity} | P.U: ${productUnitPrice} ${productCurrency} (${unitPriceFCFA.toLocaleString("fr-FR")} FCFA) | Formule: ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`}) | Total: ${grandTotalFCFA.toLocaleString("fr-FR")} FCFA | Reçu: ${receiptFileName ? "OUI (joint)" : "En attente"}`;
      } else {
        cargoDescription = `[EXPÉDITION AVEC FOURNISSEUR] Shipping Mark: ${clientShippingMark.trim()} | Déjà Payé Usine: ${paidToSupplier.trim() || "Oui"} | Marchandise: ${goodsDescription.trim()} | Formule: ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`} à ${transportUnitRateFormatted}) | Devis Transit: ${shippingQuote.toLocaleString("fr-FR")} FCFA | Paiement: Mobile Money à l'arrivée`;
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
            ? `Mode: ${transportModeLabel} | Articles: ${totalArticlesFCFA.toLocaleString("fr-FR")} F | Fret: ${shippingQuote.toLocaleString("fr-FR")} F | Total: ${grandTotalFCFA.toLocaleString("fr-FR")} F`
            : `Shipping Mark: ${clientShippingMark.trim()} | Déjà Payé Usine: ${paidToSupplier.trim()} | Devis Transit: ${shippingQuote.toLocaleString("fr-FR")} FCFA`,
        shipping_mode_type: selectedTransportMode === "SEA" ? "SEA" : "AIR",
        shipping_mode_name: transportModeLabel,
        estimated_weight_kg: selectedTransportMode !== "SEA" ? packageWeight : undefined,
        estimated_cbm: selectedTransportMode === "SEA" ? packageVolume : undefined,
        cargo_type: cargoDescription,
      });

      let message = "";
      if (option === "sans_fournisseur") {
        message =
          `*NOUVELLE COMMANDE ALIBABA SOURCING N° ${res.reference}*\n` +
          `• Client : ${clientName}\n` +
          `• Téléphone : ${clientPhone}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Moyen de transport : ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`} à ${transportUnitRateFormatted})\n` +
          `• Article : ${productQuery || extractedProduct?.title || "Article Alibaba"}\n` +
          `• Quantité : ${productQuantity}\n` +
          `• Lien : ${productLink}\n` +
          `• Total Calculé : ${grandTotalFCFA.toLocaleString("fr-FR")} FCFA\n` +
          `• Règlement via : ${selectedPayMethod.toUpperCase()}\n` +
          `• Preuve de paiement : ${receiptFileName ? `Jointe (${receiptFileName})` : "À envoyer"}`;
      } else {
        message =
          `*NOUVEAU DOSSIER EXPÉDITION (AVEC FOURNISSEUR) N° ${res.reference}*\n` +
          `• N° Suivi officiel : ${res.trackingNumber}\n` +
          `• Client : ${clientName}\n` +
          `• Téléphone : ${clientPhone}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Moyen de transport : ${transportModeLabel} (${selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`} à ${transportUnitRateFormatted})\n` +
          `• Shipping Mark fournisseur : ${clientShippingMark}\n` +
          `• Montant payé au fournisseur : ${paidToSupplier || "Déjà réglé"}\n` +
          `• Lien de l'article : ${productLink}\n` +
          `• Marchandise : ${goodsDescription}\n` +
          `• Devis transit estimé : ${shippingQuote.toLocaleString("fr-FR")} FCFA\n` +
          `• Modalité de paiement : Mobile Money (Wave / Orange Money) à l'arrivée en entrepôt`;
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
    <div className="commande-page-root">
      <div className="commande-container">
        {/* Navigation retour */}
        <div className="back-nav">
          <Link href="/services" className="back-link">
            <ArrowLeft size={16} />
            <span>Retour aux services</span>
          </Link>
        </div>

        {/* En-tête */}
        <div className="page-header">
          <div className="badge-eyebrow">
            <span className="dot" />
            <span>Portail Commandes &amp; Expéditions Chine</span>
          </div>
          <h1 className="page-title">
            Passer une Commande en Chine
          </h1>
          <p className="page-subtitle">
            Collez le lien de votre article sur <strong>Alibaba, 1688 ou Taobao</strong> : devis instantané au kilo ou au mètre cube, sécurisation des achats et expédition dédouanée jusqu&apos;à votre magasin.
          </p>
        </div>

        {submitted && orderResult ? (
          <div className="success-card">
            <div className="success-icon-wrap">
              <CheckCircle2 size={46} color="#16A34A" />
            </div>
            <h2 className="success-title">
              {orderResult.option === "avec_fournisseur"
                ? "Expédition Enregistrée avec Succès !"
                : "Commande Enregistrée avec Succès !"}
            </h2>
            <p className="success-desc">
              {orderResult.option === "avec_fournisseur"
                ? "Votre dossier de transit est créé dans le système logistique. Votre numéro de suivi officiel est immédiatement actif."
                : "Votre dossier a été transmis à la Centrale d'Achat Roum Transit. Votre preuve de paiement est en cours de validation par notre caisse."}
            </p>

            <div className="reference-box">
              {/* N° Suivi / Référence */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    {orderResult.option === "avec_fournisseur" ? "Numéro de Suivi Officiel (Tracking)" : "Numéro de Dossier Officiel"}
                  </span>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1D4ED8", letterSpacing: "0.03em", fontFamily: "monospace" }}>
                    {orderResult.trackingNumber || orderResult.reference}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(orderResult.trackingNumber || orderResult.reference, "tracking")}
                  className="copy-btn-pill"
                >
                  {copiedTracking ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copiedTracking ? "Copié !" : "Copier"}</span>
                </button>
              </div>

              {/* Shipping Mark */}
              <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    Marquage Carton (Shipping Mark)
                  </span>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#CC4E16", fontFamily: "monospace" }}>
                    {orderResult.shippingMark}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(orderResult.shippingMark, "mark")}
                  className="copy-btn-pill"
                >
                  {copiedMark ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copiedMark ? "Copié !" : "Copier"}</span>
                </button>
              </div>

              {/* Récapitulatif montant & modalité */}
              <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px", marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.86rem" }}>
                  <span style={{ color: "#6B7280" }}>
                    {orderResult.option === "avec_fournisseur" ? "Devis transport estimé :" : "Montant total calculé :"}
                  </span>
                  <strong style={{ fontSize: "1.05rem", color: "#CC4E16" }}>
                    {orderResult.totalAmount?.toLocaleString("fr-FR")} FCFA
                  </strong>
                </div>

                {orderResult.option === "avec_fournisseur" ? (
                  <div style={{ marginTop: "10px", padding: "10px 12px", background: "#FEF3C7", borderRadius: "10px", fontSize: "0.8rem", color: "#92400E", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Coins size={18} />
                    <span>Règlement des frais de transit par <strong>Wave ou Orange Money</strong> lors du retrait du colis à destination.</span>
                  </div>
                ) : (
                  orderResult.receiptName && (
                    <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#16A34A" }}>
                      <CheckCircle2 size={14} />
                      <span>Reçu de paiement joint : <strong>{orderResult.receiptName}</strong></span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="success-actions">
              <Link href={`/tracking/${orderResult.trackingNumber || orderResult.reference}`} className="tracking-btn">
                <Package size={17} />
                <span>Suivre mon Colis en Direct</span>
              </Link>
              <a
                href={orderResult?.whatsappUrl || "https://wa.me/2250787994412"}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn"
              >
                <MessageCircle size={18} />
                <span>Notifier l&apos;équipe sur WhatsApp</span>
              </a>
              <Link href="/services" className="secondary-btn">
                <span>Retour aux services</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="order-form">
            {/* Choix des 2 options claires */}
            <div className="options-selector">
              <button
                type="button"
                className={`option-card ${option === "sans_fournisseur" ? "selected" : ""}`}
                onClick={() => setOption("sans_fournisseur")}
              >
                <div className="option-card-top">
                  <span className="option-num">OPTION 1 · SOURCING COMPLET</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Sans Fournisseur</h3>
                <p className="option-desc">
                  Collez le lien Alibaba / 1688 : confirmation visuelle de l&apos;article, devis transport immédiat et achat sécurisé.
                </p>
              </button>

              <button
                type="button"
                className={`option-card ${option === "avec_fournisseur" ? "selected" : ""}`}
                onClick={() => setOption("avec_fournisseur")}
              >
                <div className="option-card-top">
                  <span className="option-num">OPTION 2 · EXPÉDITION &amp; TRANSIT</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Avec Fournisseur</h3>
                <p className="option-desc">
                  Vous avez déjà payé votre usine chinoise. Nous prenons en charge le transit complet, l&apos;acheminement et le dédouanement avec règlement à l&apos;arrivée.
                </p>
              </button>
            </div>

            <div className="form-card">
              {/* ========================================================
                  ÉTAPE 1 : COORDONNÉES, DESTINATION & MOYEN DE TRANSPORT
                 ======================================================== */}
              <div className="section-heading">
                <span className="step-num">1</span>
                <div>
                  <h3>Destinataire, Destination &amp; Mode de Transport</h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    Choisissez votre destination et votre formule d&apos;acheminement avec tarifs au kilo/m³ synchronisés
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label htmlFor="clientName">Nom et Prénom *</label>
                  <input
                    id="clientName"
                    type="text"
                    required
                    placeholder="Ex : Kouamé Jean"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="clientPhone">Numéro WhatsApp (avec indicatif) *</label>
                  <input
                    id="clientPhone"
                    type="tel"
                    required
                    placeholder="Ex : +225 07 00 00 00 00"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>

                {/* Choix Destination */}
                <div className="input-group full-width">
                  <label htmlFor="destinationCity">
                    Destination Finale (Entrepôt de livraison) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    id="destinationCity"
                    className="styled-select"
                    required
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                  >
                    {adminDestinations.map((d) => (
                      <option key={d.label} value={d.label}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: "0.76rem", color: "#6B7280", marginTop: "3px" }}>
                    Dédouanement 100% inclus jusqu&apos;à votre entrepôt ou agence de destination.
                  </span>
                </div>

                {/* Choix du Moyen de Transport (immédiatement après la destination) */}
                <div className="input-group full-width" style={{ marginTop: "4px" }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Moyen de Transport Souhaité <span style={{ color: "#DC2626" }}>*</span></span>
                    <span style={{ fontSize: "0.74rem", color: "#16A34A", fontWeight: 700 }}>
                      ✓ Dédouanement inclus
                    </span>
                  </label>

                  <div className="transport-modes-selector">
                    <button
                      type="button"
                      className={`transport-mode-btn ${selectedTransportMode === "AIR_EXPRESS" ? "selected" : ""}`}
                      onClick={() => setSelectedTransportMode("AIR_EXPRESS")}
                    >
                      <div className="transport-btn-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Plane size={16} color={selectedTransportMode === "AIR_EXPRESS" ? "#CC4E16" : "#6B7280"} />
                          <strong style={{ fontSize: "0.88rem" }}>Voie Aérienne Express</strong>
                        </div>
                        <span className="speed-badge express">4 à 5 jours</span>
                      </div>
                      <div className="transport-rate-tag">
                        {rateAirExpress.toLocaleString("fr-FR")} FCFA / kg
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`transport-mode-btn ${selectedTransportMode === "AIR_STANDARD" ? "selected" : ""}`}
                      onClick={() => setSelectedTransportMode("AIR_STANDARD")}
                    >
                      <div className="transport-btn-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Plane size={16} color={selectedTransportMode === "AIR_STANDARD" ? "#CC4E16" : "#6B7280"} />
                          <strong style={{ fontSize: "0.88rem" }}>Voie Aérienne Normale</strong>
                        </div>
                        <span className="speed-badge standard">10 à 14 jours</span>
                      </div>
                      <div className="transport-rate-tag">
                        {rateAirStandard.toLocaleString("fr-FR")} FCFA / kg
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`transport-mode-btn ${selectedTransportMode === "SEA" ? "selected" : ""}`}
                      onClick={() => setSelectedTransportMode("SEA")}
                    >
                      <div className="transport-btn-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Ship size={16} color={selectedTransportMode === "SEA" ? "#CC4E16" : "#6B7280"} />
                          <strong style={{ fontSize: "0.88rem" }}>Voie Maritime Groupage</strong>
                        </div>
                        <span className="speed-badge sea">35 à 45 jours</span>
                      </div>
                      <div className="transport-rate-tag">
                        {rateSea.toLocaleString("fr-FR")} FCFA / m³
                      </div>
                    </button>
                  </div>
                </div>

                {/* Saisie Poids ou Volume selon le mode sélectionné */}
                <div className="input-group full-width" style={{ marginTop: "4px" }}>
                  <label htmlFor="packageWeightOrVolume">
                    {selectedTransportMode === "SEA"
                      ? "Volume total estimé (m³ / CBM) *"
                      : "Poids total estimé du colis (kg) *"}
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
                      placeholder="Ex : 0.25 m³"
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
                      placeholder="Ex : 5 kg"
                    />
                  )}
                  <span style={{ fontSize: "0.74rem", color: "#6B7280", marginTop: "3px" }}>
                    {selectedTransportMode === "SEA"
                      ? "Tarification au mètre cube (CBM). Pesée et cubage vérifiés au déchargement."
                      : "Pesée vidéo certifiée dès réception en magasin en Chine."}
                  </span>
                </div>
              </div>

              <div className="section-divider" />

              {/* ========================================================
                  ÉTAPE 2 : INFORMATIONS ARTICLES & FOURNISSEUR
                 ======================================================== */}
              <div className="section-heading">
                <span className="step-num">2</span>
                <div>
                  <h3>
                    {option === "sans_fournisseur"
                      ? "Lien de l'Article & Aperçu Automatique"
                      : "Informations de votre Colis & Fournisseur"}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    {option === "sans_fournisseur"
                      ? "Collez votre lien Alibaba / 1688 pour afficher automatiquement l'article et son prix"
                      : "Renseignez le lien Alibaba, le shipping mark et le montant payé à l'usine"}
                  </p>
                </div>
              </div>

              {option === "sans_fournisseur" ? (
                <div style={{ display: "grid", gap: "16px" }}>
                  {/* Champ URL avec bouton d'analyse */}
                  <div className="input-group full-width">
                    <label htmlFor="productLink">
                      Lien direct du produit Alibaba, 1688 ou Taobao <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        id="productLink"
                        type="url"
                        required
                        placeholder="https://detail.1688.com/... ou https://french.alibaba.com/p-detail/..."
                        value={productLink}
                        onChange={(e) => {
                          setProductLink(e.target.value);
                          if (e.target.value.startsWith("http") && !extractedProduct) {
                            handleExtractProduct(e.target.value);
                          }
                        }}
                        onBlur={() => {
                          if (productLink.startsWith("http") && !extractedProduct) {
                            handleExtractProduct(productLink);
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleExtractProduct()}
                        disabled={extracting || !productLink.trim()}
                        className="extract-trigger-btn"
                        title="Analyser le lien"
                      >
                        {extracting ? (
                          <span>Analyse...</span>
                        ) : (
                          <>
                            <Search size={15} />
                            <span>Voir l&apos;article</span>
                          </>
                        )}
                      </button>
                    </div>
                    {extractError && (
                      <span style={{ fontSize: "0.76rem", color: "#DC2626", marginTop: "4px", display: "block" }}>
                        {extractError}
                      </span>
                    )}
                  </div>

                  {/* CARTE D'APERÇU VISUEL DE L'ARTICLE EXTRAIT */}
                  {extractedProduct && (
                    <div className="product-preview-card">
                      <div className="product-preview-media">
                        <img
                          src={extractedProduct.image}
                          alt={extractedProduct.title}
                          className="product-preview-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/services/sourcing_warehouse.jpg";
                          }}
                        />
                        <span className="platform-tag">
                          <CheckCircle2 size={12} />
                          {extractedProduct.platform}
                        </span>
                      </div>

                      <div className="product-preview-info">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Article Détecté &amp; Confirmé
                          </span>
                          <a
                            href={extractedProduct.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.72rem", color: "#6B7280", display: "inline-flex", alignItems: "center", gap: "3px", textDecoration: "none" }}
                          >
                            <span>Ouvrir</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>

                        <h4 className="product-preview-title">{extractedProduct.title}</h4>

                        <div className="product-preview-meta-row">
                          <div className="meta-price-box">
                            <span className="meta-price-label">Prix unitaire usine :</span>
                            <strong className="meta-price-val">
                              {productUnitPrice} {productCurrency}
                            </strong>
                            <span className="meta-price-cfa">
                              (≈ {unitPriceFCFA.toLocaleString("fr-FR")} FCFA / pièce)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description et caractéristiques articles */}
                  <div className="form-grid">
                    <div className="input-group full-width">
                      <label htmlFor="productQuery">Titre / Description de l&apos;article *</label>
                      <input
                        id="productQuery"
                        type="text"
                        required
                        placeholder="Ex : Écran LCD iPhone 13 Pro, lot de téléphones..."
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="productQuantity">Quantité souhaitée *</label>
                      <div className="qty-control">
                        <button
                          type="button"
                          onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                          className="qty-btn"
                        >
                          -
                        </button>
                        <input
                          id="productQuantity"
                          type="number"
                          min="1"
                          required
                          value={productQuantity}
                          onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="qty-input"
                        />
                        <button
                          type="button"
                          onClick={() => setProductQuantity((q) => q + 1)}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="productUnitPrice">Prix unitaire ({productCurrency})</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          id="productUnitPrice"
                          type="number"
                          step="any"
                          min="0.1"
                          required
                          value={productUnitPrice}
                          onChange={(e) => setProductUnitPrice(parseFloat(e.target.value) || 0)}
                          style={{ flex: 1 }}
                        />
                        <select
                          value={productCurrency}
                          onChange={(e) => setProductCurrency(e.target.value as any)}
                          className="styled-select"
                          style={{ width: "90px" }}
                        >
                          <option value="RMB">¥ RMB</option>
                          <option value="USD">$ USD</option>
                          <option value="FCFA">FCFA</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* OPTION 2 : AVEC FOURNISSEUR (EXPÉDITION & TRANSIT SEUL) */
                <div style={{ display: "grid", gap: "16px" }}>
                  {/* Champ URL de l'article avec aperçu visuel immédiat */}
                  <div className="input-group full-width">
                    <label htmlFor="productLinkOpt2">
                      Lien direct du produit Alibaba, 1688 ou Taobao <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        id="productLinkOpt2"
                        type="url"
                        required
                        placeholder="https://detail.1688.com/... ou https://french.alibaba.com/p-detail/..."
                        value={productLink}
                        onChange={(e) => {
                          setProductLink(e.target.value);
                          if (e.target.value.startsWith("http") && !extractedProduct) {
                            handleExtractProduct(e.target.value);
                          }
                        }}
                        onBlur={() => {
                          if (productLink.startsWith("http") && !extractedProduct) {
                            handleExtractProduct(productLink);
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleExtractProduct()}
                        disabled={extracting || !productLink.trim()}
                        className="extract-trigger-btn"
                        title="Analyser le lien"
                      >
                        {extracting ? <span>Analyse...</span> : <><Search size={15} /><span>Voir</span></>}
                      </button>
                    </div>
                  </div>

                  {extractedProduct && (
                    <div className="product-preview-card">
                      <div className="product-preview-media">
                        <img
                          src={extractedProduct.image}
                          alt={extractedProduct.title}
                          className="product-preview-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/services/sourcing_warehouse.jpg";
                          }}
                        />
                        <span className="platform-tag">
                          <CheckCircle2 size={12} />
                          {extractedProduct.platform}
                        </span>
                      </div>
                      <div className="product-preview-info">
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16A34A", textTransform: "uppercase" }}>
                          Article Détecté
                        </span>
                        <h4 className="product-preview-title">{extractedProduct.title}</h4>
                      </div>
                    </div>
                  )}

                  <div className="form-grid">
                    <div className="input-group">
                      <label htmlFor="clientShippingMark">
                        Shipping Mark fournisseur (sur vos cartons) <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <input
                        id="clientShippingMark"
                        type="text"
                        required
                        placeholder="Ex : ROUM-EXP-Jean ou code usine"
                        value={clientShippingMark}
                        onChange={(e) => setClientShippingMark(e.target.value)}
                      />
                      <span style={{ fontSize: "0.74rem", color: "#6B7280", marginTop: "3px" }}>
                        Marquage attribué par votre usine chinoise
                      </span>
                    </div>

                    <div className="input-group">
                      <label htmlFor="paidToSupplier">
                        Montant déjà payé au fournisseur <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <input
                        id="paidToSupplier"
                        type="text"
                        required
                        placeholder="Ex : 5 400 RMB ou 800 $ ou 500 000 FCFA"
                        value={paidToSupplier}
                        onChange={(e) => setPaidToSupplier(e.target.value)}
                      />
                      <span style={{ fontSize: "0.74rem", color: "#16A34A", marginTop: "3px" }}>
                        Marchandises déjà réglées par vos soins
                      </span>
                    </div>

                    <div className="input-group full-width">
                      <label htmlFor="goodsDescription">
                        Nature &amp; Description de la marchandise <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <input
                        id="goodsDescription"
                        type="text"
                        required
                        placeholder="Ex : 4 cartons écrans LCD, coques téléphones, outillage..."
                        value={goodsDescription}
                        onChange={(e) => setGoodsDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="section-divider" />

              {/* ========================================================
                  ÉTAPE 3 : CALCUL AUTOMATIQUE DU DEVIS GLOBAL
                 ======================================================== */}
              <div className="section-heading">
                <span className="step-num">3</span>
                <div>
                  <h3>
                    {option === "sans_fournisseur"
                      ? "Total Estimé & Décomposition Financière"
                      : "Devis Transport & Dédouanement à Destination"}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    {option === "sans_fournisseur"
                      ? "Calcul automatique sans frais cachés : achat usine + expédition dédouanée"
                      : `Tarif calculé en fonction du poids/volume configuré pour ${destinationCity}`}
                  </p>
                </div>
              </div>

              <div className="billing-summary-box">
                <div className="billing-row">
                  <span className="billing-label">
                    <Package size={15} color="#6B7280" />
                    <span>
                      {option === "sans_fournisseur"
                        ? `Marchandises (${productQuantity} pièce${productQuantity > 1 ? "s" : ""} × ${unitPriceFCFA.toLocaleString("fr-FR")} FCFA)`
                        : `Marchandises : Déjà payées au fournisseur chinois (${paidToSupplier || "Réglé"})`}
                    </span>
                  </span>
                  <strong className="billing-val">
                    {option === "sans_fournisseur"
                      ? `${totalArticlesFCFA.toLocaleString("fr-FR")} FCFA`
                      : "RÉGLÉ PAR VOS SOINS"}
                  </strong>
                </div>

                <div className="billing-row">
                  <span className="billing-label">
                    {selectedTransportMode !== "SEA" ? (
                      <Plane size={15} color="#6B7280" />
                    ) : (
                      <Ship size={15} color="#6B7280" />
                    )}
                    <span>
                      Transport {transportModeLabel} ({selectedTransportMode === "SEA" ? `${packageVolume} m³` : `${packageWeight} kg`} à {transportUnitRateFormatted})
                    </span>
                  </span>
                  <strong className="billing-val">
                    {shippingQuote.toLocaleString("fr-FR")} FCFA
                  </strong>
                </div>

                <div className="billing-row" style={{ color: "#16A34A" }}>
                  <span className="billing-label" style={{ color: "#16A34A" }}>
                    <ShieldCheck size={15} />
                    <span>Dédouanement complet inclus jusqu&apos;à l&apos;entrepôt {destinationCity}</span>
                  </span>
                  <strong>INCLUS</strong>
                </div>

                <div className="billing-total-row">
                  <div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                      {option === "sans_fournisseur" ? "Montant Global à Régler" : "Total Devis Transport Estimé"}
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                      {option === "sans_fournisseur"
                        ? "Articles + Fret dédouané inclus"
                        : "Payable par Mobile Money à l'arrivée lors du retrait du colis"}
                    </div>
                  </div>
                  <div className="billing-total-val">
                    {(option === "sans_fournisseur" ? grandTotalFCFA : shippingQuote).toLocaleString("fr-FR")}{" "}
                    <span style={{ fontSize: "0.95rem" }}>FCFA</span>
                  </div>
                </div>
              </div>

              <div className="section-divider" />

              {/* ========================================================
                  ÉTAPE 4 : COORDONNÉES DE RÈGLEMENT OU PAIEMENT ARRIVÉE
                 ======================================================== */}
              <div className="section-heading">
                <span className="step-num">4</span>
                <div>
                  <h3>
                    {option === "sans_fournisseur"
                      ? "Comptes Officiels de Règlement"
                      : "Modalité de Paiement Mobile Money"}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    {option === "sans_fournisseur"
                      ? `Effectuez votre règlement de ${grandTotalFCFA.toLocaleString("fr-FR")} FCFA vers nos comptes officiels`
                      : "Paiement sécurisé à l'arrivée lors de la récupération de votre colis"}
                  </p>
                </div>
              </div>

              {option === "sans_fournisseur" ? (
                activePaymentMethods.length > 0 ? (
                  <div className="payment-methods-grid">
                    {activePaymentMethods.map((pm) => {
                      const isSelected = selectedPayMethod === pm.id;
                      return (
                        <div
                          key={pm.id}
                          className={`payment-method-card ${isSelected ? "active" : ""}`}
                          onClick={() => setSelectedPayMethod(pm.id)}
                        >
                          <div className="pay-card-top">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {pm.logo}
                              <strong style={{ color: pm.color, fontSize: "0.92rem" }}>{pm.label}</strong>
                            </div>
                            <span className="pay-pill-tag">{pm.type}</span>
                          </div>
                          <div
                            className="pay-account-num"
                            style={{ fontFamily: pm.id === "bank" ? "monospace" : "inherit" }}
                          >
                            {pm.accountNumber}
                          </div>
                          <div className="pay-holder-name">{pm.accountHolder}</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyPayMethod(pm.id, pm.copyValue);
                            }}
                            className="pay-copy-btn"
                          >
                            {copiedPay === pm.id ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                            <span>{copiedPay === pm.id ? "Copié !" : "Copier"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      color: "#92400E",
                      fontSize: "0.86rem",
                    }}
                  >
                    Les comptes de règlement sont en cours de mise à jour par la direction. Vous pouvez valider votre
                    commande et nos équipes vous transmettront les coordonnées sur WhatsApp.
                  </div>
                )
              ) : (
                /* OPTION 2 : PAIEMENT MOBILE MONEY À L'ARRIVÉE */
                <div className="pickup-payment-card">
                  <div className="pickup-payment-icon">
                    <Coins size={28} color="#CC4E16" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                      Paiement Mobile Money à l&apos;Arrivée du Colis
                    </h4>
                    <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                      Vos marchandises ont déjà été payées à votre fournisseur chinois. Les frais de transport et dédouanement (<strong>{shippingQuote.toLocaleString("fr-FR")} FCFA</strong>) seront à régler par <strong>Wave ou Orange Money</strong> ou en espèces lors du retrait de vos colis à notre entrepôt de destination à <strong>{destinationCity}</strong>.
                    </p>
                    <div style={{ marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#1D4ED8", fontWeight: 700 }}>
                        <WaveLogo size={20} />
                        <span>Wave accepté</span>
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#EA580C", fontWeight: 700 }}>
                        <OrangeMoneyLogo size={20} />
                        <span>Orange Money accepté</span>
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#16A34A", fontWeight: 700 }}>
                        <CheckCircle2 size={16} />
                        <span>Pesée vidéo certifiée avant retrait</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 5 : Uniquement en Option 1 pour le reçu de paiement */}
              {option === "sans_fournisseur" && (
                <>
                  <div className="section-divider" />
                  <div className="section-heading">
                    <span className="step-num">5</span>
                    <div>
                      <h3>Joindre votre Reçu ou Capture de Paiement</h3>
                      <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                        Téléversez la capture de votre écran de transfert Mobile Money ou le reçu bancaire (PNG, JPG ou PDF)
                      </p>
                    </div>
                  </div>

                  <div className="receipt-upload-zone">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleReceiptChange}
                      id="receiptUpload"
                      style={{ display: "none" }}
                    />

                    {!receiptDataUrl ? (
                      <label htmlFor="receiptUpload" className="upload-drop-area">
                        <div className="upload-icon-circle">
                          <Upload size={22} color="#CC4E16" />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <strong style={{ fontSize: "0.92rem", color: "#111827", display: "block" }}>
                            Cliquez ici ou déposez votre capture de transfert
                          </strong>
                          <span style={{ fontSize: "0.76rem", color: "#6B7280", marginTop: "2px", display: "block" }}>
                            Format PNG, JPG, WebP ou PDF (max. 10 Mo)
                          </span>
                        </div>
                      </label>
                    ) : (
                      <div className="receipt-preview-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                          {receiptFile?.type.includes("pdf") ? (
                            <div className="receipt-file-icon">
                              <FileText size={26} color="#DC2626" />
                            </div>
                          ) : (
                            <img src={receiptDataUrl} alt="Reçu de paiement" className="receipt-thumbnail" />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.86rem",
                                fontWeight: 700,
                                color: "#111827",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {receiptFileName}
                            </div>
                            <div
                              style={{
                                fontSize: "0.74rem",
                                color: "#16A34A",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                marginTop: "2px",
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Preuve prête à être validée</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveReceipt}
                          className="receipt-remove-btn"
                          title="Supprimer ce reçu"
                        >
                          <Trash2 size={15} />
                          <span>Retirer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Bouton de validation final */}
              <div className="form-actions" style={{ marginTop: "28px" }}>
                <button type="submit" disabled={submitting} className="submit-btn">
                  <span>
                    {submitting
                      ? "Enregistrement en cours..."
                      : option === "sans_fournisseur"
                      ? `Confirmer et Envoyer ma Commande (${grandTotalFCFA.toLocaleString("fr-FR")} FCFA)`
                      : `Valider l'Expédition & Obtenir mon Numéro de Suivi`}
                  </span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .commande-page-root {
          min-height: 100vh;
          background-color: #FAF6F0;
          color: #140D09;
          padding: 24px 18px 120px 18px;
        }

        .commande-container {
          max-width: 880px;
          margin: 0 auto;
        }

        .back-nav {
          margin-bottom: 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #6B635B;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 9999px;
          background: rgba(20, 13, 9, 0.05);
          transition: all 0.15s ease;
        }

        .back-link:hover {
          color: #140D09;
          background: rgba(20, 13, 9, 0.1);
        }

        .page-header {
          margin-bottom: 30px;
        }

        .badge-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #CC4E16;
          background-color: rgba(204, 78, 22, 0.08);
          padding: 4px 10px;
          border-radius: 9999px;
          margin-bottom: 12px;
        }

        .badge-eyebrow .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #CC4E16;
        }

        .page-title {
          font-size: clamp(1.8rem, 4.5vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #140D09;
          line-height: 1.15;
          margin-bottom: 12px;
        }

        .page-subtitle {
          font-size: 0.94rem;
          color: #6B635B;
          line-height: 1.5;
        }

        .page-subtitle strong {
          color: #140D09;
        }

        /* Sélecteur des 2 options */
        .options-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }

        @media (max-width: 640px) {
          .options-selector {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .option-card {
          background-color: #FFFFFF;
          border: 2px solid rgba(20, 13, 9, 0.1);
          border-radius: 18px;
          padding: 20px 18px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .option-card:hover {
          border-color: rgba(204, 78, 22, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(20, 13, 9, 0.06);
        }

        .option-card.selected {
          border-color: #CC4E16;
          background: #FFFDFB;
          box-shadow: 0 8px 24px rgba(204, 78, 22, 0.12);
        }

        .option-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .option-num {
          font-family: var(--c-font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          color: #CC4E16;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .option-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #D1D5DB;
          position: relative;
        }

        .option-card.selected .option-radio {
          border-color: #CC4E16;
          background-color: #CC4E16;
        }

        .option-card.selected .option-radio::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .option-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #140D09;
          margin: 0 0 6px 0;
        }

        .option-desc {
          font-size: 0.82rem;
          color: #6B635B;
          margin: 0;
          line-height: 1.45;
        }

        /* Formulaire */
        .form-card {
          background-color: #FFFFFF;
          border: 1px solid rgba(20, 13, 9, 0.08);
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 640px) {
          .form-card {
            padding: 24px 18px;
          }
        }

        .section-heading {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 20px;
        }

        .step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #CC4E16;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.88rem;
          flex-shrink: 0;
        }

        .section-heading h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: #140D09;
          margin: 0;
        }

        .section-divider {
          height: 1px;
          background: #E5E7EB;
          margin: 28px 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group.full-width {
          grid-column: 1 / -1;
        }

        .input-group label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 6px;
        }

        .input-group input,
        .input-group select {
          padding: 12px 14px;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          font-size: 0.88rem;
          color: #111827;
          background: #FAFAFA;
          transition: all 0.15s ease;
          outline: none;
        }

        .input-group input:focus,
        .input-group select:focus {
          border-color: #CC4E16;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(204, 78, 22, 0.15);
        }

        /* SÉLECTEUR DE MOYENS DE TRANSPORT IMMÉDIAT */
        .transport-modes-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 10px;
        }

        .transport-mode-btn {
          background: #FAFAFA;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          padding: 12px 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .transport-mode-btn:hover {
          border-color: #CC4E16;
          background: #FFFDFB;
        }

        .transport-mode-btn.selected {
          border-color: #CC4E16;
          background: #FFF9F5;
          box-shadow: 0 4px 14px rgba(204, 78, 22, 0.12);
        }

        .transport-btn-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .transport-rate-tag {
          font-size: 0.84rem;
          font-weight: 800;
          color: #CC4E16;
        }

        .speed-badge {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .speed-badge.express {
          background: #FEF2F2;
          color: #DC2626;
        }

        .speed-badge.standard {
          background: #EFF6FF;
          color: #2563EB;
        }

        .speed-badge.sea {
          background: #F0FDF4;
          color: #16A34A;
        }

        .extract-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #140D09;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }

        .extract-trigger-btn:hover:not(:disabled) {
          background: #CC4E16;
        }

        .extract-trigger-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Aperçu Produit */
        .product-preview-card {
          display: flex;
          gap: 16px;
          background: #FFFDFB;
          border: 1.5px solid rgba(204, 78, 22, 0.25);
          border-radius: 18px;
          padding: 14px;
          align-items: center;
        }

        @media (max-width: 600px) {
          .product-preview-card {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .product-preview-media {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
          background: #F3F4F6;
          flex-shrink: 0;
        }

        .product-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .platform-tag {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: rgba(20, 13, 9, 0.8);
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .product-preview-info {
          flex: 1;
          min-width: 0;
        }

        .product-preview-title {
          font-size: 0.94rem;
          font-weight: 800;
          color: #140D09;
          margin: 4px 0 8px 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-preview-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .meta-price-box {
          font-size: 0.84rem;
          color: #374151;
        }

        .meta-price-val {
          font-size: 1.05rem;
          font-weight: 800;
          color: #CC4E16;
          margin-left: 4px;
        }

        .meta-price-cfa {
          font-size: 0.76rem;
          color: #6B7280;
          margin-left: 6px;
        }

        /* Quantité avec +/- */
        .qty-control {
          display: flex;
          align-items: center;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          background: #FAFAFA;
          overflow: hidden;
        }

        .qty-btn {
          width: 38px;
          height: 42px;
          background: transparent;
          border: none;
          font-size: 1.1rem;
          font-weight: 700;
          color: #140D09;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .qty-btn:hover {
          background: #E5E7EB;
        }

        .qty-input {
          flex: 1;
          border: none !important;
          background: transparent !important;
          text-align: center;
          font-weight: 800;
          box-shadow: none !important;
          padding: 0 !important;
        }

        /* BOÎTE DE FACTURATION & TOTAL */
        .billing-summary-box {
          background: #F9FAFB;
          border: 1.5px solid #E5E7EB;
          border-radius: 18px;
          padding: 18px 20px;
          display: grid;
          gap: 10px;
        }

        .billing-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.86rem;
        }

        .billing-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #4B5563;
        }

        .billing-val {
          color: #111827;
          font-weight: 700;
        }

        .billing-total-row {
          border-top: 2px dashed #E5E7EB;
          padding-top: 14px;
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .billing-total-val {
          font-size: 1.5rem;
          font-weight: 900;
          color: #CC4E16;
        }

        /* GRILLE MOYENS DE PAIEMENT */
        .payment-methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .payment-method-card {
          background: #FFFFFF;
          border: 2px solid #E5E7EB;
          border-radius: 16px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .payment-method-card:hover {
          border-color: #CC4E16;
          box-shadow: 0 4px 12px rgba(204, 78, 22, 0.08);
        }

        .payment-method-card.active {
          border-color: #CC4E16;
          background: #FFFDFB;
          box-shadow: 0 4px 14px rgba(204, 78, 22, 0.15);
        }

        .pay-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pay-pill-tag {
          font-size: 0.68rem;
          font-weight: 700;
          background: #F3F4F6;
          color: #6B7280;
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .pay-account-num {
          font-size: 0.86rem;
          font-weight: 800;
          color: #111827;
        }

        .pay-holder-name {
          font-size: 0.72rem;
          color: #6B7280;
        }

        .pay-copy-btn {
          margin-top: 4px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 5px 8px;
          font-size: 0.74rem;
          font-weight: 600;
          color: #374151;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pay-copy-btn:hover {
          background: #F3F4F6;
          color: #111827;
        }

        /* PAIEMENT EN ENTREPÔT AU RETRAIT (OPTION 2) */
        .pickup-payment-card {
          background: #FFFDF8;
          border: 1.5px solid #F59E0B;
          border-radius: 18px;
          padding: 20px 22px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        @media (max-width: 600px) {
          .pickup-payment-card {
            flex-direction: column;
          }
        }

        .pickup-payment-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: #FEF3C7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* UPLOAD REÇU DE PAIEMENT */
        .receipt-upload-zone {
          margin-top: 4px;
        }

        .upload-drop-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 2px dashed #D1D5DB;
          border-radius: 16px;
          padding: 26px 20px;
          background: #FAFAFA;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-drop-area:hover {
          border-color: #CC4E16;
          background: #FFFDFB;
        }

        .upload-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(204, 78, 22, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .receipt-preview-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1.5px solid #16A34A;
          border-radius: 14px;
          padding: 12px 16px;
          gap: 12px;
        }

        .receipt-thumbnail {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }

        .receipt-file-icon {
          width: 50px;
          height: 50px;
          background: #FEF2F2;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .receipt-remove-btn {
          background: transparent;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .receipt-remove-btn:hover {
          background: #FEF2F2;
        }

        /* Bouton de validation */
        .submit-btn {
          width: 100%;
          background-color: #CC4E16;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          padding: 16px 24px;
          font-size: 1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 14px rgba(204, 78, 22, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #B53E0D;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(204, 78, 22, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Carte de succès */
        .success-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 40px 32px;
          text-align: center;
          border: 1px solid rgba(20, 13, 9, 0.08);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.05);
        }

        .success-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #DCFCE7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px auto;
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #140D09;
          margin: 0 0 8px 0;
        }

        .success-desc {
          font-size: 0.92rem;
          color: #6B635B;
          max-width: 540px;
          margin: 0 auto 24px auto;
          line-height: 1.5;
        }

        .reference-box {
          background: #FAF6F0;
          border: 1.5px dashed #D6CCC2;
          border-radius: 16px;
          padding: 20px;
          text-align: left;
          max-width: 480px;
          margin: 0 auto 28px auto;
        }

        .copy-btn-pill {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 0.74rem;
          font-weight: 700;
          color: #374151;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .success-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .tracking-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1D4ED8;
          color: #FFFFFF;
          text-decoration: none;
          padding: 13px 24px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.92rem;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);
          transition: background 0.15s ease;
        }

        .tracking-btn:hover {
          background: #1E40AF;
        }

        .wa-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #16A34A;
          color: #FFFFFF;
          text-decoration: none;
          padding: 13px 24px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.92rem;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
          transition: background 0.15s ease;
        }

        .wa-btn:hover {
          background: #15803D;
        }

        .secondary-btn {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: #140D09;
          border: 1px solid rgba(20, 13, 9, 0.2);
          text-decoration: none;
          padding: 13px 22px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.92rem;
        }
      `}</style>
    </div>
  );
}

export default function CommandeAchatPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Chargement du formulaire...
        </div>
      }
    >
      <CommandeFormContent />
    </Suspense>
  );
}
