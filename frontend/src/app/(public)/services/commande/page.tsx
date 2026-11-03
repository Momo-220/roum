"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { saveClientRequest } from "@/shared";

export default function CommandeAchatPage() {
  const [option, setOption] = useState<"sans_fournisseur" | "avec_fournisseur">("sans_fournisseur");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    reference: string;
    shippingMark: string;
    whatsappUrl: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedMark, setCopiedMark] = useState(false);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [destinationCity, setDestinationCity] = useState("Abidjan, Côte d'Ivoire");

  // Option 1 : Sans fournisseur
  const [productQuery, setProductQuery] = useState("");
  const [productLink, setProductLink] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [targetBudget, setTargetBudget] = useState("");

  // Option 2 : Avec fournisseur
  const [rmbAmount, setRmbAmount] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;

    setSubmitting(true);
    try {
      const isOption1 = option === "sans_fournisseur";
      const cargoDescription = isOption1
        ? `[SOURCING SANS FOURNISSEUR] Produit: ${productQuery.trim()} | Qté: ${targetQuantity.trim() || "1"} | Budget: ${targetBudget.trim() || "À négocier"} | Réf: ${productLink.trim() || "Non fourni"}`
        : `[PAIEMENT FOURNISSEUR RMB] Montant: ${rmbAmount.trim()} ¥ | Usine: ${supplierContact.trim()} | Marchandise: ${goodsDescription.trim()}`;

      // Enregistrement unifié : Base de données D1 + Synchronisation temps réel Admin (roum_requests_data)
      const res = await saveClientRequest({
        service_type: "ALIBABA",
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        origin_country: "Chine",
        destination_country: destinationCity.trim() || "Côte d'Ivoire",
        product_url: isOption1 ? productLink.trim() : "",
        product_quantity: isOption1 ? targetQuantity.trim() || "1" : "1",
        product_specs: isOption1
          ? `Produit: ${productQuery.trim()} | Budget: ${targetBudget.trim() || "À négocier"}`
          : `Montant proforma: ${rmbAmount.trim()} RMB | Usine: ${supplierContact.trim()}`,
        cargo_type: cargoDescription,
      });

      // Construction du message WhatsApp direct vers l'équipe commerciale
      const message =
        option === "sans_fournisseur"
          ? `*DOSSIER SOURCING N° ${res.reference}*\n` +
            `• Client : ${clientName}\n` +
            `• Téléphone : ${clientPhone}\n` +
            `• Destination : ${destinationCity}\n` +
            `• Produit : ${productQuery}\n` +
            `• Lien référence : ${productLink || "Non fourni"}\n` +
            `• Quantité : ${targetQuantity || "À définir"}\n` +
            `• Budget : ${targetBudget || "À négocier"}\n` +
            `• Règlement : 100% Mobile Money`
          : `*DOSSIER PAIEMENT FOURNISSEUR N° ${res.reference}*\n` +
            `• Client : ${clientName}\n` +
            `• Téléphone : ${clientPhone}\n` +
            `• Destination : ${destinationCity}\n` +
            `• Montant Proforma : ${rmbAmount} RMB (¥)\n` +
            `• Contact Usine (WeChat/WA) : ${supplierContact}\n` +
            `• Marchandise : ${goodsDescription}\n` +
            `• Règlement client : 100% Mobile Money`;

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
        <header className="page-header">
          <div className="badge-eyebrow">
            <span className="dot" />
            <span>CENTRALE D&apos;ACHAT · CHINE &amp; INTERNATIONAL</span>
          </div>
          <h1 className="page-title">Passer une Commande d&apos;Achat</h1>
          <p className="page-subtitle">
            Achetez en Chine sans carte bancaire internationale. Nous négocions ou réglons votre fournisseur en Yuans RMB sous 24h.
            Règlement client <strong>100% Mobile Money (Wave, Orange, MTN)</strong>.
          </p>
        </header>

        {submitted ? (
          <div className="success-card">
            <CheckCircle2 size={46} color="#22C55E" />
            <h2 className="success-title">Dossier Enregistré avec Succès !</h2>
            <p className="success-desc">
              Votre commande est enregistrée dans notre système centralisé et instantanément transmise au tableau de bord administrateur Roum Transit.
            </p>

            {orderResult && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  margin: "20px 0",
                  textAlign: "left",
                  display: "grid",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              </div>
            )}

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
            {/* Choix des 2 options claires */}
            <div className="options-selector">
              <button
                type="button"
                className={`option-card ${option === "sans_fournisseur" ? "selected" : ""}`}
                onClick={() => setOption("sans_fournisseur")}
              >
                <div className="option-card-top">
                  <span className="option-num">OPTION 1</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Sans Fournisseur</h3>
                <p className="option-desc">
                  Vous cherchez un produit. Nous trouvons les fabricants chinois certifiés et négocions le tarif usine le plus bas.
                </p>
              </button>

              <button
                type="button"
                className={`option-card ${option === "avec_fournisseur" ? "selected" : ""}`}
                onClick={() => setOption("avec_fournisseur")}
              >
                <div className="option-card-top">
                  <span className="option-num">OPTION 2</span>
                  <span className="option-radio" />
                </div>
                <h3 className="option-title">Avec Fournisseur</h3>
                <p className="option-desc">
                  Vous avez déjà votre proforma (Alibaba, 1688, WeChat). Nous payons votre usine en Yuans RMB sous 24h chrono.
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
                    ? "Détails du Produit Recherché"
                    : "Détails de la Facture Fournisseur (RMB)"}
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
                    <label htmlFor="productLink">Lien d&apos;exemple ou lien Alibaba / 1688 (optionnel)</label>
                    <input
                      id="productLink"
                      type="url"
                      placeholder="https://..."
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                    />
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
              ) : (
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="rmbAmount">Montant exact en Yuans (RMB ¥) *</label>
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
                    <label htmlFor="supplierContact">Contact fournisseur (WeChat ID / WhatsApp) *</label>
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
                    <label htmlFor="goodsDescription">Nature de la marchandise *</label>
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
              )}

              {/* Bannière de réassurance paiement Mobile Money */}
              <div className="payment-notice">
                <ShieldCheck size={20} color="#CC4E16" />
                <div className="notice-content">
                  <strong>Paiement 100% Mobile Money garanti</strong>
                  <p>
                    Réglez votre facture en Francs CFA via Wave, Orange Money ou MTN.
                    Nous convertissons en Yuans et réglons votre usine sous 24h avec quittance certifiée.
                  </p>
                </div>
              </div>

              {/* Bouton de validation */}
              <div className="form-actions">
                <button type="submit" disabled={submitting} className="submit-btn">
                  <span>{submitting ? "Enregistrement en cours..." : "Envoyer ma commande"}</span>
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
          max-width: 780px;
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
          font-size: 1.12rem;
          font-weight: 800;
          color: #140D09;
        }

        .section-divider {
          height: 1px;
          background-color: rgba(20, 13, 9, 0.08);
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
          font-size: 0.78rem;
          font-weight: 700;
          color: #140D09;
          letter-spacing: -0.01em;
        }

        .input-group input,
        .input-group textarea {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(20, 13, 9, 0.16);
          background-color: #FAF6F0;
          font-family: inherit;
          font-size: 0.88rem;
          color: #140D09;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .input-group input:focus,
        .input-group textarea:focus {
          border-color: #CC4E16;
          background-color: #FFFFFF;
        }

        .payment-notice {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background-color: rgba(204, 78, 22, 0.08);
          border: 1px solid rgba(204, 78, 22, 0.2);
          border-radius: 14px;
          padding: 14px 16px;
          margin: 28px 0;
        }

        .notice-content strong {
          display: block;
          font-size: 0.84rem;
          color: #CC4E16;
          margin-bottom: 2px;
        }

        .notice-content p {
          font-size: 0.78rem;
          color: #6B635B;
          line-height: 1.4;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
        }

        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #140D09;
          color: #FFFFFF;
          padding: 14px 26px;
          border-radius: 9999px;
          border: none;
          font-size: 0.90rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .submit-btn:hover {
          background-color: #CC4E16;
        }

        @media (max-width: 640px) {
          .submit-btn {
            width: 100%;
            justify-content: center;
          }
        }

        /* Écran de succès */
        .success-card {
          background-color: #FFFFFF;
          border-radius: 24px;
          padding: 44px 28px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 0 12px 36px -10px rgba(20, 13, 9, 0.08);
        }

        .success-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #140D09;
        }

        .success-desc {
          font-size: 0.88rem;
          color: #6B635B;
          max-width: 500px;
          line-height: 1.5;
        }

        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 360px;
          margin-top: 12px;
        }

        .wa-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: #25D366;
          color: #FFFFFF;
          padding: 13px 22px;
          border-radius: 9999px;
          font-size: 0.86rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
        }

        .secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          border-radius: 9999px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #6B635B;
          text-decoration: none;
          background: rgba(20, 13, 9, 0.05);
        }
      `}</style>
    </div>
  );
}

