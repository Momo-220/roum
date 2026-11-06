"use client";

import React, { useState } from "react";

// ============================================================================
// LOGOS OFFICIELS DES MOYENS DE PAIEMENT (AVEC SUPPORT FICHIERS LOCAUX TÉLÉVERSÉS)
// Priorité 1 : Fichiers images déposés par l'utilisateur dans /images/payments/
//   - wave.png
//   - orange.png
//   - maroc.png
// Priorité 2 (Fallback) : Rendus vectoriels officiels SVG haute fidélité
// ============================================================================

/**
 * 1. WAVE (Logo : /images/payments/wave.png ou Pingouin Authentique sur disque Bleu Cyan #1DC3EC)
 */
export function WaveLogo({ size = 36 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "#1DC3EC",
        }}
        title="Wave Mobile Money"
      >
        <img
          src="/images/payments/wave.jpeg"
          alt="Wave"
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

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
 * 2. ORANGE MONEY (Logo : /images/payments/orange.png ou Carré Orange #FF7900 + Cercle OM Blanc/Noir)
 */
export function OrangeMoneyLogo({ size = 36 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);
  const r = Math.round(size * 0.28);

  if (!imgError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: r,
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "#FF7900",
        }}
        title="Orange Money"
      >
        <img
          src="/images/payments/Orange%20money.png"
          alt="Orange Money"
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

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
        <circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="8" />
        <rect x="36" y="36" width="28" height="28" rx="4" fill="#000000" />
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
 * 3. COMPTE MAROC / ATTIJARIWAFA / CIH / BANQUE
 * (/images/payments/maroc.png ou Badge Institutionnel Or & Marine)
 */
export function CompteMarocLogo({ size = 36 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);
  const r = Math.round(size * 0.28);

  if (!imgError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: r,
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "#FFFFFF",
          border: "1px solid rgba(28, 24, 21, 0.12)",
        }}
        title="Compte Bancaire Maroc"
      >
        <img
          src="/images/payments/bank-transfer.png"
          alt="Maroc Bank"
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

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

// Compatibilité legacy (Alipay et WeChat Pay retirés sur demande utilisateur)
export function AlipayLogo({ size = 36 }: { size?: number }) {
  return null;
}

export function WeChatPayLogo({ size = 36 }: { size?: number }) {
  return null;
}

export function MtnMomoLogo({ size = 36 }: { size?: number }) {
  return null;
}

export function MoovMoneyLogo({ size = 36 }: { size?: number }) {
  return null;
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
 * Déclencheur intelligent pour smartphones (Wave & Orange Money)
 * Sur smartphone : copie le numéro dans le presse-papier et lance l'application ou l'USSD direct.
 * Sur ordinateur : copie le numéro et affiche un message informatif.
 */
export function openPaymentApp(methodKey: string, phoneNumber?: string): { success: boolean; appOpened: boolean; link: string } {
  if (typeof window === "undefined") return { success: false, appOpened: false, link: "" };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  const key = (methodKey || "").toLowerCase();
  const rawNumber = (phoneNumber || "").replace(/[^0-9]/g, "");

  // 1. Toujours copier immédiatement le numéro ou code dans le presse-papier
  if (phoneNumber && navigator.clipboard?.writeText) {
    try {
      navigator.clipboard.writeText(phoneNumber);
    } catch {
      // ignore
    }
  }

  // 2. Sur ordinateur de bureau
  if (!isMobile) {
    alert(
      "L'ouverture directe de l'application est conçue pour votre smartphone (Wave / Orange Money).\n\nLe numéro (" +
        (phoneNumber || "") +
        ") a été automatiquement copié dans votre presse-papier."
    );
    return { success: true, appOpened: false, link: "" };
  }

  // 3. Sur smartphone physique
  if (key.includes("wave")) {
    // Schéma d'application Wave (iOS et Android)
    window.location.href = "wave://";
    // Fallback automatique vers Wave web / Play Store / App Store si l'application n'est pas installée
    setTimeout(() => {
      window.location.href = `https://wave.com/send?phone=${rawNumber}`;
    }, 1200);
    return { success: true, appOpened: true, link: "wave://" };
  }

  if (key.includes("orange")) {
    // USSD direct Orange Money Côte d'Ivoire / Afrique
    // IMPORTANT: Le caractère '#' DOIT être encodé en %23 dans une URL tel:
    const ussdCode = phoneNumber && phoneNumber.includes("#") ? phoneNumber : "*144#";
    const encodedUssd = `tel:${encodeURIComponent(ussdCode)}`;
    window.location.href = encodedUssd;
    return { success: true, appOpened: true, link: encodedUssd };
  }

  return { success: false, appOpened: false, link: "" };
}
