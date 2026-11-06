"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/shared/api";
import { useLiveSync } from "@/shared/useLiveSync";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Copy,
  Download,
  MapPin,
  Printer,
  RefreshCw,
} from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CircularFlag } from "@/components/CircularFlag";
import { ShippingBox3D } from "@/components/ShippingBox3D";
import { TrackingJourney } from "@/components/TrackingJourney";
import { TrackingProof, type TrackingPhoto, type TrackingReception } from "@/components/TrackingProof";
import { RoumReceiptData, downloadOfficialReceiptPdf, printOfficialReceipt } from "@/utils/receiptPdf";

/** Place chaque statut sur les quatre grandes étapes du trajet. */
function stageOf(code: string): number {
  if (code === "DELIVERED") return 3;
  if (["ARRIVED_DESTINATION", "CUSTOMS_HOLD", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(code)) return 2;
  if (["IN_TRANSIT", "INCIDENT"].includes(code)) return 1;
  return 0;
}

/** Les dates de la base sont en UTC, au format « AAAA-MM-JJ HH:MM:SS ». */
function formatEventDate(value: string): string {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

interface TrackingData {
  tracking_number: string;
  status: {
    code: string;
    label: string;
    description: string;
  };
  payment?: {
    status: string;
    label: string;
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
  photos?: TrackingPhoto[];
  reception?: TrackingReception | null;
  whatsapp_support_url: string;
}

export default function TrackingResultPage() {
  const params = useParams();
  const trackingNumber = params?.trackingNumber as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [data, setData] = useState<TrackingData | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTracking = useCallback(
    async (silent: boolean): Promise<boolean> => {
      if (!trackingNumber) return true;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const json = await apiRequest<any>(`/api/v1/public/tracking/${encodeURIComponent(trackingNumber)}`);
        if (json.redirect_tracking_number) {
          router.replace(`/tracking/${encodeURIComponent(json.redirect_tracking_number)}`);
          return true;
        }
        setData(json);
        setError(null);
        return true;
      } catch (err: any) {
        // Une coupure laisse à l'écran les dernières données confirmées ; un colis supprimé disparaît.
        if (!silent || err?.status === 404) {
          setData(null);
          setError(err.message || "Erreur de connexion au serveur.");
        }
        return false;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [trackingNumber, router],
  );

  useEffect(() => {
    void loadTracking(false);
  }, [loadTracking]);

  // Tout changement côté admin apparaît ici sans recharger la page.
  useLiveSync({
    endpoint: "/api/v1/public/sync",
    scopes: ["shipments", "requests"],
    enabled: Boolean(trackingNumber),
    onChange: () => loadTracking(true),
  });

  const handleCopy = () => {
    if (data?.tracking_number) {
      navigator.clipboard.writeText(data.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCancelled = data?.status.code === "CANCELLED";
  const stage = data ? stageOf(data.status.code) : 0;
  const isSea = /maritime|bateau|sea/i.test(data?.shipping_mode || "");
  const timeline = data ? [...data.timeline].reverse() : [];

  const receipt: RoumReceiptData | null = data
    ? {
        reference: data.tracking_number,
        trackingNumber: data.tracking_number,
        date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
        clientName: "",
        clientPhone: "",
        origin: data.route.origin || "Chine",
        destination: data.route.destination || "Afrique",
        optionType: "suivi_colis",
        transportMode: data.shipping_mode,
        weightOrVolume:
          data.summary.total_volume_cbm > 0
            ? `${data.summary.total_volume_cbm} m³ · ${data.summary.total_parcels} colis`
            : `${data.summary.total_weight_kg} kg · ${data.summary.total_parcels} colis`,
        productTitle: data.parcels[0]?.description || data.parcels[0]?.package_label || "Marchandises",
        quantity: data.summary.total_parcels,
        paymentMethodLabel: data.payment?.label,
        paymentStatusLabel: data.status.label,
        supportPhone: `+${data.whatsapp_support_url.match(/wa\.me\/(\d+)/)?.[1] || "2250153638569"}`,
        grandTotalFcfa: 0,
      }
    : null;

  return (
    <div className="tk-root">
      <div className="tk-container">
        <Link href="/tracking" className="tk-back">
          <ArrowLeft size={16} />
          <span>Suivre un autre colis</span>
        </Link>

        {loading && (
          <div className="tk-state">
            <RefreshCw size={28} className="spin" />
            <p>Recherche de votre colis…</p>
          </div>
        )}

        {error && (
          <div className="tk-state">
            <AlertCircle size={32} />
            <h1>Colis introuvable</h1>
            <p>{error}</p>
            <Link href="/tracking" className="tk-cta">
              Vérifier le numéro
            </Link>
          </div>
        )}

        {data && receipt && (
          <>
            <section className="tk-hero">
              <div className="tk-hero-text">
                <span className="tk-eyebrow">Votre colis</span>
                <h1 className="tk-status">{data.status.label}</h1>
                {data.status.description && <p className="tk-status-desc">{data.status.description}</p>}

                <button type="button" className="tk-code" onClick={handleCopy} title="Copier le numéro">
                  <span>{data.tracking_number}</span>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <span className="tk-copy-hint">{copied ? "Numéro copié" : "Touchez pour copier"}</span>

                {data.payment && (
                  <span className={`tk-payment ${data.payment.status === "PAID" ? "paid" : ""}`}>
                    {data.payment.label}
                  </span>
                )}
              </div>

              <ShippingBox3D code={data.tracking_number} className="tk-box" />
            </section>

            <section className="tk-route" aria-label="Trajet">
              <div className="tk-route-ends">
                <span>
                  <CircularFlag countryName={data.route.origin} size={20} />
                  {data.route.origin}
                </span>
                <span>
                  {data.route.destination}
                  <CircularFlag countryName={data.route.destination} size={20} />
                </span>
              </div>

              {!isCancelled && <TrackingJourney stage={stage} isSea={isSea} />}
            </section>

            <dl className="tk-facts">
              <div>
                <dt>Transport</dt>
                <dd>{data.shipping_mode}</dd>
              </div>
              <div>
                <dt>Colis</dt>
                <dd>{data.summary.total_parcels}</dd>
              </div>
              <div>
                <dt>Poids</dt>
                <dd>{data.summary.total_weight_kg > 0 ? `${data.summary.total_weight_kg} kg` : "À peser"}</dd>
              </div>
              {data.summary.total_volume_cbm > 0 && (
                <div>
                  <dt>Volume</dt>
                  <dd>{data.summary.total_volume_cbm} m³</dd>
                </div>
              )}
            </dl>

            <TrackingProof
              photos={data.photos ?? []}
              reception={data.reception ?? null}
              formatDate={formatEventDate}
            />

            {timeline.length > 0 && (
              <section className="tk-section">
                <h2>Historique</h2>
                <ol className="tk-timeline">
                  {timeline.map((step, index) => (
                    <li key={`${step.event_timestamp}-${index}`} className={index === 0 ? "latest" : ""}>
                      <div className="tk-timeline-head">
                        <strong>{step.status_label}</strong>
                        <time>{formatEventDate(step.event_timestamp)}</time>
                      </div>
                      <p className="tk-timeline-place">
                        <MapPin size={13} />
                        {step.location}
                      </p>
                      {step.comment && <p className="tk-timeline-note">{step.comment}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {data.parcels.length > 0 && (
              <section className="tk-section">
                <h2>{data.parcels.length > 1 ? `Vos ${data.parcels.length} colis` : "Votre colis"}</h2>
                <ul className="tk-parcels">
                  {data.parcels.map((parcel) => (
                    <li key={parcel.parcel_index}>
                      <span>
                        {parcel.package_label}
                        {parcel.description && parcel.description !== parcel.package_label && (
                          <small>{parcel.description}</small>
                        )}
                      </span>
                      <strong>{parcel.weight_kg > 0 ? `${parcel.weight_kg} kg` : "—"}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="tk-actions">
              <button type="button" className="tk-cta" onClick={() => downloadOfficialReceiptPdf(receipt)}>
                <Download size={18} />
                <span>Télécharger mon étiquette</span>
              </button>
              <button type="button" className="tk-link" onClick={() => printOfficialReceipt(receipt)}>
                <Printer size={16} />
                <span>Imprimer</span>
              </button>
              <WhatsAppButton href={data.whatsapp_support_url} />
            </section>
          </>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tk-root {
          --tk-ink: #3A2A21;
          --tk-muted: #7D6E64;
          --tk-faint: #A99A90;
          --tk-line: #EADFD3;
          --tk-accent: #6B5844;
          --tk-accent-deep: #3A2A21;
          --tk-tint: #F3EBDF;
          padding: 26px 20px 30px;
          color: var(--tk-ink);
          overflow-x: hidden;
        }

        .tk-container {
          max-width: 880px;
          margin: 0 auto;
        }

        .tk-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 26px;
          color: var(--tk-muted);
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
        }

        .tk-back:hover {
          color: var(--tk-accent);
        }

        .tk-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 70px 16px;
          color: var(--tk-accent);
          text-align: center;
        }

        .client-portal .tk-state h1 {
          margin: 0;
          color: var(--tk-ink);
          font-size: 1.6rem;
        }

        .tk-state p {
          max-width: 420px;
          margin: 0;
          color: var(--tk-muted);
        }

        .tk-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 390px);
          gap: 28px;
          align-items: center;
          margin-bottom: 34px;
        }

        .tk-hero-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 0;
        }

        .tk-eyebrow {
          margin-bottom: 8px;
          color: var(--tk-accent);
          font-size: 0.88rem;
          font-weight: 700;
        }

        .client-portal .tk-status {
          margin: 0 0 8px;
          color: var(--tk-ink);
          font-family: var(--c-font-display);
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.08;
        }

        .tk-status-desc {
          max-width: 400px;
          margin: 0 0 20px;
          color: var(--tk-muted);
          font-size: 1rem;
          line-height: 1.45;
        }

        .tk-code {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          max-width: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--tk-ink);
          cursor: pointer;
          font-family: var(--c-font-mono);
          font-size: clamp(1rem, 3.4vw, 1.2rem);
          font-weight: 700;
          text-align: left;
          overflow-wrap: anywhere;
        }

        .tk-code:hover {
          color: var(--tk-accent);
        }

        .tk-copy-hint {
          margin-top: 3px;
          color: var(--tk-faint);
          font-size: 0.8rem;
        }

        .tk-payment {
          margin-top: 16px;
          padding: 6px 13px;
          border-radius: 9999px;
          background: #EFE6D9;
          color: #6B5844;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .tk-payment.paid {
          background: #E6F4EA;
          color: #1E7A43;
        }

        .tk-box {
          width: 100%;
          height: auto;
          display: block;
        }

        .tk-route {
          margin-bottom: 34px;
          padding: 24px 26px 20px;
          border: 1px solid #EFE6D9;
          border-radius: 30px;
          background: linear-gradient(180deg, #FFFDF9 0%, #FBF3E8 100%);
        }

        .tk-route-ends {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .tk-route-ends span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          font-size: 0.97rem;
          font-weight: 700;
        }

        .tk-route-ends span:last-child {
          text-align: right;
        }

        .tk-facts {
          display: flex;
          flex-wrap: wrap;
          gap: 16px 44px;
          margin: 0 0 40px;
          padding: 18px 0;
          border-top: 1px solid var(--tk-line);
          border-bottom: 1px solid var(--tk-line);
        }

        .tk-facts dt {
          color: var(--tk-muted);
          font-size: 0.82rem;
        }

        .tk-facts dd {
          margin: 2px 0 0;
          font-size: 1rem;
          font-weight: 700;
        }

        .tk-section {
          margin-bottom: 38px;
        }

        .client-portal .tk-section h2 {
          margin: 0 0 16px;
          color: var(--tk-ink);
          font-family: var(--c-font-display);
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .tk-timeline {
          position: relative;
          margin: 0;
          padding: 0 0 0 26px;
          list-style: none;
        }

        .tk-timeline::before {
          content: "";
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: 6px;
          width: 2px;
          background: var(--tk-line);
        }

        .tk-timeline li {
          position: relative;
          padding-bottom: 22px;
        }

        .tk-timeline li:last-child {
          padding-bottom: 0;
        }

        .tk-timeline li::before {
          content: "";
          position: absolute;
          top: 6px;
          left: -25px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #E2D5C8;
        }

        .tk-timeline li.latest::before {
          background: var(--tk-accent);
          box-shadow: 0 0 0 5px rgba(107, 88, 68, 0.14);
        }

        .tk-timeline-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 2px 14px;
        }

        .tk-timeline-head strong {
          font-size: 0.98rem;
        }

        .tk-timeline li.latest .tk-timeline-head strong {
          color: var(--tk-accent);
        }

        .tk-timeline-head time {
          color: var(--tk-faint);
          font-size: 0.82rem;
        }

        .tk-timeline-place {
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 3px 0 0;
          color: var(--tk-muted);
          font-size: 0.88rem;
        }

        .tk-timeline-note {
          margin: 3px 0 0;
          color: var(--tk-muted);
          font-size: 0.86rem;
          line-height: 1.4;
        }

        .tk-parcels {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .tk-parcels li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--tk-line);
          font-weight: 600;
        }

        .tk-parcels li:last-child {
          border-bottom: 0;
        }

        .tk-parcels small {
          display: block;
          color: var(--tk-muted);
          font-size: 0.82rem;
          font-weight: 400;
        }

        .tk-parcels strong {
          white-space: nowrap;
        }

        .tk-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .tk-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 52px;
          padding: 0 26px;
          border: 1px solid #DCCDB6;
          border-radius: 9999px;
          background: #FFFBF4;
          box-shadow: 0 12px 24px -16px rgba(107, 88, 68, 0.6);
          color: var(--tk-ink);
          font-size: 0.97rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .tk-cta:hover {
          background: #F3EBDF;
          transform: translateY(-1px);
        }

        .tk-cta:active {
          transform: scale(0.98);
        }

        .tk-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
          padding: 0 20px;
          border: 0;
          border-radius: 9999px;
          background: #EFE6D9;
          color: var(--tk-accent-deep);
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .tk-link:hover {
          background: #EADDCB;
        }

        @media (max-width: 720px) {
          .tk-hero {
            grid-template-columns: minmax(0, 1fr);
            gap: 22px;
          }

          .tk-box {
            max-width: 330px;
            margin: 0 auto;
          }

          .tk-route {
            padding: 20px 16px 14px;
            border-radius: 26px;
          }

          .tk-route-ends span {
            font-size: 0.9rem;
          }

          .tk-actions .tk-cta {
            width: 100%;
          }

          .tk-actions .tk-link,
          .tk-actions .wa-pill {
            flex: 1 1 0;
          }
        }
      `,
        }}
      />
    </div>
  );
}
