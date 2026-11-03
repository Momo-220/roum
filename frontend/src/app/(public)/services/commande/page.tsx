"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  Plane,
  Ship,
  Globe2,
} from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { saveClientRequest, getLiveCompanySettings } from "@/shared";

function CommandeFormContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");

  const [option, setOption] = useState<"sans_fournisseur" | "avec_fournisseur" | "forwarding">(
    initialMode === "forwarding" ? "forwarding" : "sans_fournisseur"
  );

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    reference: string;
    shippingMark: string;
    whatsappUrl: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);
  const [copiedPay, setCopiedPay] = useState<string | null>(null);

  // Paramètres et Moyens de Paiement synchronisés en direct avec l'Admin
  const [settings, setSettings] = useState<Record<string, string>>(() => getLiveCompanySettings());

  // Form states communs
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [destinationCity, setDestinationCity] = useState("Abidjan, Côte d'Ivoire");

  // Option 1 : Sans fournisseur (Alibaba / 1688)
  const [productQuery, setProductQuery] = useState("");
  const [productLink, setProductLink] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [targetBudget, setTargetBudget] = useState("");

  // Option 2 : Avec fournisseur (Paiement RMB Yuans)
  const [rmbAmount, setRmbAmount] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");

  // Option 3 : Expédition Internationale directe (Dubaï, France, Maroc, Chine)
  const [fwdOrigin, setFwdOrigin] = useState("Dubaï (Émirats Arabes Unis)");
  const [fwdMode, setFwdMode] = useState<"AIR" | "SEA">("AIR");
  const [fwdCargo, setFwdCargo] = useState("");

  useEffect(() => {
    if (initialMode === "forwarding") {
      setOption("forwarding");
    }
  }, [initialMode]);

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

  const copyPayMethod = (key: string, val: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      setCopiedPay(key);
      setTimeout(() => setCopiedPay(null), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;

    setSubmitting(true);
    try {
      let serviceType: "ALIBABA" | "FORWARDING" | "DUBAI" | "MAROC" | "FRANCE" = "ALIBABA";
      let cargoDescription = "";
      let originCountry = "Chine";
      let shippingMode: "AIR" | "SEA" = "AIR";

      if (option === "sans_fournisseur") {
        serviceType = "ALIBABA";
        cargoDescription = `[SOURCING SANS FOURNISSEUR] Produit: ${productQuery.trim()} | Qté: ${targetQuantity.trim() || "1"} | Budget: ${targetBudget.trim() || "À négocier"} | Réf: ${productLink.trim()}`;
        originCountry = "Chine";
      } else if (option === "avec_fournisseur") {
        serviceType = "ALIBABA";
        cargoDescription = `[PAIEMENT FOURNISSEUR RMB] Montant: ${rmbAmount.trim()} ¥ | Usine: ${supplierContact.trim()} | Marchandise: ${goodsDescription.trim()} | Réf: ${productLink.trim()}`;
        originCountry = "Chine";
      } else {
        // Expédition Internationale groupée
        if (fwdOrigin.includes("Dubaï")) serviceType = "DUBAI";
        else if (fwdOrigin.includes("Maroc")) serviceType = "MAROC";
        else if (fwdOrigin.includes("France")) serviceType = "FRANCE";
        else serviceType = "FORWARDING";

        originCountry = fwdOrigin;
        shippingMode = fwdMode;
        cargoDescription = `[EXPÉDITION INTERNATIONALE ${fwdMode}] Départ: ${fwdOrigin} | Colis: ${fwdCargo.trim() || "Marchandises générales"}`;
      }

      // Enregistrement unifié : Base de données D1 + Synchronisation temps réel Admin
      const res = await saveClientRequest({
        service_type: serviceType,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        origin_country: originCountry,
        destination_country: destinationCity.trim() || "Côte d'Ivoire",
        product_url: option === "forwarding" ? "" : productLink.trim(),
        product_quantity: option === "sans_fournisseur" ? targetQuantity.trim() || "1" : "1",
        product_specs:
          option === "sans_fournisseur"
            ? `Produit: ${productQuery.trim()} | Budget: ${targetBudget.trim() || "À négocier"}`
            : option === "avec_fournisseur"
            ? `Montant proforma: ${rmbAmount.trim()} RMB | Usine: ${supplierContact.trim()}`
            : `Mode: ${fwdMode === "AIR" ? "Avion Express" : "Bateau Maritime"} | Départ: ${fwdOrigin}`,
        shipping_mode_type: option === "forwarding" ? shippingMode : undefined,
        cargo_type: cargoDescription,
      });

      // Construction du message WhatsApp direct vers l'équipe commerciale
      let message = "";
      if (option === "sans_fournisseur") {
        message =
          `*DOSSIER SOURCING ALIBABA N° ${res.reference}*\n` +
          `• Client : ${clientName}\n` +
          `• Téléphone : ${clientPhone}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Produit : ${productQuery}\n` +
          `• Lien officiel : ${productLink}\n` +
          `• Quantité : ${targetQuantity || "À définir"}\n` +
          `• Budget : ${targetBudget || "À négocier"}\n` +
          `• Règlement : 100% Mobile Money`;
      } else if (option === "avec_fournisseur") {
        message =
          `*DOSSIER PAIEMENT FOURNISSEUR RMB N° ${res.reference}*\n` +
          `• Client : ${clientName}\n` +
          `• Téléphone : ${clientPhone}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Montant Proforma : ${rmbAmount} RMB (¥)\n` +
          `• Contact Usine (WeChat/WA) : ${supplierContact}\n` +
          `• Lien Produit / Proforma : ${productLink}\n` +
          `• Marchandise : ${goodsDescription}\n` +
          `• Règlement : 100% Mobile Money`;
      } else {
        message =
          `*DOSSIER EXPÉDITION INTERNATIONALE N° ${res.reference}*\n` +
          `• Client : ${clientName}\n` +
          `• Téléphone : ${clientPhone}\n` +
          `• Départ : ${fwdOrigin}\n` +
          `• Destination : ${destinationCity}\n` +
          `• Mode : ${fwdMode === "AIR" ? "Avion Express (4 à 5j)" : "Bateau Groupage CBM (35 à 45j)"}\n` +
          `• Nature des colis : ${fwdCargo || "Colis standards"}\n` +
          `• Dédouanement : 100% inclus`;
      }

      const customWaUrl = `https://wa.me/2250787994412?text=${encodeURIComponent(message)}`;

      setOrderResult({
        reference: res.reference,
        shippingMark: res.shippingMark,
        whatsappUrl: customWaUrl,
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
            <span>FORMULAIRE OFFICIEL UNIFIÉ</span>
          </div>
          <h1 className="page-title">
            {option === "forwarding"
              ? "Expédition Internationale Directe"
              : "Centrale d'Achat & Règlement RMB"}
          </h1>
          <p className="page-subtitle">
            {option === "forwarding" ? (
              <>
                Expédiez vos marchandises depuis Dubaï, la France, le Maroc ou la Chine.
                <strong> Dédouanement 100% compris</strong> jusqu&apos;à votre ville.
              </>
            ) : (
              <>
                Achetez et réglez vos fournisseurs en Chine sans carte bancaire internationale.
                Règlement sécurisé en Francs CFA via nos comptes <strong>Wave, Orange Money &amp; MTN</strong>.
              </>
            )}
          </p>
        </div>

        {submitted && orderResult ? (
          <div className="success-card">
            <div className="success-icon-wrap">
              <CheckCircle2 size={42} color="#16A34A" />
            </div>
            <h2 className="success-title">Dossier créé avec succès !</h2>
            <p className="success-desc">
              Votre demande a été enregistrée dans notre système central. Un conseiller Roum Transit prend immédiatement en charge votre dossier.
            </p>

            <div className="reference-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    Numéro de Dossier Officiel
                  </span>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", letterSpacing: "0.03em" }}>
                    {orderResult.reference}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(orderResult.reference, "ref")}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                  }}
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
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#CC4E16", fontFamily: "monospace" }}>
                    {orderResult.shippingMark}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(orderResult.shippingMark, "mark")}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                  }}
                >
                  {copiedMark ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copiedMark ? "Copié !" : "Copier"}</span>
                </button>
              </div>

              {/* Coordonnées officielles de paiement configurées par l'administration */}
              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px", marginTop: "4px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
                  Comptes Officiels de Règlement (Mobile Money &amp; Banque)
                </div>
                <div style={{ display: "grid", gap: "8px", fontSize: "0.82rem" }}>
                  {/* Wave */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                    <div>
                      <strong style={{ color: "#1D4ED8" }}>Wave : </strong>
                      <span>{settings.payment_wave_ci || "+225 01 53 63 85 69"} ({settings.payment_wave_name || "ROUM TRANSIT SARL"})</span>
                    </div>
                    <button type="button" onClick={() => copyPayMethod("wave", settings.payment_wave_ci || "+225 01 53 63 85 69")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                      {copiedPay === "wave" ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Orange Money */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                    <div>
                      <strong style={{ color: "#EA580C" }}>Orange Money : </strong>
                      <span>{settings.payment_orange_money_ci || "+225 07 48 29 11 00"} ({settings.payment_orange_name || "ROUM TRANSIT"})</span>
                    </div>
                    <button type="button" onClick={() => copyPayMethod("orange", settings.payment_orange_money_ci || "+225 07 48 29 11 00")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                      {copiedPay === "orange" ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* MTN MoMo */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                    <div>
                      <strong style={{ color: "#CA8A04" }}>MTN MoMo : </strong>
                      <span>{settings.payment_mtn_momo_ci || "MOMO-749201"} ({settings.payment_mtn_name || "ROUM LOGISTICS"})</span>
                    </div>
                    <button type="button" onClick={() => copyPayMethod("mtn", settings.payment_mtn_momo_ci || "MOMO-749201")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                      {copiedPay === "mtn" ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Virement BACI */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                    <div>
                      <strong style={{ color: "#0F766E" }}>Virement : </strong>
                      <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{settings.payment_bank_rib || "CI092 01001 012345678901 24"}</span>
                      <span style={{ fontSize: "0.74rem", color: "#6B7280", marginLeft: "4px" }}>({settings.payment_bank_name || "BACI"})</span>
                    </div>
                    <button type="button" onClick={() => copyPayMethod("bank", settings.payment_bank_rib || "CI092 01001 012345678901 24")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                      {copiedPay === "bank" ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
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
                <span>Ouvrir WhatsApp (+225 07 87 99 44 12)</span>
              </a>
              <Link href="/services" className="secondary-btn">
                <span>Retour aux services</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="order-form">
            {/* Choix des 3 options claires */}
            <div className="options-selector">
              <button
                type="button"
                className={`option-card ${option === "sans_fournisseur" ? "selected" : ""}`}
                onClick={() => setOption("sans_fournisseur")}
              >
                <div className="option-card-top">
                  <span className="option-num">CENTRALE CHINE</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Sans Fournisseur</h3>
                <p className="option-desc">
                  Sourcing de produits sur Alibaba / 1688. Négociation directe avec usines certifiées au meilleur prix.
                </p>
              </button>

              <button
                type="button"
                className={`option-card ${option === "avec_fournisseur" ? "selected" : ""}`}
                onClick={() => setOption("avec_fournisseur")}
              >
                <div className="option-card-top">
                  <span className="option-num">PAIEMENT RMB</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Avec Fournisseur</h3>
                <p className="option-desc">
                  Vous avez déjà votre proforma Alibaba ou WeChat. Nous réglons votre usine en Yuans sous 24h.
                </p>
              </button>

              <button
                type="button"
                className={`option-card ${option === "forwarding" ? "selected" : ""}`}
                onClick={() => setOption("forwarding")}
              >
                <div className="option-card-top">
                  <span className="option-num">TRANSIT DIRECT</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Expédition Directe</h3>
                <p className="option-desc">
                  Envois depuis Dubaï, la France, le Maroc ou la Chine vers l&apos;Afrique par avion ou bateau.
                </p>
              </button>
            </div>

            {/* Formulaire selon option */}
            <div className="form-card">
              <div className="section-heading">
                <span className="step-num">1</span>
                <h3>Coordonnées du Client</h3>
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
                  <label htmlFor="clientPhone">Numéro WhatsApp *</label>
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
                  <label htmlFor="destinationCity">Ville &amp; Destination finale</label>
                  <input
                    id="destinationCity"
                    type="text"
                    placeholder="Ex : Abidjan, Ouagadougou, Dakar, Bamako..."
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="section-divider" />

              <div className="section-heading">
                <span className="step-num">2</span>
                <h3>
                  {option === "sans_fournisseur"
                    ? "Détails du Produit Alibaba Recherché"
                    : option === "avec_fournisseur"
                    ? "Détails de la Facture Fournisseur (RMB)"
                    : "Détails de l'Expédition Internationale"}
                </h3>
              </div>

              {option === "sans_fournisseur" ? (
                <div className="form-grid">
                  <div className="input-group full-width">
                    <label htmlFor="productQuery">Description du produit ou référence usine *</label>
                    <textarea
                      id="productQuery"
                      required
                      rows={3}
                      placeholder="Ex : Chaussures hommes cuir, lot de 100 paires, tailles 40 à 45..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label htmlFor="productLink">
                      Lien du produit Alibaba, 1688 ou Taobao <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      id="productLink"
                      type="url"
                      required
                      placeholder="https://detail.1688.com/... ou https://french.alibaba.com/p-detail/..."
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                    />
                    <span style={{ fontSize: "0.76rem", color: "#6B7280", marginTop: "4px", display: "block" }}>
                      Obligatoire : notre centrale d&apos;achat a besoin du lien direct pour vérifier le fabricant, certifier les stocks et négocier le meilleur prix.
                    </span>
                  </div>

                  <div className="input-group">
                    <label htmlFor="targetQuantity">Quantité souhaitée</label>
                    <input
                      id="targetQuantity"
                      type="text"
                      placeholder="Ex : 50 pièces, 1 carton, etc."
                      value={targetQuantity}
                      onChange={(e) => setTargetQuantity(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="targetBudget">Budget estimé (FCFA)</label>
                    <input
                      id="targetBudget"
                      type="text"
                      placeholder="Ex : 500 000 FCFA"
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(e.target.value)}
                    />
                  </div>
                </div>
              ) : option === "avec_fournisseur" ? (
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
                  </div>

                  <div className="input-group">
                    <label htmlFor="supplierContact">
                      Contact fournisseur (WeChat ID / WhatsApp) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      id="supplierContact"
                      type="text"
                      required
                      placeholder="Ex : WeChat: gz_shoes88 ou WhatsApp"
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
                      placeholder="https://detail.1688.com/... ou lien de votre facture proforma"
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                    />
                    <span style={{ fontSize: "0.76rem", color: "#6B7280", marginTop: "4px", display: "block" }}>
                      Obligatoire : nous vérifions l&apos;authenticité du compte fournisseur chinois avant tout transfert de Yuans.
                    </span>
                  </div>

                  <div className="input-group full-width">
                    <label htmlFor="goodsDescription">
                      Nature de la marchandise <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      id="goodsDescription"
                      type="text"
                      required
                      placeholder="Ex : Écran téléphones, vêtements, sacs à main..."
                      value={goodsDescription}
                      onChange={(e) => setGoodsDescription(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                /* OPTION 3 : EXPÉDITION INTERNATIONALE GROUPÉE (DUBAÏ, FRANCE, MAROC, CHINE) */
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="fwdOrigin">Pays de départ *</label>
                    <select
                      id="fwdOrigin"
                      className="styled-select"
                      value={fwdOrigin}
                      onChange={(e) => setFwdOrigin(e.target.value)}
                    >
                      <option value="Dubaï (Émirats Arabes Unis)">Émirats Arabes Unis (Dubaï · Deira Wholesale)</option>
                      <option value="France (Paris)">France (Paris Île-de-France)</option>
                      <option value="Maroc (Casablanca)">Maroc (Casablanca direct)</option>
                      <option value="Chine (Guangzhou / Yiwu)">Chine (Guangzhou &amp; Yiwu)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="fwdMode">Mode d&apos;acheminement *</label>
                    <select
                      id="fwdMode"
                      className="styled-select"
                      value={fwdMode}
                      onChange={(e) => setFwdMode(e.target.value as "AIR" | "SEA")}
                    >
                      <option value="AIR">Avion Express Cargo (4 à 5 jours chrono)</option>
                      <option value="SEA">Bateau Groupage CBM / Conteneur (35 à 45 jours)</option>
                    </select>
                  </div>

                  <div className="input-group full-width">
                    <label htmlFor="fwdCargo">
                      Nature des marchandises / colis <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <textarea
                      id="fwdCargo"
                      required
                      rows={3}
                      placeholder="Ex : Téléphones neufs et reconditionnés, effets personnels, parfums, outillage..."
                      value={fwdCargo}
                      onChange={(e) => setFwdCargo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Bannière de réassurance paiement Mobile Money avec comptes en direct de l'Admin */}
              <div className="payment-notice">
                <ShieldCheck size={22} color="#CC4E16" />
                <div className="notice-content">
                  <strong>Paiement 100% Mobile Money &amp; Comptes de Règlement</strong>
                  <p>
                    Réglez en Francs CFA via nos comptes officiels. Nous convertissons et réglons votre usine sous 24h avec quittance certifiée.
                  </p>

                  <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "8px" }}>
                    <div style={{ background: "rgba(255,255,255,0.85)", padding: "8px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#1D4ED8" }}>Wave : </strong>
                      <span>{settings.payment_wave_ci || "+225 01 53 63 85 69"}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.85)", padding: "8px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#EA580C" }}>Orange Money : </strong>
                      <span>{settings.payment_orange_money_ci || "+225 07 48 29 11 00"}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.85)", padding: "8px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#CA8A04" }}>MTN MoMo : </strong>
                      <span>{settings.payment_mtn_momo_ci || "MOMO-749201"}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.85)", padding: "8px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#0F766E" }}>Banque BACI : </strong>
                      <span>{settings.payment_bank_name || "BACI (Abidjan)"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton de validation */}
              <div className="form-actions">
                <button type="submit" disabled={submitting} className="submit-btn">
                  <span>{submitting ? "Enregistrement en cours..." : "Envoyer ma demande"}</span>
                  <ArrowRight size={16} />
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
          max-width: 860px;
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
          margin-bottom: 32px;
        }

        .badge-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--c-font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #CC4E16;
          margin-bottom: 8px;
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

        /* Sélecteur des 3 options */
        .options-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
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
          gap: 8px;
        }

        .option-card.selected {
          border-color: #CC4E16;
          background-color: #FFF9F5;
          box-shadow: 0 8px 24px -6px rgba(204, 78, 22, 0.2);
        }

        .option-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .option-num {
          font-family: var(--c-font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #CC4E16;
        }

        .option-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(20, 13, 9, 0.25);
          position: relative;
        }

        .option-card.selected .option-radio {
          border-color: #CC4E16;
          background-color: #CC4E16;
        }

        .option-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #140D09;
        }

        .option-desc {
          font-size: 0.82rem;
          color: #6B635B;
          line-height: 1.4;
        }

        /* Formulaire */
        .form-card {
          background-color: #FFFFFF;
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 12px 36px -10px rgba(20, 13, 9, 0.08);
          border: 1px solid rgba(20, 13, 9, 0.06);
        }

        @media (max-width: 640px) {
          .form-card {
            padding: 24px 18px;
          }
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: #140D09;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--c-font-mono);
          font-size: 0.78rem;
          font-weight: 700;
        }

        .section-heading h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #140D09;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
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
          width: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(20, 13, 9, 0.16);
          border-radius: 12px;
          font-size: 0.88rem;
          color: #140D09;
          background: #FAF6F0;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
          font-family: inherit;
        }

        .input-group input:focus,
        .input-group textarea:focus,
        .styled-select:focus {
          border-color: #CC4E16;
          background: #FFFFFF;
        }

        .section-divider {
          height: 1px;
          background: rgba(20, 13, 9, 0.08);
          margin: 28px 0;
        }

        .payment-notice {
          display: flex;
          gap: 14px;
          background: #FFF7ED;
          border: 1px solid #FFEDD5;
          padding: 18px;
          border-radius: 16px;
          margin-top: 24px;
        }

        .notice-content strong {
          font-size: 0.88rem;
          color: #9A3412;
          display: block;
          margin-bottom: 4px;
        }

        .notice-content p {
          font-size: 0.82rem;
          color: #C2410C;
          line-height: 1.45;
          margin: 0;
        }

        .form-actions {
          margin-top: 28px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px 24px;
          border-radius: 9999px;
          background: #140D09;
          color: #FAF6F0;
          font-size: 0.94rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .submit-btn:hover {
          background: #2D1E16;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Carte de succès */
        .success-card {
          background-color: #FFFFFF;
          border-radius: 24px;
          padding: 40px 32px;
          text-align: center;
          box-shadow: 0 12px 36px -10px rgba(20, 13, 9, 0.08);
        }

        .success-icon-wrap {
          margin-bottom: 16px;
        }

        .success-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #140D09;
          margin-bottom: 8px;
        }

        .success-desc {
          font-size: 0.9rem;
          color: #6B635B;
          max-width: 520px;
          margin: 0 auto 24px auto;
          line-height: 1.5;
        }

        .reference-box {
          background: #F9FAFB;
          border: 1px dashed #D1D5DB;
          border-radius: 14px;
          padding: 18px;
          max-width: 480px;
          margin: 0 auto 28px auto;
          text-align: left;
        }

        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 380px;
          margin: 0 auto;
        }

        .wa-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          background-color: #25D366;
          color: #FFFFFF;
          font-size: 0.88rem;
          font-weight: 700;
          border-radius: 9999px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.35);
          transition: transform 0.15s ease;
        }

        .wa-btn:hover {
          transform: scale(1.02);
        }

        .secondary-btn {
          font-size: 0.84rem;
          font-weight: 600;
          color: #6B635B;
          text-decoration: none;
          padding: 10px;
        }

        .secondary-btn:hover {
          color: #140D09;
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
