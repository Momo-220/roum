"use client";

import { useEffect, useId, useState } from "react";
import { Check, Home, MapPin, PackageCheck, Plane, Ship } from "lucide-react";

const STOPS: { label: string; short?: string; icon: typeof Home | null }[] = [
  { label: "Pris en charge", short: "Reçu", icon: PackageCheck },
  { label: "En route", icon: null },
  { label: "Arrivé", icon: MapPin },
  { label: "Livré", icon: Home },
];

const LEFT = 6;
const RIGHT = 94;
const PATH_POINTS = 64;
/** Inclinaison de l'avion à chaque étape : il monte, plane, puis redescend. */
const PLANE_TILT = [-30, -10, 10, 30];

/** Point du trajet : une courbe de vol pour l'avion, une houle pour le bateau. */
function pointAt(progress: number, isSea: boolean) {
  const x = LEFT + (RIGHT - LEFT) * progress;
  const y = isSea ? 50 - 24 * Math.sin(progress * Math.PI * 3) : 82 - 64 * 4 * progress * (1 - progress);
  return { x, y };
}

function routePath(isSea: boolean): string {
  return Array.from({ length: PATH_POINTS + 1 }, (_, index) => {
    const { x, y } = pointAt(index / PATH_POINTS, isSea);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

interface TrackingJourneyProps {
  /** Étape en cours, de 0 (pris en charge) à 3 (livré). */
  stage: number;
  isSea: boolean;
}

/** Le voyage du colis, dessiné : l'avion suit sa courbe de vol, le bateau suit la houle. */
export function TrackingJourney({ stage, isSea }: TrackingJourneyProps) {
  const id = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const path = routePath(isSea);
  const current = pointAt(stage / 3, isSea);
  const delivered = stage === 3;
  const VehicleIcon = delivered ? Check : isSea ? Ship : Plane;
  const vehicleRotation = !delivered && !isSea ? 45 + PLANE_TILT[stage]! : 0;

  return (
    <div className="tj" role="img" aria-label={`Étape ${stage + 1} sur 4 : ${STOPS[stage]!.label}`}>
      <div className="tj-scene">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="tj-svg" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-done`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#E2BE8E" />
              <stop offset="1" stopColor="#A0744A" />
            </linearGradient>
            <clipPath id={`${id}-clip`}>
              <rect
                className="tj-reveal"
                width="100"
                height="100"
                style={{ transform: `scaleX(${ready ? current.x / 100 : 0})` }}
              />
            </clipPath>
          </defs>
          <path d={path} className="tj-track" />
          <path d={path} className="tj-done" stroke={`url(#${id}-done)`} clipPath={`url(#${id}-clip)`} />
        </svg>

        {STOPS.map((stop, index) => {
          if (index === stage) return null;
          const point = pointAt(index / 3, isSea);
          const Icon = stop.icon ?? (isSea ? Ship : Plane);
          return (
            <span
              key={stop.label}
              className={index < stage ? "tj-stop done" : "tj-stop"}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <Icon size={17} strokeWidth={2.2} />
            </span>
          );
        })}

        <span className="tj-vehicle" style={{ left: `${current.x}%`, top: `${current.y}%` }}>
          <VehicleIcon size={24} strokeWidth={2.2} style={{ transform: `rotate(${vehicleRotation}deg)` }} />
        </span>
      </div>

      <ol className="tj-labels">
        {STOPS.map((stop, index) => (
          <li
            key={stop.label}
            className={index === stage ? "current" : index < stage ? "done" : ""}
            style={{ left: `${pointAt(index / 3, isSea).x}%` }}
          >
            <span className={stop.short ? "tj-label-full" : undefined}>{stop.label}</span>
            {stop.short && <span className="tj-label-short">{stop.short}</span>}
          </li>
        ))}
      </ol>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tj-scene {
          position: relative;
          height: 196px;
        }

        .tj-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .tj-track {
          fill: none;
          stroke: #D9CBB8;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 0.1 10;
          vector-effect: non-scaling-stroke;
        }

        .tj-done {
          fill: none;
          stroke-width: 5;
          stroke-linecap: round;
          vector-effect: non-scaling-stroke;
        }

        .tj-reveal {
          transform-origin: 0 0;
          transition: transform 1.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tj-stop,
        .tj-vehicle {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .tj-stop {
          width: 38px;
          height: 38px;
          border: 1.5px solid #E6DBCF;
          background: #FFFBF4;
          color: #B3A597;
        }

        .tj-stop.done {
          border-color: #E2BE8E;
          background: #F5E6D0;
          color: #7A5A38;
        }

        .tj-vehicle {
          z-index: 1;
          width: 58px;
          height: 58px;
          border: 2px solid #C9A06C;
          background: #FFFBF4;
          box-shadow: 0 14px 26px -10px rgba(107, 74, 46, 0.55);
          color: #3A2A21;
          transition: left 1.2s cubic-bezier(0.4, 0, 0.2, 1), top 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tj-vehicle::before {
          content: "";
          position: absolute;
          inset: -2px;
          border: 2px solid #C9A06C;
          border-radius: 50%;
          animation: tj-pulse 2.4s ease-out infinite;
        }

        @keyframes tj-pulse {
          0% {
            opacity: 0.7;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.7);
          }
        }

        .tj-labels {
          position: relative;
          height: 34px;
          margin: 10px 0 0;
          padding: 0;
          list-style: none;
        }

        .tj-labels li {
          position: absolute;
          top: 0;
          padding: 5px 0;
          color: #A99A90;
          font-size: 0.86rem;
          font-weight: 600;
          white-space: nowrap;
          transform: translateX(-50%);
        }

        .tj-labels li:first-child {
          left: 0 !important;
          transform: none;
        }

        .tj-labels li:last-child {
          right: 0;
          left: auto !important;
          transform: none;
        }

        .tj-label-short {
          display: none;
        }

        .tj-labels li.done {
          color: #7A5A38;
        }

        .tj-labels li.current {
          padding: 5px 13px;
          border-radius: 9999px;
          background: #EADDCB;
          color: #3A2A21;
          font-weight: 800;
        }

        @media (max-width: 560px) {
          .tj-scene {
            height: 164px;
          }

          .tj-stop {
            width: 32px;
            height: 32px;
          }

          .tj-vehicle {
            width: 50px;
            height: 50px;
          }

          .tj-labels li {
            font-size: 0.76rem;
          }

          /* Le libellé complet chevaucherait « En route » sur un téléphone. */
          .tj-label-full {
            display: none;
          }

          .tj-label-short {
            display: inline;
          }

          .tj-labels li:not(:first-child) .tj-label-full {
            display: inline;
          }

          .tj-labels li.current {
            padding: 5px 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tj-reveal,
          .tj-vehicle {
            transition: none;
          }

          .tj-vehicle::before {
            animation: none;
            opacity: 0;
          }
        }
      `,
        }}
      />
    </div>
  );
}
