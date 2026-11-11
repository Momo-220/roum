"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Copy, ExternalLink, ImagePlus, ReceiptText, Truck } from "lucide-react";
import { apiRequest, ApiError } from "@/shared/api";
import { compressImage } from "@/shared/compressImage";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { getSupportPhoneDigits } from "@/shared";
import { siteText } from "@/shared/siteContent";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ShopOrderSteps } from "@/components/shop/ShopOrderSteps";
import { useShop } from "@/shared/useShop";
import { downloadShopTicket } from "@/utils/shopTicketPdf";
import {
  colorSwatch,
  customerOrderMessage,
  formatFcfa,
  isTransitTrackingNumber,
  saveOrder,
  shopImageUrl,
  variantLabel,
  whatsappLink,
  type ShopOrder,
} from "@/shared/shop";

interface PaymentAccount {
  id: string;
  label: string;
  number: string;
  holder: string;
  link?: string;
  logo: string;
}

/** Les comptes saisis par la gérante dans Paramètres : rien d'inventé, rien d'automatique. */
function paymentAccounts(settings: Record<string, string>): PaymentAccount[] {
  const accounts: PaymentAccount[] = [];
  const wave = settings.payment_wave_ci?.trim();
  if (wave) {
    const merchant = settings.payment_wave_merchant?.trim();
    accounts.push({
      id: "wave",
      label: "Wave",
      number: wave,
      holder: settings.payment_wave_name?.trim() || "",
      link: merchant ? (merchant.startsWith("http") ? merchant : `https://${merchant}`) : undefined,
      logo: "/images/payments/wave.jpeg",
    });
  }
  const orange = settings.payment_orange_money_ci?.trim();
  if (orange) {
    accounts.push({
      id: "orange",
      label: "Orange Money",
      number: orange,
      holder: settings.payment_orange_name?.trim() || "",
      logo: "/images/payments/Orange%20money.png",
    });
  }
  const rib = settings.payment_morocco_rib?.trim();
  if (rib) {
    accounts.push({
      id: "morocco",
      label: settings.payment_morocco_bank?.trim() || "Compte Maroc",
      number: rib,
      holder: settings.payment_morocco_holder?.trim() || "",
      logo: "/images/payments/bank-transfer.png",
    });
  }
  return accounts;
}

/**
 * Lien de paiement Wave de la boutique (pay.wave.com) : sur téléphone il ouvre l'application Wave,
 * avec le montant de la commande déjà rempli quand le lien l'accepte.
 */
function waveLink(link: string, amount: number): string {
  try {
    const url = new URL(link);
    if (/(^|\.)wave\.com$/i.test(url.hostname) && url.pathname.startsWith("/m/") && !url.searchParams.has("amount")) {
      url.searchParams.set("amount", String(Math.round(amount)));
    }
    return url.toString();
  } catch {
    return link;
  }
}

const MAX_PDF_BYTES = 1_300_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Fichier illisible."));
    reader.readAsDataURL(file);
  });
}

