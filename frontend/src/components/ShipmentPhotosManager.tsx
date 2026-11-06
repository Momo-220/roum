"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { apiRequest, newUuid } from "@/shared/api";
import { compressImage } from "@/shared/compressImage";

const MAX_PHOTOS = 8;
/** Au-delà, la photo ne tiendrait pas dans une ligne de la base. */
const MAX_DATA_URL_CHARS = 1_400_000;

interface ShipmentPhoto {
  id: string;
  url: string;
  taken_at: string;
}

interface ShipmentPhotosManagerProps {
  shipmentId: string;
  token: string;
}

async function preparePhoto(file: File): Promise<string> {
  const standard = await compressImage(file, 1600, 0.78);
  if (standard.length <= MAX_DATA_URL_CHARS) return standard;
  const lighter = await compressImage(file, 1100, 0.68);
  if (lighter.length <= MAX_DATA_URL_CHARS) return lighter;
  throw new Error("Cette photo est trop lourde.");
}

/** Photos d'un colis côté gestion : chaque ajout ou retrait apparaît aussitôt dans le suivi du client. */
export function ShipmentPhotosManager({ shipmentId, token }: ShipmentPhotosManagerProps) {
  const [photos, setPhotos] = useState<ShipmentPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const path = `/api/admin/shipments/${encodeURIComponent(shipmentId)}/photos`;

  const load = useCallback(async () => {
    const data = await apiRequest<{ photos: ShipmentPhoto[] }>(path, { token });
    setPhotos(data.photos);
  }, [path, token]);

  useEffect(() => {
    load().catch(() => setMessage("Impossible de charger les photos."));
  }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    const selected = Array.from(files).slice(0, room);
    setBusy(true);
    setMessage(files.length > room ? `Seules ${room} photo(s) ont été ajoutées : ${MAX_PHOTOS} au maximum par colis.` : "");

    try {
      for (const file of selected) {
        const dataUrl = await preparePhoto(file);
        await apiRequest(path, { method: "POST", token, retries: 2, body: { id: newUuid(), data_url: dataUrl } });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "La photo n'a pas été envoyée.");
    } finally {
      await load().catch(() => {});
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm("Retirer cette photo ? Le client ne la verra plus.")) return;
    setBusy(true);
    try {
      await apiRequest(`${path}/${photoId}`, { method: "DELETE", token });
      await load();
      setMessage("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "La photo n'a pas été retirée.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="spm">
      <div className="spm-head">
        <div>
          <strong>Photos du colis</strong>
          <span>Le client les voit dans son suivi.</span>
        </div>
        <span className="spm-count">
          {photos.length} / {MAX_PHOTOS}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="spm-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="spm-item">
              <img src={photo.url} alt="Photo du colis" loading="lazy" />
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={busy}
                aria-label="Retirer cette photo"
                title="Retirer cette photo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <label className={busy ? "spm-add busy" : "spm-add"}>
          <Camera size={16} />
          <span>{busy ? "Envoi en cours..." : "Ajouter des photos"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            disabled={busy}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      )}

      {message && (
        <p className="spm-message" role="alert">
          {message}
        </p>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .spm {
          display: grid;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--border-light);
          border-radius: 16px;
          background: var(--bg-subtle);
        }

        .spm-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .spm-head strong {
          display: block;
          font-size: 0.88rem;
        }

        .spm-head span {
          color: var(--text-muted);
          font-size: 0.76rem;
        }

        .spm-count {
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }

        .spm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
          gap: 8px;
        }

        .spm-item {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 12px;
          background: #EFE6D9;
        }

        .spm-item img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .spm-item button {
          position: absolute;
          top: 5px;
          right: 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 50%;
          background: #FFFBF4;
          color: #A12B2B;
          cursor: pointer;
        }

        .spm-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 9999px;
          background: #EADDCB;
          color: #3A2A21;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
        }

        .spm-add.busy {
          opacity: 0.65;
          cursor: wait;
        }

        .spm-add input {
          display: none;
        }

        .spm-message {
          margin: 0;
          color: #A12B2B;
          font-size: 0.8rem;
          font-weight: 600;
        }
      `,
        }}
      />
    </div>
  );
}
