"use client";

import { useEffect, useMemo, useRef } from "react";
import { WORLD_COUNTRIES_PATH } from "./worldCountriesPath";

export interface MapDot {
  start: { lat: number; lng: number; label?: string };
  end: { lat: number; lng: number; label?: string };
}

export interface WorldMapProps {
  dots?: MapDot[];
  className?: string;
}

// Routes cargo internationales convergeant vers les capitales d'Afrique de l'Ouest
const DEFAULT_DOTS: MapDot[] = [
  { start: { lat: 23.13, lng: 113.26 }, end: { lat: 5.36, lng: -4.0 } },
  { start: { lat: 29.31, lng: 120.07 }, end: { lat: 14.69, lng: -17.44 } },
  { start: { lat: 25.2, lng: 55.27 }, end: { lat: 5.36, lng: -4.0 } },
  { start: { lat: 25.2, lng: 55.27 }, end: { lat: 12.63, lng: -8.0 } },
  { start: { lat: 33.57, lng: -7.58 }, end: { lat: 5.36, lng: -4.0 } },
  { start: { lat: 33.57, lng: -7.58 }, end: { lat: 12.37, lng: -1.52 } },
  { start: { lat: 48.85, lng: 2.35 }, end: { lat: 5.36, lng: -4.0 } },
];

interface Hub {
  lat: number;
  lng: number;
  label: string;
  /** Décalage du nom, en pixels d'écran. */
  dx: number;
  dy: number;
  align: CanvasTextAlign;
  /** Nom conservé sur les petits écrans. */
  essential?: boolean;
  main?: boolean;
  arrival?: boolean;
}

const HUBS: Hub[] = [
  { lat: 23.13, lng: 113.26, label: "Guangzhou", dx: -8, dy: 14, align: "right", essential: true },
  { lat: 29.31, lng: 120.07, label: "Yiwu", dx: 8, dy: -6, align: "left" },
  { lat: 25.2, lng: 55.27, label: "Dubaï", dx: 8, dy: -6, align: "left", essential: true },
  { lat: 33.57, lng: -7.58, label: "Casablanca", dx: -8, dy: -2, align: "right" },
  { lat: 48.85, lng: 2.35, label: "Paris", dx: 8, dy: -6, align: "left", essential: true },
  { lat: 5.36, lng: -4.0, label: "Abidjan", dx: 0, dy: 19, align: "center", essential: true, main: true, arrival: true },
  { lat: 14.69, lng: -17.44, label: "Dakar", dx: -8, dy: 3, align: "right", arrival: true },
  { lat: 12.63, lng: -8.0, label: "", dx: 0, dy: 0, align: "left", arrival: true },
  { lat: 12.37, lng: -1.52, label: "", dx: 0, dy: 0, align: "left", arrival: true },
];

const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;

// Couleurs de la marque : beige du logo et taupe, sur la carte couleur sable.
const TAIL_RGB = [216, 200, 176];
const HEAD_RGB = [107, 88, 68];
const INK = "rgba(74, 60, 46, 0.92)";
const HALO = "rgba(250, 245, 240, 0.9)";

const FLIGHT = 3.8;
const REST = 1.6;
const CYCLE = FLIGHT + REST;
const TAIL_LENGTH = 0.24;
const TAIL_STEPS = 30;

function project(lat: number, lng: number) {
  return {
    x: (lng + 180) * (MAP_WIDTH / 360),
    y: (90 - lat) * (MAP_HEIGHT / 180),
  };
}

function easeInOut(u: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
}

function mix(from: number[], to: number[], t: number) {
  return from.map((value, i) => Math.round(value + (to[i]! - value) * t)).join(",");
}

