"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eye, PackageCheck, Truck, X } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  formatFcfa,
  managerOrderMessage,
  orderPageUrl,
  variantLabel,
  whatsappLink,
  type ShopOrder,
  type ShopOrderStatus,
} from "@/shared/shop";
import { ShopProducts, type AdminCatalog } from "./ShopProducts";
import { ShopSetup } from "./ShopSetup";

export type Notify = (message: string, title?: string, type?: "success" | "error" | "info") => void;

interface AdminOrder extends ShopOrder {
  id: string;
  accessKey: string;
  proofMime: string | null;
}

interface OrdersData {
  orders: AdminOrder[];
  counts: Partial<Record<ShopOrderStatus, number>>;
  revenueFcfa: number;
}

const STATUS_FILTERS: Array<{ id: ShopOrderStatus | "ALL"; label: string }> = [
  { id: "ALL", label: "Toutes" },
  { id: "PROOF_SENT", label: "À vérifier" },
  { id: "AWAITING_PAYMENT", label: "Attente paiement" },
  { id: "CONFIRMED", label: "À expédier" },
  { id: "SHIPPED", label: "Expédiées" },
  { id: "DELIVERED", label: "Livrées" },
  { id: "CANCELLED", label: "Annulées" },
];

/**
 * Onglet Boutique de l'admin : commandes, articles et stock, catégories et livraison.
 * `version` change à chaque modification venue d'ailleurs (autre appareil, nouvelle commande).
 */
