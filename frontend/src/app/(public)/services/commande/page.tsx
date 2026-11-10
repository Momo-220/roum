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
  Smartphone,
  ExternalLink,
  Camera,
  Download,
  Printer,
  ZoomIn,
  X,
  RotateCcw,
  Link2,
} from "lucide-react";
import { compressImage } from "@/shared/compressImage";
import { WhatsAppButton, WhatsAppGlyph } from "@/components/WhatsAppButton";
import { GaugeControl } from "@/components/GaugeControl";
import { newUuid } from "@/shared/api";
import { useLiveSync } from "@/shared/useLiveSync";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { saveClientRequest, fetchClientDossier, submitClientPaymentProof, getAdminDestinationsDetailed, findTariff, OfficialTariff, getTrackingPageUrl, decodeHtmlEntitiesText, convertToFcfa, getExchangeRates, getSupportPhoneDigits } from "@/shared";
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

/** D'où vient l'article affiché : lien détecté ou simple photo du client. */
function productSourceLabel(product: { platform?: string } | null): string {
  const platform = (product?.platform || "").replace(/\s*\(.*\)/, "").trim();
  return !platform || platform === "Image Produit" ? "Votre photo" : `Trouvé sur ${platform}`;
}

/** Les titres des sites chinois collent souvent leurs mots-clés après une virgule. */
function readableTitle(title: string): string {
  return decodeHtmlEntitiesText(title).replace(/,(?=\S)/g, ", ");
}

