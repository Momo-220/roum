"use client";

import { useState, useEffect, Suspense, useRef } from "react";
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
import { saveClientRequest, getLiveCompanySettings } from "@/shared";
import { AFRICAN_COUNTRIES, ALL_WORLD_COUNTRIES } from "@/data/countries";

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
    shippingMark: string;
    whatsappUrl: string;
    totalAmount?: number;
    receiptName?: string;
  } | null>(null);

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);
  const [copiedPay, setCopiedPay] = useState<string | null>(null);

  // Paramètres et Moyens de Paiement synchronisés en direct avec l'Admin
  const [settings, setSettings] = useState<Record<string, string>>(() => getLiveCompanySettings());

  // Form states communs
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [destinationCity, setDestinationCity] = useState("Côte d'Ivoire (Abidjan)");

  // Option 1 : Sans fournisseur (Sourcing & Assistance Achat)
  const [productLink, setProductLink] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productUnitPrice, setProductUnitPrice] = useState<number>(15);
  const [productCurrency, setProductCurrency] = useState<"RMB" | "USD" | "FCFA">("RMB");
  const [shippingMode, setShippingMode] = useState<"AIR" | "SEA">("AIR");
  const [estimatedWeight, setEstimatedWeight] = useState<number>(2.5);

  // État de l'analyse automatique du lien
  const [extracting, setExtracting] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Option 2 : Avec fournisseur (Paiement RMB Yuans)
  const [rmbAmount, setRmbAmount] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");

  // Moyen de paiement choisi & preuve de reçu uploadée
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>("wave");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronisation temps réel des coordonnées de paiement avec l'Admin
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/v1/public/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.settings) {
            setSettings((prev) => ({ ...prev, ...d.settings }));
            localStorage.setItem("roum_company_settings", JSON.stringify(d.settings));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Détection & extraction automatique du produit dès que le lien est collé
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
    } catch (e: any) {
      setExtractError("Impossible d'extraire automatiquement. Renseignez le titre et le prix manuellement.");
    } finally {
      setExtracting(false);
    }
  };

  // Gestion du fichier de reçu (Capture d'écran ou PDF)
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite 10 MB
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

  // Calculs financiers automatiques en FCFA
  const rmbRate = 95; // 1 RMB ≈ 95 FCFA
  const usdRate = 620; // 1 USD ≈ 620 FCFA

  // Prix unitaire en FCFA
  const unitPriceFCFA = Math.round(
    productUnitPrice * (productCurrency === "USD" ? usdRate : productCurrency === "RMB" ? rmbRate : 1)
  );

  // Total articles en FCFA
  const totalArticlesFCFA = option === "sans_fournisseur"
    ? unitPriceFCFA * (productQuantity || 1)
    : Math.round(parseFloat(rmbAmount.replace(/[^0-9.]/g, "") || "0") * rmbRate);

  // Frais de transport estimés en FCFA (ex: Avion 10 500 FCFA/kg - Bateau forfait 30 000 FCFA)
  const shippingRateAir = 10500;
  const shippingFeeFCFA = option === "sans_fournisseur"
    ? shippingMode === "AIR"
      ? Math.round((estimatedWeight || 2.5) * shippingRateAir)
      : 30000
    : 0; // En option 2 avec fournisseur, l'expédition est réglée au poids à l'arrivée

  // Grand Total Global à payer
  const grandTotalFCFA = totalArticlesFCFA + shippingFeeFCFA;

  const copyPayMethod = (key: string, val: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      setCopiedPay(key);
      setTimeout(() => setCopiedPay(null), 2000);
    }
  };

  const copyText = (text: string, type: "ref" | "mark") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "ref") {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
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

    setSubmitting(true);
    try {
      let cargoDescription = "";

      if (option === "sans_fournisseur") {
        cargoDescription = `[SOURCING ALIBABA CONFIRMÉ] Produit: ${productQuery.trim() || extractedProduct?.title || "Article Alibaba"} | Qté: ${productQuantity} | P.U: ${productUnitPrice} ${productCurrency} (${unitPriceFCFA.toLocaleString("fr-FR")} FCFA) | Expédition: ${shippingMode === "AIR" ? `Avion (${estimatedWeight}kg)` : "Bateau"} | Total: ${grandTotalFCFA.toLocaleString("fr-FR")} FCFA | Reçu: ${receiptFileName ? "OUI (joint)" : "En attente"}`;
      } else {
        cargoDescription = `[PAIEMENT FOURNISSEUR RMB] Montant: ${rmbAmount.trim()} ¥ (${totalArticlesFCFA.toLocaleString("fr-FR")} FCFA) | Usine: ${supplierContact.trim()} | Marchandise: ${goodsDescription.trim()} | Reçu: ${receiptFileName ? "OUI (joint)" : "En attente"}`;
      }

      // Enregistrement unifié avec produit prévisualisé, calcul et preuve de paiement
      const res = await saveClientRequest({
        service_type: "ALIBABA",
        option_type: option === "avec_fournisseur" ? "AVEC_FOURNISSEUR" : "SANS_FOURNISSEUR",
        rmb_amount: option === "avec_fournisseur" ? rmbAmount.trim() : undefined,
        supplier_contact: option === "avec_fournisseur" ? supplierContact.trim() : undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        origin_country: "Chine",
        destination_country: destinationCity.trim() || "Côte d'Ivoire (Abidjan)",
        product_url: productLink.trim(),
        product_image: extractedProduct?.image,
        product_name: productQuery.trim() || extractedProduct?.title,
        unit_price: productUnitPrice,
        unit_price_currency: productCurrency,
        total_goods_fcfa: totalArticlesFCFA,
        shipping_fee_fcfa: shippingFeeFCFA,
        total_amount_fcfa: grandTotalFCFA,
        payment_method_selected: selectedPayMethod,
        payment_receipt_url: receiptDataUrl || undefined,
        payment_receipt_name: receiptFileName || undefined,
        product_quantity: String(productQuantity || 1),
        product_specs: option === "sans_fournisseur"
          ? `Mode: ${shippingMode} | Poids: ${estimatedWeight}kg | Articles: ${totalArticlesFCFA.toLocaleString("fr-FR")} F | Total: ${grandTotalFCFA.toLocaleString("fr-FR")} F`
          : `Montant proforma: ${rmbAmount.trim()} RMB (${totalArticlesFCFA.toLocaleString("fr-FR")} FCFA)`,
        shipping_mode_type: shippingMode,
        cargo_type: cargoDescription,
      });

      // Construction du message WhatsApp direct vers l'équipe commerciale
      let message = "";
      if (option === "sans_fournisseur") {
        message =
          `*NOUVELLE COMMANDE ALIBABA N° ${res.reference}*\n` +
          `• Client : ${clientName}\n` +
          `• Téléphone : ${clientPhone}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Article : ${productQuery || extractedProduct?.title || "Article Alibaba"}\n` +
          `• Quantité : ${productQuantity}\n` +
          `• Lien : ${productLink}\n` +
          `• Mode : ${shippingMode === "AIR" ? `Avion Express (${estimatedWeight} kg)` : "Bateau Maritime"}\n` +
          `• Total Calculé : ${grandTotalFCFA.toLocaleString("fr-FR")} FCFA\n` +
          `• Règlement via : ${selectedPayMethod.toUpperCase()}\n` +
          `• Preuve de paiement : ${receiptFileName ? `Jointe (${receiptFileName})` : "À envoyer"}`;
      } else {
        message =
          `*DOSSIER PAIEMENT FOURNISSEUR RMB N° ${res.reference}*\n` +
          `• Client : ${clientName}\n` +
          `• Téléphone : ${clientPhone}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Montant Proforma : ${rmbAmount} RMB (¥) ≈ ${totalArticlesFCFA.toLocaleString("fr-FR")} FCFA\n` +
          `• Contact Usine (WeChat/WA) : ${supplierContact}\n` +
          `• Lien Produit / Proforma : ${productLink}\n` +
          `• Marchandise : ${goodsDescription}\n` +
          `• Règlement via : ${selectedPayMethod.toUpperCase()}\n` +
          `• Preuve de paiement : ${receiptFileName ? `Jointe (${receiptFileName})` : "À envoyer"}`;
      }

      const customWaUrl = `https://wa.me/2250787994412?text=${encodeURIComponent(message)}`;

      setOrderResult({
        reference: res.reference,
        shippingMark: res.shippingMark,
        whatsappUrl: customWaUrl,
        totalAmount: grandTotalFCFA,
        receiptName: receiptFileName,
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
            <span>CENTRALE D&apos;ACHAT CHINE &amp; RÈGLEMENT FOURNISSEURS</span>
          </div>
          <h1 className="page-title">
            Passer une Commande en Chine
          </h1>
          <p className="page-subtitle">
            Collez le lien de votre article sur <strong>Alibaba ou 1688</strong> : confirmation visuelle immédiate,
            calcul automatique du total (articles + transport) et règlement sécurisé via nos comptes officiels.
          </p>
        </div>

        {submitted && orderResult ? (
          <div className="success-card">
            <div className="success-icon-wrap">
              <CheckCircle2 size={46} color="#16A34A" />
            </div>
            <h2 className="success-title">Commande Enregistrée avec Succès !</h2>
            <p className="success-desc">
              Votre dossier a été transmis à la Centrale d&apos;Achat Roum Transit. Votre preuve de paiement est en cours de validation par notre caisse.
            </p>

            <div className="reference-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    Numéro de Dossier Officiel
                  </span>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", letterSpacing: "0.03em" }}>
                    {orderResult.reference}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(orderResult.reference, "ref")}
                  className="copy-btn-pill"
                >
                  {copiedRef ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copiedRef ? "Copié !" : "Copier"}</span>
                </button>
              </div>

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

              {/* Récapitulatif article & montant */}
              <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px", marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.86rem" }}>
                  <span style={{ color: "#6B7280" }}>Montant total calculé :</span>
                  <strong style={{ fontSize: "1.05rem", color: "#CC4E16" }}>
                    {orderResult.totalAmount?.toLocaleString("fr-FR")} FCFA
                  </strong>
                </div>
                {orderResult.receiptName && (
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#16A34A" }}>
                    <CheckCircle2 size={14} />
                    <span>Reçu de paiement joint : <strong>{orderResult.receiptName}</strong></span>
                  </div>
                )}
              </div>
            </div>

            <div className="success-actions">
              <a
                href={orderResult?.whatsappUrl || "https://wa.me/2250787994412"}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn"
              >
                <MessageCircle size={18} />
                <span>Confirmer sur WhatsApp (+225 07 87 99 44 12)</span>
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
                  <span className="option-num">OPTION 2 · PAIEMENT RMB</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Avec Fournisseur</h3>
                <p className="option-desc">
                  Vous avez déjà votre proforma usine. Nous réglons votre fournisseur en Yuans RMB sous 24h avec quittance officielle.
                </p>
              </button>
            </div>

            <div className="form-card">
              {/* ========================================================
                  ÉTAPE 1 : COORDONNÉES CLIENT
                 ======================================================== */}
              <div className="section-heading">
                <span className="step-num">1</span>
                <div>
                  <h3>Coordonnées du Destinataire</h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    Informations nécessaires pour la création de votre dossier et la livraison
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

                <div className="input-group full-width">
                  <label htmlFor="destinationCity">
                    Pays &amp; Ville de Destination Finale <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    id="destinationCity"
                    className="styled-select"
                    required
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                  >
                    <optgroup label="Destinations Principales (Afrique)">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={c.code} value={`${c.name} (${c.hubCity || "Capitale"})`}>
                          {c.name} — {c.hubCity || "Capitale"}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les autres pays du monde">
                      {ALL_WORLD_COUNTRIES.filter(
                        (c) => !AFRICAN_COUNTRIES.some((af) => af.code === c.code)
                      ).map((c) => (
                        <option key={c.code} value={`${c.name} (${c.hubCity || "Principal"})`}>
                          {c.name} {c.hubCity ? `— ${c.hubCity}` : ""}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <span style={{ fontSize: "0.76rem", color: "#6B7280", marginTop: "3px" }}>
                    Dédouanement 100% inclus jusqu&apos;à votre magasin ou agence de destination.
                  </span>
                </div>
              </div>

              <div className="section-divider" />

              {/* ========================================================
                  ÉTAPE 2 : LIEN DU PRODUIT & AFFICHAGE VISUEL IMMÉDIAT
                 ======================================================== */}
              <div className="section-heading">
                <span className="step-num">2</span>
                <div>
                  <h3>
                    {option === "sans_fournisseur"
                      ? "Lien de l'Article & Aperçu Automatique"
                      : "Détails de la Facture Usine (RMB)"}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    {option === "sans_fournisseur"
                      ? "Collez votre lien Alibaba / 1688 pour afficher automatiquement l'article et son prix"
                      : "Renseignez le montant proforma et le contact WeChat de votre fabricant"}
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
                            // Fallback si l'image distante est bloquée par Alibaba
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

                  {/* Description et ajustement des caractéristiques */}
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

                    <div className="input-group">
                      <label htmlFor="shippingMode">Mode d&apos;acheminement *</label>
                      <select
                        id="shippingMode"
                        className="styled-select"
                        value={shippingMode}
                        onChange={(e) => setShippingMode(e.target.value as any)}
                      >
                        <option value="AIR">Avion Express Cargo (4 à 5 jours chrono)</option>
                        <option value="SEA">Bateau Maritime Groupage CBM (35 à 45 jours)</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label htmlFor="estimatedWeight">
                        {shippingMode === "AIR" ? "Poids estimé total (kg)" : "Volume estimé (CBM)"}
                      </label>
                      <input
                        id="estimatedWeight"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={estimatedWeight}
                        onChange={(e) => setEstimatedWeight(parseFloat(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* OPTION 2 : AVEC FOURNISSEUR (PAIEMENT RMB) */
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="rmbAmount">
                      Montant exact en Yuans (RMB ¥) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      id="rmbAmount"
                      type="text"
                      required
                      placeholder="Ex : 5 800 RMB"
                      value={rmbAmount}
                      onChange={(e) => setRmbAmount(e.target.value)}
                    />
                    <span style={{ fontSize: "0.76rem", color: "#16A34A", marginTop: "3px" }}>
                      ≈ {totalArticlesFCFA.toLocaleString("fr-FR")} FCFA (Taux officiel 1 ¥ = 95 FCFA)
                    </span>
                  </div>

                  <div className="input-group">
                    <label htmlFor="supplierContact">
                      Contact fournisseur (WeChat ID / WhatsApp) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      id="supplierContact"
                      type="text"
                      required
                      placeholder="Ex : WeChat: gz_factory88 ou WhatsApp"
                      value={supplierContact}
                      onChange={(e) => setSupplierContact(e.target.value)}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label htmlFor="productLinkOpt2">
                      Lien du produit ou de la boutique fournisseur (Alibaba / 1688) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      id="productLinkOpt2"
                      type="url"
                      required
                      placeholder="https://detail.1688.com/... ou lien proforma"
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label htmlFor="goodsDescription">
                      Nature de la marchandise <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      id="goodsDescription"
                      type="text"
                      required
                      placeholder="Ex : Écrans téléphones, outillage, cosmétiques..."
                      value={goodsDescription}
                      onChange={(e) => setGoodsDescription(e.target.value)}
                    />
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
                  <h3>Total Estimé &amp; Décomposition Financière</h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    Calcul automatique sans frais cachés : achat usine + expédition dédouanée jusqu&apos;à votre ville
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
                        : `Facture Usine Chine (${rmbAmount || "0"} RMB)`}
                    </span>
                  </span>
                  <strong className="billing-val">{totalArticlesFCFA.toLocaleString("fr-FR")} FCFA</strong>
                </div>

                {option === "sans_fournisseur" && (
                  <div className="billing-row">
                    <span className="billing-label">
                      {shippingMode === "AIR" ? <Plane size={15} color="#6B7280" /> : <Ship size={15} color="#6B7280" />}
                      <span>
                        Transport {shippingMode === "AIR" ? `Avion Express (${estimatedWeight} kg)` : "Bateau Maritime Groupage"}
                      </span>
                    </span>
                    <strong className="billing-val">{shippingFeeFCFA.toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                )}

                <div className="billing-row" style={{ color: "#16A34A" }}>
                  <span className="billing-label" style={{ color: "#16A34A" }}>
                    <ShieldCheck size={15} />
                    <span>Contrôle qualité en entrepôt Baiyun &amp; Dédouanement</span>
                  </span>
                  <strong>INCLUS</strong>
                </div>

                <div className="billing-total-row">
                  <div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                      Montant Global à Régler
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                      Conversion garantie au taux officiel sans majoration
                    </div>
                  </div>
                  <div className="billing-total-val">
                    {grandTotalFCFA.toLocaleString("fr-FR")} <span style={{ fontSize: "0.95rem" }}>FCFA</span>
                  </div>
                </div>
              </div>

              <div className="section-divider" />

              {/* ========================================================
                  ÉTAPE 4 : COORDONNÉES OFFICIELLES DE PAIEMENT
                 ======================================================== */}
              <div className="section-heading">
                <span className="step-num">4</span>
                <div>
                  <h3>Comptes Officiels de Règlement</h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    Effectuez votre virement de <strong>{grandTotalFCFA.toLocaleString("fr-FR")} FCFA</strong> vers nos comptes certifiés
                  </p>
                </div>
              </div>

              <div className="payment-methods-grid">
                {/* 1. Wave */}
                <div
                  className={`payment-method-card ${selectedPayMethod === "wave" ? "active" : ""}`}
                  onClick={() => setSelectedPayMethod("wave")}
                >
                  <div className="pay-card-top">
                    <strong style={{ color: "#1D4ED8", fontSize: "0.92rem" }}>Wave</strong>
                    <span className="pay-pill-tag">Mobile Money</span>
                  </div>
                  <div className="pay-account-num">{settings.payment_wave_ci || "+225 01 53 63 85 69"}</div>
                  <div className="pay-holder-name">{settings.payment_wave_name || "ROUM TRANSIT SARL"}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPayMethod("wave", settings.payment_wave_ci || "+225 01 53 63 85 69");
                    }}
                    className="pay-copy-btn"
                  >
                    {copiedPay === "wave" ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    <span>{copiedPay === "wave" ? "Copié !" : "Copier le numéro"}</span>
                  </button>
                </div>

                {/* 2. Orange Money */}
                <div
                  className={`payment-method-card ${selectedPayMethod === "orange" ? "active" : ""}`}
                  onClick={() => setSelectedPayMethod("orange")}
                >
                  <div className="pay-card-top">
                    <strong style={{ color: "#EA580C", fontSize: "0.92rem" }}>Orange Money</strong>
                    <span className="pay-pill-tag">Code Marchand</span>
                  </div>
                  <div className="pay-account-num">{settings.payment_orange_money_ci || "#144*389278# / +225 07 48 29 11 00"}</div>
                  <div className="pay-holder-name">{settings.payment_orange_name || "ROUM TRANSIT INTERNATIONAL"}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPayMethod("orange", settings.payment_orange_money_ci || "+225 07 48 29 11 00");
                    }}
                    className="pay-copy-btn"
                  >
                    {copiedPay === "orange" ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    <span>{copiedPay === "orange" ? "Copié !" : "Copier"}</span>
                  </button>
                </div>

                {/* 3. MTN MoMo */}
                <div
                  className={`payment-method-card ${selectedPayMethod === "mtn" ? "active" : ""}`}
                  onClick={() => setSelectedPayMethod("mtn")}
                >
                  <div className="pay-card-top">
                    <strong style={{ color: "#CA8A04", fontSize: "0.92rem" }}>MTN MoMo</strong>
                    <span className="pay-pill-tag">Mobile Money</span>
                  </div>
                  <div className="pay-account-num">{settings.payment_mtn_momo_ci || "MOMO-749201 / +225 05 94 32 10 05"}</div>
                  <div className="pay-holder-name">{settings.payment_mtn_name || "ROUM LOGISTICS"}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPayMethod("mtn", settings.payment_mtn_momo_ci || "MOMO-749201");
                    }}
                    className="pay-copy-btn"
                  >
                    {copiedPay === "mtn" ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    <span>{copiedPay === "mtn" ? "Copié !" : "Copier"}</span>
                  </button>
                </div>

                {/* 4. Banque Atlantique / BACI */}
                <div
                  className={`payment-method-card ${selectedPayMethod === "bank" ? "active" : ""}`}
                  onClick={() => setSelectedPayMethod("bank")}
                >
                  <div className="pay-card-top">
                    <strong style={{ color: "#0F766E", fontSize: "0.92rem" }}>Virement BACI</strong>
                    <span className="pay-pill-tag">Bancaire UEMOA</span>
                  </div>
                  <div className="pay-account-num" style={{ fontFamily: "monospace", fontSize: "0.76rem" }}>
                    {settings.payment_bank_rib || "CI092 01001 012345678901 24"}
                  </div>
                  <div className="pay-holder-name">{settings.payment_bank_account_holder || "ROUM TRANSIT INTERNATIONAL"}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPayMethod("bank", settings.payment_bank_rib || "CI092 01001 012345678901 24");
                    }}
                    className="pay-copy-btn"
                  >
                    {copiedPay === "bank" ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    <span>{copiedPay === "bank" ? "Copié !" : "Copier le RIB"}</span>
                  </button>
                </div>

                {/* 5. Compte Maroc */}
                {settings.payment_morocco_bank && (
                  <div
                    className={`payment-method-card ${selectedPayMethod === "morocco" ? "active" : ""}`}
                    onClick={() => setSelectedPayMethod("morocco")}
                  >
                    <div className="pay-card-top">
                      <strong style={{ color: "#B91C1C", fontSize: "0.92rem" }}>Compte Maroc</strong>
                      <span className="pay-pill-tag">Casablanca</span>
                    </div>
                    <div className="pay-account-num" style={{ fontSize: "0.76rem" }}>
                      {settings.payment_morocco_bank} · RIB: {settings.payment_morocco_rib}
                    </div>
                    <div className="pay-holder-name">{settings.payment_morocco_holder || "ROUM TRANSIT MAROC"}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPayMethod("morocco", settings.payment_morocco_rib || settings.payment_morocco_bank);
                      }}
                      className="pay-copy-btn"
                    >
                      {copiedPay === "morocco" ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      <span>{copiedPay === "morocco" ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="section-divider" />

              {/* ========================================================
                  ÉTAPE 5 : TÉLÉVERSEMENT DU REÇU / PREUVE DE PAIEMENT
                 ======================================================== */}
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
                        <img
                          src={receiptDataUrl}
                          alt="Reçu de paiement"
                          className="receipt-thumbnail"
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {receiptFileName}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#16A34A", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
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

              {/* Bouton de validation final */}
              <div className="form-actions" style={{ marginTop: "28px" }}>
                <button type="submit" disabled={submitting} className="submit-btn">
                  <span>
                    {submitting
                      ? "Enregistrement en cours..."
                      : `Confirmer et Envoyer ma Commande (${grandTotalFCFA.toLocaleString("fr-FR")} FCFA)`}
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
          display: flex;
          flex-direction: column;
        }

        .option-card:hover {
          border-color: rgba(204, 78, 22, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
        }

        .option-card.selected {
          border-color: #CC4E16;
          background: #FFF9F5;
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
          font-size: 0.72rem;
          font-weight: 800;
          color: #CC4E16;
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
        }

        .option-card.selected .option-radio::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #CC4E16;
          top: 3px;
          left: 3px;
        }

        .option-title {
          font-size: 1.12rem;
          font-weight: 800;
          color: #140D09;
          margin-bottom: 6px;
        }

        .option-desc {
          font-size: 0.82rem;
          color: #6B635B;
          line-height: 1.45;
          margin: 0;
        }

        /* Formulaire */
        .form-card {
          background-color: #FFFFFF;
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(20, 13, 9, 0.08);
        }

        @media (max-width: 640px) {
          .form-card {
            padding: 24px 18px;
          }
        }

        .section-heading {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }

        .step-num {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #140D09;
          color: #FAF6F0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.88rem;
          font-weight: 800;
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
          background: #F3F4F6;
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
          gap: 6px;
        }

        .input-group.full-width {
          grid-column: 1 / -1;
        }

        .input-group label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #140D09;
        }

        .input-group input,
        .input-group textarea,
        .styled-select {
          padding: 11px 14px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          font-size: 0.88rem;
          font-family: inherit;
          color: #140D09;
          background: #FAFAFA;
          transition: all 0.15s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .input-group input:focus,
        .input-group textarea:focus,
        .styled-select:focus {
          outline: none;
          border-color: #CC4E16;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(204, 78, 22, 0.12);
        }

        /* Bouton d'analyse */
        .extract-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #140D09;
          color: #FAF6F0;
          border: none;
          border-radius: 12px;
          padding: 0 18px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
          white-space: nowrap;
        }

        .extract-trigger-btn:hover:not(:disabled) {
          background: #CC4E16;
        }

        .extract-trigger-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* CARTE APERÇU PRODUIT */
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
          border-top: 1.5px dashed #D1D5DB;
          padding-top: 14px;
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .billing-total-val {
          font-size: 1.55rem;
          font-weight: 900;
          color: #CC4E16;
          letter-spacing: -0.02em;
        }

        /* GRILLE DES MOYENS DE PAIEMENT */
        .payment-methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .payment-method-card {
          background: #FFFFFF;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .payment-method-card:hover {
          border-color: #CC4E16;
          transform: translateY(-1px);
        }

        .payment-method-card.active {
          border-color: #CC4E16;
          background: #FFFBF8;
          box-shadow: 0 4px 14px rgba(204, 78, 22, 0.12);
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
    <Suspense fallback={<div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Chargement du formulaire...</div>}>
      <CommandeFormContent />
    </Suspense>
  );
}
