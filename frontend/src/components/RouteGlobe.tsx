"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import {
  Compass,
  Plane,
  Ship,
  MapPin,
  Clock,
  RotateCcw,
  CheckCircle2,
  Package,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Globe,
} from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";

// Types des transactions logistiques
export interface TransactionRoute {
  id: string;
  /** Rang du colis parmi ceux du même trajet : chacun a sa propre courbe, 100 colis = 100 lignes. */
  lane?: number;
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
  status_category: "IN_TRANSIT" | "DELIVERED" | "PREPARATION";
  status_label: string;
  mode: "AIR" | "SEA";
  weight_kg?: number;
  volume_cbm?: number;
}

export interface RouteGlobeProps {
  shipments?: any[];
  className?: string;
  isSidebarCollapsed?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSelectShipment?: (shipment: TransactionRoute) => void;
  selectedShipmentId?: string | null;
  focusTarget?: { lon: number; lat: number } | null;
  onClearSelection?: () => void;
}

// Couleurs sobres & lumineuses selon la charte ROUM TRANSIT
const THEME = {
  globeBase: "#FAF6F0",
  globeBorder: "#D8CEBE",

  // Continents et pays réels
  landFill: "#EBE3D7",
  landStroke: "#D2C5B4",
  countryStroke: "#DDD3C6",

  // 1. Transactions EN TRANSIT (Ambre dynamique)
  inTransit: {
    arc: "#8A7660",
    comet: "#8A7660",
    pin: "#8A7660",
  },

  // 2. Transactions LIVRÉES (Vert sauge profond)
  delivered: {
    arc: "#2E7D4E",
    comet: "#10B981",
    pin: "#2E7D4E",
  },

  // 3. Transactions EN PRÉPARATION (Bleu royal éclatant selon demande utilisateur)
  preparation: {
    arc: "#2563EB",
    comet: "#60A5FA",
    pin: "#1D4ED8",
  },

  // Hubs principaux d'expédition (Chine, Dubaï, Maroc)
  hubOrigin: {
    pin: "#3B2218",
    ring: "rgba(59, 34, 24, 0.45)",
  },
};

// Données cartographiques vectorielles
const worldLand = feature(worldData as any, (worldData as any).objects.land);
const worldCountries = feature(worldData as any, (worldData as any).objects.countries);

// Primitives 3D mathématiques
export type Vec3 = [number, number, number];
const RAD = Math.PI / 180;

export function toVec(lon: number, lat: number): Vec3 {
  const phi = lat * RAD;
  const lam = lon * RAD;
  return [
    Math.cos(phi) * Math.sin(lam),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(lam),
  ];
}

export function rotate(v: Vec3, yaw: number, tilt: number): Vec3 {
  // Rotation 1 : axe polaire vertical (Y) selon yaw
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = v[0] * cosY + v[2] * sinY;
  const y1 = v[1];
  const z1 = -v[0] * sinY + v[2] * cosY;

  // Rotation 2 : axe transversal (X) selon tilt
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const x2 = x1;
  const y2 = y1 * cosT - z1 * sinT;
  const z2 = y1 * sinT + z1 * cosT;

  return [x2, y2, z2];
}

export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const theta = Math.acos(dot);
  if (theta < 0.0001) return a;
  const sinTheta = Math.sin(theta);
  const w1 = Math.sin((1 - t) * theta) / sinTheta;
  const w2 = Math.sin(t * theta) / sinTheta;
  return [
    w1 * a[0] + w2 * b[0],
    w1 * a[1] + w2 * b[1],
    w1 * a[2] + w2 * b[2],
  ];
}

function isRouteSelected(route: TransactionRoute, targetId: string | null | undefined): boolean {
  if (!targetId) return false;
  const t = String(targetId).trim().toLowerCase();
  const rId = String(route.id).trim().toLowerCase();
  const rTrack = String(route.tracking_number).trim().toLowerCase();
  return rId === t || rTrack === t || t.includes(rTrack) || rTrack.includes(t);
}

// Coordonnées des villes et pays du réseau : chaque colis est posé sur son vrai trajet.
type Place = { lon: number; lat: number; country: string; name: string };

