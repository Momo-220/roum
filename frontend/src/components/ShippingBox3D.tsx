"use client";

import { useId } from "react";
import { code128Modules } from "@/utils/shippingLabelPdf";

interface ShippingBox3DProps {
  code: string;
  className?: string;
}

/** Carton d'expédition en 3D, avec l'étiquette ROUM TRANSIT collée dessus. */
export function ShippingBox3D({ code, className }: ShippingBox3DProps) {
  const id = useId().replace(/:/g, "");

  const barX = 58;
  const barWidth = 224;
  const modules = code128Modules(code);
  const moduleWidth = barWidth / modules.reduce((total, width) => total + width, 0);

  let cursor = barX;
  const bars = modules.flatMap((width, index) => {
    const x = cursor;
    cursor += width * moduleWidth;
    return index % 2 === 0 ? [{ x, width: width * moduleWidth }] : [];
  });

  return (
    <svg viewBox="0 0 470 392" className={className} role="img" aria-label={`Carton ROUM TRANSIT, numéro ${code}`}>
      <defs>
        <linearGradient id={`${id}-front`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#C99D66" />
          <stop offset="1" stopColor="#DDB988" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#E2BE8E" />
          <stop offset="1" stopColor="#F0D9B5" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B98B58" />
          <stop offset="1" stopColor="#A0744A" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#6B4A2E" stopOpacity="0.3" />
          <stop offset="1" stopColor="#6B4A2E" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="228" cy="366" rx="226" ry="22" fill={`url(#${id}-shadow)`} />

      <polygon points="20,100 340,100 420,30 100,30" fill={`url(#${id}-top)`} />
      <polygon points="340,100 420,30 420,288 340,358" fill={`url(#${id}-side)`} />
      <rect x="20" y="100" width="320" height="258" fill={`url(#${id}-front)`} />

      {/* Le rabat droit reçoit moins de lumière. */}
      <polygon points="210,100 340,100 420,30 290,30" fill="#6B4A2E" opacity="0.08" />

      {/* Nom imprimé sur le rabat gauche, dans la perspective du dessus. */}
      <text
        transform="matrix(1 0 -0.6 0.52 46 90)"
        fontSize="15"
        fontWeight="800"
        letterSpacing="1.4"
        fill="#C9A06C"
        fontFamily="var(--c-font-sans)"
      >
        ROUM TRANSIT
      </text>

      {/* Épaisseur du carton sur les arêtes. */}
      <line x1="20" y1="100" x2="340" y2="100" stroke="#F6E6CC" strokeWidth="1.6" />
      <line x1="20" y1="102.4" x2="340" y2="102.4" stroke="#A97F4F" strokeWidth="0.6" />
      <line x1="340" y1="100" x2="420" y2="30" stroke="#F6E6CC" strokeWidth="1" />
      <line x1="340" y1="100" x2="340" y2="358" stroke="#F6E6CC" strokeWidth="1.1" />
      <line x1="342" y1="101" x2="342" y2="357" stroke="#A97F4F" strokeWidth="0.6" />

      {/* Ruban adhésif qui ferme le carton et retombe sur la face avant. */}
      <polygon points="150,100 210,100 290,30 230,30" fill="#C9A06C" />
      <polygon points="158,100 168,100 248,30 238,30" fill="#FFFFFF" opacity="0.3" />
      <rect x="150" y="100" width="60" height="16" fill="#BC9160" />
      <rect x="158" y="100" width="10" height="16" fill="#FFFFFF" opacity="0.3" />
      <rect x="150" y="116" width="60" height="2" fill="#6B4A2E" opacity="0.14" />

      {/* Côté : poignée découpée et consignes imprimées, dans la perspective de la face. */}
      <g transform="matrix(0.62 -0.54 0 1 358 318)" fill="#6F4E2B" fontWeight="800" fontFamily="var(--c-font-sans)">
        <rect x="-6" y="-186" width="64" height="15" rx="7.5" />
        <rect x="-6" y="-186" width="64" height="7" rx="3.5" fill="#000000" opacity="0.28" />
        <g stroke="#6F4E2B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M8 -20V-40M2 -33L8 -41L14 -33" />
          <path d="M28 -20V-40M22 -33L28 -41L34 -33" />
        </g>
        <text x="0" y="0" fontSize="15" letterSpacing="1.4">
          FRAGILE
        </text>
      </g>

      <rect x="40" y="120" width="280" height="222" rx="10" fill="#6B4A2E" opacity="0.16" transform="translate(2 3)" />
      <rect x="40" y="120" width="280" height="222" rx="10" fill="#FFFFFF" />


      <image href="/images/roum-logo-transparent.png" x="54" y="130" width="66" height="40" />
      <text x="304" y="148" textAnchor="end" fontSize="9.5" fontWeight="800" fill="#3A2A21" fontFamily="var(--c-font-sans)">
        ROUM TRANSIT
      </text>
      <text x="304" y="161" textAnchor="end" fontSize="8" fill="#857667" fontFamily="var(--c-font-sans)">
        Aérien · Maritime
      </text>
      <line x1="58" y1="178" x2="302" y2="178" stroke="#E8DECF" />

      <text x="58" y="195" fontSize="7.5" fontWeight="700" letterSpacing="0.8" fill="#857667" fontFamily="var(--c-font-sans)">
        NUMÉRO DE SUIVI
      </text>
      <text
        x="58"
        y="216"
        textLength="244"
        lengthAdjust="spacingAndGlyphs"
        fontSize="19"
        fontWeight="800"
        fill="#3A2A21"
        fontFamily="var(--c-font-mono)"
      >
        {code}
      </text>

      <g fill="#3A2A21">
        {bars.map((bar, index) => (
          <rect key={index} x={bar.x + 10} y="228" width={bar.width} height="46" />
        ))}
      </g>

      <rect x="52" y="288" width="256" height="40" rx="9" fill="#E4EDED" />
      <text x="64" y="304" fontSize="7" fontWeight="700" letterSpacing="0.7" fill="#1E4D5B" fontFamily="var(--c-font-sans)">
        DOUANE INCLUSE
      </text>
      <text x="64" y="319" fontSize="11" fontWeight="800" fill="#1E4D5B" fontFamily="var(--c-font-sans)">
        Livré jusqu&apos;à destination
      </text>
    </svg>
  );
}
