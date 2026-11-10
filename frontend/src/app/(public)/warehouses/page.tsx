"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getCustomHubs, getSupportPhoneDigits } from "@/shared";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { usePublicCatalog } from "@/shared/usePublicCatalog";

export default function WarehousesPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { settings } = usePublicCatalog();

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const withContact = (address?: string, contact?: string) => {
    if (!address?.trim()) return "";
    return contact?.trim() ? `${address} — ${contact}` : address;
  };

  // Adresses et marquages viennent de la base : l'administration les modifie sans toucher au site.
  const warehouses = [
    {
      id: "cn",
      country: "Chine",
      city: "Guangzhou",
      countryCode: "CN",
      description: "Pour vos commandes sur 1688, Taobao ou auprès d'usines en Chine.",
      shippingMark: settings.warehouse_china_shipping_mark || "ROUM TRANSIT / [Votre Nom]",
      addressToCopy: withContact(settings.warehouse_china_address, settings.warehouse_china_contact),
    },
    {
      id: "ae",
      country: "Émirats",
      city: "Dubaï",
      countryCode: "AE",
      description: "Pour vos achats de parfumerie, cosmétiques, téléphones et électronique à Deira.",
      shippingMark: "ROUM TRANSIT DUBAI / [Votre Nom]",
      addressToCopy: withContact(settings.warehouse_dubai_address, settings.warehouse_dubai_contact),
    },
    {
      id: "ma",
      country: "Maroc",
      city: "Casablanca",
      countryCode: "MA",
      description: "Pour vos marchandises au Maroc, avec un départ express.",
      shippingMark: "ROUM TRANSIT MAROC / [Votre Nom]",
      addressToCopy: withContact(settings.hub_casablanca_address),
    },
    {
      id: "fr",
      country: "France",
      city: "Paris",
      countryCode: "FR",
      description: "Pour vos colis personnels, produits de beauté et plis administratifs.",
      shippingMark: "ROUM TRANSIT PARIS / [Votre Nom]",
      addressToCopy: withContact(settings.agency_paris_address, settings.agency_paris_contact),
    },
    ...getCustomHubs(settings).map((hub) => ({
      id: String(hub.id),
      country: String(hub.country || ""),
      city: String(hub.city || ""),
      countryCode: String(hub.countryCode || "").toUpperCase(),
      description: String(hub.name || "Entrepôt ROUM TRANSIT"),
      shippingMark: String(hub.shipping_mark || "ROUM TRANSIT / [Votre Nom]"),
      addressToCopy: withContact(String(hub.address || ""), hub.contact ? String(hub.contact) : undefined),
    })),
    // Un dépôt n'apparaît qu'une fois son adresse saisie par la direction.
  ].filter((wh) => wh.addressToCopy);

  const copyButton = (key: string, text: string, label: string, ghost = false) => {
    const copied = copiedKey === key;
    return (
      <button
        type="button"
        onClick={() => handleCopy(key, text)}
        className={`dp-pill ${ghost ? "dp-pill-ghost" : ""} ${copied ? "copied" : ""}`}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        <span>{copied ? "Copié" : label}</span>
      </button>
    );
  };

  return (
    <div className="dp-root">
      <div className="dp-container">
        <ScrollReveal>
          <header className="dp-head">
            <h1>Nos dépôts</h1>
            <p>
              Copiez l&apos;adresse du pays où vous achetez et donnez-la à votre fournisseur, avec le marquage à
              inscrire sur le carton.
            </p>
          </header>

          {warehouses.length === 0 && (
            <div className="dp-empty">
              <p>Écrivez-nous sur WhatsApp : nous vous donnons l&apos;adresse du dépôt qui correspond à votre achat.</p>
              <WhatsAppButton
                href={`https://wa.me/${getSupportPhoneDigits(settings)}?text=${encodeURIComponent(
                  "Bonjour ROUM TRANSIT, je souhaite l'adresse de votre dépôt."
                )}`}
                label="Demander l'adresse"
              />
            </div>
          )}

          <ul className="dp-list">
            {warehouses.map((wh) => (
              <li key={wh.id} className="dp-row">
                <div className="dp-place">
                  <CircularFlag countryCode={wh.countryCode} size={34} />
                  <div>
                    <h2>{wh.city}</h2>
                    <span>{wh.country}</span>
                  </div>
                </div>

                <div className="dp-info">
                  <p className="dp-address">{wh.addressToCopy}</p>
                  <p className="dp-description">{wh.description}</p>
                  <p className="dp-mark">
                    <span>Marquage</span>
                    <code>{wh.shippingMark}</code>
                  </p>
                </div>

                <div className="dp-actions">
                  {copyButton(`${wh.id}-address`, wh.addressToCopy, "Copier l'adresse")}
                  {copyButton(`${wh.id}-mark`, wh.shippingMark, "Copier le marquage", true)}
                </div>
              </li>
            ))}
          </ul>

          <p className="dp-tip">
            Demandez à votre expéditeur d&apos;inscrire votre nom et votre numéro de téléphone sur le carton : nous
            vous attribuons ainsi le colis dès son entrée au dépôt.
          </p>
        </ScrollReveal>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .dp-root {
          min-height: calc(100vh - 110px);
          padding: 34px 20px 120px;
          box-sizing: border-box;
          color: var(--c-text-main);
        }

        .dp-container {
          max-width: 1040px;
          margin: 0 auto;
        }

        .dp-head {
          max-width: 620px;
          margin-bottom: 40px;
        }

        .dp-head h1 {
          margin: 0 0 10px;
          color: var(--c-text-main);
          font-family: var(--c-font-display);
          font-size: clamp(2.1rem, 5vw, 3.2rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
        }

        .dp-head p {
          margin: 0;
          color: var(--c-text-muted);
          font-size: 1.05rem;
          line-height: 1.55;
        }

        .dp-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .dp-row {
          display: grid;
          grid-template-columns: 190px minmax(0, 1fr) auto;
          align-items: start;
          gap: 16px 36px;
          padding: 30px 0;
          border-top: 1px solid #EADFD3;
        }

        .dp-row:last-child {
          border-bottom: 1px solid #EADFD3;
        }

        .dp-place {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .dp-place h2 {
          margin: 0;
          color: var(--c-text-main);
          font-family: var(--c-font-display);
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .dp-place span {
          color: var(--c-text-light);
          font-size: 0.9rem;
        }

        .dp-info {
          min-width: 0;
        }

        .dp-address {
          margin: 0 0 6px;
          color: var(--c-text-main);
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .dp-description {
          margin: 0 0 12px;
          color: var(--c-text-muted);
          font-size: 0.93rem;
          line-height: 1.5;
        }

        .dp-mark {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 2px 10px;
          margin: 0;
        }

        .dp-mark span {
          color: var(--c-accent);
          font-size: 0.87rem;
          font-weight: 700;
        }

        .dp-mark code {
          color: var(--c-text-main);
          font-family: var(--c-font-mono);
          font-size: 0.9rem;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .dp-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dp-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 20px;
          border: 1px solid transparent;
          border-radius: 9999px;
          background: #EADDCB;
          color: #3A2A21;
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          touch-action: manipulation;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }

        .dp-pill:hover {
          background: #E0D1BB;
        }

        .dp-pill-ghost {
          border-color: #DCCDB6;
          background: transparent;
        }

        .dp-pill-ghost:hover {
          background: #F3EBDF;
        }

        .dp-pill.copied,
        .dp-pill.copied:hover {
          border-color: transparent;
          background: #E6F4EA;
          color: #1E7A43;
        }

        .dp-empty {
          display: grid;
          justify-items: start;
          gap: 14px;
          padding: 24px 0;
          border-top: 1px solid #EADFD3;
        }

        .dp-empty p {
          margin: 0;
          color: #524B43;
          font-size: 1rem;
          line-height: 1.5;
        }

        .dp-tip {
          max-width: 620px;
          margin: 30px 0 0;
          color: var(--c-text-muted);
          font-size: 0.95rem;
          line-height: 1.55;
        }

        @media (max-width: 860px) {
          .dp-row {
            grid-template-columns: minmax(0, 1fr);
            padding: 26px 0;
          }

          .dp-actions {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .dp-pill {
            flex: 1 1 150px;
          }
        }
      `,
        }}
      />
    </div>
  );
}