function OrderView() {
  const { reference } = useParams<{ reference: string }>();
  const key = useSearchParams().get("key") || "";
  const { settings } = usePublicCatalog();
  const { catalog } = useShop();
  const [ticketBusy, setTicketBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [method, setMethod] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const accounts = useMemo(() => paymentAccounts(settings), [settings]);
  const selected = accounts.find((a) => a.id === method) || accounts[0] || null;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<{ order: ShopOrder }>(
        `/api/v1/public/shop/orders/${encodeURIComponent(reference)}?key=${encodeURIComponent(key)}`
      );
      setOrder(data.order);
      setError(null);
      saveOrder({ reference: data.order.reference, key, totalFcfa: data.order.totalFcfa, createdAt: data.order.createdAt });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 404) setError(err.message);
    }
  }, [reference, key]);

  // La page suit la commande : la confirmation de la gérante apparaît sans recharger.
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 8000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!method && accounts[0]) setMethod(accounts[0].id);
  }, [accounts, method]);

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendProof = async () => {
    if (!order || !file) return;
    setSending(true);
    setSendError(null);
    try {
      let dataUrl: string;
      if (file.type === "application/pdf") {
        if (file.size > MAX_PDF_BYTES) throw new Error("PDF trop lourd : envoyez plutôt une capture d'écran.");
        dataUrl = await readAsDataUrl(file);
      } else if (file.type.startsWith("image/")) {
        dataUrl = await compressImage(file, 1600, 0.82);
      } else {
        throw new Error("Envoyez une capture d'écran ou un PDF.");
      }
      await apiRequest(`/api/v1/public/shop/orders/${encodeURIComponent(order.reference)}/proof`, {
        method: "POST",
        retries: 1,
        // La gérante lit le nom du compte (« Wave », « Orange Money »…), pas un code.
        body: { key, paymentMethod: accounts.find((a) => a.id === method)?.label || "Autre", dataUrl },
      });
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      await load();
    } catch (err: any) {
      setSendError(err?.message || "La preuve n'a pas pu être envoyée.");
    } finally {
      setSending(false);
    }
  };

  // Aperçu de la capture choisie, avant l'envoi.
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (error) {
    return (
      <div className="od-missing">
        <h1 className="rb-title">Commande introuvable</h1>
        <p className="rb-lead">{error}</p>
        <Link href="/boutique/commandes" className="rb-btn">Mes commandes</Link>
        <style dangerouslySetInnerHTML={{ __html: ORDER_STYLES }} />
      </div>
    );
  }
  if (!order) return <div style={{ minHeight: "50vh" }} />;

  const waitingPayment = order.status === "AWAITING_PAYMENT" || order.status === "PROOF_SENT";
  const supportDigits = getSupportPhoneDigits(settings);
  const covers = new Map((catalog?.products || []).map((p) => [p.id, p.images[0]]));
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const created = new Date(order.createdAt.includes("T") ? order.createdAt : `${order.createdAt.replace(" ", "T")}Z`);

  const ticket = async () => {
    setTicketBusy(true);
    try {
      await downloadShopTicket(order, settings.whatsapp_official_number?.trim() || undefined);
    } finally {
      setTicketBusy(false);
    }
  };

  return (
    <div className="od">
      <Link href="/boutique/commandes" className="od-back">
        <ArrowLeft size={16} /> Mes commandes
      </Link>

      <header className="od-head">
        <div className="od-head-text">
          <span className="rb-kicker">Commande {order.reference}</span>
          <h1 className="rb-title">{order.status === "CANCELLED" ? "Commande annulée" : order.statusLabel}</h1>
          <p className="od-sub">
            {order.status === "CANCELLED" && order.cancelReason ? `Motif : ${order.cancelReason}` : STATUS_TEXT[order.status]}
          </p>
          {!Number.isNaN(created.getTime()) && (
            <span className="od-date">
              Passée le {created.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à{" "}
              {created.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <button type="button" className="od-ticket" onClick={ticket} disabled={ticketBusy}>
          <ReceiptText size={17} strokeWidth={1.9} />
          <span>{ticketBusy ? "Préparation…" : "Télécharger le ticket"}</span>
        </button>
      </header>

      {order.status !== "CANCELLED" && <ShopOrderSteps status={order.status} />}

      {order.trackingNumber && (
        <div className="od-tracking">
          <span className="od-tracking-icon">
            <Truck size={18} strokeWidth={1.9} />
          </span>
          <span className="od-tracking-text">
            <small>Numéro de suivi</small>
            <strong>{order.trackingNumber}</strong>
          </span>
          {isTransitTrackingNumber(order.trackingNumber) && (
            <Link href={`/boutique/suivi/${encodeURIComponent(order.trackingNumber)}`} className="od-tracking-link">
              Suivre le colis <ExternalLink size={14} />
            </Link>
          )}
        </div>
      )}

      <div className="od-grid">
        <div className="od-main">
          {waitingPayment && (
            <section className="od-pay">
              <div className="od-pay-head">
                <h2>Paiement</h2>
                <strong>{formatFcfa(order.totalFcfa)}</strong>
              </div>
              {order.status === "PROOF_SENT" ? (
                <p className="od-ok">
                  <Check size={17} /> Preuve reçue : la boutique vérifie votre paiement. Vous pouvez en envoyer une autre si besoin.
                </p>
              ) : (
                <>
                  {order.proofSent && (
                    <p className="rb-error">
                      Votre preuve n&apos;a pas été validée. Vérifiez le montant, puis envoyez une nouvelle capture ou écrivez à la boutique.
                    </p>
                  )}
                  <p className="od-hint">{siteText(settings, "boutique_payment_text")}</p>
                </>
              )}

              <h3 className="od-step">
                <span>1</span> Choisissez votre moyen de paiement
              </h3>
              {accounts.length === 0 ? (
                <p className="od-hint">Les comptes de paiement ne sont pas encore affichés en ligne : écrivez à la boutique sur WhatsApp pour les recevoir.</p>
              ) : (
                <>
                  <div className={`pm-select n${accounts.length}`} role="radiogroup" aria-label="Moyen de paiement">
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        role="radio"
                        aria-checked={method === account.id}
                        className={`pm-option ${method === account.id ? "active" : ""}`}
                        onClick={() => setMethod(account.id)}
                      >
                        <img className="pm-logo" src={account.logo} alt="" />
                        <span className="pm-name">{account.label}</span>
                        <span className="pm-check" aria-hidden="true">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      </button>
                    ))}
                  </div>

                  {selected && (
                    <div className="pm-detail">
                      <div className="pm-line">
                        <span className="pm-line-text">
                          <small>{selected.id === "morocco" ? "RIB" : `Numéro ${selected.label}`}</small>
                          <strong className={`pm-number ${selected.id === "morocco" ? "long" : ""}`}>{selected.number}</strong>
                          {selected.holder && <span className="pm-holder">{selected.holder}</span>}
                        </span>
                        <button type="button" className="od-mini" onClick={() => copy(selected.id, selected.number)} aria-label="Copier le numéro">
                          {copied === selected.id ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copied === selected.id ? "Copié" : "Copier"}</span>
                        </button>
                      </div>
                      <div className="pm-line">
                        <span className="pm-line-text">
                          <small>Montant à envoyer</small>
                          <strong className="pm-amount">{formatFcfa(order.totalFcfa)}</strong>
                        </span>
                        <button type="button" className="od-mini" onClick={() => copy("amount", String(order.totalFcfa))} aria-label="Copier le montant">
                          {copied === "amount" ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copied === "amount" ? "Copié" : "Copier"}</span>
                        </button>
                      </div>

                      {selected.id === "wave" && selected.link ? (
                        <>
                          <a href={waveLink(selected.link, order.totalFcfa)} target="_blank" rel="noopener noreferrer" className="pm-wave">
                            <img src={selected.logo} alt="" />
                            <span>Payer avec Wave</span>
                          </a>
                          <p className="pm-note">Sur téléphone, l&apos;application Wave s&apos;ouvre directement. Sur ordinateur, scannez le QR code avec Wave.</p>
                        </>
                      ) : (
                        <p className="pm-note">
                          {selected.id === "morocco"
                            ? "Faites le virement depuis votre banque, puis envoyez le reçu ci-dessous."
                            : `Ouvrez ${selected.label}, envoyez le montant à ce numéro, puis faites une capture.`}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <h3 className="od-step">
                <span>2</span> Envoyez la capture du paiement
              </h3>
              <label className={`od-drop ${file ? "filled" : ""}`}>
                <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {preview ? (
                  <img src={preview} alt="" className="od-drop-preview" />
                ) : (
                  <span className="od-drop-icon">
                    <ImagePlus size={20} strokeWidth={1.8} />
                  </span>
                )}
                <span className="od-drop-text">
                  <strong>{file ? file.name : "Ajouter la capture"}</strong>
                  <span>{file ? "Touchez pour changer" : "Capture d'écran ou PDF du paiement"}</span>
                </span>
              </label>
              {sendError && <p className="rb-error">{sendError}</p>}
              <button type="button" className="od-send" disabled={!file || sending} onClick={sendProof}>
                {sending ? "Envoi…" : "Envoyer la preuve de paiement"}
              </button>
            </section>
          )}

          <section className="od-card">
            <h2>Livraison</h2>
            <dl className="od-facts">
              <div>
                <dt>Mode</dt>
                <dd>{order.delivery.label}</dd>
              </div>
              <div>
                <dt>Adresse</dt>
                <dd>{[order.customer.address, order.customer.city, order.customer.country].filter(Boolean).join(", ")}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  {order.customer.name} · {order.customer.phone}
                </dd>
              </div>
              {order.customer.note && (
                <div>
                  <dt>Votre mot</dt>
                  <dd>« {order.customer.note} »</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <aside className="od-summary">
          <div className="od-summary-head">
            <h2>Votre commande</h2>
            <span>
              {pieces} pièce{pieces > 1 ? "s" : ""}
            </span>
          </div>
          <ul className="od-items">
            {order.items.map((item, index) => {
              const cover = item.productId ? covers.get(item.productId) : undefined;
              const hex = item.color ? colorSwatch(item.color) : null;
              return (
                <li key={index}>
                  <span className="od-item-photo">{cover && <img src={shopImageUrl(cover)} alt="" />}</span>
                  <span className="od-item-info">
                    <strong>{item.productName}</strong>
                    <span>
                      {hex && <i style={{ background: hex }} />}
                      {[variantLabel(item), `× ${item.quantity}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <strong className="od-item-total">{formatFcfa(item.lineTotalFcfa)}</strong>
                </li>
              );
            })}
          </ul>
          <dl className="od-totals">
            <div>
              <dt>Articles</dt>
              <dd>{formatFcfa(order.itemsFcfa)}</dd>
            </div>
            <div>
              <dt>Livraison</dt>
              <dd>{formatFcfa(order.delivery.priceFcfa)}</dd>
            </div>
            <div className="od-total">
              <dt>Total</dt>
              <dd>{formatFcfa(order.totalFcfa)}</dd>
            </div>
          </dl>
          <WhatsAppButton
            href={whatsappLink(supportDigits, customerOrderMessage(order, pageUrl, order.status !== "AWAITING_PAYMENT"))}
            label="Écrire à la boutique"
            block
          />
          <p className="od-keep">Gardez ce lien : il vous permet de suivre votre commande.</p>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: ORDER_STYLES }} />
    </div>
  );
}

const STATUS_TEXT: Record<ShopOrder["status"], string> = {
  AWAITING_PAYMENT: "Payez le total, puis envoyez la capture du paiement juste ici.",
  PROOF_SENT: "La boutique vérifie votre paiement. Vous serez prévenu ici et sur WhatsApp.",
  CONFIRMED: "Paiement reçu, merci ! Votre commande est en préparation.",
  SHIPPED: "Votre commande est en route.",
  DELIVERED: "Votre commande vous a été remise. Merci pour votre achat !",
  CANCELLED: "Cette commande a été annulée.",
};

const ORDER_STYLES = `
  .od { display: grid; grid-template-columns: minmax(0, 1fr); gap: 26px; }
  .od-back { display: inline-flex; align-items: center; gap: 6px; width: fit-content; color: var(--c-text-muted); font-size: 0.9rem; font-weight: 600; text-decoration: none; }
  .od-back:hover { color: var(--c-accent); }
  .od-missing { display: grid; justify-items: start; gap: 16px; padding: 28px 0 40px; }
  .od-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 18px 28px; }
  .od-head-text { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; flex: 1 1 380px; }
  .od-head .rb-title { margin-bottom: 8px; }
  .od-sub { margin: 0; max-width: 560px; color: var(--c-text-muted); font-size: 1.04rem; line-height: 1.55; }
  .od-date { margin-top: 10px; font-family: var(--c-font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-text-light); }
  .od-ticket {
    display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 20px; border: 1px solid #DCCDB6; border-radius: 9999px;
    background: #FFFFFF; color: #3A2A21; font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease;
  }
  .od-ticket:hover { background: #FAF5F0; border-color: #CDBBA2; }
  .od-ticket:disabled { opacity: 0.6; cursor: wait; }
  .od-ticket svg { color: var(--c-accent); }

  .od-tracking { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 16px 20px; border: 1px solid #EFE6D9; border-radius: 22px; background: #FFFFFF; }
  .od-tracking-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #F3EBDF; color: #6B5844; }
  .od-tracking-text { flex: 1; display: grid; gap: 2px; min-width: 0; }
  .od-tracking-text small { font-size: 0.78rem; color: var(--c-text-light); }
  .od-tracking-text strong { font-family: var(--c-font-mono); font-size: 0.98rem; color: var(--c-text-main); overflow-wrap: anywhere; }
  .od-tracking-link { display: inline-flex; align-items: center; gap: 6px; color: #3A2A21; font-size: 0.9rem; font-weight: 700; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: rgba(58, 42, 33, 0.3); }
  .od-tracking-link:hover { color: #6B5844; }

  .od-grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 32px; align-items: start; }
  .od-main { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; min-width: 0; }
  .od-pay, .od-card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 26px; border: 1px solid #EFE6D9; border-radius: 28px; background: #FFFFFF; }
  .od-pay-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .rb-root .od-pay h2, .rb-root .od-card h2 { margin: 0; color: var(--c-text-main); font-family: var(--c-font-display); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.025em; }
  .od-pay-head strong { font-size: 1.3rem; font-weight: 800; color: var(--c-text-main); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .od-hint { margin: 0; color: var(--c-text-muted); font-size: 0.92rem; line-height: 1.5; }
  .od-ok { display: flex; gap: 8px; align-items: flex-start; margin: 0; padding: 12px 16px; border-radius: 16px; background: #EEF7F0; color: #1E7A43; font-size: 0.92rem; font-weight: 600; line-height: 1.45; }
  .rb-root .od-step { display: flex; align-items: center; gap: 10px; margin: 10px 0 0; color: var(--c-text-main); font-family: var(--c-font-display); font-size: 0.98rem; font-weight: 800; letter-spacing: -0.01em; }
  .od-step span { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #2A1E17; color: #FFFBF4; font-size: 0.76rem; font-weight: 800; }
  .pm-select { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
  .pm-option {
    position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 118px; padding: 16px 12px;
    border: 1px solid #E6DACB; border-radius: 20px; background: #FFFFFF; color: var(--c-text-main); font: inherit; cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .pm-option:hover { background: #FDFAF5; border-color: #D6C6B0; }
  .pm-option.active { border-color: #2A1E17; box-shadow: inset 0 0 0 1px #2A1E17; background: #FFFFFF; }
  .pm-option:focus-visible { outline: 0; box-shadow: 0 0 0 3px rgba(107, 88, 68, 0.25); }
  .pm-logo { width: 54px; height: 54px; border-radius: 16px; object-fit: cover; box-shadow: 0 6px 14px -10px rgba(27, 20, 17, 0.5); }
  .pm-name { font-size: 0.92rem; font-weight: 700; }
  .pm-check {
    position: absolute; top: 10px; right: 10px; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px;
    border-radius: 50%; border: 1.5px solid #D6C6B0; color: transparent; transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .pm-option.active .pm-check { background: #2A1E17; border-color: #2A1E17; color: #FFFBF4; }
  .pm-detail { display: grid; gap: 0; padding: 6px 18px 16px; border: 1px solid #EFE6D9; border-radius: 20px; background: #FDFAF5; }
  .pm-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid #EFE6D9; }
  .pm-line-text { flex: 1 1 auto; display: grid; gap: 2px; min-width: 0; }
  .pm-line .od-mini { flex-shrink: 0; }
  .pm-line-text small { font-size: 0.78rem; color: var(--c-text-light); }
  .pm-number { font-family: var(--c-font-mono); font-size: 1.05rem; color: var(--c-text-main); white-space: nowrap; }
  .pm-number.long { white-space: normal; overflow-wrap: anywhere; }
  .pm-amount { font-size: 1.05rem; font-weight: 800; color: var(--c-text-main); font-variant-numeric: tabular-nums; }
  .pm-holder { font-size: 0.84rem; color: var(--c-text-muted); }
  .pm-wave {
    display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 54px; margin-top: 14px; padding: 0 22px 0 8px; border-radius: 9999px;
    background: #2A1E17; color: #FFFBF4; font-size: 0.98rem; font-weight: 700; text-decoration: none; transition: background 0.15s ease;
  }
  .pm-wave:hover { background: #3A2A21; }
  .pm-wave:active { transform: scale(0.98); }
  .pm-wave img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  .pm-note { margin: 12px 0 0; color: var(--c-text-light); font-size: 0.84rem; line-height: 1.5; }
  .od-mini { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 0 14px; border: 1px solid #DCCDB6; border-radius: 9999px; background: #FFFBF4; color: #3A2A21; font: inherit; font-size: 0.82rem; font-weight: 700; text-decoration: none; cursor: pointer; transition: background 0.15s ease; }
  .od-mini:hover { background: #F3EBDF; }
  .od-drop { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border: 1.5px dashed #D3C3AE; border-radius: 20px; background: #FDFAF5; cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease; }
  .od-drop:hover { border-color: #6B5844; background: #FAF5F0; }
  .od-drop.filled { border-style: solid; border-color: #CDBBA2; background: #FFFFFF; }
  .od-drop input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  .od-drop-icon { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 14px; background: #F3EBDF; color: #6B5844; }
  .od-drop-preview { flex-shrink: 0; width: 46px; height: 58px; border-radius: 10px; object-fit: cover; }
  .od-drop-text { display: grid; gap: 2px; min-width: 0; }
  .od-drop-text strong { font-size: 0.95rem; color: var(--c-text-main); overflow-wrap: anywhere; }
  .od-drop-text span { font-size: 0.84rem; color: var(--c-text-light); }
  .od-send {
    min-height: 54px; padding: 0 24px; border: 0; border-radius: 9999px; background: #2A1E17; color: #FFFBF4; font: inherit; font-size: 0.98rem; font-weight: 700;
    cursor: pointer; box-shadow: 0 16px 30px -18px rgba(42, 30, 23, 0.7); transition: background 0.15s ease, opacity 0.15s ease;
  }
  .od-send:hover { background: #3A2A21; }
  .od-send:active { transform: scale(0.98); }
  .od-send:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .od-facts { margin: 0; display: grid; gap: 12px; }
  .od-facts div { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 12px; font-size: 0.92rem; }
  .od-facts dt { color: var(--c-text-light); }
  .od-facts dd { margin: 0; color: var(--c-text-main); font-weight: 600; overflow-wrap: anywhere; }

  .od-summary { position: sticky; top: 24px; display: grid; gap: 16px; padding: 26px; border: 1px solid #EFE6D9; border-radius: 30px; background: linear-gradient(180deg, #FFFDF9 0%, #FBF3E8 100%); }
  .od-summary-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .rb-root .od-summary h2 { margin: 0; color: var(--c-text-main); font-family: var(--c-font-display); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.025em; }
  .od-summary-head span { font-family: var(--c-font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-text-light); }
  .od-items { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .od-items li { display: flex; align-items: center; gap: 12px; }
  .od-item-photo { flex-shrink: 0; width: 52px; aspect-ratio: 4 / 5; border-radius: 12px; overflow: hidden; background: #F3EBDF; }
  .od-item-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .od-item-info { flex: 1; display: grid; gap: 2px; min-width: 0; }
  .od-item-info strong { font-size: 0.92rem; color: var(--c-text-main); }
  .od-item-info span { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--c-text-light); }
  .od-item-info i { width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(27, 20, 17, 0.14); }
  .od-item-total { font-size: 0.92rem; color: var(--c-text-main); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .od-totals { margin: 0; padding-top: 14px; border-top: 1px solid #EADFD3; display: grid; gap: 8px; }
  .od-totals div { display: flex; justify-content: space-between; gap: 10px; font-size: 0.92rem; }
  .od-totals dt { color: var(--c-text-muted); }
  .od-totals dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
  .od-total { padding-top: 10px; border-top: 1px solid #EADFD3; font-size: 1.12rem !important; }
  .od-total dt { color: var(--c-text-main) !important; font-weight: 800; }
  .od-total dd { font-weight: 800; }
  .od-keep { margin: 0; color: var(--c-text-light); font-size: 0.82rem; }

  @media (max-width: 960px) {
    .od-grid { grid-template-columns: minmax(0, 1fr); gap: 20px; }
    .od-summary { position: static; }
  }
  @media (max-width: 420px) {
    .pm-detail { padding: 4px 14px 14px; }
    .pm-line .od-mini { width: 40px; min-height: 40px; padding: 0; justify-content: center; }
    .pm-line .od-mini span { display: none; }
    .pm-number { font-size: 0.98rem; }
  }
  @media (max-width: 560px) {
    .od-ticket { width: 100%; justify-content: center; }
    .od-pay, .od-card { padding: 20px; border-radius: 24px; }
    .od-summary { padding: 20px; border-radius: 24px; }
        .od-facts div { grid-template-columns: 1fr; gap: 2px; }
  }
`;

export default function OrderPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "50vh" }} />}>
      <OrderView />
    </Suspense>
  );
}
