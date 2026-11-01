"use client";

import { useEffect, useRef, useMemo } from "react";
import { WORLD_COUNTRIES_PATH } from "./worldCountriesPath";

export interface MapDot {
  start: { lat: number; lng: number; label?: string };
  end: { lat: number; lng: number; label?: string };
}

export interface WorldMapProps {
  dots?: MapDot[];
  lineColor?: string;
  className?: string;
}

// Routes cargo internationales convergeant vers les capitales d'Afrique de l'Ouest
const DEFAULT_DOTS: MapDot[] = [
  // 1. Chine (Guangzhou & Yiwu) vers Côte d'Ivoire & Sénégal
  {
    start: { lat: 23.13, lng: 113.26, label: "Guangzhou" },
    end: { lat: 5.36, lng: -4.00, label: "Abidjan" },
  },
  {
    start: { lat: 29.31, lng: 120.07, label: "Yiwu" },
    end: { lat: 14.69, lng: -17.44, label: "Dakar" },
  },
  // 2. Dubaï vers Abidjan & Bamako
  {
    start: { lat: 25.20, lng: 55.27, label: "Dubaï" },
    end: { lat: 5.36, lng: -4.00, label: "Abidjan" },
  },
  {
    start: { lat: 25.20, lng: 55.27 },
    end: { lat: 12.63, lng: -8.00, label: "Bamako" },
  },
  // 3. Maroc (Casablanca) vers Abidjan & Ouagadougou
  {
    start: { lat: 33.57, lng: -7.58, label: "Casablanca" },
    end: { lat: 5.36, lng: -4.00, label: "Abidjan" },
  },
  {
    start: { lat: 33.57, lng: -7.58 },
    end: { lat: 12.37, lng: -1.52, label: "Ouaga" },
  },
  // 4. France (Paris) vers Abidjan
  {
    start: { lat: 48.85, lng: 2.35, label: "Paris" },
    end: { lat: 5.36, lng: -4.00, label: "Abidjan" },
  },
];

// Hubs d'arrivée en Afrique de l'Ouest
const WEST_AFRICA_HUBS = [
  { id: "ci", lat: 5.36, lng: -4.00, label: "Abidjan", isMain: true },
  { id: "sn", lat: 14.69, lng: -17.44, label: "Dakar", isMain: false },
  { id: "ml", lat: 12.63, lng: -8.00, label: "Bamako", isMain: false },
  { id: "bf", lat: 12.37, lng: -1.52, label: "Ouaga", isMain: false },
];

// Formule de projection standard équirectangulaire (800x400)
function projectPoint(lat: number, lng: number) {
  const x = (lng + 180) * (800 / 360);
  const y = (90 - lat) * (400 / 180);
  return { x, y };
}

// Génération de 49 points le long de l'arc en courbe de Bézier quadratique
function getCurvedPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  count: number = 49
) {
  const midX = (start.x + end.x) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);
  const curvature = Math.min(Math.max(dist * 0.22, 26), 56);
  const midY = Math.min(start.y, end.y) - curvature;

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * midX + t * t * end.x;
    const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * midY + t * t * end.y;
    pts.push({ x, y });
  }
  return pts;
}

