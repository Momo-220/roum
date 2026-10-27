"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { geoOrthographic, geoPath, geoInterpolate, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import {
  Compass,
  Plane,
  Ship,
  Sparkles,
  MapPin,
  Clock,
  RotateCcw,
  CheckCircle2,
  Package,
} from "lucide-react";

// Types
export interface TransactionRoute {
  id: string;
  tracking_number: string;
  client_name?: string;
  origin_name: string;
  origin_country: string;
  origin_lon: number;
  origin_lat: number;
  dest_name: string;
  dest_country: string;
  dest_lon: number;
  dest_lat: number;
  status_category: "IN_TRANSIT" | "DELIVERED" | "PENDING_HUB";
  status_label: string;
  mode: "AIR" | "SEA";
  weight_kg?: number;
  volume_cbm?: number;
}

interface RouteGlobeProps {
  shipments?: any[];
  className?: string;
  onSelectShipment?: (shipment: any) => void;
}

// Couleurs sobres & luxueuses selon la charte ROUM TRANSIT
const THEME = {
  // Fond et contours de la sphère
  globeBase: "#FAF6F0",
  globeBorder: "#D8CEBE",
  globeShadow: "rgba(59, 34, 24, 0.05)",
  graticule: "rgba(166, 124, 82, 0.12)",

  // Continents et pays
  landFill: "#EBE3D7",
  landStroke: "#D2C5B4",
  countryStroke: "#DDD3C6",

  // 1. Transactions EN COURS (In Transit) : Marron/Ambre dynamique
  inTransit: {
    arc: "#B4652A",
    comet: "#D97706",
    pin: "#B4652A",
    pulse: "rgba(217, 119, 6, 0.6)",
  },

  // 2. Transactions FAITES / LIVRÉES (Delivered) : Vert sauge sobre
  delivered: {
    arc: "#2E7D4E",
    comet: "#4E9B68",
    pin: "#2E7D4E",
    pulse: "rgba(46, 125, 78, 0.4)",
  },

  // 3. Transactions EN PRÉPARATION / HUB (Pending) : Marron-beige doux
  pendingHub: {
    arc: "#8D6346",
    comet: "#A67C52",
    pin: "#8D6346",
    pulse: "rgba(141, 99, 70, 0.4)",
  },

  // Hubs principaux
  hubOrigin: {
    pin: "#3B2218",
    ring: "rgba(59, 34, 24, 0.5)",
  },
};

// Données géographiques pré-extraites (Natural Earth 110m)
const worldLand = feature(worldData as any, (worldData as any).objects.land);
const worldCountries = feature(worldData as any, (worldData as any).objects.countries);

// Hubs connus pour mapping automatique
const KNOWN_HUBS: Record<string, { lon: number; lat: number; country: string; name: string }> = {
  Guangzhou: { lon: 113.26, lat: 23.13, country: "Chine", name: "Guangzhou" },
  Yiwu: { lon: 120.07, lat: 29.30, country: "Chine", name: "Yiwu" },
  Dubaï: { lon: 55.27, lat: 25.20, country: "Émirats", name: "Dubaï" },
  Dubai: { lon: 55.27, lat: 25.20, country: "Émirats", name: "Dubaï" },
  Casablanca: { lon: -7.59, lat: 33.57, country: "Maroc", name: "Casablanca" },
};

const KNOWN_DESTS: Record<string, { lon: number; lat: number; country: string; name: string }> = {
  Bamako: { lon: -8.00, lat: 12.64, country: "Mali", name: "Bamako" },
  Abidjan: { lon: -4.01, lat: 5.36, country: "Côte d'Ivoire", name: "Abidjan" },
  Dakar: { lon: -17.47, lat: 14.71, country: "Sénégal", name: "Dakar" },
  Conakry: { lon: -13.68, lat: 9.54, country: "Guinée", name: "Conakry" },
  Lomé: { lon: 1.22, lat: 6.13, country: "Togo", name: "Lomé" },
  Lome: { lon: 1.22, lat: 6.13, country: "Togo", name: "Lomé" },
  Cotonou: { lon: 2.42, lat: 6.37, country: "Bénin", name: "Cotonou" },
  Douala: { lon: 9.77, lat: 4.05, country: "Cameroun", name: "Douala" },
};

