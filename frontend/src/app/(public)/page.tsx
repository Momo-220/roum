"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plane, Ship, MapPin, ArrowRight, ShieldCheck, Scale, Clock } from "lucide-react";
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
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "40px 20px 60px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", width: "100%" }}>
        <ScrollReveal>
          {/* Badge discret */}
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
              marginBottom: "18px",
            }}
          >
            Fret International Simple & Direct
          </div>

          {/* Titre Majeur */}
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "#111827",
              margin: "0 auto 18px auto",
              maxWidth: "840px",
              textWrap: "balance",
            }}
          >
            Vos colis de Chine, Dubaï, Maroc et France livrés à Abidjan.
          </h1>

          {/* Message clair et compréhensible par un enfant */}
          <p
            style={{
              fontSize: "clamp(1.02rem, 1.6vw, 1.18rem)",
              lineHeight: 1.6,
              color: "#4B5563",
              maxWidth: "680px",
              margin: "0 auto 36px auto",
              textWrap: "pretty",
            }}
          >
            Vous achetez chez vos fournisseurs, ils déposent dans nos magasins, nous pesons et nous expédions. Aucun frais caché : le dédouanement est déjà compris dans le tarif.
          </p>

          {/* Boutons d'action rapides vers les autres écrans */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "40px",
            }}
          >
            <Link
              href="/services"
              className="roum-btn-primary"
              style={{ padding: "12px 24px", fontSize: "0.92rem" }}
            >
              <span>Découvrir nos services</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/tariffs"
              className="roum-btn-secondary"
              style={{ padding: "12px 22px", fontSize: "0.92rem" }}
            >
              <span>Calculer un prix</span>
            </Link>

            <Link
              href="/warehouses"
              className="roum-btn-secondary"
              style={{ padding: "12px 22px", fontSize: "0.92rem" }}
            >
              <span>Adresses magasins</span>
            </Link>
          </div>

          {/* Boîte de recherche de colis intégrée */}
          <div
            style={{
              maxWidth: "580px",
              margin: "0 auto",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: "14px",
              padding: "20px 22px",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.05)",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>
              Vous attendez déjà un colis ? Entrez son numéro :
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
                    height: "48px",
                    padding: "0 14px",
                    fontSize: "16px",
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
                    height: "48px",
                    padding: "0 22px",
                    fontSize: "0.9rem",
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

          {/* Garanties en bas de page */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "28px",
              marginTop: "44px",
              flexWrap: "wrap",
              fontSize: "0.84rem",
              color: "#6B7280",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Scale size={16} color="#111827" />
              <span>Pesée certifiée au gramme près</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} color="#111827" />
              <span>Dédouanement garanti & inclus</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={16} color="#111827" />
              <span>Agence à Abidjan Bingerville</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