export function WorldMap({ dots = DEFAULT_DOTS, className = "" }: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const routes = useMemo(
    () =>
      dots.map((dot) => {
        const start = project(dot.start.lat, dot.start.lng);
        const end = project(dot.end.lat, dot.end.lng);
        const distance = Math.hypot(end.x - start.x, end.y - start.y);
        const lift = Math.min(Math.max(distance * 0.3, 28), 92);
        const control = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - lift };
        return { start, end, control };
      }),
    [dots]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrapper || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let cssWidth = wrapper.clientWidth || MAP_WIDTH;

    const pointAt = (route: (typeof routes)[number], t: number) => {
      const m = 1 - t;
      return {
        x: m * m * route.start.x + 2 * m * t * route.control.x + t * t * route.end.x,
        y: m * m * route.start.y + 2 * m * t * route.control.y + t * t * route.end.y,
      };
    };

    const resize = () => {
      cssWidth = wrapper.clientWidth || MAP_WIDTH;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round((cssWidth * MAP_HEIGHT * dpr) / MAP_WIDTH);
    };

    const draw = (now: number) => {
      const dpr = canvas.width / cssWidth;
      const scale = cssWidth / MAP_WIDTH;
      // Sur téléphone, les traits gardent une épaisseur visible.
      const stroke = 1 / Math.max(scale, 0.62);

      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      ctx.lineCap = "round";

      // Routes : pointillés fins qui avancent doucement vers l'Afrique.
      ctx.setLineDash([0.1, 5.4 * stroke]);
      ctx.lineDashOffset = -now * 4;
      ctx.lineWidth = 1.15 * stroke;
      ctx.strokeStyle = "rgba(138, 118, 96, 0.4)";
      for (const route of routes) {
        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.quadraticCurveTo(route.control.x, route.control.y, route.end.x, route.end.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      if (!reducedMotion) {
        routes.forEach((route, index) => {
          const phase = (now + (index * CYCLE) / routes.length) % CYCLE;

          if (phase <= FLIGHT) {
            const u = phase / FLIGHT;
            const head = easeInOut(u);
            const tailStart = Math.max(0, head - TAIL_LENGTH * Math.sin(Math.PI * Math.min(1, u * 1.15 + 0.05)));
            const fade = Math.min(1, u / 0.1) * Math.min(1, (1 - u) / 0.05);

            // Traînée effilée : fine et claire derrière, dense et cuivrée vers la tête.
            for (let step = 0; step < TAIL_STEPS; step += 1) {
              const a = step / TAIL_STEPS;
              const b = (step + 1) / TAIL_STEPS;
              const from = pointAt(route, tailStart + (head - tailStart) * a);
              const to = pointAt(route, tailStart + (head - tailStart) * b);
              ctx.strokeStyle = `rgba(${mix(TAIL_RGB, HEAD_RGB, b)},${Math.pow(b, 1.5) * 0.95 * fade})`;
              ctx.lineWidth = (0.3 + Math.pow(b, 1.3) * 2.3) * stroke;
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.stroke();
            }

            // Tête lumineuse : halo chaud et cœur clair.
            const tip = pointAt(route, head);
            const radius = 10 * stroke;
            const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, radius);
            glow.addColorStop(0, `rgba(138, 118, 96, ${0.55 * fade})`);
            glow.addColorStop(0.45, `rgba(138, 118, 96, ${0.16 * fade})`);
            glow.addColorStop(1, "rgba(138, 118, 96, 0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 243, 230, ${fade})`;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 1.5 * stroke, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Onde douce à l'arrivée.
            const landed = (phase - FLIGHT) / 1.15;
            if (landed < 1) {
              const eased = 1 - Math.pow(1 - landed, 3);
              ctx.strokeStyle = `rgba(107, 88, 68, ${Math.pow(1 - landed, 2) * 0.6})`;
              ctx.lineWidth = 1.1 * stroke;
              ctx.beginPath();
              ctx.arc(route.end.x, route.end.y, (3 + eased * 15) * stroke, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        });
      }

      // Plateformes et villes.
      const fontSize = 11 / scale;
      ctx.font = `600 ${fontSize}px "Host Grotesk", -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textBaseline = "middle";

      for (const hub of HUBS) {
        const point = project(hub.lat, hub.lng);
        const radius = (hub.main ? 3.1 : hub.arrival ? 2 : 2.4) * stroke;

        ctx.fillStyle = hub.arrival ? "rgba(107, 88, 68, 0.14)" : "rgba(138, 118, 96, 0.14)";
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hub.arrival ? "#6B5844" : "#6B5844";
        ctx.strokeStyle = "#FAF5F0";
        ctx.lineWidth = 1 * stroke;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (hub.label && (cssWidth >= 620 || hub.essential)) {
          const x = point.x + hub.dx / scale;
          const y = point.y + hub.dy / scale;
          ctx.textAlign = hub.align;
          ctx.lineJoin = "round";
          ctx.lineWidth = 3.4 / scale;
          ctx.strokeStyle = HALO;
          ctx.strokeText(hub.label, x, y);
          ctx.fillStyle = INK;
          ctx.fillText(hub.label, x, y);
        }
      }
    };

    const loop = () => {
      frame = 0;
      if (!visible) return;
      draw(performance.now() / 1000);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reducedMotion) {
        draw(0);
        return;
      }
      if (!frame && visible) frame = requestAnimationFrame(loop);
    };

    // L'animation s'arrête hors de l'écran pour ménager la batterie des téléphones.
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting) && !document.hidden;
      start();
    });
    observer.observe(wrapper);

    const handleVisibility = () => {
      visible = !document.hidden;
      start();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(0);
    });
    resizeObserver.observe(wrapper);

    resize();
    start();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [routes]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        backgroundColor: "transparent",
      }}
    >
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
        aria-hidden="true"
      >
        <path d={WORLD_COUNTRIES_PATH} fill="#E9E0D4" stroke="#DCD1C1" strokeWidth="0.5" strokeLinejoin="round" />
      </svg>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
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
