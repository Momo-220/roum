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

          {/* Les 3 étapes de traçabilité */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div style={{ padding: "16px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
              <strong style={{ fontSize: "0.9rem", color: "#111827", display: "block", marginBottom: "4px" }}>
                1. Reçu au magasin
              </strong>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: 0 }}>
                Votre colis est réceptionné, pesé et étiqueté.
              </p>
            </div>

            <div style={{ padding: "16px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
              <strong style={{ fontSize: "0.9rem", color: "#111827", display: "block", marginBottom: "4px" }}>
                2. En transit
              </strong>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: 0 }}>
                Le colis voyage en avion (4-5j) ou par bateau (35-45j).
              </p>
            </div>

            <div style={{ padding: "16px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
              <strong style={{ fontSize: "0.9rem", color: "#111827", display: "block", marginBottom: "4px" }}>
                3. Disponible à Abidjan
              </strong>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: 0 }}>
                Vous venez le retirer à notre agence de Bingerville.
              </p>
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
