"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Smartphone,
  ExternalLink,
  Camera,
  Download,
  Printer,
  ZoomIn,
  X,
} from "lucide-react";
import {
  saveClientRequest,
  getClientRequestByReference,
  submitClientPaymentProof,
  getLiveCompanySettings,
  getLiveTariffs,
  getAdminDestinationsDetailed,
  findTariff,
  OfficialTariff,
  getTrackingPageUrl,
  decodeHtmlEntitiesText,
} from "@/shared";
import {
  WaveLogo,
  OrangeMoneyLogo,
  CompteMarocLogo,
  openPaymentApp,
} from "@/components/PaymentLogos";
import {
  RoumReceiptData,
  downloadOfficialReceiptPdf,
  printOfficialReceipt,
  buildClientReceiptWhatsAppUrl,
} from "@/utils/receiptPdf";

interface PriceTier {
  minQty: number;
  maxQty: number | null;
  label: string;
  price: number;
  currency: "RMB" | "USD" | "EUR" | "FCFA";
}

interface ExtractedProduct {
  platform: string;
  title: string;
  image: string;
  rawImage?: string;
  price: number;
  currency: string;
  minOrder?: number;
  priceTiers?: PriceTier[];
  originalUrl: string;
}

function convertToFcfa(amount: number, currency?: string): number {
  const num = Number(amount) || 0;
  const curr = (currency || "USD").toUpperCase();
  if (curr === "RMB" || curr === "CNY" || curr === "¥") return Math.round(num * 88);
  if (curr === "EUR" || curr === "€") return Math.round(num * 656);
  if (curr === "FCFA" || curr === "XOF" || curr === "XAF") return Math.round(num);
  // Default USD ($ on Alibaba.com)
  return Math.round(num * 610);
}

