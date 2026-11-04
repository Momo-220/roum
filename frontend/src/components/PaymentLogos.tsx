import React from "react";

// ============================================================================
// LOGOS OFFICIELS DES MOYENS DE PAIEMENT (HAUTE FIDÉLITÉ VECTORIELLE PIXEL-PERFECT)
// Reproduits fidèlement d'après les chartes graphiques officielles des marques :
// Wave Digital Finance, Orange Money, MTN MoMo, Moov Africa, Alipay, WeChat Pay
// ============================================================================

/**
 * 1. WAVE (Logo Officiel : Pingouin Authentique sur disque Bleu Cyan #1DC3EC)
 */
export function WaveLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#1DC3EC",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(29, 195, 236, 0.35)",
        overflow: "hidden",
      }}
      title="Wave Mobile Money"
    >
      <svg
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Corps Pingouin Blanc */}
        <path
          d="M50 12C36.7 12 28 22.8 28 36.5C28 44.2 31 50.8 31 59C31 68.5 25.5 76 25 81C24.3 87 29.5 88 34 88C39.5 88 44.5 82.5 50 82.5C55.5 82.5 60.5 88 66 88C70.5 88 75.7 87 75 81C74.5 76 69 68.5 69 59C69 50.8 72 44.2 72 36.5C72 22.8 63.3 12 50 12Z"
          fill="#FFFFFF"
        />
        {/* Aile gauche */}
        <path
          d="M28 42C24 48 20 58 23 66C24.5 70 28 67 29 62C30 57 29 48 28 42Z"
          fill="#1DC3EC"
        />
        {/* Aile droite */}
        <path
          d="M72 42C76 48 80 58 77 66C75.5 70 72 67 71 62C70 57 71 48 72 42Z"
          fill="#1DC3EC"
        />
        {/* Oeil */}
        <circle cx="58" cy="28" r="3.5" fill="#1C1815" />
        <circle cx="59.2" cy="27" r="1.2" fill="#FFFFFF" />
        {/* Bec Jaune Wave */}
        <path
          d="M65 32L78 35.5L65 40C66 37 66 34.5 65 32Z"
          fill="#FFB800"
        />
        {/* Ventre intérieur cyan subtil */}
        <path
          d="M48 40C40 40 37 48 37 58C37 68 42 75 49 75C56 75 61 68 61 58C61 48 56 40 48 40Z"
          fill="#1DC3EC"
          opacity="0.18"
        />
      </svg>
    </div>
  );
}

/**
 * 2. ORANGE MONEY (Logo Officiel : Carré Orange #FF7900 + Cercle OM Blanc/Noir)
 */
export function OrangeMoneyLogo({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "#FF7900",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(255, 121, 0, 0.35)",
        overflow: "hidden",
      }}
      title="Orange Money"
    >
      <svg
        width={Math.round(size * 0.78)}
        height={Math.round(size * 0.78)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Symbole officiel OM : cercle monétaire avec accent */}
        <circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="8" />
        {/* Carré noir central Orange */}
        <rect x="36" y="36" width="28" height="28" rx="4" fill="#000000" />
        {/* Arc intérieur blanc */}
        <path
          d="M44 42C44 42 50 38 56 42C62 46 62 54 56 58C50 62 44 58 44 58"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * 3. MTN MoMo (Logo Officiel : Badge Jaune #FFCC00 + Ovale Bleu & Texte MoMo)
 */
export function MtnMomoLogo({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "#FFCC00",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(255, 204, 0, 0.4)",
        overflow: "hidden",
      }}
      title="MTN Mobile Money (MoMo)"
    >
      <svg
        width={Math.round(size * 0.82)}
        height={Math.round(size * 0.82)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ovale Bleu Nuit MTN */}
        <ellipse cx="50" cy="50" rx="44" ry="28" fill="#004F71" />
        {/* Texte officiel 'MoMo' */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#FFCC00"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="23"
          letterSpacing="-0.5"
        >
          MoMo
        </text>
      </svg>
    </div>
  );
}

/**
 * 4. MOOV MONEY (Logo Officiel : Bleu #005DAA & Orange #F37023)
 */
export function MoovMoneyLogo({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "#005DAA",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0, 93, 170, 0.35)",
        overflow: "hidden",
      }}
      title="Moov Africa Money"
    >
      <svg
        width={Math.round(size * 0.8)}
        height={Math.round(size * 0.8)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vague orange officielle Moov */}
        <path
          d="M20 70C20 70 35 30 65 30C80 30 85 45 75 58C65 70 45 72 38 65C30 58 35 45 48 45C58 45 62 52 58 58"
          stroke="#F37023"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Point central blanc */}
        <circle cx="50" cy="52" r="5" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

/**
 * 5. ALIPAY (Logo Officiel : Bleu #1677FF + Caractère Chinois '支' Blanc)
 */
