"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useShop } from "@/shared/useShop";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { siteText } from "@/shared/siteContent";
import { discountPercent, formatFcfa, productPrice, productStock, shopImageUrl, type ShopProduct } from "@/shared/shop";

function ProductCard({ product }: { product: ShopProduct }) {
  const stock = productStock(product);
  const discount = discountPercent(product);
  return (
    <Link href={`/boutique/article/${product.id}`} className="rb-card">
      <span className="rb-card-photo">
        {product.images[0] ? (
          <img src={shopImageUrl(product.images[0])} alt={product.name} loading="lazy" />
        ) : (
          <span className="rb-card-nophoto">Photo bientôt</span>
        )}
        <span className="rb-card-badges">
          {discount ? <span className="rb-badge rb-badge-promo">-{discount} %</span> : null}
          {stock === 0 ? (
            <span className="rb-badge rb-badge-out">Rupture de stock</span>
          ) : stock <= 3 ? (
            <span className="rb-badge rb-badge-low">Plus que {stock}</span>
          ) : null}
        </span>
      </span>
      <span className="rb-card-name">{product.name}</span>
      <span className="rb-price">
        {formatFcfa(productPrice(product))}
        {product.promoPriceFcfa !== null && <s>{formatFcfa(product.priceFcfa)}</s>}
      </span>
    </Link>
  );
}

export default function BoutiquePage() {
  const { catalog, loadError } = useShop();
  const { settings } = usePublicCatalog();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    const words = query.trim().toLowerCase();
    return (catalog?.products || []).filter(
      (p) =>
        (category === "all" || p.categoryId === category) &&
        (!words || `${p.name} ${p.description}`.toLowerCase().includes(words))
    );
  }, [catalog, category, query]);

  return (
    <div className="rb-home">
      <header className="rb-home-head">
        <span className="rb-kicker">{siteText(settings, "boutique_kicker")}</span>
        <h1 className="rb-title">{siteText(settings, "boutique_title")}</h1>
        <p className="rb-lead">{siteText(settings, "boutique_text")}</p>
      </header>

      <div className="rb-toolbar">
        <label className="rb-search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un article"
            aria-label="Rechercher un article"
          />
        </label>
        {catalog && catalog.categories.length > 0 && (
          <div className="rb-chips" role="tablist" aria-label="Catégories">
            {[{ id: "all", name: "Tout" }, ...catalog.categories].map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={category === cat.id}
                className={`rb-chip ${category === cat.id ? "active" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadError && !catalog && <p className="rb-error">{loadError}</p>}

      {!catalog && !loadError ? (
        <div className="rb-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="rb-card rb-card-skeleton" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="rb-empty">
          {catalog?.products.length ? "Aucun article ne correspond à votre recherche." : siteText(settings, "boutique_empty")}
        </p>
      ) : (
        <div className="rb-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rb-home-head { padding: 18px 0 22px; }
        .rb-toolbar { display: grid; gap: 12px; margin-bottom: 22px; }
        .rb-search { display: flex; align-items: center; gap: 10px; max-width: 460px; min-height: 50px; padding: 0 18px; border-radius: 9999px; background: #FFFFFF; border: 1px solid #EADFD3; color: #8C7D75; }
        .rb-search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: 1rem; color: #1B1411; }
        .rb-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .rb-chips::-webkit-scrollbar { display: none; }
        .rb-chip { flex-shrink: 0; min-height: 40px; padding: 0 16px; border: 0; border-radius: 9999px; background: #EFE6D9; color: #3A2A21; font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
        .rb-chip.active { background: #3A2A21; color: #FFFBF4; }
        .rb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 22px 18px; }
        .rb-card { display: grid; gap: 8px; align-content: start; color: inherit; text-decoration: none; }
        .rb-card-photo { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 22px; background: #EFE6D9; }
        .rb-card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
        .rb-card:hover .rb-card-photo img { transform: scale(1.03); }
        .rb-card-nophoto { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #8C7D75; font-size: 0.86rem; }
        .rb-card-badges { position: absolute; top: 10px; left: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
        .rb-card-name { font-size: 0.98rem; font-weight: 700; color: #1B1411; line-height: 1.3; }
        .rb-card-skeleton { aspect-ratio: 4 / 5; border-radius: 22px; background: linear-gradient(90deg, #EFE6D9, #F5EFE8, #EFE6D9); background-size: 200% 100%; animation: rb-shine 1.4s infinite; }
        @keyframes rb-shine { to { background-position: -200% 0; } }
        .rb-empty { padding: 40px 0; color: #5C4F48; font-size: 1rem; }
        @media (max-width: 640px) {
          .rb-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; }
          .rb-card-photo { border-radius: 18px; }
          .rb-card-name { font-size: 0.9rem; }
        }
      `,
        }}
      />
    </div>
  );
}
