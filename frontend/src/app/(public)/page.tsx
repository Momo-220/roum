"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Calculator,
  MapPin,
} from "lucide-react";
import { normalizeTrackingNumber } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";
import { WorldMap } from "@/components/WorldMap";

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
          DISPOSITION EN ZIGZAG NATURELLE (SANS AUCUN CADRAN NI BOÎTE) :
          SECTION 01 : ACHAT ALIBABA (À GAUCHE, BOUTON REGARDANT VERS LA DROITE)
          SECTION 02 : TRANSIT INTERNATIONAL (À DROITE, BOUTON REGARDANT VERS LA GAUCHE)
          SECTION 03 : ENVOI DE COLIS (À GAUCHE, BOUTON REGARDANT VERS LA DROITE)
         ======================================================== */}
      <section style={{ marginBottom: "64px" }}>
        {/* ========================================================
            SECTION 01 : ACHAT ASSISTÉ ALIBABA EN PREMIER (À GAUCHE)
           ======================================================== */}
        <ScrollReveal delay={80}>
          <article
            style={{
              padding: "52px 0",
              borderTop: "1px solid var(--c-border)",
            }}
          >
            <div style={{ maxWidth: "780px", marginRight: "auto", marginLeft: 0 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--c-font-mono)",
                  fontWeight: 700,
                  color: "var(--c-text-light)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                01 / CENTRALE D&apos;ACHAT · PAIEMENT EN YUANS CHINOIS (RMB)
              </div>

              <h2
                style={{
                  fontFamily: "var(--c-font-display)",
                  fontSize: "clamp(2rem, 4.4vw, 3.1rem)",
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: "-0.035em",
                  color: "var(--c-text-main)",
                  margin: "0 0 16px 0",
                }}
              >
                Nous payons directement vos fournisseurs en Chine sans blocage bancaire.
              </h2>

              <p
                style={{
                  fontSize: "1.06rem",
                  color: "var(--c-text-muted)",
                  lineHeight: 1.6,
                  margin: "0 0 20px 0",
                }}
              >
                Choisissez simplement vos articles sur Alibaba ou 1688. Vous réglez en FCFA à Abidjan à un taux négocié : notre équipe paie le fournisseur chinois directement en Yuans, vérifie la conformité de vos cartons en magasin et prend en charge l&apos;acheminement.
              </p>

              {/* Détails intégrés naturellement sans aucun cadran */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "14px 22px",
                  fontSize: "0.84rem",
                  color: "var(--c-text-light)",
                  marginBottom: "26px",
                  lineHeight: 1.5,
                }}
              >
                <span><strong>Zéro carte bancaire :</strong> Aucun blocage international</span>
                <span>•</span>
                <span><strong>Règlement en FCFA :</strong> Nous payons en Yuans (RMB)</span>
                <span>•</span>
                <span><strong>Contrôle qualité :</strong> Inspection avant départ</span>
              </div>

              <div>
                <Link
                  href="/services?tab=alibaba"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 24px",
                    borderRadius: "9999px",
                    backgroundColor: "var(--c-text-main)",
                    color: "#FAF5F0",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "transform 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <span>Commander sur Alibaba</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </article>
        </ScrollReveal>

        {/* ========================================================
            SECTION 02 : TRANSIT INTERNATIONAL (À DROITE, BOUTON REGARDANT À GAUCHE)
           ======================================================== */}
        <ScrollReveal delay={120}>
          <article
            style={{
              padding: "52px 0",
              borderTop: "1px solid var(--c-border)",
            }}
          >
            <div style={{ maxWidth: "780px", marginLeft: "auto", marginRight: 0, textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--c-font-mono)",
                  fontWeight: 700,
                  color: "var(--c-text-light)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                02 / TRANSIT INTERNATIONAL · CHINE, DUBAÏ, MAROC
              </div>

              <h2
                style={{
                  fontFamily: "var(--c-font-display)",
                  fontSize: "clamp(2rem, 4.4vw, 3.1rem)",
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: "-0.035em",
                  color: "var(--c-text-main)",
                  margin: "0 0 16px 0",
                }}
              >
                Acheminement direct de vos marchandises par avion et par bateau.
              </h2>

              <p
                style={{
                  fontSize: "1.06rem",
                  color: "var(--c-text-muted)",
                  lineHeight: 1.6,
                  margin: "0 0 20px 0",
                }}
              >
                Départs réguliers chaque semaine depuis nos magasins de Guangzhou, Yiwu, Dubaï et Casablanca.
                Voie express par avion en 4 à 6 jours, voie normale en 10 à 14 jours ou conteneurs maritimes, avec dédouanement 100% compris jusqu&apos;à Abidjan et 5 pays d&apos;Afrique.
              </p>

              {/* Détails intégrés naturellement sans aucun cadran, alignés à droite */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "14px 22px",
                  fontSize: "0.84rem",
                  color: "var(--c-text-light)",
                  marginBottom: "26px",
                  lineHeight: 1.5,
                }}
              >
                <span><strong>Chine :</strong> Express (4-6j) & Normal (10-14j)</span>
                <span>•</span>
                <span><strong>Dubaï :</strong> Parfums, téléphones & électronique</span>
                <span>•</span>
                <span><strong>Maroc :</strong> 5 jours chrono</span>
                <span>•</span>
                <span style={{ color: "#166534", fontWeight: 600 }}>Douane 100% comprise</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link
                  href="/services?tab=transit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 24px",
                    borderRadius: "9999px",
                    backgroundColor: "var(--c-text-main)",
                    color: "#FAF5F0",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "transform 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <ArrowLeft size={15} />
                  <span>Découvrir le Transit</span>
                </Link>
              </div>
            </div>
          </article>
        </ScrollReveal>

        {/* ========================================================
            SECTION 03 : ENVOI DE COLIS FRANCE (À GAUCHE, BOUTON REGARDANT À DROITE)
           ======================================================== */}
        <ScrollReveal delay={160}>
          <article
            style={{
              padding: "52px 0",
              borderTop: "1px solid var(--c-border)",
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            <div style={{ maxWidth: "780px", marginRight: "auto", marginLeft: 0 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--c-font-mono)",
                  fontWeight: 700,
                  color: "var(--c-text-light)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                03 / LIAISON RÉGULIÈRE · PARIS ↔ ABIDJAN
              </div>

              <h2
                style={{
                  fontFamily: "var(--c-font-display)",
                  fontSize: "clamp(2rem, 4.4vw, 3.1rem)",
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: "-0.035em",
                  color: "var(--c-text-main)",
                  margin: "0 0 16px 0",
                }}
              >
                Liaison aérienne régulière pour vos colis personnels et plis urgents.
              </h2>

              <p
                style={{
                  fontSize: "1.06rem",
                  color: "var(--c-text-muted)",
                  lineHeight: 1.6,
                  margin: "0 0 20px 0",
                }}
              >
                Expédiez rapidement vos valises, effets personnels, produits de beauté ou documents administratifs urgents depuis Paris. Réception directe à notre agence de Bingerville ou livraison à votre porte.
              </p>

              {/* Détails intégrés naturellement sans aucun cadran */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "14px 22px",
                  fontSize: "0.84rem",
                  color: "var(--c-text-light)",
                  marginBottom: "26px",
                  lineHeight: 1.5,
                }}
              >
                <span><strong>Marchandises & valises :</strong> Dès 6 500 FCFA / kg</span>
                <span>•</span>
                <span><strong>Cosmétiques :</strong> Ligne sécurisée</span>
                <span>•</span>
                <span><strong>Plis urgents :</strong> 13 000 FCFA (20 €)</span>
                <span>•</span>
                <span style={{ color: "#166534", fontWeight: 600 }}>Retrait Bingerville ou domicile</span>
              </div>

              <div>
                <Link
                  href="/services?tab=colis"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 24px",
                    borderRadius: "9999px",
                    backgroundColor: "var(--c-text-main)",
                    color: "#FAF5F0",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "transform 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <span>Expédier un Colis</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </article>
        </ScrollReveal>
      </section>

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
