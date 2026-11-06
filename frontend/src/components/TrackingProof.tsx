"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Scale, X } from "lucide-react";

export interface TrackingPhoto {
  id: string;
  url: string;
  taken_at: string;
}

export interface TrackingReception {
  weight_kg: number;
  volume_cbm: number;
  weighed_at: string;
  location: string | null;
}

interface TrackingProofProps {
  photos: TrackingPhoto[];
  reception: TrackingReception | null;
  formatDate: (value: string) => string;
}

function frenchNumber(value: number): string {
  return String(value).replace(".", ",");
}

/** Ce que le client peut vérifier lui-même : la pesée réelle et les photos de son colis. */
export function TrackingProof({ photos, reception, formatDate }: TrackingProofProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const move = useCallback(
    (step: number) => setOpenIndex((index) => (index === null ? null : (index + step + photos.length) % photos.length)),
    [photos.length],
  );

  // Une photo retirée par l'agence pendant qu'elle est ouverte ne laisse pas d'écran vide.
  const index = openIndex !== null && openIndex < photos.length ? openIndex : null;

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, move]);

  if (!reception && photos.length === 0) return null;

  return (
    <section className="tk-section tp">
      <h2>{photos.length > 0 ? "Les photos de votre colis" : "Votre colis à la réception"}</h2>

      {reception && (
        <div className="tp-weigh">
          <span className="tp-weigh-icon">
            <Scale size={20} />
          </span>
          <div>
            <strong>
              Pesé à {frenchNumber(reception.weight_kg)} kg
              {reception.volume_cbm > 0 ? ` · ${frenchNumber(reception.volume_cbm)} m³` : ""}
            </strong>
            <span>
              {formatDate(reception.weighed_at)}
              {reception.location ? ` · ${reception.location}` : ""}
            </span>
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="tp-grid">
          {photos.map((photo, photoIndex) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(photoIndex)}
              aria-label={`Agrandir la photo ${photoIndex + 1}`}
            >
              <img src={photo.url} alt={`Votre colis, photo ${photoIndex + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {index !== null && (
        <div className="tp-viewer" role="dialog" aria-modal="true" aria-label="Photo du colis" onClick={close}>
          <button type="button" className="tp-close" onClick={close} aria-label="Fermer">
            <X size={22} />
          </button>
          <img src={photos[index]!.url} alt={`Votre colis, photo ${index + 1}`} onClick={(event) => event.stopPropagation()} />
          <div className="tp-viewer-bar" onClick={(event) => event.stopPropagation()}>
            {photos.length > 1 && (
              <button type="button" onClick={() => move(-1)} aria-label="Photo précédente">
                <ChevronLeft size={22} />
              </button>
            )}
            <span>{photos.length > 1 ? `${index + 1} / ${photos.length}` : formatDate(photos[index]!.taken_at)}</span>
            {photos.length > 1 && (
              <button type="button" onClick={() => move(1)} aria-label="Photo suivante">
                <ChevronRight size={22} />
              </button>
            )}
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tp-weigh {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .tp-weigh-icon {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #EADDCB;
          color: #3A2A21;
        }

        .tp-weigh strong {
          display: block;
          font-size: 1.08rem;
          font-weight: 800;
        }

        .tp-weigh span:not(.tp-weigh-icon) {
          color: #7D6E64;
          font-size: 0.9rem;
        }

        .tp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }

        .tp-grid button {
          aspect-ratio: 4 / 3;
          padding: 0;
          overflow: hidden;
          border: 0;
          border-radius: 18px;
          background: #EFE6D9;
          cursor: zoom-in;
        }

        .tp-grid img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .tp-grid button:hover img {
          transform: scale(1.04);
        }

        .tp-viewer {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 60px 14px 28px;
          box-sizing: border-box;
          background: rgba(32, 22, 15, 0.92);
        }

        .tp-viewer > img {
          max-width: 100%;
          max-height: calc(100vh - 170px);
          border-radius: 16px;
          object-fit: contain;
        }

        .tp-close {
          position: absolute;
          top: 14px;
          right: 14px;
        }

        .tp-close,
        .tp-viewer-bar button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border: 0;
          border-radius: 50%;
          background: #FFFBF4;
          color: #3A2A21;
          cursor: pointer;
        }

        .tp-viewer-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #FFFBF4;
          font-size: 0.95rem;
          font-weight: 700;
        }

        @media (max-width: 560px) {
          .tp-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `,
        }}
      />
    </section>
  );
}
