"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  Phone,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

interface TrackingData {
  tracking_number: string;
  status: {
    code: string;
    label: string;
    description: string;
  };
  route: {
    origin: string;
    destination: string;
  };
  shipping_mode: string;
  summary: {
    total_parcels: number;
    total_weight_kg: number;
    total_volume_cbm: number;
    created_at: string;
    updated_at: string;
  };
  parcels: Array<{
    parcel_index: number;
    package_label: string;
    weight_kg: number;
    volume_cbm: number;
    description: string | null;
  }>;
  timeline: Array<{
    status: string;
    status_label: string;
    location: string;
    comment: string | null;
    event_timestamp: string;
  }>;
  whatsapp_support_url: string;
}

export default function TrackingResultPage() {
  const params = useParams();
  const trackingNumber = params?.trackingNumber as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!trackingNumber) return;

    async function fetchTracking() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/public/tracking/${trackingNumber}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Colis introuvable.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Erreur de connexion au serveur.");
      } finally {
        setLoading(false);
      }
    }

    fetchTracking();
  }, [trackingNumber]);

  const handleCopy = () => {
    if (data?.tracking_number) {
      navigator.clipboard.writeText(data.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadgeClass = (code: string) => {
    switch (code) {
      case "DELIVERED":
        return "status-delivered";
      case "IN_TRANSIT":
      case "PACKED_READY":
        return "status-transit";
      case "RECEIVED_AT_HUB":
      case "READY_FOR_PICKUP":
      case "ARRIVED_DESTINATION":
        return "status-hub";
      case "INCIDENT":
      case "CUSTOMS_HOLD":
        return "status-incident";
      default:
        return "status-draft";
    }
  };

  return (
    <div style={{ padding: "40px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Navigation retour */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        {loading && (
          <div
            className="glass-card"
            style={{ padding: "60px", textAlign: "center" }}
          >
            <RefreshCw
              size={36}
              className="pulse-glow"
              style={{ animation: "spin 1.5s linear infinite", color: "var(--gold)", margin: "0 auto 16px auto" }}
            />
            <p style={{ color: "var(--text-muted)" }}>Recherche du colis en cours...</p>
          </div>
        )}

        {error && (
          <div
            className="glass-card"
            style={{
              padding: "48px 32px",
              textAlign: "center",
              borderColor: "rgba(244, 63, 94, 0.4)",
            }}
          >
            <AlertCircle size={44} color="var(--rose)" style={{ margin: "0 auto 16px auto" }} />
            <h2 style={{ fontSize: "1.6rem", marginBottom: "8px" }}>Numéro Introuvable</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px", maxWidth: "480px", margin: "0 auto 24px auto" }}>
              {error}
            </p>
            <Link href="/#tracking" className="btn btn-secondary">
              Vérifier le numéro et réessayer
            </Link>
          </div>
        )}

        {data && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* 1. Carte En-tête : Référence & Statut Global */}
            <div className="glass-card" style={{ padding: "32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Dossier d&apos;expédition
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", color: "var(--text-main)" }}>
                      {data.tracking_number}
                    </h1>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                      title="Copier le numéro"
                    >
                      {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className={`status-badge ${getStatusBadgeClass(data.status.code)}`}>
                  {data.status.label}
                </div>
              </div>

              {/* Trajet & Mode */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  padding: "20px",
                  background: "rgba(7, 12, 24, 0.6)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Origine</div>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "1.05rem" }}>
                    {data.route.origin}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Destination</div>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "1.05rem" }}>
                    {data.route.destination}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Mode de Transport</div>
                  <div style={{ fontWeight: "600", color: "var(--caramel)", fontSize: "0.95rem" }}>
                    {data.shipping_mode}
                  </div>
                </div>
              </div>

              {/* Métriques Clés */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  marginTop: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Nombre de Colis</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-main)" }}>
                    {data.summary.total_parcels}
                  </div>
                </div>

                <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Poids Total</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--caramel)" }}>
                    {data.summary.total_weight_kg} kg
                  </div>
                </div>

                <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Volume Estimé</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--gold)" }}>
                    {data.summary.total_volume_cbm > 0 ? `${data.summary.total_volume_cbm} m³` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Timeline d'acheminement (Historique des étapes) */}
            <div className="glass-card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={20} color="var(--gold)" />
                Historique d&apos;Acheminement
              </h3>

              {data.timeline.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  En attente des premières étapes logistiques.
                </p>
              ) : (
                <div style={{ position: "relative", paddingLeft: "24px" }}>
                  {/* Ligne verticale de liaison */}
                  <div
                    style={{
                      position: "absolute",
                      left: "7px",
                      top: "8px",
                      bottom: "8px",
                      width: "2px",
                      background: "rgba(255, 255, 255, 0.1)",
                    }}
                  />

                  {data.timeline.map((step, idx) => {
                    const isLatest = idx === data.timeline.length - 1;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          marginBottom: idx === data.timeline.length - 1 ? 0 : "28px",
                        }}
                      >
                        {/* Point sur la ligne */}
                        <div
                          style={{
                            position: "absolute",
                            left: "-24px",
                            top: "3px",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: isLatest ? "var(--gold)" : "var(--bg-secondary)",
                            border: `3px solid ${isLatest ? "var(--bg-primary)" : "rgba(255, 255, 255, 0.3)"}`,
                            boxShadow: isLatest ? "0 0 12px var(--gold)" : "none",
                          }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                          <strong style={{ color: isLatest ? "var(--gold)" : "var(--text-main)", fontSize: "1rem" }}>
                            {step.status_label}
                          </strong>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                            {new Date(step.event_timestamp).toLocaleString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.85rem",
                            color: "var(--caramel)",
                            marginTop: "2px",
                          }}
                        >
                          <MapPin size={14} />
                          {step.location}
                        </div>

                        {step.comment && (
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                              marginTop: "6px",
                              fontStyle: "italic",
                            }}
                          >
                            « {step.comment} »
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Détail des Colis */}
            {data.parcels.length > 0 && (
              <div className="glass-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Package size={20} color="var(--caramel)" />
                  Contenu détaillé ({data.parcels.length} colis)
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                        <th style={{ padding: "10px 8px" }}>#</th>
                        <th style={{ padding: "10px 8px" }}>Étiquette / Description</th>
                        <th style={{ padding: "10px 8px" }}>Poids</th>
                        <th style={{ padding: "10px 8px" }}>Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.parcels.map((p) => (
                        <tr key={p.parcel_index} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <td style={{ padding: "12px 8px", color: "var(--gold)", fontWeight: "700" }}>
                            {p.parcel_index}
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ fontWeight: "600", color: "var(--text-main)" }}>
                              {p.package_label}
                            </div>
                            {p.description && (
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {p.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 8px", color: "var(--caramel)", fontWeight: "600" }}>
                            {p.weight_kg} kg
                          </td>
                          <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>
                            {p.volume_cbm > 0 ? `${p.volume_cbm} m³` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Contact WhatsApp contextualisé */}
            <div
              className="glass-card"
              style={{
                padding: "28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                border: "1px solid rgba(37, 211, 102, 0.3)",
              }}
            >
              <div>
                <h4 style={{ fontSize: "1.15rem", marginBottom: "6px" }}>
                  Une question sur ce colis ?
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Votre message arrivera pré-rempli avec votre référence ({data.tracking_number}).
                </p>
              </div>

              <a
                href={data.whatsapp_support_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ padding: "12px 24px" }}
              >
                <Phone size={18} />
                Échanger avec un conseiller
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