export function WorldMap({
  dots = DEFAULT_DOTS,
  lineColor = "#0EA5E9",
  className = "",
}: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Précalcul des coordonnées des trajectoires
  const routes = useMemo(() => {
    return dots.map((dot) => {
      const start = projectPoint(dot.start.lat, dot.start.lng);
      const end = projectPoint(dot.end.lat, dot.end.lng);
      return {
        start,
        end,
        pts: getCurvedPoints(start, end, 49),
      };
    });
  }, [dots]);

  // Animation exacte des comètes du RouteGlobe (Globe 3D admin dashboard)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const tailLen = 11;
    const flightDuration = 1.35;
    const absorbDuration = 0.32;
    const pauseDuration = 0.65;
    const totalCycle = flightDuration + absorbDuration + pauseDuration;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== 800 * dpr || canvas.height !== 400 * dpr) {
        canvas.width = 800 * dpr;
        canvas.height = 400 * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, 800, 400);

      const now = performance.now() / 1000;

      // 1. Tracé sous-jacent discret pour chaque ligne de vol
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(14, 165, 233, 0.16)";
      for (const route of routes) {
        ctx.beginPath();
        for (let k = 0; k < route.pts.length; k++) {
          const p = route.pts[k];
          if (k === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // 2. Hubs d'origine : balise bleue avec anneau respiratoire soyeux
      for (let i = 0; i < routes.length; i++) {
        const p = routes[i].start;
        const pulse = (Math.sin(now * 3 + i * 0.7) + 1) / 2; // 0..1

        // Anneau pulsant
        ctx.globalAlpha = 0.3 * (1 - pulse);
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + pulse * 5.5, 0, Math.PI * 2);
        ctx.stroke();

        // Point central
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Comètes fluides (Mathématique exacte du globe RouteGlobe)
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        const pts = route.pts;
        const ph = (now + i * 0.42) % totalCycle;

        let headPos = 0;
        let tailStartPos = 0;
        let landingFade = 1;

        if (ph <= flightDuration) {
          const u = ph / flightDuration;
          // Décélération cubique douce sur le dernier tiers
          const eased =
            u < 0.6
              ? (u / 0.6) * 0.64
              : 0.64 + (1 - Math.pow(1 - (u - 0.6) / 0.4, 2.1)) * 0.36;
          headPos = eased * 48;
          tailStartPos = Math.max(0, headPos - tailLen);
          landingFade = Math.min(1, u / 0.08); // Apparition progressive au décollage
        } else if (ph <= flightDuration + absorbDuration) {
          // La tête est posée à destination et la traînée s'absorbe doucement
          const absorbU = (ph - flightDuration) / absorbDuration;
          const easedAbsorb = 1 - Math.pow(1 - absorbU, 2.2);
          headPos = 48;
          tailStartPos = Math.min(48, 48 - tailLen + easedAbsorb * tailLen);
          landingFade = Math.pow(1 - absorbU, 1.5);
        } else {
          headPos = 48;
          tailStartPos = 48;
          landingFade = 0;
        }

        if (landingFade > 0.01 && headPos > tailStartPos) {
          const startIdx = Math.max(0, Math.floor(tailStartPos));
          const endIdx = Math.min(48, Math.ceil(headPos));
          const currentSpan = Math.max(0.5, headPos - tailStartPos);

          for (let k = startIdx; k < endIdx; k++) {
            const a = pts[k];
            const b = pts[k + 1];
            if (!a || !b) continue;

            const segEnd = k + 1 > headPos ? headPos - k : 1;
            const bx = a.x + (b.x - a.x) * segEnd;
            const by = a.y + (b.y - a.y) * segEnd;

            const progressAlongTail = Math.max(
              0,
              Math.min(1, (k + segEnd - tailStartPos) / currentSpan)
            );
            const smoothAlpha =
              Math.pow(progressAlongTail, 1.4) * 0.95 * landingFade;

            ctx.globalAlpha = smoothAlpha;
            ctx.lineWidth = 1.0 + progressAlongTail * 1.5;
            ctx.strokeStyle = lineColor; // Bleu royal éclatant
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        // Onde d'atterrissage douce à l'arrivée (Afrique de l'Ouest)
        const end = pts[48];
        const isTouchingDown =
          ph >= flightDuration - 0.05 && ph <= flightDuration + 0.32;
        if (isTouchingDown) {
          const touchProgress = (ph - (flightDuration - 0.05)) / 0.37;
          const easeOutRipple = 1 - Math.pow(1 - touchProgress, 3);
          const rippleAlpha = Math.pow(1 - touchProgress, 1.85) * 0.75;
          ctx.globalAlpha = rippleAlpha;
          ctx.lineWidth = 1.25 * (1 - touchProgress * 0.4);
          ctx.strokeStyle = "#38BDF8"; // Bleu ciel lumineux pour l'onde d'impact
          ctx.beginPath();
          ctx.arc(end.x, end.y, 2.8 + easeOutRipple * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 4. Balises d'arrivée en Afrique de l'Ouest
      for (const hub of WEST_AFRICA_HUBS) {
        const p = projectPoint(hub.lat, hub.lng);
        const isMain = hub.isMain;

        ctx.globalAlpha = 1;
        ctx.fillStyle = isMain ? "#0284C7" : "#0EA5E9";
        ctx.beginPath();
        ctx.arc(p.x, p.y, isMain ? 2.8 : 2.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 0.8;
        ctx.strokeStyle = "#FAF5F0";
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [routes, lineColor]);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    >
      {/* 1. Carte vectorielle réelle des continents en fond */}
      <svg
        viewBox="0 0 800 400"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          userSelect: "none",
        }}
      >
        <path
          d={WORLD_COUNTRIES_PATH}
          fill="#E7DFD4"
          stroke="#D8CFBE"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* 2. Canvas HiDPI superposé pour l'animation exacte des comètes du globe admin */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          display: "block",
        }}
      />
    </div>
  );
}
