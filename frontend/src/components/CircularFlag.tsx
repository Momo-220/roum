"use client";

import React from "react";
import { getCountryCodeFromName } from "@/data/countries";

interface CircularFlagProps {
  countryCode?: string;
  countryName?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const CircularFlag: React.FC<CircularFlagProps> = ({
  countryCode,
  countryName,
  size = 20,
  className = "",
  style = {},
  title,
}) => {
  const code = (countryCode || (countryName ? getCountryCodeFromName(countryName) : "CI")).toUpperCase();
  const flagTitle = title || countryName || code;

  // Rendu de drapeaux vectoriels SVG haute précision au format circulaire 1:1
  const renderFlagSvg = () => {
    switch (code) {
      // 1. CHINE (CN)
      case "CN":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#DE2910" />
            {/* Grande étoile */}
            <polygon
              fill="#FFDE00"
              points="6.5,3.2 7.7,6.8 11.5,6.8 8.4,9.1 9.6,12.7 6.5,10.4 3.4,12.7 4.6,9.1 1.5,6.8 5.3,6.8"
            />
            {/* 4 petites étoiles */}
            <polygon fill="#FFDE00" points="13,3 13.5,4.3 14.8,4.3 13.8,5.1 14.2,6.4 13,5.6 11.9,6.4 12.3,5.1 11.2,4.3 12.6,4.3" />
            <polygon fill="#FFDE00" points="15.5,6.5 16,7.8 17.3,7.8 16.3,8.6 16.7,9.9 15.5,9.1 14.4,9.9 14.8,8.6 13.7,7.8 15.1,7.8" />
            <polygon fill="#FFDE00" points="15.5,11.5 16,12.8 17.3,12.8 16.3,13.6 16.7,14.9 15.5,14.1 14.4,14.9 14.8,13.6 13.7,12.8 15.1,12.8" />
            <polygon fill="#FFDE00" points="13,15 13.5,16.3 14.8,16.3 13.8,17.1 14.2,18.4 13,17.6 11.9,18.4 12.3,17.1 11.2,16.3 12.6,16.3" />
          </svg>
        );

      // 2. ÉMIRATS ARABES UNIS / DUBAÏ (AE)
      case "AE":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="10.66" fill="#00732F" />
            <rect y="10.66" width="32" height="10.66" fill="#FFFFFF" />
            <rect y="21.32" width="32" height="10.68" fill="#000000" />
            <rect x="0" y="0" width="9.5" height="32" fill="#FF0000" />
          </svg>
        );

      // 3. MAROC (MA)
      case "MA":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#C1272D" />
            {/* Pentagramme vert officiel */}
            <polygon
              fill="none"
              stroke="#006233"
              strokeWidth="1.8"
              strokeLinejoin="miter"
              points="16,6.5 19,15.5 27,15.5 20.5,20.2 23,28 16,23 9,28 11.5,20.2 5,15.5 13,15.5"
            />
          </svg>
        );

