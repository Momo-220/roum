"use client";

import { useState, useEffect, useRef } from "react";

interface SplashScreenProps {
  onComplete?: () => void;
}

const CANDIDATE_SOURCES = [
  { src: "/videos/splash.mp4", type: "video" as const },
  { src: "/videos/splash-screen.mp4", type: "video" as const },
  { src: "/videos/splash.mov", type: "video" as const },
  { src: "/videos/splash-screen.mov", type: "video" as const },
  { src: "/videos/splash-transparent.gif", type: "gif" as const },
  { src: "/videos/splash.gif", type: "gif" as const },
];

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const current = CANDIDATE_SOURCES[sourceIndex];
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 450); // Fondu soyeux et progressif
  };

  // 1. Minuteur maître absolu : au bout de 4.8 secondes max, la splash screen se termine obligatoirement
  useEffect(() => {
    const masterTimer = setTimeout(() => {
      handleFinish();
    }, 4800);

    return () => clearTimeout(masterTimer);
  }, []);

  // 2. Ralentissement maîtrisé de la vidéo (0.78x) pour une animation cinématographique
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.78;
    }
  };

  // 3. Détection de la fin de la vidéo
  const handleVideoEnded = () => {
    setTimeout(() => {
      handleFinish();
    }, 1200);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration && v.currentTime >= v.duration - 0.15) {
      handleVideoEnded();
    }
  };

  const handleError = () => {
    if (sourceIndex + 1 < CANDIDATE_SOURCES.length) {
      setSourceIndex(sourceIndex + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <div
      onClick={handleFinish}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "var(--bg-app, #FAF8F5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s ease",
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? "scale(1.02)" : "scale(1)",
        pointerEvents: isFadingOut ? "none" : "auto",
        overflow: "hidden",
        border: "none",
        outline: "none",
        cursor: "pointer",
      }}
    >
      {/* Filtre SVG d'incrustation haute précision : supprime 100% du noir et des artefacts de bordure */}
      <svg
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
        aria-hidden="true"
      >
        <defs>
          <filter id="roum-remove-black" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      3.2 3.2 3.2 0 -0.42"
            />
          </filter>
        </defs>
      </svg>

      {/* Halo de lumière doux aux tons terracotta Roum Transit */}
      <div
        style={{
          position: "absolute",
          width: "440px",
          height: "440px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234, 172, 161, 0.3) 0%, rgba(250, 248, 245, 0) 70%)",
          filter: "blur(45px)",
          pointerEvents: "none",
          animation: "splashPulse 3.2s infinite ease-in-out",
        }}
      />

      {current.type === "video" ? (
        <video
          ref={videoRef}
          src={current.src}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            position: "absolute",
            inset: 0,
            border: "none",
            outline: "none",
            filter: "url(#roum-remove-black)",
            // Dégradé radial progressif qui dissout totalement tout bord rectangulaire
            WebkitMaskImage: "radial-gradient(ellipse 68% 68% at 50% 50%, #000000 45%, transparent 86%)",
            maskImage: "radial-gradient(ellipse 68% 68% at 50% 50%, #000000 45%, transparent 86%)",
          }}
        />
      ) : (
        <img
          src={current.src}
          alt="Roum Transit Splash"
          onError={handleError}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
            border: "none",
            outline: "none",
            filter: "url(#roum-remove-black)",
            WebkitMaskImage: "radial-gradient(ellipse 68% 68% at 50% 50%, #000000 45%, transparent 86%)",
            maskImage: "radial-gradient(ellipse 68% 68% at 50% 50%, #000000 45%, transparent 86%)",
          }}
        />
      )}

      <style jsx>{`
        @keyframes splashPulse {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
