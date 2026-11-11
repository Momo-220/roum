"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Boxes, Copy, ExternalLink, ImagePlus, PackageX, Plus, Search, ShoppingBag, Star, Trash2, X } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { compressImage } from "@/shared/compressImage";
import { SIZE_PRESETS, formatFcfa, shopImageUrl } from "@/shared/shop";
import type { Notify } from "./ShopAdmin";
import { Metric, Switch } from "./ShopAdminUi";

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
type StockFilter = "all" | "low" | "out" | "hidden";

const ORIGINS = ["Côte d'Ivoire", "Chine", "Dubaï", "Maroc", "France"];
const LOW_STOCK = 2;
const MAX_PHOTOS = 8;

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
const totalStock = (p: AdminProduct) => p.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
const isOut = (p: AdminProduct) => totalStock(p) === 0;
const isLow = (p: AdminProduct) => !isOut(p) && p.variants.some((v) => v.stock <= LOW_STOCK);
const effectivePrice = (p: AdminProduct) => (p.promoActive && p.promoPriceFcfa !== null ? p.promoPriceFcfa : p.priceFcfa);

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
    colors: [...new Set(p.variants.map((v) => v.color).filter(Boolean))],
    sizes: [...new Set(p.variants.map((v) => v.size).filter(Boolean))],
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
  const [editing, setEditing] = useState<{ draft: Draft; key: number } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [toggling, setToggling] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = catalog.products.filter((p) => p.isActive);
    return {
      active: active.length,
      out: catalog.products.filter(isOut).length,
      low: catalog.products.filter(isLow).length,
      hidden: catalog.products.length - active.length,
      pieces: active.reduce((sum, p) => sum + totalStock(p), 0),
      value: active.reduce((sum, p) => sum + totalStock(p) * effectivePrice(p), 0),
    };
  }, [catalog.products]);

  const products = useMemo(() => {
    const words = query.trim().toLowerCase();
    return catalog.products.filter(
      (p) =>
        (!words || p.name.toLowerCase().includes(words)) &&
        (!category || (category === "none" ? !p.categoryId : p.categoryId === category)) &&
        (filter === "all" || (filter === "out" && isOut(p)) || (filter === "low" && isLow(p)) || (filter === "hidden" && !p.isActive))
    );
  }, [catalog.products, query, category, filter]);

  const categoryName = (id: string | null) => catalog.categories.find((c) => c.id === id)?.name || "Sans catégorie";
  const open = (draft: Draft) => setEditing({ draft, key: Date.now() });

  const toggleVisible = async (p: AdminProduct, next: boolean) => {
    setToggling(p.id);
    await call(`/products/${p.id}/visibility`, { method: "POST", body: { isActive: next } }, next ? `« ${p.name} » est en vente.` : `« ${p.name} » est masqué.`);
    setToggling(null);
  };

  if (editing) {
    const product = editing.draft.id ? catalog.products.find((p) => p.id === editing.draft.id) || null : null;
    return (
      <ProductEditor
        key={editing.key}
        initial={editing.draft}
        product={product}
        catalog={catalog}
        token={token}
        call={call}
        notify={notify}
        reload={reload}
        onClose={() => setEditing(null)}
        onDuplicate={(copy) => open(copy)}
        onCreated={(id) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, id } } : e))}
      />
    );
  }

  const toggleFilter = (next: StockFilter) => setFilter((current) => (current === next ? "all" : next));

  return (
    <div className="sp-root">
      <div className="kpi-grid-4">
        <Metric icon={ShoppingBag} title="En vente" value={stats.active} sub={`${catalog.products.length} article${catalog.products.length > 1 ? "s" : ""} au total`} />
        <Metric
          icon={PackageX}
          title="En rupture"
          value={stats.out}
          sub="Plus aucune pièce"
          pill={stats.out ? { label: "À réassortir", tone: "gold" } : undefined}
          active={filter === "out"}
          onClick={() => toggleFilter("out")}
        />
        <Metric
          icon={AlertTriangle}
          title="Stock bas"
          value={stats.low}
          sub={`${LOW_STOCK} pièces ou moins sur une taille`}
          active={filter === "low"}
          onClick={() => toggleFilter("low")}
        />
        <Metric icon={Boxes} title="Valeur du stock" value={formatFcfa(stats.value)} sub={`${stats.pieces} pièce${stats.pieces > 1 ? "s" : ""} en vente`} />
      </div>

      <div className="sp-toolbar">
        <label className="sa-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un article" aria-label="Rechercher un article" />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche">
              <X size={14} />
            </button>
          )}
        </label>
        <select className="input-clean sp-category" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {catalog.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">Sans catégorie</option>
        </select>
        <button type="button" className="sa-btn sp-add" onClick={() => open(toDraft(null))}>
          <Plus size={16} /> Ajouter un article
        </button>
      </div>

      <div className="sa-chips">
        {(
          [
            { id: "all", label: "Tous", count: 0 },
            { id: "low", label: "Stock bas", count: stats.low },
            { id: "out", label: "En rupture", count: stats.out },
            { id: "hidden", label: "Masqués", count: stats.hidden },
          ] as Array<{ id: StockFilter; label: string; count: number }>
        ).map((f) => (
          <button key={f.id} type="button" className={`sa-chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}
            {f.count ? <span className="sa-chip-count">{f.count}</span> : null}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="sa-empty">
          <ShoppingBag size={26} />
          <p>
            {catalog.products.length === 0
              ? "Aucun article pour l'instant. Ajoutez le premier avec ses photos, ses tailles, ses couleurs et son stock."
              : "Aucun article ne correspond."}
          </p>
          {catalog.products.length === 0 && (
            <button type="button" className="sa-btn" onClick={() => open(toDraft(null))}>
              <Plus size={16} /> Ajouter un article
            </button>
          )}
        </div>
      ) : (
        <ul className="sp-grid">
          {products.map((p) => {
            const stock = totalStock(p);
            const zero = p.variants.filter((v) => v.stock <= 0).length;
            const discount = p.promoActive && p.promoPriceFcfa !== null && p.priceFcfa > 0 ? Math.round((1 - p.promoPriceFcfa / p.priceFcfa) * 100) : 0;
            return (
              <li key={p.id} className={`sp-card ${p.isActive ? "" : "hidden"}`}>
                <button type="button" className="sp-card-open" onClick={() => open(toDraft(p))} aria-label={`Modifier ${p.name}`}>
                  <span className="sp-card-photo">
                    {p.images[0] ? <img src={shopImageUrl(p.images[0])} alt="" loading="lazy" /> : <ImagePlus size={24} />}
                    <span className="sp-card-badges">
                      {discount > 0 && <span className="sp-badge">-{discount} %</span>}
                      {stock === 0 ? (
                        <span className="sp-badge out">Rupture</span>
                      ) : isLow(p) ? (
                        <span className="sp-badge low">Stock bas</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="sp-card-info">
                    <strong>{p.name}</strong>
                    <span className="sa-muted">{categoryName(p.categoryId)}</span>
                    <span className="sp-card-price">
                      {formatFcfa(effectivePrice(p))}
                      {discount > 0 && <s>{formatFcfa(p.priceFcfa)}</s>}
                    </span>
                    <span className={`sp-card-stock ${stock === 0 ? "out" : ""}`}>
                      {stock} pièce{stock > 1 ? "s" : ""}
                      {zero > 0 && stock > 0 && ` · ${zero} épuisée${zero > 1 ? "s" : ""}`}
                    </span>
                  </span>
                </button>
                <div className="sp-card-foot">
                  <Switch
                    checked={p.isActive}
                    disabled={toggling === p.id}
                    onChange={(next) => toggleVisible(p, next)}
                    label={p.isActive ? "En vente" : "Masqué"}
                  />
                  <button type="button" className="sa-link" onClick={() => open(toDraft(p))}>
                    Modifier
                  </button>
                </div>
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
  initial,
  product,
  catalog,
  token,
  call,
  notify,
  reload,
  onClose,
  onDuplicate,
  onCreated,
}: {
  initial: Draft;
  product: AdminProduct | null;
  catalog: AdminCatalog;
  token: string | null;
  call: Call;
  notify: Notify;
  reload: () => Promise<void>;
  onClose: () => void;
  onDuplicate: (copy: Draft) => void;
  /** L'article vient d'être créé : la page suit maintenant l'article enregistré (ses photos, son stock). */
  onCreated: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  // Ce qui est enregistré : sert à savoir s'il reste des modifications, et quelles cases de stock elle a touchées.
  const [saved, setSaved] = useState<Draft>(initial);
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [fillAll, setFillAll] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<Array<{ file: File; url: string }>>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const rows = draft.colors.length ? draft.colors : [""];
  const cols = draft.sizes.length ? draft.sizes : [""];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || pending.length > 0;
  const images = product?.images || [];

  const price = Number(draft.price);
  const promo = draft.promoPrice.trim() ? Number(draft.promoPrice) : null;
  const promoError = promo !== null && Number.isFinite(price) && promo >= price ? "Le prix promo doit être plus bas que le prix." : "";
  const discount = promo !== null && price > 0 && !promoError ? Math.round((1 - promo / price) * 100) : 0;
  const cell = (color: string, size: string) => Math.max(0, Math.floor(Number(draft.stock[stockKey(color, size)]) || 0));
  const total = rows.reduce((sum, color) => sum + cols.reduce((s, size) => s + cell(color, size), 0), 0);

  // Les aperçus des photos en attente sont libérés en quittant la page.
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  // Quitter la page avec des modifications : le navigateur prévient.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const close = () => {
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Quitter quand même ?")) return;
    onClose();
  };

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
  const applyFill = () => {
    if (fillAll === "") return;
    const value = String(Math.max(0, Math.floor(Number(fillAll) || 0)));
    const stock = { ...draft.stock };
    for (const color of rows) for (const size of cols) stock[stockKey(color, size)] = value;
    update({ stock });
    setFillAll("");
  };

  const uploadFiles = async (productId: string, files: File[]) => {
    setUploading(true);
    let sent = 0;
    try {
      for (const file of files.slice(0, MAX_PHOTOS - images.length)) {
        const dataUrl = await compressImage(file, 1600, 0.82);
        await apiRequest(`/api/admin/shop/products/${productId}/images`, { method: "POST", token, body: { dataUrl } });
        sent += 1;
      }
      if (sent) notify(sent > 1 ? `${sent} photos ajoutées.` : "Photo ajoutée.", "Article");
    } catch (err: any) {
      notify(err?.message || "Une photo n'a pas pu être envoyée.", "Photos", "error");
    } finally {
      await reload();
      setUploading(false);
    }
  };

  const pickPhotos = async (list: FileList | null) => {
    const files = Array.from(list || []).filter((f) => f.type.startsWith("image/"));
    if (fileInput.current) fileInput.current.value = "";
    if (!files.length) return;
    if (draft.id) {
      await uploadFiles(draft.id, files);
    } else {
      // Article pas encore créé : les photos partent juste après la création.
      setPending((p) => [...p, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS));
    }
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.price.trim() || !Number.isFinite(price) || price < 0) {
      notify("Indiquez au moins le nom et le prix de l'article.", "Article", "error");
      return;
    }
    if (promoError) {
      notify(promoError, "Prix", "error");
      return;
    }
    // Une case qu'elle n'a pas touchée garde le stock du moment : une commande passée entre-temps n'est pas effacée.
    const live = new Map((product?.variants || []).map((v) => [stockKey(v.color, v.size), v.stock]));
    const variants = rows.flatMap((color) =>
      cols.map((size) => {
        const key = stockKey(color, size);
        const untouched = (draft.stock[key] ?? "0") === (saved.stock[key] ?? "0");
        return { color, size, stock: untouched && live.has(key) ? Math.max(0, live.get(key)!) : cell(color, size) };
      })
    );
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId || null,
      priceFcfa: Math.round(price),
      promoPriceFcfa: promo === null ? null : Math.round(promo),
      promoEndsAt: draft.promoEndsAt || null,
      originCountry: draft.originCountry,
      weightKg: draft.weightKg.trim() ? Number(draft.weightKg.replace(",", ".")) : null,
      isActive: draft.isActive,
      position: product?.position ?? catalog.products.length,
      variants,
    };
    setSaving(true);
    const result = (await call(
      draft.id ? `/products/${draft.id}` : "/products",
      { method: draft.id ? "PUT" : "POST", body },
      draft.id ? "Article enregistré : la boutique est à jour." : "Article créé."
    )) as { id?: string } | null;
    if (result) {
      const next = {
        ...draft,
        id: draft.id || result.id || null,
        stock: Object.fromEntries(variants.map((v) => [stockKey(v.color, v.size), String(v.stock)])),
      };
      setDraft(next);
      setSaved(next);
      if (!draft.id && next.id) onCreated(next.id);
      if (!draft.id && next.id && pending.length) {
        const files = pending.map((p) => p.file);
        pending.forEach((p) => URL.revokeObjectURL(p.url));
        setPending([]);
        await uploadFiles(next.id, files);
      }
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!draft.id || !window.confirm(`Supprimer « ${draft.name} » de la boutique ? Les commandes déjà passées restent intactes.`)) return;
    if (await call(`/products/${draft.id}`, { method: "DELETE" }, "Article supprimé.")) onClose();
  };

  const duplicate = () => {
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Dupliquer quand même ?")) return;
    onDuplicate({ ...saved, id: null, name: `${saved.name} (copie)` });
  };

  return (
    <div className="sp-editor">
      <div className="sp-editor-head">
        <button type="button" className="sa-btn soft" onClick={close}>
          <ArrowLeft size={15} /> Articles
        </button>
        <h3>{draft.id ? saved.name || "Article" : "Nouvel article"}</h3>
        {draft.id && <span className={`sa-status ${draft.isActive ? "sa-status-CONFIRMED" : ""}`}>{saved.isActive ? "En vente" : "Masqué"}</span>}
        {draft.id && saved.isActive && (
          <a className="sa-link sp-view" href={`/boutique/article/${draft.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> Voir dans la boutique
          </a>
        )}
      </div>

      <div className="sp-editor-grid">
        <div className="sp-col">
          <section className="sa-card">
            <h3>Informations</h3>
            <div className="sa-grid2">
              <label className="sa-field">
                <span>Nom de l&apos;article</span>
                <input className="input-clean" value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ex. Escarpin verni" />
              </label>
              <label className="sa-field">
                <span>Catégorie</span>
                <select className="input-clean" value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
                  <option value="">Sans catégorie</option>
                  {catalog.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="sa-field">
              <span>Description</span>
              <textarea
                className="input-clean"
                rows={3}
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Matière, coupe, conseils de taille…"
              />
            </label>
          </section>

          <section className="sa-card">
            <div className="sa-card-head">
              <h3>Prix</h3>
              {discount > 0 && <span className="sp-badge">-{discount} %</span>}
            </div>
            <div className="sa-grid2">
              <label className="sa-field">
                <span>Prix (FCFA)</span>
                <input className="input-clean" inputMode="numeric" value={draft.price} onChange={(e) => update({ price: e.target.value.replace(/[^\d]/g, "") })} />
              </label>
              <label className="sa-field">
                <span>Prix promo (facultatif)</span>
                <input
                  className={`input-clean ${promoError ? "sp-invalid" : ""}`}
                  inputMode="numeric"
                  value={draft.promoPrice}
                  onChange={(e) => update({ promoPrice: e.target.value.replace(/[^\d]/g, "") })}
                />
              </label>
              <label className="sa-field">
                <span>Fin de la promo (facultatif)</span>
                <input className="input-clean" type="date" value={draft.promoEndsAt} onChange={(e) => update({ promoEndsAt: e.target.value })} />
              </label>
            </div>
            {promoError ? (
              <p className="sp-error">{promoError}</p>
            ) : (
              <p className="sa-hint">Sans date de fin, la promo dure jusqu&apos;à ce que vous vidiez le prix promo.</p>
            )}
          </section>

          <section className="sa-card">
            <div className="sa-card-head">
              <h3>Tailles, couleurs et stock</h3>
              <span className="sa-status">{total} pièce{total > 1 ? "s" : ""}</span>
            </div>
            <div className="sp-presets">
              {SIZE_PRESETS.filter((p) => p.sizes.length > 0).map((preset) => (
                <button key={preset.id} type="button" className="sa-chip" onClick={() => addSizes(preset.sizes)}>
                  + {preset.label}
                </button>
              ))}
            </div>
            <div className="sp-adders">
              <div className="sa-field">
                <span>Pointures, de… à…</span>
                <div className="sp-inline">
                  <input className="input-clean" inputMode="numeric" placeholder="36" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} aria-label="Première pointure" />
                  <input className="input-clean" inputMode="numeric" placeholder="41" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} aria-label="Dernière pointure" />
                  <button type="button" className="sa-btn soft" onClick={addRange} aria-label="Ajouter les pointures">
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <div className="sa-field">
                <span>Autre taille</span>
                <div className="sp-inline">
                  <input
                    className="input-clean"
                    placeholder="XL, Unique…"
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
                  <button type="button" className="sa-btn soft" aria-label="Ajouter la taille" onClick={() => { addSizes([sizeInput]); setSizeInput(""); }}>
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <div className="sa-field">
                <span>Couleur</span>
                <div className="sp-inline">
                  <input
                    className="input-clean"
                    placeholder="Noir, Beige…"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addColor();
                      }
                    }}
                  />
                  <button type="button" className="sa-btn soft" aria-label="Ajouter la couleur" onClick={addColor}>
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>

            {(draft.sizes.length > 0 || draft.colors.length > 0) && (
              <div className="sp-tags">
                {draft.sizes.map((s) => (
                  <button key={`s-${s}`} type="button" className="sp-tag" title="Retirer cette taille" onClick={() => update({ sizes: draft.sizes.filter((x) => x !== s) })}>
                    {s} <X size={12} />
                  </button>
                ))}
                {draft.colors.map((c) => (
                  <button key={`c-${c}`} type="button" className="sp-tag color" title="Retirer cette couleur" onClick={() => update({ colors: draft.colors.filter((x) => x !== c) })}>
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
                    {cols.length > 1 && <th className="sp-total-col">Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((color) => (
                    <tr key={color}>
                      <th>{color || (draft.sizes.length ? "Stock" : "")}</th>
                      {cols.map((size) => {
                        const key = stockKey(color, size);
                        const value = draft.stock[key] ?? "0";
                        const n = Number(value);
                        return (
                          <td key={key}>
                            <input
                              className={`input-clean sp-stock-input ${n === 0 ? "zero" : n <= LOW_STOCK ? "low" : ""}`}
                              inputMode="numeric"
                              value={value}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => update({ stock: { ...draft.stock, [key]: e.target.value.replace(/[^\d]/g, "") } })}
                              aria-label={`Stock ${[color, size].filter(Boolean).join(" ")}`}
                            />
                          </td>
                        );
                      })}
                      {cols.length > 1 && <td className="sp-total-col">{cols.reduce((s, size) => s + cell(color, size), 0)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length * cols.length > 1 && (
              <div className="sp-fill">
                <span>Mettre partout</span>
                <input className="input-clean" inputMode="numeric" placeholder="0" value={fillAll} onChange={(e) => setFillAll(e.target.value.replace(/[^\d]/g, ""))} aria-label="Stock pour toutes les cases" />
                <button type="button" className="sa-btn soft" onClick={applyFill} disabled={fillAll === ""}>
                  Appliquer
                </button>
              </div>
            )}
            <p className="sa-hint">0 = épuisée : la taille reste visible, grisée. Le stock baisse à chaque commande et revient si elle est annulée.</p>
          </section>
        </div>

        <div className="sp-col sp-side">
          <section className="sa-card">
            <div className="sa-card-head">
              <h3>Photos</h3>
              <span className="sa-muted">
                {images.length + pending.length}/{MAX_PHOTOS}
              </span>
            </div>
            <div className="sp-photos">
              {images.map((imageId, index) => (
                <div key={imageId} className="sp-photo-item">
                  <img src={shopImageUrl(imageId)} alt="" />
                  <div className="sp-photo-actions">
                    {index > 0 ? (
                      <button
                        type="button"
                        title="Mettre en couverture"
                        onClick={() => call(`/products/${draft.id}/images/${imageId}/cover`, { method: "POST" }, "Photo de couverture changée.")}
                      >
                        <Star size={14} />
                      </button>
                    ) : (
                      <span className="sp-cover">Couverture</span>
                    )}
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={() => window.confirm("Supprimer cette photo ?") && call(`/products/${draft.id}/images/${imageId}`, { method: "DELETE" }, "Photo supprimée.")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {pending.map((p, index) => (
                <div key={p.url} className="sp-photo-item pending">
                  <img src={p.url} alt="" />
                  <div className="sp-photo-actions">
                    {images.length === 0 && index === 0 ? <span className="sp-cover">Couverture</span> : <span />}
                    <button
                      type="button"
                      title="Retirer"
                      onClick={() => {
                        URL.revokeObjectURL(p.url);
                        setPending((list) => list.filter((x) => x.url !== p.url));
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {images.length + pending.length < MAX_PHOTOS && (
                <button type="button" className="sp-photo-add" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  <ImagePlus size={22} />
                  <span>{uploading ? "Envoi…" : "Ajouter"}</span>
                </button>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => pickPhotos(e.target.files)} />
            <p className="sa-hint">{pending.length ? "Ces photos partiront à l'enregistrement." : "La première photo sert de couverture. Elles sont réduites avant l'envoi."}</p>
          </section>

          <section className="sa-card">
            <h3>Mise en vente</h3>
            <Switch checked={draft.isActive} onChange={(next) => update({ isActive: next })} label={draft.isActive ? "Visible dans la boutique" : "Masqué aux clients"} />
          </section>

          <section className="sa-card">
            <h3>Livraison Roum Transit</h3>
            <div className="sa-grid2">
              <label className="sa-field">
                <span>Pays de départ</span>
                <select className="input-clean" value={draft.originCountry} onChange={(e) => update({ originCountry: e.target.value })}>
                  {[...new Set([...ORIGINS, draft.originCountry])].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sa-field">
                <span>Poids d&apos;une pièce (kg)</span>
                <input className="input-clean" inputMode="decimal" placeholder="1" value={draft.weightKg} onChange={(e) => update({ weightKg: e.target.value.replace(/[^\d.,]/g, "") })} />
              </label>
            </div>
            <p className="sa-hint">Sert au prix Roum Transit calculé pour le client. Sans poids : 1 kg.</p>
          </section>
        </div>
      </div>

      <div className="sp-savebar">
        <span className={`sp-save-state ${dirty ? "dirty" : ""}`}>{dirty ? "Modifications non enregistrées" : draft.id ? "Tout est enregistré" : "Nouvel article"}</span>
        <div className="sp-save-actions">
          {draft.id && (
            <>
              <button type="button" className="sa-link danger" onClick={remove}>
                <Trash2 size={14} /> Supprimer
              </button>
              <button type="button" className="sa-link" onClick={duplicate}>
                <Copy size={14} /> Dupliquer
              </button>
            </>
          )}
          <button type="button" className="sa-btn" disabled={saving || uploading || (!dirty && Boolean(draft.id))} onClick={save}>
            {saving ? "Enregistrement…" : draft.id ? "Enregistrer" : "Créer l'article"}
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: PRODUCT_STYLES }} />
    </div>
  );
}

const PRODUCT_STYLES = `
  .sp-root, .sp-editor { display: grid; gap: 16px; }
  .sp-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .sp-toolbar .sa-search { flex: 1 1 260px; max-width: none; }
  .sp-category { width: auto; min-width: 190px; border-radius: 9999px; min-height: 42px; }
  .sp-add { margin-left: auto; min-height: 42px; }

  .sp-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
  .sp-card { display: flex; flex-direction: column; border: 1px solid #EFE6D9; border-radius: 18px; background: #FFFFFF; overflow: hidden; transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease; }
  .sp-card:hover { border-color: #E2D5C8; }
  .sp-card.hidden .sp-card-photo img { opacity: 0.5; filter: grayscale(0.4); }
  .sp-card-open { display: flex; flex-direction: column; padding: 0; border: 0; background: none; font: inherit; color: #1B1411; text-align: left; cursor: pointer; }
  .sp-card-photo { position: relative; display: flex; align-items: center; justify-content: center; aspect-ratio: 4 / 3; background: #F3EBDF; color: #B8ABA3; overflow: hidden; }
  .sp-card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
  .sp-card-badges { position: absolute; top: 8px; left: 8px; display: flex; flex-wrap: wrap; gap: 5px; }
  .sp-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 9999px; background: #FFFBF4; color: #3A2A21; font-size: 0.72rem; font-weight: 800; box-shadow: 0 4px 10px -6px rgba(58, 42, 33, 0.5); }
  .sp-badge.out { background: #FBEAEA; color: #A12B2B; }
  .sp-badge.low { background: #FBF6EC; color: #6F5B36; }
  .sp-card-info { display: grid; gap: 3px; padding: 12px 14px 6px; }
  .sp-card-info strong { font-size: 0.95rem; line-height: 1.3; }
  .sp-card-price { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 6px; margin-top: 4px; font-weight: 800; font-size: 0.95rem; }
  .sp-card-price s { color: var(--text-muted); font-weight: 500; font-size: 0.8rem; }
  .sp-card-stock { font-size: 0.8rem; font-weight: 600; color: #6B5844; }
  .sp-card-stock.out { color: #A12B2B; }
  .sp-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding: 8px 14px 12px; }

  .sp-editor-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; }
  .sp-editor-head h3 { margin: 0; font-size: 1.15rem; }
  .sp-view { margin-left: auto; }
  .sp-editor-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: 16px; align-items: start; }
  .sp-col { display: grid; gap: 16px; min-width: 0; }
  .sp-side { position: sticky; top: 16px; }
  .sp-invalid { border-color: #E9B4B4 !important; background: #FFF8F8 !important; }
  .sp-error { margin: 0; font-size: 0.8rem; font-weight: 600; color: #A12B2B; }
  .sp-presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .sp-adders { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
  .sp-inline { display: flex; gap: 6px; }
  .sp-inline .input-clean { min-width: 0; flex: 1; }
  .sp-inline .sa-btn { padding: 0 12px; flex-shrink: 0; }
  .sp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .sp-tag { display: inline-flex; align-items: center; gap: 4px; min-height: 30px; padding: 0 10px; border: 0; border-radius: 9999px; background: #F3EBDF; color: #3A2A21; font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
  .sp-tag:hover { background: #FBEAEA; color: #A12B2B; }
  .sp-tag.color { background: #3A2A21; color: #FFFBF4; }
  .sp-tag.color:hover { background: #A12B2B; }
  .sp-table-wrap { overflow-x: auto; margin: 0 -4px; }
  .sp-table { border-collapse: separate; border-spacing: 6px; }
  .sp-table th { font-size: 0.78rem; color: var(--text-secondary); text-align: left; white-space: nowrap; padding: 0 4px; }
  .sp-table thead th { text-align: center; }
  .sp-stock-input { width: 60px; text-align: center; font-weight: 700; }
  .sp-stock-input.zero { background: #FBEAEA; color: #A12B2B; }
  .sp-stock-input.low { background: #FBF6EC; }
  .sp-total-col { text-align: center; font-weight: 800; font-size: 0.86rem; color: #6B5844; padding: 0 6px; }
  .sp-fill { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }
  .sp-fill .input-clean { width: 72px; text-align: center; }

  .sp-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  .sp-photo-item { position: relative; aspect-ratio: 5 / 6; border-radius: 14px; overflow: hidden; background: #F3EBDF; }
  .sp-photo-item.pending { outline: 2px dashed #D9CBB8; outline-offset: -2px; }
  .sp-photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sp-photo-actions { position: absolute; left: 6px; right: 6px; bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
  .sp-photo-actions button { width: 30px; height: 30px; border: 0; border-radius: 50%; background: rgba(255, 251, 244, 0.95); color: #3A2A21; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .sp-photo-actions button:hover { background: #FFFFFF; }
  .sp-cover { padding: 3px 8px; border-radius: 9999px; background: #3A2A21; color: #FFFBF4; font-size: 0.66rem; font-weight: 700; }
  .sp-photo-add { aspect-ratio: 5 / 6; border: 1px dashed #D9CBB8; border-radius: 14px; background: #FFFBF4; color: #6B5844; display: grid; place-items: center; align-content: center; gap: 6px; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
  .sp-photo-add:hover { background: #F3EBDF; }

  .sp-savebar { position: sticky; bottom: 14px; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 8px 8px 18px; border: 1px solid #EFE6D9; border-radius: 9999px; background: rgba(255, 255, 255, 0.96); box-shadow: 0 10px 30px -14px rgba(58, 42, 33, 0.45); backdrop-filter: blur(8px); }
  .sp-save-state { display: inline-flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 700; color: var(--text-muted); }
  .sp-save-state.dirty { color: #6F5B36; }
  .sp-save-state.dirty::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #7D6A45; }
  .sp-save-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; }

  @media (max-width: 1100px) {
    .sp-editor-grid { grid-template-columns: minmax(0, 1fr); }
    .sp-side { position: static; }
  }
  @media (max-width: 640px) {
    .sp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .sp-card-info { padding: 10px 10px 4px; }
    .sp-card-foot { padding: 6px 10px 10px; }
    .sp-card-foot .sa-link { display: none; }
    .sp-category, .sp-add { flex: 1 1 100%; margin-left: 0; justify-content: center; }
    .sp-savebar { border-radius: 20px; padding: 10px 12px; }
    .sp-save-actions { width: 100%; justify-content: space-between; }
  }
`;
