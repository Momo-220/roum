import React from "react";

// Style minimaliste monochrome commun (Sober Luxury)
const iconFrameStyle = (size: number, round = false): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: round ? "50%" : Math.round(size * 0.28),
  background: "#FAF8F5",
  border: "1px solid rgba(28, 25, 23, 0.14)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--brown-dark, #1C1917)",
  flexShrink: 0,
  transition: "all 0.16s ease",
});

// 1. WAVE (Logo Officiel : Pingouin Bleu Authentique)
export function WaveLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(29, 161, 242, 0.25)",
        background: "#1DA1F2",
      }}
    >
      <img
        src="/images/payments/wave.png"
        alt="Wave Penguin"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}

// 2. ORANGE MONEY (Logo Officiel SVG Téléchargé)
export function OrangeMoneyLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: "#000000",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 6px rgba(255, 102, 0, 0.2)",
      }}
    >
      <img
        src="/images/payments/orange-money.svg"
        alt="Orange Money"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
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

// 5. BANQUE ATLANTIQUE / BACI / IBAN (Visuel Réaliste Banque Édifice)
export function BankBaciLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: "#FAF8F5",
        border: "1px solid rgba(28, 25, 23, 0.14)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        padding: "3px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
      }}
    >
      <img
        src="/images/payments/bank-iban.png"
        alt="IBAN / Banque"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

export function IbanLogo({ size = 32 }: { size?: number }) {
  return <BankBaciLogo size={size} />;
}

// 6. ALIPAY (Logo Officiel : Bleu Cyan & Caractère '支' Blanc Authentique)
export function AlipayLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: "#00A1E9",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0, 161, 233, 0.25)",
      }}
    >
      <svg
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="0 0 24 24"
        fill="#FFFFFF"
      >
        <path d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809"/>
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

// 9. WHATSAPP OFFICIEL (Véritable logo officiel WhatsApp Green Wikimedia PNG haute fidélité)
export function WhatsAppLogo({ size = 30 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        filter: "drop-shadow(0 2px 5px rgba(37, 211, 102, 0.28))",
        transition: "transform 0.16s ease",
      }}
    >
      <img
        src="/images/whatsapp.png"
        alt="WhatsApp"
        width={size}
        height={size}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

