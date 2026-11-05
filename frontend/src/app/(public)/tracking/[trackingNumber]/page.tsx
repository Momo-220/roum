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
  MessageCircle,
  Download,
  Printer,
} from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import {
  RoumReceiptData,
  downloadOfficialReceiptPdf,
  printOfficialReceipt,
  buildClientReceiptWhatsAppUrl,
} from "@/utils/receiptPdf";

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

    function findInLocalStorage(num: string): TrackingData | null {
      if (typeof window === "undefined") return null;
      const clean = decodeURIComponent(num).trim().toUpperCase();
      try {
        const shipsStr = localStorage.getItem("roum_shipments_data");
        if (shipsStr) {
          const ships = JSON.parse(shipsStr);
          const foundShip = Array.isArray(ships)
            ? ships.find(
                (s: any) =>
                  String(s.tracking_number || "").toUpperCase() === clean ||
                  String(s.reference || "").toUpperCase() === clean
              )
            : null;
          if (foundShip) {
            return {
              tracking_number: foundShip.tracking_number || clean,
              status: {
                code: foundShip.current_status || foundShip.current_status_code || "RECEIVED_AT_HUB",
                label:
                  foundShip.current_status_label ||
                  foundShip.status_label ||
                  "Paiement confirmé · Colis pris en charge à l'entrepôt",
                description:
                  foundShip.description ||
                  foundShip.product_name ||
                  "Expédition enregistrée et suivie par ROUM TRANSIT.",
              },
              route: {
                origin: foundShip.origin_country || "Chine",
                destination: foundShip.destination_country || "Côte d'Ivoire",
              },
              shipping_mode: foundShip.shipping_mode_name || "Voie Aérienne Express",
              summary: {
                total_parcels: Number(foundShip.parcel_count || foundShip.total_parcels_count || 1),
                total_weight_kg: Number(foundShip.total_weight_kg || 2),
                total_volume_cbm: Number(foundShip.total_volume_cbm || 0),
                created_at: foundShip.created_at || new Date().toISOString().substring(0, 10),
                updated_at: new Date().toISOString().substring(0, 10),
              },
              parcels:
                Array.isArray(foundShip.parcels) && foundShip.parcels.length > 0
                  ? foundShip.parcels.map((p: any, idx: number) => ({
                      parcel_index: idx + 1,
                      package_label: p.package_label || foundShip.product_name || `Colis #${idx + 1}`,
                      weight_kg: Number(p.weight_kg || foundShip.total_weight_kg || 2),
                      volume_cbm: Number(p.volume_cbm || foundShip.total_volume_cbm || 0),
                      description: p.description || foundShip.product_name || null,
                    }))
                  : [
                      {
                        parcel_index: 1,
                        package_label: foundShip.product_name || `Dossier ${foundShip.reference || clean}`,
                        weight_kg: Number(foundShip.total_weight_kg || 2),
                        volume_cbm: Number(foundShip.total_volume_cbm || 0),
                        description: foundShip.description || foundShip.product_name || null,
                      },
                    ],
              timeline: [
                {
                  status: foundShip.current_status || "RECEIVED_AT_HUB",
                  status_label:
                    foundShip.current_status_label ||
                    "Paiement confirmé · Prise en charge à l'entrepôt de départ",
                  location: `Entrepôt ${foundShip.origin_city || "Guangzhou"} (${foundShip.origin_country || "Chine"})`,
                  comment: `Client : ${foundShip.client_name || "Client ROUM"} · Destination : ${foundShip.destination_country || "Afrique"}`,
                  event_timestamp: foundShip.created_at || new Date().toLocaleDateString("fr-FR"),
                },
              ],
              whatsapp_support_url: `https://wa.me/2250787994412?text=${encodeURIComponent(`Bonjour ROUM TRANSIT, je souhaite avoir des informations sur mon suivi N° ${foundShip.tracking_number || clean}`)}`,
            };
          }
        }

        const reqsStr = localStorage.getItem("roum_requests_data");
        if (reqsStr) {
          const reqs = JSON.parse(reqsStr);
          const foundReq = Array.isArray(reqs)
            ? reqs.find(
                (r: any) =>
                  String(r.tracking_number || "").toUpperCase() === clean ||
                  String(r.reference || "").toUpperCase() === clean
              )
            : null;
          if (foundReq) {
            return {
              tracking_number: foundReq.tracking_number || foundReq.reference || clean,
              status: {
                code: foundReq.status === "CONVERTED" ? "IN_TRANSIT" : "RECEIVED_AT_HUB",
                label:
                  foundReq.status === "CONVERTED"
                    ? "Paiement confirmé · Colis en préparation d'expédition"
                    : "Dossier enregistré chez ROUM TRANSIT",
                description: foundReq.product_name || foundReq.description || "Dossier client ROUM TRANSIT",
              },
              route: {
                origin: foundReq.origin_country || "Chine",
                destination: foundReq.destination_country || "Côte d'Ivoire",
              },
              shipping_mode: foundReq.shipping_mode_name || "Voie Aérienne",
              summary: {
                total_parcels: 1,
                total_weight_kg: Number(foundReq.estimated_weight_kg || 1),
                total_volume_cbm: Number(foundReq.estimated_cbm || 0),
                created_at: foundReq.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                updated_at: new Date().toISOString().substring(0, 10),
              },
              parcels: [
                {
                  parcel_index: 1,
                  package_label: foundReq.product_name || `Dossier ${foundReq.reference}`,
                  weight_kg: Number(foundReq.estimated_weight_kg || 1),
                  volume_cbm: Number(foundReq.estimated_cbm || 0),
                  description: foundReq.description || foundReq.product_name || null,
                },
              ],
              timeline: [
                {
                  status: "RECEIVED_AT_HUB",
                  status_label:
                    foundReq.status === "CONVERTED"
                      ? "Encaissement confirmé & Numéro de suivi officiel attribué"
                      : "Demande enregistrée par ROUM TRANSIT",
                  location: `Entrepôt ${foundReq.origin_country || "Chine"}`,
                  comment: `Article : ${foundReq.product_name || "Marchandise"} · Client : ${foundReq.client_name || ""}`,
                  event_timestamp: foundReq.created_at?.substring(0, 16) || new Date().toLocaleDateString("fr-FR"),
                },
              ],
              whatsapp_support_url: `https://wa.me/2250787994412?text=${encodeURIComponent(`Bonjour ROUM TRANSIT, je consulte mon dossier N° ${foundReq.tracking_number || foundReq.reference || clean}`)}`,
            };
          }
        }
      } catch {}
      return null;
    }

    async function fetchTracking() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/public/tracking/${trackingNumber}`);
        if (!res.ok) {
          const localFallback = findInLocalStorage(trackingNumber);
          if (localFallback) {
            setData(localFallback);
            setLoading(false);
            return;
          }
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Colis introuvable.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        const localFallback = findInLocalStorage(trackingNumber);
        if (localFallback) {
          setData(localFallback);
        } else {
          setError(err.message || "Erreur de connexion au serveur.");
        }
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
        return "badge-delivered";
      case "IN_TRANSIT":
      case "PACKED_READY":
        return "badge-transit";
      case "RECEIVED_AT_HUB":
      case "READY_FOR_PICKUP":
      case "ARRIVED_DESTINATION":
        return "badge-draft";
      case "INCIDENT":
      case "CUSTOMS_HOLD":
        return "badge-incident";
      default:
        return "badge-draft";
    }
  };

  return (
    <div style={{ padding: "24px 16px 110px 16px" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Navigation retour */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-secondary)",
            fontSize: "0.88rem",
            fontWeight: "500",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        {loading && (
          <div
            className="card-clean"
            style={{ padding: "60px", textAlign: "center" }}
          >
            <RefreshCw
              size={32}
              className="spin"
              style={{ color: "var(--brown-dark)", margin: "0 auto 16px auto" }}
            />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Recherche du dossier logistique en cours...
            </p>
          </div>
        )}

        {error && (
          <div
            className="card-clean"
            style={{
              padding: "48px 32px",
              textAlign: "center",
              borderColor: "var(--state-danger-border)",
            }}
          >
            <AlertCircle size={40} color="var(--state-danger-text)" style={{ margin: "0 auto 14px auto" }} />
            <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "var(--text-main)" }}>
              Numéro Introuvable
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px", maxWidth: "460px", margin: "0 auto 20px auto", fontSize: "0.9rem" }}>
              {error}
            </p>
            <Link href="/#tracking" className="btn btn-secondary">
              Vérifier le numéro et réessayer
            </Link>
          </div>
        )}

        {data && (
          <div style={{ display: "grid", gap: "20px" }}>
            {/* 1. Carte En-tête : Référence & Statut Global */}
            <div className="card-clean" style={{ padding: "28px" }}>
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
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
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
                    <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)", color: "var(--text-main)" }}>
                      {data.tracking_number}
                    </h1>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn btn-secondary"
                      style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                      title="Copier la référence"
                    >
                      {copied ? (
                        <>
                          <Check size={14} color="var(--state-success-text)" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className={`badge-clean ${getStatusBadgeClass(data.status.code)}`} style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                  {data.status.label}
                </div>
              </div>

              {/* Trajet & Caractéristiques */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  padding: "16px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>Itinéraire</div>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <CircularFlag countryName={data.route.origin} size={15} />
                    <span>{data.route.origin}</span>
                    <span style={{ color: "var(--brown-light)", fontSize: "0.75rem" }}>→</span>
                    <CircularFlag countryName={data.route.destination} size={15} />
                    <span>{data.route.destination}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mode</div>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.95rem" }}>
                    {data.shipping_mode?.includes("Maritime") || data.shipping_mode === "SEA" ? "Voie Maritime" : (data.shipping_mode || "Voie Aérienne")}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nombre de Colis</div>
                  <div style={{ fontWeight: "700", color: "var(--brown-dark)", fontSize: "1.1rem" }}>
                    {data.summary.total_parcels}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Poids Total</div>
                  <div style={{ fontWeight: "700", color: "var(--brown-dark)", fontSize: "1.1rem" }}>
                    {data.summary.total_weight_kg} kg
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Volume Total</div>
                  <div style={{ fontWeight: "700", color: "var(--brown-dark)", fontSize: "1.1rem" }}>
                    {data.summary.total_volume_cbm > 0 ? `${data.summary.total_volume_cbm} m³` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Timeline d'acheminement (Historique des étapes) */}
            <div className="card-clean" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)" }}>
                <Clock size={18} color="var(--brown-dark)" />
                Historique d&apos;Acheminement
              </h3>

              {data.timeline.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
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
                      background: "var(--border-light)",
                    }}
                  />

                  {data.timeline.map((step, idx) => {
                    const isLatest = idx === data.timeline.length - 1;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          marginBottom: idx === data.timeline.length - 1 ? 0 : "24px",
                        }}
                      >
                        {/* Point sur la ligne */}
                        <div
                          style={{
                            position: "absolute",
                            left: "-24px",
                            top: "4px",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: isLatest ? "var(--brown-dark)" : "#FFFFFF",
                            border: `3px solid ${isLatest ? "var(--bg-app)" : "var(--border-light)"}`,
                          }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                          <strong style={{ color: isLatest ? "var(--brown-dark)" : "var(--text-main)", fontSize: "0.95rem" }}>
                            {step.status_label}
                          </strong>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
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
                            gap: "5px",
                            fontSize: "0.82rem",
                            color: "var(--brown-light)",
                            marginTop: "2px",
                          }}
                        >
                          <MapPin size={13} />
                          {step.location}
                        </div>

                        {step.comment && (
                          <div
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text-secondary)",
                              marginTop: "4px",
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
              <div className="card-clean" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "1.15rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)" }}>
                  <Package size={18} color="var(--brown-dark)" />
                  Contenu détaillé ({data.parcels.length} colis)
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)" }}>
                        <th style={{ padding: "10px 8px" }}>#</th>
                        <th style={{ padding: "10px 8px" }}>Étiquette / Description</th>
                        <th style={{ padding: "10px 8px" }}>Poids</th>
                        <th style={{ padding: "10px 8px" }}>Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.parcels.map((p) => (
                        <tr key={p.parcel_index} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "12px 8px", color: "var(--brown-dark)", fontWeight: "700" }}>
                            {p.parcel_index}
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ fontWeight: "600", color: "var(--text-main)" }}>
                              {p.package_label}
                            </div>
                            {p.description && (
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                {p.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: "600" }}>
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

            {/* 4. Reçu PDF de Suivi & Contact WhatsApp contextualisé */}
            {(() => {
              const trackingReceipt: RoumReceiptData = {
                receiptTitle: "FICHE OFFICIELLE DE SUIVI D'EXPÉDITION",
                reference: data.tracking_number,
                trackingNumber: data.tracking_number,
                date: new Date().toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                clientName: "Expéditeur / Destinataire ROUM TRANSIT",
                clientPhone: "Suivi en ligne vérifié",
                origin: data.route.origin || "Chine",
                destination: data.route.destination || "Afrique",
                optionType: "suivi_colis",
                transportMode: `${data.shipping_mode} — Statut : ${data.status.label}`,
                weightOrVolume:
                  data.summary.total_volume_cbm > 0
                    ? `${data.summary.total_volume_cbm} m³ (${data.summary.total_parcels} colis)`
                    : `${data.summary.total_weight_kg} kg (${data.summary.total_parcels} colis)`,
                productTitle:
                  data.parcels?.[0]?.description ||
                  data.parcels?.[0]?.package_label ||
                  `Lot de ${data.summary.total_parcels} colis (${data.status.label})`,
                grandTotalFcfa: 0,
              };
              const waUrl = buildClientReceiptWhatsAppUrl(trackingReceipt);

              return (
                <div
                  className="card-clean"
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: "1.05rem", marginBottom: "4px", color: "var(--text-main)" }}>
                        Fiche de Suivi PDF &amp; Assistance Directe
                      </h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        Téléchargez ou imprimez votre fiche de suivi officielle ({data.tracking_number}), ou envoyez-la sur WhatsApp à l&apos;agence.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => downloadOfficialReceiptPdf(trackingReceipt)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "9999px",
                        border: "1.5px solid #F59E0B",
                        background: "#FFFBEB",
                        color: "#92400E",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <Download size={16} />
                      <span>Télécharger la Fiche PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printOfficialReceipt(trackingReceipt)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "9999px",
                        border: "1.5px solid #D1D5DB",
                        background: "#FFFFFF",
                        color: "#111827",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <Printer size={16} />
                      <span>Imprimer la Fiche (A4)</span>
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-whatsapp"
                      style={{
                        padding: "10px 20px",
                        borderRadius: "9999px",
                        fontSize: "0.86rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>Envoyer ce reçu par WhatsApp à l&apos;agence</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
