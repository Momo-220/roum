"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  PackageCheck,
  Search,
  Plane,
  Ship,
  ArrowRight,
  ShieldCheck,
  Scale,
  MapPin,
} from "lucide-react";
import { normalizeTrackingNumber } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function HomePage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");

    const normalized = normalizeTrackingNumber(trackingInput);
    if (!normalized) {
      setTrackingError("Numéro de colis invalide (Ex : RM-AIR-2610-K8P9Q2).");
      return;
    }

    router.push(`/tracking/${normalized}`);
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "40px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* Hero Section Épurée */}
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "9999px",
                backgroundColor: "#F3F4F6",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "14px",
              }}
            >
              Fret & Centrale d&apos;Achat International
            </div>

            <h1
              style={{
                fontSize: "clamp(2.1rem, 4.8vw, 3.6rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 auto 14px auto",
                maxWidth: "840px",
                textWrap: "balance",
              }}
            >
              Vos colis de Chine, Dubaï, Maroc et France livrés en toute sécurité.
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 1.5vw, 1.12rem)",
                lineHeight: 1.55,
                color: "#4B5563",
                maxWidth: "620px",
                margin: "0 auto",
                textWrap: "pretty",
              }}
            >
              Nous achetons pour vous sur Alibaba ou transportons vos marchandises par avion et par bateau avec douane comprise.
            </p>
          </div>

          {/* Grille des 4 Services de Transit Réels */}
          <div style={{ marginBottom: "44px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "18px",
              }}
            >
              {/* 1. Commander sur Alibaba */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #111827",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(17, 24, 39, 0.06)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <ShoppingBag size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 01
                  </div>

                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Commander sur Alibaba
                  </h2>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Nous payons votre fournisseur en Chine et livrons vos produits chez vous.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Accompagnement tout compris
                  </div>
                </div>

                <Link
                  href="/services?tab=alibaba"
                  className="roum-btn-primary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Commander sur Alibaba</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* 2. Transit & Fret Chine */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Plane size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 02
                  </div>

                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Transit & Fret Chine
                  </h2>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Réception dans nos entrepôts de Guangzhou et Yiwu, pesée et expédition.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Avion (4-5j) ou Bateau (35j)
                  </div>
                </div>

                <Link
                  href="/services?tab=forwarding"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Obtenir l&apos;adresse magasin</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* 3. Groupage Maroc (Casablanca) */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <PackageCheck size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 03
                  </div>

                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Groupage Maroc (Casablanca)
                  </h2>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Ligne aérienne rapide vers la Côte d&apos;Ivoire, le Mali et le Sénégal.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Délai : 5 jours garantis
                  </div>
                </div>

                <Link
                  href="/tariffs"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Tarifs Groupage Maroc</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* 4. Groupage France (Paris ↔ Abidjan) */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Plane size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 04
                  </div>

                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Groupage France (Paris)
                  </h2>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Expédition de vos colis personnels, produits de beauté et plis urgents.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Délai : 3 à 5 jours
                  </div>
                </div>

                <Link
                  href="/tariffs"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Tarifs Groupage France</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Boîte de Suivi Direct */}
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto 44px auto",
              backgroundColor: "#FAF9F6",
              border: "1px solid #D1D5DB",
              borderRadius: "14px",
              padding: "22px 24px",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
              Vous attendez un colis ? Entrez son numéro :
            </div>

            <form onSubmit={handleTrackingSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => {
                    setTrackingInput(e.target.value);
                    if (trackingError) setTrackingError("");
                  }}
                  placeholder="Ex : RM-AIR-2610-K8P9Q2"
                  style={{
                    flex: "1 1 240px",
                    height: "44px",
                    padding: "0 12px",
                    fontSize: "14px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    fontWeight: 600,
                  }}
                />

                <button
                  type="submit"
                  className="roum-btn-primary"
                  style={{
                    height: "44px",
                    padding: "0 20px",
                    fontSize: "0.88rem",
                  }}
                >
                  <Search size={15} />
                  <span>Suivre mon colis</span>
                </button>
              </div>

              {trackingError && (
                <div style={{ fontSize: "0.8rem", color: "#DC2626", fontWeight: 600 }}>
                  {trackingError}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#6B7280", marginTop: "2px" }}>
                <span>Exemple de test :</span>
                <button
                  type="button"
                  onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#111827",
                    fontWeight: 700,
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                  }}
                >
                  RM-AIR-2610-K8P9Q2
                </button>
              </div>
            </form>
          </div>

          {/* Garanties Minimalistes */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "28px",
              flexWrap: "wrap",
              fontSize: "0.84rem",
              color: "#4B5563",
              fontWeight: 600,
              paddingTop: "20px",
              borderTop: "1px solid #F3F4F6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Scale size={16} color="#111827" />
              <span>Pesée certifiée</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} color="#111827" />
              <span>Dédouanement 100% inclus</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={16} color="#111827" />
              <span>Agence à Bingerville Carrefour Safari</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
