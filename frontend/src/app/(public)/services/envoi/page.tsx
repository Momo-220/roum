"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Copy, Download, Plane, Printer, Ship } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";
import { GaugeControl } from "@/components/GaugeControl";
import { ScrollReveal } from "@/components/ScrollReveal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getAdminDestinations, getSupportPhoneDigits, saveClientRequest } from "@/shared";
import { newUuid } from "@/shared/api";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { siteText } from "@/shared/siteContent";
import { getPaymentPageUrl } from "@/shared/whatsapp";
import {
  buildClientReceiptWhatsAppUrl,
  downloadOfficialReceiptPdf,
  printOfficialReceipt,
  type RoumReceiptData,
} from "@/utils/receiptPdf";

const ORIGINS = [
  { name: "Chine", label: "Chine", flag: "cn", match: ["chine"] },
  { name: "Émirats Arabes Unis (Dubaï)", label: "Dubaï", flag: "ae", match: ["duba", "mirat"] },
  { name: "Maroc", label: "Maroc", flag: "ma", match: ["maroc"] },
  { name: "France", label: "France", flag: "fr", match: ["france"] },
  { name: "Côte d'Ivoire", label: "Côte d'Ivoire", flag: "ci", match: ["ivoire"] },
];

const MODE_NAMES = { AIR: "Voie Aérienne (Avion)", SEA: "Voie Maritime (Bateau)" };

type Mode = keyof typeof MODE_NAMES;

interface SentRequest {
  reference: string;
  dossierUrl: string;
  whatsappUrl: string;
  receipt: RoumReceiptData;
}

function positiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function SendParcelForm() {
  const searchParams = useSearchParams();
  const { tariffs, settings } = usePublicCatalog();

  const startOrigin = ORIGINS.find((hub) => hub.name === searchParams.get("depart"))?.name ?? "Chine";

  const [origin, setOrigin] = useState(startOrigin);
  const [destination, setDestination] = useState(searchParams.get("arrivee") || "");
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "SEA" ? "SEA" : "AIR");
  const [weight, setWeight] = useState(positiveNumber(searchParams.get("poids"), 10));
  const [volume, setVolume] = useState(positiveNumber(searchParams.get("volume"), 0.5));
  const [parcels, setParcels] = useState(1);
  const [contents, setContents] = useState("");
  const [pickup, setPickup] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<SentRequest | null>(null);
  const [copied, setCopied] = useState(false);

  // Un double appui ou une coupure réseau ne crée jamais deux dossiers.
  const idempotencyKey = useRef(newUuid());

  const destinations = getAdminDestinations(tariffs, origin);
  const originKeys = ORIGINS.find((hub) => hub.name === origin)?.match ?? [];
  const seaAvailable = tariffs.some(
    (tariff) =>
      tariff.shipping_mode_type === "SEA" &&
      originKeys.some((key) => (tariff.origin_country || "").toLowerCase().includes(key)),
  );

  useEffect(() => {
    if (destinations.length > 0 && !destinations.includes(destination)) setDestination(destinations[0]!);
  }, [destinations, destination]);

  useEffect(() => {
    if (tariffs.length > 0 && !seaAvailable) setMode("AIR");
  }, [tariffs.length, seaAvailable]);

  const quantityLabel = `${mode === "SEA" ? `${volume} m³` : `${weight} kg`} · ${parcels} colis`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!contents.trim()) {
      setError("Dites-nous ce que contient votre colis.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Indiquez votre nom.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      setError("Indiquez un numéro WhatsApp complet.");
      return;
    }

    setSubmitting(true);
    try {
      const shippingName = MODE_NAMES[mode];
      const res = await saveClientRequest(
        {
          service_type: "GENERAL",
          option_type: "FORWARDING",
          client_name: name.trim(),
          client_phone: phone.trim(),
          origin_country: origin,
          destination_country: destination,
          shipping_mode_name: shippingName,
          shipping_mode_type: mode,
          estimated_weight_kg: mode === "AIR" ? weight : undefined,
          estimated_cbm: mode === "SEA" ? volume : undefined,
          product_name: contents.trim(),
          product_quantity: String(parcels),
          product_specs: [`${parcels} colis`, pickup.trim() && `Enlèvement : ${pickup.trim()}`].filter(Boolean).join(" | "),
          cargo_type: `${contents.trim()} (${quantityLabel})${pickup.trim() ? ` | Enlèvement : ${pickup.trim()}` : ""}`,
        },
        idempotencyKey.current,
      );
      idempotencyKey.current = newUuid();

      const receipt: RoumReceiptData = {
        reference: res.reference,
        date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
        clientName: name.trim(),
        clientPhone: phone.trim(),
        origin,
        destination,
        optionType: "envoi_colis",
        transportMode: shippingName,
        weightOrVolume: quantityLabel,
        productTitle: contents.trim(),
        quantity: parcels,
        paymentStatusLabel: "Devis en préparation",
        paymentMethodLabel: "Wave · Orange Money · Virement, après réception du devis",
        supportPhone: settings.whatsapp_official_number,
      };

      setSent({
        reference: res.reference,
        dossierUrl: getPaymentPageUrl({ reference: res.reference, accessKey: res.accessKey }),
        whatsappUrl: buildClientReceiptWhatsAppUrl(receipt, getSupportPhoneDigits(settings)),
        receipt,
      });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Votre demande n'a pas été envoyée. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <section className="ev-done">
        <span className="ev-done-mark">
          <Check size={26} strokeWidth={3} />
        </span>
        <h1>Demande bien reçue</h1>
        <p>Nous vérifions le poids de votre colis et vous envoyons votre devis sur WhatsApp.</p>

        <button
          type="button"
          className="ev-reference"
          onClick={() => {
            navigator.clipboard?.writeText(sent.reference);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <span>{sent.reference}</span>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>

        <div className="ev-done-actions">
          <WhatsAppButton href={sent.whatsappUrl} label="Prévenir l'agence" />
          <a href={sent.dossierUrl} className="ev-pill ev-pill-accent">
            <span>Voir mon dossier</span>
            <ArrowRight size={16} />
          </a>
          <button type="button" className="ev-pill" onClick={() => downloadOfficialReceiptPdf(sent.receipt)}>
            <Download size={16} />
            <span>Mon reçu</span>
          </button>
          <button type="button" className="ev-pill" onClick={() => printOfficialReceipt(sent.receipt)}>
            <Printer size={16} />
            <span>Imprimer</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <header className="ev-head">
        <Link href="/tariffs" className="ev-back">
          <ArrowLeft size={16} />
          <span>Tarifs</span>
        </Link>
        <h1>{siteText(settings, "envoi_title")}</h1>
        <p>{siteText(settings, "envoi_text")}</p>
      </header>

      <section className="ev-block">
        <h2>Le trajet</h2>
        <span className="ev-label">Départ</span>
        <div className="ev-choices">
          {ORIGINS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              className={origin === hub.name ? "ev-choice active" : "ev-choice"}
              aria-pressed={origin === hub.name}
              onClick={() => setOrigin(hub.name)}
            >
              <CircularFlag code={hub.flag} size={18} />
              <span>{hub.label}</span>
            </button>
          ))}
        </div>

        <label className="ev-field">
          <span className="ev-label">Arrivée</span>
          <select value={destination} onChange={(event) => setDestination(event.target.value)}>
            {destinations.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </label>

        {seaAvailable && (
          <>
            <span className="ev-label">Transport</span>
            <div className="ev-choices">
              <button
                type="button"
                className={mode === "AIR" ? "ev-choice active" : "ev-choice"}
                aria-pressed={mode === "AIR"}
                onClick={() => setMode("AIR")}
              >
                <Plane size={17} />
                <span>Avion</span>
              </button>
              <button
                type="button"
                className={mode === "SEA" ? "ev-choice active" : "ev-choice"}
                aria-pressed={mode === "SEA"}
                onClick={() => setMode("SEA")}
              >
                <Ship size={17} />
                <span>Bateau</span>
              </button>
            </div>
          </>
        )}
      </section>

      <section className="ev-block">
        <h2>Votre colis</h2>
        {mode === "SEA" ? (
          <GaugeControl
            label="Volume"
            value={volume}
            min={0.1}
            max={10}
            step={0.1}
            unit="m³"
            ticks={[1, 3, 5, 10]}
            onChange={setVolume}
          />
        ) : (
          <GaugeControl
            label="Poids pesé"
            value={weight}
            min={1}
            max={200}
            step={1}
            unit="kg"
            ticks={[1, 50, 100, 200]}
            onChange={setWeight}
          />
        )}

        <GaugeControl
          label="Nombre de colis"
          value={parcels}
          min={1}
          max={20}
          step={1}
          unit="colis"
          ticks={[1, 5, 10, 20]}
          onChange={setParcels}
        />

        <label className="ev-field">
          <span className="ev-label">Que contient-il ?</span>
          <input
            type="text"
            value={contents}
            maxLength={200}
            placeholder="Vêtements, chaussures, documents..."
            onChange={(event) => setContents(event.target.value)}
          />
        </label>

        <label className="ev-field">
          <span className="ev-label">Où récupérer le colis ? (facultatif)</span>
          <input
            type="text"
            value={pickup}
            maxLength={200}
            placeholder="Ville, quartier ou dépôt"
            onChange={(event) => setPickup(event.target.value)}
          />
        </label>
      </section>

      <section className="ev-block">
        <h2>Vos coordonnées</h2>
        <label className="ev-field">
          <span className="ev-label">Votre nom</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            maxLength={120}
            placeholder="Nom et prénom"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="ev-field">
          <span className="ev-label">Votre numéro WhatsApp</span>
          <input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            maxLength={40}
            placeholder="+223 70 00 00 00"
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
      </section>

      {error && (
        <p className="ev-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="ev-submit" disabled={submitting}>
        {submitting ? "Envoi en cours..." : "Recevoir mon devis"}
      </button>
    </form>
  );
}

export default function SendParcelPage() {
  return (
    <div className="ev-root">
      <div className="ev-container">
        <ScrollReveal>
          <Suspense fallback={null}>
            <SendParcelForm />
          </Suspense>
        </ScrollReveal>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ev-root {
          min-height: calc(100vh - 110px);
          padding: 30px 20px 130px;
          box-sizing: border-box;
          color: var(--c-text-main);
        }

        .ev-container {
          max-width: 620px;
          margin: 0 auto;
        }

        .ev-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 40px;
          margin: 0 0 14px -12px;
          padding: 0 14px 0 10px;
          border-radius: 9999px;
          color: var(--c-accent);
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
        }

        .ev-back:hover {
          background: #EFE6D9;
        }

        .ev-head h1,
        .ev-done h1 {
          margin: 0 0 10px;
          color: var(--c-text-main);
          font-family: var(--c-font-display);
          font-size: clamp(2.1rem, 6vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
        }

        .ev-head p,
        .ev-done p {
          margin: 0;
          color: var(--c-text-muted);
          font-size: 1.05rem;
          line-height: 1.55;
        }

        .ev-block {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 30px;
          padding-top: 28px;
          border-top: 1px solid #EADFD3;
        }

        .ev-block h2 {
          margin: 0;
          color: var(--c-accent);
          font-family: var(--c-font-display);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .ev-label {
          color: #3A2A21;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .ev-block > .ev-label {
          margin-bottom: -8px;
        }

        .ev-choices {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ev-choice {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 46px;
          padding: 0 18px 0 13px;
          border: 1px solid #DCCDB6;
          border-radius: 9999px;
          background: transparent;
          color: var(--c-text-muted);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          touch-action: manipulation;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }

        .ev-choice:hover {
          background: #F3EBDF;
        }

        .ev-choice.active {
          border-color: #EADDCB;
          background: #EADDCB;
          color: #3A2A21;
          font-weight: 700;
        }

        .ev-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ev-field input,
        .ev-field select {
          width: 100%;
          min-height: 52px;
          padding: 0 20px;
          border: 1px solid #DCCDB6;
          border-radius: 9999px;
          background: #FFFFFF;
          color: #3A2A21;
          font-family: inherit;
          font-size: 16px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .ev-field input:focus,
        .ev-field select:focus {
          border-color: var(--c-accent);
          box-shadow: 0 0 0 3px rgba(107, 88, 68, 0.14);
        }

        .ev-field input::placeholder {
          color: #A99A90;
        }

        .ev-error {
          margin: 24px 0 0;
          padding: 12px 18px;
          border-radius: 20px;
          background: #FBEAEA;
          color: #A12B2B;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .ev-submit {
          width: 100%;
          min-height: 56px;
          margin-top: 26px;
          border: 1px solid #DCCDB6;
          border-radius: 9999px;
          background: #FFFBF4;
          box-shadow: 0 14px 26px -16px rgba(58, 42, 33, 0.5);
          color: #3A2A21;
          font-family: inherit;
          font-size: 1.03rem;
          font-weight: 800;
          cursor: pointer;
          touch-action: manipulation;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .ev-submit:hover {
          background: #F3EBDF;
        }

        .ev-submit:active {
          transform: scale(0.98);
        }

        .ev-submit:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .ev-done {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 24px;
          text-align: center;
        }

        .ev-done-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 62px;
          height: 62px;
          margin-bottom: 20px;
          border-radius: 50%;
          background: #EADDCB;
          color: #3A2A21;
        }

        .ev-reference {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 46px;
          margin-top: 20px;
          padding: 0 20px;
          border: 0;
          border-radius: 9999px;
          background: #F3EBDF;
          color: #3A2A21;
          font-family: var(--c-font-mono);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        }

        .ev-done-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 26px;
        }

        .ev-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
          padding: 0 20px;
          border: 0;
          border-radius: 9999px;
          background: #EFE6D9;
          color: #3A2A21;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .ev-pill:hover {
          background: #E6D9C6;
        }

        .ev-pill-accent {
          border: 1px solid #DCCDB6;
          background: #FFFBF4;
          color: #3A2A21;
        }

        .ev-pill-accent:hover {
          background: #F3EBDF;
        }
      `,
        }}
      />
    </div>
  );
}
