"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, MapPin, Clock, MessageCircle, AlertCircle } from "lucide-react";
import { normalizeTrackingNumber } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function TrackingPage() {
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
        padding: "48px 20px 64px 20px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", width: "100%" }}>
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "9999px",
                backgroundColor: "#F3F4F6",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "12px",
              }}
            >
              Traçabilité en Direct
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 0 12px 0",
              }}
            >
              Suivre mon Colis
            </h1>

            <p style={{ fontSize: "1.02rem", color: "#4B5563", margin: 0, lineHeight: 1.55 }}>
              Entrez le numéro inscrit sur votre bordereau pour savoir exactement où se trouve votre paquet en temps réel.
            </p>
          </div>

          {/* Formulaire de recherche */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: "14px",
              padding: "26px",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.06)",
              marginBottom: "32px",
            }}
          >
            <form onSubmit={handleTrackingSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "0.86rem", fontWeight: 700, color: "#111827" }}>
                Numéro de bordereau d&apos;expédition
              </label>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => {
                    setTrackingInput(e.target.value);
                    if (trackingError) setTrackingError("");
                  }}
                  placeholder="Ex : RM-AIR-2610-K8P9Q2"
                  style={{
                    flex: "1 1 260px",
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
                    padding: "0 24px",
                    fontSize: "0.92rem",
                  }}
                >
                  <Search size={16} />
                  <span>Vérifier le statut</span>
                </button>
              </div>

              {trackingError && (
                <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600, marginTop: "4px" }}>
                  {trackingError}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#6B7280", marginTop: "4px" }}>
                <span>Dossier témoin :</span>
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
                    fontSize: "0.8rem",
                  }}
                >
                  RM-AIR-2610-K8P9Q2
                </button>
              </div>
            </form>
          </div>

          {/* Les 9 étapes de suivi d'une commande ou d'un colis */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#111827", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Les 9 étapes de suivi d&apos;une commande et d&apos;une expédition :
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "10px",
              }}
            >
              {[
                { step: "01", label: "Demande reçue" },
                { step: "02", label: "Devis envoyé" },
                { step: "03", label: "Paiement confirmé" },
                { step: "04", label: "Commande effectuée" },
                { step: "05", label: "Marchandises reçues en Chine" },
                { step: "06", label: "Colis expédié" },
                { step: "07", label: "Colis arrivé à destination" },
                { step: "08", label: "Colis disponible pour retrait" },
                { step: "09", label: "Colis livré" },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.82rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      backgroundColor: "#111827",
                      color: "#FFFFFF",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </span>
                  <span style={{ fontWeight: 700, color: "#374151" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lien WhatsApp pour aide */}
          <div style={{ textAlign: "center" }}>
            <a
              href="https://wa.me/2250153638569?text=Bonjour%20Roum%20Transit,%20je%20ne%20retrouve%20pas%20mon%20num%C3%A9ro%20de%20suivi."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.84rem",
                color: "#4B5563",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              <MessageCircle size={15} />
              <span>Vous n&apos;avez pas votre numéro de colis ? Écrivez-nous sur WhatsApp</span>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

