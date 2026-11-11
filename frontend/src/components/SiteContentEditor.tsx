"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageUp, RefreshCw, RotateCcw, Save } from "lucide-react";
import { apiRequest } from "@/shared/api";
import { compressImage } from "@/shared/compressImage";
import {
  SITE_IMAGES,
  SITE_SECTIONS,
  siteImage,
  siteImageKey,
  siteText,
  siteTextFallback,
  siteTextKey,
} from "@/shared/siteContent";

interface SiteContentEditorProps {
  settings: Record<string, string>;
  token: string | null;
  /** Enregistre des paramètres `site_…` ; renvoie true une fois confirmé par le serveur. */
  onSave: (changes: Record<string, string>) => Promise<boolean>;
  /** Une image a été remplacée (version) ou remise à l'origine (null). */
  onImageSaved: (settingKey: string, version: string | null) => void;
  notify: (message: string, title?: string, type?: "success" | "error" | "info") => void;
}

const ALL_FIELDS = SITE_SECTIONS.flatMap((section) => section.fields);

const effectiveTexts = (settings: Record<string, string>) =>
  Object.fromEntries(ALL_FIELDS.map((field) => [field.key, siteText(settings, field.key)]));

/**
 * Contenu du site : la direction réécrit les textes et remplace les images que voient les clients.
 * Une saisie en cours n'est jamais écrasée par la synchronisation ; seuls les champs non modifiés suivent la base.
 */