export function ShopAdmin({ token, notify, version }: { token: string | null; notify: Notify; version: number }) {
  const [section, setSection] = useState<"orders" | "products" | "setup">("orders");
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  // L'admin recrée sa fonction de message à chaque rendu : on la garde à part pour ne pas tout recharger.
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const reload = useCallback(async () => {
    try {
      const [cat, orders] = await Promise.all([
        apiRequest<AdminCatalog>("/api/admin/shop/catalog", { token }),
        apiRequest<OrdersData>("/api/admin/shop/orders", { token }),
      ]);
      setCatalog(cat);
      setOrdersData(orders);
    } catch (err: any) {
      notifyRef.current(err?.message || "La boutique n'a pas pu être chargée.", "Boutique", "error");
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload, version]);

  const call = useCallback(
    async (path: string, init: { method: "POST" | "PUT" | "DELETE"; body?: unknown }, success?: string) => {
      try {
        const data = await apiRequest(`/api/admin/shop${path}`, { token, ...init });
        if (success) notifyRef.current(success, "Boutique");
        await reload();
        return data ?? true;
      } catch (err: any) {
        notifyRef.current(err?.message || "L'action n'a pas abouti.", "Boutique", "error");
        return null;
      }
    },
    [token, reload]
  );

  const counts = ordersData?.counts || {};
  const toHandle = (counts.PROOF_SENT || 0) + (counts.CONFIRMED || 0);

  return (
    <div className="sa-root">
      <div className="sa-tabs" role="tablist">
        {[
          { id: "orders" as const, label: "Commandes", badge: toHandle },
          { id: "products" as const, label: "Articles & stock" },
          { id: "setup" as const, label: "Catégories & livraison" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={section === tab.id}
            className={`sa-tab ${section === tab.id ? "active" : ""}`}
            onClick={() => setSection(tab.id)}
          >
            {tab.label}
            {tab.badge ? <span className="sa-tab-badge">{tab.badge}</span> : null}
          </button>
        ))}
        <a href="/boutique" target="_blank" rel="noopener noreferrer" className="sa-tab sa-tab-link">
          Voir la boutique
        </a>
      </div>

      {!catalog || !ordersData ? (
        <p className="sa-muted">Chargement de la boutique…</p>
      ) : section === "orders" ? (
        <ShopOrders data={ordersData} token={token} call={call} />
      ) : section === "products" ? (
        <ShopProducts catalog={catalog} token={token} call={call} notify={notify} reload={reload} />
      ) : (
        <ShopSetup catalog={catalog} token={token} call={call} notify={notify} reload={reload} />
      )}

      <style dangerouslySetInnerHTML={{ __html: SHOP_ADMIN_STYLES }} />
    </div>
  );
}

type Call = (path: string, init: { method: "POST" | "PUT" | "DELETE"; body?: unknown }, success?: string) => Promise<unknown>;

function ShopOrders({ data, token, call }: { data: OrdersData; token: string | null; call: Call }) {
  const [filter, setFilter] = useState<ShopOrderStatus | "ALL">("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tracking, setTracking] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const orders = data.orders.filter((o) => filter === "ALL" || o.status === filter);

  const showProof = async (order: AdminOrder) => {
    const res = await fetch(`/api/admin/shop/orders/${order.id}/proof`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    setProofUrl(URL.createObjectURL(blob));
  };

  const setStatus = async (order: AdminOrder, status: ShopOrderStatus, extra: Record<string, string> = {}, success?: string) => {
    setBusy(true);
    await call(`/orders/${order.id}/status`, { method: "POST", body: { status, ...extra } }, success);
    setBusy(false);
    setTracking("");
    setCancelReason("");
  };

  return (
    <div className="sa-orders">
      <div className="sa-stats">
        <div>
          <span>Ventes confirmées</span>
          <strong>{formatFcfa(data.revenueFcfa)}</strong>
        </div>
        <div>
          <span>Preuves à vérifier</span>
          <strong>{data.counts.PROOF_SENT || 0}</strong>
        </div>
        <div>
          <span>À expédier</span>
          <strong>{data.counts.CONFIRMED || 0}</strong>
        </div>
      </div>

      <div className="sa-chips">
        {STATUS_FILTERS.map((f) => (
          <button key={f.id} type="button" className={`sa-chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}
            {f.id !== "ALL" && data.counts[f.id] ? ` · ${data.counts[f.id]}` : ""}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="sa-muted">Aucune commande ici pour le moment.</p>
      ) : (
        <ul className="sa-list">
          {orders.map((order) => {
            const open = openId === order.id;
            const pageUrl = typeof window !== "undefined" ? `${window.location.origin}${orderPageUrl(order.reference, order.accessKey)}` : "";
            return (
              <li key={order.id} className={`sa-order ${open ? "open" : ""}`}>
                <button type="button" className="sa-order-head" onClick={() => setOpenId(open ? null : order.id)}>
                  <span className="sa-order-main">
                    <strong>{order.reference}</strong>
                    <span className="sa-muted">
                      {order.customer.name} · {new Date(order.createdAt.replace(" ", "T") + "Z").toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </span>
                  <span className={`sa-status sa-status-${order.status}`}>{order.statusLabel}</span>
                  <strong className="sa-order-total">{formatFcfa(order.totalFcfa)}</strong>
                </button>

                {open && (
                  <div className="sa-order-body">
                    <ul className="sa-items">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          <span>
                            {item.quantity} × {item.productName}
                            {variantLabel(item) && <em> · {variantLabel(item)}</em>}
                          </span>
                          <span>{formatFcfa(item.lineTotalFcfa)}</span>
                        </li>
                      ))}
                      <li>
                        <span>{order.delivery.label}</span>
                        <span>{formatFcfa(order.delivery.priceFcfa)}</span>
                      </li>
                    </ul>
                    <p className="sa-address">
                      <strong>{order.customer.name}</strong> · {order.customer.phone}
                      <br />
                      {[order.customer.address, order.customer.city, order.customer.country].filter(Boolean).join(", ")}
                      {order.customer.note && (
                        <>
                          <br />« {order.customer.note} »
                        </>
                      )}
                    </p>
                    {order.trackingNumber && <p className="sa-muted">Numéro de suivi : {order.trackingNumber}</p>}
                    {order.paymentMethod && <p className="sa-muted">Paiement annoncé : {order.paymentMethod}</p>}

                    <div className="sa-actions">
                      {order.proofMime && (
                        <button type="button" className="sa-btn soft" onClick={() => showProof(order)}>
                          <Eye size={15} /> Voir la preuve
                        </button>
                      )}
                      {(order.status === "AWAITING_PAYMENT" || order.status === "PROOF_SENT") && (
                        <button type="button" className="sa-btn" disabled={busy} onClick={() => setStatus(order, "CONFIRMED", {}, "Paiement confirmé.")}>
                          <Check size={15} /> Paiement reçu
                        </button>
                      )}
                      {order.status === "PROOF_SENT" && (
                        <button type="button" className="sa-btn soft" disabled={busy} onClick={() => setStatus(order, "AWAITING_PAYMENT", {}, "Preuve refusée : le client peut en renvoyer une.")}>
                          <X size={15} /> Refuser la preuve
                        </button>
                      )}
                      {order.status === "SHIPPED" && (
                        <button type="button" className="sa-btn" disabled={busy} onClick={() => setStatus(order, "DELIVERED", {}, "Commande livrée.")}>
                          <PackageCheck size={15} /> Marquer livrée
                        </button>
                      )}
                      <WhatsAppButton
                        href={whatsappLink(order.customer.phone, managerOrderMessage(order, pageUrl))}
                        label="Écrire au client"
                      />
                    </div>

                    {order.status === "CONFIRMED" && (
                      <div className="sa-inline">
                        <input
                          className="input-clean"
                          placeholder="Numéro de suivi (facultatif)"
                          value={tracking}
                          onChange={(e) => setTracking(e.target.value)}
                        />
                        <button type="button" className="sa-btn" disabled={busy} onClick={() => setStatus(order, "SHIPPED", tracking.trim() ? { trackingNumber: tracking.trim() } : {}, "Commande expédiée.")}>
                          <Truck size={15} /> Marquer expédiée
                        </button>
                      </div>
                    )}

                    {(order.status === "AWAITING_PAYMENT" || order.status === "PROOF_SENT" || order.status === "CONFIRMED") && (
                      <div className="sa-inline">
                        <input
                          className="input-clean"
                          placeholder="Motif d'annulation (facultatif)"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <button type="button" className="sa-btn danger" disabled={busy} onClick={() => setStatus(order, "CANCELLED", cancelReason.trim() ? { reason: cancelReason.trim() } : {}, "Commande annulée, stock rendu.")}>
                          Annuler la commande
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {proofUrl && (
        <div className="sa-lightbox" onClick={() => setProofUrl(null)} role="dialog" aria-label="Preuve de paiement">
          <iframe src={proofUrl} title="Preuve de paiement" />
          <button type="button" className="sa-btn" onClick={() => setProofUrl(null)}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}


const SHOP_ADMIN_STYLES = `
  .sa-root { display: grid; gap: 18px; padding-bottom: 60px; }
  .sa-muted { color: var(--text-muted); font-size: 0.86rem; }
  .sa-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
  .sa-tab { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border: 0; border-radius: 9999px; background: #F3EBDF; color: #3A2A21; font: inherit; font-size: 0.86rem; font-weight: 700; cursor: pointer; text-decoration: none; }
  .sa-tab.active { background: #3A2A21; color: #FFFBF4; }
  .sa-tab-link { margin-left: auto; background: transparent; border: 1px solid #EADFD3; }
  .sa-tab-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 9999px; background: #EADDCB; color: #3A2A21; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; }
  .sa-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
  .sa-stats div { display: grid; gap: 4px; padding: 16px 18px; border-radius: 18px; background: #FFFFFF; border: 1px solid #EFE6D9; }
  .sa-stats span { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
  .sa-stats strong { font-size: 1.3rem; color: #1B1411; }
  .sa-chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
  .sa-chip { flex-shrink: 0; min-height: 36px; padding: 0 14px; border: 1px solid #EADFD3; border-radius: 9999px; background: #FFFFFF; color: #3A2A21; font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
  .sa-chip.active { background: #3A2A21; color: #FFFBF4; border-color: #3A2A21; }
  .sa-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .sa-order { border-radius: 18px; background: #FFFFFF; border: 1px solid #EFE6D9; overflow: hidden; }
  .sa-order.open { border-color: #D9CBB8; }
  .sa-order-head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 0; background: none; text-align: left; font: inherit; color: #1B1411; cursor: pointer; }
  .sa-order-main { flex: 1; display: grid; gap: 2px; min-width: 0; }
  .sa-order-total { white-space: nowrap; }
  .sa-status { padding: 4px 10px; border-radius: 9999px; font-size: 0.74rem; font-weight: 700; white-space: nowrap; background: #F3EBDF; color: #6B5844; }
  .sa-status-PROOF_SENT { background: #3A2A21; color: #FFFBF4; }
  .sa-status-CONFIRMED { background: #E7F3EB; color: #1E7A43; }
  .sa-status-DELIVERED { background: #E7F3EB; color: #1E7A43; }
  .sa-status-CANCELLED { background: #FBEAEA; color: #A12B2B; }
  .sa-order-body { display: grid; gap: 12px; padding: 0 16px 16px; }
  .sa-items { list-style: none; margin: 0; padding: 12px 0 0; border-top: 1px solid #EFE6D9; display: grid; gap: 6px; }
  .sa-items li { display: flex; justify-content: space-between; gap: 12px; font-size: 0.9rem; }
  .sa-items em { font-style: normal; color: var(--text-muted); }
  .sa-address { margin: 0; font-size: 0.88rem; line-height: 1.5; color: #3A2A21; }
  .sa-actions, .sa-inline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .sa-inline .input-clean { flex: 1; min-width: 200px; }
  .sa-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px; border: 0; border-radius: 9999px; background: #3A2A21; color: #FFFBF4; font: inherit; font-size: 0.84rem; font-weight: 700; cursor: pointer; }
  .sa-btn.soft { background: #EADDCB; color: #3A2A21; }
  .sa-btn.danger { background: transparent; color: #A12B2B; border: 1px solid #F0CFCF; }
  .sa-btn:disabled { opacity: 0.55; cursor: wait; }
  .sa-lightbox { position: fixed; inset: 0; z-index: 100000; display: grid; place-items: center; gap: 12px; padding: 20px; background: rgba(28, 24, 21, 0.86); }
  .sa-lightbox iframe { width: min(720px, 92vw); height: 78vh; border: 0; border-radius: 16px; background: #FFFFFF; }
  .sa-card { padding: 20px; border-radius: 20px; background: #FFFFFF; border: 1px solid #EFE6D9; display: grid; gap: 14px; }
  .sa-card h3 { margin: 0; font-size: 1.02rem; color: #1B1411; }
  .sa-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .sa-field { display: grid; gap: 5px; }
  .sa-field > span { font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); }
  .sa-hint { margin: 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; }
  @media (max-width: 640px) {
    .sa-order-head { flex-wrap: wrap; }
    .sa-order-main { flex-basis: 100%; }
    .sa-tab-link { margin-left: 0; }
  }
`;
