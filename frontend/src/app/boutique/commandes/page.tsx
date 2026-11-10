"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { formatFcfa, orderPageUrl, readSavedOrders, type SavedOrder, type ShopOrder } from "@/shared/shop";

/** Les commandes passées depuis cet appareil : pas de compte à créer, le lien suffit. */
export default function MyOrdersPage() {
  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = readSavedOrders();
    setOrders(saved);
    for (const order of saved) {
      apiRequest<{ order: ShopOrder }>(
        `/api/v1/public/shop/orders/${encodeURIComponent(order.reference)}?key=${encodeURIComponent(order.key)}`,
        { retries: 0 }
      )
        .then((data) => setStatuses((s) => ({ ...s, [order.reference]: data.order.statusLabel })))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="rb-myorders">
      <h1 className="rb-title">Mes commandes</h1>
      {orders && orders.length === 0 ? (
        <div className="rb-myorders-empty">
          <p className="rb-lead">Aucune commande passée depuis cet appareil.</p>
          <Link href="/boutique" className="rb-btn">Voir la boutique</Link>
        </div>
      ) : (
        <ul>
          {(orders || []).map((order) => (
            <li key={order.reference}>
              <Link href={orderPageUrl(order.reference, order.key)}>
                <ReceiptText size={20} />
                <span className="rb-myorders-info">
                  <strong>{order.reference}</strong>
                  <span className="rb-muted">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR")} · {formatFcfa(order.totalFcfa)}
                  </span>
                </span>
                <span className="rb-myorders-status">{statuses[order.reference] || "…"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rb-myorders { padding-top: 10px; }
        .rb-myorders ul { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 10px; }
        .rb-myorders a { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 20px; background: #FFFFFF; border: 1px solid #EADFD3; color: #3A2A21; text-decoration: none; }
        .rb-myorders-info { flex: 1; display: grid; gap: 2px; }
        .rb-myorders-status { font-size: 0.84rem; font-weight: 700; color: #6B5844; text-align: right; }
        .rb-myorders-empty { display: grid; justify-items: start; gap: 14px; padding: 20px 0; }
      `,
        }}
      />
    </div>
  );
}
