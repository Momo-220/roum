"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, BadgeCheck, PackageSearch, Search, Truck, Wallet, X } from "lucide-react";
import { useShop } from "@/shared/useShop";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { siteImage, siteImageKey, siteLines, siteText } from "@/shared/siteContent";
import { productPrice, shopImageUrl, type ShopProduct } from "@/shared/shop";
import { ProductCard, PRODUCT_CARD_STYLES } from "@/components/shop/ProductCard";
import { RoumBoutiqueLogo } from "@/components/shop/RoumBoutiqueLogo";

type Sort = "selection" | "new" | "price-asc" | "price-desc";

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: "selection", label: "Sélection" },
  { id: "new", label: "Nouveautés" },
  { id: "price-asc", label: "Prix croissant" },
  { id: "price-desc", label: "Prix décroissant" },
];

const HIGHLIGHT_ICONS = [Wallet, Truck, BadgeCheck];

const createdTime = (p: ShopProduct) => (p.createdAt ? new Date(`${p.createdAt.replace(" ", "T")}Z`).getTime() || 0 : 0);

export default function BoutiquePage() {
  const { catalog, loadError } = useShop();
  const { settings } = usePublicCatalog();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("selection");

  const all = catalog?.products || [];
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of all) if (p.categoryId) map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    return map;
  }, [all]);
  const categoryName = (id: string | null) => catalog?.categories.find((c) => c.id === id)?.name;

  const products = useMemo(() => {
    const words = query.trim().toLowerCase();
    const list = all.filter(
      (p) => (category === "all" || p.categoryId === category) && (!words || `${p.name} ${p.description}`.toLowerCase().includes(words))
    );
    if (sort === "new") return [...list].sort((a, b) => createdTime(b) - createdTime(a));
    if (sort === "price-asc") return [...list].sort((a, b) => productPrice(a) - productPrice(b));
    if (sort === "price-desc") return [...list].sort((a, b) => productPrice(b) - productPrice(a));
    return list;
  }, [all, category, query, sort]);

  // En-tête : son image à elle, sinon les dernières nouveautés en photo.
  const heroImage = settings[siteImageKey("boutique_hero")] ? siteImage(settings, "boutique_hero") : "";
  const latest = useMemo(
    () =>
      [...all]
        .filter((p) => p.images.length > 0)
        .sort((a, b) => createdTime(b) - createdTime(a))
        .slice(0, 3),
    [all]
  );
  const highlights = siteLines(settings, "boutique_highlights").slice(0, 3);
  const steps = siteLines(settings, "boutique_steps").slice(0, 4);

  return (
    <div className="bq">
      <section className="bq-hero">
        <div className="bq-hero-text">
          <span className="rb-kicker">{siteText(settings, "boutique_kicker")}</span>
          <h1 className="bq-title">{siteText(settings, "boutique_title")}</h1>
          <p className="bq-lead">{siteText(settings, "boutique_text")}</p>
          {/* Un seul bouton plein ; le suivi reste un lien discret à côté. */}
          <div className="bq-cta">
            <a href="#collection" className="bq-main">
              <span>{siteText(settings, "boutique_cta")}</span>
              <span className="bq-main-icon" aria-hidden="true">
                <ArrowDown size={17} strokeWidth={2.2} />
              </span>
            </a>
            <Link href="/boutique/suivi" className="bq-track">
              <PackageSearch size={17} strokeWidth={1.9} />
              <span>Suivre ma commande</span>
            </Link>
          </div>
          {highlights.length > 0 && (
            <ul className="bq-highlights">
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
        </div>

        <div className="bq-hero-visual">
          {heroImage ? (
            <img className="bq-hero-img" src={heroImage} alt="" />
          ) : latest.length > 0 ? (
            <div className={`bq-mosaic bq-mosaic-${latest.length}`}>
              {latest.map((p) => (
                <Link key={p.id} href={`/boutique/article/${p.id}`} className="bq-tile">
                  <img src={shopImageUrl(p.images[0])} alt={p.name} />
                  <span className="bq-tile-label">{p.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bq-hero-empty">
              <RoumBoutiqueLogo width={190} />
            </div>
          )}
        </div>
      </section>

      <section id="collection" className="bq-collection">
        <div className="bq-head">
          <h2 className="bq-h2">{siteText(settings, "boutique_collection_title")}</h2>
          {catalog && (
            <span className="bq-count">
              {products.length} article{products.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="bq-toolbar">
          {catalog && catalog.categories.length > 0 && (
            <div className="bq-chips" role="tablist" aria-label="Catégories">
              {[{ id: "all", name: "Tout", count: all.length }, ...catalog.categories.map((c) => ({ ...c, count: counts.get(c.id) || 0 }))].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={category === cat.id}
                  className={`rb-choice ${category === cat.id ? "active" : ""}`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.name}
                  <span className="bq-chip-count">{cat.count}</span>
                </button>
              ))}
            </div>
          )}
          <div className="bq-tools">
            <label className="bq-search">
              <Search size={16} />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un article" />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Effacer">
                  <X size={14} />
                </button>
              )}
            </label>
            <select className="bq-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError && !catalog && <p className="rb-error">{loadError}</p>}

        {!catalog && !loadError ? (
          <div className="bq-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="bq-skeleton" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bq-empty">
            <p>{all.length ? "Aucun article ne correspond à votre recherche." : siteText(settings, "boutique_empty")}</p>
            {all.length > 0 && (
              <button
                type="button"
                className="rb-btn rb-btn-soft"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Tout afficher
              </button>
            )}
          </div>
        ) : (
          <div className="bq-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} categoryName={categoryName(product.categoryId)} />
            ))}
          </div>
        )}
      </section>

      {steps.length > 0 && (
        <section className="bq-steps">
          <h2 className="bq-h2">{siteText(settings, "boutique_steps_title")}</h2>
          <ol>
            {steps.map((step, index) => (
              <li key={step}>
                <span className="bq-step-n">{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html:
            PRODUCT_CARD_STYLES +
            `
        .bq { display: grid; grid-template-columns: minmax(0, 1fr); gap: 72px; padding-top: 8px; }

        .bq-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 48px; align-items: center; }
        .bq-hero-text { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
        .rb-root .bq-title {
          margin: 14px 0 16px; color: var(--c-text-main); font-family: var(--c-font-display);
          font-size: clamp(2.5rem, 5.6vw, 4.4rem); font-weight: 800; letter-spacing: -0.045em; line-height: 0.98;
        }
        .bq-lead { margin: 0; max-width: 470px; color: var(--c-text-muted); font-size: 1.08rem; line-height: 1.6; }
        .bq-cta { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 26px; margin-top: 30px; }
        .bq-main {
          display: inline-flex; align-items: center; gap: 16px; min-height: 56px; padding: 0 8px 0 26px; border-radius: 9999px;
          background: #2A1E17; color: #FFFBF4; font-size: 0.98rem; font-weight: 700; letter-spacing: -0.01em; text-decoration: none;
          box-shadow: 0 16px 30px -18px rgba(42, 30, 23, 0.7); transition: background 0.15s ease;
        }
        .bq-main:hover { background: #3A2A21; }
        .bq-main:active { transform: scale(0.98); }
        .bq-main-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #FFFBF4; color: #2A1E17; }
        .bq-track {
          display: inline-flex; align-items: center; gap: 9px; padding: 8px 2px; color: #3A2A21; font-size: 0.95rem; font-weight: 700;
          text-decoration: underline; text-decoration-color: rgba(58, 42, 33, 0.3); text-decoration-thickness: 1px; text-underline-offset: 6px;
          transition: color 0.15s ease, text-decoration-color 0.15s ease;
        }
        .bq-track svg { flex-shrink: 0; color: var(--c-accent); }
        .bq-track:hover { color: #6B5844; text-decoration-color: currentColor; }
        .bq-highlights { list-style: none; display: grid; gap: 10px; margin: 34px 0 0; padding: 22px 0 0; border-top: 1px solid #EADFD3; width: 100%; max-width: 470px; }
        .bq-highlights li { display: flex; align-items: center; gap: 12px; color: var(--c-text-muted); font-size: 0.92rem; }
        .bq-highlights svg { flex-shrink: 0; color: var(--c-accent); }

        .bq-hero-visual { min-width: 0; }
        .bq-hero-img { display: block; width: 100%; aspect-ratio: 4 / 5; max-height: 640px; object-fit: cover; border-radius: 32px; background: #F3EBDF; }
        .bq-hero-empty { display: flex; align-items: center; justify-content: center; aspect-ratio: 4 / 5; max-height: 600px; border-radius: 32px; background: radial-gradient(circle at 30% 25%, #FFFBF4 0%, #F3EBDF 60%, #EADDCB 100%); }
        .bq-mosaic { display: grid; gap: 14px; height: clamp(380px, 46vw, 600px); }
        .bq-mosaic-2 { grid-template-columns: 1fr 1fr; }
        .bq-mosaic-3 { grid-template-columns: 1.2fr 1fr; grid-template-rows: 1fr 1fr; }
        .bq-mosaic-3 .bq-tile:first-child { grid-row: span 2; }
        .bq-tile { position: relative; display: block; overflow: hidden; border-radius: 26px; background: #F3EBDF; }
        .bq-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bq-tile-label {
          position: absolute; left: 14px; bottom: 14px; max-width: calc(100% - 28px); padding: 7px 13px; border-radius: 9999px;
          background: rgba(255, 251, 244, 0.95); color: #3A2A21; font-size: 0.8rem; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 8px 18px -12px rgba(58, 42, 33, 0.5);
        }

        .bq-collection { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; scroll-margin-top: 20px; }
        .bq-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid #EADFD3; }
        .rb-root .bq-h2 { margin: 0; color: var(--c-text-main); font-family: var(--c-font-display); font-size: clamp(1.6rem, 3.4vw, 2.2rem); font-weight: 800; letter-spacing: -0.035em; }
        .bq-count { font-family: var(--c-font-mono); font-size: 0.74rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-text-light); white-space: nowrap; }
        .bq-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
        .bq-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; min-width: 0; flex: 1 1 0; }
        .bq-chips::-webkit-scrollbar { display: none; }
        .bq-chips .rb-choice { flex-shrink: 0; min-height: 42px; padding: 0 16px; font-size: 0.9rem; }
        .bq-chip-count { font-size: 0.74rem; font-weight: 600; color: var(--c-text-light); font-variant-numeric: tabular-nums; }
        .bq-chips .rb-choice.active .bq-chip-count { color: #6B5844; }
        .bq-tools { display: flex; gap: 8px; flex-shrink: 0; }
        .bq-search { display: flex; align-items: center; gap: 8px; width: 210px; min-height: 42px; padding: 0 14px; border: 1px solid #DCCDB6; border-radius: 9999px; background: #FFFFFF; color: var(--c-text-light); box-sizing: border-box; }
        .bq-search:focus-within { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(107, 88, 68, 0.14); }
        .bq-search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--c-text-main); font: inherit; font-size: 16px; }
        .bq-search input::-webkit-search-cancel-button { display: none; }
        .bq-search button { display: inline-flex; padding: 2px; border: 0; background: none; color: var(--c-text-light); cursor: pointer; }
        .bq-sort {
          min-height: 42px; padding: 0 38px 0 16px; border: 1px solid #DCCDB6; border-radius: 9999px; background-color: #FFFFFF; color: #3A2A21;
          font: inherit; font-size: 0.9rem; font-weight: 600; cursor: pointer; appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B5844' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 15px center;
        }
        .bq-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 22px; }
        .bq-skeleton { aspect-ratio: 4 / 5; border-radius: 22px; background: linear-gradient(90deg, #F3EBDF, #FAF5F0, #F3EBDF); background-size: 200% 100%; animation: bq-shine 1.4s infinite; }
        @keyframes bq-shine { to { background-position: -200% 0; } }
        .bq-empty { display: grid; justify-items: start; gap: 16px; padding: 30px 0; }
        .bq-empty p { margin: 0; color: var(--c-text-muted); font-size: 1rem; }

        .bq-steps { display: grid; grid-template-columns: minmax(0, 1fr); gap: 26px; padding-top: 8px; }
        .bq-steps ol { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0; margin: 0; padding: 0; border-top: 1px solid #EADFD3; }
        .bq-steps li { display: grid; gap: 12px; align-content: start; padding: 24px 24px 8px 0; }
        .bq-steps li + li { padding-left: 24px; border-left: 1px solid #EADFD3; }
        .bq-step-n { font-family: var(--c-font-mono); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; color: var(--c-accent); }
        .bq-steps p { margin: 0; color: var(--c-text-main); font-size: 1.02rem; font-weight: 600; line-height: 1.45; }

        @media (max-width: 1080px) {
          .bq-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 860px) {
          .bq { gap: 56px; }
          .bq-hero { grid-template-columns: minmax(0, 1fr); gap: 32px; }
          .bq-mosaic { height: clamp(320px, 90vw, 520px); }
          .bq-toolbar { display: grid; grid-template-columns: minmax(0, 1fr); }
          .bq-tools { width: 100%; }
          .bq-search { flex: 1 1 auto; width: auto; min-width: 0; }
          .bq-sort { flex: 0 1 auto; min-width: 0; max-width: 46%; text-overflow: ellipsis; }
          .bq-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
        }
        @media (max-width: 640px) {
          .bq { gap: 48px; padding-top: 0; }
          .rb-root .bq-title { margin: 12px 0 12px; }
          .bq-lead { font-size: 1rem; }
          .bq-cta { margin-top: 24px; gap: 12px 22px; }
          .bq-main { min-height: 54px; padding-left: 22px; font-size: 0.95rem; }
          .bq-highlights { margin-top: 26px; padding-top: 18px; }
          .bq-mosaic { gap: 10px; }
          .bq-tile { border-radius: 20px; }
          .bq-tile-label { left: 10px; bottom: 10px; font-size: 0.72rem; padding: 6px 10px; }
          .bq-mosaic-3 { grid-template-columns: 1.15fr 1fr; }
          .bq-chips { margin: 0 -16px; padding: 0 16px; }
          .bq-steps li, .bq-steps li + li { padding: 18px 0; border-left: 0; border-bottom: 1px solid #EADFD3; }
          .bq-steps ol { border-top: 0; }
        }
      `,
        }}
      />
    </div>
  );
}
