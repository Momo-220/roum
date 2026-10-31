"use client";

import React, { useState } from "react";
import { getCountryCodeFromName } from "@/data/countries";

interface CircularFlagProps {
  countryCode?: string;
  countryName?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Composant officiel CircularFlag utilisant le pack vectoriel Circle Flags
 * Source officielle : https://allsvgicons.com/pack/circle-flags/ (HatScripts Circle Flags)
 * Tous les drapeaux du monde au format SVG circulaire 1:1 haute fidélité
 */
export const CircularFlag: React.FC<CircularFlagProps> = ({
  countryCode,
  countryName,
  size = 20,
  className = "",
  style = {},
  title,
}) => {
  const [hasError, setHasError] = useState(false);

  // Normalisation du code ISO 2 lettres
  let rawCode = (countryCode || (countryName ? getCountryCodeFromName(countryName) : "ci")).trim().toLowerCase();

  // Mappings et alias fréquents
  if (rawCode === "uk") rawCode = "gb";
  if (rawCode === "uae") rawCode = "ae";
  if (rawCode === "rdc") rawCode = "cd";

  const code = rawCode.length === 2 ? rawCode : "ci";
  const flagTitle = title || countryName || code.toUpperCase();

  return (
    <span
      className={`circular-flag-badge ${className}`}
      title={flagTitle}
      aria-label={flagTitle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        verticalAlign: "middle",
        flexShrink: 0,
        backgroundColor: "#F3F4F6",
        position: "relative",
        ...style,
      }}
    >
      {!hasError ? (
        <img
          src={`/flags/${code}.svg`}
          alt={flagTitle}
          width={size}
          height={size}
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            borderRadius: "50%",
          }}
          loading="lazy"
        />
      ) : (
        <span
          style={{
            fontSize: `${Math.max(7, Math.round(size * 0.42))}px`,
            fontWeight: 800,
            color: "#4B5563",
            letterSpacing: "-0.02em",
            userSelect: "none",
          }}
        >
          {code.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
};

export default CircularFlag;
