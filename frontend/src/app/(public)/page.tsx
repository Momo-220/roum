"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Calculator,
  MapPin,
} from "lucide-react";
import { normalizeTrackingNumber } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";
import { WorldMap } from "@/components/WorldMap";
import { ServicesVisualCards } from "@/components/ServicesVisualCards";

export default function HomePage() {
  const router = useRouter();

  // Suivi rapide de colis
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
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "40px 24px 80px 24px" }}>
      {/* ========================================================
          HERO : TITRE EN IMMERSION ARRIÈRE-PLAN ("BIEN EN ARRIÈRE")
          ET CARTE MONDIALE EN AVANT-PLAN AVEC DÉBUT TRANSPARENT
          (Immersion pure, zéro coupure, animations fluides et simples)
         ======================================================== */}
      <ScrollReveal>
        <section style={{ textAlign: "center", marginBottom: "72px", position: "relative" }}>
          {/* Titre Pesant Host Grotesk placé bien en Arrière-Plan */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "920px",
              margin: "0 auto",
              padding: "16px 16px 0 16px",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--c-font-display)",
                fontSize: "clamp(2.4rem, 5.6vw, 4.2rem)",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.038em",
                color: "var(--c-text-main)",
                margin: 0,
              }}
            >
              Transport maritime & aérien direct vers l&apos;Afrique.
            </h1>
          </div>

          {/* Carte Mondiale au Premier Plan (Remontée en immersion, avec début semi-transparent) */}
          <div
            style={{
              width: "100%",
              maxWidth: "1000px",
              margin: "clamp(-110px, -9.2vw, -60px) auto 0 auto",
              position: "relative",
              zIndex: 2,
              pointerEvents: "none",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.55) 20%, #000000 42%, #000000 78%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.55) 20%, #000000 42%, #000000 78%, transparent 100%)",
            }}
          >
            <WorldMap lineColor="#0EA5E9" />
          </div>

          {/* Module de Recherche Épuré Flottant Naturellement */}
          <div
            style={{
              maxWidth: "560px",
              margin: "clamp(-38px, -3.8vw, -18px) auto 0 auto",
              position: "relative",
              zIndex: 10,
            }}
          >
            <form
              onSubmit={handleTrackingSubmit}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--c-border)",
                borderRadius: "9999px",
                padding: "6px 8px 6px 20px",
                boxShadow: "0 4px 20px -2px rgba(27, 20, 17, 0.05)",
              }}
            >
              <Search size={17} color="#8C7D75" style={{ marginRight: "12px", flexShrink: 0 }} />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => {
                  setTrackingInput(e.target.value);
                  if (trackingError) setTrackingError("");
                }}
                placeholder="Numéro de bordereau (Ex : RM-AIR-2610-K8P9Q2)"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "0.88rem",
                  fontFamily: "var(--c-font-mono)",
                  backgroundColor: "transparent",
                  color: "var(--c-text-main)",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "var(--c-text-main)",
                  color: "var(--c-bg)",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "10px 22px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.15s ease",
                }}
              >
                Suivre
              </button>
            </form>

            {trackingError && (
              <div style={{ fontSize: "0.78rem", color: "#DC2626", marginTop: "8px", fontWeight: 500 }}>
                {trackingError}
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* ========================================================
          LES 3 CARTES DE TRANSPORT & FRET (FORMAT ADAPTÉ ROUM TRANSIT)
          (Plein format photo, verre dépoli, typographie Host Grotesk,
           support mobile avec scroll snap magnétique sans débordement)
         ======================================================== */}
      <ScrollReveal delay={60}>
        <ServicesVisualCards />
      </ScrollReveal>

      {/* ========================================================
          OUTILS & PASSERELLES RAPIDES : SIMULATEUR & ENTREPÔTS
          (Deux sections sobres, intégrées sans lourdeur)
         ======================================================== */}
      <ScrollReveal delay={200}>
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Bloc Simulateur */}
          <div
            style={{
              padding: "24px 0",
              borderTop: "1px solid var(--c-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Calculator size={18} color="var(--c-text-main)" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: 0, fontFamily: "var(--c-font-display)" }}>
                Simulateur de Prix
              </h3>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--c-text-muted)", lineHeight: 1.55, margin: "0 0 16px 0" }}>
              Estimez le montant exact de votre envoi selon le poids, le mode et le pays de départ. Dédouanement 100% compris.
            </p>

            <Link
              href="/tariffs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.84rem",
                fontWeight: 600,
                color: "var(--c-text-main)",
                textDecoration: "none",
              }}
            >
              <span>Calculer mon tarif</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Bloc Entrepôts */}
          <div
            style={{
              padding: "24px 0",
              borderTop: "1px solid var(--c-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <MapPin size={18} color="var(--c-text-main)" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-main)", margin: 0, fontFamily: "var(--c-font-display)" }}>
                Adresses de Réception
              </h3>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--c-text-muted)", lineHeight: 1.55, margin: "0 0 16px 0" }}>
              Copiez les adresses de nos magasins de Guangzhou, Yiwu, Dubaï, Casablanca et Paris à donner à vos expéditeurs.
            </p>

            <Link
              href="/warehouses"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.84rem",
                fontWeight: 600,
                color: "var(--c-text-main)",
                textDecoration: "none",
              }}
            >
              <span>Voir les magasins</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
