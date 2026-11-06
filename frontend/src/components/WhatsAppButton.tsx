import { WHATSAPP_BUBBLE_PATH, WHATSAPP_PHONE_PATH, WHATSAPP_LOGO_SIZE } from "@/shared/whatsapp-logo";

/** Le logo WhatsApp officiel, net à toute taille. */
export function WhatsAppGlyph({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${WHATSAPP_LOGO_SIZE.width} ${WHATSAPP_LOGO_SIZE.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={WHATSAPP_BUBBLE_PATH} fill="#25D366" />
      <path d={WHATSAPP_PHONE_PATH} fill="#FFFFFF" />
    </svg>
  );
}

interface WhatsAppButtonProps {
  href: string;
  label?: string;
  /** Occupe toute la largeur disponible. */
  block?: boolean;
  title?: string;
}

/** Bouton pilule au logo WhatsApp, utilisé partout où l'on écrit à l'agence ou au client. */
export function WhatsAppButton({ href, label = "WhatsApp", block = false, title }: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={block ? "wa-pill wa-pill-block" : "wa-pill"}
      title={title ?? label}
    >
      <WhatsAppGlyph />
      <span>{label}</span>
    </a>
  );
}
