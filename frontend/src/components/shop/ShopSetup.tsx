"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { formatFcfa } from "@/shared/shop";
import type { AdminCatalog } from "./ShopProducts";
import type { Notify } from "./ShopAdmin";

type Call = (path: string, init: { method: "POST" | "PUT" | "DELETE"; body?: unknown }, success?: string) => Promise<unknown>;

type Zone = AdminCatalog["zones"][number];

const emptyZone = { name: "", country: "Côte d'Ivoire", price: "", delay: "" };

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
  const [zone, setZone] = useState(emptyZone);
  const [editing, setEditing] = useState<Record<string, { name: string; country: string; price: string; delay: string }>>({});

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    if (await call("/categories", { method: "POST", body: { name: newCategory.trim(), position: catalog.categories.length } }, "Catégorie ajoutée.")) {
      setNewCategory("");
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
    if (ok) setZone(emptyZone);
  };

  const saveZone = (z: Zone) => {
    const e = editing[z.id];
    if (!e) return;
    call(
      `/zones/${z.id}`,
      { method: "PUT", body: { name: e.name.trim(), country: e.country.trim(), priceFcfa: Number(e.price) || 0, delay: e.delay.trim(), position: z.position, isActive: z.isActive } },
      "Zone enregistrée."
    ).then((ok) => ok && setEditing((s) => ({ ...s, [z.id]: undefined as never })));
  };

  const toggleTransit = async (on: boolean) => {
    try {
      await apiRequest("/api/admin/settings", { method: "PUT", token, body: { shop_transit_delivery: on ? "on" : "off" } });
      notify(on ? "Roum Transit est proposé à la livraison." : "Roum Transit n'est plus proposé.", "Livraison");
      await reload();
    } catch (err: any) {
      notify(err?.message || "Réglage non enregistré.", "Livraison", "error");
    }
  };

  return (
    <div className="ss-root">
      <section className="sa-card">
        <h3>Catégories</h3>
        <ul className="ss-list">
          {catalog.categories.map((c) => (
            <li key={c.id} className="ss-row">
              <input
                className="input-clean"
                value={names[c.id] ?? c.name}
                onChange={(e) => setNames({ ...names, [c.id]: e.target.value })}
                onBlur={() => {
                  const name = (names[c.id] ?? c.name).trim();
                  if (name && name !== c.name) call(`/categories/${c.id}`, { method: "PUT", body: { name } }, "Catégorie renommée.");
                }}
                aria-label="Nom de la catégorie"
              />
              <label className="sp-toggle">
                <input
                  type="checkbox"
                  checked={c.isActive}
                  onChange={(e) => call(`/categories/${c.id}`, { method: "PUT", body: { name: c.name, isActive: e.target.checked } })}
                />
                <span>Visible</span>
              </label>
              <button
                type="button"
                className="sa-btn danger"
                onClick={() =>
                  window.confirm(`Supprimer la catégorie « ${c.name} » ? Ses articles restent en vente, sans catégorie.`) &&
                  call(`/categories/${c.id}`, { method: "DELETE" }, "Catégorie supprimée.")
                }
                aria-label="Supprimer la catégorie"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        <div className="ss-row">
          <input
            className="input-clean"
            placeholder="Nouvelle catégorie (ex. Chaussures femme)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button type="button" className="sa-btn" onClick={addCategory}>
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </section>

      <section className="sa-card">
        <h3>Livraison Roum Boutique</h3>
        <p className="sa-hint">Vos prix à vous, ville par ville. Le client voit les zones du pays qu&apos;il choisit.</p>
        <ul className="ss-list">
          {catalog.zones.map((z) => {
            const e = editing[z.id];
            return (
              <li key={z.id} className="ss-zone">
                {e ? (
                  <>
                    <input className="input-clean" value={e.name} onChange={(ev) => setEditing({ ...editing, [z.id]: { ...e, name: ev.target.value } })} aria-label="Ville ou zone" />
                    <input className="input-clean" value={e.country} onChange={(ev) => setEditing({ ...editing, [z.id]: { ...e, country: ev.target.value } })} aria-label="Pays" />
                    <input className="input-clean" inputMode="numeric" value={e.price} onChange={(ev) => setEditing({ ...editing, [z.id]: { ...e, price: ev.target.value.replace(/[^\d]/g, "") } })} aria-label="Prix" />
                    <input className="input-clean" value={e.delay} placeholder="Délai" onChange={(ev) => setEditing({ ...editing, [z.id]: { ...e, delay: ev.target.value } })} aria-label="Délai" />
                    <button type="button" className="sa-btn" onClick={() => saveZone(z)}>Enregistrer</button>
                  </>
                ) : (
                  <>
                    <span className="ss-zone-info">
                      <strong>{z.name}</strong>
                      <span className="sa-muted">
                        {z.country} · {formatFcfa(z.priceFcfa)}
                        {z.delay && ` · ${z.delay}`}
                        {!z.isActive && " · masquée"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="sa-btn soft"
                      onClick={() => setEditing({ ...editing, [z.id]: { name: z.name, country: z.country, price: String(z.priceFcfa), delay: z.delay } })}
                    >
                      Modifier
                    </button>
                    <label className="sp-toggle">
                      <input
                        type="checkbox"
                        checked={z.isActive}
                        onChange={(ev) =>
                          call(`/zones/${z.id}`, { method: "PUT", body: { name: z.name, country: z.country, priceFcfa: z.priceFcfa, delay: z.delay, position: z.position, isActive: ev.target.checked } })
                        }
                      />
                      <span>Active</span>
                    </label>
                    <button type="button" className="sa-btn danger" onClick={() => call(`/zones/${z.id}`, { method: "DELETE" }, "Zone supprimée.")} aria-label="Supprimer la zone">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <div className="ss-zone ss-zone-new">
          <input className="input-clean" placeholder="Ville ou zone (ex. Abidjan)" value={zone.name} onChange={(e) => setZone({ ...zone, name: e.target.value })} />
          <input className="input-clean" placeholder="Pays" value={zone.country} onChange={(e) => setZone({ ...zone, country: e.target.value })} />
          <input className="input-clean" inputMode="numeric" placeholder="Prix (FCFA)" value={zone.price} onChange={(e) => setZone({ ...zone, price: e.target.value.replace(/[^\d]/g, "") })} />
          <input className="input-clean" placeholder="Délai (ex. 24 h)" value={zone.delay} onChange={(e) => setZone({ ...zone, delay: e.target.value })} />
          <button type="button" className="sa-btn" onClick={addZone}>
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </section>

      <section className="sa-card">
        <h3>Livraison par Roum Transit</h3>
        <label className="sp-toggle">
          <input type="checkbox" checked={catalog.transitDelivery} onChange={(e) => toggleTransit(e.target.checked)} />
          <span>Proposer aussi Roum Transit, calculé au poids selon la grille tarifaire</span>
        </label>
        <p className="sa-hint">
          Le prix vient de Tarifs &amp; Grilles : du pays de départ de l&apos;article jusqu&apos;au pays du client. Réglez le pays de départ et le
          poids dans chaque article.
        </p>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ss-root { display: grid; gap: 14px; }
        .ss-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .ss-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .ss-row .input-clean { flex: 1; min-width: 180px; }
        .ss-zone { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid #EFE6D9; }
        .ss-zone .input-clean { flex: 1; min-width: 120px; }
        .ss-zone-info { flex: 1; display: grid; gap: 2px; min-width: 160px; }
        .ss-zone-new { border-bottom: 0; }
        .sp-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 0.86rem; font-weight: 600; }
        .sp-toggle input { width: 18px; height: 18px; accent-color: #3A2A21; }
      `,
        }}
      />
    </div>
  );
}
