"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Plus, Star, Trash2, X } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { compressImage } from "@/shared/compressImage";
import { SIZE_PRESETS, formatFcfa, shopImageUrl } from "@/shared/shop";
import type { Notify } from "./ShopAdmin";

export interface AdminProduct {
  id: string;
  categoryId: string | null;
  name: string;
  description: string;
  priceFcfa: number;
  promoPriceFcfa: number | null;
  promoEndsAt: string | null;
  promoActive: boolean;
  originCountry: string;
  weightKg: number | null;
  isActive: boolean;
  position: number;
  images: string[];
  variants: Array<{ id: string; color: string; size: string; stock: number }>;
}

export interface AdminCatalog {
  categories: Array<{ id: string; name: string; position: number; isActive: boolean }>;
  products: AdminProduct[];
  zones: Array<{ id: string; name: string; country: string; priceFcfa: number; delay: string; position: number; isActive: boolean }>;
  transitDelivery: boolean;
}

type Call = (path: string, init: { method: "POST" | "PUT" | "DELETE"; body?: unknown }, success?: string) => Promise<unknown>;

const ORIGINS = ["Côte d'Ivoire", "Chine", "Dubaï", "Maroc", "France"];
const LOW_STOCK = 2;

interface Draft {
  id: string | null;
  name: string;
  description: string;
  categoryId: string;
  price: string;
  promoPrice: string;
  promoEndsAt: string;
  originCountry: string;
  weightKg: string;
  isActive: boolean;
  colors: string[];
  sizes: string[];
  /** Stock par « couleur|taille ». */
  stock: Record<string, string>;
}

const stockKey = (color: string, size: string) => `${color}|${size}`;

function toDraft(p: AdminProduct | null): Draft {
  if (!p) {
    return {
      id: null,
      name: "",
      description: "",
      categoryId: "",
      price: "",
      promoPrice: "",
      promoEndsAt: "",
      originCountry: "Côte d'Ivoire",
      weightKg: "",
      isActive: true,
      colors: [],
      sizes: [],
      stock: { [stockKey("", "")]: "0" },
    };
  }
  const colors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
  const sizes = [...new Set(p.variants.map((v) => v.size).filter(Boolean))];
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId || "",
    price: String(p.priceFcfa),
    promoPrice: p.promoPriceFcfa === null ? "" : String(p.promoPriceFcfa),
    promoEndsAt: p.promoEndsAt || "",
    originCountry: p.originCountry,
    weightKg: p.weightKg === null ? "" : String(p.weightKg),
    isActive: p.isActive,
    colors,
    sizes,
    stock: Object.fromEntries(p.variants.map((v) => [stockKey(v.color, v.size), String(v.stock)])),
  };
}