// Données réalistes par défaut
const DEFAULT_ROUTES: TransactionRoute[] = [
  {
    id: "tx-1",
    tracking_number: "RM-AIR-2610-K8P9Q2",
    client_name: "Aminata Diallo",
    origin_name: "Guangzhou",
    origin_country: "Chine",
    origin_lon: 113.26,
    origin_lat: 23.13,
    dest_name: "Bamako",
    dest_country: "Mali",
    dest_lon: -8.00,
    dest_lat: 12.64,
    status_category: "IN_TRANSIT",
    status_label: "En vol Guangzhou → Bamako",
    mode: "AIR",
    weight_kg: 18.5,
    volume_cbm: 0.12,
  },
  {
    id: "tx-2",
    tracking_number: "RM-SEA-2610-M4V7W1",
    client_name: "Ibrahim Traoré",
    origin_name: "Yiwu",
    origin_country: "Chine",
    origin_lon: 120.07,
    origin_lat: 29.30,
    dest_name: "Abidjan",
    dest_country: "Côte d'Ivoire",
    dest_lon: -4.01,
    dest_lat: 5.36,
    status_category: "IN_TRANSIT",
    status_label: "En mer (Conteneur LCL)",
    mode: "SEA",
    weight_kg: 420.0,
    volume_cbm: 2.8,
  },
  {
    id: "tx-3",
    tracking_number: "RM-AIR-2610-R3T9Y5",
    client_name: "Khadija Diop",
    origin_name: "Dubaï",
    origin_country: "Émirats",
    origin_lon: 55.27,
    origin_lat: 25.20,
    dest_name: "Dakar",
    dest_country: "Sénégal",
    dest_lon: -17.47,
    dest_lat: 14.71,
    status_category: "IN_TRANSIT",
    status_label: "En vol Dubaï → Dakar",
    mode: "AIR",
    weight_kg: 34.0,
    volume_cbm: 0.25,
  },
  {
    id: "tx-4",
    tracking_number: "RM-AIR-2610-B1C2D3",
    client_name: "Moussa Konaté",
    origin_name: "Guangzhou",
    origin_country: "Chine",
    origin_lon: 113.26,
    origin_lat: 23.13,
    dest_name: "Bamako",
    dest_country: "Mali",
    dest_lon: -8.00,
    dest_lat: 12.64,
    status_category: "DELIVERED",
    status_label: "Livré en boutique",
    mode: "AIR",
    weight_kg: 22.0,
    volume_cbm: 0.15,
  },
  {
    id: "tx-5",
    tracking_number: "RM-SEA-2610-E5F6G7",
    client_name: "Awa Sanogo",
    origin_name: "Casablanca",
    origin_country: "Maroc",
    origin_lon: -7.59,
    origin_lat: 33.57,
    dest_name: "Conakry",
    dest_country: "Guinée",
    dest_lon: -13.68,
    dest_lat: 9.54,
    status_category: "DELIVERED",
    status_label: "Livré au port de Conakry",
    mode: "SEA",
    weight_kg: 180.0,
    volume_cbm: 1.4,
  },
  {
    id: "tx-6",
    tracking_number: "RM-AIR-2610-H8J9K0",
    client_name: "Ousmane Fofana",
    origin_name: "Casablanca",
    origin_country: "Maroc",
    origin_lon: -7.59,
    origin_lat: 33.57,
    dest_name: "Bamako",
    dest_country: "Mali",
    dest_lon: -8.00,
    dest_lat: 12.64,
    status_category: "PENDING_HUB",
    status_label: "Réceptionné au Hub Casa",
    mode: "AIR",
    weight_kg: 12.0,
    volume_cbm: 0.08,
  },
  {
    id: "tx-7",
    tracking_number: "RM-AIR-2610-L1M2N3",
    client_name: "Fatoumata Barry",
    origin_name: "Yiwu",
    origin_country: "Chine",
    origin_lon: 120.07,
    origin_lat: 29.30,
    dest_name: "Lomé",
    dest_country: "Togo",
    dest_lon: 1.22,
    dest_lat: 6.13,
    status_category: "PENDING_HUB",
    status_label: "Groupage en cours Yiwu",
    mode: "AIR",
    weight_kg: 45.0,
    volume_cbm: 0.3,
  },
];

