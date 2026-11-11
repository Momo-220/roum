"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Lock, Minus, Plus, ShoppingBag, Truck, Wallet } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { useShop } from "@/shared/useShop";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { siteLines } from "@/shared/siteContent";
import { ProductCard, PRODUCT_CARD_STYLES } from "@/components/shop/ProductCard";
import {
  colorSwatch,
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
  const { settings } = usePublicCatalog();
  const highlights = siteLines(settings, "boutique_highlights").slice(0, 3);

  const [form, setForm] = useState({ name: "", phone: "", country: "", city: "", address: "", note: "" });
  const [options, setOptions] = useState<DeliveryOption[] | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [deliveryId, setDeliveryId] = useState("");
  // Tant que le client n'a rien choisi, la livraison suit sa ville (la zone de sa ville passe en premier).
  const deliveryChosen = useRef(false);
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
          setDeliveryId((current) =>
            deliveryChosen.current && data.options.some((o) => o.id === current) ? current : data.options[0]?.id || ""
          );
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
    const suggestions = catalog.products.filter((p) => p.images.length > 0 && p.variants.some((v) => v.stock > 0)).slice(0, 4);
    return (
      <div className="ct-empty">
        <span className="ct-empty-icon">
          <ShoppingBag size={26} strokeWidth={1.6} />
        </span>
        <h1 className="rb-title">Votre panier est vide</h1>
        <p className="rb-lead">{removedCount > 0 ? "Un article de votre panier n'est plus en vente." : "Choisissez un article, sa taille et sa couleur : il vous attendra ici."}</p>
        <Link href="/boutique" className="rb-btn">
          Voir la boutique
        </Link>
        {suggestions.length > 0 && (
          <section className="ct-suggest">
            <h2>À découvrir</h2>
            <div className="ct-suggest-grid">
              {suggestions.map((p) => (
                <ProductCard key={p.id} product={p} categoryName={catalog.categories.find((c) => c.id === p.categoryId)?.name} />
              ))}
            </div>
          </section>
        )}
        <style dangerouslySetInnerHTML={{ __html: PRODUCT_CARD_STYLES + CART_STYLES }} />
      </div>
    );
  }

  const pieces = cartLines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <form className="ct" onSubmit={submit}>
      <div className="ct-top">
        <Link href="/boutique" className="ct-back">
          <ArrowLeft size={16} /> Continuer mes achats
        </Link>
        <span className="rb-kicker">Panier</span>
        <h1 className="rb-title">Votre commande</h1>
      </div>

      <div className="ct-grid">
        <div className="ct-main">
          <section className="ct-section">
            <div className="ct-section-head">
              <h2>
                <span>01</span> Vos articles
              </h2>
              <span className="ct-count">
                {pieces} pièce{pieces > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="ct-lines">
              {cartLines.map((line) => {
                const hex = line.variant.color ? colorSwatch(line.variant.color) : null;
                return (
                  <li key={line.variantId} className="ct-line">
                    <Link href={`/boutique/article/${line.product.id}`} className="ct-photo">
                      {line.product.images[0] && <img src={shopImageUrl(line.product.images[0])} alt="" />}
                    </Link>
                    <div className="ct-line-info">
                      <Link href={`/boutique/article/${line.product.id}`} className="ct-name">
                        {line.product.name}
                      </Link>
                      {variantLabel(line.variant) && (
                        <span className="ct-variant">
                          {hex && <i style={{ background: hex }} />}
                          {variantLabel(line.variant)}
                        </span>
                      )}
                      <span className="ct-unit">{formatFcfa(productPrice(line.product))} l&apos;unité</span>
                      <div className="ct-line-actions">
                        <div className="ct-stepper" aria-label="Quantité">
                          <button type="button" onClick={() => setQuantity(line.variantId, line.quantity - 1)} aria-label="Moins">
                            <Minus size={14} />
                          </button>
                          <span>{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                            disabled={line.quantity >= line.variant.stock}
                            aria-label="Plus"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button type="button" className="ct-remove" onClick={() => removeFromCart(line.variantId)}>
                          Retirer
                        </button>
                      </div>
                    </div>
                    <strong className="ct-line-total">{formatFcfa(productPrice(line.product) * line.quantity)}</strong>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ct-section">
            <div className="ct-section-head">
              <h2>
                <span>02</span> Vos coordonnées
              </h2>
            </div>
            <div className="ct-two">
              <div className="rb-field">
                <label className="rb-label" htmlFor="rb-name">Nom complet</label>
                <input id="rb-name" className="rb-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              </div>
              <div className="rb-field">
                <label className="rb-label" htmlFor="rb-phone">Numéro WhatsApp</label>
                <input id="rb-phone" className="rb-input" required type="tel" placeholder="+225 07 00 00 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              </div>
            </div>
          </section>

          <section className="ct-section">
            <div className="ct-section-head">
              <h2>
                <span>03</span> Livraison
              </h2>
            </div>
            <div className="ct-two">
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

            <div className="ct-delivery" role="radiogroup" aria-label="Mode de livraison">
              {optionsLoading && !options ? (
                <p className="rb-muted">Calcul des frais de livraison…</p>
              ) : options && options.length === 0 ? (
                <p className="rb-muted">Aucune livraison n&apos;est encore proposée vers ce pays. Écrivez-nous sur WhatsApp.</p>
              ) : (
                options?.map((option) => (
                  <label key={option.id} className={`ct-option ${deliveryId === option.id ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryId === option.id}
                      onChange={() => {
                        deliveryChosen.current = true;
                        setDeliveryId(option.id);
                      }}
                    />
                    <span className="ct-radio" aria-hidden="true" />
                    <span className="ct-option-text">
                      <strong>{option.label}</strong>
                      {option.delay && <span>{option.delay}</span>}
                    </span>
                    <span className="ct-option-price">{formatFcfa(option.priceFcfa)}</span>
                  </label>
                ))
              )}
            </div>

            <div className="rb-field">
              <label className="rb-label" htmlFor="rb-note">Un mot pour la boutique (facultatif)</label>
              <textarea id="rb-note" className="rb-textarea" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </section>
        </div>

        <aside className="ct-summary">
          <h2>Récapitulatif</h2>
          <dl>
            <div>
              <dt>Articles ({pieces})</dt>
              <dd>{formatFcfa(itemsTotal)}</dd>
            </div>
            <div>
              <dt>Livraison</dt>
              <dd>{delivery ? formatFcfa(delivery.priceFcfa) : "—"}</dd>
            </div>
            <div className="ct-total">
              <dt>Total</dt>
              <dd>{formatFcfa(itemsTotal + (delivery?.priceFcfa || 0))}</dd>
            </div>
          </dl>
          {error && <p className="rb-error">{error}</p>}
          <button type="submit" className="rb-btn rb-btn-block" disabled={submitting || !delivery || cartLines.length === 0}>
            <Lock size={16} />
            {submitting ? "Envoi…" : "Commander et payer"}
          </button>
          <p className="ct-summary-note">Vous payez juste après, puis vous envoyez la capture du paiement. La boutique confirme dès la vérification.</p>
          {highlights.length > 0 && (
            <ul className="ct-highlights">
              {highlights.map((text, index) => {
                const Icon = [Wallet, Truck, BadgeCheck][index % 3];
                return (
                  <li key={text}>
                    <Icon size={15} strokeWidth={1.8} />
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: CART_STYLES }} />
    </form>
  );
}

const CART_STYLES = `
  .ct { display: grid; grid-template-columns: minmax(0, 1fr); gap: 30px; }
  .ct-top { display: flex; flex-direction: column; align-items: flex-start; }
  .ct-back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 22px; color: var(--c-text-muted); font-size: 0.9rem; font-weight: 600; text-decoration: none; }
  .ct-back:hover { color: var(--c-accent); }
  .ct-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 48px; align-items: start; }
  .ct-main { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; min-width: 0; }
  .ct-section { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .ct-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #EADFD3; }
  .rb-root .ct-section-head h2 { display: flex; align-items: baseline; gap: 12px; margin: 0; color: var(--c-text-main); font-family: var(--c-font-display); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.025em; }
  .ct-section-head h2 span { font-family: var(--c-font-mono); font-size: 0.74rem; font-weight: 700; letter-spacing: 0.08em; color: var(--c-accent); }
  .ct-count { font-family: var(--c-font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-text-light); }

  .ct-lines { list-style: none; margin: 0; padding: 0; display: grid; }
  .ct-line { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 18px; align-items: start; padding: 16px 0; border-bottom: 1px solid #F3EBDF; }
  .ct-line:last-child { border-bottom: 0; }
  .ct-photo { display: block; width: 96px; aspect-ratio: 4 / 5; border-radius: 16px; overflow: hidden; background: #F3EBDF; }
  .ct-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ct-line-info { display: grid; gap: 4px; align-content: start; min-width: 0; }
  .ct-name { color: var(--c-text-main); font-size: 1rem; font-weight: 700; text-decoration: none; }
  .ct-name:hover { text-decoration: underline; text-underline-offset: 3px; }
  .ct-variant { display: inline-flex; align-items: center; gap: 7px; color: var(--c-text-muted); font-size: 0.88rem; }
  .ct-variant i { width: 11px; height: 11px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(27, 20, 17, 0.14); }
  .ct-unit { color: var(--c-text-light); font-size: 0.82rem; }
  .ct-line-actions { display: flex; align-items: center; gap: 16px; margin-top: 8px; }
  .ct-stepper { display: inline-flex; align-items: center; min-height: 40px; border: 1px solid #DCCDB6; border-radius: 9999px; background: #FFFFFF; box-sizing: border-box; }
  .ct-stepper button { width: 36px; height: 38px; border: 0; background: none; color: #3A2A21; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .ct-stepper button:disabled { color: #C9BFB6; cursor: not-allowed; }
  .ct-stepper span { min-width: 20px; text-align: center; font-weight: 800; font-variant-numeric: tabular-nums; }
  .ct-remove { padding: 4px 0; border: 0; background: none; color: var(--c-text-light); font: inherit; font-size: 0.84rem; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .ct-remove:hover { color: #A12B2B; }
  .ct-line-total { font-size: 1rem; font-weight: 800; color: var(--c-text-main); white-space: nowrap; font-variant-numeric: tabular-nums; }

  .ct-two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
  .ct-delivery { display: grid; gap: 10px; margin: 2px 0 18px; }
  .ct-option { position: relative; display: flex; align-items: center; gap: 14px; padding: 16px 20px; border: 1px solid #DCCDB6; border-radius: 22px; background: transparent; color: var(--c-text-muted); cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease; }
  .ct-option:hover { background: #FAF5F0; }
  .ct-option.active, .ct-option.active:hover { border-color: #6B5844; background: #FFFBF4; box-shadow: inset 0 0 0 1px #6B5844; }
  .ct-option input { position: absolute; opacity: 0; pointer-events: none; }
  .ct-radio { flex-shrink: 0; width: 18px; height: 18px; border: 1.5px solid #B8ABA3; border-radius: 50%; box-sizing: border-box; transition: border 0.15s ease; }
  .ct-option.active .ct-radio { border: 5px solid #3A2A21; }
  .ct-option input:focus-visible + .ct-radio { box-shadow: 0 0 0 3px rgba(107, 88, 68, 0.2); }
  .ct-option-text { flex: 1; display: grid; gap: 2px; min-width: 0; }
  .ct-option-text strong { color: var(--c-text-main); font-size: 0.95rem; font-weight: 700; }
  .ct-option-text span { font-size: 0.84rem; }
  .ct-option-price { color: var(--c-text-main); font-weight: 800; white-space: nowrap; font-variant-numeric: tabular-nums; }

  .ct-summary { position: sticky; top: 24px; display: grid; gap: 16px; padding: 26px; border: 1px solid #EFE6D9; border-radius: 30px; background: linear-gradient(180deg, #FFFDF9 0%, #FBF3E8 100%); }
  .rb-root .ct-summary h2 { margin: 0; color: var(--c-text-main); font-family: var(--c-font-display); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.025em; }
  .ct-summary dl { margin: 0; display: grid; gap: 10px; }
  .ct-summary dl div { display: flex; justify-content: space-between; gap: 10px; font-size: 0.94rem; }
  .ct-summary dt { color: var(--c-text-muted); }
  .ct-summary dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
  .ct-total { padding-top: 12px; border-top: 1px solid #EADFD3; font-size: 1.15rem !important; }
  .ct-total dt { color: var(--c-text-main) !important; font-weight: 800; }
  .ct-total dd { font-weight: 800; }
  .ct-summary-note { margin: 0; color: var(--c-text-light); font-size: 0.82rem; line-height: 1.5; }
  .ct-highlights { list-style: none; display: grid; gap: 9px; margin: 0; padding: 16px 0 0; border-top: 1px solid #EADFD3; }
  .ct-highlights li { display: flex; align-items: center; gap: 10px; color: var(--c-text-muted); font-size: 0.84rem; }
  .ct-highlights svg { flex-shrink: 0; color: var(--c-accent); }

  .ct-empty { display: grid; justify-items: start; gap: 14px; padding: 12px 0 20px; }
  .ct-empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #F3EBDF; color: #6B5844; }
  .ct-empty .rb-title { margin: 6px 0 0; }
  .ct-empty .rb-btn { margin-top: 8px; }
  .ct-suggest { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; width: 100%; margin-top: 48px; }
  .rb-root .ct-suggest h2 { margin: 0; padding-bottom: 14px; border-bottom: 1px solid #EADFD3; color: var(--c-text-main); font-family: var(--c-font-display); font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; }
  .ct-suggest-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px 20px; }

  @media (max-width: 960px) {
    .ct-grid { grid-template-columns: minmax(0, 1fr); gap: 32px; }
    .ct-summary { position: static; }
    .ct-suggest-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
  }
  @media (max-width: 560px) {
    .ct-two { grid-template-columns: 1fr; }
    .ct-line { grid-template-columns: 78px minmax(0, 1fr); gap: 14px; }
    .ct-photo { width: 78px; }
    .ct-line-total { grid-column: 2; }
    .ct-summary { padding: 22px; border-radius: 26px; }
  }
`;