const CITY_POINTS: Record<string, Place> = {
  guangzhou: { lon: 113.26, lat: 23.13, country: "Chine", name: "Guangzhou" },
  canton: { lon: 113.26, lat: 23.13, country: "Chine", name: "Guangzhou" },
  yiwu: { lon: 120.07, lat: 29.3, country: "Chine", name: "Yiwu" },
  shenzhen: { lon: 114.06, lat: 22.54, country: "Chine", name: "Shenzhen" },
  shanghai: { lon: 121.47, lat: 31.23, country: "Chine", name: "Shanghai" },
  dubai: { lon: 55.27, lat: 25.2, country: "Émirats", name: "Dubaï" },
  casablanca: { lon: -7.59, lat: 33.57, country: "Maroc", name: "Casablanca" },
  paris: { lon: 2.35, lat: 48.85, country: "France", name: "Paris" },
  istanbul: { lon: 28.98, lat: 41.01, country: "Turquie", name: "Istanbul" },
  abidjan: { lon: -4.01, lat: 5.36, country: "Côte d'Ivoire", name: "Abidjan" },
  yamoussoukro: { lon: -5.28, lat: 6.82, country: "Côte d'Ivoire", name: "Yamoussoukro" },
  bouake: { lon: -5.03, lat: 7.69, country: "Côte d'Ivoire", name: "Bouaké" },
  "san-pedro": { lon: -6.64, lat: 4.75, country: "Côte d'Ivoire", name: "San-Pédro" },
  bamako: { lon: -8.0, lat: 12.64, country: "Mali", name: "Bamako" },
  dakar: { lon: -17.47, lat: 14.71, country: "Sénégal", name: "Dakar" },
  conakry: { lon: -13.68, lat: 9.54, country: "Guinée", name: "Conakry" },
  lome: { lon: 1.22, lat: 6.13, country: "Togo", name: "Lomé" },
  cotonou: { lon: 2.42, lat: 6.37, country: "Bénin", name: "Cotonou" },
  douala: { lon: 9.77, lat: 4.05, country: "Cameroun", name: "Douala" },
  yaounde: { lon: 11.5, lat: 3.87, country: "Cameroun", name: "Yaoundé" },
  ouagadougou: { lon: -1.52, lat: 12.37, country: "Burkina Faso", name: "Ouagadougou" },
  libreville: { lon: 9.45, lat: 0.39, country: "Gabon", name: "Libreville" },
  niamey: { lon: 2.11, lat: 13.51, country: "Niger", name: "Niamey" },
  accra: { lon: -0.19, lat: 5.6, country: "Ghana", name: "Accra" },
  lagos: { lon: 3.38, lat: 6.52, country: "Nigeria", name: "Lagos" },
  kinshasa: { lon: 15.27, lat: -4.44, country: "RD Congo", name: "Kinshasa" },
  brazzaville: { lon: 15.28, lat: -4.27, country: "Congo", name: "Brazzaville" },
  "pointe-noire": { lon: 11.86, lat: -4.78, country: "Congo", name: "Pointe-Noire" },
  ndjamena: { lon: 15.04, lat: 12.13, country: "Tchad", name: "N'Djaména" },
  nouakchott: { lon: -15.98, lat: 18.09, country: "Mauritanie", name: "Nouakchott" },
  freetown: { lon: -13.23, lat: 8.47, country: "Sierra Leone", name: "Freetown" },
  monrovia: { lon: -10.8, lat: 6.3, country: "Liberia", name: "Monrovia" },
};

// Faute de ville connue, le pays (sa ville principale).
const COUNTRY_POINTS: Record<string, Place> = {
  chine: CITY_POINTS.guangzhou,
  china: CITY_POINTS.guangzhou,
  emirats: CITY_POINTS.dubai,
  "emirats arabes unis": CITY_POINTS.dubai,
  uae: CITY_POINTS.dubai,
  maroc: CITY_POINTS.casablanca,
  france: CITY_POINTS.paris,
  turquie: CITY_POINTS.istanbul,
  "cote d'ivoire": CITY_POINTS.abidjan,
  "cote divoire": CITY_POINTS.abidjan,
  mali: CITY_POINTS.bamako,
  senegal: CITY_POINTS.dakar,
  guinee: CITY_POINTS.conakry,
  togo: CITY_POINTS.lome,
  benin: CITY_POINTS.cotonou,
  cameroun: CITY_POINTS.douala,
  "burkina faso": CITY_POINTS.ouagadougou,
  burkina: CITY_POINTS.ouagadougou,
  gabon: CITY_POINTS.libreville,
  niger: CITY_POINTS.niamey,
  ghana: CITY_POINTS.accra,
  nigeria: CITY_POINTS.lagos,
  "rd congo": CITY_POINTS.kinshasa,
  rdc: CITY_POINTS.kinshasa,
  congo: CITY_POINTS.brazzaville,
  tchad: CITY_POINTS.ndjamena,
  mauritanie: CITY_POINTS.nouakchott,
  "sierra leone": CITY_POINTS.freetown,
  liberia: CITY_POINTS.monrovia,
};

const normalizePlace = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u2019/g, "'")
    .trim()
    .toLowerCase();

/** La ville si on la connaît, sinon le pays ; `null` si aucun des deux : un colis n'est jamais posé au hasard. */
function placeOf(city: unknown, country: unknown): Place | null {
  const c = normalizePlace(city).replace(/\s+/g, "-");
  if (c && CITY_POINTS[c]) return CITY_POINTS[c];
  const k = normalizePlace(country);
  if (k && COUNTRY_POINTS[k]) return COUNTRY_POINTS[k];
  const partial = Object.entries(COUNTRY_POINTS).find(([name]) => k && (k.includes(name) || name.includes(k)));
  return partial ? partial[1] : null;
}


