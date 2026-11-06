"use client";

import { getSupportPhoneDigits } from "@/shared";
import { WhatsAppGlyph } from "@/components/WhatsAppButton";
import { usePublicCatalog } from "@/shared/usePublicCatalog";

export function WhatsAppFloatingButton() {
  const { settings } = usePublicCatalog();

  return (
    <a
      href={`https://wa.me/${getSupportPhoneDigits(settings)}?text=Bonjour%20ROUM%20TRANSIT%2C%20je%20souhaite%20des%20informations.`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Roum Transit sur WhatsApp"
      className="whatsapp-floating-btn"
      title="Discuter sur WhatsApp"
    >
      <WhatsAppGlyph size={54} className="whatsapp-icon-svg" />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .whatsapp-floating-btn {
          position: fixed;
          bottom: max(72px, calc(env(safe-area-inset-bottom, 14px) + 58px));
          right: 18px;
          z-index: 900;
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          outline: none;
          text-decoration: none;
          filter: drop-shadow(0 6px 16px rgba(37, 211, 102, 0.45));
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
        }

        .whatsapp-icon-svg {
          width: 54px;
          height: 54px;
          display: block;
        }

        .whatsapp-floating-btn:hover {
          transform: scale(1.1);
          filter: drop-shadow(0 8px 22px rgba(37, 211, 102, 0.6));
        }

        @media (max-width: 480px) {
          .whatsapp-floating-btn {
            width: 48px;
            height: 48px;
            right: 14px;
            bottom: max(68px, calc(env(safe-area-inset-bottom, 12px) + 54px));
          }
          .whatsapp-icon-svg {
            width: 48px;
            height: 48px;
          }
        }
      `,
        }}
      />
    </a>
  );
}