export function RouteGlobe({ shipments = [], className = "", onSelectShipment }: RouteGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // État du filtre (Toutes, En transit, Livrées, Au Hub)
  const [filter, setFilter] = useState<"ALL" | "IN_TRANSIT" | "DELIVERED" | "PENDING_HUB">("ALL");

  // Hover interactif sur un point ou arc
  const [hoveredRoute, setHoveredRoute] = useState<{
    route: TransactionRoute;
    x: number;
    y: number;
  } | null>(null);

  // Conversion dynamique des expéditions réelles
  const routesData = useMemo<TransactionRoute[]>(() => {
    if (!shipments || shipments.length === 0) {
      return DEFAULT_ROUTES;
    }

    const parsed: TransactionRoute[] = shipments.map((s, idx) => {
      // Détermination origine
      let origin = KNOWN_HUBS.Guangzhou;
      const origStr = (s.origin_hub || s.origin_country || "").toLowerCase();
      if (origStr.includes("yiwu")) origin = KNOWN_HUBS.Yiwu;
      else if (origStr.includes("duba") || origStr.includes("dxb")) origin = KNOWN_HUBS["Dubaï"];
      else if (origStr.includes("casa") || origStr.includes("maroc")) origin = KNOWN_HUBS.Casablanca;

      // Détermination destination
      let dest = KNOWN_DESTS.Bamako;
      const destStr = (s.destination_city || s.destination_country || "").toLowerCase();
      if (destStr.includes("abidjan") || destStr.includes("ivoire")) dest = KNOWN_DESTS.Abidjan;
      else if (destStr.includes("dakar") || destStr.includes("senegal") || destStr.includes("sénégal")) dest = KNOWN_DESTS.Dakar;
      else if (destStr.includes("conakry") || destStr.includes("guinee") || destStr.includes("guinée")) dest = KNOWN_DESTS.Conakry;
      else if (destStr.includes("lome") || destStr.includes("lomé") || destStr.includes("togo")) dest = KNOWN_DESTS["Lomé"];
      else if (destStr.includes("cotonou") || destStr.includes("benin") || destStr.includes("bénin")) dest = KNOWN_DESTS.Cotonou;
      else if (destStr.includes("douala") || destStr.includes("cameroun")) dest = KNOWN_DESTS.Douala;

      // Catégorie de statut
      let category: "IN_TRANSIT" | "DELIVERED" | "PENDING_HUB" = "IN_TRANSIT";
      if (s.status === "DELIVERED") category = "DELIVERED";
      else if (s.status === "RECEIVED_AT_HUB" || s.status === "DRAFT") category = "PENDING_HUB";

      return {
        id: s.id || `sh-${idx}`,
        tracking_number: s.tracking_number || `RM-${idx}`,
        client_name: s.client_name || s.client?.full_name || "Client",
        origin_name: origin.name,
        origin_country: origin.country,
        origin_lon: origin.lon,
        origin_lat: origin.lat,
        dest_name: dest.name,
        dest_country: dest.country,
        dest_lon: dest.lon,
        dest_lat: dest.lat,
        status_category: category,
        status_label: s.status_label || s.status || "Expédition",
        mode: s.shipping_mode === "SEA" ? "SEA" : "AIR",
        weight_kg: Number(s.chargeable_weight_kg || s.weight_kg || 15),
        volume_cbm: Number(s.volume_cbm || 0.1),
      };
    });

    return parsed;
  }, [shipments]);

  // Filtrage
  const visibleRoutes = useMemo(() => {
    if (filter === "ALL") return routesData;
    return routesData.filter((r) => r.status_category === filter);
  }, [routesData, filter]);

  // Statistiques de comptage pour les pills
  const counts = useMemo(() => {
    return {
      all: routesData.length,
      inTransit: routesData.filter((r) => r.status_category === "IN_TRANSIT").length,
      delivered: routesData.filter((r) => r.status_category === "DELIVERED").length,
      pendingHub: routesData.filter((r) => r.status_category === "PENDING_HUB").length,
    };
  }, [routesData]);

  // État de rotation du globe
  const stateRef = useRef({
    yaw: 20, // degrés
    tilt: -12, // degrés
    targetYaw: 20,
    targetTilt: -12,
    vx: 0,
    vy: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    lastTime: performance.now(),
    lastInteraction: performance.now(),
  });

  // Fonction pour animer vers une région spécifique
  const focusRegion = useCallback((targetYaw: number, targetTilt: number) => {
    stateRef.current.targetYaw = targetYaw;
    stateRef.current.targetTilt = targetTilt;
    stateRef.current.lastInteraction = performance.now() + 5000; // Suspend l'auto-rotation
  }, []);

  // Animation Loop avec Canvas 2D
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId = 0;
    let isAlive = true;

    // Prise en charge du resize
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    // Boucle de rendu
    const render = (timestamp: number) => {
      if (!isAlive) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const st = stateRef.current;
      const dt = Math.min((timestamp - st.lastTime) / 1000, 0.05);
      st.lastTime = timestamp;

      // Inertie ou retour fluide
      if (!st.isDragging) {
        // Rapprochement doux vers la cible demandée si focusRegion
        const diffYaw = st.targetYaw - st.yaw;
        const diffTilt = st.targetTilt - st.tilt;

        if (Math.abs(diffYaw) > 0.1 || Math.abs(diffTilt) > 0.1) {
          st.yaw += diffYaw * Math.min(dt * 4, 0.2);
          st.tilt += diffTilt * Math.min(dt * 4, 0.2);
        } else {
          // Décélération inertielle
          st.yaw += st.vx * dt;
          st.tilt += st.vy * dt;
          st.vx *= Math.pow(0.08, dt);
          st.vy *= Math.pow(0.08, dt);

          // Rotation automatique lente après 2.5s d'inactivité
          if (timestamp - st.lastInteraction > 2500) {
            st.yaw -= dt * 6; // 6 degrés par seconde
            st.targetYaw = st.yaw;
          }
        }

        // Limites de tilt vertical
        st.tilt = Math.max(-50, Math.min(50, st.tilt));
        st.targetTilt = Math.max(-50, Math.min(50, st.targetTilt));
      }

      // Configuration de la projection d3-geo Orthographic
      const radius = Math.min(w, h) * 0.42;
      const cx = w / 2;
      const cy = h / 2;

      const projection = geoOrthographic()
        .scale(radius)
        .translate([cx, cy])
        .rotate([st.yaw, st.tilt, 0])
        .clipAngle(90); // Rendu strict de l'hémisphère visible

      const geoPathGen = geoPath(projection, ctx);

      // 1. DESSIN DE LA SPHÈRE DE FOND (Océans sobres)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = THEME.globeBase;
      ctx.fill();

      // Ombrage radial discret pour donner un volume 3D doux
      const gradient = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.2,
        cx,
        cy,
        radius
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      gradient.addColorStop(0.7, "rgba(250, 246, 240, 0)");
      gradient.addColorStop(1, "rgba(59, 34, 24, 0.08)");
      ctx.fillStyle = gradient;
      ctx.fill();

      // Bordure fine de la planète
      ctx.strokeStyle = THEME.globeBorder;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // 2. DESSIN DES CONTINENTS RÉELS & PAYS (Natural Earth)
      ctx.save();
      // Remplissage des terres
      ctx.beginPath();
      geoPathGen(worldLand as any);
      ctx.fillStyle = THEME.landFill;
      ctx.fill();

      // Frontières des pays (vrais dessins géographiques)
      ctx.beginPath();
      geoPathGen(worldCountries as any);
      ctx.strokeStyle = THEME.countryStroke;
      ctx.lineWidth = 0.55;
      ctx.stroke();

      // Contour extérieur des côtes
      ctx.beginPath();
      geoPathGen(worldLand as any);
      ctx.strokeStyle = THEME.landStroke;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();

      // 3. DESSIN DES ROUTES & TRANSACTIONS (Arcs géodésiques 3D)
      const centerLon = -st.yaw;
      const centerLat = -st.tilt;
      const tSeconds = timestamp / 1000;

      visibleRoutes.forEach((route, index) => {
        const originCoord: [number, number] = [route.origin_lon, route.origin_lat];
        const destCoord: [number, number] = [route.dest_lon, route.dest_lat];

        // Calcul des points interpolés le long du grand cercle
        const interpolator = geoInterpolate(originCoord, destCoord);
        const steps = 36;
        const arcPoints: { x: number; y: number; isVisible: boolean }[] = [];

        // Altitude de l'arc (plus haut au milieu)
        const distRad = geoDistance(originCoord, destCoord);
        const arcHeight = Math.max(16, distRad * radius * 0.28);

        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const pt = interpolator(u);

          // Visibilité sur l'hémisphère avant
          const dToCenter = geoDistance(pt, [centerLon, centerLat]);
          const isVisible = dToCenter <= Math.PI / 2;

          // Projection à la surface
          const projected = projection(pt);
          if (projected) {
            // Surélévation 3D normale à la surface
            const dx = projected[0] - cx;
            const dy = projected[1] - cy;
            const len = Math.hypot(dx, dy) || 1;
            const lift = Math.sin(Math.PI * u) * arcHeight;

            arcPoints.push({
              x: projected[0] + (dx / len) * lift,
              y: projected[1] + (dy / len) * lift,
              isVisible,
            });
          }
        }

        // Choix du style de couleur selon la catégorie de transaction (Demande audio 1)
        const colorPalette =
          route.status_category === "IN_TRANSIT"
            ? THEME.inTransit
            : route.status_category === "DELIVERED"
            ? THEME.delivered
            : THEME.pendingHub;

        // Tracé de l'arc
        if (arcPoints.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.lineWidth = route.status_category === "IN_TRANSIT" ? 1.5 : 1.1;
          ctx.strokeStyle = colorPalette.arc;

          for (let i = 0; i < arcPoints.length - 1; i++) {
            const p1 = arcPoints[i];
            const p2 = arcPoints[i + 1];

            // Arc discret si invisible
            ctx.globalAlpha = p1.isVisible && p2.isVisible ? 0.65 : 0.08;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          ctx.restore();

          // Comète animée (Uniquement pour transactions En Cours / In Transit)
          if (route.status_category === "IN_TRANSIT") {
            const cycle = 3.2; // secondes par trajet
            const offset = (index * 0.35) % 1;
            const progress = ((tSeconds / cycle + offset) % 1) / 0.8; // 80% trajet, 20% pause
            const clampedProg = Math.min(1, Math.max(0, progress));

            const headIdx = Math.floor(clampedProg * (arcPoints.length - 1));
            const headPoint = arcPoints[headIdx];

            if (headPoint && headPoint.isVisible) {
              // Queue de la comète
              const tailLength = 8;
              for (let k = Math.max(0, headIdx - tailLength); k <= headIdx; k++) {
                const pt = arcPoints[k];
                if (!pt || !pt.isVisible) continue;
                const alpha = (1 - (headIdx - k) / tailLength) * 0.9;
                ctx.save();
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 1.8 + (1 - (headIdx - k) / tailLength) * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = colorPalette.comet;
                ctx.globalAlpha = alpha;
                ctx.fill();
                ctx.restore();
              }

              // Pulsation à l'arrivée
              if (clampedProg >= 0.95) {
                const pulsePhase = (progress - 0.8) / 0.2;
                ctx.save();
                ctx.beginPath();
                ctx.arc(headPoint.x, headPoint.y, 4 + pulsePhase * 14, 0, Math.PI * 2);
                ctx.strokeStyle = colorPalette.comet;
                ctx.lineWidth = 1.4;
                ctx.globalAlpha = 1 - pulsePhase;
                ctx.stroke();
                ctx.restore();
              }
            }
          }
        }

        // Marqueurs des Hubs et Destinations
        const originProj = projection(originCoord);
        if (originProj && geoDistance(originCoord, [centerLon, centerLat]) <= Math.PI / 2) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(originProj[0], originProj[1], 3.8, 0, Math.PI * 2);
          ctx.fillStyle = THEME.hubOrigin.pin;
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }

        const destProj = projection(destCoord);
        if (destProj && geoDistance(destCoord, [centerLon, centerLat]) <= Math.PI / 2) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(destProj[0], destProj[1], 3.5, 0, Math.PI * 2);
          ctx.fillStyle = colorPalette.pin;
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Événements Pointer (Glisser pour faire tourner le globe)
    const onPointerDown = (e: PointerEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      stateRef.current.vx = 0;
      stateRef.current.vy = 0;
      stateRef.current.lastInteraction = performance.now();
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const st = stateRef.current;
      if (st.isDragging) {
        const dx = e.clientX - st.lastX;
        const dy = e.clientY - st.lastY;
        st.lastX = e.clientX;
        st.lastY = e.clientY;

        // Sensibilité de rotation
        const sens = 0.35;
        st.yaw += dx * sens;
        st.tilt = Math.max(-50, Math.min(50, st.tilt - dy * sens));
        st.targetYaw = st.yaw;
        st.targetTilt = st.tilt;

        st.vx = dx * sens * 12;
        st.vy = -dy * sens * 12;
        st.lastInteraction = performance.now();
        setHoveredRoute(null);
        return;
      }

      // Détection de survol pour afficher les détails du colis/trajet
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      const radius = Math.min(w, h) * 0.42;
      const cx = w / 2;
      const cy = h / 2;

      const proj = geoOrthographic()
        .scale(radius)
        .translate([cx, cy])
        .rotate([st.yaw, st.tilt, 0])
        .clipAngle(90);

      const centerLon = -st.yaw;
      const centerLat = -st.tilt;

      let found: TransactionRoute | null = null;
      let foundX = 0;
      let foundY = 0;

      for (const route of visibleRoutes) {
        const destCoord: [number, number] = [route.dest_lon, route.dest_lat];
        if (geoDistance(destCoord, [centerLon, centerLat]) <= Math.PI / 2) {
          const pt = proj(destCoord);
          if (pt && Math.hypot(pt[0] - mouseX, pt[1] - mouseY) < 18) {
            found = route;
            foundX = pt[0];
            foundY = pt[1];
            break;
          }
        }
      }

      if (found) {
        setHoveredRoute({ route: found, x: foundX, y: foundY });
      } else {
        setHoveredRoute(null);
      }
    };

    const onPointerUp = () => {
      stateRef.current.isDragging = false;
      stateRef.current.lastInteraction = performance.now();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", () => setHoveredRoute(null));

    return () => {
      isAlive = false;
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [visibleRoutes]);

  return (
    <div
      className={`card-clean ${className}`}
      style={{
        padding: "24px 28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 1. EN-TÊTE ÉPURÉ AVEC SÉLECTEURS EN PILL (Instruction Audio 2) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--brown-light)",
              fontSize: "0.78rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            <Compass size={16} />
            Réseau Logistique International
          </div>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: "800" }}>
            Flux d&apos;Acheminement & Expéditions en Direct
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Visualisation 3D temps réel des liaisons Chine, Dubaï et Maroc vers l&apos;Afrique de l&apos;Ouest.
          </p>
        </div>

        {/* SÉLECTEUR EN PILLS SOBRE & ÉPURÉ */}
        <div className="pill-selector">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`pill-option ${filter === "ALL" ? "pill-option-active" : ""}`}
          >
            Tous les flux
            <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>({counts.all})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("IN_TRANSIT")}
            className={`pill-option ${filter === "IN_TRANSIT" ? "pill-option-active" : ""}`}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: THEME.inTransit.comet,
              }}
            />
            En transit
            <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>({counts.inTransit})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("DELIVERED")}
            className={`pill-option ${filter === "DELIVERED" ? "pill-option-active" : ""}`}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: THEME.delivered.arc,
              }}
            />
            Livrées
            <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>({counts.delivered})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("PENDING_HUB")}
            className={`pill-option ${filter === "PENDING_HUB" ? "pill-option-active" : ""}`}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: THEME.pendingHub.arc,
              }}
            />
            Au Hub
            <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>({counts.pendingHub})</span>
          </button>
        </div>
      </div>

      {/* 2. ZONE PRINCIPALE : LE GLOBE 3D INTERACTIF AVEC LES VRAIS DESSINS DES PAYS */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "460px",
          position: "relative",
          cursor: "grab",
          background: "radial-gradient(circle at center, rgba(250, 246, 240, 0.4) 0%, transparent 70%)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            touchAction: "none",
          }}
        />

        {/* Info-bulle flottante au survol d'une expédition */}
        {hoveredRoute && (
          <div
            style={{
              position: "absolute",
              left: `${Math.min(Math.max(hoveredRoute.x, 140), containerRef.current ? containerRef.current.clientWidth - 140 : 300)}px`,
              top: `${Math.max(20, hoveredRoute.y - 120)}px`,
              transform: "translate(-50%, -10px)",
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              boxShadow: "0 6px 18px rgba(35, 25, 20, 0.1)",
              zIndex: 10,
              minWidth: "220px",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <strong style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                {hoveredRoute.route.tracking_number}
              </strong>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontWeight: "600",
                  background:
                    hoveredRoute.route.status_category === "IN_TRANSIT"
                      ? "var(--state-warning-bg)"
                      : hoveredRoute.route.status_category === "DELIVERED"
                      ? "var(--state-success-bg)"
                      : "var(--bg-subtle)",
                  color:
                    hoveredRoute.route.status_category === "IN_TRANSIT"
                      ? "var(--state-warning-text)"
                      : hoveredRoute.route.status_category === "DELIVERED"
                      ? "var(--state-success-text)"
                      : "var(--text-secondary)",
                }}
              >
                {hoveredRoute.route.status_label}
              </span>
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Client : <strong>{hoveredRoute.route.client_name}</strong>
            </div>

            <div style={{ fontSize: "0.76rem", color: "var(--brown-dark)", fontWeight: "600" }}>
              {hoveredRoute.route.origin_name} ({hoveredRoute.route.origin_country}) →{" "}
              {hoveredRoute.route.dest_name} ({hoveredRoute.route.dest_country})
            </div>

            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginTop: "6px",
                paddingTop: "6px",
                borderTop: "1px solid var(--border-light)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{hoveredRoute.route.mode === "AIR" ? "✈️ Fret Aérien" : "🚢 Fret Maritime"}</span>
              <span>{hoveredRoute.route.weight_kg} kg</span>
            </div>
          </div>
        )}

        {/* PILLS DE FOCUS RÉGIONAL (En bas à gauche) */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(6px)",
            padding: "4px 8px",
            borderRadius: "9999px",
            border: "1px solid var(--border-light)",
            boxShadow: "0 1px 3px rgba(35, 25, 20, 0.05)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600", marginLeft: "4px" }}>
            Centrer :
          </span>
          <button
            type="button"
            onClick={() => focusRegion(-105, -20)}
            className="btn btn-pill"
            style={{ padding: "3px 10px", fontSize: "0.74rem", background: "transparent", border: "none" }}
            title="Centrer sur la Chine"
          >
            🇨🇳 Chine
          </button>
          <button
            type="button"
            onClick={() => focusRegion(-55, -22)}
            className="btn btn-pill"
            style={{ padding: "3px 10px", fontSize: "0.74rem", background: "transparent", border: "none" }}
            title="Centrer sur Dubaï"
          >
            🇦🇪 Dubaï
          </button>
          <button
            type="button"
            onClick={() => focusRegion(8, -28)}
            className="btn btn-pill"
            style={{ padding: "3px 10px", fontSize: "0.74rem", background: "transparent", border: "none" }}
            title="Centrer sur le Maroc"
          >
            🇲🇦 Maroc
          </button>
          <button
            type="button"
            onClick={() => focusRegion(8, -10)}
            className="btn btn-pill"
            style={{ padding: "3px 10px", fontSize: "0.74rem", background: "transparent", border: "none" }}
            title="Centrer sur l'Afrique de l'Ouest"
          >
            🌍 Afrique
          </button>
        </div>

        {/* LÉGENDE DES COULEURS DES TRANSACTIONS (En bas à droite) */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(6px)",
            padding: "6px 14px",
            borderRadius: "9999px",
            border: "1px solid var(--border-light)",
            fontSize: "0.74rem",
            color: "var(--text-secondary)",
            boxShadow: "0 1px 3px rgba(35, 25, 20, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: THEME.inTransit.comet,
              }}
            />
            <span>En transit (Comète)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: THEME.delivered.arc,
              }}
            />
            <span>Livrées</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: THEME.pendingHub.arc,
              }}
            />
            <span>Au Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteGlobe;
