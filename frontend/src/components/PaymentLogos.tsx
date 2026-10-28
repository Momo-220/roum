import React from "react";

// Style minimaliste monochrome commun (Sober Luxury)
const iconFrameStyle = (size: number, round = false): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: round ? "50%" : Math.round(size * 0.28),
  background: "#FAF8F5",
  border: "1px solid rgba(42, 24, 16, 0.14)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--brown-dark, #2A1810)",
  flexShrink: 0,
  transition: "all 0.16s ease",
});

// 1. WAVE (SVG Monochrome Sobre)
export function WaveLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12c2.5-4 5.5-4 8 0s5.5 4 8 0 3.5-2 4-1" />
        <path d="M2 17c2.5-4 5.5-4 8 0s5.5 4 8 0 3.5-2 4-1" opacity="0.55" />
        <circle cx="12" cy="6" r="2" />
      </svg>
    </div>
  );
}

// 2. ORANGE MONEY (SVG Monochrome Sobre : Double flèche transfert mobile)
export function OrangeMoneyLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="2" width="14" height="20" rx="2.5" />
        <path d="M9 9h6l-2-2" />
        <path d="M15 13H9l2 2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    </div>
  );
}

// 3. MTN MOMO (SVG Monochrome Sobre)
export function MtnMomoLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="12" rx="10" ry="6" />
        <path d="M8 14V10l2.5 2.5L13 10v4" />
        <circle cx="16.5" cy="12" r="1.5" />
      </svg>
    </div>
  );
}

// 4. MOOV MONEY (SVG Monochrome Sobre)
export function MoovMoneyLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 16c2.5-6 13.5-6 16 0" />
        <circle cx="12" cy="8" r="2.5" />
        <path d="M8 19h8" />
      </svg>
    </div>
  );
}

// 5. BANQUE ATLANTIQUE / BACI / UEMOA (SVG Institutionnel Monochrome)
export function BankBaciLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 2 7 22 7 12 2" />
        <line x1="6" y1="11" x2="6" y2="17" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
        <line x1="18" y1="11" x2="18" y2="17" />
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    </div>
  );
}

// 6. ALIPAY (SVG Monochrome Sobre : Caractère '支' épuré)
export function AlipayLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 6h14M12 3v7M6 10h12M16 10c-1.5 5-5 8.5-10 10M8 12c2.5 3.5 6 6.5 11 8" />
      </svg>
    </div>
  );
}

// 7. WECHAT PAY (SVG Monochrome Sobre)
export function WeChatPayLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.2c.93.26 1.94.4 3 .4.34 0 .67-.02 1-.05" />
        <path d="M15.5 10c3.59 0 6.5 2.24 6.5 5 0 1.54-.9 2.92-2.32 3.84L20.5 21l-2.16-1.04c-.88.24-1.84.38-2.84.38-3.59 0-6.5-2.24-6.5-5s2.91-5 6.5-5z" />
      </svg>
    </div>
  );
}

// 8. REÇU DE CAISSE / BORDEREAU OFFICIEL (SVG Monochrome Sobre)
export function ReceiptSealLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    </div>
  );
}

// 9. WHATSAPP (SVG Monochrome Sobre : Icône vectorielle épurée sans fond vert criard)
export function WhatsAppLogo({ size = 28 }: { size?: number }) {
  return (
    <div style={iconFrameStyle(size, true)}>
      <svg
        width={Math.round(size * 0.54)}
        height={Math.round(size * 0.54)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <path d="M9.5 9.5c.3 1.8 1.7 3.2 3.5 3.5l1.2-1.2c.2-.2.5-.2.7-.1.7.3 1.4.5 2.1.6.3 0 .5.3.5.6v1.8c0 .3-.2.6-.6.6C11.6 15.3 8.7 12.4 8.7 7.1c0-.4.3-.6.6-.6h1.8c.3 0 .6.2.6.5.1.7.3 1.4.6 2.1.1.2.1.5-.1.7l-1.2 1.2z" />
      </svg>
    </div>
  );
}

