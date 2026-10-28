import React from "react";

// 1. WAVE (Logo Officiel : Pingouin Wave sur fond Cyan)
export function WaveLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#1DC3F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(29, 195, 245, 0.35)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100" fill="none">
        {/* Corps Pingouin Wave */}
        <ellipse cx="50" cy="56" rx="26" ry="32" fill="#182230" />
        {/* Ventre blanc arrondi */}
        <ellipse cx="50" cy="62" rx="17" ry="22" fill="#FFFFFF" />
        {/* Aile gauche */}
        <path d="M24 50 C20 60 22 72 26 76 C28 72 28 60 27 52 Z" fill="#182230" />
        {/* Aile droite */}
        <path d="M76 50 C80 60 78 72 74 76 C72 72 72 60 73 52 Z" fill="#182230" />
        {/* Tête */}
        <circle cx="50" cy="34" r="19" fill="#182230" />
        {/* Yeux */}
        <ellipse cx="44" cy="32" rx="4" ry="5" fill="#FFFFFF" />
        <circle cx="43.5" cy="32" r="2.2" fill="#182230" />
        <ellipse cx="56" cy="32" rx="4" ry="5" fill="#FFFFFF" />
        <circle cx="56.5" cy="32" r="2.2" fill="#182230" />
        {/* Bec jaune-orange */}
        <path d="M46 38 L54 38 L50 46 Z" fill="#FBBF24" />
        {/* Pattes */}
        <ellipse cx="42" cy="88" rx="7" ry="3.5" fill="#FBBF24" />
        <ellipse cx="58" cy="88" rx="7" ry="3.5" fill="#FBBF24" />
      </svg>
    </div>
  );
}

// 2. ORANGE MONEY (Logo Officiel : Carré Orange vibrant avec monogramme OM)
export function OrangeMoneyLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#FF7900",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(255, 121, 0, 0.35)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100" fill="none">
        {/* Cercle OM */}
        <circle cx="50" cy="50" r="34" stroke="#FFFFFF" strokeWidth="8" fill="none" />
        {/* Point central Orange */}
        <circle cx="50" cy="50" r="14" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

// 3. MTN MOMO (Logo Officiel : Fond Jaune MTN avec ovale MoMo)
export function MtnMomoLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#FFCC00",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(255, 204, 0, 0.35)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 100 100" fill="none">
        {/* Ovale MoMo bleu nuit */}
        <rect x="8" y="24" width="84" height="52" rx="26" fill="#002B49" />
        {/* Texte MoMo stylisé */}
        <text
          x="50"
          y="58"
          fill="#FFCC00"
          fontSize="24"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
          letterSpacing="-0.5px"
        >
          MoMo
        </text>
      </svg>
    </div>
  );
}

// 4. MOOV MONEY (Logo Officiel : Bleu MoMo avec arche orange)
export function MoovMoneyLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#005BA6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0, 91, 166, 0.35)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 100 100" fill="none">
        {/* Arche orange dynamique */}
        <path d="M18 68 C28 32 72 32 82 68" stroke="#FF6E00" strokeWidth="8" strokeLinecap="round" />
        <circle cx="50" cy="38" r="8" fill="#FFFFFF" />
        <text
          x="50"
          y="80"
          fill="#FFFFFF"
          fontSize="15"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
        >
          moov
        </text>
      </svg>
    </div>
  );
}

// 5. BANQUE ATLANTIQUE / BACI / UEMOA (Logo Institutionnel Bancaire)
export function BankBaciLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#FFFFFF",
        border: "1px solid var(--border-light)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100" fill="none">
        {/* Fronton temple bancaire */}
        <path d="M14 36 L50 16 L86 36 Z" fill="#D32F2F" />
        {/* Colonnes */}
        <rect x="22" y="42" width="10" height="30" rx="2" fill="#0A2540" />
        <rect x="45" y="42" width="10" height="30" rx="2" fill="#0A2540" />
        <rect x="68" y="42" width="10" height="30" rx="2" fill="#0A2540" />
        {/* Socle */}
        <rect x="14" y="76" width="72" height="8" rx="2" fill="#D32F2F" />
      </svg>
    </div>
  );
}

// 6. ALIPAY (Logo Officiel : Fond Bleu Alipay avec le caractère '支')
export function AlipayLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#1677FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(22, 119, 255, 0.35)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 100 100" fill="none">
        {/* Caractère '支' Alipay */}
        <path
          d="M26 26 L74 26 M50 16 L50 26 M32 40 L68 40 M20 54 C36 54 46 66 54 84 M38 52 C44 60 50 68 56 74 M66 42 L34 84"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// 7. WECHAT PAY (Logo Officiel : Fond Vert Émeraude avec bulles de dialogue)
export function WeChatPayLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#07C160",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(7, 193, 96, 0.35)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100" fill="none">
        {/* Grande bulle */}
        <ellipse cx="42" cy="46" rx="28" ry="24" fill="#FFFFFF" />
        <circle cx="34" cy="42" r="3.5" fill="#07C160" />
        <circle cx="50" cy="42" r="3.5" fill="#07C160" />
        {/* Petite bulle */}
        <ellipse cx="68" cy="62" rx="22" ry="18" fill="#FFFFFF" />
        <circle cx="62" cy="58" r="2.8" fill="#07C160" />
        <circle cx="74" cy="58" r="2.8" fill="#07C160" />
      </svg>
    </div>
  );
}

// 8. REÇU DE CAISSE / BORDEREAU OFFICIEL
export function ReceiptSealLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#FAF7F5",
        border: "1px solid var(--border-light)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="var(--brown-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    </div>
  );
}

// 9. WHATSAPP (Logo Officiel : Cercle vert WhatsApp avec combiné blanc)
export function WhatsAppLogo({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#25D366",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(37, 211, 102, 0.35)",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.2.301-.778.978-.954 1.179-.176.2-.351.226-.652.075s-1.272-.469-2.423-1.496c-.896-.799-1.501-1.787-1.677-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.101-.2.05-.376-.025-.527-.075-.15-.678-1.635-.929-2.24-.244-.589-.493-.509-.678-.519l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.23 3.111c.15.201 2.123 3.242 5.143 4.547.718.311 1.279.497 1.716.636.722.23 1.378.197 1.898.12.579-.088 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.201-.577-.351zM12.04 2C6.524 2 2.042 6.48 2.042 12c0 1.983.58 3.834 1.583 5.397L2 22l4.747-1.551A9.92 9.92 0 0 0 12.04 22c5.516 0 10-4.48 10-10s-4.484-10-10-10z" />
      </svg>
    </div>
  );
}