export function RouteGlobe({
  shipments,
  className = "",
  isSidebarCollapsed = false,
  isExpanded: controlledExpanded,
  onToggleExpand,
  onSelectShipment,
  selectedShipmentId,
  focusTarget,
  onClearSelection,
}: RouteGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggleExpand = useCallback(() => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [onToggleExpand]);

  const [filter, setFilter] = useState<"ALL" | "IN_TRANSIT" | "DELIVERED" | "PREPARATION">("ALL");
  const [originFilter, setOriginFilter] = useState<"Chine" | "Dubaï" | "Maroc" | null>(null);

  const [hoveredRoute, setHoveredRoute] = useState<{
    route: TransactionRoute;
    x: number;
    y: number;
  } | null>(null);

  // Touche Échap pour quitter le plein écran
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        handleToggleExpand();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded, handleToggleExpand]);

  // Un flux par colis réellement enregistré et non annulé : rien d'inventé quand il n'y en a pas.
  const routesData = useMemo<TransactionRoute[]>(() => {
    const list = shipments || [];
    const built = list.flatMap((s: any, idx: number): TransactionRoute[] => {
      const origin = placeOf(s.origin_hub || s.origin_city, s.origin_country);
      const dest = placeOf(s.destination_city || s.client_city, s.destination_country || s.client_country);
      if (!origin || !dest) return [];

      const rawStatus = (s.current_status || s.status || s.status_code || "").toUpperCase();
      // Un colis annulé ne voyage plus : il ne trace aucun flux.
      if (rawStatus === "CANCELLED" || rawStatus.includes("ANNUL")) return [];
      let category: "IN_TRANSIT" | "DELIVERED" | "PREPARATION" = "IN_TRANSIT";
      if (rawStatus === "DELIVERED" || rawStatus.includes("LIVR")) {
        category = "DELIVERED";
      } else if (
        rawStatus === "RECEIVED_AT_HUB" ||
        rawStatus === "DRAFT" ||
        rawStatus === "IN_PREPARATION" ||
        rawStatus === "PREPARATION" ||
        rawStatus.includes("HUB") ||
        rawStatus.includes("PREPAR")
      ) {
        category = "PREPARATION";
      }

      const modeName = `${s.shipping_mode || ""} ${s.shipping_mode_name || ""} ${s.tracking_number || ""}`.toUpperCase();
      const route: TransactionRoute = {
        id: String(s.id || `sh-${idx}`),
        tracking_number: String(s.tracking_number || ""),
        client_name: s.client_name || s.client?.full_name || s.sender_name || "",
        origin_name: origin.name,
        origin_country: origin.country,
        origin_lon: origin.lon,
        origin_lat: origin.lat,
        dest_name: dest.name,
        dest_country: dest.country,
        dest_lon: dest.lon,
        dest_lat: dest.lat,
        status_category: category,
        status_label:
          s.status_label ||
          (category === "IN_TRANSIT" ? "En cours d'acheminement" : category === "DELIVERED" ? "Livré au destinataire" : "Réceptionné en agence"),
        mode: modeName.includes("SEA") || modeName.includes("MARI") || modeName.includes("BATEAU") ? "SEA" : "AIR",
        weight_kg: Number(s.chargeable_weight_kg || s.weight_kg || s.total_weight_kg || 0) || undefined,
        volume_cbm: Number(s.volume_cbm || s.total_volume_cbm || 0) || undefined,
      };
      return [route];
    });
    // Les colis d'un même trajet s'étagent au lieu de se cacher les uns derrière les autres.
    const lanes = new Map<string, number>();
    for (const route of built) {
      const key = `${route.origin_name}>${route.dest_name}`;
      route.lane = lanes.get(key) ?? 0;
      lanes.set(key, route.lane + 1);
    }
    return built;
  }, [shipments]);

  const visibleRoutes = useMemo(() => {
    return routesData.filter((r) => {
      if (filter !== "ALL" && r.status_category !== filter) return false;
      if (originFilter === "Chine") {
        const orig = `${r.origin_country} ${r.origin_name}`.toLowerCase();
        return orig.includes("chine") || orig.includes("guangzhou") || orig.includes("yiwu");
      }
      if (originFilter === "Dubaï") {
        const orig = `${r.origin_country} ${r.origin_name}`.toLowerCase();
        return orig.includes("duba") || orig.includes("émirat") || orig.includes("uae");
      }
      if (originFilter === "Maroc") {
        const orig = `${r.origin_country} ${r.origin_name}`.toLowerCase();
        return orig.includes("maroc") || orig.includes("casablanca");
      }
      return true;
    });
  }, [routesData, filter, originFilter]);

  const counts = useMemo(() => {
    return {
      all: routesData.length,
      inTransit: routesData.filter((r) => r.status_category === "IN_TRANSIT").length,
      delivered: routesData.filter((r) => r.status_category === "DELIVERED").length,
      preparation: routesData.filter((r) => r.status_category === "PREPARATION").length,
    };
  }, [routesData]);

  const [zoomPercent, setZoomPercent] = useState(100);

  // État de rotation avec physique continue fluide (Inertie & Lissage)
  const stateRef = useRef({
    yaw: 20 * RAD, // radians
    tilt: 18 * RAD, // radians
    targetYaw: 20 * RAD,
    targetTilt: 18 * RAD,
    zoom: 1.0,
    targetZoom: 1.0,
    vy: 0,
    vt: 0,
    drag: false,
    hasDragged: false,
    hasActiveTarget: false,
    isHoveringGlobe: false,
    px: 0,
    py: 0,
    last: 0,
  });

  const routesRef = useRef(visibleRoutes);
  routesRef.current = visibleRoutes;

  const selectedShipmentRef = useRef(selectedShipmentId);
  selectedShipmentRef.current = selectedShipmentId;

  const onSelectShipmentRef = useRef(onSelectShipment);
  onSelectShipmentRef.current = onSelectShipment;

  const hoveredRouteRef = useRef<{
    route: TransactionRoute;
    x: number;
    y: number;
  } | null>(null);

  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  // Animation douce vers une région
  const focusRegion = useCallback((targetYawRad: number, targetTiltRad: number) => {
    const curYaw = stateRef.current.yaw;
    const twoPi = Math.PI * 2;
    const diff = ((targetYawRad - curYaw) % twoPi + Math.PI * 3) % twoPi - Math.PI;
    stateRef.current.targetYaw = curYaw + diff;
    stateRef.current.targetTilt = Math.max(-0.85, Math.min(0.85, targetTiltRad));
    stateRef.current.vy = 0;
    stateRef.current.vt = 0;
    stateRef.current.hasActiveTarget = true;
  }, []);

  // Centrage automatique sur le point médian géodésique du colis sélectionné
  useEffect(() => {
    if (focusTarget) {
      focusRegion(focusTarget.lon * RAD, focusTarget.lat * RAD);
    } else if (selectedShipmentId) {
      const match = routesData.find((r) => isRouteSelected(r, selectedShipmentId));
      if (match) {
        const vA = toVec(match.origin_lon, match.origin_lat);
        const vB = toVec(match.dest_lon, match.dest_lat);
        const vMid = slerp(vA, vB, 0.5);
        const [midX, midY, midZ] = vMid;
        const midLon = Math.atan2(midX, midZ);
        const midLat = Math.asin(Math.max(-1, Math.min(1, midY)));
        // Oriente la face caméra vers ce point médian
        focusRegion(midLon, midLat * 0.5);
      }
    } else {
      stateRef.current.hasActiveTarget = false;
    }
  }, [selectedShipmentId, focusTarget, routesData, focusRegion]);

  const adjustZoom = useCallback((factor: number) => {
    const nextZoom = Math.max(0.45, Math.min(3.5, stateRef.current.targetZoom * factor));
    stateRef.current.targetZoom = nextZoom;
    setZoomPercent(Math.round(nextZoom * 100));
  }, []);

  const resetGlobe = useCallback(() => {
    focusRegion(20 * RAD, 18 * RAD);
    stateRef.current.targetZoom = 1.0;
    stateRef.current.hasActiveTarget = false;
    setZoomPercent(100);
    setOriginFilter(null);
    if (onClearSelection) {
      onClearSelection();
    }
  }, [focusRegion, onClearSelection]);

  // Canvas render loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId = 0;
    let isAlive = true;
    let t0 = performance.now();

    const resizeCanvas = () => {
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      if (w <= 0 || h <= 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    const project = (
      v: Vec3,
      lift: number,
      r: number,
      cx: number,
      cy: number,
      yaw: number,
      tilt: number
    ) => {
      const [x, y, z] = rotate(v, yaw, tilt);
      return { x: cx + x * r * lift, y: cy - y * r * lift, z };
    };

    const draw = (now: number) => {
      if (!isAlive) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight || 500;

      if (w <= 20 || h <= 20) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const st = stateRef.current;
      const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0.016;
      st.last = now;

      // 1. ROTATION CONTINUE SEREINE ET PHYSIQUE FLUIDE
      if (st.drag) {
        // En cours de glissement
      } else if (st.hasActiveTarget) {
        const twoPi = Math.PI * 2;
        const diffYaw = ((st.targetYaw - st.yaw) % twoPi + Math.PI * 3) % twoPi - Math.PI;
        const diffTilt = st.targetTilt - st.tilt;

        if (Math.abs(diffYaw) > 0.005 || Math.abs(diffTilt) > 0.005) {
          st.yaw += diffYaw * Math.min(dt * 5, 0.25);
          st.tilt += diffTilt * Math.min(dt * 5, 0.25);
        } else {
          st.hasActiveTarget = false;
        }
      } else if (st.isHoveringGlobe) {
        // LE CURSEUR EST SUR LE GLOBE : IL S'ARRÊTE SANS GLITCH !
        st.targetYaw = st.yaw;
        st.vy *= Math.pow(0.01, dt);
        st.vt *= Math.pow(0.01, dt);
      } else {
        // Rotation lente continue dans le sens horaire quand le curseur n'est PAS sur le globe
        st.yaw -= dt * 0.06;
        st.targetYaw = st.yaw;

        st.yaw += st.vy * dt;
        st.tilt += st.vt * dt;
        st.vy *= Math.pow(0.05, dt);
        st.vt *= Math.pow(0.05, dt);

        st.tilt = Math.max(
          -0.85,
          Math.min(0.85, st.tilt + (18 * RAD - st.tilt) * Math.min(1, dt * 0.4))
        );
      }

      // Lissage du zoom
      const diffZoom = st.targetZoom - st.zoom;
      if (Math.abs(diffZoom) > 0.003) {
        st.zoom += diffZoom * Math.min(dt * 8, 0.25);
      } else {
        st.zoom = st.targetZoom;
      }

      // 2. TAILLE NORMALE PARFAITEMENT PROPORTIONNÉE (Non coupée, non trop zoomée)
      // En mode agrandi, 0.35 permet d'avoir le globe 100% visible avec marges élégantes
      const baseRadius = Math.min(w, h) * (isExpandedRef.current ? 0.34 : 0.35);
      const r = baseRadius * st.zoom;
      const cx = w / 2;
      const cy = h / 2;

      // Dessin des continents Natural Earth synchronisés avec rotate
      // Conversion yaw (rad) -> rotation D3 lambda/phi
      const d3Yaw = (st.yaw / RAD);
      const d3Tilt = (-st.tilt / RAD);

      const projection = geoOrthographic()
        .scale(r)
        .translate([cx, cy])
        .rotate([d3Yaw, d3Tilt, 0])
        .clipAngle(90);

      const geoPathGen = geoPath(projection, ctx);

      // Fond de la planète
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = THEME.globeBase;
      ctx.fill();

      // Halo 3D doux
      const gradient = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.15,
        cx,
        cy,
        r
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      gradient.addColorStop(0.75, "rgba(250, 246, 240, 0)");
      gradient.addColorStop(1, "rgba(59, 34, 24, 0.08)");
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = THEME.globeBorder;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Continents & Pays
      ctx.save();
      ctx.beginPath();
      geoPathGen(worldLand as any);
      ctx.fillStyle = THEME.landFill;
      ctx.fill();

      ctx.beginPath();
      geoPathGen(worldCountries as any);
      ctx.strokeStyle = THEME.countryStroke;
      ctx.lineWidth = 0.55;
      ctx.stroke();

      ctx.beginPath();
      geoPathGen(worldLand as any);
      ctx.strokeStyle = THEME.landStroke;
      ctx.lineWidth = 0.85;
      ctx.stroke();
      ctx.restore();

      // 3. ANIMATION DES FLUX EXACTE DU CODE FOURNI PAR L'UTILISATEUR
      const t = (now - t0) / 1000;
      const currentRoutes = routesRef.current;
      const activeSelectedId = selectedShipmentRef.current;

      ctx.lineCap = "round";

      // Enregistrement des hubs distincts pour les anneaux respiratoires
      const renderedHubs = new Set<string>();

      currentRoutes.forEach((route, index) => {
        const isSelected = isRouteSelected(route, activeSelectedId);

        // Si une expédition est centrée, on retire toutes les autres !
        if (activeSelectedId && !isSelected) {
          return;
        }

        const colorPalette =
          route.status_category === "IN_TRANSIT"
            ? THEME.inTransit
            : route.status_category === "DELIVERED"
            ? THEME.delivered
            : THEME.preparation;

        const H = toVec(route.origin_lon, route.origin_lat);
        const V = toVec(route.dest_lon, route.dest_lat);

        const ang = Math.acos(
          Math.max(-1, Math.min(1, H[0] * V[0] + H[1] * V[1] + H[2] * V[2]))
        );
        // Légère variation orbitale par index pour que 2 colis sur la même ligne ne se superposent pas
        const height = 0.06 + ang * 0.12 + ((route.lane ?? index) % 12) * 0.03;

        const pts: { x: number; y: number; z: number }[] = [];
        for (let k = 0; k <= 48; k++) {
          const u = k / 48;
          pts.push(
            project(
              slerp(H, V, u),
              1 + Math.sin(Math.PI * u) * height,
              r,
              cx,
              cy,
              st.yaw,
              st.tilt
            )
          );
        }

        // L'ARC : discret lorsqu'il passe derrière le globe, rehaussé si survolé
        const isHovered = hoveredRouteRef.current?.route.id === route.id;
        ctx.strokeStyle = colorPalette.arc;
        ctx.lineWidth = isHovered ? 2.0 : 1.1;
        for (let k = 0; k < 48; k++) {
          const a = pts[k],
            b = pts[k + 1];
          const hidden = a.z < 0 && Math.hypot(a.x - cx, a.y - cy) < r;
          ctx.globalAlpha = hidden ? 0.05 : isHovered ? 0.95 : 0.38;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        // LA COMÈTE / ÉTOILE FILANTE : vol fluide sous-pixel et atterrissage amorti en douceur
        const cycle = 4.0;
        const routeOffset = isSelected ? 0 : (index / Math.max(1, currentRoutes.length));
        const ph = (t / cycle + routeOffset) % 1;

        // Phase de vol (0 -> 0.72) avec décélération douce à l'approche, puis absorption progressive de la traînée (0.72 -> 0.92)
        const tailLen = 11;
        const flightDuration = 0.72;
        const absorbDuration = 0.20;

        let headPos = 0; // Position flottante de la tête (0..48)
        let tailStartPos = 0; // Position flottante de la queue
        let landingFade = 1;

        if (ph <= flightDuration) {
          const u = ph / flightDuration;
          // Décélération progressive (ease-out doux) sur le dernier tiers avant l'atterrissage
          const eased = u < 0.6
            ? (u / 0.6) * 0.64
            : 0.64 + (1 - Math.pow(1 - (u - 0.6) / 0.4, 2.1)) * 0.36;
          headPos = eased * 48;
          tailStartPos = Math.max(0, headPos - tailLen);
          // Apparition douce au décollage
          landingFade = Math.min(1, u / 0.08);
        } else if (ph <= flightDuration + absorbDuration) {
          // La tête est posée à destination (48) et la traînée s'absorbe doucement dans le point d'arrivée
          const absorbU = (ph - flightDuration) / absorbDuration;
          const easedAbsorb = 1 - Math.pow(1 - absorbU, 2.2);
          headPos = 48;
          tailStartPos = Math.min(48, (48 - tailLen) + easedAbsorb * tailLen);
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
            if (a.z < 0 && Math.hypot(a.x - cx, a.y - cy) < r) continue;

            // Interpolation sous-segment pour la pointe de la comète (zéro saccade)
            const segEnd = k + 1 > headPos ? headPos - k : 1;
            const bx = a.x + (b.x - a.x) * segEnd;
            const by = a.y + (b.y - a.y) * segEnd;

            const progressAlongTail = Math.max(0, Math.min(1, (k + segEnd - tailStartPos) / currentSpan));
            const smoothAlpha = Math.pow(progressAlongTail, 1.4) * 0.92 * landingFade;

            ctx.globalAlpha = smoothAlpha;
            ctx.lineWidth = 1.0 + progressAlongTail * 1.25;
            ctx.strokeStyle = colorPalette.comet;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        // PIN DE DESTINATION & ONDE D'ATTERRISSAGE DOUCE (amortie en ease-out cubique)
        const end = pts[48];
        const front = end.z > 0;
        if (front) {
          const isTouchingDown = ph >= flightDuration - 0.05 && ph <= flightDuration + 0.26;
          const touchProgress = isTouchingDown
            ? (ph - (flightDuration - 0.05)) / 0.31
            : 0;
          const pinBreath = isTouchingDown ? Math.sin(touchProgress * Math.PI) * 0.9 : 0;

          ctx.globalAlpha = 1;
          ctx.fillStyle = colorPalette.comet;
          ctx.beginPath();
          ctx.arc(end.x, end.y, 2.5 + pinBreath, 0, Math.PI * 2);
          ctx.fill();

          // Onde d'atterrissage soyeuse et progressive
          if (isTouchingDown) {
            const easeOutRipple = 1 - Math.pow(1 - touchProgress, 3);
            const rippleAlpha = Math.pow(1 - touchProgress, 1.85) * 0.65;
            ctx.globalAlpha = rippleAlpha;
            ctx.lineWidth = 1.25 * (1 - touchProgress * 0.4);
            ctx.strokeStyle = colorPalette.comet;
            ctx.beginPath();
            ctx.arc(end.x, end.y, 3.2 + easeOutRipple * 13, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // LE HUB D'ORIGINE AVEC ANNEAU RESPIRATOIRE (code exact utilisateur)
        if (!renderedHubs.has(route.origin_name)) {
          renderedHubs.add(route.origin_name);
          const h = project(H, 1, r, cx, cy, st.yaw, st.tilt);
          if (h.z > 0) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = THEME.hubOrigin.pin;
            ctx.beginPath();
            ctx.arc(h.x, h.y, 3.8, 0, Math.PI * 2);
            ctx.fill();

            // Anneau respiratoire
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3);
            ctx.strokeStyle = THEME.hubOrigin.pin;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(h.x, h.y, 8.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    // GESTION POINTER CONFORME AU CODE UTILISATEUR
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const st = stateRef.current;
      st.drag = true;
      st.hasDragged = false;
      st.px = e.clientX;
      st.py = e.clientY;
      st.vy = st.vt = 0;
    };

    const onMove = (e: PointerEvent) => {
      const st = stateRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      const baseRadius = Math.min(w, h) * (isExpandedRef.current ? 0.34 : 0.35);
      const r = baseRadius * st.zoom;
      const cx = w / 2;
      const cy = h / 2;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (st.drag) {
        const dx = e.clientX - st.px;
        const dy = e.clientY - st.py;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          st.hasDragged = true;
        }
        st.px = e.clientX;
        st.py = e.clientY;
        st.yaw += dx / r;
        st.tilt = Math.max(-0.85, Math.min(0.85, st.tilt - dy / r));
        st.vy = (dx / r) * 20;
        st.vt = (-dy / r) * 20;
        if (hoveredRouteRef.current) {
          hoveredRouteRef.current = null;
          setHoveredRoute(null);
        }
        return;
      }

      // 1. Détection : Le curseur est-il sur la sphère du globe ?
      const distFromCenter = Math.hypot(mouseX - cx, mouseY - cy);
      const isOverGlobe = distFromCenter <= r * 1.02;
      st.isHoveringGlobe = isOverGlobe;

      // 2. Détection : Le curseur est-il spécifiquement sur un des FLUX ?
      // Règle demandée :
      // "dès que le curseur monte sur le globe, sur le globe hein pas sur un des flux, il s'arrête.
      // Et c'est quand c'est sur un des flux qu'il affiche la description du flux."
      let matched: TransactionRoute | null = null;
      let hitX = mouseX;
      let hitY = mouseY;

      if (isOverGlobe) {
        const currentRoutes = routesRef.current;
        const activeSelectedId = selectedShipmentRef.current;

        for (let i = 0; i < currentRoutes.length; i++) {
          const route = currentRoutes[i];
          const isSelected = isRouteSelected(route, activeSelectedId);
          if (activeSelectedId && !isSelected) continue;

          // A. Test du point d'arrivée (destination pin)
          const V = toVec(route.dest_lon, route.dest_lat);
          const pDest = project(V, 1, r, cx, cy, st.yaw, st.tilt);
          if (pDest.z > 0 && Math.hypot(pDest.x - mouseX, pDest.y - mouseY) < 16) {
            matched = route;
            hitX = pDest.x;
            hitY = pDest.y;
            break;
          }

          // B. Test du point de départ (hub origin)
          const H = toVec(route.origin_lon, route.origin_lat);
          const pOrig = project(H, 1, r, cx, cy, st.yaw, st.tilt);
          if (pOrig.z > 0 && Math.hypot(pOrig.x - mouseX, pOrig.y - mouseY) < 14) {
            matched = route;
            hitX = pOrig.x;
            hitY = pOrig.y;
            break;
          }

          // C. Test le long de l'arc 3D du flux
          const ang = Math.acos(Math.max(-1, Math.min(1, H[0] * V[0] + H[1] * V[1] + H[2] * V[2])));
          const height = 0.06 + ang * 0.12 + ((route.lane ?? i) % 12) * 0.03;

          for (let k = 0; k <= 24; k++) {
            const u = k / 24;
            const pt = project(
              slerp(H, V, u),
              1 + Math.sin(Math.PI * u) * height,
              r,
              cx,
              cy,
              st.yaw,
              st.tilt
            );
            const hidden = pt.z < 0 && Math.hypot(pt.x - cx, pt.y - cy) < r;
            if (!hidden) {
              const d = Math.hypot(pt.x - mouseX, pt.y - mouseY);
              if (d < 12) {
                matched = route;
                hitX = pt.x;
                hitY = pt.y;
                break;
              }
            }
          }

          if (matched) break;
        }
      }

      // Mise à jour de la description UNIQUEMENT si le flux ciblé a changé
      if (matched) {
        if (!hoveredRouteRef.current || hoveredRouteRef.current.route.id !== matched.id) {
          const nextVal = { route: matched, x: hitX, y: hitY };
          hoveredRouteRef.current = nextVal;
          setHoveredRoute(nextVal);
        }
      } else {
        if (hoveredRouteRef.current) {
          hoveredRouteRef.current = null;
          setHoveredRoute(null);
        }
      }
    };

    const onUp = () => {
      const st = stateRef.current;
      if (!st.hasDragged && hoveredRouteRef.current) {
        onSelectShipmentRef.current?.(hoveredRouteRef.current.route);
      }
      st.drag = false;
    };

    const onLeave = () => {
      const st = stateRef.current;
      st.isHoveringGlobe = false;
      st.drag = false;
      if (hoveredRouteRef.current) {
        hoveredRouteRef.current = null;
        setHoveredRoute(null);
      }
    };

    // Molette de souris & gesture trackpad pour zoom fluide
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY < 0 ? 1.10 : 0.90;
      adjustZoom(factor);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      isAlive = false;
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [adjustZoom, isExpanded]);

  // Contenu du composant
  const renderContent = (isExp: boolean) => (
    <div
      className={isExp ? "" : `card-clean ${className}`}
      style={
        isExp
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 99999,
              background: "var(--bg-app)",
              padding: "20px 32px 16px 32px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }
          : {
              padding: "24px 28px",
              position: "relative",
              overflow: "hidden",
              background: "#FFFFFF",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }
      }
    >
      {/* 1. EN-TÊTE ÉPURÉ MINIMALISTE (2 LIGNES STRUCTURÉES SANS DÉPASSEMENT) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: isExp ? "10px" : "14px",
          paddingBottom: "14px",
          borderBottom: "1px solid rgba(42, 24, 16, 0.07)",
          flexShrink: 0,
        }}
      >
        {/* Ligne supérieure : Titre sobre à gauche + Bouton Agrandir fixé à droite */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "11px", minWidth: 0 }}>
            <span className="metric-icon-box" style={{ marginTop: "2px" }}>
              <Compass size={16} strokeWidth={1.8} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2
                  style={{
                    fontSize: isExp ? "1.22rem" : "1.06rem",
                    color: "var(--text-main)",
                    fontWeight: "800",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  Réseau Logistique International
                </h2>
                {originFilter && (
                  <span className="ios-trend-pill ios-trend-pill-gold">
                    Départ : {originFilter}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
                {selectedShipmentId || originFilter ? (
                  <span style={{ color: "var(--brown-dark)", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span>
                      {selectedShipmentId
                        ? "Expédition sélectionnée · Ligne isolée"
                        : `Transactions depuis ${originFilter} uniquement`}
                    </span>
                    <button
                      type="button"
                      onClick={resetGlobe}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid var(--border-light)",
                        borderRadius: "9999px",
                        color: "var(--brown-dark)",
                        cursor: "pointer",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        padding: "2px 9px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Réafficher tous les flux
                    </button>
                  </span>
                ) : (
                  <span>Survolez un corridor ou faites pivoter le globe pour inspecter les cargaisons en direct.</span>
                )}
              </p>
            </div>
          </div>

          {/* Bouton Agrandir / Réduire toujours aligné en haut à droite */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="btn btn-secondary"
            style={{
              padding: "6px 13px",
              fontSize: "0.76rem",
              gap: "6px",
              borderRadius: "var(--radius-full)",
              background: isExp ? "var(--btn-primary-bg)" : "#FFFFFF",
              color: isExp ? "#FFFFFF" : "var(--brown-dark)",
              borderColor: isExp ? "var(--btn-primary-bg)" : "var(--border-light)",
              fontWeight: "700",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            title={isExp ? "Réduire l'affichage (Échap)" : "Afficher le globe en plein écran"}
          >
            {isExp ? (
              <>
                <Minimize2 size={13} strokeWidth={2} />
                Réduire
              </>
            ) : (
              <>
                <Maximize2 size={13} strokeWidth={2} />
                Agrandir
              </>
            )}
          </button>
        </div>

        {/* Ligne inférieure : Sélecteur de statut monochrome en pilules */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <div className="pill-selector">
            <button
              type="button"
              onClick={() => {
                setFilter("ALL");
                setOriginFilter(null);
                if (onClearSelection) onClearSelection();
              }}
              className={`pill-option ${filter === "ALL" ? "pill-option-active" : ""}`}
            >
              <Globe size={12} strokeWidth={1.8} />
              Tous
            </button>

            <button
              type="button"
              onClick={() => {
                setFilter("IN_TRANSIT");
                if (onClearSelection) onClearSelection();
              }}
              className={`pill-option ${filter === "IN_TRANSIT" ? "pill-option-active" : ""}`}
            >
              <Plane size={12} strokeWidth={1.8} />
              En transit
            </button>

            <button
              type="button"
              onClick={() => {
                setFilter("DELIVERED");
                if (onClearSelection) onClearSelection();
              }}
              className={`pill-option ${filter === "DELIVERED" ? "pill-option-active" : ""}`}
            >
              <CheckCircle2 size={12} strokeWidth={1.8} />
              Livrés
            </button>

            <button
              type="button"
              onClick={() => {
                setFilter("PREPARATION");
                if (onClearSelection) onClearSelection();
              }}
              className={`pill-option ${filter === "PREPARATION" ? "pill-option-active" : ""}`}
            >
              <Package size={12} strokeWidth={1.8} />
              Préparation
            </button>
          </div>
        </div>
      </div>

      {/* 2. ZONE DU GLOBE 3D */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: "100%",
          height: isExp ? "100%" : "480px",
          minHeight: 0,
          position: "relative",
          cursor: "grab",
          background: "radial-gradient(circle at center, rgba(250, 246, 240, 0.5) 0%, transparent 70%)",
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

        {routesData.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "22px",
              transform: "translateX(-50%)",
              maxWidth: "calc(100% - 32px)",
              padding: "10px 16px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 4px 14px rgba(59, 34, 24, 0.08)",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              fontWeight: 600,
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            Aucun colis pour l&apos;instant : chaque envoi enregistré apparaîtra ici, sur son vrai trajet.
          </div>
        )}

        {/* Info-bulle interactive */}
        {hoveredRoute && (
          <div
            style={{
              position: "absolute",
              left: `${Math.min(hoveredRoute.x + 12, (containerRef.current?.clientWidth || 600) - 240)}px`,
              top: `${Math.max(10, hoveredRoute.y - 45)}px`,
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(10px)",
              padding: "10px 14px",
              borderRadius: "10px",
              boxShadow: "0 6px 20px rgba(59, 34, 24, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)",
              border: "1px solid var(--border-light)",
              pointerEvents: "none",
              zIndex: 30,
              minWidth: "210px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--brown-light)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {hoveredRoute.route.mode === "AIR" ? (
                  <>
                    <Plane size={12} strokeWidth={1.8} /> Voie Aérienne
                  </>
                ) : (
                  <>
                    <Ship size={12} strokeWidth={1.8} /> Voie Maritime
                  </>
                )}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  background:
                    hoveredRoute.route.status_category === "DELIVERED"
                      ? "rgba(16, 185, 129, 0.12)"
                      : hoveredRoute.route.status_category === "IN_TRANSIT"
                      ? "rgba(184, 164, 136, 0.12)"
                      : "rgba(37, 99, 235, 0.12)",
                  color:
                    hoveredRoute.route.status_category === "DELIVERED"
                      ? "#10B981"
                      : hoveredRoute.route.status_category === "IN_TRANSIT"
                      ? "#8A7660"
                      : "#2563EB",
                }}
              >
                {hoveredRoute.route.status_category === "DELIVERED"
                  ? "Livré"
                  : hoveredRoute.route.status_category === "IN_TRANSIT"
                  ? "En Transit"
                  : "Préparation"}
              </span>
            </div>

            <div style={{ fontWeight: "800", fontSize: "0.85rem", color: "var(--text-main)" }}>
              {hoveredRoute.route.tracking_number}
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {hoveredRoute.route.origin_name} ({hoveredRoute.route.origin_country}) → {hoveredRoute.route.dest_name} ({hoveredRoute.route.dest_country})
            </div>

            {hoveredRoute.route.client_name && (
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Destinataire : <strong>{hoveredRoute.route.client_name}</strong>
              </div>
            )}
          </div>
        )}

        {/* Contrôles de zoom & réinitialisation */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            padding: "4px 8px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border-light)",
            boxShadow: "0 2px 10px rgba(59, 34, 24, 0.08)",
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={() => adjustZoom(1.2)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "none",
              background: "#F5F6F8",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Zoomer (+)"
          >
            <ZoomIn size={14} />
          </button>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              color: "var(--brown-dark)",
              minWidth: "36px",
              textAlign: "center",
              userSelect: "none",
            }}
            title="Niveau de zoom actuel"
          >
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={() => adjustZoom(0.83)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "none",
              background: "#F5F6F8",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Dézoomer (-)"
          >
            <ZoomOut size={14} />
          </button>
          <div style={{ width: "1px", height: "14px", background: "var(--border-light)" }} />
          <button
            type="button"
            onClick={resetGlobe}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: "transparent",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Réinitialiser le zoom & la rotation (100%)"
          >
            <RotateCcw size={12} /> 100%
          </button>
        </div>
      </div>

      {/* 3. BARRE DE CENTRAGE RAPIDE & LÉGENDE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(59, 34, 24, 0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)" }}>
            Centrer :
          </span>
          <button
            type="button"
            onClick={() => {
              setOriginFilter((prev) => (prev === "Chine" ? null : "Chine"));
              focusRegion(113.26 * RAD, 23.13 * RAD);
              if (onClearSelection) onClearSelection();
            }}
            className="btn btn-secondary"
            style={{
              padding: "3px 10px",
              fontSize: "0.72rem",
              borderRadius: "var(--radius-full)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: originFilter === "Chine" ? "var(--brown-dark)" : "#FFFFFF",
              color: originFilter === "Chine" ? "#FAF8F5" : "var(--text-main)",
              borderColor: originFilter === "Chine" ? "var(--brown-dark)" : "var(--border-light)",
            }}
          >
            <CircularFlag countryCode="CN" size={13} />
            Chine
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginFilter((prev) => (prev === "Dubaï" ? null : "Dubaï"));
              focusRegion(55.27 * RAD, 25.20 * RAD);
              if (onClearSelection) onClearSelection();
            }}
            className="btn btn-secondary"
            style={{
              padding: "3px 10px",
              fontSize: "0.72rem",
              borderRadius: "var(--radius-full)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: originFilter === "Dubaï" ? "var(--brown-dark)" : "#FFFFFF",
              color: originFilter === "Dubaï" ? "#FAF8F5" : "var(--text-main)",
              borderColor: originFilter === "Dubaï" ? "var(--brown-dark)" : "var(--border-light)",
            }}
          >
            <CircularFlag countryCode="AE" size={13} />
            Dubaï
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginFilter((prev) => (prev === "Maroc" ? null : "Maroc"));
              focusRegion(-7.59 * RAD, 33.57 * RAD);
              if (onClearSelection) onClearSelection();
            }}
            className="btn btn-secondary"
            style={{
              padding: "3px 10px",
              fontSize: "0.72rem",
              borderRadius: "var(--radius-full)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: originFilter === "Maroc" ? "var(--brown-dark)" : "#FFFFFF",
              color: originFilter === "Maroc" ? "#FAF8F5" : "var(--text-main)",
              borderColor: originFilter === "Maroc" ? "var(--brown-dark)" : "var(--border-light)",
            }}
          >
            <CircularFlag countryCode="MA" size={13} />
            Maroc
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginFilter(null);
              focusRegion(0 * RAD, 5 * RAD);
              if (onClearSelection) onClearSelection();
            }}
            className="btn btn-secondary"
            style={{ padding: "3px 10px", fontSize: "0.72rem", borderRadius: "var(--radius-full)", display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <Globe size={13} color="var(--brown-dark)" />
            Afrique
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: THEME.inTransit.comet }} />
            En transit
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: THEME.delivered.comet }} />
            Livrées
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: THEME.preparation.comet }} />
            En préparation
          </span>
        </div>
      </div>
    </div>
  );

  // Si agrandi, rendu via React Portal sur document.body pour plein écran sans coupure
  if (isExpanded && mounted && typeof document !== "undefined") {
    return createPortal(renderContent(true), document.body);
  }

  return renderContent(false);
}

export default RouteGlobe;
