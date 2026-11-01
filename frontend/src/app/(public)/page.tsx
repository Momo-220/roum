"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plane,
  Ship,
  ShieldCheck,
  CreditCard,
  MapPin,
  Scale,
  ArrowRight,
  Clock,
  Layers,
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
      setTrackingError("Veuillez entrer un numéro de colis valide (Ex : RM-AIR-2610-K8P9Q2).");
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
        padding: "48px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* Section Hero */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "9999px",
                backgroundColor: "#F3F4F6",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "16px",
              }}
            >
              Fret International Simple & Direct
            </div>

            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 auto 18px auto",
                maxWidth: "860px",
                textWrap: "balance",
              }}
            >
              Vos colis de Chine, Dubaï, Maroc et France livrés à Abidjan.
            </h1>

            <p
              style={{
                fontSize: "clamp(1.02rem, 1.6vw, 1.18rem)",
                lineHeight: 1.6,
                color: "#4B5563",
                maxWidth: "680px",
                margin: "0 auto",
                textWrap: "pretty",
              }}
            >
              Vous achetez chez vos fournisseurs, ils déposent dans nos magasins, nous pesons et nous expédions. Aucun frais caché : le dédouanement est déjà compris dans le tarif.
            </p>
          </div>

          {/* Section Services Proposés avec Boutons */}
          <div style={{ marginBottom: "56px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6B7280",
                    marginBottom: "4px",
                  }}
                >
                  Ce que nous faisons
                </div>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#111827",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  Nos formules de transport direct
                </h2>
              </div>

              <Link
                href="/services"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "#111827",
                  textDecoration: "underline",
                }}
              >
                <Layers size={16} />
                <span>Voir le catalogue complet des 10 services</span>
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "18px",
              }}
            >
              {/* Carte 1 : Avion Express */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #111827",
                  borderRadius: "14px",
                  padding: "22px",
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
                    <Plane size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                    Voie Express Avion
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Le plus rapide pour vêtements, téléphones, ordinateurs et colis urgents.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "18px" }}>
                    Délai : 4 à 5 jours
                  </div>
                </div>

                <Link
                  href="/tariffs"
                  className="roum-btn-primary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem", padding: "10px 16px" }}
                >
                  <span>Calculer le prix</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Carte 2 : Bateau CBM */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "22px",
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
                    <Ship size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                    Maritime au Mètre Cube
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Idéal et très économique pour les gros cartons, meubles et machines.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "18px" }}>
                    Délai : 35 à 45 jours
                  </div>
                </div>

                <Link
                  href="/tariffs"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem", padding: "10px 16px" }}
                >
                  <span>Estimer le volume CBM</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Carte 3 : Paiement Fournisseurs */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "22px",
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
                    <CreditCard size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                    Paiement Fournisseurs
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Règlement direct de vos achats sur 1688, Taobao ou usines en Yuans (RMB) et Dirhams (AED).
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "18px" }}>
                    Règlement sous 24h
                  </div>
                </div>

                <Link
                  href="/services"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem", padding: "10px 16px" }}
                >
                  <span>Détails & assistance</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Carte 4 : Douane & Retrait */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "22px",
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
                    <ShieldCheck size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: "0 0 6px 0" }}>
                    Douane 100% Incluse
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Zéro mauvaise surprise à l&apos;arrivée. Retrait direct à Bingerville Carrefour Safari.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "18px" }}>
                    Formalités gérées par Roum
                  </div>
                </div>

                <Link
                  href="/warehouses"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.84rem", padding: "10px 16px" }}
                >
                  <span>Adresse de l&apos;agence</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Boîte de Suivi Rapide */}
          <div
            style={{
              maxWidth: "640px",
              margin: "0 auto 48px auto",
              backgroundColor: "#FAF9F6",
              border: "1px solid #E5E7EB",
              borderRadius: "16px",
              padding: "24px 26px",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280", marginBottom: "4px" }}>
              Suivi en temps réel
            </div>
            <div style={{ fontSize: "1.08rem", fontWeight: 800, color: "#111827", marginBottom: "14px" }}>
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
                    height: "46px",
                    padding: "0 14px",
                    fontSize: "15px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    color: "#111827",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    fontWeight: 600,
                  }}
                />

                <button
                  type="submit"
                  className="roum-btn-primary"
                  style={{
                    height: "46px",
                    padding: "0 20px",
                    fontSize: "0.88rem",
                  }}
                >
                  <Search size={16} />
                  <span>Trouver mon colis</span>
                </button>
              </div>

              {trackingError && (
                <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600, marginTop: "2px" }}>
                  {trackingError}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#6B7280", marginTop: "4px" }}>
                <span>Exemple :</span>
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

          {/* Garanties Simples & Brefs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "32px",
              flexWrap: "wrap",
              fontSize: "0.85rem",
              color: "#4B5563",
              fontWeight: 600,
              paddingTop: "24px",
              borderTop: "1px solid #F3F4F6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Scale size={17} color="#111827" />
              <span>Pesée certifiée au gramme près</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={17} color="#111827" />
              <span>Dédouanement garanti & inclus</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={17} color="#111827" />
              <span>Agence à Abidjan Bingerville</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
