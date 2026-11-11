"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ReceiptText, ShoppingBag } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { useShop } from "@/shared/useShop";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { formatFcfa, orderPageUrl, readSavedOrders, shopImageUrl, type SavedOrder, type ShopOrder } from "@/shared/shop";
import { downloadShopTicket } from "@/utils/shopTicketPdf";

const TONE: Record<ShopOrder["status"], string> = {
  AWAITING_PAYMENT: "wait",
  PROOF_SENT: "wait",
  CONFIRMED: "ok",
  SHIPPED: "ok",
  DELIVERED: "done",
  CANCELLED: "off",
};

/** Les commandes passées depuis cet appareil : pas de compte à créer, le lien suffit. */
export default function MyOrdersPage() {
  const { catalog } = useShop();
  const { settings } = usePublicCatalog();
  const [saved, setSaved] = useState<SavedOrder[] | null>(null);
  const [orders, setOrders] = useState<Record<string, ShopOrder>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const list = readSavedOrders();
    setSaved(list);
    for (const entry of list) {
      apiRequest<{ order: ShopOrder }>(`/api/v1/public/shop/orders/${encodeURIComponent(entry.reference)}?key=${encodeURIComponent(entry.key)}`, {
        retries: 0,
      })
        .then((data) => setOrders((s) => ({ ...s, [entry.reference]: data.order })))
        .catch(() => {});
    }
  }, []);

  const covers = useMemo(() => new Map((catalog?.products || []).map((p) => [p.id, p.images[0]])), [catalog]);

  const ticket = async (order: ShopOrder) => {
    setBusy(order.reference);
    try {
      await downloadShopTicket(order, settings.whatsapp_official_number?.trim() || undefined);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mo">
      <header className="mo-head">
        <span className="rb-kicker">Mes commandes</span>
        <h1 className="rb-title">Vos commandes</h1>
        <p className="rb-lead">Les commandes passées depuis ce téléphone ou cet ordinateur, avec leur ticket.</p>
      </header>

      {saved && saved.length === 0 ? (
        <div className="mo-empty">
          <span className="mo-empty-icon">
            <ShoppingBag size={24} strokeWidth={1.6} />
          </span>
          <p>Aucune commande passée depuis cet appareil.</p>
          <div className="mo-empty-actions">
            <Link href="/boutique" className="rb-btn">
              Voir la boutique
            </Link>
            <Link href="/boutique/suivi" className="mo-link">
              Suivre une commande avec son numéro
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mo-list">
          {(saved || []).map((entry) => {
            const order = orders[entry.reference];
            const photos = (order?.items || [])
              .map((item) => (item.productId ? covers.get(item.productId) : undefined))
              .filter((id): id is string => Boolean(id))
              .slice(0, 3);
            const pieces = order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            return (
              <li key={entry.reference} className="mo-card">
                <Link href={orderPageUrl(entry.reference, entry.key)} className="mo-open">
                  <span className={`mo-photos n${Math.max(1, photos.length)}`}>
                    {photos.length > 0 ? (
                      photos.map((id) => <img key={id} src={shopImageUrl(id)} alt="" />)
                    ) : (
                      <span className="mo-photo-empty">
                        <ShoppingBag size={18} strokeWidth={1.6} />
                      </span>
                    )}
                  </span>
                  <span className="mo-info">
                    <strong>{entry.reference}</strong>
                    <span className="mo-meta">
                      {new Date(entry.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      {order ? ` · ${pieces} pièce${pieces > 1 ? "s" : ""}` : ""}
                    </span>
                    {order ? (
                      <span className={`mo-status ${TONE[order.status]}`}>{order.statusLabel}</span>
                    ) : (
                      <span className="mo-status">…</span>
                    )}
                  </span>
                  <span className="mo-total">
                    {formatFcfa(order?.totalFcfa ?? entry.totalFcfa)}
                    <ChevronRight size={18} />
                  </span>
                </Link>
                {order && (
                  <button type="button" className="mo-ticket" onClick={() => ticket(order)} disabled={busy === order.reference}>
                    <ReceiptText size={15} strokeWidth={1.9} />
                    {busy === order.reference ? "Préparation…" : "Ticket"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .mo { display: grid; grid-template-columns: minmax(0, 1fr); gap: 30px; padding-top: 8px; }
        .mo-head { display: flex; flex-direction: column; align-items: flex-start; }
        .mo-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .mo-card { position: relative; display: flex; align-items: center; gap: 10px; padding: 14px; border: 1px solid #EFE6D9; border-radius: 24px; background: #FFFFFF; transition: border-color 0.15s ease; }
        .mo-card:hover { border-color: #DCCDB6; }
        .mo-open { flex: 1; display: flex; align-items: center; gap: 16px; min-width: 0; color: inherit; text-decoration: none; }
        .mo-photos { position: relative; flex-shrink: 0; width: 76px; height: 92px; }
        .mo-photos img, .mo-photo-empty { position: absolute; top: 0; width: 64px; height: 80px; border-radius: 14px; object-fit: cover; background: #F3EBDF; box-shadow: 0 0 0 2px #FFFFFF; }
        .mo-photos.n1 img, .mo-photos.n1 .mo-photo-empty { left: 0; width: 76px; height: 92px; }
        .mo-photos.n2 img:nth-child(1), .mo-photos.n3 img:nth-child(1) { left: 0; top: 0; z-index: 3; }
        .mo-photos.n2 img:nth-child(2) { left: 12px; top: 12px; z-index: 2; }
        .mo-photos.n3 img:nth-child(2) { left: 6px; top: 6px; z-index: 2; }
        .mo-photos.n3 img:nth-child(3) { left: 12px; top: 12px; z-index: 1; }
        .mo-photo-empty { display: flex; align-items: center; justify-content: center; color: #8C7D75; }
        .mo-info { flex: 1; display: grid; gap: 4px; justify-items: start; min-width: 0; }
        .mo-info strong { font-family: var(--c-font-mono); font-size: 0.98rem; color: var(--c-text-main); }
        .mo-meta { font-size: 0.84rem; color: var(--c-text-light); }
        .mo-status { margin-top: 2px; padding: 4px 11px; white-space: nowrap; border-radius: 9999px; background: #F3EBDF; color: #6B5844; font-size: 0.78rem; font-weight: 700; }
        .mo-status.ok { background: #E6F4EA; color: #1E7A43; }
        .mo-status.done { background: #EADDCB; color: #3A2A21; }
        .mo-status.off { background: #FBEAEA; color: #A12B2B; }
        .mo-total { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; font-size: 1rem; font-weight: 800; color: var(--c-text-main); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .mo-total svg { color: var(--c-text-light); }
        .mo-ticket { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid #DCCDB6; border-radius: 9999px; background: #FFFBF4; color: #3A2A21; font: inherit; font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
        .mo-ticket:hover { background: #F3EBDF; }
        .mo-ticket svg { color: var(--c-accent); }
        .mo-ticket:disabled { opacity: 0.6; cursor: wait; }
        .mo-empty { display: grid; justify-items: start; gap: 14px; padding: 26px 0; border-top: 1px solid #EADFD3; }
        .mo-empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 50%; background: #F3EBDF; color: #6B5844; }
        .mo-empty p { margin: 0; color: var(--c-text-muted); font-size: 1rem; }
        .mo-empty-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 22px; }
        .mo-link { color: #3A2A21; font-weight: 700; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: rgba(58, 42, 33, 0.3); }
        @media (max-width: 560px) {
          .mo-card { flex-direction: column; align-items: stretch; gap: 12px; padding: 14px; border-radius: 20px; }
          .mo-open { display: grid; grid-template-columns: 62px minmax(0, 1fr); gap: 6px 14px; align-items: start; }
          .mo-photos { grid-row: span 2; width: 62px; height: 76px; }
          .mo-photos img, .mo-photo-empty { width: 52px; height: 66px; border-radius: 12px; }
          .mo-photos.n1 img, .mo-photos.n1 .mo-photo-empty { width: 62px; height: 76px; }
          .mo-total { grid-column: 2; font-size: 0.98rem; }
          .mo-total svg { display: none; }
          .mo-ticket { align-self: flex-start; margin-left: 76px; min-height: 38px; }
        }
      `,
        }}
      />
    </div>
  );
}