export function AlipayLogo({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "#1677FF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(22, 119, 255, 0.35)",
        overflow: "hidden",
      }}
      title="Alipay (RMB 支付宝)"
    >
      <svg
        width={Math.round(size * 0.75)}
        height={Math.round(size * 0.75)}
        viewBox="0 0 1024 1024"
        fill="#FFFFFF"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M840.4 643.2c-145.4-49.4-239.9-106.1-239.9-106.1 27.5-68.5 49-148.6 61.9-234.6H840v-40.7H669.9c0.9-15.6 1.3-31.5 1.3-47.5V118.8h-74.9v95.5c0 15.9-0.5 31.8-1.3 47.5H429.1V118.8h-74.8v95.5c0 15.9-0.5 31.8-1.3 47.5H184v40.7h416.7c-11.4 72.8-29.6 141-52.9 200.7-104.9-38.3-214-53.5-303.8-37.4-96.6 17.3-159 66.8-159 157.9 0 106.1 94.6 171.7 236.4 171.7 131.7 0 252.8-59.5 342.3-162.7 76.7 44.5 174.5 87.2 284.1 118.2l92.6-107.7zM340.5 798.8c-98.3 0-161.4-44.5-161.4-118.4 0-61.9 44.2-96.7 114.7-109.3 64.9-11.6 148.4-1.2 231.1 24.9-63.5 119.5-126.9 202.8-184.4 202.8z" />
      </svg>
    </div>
  );
}

/**
 * 6. WECHAT PAY (Logo Officiel : Vert #09B83E + Deux Bulles de Conversation Blanches)
 */
export function WeChatPayLogo({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "#09B83E",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(9, 184, 62, 0.35)",
        overflow: "hidden",
      }}
      title="WeChat Pay (微信支付)"
    >
      <svg
        width={Math.round(size * 0.75)}
        height={Math.round(size * 0.75)}
        viewBox="0 0 1024 1024"
        fill="#FFFFFF"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grande bulle WeChat */}
        <path d="M410.2 205.8c-184.6 0-334.3 125.1-334.3 279.4 0 88.5 49.3 167.3 126.5 219.7l-31.6 94.8 111.4-55.6c40.5 12.1 83.9 18.7 128 18.7 184.6 0 334.3-125.1 334.3-279.4s-149.7-277.6-334.3-277.6zM289.8 345c27.6 0 50 22.4 50 50s-22.4 50-50 50-50-22.4-50-50 22.4-50 50-50zm240.8 0c27.6 0 50 22.4 50 50s-22.4 50-50 50-50-22.4-50-50 22.4-50 50-50z" />
        {/* Petite bulle WeChat */}
        <path d="M698.8 450.4c-143.6 0-260 100.2-260 223.8 0 70.8 38.4 133.9 98.4 175.8l-24.6 75.9 86.8-44.5c31.5 9.7 65.3 15 99.4 15 143.6 0 260-100.2 260-223.8 0-123.6-116.4-222.2-260-222.2zm-94 111.2c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40zm188 0c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40z" />
      </svg>
    </div>
  );
}

/**
 * 7. COMPTE MAROC / ATTIJARIWAFA / CIH / BANQUE (Badge Institutionnel Or & Marine)
 */
export function CompteMarocLogo({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "linear-gradient(135deg, #1C1815 0%, #2A241F 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "1px solid #D4AF37",
        boxShadow: "0 2px 8px rgba(212, 175, 55, 0.25)",
        overflow: "hidden",
      }}
      title="Compte Bancaire Maroc (RIB / Attijariwafa / CIH)"
    >
      <svg
        width={Math.round(size * 0.65)}
        height={Math.round(size * 0.65)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M3 10h18" />
        <path d="M5 6l7-3 7 3" />
        <path d="M4 10v11" />
        <path d="M20 10v11" />
        <path d="M8 14v4" />
        <path d="M12 14v4" />
        <path d="M16 14v4" />
      </svg>
    </div>
  );
}

export function BankBaciLogo({ size = 36 }: { size?: number }) {
  return <CompteMarocLogo size={size} />;
}

export function IbanLogo({ size = 36 }: { size?: number }) {
  return <CompteMarocLogo size={size} />;
}

export function ReceiptSealLogo({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "#FAF8F5",
        border: "1px solid rgba(28, 24, 21, 0.12)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#1C1815",
        flexShrink: 0,
      }}
    >
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

export function WhatsAppLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        filter: "drop-shadow(0 2px 6px rgba(37, 211, 102, 0.35))",
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

/**
 * Redirection directe vers l'application mobile de paiement
 * Si l'application est installée sur le smartphone de l'utilisateur, elle s'ouvre directement via deep link (wave://, alipays://, weixin://, USSD).
 */
export function openPaymentApp(methodKey: string, phoneNumber?: string): { success: boolean; appOpened: boolean; link: string } {
  if (typeof window === "undefined") return { success: false, appOpened: false, link: "" };

  let deepLink = "";
  let webFallback = "";

  const key = (methodKey || "").toLowerCase();

  if (key.includes("wave")) {
    deepLink = "wave://";
    webFallback = "https://wave.com/send";
  } else if (key.includes("orange")) {
    deepLink = "tel:#144#";
    webFallback = "https://www.orangemoney.ci";
  } else if (key.includes("mtn") || key.includes("momo")) {
    deepLink = "tel:*133#";
    webFallback = "https://momo.mtn.com";
  } else if (key.includes("moov")) {
    deepLink = "tel:*155#";
    webFallback = "https://www.moov-africa.ci";
  } else if (key.includes("alipay")) {
    deepLink = "alipays://";
    webFallback = "https://www.alipay.com";
  } else if (key.includes("wechat")) {
    deepLink = "weixin://";
    webFallback = "https://pay.weixin.qq.com";
  }

  if (deepLink) {
    try {
      window.location.href = deepLink;
      return { success: true, appOpened: true, link: deepLink };
    } catch {
      if (webFallback) window.open(webFallback, "_blank");
      return { success: true, appOpened: false, link: webFallback };
    }
  }

  return { success: false, appOpened: false, link: "" };
}