export function SiteContentEditor({ settings, token, onSave, onImageSaved, notify }: SiteContentEditorProps) {
  const baseline = useMemo(() => effectiveTexts(settings), [settings]);
  const [draft, setDraft] = useState<Record<string, string>>(baseline);
  const [saving, setSaving] = useState(false);
  const [busyImage, setBusyImage] = useState<string | null>(null);
  const previousBaseline = useRef(baseline);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const before = previousBaseline.current;
    setDraft((current) => {
      const next = { ...current };
      for (const field of ALL_FIELDS) {
        if (current[field.key] === before[field.key]) next[field.key] = baseline[field.key];
      }
      return next;
    });
    previousBaseline.current = baseline;
  }, [baseline]);

  const changedKeys = ALL_FIELDS.map((field) => field.key).filter((key) => draft[key] !== baseline[key]);

  const handleSave = async () => {
    const changes: Record<string, string> = {};
    for (const key of changedKeys) {
      const value = draft[key].trim();
      // Le texte d'origine n'est pas recopié en base : il reste celui du site.
      changes[siteTextKey(key)] = value === siteTextFallback(key) ? "" : draft[key];
    }
    setSaving(true);
    try {
      await onSave(changes);
    } finally {
      setSaving(false);
    }
  };

  const handleImage = async (key: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Choisissez une photo (JPG, PNG ou WebP).", "Image", "error");
      return;
    }
    setBusyImage(key);
    try {
      const dataUrl = await compressImage(file, 1800, 0.82);
      const data = await apiRequest<{ version: string }>(`/api/admin/site-images/${key}`, {
        method: "PUT",
        token,
        body: { dataUrl },
      });
      onImageSaved(siteImageKey(key), data.version);
      notify("Image remplacée : vos clients la voient déjà.", "Contenu du site");
    } catch (err: any) {
      notify(err?.message || "L'image n'a pas pu être enregistrée.", "Image", "error");
    } finally {
      setBusyImage(null);
      const input = fileInputs.current[key];
      if (input) input.value = "";
    }
  };

  const resetImage = async (key: string) => {
    setBusyImage(key);
    try {
      await apiRequest(`/api/admin/site-images/${key}`, { method: "DELETE", token });
      onImageSaved(siteImageKey(key), null);
      notify("L'image d'origine est de retour.", "Contenu du site");
    } catch (err: any) {
      notify(err?.message || "L'image n'a pas pu être remise.", "Image", "error");
    } finally {
      setBusyImage(null);
    }
  };

  return (
    <div className="sce-root">
      <p className="sce-intro">
        Réécrivez les textes et changez les images que voient vos clients. Ils apparaissent sur le site quelques
        secondes après l&apos;enregistrement. Un champ vidé reprend son texte d&apos;origine.
      </p>

      <section className="card-clean sce-card">
        <h3>Images des services</h3>
        <div className="sce-images">
          {SITE_IMAGES.map((image) => {
            const custom = Boolean(settings[siteImageKey(image.key)]);
            const busy = busyImage === image.key;
            return (
              <div key={image.key} className="sce-image">
                {siteImage(settings, image.key) ? (
                  <img src={siteImage(settings, image.key)} alt={image.label} />
                ) : (
                  <span className="sce-image-empty">Aucune image</span>
                )}
                <strong>{image.label}</strong>
                <div className="sce-image-actions">
                  <input
                    ref={(node) => {
                      fileInputs.current[image.key] = node;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => handleImage(image.key, e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="sce-pill"
                    disabled={busy}
                    onClick={() => fileInputs.current[image.key]?.click()}
                  >
                    {busy ? <RefreshCw size={14} className="animate-spin" /> : <ImageUp size={14} />}
                    <span>{busy ? "Envoi..." : "Changer"}</span>
                  </button>
                  {custom && (
                    <button type="button" className="sce-pill quiet" disabled={busy} onClick={() => resetImage(image.key)}>
                      <RotateCcw size={14} />
                      <span>Image d&apos;origine</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {SITE_SECTIONS.map((section) => (
        <details key={section.id} className="card-clean sce-card sce-section">
          <summary>
            <h3>{section.title}</h3>
            {section.fields.some((f) => changedKeys.includes(f.key)) && <span className="sce-dot">Modifié</span>}
          </summary>
          {section.hint && <p className="sce-hint">{section.hint}</p>}
          <div className="sce-fields">
            {section.fields.map((field) => {
              const value = draft[field.key] ?? "";
              const rows = field.list ? Math.max(3, value.split("\n").length + 1) : field.long ? 3 : 1;
              const isOriginal = value.trim() === field.fallback;
              return (
                <label key={field.key} className="sce-field">
                  <span className="sce-label">
                    {field.label}
                    {field.list && <em> · une ligne par élément</em>}
                  </span>
                  {rows > 1 ? (
                    <textarea
                      className="input-clean"
                      rows={rows}
                      value={value}
                      onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="input-clean"
                      type="text"
                      value={value}
                      onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    />
                  )}
                  {!isOriginal && (
                    <button
                      type="button"
                      className="sce-reset"
                      onClick={() => setDraft({ ...draft, [field.key]: field.fallback })}
                    >
                      <RotateCcw size={12} />
                      <span>Texte d&apos;origine</span>
                    </button>
                  )}
                </label>
              );
            })}
          </div>
        </details>
      ))}

      {changedKeys.length > 0 && (
        <div className="sce-savebar">
          <span>
            {changedKeys.length} modification{changedKeys.length > 1 ? "s" : ""} non enregistrée
            {changedKeys.length > 1 ? "s" : ""}
          </span>
          <div className="sce-savebar-actions">
            <button type="button" className="sce-pill quiet" disabled={saving} onClick={() => setDraft(baseline)}>
              Annuler
            </button>
            <button type="button" className="btn btn-primary sce-save" disabled={saving} onClick={handleSave}>
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
            </button>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .sce-root { display: grid; gap: 16px; padding-bottom: 96px; }
        .sce-intro { margin: 0; color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; max-width: 720px; }
        .sce-card { padding: 22px; border-radius: 20px; background: #FFFFFF; }
        .sce-card h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--brown-dark); }
        .sce-images { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 14px; }
        .sce-image { display: grid; gap: 8px; align-content: start; }
        .sce-image img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 14px; background: #F3EBDF; }
        .sce-image-empty { display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 4 / 3; border-radius: 14px; background: #F3EBDF; color: #8C7D75; font-size: 0.86rem; font-weight: 600; }
        .sce-image strong { font-size: 0.86rem; color: var(--brown-dark); }
        .sce-image-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .sce-pill {
          display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px;
          border: 0; border-radius: 9999px; background: #EADDCB; color: #3A2A21;
          font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer;
        }
        .sce-pill:hover { background: #E0D1BB; }
        .sce-pill.quiet { background: transparent; color: #716C65; }
        .sce-pill.quiet:hover { background: #F3EBDF; color: #3A2A21; }
        .sce-pill:disabled { opacity: 0.6; cursor: wait; }
        .sce-section summary { display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer; list-style: none; }
        .sce-section summary::-webkit-details-marker { display: none; }
        .sce-section summary::after { content: "+"; font-size: 1.2rem; color: var(--text-muted); }
        .sce-section[open] summary::after { content: "–"; }
        .sce-section summary h3 { flex: 1; }
        .sce-dot { padding: 3px 10px; border-radius: 9999px; background: #F3EBDF; color: #6B5844; font-size: 0.72rem; font-weight: 700; }
        .sce-hint { margin: 10px 0 0; color: var(--text-muted); font-size: 0.8rem; }
        .sce-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px 18px; margin-top: 16px; }
        .sce-field { display: grid; gap: 5px; align-content: start; }
        .sce-label { font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); }
        .sce-label em { font-style: normal; font-weight: 500; color: var(--text-muted); }
        .sce-field textarea { resize: vertical; line-height: 1.45; }
        .sce-reset {
          justify-self: start; display: inline-flex; align-items: center; gap: 5px; padding: 2px 0;
          border: 0; background: none; color: #6B5844; font: inherit; font-size: 0.74rem; font-weight: 600; cursor: pointer;
        }
        .sce-savebar {
          position: sticky; bottom: 16px; z-index: 20; display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px; padding: 12px 14px 12px 20px; border-radius: 9999px;
          background: #3A2A21; color: #FFFBF4; box-shadow: 0 12px 30px -12px rgba(58, 42, 33, 0.6);
        }
        .sce-savebar span { font-size: 0.86rem; font-weight: 600; }
        .sce-savebar-actions { display: flex; gap: 8px; }
        .sce-savebar .sce-pill.quiet { color: #EADDCB; }
        .sce-savebar .sce-pill.quiet:hover { background: rgba(255, 251, 244, 0.12); color: #FFFBF4; }
        .sce-save { display: inline-flex; align-items: center; gap: 7px; border-radius: 9999px; padding: 9px 20px; background: #FFFBF4; color: #3A2A21; }
        @media (max-width: 640px) {
          .sce-card { padding: 18px; }
          .sce-fields { grid-template-columns: 1fr; }
          .sce-savebar { border-radius: 20px; padding: 12px 14px; }
          .sce-savebar-actions { width: 100%; justify-content: flex-end; }
        }
      `,
        }}
      />
    </div>
  );
}
