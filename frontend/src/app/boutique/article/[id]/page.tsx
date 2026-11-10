"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useShop } from "@/shared/useShop";
import { discountPercent, formatFcfa, productPrice, shopImageUrl, type ShopVariant } from "@/shared/shop";

const uniq = (values: string[]) => [...new Set(values.filter(Boolean))];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { catalog, loadError, addToCart, cart } = useShop();
  const product = catalog?.products.find((p) => p.id === id) || null;

  const [photo, setPhoto] = useState(0);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const colors = useMemo(() => uniq(product?.variants.map((v) => v.color) || []), [product]);
  const sizes = useMemo(() => uniq(product?.variants.map((v) => v.size) || []), [product]);

  // Première couleur disponible choisie d'office.
  useEffect(() => {
    if (!product || color || colors.length === 0) return;
    setColor(colors.find((c) => product.variants.some((v) => v.color === c && v.stock > 0)) || colors[0]);
  }, [product, colors, color]);

  const stockFor = (c: string, s: string) =>
    product?.variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;

  const variant: ShopVariant | null = useMemo(() => {
    if (!product) return null;
    if (colors.length > 0 && !color) return null;
    if (sizes.length > 0 && !size) return null;
    return product.variants.find((v) => v.color === (colors.length ? color : "") && v.size === (sizes.length ? size : "")) || null;
  }, [product, colors, sizes, color, size]);

  const inCart = variant ? cart.find((l) => l.variantId === variant.id)?.quantity || 0 : 0;
  const available = variant ? Math.max(0, variant.stock - inCart) : 0;

  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, available || 1)));
  }, [available]);

  if (!catalog) {
    return loadError ? <p className="rb-error">{loadError}</p> : <div className="rb-product-loading" />;
  }
  if (!product) {
    return (
      <div className="rb-notfound">
        <h1 className="rb-title">Cet article n&apos;est plus en vente.</h1>
        <Link href="/boutique" className="rb-btn">
          Voir la boutique
        </Link>
      </div>
    );
  }

  const discount = discountPercent(product);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const handleAdd = () => {
    if (!variant || available <= 0) return;
    addToCart(variant.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="rb-product">
      <Link href="/boutique" className="rb-back">
        <ChevronLeft size={17} />
        <span>Boutique</span>
      </Link>

      <div className="rb-product-grid">
        <div className="rb-gallery">
          <div className="rb-gallery-main">
            {product.images.length > 0 ? (
              <img src={shopImageUrl(product.images[Math.min(photo, product.images.length - 1)])} alt={product.name} />
            ) : (
              <span className="rb-card-nophoto">Photo bientôt</span>
            )}
            {discount ? <span className="rb-badge rb-badge-promo rb-gallery-badge">-{discount} %</span> : null}
          </div>
          {product.images.length > 1 && (
            <div className="rb-thumbs">
              {product.images.map((imageId, index) => (
                <button
                  key={imageId}
                  type="button"
                  className={`rb-thumb ${index === photo ? "active" : ""}`}
                  onClick={() => setPhoto(index)}
                  aria-label={`Photo ${index + 1}`}
                >
                  <img src={shopImageUrl(imageId)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rb-info">
          <h1 className="rb-product-name">{product.name}</h1>
          <div className="rb-price rb-product-price">
            {formatFcfa(productPrice(product))}
            {product.promoPriceFcfa !== null && <s>{formatFcfa(product.priceFcfa)}</s>}
          </div>
          {product.promoEndsAt && (
            <p className="rb-muted rb-small">
              Promotion jusqu&apos;au {new Date(`${product.promoEndsAt}T12:00:00`).toLocaleDateString("fr-FR")}
            </p>
          )}

          {colors.length > 0 && (
            <div className="rb-option">
              <span className="rb-label">Couleur{color ? ` : ${color}` : ""}</span>
              <div className="rb-pills">
                {colors.map((c) => {
                  const out = product.variants.filter((v) => v.color === c).every((v) => v.stock <= 0);
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`rb-pill ${color === c ? "active" : ""} ${out ? "out" : ""}`}
                      onClick={() => {
                        setColor(c);
                        if (size && stockFor(c, size) <= 0) setSize("");
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="rb-option">
              <span className="rb-label">Taille{size ? ` : ${size}` : ""}</span>
              <div className="rb-pills">
                {sizes.map((s) => {
                  const stock = stockFor(colors.length ? color : "", s);
                  const exists = product.variants.some((v) => v.size === s && v.color === (colors.length ? color : ""));
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!exists || stock <= 0}
                      className={`rb-pill rb-pill-size ${size === s ? "active" : ""}`}
                      onClick={() => setSize(s)}
                      title={stock <= 0 ? "Épuisé" : undefined}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="rb-stock">
            {totalStock <= 0
              ? "Rupture de stock"
              : !variant
              ? sizes.length > 0
                ? "Choisissez votre taille"
                : "Choisissez une couleur"
              : variant.stock <= 0
              ? "Épuisé dans cette version"
              : variant.stock <= 3
              ? `Plus que ${variant.stock} en stock`
              : "En stock"}
          </p>

          <div className="rb-buy">
            <div className="rb-stepper" aria-label="Quantité">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Moins">
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(available || 1, q + 1))}
                disabled={quantity >= available}
                aria-label="Plus"
              >
                <Plus size={16} />
              </button>
            </div>
            <button type="button" className="rb-btn rb-buy-btn" disabled={!variant || available <= 0} onClick={handleAdd}>
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              <span>{added ? "Ajouté au panier" : "Ajouter au panier"}</span>
            </button>
          </div>
          {variant && inCart > 0 && available <= 0 && (
            <p className="rb-muted rb-small">Tout le stock de cette version est déjà dans votre panier.</p>
          )}
          {inCart > 0 || added ? (
            <Link href="/boutique/panier" className="rb-btn rb-btn-soft rb-btn-block">
              Voir le panier et commander
            </Link>
          ) : null}

          {product.description && <p className="rb-description">{product.description}</p>}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rb-back { display: inline-flex; align-items: center; gap: 4px; margin: 6px 0 16px; color: #6B5844; font-weight: 700; text-decoration: none; }
        .rb-product-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 40px; align-items: start; }
        .rb-gallery-main { position: relative; aspect-ratio: 4 / 5; border-radius: 26px; overflow: hidden; background: #EFE6D9; }
        .rb-gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rb-gallery-badge { position: absolute; top: 14px; left: 14px; }
        .rb-card-nophoto { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #8C7D75; }
        .rb-thumbs { display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; }
        .rb-thumb { flex-shrink: 0; width: 72px; height: 88px; padding: 0; border: 2px solid transparent; border-radius: 14px; overflow: hidden; background: #EFE6D9; cursor: pointer; }
        .rb-thumb.active { border-color: #3A2A21; }
        .rb-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rb-info { display: grid; gap: 14px; position: sticky; top: 90px; }
        .rb-product-name { margin: 0; font-family: var(--c-font-display); font-size: clamp(1.6rem, 4vw, 2.3rem); line-height: 1.12; letter-spacing: -0.02em; }
        .rb-product-price { font-size: 1.4rem; }
        .rb-small { margin: -6px 0 0; font-size: 0.86rem; }
        .rb-option { display: grid; gap: 4px; }
        .rb-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .rb-pill { min-height: 42px; min-width: 48px; padding: 0 16px; border: 1px solid #EADFD3; border-radius: 9999px; background: #FFFFFF; color: #3A2A21; font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; }
        .rb-pill.active { background: #3A2A21; border-color: #3A2A21; color: #FFFBF4; }
        .rb-pill.out:not(.active) { color: #B8ABA3; }
        .rb-pill:disabled { color: #C9BFB6; background: #F5EFE8; text-decoration: line-through; cursor: not-allowed; }
        .rb-stock { margin: 0; font-weight: 700; color: #6B5844; }
        .rb-buy { display: flex; gap: 10px; align-items: center; }
        .rb-stepper { display: inline-flex; align-items: center; min-height: 48px; border-radius: 9999px; background: #FFFFFF; border: 1px solid #EADFD3; }
        .rb-stepper button { width: 44px; height: 46px; border: 0; background: none; color: #3A2A21; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .rb-stepper button:disabled { color: #C9BFB6; cursor: not-allowed; }
        .rb-stepper span { min-width: 26px; text-align: center; font-weight: 800; }
        .rb-buy-btn { flex: 1; }
        .rb-description { margin: 6px 0 0; padding-top: 16px; border-top: 1px solid #EADFD3; color: #5C4F48; line-height: 1.6; white-space: pre-line; }
        .rb-product-loading { height: 60vh; }
        .rb-notfound { display: grid; gap: 16px; justify-items: start; padding: 40px 0; }
        @media (max-width: 820px) {
          .rb-product-grid { grid-template-columns: 1fr; gap: 22px; }
          .rb-info { position: static; }
          .rb-gallery-main { border-radius: 22px; }
        }
      `,
        }}
      />
    </div>
  );
}
