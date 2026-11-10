"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { useShop } from "@/shared/useShop";
import {
  formatFcfa,
  orderPageUrl,
  productPrice,
  saveOrder,
  shopImageUrl,
  variantLabel,
  type DeliveryOption,
} from "@/shared/shop";

export default function CartPage() {
  const router = useRouter();
  const { catalog, cart, cartLines, setQuantity, removeFromCart, clearCart } = useShop();

  const [form, setForm] = useState({ name: "", phone: "", country: "", city: "", address: "", note: "" });
  const [options, setOptions] = useState<DeliveryOption[] | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [deliveryId, setDeliveryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Une même tentative garde sa clé : un double clic ne crée pas deux commandes.
  const attemptKey = useRef(`shop-${crypto.randomUUID()}`);

  // Un article retiré de la vente ou un stock épuisé : le panier se corrige tout seul.
  const removedCount = catalog ? cart.length - cartLines.length : 0;
  useEffect(() => {
    if (!catalog) return;
    for (const line of cart) {
      const found = cartLines.find((l) => l.variantId === line.variantId);
      if (!found) removeFromCart(line.variantId);
      else if (line.quantity > found.variant.stock) setQuantity(line.variantId, found.variant.stock);
    }
  }, [catalog, cart, cartLines, removeFromCart, setQuantity]);

  useEffect(() => {
    if (!form.country && catalog?.countries.length) {
      setForm((f) => ({ ...f, country: catalog.countries.includes("Côte d'Ivoire") ? "Côte d'Ivoire" : catalog.countries[0] }));
    }
  }, [catalog, form.country]);

  const itemsKey = cartLines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  useEffect(() => {
    if (!form.country || cartLines.length === 0) {
      setOptions(null);
      return;
    }
    let alive = true;
    const timer = setTimeout(() => {
      setOptionsLoading(true);
      apiRequest<{ options: DeliveryOption[] }>("/api/v1/public/shop/delivery-options", {
        method: "POST",
        retries: 1,
        body: {
          items: cartLines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          country: form.country,
          city: form.city,
        },
      })
        .then((data) => {
          if (!alive) return;
          setOptions(data.options);
          setDeliveryId((current) => (data.options.some((o) => o.id === current) ? current : data.options[0]?.id || ""));
        })
        .catch(() => alive && setOptions([]))
        .finally(() => alive && setOptionsLoading(false));
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country, form.city, itemsKey]);

  const itemsTotal = useMemo(
    () => cartLines.reduce((sum, l) => sum + productPrice(l.product) * l.quantity, 0),
    [cartLines]
  );
  const delivery = options?.find((o) => o.id === deliveryId) || null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) {
      setError("Choisissez un mode de livraison.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiRequest<{ reference: string; accessKey: string; totalFcfa: number }>(
        "/api/v1/public/shop/orders",
        {
          method: "POST",
          retries: 1,
          body: {
            idempotencyKey: attemptKey.current,
            customer: form,
            items: cartLines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
            deliveryOptionId: delivery.id,
          },
        }
      );
      saveOrder({ reference: data.reference, key: data.accessKey, totalFcfa: data.totalFcfa, createdAt: new Date().toISOString() });
      clearCart();
      router.push(orderPageUrl(data.reference, data.accessKey));
    } catch (err: any) {
      setError(err?.message || "La commande n'a pas pu être envoyée. Réessayez.");
      setSubmitting(false);
    }
  };

  if (catalog && cartLines.length === 0) {
    return (
      <div className="rb-cart-empty">
        <ShoppingBag size={34} />
        <h1 className="rb-title">Votre panier est vide</h1>
        {removedCount > 0 && <p className="rb-lead">Un article de votre panier n&apos;est plus en vente.</p>}
        <Link href="/boutique" className="rb-btn">
          Voir la boutique
        </Link>
        <style dangerouslySetInnerHTML={{ __html: `.rb-cart-empty{display:grid;justify-items:start;gap:14px;padding:40px 0;color:#3A2A21}` }} />
      </div>
    );
  }

  return (
    <form className="rb-checkout" onSubmit={submit}>
      <div className="rb-checkout-main">
        <h1 className="rb-title">Votre panier</h1>

        <ul className="rb-lines">
          {cartLines.map((line) => (
            <li key={line.variantId} className="rb-line">
              <Link href={`/boutique/article/${line.product.id}`} className="rb-line-photo">
                {line.product.images[0] && <img src={shopImageUrl(line.product.images[0])} alt="" />}
              </Link>
              <div className="rb-line-info">
                <strong>{line.product.name}</strong>
                {variantLabel(line.variant) && <span className="rb-muted">{variantLabel(line.variant)}</span>}
                <span className="rb-price">{formatFcfa(productPrice(line.product) * line.quantity)}</span>
              </div>
              <div className="rb-line-actions">
                <div className="rb-stepper">
                  <button type="button" onClick={() => setQuantity(line.variantId, line.quantity - 1)} aria-label="Moins">
                    <Minus size={15} />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                    disabled={line.quantity >= line.variant.stock}
                    aria-label="Plus"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button type="button" className="rb-line-remove" onClick={() => removeFromCart(line.variantId)}>
                  <Trash2 size={15} />
                  <span>Retirer</span>
                </button>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="rb-step">Vos coordonnées</h2>
        <div className="rb-two">
          <div className="rb-field">
            <label className="rb-label" htmlFor="rb-name">Nom complet</label>
            <input id="rb-name" className="rb-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </div>
          <div className="rb-field">
            <label className="rb-label" htmlFor="rb-phone">Numéro WhatsApp</label>
            <input id="rb-phone" className="rb-input" required type="tel" placeholder="+225 07 00 00 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
          </div>
        </div>

        <h2 className="rb-step">Livraison</h2>
        <div className="rb-two">
          <div className="rb-field">
            <label className="rb-label" htmlFor="rb-country">Pays</label>
            <select id="rb-country" className="rb-select" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              {(catalog?.countries || []).map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="rb-field">
            <label className="rb-label" htmlFor="rb-city">Ville</label>
            <input id="rb-city" className="rb-input" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} autoComplete="address-level2" />
          </div>
        </div>
        <div className="rb-field">
          <label className="rb-label" htmlFor="rb-address">Quartier, adresse ou point de repère</label>
          <input id="rb-address" className="rb-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} autoComplete="street-address" />
        </div>

        <div className="rb-delivery" role="radiogroup" aria-label="Mode de livraison">
          {optionsLoading && !options ? (
            <p className="rb-muted">Calcul des frais de livraison…</p>
          ) : options && options.length === 0 ? (
            <p className="rb-muted">Aucune livraison n&apos;est encore proposée vers ce pays. Écrivez-nous sur WhatsApp.</p>
          ) : (
            options?.map((option) => (
              <label key={option.id} className={`rb-delivery-option ${deliveryId === option.id ? "active" : ""}`}>
                <input type="radio" name="delivery" checked={deliveryId === option.id} onChange={() => setDeliveryId(option.id)} />
                <Truck size={18} />
                <span className="rb-delivery-text">
                  <strong>{option.label}</strong>
                  {option.delay && <span className="rb-muted">{option.delay}</span>}
                </span>
                <span className="rb-delivery-price">{formatFcfa(option.priceFcfa)}</span>
              </label>
            ))
          )}
        </div>

        <div className="rb-field">
          <label className="rb-label" htmlFor="rb-note">Un mot pour la boutique (facultatif)</label>
          <textarea id="rb-note" className="rb-textarea" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </div>

      <aside className="rb-summary">
        <h2>Récapitulatif</h2>
        <dl>
          <div><dt>Articles</dt><dd>{formatFcfa(itemsTotal)}</dd></div>
          <div><dt>Livraison</dt><dd>{delivery ? formatFcfa(delivery.priceFcfa) : "—"}</dd></div>
          <div className="rb-summary-total"><dt>Total</dt><dd>{formatFcfa(itemsTotal + (delivery?.priceFcfa || 0))}</dd></div>
        </dl>
        {error && <p className="rb-error">{error}</p>}
        <button type="submit" className="rb-btn rb-btn-block" disabled={submitting || !delivery || cartLines.length === 0}>
          {submitting ? "Envoi…" : "Commander et payer"}
        </button>
        <p className="rb-muted rb-summary-note">
          Vous payez ensuite par Wave, Orange Money ou compte Maroc, puis vous envoyez la preuve. Votre commande est confirmée dès la vérification.
        </p>
      </aside>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rb-checkout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 36px; align-items: start; padding-top: 10px; }
        .rb-lines { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 14px; }
        .rb-line { display: grid; grid-template-columns: 84px minmax(0, 1fr) auto; gap: 14px; align-items: center; padding-bottom: 14px; border-bottom: 1px solid #EADFD3; }
        .rb-line-photo { width: 84px; height: 100px; border-radius: 16px; overflow: hidden; background: #EFE6D9; }
        .rb-line-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rb-line-info { display: grid; gap: 3px; min-width: 0; }
        .rb-line-info strong { font-size: 0.98rem; }
        .rb-line-actions { display: grid; justify-items: end; gap: 6px; }
        .rb-line-remove { display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; color: #716C65; font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
        .rb-stepper { display: inline-flex; align-items: center; min-height: 42px; border-radius: 9999px; background: #FFFFFF; border: 1px solid #EADFD3; }
        .rb-stepper button { width: 38px; height: 40px; border: 0; background: none; color: #3A2A21; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .rb-stepper button:disabled { color: #C9BFB6; cursor: not-allowed; }
        .rb-stepper span { min-width: 22px; text-align: center; font-weight: 800; }
        .rb-step { margin: 26px 0 12px; font-size: 1.1rem; }
        .rb-two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
        .rb-delivery { display: grid; gap: 10px; margin: 4px 0 18px; }
        .rb-delivery-option { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border: 1px solid #EADFD3; border-radius: 20px; background: #FFFFFF; cursor: pointer; }
        .rb-delivery-option.active { border-color: #3A2A21; box-shadow: inset 0 0 0 1px #3A2A21; }
        .rb-delivery-option input { accent-color: #3A2A21; }
        .rb-delivery-text { flex: 1; display: grid; gap: 2px; font-size: 0.92rem; }
        .rb-delivery-price { font-weight: 800; white-space: nowrap; }
        .rb-summary { position: sticky; top: 90px; display: grid; gap: 14px; padding: 22px; border-radius: 24px; background: linear-gradient(165deg, #FFFDF9, #FBF3E8); border: 1px solid #EFE6D9; }
        .rb-summary h2 { margin: 0; font-size: 1.1rem; }
        .rb-summary dl { margin: 0; display: grid; gap: 10px; }
        .rb-summary dl div { display: flex; justify-content: space-between; gap: 10px; }
        .rb-summary dt { color: #5C4F48; }
        .rb-summary dd { margin: 0; font-weight: 700; }
        .rb-summary-total { padding-top: 10px; border-top: 1px solid #EADFD3; font-size: 1.1rem; }
        .rb-summary-total dd { font-weight: 800; }
        .rb-summary-note { margin: 0; font-size: 0.82rem; line-height: 1.5; }
        @media (max-width: 860px) {
          .rb-checkout { grid-template-columns: 1fr; }
          .rb-summary { position: static; }
        }
        @media (max-width: 560px) {
          .rb-two { grid-template-columns: 1fr; }
          .rb-line { grid-template-columns: 70px minmax(0, 1fr); }
          .rb-line-photo { width: 70px; height: 84px; }
          .rb-line-actions { grid-column: 2; justify-items: start; grid-auto-flow: column; align-items: center; gap: 14px; }
        }
      `,
        }}
      />
    </form>
  );
}
