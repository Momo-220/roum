"use client";

import { useState, useEffect } from "react";
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
  Clock,
  Zap,
} from "lucide-react";
import { normalizeTrackingNumber, getLiveTariffs, findTariff, formatTariffPrice, OfficialTariff } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CircularFlag } from "@/components/CircularFlag";

export default function HomePage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(() => getLiveTariffs());

  useEffect(() => {
    const handleSync = () => setTariffs(getLiveTariffs());
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

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

  // Tarifs dynamiques en direct
  const cnExpress = findTariff(tariffs, "chine", "express");
  const aeExpress = findTariff(tariffs, "émirat", "express") || findTariff(tariffs, "duba", "express");
  const maCi = findTariff(tariffs, "maroc", "côte d'ivoire") || findTariff(tariffs, "maroc", "abidjan");
  const frCi = findTariff(tariffs, "france", "divers");

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "36px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* Hero Section Épurée & Pesante */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
                fontSize: "clamp(2.1rem, 4.6vw, 3.5rem)",
                fontWeight: 800,
                lineHeight: 1.16,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 auto 14px auto",
                maxWidth: "860px",
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
                maxWidth: "680px",
                margin: "0 auto",
                textWrap: "pretty",
              }}
            >
              Nous payons vos fournisseurs sur Alibaba ou transportons vos marchandises par avion et par bateau avec
              <strong> douane entièrement comprise</strong>.
            </p>
          </div>

          {/* Boîte de Suivi Direct au Coeur de la Page */}
          <div
            style={{
              maxWidth: "640px",
              margin: "0 auto 48px auto",
              backgroundColor: "#FAF9F6",
              border: "1px solid #D1D5DB",
              borderRadius: "16px",
              padding: "20px 24px",
              textAlign: "left",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
              Vous attendez un colis ? Suivez son arrivée en direct :
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
                <div style={{ fontSize: "0.8rem", color: "#DC2626", fontWeight: 600, marginTop: "4px" }}>
                  {trackingError}
                </div>
              )}
            </form>
          </div>

          {/* Grille des 5 Services Réels Exactement Synchronisés avec l'Admin */}
          <div style={{ marginBottom: "48px" }}>
            <div style={{ textAlign: "center", marginBottom: "26px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Catalogue Intégral
              </div>
              <h2 style={{ fontSize: "1.55rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                Nos 5 Services Officiels de Transit & Achat
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
                gap: "18px",
              }}
            >
              {/* 1. Commander sur Alibaba */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #111827",
                  borderRadius: "16px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(17, 24, 39, 0.05)",
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
                    Service 01 · Achat Chine
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Commander sur Alibaba
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Nous payons vos fournisseurs en Chine en Yuans (RMB), contrôlons vos articles en magasin et livrons à Abidjan.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Paiement Yuans & Vérification
                  </div>
                </div>

                <Link
                  href="/services?tab=alibaba"
                  className="roum-btn-primary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Lancer une commande</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* 2. Transit & Fret Chine */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "16px",
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
                    <CircularFlag countryCode="CN" size={24} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 02 · Magasins Chine
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Fret & Transit Chine
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Réception dans nos entrepôts de Guangzhou et Yiwu. Voie normale (10 000 F), Express 4j ({formatTariffPrice(cnExpress?.price_per_unit_minor || 1200000)}), Batteries ou Bateau.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Avion 4-5j · Bateau 35j
                  </div>
                </div>

                <Link
                  href="/services?tab=china"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Adresse magasin Chine</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* 3. Transit Dubaï */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "16px",
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
                    <CircularFlag countryCode="AE" size={24} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 03 · Émirats Arabes Unis
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Fret & Transit Dubaï
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Achats à Deira et Al Sabkha : parfums, cosmétiques, bijoux et téléphones. Vol direct DXB ou bateau Jebel Ali.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Dubaï Express 4 jours
                  </div>
                </div>

                <Link
                  href="/services?tab=dubai"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Adresse magasin Dubaï</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* 4. Groupage Maroc (Casablanca) */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "16px",
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
                    <CircularFlag countryCode="MA" size={24} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 04 · N°1 Groupage Maroc
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Groupage Maroc Express
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Casablanca vers Abidjan, Bamako, Dakar, Ouagadougou et Libreville. Vol direct garanti 5 jours chrono.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534", backgroundColor: "#DCFCE7", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Dès {formatTariffPrice(maCi?.price_per_unit_minor || 650000)} / kg · 5 jours
                  </div>
                </div>

                <Link
                  href="/services?tab=morocco"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Dépôt Casablanca</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* 5. Groupage France (Paris ↔ Abidjan) */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "16px",
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
                    <CircularFlag countryCode="FR" size={24} />
                  </div>

                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 05 · Paris ↔ Abidjan
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 8px 0" }}>
                    Liaison France & Côte d&apos;Ivoire
                  </h3>

                  <p style={{ fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    Ligne bilatérale dans les deux sens : colis personnels, cosmétiques et plis administratifs urgents en 3 à 5 jours.
                  </p>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", backgroundColor: "#F3F4F6", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "18px" }}>
                    Dès {formatTariffPrice(frCi?.price_per_unit_minor || 850000)} / 12 € le kg
                  </div>
                </div>

                <Link
                  href="/services?tab=france"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem", padding: "10px 14px", justifyContent: "center" }}
                >
                  <span>Expédier Paris ↔ Abidjan</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Bandeau Transparence Finale */}
          <div
            style={{
              padding: "28px 24px",
              backgroundColor: "#FAF9F6",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "18px",
            }}
          >
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                Besoin d&apos;une estimation de prix ou d&apos;un conseil immédiat ?
              </div>
              <div style={{ fontSize: "0.88rem", color: "#4B5563" }}>
                Nos équipes à Abidjan Bingerville et sur WhatsApp répondent à toutes vos questions 7j/7.
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/tariffs"
                className="roum-btn-primary"
                style={{ fontSize: "0.88rem", padding: "10px 18px" }}
              >
                <span>Calculer mon tarif</span>
                <ArrowRight size={14} />
              </Link>
              <a
                href="https://wa.me/2250153638569"
                target="_blank"
                rel="noopener noreferrer"
                className="roum-btn-secondary"
                style={{ fontSize: "0.88rem", padding: "10px 18px" }}
              >
                <span>WhatsApp Direct</span>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
