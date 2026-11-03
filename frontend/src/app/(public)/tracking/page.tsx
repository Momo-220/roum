"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, MessageCircle } from "lucide-react";
import { normalizeTrackingNumber } from "@/shared";
import { ScrollReveal } from "@/components/ScrollReveal";

const TRACKING_STEPS = [
  { step: "01", label: "Demande reçue", desc: "Enregistrée sur le portail", isHigh: false },
  { step: "02", label: "Devis envoyé", desc: "Douane intégrale incluse", isHigh: true },
  { step: "03", label: "Paiement validé", desc: "Dossier officiel actif", isHigh: false },
  { step: "04", label: "Commande usine", desc: "Fournisseur réglé en Yuans", isHigh: true },
  { step: "05", label: "Reçu en Chine", desc: "Inspection photos & pesée", isHigh: false },
  { step: "06", label: "Colis expédié", desc: "Vol direct / Conteneur", isHigh: true },
  { step: "07", label: "Arrivé au pays", desc: "Dédouanement port/aéroport", isHigh: false },
  { step: "08", label: "Prêt en agence", desc: "Bingerville Carrefour Safari", isHigh: true },
  { step: "09", label: "Colis livré", desc: "Remis au destinataire", isHigh: false, isFinal: true },
];

export default function TrackingPage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [scale, setScale] = useState(1);

  const outerBoxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const nodeDistancesRef = useRef<number[]>([]);
  const totalLengthRef = useRef<number>(0);

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");

    const normalized = normalizeTrackingNumber(trackingInput);
    if (!normalized) {
      setTrackingError("Veuillez entrer un numéro de colis valide (Ex : RM-AIR-2610-K8P9Q2).");
      return;
    }

    router.push(`/tracking/${normalized}`);
  };

  // Calcul du dézoomage adaptatif : adapte le serpent aux écrans sans modifier le design
  const updateAdaptiveScale = () => {
    if (outerBoxRef.current) {
      const availWidth = outerBoxRef.current.clientWidth;
      const baseWidth = 1080;
      const newScale = Math.min(1, availWidth / baseWidth);
      setScale(newScale);
    }
  };

  // 1. Calcul de la courbe de Bézier serpent cambrée dans l'espace fixe 1080px
  const buildCamberedSnakePath = () => {
    if (!pathRef.current) return;

    const points: { x: number; y: number }[] = [];
    const stepW = 1080 / 9;

    for (let i = 1; i <= TRACKING_STEPS.length; i++) {
      const isHigh = i % 2 === 0;
      const x = stepW * (i - 0.5);
      const y = isHigh ? 38 : 148;
      points.push({ x, y });
    }

    // Tangentes amples horizontales pour une cambrure prononcée
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;

      const cp1x = p1.x + dx * 0.52;
      const cp1y = p1.y;
      const cp2x = p2.x - dx * 0.52;
      const cp2y = p2.y;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    pathRef.current.setAttribute("d", d);
    const totalLength = pathRef.current.getTotalLength();
    totalLengthRef.current = totalLength;
    pathRef.current.style.strokeDasharray = `${totalLength}`;
    pathRef.current.style.strokeDashoffset = `${totalLength}`;

    // Calcul des distances cumulées pour une synchronisation mathématique à 100%
    const distances: number[] = [0];
    const samplesCount = 1000;
    for (let i = 1; i < points.length; i++) {
      const targetPoint = points[i];
      let bestDist = Infinity;
      let bestLen = 0;

      for (let s = 0; s <= samplesCount; s++) {
        const len = (s / samplesCount) * totalLength;
        const pt = pathRef.current.getPointAtLength(len);
        const distSq = (pt.x - targetPoint.x) ** 2 + (pt.y - targetPoint.y) ** 2;
        if (distSq < bestDist) {
          bestDist = distSq;
          bestLen = len;
        }
      }
      distances.push(bestLen);
    }
    nodeDistancesRef.current = distances;
  };

  // 2. Déclenchement de l'animation synchronisée au milliseconde près
  const runSynchronizedAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (!pathRef.current) return;
    const path = pathRef.current;
    const totalLen = totalLengthRef.current;
    const distances = nodeDistancesRef.current;

    // Réinitialisation des classes
    for (let i = 1; i <= TRACKING_STEPS.length; i++) {
      const circleEl = document.getElementById(`track-circle-${i}`);
      const metaEl = document.getElementById(`track-meta-${i}`);
      if (circleEl) circleEl.classList.remove("active");
      if (metaEl) metaEl.classList.remove("active");
    }

    // Le premier cercle est actif dès le départ
    const c1 = document.getElementById("track-circle-1");
    const m1 = document.getElementById("track-meta-1");
    if (c1) c1.classList.add("active");
    if (m1) m1.classList.add("active");
    setActiveStepIdx(0);

    const duration = 10500; // 10.5 secondes
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentDrawnLength = easedProgress * totalLen;
      path.style.strokeDashoffset = `${totalLen - currentDrawnLength}`;

      // Synchronisation mathématique instantanée
      for (let i = 1; i < distances.length; i++) {
        const targetDist = distances[i];
        const circleEl = document.getElementById(`track-circle-${i + 1}`);
        const metaEl = document.getElementById(`track-meta-${i + 1}`);

        if (currentDrawnLength >= targetDist - 2) {
          if (circleEl && !circleEl.classList.contains("active")) {
            circleEl.classList.add("active");
            setActiveStepIdx(i);
          }
          if (metaEl && !metaEl.classList.contains("active")) {
            metaEl.classList.add("active");
          }
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    updateAdaptiveScale();
    buildCamberedSnakePath();

    const timer = setTimeout(() => {
      updateAdaptiveScale();
      buildCamberedSnakePath();
      runSynchronizedAnimation();
    }, 100);

    const handleResize = () => {
      updateAdaptiveScale();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const activeStep = TRACKING_STEPS[activeStepIdx] || TRACKING_STEPS[0];

  return (
    <div
      style={{
        backgroundColor: "transparent",
        color: "var(--c-text-main)",
        minHeight: "calc(100vh - 110px)",
        padding: "24px 16px 110px 16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", width: "100%" }}>
        <ScrollReveal>
          {/* En-tête officiel épuré */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div className="client-eyebrow" style={{ justifyContent: "center", marginBottom: "12px" }}>
              <span style={{ color: "var(--c-accent-red)" }}>●</span>
              <span>TRAÇABILITÉ EN DIRECT & BORDEREAU</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--c-font-display)",
                fontSize: "clamp(1.4rem, 4.4vw, 2.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: "var(--c-text-main)",
                margin: "0 0 10px 0",
              }}
            >
              Suivre mon Colis en Temps Réel
            </h1>

            <p style={{ fontSize: "1.02rem", color: "var(--c-text-muted)", margin: 0, lineHeight: 1.55 }}>
              Entrez le numéro inscrit sur votre bordereau pour visualiser sa progression officielle.
            </p>
          </div>

          {/* Module de recherche épuré en PILULE (ZÉRO BORDURE, ZÉRO CADRAN) */}
          <div
            style={{
              maxWidth: "520px",
              margin: "0 auto 32px auto",
              backgroundColor: "var(--c-surface)",
              borderRadius: "9999px",
              boxShadow: "0 6px 24px -2px rgba(27, 20, 17, 0.08)",
              padding: "5px 6px 5px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxSizing: "border-box",
            }}
          >
            <Search size={16} color="var(--c-text-light)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => {
                setTrackingInput(e.target.value);
                if (trackingError) setTrackingError("");
              }}
              placeholder="Numéro de bordereau (Ex : RM-AIR-2610-K8P9Q2)"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.86rem",
                fontFamily: "var(--c-font-mono)",
                backgroundColor: "transparent",
                color: "var(--c-text-main)",
                minWidth: 0,
              }}
            />
            <button
              type="button"
              onClick={handleTrackingSubmit}
              style={{
                backgroundColor: "var(--c-text-main)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "9999px",
                padding: "8px 20px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "opacity 0.15s ease",
              }}
            >
              Vérifier
            </button>
          </div>

          {trackingError && (
            <div style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 600, textAlign: "center", margin: "-18px 0 20px 0" }}>
              {trackingError}
            </div>
          )}

          {/* En-tête de section sans cadran */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "0 8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--c-text-light)", fontFamily: "var(--c-font-mono)" }}>
              Parcours en 9 étapes synchronisées
            </span>

            <button
              type="button"
              onClick={() => {
                buildCamberedSnakePath();
                runSynchronizedAnimation();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 600,
                color: "var(--c-accent-red)",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={12} color="var(--c-accent-red)" />
              <span>Rejouer l&apos;animation</span>
            </button>
          </div>

          {/* ========================================================
              LE SERPENT DÉZOOMÉ ADAPTATIF POUR TOUS LES ÉCRANS
              - Même design continu qu'ordinateur
              - Dézoomé proportionnellement pour s'adapter à 100% de la largeur mobile
              - Zéro scroll horizontal forcé
             ======================================================== */}
          <div
            ref={outerBoxRef}
            className="snake-outer-scaling-box"
            style={{
              position: "relative",
              width: "100%",
              height: `${Math.round(280 * scale + 15)}px`,
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
              margin: "0 auto",
            }}
          >
            <div
              className="snake-inner-board"
              style={{
                position: "relative",
                width: "1080px",
                height: "280px",
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                flexShrink: 0,
              }}
            >
              {/* Ligne SVG Cambrée */}
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                <defs>
                  <linearGradient id="hSnakeGradOfficial" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#140D09" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#C2410C" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path
                  ref={pathRef}
                  fill="none"
                  stroke="url(#hSnakeGradOfficial)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              {/* Les 9 Étapes disposées en ondulation cambrée */}
              <div
                style={{
                  position: "relative",
                  zIndex: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: "100%",
                  width: "100%",
                  padding: "0 20px",
                  boxSizing: "border-box",
                }}
              >
                {TRACKING_STEPS.map((item, idx) => {
                  const stepNum = idx + 1;
                  return (
                    <div
                      key={item.step}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        width: "114px",
                        marginTop: item.isHigh ? "-65px" : "55px",
                        flexShrink: 0,
                      }}
                    >
                      {/* Si l'étape est cambrée vers le haut, le texte est au-dessus du cercle */}
                      {item.isHigh && (
                        <div id={`track-meta-${stepNum}`} className="step-meta-node" style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--c-text-main)", whiteSpace: "nowrap" }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--c-text-muted)", marginTop: "2px", whiteSpace: "nowrap" }}>
                            {item.desc}
                          </div>
                        </div>
                      )}

                      {/* Le cercle du chiffre (SEUL ÉLÉMENT GÉOMÉTRIQUE, ZÉRO CADRAN) */}
                      <div
                        id={`track-circle-${stepNum}`}
                        className={`step-circle-node ${item.isFinal ? "is-final" : ""}`}
                      >
                        {item.step}
                        <div className="pulse-ripple" />
                      </div>

                      {/* Si l'étape est cambrée vers le bas, le texte est en-dessous du cercle */}
                      {!item.isHigh && (
                        <div id={`track-meta-${stepNum}`} className="step-meta-node" style={{ marginTop: "12px" }}>
                          <div
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: item.isFinal ? "var(--c-accent-green)" : "var(--c-text-main)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: item.isFinal ? "var(--c-accent-green)" : "var(--c-text-muted)",
                              marginTop: "2px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.desc}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fiche d'étape active au bas du serpent pour une lisibilité parfaite sur mobile */}
          <div
            style={{
              maxWidth: "520px",
              margin: "12px auto 0 auto",
              padding: "12px 18px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 4px 16px -2px rgba(27, 20, 17, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: activeStep.isFinal ? "var(--c-accent-green)" : "var(--c-text-main)",
                  color: "#FFFFFF",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {activeStep.step}
              </div>
              <div>
                <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--c-text-main)" }}>
                  {activeStep.label}
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--c-text-muted)" }}>
                  {activeStep.desc}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "var(--c-badge-green-text)",
                backgroundColor: "var(--c-badge-green-bg)",
                padding: "3px 10px",
                borderRadius: "9999px",
                whiteSpace: "nowrap",
              }}
            >
              Douane 100% comprise
            </span>
          </div>

          {/* Lien d'assistance sobre */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <a
              href="https://wa.me/2250153638569?text=Bonjour%20Roum%20Transit,%20je%20souhaite%20une%20assistance%20sur%20mon%20suivi%20de%20colis."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.84rem",
                color: "var(--c-text-muted)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <MessageCircle size={15} color="var(--c-accent-green)" />
              <span>Besoin d&apos;aide sur votre expédition ? Assistance directe en agence</span>
            </a>
          </div>
        </ScrollReveal>
      </div>

      <style jsx>{`
        :global(.step-circle-node) {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: var(--c-btn-primary-bg);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: -0.02em;
          position: relative;
          z-index: 10;
          opacity: 0.22;
          transform: scale(0.72);
          transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, background-color 0.3s ease;
          box-shadow: 0 4px 12px rgba(20, 13, 9, 0.15);
        }

        :global(.step-circle-node.active) {
          opacity: 1 !important;
          transform: scale(1.1) !important;
          box-shadow: 0 8px 24px -2px rgba(20, 13, 9, 0.35) !important;
        }

        :global(.step-circle-node.is-final.active) {
          background-color: var(--c-accent-green) !important;
          box-shadow: 0 8px 24px -2px rgba(22, 163, 74, 0.45) !important;
        }

        :global(.pulse-ripple) {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid var(--c-accent-green);
          opacity: 0;
          transform: scale(0.8);
          pointer-events: none;
        }

        :global(.step-circle-node.active .pulse-ripple) {
          animation: rippleEffect 0.8s ease-out forwards;
        }

        @keyframes rippleEffect {
          0% {
            opacity: 0.9;
            transform: scale(0.85);
          }
          100% {
            opacity: 0;
            transform: scale(1.6);
          }
        }

        :global(.step-meta-node) {
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        :global(.step-meta-node.active) {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}