export function ShopProducts({
  catalog,
  token,
  call,
  notify,
  reload,
}: {
  catalog: AdminCatalog;
  token: string | null;
  call: Call;
  notify: Notify;
  reload: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [query, setQuery] = useState("");

  const products = useMemo(
    () => catalog.products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [catalog.products, query]
  );
  const categoryName = (id: string | null) => catalog.categories.find((c) => c.id === id)?.name || "Sans catégorie";

  if (draft) {
    const product = draft.id ? catalog.products.find((p) => p.id === draft.id) || null : null;
    return (
      <ProductEditor
        draft={draft}
        setDraft={setDraft}
        product={product}
        catalog={catalog}
        token={token}
        call={call}
        notify={notify}
        reload={reload}
      />
    );
  }

  return (
    <div className="sp-root">
      <div className="sp-toolbar">
        <input className="input-clean" placeholder="Rechercher un article" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className="sa-btn" onClick={() => setDraft(toDraft(null))}>
          <Plus size={16} /> Ajouter un article
        </button>
      </div>

      {products.length === 0 ? (
        <p className="sa-muted">Aucun article. Ajoutez le premier avec ses photos, tailles, couleurs et stock.</p>
      ) : (
        <ul className="sp-list">
          {products.map((p) => {
            const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
            const low = p.variants.filter((v) => v.stock <= LOW_STOCK).length;
            return (
              <li key={p.id}>
                <button type="button" className="sp-row" onClick={() => setDraft(toDraft(p))}>
                  <span className="sp-photo">{p.images[0] && <img src={shopImageUrl(p.images[0])} alt="" />}</span>
                  <span className="sp-info">
                    <strong>{p.name}</strong>
                    <span className="sa-muted">
                      {categoryName(p.categoryId)} · {formatFcfa(p.promoActive && p.promoPriceFcfa !== null ? p.promoPriceFcfa : p.priceFcfa)}
                      {p.promoActive && " (promo)"}
                    </span>
                  </span>
                  <span className="sp-stock">
                    <strong>{stock}</strong> en stock
                    {stock === 0 ? (
                      <span className="sa-status sa-status-CANCELLED">Rupture</span>
                    ) : low > 0 ? (
                      <span className="sa-status">Stock bas</span>
                    ) : null}
                    {!p.isActive && <span className="sa-status">Masqué</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <style dangerouslySetInnerHTML={{ __html: PRODUCT_STYLES }} />
    </div>
  );
}

function ProductEditor({
  draft,
  setDraft,
  product,
  catalog,
  token,
  call,
  notify,
  reload,
}: {
  draft: Draft;
  setDraft: (d: Draft | null) => void;
  product: AdminProduct | null;
  catalog: AdminCatalog;
  token: string | null;
  call: Call;
  notify: Notify;
  reload: () => Promise<void>;
}) {
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const rows = draft.colors.length ? draft.colors : [""];
  const cols = draft.sizes.length ? draft.sizes : [""];

  const addColor = () => {
    const c = colorInput.trim();
    if (c && !draft.colors.some((x) => x.toLowerCase() === c.toLowerCase())) update({ colors: [...draft.colors, c] });
    setColorInput("");
  };
  const addSizes = (sizes: string[]) => {
    const next = [...draft.sizes];
    for (const s of sizes.map((x) => x.trim()).filter(Boolean)) if (!next.includes(s)) next.push(s);
    update({ sizes: next });
  };
  const addRange = () => {
    const from = Number(rangeFrom);
    const to = Number(rangeTo);
    if (!Number.isInteger(from) || !Number.isInteger(to) || to < from || to - from > 40) {
      notify("Indiquez une pointure de départ et une pointure de fin, par exemple 36 et 41.", "Tailles", "error");
      return;
    }
    addSizes(Array.from({ length: to - from + 1 }, (_, i) => String(from + i)));
    setRangeFrom("");
    setRangeTo("");
  };

  const save = async () => {
    const price = Number(draft.price);
    if (!draft.name.trim() || !Number.isFinite(price) || price < 0) {
      notify("Indiquez au moins le nom et le prix de l'article.", "Article", "error");
      return;
    }
    const variants = rows.flatMap((color) =>
      cols.map((size) => ({ color, size, stock: Math.max(0, Math.floor(Number(draft.stock[stockKey(color, size)]) || 0)) }))
    );
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId || null,
      priceFcfa: Math.round(price),
      promoPriceFcfa: draft.promoPrice.trim() ? Math.round(Number(draft.promoPrice)) : null,
      promoEndsAt: draft.promoEndsAt || null,
      originCountry: draft.originCountry,
      weightKg: draft.weightKg.trim() ? Number(draft.weightKg.replace(",", ".")) : null,
      isActive: draft.isActive,
      position: product?.position ?? 0,
      variants,
    };
    setSaving(true);
    const result = (await call(
      draft.id ? `/products/${draft.id}` : "/products",
      { method: draft.id ? "PUT" : "POST", body },
      draft.id ? "Article enregistré : la boutique est à jour." : "Article ajouté : ajoutez maintenant ses photos."
    )) as { id?: string } | null;
    setSaving(false);
    if (result && !draft.id && result.id) setDraft({ ...draft, id: result.id });
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || !draft.id) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await compressImage(file, 1600, 0.82);
        await apiRequest(`/api/admin/shop/products/${draft.id}/images`, { method: "POST", token, body: { dataUrl } });
      }
      notify("Photos ajoutées.", "Article");
      await reload();
    } catch (err: any) {
      notify(err?.message || "Une photo n'a pas pu être envoyée.", "Photos", "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const remove = async () => {
    if (!draft.id || !window.confirm(`Supprimer « ${draft.name} » de la boutique ? Les commandes déjà passées restent intactes.`)) return;
    if (await call(`/products/${draft.id}`, { method: "DELETE" }, "Article supprimé.")) setDraft(null);
  };

  return (
    <div className="sp-editor">
      <div className="sp-editor-head">
        <button type="button" className="sa-btn soft" onClick={() => setDraft(null)}>
          <X size={15} /> Retour aux articles
        </button>
        <h3>{draft.id ? draft.name || "Article" : "Nouvel article"}</h3>
      </div>

      <section className="sa-card">
        <h3>Informations</h3>
        <div className="sa-grid2">
          <label className="sa-field">
            <span>Nom de l&apos;article</span>
            <input className="input-clean" value={draft.name} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <label className="sa-field">
            <span>Catégorie</span>
            <select className="input-clean" value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
              <option value="">Sans catégorie</option>
              {catalog.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="sa-field">
          <span>Description</span>
          <textarea className="input-clean" rows={3} value={draft.description} onChange={(e) => update({ description: e.target.value })} />
        </label>
        <label className="sp-toggle">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => update({ isActive: e.target.checked })} />
          <span>Visible dans la boutique</span>
        </label>
      </section>

      <section className="sa-card">
        <h3>Prix et promotion</h3>
        <div className="sa-grid2">
          <label className="sa-field">
            <span>Prix (FCFA)</span>
            <input className="input-clean" inputMode="numeric" value={draft.price} onChange={(e) => update({ price: e.target.value.replace(/[^\d]/g, "") })} />
          </label>
          <label className="sa-field">
            <span>Prix promo (FCFA, facultatif)</span>
            <input className="input-clean" inputMode="numeric" value={draft.promoPrice} onChange={(e) => update({ promoPrice: e.target.value.replace(/[^\d]/g, "") })} />
          </label>
          <label className="sa-field">
            <span>Fin de la promo (facultatif)</span>
            <input className="input-clean" type="date" value={draft.promoEndsAt} onChange={(e) => update({ promoEndsAt: e.target.value })} />
          </label>
        </div>
        <p className="sa-hint">Sans date de fin, la promotion dure jusqu&apos;à ce que vous vidiez le prix promo.</p>
      </section>

      <section className="sa-card">
        <h3>Tailles, couleurs et stock</h3>
        <div className="sp-chips">
          {SIZE_PRESETS.filter((p) => p.sizes.length > 0).map((preset) => (
            <button key={preset.id} type="button" className="sa-chip" onClick={() => addSizes(preset.sizes)}>
              + {preset.label}
            </button>
          ))}
        </div>
        <div className="sa-grid2">
          <div className="sa-field">
            <span>Pointures, de… à…</span>
            <div className="sp-inline">
              <input className="input-clean" inputMode="numeric" placeholder="36" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
              <input className="input-clean" inputMode="numeric" placeholder="41" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
              <button type="button" className="sa-btn soft" onClick={addRange}>Ajouter</button>
            </div>
          </div>
          <div className="sa-field">
            <span>Autre taille (ex. XL, 42, Unique)</span>
            <div className="sp-inline">
              <input
                className="input-clean"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSizes([sizeInput]);
                    setSizeInput("");
                  }
                }}
              />
              <button type="button" className="sa-btn soft" onClick={() => { addSizes([sizeInput]); setSizeInput(""); }}>Ajouter</button>
            </div>
          </div>
          <div className="sa-field">
            <span>Couleur (ex. Noir, Beige)</span>
            <div className="sp-inline">
              <input
                className="input-clean"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColor();
                  }
                }}
              />
              <button type="button" className="sa-btn soft" onClick={addColor}>Ajouter</button>
            </div>
          </div>
        </div>

        {(draft.sizes.length > 0 || draft.colors.length > 0) && (
          <div className="sp-tags">
            {draft.sizes.map((s) => (
              <button key={`s-${s}`} type="button" className="sp-tag" onClick={() => update({ sizes: draft.sizes.filter((x) => x !== s) })}>
                {s} <X size={12} />
              </button>
            ))}
            {draft.colors.map((c) => (
              <button key={`c-${c}`} type="button" className="sp-tag color" onClick={() => update({ colors: draft.colors.filter((x) => x !== c) })}>
                {c} <X size={12} />
              </button>
            ))}
          </div>
        )}

        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>{draft.colors.length ? "Couleur" : ""}</th>
                {cols.map((size) => (
                  <th key={size}>{size || "Stock"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((color) => (
                <tr key={color}>
                  <th>{color || (draft.sizes.length ? "Stock" : "")}</th>
                  {cols.map((size) => {
                    const key = stockKey(color, size);
                    const value = draft.stock[key] ?? "0";
                    return (
                      <td key={key}>
                        <input
                          className={`input-clean sp-stock-input ${Number(value) === 0 ? "zero" : Number(value) <= LOW_STOCK ? "low" : ""}`}
                          inputMode="numeric"
                          value={value}
                          onChange={(e) => update({ stock: { ...draft.stock, [key]: e.target.value.replace(/[^\d]/g, "") } })}
                          aria-label={`Stock ${[color, size].filter(Boolean).join(" ")}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sa-hint">Mettez 0 pour une taille épuisée : elle reste visible, grisée. Le stock baisse tout seul à chaque commande et revient si elle est annulée.</p>
      </section>

      <section className="sa-card">
        <h3>Livraison par Roum Transit</h3>
        <div className="sa-grid2">
          <label className="sa-field">
            <span>Pays d&apos;où part l&apos;article</span>
            <select className="input-clean" value={draft.originCountry} onChange={(e) => update({ originCountry: e.target.value })}>
              {[...new Set([...ORIGINS, draft.originCountry])].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="sa-field">
            <span>Poids d&apos;une pièce (kg)</span>
            <input className="input-clean" inputMode="decimal" placeholder="1" value={draft.weightKg} onChange={(e) => update({ weightKg: e.target.value.replace(/[^\d.,]/g, "") })} />
          </label>
        </div>
        <p className="sa-hint">Sert au calcul automatique quand le client choisit Roum Transit. Sans poids, 1 kg est compté.</p>
      </section>

      <section className="sa-card">
        <h3>Photos</h3>
        {!draft.id ? (
          <p className="sa-hint">Enregistrez d&apos;abord l&apos;article, puis ajoutez ses photos.</p>
        ) : (
          <>
            <div className="sp-photos">
              {(product?.images || []).map((imageId, index) => (
                <div key={imageId} className="sp-photo-item">
                  <img src={shopImageUrl(imageId)} alt="" />
                  <div className="sp-photo-actions">
                    {index > 0 ? (
                      <button type="button" title="Mettre en couverture" onClick={() => call(`/products/${draft.id}/images/${imageId}/cover`, { method: "POST" }, "Photo de couverture changée.")}>
                        <Star size={14} />
                      </button>
                    ) : (
                      <span className="sp-cover">Couverture</span>
                    )}
                    <button type="button" title="Supprimer" onClick={() => call(`/products/${draft.id}/images/${imageId}`, { method: "DELETE" }, "Photo supprimée.")}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(product?.images.length || 0) < 8 && (
                <button type="button" className="sp-photo-add" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  <ImagePlus size={22} />
                  <span>{uploading ? "Envoi…" : "Ajouter"}</span>
                </button>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => uploadPhotos(e.target.files)} />
            <p className="sa-hint">8 photos au maximum. Elles sont réduites avant l&apos;envoi.</p>
          </>
        )}
      </section>

      <div className="sp-savebar">
        {draft.id && (
          <button type="button" className="sa-btn danger" onClick={remove}>
            <Trash2 size={15} /> Supprimer l&apos;article
          </button>
        )}
        <button type="button" className="sa-btn" disabled={saving} onClick={save}>
          {saving ? "Enregistrement…" : draft.id ? "Enregistrer" : "Créer l'article"}
        </button>
      </div>
      <style dangerouslySetInnerHTML={{ __html: PRODUCT_STYLES }} />
    </div>
  );
}

const PRODUCT_STYLES = `
  .sp-root, .sp-editor { display: grid; gap: 14px; }
  .sp-toolbar { display: flex; flex-wrap: wrap; gap: 10px; }
  .sp-toolbar .input-clean { flex: 1; min-width: 200px; }
  .sp-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .sp-row { width: 100%; display: flex; align-items: center; gap: 14px; padding: 10px 14px; border: 1px solid #EFE6D9; border-radius: 18px; background: #FFFFFF; font: inherit; color: #1B1411; text-align: left; cursor: pointer; }
  .sp-photo { flex-shrink: 0; width: 56px; height: 66px; border-radius: 12px; overflow: hidden; background: #F3EBDF; }
  .sp-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sp-info { flex: 1; display: grid; gap: 2px; min-width: 0; }
  .sp-stock { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px; font-size: 0.84rem; color: var(--text-muted); }
  .sp-stock strong { color: #1B1411; }
  .sp-editor-head { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .sp-editor-head h3 { margin: 0; font-size: 1.15rem; }
  .sp-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 0.88rem; font-weight: 600; }
  .sp-toggle input { width: 18px; height: 18px; accent-color: #3A2A21; }
  .sp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .sp-inline { display: flex; gap: 6px; }
  .sp-inline .input-clean { min-width: 0; flex: 1; }
  .sp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .sp-tag { display: inline-flex; align-items: center; gap: 4px; min-height: 30px; padding: 0 10px; border: 0; border-radius: 9999px; background: #F3EBDF; color: #3A2A21; font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
  .sp-tag.color { background: #3A2A21; color: #FFFBF4; }
  .sp-table-wrap { overflow-x: auto; }
  .sp-table { border-collapse: separate; border-spacing: 6px; }
  .sp-table th { font-size: 0.78rem; color: var(--text-secondary); text-align: left; white-space: nowrap; padding: 0 4px; }
  .sp-stock-input { width: 64px; text-align: center; }
  .sp-stock-input.zero { background: #FBEAEA; }
  .sp-stock-input.low { background: #FFF7E8; }
  .sp-photos { display: flex; flex-wrap: wrap; gap: 10px; }
  .sp-photo-item { position: relative; width: 110px; height: 132px; border-radius: 14px; overflow: hidden; background: #F3EBDF; }
  .sp-photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sp-photo-actions { position: absolute; left: 6px; right: 6px; bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
  .sp-photo-actions button { width: 30px; height: 30px; border: 0; border-radius: 50%; background: rgba(255, 251, 244, 0.95); color: #3A2A21; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .sp-cover { padding: 3px 8px; border-radius: 9999px; background: #3A2A21; color: #FFFBF4; font-size: 0.68rem; font-weight: 700; }
  .sp-photo-add { width: 110px; height: 132px; border: 1px dashed #D9CBB8; border-radius: 14px; background: #FFFBF4; color: #6B5844; display: grid; place-items: center; align-content: center; gap: 6px; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
  .sp-savebar { position: sticky; bottom: 14px; z-index: 5; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; padding: 10px; border-radius: 9999px; background: rgba(255, 255, 255, 0.92); box-shadow: 0 10px 30px -14px rgba(58, 42, 33, 0.45); }
  @media (max-width: 640px) {
    .sp-row { flex-wrap: wrap; }
    .sp-stock { justify-content: flex-start; width: 100%; padding-left: 70px; }
    .sp-savebar { border-radius: 20px; }
  }
`;
