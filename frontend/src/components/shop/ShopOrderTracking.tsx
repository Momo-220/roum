"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, Copy, RefreshCw } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { getSupportPhoneDigits } from "@/shared";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ShopOrderSteps } from "./ShopOrderSteps";
import {
  SHOP_NAME,
  isTransitTrackingNumber,
  orderPageUrl,
  readSavedOrders,
  variantLabel,
  whatsappLink,
  type ShopOrderStatus,
} from "@/shared/shop";

interface TrackedOrder {
  reference: string;
  status: ShopOrderStatus;
  statusLabel: string;
  delivery: { method: "BOUTIQUE" | "TRANSIT"; label: string };
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{ productName: string; color: string; size: string; quantity: number }>;
}

const STATUS_TEXT: Record<ShopOrderStatus, string> = {
  AWAITING_PAYMENT: "Payez puis envoyez la preuve depuis votre page de commande.",
  PROOF_SENT: "La boutique vérifie votre paiement.",
  CONFIRMED: "Paiement reçu. Votre commande est en préparation.",
  SHIPPED: "Votre commande est en route.",
  DELIVERED: "Votre commande vous a été remise. Merci !",
  CANCELLED: "Cette commande a été annulée.",
};

function formatDate(value: string): string {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** Suivi d'une commande Roum Boutique, dans le même habit que le suivi d'un colis. */
export function ShopOrderTracking({ reference, base }: { reference: string; base: string }) {
  const { settings } = usePublicCatalog();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const load = useCallback(
    async (silent: boolean) => {
      try {
        const data = await apiRequest<{ order: TrackedOrder }>(`/api/v1/public/shop/track/${encodeURIComponent(reference)}`, {
          retries: silent ? 0 : undefined,
        });
        setOrder(data.order);
        setError(null);
      } catch (err: any) {
        if (!silent || err?.status === 404) {
          setOrder(null);
          setError(err?.message || "Erreur de connexion au serveur.");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [reference]
  );

  useEffect(() => {
    setLoading(true);
    void load(false);
    setSavedKey(readSavedOrders().find((o) => o.reference === reference)?.key ?? null);
    // La page suit la commande sans être rechargée.
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 10_000);
    return () => clearInterval(timer);
  }, [load, reference]);

  const copy = () => {
    navigator.clipboard?.writeText(reference).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pieces = order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const support = whatsappLink(getSupportPhoneDigits(settings), `Bonjour ${SHOP_NAME}, je suis ma commande ${reference}.`);

  return (
    <div className="tk-root">
      <div className="tk-container">
        <Link href={base} className="tk-back">
          <ArrowLeft size={16} />
          <span>Suivre une autre commande</span>
        </Link>

        {loading && (
          <div className="tk-state">
            <RefreshCw size={28} className="spin" />
            <p>Recherche de votre commande…</p>
          </div>
        )}

        {!loading && error && (
          <div className="tk-state">
            <AlertCircle size={32} />
            <h1>Commande introuvable</h1>
            <p>{error}</p>
            <Link href={base} className="tk-cta">
              Vérifier le numéro
            </Link>
          </div>
        )}

        {!loading && order && (
          <>
            <section className="tko-hero">
              <span className="tk-eyebrow">Votre commande Roum Boutique</span>
              <h1 className="tk-status">{order.statusLabel}</h1>
              <p className="tk-status-desc">{STATUS_TEXT[order.status]}</p>
              <button type="button" className="tk-code" onClick={copy} title="Copier le numéro">
                <span>{order.reference}</span>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <span className="tk-copy-hint">{copied ? "Numéro copié" : "Touchez pour copier"}</span>
            </section>

            {order.status !== "CANCELLED" && <ShopOrderSteps status={order.status} />}

            <dl className="tk-facts">
              <div>
                <dt>Commandée le</dt>
                <dd>{formatDate(order.createdAt)}</dd>
              </div>
              <div>
                <dt>Articles</dt>
                <dd>{pieces}</dd>
              </div>
              <div>
                <dt>Livraison</dt>
                <dd>{order.delivery.label}</dd>
              </div>
            </dl>

            {order.trackingNumber && (
              <section className="tk-section">
                <h2>Votre colis</h2>
                {isTransitTrackingNumber(order.trackingNumber) ? (
                  <Link href={`${base}/${encodeURIComponent(order.trackingNumber)}`} className="tk-cta">
                    <span>Suivre le colis {order.trackingNumber}</span>
                  </Link>
                ) : (
                  <p className="tko-number">
                    Numéro de suivi : <strong>{order.trackingNumber}</strong>
                  </p>
                )}
              </section>
            )}

            {order.items.length > 0 && (
              <section className="tk-section">
                <h2>{order.items.length > 1 ? `Vos ${order.items.length} articles` : "Votre article"}</h2>
                <ul className="tk-parcels">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      <span>
                        {item.productName}
                        {variantLabel(item) && <small>{variantLabel(item)}</small>}
                      </span>
                      <strong>× {item.quantity}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="tk-actions">
              {savedKey && (
                <Link href={orderPageUrl(order.reference, savedKey)} className="tk-cta">
                  {order.status === "AWAITING_PAYMENT" ? "Payer et envoyer la preuve" : "Ouvrir ma commande"}
                </Link>
              )}
              <WhatsAppButton href={support} />
            </section>
          </>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tko-hero { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 30px; }
        .tko-number { margin: 0; color: var(--tk-muted); }
        .tko-number strong { color: var(--tk-ink); font-family: var(--c-font-mono); }
      `,
        }}
      />
    </div>
  );
}