      // 4. FRANCE (FR)
      case "FR":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#002654" />
            <rect x="10.66" width="10.66" height="32" fill="#FFFFFF" />
            <rect x="21.32" width="10.68" height="32" fill="#CE1126" />
          </svg>
        );

      // 5. CÔTE D'IVOIRE (CI)
      case "CI":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#F77F00" />
            <rect x="10.66" width="10.66" height="32" fill="#FFFFFF" />
            <rect x="21.32" width="10.68" height="32" fill="#009E49" />
          </svg>
        );

      // 6. SÉNÉGAL (SN)
      case "SN":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#00853F" />
            <rect x="10.66" width="10.66" height="32" fill="#FDEF42" />
            <rect x="21.32" width="10.68" height="32" fill="#E31B23" />
            {/* Étoile verte au centre */}
            <polygon
              fill="#00853F"
              points="16,10.5 17.5,14.5 21.8,14.5 18.3,17.1 19.6,21.2 16,18.6 12.4,21.2 13.7,17.1 10.2,14.5 14.5,14.5"
            />
          </svg>
        );

      // 7. MALI (ML)
      case "ML":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#14B53A" />
            <rect x="10.66" width="10.66" height="32" fill="#FCD116" />
            <rect x="21.32" width="10.68" height="32" fill="#CE1126" />
          </svg>
        );

      // 8. BURKINA FASO (BF)
      case "BF":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="16" fill="#EF2B2D" />
            <rect y="16" width="32" height="16" fill="#009E49" />
            {/* Étoile dorée au centre */}
            <polygon
              fill="#FCD116"
              points="16,10 17.6,14.5 22.3,14.5 18.5,17.2 19.9,21.7 16,18.9 12.1,21.7 13.5,17.2 9.7,14.5 14.4,14.5"
            />
          </svg>
        );

      // 9. GABON (GA)
      case "GA":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="10.66" fill="#009E49" />
            <rect y="10.66" width="32" height="10.66" fill="#FCD116" />
            <rect y="21.32" width="32" height="10.68" fill="#3A75C4" />
          </svg>
        );

      // 10. GUINÉE (GN)
      case "GN":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#CE1126" />
            <rect x="10.66" width="10.66" height="32" fill="#FCD116" />
            <rect x="21.32" width="10.68" height="32" fill="#009E49" />
          </svg>
        );

      // 11. TOGO (TG)
      case "TG":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="6.4" fill="#006A4E" />
            <rect y="6.4" width="32" height="6.4" fill="#FFCE00" />
            <rect y="12.8" width="32" height="6.4" fill="#006A4E" />
            <rect y="19.2" width="32" height="6.4" fill="#FFCE00" />
            <rect y="25.6" width="32" height="6.4" fill="#006A4E" />
            <rect x="0" y="0" width="14" height="14" fill="#D21034" />
            <polygon fill="#FFFFFF" points="7,2 8,5 11,5 8.5,7 9.5,10 7,8 4.5,10 5.5,7 3,5 6,5" />
          </svg>
        );

      // 12. BÉNIN (BJ)
      case "BJ":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="13" height="32" fill="#008751" />
            <rect x="13" y="0" width="19" height="16" fill="#FCD116" />
            <rect x="13" y="16" width="19" height="16" fill="#E8112D" />
          </svg>
        );

      // 13. CAMEROUN (CM)
      case "CM":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#007A5E" />
            <rect x="10.66" width="10.66" height="32" fill="#CE1126" />
            <rect x="21.32" width="10.68" height="32" fill="#FCD116" />
            <polygon fill="#FCD116" points="16,10 17.5,14.5 22,14.5 18.5,17 19.8,21.5 16,18.8 12.2,21.5 13.5,17 10,14.5 14.5,14.5" />
          </svg>
        );

      // 14. ÉTATS-UNIS (US)
      case "US":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#FFFFFF" />
            <line x1="0" y1="2.5" x2="32" y2="2.5" stroke="#B22234" strokeWidth="2.5" />
            <line x1="0" y1="7.5" x2="32" y2="7.5" stroke="#B22234" strokeWidth="2.5" />
            <line x1="0" y1="12.5" x2="32" y2="12.5" stroke="#B22234" strokeWidth="2.5" />
            <line x1="0" y1="17.5" x2="32" y2="17.5" stroke="#B22234" strokeWidth="2.5" />
            <line x1="0" y1="22.5" x2="32" y2="22.5" stroke="#B22234" strokeWidth="2.5" />
            <line x1="0" y1="27.5" x2="32" y2="27.5" stroke="#B22234" strokeWidth="2.5" />
            <rect x="0" y="0" width="15" height="16" fill="#3C3B6E" />
            <circle cx="4" cy="4" r="1.2" fill="#FFFFFF" />
            <circle cx="11" cy="4" r="1.2" fill="#FFFFFF" />
            <circle cx="7.5" cy="8" r="1.2" fill="#FFFFFF" />
            <circle cx="4" cy="12" r="1.2" fill="#FFFFFF" />
            <circle cx="11" cy="12" r="1.2" fill="#FFFFFF" />
          </svg>
        );

      // 15. TURQUIE (TR)
      case "TR":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#E30A17" />
            <circle cx="13" cy="16" r="7.5" fill="#FFFFFF" />
            <circle cx="15" cy="16" r="6" fill="#E30A17" />
            <polygon fill="#FFFFFF" points="19.5,13.5 20.4,15.2 22.3,15.2 20.8,16.3 21.3,18.1 19.8,17 18.3,18.1 18.8,16.3 17.3,15.2 19.2,15.2" />
          </svg>
        );

      // 16. ROYAUME-UNI (GB)
      case "GB":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#012169" />
            <path d="M0,0 L32,32 M32,0 L0,32" stroke="#FFFFFF" strokeWidth="5.5" />
            <path d="M0,0 L32,32 M32,0 L0,32" stroke="#C8102E" strokeWidth="2.5" />
            <path d="M16,0 L16,32 M0,16 L32,16" stroke="#FFFFFF" strokeWidth="8.5" />
            <path d="M16,0 L16,32 M0,16 L32,16" stroke="#C8102E" strokeWidth="5" />
          </svg>
        );

      // 17. ALLEMAGNE (DE)
      case "DE":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="10.66" fill="#000000" />
            <rect y="10.66" width="32" height="10.66" fill="#DD0000" />
            <rect y="21.32" width="32" height="10.68" fill="#FFCE00" />
          </svg>
        );

      // 18. ITALIE (IT)
      case "IT":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#009246" />
            <rect x="10.66" width="10.66" height="32" fill="#FFFFFF" />
            <rect x="21.32" width="10.68" height="32" fill="#CE2B37" />
          </svg>
        );

      // 19. ESPAGNE (ES)
      case "ES":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="8" fill="#AA151B" />
            <rect y="8" width="32" height="16" fill="#F1BF00" />
            <rect y="24" width="32" height="8" fill="#AA151B" />
            <circle cx="10" cy="16" r="3" fill="#AA151B" />
          </svg>
        );

      // 20. CANADA (CA)
      case "CA":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="8" height="32" fill="#FF0000" />
            <rect x="8" width="16" height="32" fill="#FFFFFF" />
            <rect x="24" width="8" height="32" fill="#FF0000" />
            <polygon fill="#FF0000" points="16,8 18,12 21,11 19,15 22,17 18,18 18,22 16,21 14,22 14,18 10,17 13,15 11,11 14,12" />
          </svg>
        );

      // 21. CONGO BRAZZAVILLE (CG)
      case "CG":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <polygon points="0,0 32,0 0,32" fill="#009543" />
            <polygon points="32,0 32,32 0,32" fill="#DC241F" />
            <polygon points="0,32 10,32 32,10 32,0 22,0 0,22" fill="#FBDE4A" />
          </svg>
        );

      // 22. RDC KINSHASA (CD)
      case "CD":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#007FFF" />
            <polygon points="0,32 6,32 32,6 32,0 26,0 0,26" fill="#FCD116" />
            <polygon points="0,30 3,32 32,3 32,0 29,0 0,29" fill="#CE1126" />
            <polygon fill="#FCD116" points="6,4 7,7 10,7 7.5,9 8.5,12 6,10 3.5,12 4.5,9 2,7 5,7" />
          </svg>
        );

      // 23. NIGER (NE)
      case "NE":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="10.66" fill="#E05206" />
            <rect y="10.66" width="32" height="10.66" fill="#FFFFFF" />
            <rect y="21.32" width="32" height="10.68" fill="#0DB02B" />
            <circle cx="16" cy="16" r="4" fill="#E05206" />
          </svg>
        );

      // 24. NIGERIA (NG)
      case "NG":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#008751" />
            <rect x="10.66" width="10.66" height="32" fill="#FFFFFF" />
            <rect x="21.32" width="10.68" height="32" fill="#008751" />
          </svg>
        );

      // 25. TCHAD (TD)
      case "TD":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="0" width="10.66" height="32" fill="#002664" />
            <rect x="10.66" width="10.66" height="32" fill="#FECB00" />
            <rect x="21.32" width="10.68" height="32" fill="#C60C30" />
          </svg>
        );

      // 26. INDE (IN)
      case "IN":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect y="0" width="32" height="10.66" fill="#FF9933" />
            <rect y="10.66" width="32" height="10.66" fill="#FFFFFF" />
            <rect y="21.32" width="32" height="10.68" fill="#138808" />
            <circle cx="16" cy="16" r="3.5" fill="none" stroke="#000080" strokeWidth="1" />
          </svg>
        );

      // 27. VIETNAM (VN)
      case "VN":
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#DA251D" />
            <polygon fill="#FFFF00" points="16,8 18.5,14 24.5,14 19.5,17.5 21.5,23.5 16,19.5 10.5,23.5 12.5,17.5 7.5,14 13.5,14" />
          </svg>
        );

      // DÉFAUT MONDIAL VECTORIEL ÉLÉGANT
      default:
        return (
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect width="32" height="32" fill="#2E7D4E" />
            <circle cx="16" cy="16" r="14" fill="#1B4D3E" />
            <path
              d="M16 4 A12 12 0 0 0 16 28 M16 4 A12 12 0 0 1 16 28 M4 16 L28 16 M6 10 L26 10 M6 22 L26 22"
              fill="none"
              stroke="#FAF8F5"
              strokeWidth="1.2"
              opacity="0.85"
            />
          </svg>
        );
    }
  };

  return (
    <span
      className={`circular-flag-badge ${className}`}
      title={flagTitle}
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
        border: "1px solid rgba(0, 0, 0, 0.12)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        verticalAlign: "middle",
        flexShrink: 0,
        background: "#FAF8F5",
        ...style,
      }}
    >
      {renderFlagSvg()}
    </span>
  );
};
