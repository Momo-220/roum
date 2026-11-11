"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Tags, Trash2, Truck } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { formatFcfa } from "@/shared/shop";
import type { AdminCatalog } from "./ShopProducts";
import type { Notify } from "./ShopAdmin";
import { Switch } from "./ShopAdminUi";

type Call = (path: string, init: { method: "POST" | "PUT" | "DELETE"; body?: unknown }, success?: string) => Promise<unknown>;

type Zone = AdminCatalog["zones"][number];
type ZoneForm = { name: string; country: string; price: string; delay: string };

const emptyZone: ZoneForm = { name: "", country: "Côte d'Ivoire", price: "", delay: "" };

/** Catégories de la boutique et livraisons : ses zones à prix fixe, et Roum Transit au poids. */
export function ShopSetup({
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
  const [newCategory, setNewCategory] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [zone, setZone] = useState<ZoneForm>(emptyZone);
  const [editing, setEditing] = useState<Record<string, ZoneForm>>({});
  const [moving, setMoving] = useState(false);

  const productCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of catalog.products) if (p.categoryId) counts.set(p.categoryId, (counts.get(p.categoryId) || 0) + 1);
    return counts;
  }, [catalog.products]);

  const zonesByCountry = useMemo(() => {
    const groups = new Map<string, Zone[]>();
    for (const z of catalog.zones) groups.set(z.country, [...(groups.get(z.country) || []), z]);
    return [...groups.entries()];
  }, [catalog.zones]);
  const countries = useMemo(() => [...new Set(["Côte d'Ivoire", ...catalog.zones.map((z) => z.country)])], [catalog.zones]);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    if (await call("/categories", { method: "POST", body: { name: newCategory.trim(), position: catalog.categories.length } }, "Catégorie ajoutée.")) {
      setNewCategory("");
    }
  };

  const renameCategory = (id: string, current: string) => {
    const name = (names[id] ?? current).trim();
    if (!name) {
      setNames((n) => ({ ...n, [id]: current }));
      return;
    }
    if (name !== current) call(`/categories/${id}`, { method: "PUT", body: { name } }, "Catégorie renommée.");
  };

  // L'ordre des catégories est celui des boutons en haut de la boutique.
  const moveCategory = async (index: number, delta: number) => {
    const list = [...catalog.categories];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setMoving(true);
    try {
      await Promise.all(
        list
          .map((c, position) => ({ c, position }))
          .filter(({ c, position }) => c.position !== position)
          .map(({ c, position }) => apiRequest(`/api/admin/shop/categories/${c.id}`, { method: "PUT", token, body: { name: c.name, position } }))
      );
      await reload();
    } catch (err: any) {
      notify(err?.message || "L'ordre n'a pas pu être changé.", "Catégories", "error");
    } finally {
      setMoving(false);
    }
  };

  const addZone = async () => {
    if (!zone.name.trim() || !zone.country.trim() || zone.price === "") {
      notify("Indiquez la ville ou la zone, le pays et le prix.", "Livraison", "error");
      return;
    }
    const ok = await call(
      "/zones",
      {
        method: "POST",
        body: { name: zone.name.trim(), country: zone.country.trim(), priceFcfa: Number(zone.price), delay: zone.delay.trim(), position: catalog.zones.length },
      },
      "Zone de livraison ajoutée."
    );
    if (ok) setZone({ ...emptyZone, country: zone.country });
  };

  const saveZone = async (z: Zone) => {
    const e = editing[z.id];
    if (!e || !e.name.trim() || !e.country.trim()) return;
    const ok = await call(
      `/zones/${z.id}`,
      {
        method: "PUT",
        body: { name: e.name.trim(), country: e.country.trim(), priceFcfa: Number(e.price) || 0, delay: e.delay.trim(), position: z.position, isActive: z.isActive },
      },
      "Zone enregistrée."
    );
    if (ok) setEditing(({ [z.id]: _done, ...rest }) => rest);
  };

  const toggleZone = (z: Zone, isActive: boolean) =>
    call(`/zones/${z.id}`, { method: "PUT", body: { name: z.name, country: z.country, priceFcfa: z.priceFcfa, delay: z.delay, position: z.position, isActive } });

  const toggleTransit = async (on: boolean) => {
    try {
      await apiRequest("/api/admin/settings", { method: "PUT", token, body: { shop_transit_delivery: on ? "on" : "off" } });
      notify(on ? "Roum Transit est proposé à la livraison." : "Roum Transit n'est plus proposé.", "Livraison");
      await reload();
    } catch (err: any) {
      notify(err?.message || "Réglage non enregistré.", "Livraison", "error");
    }
  };

  const zoneFields = (value: ZoneForm, onChange: (next: ZoneForm) => void) => (
    <>
      <label className="sa-field">
        <span>Ville ou zone</span>
        <input className="input-clean" placeholder="Ex. Abidjan" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </label>
      <label className="sa-field">
        <span>Pays</span>
        <input className="input-clean" list="ss-countries" value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} />
      </label>
      <label className="sa-field">
        <span>Prix (FCFA)</span>
        <input className="input-clean" inputMode="numeric" placeholder="2000" value={value.price} onChange={(e) => onChange({ ...value, price: e.target.value.replace(/[^\d]/g, "") })} />
      </label>
      <label className="sa-field">
        <span>Délai</span>
        <input className="input-clean" placeholder="Ex. 24 h" value={value.delay} onChange={(e) => onChange({ ...value, delay: e.target.value })} />
      </label>
    </>
  );

  return (
    <div className="ss-grid">
      <datalist id="ss-countries">
        {countries.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <section className="sa-card">
        <div className="sa-card-head">
          <h3>
            <Tags size={17} /> Catégories
          </h3>
          <span className="sa-muted">{catalog.categories.length}</span>
        </div>
        <p className="sa-hint">Elles s&apos;affichent dans cet ordre en haut de la boutique. Une catégorie vide ne s&apos;affiche pas.</p>

        {catalog.categories.length === 0 ? (
          <p className="ss-empty">Aucune catégorie. Exemple : Chaussures femme, Sacs, Vêtements.</p>
        ) : (
          <ul className="ss-list">
            {catalog.categories.map((c, index) => {
              const count = productCount.get(c.id) || 0;
              return (
                <li key={c.id} className="ss-cat">
                  <span className="ss-order">
                    <button type="button" disabled={moving || index === 0} onClick={() => moveCategory(index, -1)} aria-label="Monter">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" disabled={moving || index === catalog.categories.length - 1} onClick={() => moveCategory(index, 1)} aria-label="Descendre">
                      <ArrowDown size={14} />
                    </button>
                  </span>
                  <span className="ss-cat-name">
                    <input
                      className="input-clean"
                      value={names[c.id] ?? c.name}
                      onChange={(e) => setNames({ ...names, [c.id]: e.target.value })}
                      onBlur={() => renameCategory(c.id, c.name)}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      aria-label="Nom de la catégorie"
                    />
                    <small>
                      {count} article{count > 1 ? "s" : ""}
                    </small>
                  </span>
                  <Switch
                    checked={c.isActive}
                    onChange={(next) => call(`/categories/${c.id}`, { method: "PUT", body: { name: c.name, isActive: next } })}
                    label="Visible"
                  />
                  <button
                    type="button"
                    className="ss-icon danger"
                    onClick={() =>
                      window.confirm(
                        count
                          ? `Supprimer « ${c.name} » ? Ses ${count} article(s) restent en vente, sans catégorie.`
                          : `Supprimer la catégorie « ${c.name} » ?`
                      ) && call(`/categories/${c.id}`, { method: "DELETE" }, "Catégorie supprimée.")
                    }
                    aria-label="Supprimer la catégorie"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="ss-add">
          <input
            className="input-clean"
            placeholder="Nouvelle catégorie"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button type="button" className="sa-btn" onClick={addCategory} disabled={!newCategory.trim()}>
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </section>

      <div className="ss-col">
        <section className="sa-card">
          <div className="sa-card-head">
            <h3>
              <Truck size={17} /> Livraison Roum Boutique
            </h3>
            <span className="sa-muted">{catalog.zones.filter((z) => z.isActive).length} active(s)</span>
          </div>
          <p className="sa-hint">Vos prix à vous, ville par ville. Le client voit les zones du pays qu&apos;il choisit.</p>

          {zonesByCountry.length === 0 ? (
            <p className="ss-empty">Aucune zone. Ajoutez par exemple Abidjan à 2 000 FCFA, livrée en 24 h.</p>
          ) : (
            zonesByCountry.map(([country, zones]) => (
              <div key={country} className="ss-country">
                <h4>{country}</h4>
                <ul className="ss-list">
                  {zones.map((z) => {
                    const e = editing[z.id];
                    return (
                      <li key={z.id} className={`ss-zone ${z.isActive ? "" : "off"}`}>
                        {e ? (
                          <div className="ss-zone-edit">
                            <div className="ss-zone-fields">{zoneFields(e, (next) => setEditing({ ...editing, [z.id]: next }))}</div>
                            <div className="ss-zone-buttons">
                              <button type="button" className="sa-link" onClick={() => setEditing(({ [z.id]: _drop, ...rest }) => rest)}>
                                Annuler
                              </button>
                              <button type="button" className="sa-btn" onClick={() => saveZone(z)}>
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="ss-zone-info">
                              <strong>{z.name}</strong>
                              <span className="sa-muted">{[formatFcfa(z.priceFcfa), z.delay].filter(Boolean).join(" · ")}</span>
                            </span>
                            <Switch checked={z.isActive} onChange={(next) => toggleZone(z, next)} label={z.isActive ? "Active" : "Inactive"} />
                            <button
                              type="button"
                              className="ss-icon"
                              onClick={() =>
                                setEditing({ ...editing, [z.id]: { name: z.name, country: z.country, price: String(z.priceFcfa), delay: z.delay } })
                              }
                              aria-label="Modifier la zone"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="ss-icon danger"
                              onClick={() => window.confirm(`Supprimer la zone « ${z.name} » ?`) && call(`/zones/${z.id}`, { method: "DELETE" }, "Zone supprimée.")}
                              aria-label="Supprimer la zone"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}

          <div className="ss-new">
            <h4>Nouvelle zone</h4>
            <div className="ss-zone-fields">{zoneFields(zone, setZone)}</div>
            <button type="button" className="sa-btn ss-new-btn" onClick={addZone}>
              <Plus size={15} /> Ajouter la zone
            </button>
          </div>
        </section>

        <section className="sa-card">
          <h3>Livraison par Roum Transit</h3>
          <Switch checked={catalog.transitDelivery} onChange={toggleTransit} label="Proposer aussi Roum Transit, calculé au poids" />
          <p className="sa-hint">
            Le prix vient de Tarifs &amp; Grilles, du pays de départ de l&apos;article jusqu&apos;au pays du client. Le pays de départ et le poids se règlent
            dans chaque article.
          </p>
        </section>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ss-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 16px; align-items: start; }
        .ss-col { display: grid; gap: 16px; min-width: 0; }
        .ss-grid .sa-card h3 { display: inline-flex; align-items: center; gap: 8px; }
        .ss-empty { margin: 0; padding: 16px; border: 1px dashed #E2D5C8; border-radius: 14px; color: #8C7D75; font-size: 0.86rem; text-align: center; }
        .ss-list { list-style: none; margin: 0; padding: 0; display: grid; }
        .ss-cat, .ss-zone { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F3EBDF; }
        .ss-list li:last-child { border-bottom: 0; }
        .ss-order { display: grid; gap: 2px; }
        .ss-order button { width: 26px; height: 20px; border: 0; border-radius: 6px; background: #FAF5F0; color: #6B5844; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ss-order button:hover:not(:disabled) { background: #EADDCB; }
        .ss-order button:disabled { opacity: 0.3; cursor: default; }
        .ss-cat-name { flex: 1; display: grid; gap: 2px; min-width: 150px; }
        .ss-cat-name small { padding-left: 4px; color: var(--text-muted); font-size: 0.74rem; font-weight: 600; }
        .ss-icon { width: 34px; height: 34px; border: 0; border-radius: 50%; background: #FAF5F0; color: #6B5844; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; }
        .ss-icon:hover { background: #EADDCB; color: #3A2A21; }
        .ss-icon.danger:hover { background: #FBEAEA; color: #A12B2B; }
        .ss-add { display: flex; gap: 8px; }
        .ss-add .input-clean { flex: 1; min-width: 0; }
        .ss-country h4, .ss-new h4 { margin: 4px 0 2px; font-size: 0.74rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #8C7D75; }
        .ss-zone.off .ss-zone-info { opacity: 0.55; }
        .ss-zone-info { flex: 1; display: grid; gap: 2px; min-width: 150px; }
        .ss-zone-edit { width: 100%; display: grid; gap: 10px; }
        .ss-zone-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
        .ss-zone-buttons { display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
        .ss-new { display: grid; gap: 10px; padding: 14px; border-radius: 16px; background: #FAF5F0; }
        .ss-new-btn { justify-self: start; }
        @media (max-width: 1000px) {
          .ss-grid { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 520px) {
          .ss-new-btn { justify-self: stretch; justify-content: center; }
          .ss-cat .sx-label { display: none; }
        }
      `,
        }}
      />
    </div>
  );
}