function CommandeFormContent() {
  const searchParams = useSearchParams();
  const payRefParam = searchParams.get("pay")?.trim() || "";
  const payKeyParam = searchParams.get("key")?.trim() || "";

  // Conservées entre deux essais : un renvoi après coupure réseau ne crée ni doublon ni seconde preuve.
  const orderIdempotencyKey = useRef(newUuid());
  const proofIdempotencyKey = useRef(newUuid());

  const [option, setOption] = useState<"sans_fournisseur" | "avec_fournisseur">("sans_fournisseur");

  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRes = sessionStorage.getItem("roum_active_submitted_result");
        if (savedRes) return true;
      } catch {}
    }
    return false;
  });
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
  } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRes = sessionStorage.getItem("roum_active_submitted_result");
        if (savedRes) return JSON.parse(savedRes);
      } catch {}
    }
    return null;
  });

  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);
  const [copiedPay, setCopiedPay] = useState<string | null>(null);

  // Paramètres synchronisés avec la base de données
  const { tariffs, settings } = usePublicCatalog();
  const agencyWaPhone =
    (settings.whatsapp_official_number || settings.whatsapp_support || "").replace(/\D/g, "") || "2250153638569";

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
    compressImage(file)
      .then(setUserProductImage)
      .catch(() => {
        setUserProductImageName("");
        alert("Cette image n'a pas pu être lue. Essayez une autre photo au format JPG ou PNG.");
      });
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

  const productTitleText = extractedProduct?.title || productQuery || goodsDescription;

  // Retire tout l'article : le client repart d'un champ vide et peut recoller le même lien.
  const handleRemoveProduct = () => {
    const detectedTitle = extractedProduct?.title;
    setUserProductImage(null);
    setUserProductImageName("");
    if (productImageInputRef.current) productImageInputRef.current.value = "";
    setExtractedProduct(null);
    setExtractError(null);
    setProductLink("");
    lastExtractedUrlRef.current = "";
    if (detectedTitle && productQuery === detectedTitle) setProductQuery("");
    if (detectedTitle && goodsDescription === detectedTitle) setGoodsDescription("");
    setProductUnitPrice(15);
    setProductCurrency("USD");
  };

  // Extraction automatique sur collage ou saisie avec debounce
  useEffect(() => {
    if (typeof productLink !== "string") return;
    const trimmed = productLink.trim();
    if (!trimmed) {
      if (lastExtractedUrlRef.current) handleRemoveProduct();
      return;
    }
    if (trimmed === lastExtractedUrlRef.current) return;

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

    // Un compte vidé dans l'administration disparaît du choix proposé au client.
    const waveNum = settings.payment_wave_ci?.trim() || "";
    if (waveNum) list.push({
      id: "wave",
      label: "Wave Mobile Money",
      type: "Côte d'Ivoire & UEMOA (0% frais)",
      accountNumber: waveNum,
      accountHolder: settings.payment_wave_name?.trim() || "ROUM TRANSIT SARL",
      color: "#1DC3EC",
      copyValue: waveNum,
      logo: <WaveLogo size={34} />,
    });

    const omNum = settings.payment_orange_money_ci?.trim() || "";
    if (omNum) list.push({
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
    const moroccoRib = settings.payment_morocco_rib?.trim() || "";
    if (moroccoRib) list.push({
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
      // On garde la vraie adresse de l'article : c'est elle que la direction ouvrira.
      if (data.originalUrl && data.originalUrl !== targetUrl) {
        lastExtractedUrlRef.current = data.originalUrl;
        setProductLink(data.originalUrl);
      }
      if (data.image) {
        setUserProductImage(data.image);
      } else if (!userProductImage?.startsWith("data:")) {
        setExtractError("Photo non trouvée sur ce lien : ajoutez-la vous-même.");
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
    if (file.size > 15 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (maximum 15 Mo).");
      return;
    }
    proofIdempotencyKey.current = newUuid();
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
    return convertToFcfa(productUnitPrice, productCurrency, getExchangeRates(settings));
  }, [productUnitPrice, productCurrency]);

  const totalArticlesFCFA = useMemo(() => {
    return Math.round(unitPriceFCFA * (productQuantity || 1));
  }, [unitPriceFCFA, productQuantity]);

  const grandTotalFCFA = useMemo(() => {
    return totalArticlesFCFA + shippingQuote;
  }, [totalArticlesFCFA, shippingQuote]);

  // Le dossier vient uniquement de la base : aucun montant n'est lu dans l'URL ni dans le navigateur.
  const [dbPayDossier, setDbPayDossier] = useState<any | null>(null);
  const [payLoadState, setPayLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [payLoadError, setPayLoadError] = useState("");

  const loadPayDossier = async (): Promise<boolean> => {
    if (!payRefParam) return true;
    if (!payKeyParam) {
      setPayLoadError("Ce lien est incomplet. Demandez à ROUM TRANSIT de vous renvoyer votre lien de paiement.");
      setPayLoadState("error");
      return true;
    }
    try {
      const dossier = await fetchClientDossier(payRefParam, payKeyParam);
      setDbPayDossier(dossier);
      setPayLoadState("ready");
      return true;
    } catch (err: any) {
      if (err?.status !== 0 || !dbPayDossier) {
        setPayLoadError(err?.message || "Impossible de charger votre dossier.");
        setPayLoadState("error");
      }
      return false;
    }
  };

  useEffect(() => {
    setPayLoadState("loading");
    setDbPayDossier(null);
    void loadPayDossier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payRefParam, payKeyParam]);

  // Un devis modifié par l'admin s'affiche ici sans recharger la page.
  useLiveSync({
    endpoint: "/api/v1/public/sync",
    scopes: ["requests"],
    enabled: Boolean(payRefParam && payKeyParam),
    onChange: loadPayDossier,
  });

  // Données du dossier pour l'Étape 2 Bis (quand le client clique sur le lien ?pay=RM-...)
  const payDossier = useMemo(() => {
    if (!payRefParam || !dbPayDossier) return null;
    const saved = dbPayDossier;
    const savedItem = saved.items?.[0] || {};
    const totalFcfa = Number(saved.total_amount_fcfa) || 0;
    const isFinished = ["CONVERTED", "CANCELLED", "CLOSED"].includes(saved.status);
    const proofUnderReview = saved.status === "IN_REVIEW" && Boolean(saved.payment_submitted_at);
    if (totalFcfa <= 0 || isFinished || proofUnderReview) return null;

    const weightLabel = saved.estimated_cbm
      ? `${saved.estimated_cbm} m³`
      : saved.estimated_weight_kg
      ? `${saved.estimated_weight_kg} kg`
      : "Estimé par ROUM";

    return {
      reference: saved.reference,
      clientName: saved.client_name || "Client ROUM",
      clientPhone: saved.client_phone || "",
      destination: saved.destination_country || "",
      transportMode: saved.shipping_mode_name || "Voie Aérienne",
      weightLabel,
      goodsFcfa: Number(saved.total_goods_fcfa) || 0,
      shipFcfa: Number(saved.shipping_fee_fcfa) || 0,
      totalFcfa,
      productTitle: decodeHtmlEntitiesText(saved.product_name || savedItem.product_name || "Article commandé"),
      quantity: Number(saved.product_quantity || savedItem.quantity || 1),
      productImage: saved.product_image || "",
      productUrl: saved.product_url || savedItem.product_url || "",
      optionType: saved.option_type === "AVEC_FOURNISSEUR" ? ("avec_fournisseur" as const) : ("sans_fournisseur" as const),
      shippingMark: saved.shipping_mark || "",
    };
  }, [payRefParam, dbPayDossier]);

  const payStatusView = useMemo(() => {
    if (!payRefParam || payDossier) return null;
    if (payLoadState === "loading") {
      return { title: "Chargement de votre dossier…", text: "Un instant, nous récupérons votre dossier." };
    }
    if (payLoadState === "error") {
      return { title: "Dossier indisponible", text: payLoadError };
    }
    if (dbPayDossier?.status === "CONVERTED") {
      return {
        title: "Paiement confirmé",
        text: "Votre règlement a bien été reçu. Vous pouvez suivre votre colis.",
        trackingNumber: dbPayDossier.tracking_number as string | null,
      };
    }
    if (dbPayDossier?.status === "CANCELLED") {
      return {
        title: "Dossier annulé",
        text: "Ce dossier a été annulé par ROUM TRANSIT. Contactez-nous sur WhatsApp pour toute question.",
      };
    }
    if (dbPayDossier?.status === "CLOSED") {
      return { title: "Dossier clôturé", text: "Ce dossier est clôturé. Merci de votre confiance." };
    }
    if (dbPayDossier?.status === "IN_REVIEW" && dbPayDossier.payment_submitted_at) {
      return {
        title: "Paiement en cours de vérification",
        text: "Nous avons bien reçu votre preuve de paiement. Votre numéro de suivi apparaîtra ici dès sa validation.",
      };
    }
    return {
      title: "Devis en préparation",
      text: "Nous estimons le poids et le prix de votre commande. Cette page se mettra à jour dès que votre devis sera prêt.",
    };
  }, [payRefParam, payDossier, payLoadState, payLoadError, dbPayDossier]);

  // L'écran de confirmation s'efface dès que le dossier évolue côté admin (devis prêt, paiement validé, annulation).
  const dossierMovedOn = useMemo(() => {
    if (!orderResult || !dbPayDossier || dbPayDossier.reference !== orderResult.reference) return false;
    const finished = ["CONVERTED", "CANCELLED", "CLOSED"].includes(dbPayDossier.status);
    if (orderResult.isPaymentStep) return finished || dbPayDossier.status === "QUOTE_SENT";
    return finished || Number(dbPayDossier.total_amount_fcfa) > 0;
  }, [orderResult, dbPayDossier]);

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

      // La confirmation n'est affichée qu'une fois la preuve enregistrée en base.
      const updatedDossier = await submitClientPaymentProof(payDossier.reference, {
        proofId: proofIdempotencyKey.current,
        accessKey: payKeyParam,
        paymentMethod: selectedPayMethod,
        fileName: receiptFileName || "Preuve de paiement",
        dataUrl: receiptDataUrl,
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
        supportPhone: settings.whatsapp_official_number,
      };

      const customWaUrl = buildClientReceiptWhatsAppUrl(receiptData, agencyWaPhone);

      const payResultObj = {
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
      };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("roum_active_submitted_result", JSON.stringify(payResultObj));
        } catch {}
      }

      proofIdempotencyKey.current = newUuid();
      setDbPayDossier(updatedDossier);
      setOrderResult(payResultObj);
      setSubmitted(true);
    } catch (err: any) {
      alert(`Votre preuve de paiement n'a pas été envoyée.\n\n${err?.message || "Veuillez réessayer."}`);
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

      const res = await saveClientRequest(
        {
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
        product_quantity: String(productQuantity || 1),
        product_specs:
          option === "sans_fournisseur"
            ? `Mode : ${transportModeLabel} (${transportUnitRateFormatted}) | Quantité : ${productQuantity} pcs | Prix & Poids : à estimer par ROUM`
            : `Shipping Mark : ${clientShippingMark.trim()} | Payé usine : ${paidToSupplier.trim()} | Mode : ${transportModeLabel} (${transportUnitRateFormatted}) | Poids : à estimer par ROUM`,
        shipping_mode_type: selectedTransportMode === "SEA" ? "SEA" : "AIR",
        shipping_mode_name: transportModeLabel,
        cargo_type: cargoDescription,
        },
        orderIdempotencyKey.current
      );
      orderIdempotencyKey.current = newUuid();

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
        supportPhone: settings.whatsapp_official_number,
      };

      const customWaUrl = buildClientReceiptWhatsAppUrl(receiptData, agencyWaPhone);

      const orderResultObj = {
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
      };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("roum_active_submitted_result", JSON.stringify(orderResultObj));
          const newUrl = `${window.location.pathname}?pay=${encodeURIComponent(res.reference)}&key=${encodeURIComponent(res.accessKey)}`;
          window.history.replaceState({ path: newUrl }, "", newUrl);
        } catch {}
      }

      setOrderResult(orderResultObj);
      setSubmitted(true);
    } catch (err: any) {
      alert(`Votre commande n'a pas été enregistrée.\n\n${err?.message || "Veuillez réessayer."}`);
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
            {payDossier ? "Finaliser mon règlement" : payRefParam ? "Mon dossier" : "Passer une commande"}
          </h1>
          <p className="ios-subtitle">
            {payDossier
              ? `Étape 2 · Devis officiel & Poids estimés par ROUM TRANSIT (${payDossier.reference})`
              : payRefParam
              ? payRefParam
              : "Achats et expéditions Chine vers l'Afrique aux vrais tarifs usine"}
          </p>
        </div>

        {submitted && orderResult && !dossierMovedOn ? (
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
                ? "Votre justificatif a été transmis à ROUM TRANSIT. Dès confirmation de l'encaissement, vous recevrez votre Numéro de Suivi (Tracking Number) officiel sur WhatsApp."
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
                      color: "#6B5844",
                      background: "#F1E7D9",
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
                <span>Télécharger le reçu</span>
              </button>
              <button
                type="button"
                onClick={() => printOfficialReceipt(orderResult.receiptData)}
                className="ios-btn-print"
              >
                <Printer size={16} />
                <span>Imprimer</span>
              </button>
            </div>

            <div className="ios-actions-stack">
              <WhatsAppButton
                href={orderResult.whatsappUrl}
                label={orderResult.isPaymentStep ? "Confirmer mon paiement" : "Envoyer ma commande"}
                block
              />

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    try {
                      sessionStorage.removeItem("roum_active_submitted_result");
                      window.history.replaceState({}, "", window.location.pathname);
                    } catch {}
                  }
                  setSubmitted(false);
                  setOrderResult(null);
                  setDbPayDossier(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  height: "44px",
                  borderRadius: "9999px",
                  border: "1px solid #E5E0D8",
                  background: "#FAF8F5",
                  color: "#181512",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginTop: "8px",
                  transition: "background 0.15s ease",
                }}
              >
                <RotateCcw size={15} />
                <span>Passer une autre commande</span>
              </button>
            </div>
          </div>
        ) : payStatusView ? (
          <div className="ios-card">
            <div className="ios-section" style={{ textAlign: "center", padding: "32px 20px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 8px 0" }}>{payStatusView.title}</h2>
              <p style={{ fontSize: "0.88rem", color: "#6B6459", margin: 0, lineHeight: 1.5 }}>{payStatusView.text}</p>
              {payStatusView.trackingNumber && (
                <Link
                  href={`/tracking/${encodeURIComponent(payStatusView.trackingNumber)}`}
                  className="ios-btn-primary"
                  style={{ marginTop: "18px" }}
                >
                  <Package size={18} />
                  <span>Suivre mon colis ({payStatusView.trackingNumber})</span>
                </Link>
              )}
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
                        <span className="ios-product-preview-badge">
                          <Check size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "3px" }} />
                          Dossier vérifié par ROUM TRANSIT
                        </span>
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
                  {activePaymentMethods.length === 0 && (
                    <div style={{ display: "grid", gap: "12px" }}>
                      <p className="ios-field-hint" style={{ margin: 0 }}>
                        Les comptes de paiement ne sont pas encore affichés en ligne. Écrivez-nous sur WhatsApp :
                        nous vous donnons le bon compte pour régler ce dossier.
                      </p>
                      <WhatsAppButton
                        href={`https://wa.me/${getSupportPhoneDigits(settings)}?text=${encodeURIComponent(
                          `Bonjour ROUM TRANSIT, je souhaite régler le dossier ${payDossier.reference}.`
                        )}`}
                        label="Demander le compte de paiement"
                      />
                    </div>
                  )}
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
                      style={{ height: "54px", borderColor: "#B8A488", background: "#F6F0E6", color: "#6B5844" }}
                    >
                      <Upload size={16} />
                      <span>Cliquez ici pour joindre votre preuve de paiement</span>
                    </button>
                  ) : (
                    <div className="ios-receipt-attached" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px", borderRadius: "16px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="ios-receipt-name">
                          <Check size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "3px" }} />
                          Preuve jointe : {receiptFileName}
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
                    <Check size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "3px" }} />
                    Nous estimons le poids pour vous · {transportUnitRateFormatted}
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
                      <label htmlFor="productLink">Lien de l&apos;article</label>
                      <div className="ios-input-action-group">
                        <Link2 size={17} className="ios-link-icon" />
                        <input
                          id="productLink"
                          type="url"
                          inputMode="url"
                          placeholder="Collez le lien"
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
                          <span>{extracting ? "Recherche..." : "Détecter"}</span>
                        </button>
                      </div>
                      {extractError ? (
                        <span className="ios-error-msg">{extractError}</span>
                      ) : (
                        !extractedProduct && (
                          <span className="ios-field-hint">Le nom et la photo s&apos;ajoutent tout seuls.</span>
                        )
                      )}
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
                            <span className="ios-product-preview-source">
                              <Check size={13} strokeWidth={3} />
                              {productSourceLabel(extractedProduct)}
                            </span>

                            <div
                              className={`ios-product-preview-title${productTitleText ? "" : " empty"}`}
                              title={decodeHtmlEntitiesText(productTitleText)}
                            >
                              {productTitleText ? readableTitle(productTitleText) : "Décrivez l'article ci-dessous"}
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
                        <Camera size={17} />
                        <span>Ajouter une photo de l&apos;article</span>
                      </button>
                    )}

                    <div className="ios-field">
                      <label htmlFor="productQuery">Description (modèle, couleur, taille)</label>
                      <input
                        id="productQuery"
                        type="text"
                        required
                        placeholder="Ex : écrans iPhone, vêtements taille L"
                        value={decodeHtmlEntitiesText(productQuery)}
                        onChange={(e) => setProductQuery(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <GaugeControl
                      label="Quantité souhaitée"
                      value={productQuantity}
                      min={1}
                      max={100}
                      step={1}
                      unit={productQuantity > 1 ? "pièces" : "pièce"}
                      ticks={[1, 25, 50, 75, 100]}
                      onChange={setProductQuantity}
                    />
                  </>
                ) : (
                  <>
                    {/* OPTION 2 : LIEN ARTICLE ALIBABA / 1688 AVEC AUTO-EXTRACTION & PHOTO */}
                    <div className="ios-field">
                      <label htmlFor="productLink">Lien de l&apos;article</label>
                      <div className="ios-input-action-group">
                        <Link2 size={17} className="ios-link-icon" />
                        <input
                          id="productLink"
                          type="url"
                          inputMode="url"
                          placeholder="Collez le lien"
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
                          <span>{extracting ? "Recherche..." : "Détecter"}</span>
                        </button>
                      </div>
                      {extractError ? (
                        <span className="ios-error-msg">{extractError}</span>
                      ) : (
                        !extractedProduct && (
                          <span className="ios-field-hint">Le nom et la photo s&apos;ajoutent tout seuls.</span>
                        )
                      )}
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
                            <span className="ios-product-preview-source">
                              <Check size={13} strokeWidth={3} />
                              {productSourceLabel(extractedProduct)}
                            </span>

                            <div
                              className={`ios-product-preview-title${productTitleText ? "" : " empty"}`}
                              title={decodeHtmlEntitiesText(productTitleText)}
                            >
                              {productTitleText ? readableTitle(productTitleText) : "Décrivez l'article ci-dessous"}
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
                        <Camera size={17} />
                        <span>Ajouter une photo de l&apos;article</span>
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
                <div className="ios-section-caption">Récapitulatif</div>

                <div className="ios-summary">
                  <dl>
                    {option === "sans_fournisseur" ? (
                      <div>
                        <dt>Quantité</dt>
                        <dd>
                          {productQuantity} {productQuantity > 1 ? "pièces" : "pièce"}
                        </dd>
                      </div>
                    ) : (
                      <div>
                        <dt>Réglé à l&apos;usine</dt>
                        <dd>{paidToSupplier || "À préciser"}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Transport</dt>
                      <dd>{transportModeLabel}</dd>
                    </div>
                    <div>
                      <dt>Tarif du transport</dt>
                      <dd>{transportUnitRateFormatted}</dd>
                    </div>
                    <div>
                      <dt>Prix et poids</dt>
                      <dd>Calculés par ROUM TRANSIT</dd>
                    </div>
                  </dl>

                  <div className="ios-summary-total">
                    <span>Montant total</span>
                    <strong>
                      <WhatsAppGlyph size={22} />
                      Devis envoyé sur WhatsApp
                    </strong>
                  </div>
                </div>
              </div>

              <div className="ios-divider" />

              {/* SECTION 4 : PROCESSUS EN 3 ÉTAPES (AUCUN PAIEMENT IMMÉDIAT REQUIS ICI) */}
              <div className="ios-section">
                <div className="ios-section-caption">Et ensuite ?</div>

                <ol className="ios-steps">
                  <li>
                    <span>1</span>
                    <div>
                      <strong>Vous envoyez votre commande</strong>
                      <p>Aucun paiement maintenant.</p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <strong>Nous préparons votre devis</strong>
                      <p>Vous recevez le prix exact et le lien de paiement.</p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <strong>Vous suivez votre colis</strong>
                      <p>Votre numéro de suivi arrive dès le paiement confirmé.</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* BOUTON D'ACTION PRINCIPAL EN PILULE */}
              <div className="ios-submit-wrap">
                <button type="submit" disabled={submitting} className="ios-submit-btn">
                  {submitting
                    ? "Enregistrement..."
                    : option === "sans_fournisseur"
                    ? "Envoyer ma commande"
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
          border-color: #B8A488;
          box-shadow: 0 0 0 3px rgba(184, 164, 136, 0.2);
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
          border-color: #B8A488;
          box-shadow: 0 0 0 3px rgba(184, 164, 136, 0.2);
        }

        .ios-select option {
          color: #1C1815;
          background: #FFFFFF;
        }

        .ios-input-action-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 54px;
          padding: 4px 4px 4px 16px;
          border: 1px solid rgba(28, 24, 21, 0.07);
          border-radius: 9999px;
          background: #F7F5F0;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .ios-btn-inline {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 44px;
          padding: 0 16px;
          border: 0;
          border-radius: 9999px;
          background: #EADDCB;
          color: #3A2A21;
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .ios-input-action-group:focus-within {
          border-color: #A8957C;
          background: #FFFFFF;
        }

        .ios-input-action-group .ios-input,
        .ios-input-action-group .ios-input:focus {
          flex: 1;
          min-width: 0;
          height: 44px;
          padding: 0;
          border: 0;
          box-shadow: none;
          background: transparent;
          text-overflow: ellipsis;
        }

        .ios-link-icon {
          flex-shrink: 0;
          color: #8E877E;
        }

        .ios-field-hint {
          padding: 0 4px;
          color: #8E877E;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .ios-summary {
          padding: 6px 20px 18px;
          border: 1px solid #EFE6D9;
          border-radius: 24px;
          background: linear-gradient(165deg, #FFFDF9 0%, #FBF3E8 100%);
        }

        .ios-summary dl {
          margin: 0;
        }

        .ios-summary dl > div {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 2px 14px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(58, 42, 33, 0.08);
        }

        .ios-summary dt {
          color: #716C65;
          font-size: 0.9rem;
        }

        .ios-summary dd {
          margin: 0 0 0 auto;
          color: #1C1815;
          font-size: 0.92rem;
          font-weight: 700;
          text-align: right;
        }

        .ios-summary-total {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px 14px;
          padding-top: 14px;
        }

        .ios-summary-total span {
          color: #1C1815;
          font-size: 1.02rem;
          font-weight: 800;
        }

        .ios-summary-total strong {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px 6px 8px;
          border-radius: 9999px;
          background: #FFFFFF;
          box-shadow: 0 6px 14px -10px rgba(58, 42, 33, 0.4);
          color: #3A2A21;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .ios-steps {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .ios-steps li {
          position: relative;
          display: flex;
          gap: 14px;
          padding-bottom: 20px;
        }

        .ios-steps li:last-child {
          padding-bottom: 0;
        }

        /* Le fil qui relie les étapes, comme sur la page de suivi */
        .ios-steps li:not(:last-child)::before {
          content: "";
          position: absolute;
          top: 34px;
          bottom: 0;
          left: 16px;
          border-left: 2px dotted #D9CBB8;
        }

        .ios-steps li > span {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #EADDCB;
          color: #3A2A21;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .ios-steps strong {
          display: block;
          padding-top: 5px;
          color: #1C1815;
          font-size: 0.98rem;
          font-weight: 800;
        }

        .ios-steps p {
          margin: 3px 0 0;
          color: #716C65;
          font-size: 0.88rem;
          line-height: 1.45;
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
          min-height: 50px;
          padding: 8px 18px;
          border: 0;
          border-radius: 9999px;
          background: #F3EBDF;
          color: #3A2A21;
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          cursor: pointer;
          transition: background 0.15s ease;
          text-align: center;
        }

        .ios-article-upload-zone:hover {
          background: #EADDCB;
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
          margin-top: 2px;
          padding: 12px;
          border: 1px solid #EFE6D9;
          border-radius: 24px;
          background: linear-gradient(165deg, #FFFDF9 0%, #FBF3E8 100%);
        }

        .ios-product-preview-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ios-product-preview-thumb-wrap {
          position: relative;
          flex-shrink: 0;
          width: 84px;
          height: 84px;
          overflow: hidden;
          border-radius: 16px;
          background: #FFFFFF;
          cursor: zoom-in;
        }

        .ios-product-preview-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #FFFFFF;
        }

        .ios-thumb-zoom-hint {
          position: absolute;
          right: 4px;
          bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #FFFBF4;
          box-shadow: 0 2px 8px rgba(58, 42, 33, 0.18);
          color: #3A2A21;
          pointer-events: none;
        }

        .ios-product-preview-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
        }

        .ios-preview-mini-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 38px;
          padding: 0 13px;
          border: 0;
          border-radius: 9999px;
          background: #EADDCB;
          color: #3A2A21;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .ios-preview-mini-pill:hover {
          background: #E0D1BB;
        }

        .ios-product-preview-source {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #1E7A43;
          font-size: 0.76rem;
          font-weight: 700;
        }

        .ios-product-preview-title.empty {
          color: #716C65;
          font-weight: 600;
        }

        .ios-preview-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .ios-preview-mini-pill.quiet {
          background: transparent;
          color: #716C65;
        }

        .ios-preview-mini-pill.quiet:hover {
          background: #FBEAEA;
          color: #A12B2B;
        }

        .ios-product-preview-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: #16A34A;
        }

        .ios-product-preview-title {
          color: #1C1815;
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
          background: #F1E7D9;
          color: #6B5844;
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
          padding: 8px 18px;
          border-radius: 9999px;
          border: 1.5px solid rgba(28, 24, 21, 0.08);
          background: #FAF8F5;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .ios-tier-pill:hover {
          border-color: #B8A488;
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
          border-color: #B8A488;
          background: #FFFFFF;
          box-shadow: 0 4px 16px rgba(184, 164, 136, 0.16);
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
          background: #EADDCB;
          border: none;
          border-radius: 9999px;
          padding: 5px 10px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #3A2A21;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.15s ease;
        }

        .ios-open-app-pill:hover {
          background: #E0D1BB;
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
          min-height: 52px;
          padding: 8px 20px;
          background: #EADDCB;
          color: #3A2A21;
          font-size: 0.98rem;
          font-weight: 800;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
        }

        .ios-submit-btn:hover {
          background: #E0D1BB;
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
          background: #EADDCB;
          color: #3A2A21;
          border: 0;
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
          background: #E0D1BB;
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


        .ios-actions-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .ios-btn-primary {
          width: 100%;
          height: 48px;
          border: 1px solid #DCCDB6;
          background: #FFFBF4;
          color: #3A2A21;
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
          background: #F3EBDF;
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

        /* Récapitulatif sur téléphone : chaque ligne respire, le total passe en pleine largeur. */
        @media (max-width: 480px) {
          .ios-receipt-row {
            flex-wrap: wrap;
            gap: 2px 12px;
          }

          .ios-receipt-row > span:last-child {
            margin-left: auto;
            text-align: right;
          }

          .ios-receipt-row.total {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .ios-receipt-row.total > span:last-child {
            margin-left: 0;
            text-align: left;
          }
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
            {!payRefParam && (
              <div className="ios-preview-actions">
                <button
                  type="button"
                  className="ios-preview-mini-pill"
                  onClick={() => {
                    setZoomImageUrl(null);
                    productImageInputRef.current?.click();
                  }}
                >
                  <Camera size={14} />
                  <span>Changer la photo</span>
                </button>
                <button
                  type="button"
                  className="ios-preview-mini-pill quiet"
                  onClick={() => {
                    setZoomImageUrl(null);
                    handleRemoveProduct();
                  }}
                >
                  <Trash2 size={14} />
                  <span>Retirer</span>
                </button>
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