function CommandeFormContent() {
  const searchParams = useSearchParams();
  const payRefParam = searchParams.get("pay")?.trim() || "";

  const [option, setOption] = useState<"sans_fournisseur" | "avec_fournisseur">("sans_fournisseur");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
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
    receiptData: RoumReceiptData;
    isPaymentStep?: boolean;
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
    const list = getAdminDestinationsDetailed(tariffs, "Chine");
    if (list && list.length > 0) return list;
    return [
      { label: "Côte d'Ivoire — Abidjan", country: "Côte d'Ivoire", city: "Abidjan" },
      { label: "Sénégal — Dakar", country: "Sénégal", city: "Dakar" },
      { label: "Mali — Bamako", country: "Mali", city: "Bamako" },
      { label: "Burkina Faso — Ouagadougou", country: "Burkina Faso", city: "Ouagadougou" },
      { label: "Guinée — Conakry", country: "Guinée", city: "Conakry" },
      { label: "Cameroun — Douala", country: "Cameroun", city: "Douala" },
    ];
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

  // Champs Option 1 & 2
  const [productLink, setProductLink] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productUnitPrice, setProductUnitPrice] = useState<number>(15);
  const [productCurrency, setProductCurrency] = useState<"RMB" | "USD" | "EUR" | "FCFA">("USD");

  // Option 2 spécifique
  const [clientShippingMark, setClientShippingMark] = useState("");
  const [paidToSupplier, setPaidToSupplier] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");
  const [supplierContact, setSupplierContact] = useState("");

  // Analyse et extraction automatique du lien
  const [extracting, setExtracting] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const lastExtractedUrlRef = useRef<string>("");

  // Photo spécifique de l'article mise par l'utilisateur
  const [userProductImage, setUserProductImage] = useState<string | null>(null);
  const [userProductImageName, setUserProductImageName] = useState<string>("");
  const productImageInputRef = useRef<HTMLInputElement | null>(null);

  const readImageFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUserProductImageName(file.name || "Image collée");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUserProductImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const isDirectImageUrl = (s: string) =>
    /^https?:\/\/\S+\.(jpe?g|png|webp|gif|avif)(\?\S*)?$/i.test(s.trim()) ||
    /^https?:\/\/\S*alicdn\.com\/\S*(kf|imgextra|img\/ibank)\//i.test(s.trim());

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readImageFile(file);
  };

  // Collage d'une image (copiée depuis Alibaba) ou d'un lien d'image n'importe où dans le formulaire
  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((it) => it.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        readImageFile(file);
        return;
      }
    }
    const text = e.clipboardData?.getData("text") || "";
    if (text && isDirectImageUrl(text)) {
      e.preventDefault();
      setUserProductImage(text.trim());
      setUserProductImageName("Image de l'article");
    }
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      readImageFile(file);
      return;
    }
    const url = e.dataTransfer?.getData("text/uri-list") || e.dataTransfer?.getData("text") || "";
    if (url && isDirectImageUrl(url)) {
      setUserProductImage(url.trim());
      setUserProductImageName("Image de l'article");
    }
  };

  const handleRemoveProductImage = () => {
    setUserProductImage(null);
    setUserProductImageName("");
    if (productImageInputRef.current) productImageInputRef.current.value = "";
  };

  // Extraction automatique sur collage ou saisie avec debounce
  useEffect(() => {
    if (!productLink || typeof productLink !== "string") return;
    const trimmed = productLink.trim();
    if (!trimmed || trimmed === lastExtractedUrlRef.current) return;

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.includes("alibaba.com") ||
      trimmed.includes("1688.com") ||
      trimmed.includes("taobao.com") ||
      trimmed.includes("aliexpress.com") ||
      trimmed.includes("made-in-china.com")
    ) {
      const timer = setTimeout(() => {
        lastExtractedUrlRef.current = trimmed;
        handleExtractProduct(trimmed);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [productLink]);

  // Paiement & Reçu (Étape 2 Bis)
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

    const waveNum = settings.payment_wave_ci?.trim() || "+225 07 87 99 44 12";
    list.push({
      id: "wave",
      label: "Wave Mobile Money",
      type: "Côte d'Ivoire & UEMOA (0% frais)",
      accountNumber: waveNum,
      accountHolder: settings.payment_wave_name?.trim() || "ROUM TRANSIT SARL",
      color: "#1DC3EC",
      copyValue: waveNum,
      logo: <WaveLogo size={34} />,
    });

    const omNum = settings.payment_orange_money_ci?.trim() || "+225 07 00 00 00 00";
    list.push({
      id: "orange",
      label: "Orange Money",
      type: "Transfert direct",
      accountNumber: omNum,
      accountHolder: settings.payment_orange_name?.trim() || "ROUM TRANSIT INTERNATIONAL",
      color: "#FF7900",
      copyValue: omNum,
      logo: <OrangeMoneyLogo size={34} />,
    });

    const moroccoBank = settings.payment_morocco_bank?.trim() || "CIH Bank / Attijariwafa Bank";
    const moroccoRib = settings.payment_morocco_rib?.trim() || "230 780 0001234567890123 45";
    list.push({
      id: "morocco",
      label: moroccoBank,
      type: "Virement bancaire Casablanca",
      accountNumber: moroccoRib,
      accountHolder: settings.payment_morocco_holder?.trim() || "ROUM TRANSIT MAROC",
      color: "#0F294A",
      copyValue: moroccoRib,
      logo: <CompteMarocLogo size={34} />,
    });

    return list;
  }, [settings]);

  useEffect(() => {
    if (activePaymentMethods.length > 0) {
      const exists = activePaymentMethods.some((m) => m.id === selectedPayMethod);
      if (!exists) setSelectedPayMethod(activePaymentMethods[0].id);
    }
  }, [activePaymentMethods, selectedPayMethod]);

  const handleExtractProduct = async (urlToExtract?: string) => {
    let targetUrl = (urlToExtract || productLink).trim();
    if (!targetUrl) return;
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    setExtracting(true);
    setExtractError(null);
    if (userProductImage && !userProductImage.startsWith("data:")) {
      setUserProductImage(null);
    }
    try {
      const res = await fetch("/api/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (!res.ok) throw new Error("Échec d'analyse");
      const data: ExtractedProduct = await res.json();
      setExtractedProduct(data);
      if (data.image) {
        setUserProductImage(data.image);
      }
      if (data.title && (!productQuery || productQuery === "Article Alibaba")) {
        setProductQuery(data.title);
      }
      if (option === "avec_fournisseur" && data.title && !goodsDescription) {
        setGoodsDescription(data.title);
      }
      if (data.price && data.price > 0) {
        setProductUnitPrice(data.price);
        setProductCurrency((data.currency as "RMB" | "USD" | "EUR" | "FCFA") || "USD");
      }
      if (data.minOrder && data.minOrder > 1 && productQuantity < data.minOrder) {
        setProductQuantity(data.minOrder);
      }
    } catch {
      setExtractError("Lien non analysé automatiquement. Vous pouvez renseigner la description manuellement.");
    } finally {
      setExtracting(false);
    }
  };

  // Ajustement automatique du prix unitaire selon la tranche de quantité fournisseur (MOQ)
  useEffect(() => {
    const tiers = extractedProduct?.priceTiers;
    if (!tiers || tiers.length === 0) return;
    const qty = Math.max(1, productQuantity || 1);
    const matchedTier =
      tiers.find((t) => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty)) ||
      (qty < tiers[0].minQty ? tiers[0] : tiers[tiers.length - 1]);
    if (matchedTier && matchedTier.price > 0) {
      setProductUnitPrice(matchedTier.price);
      setProductCurrency(matchedTier.currency || "USD");
    }
  }, [productQuantity, extractedProduct]);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (maximum 25 Mo).");
      return;
    }
    setReceiptFile(file);
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReceiptDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptFileName("");
    setReceiptDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyText = (txt: string, type: "tracking" | "mark") => {
    navigator.clipboard?.writeText(txt);
    if (type === "tracking") {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    } else {
      setCopiedMark(true);
      setTimeout(() => setCopiedMark(false), 2000);
    }
  };

  const copyPayMethod = (id: string, val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedPay(id);
    setTimeout(() => setCopiedPay(null), 2000);
  };

  // Calcul des conversions aux taux réels
  const unitPriceFCFA = useMemo(() => {
    return convertToFcfa(productUnitPrice, productCurrency);
  }, [productUnitPrice, productCurrency]);

  const totalArticlesFCFA = useMemo(() => {
    return Math.round(unitPriceFCFA * (productQuantity || 1));
  }, [unitPriceFCFA, productQuantity]);

  const grandTotalFCFA = useMemo(() => {
    return totalArticlesFCFA + shippingQuote;
  }, [totalArticlesFCFA, shippingQuote]);

  // Synchronisation directe Base de Données ➔ Client pour l'Étape 2 Bis (?pay=RM-...)
  const [dbPayDossier, setDbPayDossier] = useState<any | null>(null);
  useEffect(() => {
    if (!payRefParam) return;
    fetch(`/api/v1/public/requests/${encodeURIComponent(payRefParam)}?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.request) {
          setDbPayDossier(d.request);
        }
      })
      .catch(() => {});
  }, [payRefParam]);

  // Données du dossier pour l'Étape 2 Bis (quand le client clique sur le lien ?pay=RM-...)
  const payDossier = useMemo(() => {
    if (!payRefParam) return null;
    const saved = dbPayDossier || getClientRequestByReference(payRefParam);
    const savedItem = saved?.items && saved.items[0] ? saved.items[0] : {};
    const cName = searchParams.get("name") || searchParams.get("client") || saved?.client_name || "Client ROUM";
    const cPhone = searchParams.get("phone") || saved?.client_phone || "";
    const dest = searchParams.get("dest") || saved?.destination_country || "Côte d'Ivoire — Abidjan";
    const mode = searchParams.get("mode") || saved?.shipping_mode_name || "Voie Aérienne";
    const weightKgParam = searchParams.get("weight");
    const cbmParam = searchParams.get("cbm");
    const weightVal = weightKgParam
      ? `${weightKgParam} kg`
      : cbmParam
      ? `${cbmParam} m³`
      : saved?.estimated_weight_kg
      ? `${saved.estimated_weight_kg} kg`
      : saved?.estimated_cbm
      ? `${saved.estimated_cbm} m³`
      : "Estimé par ROUM";
    const goodsFcfa = Number(searchParams.get("goods") || saved?.total_goods_fcfa || 0);
    const shipFcfa = Number(searchParams.get("ship") || saved?.shipping_fee_fcfa || 0);
    const totalFcfa =
      Number(searchParams.get("total") || saved?.total_amount_fcfa || 0) || goodsFcfa + shipFcfa;
    const title = decodeHtmlEntitiesText(
      searchParams.get("title") ||
        saved?.product_name ||
        savedItem?.product_name ||
        "Article commandé"
    );
    const qty = Number(searchParams.get("qty") || saved?.product_quantity || savedItem?.quantity || 1);
    const img =
      searchParams.get("img") ||
      saved?.product_image ||
      savedItem?.product_image ||
      "";
    const url = saved?.product_url || savedItem?.product_url || "";
    const optType =
      searchParams.get("opt") === "avec_fournisseur" || saved?.option_type === "AVEC_FOURNISSEUR"
        ? ("avec_fournisseur" as const)
        : ("sans_fournisseur" as const);
    const sMark = saved?.shipping_mark || "";

    return {
      reference: payRefParam,
      clientName: cName,
      clientPhone: cPhone,
      destination: dest,
      transportMode: mode,
      weightLabel: String(weightVal).includes("kg") || String(weightVal).includes("m³") ? String(weightVal) : `${weightVal} kg`,
      goodsFcfa,
      shipFcfa,
      totalFcfa,
      productTitle: title,
      quantity: qty,
      productImage: img,
      productUrl: url,
      optionType: optType,
      shippingMark: sMark,
    };
  }, [payRefParam, searchParams, dbPayDossier]);

  // Validation Étape 2 Bis : Envoi de la preuve de paiement par le client
  const handlePaymentProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDossier) return;
    if (!receiptDataUrl) {
      alert("Veuillez joindre la capture d'écran, le reçu PDF ou la vidéo de votre paiement avant de valider.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedMethodLabel =
        activePaymentMethods.find((m) => m.id === selectedPayMethod)?.label || selectedPayMethod.toUpperCase();

      // Mise à jour ou création dans localStorage & Base de Données SQLite D1
      submitClientPaymentProof(payDossier.reference, {
        paymentMethod: selectedPayMethod,
        receiptUrl: receiptDataUrl,
        receiptName: receiptFileName || "Preuve de paiement",
        fallbackData: {
          clientName: payDossier.clientName,
          clientPhone: payDossier.clientPhone,
          destination: payDossier.destination,
          shippingMode: payDossier.transportMode,
          goodsTotalFcfa: payDossier.goodsFcfa,
          shippingFeeFcfa: payDossier.shipFcfa,
          totalAmountFcfa: payDossier.totalFcfa,
          productName: payDossier.productTitle,
          productQuantity: payDossier.quantity,
          productImage: payDossier.productImage,
          optionType: payDossier.optionType,
        },
      });

      const receiptData: RoumReceiptData = {
        receiptTitle: "REÇU DE PAIEMENT & PREUVE DE RÈGLEMENT",
        reference: payDossier.reference,
        trackingNumber: undefined,
        shippingMark: payDossier.shippingMark || undefined,
        date: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        clientName: payDossier.clientName,
        clientPhone: payDossier.clientPhone,
        origin: "Chine (Guangzhou / Yiwu)",
        destination: payDossier.destination,
        optionType: payDossier.optionType,
        transportMode: payDossier.transportMode,
        weightOrVolume: payDossier.weightLabel,
        productTitle: payDossier.productTitle,
        productUrl: payDossier.productUrl || undefined,
        productImage: payDossier.productImage || undefined,
        quantity: payDossier.quantity,
        goodsTotalFcfa: payDossier.goodsFcfa > 0 ? payDossier.goodsFcfa : undefined,
        shippingFeeFcfa: payDossier.shipFcfa,
        grandTotalFcfa: payDossier.totalFcfa,
        paymentMethodLabel: `${selectedMethodLabel} (Justificatif joint : ${receiptFileName || "Reçu"})`,
      };

      const agencyWaPhone = settings.whatsapp_number?.trim() || "2250787994412";
      const customWaUrl = buildClientReceiptWhatsAppUrl(receiptData, agencyWaPhone);

      setOrderResult({
        reference: payDossier.reference,
        trackingNumber: "",
        shippingMark: payDossier.shippingMark,
        whatsappUrl: customWaUrl,
        totalAmount: payDossier.totalFcfa,
        receiptName: receiptFileName,
        option: payDossier.optionType,
        destination: payDossier.destination,
        shippingModeDesc: payDossier.transportMode,
        receiptData,
        isPaymentStep: true,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Erreur envoi preuve de paiement:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Validation Étape 1 : Demande de commande initiale (SANS prix client, SANS poids estimé, SANS paiement immédiat)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert("Veuillez renseigner votre nom et votre numéro WhatsApp.");
      return;
    }

    if (option === "sans_fournisseur") {
      if (!productQuery.trim() && !extractedProduct?.title) {
        alert("Veuillez renseigner la description de votre article ou coller un lien Alibaba.");
        return;
      }
    } else {
      if (!clientShippingMark.trim()) {
        alert("Veuillez renseigner le Shipping Mark fourni par votre usine.");
        return;
      }
      if (!goodsDescription.trim() && !extractedProduct?.title) {
        alert("Veuillez renseigner la description ou coller le lien de votre marchandise.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const cleanTitle = decodeHtmlEntitiesText(
        productQuery.trim() ||
          extractedProduct?.title ||
          (option === "avec_fournisseur" ? goodsDescription.trim() : "Article Alibaba")
      );

      let cargoDescription = "";
      if (option === "sans_fournisseur") {
        cargoDescription = `Achat Alibaba | Produit : ${cleanTitle} | Quantité souhaitée : ${productQuantity} pcs | Transport choisi : ${transportModeLabel} (${transportUnitRateFormatted}) — Prix & Poids à estimer par ROUM`;
      } else {
        cargoDescription = `Expédition Avec Fournisseur | Shipping Mark : ${clientShippingMark.trim()} | Usine : ${paidToSupplier.trim() || "Déjà réglé"} (${supplierContact.trim() || "Contact usine"}) | Colis : ${cleanTitle} | Transport choisi : ${transportModeLabel} (${transportUnitRateFormatted}) — Poids à estimer par ROUM`;
      }

      const res = await saveClientRequest({
        service_type: "ALIBABA",
        option_type: option === "avec_fournisseur" ? "AVEC_FOURNISSEUR" : "SANS_FOURNISSEUR",
        shipping_mark: option === "avec_fournisseur" ? clientShippingMark.trim() : undefined,
        paid_to_supplier: option === "avec_fournisseur" ? paidToSupplier.trim() : undefined,
        rmb_amount: option === "avec_fournisseur" ? paidToSupplier.trim() : undefined,
        supplier_contact: option === "avec_fournisseur" ? (supplierContact.trim() || clientShippingMark.trim()) : undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        origin_country: "Chine",
        destination_country: destinationCity.trim(),
        product_url: productLink.trim(),
        product_image: userProductImage || extractedProduct?.image || undefined,
        product_name: cleanTitle,
        unit_price: undefined,
        unit_price_currency: undefined,
        total_goods_fcfa: 0,
        shipping_fee_fcfa: 0,
        total_amount_fcfa: 0,
        payment_method_selected: "EN_ATTENTE_DEVIS_ROUM",
        product_quantity: String(productQuantity || 1),
        product_specs:
          option === "sans_fournisseur"
            ? `Mode : ${transportModeLabel} (${transportUnitRateFormatted}) | Quantité : ${productQuantity} pcs | Prix & Poids : à estimer par ROUM`
            : `Shipping Mark : ${clientShippingMark.trim()} | Payé usine : ${paidToSupplier.trim()} | Mode : ${transportModeLabel} (${transportUnitRateFormatted}) | Poids : à estimer par ROUM`,
        shipping_mode_type: selectedTransportMode === "SEA" ? "SEA" : "AIR",
        shipping_mode_name: transportModeLabel,
        cargo_type: cargoDescription,
      });

      const receiptData: RoumReceiptData = {
        receiptTitle:
          option === "avec_fournisseur"
            ? "FICHE DE DEMANDE D'EXPÉDITION (ÉTAPE 1)"
            : "FICHE DE DEMANDE DE COMMANDE (ÉTAPE 1)",
        reference: res.reference,
        trackingNumber: undefined,
        shippingMark: res.shippingMark || (option === "avec_fournisseur" ? clientShippingMark.trim() : undefined),
        date: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        origin: "Chine (Guangzhou / Yiwu)",
        destination: destinationCity.trim(),
        optionType: option,
        transportMode: `${transportModeLabel} (${transportUnitRateFormatted})`,
        weightOrVolume: "En attente d'estimation par ROUM TRANSIT",
        productTitle: cleanTitle,
        productUrl: productLink.trim() || undefined,
        productImage: userProductImage || extractedProduct?.image || undefined,
        quantity: option === "sans_fournisseur" ? productQuantity : undefined,
        unitPriceLabel: undefined,
        goodsTotalFcfa: undefined,
        paidToSupplierLabel: option === "avec_fournisseur" ? paidToSupplier.trim() || undefined : undefined,
        supplierContact: option === "avec_fournisseur" ? supplierContact.trim() || undefined : undefined,
        shippingFeeFcfa: 0,
        grandTotalFcfa: 0,
        paymentMethodLabel: "Devis complet (article + poids + transport) envoyé par ROUM sur WhatsApp à l'Étape 2",
      };

      const agencyWaPhone = settings.whatsapp_number?.trim() || "2250787994412";
      const customWaUrl = buildClientReceiptWhatsAppUrl(receiptData, agencyWaPhone);

      setOrderResult({
        reference: res.reference,
        trackingNumber: "",
        shippingMark: res.shippingMark,
        whatsappUrl: customWaUrl,
        totalAmount: 0,
        receiptName: "",
        option,
        destination: destinationCity,
        shippingModeDesc: transportModeLabel,
        receiptData,
        isPaymentStep: false,
      });
      setSubmitted(true);
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
        {/* Navigation retour sobre */}
        <div className="ios-top-nav">
          <Link href="/services" className="ios-back-link">
            <ArrowLeft size={16} />
            <span>Services</span>
          </Link>
        </div>

        {/* Titre minimaliste */}
        <div className="ios-header">
          <h1 className="ios-title">
            {payDossier ? "Finaliser mon règlement" : "Passer une commande"}
          </h1>
          <p className="ios-subtitle">
            {payDossier
              ? `Étape 2 · Devis officiel & Poids estimés par ROUM TRANSIT (${payDossier.reference})`
              : "Achats et expéditions Chine vers l'Afrique aux vrais tarifs usine"}
          </p>
        </div>

        {submitted && orderResult ? (
          <div className="ios-card ios-success-card">
            <div className="ios-success-icon">
              <CheckCircle2 size={38} color="#16A34A" />
            </div>
            <h2 className="ios-success-title">
              {orderResult.isPaymentStep
                ? "Preuve de paiement & Reçu enregistrés"
                : orderResult.option === "avec_fournisseur"
                ? "Demande d'expédition enregistrée"
                : "Demande de commande enregistrée"}
            </h2>
            <p className="ios-success-desc">
              {orderResult.isPaymentStep
                ? "Votre justificatif a été transmis à ROUM TRANSIT. Dès confirmation de l'encaissement par notre équipe, vous recevrez votre Numéro de Suivi (Tracking Number) officiel sur WhatsApp."
                : "Téléchargez votre fiche PDF ci-dessous et envoyez-la sur WhatsApp à l'agence. ROUM TRANSIT estimera le poids de votre colis et vous enverra votre lien de paiement officiel."}
            </p>

            {/* Aperçu visuel de l'article sur le reçu */}
            {orderResult.receiptData.productImage && (
              <div className="ios-receipt-product-banner">
                <img
                  src={orderResult.receiptData.productImage}
                  alt={orderResult.receiptData.productTitle || "Article"}
                  className="ios-receipt-product-img"
                />
                <div className="ios-receipt-product-meta">
                  <div className="ios-receipt-product-title">
                    {orderResult.receiptData.productTitle}
                  </div>
                  <div className="ios-receipt-product-sub">
                    {orderResult.receiptData.transportMode} · {orderResult.receiptData.weightOrVolume}
                  </div>
                </div>
              </div>
            )}

            {/* Inset information */}
            <div className="ios-inset-box">
              <div className="ios-row-item">
                <span className="ios-item-label">Référence Dossier</span>
                <div className="ios-item-val-group">
                  <span className="ios-item-val mono">{orderResult.reference}</span>
                  <button
                    type="button"
                    onClick={() => copyText(orderResult.reference, "tracking")}
                    className="ios-copy-pill"
                  >
                    {copiedTracking ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                    <span>{copiedTracking ? "Copié" : "Copier"}</span>
                  </button>
                </div>
              </div>

              <div className="ios-row-item">
                <span className="ios-item-label">N° de Suivi Colis</span>
                {orderResult.trackingNumber ? (
                  <div className="ios-item-val-group">
                    <Link
                      href={`/tracking/${orderResult.trackingNumber}`}
                      className="ios-item-val mono"
                      style={{ color: "#0F766E", textDecoration: "underline", fontWeight: 800 }}
                    >
                      {orderResult.trackingNumber}
                    </Link>
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#92400E",
                      background: "#FEF3C7",
                      padding: "3px 9px",
                      borderRadius: "9999px",
                    }}
                  >
                    Attribué après validation du paiement
                  </span>
                )}
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

              <div className="ios-row-item">
                <span className="ios-item-label">Client</span>
                <span className="ios-item-val">
                  {orderResult.receiptData.clientName} ({orderResult.receiptData.clientPhone})
                </span>
              </div>

              <div className="ios-row-item">
                <span className="ios-item-label">Destination</span>
                <span className="ios-item-val">{orderResult.destination}</span>
              </div>

              <div className="ios-row-item highlight" style={{ paddingTop: "6px", borderTop: "1px solid rgba(28,24,21,0.08)" }}>
                <span className="ios-item-label">
                  {orderResult.isPaymentStep
                    ? "Total réglé (Devis ROUM)"
                    : orderResult.option === "avec_fournisseur"
                    ? "Frais de transport"
                    : "Sous-total Marchandises (Hors fret)"}
                </span>
                <span className="ios-item-val bold">
                  {orderResult.totalAmount && orderResult.totalAmount > 0
                    ? `${orderResult.totalAmount.toLocaleString("fr-FR")} FCFA`
                    : "Sur estimation du poids par ROUM"}
                </span>
              </div>
            </div>

            {/* BOUTONS PDF : TÉLÉCHARGER & IMPRIMER */}
            <div className="ios-pdf-actions-grid">
              <button
                type="button"
                onClick={() => downloadOfficialReceiptPdf(orderResult.receiptData)}
                className="ios-btn-pdf"
              >
                <Download size={16} />
                <span>Télécharger le Reçu PDF</span>
              </button>
              <button
                type="button"
                onClick={() => printOfficialReceipt(orderResult.receiptData)}
                className="ios-btn-print"
              >
                <Printer size={16} />
                <span>Imprimer le Reçu (A4)</span>
              </button>
            </div>

            <div className="ios-actions-stack">
              <a
                href={orderResult.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ios-btn-whatsapp-agency"
              >
                <MessageCircle size={18} />
                <span>
                  {orderResult.isPaymentStep
                    ? "Confirmer mon paiement sur WhatsApp à l'agence"
                    : "Envoyer ma commande sur WhatsApp à l'agence"}
                </span>
              </a>
            </div>
          </div>
        ) : payDossier ? (
          /* ÉTAPE 2 BIS : ÉCRAN DE RÈGLEMENT & ENVOI DE LA PREUVE DE PAIEMENT */
          <form onSubmit={handlePaymentProofSubmit} className="ios-form-root">
            <div className="ios-card">
              <div className="ios-section">
                <div className="ios-section-caption">Récapitulatif &amp; Devis validé par ROUM TRANSIT</div>

                {payDossier.productImage && (
                  <div className="ios-product-preview-card" style={{ marginTop: 0 }}>
                    <div className="ios-product-preview-main">
                      <div
                        className="ios-product-preview-thumb-wrap"
                        onClick={() => setZoomImageUrl(payDossier.productImage)}
                        title="Cliquez pour agrandir la photo"
                      >
                        <img
                          src={payDossier.productImage}
                          alt={payDossier.productTitle}
                          className="ios-product-preview-thumb"
                        />
                        <span className="ios-thumb-zoom-hint">
                          <ZoomIn size={12} />
                        </span>
                      </div>
                      <div className="ios-product-preview-body">
                        <span className="ios-product-preview-badge">✓ Dossier vérifié par ROUM TRANSIT</span>
                        <div className="ios-product-preview-title">{payDossier.productTitle}</div>
                        <div style={{ fontSize: "0.8rem", color: "#524B43", fontWeight: 600 }}>
                          Quantité : {payDossier.quantity} pcs · Destination : {payDossier.destination}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ios-receipt">
                  <div className="ios-receipt-row">
                    <span>Référence Dossier</span>
                    <span className="mono" style={{ fontWeight: 700, color: "#1C1815" }}>
                      {payDossier.reference}
                    </span>
                  </div>
                  <div className="ios-receipt-row">
                    <span>Client</span>
                    <span>
                      {payDossier.clientName} {payDossier.clientPhone ? `(${payDossier.clientPhone})` : ""}
                    </span>
                  </div>
                  <div className="ios-receipt-row">
                    <span>Moyen de transport</span>
                    <span>{payDossier.transportMode}</span>
                  </div>
                  <div className="ios-receipt-row">
                    <span style={{ fontWeight: 700, color: "#166534" }}>Poids / Volume estimé par ROUM</span>
                    <span
                      className="mono"
                      style={{
                        fontWeight: 800,
                        color: "#166534",
                        background: "#DCFCE7",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                      }}
                    >
                      {payDossier.weightLabel}
                    </span>
                  </div>

                  <div className="ios-receipt-divider" />

                  {payDossier.goodsFcfa > 0 && (
                    <div className="ios-receipt-row">
                      <span>Sous-total Marchandises ({payDossier.quantity} pcs)</span>
                      <span className="mono">{payDossier.goodsFcfa.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )}
                  <div className="ios-receipt-row">
                    <span>Frais de Transport &amp; Douane ({payDossier.weightLabel})</span>
                    <span className="mono">{payDossier.shipFcfa.toLocaleString("fr-FR")} FCFA</span>
                  </div>

                  <div className="ios-receipt-divider" />

                  <div className="ios-receipt-row total">
                    <span>Total officiel à régler</span>
                    <span className="bold" style={{ color: "#16A34A" }}>
                      {payDossier.totalFcfa.toLocaleString("fr-FR")} <small>FCFA</small>
                    </span>
                  </div>
                </div>
              </div>

              <div className="ios-divider" />

              <div className="ios-section">
                <div className="ios-section-caption">1. Choisissez votre moyen de paiement officiel</div>
                <div className="ios-payment-list">
                  {activePaymentMethods.map((pm) => {
                    const isSelected = selectedPayMethod === pm.id;
                    const isBankRib = pm.id === "morocco";
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
                            <div style={{ fontSize: "0.72rem", color: "#8E8E93" }}>{pm.accountHolder}</div>
                          </div>
                        </div>
                        <div className="ios-pay-actions">
                          {!isBankRib && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentApp(pm.id, pm.copyValue);
                              }}
                              className="ios-open-app-pill"
                            >
                              <Smartphone size={12} />
                              <span>Ouvrir l&apos;app</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyPayMethod(pm.id, pm.copyValue);
                            }}
                            className="ios-copy-pill"
                          >
                            {copiedPay === pm.id ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                            <span>{copiedPay === pm.id ? "Copié" : isBankRib ? "Copier le RIB" : "Copier"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ios-section-caption" style={{ marginTop: "10px" }}>
                  2. Joignez votre preuve de paiement (capture d&apos;écran, reçu PDF ou vidéo)
                </div>
                <div className="ios-upload-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf"
                    onChange={handleReceiptChange}
                    style={{ display: "none" }}
                    id="receiptUploadPay"
                  />
                  {!receiptFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="ios-upload-btn"
                      style={{ height: "54px", borderColor: "#C5A265", background: "#FFFBEB", color: "#92400E" }}
                    >
                      <Upload size={16} />
                      <span>Cliquez ici pour joindre votre preuve de paiement</span>
                    </button>
                  ) : (
                    <div className="ios-receipt-attached" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px", borderRadius: "16px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="ios-receipt-name">
                          ✓ Preuve jointe : {receiptFileName}
                        </span>
                        <button type="button" onClick={handleRemoveReceipt} className="ios-receipt-remove" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {receiptDataUrl && receiptDataUrl.startsWith("data:image/") && (
                        <img
                          src={receiptDataUrl}
                          alt="Preuve de paiement"
                          style={{ maxHeight: "160px", objectFit: "contain", borderRadius: "10px", background: "#FFFFFF" }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="ios-submit-wrap">
                <button type="submit" disabled={submitting} className="ios-submit-btn">
                  {submitting ? "Envoi en cours..." : "Envoyer ma preuve de paiement & Générer mon reçu"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} onPaste={handlePasteImage} className="ios-form-root">
            {/* Input unique pour l'image de l'article (accessible Option 1 & Option 2) */}
            <input
              ref={productImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleProductImageUpload}
              style={{ display: "none" }}
            />

            {/* iOS Segmented Control en pilule */}
            <div className="ios-segmented-control" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={option === "sans_fournisseur"}
                className={`ios-segmented-btn ${option === "sans_fournisseur" ? "active" : ""}`}
                onClick={() => setOption("sans_fournisseur")}
              >
                <span className="ios-seg-prefix">Option 1 · </span>Sans Fournisseur
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={option === "avec_fournisseur"}
                className={`ios-segmented-btn ${option === "avec_fournisseur" ? "active" : ""}`}
                onClick={() => setOption("avec_fournisseur")}
              >
                <span className="ios-seg-prefix">Option 2 · </span>Avec Fournisseur
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

                {/* Moyen de transport dans un menu déroulant */}
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
                  <p className="ios-note-subtle" style={{ marginTop: "4px", color: "#524B43" }}>
                    ✓ Vous n&apos;avez pas besoin de connaître le poids de votre article :{" "}
                    <strong>ROUM TRANSIT l&apos;estimera pour vous</strong> ({transportUnitRateFormatted}) avant de vous envoyer votre lien de règlement.
                  </p>
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
                          placeholder="Collez le lien Alibaba ou 1688 (détection instantanée)"
                          value={productLink}
                          onChange={(e) => setProductLink(e.target.value)}
                          className="ios-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleExtractProduct()}
                          disabled={extracting || !productLink.trim()}
                          className="ios-btn-inline"
                          title="Rechercher / actualiser"
                        >
                          <Search size={15} />
                        </button>
                      </div>
                      {extractError && <span className="ios-error-msg">{extractError}</span>}
                    </div>

                    {/* Aperçu instantané et photo agrandie du produit détecté depuis le lien + Tranches de prix */}
                    {(userProductImage || (extractedProduct && (extractedProduct.image || extractedProduct.title))) ? (
                      <div className="ios-product-preview-card">
                        <div className="ios-product-preview-main">
                          <div
                            className="ios-product-preview-thumb-wrap"
                            onClick={() => {
                              const img = userProductImage || extractedProduct?.image;
                              if (img) setZoomImageUrl(img);
                            }}
                            title="Cliquez pour agrandir la photo du produit"
                          >
                            {(userProductImage || extractedProduct?.image) ? (
                              <>
                                <img
                                  src={userProductImage || extractedProduct?.image || ""}
                                  alt={extractedProduct?.title || "Article"}
                                  className="ios-product-preview-thumb"
                                  onError={(e) => {
                                    const currentSrc = e.currentTarget.getAttribute("src") || "";
                                    if (currentSrc.startsWith("http") && !currentSrc.includes("/api/image-proxy")) {
                                      e.currentTarget.src = `/api/image-proxy?url=${encodeURIComponent(currentSrc)}`;
                                    } else {
                                      setUserProductImage(null);
                                      setExtractedProduct((prev) => (prev ? { ...prev, image: "" } : null));
                                    }
                                  }}
                                />
                                <span className="ios-thumb-zoom-hint">
                                  <ZoomIn size={12} />
                                </span>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  productImageInputRef.current?.click();
                                }}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "none",
                                  background: "#F7F5F0",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  color: "#8E877E",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                }}
                                title="Ajouter la photo de l'article"
                              >
                                <Camera size={22} />
                                <span>Photo</span>
                              </button>
                            )}
                          </div>

                          <div className="ios-product-preview-body">
                            <div className="ios-product-preview-header">
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <span className="ios-product-preview-platform">
                                  {extractedProduct?.platform || "ALIBABA"}
                                </span>
                                <span className="ios-product-preview-badge">
                                  ✓ Article &amp; Photo détectés
                                </span>
                              </div>
                              <div className="ios-preview-top-actions">
                                <button
                                  type="button"
                                  onClick={() => productImageInputRef.current?.click()}
                                  className="ios-preview-mini-pill"
                                  title="Changer la photo"
                                >
                                  <Camera size={11} />
                                  <span>Photo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveProductImage}
                                  className="ios-preview-remove-btn"
                                  title="Retirer l'aperçu"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="ios-product-preview-title" title={decodeHtmlEntitiesText(extractedProduct?.title || productQuery)}>
                              {decodeHtmlEntitiesText(extractedProduct?.title || productQuery || "Article sélectionné")}
                            </div>

                            <div className="ios-product-preview-price-row">
                              <span style={{ fontSize: "0.78rem", color: "#524B43", fontWeight: 600 }}>
                                Indiquez votre quantité ci-dessous · ROUM TRANSIT s&apos;occupe du tarif usine &amp; du poids
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => productImageInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropImage}
                        className="ios-article-upload-zone"
                      >
                        <Camera size={15} />
                        <span>Ou joindre / coller une photo directement</span>
                      </button>
                    )}

                    <div className="ios-field">
                      <label htmlFor="productQuery">Description de l&apos;article (modèle, couleur, taille)</label>
                      <input
                        id="productQuery"
                        type="text"
                        required
                        placeholder="Ex: Écrans iPhone, Vêtements taille L, Pièces auto..."
                        value={decodeHtmlEntitiesText(productQuery)}
                        onChange={(e) => setProductQuery(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <div className="ios-field">
                      <label htmlFor="productQuantity">Quantité souhaitée</label>
                      <div className="ios-stepper" style={{ maxWidth: "240px" }}>
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
                          value={productQuantity === 0 ? "" : productQuantity}
                          onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
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
                  </>
                ) : (
                  <>
                    {/* OPTION 2 : LIEN ARTICLE ALIBABA / 1688 AVEC AUTO-EXTRACTION & PHOTO */}
                    <div className="ios-field">
                      <label htmlFor="productLink">Lien de l&apos;article Alibaba, 1688 ou Taobao</label>
                      <div className="ios-input-action-group">
                        <input
                          id="productLink"
                          type="url"
                          placeholder="Collez le lien Alibaba du produit payé chez votre fournisseur"
                          value={productLink}
                          onChange={(e) => setProductLink(e.target.value)}
                          className="ios-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleExtractProduct()}
                          disabled={extracting || !productLink.trim()}
                          className="ios-btn-inline"
                          title="Rechercher / actualiser"
                        >
                          <Search size={15} />
                        </button>
                      </div>
                      {extractError && <span className="ios-error-msg">{extractError}</span>}
                    </div>

                    {/* Aperçu instantané et photo agrandie du produit détecté depuis le lien */}
                    {(userProductImage || (extractedProduct && (extractedProduct.image || extractedProduct.title))) ? (
                      <div className="ios-product-preview-card">
                        <div className="ios-product-preview-main">
                          <div
                            className="ios-product-preview-thumb-wrap"
                            onClick={() => {
                              const img = userProductImage || extractedProduct?.image;
                              if (img) setZoomImageUrl(img);
                            }}
                            title="Cliquez pour agrandir la photo du produit"
                          >
                            {(userProductImage || extractedProduct?.image) ? (
                              <>
                                <img
                                  src={userProductImage || extractedProduct?.image || ""}
                                  alt={decodeHtmlEntitiesText(extractedProduct?.title || "Article")}
                                  className="ios-product-preview-thumb"
                                  onError={(e) => {
                                    const currentSrc = e.currentTarget.getAttribute("src") || "";
                                    if (currentSrc.startsWith("http") && !currentSrc.includes("/api/image-proxy")) {
                                      e.currentTarget.src = `/api/image-proxy?url=${encodeURIComponent(currentSrc)}`;
                                    } else {
                                      setUserProductImage(null);
                                      setExtractedProduct((prev) => (prev ? { ...prev, image: "" } : null));
                                    }
                                  }}
                                />
                                <span className="ios-thumb-zoom-hint">
                                  <ZoomIn size={12} />
                                </span>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  productImageInputRef.current?.click();
                                }}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "none",
                                  background: "#F7F5F0",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  color: "#8E877E",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                }}
                                title="Ajouter la photo de l'article"
                              >
                                <Camera size={22} />
                                <span>Photo</span>
                              </button>
                            )}
                          </div>

                          <div className="ios-product-preview-body">
                            <div className="ios-product-preview-header">
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <span className="ios-product-preview-platform">
                                  {extractedProduct?.platform || "ALIBABA"}
                                </span>
                                <span className="ios-product-preview-badge">
                                  ✓ Article &amp; Photo détectés
                                </span>
                              </div>
                              <div className="ios-preview-top-actions">
                                <button
                                  type="button"
                                  onClick={() => productImageInputRef.current?.click()}
                                  className="ios-preview-mini-pill"
                                  title="Changer la photo"
                                >
                                  <Camera size={11} />
                                  <span>Photo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveProductImage}
                                  className="ios-preview-remove-btn"
                                  title="Retirer l'aperçu"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="ios-product-preview-title" title={decodeHtmlEntitiesText(extractedProduct?.title || goodsDescription)}>
                              {decodeHtmlEntitiesText(extractedProduct?.title || goodsDescription || "Article sélectionné")}
                            </div>

                            <div className="ios-product-preview-price-row">
                              <span style={{ fontSize: "0.78rem", color: "#524B43", fontWeight: 600 }}>
                                Expédition &amp; poids calculés par ROUM TRANSIT
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => productImageInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropImage}
                        className="ios-article-upload-zone"
                      >
                        <Camera size={15} />
                        <span>Ou joindre / coller une photo directement</span>
                      </button>
                    )}

                    <div className="ios-field">
                      <label htmlFor="goodsDescription">Description de la marchandise</label>
                      <input
                        id="goodsDescription"
                        type="text"
                        required
                        placeholder="Ex : 4 cartons pièces détachées, vêtements, écrans..."
                        value={decodeHtmlEntitiesText(goodsDescription)}
                        onChange={(e) => setGoodsDescription(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <div className="ios-grid-2">
                      <div className="ios-field">
                        <label htmlFor="clientShippingMark">Shipping Mark fournisseur</label>
                        <input
                          id="clientShippingMark"
                          type="text"
                          required
                          placeholder="Ex : ROUM-EXP-Amadou ou code usine"
                          value={clientShippingMark}
                          onChange={(e) => setClientShippingMark(e.target.value)}
                          className="ios-input"
                        />
                      </div>

                      <div className="ios-field">
                        <label htmlFor="paidToSupplier">Montant payé à l&apos;usine</label>
                        <input
                          id="paidToSupplier"
                          type="text"
                          required
                          placeholder="Ex : 1 200 $ USD ou 8 450 RMB ¥"
                          value={paidToSupplier}
                          onChange={(e) => setPaidToSupplier(e.target.value)}
                          className="ios-input"
                        />
                      </div>
                    </div>

                    <div className="ios-field">
                      <label htmlFor="supplierContact">Contact Fournisseur Chine (WeChat, WhatsApp ou Tél)</label>
                      <input
                        id="supplierContact"
                        type="text"
                        placeholder="Ex : WeChat: sz_electronics ou +86 138 0000 0000"
                        value={supplierContact}
                        onChange={(e) => setSupplierContact(e.target.value)}
                        className="ios-input"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="ios-divider" />

              {/* SECTION 3 : RÉCAPITULATIF MARCHANDISES & MODALITÉS DE TRANSPORT */}
              <div className="ios-section">
                <div className="ios-section-caption">Récapitulatif de votre commande</div>

                <div className="ios-receipt">
                  {option === "sans_fournisseur" ? (
                    <div className="ios-receipt-row">
                      <span>Quantité souhaitée</span>
                      <span className="mono" style={{ fontWeight: 700, color: "#1C1815" }}>
                        {productQuantity} unité(s)
                      </span>
                    </div>
                  ) : (
                    <div className="ios-receipt-row">
                      <span>Marchandise réglée fournisseur</span>
                      <span className="mono">{paidToSupplier || "Réglé à l'usine"}</span>
                    </div>
                  )}

                  <div className="ios-receipt-row">
                    <span>Moyen de transport souhaité</span>
                    <span style={{ fontWeight: 600, color: "#1C1815" }}>{transportModeLabel}</span>
                  </div>

                  <div className="ios-receipt-row">
                    <span>Tarif officiel du transport</span>
                    <span className="mono">{transportUnitRateFormatted}</span>
                  </div>

                  <div className="ios-receipt-row">
                    <span>Prix article &amp; Poids du colis</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#92400E",
                        background: "#FEF3C7",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                      }}
                    >
                      Calculés par ROUM TRANSIT
                    </span>
                  </div>

                  <div className="ios-receipt-divider" />

                  <div className="ios-receipt-row total">
                    <span>Montant total à régler</span>
                    <span className="bold">
                      <small style={{ fontSize: "0.84rem", fontWeight: 700, color: "#166534" }}>
                        Devis complet envoyé par ROUM sur WhatsApp
                      </small>
                    </span>
                  </div>
                </div>
              </div>

              <div className="ios-divider" />

              {/* SECTION 4 : PROCESSUS EN 3 ÉTAPES (AUCUN PAIEMENT IMMÉDIAT REQUIS ICI) */}
              <div className="ios-section">
                <div className="ios-section-caption">Comment fonctionne la validation &amp; le règlement ?</div>
                <div
                  style={{
                    background: "#F7F5F0",
                    border: "1px solid rgba(197, 162, 101, 0.35)",
                    borderRadius: "18px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    fontSize: "0.82rem",
                    color: "#3F3A34",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "#1C1815",
                        color: "#FFFFFF",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      1
                    </span>
                    <div>
                      <strong style={{ color: "#1C1815" }}>Envoi de votre commande (Sans paiement immédiat)</strong>
                      <div style={{ color: "#716C65", fontSize: "0.78rem", marginTop: "1px" }}>
                        Validez votre demande ci-dessous pour obtenir votre fiche PDF et l&apos;envoyer sur WhatsApp à ROUM TRANSIT.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "#C5A265",
                        color: "#FFFFFF",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      2
                    </span>
                    <div>
                      <strong style={{ color: "#1C1815" }}>Estimation du poids &amp; Lien de paiement sur WhatsApp</strong>
                      <div style={{ color: "#716C65", fontSize: "0.78rem", marginTop: "1px" }}>
                        Notre équipe estime le poids réel de votre article, calcule le devis exact et vous envoie sur WhatsApp un{" "}
                        <strong>lien de paiement officiel</strong> (Wave, Orange Money ou Compte Maroc) pour joindre votre reçu.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "#16A34A",
                        color: "#FFFFFF",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      3
                    </span>
                    <div>
                      <strong style={{ color: "#1C1815" }}>Confirmation d&apos;encaissement &amp; N° de Suivi Officiel</strong>
                      <div style={{ color: "#716C65", fontSize: "0.78rem", marginTop: "1px" }}>
                        Dès confirmation de votre paiement, nous vous envoyons votre{" "}
                        <strong>Tracking Number cliquable</strong> pour suivre votre colis en direct jusqu&apos;à destination.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOUTON D'ACTION PRINCIPAL EN PILULE */}
              <div className="ios-submit-wrap">
                <button type="submit" disabled={submitting} className="ios-submit-btn">
                  {submitting
                    ? "Enregistrement..."
                    : option === "sans_fournisseur"
                    ? "Envoyer ma commande (Estimation du poids par ROUM)"
                    : "Créer mon dossier d'expédition"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ios-page-wrap {
          min-height: 100vh;
          background-color: #FAF8F5;
          padding: 24px 16px 80px 16px;
          color: #1C1815;
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
          color: #1C1815;
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 0;
          transition: opacity 0.15s ease;
        }

        .ios-back-link:hover {
          opacity: 0.7;
        }

        .ios-header {
          margin-bottom: 20px;
        }

        .ios-title {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: #1C1815;
          margin: 0 0 4px 0;
          text-wrap: balance;
        }

        .ios-subtitle {
          font-size: 0.88rem;
          color: #716C65;
          margin: 0;
        }

        /* Segmented Control iOS en pilule */
        .ios-segmented-control {
          background: #EFECE6;
          border-radius: 9999px;
          padding: 4px;
          display: flex;
          width: 100%;
          gap: 4px;
          margin-bottom: 18px;
        }

        .ios-segmented-btn {
          flex: 1 1 50%;
          min-width: 0;
          height: 38px;
          border: none;
          background: transparent;
          color: #716C65;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          padding: 0 8px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ios-segmented-btn.active {
          background: #FFFFFF;
          color: #1C1815;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(28, 24, 21, 0.08);
        }

        /* Carte de surface iOS épurée */
        .ios-card {
          background: #FFFFFF;
          border-radius: 26px;
          border: 1px solid rgba(28, 24, 21, 0.06);
          box-shadow: 0 4px 24px -2px rgba(28, 24, 21, 0.04);
          padding: 24px 22px;
        }

        .ios-section {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .ios-section-caption {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #8E877E;
          margin-bottom: 2px;
        }

        .ios-divider {
          height: 1px;
          background-color: rgba(28, 24, 21, 0.06);
          margin: 18px 0;
        }

        .ios-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .ios-grid-2 {
            grid-template-columns: 1fr;
          }
          .ios-page-wrap {
            padding: 16px 12px 60px 12px;
          }
          .ios-card {
            padding: 20px 14px;
            border-radius: 20px;
          }
          .ios-segmented-control {
            padding: 3px;
          }
          .ios-segmented-btn {
            height: 36px;
            font-size: 0.78rem;
            padding: 0 6px;
          }
          .ios-seg-prefix {
            display: none;
          }
        }

        .ios-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ios-field label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #524B43;
        }

        /* Espaces de typing doux iOS, dé-cadrés */
        .ios-input {
          width: 100%;
          height: 46px;
          padding: 0 16px;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.07);
          border-radius: 16px;
          font-size: 0.92rem;
          color: #1C1815;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .ios-input:focus {
          background: #FFFFFF;
          border-color: #C5A265;
          box-shadow: 0 0 0 3px rgba(197, 162, 101, 0.2);
        }

        .ios-input::placeholder {
          color: #A39D93;
        }

        /* Suppression stricte des flèches spinners (upper / lower) */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }

        .ios-select {
          width: 100%;
          height: 46px;
          padding: 0 38px 0 16px;
          background: #F7F5F0 url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23716C65' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 14px center;
          background-size: 14px;
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid rgba(28, 24, 21, 0.07);
          border-radius: 16px;
          font-size: 0.9rem;
          color: #1C1815;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .ios-select:focus {
          background-color: #FFFFFF;
          border-color: #C5A265;
          box-shadow: 0 0 0 3px rgba(197, 162, 101, 0.2);
        }

        .ios-select option {
          color: #1C1815;
          background: #FFFFFF;
        }

        .ios-input-action-group {
          display: flex;
          gap: 6px;
        }

        .ios-btn-inline {
          height: 46px;
          padding: 0 16px;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.07);
          border-radius: 9999px;
          color: #1C1815;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .ios-btn-inline:hover {
          background: #EAE6DE;
        }

        .ios-error-msg {
          font-size: 0.74rem;
          color: #DC2626;
        }

        /* Zone d'import de la photo réelle de l'article par l'utilisateur */
        .ios-article-upload-zone {
          width: 100%;
          min-height: 48px;
          background: #F7F5F0;
          border: 1.5px dashed rgba(28, 24, 21, 0.16);
          border-radius: 16px;
          color: #716C65;
          font-size: 0.82rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .ios-article-upload-zone:hover {
          background: #EFECE6;
          border-color: #1C1815;
          color: #1C1815;
        }

        .ios-article-photo-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFFFFF;
          border: 1px solid rgba(28, 24, 21, 0.1);
          border-radius: 16px;
          padding: 8px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .ios-article-photo-thumb {
          width: 52px;
          height: 52px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid rgba(28, 24, 21, 0.08);
          background: #F7F5F0;
          flex-shrink: 0;
        }

        .ios-article-photo-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .ios-article-photo-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #16A34A;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .ios-article-photo-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #1C1815;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ios-article-photo-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .ios-photo-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(28, 24, 21, 0.1);
          background: #F7F5F0;
          color: #1C1815;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-photo-action-btn:hover {
          background: #EAE6DE;
        }

        .ios-photo-action-btn.danger {
          color: #DC2626;
          border-color: rgba(220, 38, 38, 0.2);
          background: #FEF2F2;
        }

        .ios-photo-action-btn.danger:hover {
          background: #FEE2E2;
        }

        /* Carte de prévisualisation directe agrandie du produit extrait par le lien */
        .ios-product-preview-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #F7F5F0;
          border: 1.5px solid rgba(197, 162, 101, 0.35);
          border-radius: 22px;
          padding: 16px;
          margin-top: 6px;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 0 6px 20px -4px rgba(28, 24, 21, 0.06);
        }

        .ios-product-preview-main {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .ios-product-preview-thumb-wrap {
          position: relative;
          width: 118px;
          height: 118px;
          flex-shrink: 0;
          border-radius: 18px;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid rgba(28, 24, 21, 0.1);
          cursor: zoom-in;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 640px) {
          .ios-product-preview-thumb-wrap {
            width: 96px;
            height: 96px;
            border-radius: 15px;
          }
          .ios-product-preview-main {
            gap: 12px;
          }
        }

        .ios-product-preview-thumb {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          background: #FFFFFF;
          padding: 4px;
        }

        .ios-thumb-zoom-hint {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(28, 24, 21, 0.65);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          pointer-events: none;
        }

        .ios-product-preview-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ios-product-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .ios-preview-top-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .ios-preview-mini-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FFFFFF;
          border: 1px solid rgba(28, 24, 21, 0.12);
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #1C1815;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-preview-mini-pill:hover {
          background: #EAE6DE;
        }

        .ios-product-preview-platform {
          font-size: 0.66rem;
          font-weight: 800;
          background: #DCFCE7;
          color: #166534;
          padding: 3px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }

        .ios-product-preview-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: #16A34A;
        }

        .ios-product-preview-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #1C1815;
          line-height: 1.38;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ios-product-preview-price-row {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }

        .ios-product-preview-price-cny {
          font-size: 1.02rem;
          font-weight: 800;
          color: #C2410C;
        }

        .ios-product-preview-price-cfa {
          font-size: 0.76rem;
          font-weight: 600;
          color: #716C65;
        }

        /* Grille de prix par tranches (MOQ Alibaba / 1688) */
        .ios-tiers-box {
          background: #FFFFFF;
          border: 1px solid rgba(28, 24, 21, 0.08);
          border-radius: 16px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ios-tiers-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.7rem;
          font-weight: 700;
          color: #716C65;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .ios-moq-tag {
          background: #FEF3C7;
          color: #92400E;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .ios-tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
          gap: 8px;
        }

        .ios-tier-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1.5px solid rgba(28, 24, 21, 0.08);
          background: #FAF8F5;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .ios-tier-pill:hover {
          border-color: #C5A265;
          background: #FFFFFF;
        }

        .ios-tier-pill.active {
          border-color: #16A34A;
          background: #ECFDF5;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.12);
        }

        .ios-tier-qty {
          font-size: 0.7rem;
          font-weight: 700;
          color: #524B43;
        }

        .ios-tier-pill.active .ios-tier-qty {
          color: #166534;
        }

        .ios-tier-price {
          font-size: 0.88rem;
          font-weight: 800;
          color: #1C1815;
        }

        .ios-tier-fcfa {
          font-size: 0.68rem;
          font-weight: 600;
          color: #716C65;
        }

        .ios-preview-remove-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: #FFFFFF;
          color: #A39D93;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .ios-preview-remove-btn:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        /* Bannière textuelle de l'article détecté par lien */
        .ios-extracted-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.06);
          border-radius: 12px;
          padding: 8px 12px;
          margin-top: 2px;
        }

        .ios-extracted-tag {
          font-size: 0.66rem;
          font-weight: 800;
          background: #DCFCE7;
          color: #166534;
          padding: 2px 7px;
          border-radius: 9999px;
          flex-shrink: 0;
          text-transform: uppercase;
        }

        .ios-extracted-text {
          font-size: 0.78rem;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Stepper Quantité en pilule */
        .ios-stepper {
          display: flex;
          align-items: center;
          height: 46px;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.07);
          border-radius: 9999px;
          padding: 3px;
        }

        .ios-stepper-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: #FFFFFF;
          border-radius: 9999px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1C1815;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(28, 24, 21, 0.06);
          transition: background-color 0.15s ease;
        }

        .ios-stepper-btn:hover {
          background: #F4F1EA;
        }

        .ios-stepper-input {
          flex: 1;
          height: 100%;
          border: none;
          background: transparent;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 700;
          outline: none;
          color: #1C1815;
        }

        .ios-currency-row {
          display: flex;
          gap: 6px;
        }

        .ios-select-compact {
          width: 90px;
          height: 46px;
          padding: 0 8px;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.07);
          border-radius: 16px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #1C1815;
          outline: none;
          cursor: pointer;
        }

        /* Reçu / Devis Inset */
        .ios-receipt {
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.06);
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ios-receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.84rem;
          color: #716C65;
        }

        .ios-receipt-row.total {
          font-size: 0.92rem;
          color: #1C1815;
          font-weight: 700;
        }

        .ios-receipt-row.total .bold {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1C1815;
        }

        .ios-receipt-row.total small {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .ios-receipt-divider {
          height: 1px;
          background-color: rgba(28, 24, 21, 0.08);
          margin: 4px 0;
        }

        .ios-note-subtle {
          font-size: 0.76rem;
          color: #8E877E;
          margin: 4px 0 0 2px;
        }

        /* Liste de paiement officielle */
        .ios-payment-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ios-payment-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.06);
          border-radius: 18px;
          padding: 12px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ios-payment-row.selected {
          border-color: #C5A265;
          background: #FFFFFF;
          box-shadow: 0 4px 16px rgba(197, 162, 101, 0.16);
        }

        .ios-pay-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ios-pay-name {
          font-size: 0.86rem;
          font-weight: 700;
          color: #1C1815;
        }

        .ios-pay-num {
          font-size: 0.8rem;
          color: #524B43;
          margin-top: 1px;
        }

        .ios-pay-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .ios-copy-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.08);
          border-radius: 9999px;
          padding: 5px 10px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #1C1815;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .ios-copy-pill:hover {
          background: #EAE6DE;
        }

        .ios-open-app-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #1C1815;
          border: none;
          border-radius: 9999px;
          padding: 5px 10px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #FAF8F5;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.15s ease;
        }

        .ios-open-app-pill:hover {
          background: #000000;
        }

        .ios-open-app-pill:active {
          transform: scale(0.96);
        }

        .ios-upload-wrap {
          margin-top: 4px;
        }

        .ios-upload-btn {
          width: 100%;
          height: 44px;
          background: #F7F5F0;
          border: 1px dashed rgba(28, 24, 21, 0.16);
          border-radius: 9999px;
          color: #716C65;
          font-size: 0.82rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-upload-btn:hover {
          background: #EAE6DE;
          border-color: #1C1815;
          color: #1C1815;
        }

        .ios-receipt-attached {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.08);
          border-radius: 9999px;
          padding: 8px 14px;
        }

        .ios-receipt-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1C1815;
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

        /* Bouton principal en pilule */
        .ios-submit-wrap {
          margin-top: 22px;
        }

        .ios-submit-btn {
          width: 100%;
          height: 50px;
          background: #1C1815;
          color: #FAF8F5;
          font-size: 0.96rem;
          font-weight: 700;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(28, 24, 21, 0.15);
        }

        .ios-submit-btn:hover {
          background: #000000;
          transform: translateY(-1px);
        }

        .ios-submit-btn:active {
          transform: scale(0.98);
        }

        .ios-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Success Card iOS */
        .ios-success-card {
          text-align: center;
          padding: 32px 22px;
        }

        .ios-success-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #ECFDF5;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px auto;
        }

        .ios-success-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #1C1815;
          margin: 0 0 6px 0;
        }

        .ios-success-desc {
          font-size: 0.86rem;
          color: #716C65;
          margin: 0 0 20px 0;
        }

        .ios-inset-box {
          background: #F7F5F0;
          border: 1px solid rgba(28, 24, 21, 0.06);
          border-radius: 18px;
          padding: 14px 16px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }

        .ios-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.84rem;
        }

        .ios-item-label {
          color: #8E877E;
        }

        .ios-item-val-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ios-item-val {
          color: #1C1815;
          font-weight: 600;
        }

        .ios-item-val.bold {
          font-weight: 800;
          color: #1C1815;
          font-size: 1.05rem;
        }

        .ios-receipt-product-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFFFFF;
          border: 1px solid rgba(28, 24, 21, 0.08);
          border-radius: 16px;
          padding: 10px 12px;
          margin-bottom: 14px;
          text-align: left;
        }

        .ios-receipt-product-img {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border-radius: 12px;
          border: 1px solid rgba(28, 24, 21, 0.08);
          background: #FFFFFF;
          flex-shrink: 0;
        }

        .ios-receipt-product-meta {
          min-width: 0;
          flex: 1;
        }

        .ios-receipt-product-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: #1C1815;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ios-receipt-product-sub {
          font-size: 0.74rem;
          color: #716C65;
          margin-top: 2px;
        }

        .ios-pdf-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 4px;
        }

        @media (max-width: 480px) {
          .ios-pdf-actions-grid {
            grid-template-columns: 1fr;
          }
        }

        .ios-btn-pdf {
          height: 46px;
          background: #FFFBEB;
          color: #92400E;
          border: 1.5px solid #F59E0B;
          border-radius: 9999px;
          font-size: 0.84rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-btn-pdf:hover {
          background: #FEF3C7;
        }

        .ios-btn-print {
          height: 46px;
          background: #F7F5F0;
          color: #1C1815;
          border: 1.5px solid rgba(28, 24, 21, 0.14);
          border-radius: 9999px;
          font-size: 0.84rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ios-btn-print:hover {
          background: #EAE6DE;
        }

        .ios-btn-whatsapp-agency {
          width: 100%;
          height: 50px;
          background: #16A34A;
          color: #FFFFFF;
          font-size: 0.94rem;
          font-weight: 700;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(22, 163, 74, 0.25);
          transition: background-color 0.15s ease, transform 0.1s ease;
        }

        .ios-btn-whatsapp-agency:hover {
          background: #15803D;
        }

        .ios-actions-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .ios-btn-primary {
          width: 100%;
          height: 48px;
          background: #1C1815;
          color: #FAF8F5;
          font-size: 0.92rem;
          font-weight: 600;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(28, 24, 21, 0.12);
          transition: background-color 0.15s ease;
        }

        .ios-btn-primary:hover {
          background: #000000;
        }

        .ios-btn-secondary {
          width: 100%;
          height: 48px;
          background: #F7F5F0;
          color: #1C1815;
          font-size: 0.92rem;
          font-weight: 600;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          border: 1px solid rgba(28, 24, 21, 0.08);
          transition: background-color 0.15s ease;
        }

        .ios-btn-secondary:hover {
          background: #EAE6DE;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
      `,
        }}
      />

      {/* Lightbox plein écran pour voir la photo de l'article en grand */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28, 24, 21, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "16px",
              maxWidth: "92vw",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            }}
          >
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "#1C1815",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
            <img
              src={zoomImageUrl}
              alt="Photo du produit en grand"
              style={{
                maxWidth: "84vw",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: "14px",
              }}
            />
            {extractedProduct?.title && (
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1C1815", textAlign: "center", maxWidth: "500px" }}>
                {extractedProduct.title}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommandePage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Chargement du formulaire...</div>}>
      <CommandeFormContent />
    </Suspense>
  );
}
