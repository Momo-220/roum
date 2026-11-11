import Link from "next/link";
import {
  colorSwatch,
  discountPercent,
  formatFcfa,
  isNewProduct,
  productColors,
  productPrice,
  productStock,
  shopImageUrl,
  sizeRange,
  type ShopProduct,
} from "@/shared/shop";
import { RoumBoutiqueLogo } from "./RoumBoutiqueLogo";

/** Carte d'un article : photo, une seule étiquette utile, nom, prix, couleurs et tailles. */
export function ProductCard({ product, categoryName }: { product: ShopProduct; categoryName?: string }) {
  const stock = productStock(product);
  const discount = discountPercent(product);
  const colors = productColors(product);
  const swatches = colors.map((c) => ({ name: c, hex: colorSwatch(c) })).filter((c) => c.hex);
  const range = sizeRange(product);
  const label = stock === 0 ? "Épuisé" : discount ? `-${discount} %` : isNewProduct(product) ? "Nouveau" : stock <= 3 ? "Dernières pièces" : "";

  return (
    <Link href={`/boutique/article/${product.id}`} className={`pc ${stock === 0 ? "pc-out" : ""}`}>
      <span className="pc-photo">
        {product.images[0] ? (
          <img src={shopImageUrl(product.images[0])} alt={product.name} loading="lazy" />
        ) : (
          <span className="pc-nophoto">
            <RoumBoutiqueLogo width={92} />
          </span>
        )}
        {label && <span className={`pc-badge ${discount && stock > 0 ? "pc-badge-promo" : ""}`}>{label}</span>}
      </span>
      <span className="pc-meta">
        {categoryName && <span className="pc-cat">{categoryName}</span>}
        <span className="pc-name">{product.name}</span>
        <span className="pc-price">
          {formatFcfa(productPrice(product))}
          {product.promoPriceFcfa !== null && <s>{formatFcfa(product.priceFcfa)}</s>}
        </span>
        {(colors.length > 0 || range) && (
          <span className="pc-variants">
            {swatches.length > 0 ? (
              <span className="pc-swatches" aria-label={`Couleurs : ${colors.join(", ")}`}>
                {swatches.slice(0, 5).map((c) => (
                  <i key={c.name} style={{ background: c.hex! }} title={c.name} />
                ))}
                {colors.length > 5 && <em>+{colors.length - 5}</em>}
              </span>
            ) : colors.length > 1 ? (
              <span>{colors.length} couleurs</span>
            ) : (
              <span />
            )}
            {range && <span className="pc-sizes">{range}</span>}
          </span>
        )}
      </span>
    </Link>
  );
}

export const PRODUCT_CARD_STYLES = `
  .pc { display: flex; flex-direction: column; gap: 14px; min-width: 0; color: inherit; text-decoration: none; }
  .pc-photo { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 22px; background: #F3EBDF; }
  .pc-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pc-out .pc-photo img { opacity: 0.55; filter: grayscale(0.35); }
  .pc-nophoto { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 30% 25%, #FFFBF4 0%, #F3EBDF 60%, #EADDCB 100%); }
  .pc-badge {
    position: absolute; top: 12px; left: 12px; padding: 5px 11px; border-radius: 9999px;
    background: rgba(255, 251, 244, 0.95); color: #3A2A21; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.01em;
    box-shadow: 0 6px 14px -8px rgba(58, 42, 33, 0.45);
  }
  .pc-badge-promo { background: #3A2A21; color: #FFFBF4; }
  .pc-meta { display: grid; gap: 4px; padding: 0 4px; }
  .pc-cat { font-family: var(--c-font-mono); font-size: 0.66rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--c-text-light); }
  .pc-name { font-size: 1rem; font-weight: 600; line-height: 1.3; color: var(--c-text-main); }
  .pc:hover .pc-name { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
  .pc-price { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 8px; font-size: 0.98rem; font-weight: 700; color: var(--c-text-main); font-variant-numeric: tabular-nums; }
  .pc-price s { color: var(--c-text-light); font-weight: 500; font-size: 0.84rem; }
  .pc-variants { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px; font-size: 0.78rem; color: var(--c-text-light); }
  .pc-swatches { display: inline-flex; align-items: center; gap: 5px; }
  .pc-swatches i { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(27, 20, 17, 0.14); }
  .pc-swatches em { font-style: normal; font-size: 0.74rem; }
  .pc-sizes { font-variant-numeric: tabular-nums; white-space: nowrap; }
  @media (max-width: 640px) {
    .pc { gap: 10px; }
    .pc-photo { border-radius: 18px; }
    .pc-badge { top: 8px; left: 8px; padding: 4px 9px; font-size: 0.66rem; }
    .pc-meta { padding: 0 2px; gap: 3px; }
    .pc-name { font-size: 0.9rem; }
    .pc-price { font-size: 0.9rem; gap: 6px; }
    .pc-price s { font-size: 0.76rem; }
    .pc-variants { font-size: 0.72rem; }
    .pc-swatches i { width: 10px; height: 10px; }
  }
`;
