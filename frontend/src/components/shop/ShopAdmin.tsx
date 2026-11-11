"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  Search,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { apiRequest } from "@/shared/api";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  formatFcfa,
  managerOrderMessage,
  orderPageUrl,
  shopImageUrl,
  variantLabel,
  whatsappLink,
  type ShopOrder,
  type ShopOrderStatus,
} from "@/shared/shop";
import { ShopProducts, type AdminCatalog } from "./ShopProducts";
import { ShopSetup } from "./ShopSetup";
import { Metric, SHOP_UI_STYLES, timeAgo } from "./ShopAdminUi";
import { downloadShopTicket } from "@/utils/shopTicketPdf";

export type Notify = (message: string, title?: string, type?: "success" | "error" | "info") => void;

interface AdminOrder extends ShopOrder {
  id: string;
  accessKey: string;
  proofMime: string | null;
  proofSentAt: string | null;
}

interface OrdersData {
  orders: AdminOrder[];
  counts: Partial<Record<ShopOrderStatus, number>>;
  revenueFcfa: number;
}

type Filter = ShopOrderStatus | "ALL";

const STATUS_FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "ALL", label: "Toutes" },
  { id: "PROOF_SENT", label: "À vérifier" },
  { id: "CONFIRMED", label: "À expédier" },
  { id: "AWAITING_PAYMENT", label: "Attente paiement" },
  { id: "SHIPPED", label: "Expédiées" },
  { id: "DELIVERED", label: "Livrées" },
  { id: "CANCELLED", label: "Annulées" },
];

