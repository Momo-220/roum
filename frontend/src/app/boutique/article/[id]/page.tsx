"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, Minus, Plus, ShoppingBag, Truck, Wallet } from "lucide-react";
import { useShop } from "@/shared/useShop";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { siteLines } from "@/shared/siteContent";
import { colorSwatch, discountPercent, formatFcfa, productPrice, shopImageUrl, type ShopVariant } from "@/shared/shop";
import { ProductCard, PRODUCT_CARD_STYLES } from "@/components/shop/ProductCard";
import { RoumBoutiqueLogo } from "@/components/shop/RoumBoutiqueLogo";

const uniq = (values: string[]) => [...new Set(values.filter(Boolean))];
const HIGHLIGHT_ICONS = [Wallet, Truck, BadgeCheck];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { catalog, loadError, addToCart, cart } = useShop();
  const { settings } = usePublicCatalog();
  const product = catalog?.products.find((p) => p.id === id) || null;

  const [photo, setPhoto] = useState(0);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const slides = useRef<HTMLDivElement | null>(null);

  const colors = useMemo(() => uniq(product?.variants.map((v) => v.color) || []), [product]);
  const sizes = useMemo(() => uniq(product?.variants.map((v) => v.size) || []), [product]);

  // Première couleur disponible choisie d'office.
  useEffect(() => {
    if (!product || color || colors.length === 0) return;
    setColor(colors.find((c) => product.variants.some((v) => v.color === c && v.stock > 0)) || colors[0]);
  }, [product, colors, color]);

  const stockFor = (c: string, s: string) => product?.variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;

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

  const related = useMemo(() => {
    if (!catalog || !product) return [];
    const others = catalog.products.filter((p) => p.id !== product.id);
    return [...others.filter((p) => p.categoryId === product.categoryId), ...others.filter((p) => p.categoryId !== product.categoryId)].slice(0, 4);
  }, [catalog, product]);

  const showPhoto = (index: number) => {
    setPhoto(index);
    const el = slides.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  if (!catalog) {
    return loadError ? <p className="rb-error">{loadError}</p> : <div className="ap-loading" />;
  }
  if (!product) {
    return (
      <div className="ap-missing">
        <h1 className="rb-title">Cet article n&apos;est plus en vente.</h1>
        <Link href="/boutique" className="rb-btn">
          Voir la boutique
        </Link>
      </div>
    );
  }

  const discount = discountPercent(product);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const category = catalog.categories.find((c) => c.id === product.categoryId);
  const highlights = siteLines(settings, "boutique_highlights").slice(0, 3);
  const lowStock = variant && variant.stock > 0 && variant.stock <= 3;

  const handleAdd = () => {
    if (!variant || available <= 0) return;
    addToCart(variant.id, quantity);
    setAdded(true);
  };

  return (
    <div className="ap">
      <nav className="ap-crumbs" aria-label="Fil d'Ariane">
        <Link href="/boutique">Boutique</Link>
        {category && (
          <>
            <span>/</span>
            <span>{category.name}</span>
          </>
        )}
      </nav>

      <div className="ap-grid">
        <div className="ap-gallery">
          {product.images.length > 1 && (
            <div className="ap-thumbs">
              {product.images.map((imageId, index) => (
                <button
                  key={imageId}
                  type="button"
                  className={`ap-thumb ${index === photo ? "active" : ""}`}
                  onClick={() => showPhoto(index)}
                  aria-label={`Photo ${index + 1}`}
                >
                  <img src={shopImageUrl(imageId)} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="ap-stage">
            <div
              className="ap-slides"
              ref={slides}
              onScroll={(e) => {
                const el = e.currentTarget;
                const index = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                if (index !== photo) setPhoto(index);
              }}
            >
              {product.images.length > 0 ? (
                product.images.map((imageId, index) => (
                  <div key={imageId} className="ap-slide">
                    <img src={shopImageUrl(imageId)} alt={index === 0 ? product.name : ""} loading={index === 0 ? "eager" : "lazy"} />
                  </div>
                ))
              ) : (
                <div className="ap-slide ap-slide-empty">
                  <RoumBoutiqueLogo width={150} />
                </div>
              )}
            </div>
            {discount ? <span className="ap-badge">-{discount} %</span> : null}
            {product.images.length > 1 && (
              <div className="ap-dots" aria-hidden="true">
                {product.images.map((imageId, index) => (
                  <i key={imageId} className={index === photo ? "active" : ""} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ap-info">
          {category && <span className="ap-cat">{category.name}</span>}
          <h1 className="ap-name">{product.name}</h1>
          <div className="ap-price">
            <strong>{formatFcfa(productPrice(product))}</strong>
            {product.promoPriceFcfa !== null && <s>{formatFcfa(product.priceFcfa)}</s>}
            {discount ? <span className="ap-save">-{discount} %</span> : null}
          </div>
          {product.promoEndsAt && (
            <p className="ap-note">Prix promo jusqu&apos;au {new Date(`${product.promoEndsAt}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
          )}

          {colors.length > 0 && (
            <div className="ap-option">
              <span className="ap-label">
                Couleur <b>{color}</b>
              </span>
              <div className="ap-colors">
                {colors.map((c) => {
                  const hex = colorSwatch(c);
                  const out = product.variants.filter((v) => v.color === c).every((v) => v.stock <= 0);
                  const select = () => {
                    setColor(c);
                    setAdded(false);
                    if (size && stockFor(c, size) <= 0) setSize("");
                  };
                  return hex ? (
                    <button
                      key={c}
                      type="button"
                      className={`ap-swatch ${color === c ? "active" : ""} ${out ? "out" : ""}`}
                      onClick={select}
                      aria-label={`${c}${out ? " (épuisé)" : ""}`}
                      aria-pressed={color === c}
                      title={c}
                    >
                      <i style={{ background: hex }} />
                    </button>
                  ) : (
                    <button key={c} type="button" className={`rb-choice ${color === c ? "active" : ""} ${out ? "ap-out" : ""}`} onClick={select} aria-pressed={color === c}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="ap-option">
              <span className="ap-label">
                Taille <b>{size || "à choisir"}</b>
              </span>
              <div className="ap-sizes">
                {sizes.map((s) => {
                  const stock = stockFor(colors.length ? color : "", s);
                  const exists = product.variants.some((v) => v.size === s && v.color === (colors.length ? color : ""));
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!exists || stock <= 0}
                      className={`ap-size ${size === s ? "active" : ""}`}
                      onClick={() => {
                        setSize(s);
                        setAdded(false);
                      }}
                      title={stock <= 0 ? "Épuisé" : undefined}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className={`ap-stock ${totalStock <= 0 || (variant && variant.stock <= 0) ? "out" : lowStock ? "low" : ""}`}>
            <i />
            {totalStock <= 0
              ? "Rupture de stock"
              : !variant
                ? sizes.length > 0
                  ? "Choisissez votre taille"
                  : "Choisissez une couleur"
                : variant.stock <= 0
                  ? "Épuisé dans cette version"
                  : lowStock
                    ? `Plus que ${variant.stock} en stock`
                    : "En stock, prêt à partir"}
          </p>

          <div className="ap-buy">
            <div className="ap-stepper" aria-label="Quantité">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Moins" disabled={quantity <= 1}>
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(available || 1, q + 1))} disabled={quantity >= available} aria-label="Plus">
                <Plus size={16} />
              </button>
            </div>
            <button type="button" className="rb-btn ap-add" disabled={!variant || available <= 0} onClick={handleAdd}>
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              <span>{added ? "Ajouté" : "Ajouter au panier"}</span>
            </button>
          </div>
          {variant && inCart > 0 && available <= 0 && <p className="ap-note">Tout le stock de cette version est déjà dans votre panier.</p>}
          {(added || inCart > 0) && (
            <Link href="/boutique/panier" className="ap-tocart">
              <span>{inCart > 0 ? `${inCart} dans votre panier` : "Dans votre panier"}</span>
              <span>
                Commander <ArrowRight size={15} />
              </span>
            </Link>
          )}

          {highlights.length > 0 && (
            <ul className="ap-highlights">
              {highlights.map((text, index) => {
                const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
                return (
                  <li key={text}>
                    <Icon size={16} strokeWidth={1.8} />
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {product.description && (
            <section className="ap-desc">
              <h2>Description</h2>
              <p>{product.description}</p>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="ap-related">
          <div className="ap-related-head">
            <h2>Vous aimerez aussi</h2>
            <Link href="/boutique#collection">Tout voir</Link>
          </div>
          <div className="ap-related-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} categoryName={catalog.categories.find((c) => c.id === p.categoryId)?.name} />
            ))}
          </div>
        </section>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html:
            PRODUCT_CARD_STYLES +
            `
        .ap { display: grid; grid-template-columns: minmax(0, 1fr); }
        .ap-loading { min-height: 60vh; }
        .ap-missing { display: grid; justify-items: start; gap: 16px; padding: 30px 0; }
        .ap-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 18px; font-family: var(--c-font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-text-light); }
        .ap-crumbs a { color: var(--c-text-light); text-decoration: none; }
        .ap-crumbs a:hover { color: var(--c-accent); }

        .ap-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 56px; align-items: start; }
        .ap-gallery { display: flex; gap: 14px; min-width: 0; }
        .ap-thumbs { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
        .ap-thumb { width: 68px; height: 84px; padding: 0; border: 1px solid transparent; border-radius: 14px; overflow: hidden; background: #F3EBDF; cursor: pointer; opacity: 0.6; transition: opacity 0.15s ease, border-color 0.15s ease; }
        .ap-thumb.active, .ap-thumb:hover { opacity: 1; }
        .ap-thumb.active { border-color: #6B5844; }
        .ap-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ap-stage { position: relative; flex: 1; min-width: 0; }
        .ap-slides { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; border-radius: 30px; background: #F3EBDF; scrollbar-width: none; }
        .ap-slides::-webkit-scrollbar { display: none; }
        .ap-slide { flex: 0 0 100%; aspect-ratio: 4 / 5; scroll-snap-align: start; }
        .ap-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ap-slide-empty { display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 30% 25%, #FFFBF4 0%, #F3EBDF 60%, #EADDCB 100%); }
        .ap-badge { position: absolute; top: 16px; left: 16px; padding: 6px 12px; border-radius: 9999px; background: #3A2A21; color: #FFFBF4; font-size: 0.78rem; font-weight: 700; }
        .ap-dots { position: absolute; left: 0; right: 0; bottom: 14px; display: none; justify-content: center; gap: 6px; }
        .ap-dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 251, 244, 0.7); box-shadow: 0 0 0 1px rgba(58, 42, 33, 0.12); transition: width 0.2s ease, background 0.2s ease; }
        .ap-dots i.active { width: 18px; border-radius: 9999px; background: #FFFBF4; }

        .ap-info { position: sticky; top: 24px; display: flex; flex-direction: column; min-width: 0; }
        .ap-cat { font-family: var(--c-font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--c-text-light); }
        .rb-root .ap-name { margin: 10px 0 16px; color: var(--c-text-main); font-family: var(--c-font-display); font-size: clamp(2rem, 4vw, 2.9rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.02; }
        .ap-price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; font-variant-numeric: tabular-nums; }
        .ap-price strong { font-size: 1.45rem; font-weight: 800; color: var(--c-text-main); }
        .ap-price s { font-size: 1rem; color: var(--c-text-light); }
        .ap-save { align-self: center; padding: 4px 10px; border-radius: 9999px; background: #EADDCB; color: #3A2A21; font-size: 0.76rem; font-weight: 700; }
        .ap-note { margin: 8px 0 0; color: var(--c-text-light); font-size: 0.86rem; }

        .ap-option { display: grid; gap: 12px; margin-top: 28px; }
        .ap-option + .ap-option { margin-top: 22px; }
        .ap-label { font-size: 0.86rem; font-weight: 600; color: var(--c-text-muted); }
        .ap-label b { margin-left: 6px; color: var(--c-text-main); font-weight: 700; }
        .ap-colors { display: flex; flex-wrap: wrap; gap: 10px; }
        .ap-swatch { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; border: 1px solid transparent; border-radius: 50%; background: transparent; cursor: pointer; transition: border-color 0.15s ease; }
        .ap-swatch i { width: 30px; height: 30px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(27, 20, 17, 0.14); }
        .ap-swatch:hover { border-color: #DCCDB6; }
        .ap-swatch.active { border-color: #3A2A21; }
        .ap-swatch.out::after { content: ""; position: absolute; width: 30px; height: 1.5px; background: #8C7D75; transform: rotate(-45deg); }
        .ap-out { color: #B8ABA3; }
        .ap-sizes { display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px; }
        .ap-size {
          min-height: 48px; padding: 0 10px; border: 1px solid #DCCDB6; border-radius: 9999px; background: transparent; color: var(--c-text-main);
          font: inherit; font-size: 0.95rem; font-weight: 600; font-variant-numeric: tabular-nums; cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .ap-size:hover:not(:disabled) { background: #F3EBDF; }
        .ap-size.active, .ap-size.active:hover { border-color: #EADDCB; background: #EADDCB; color: #3A2A21; font-weight: 800; }
        .ap-size:disabled { border-color: #EFE6D9; color: #C9BFB6; text-decoration: line-through; cursor: not-allowed; }

        .ap-stock { display: flex; align-items: center; gap: 8px; margin: 22px 0 0; font-size: 0.88rem; font-weight: 600; color: var(--c-text-muted); }
        .ap-stock i { width: 8px; height: 8px; border-radius: 50%; background: #1E7A43; }
        .ap-stock.low i { background: #B08A3E; }
        .ap-stock.out i { background: #B8ABA3; }
        .ap-buy { display: flex; gap: 10px; margin-top: 16px; }
        .ap-stepper { display: inline-flex; align-items: center; flex-shrink: 0; min-height: 52px; border: 1px solid #DCCDB6; border-radius: 9999px; background: #FFFFFF; box-sizing: border-box; }
        .ap-stepper button { width: 44px; height: 50px; border: 0; background: none; color: #3A2A21; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ap-stepper button:disabled { color: #C9BFB6; cursor: not-allowed; }
        .ap-stepper span { min-width: 22px; text-align: center; font-weight: 800; font-variant-numeric: tabular-nums; }
        .ap-add { flex: 1; }
        .ap-tocart { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; padding: 14px 20px; border-radius: 9999px; background: #F3EBDF; color: #3A2A21; font-size: 0.9rem; font-weight: 700; text-decoration: none; transition: background 0.15s ease; }
        .ap-tocart:hover { background: #EADDCB; }
        .ap-tocart span:last-child { display: inline-flex; align-items: center; gap: 6px; }

        .ap-highlights { list-style: none; display: grid; gap: 12px; margin: 30px 0 0; padding: 20px 0; border-top: 1px solid #EADFD3; border-bottom: 1px solid #EADFD3; }
        .ap-highlights li { display: flex; align-items: center; gap: 12px; color: var(--c-text-muted); font-size: 0.9rem; }
        .ap-highlights svg { flex-shrink: 0; color: var(--c-accent); }
        .ap-desc { margin-top: 26px; }
        .rb-root .ap-desc h2 { margin: 0 0 10px; color: var(--c-text-main); font-family: var(--c-font-display); font-size: 1rem; font-weight: 800; letter-spacing: -0.01em; }
        .ap-desc p { margin: 0; color: var(--c-text-muted); font-size: 0.96rem; line-height: 1.65; white-space: pre-line; }

        .ap-related { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; margin-top: 88px; }
        .ap-related-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid #EADFD3; }
        .rb-root .ap-related-head h2 { margin: 0; color: var(--c-text-main); font-family: var(--c-font-display); font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 800; letter-spacing: -0.035em; }
        .ap-related-head a { color: #6B5844; font-size: 0.9rem; font-weight: 700; text-decoration: none; }
        .ap-related-head a:hover { text-decoration: underline; }
        .ap-related-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 22px; }

        @media (max-width: 960px) {
          .ap-grid { grid-template-columns: minmax(0, 1fr); gap: 28px; }
          .ap-info { position: static; }
          .ap-related-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
        }
        @media (max-width: 640px) {
          .ap-related { margin-top: 56px; }
          .ap-crumbs { margin-bottom: 14px; }
          .ap-thumbs { display: none; }
          .ap-dots { display: flex; }
          .ap-slides { border-radius: 24px; margin: 0 -4px; }
          .ap-badge { top: 12px; left: 12px; }
          .ap-option { margin-top: 24px; }
          .ap-sizes { grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)); }
        }
      `,
        }}
      />
    </div>
  );
}
