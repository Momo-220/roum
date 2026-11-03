"use client";

import { useState } from "react";
import { Copy, Check, MapPin, MessageCircle } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function WarehousesPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const warehouses = [
    {
      id: "cn",
      country: "Chine",
      city: "Guangzhou",
      countryCode: "CN",
      description: "Pour toutes vos commandes passées sur 1688, Taobao ou auprès d'usines en Chine.",
      shippingMark: "ROUM TRANSIT / [Votre Nom]",
      addressToCopy: "Guangzhou Warehouse, Baiyun District, Guangzhou City, Guangdong Province, China — ROUM TRANSIT",
    },
    {
      id: "ae",
      country: "Émirats",
      city: "Dubaï",
      countryCode: "AE",
      description: "Pour vos achats de parfumerie, cosmétiques, téléphones et électronique à Deira.",
      shippingMark: "ROUM TRANSIT DUBAI / [Votre Nom]",
      addressToCopy: "Deira Wholesale Cargo Hub, Dubai, UAE — ROUM TRANSIT DUBAI",
    },
    {
      id: "ma",
      country: "Maroc",
      city: "Casablanca",
      countryCode: "MA",
      description: "Pour vos marchandises au Maroc avec départ express garanti en 5 jours chrono.",
      shippingMark: "ROUM TRANSIT MAROC / [Votre Nom]",
      addressToCopy: "Zone Industrielle Ain Sebaa, Casablanca, Maroc — ROUM TRANSIT",
    },
    {
      id: "fr",
      country: "France",
      city: "Paris",
      countryCode: "FR",
      description: "Pour vos colis personnels, produits de beauté et plis administratifs depuis la France.",
      shippingMark: "ROUM TRANSIT PARIS / [Votre Nom]",
      addressToCopy: "Plateforme Logistique Paris Île-de-France — ROUM TRANSIT PARIS",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "transparent",
        color: "var(--c-text-main)",
        minHeight: "calc(100vh - 110px)",
        padding: "24px 16px 110px 16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div className="client-eyebrow" style={{ justifyContent: "center", marginBottom: "12px" }}>
              <span style={{ color: "var(--c-accent-red)" }}>●</span>
              <span>ENTREPÔTS MONDIAUX & GROUPAGE SÉCURISÉ</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--c-font-display)",
                fontSize: "clamp(1.4rem, 4.4vw, 2.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: "var(--c-text-main)",
                margin: "0 0 12px 0",
              }}
            >
              Adresses de Réception pour vos Fournisseurs
            </h1>

            <p style={{ fontSize: "1.02rem", color: "var(--c-text-muted)", maxWidth: "660px", margin: "0 auto", lineHeight: 1.55 }}>
              Copiez simplement l&apos;adresse du pays où vous achetez et donnez-la à votre fournisseur avec votre code client.
            </p>
          </div>

          {/* Grille des 4 entrepôts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
              marginBottom: "36px",
            }}
          >
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <CircularFlag countryCode={wh.countryCode} size={22} />
                    <div>
                      <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                        {wh.city} ({wh.country})
                      </h2>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 14px 0" }}>
                    {wh.description}
                  </p>

                  <div
                    style={{
                      backgroundColor: "#F9FAFB",
                      border: "1px dashed #D1D5DB",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      color: "#111827",
                      fontWeight: 700,
                      marginBottom: "20px",
                    }}
                  >
                    Marquage à inscrire :<br />
                    <span style={{ color: "#1E40AF" }}>{wh.shippingMark}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(wh.id, wh.addressToCopy)}
                  className="roum-btn-secondary"
                  style={{
                    width: "100%",
                    fontSize: "0.82rem",
                    padding: "10px 14px",
                    borderColor: copiedKey === wh.id ? "#86EFAC" : "#D1D5DB",
                    backgroundColor: copiedKey === wh.id ? "#F0FDF4" : "#FFFFFF",
                    color: copiedKey === wh.id ? "#15803D !important" : "#111827",
                  }}
                >
                  {copiedKey === wh.id ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                  <span>{copiedKey === wh.id ? "Adresse copiée !" : `Copier l'adresse ${wh.city}`}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Règle d'or simple */}
          <div
            style={{
              backgroundColor: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              maxWidth: "760px",
              margin: "0 auto",
            }}
          >
            <strong style={{ fontSize: "0.95rem", color: "#111827", display: "block", marginBottom: "6px" }}>
              Conseil important :
            </strong>
            <p style={{ fontSize: "0.88rem", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
              Demandez toujours à votre expéditeur d&apos;inscrire votre nom et votre numéro de téléphone sur le carton. Cela permet à notre équipe de vous attribuer le colis dès son entrée en magasin.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