/** Ce que la gérante doit faire ensuite, en une phrase. */
const NEXT_STEP: Record<ShopOrderStatus, string> = {
  AWAITING_PAYMENT: "Le client n'a pas encore envoyé sa preuve de paiement.",
  PROOF_SENT: "Vérifiez la preuve sur votre compte, puis confirmez le paiement.",
  CONFIRMED: "Préparez le colis, puis indiquez qu'il est parti.",
  SHIPPED: "Quand le client a reçu son colis, marquez la commande livrée.",
  DELIVERED: "Commande terminée.",
  CANCELLED: "Commande annulée : le stock a été remis en vente.",
};

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
  const outOfStock = catalog?.products.filter((p) => p.isActive && p.variants.every((v) => v.stock <= 0)).length || 0;

  return (
    <div className="sa-root">
      <div className="sa-tabs" role="tablist">
        {[
          { id: "orders" as const, label: "Commandes", badge: toHandle },
          { id: "products" as const, label: "Articles & stock", badge: outOfStock },
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
          <ExternalLink size={14} /> Voir la boutique
        </a>
      </div>

      {!catalog || !ordersData ? (
        <div className="sa-loading" aria-label="Chargement de la boutique">
          <span />
          <span />
          <span />
        </div>
      ) : section === "orders" ? (
        <ShopOrders data={ordersData} catalog={catalog} token={token} call={call} notify={notify} />
      ) : section === "products" ? (
        <ShopProducts catalog={catalog} token={token} call={call} notify={notify} reload={reload} />
      ) : (
        <ShopSetup catalog={catalog} token={token} call={call} notify={notify} reload={reload} />
      )}

      <style dangerouslySetInnerHTML={{ __html: SHOP_ADMIN_STYLES + SHOP_UI_STYLES }} />
    </div>
  );
}

type Call = (path: string, init: { method: "POST" | "PUT" | "DELETE"; body?: unknown }, success?: string) => Promise<unknown>;

function ShopOrders({
  data,
  catalog,
  token,
  call,
  notify,
}: {
  data: OrdersData;
  catalog: AdminCatalog;
  token: string | null;
  call: Call;
  notify: Notify;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const covers = useMemo(() => new Map(catalog.products.map((p) => [p.id, p.images[0]])), [catalog.products]);
  const paidCount = (data.counts.CONFIRMED || 0) + (data.counts.SHIPPED || 0) + (data.counts.DELIVERED || 0);

  const orders = useMemo(() => {
    const words = query.trim().toLowerCase();
    const digits = words.replace(/\D/g, "");
    return data.orders.filter((o) => {
      if (filter !== "ALL" && o.status !== filter) return false;
      if (!words) return true;
      return (
        o.reference.toLowerCase().includes(words) ||
        o.customer.name.toLowerCase().includes(words) ||
        (digits.length >= 3 && o.customer.phone.replace(/\D/g, "").includes(digits))
      );
    });
  }, [data.orders, filter, query]);

  const toggleFilter = (next: Filter) => setFilter((current) => (current === next ? "ALL" : next));

  return (
    <div className="sa-orders">
      <div className="kpi-grid-4">
        <Metric
          icon={FileCheck}
          title="À vérifier"
          value={data.counts.PROOF_SENT || 0}
          sub="Preuves de paiement reçues"
          pill={data.counts.PROOF_SENT ? { label: "À traiter", tone: "gold" } : undefined}
          active={filter === "PROOF_SENT"}
          onClick={() => toggleFilter("PROOF_SENT")}
        />
        <Metric
          icon={Package}
          title="À expédier"
          value={data.counts.CONFIRMED || 0}
          sub="Payées, colis à préparer"
          pill={data.counts.CONFIRMED ? { label: "À traiter", tone: "gold" } : undefined}
          active={filter === "CONFIRMED"}
          onClick={() => toggleFilter("CONFIRMED")}
        />
        <Metric
          icon={Clock}
          title="Attente paiement"
          value={data.counts.AWAITING_PAYMENT || 0}
          sub="Commandées, pas encore payées"
          active={filter === "AWAITING_PAYMENT"}
          onClick={() => toggleFilter("AWAITING_PAYMENT")}
        />
        <Metric
          icon={Wallet}
          title="Ventes"
          value={formatFcfa(data.revenueFcfa)}
          sub={`${paidCount} commande${paidCount > 1 ? "s" : ""} payée${paidCount > 1 ? "s" : ""}`}
          pill={{ label: "Encaissé", tone: "up" }}
        />
      </div>

      <div className="sa-toolbar">
        <label className="sa-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Référence, nom ou téléphone" aria-label="Rechercher une commande" />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche">
              <X size={14} />
            </button>
          )}
        </label>
        <div className="sa-chips">
          {STATUS_FILTERS.map((f) => (
            <button key={f.id} type="button" className={`sa-chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
              {f.label}
              {f.id !== "ALL" && data.counts[f.id] ? <span className="sa-chip-count">{data.counts[f.id]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="sa-empty">
          <Package size={26} />
          <p>{data.orders.length === 0 ? "Aucune commande pour le moment. Elles arriveront ici dès qu'un client commande." : "Aucune commande ne correspond."}</p>
        </div>
      ) : (
        <ul className="sa-list">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              covers={covers}
              open={openId === order.id}
              onToggle={() => setOpenId(openId === order.id ? null : order.id)}
              token={token}
              call={call}
              notify={notify}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({
  order,
  covers,
  open,
  onToggle,
  token,
  call,
  notify,
}: {
  order: AdminOrder;
  covers: Map<string, string | undefined>;
  open: boolean;
  onToggle: () => void;
  token: string | null;
  call: Call;
  notify: Notify;
}) {
  const [tracking, setTracking] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);

  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const firstCover = order.items.map((item) => (item.productId ? covers.get(item.productId) : undefined)).find(Boolean);
  const pageUrl = typeof window !== "undefined" ? `${window.location.origin}${orderPageUrl(order.reference, order.accessKey)}` : "";
  const canCancel = order.status === "AWAITING_PAYMENT" || order.status === "PROOF_SENT" || order.status === "CONFIRMED";
  const isImageProof = Boolean(order.proofMime?.startsWith("image/"));

  // La preuve s'affiche dès que la commande est ouverte : pas de clic en plus pour la vérifier.
  useEffect(() => {
    if (!open || !order.proofMime || proofUrl) return;
    let cancelled = false;
    fetch(`/api/admin/shop/orders/${order.id}/proof`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob && !cancelled) setProofUrl(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, order.id, order.proofMime, proofUrl, token]);

  // Une nouvelle preuve remplace l'ancienne.
  useEffect(() => {
    setProofUrl(null);
  }, [order.proofSentAt]);

  useEffect(() => () => {
    if (proofUrl) URL.revokeObjectURL(proofUrl);
  }, [proofUrl]);

  const setStatus = async (status: ShopOrderStatus, extra: Record<string, string>, success: string) => {
    setBusy(true);
    const ok = await call(`/orders/${order.id}/status`, { method: "POST", body: { status, ...extra } }, success);
    setBusy(false);
    if (ok) {
      setTracking("");
      setCancelReason("");
      setCancelling(false);
    }
  };

  const ticket = async () => {
    try {
      // Le numéro WhatsApp imprimé sur le ticket est celui des Paramètres.
      const data = await apiRequest<any>("/api/v1/public/settings", { retries: 0 }).catch(() => null);
      const settings = data?.settings || data || {};
      await downloadShopTicket(order, String(settings.whatsapp_official_number || "").trim() || undefined);
    } catch {
      notify("Le ticket n'a pas pu être créé.", "Boutique", "error");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      notify("Lien de la commande copié : collez-le au client.", "Boutique");
    } catch {
      notify("Copie impossible sur cet appareil.", "Boutique", "error");
    }
  };

  return (
    <li className={`sa-order sa-order-${order.status} ${open ? "open" : ""}`}>
      <button type="button" className="sa-order-head" onClick={onToggle} aria-expanded={open}>
        <span className="sa-order-thumb">{firstCover ? <img src={shopImageUrl(firstCover)} alt="" /> : <Package size={18} />}</span>
        <span className="sa-order-main">
          <span className="sa-order-line">
            <strong className="sa-ref">{order.reference}</strong>
            <span className={`sa-status sa-status-${order.status}`}>{order.statusLabel}</span>
          </span>
          <span className="sa-muted">
            {order.customer.name} · {order.customer.city} · {pieces} article{pieces > 1 ? "s" : ""}
          </span>
        </span>
        <span className="sa-order-side">
          <strong>{formatFcfa(order.totalFcfa)}</strong>
          <span className="sa-muted">{timeAgo(order.createdAt)}</span>
        </span>
      </button>

      {open && (
        <div className="sa-order-body">
          <div className={`sa-next sa-next-${order.status}`}>
            <p>
              {order.status === "AWAITING_PAYMENT" && order.proofMime
                ? "Preuve refusée : en attente d'une nouvelle preuve du client."
                : NEXT_STEP[order.status]}
            </p>
            <div className="sa-actions">
              {order.status === "PROOF_SENT" && (
                <>
                  <button type="button" className="sa-btn" disabled={busy} onClick={() => setStatus("CONFIRMED", {}, "Paiement confirmé : préparez le colis.")}>
                    <Check size={15} /> Paiement reçu
                  </button>
                  <button
                    type="button"
                    className="sa-btn soft"
                    disabled={busy}
                    onClick={() => setStatus("AWAITING_PAYMENT", {}, "Preuve refusée : le client peut en renvoyer une.")}
                  >
                    <X size={15} /> Refuser la preuve
                  </button>
                </>
              )}
              {order.status === "AWAITING_PAYMENT" && (
                <button type="button" className="sa-btn soft" disabled={busy} onClick={() => setStatus("CONFIRMED", {}, "Paiement confirmé : préparez le colis.")}>
                  <Check size={15} /> Déjà payé ? Confirmer
                </button>
              )}
              {order.status === "CONFIRMED" && (
                <div className="sa-inline">
                  <input
                    className="input-clean"
                    placeholder="Numéro de suivi (facultatif, ex. RM-AIR-…)"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                  />
                  <button
                    type="button"
                    className="sa-btn"
                    disabled={busy}
                    onClick={() => setStatus("SHIPPED", tracking.trim() ? { trackingNumber: tracking.trim() } : {}, "Commande expédiée.")}
                  >
                    <Truck size={15} /> Colis parti
                  </button>
                </div>
              )}
              {order.status === "SHIPPED" && (
                <button type="button" className="sa-btn" disabled={busy} onClick={() => setStatus("DELIVERED", {}, "Commande livrée.")}>
                  <PackageCheck size={15} /> Marquer livrée
                </button>
              )}
              <WhatsAppButton href={whatsappLink(order.customer.phone, managerOrderMessage(order, pageUrl))} label="Écrire au client" />
            </div>
          </div>

          <div className="sa-order-grid">
            <section className="sa-block">
              <h4>Articles</h4>
              <ul className="sa-items">
                {order.items.map((item, index) => {
                  const cover = (item.productId ? covers.get(item.productId) : undefined);
                  return (
                    <li key={index}>
                      <span className="sa-item-thumb">{cover ? <img src={shopImageUrl(cover)} alt="" /> : null}</span>
                      <span className="sa-item-name">
                        {item.productName}
                        <small>
                          {[variantLabel(item), `${item.quantity} × ${formatFcfa(item.unitPriceFcfa)}`].filter(Boolean).join(" · ")}
                        </small>
                      </span>
                      <strong>{formatFcfa(item.lineTotalFcfa)}</strong>
                    </li>
                  );
                })}
              </ul>
              <dl className="sa-totals">
                <div>
                  <dt>{order.delivery.label}</dt>
                  <dd>{formatFcfa(order.delivery.priceFcfa)}</dd>
                </div>
                <div className="sa-total">
                  <dt>Total</dt>
                  <dd>{formatFcfa(order.totalFcfa)}</dd>
                </div>
              </dl>
            </section>

            <section className="sa-block">
              <h4>Client</h4>
              <p className="sa-client">
                <strong>{order.customer.name}</strong>
                <a href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`}>
                  <Phone size={13} /> {order.customer.phone}
                </a>
                <span>{[order.customer.address, order.customer.city, order.customer.country].filter(Boolean).join(", ")}</span>
                {order.customer.note && <em>« {order.customer.note} »</em>}
              </p>

              <h4>Paiement</h4>
              {order.proofMime ? (
                <div className="sa-proof">
                  {isImageProof && proofUrl ? (
                    <button type="button" className="sa-proof-thumb" onClick={() => setProofOpen(true)} title="Agrandir la preuve">
                      <img src={proofUrl} alt="Preuve de paiement" />
                    </button>
                  ) : (
                    <button type="button" className="sa-btn soft" disabled={!proofUrl} onClick={() => setProofOpen(true)}>
                      <FileText size={15} /> {proofUrl ? "Ouvrir la preuve (PDF)" : "Chargement…"}
                    </button>
                  )}
                  <span className="sa-muted">
                    {order.paymentMethod ? `${order.paymentMethod} · ` : ""}reçue {timeAgo(order.proofSentAt)}
                  </span>
                </div>
              ) : (
                <p className="sa-muted">Aucune preuve envoyée pour l&apos;instant.</p>
              )}

              {order.trackingNumber && (
                <>
                  <h4>Suivi</h4>
                  <p className="sa-tracking">{order.trackingNumber}</p>
                </>
              )}
              {order.status === "CANCELLED" && order.cancelReason && <p className="sa-muted">Motif : {order.cancelReason}</p>}
            </section>
          </div>

          <div className="sa-order-foot">
            <span className="sa-foot-links">
              <button type="button" className="sa-link" onClick={ticket}>
                <ReceiptText size={14} /> Ticket de caisse
              </button>
              <button type="button" className="sa-link" onClick={copyLink}>
                <Copy size={14} /> Copier le lien client
              </button>
            </span>
            {canCancel && !cancelling && (
              <button type="button" className="sa-link danger" onClick={() => setCancelling(true)}>
                Annuler la commande
              </button>
            )}
          </div>

          {cancelling && (
            <div className="sa-cancel">
              <input
                className="input-clean"
                placeholder="Motif, envoyé au client (facultatif)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="sa-btn danger"
                disabled={busy}
                onClick={() => setStatus("CANCELLED", cancelReason.trim() ? { reason: cancelReason.trim() } : {}, "Commande annulée, stock remis en vente.")}
              >
                Confirmer l&apos;annulation
              </button>
              <button type="button" className="sa-link" onClick={() => setCancelling(false)}>
                Garder la commande
              </button>
            </div>
          )}
        </div>
      )}

      {proofOpen && proofUrl && (
        <div className="sa-lightbox" onClick={() => setProofOpen(false)} role="dialog" aria-label="Preuve de paiement">
          {isImageProof ? <img src={proofUrl} alt="Preuve de paiement" /> : <iframe src={proofUrl} title="Preuve de paiement" />}
          <button type="button" className="sa-btn soft" onClick={() => setProofOpen(false)}>
            Fermer
          </button>
        </div>
      )}
    </li>
  );
}

const SHOP_ADMIN_STYLES = `
  .sa-root { display: grid; gap: 18px; padding-bottom: 60px; }
  .sa-muted { color: var(--text-muted); font-size: 0.84rem; }
  .sa-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
  .sa-tab { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border: 0; border-radius: 9999px; background: #F3EBDF; color: #3A2A21; font: inherit; font-size: 0.86rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.15s ease, color 0.15s ease; }
  .sa-tab:hover { background: #EADDCB; }
  .sa-tab.active { background: #3A2A21; color: #FFFBF4; }
  .sa-tab-link { margin-left: auto; background: transparent; border: 1px solid #EADFD3; }
  .sa-tab-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 9999px; background: #3A2A21; color: #FFFBF4; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; }
  .sa-tab.active .sa-tab-badge { background: #FFFBF4; color: #3A2A21; }

  .sa-loading { display: grid; gap: 10px; }
  .sa-loading span { height: 64px; border-radius: 18px; background: linear-gradient(90deg, #F3EBDF, #FAF5F0, #F3EBDF); background-size: 200% 100%; animation: sa-shine 1.3s infinite; }
  @keyframes sa-shine { to { background-position: -200% 0; } }

  .sa-orders { display: grid; gap: 16px; }
  .sa-toolbar { display: grid; gap: 10px; }
  .sa-search { display: flex; align-items: center; gap: 8px; max-width: 460px; min-height: 42px; padding: 0 14px; border: 1px solid var(--border-light); border-radius: 9999px; background: #FFFFFF; color: var(--text-muted); }
  .sa-search:focus-within { border-color: #6B5844; box-shadow: 0 0 0 3px rgba(107, 88, 68, 0.12); }
  .sa-search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: 0.88rem; color: var(--text-main); }
  .sa-search button { display: inline-flex; border: 0; background: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
  .sa-chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .sa-chips::-webkit-scrollbar { display: none; }
  .sa-chip { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px; border: 1px solid #EADFD3; border-radius: 9999px; background: #FFFFFF; color: #3A2A21; font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease; }
  .sa-chip:hover { background: #FAF5F0; }
  .sa-chip.active { background: #3A2A21; color: #FFFBF4; border-color: #3A2A21; }
  .sa-chip-count { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9999px; background: #F3EBDF; color: #3A2A21; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; }
  .sa-chip.active .sa-chip-count { background: #FFFBF4; }

  .sa-empty { display: grid; justify-items: center; gap: 8px; padding: 40px 20px; border: 1px dashed #E2D5C8; border-radius: 18px; color: #8C7D75; text-align: center; }
  .sa-empty p { margin: 0; max-width: 420px; font-size: 0.9rem; line-height: 1.5; }

  .sa-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .sa-order { position: relative; border-radius: 18px; background: #FFFFFF; border: 1px solid #EFE6D9; overflow: hidden; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
  .sa-order:hover { border-color: #E2D5C8; }
  .sa-order.open { border-color: #D9CBB8; box-shadow: 0 12px 30px -20px rgba(58, 42, 33, 0.4); }
  .sa-order-PROOF_SENT::before, .sa-order-CONFIRMED::before { content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px; border-radius: 0 3px 3px 0; background: #7D6A45; }
  .sa-order-CONFIRMED::before { background: #1E7A43; }
  .sa-order-head { width: 100%; display: flex; align-items: center; gap: 14px; padding: 12px 16px; border: 0; background: none; text-align: left; font: inherit; color: #1B1411; cursor: pointer; }
  .sa-order-thumb { flex-shrink: 0; width: 46px; height: 54px; border-radius: 12px; overflow: hidden; background: #F3EBDF; color: #8C7D75; display: flex; align-items: center; justify-content: center; }
  .sa-order-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sa-order-main { flex: 1; display: grid; gap: 4px; min-width: 0; }
  .sa-order-main .sa-muted { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sa-order-line { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .sa-ref { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9rem; letter-spacing: 0.01em; }
  .sa-order-side { display: grid; justify-items: end; gap: 3px; text-align: right; white-space: nowrap; }
  .sa-status { padding: 3px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; background: #F3EBDF; color: #6B5844; }
  .sa-status-PROOF_SENT { background: rgba(125, 106, 69, 0.13); color: #6F5B36; }
  .sa-status-CONFIRMED { background: #E7F3EB; color: #1E7A43; }
  .sa-status-SHIPPED { background: #EADDCB; color: #3A2A21; }
  .sa-status-DELIVERED { background: #E7F3EB; color: #1E7A43; }
  .sa-status-CANCELLED { background: #FBEAEA; color: #A12B2B; }

  .sa-order-body { display: grid; gap: 14px; padding: 0 16px 16px; }
  .sa-next { display: grid; gap: 10px; padding: 14px 16px; border-radius: 16px; background: #FAF5F0; border: 1px solid #EFE6D9; }
  .sa-next p { margin: 0; font-size: 0.9rem; font-weight: 600; color: #3A2A21; }
  .sa-next-PROOF_SENT { background: #FBF6EC; border-color: #EBDDC2; }
  .sa-next-CONFIRMED { background: #F3FAF5; border-color: #CFE8D7; }
  .sa-actions, .sa-inline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .sa-inline { flex: 1 1 100%; }
  .sa-inline .input-clean { flex: 1; min-width: 200px; }
  .sa-order-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 14px; }
  .sa-block { display: grid; gap: 10px; align-content: start; padding: 14px 16px; border: 1px solid #EFE6D9; border-radius: 16px; }
  .sa-block h4 { margin: 4px 0 0; font-size: 0.74rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #8C7D75; }
  .sa-block h4:first-child { margin-top: 0; }
  .sa-items { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .sa-items li { display: flex; align-items: center; gap: 10px; font-size: 0.88rem; }
  .sa-item-thumb { flex-shrink: 0; width: 38px; height: 46px; border-radius: 10px; overflow: hidden; background: #F3EBDF; }
  .sa-item-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sa-item-name { flex: 1; display: grid; gap: 2px; min-width: 0; font-weight: 600; }
  .sa-item-name small { color: var(--text-muted); font-weight: 500; font-size: 0.78rem; }
  .sa-items strong { white-space: nowrap; font-size: 0.88rem; }
  .sa-totals { margin: 0; padding-top: 10px; border-top: 1px solid #EFE6D9; display: grid; gap: 6px; }
  .sa-totals div { display: flex; justify-content: space-between; gap: 12px; font-size: 0.86rem; }
  .sa-totals dt { color: var(--text-muted); }
  .sa-totals dd { margin: 0; font-weight: 700; white-space: nowrap; }
  .sa-total { font-size: 1rem !important; }
  .sa-total dt { color: #1B1411 !important; font-weight: 800; }
  .sa-total dd { font-weight: 800 !important; }
  .sa-client { margin: 0; display: grid; gap: 4px; font-size: 0.88rem; line-height: 1.45; color: #3A2A21; }
  .sa-client a { display: inline-flex; align-items: center; gap: 6px; width: fit-content; color: #3A2A21; font-weight: 600; text-decoration: none; }
  .sa-client a:hover { color: #6B5844; text-decoration: underline; }
  .sa-client em { color: var(--text-muted); }
  .sa-proof { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .sa-proof-thumb { padding: 0; width: 92px; height: 116px; border: 1px solid #EADFD3; border-radius: 12px; overflow: hidden; background: #FAF5F0; cursor: zoom-in; }
  .sa-proof-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sa-tracking { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; font-size: 0.9rem; }
  .sa-order-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; }
  .sa-foot-links { display: flex; flex-wrap: wrap; gap: 4px 16px; }
  .sa-link { display: inline-flex; align-items: center; gap: 6px; padding: 6px 2px; border: 0; background: none; color: #6B5844; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
  .sa-link:hover { text-decoration: underline; }
  .sa-link.danger { color: #A12B2B; }
  .sa-cancel { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 12px 14px; border-radius: 14px; background: #FDF4F4; border: 1px solid #F0CFCF; }
  .sa-cancel .input-clean { flex: 1; min-width: 200px; }

  .sa-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px; border: 0; border-radius: 9999px; background: #3A2A21; color: #FFFBF4; font: inherit; font-size: 0.84rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.15s ease, opacity 0.15s ease; }
  .sa-btn:hover { background: #2A1E17; }
  .sa-btn.soft { background: #EADDCB; color: #3A2A21; }
  .sa-btn.soft:hover { background: #E0D1BB; }
  .sa-btn.danger { background: transparent; color: #A12B2B; border: 1px solid #F0CFCF; }
  .sa-btn.danger:hover { background: #FBEAEA; }
  .sa-btn:disabled { opacity: 0.55; cursor: wait; }
  .sa-lightbox { position: fixed; inset: 0; z-index: 100000; display: grid; place-items: center; align-content: center; gap: 12px; padding: 20px; background: rgba(28, 24, 21, 0.86); }
  .sa-lightbox img { max-width: min(720px, 92vw); max-height: 80vh; border-radius: 14px; background: #FFFFFF; }
  .sa-lightbox iframe { width: min(720px, 92vw); height: 78vh; border: 0; border-radius: 16px; background: #FFFFFF; }

  .sa-card { padding: 20px; border-radius: 20px; background: #FFFFFF; border: 1px solid #EFE6D9; display: grid; gap: 14px; align-content: start; }
  .sa-card h3 { margin: 0; font-size: 1.02rem; color: #1B1411; }
  .sa-card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
  .sa-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
  .sa-field { display: grid; gap: 5px; }
  .sa-field > span { font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); }
  .sa-hint { margin: 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; }

  @media (max-width: 760px) {
    .sa-order-grid { grid-template-columns: minmax(0, 1fr); }
  }
  .sa-actions .wa-pill { min-height: 40px; padding: 4px 16px 4px 5px; font-size: 0.84rem; }
  @media (max-width: 640px) {
    .sa-tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -2px; padding: 0 2px 2px; }
    .sa-tabs::-webkit-scrollbar { display: none; }
    .sa-tab { flex-shrink: 0; }
    .sa-root .kpi-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .sa-root .ios-metric-card { padding: 12px; gap: 8px; }
    .sa-root .metric-icon-box { width: 28px; height: 28px; min-width: 28px; min-height: 28px; }
    .sa-root .metric-card-label { gap: 7px; }
    .sa-root .metric-card-title { font-size: 0.76rem; }
    .sa-root .metric-card-value { font-size: 1.15rem; }
    .sa-root .metric-card-sub { white-space: normal; font-size: 0.68rem; }
    .sa-root .ios-trend-pill { display: none; }
    .sa-order-head { gap: 10px; padding: 12px; }
    .sa-order-thumb { width: 40px; height: 48px; }
    .sa-order-side .sa-muted { display: none; }
    .sa-order-body { padding: 0 12px 12px; }
    .sa-inline .sa-btn { width: 100%; justify-content: center; }
  }
`;
