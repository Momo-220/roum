"use client";

import { getSupportPhoneDigits } from "@/shared";
import { WhatsAppGlyph } from "@/components/WhatsAppButton";
import { usePublicCatalog } from "@/shared/usePublicCatalog";

export function WhatsAppFloatingButton({
  message = "Bonjour ROUM TRANSIT, je souhaite des informations.",
  label = "Contacter Roum Transit sur WhatsApp",
}: { message?: string; label?: string } = {}) {
  const { settings } = usePublicCatalog();

  return (
    <a
      href={`https://wa.me/${getSupportPhoneDigits(settings)}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
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
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .whatsapp-icon-svg {
          width: 54px;
          height: 54px;
          display: block;
        }

        .whatsapp-floating-btn:hover {
          transform: scale(1.1);
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
