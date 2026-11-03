"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/2250153638569?text=Bonjour%20ROUM%20TRANSIT%2C%20je%20souhaite%20des%20informations."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Roum Transit sur WhatsApp"
      className="whatsapp-floating-btn"
    >
      <MessageCircle size={25} />
      <style jsx>{`
        .whatsapp-floating-btn {
          position: fixed;
          bottom: max(74px, calc(env(safe-area-inset-bottom, 14px) + 60px));
          right: 18px;
          z-index: 900;
          width: 46px;
          height: 46px;
          border-radius: 9999px;
          background-color: #25D366;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .whatsapp-floating-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
        }

        @media (max-width: 480px) {
          .whatsapp-floating-btn {
            width: 44px;
            height: 44px;
            right: 14px;
          }
        }
      `}</style>
    </a>
  );
}
