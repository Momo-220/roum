"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  Search,
  Plane,
  Ship,
  ArrowRight,
  ShieldCheck,
  Scale,
  MapPin,
  Clock,
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
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* Section Hero */}
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
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
                marginBottom: "16px",
              }}
            >
              Transitaire & Centrale d&apos;Achat International
            </div>

            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.14,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 auto 18px auto",
                maxWidth: "880px",
                textWrap: "balance",
              }}
            >
              Vos commandes et marchandises de Chine, Dubaï, Maroc et France acheminées en toute sécurité.
            </h1>

            <p
              style={{
                fontSize: "clamp(1.02rem, 1.6vw, 1.18rem)",
                lineHeight: 1.6,
                color: "#4B5563",
                maxWidth: "700px",
                margin: "0 auto",
                textWrap: "pretty",
              }}
            >
              ROUM TRANSIT vous accompagne dans vos achats sur Alibaba ou prend en charge vos colis chez vos fournisseurs pour les transporter par avion ou par bateau avec dédouanement tout compris.
            </p>
          </div>

          {/* Les 3 Grands Services de ROUM TRANSIT */}
          <div style={{ marginBottom: "56px" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
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
                Comment pouvons-nous vous aider ?
              </div>
              <h2
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                Choisissez votre service ROUM TRANSIT
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Service 1 : Commander sur Alibaba */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #111827",
                  borderRadius: "16px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 8px 24px -4px rgba(17, 24, 39, 0.08)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <ShoppingBag size={24} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 01 · Achat & Fret
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                    Je souhaite commander sur Alibaba
                  </h3>

                  <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Vous souhaitez acheter des marchandises sur Alibaba mais avez besoin d&apos;accompagnement pour payer votre fournisseur en Yuans (RMB) et organiser le transport jusqu&apos;à votre porte.
                  </p>

                  <div style={{ fontSize: "0.82rem", color: "#374151", backgroundColor: "#F9FAFB", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E5E7EB", marginBottom: "22px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px", color: "#111827" }}>Ce service comprend :</div>
                    <div>Recherche produit, négociation, paiement fournisseur, transport et suivi.</div>
                  </div>
                </div>

                <Link
                  href="/services?tab=alibaba"
                  className="roum-btn-primary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.9rem", padding: "12px 18px", justifyContent: "center" }}
                >
                  <span>Lancer ma commande Alibaba</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Service 2 : J'ai déjà mon fournisseur */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "16px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <Truck size={24} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 02 · Transitaire Pur
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                    J&apos;ai déjà mon fournisseur, je recherche un transitaire
                  </h3>

                  <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Vous avez déjà trouvé votre fournisseur ou acheté vos colis. Obtenez immédiatement l&apos;adresse de notre entrepôt en Chine pour faire livrer vos marchandises.
                  </p>

                  <div style={{ fontSize: "0.82rem", color: "#374151", backgroundColor: "#F9FAFB", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E5E7EB", marginBottom: "22px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px", color: "#111827" }}>Ce service comprend :</div>
                    <div>Adresse entrepôt Chine, identification colis, pesée certifiée et transport.</div>
                  </div>
                </div>

                <Link
                  href="/services?tab=forwarding"
                  className="roum-btn-secondary"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.9rem", padding: "12px 18px", justifyContent: "center" }}
                >
                  <span>Obtenir l&apos;adresse entrepôt</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Service 3 : Suivre une commande ou un colis */}
              <div
                style={{
                  backgroundColor: "#FAF9F6",
                  border: "1px solid #D1D5DB",
                  borderRadius: "16px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <Search size={24} color="#FFFFFF" strokeWidth={2.2} />
                  </div>

                  <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Service 03 · Traçabilité
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                    Suivre une commande ou un colis
                  </h3>

                  <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                    Consultez l&apos;état d&apos;avancement de vos marchandises en temps réel sans devoir contacter systématiquement le service commercial.
                  </p>

                  <form onSubmit={handleTrackingSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => {
                        setTrackingInput(e.target.value);
                        if (trackingError) setTrackingError("");
                      }}
                      placeholder="Ex : RM-AIR-2610-K8P9Q2"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
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

                    {trackingError && (
                      <div style={{ fontSize: "0.8rem", color: "#DC2626", fontWeight: 600 }}>
                        {trackingError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="roum-btn-primary"
                      style={{ width: "100%", boxSizing: "border-box", fontSize: "0.88rem", padding: "10px 16px", justifyContent: "center" }}
                    >
                      <Search size={15} />
                      <span>Retrouver mon colis</span>
                    </button>
                  </form>
                </div>

                <div style={{ fontSize: "0.78rem", color: "#6B7280", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Test rapide :</span>
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
              </div>
            </div>
          </div>

          {/* Les Moyens de Transport : Aérien & Maritime */}
          <div style={{ marginBottom: "56px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Modes d&apos;expédition
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                Deux modes de transport adaptés à vos besoins
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "14px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plane size={20} color="#FFFFFF" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Transport Aérien (Avion)
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#4B5563" }}>Délai : 4 à 5 jours</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                  Pour l&apos;expédition rapide des marchandises par avion. Facturation au poids (kg) avec douane comprise.
                </p>
                <Link href="/tariffs" style={{ fontSize: "0.84rem", fontWeight: 700, color: "#111827", textDecoration: "underline" }}>
                  Calculer le tarif aérien &rarr;
                </Link>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "14px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ship size={20} color="#FFFFFF" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                      Transport Maritime (Bateau)
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#4B5563" }}>Délai : 35 à 45 jours</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.88rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                  Pour l&apos;expédition économique des gros volumes et conteneurs. Facturation au mètre cube (CBM).
                </p>
                <Link href="/tariffs" style={{ fontSize: "0.84rem", fontWeight: 700, color: "#111827", textDecoration: "underline" }}>
                  Calculer le volume CBM &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Les Destinations Desservies */}
          <div
            style={{
              backgroundColor: "#FAF9F6",
              border: "1px solid #E5E7EB",
              borderRadius: "16px",
              padding: "32px 26px",
              marginBottom: "48px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Lignes Opérationnelles
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                Les destinations desservies mentionnées dans le projet
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "18px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                  Départ Chine
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
                  Côte d&apos;Ivoire, Niger, Sénégal et Mali
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "18px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                  Départ Côte d&apos;Ivoire
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
                  France, Maroc, Gabon, Sénégal et Mali
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "18px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                  Départ Maroc
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
                  Côte d&apos;Ivoire
                </div>
              </div>
            </div>
          </div>

          {/* Garanties */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "32px",
              flexWrap: "wrap",
              fontSize: "0.85rem",
              color: "#4B5563",
              fontWeight: 600,
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
