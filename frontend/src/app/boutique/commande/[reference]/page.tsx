"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Copy, FileUp, PackageCheck } from "lucide-react";
import { apiRequest, ApiError } from "@/shared/api";
import { compressImage } from "@/shared/compressImage";
import { usePublicCatalog } from "@/shared/usePublicCatalog";
import { getSupportPhoneDigits } from "@/shared";
import { siteText } from "@/shared/siteContent";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  ORDER_STEPS,
  customerOrderMessage,
  formatFcfa,
  isTransitTrackingNumber,
  saveOrder,
  stepIndex,
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
    });
  }
  const orange = settings.payment_orange_money_ci?.trim();
  if (orange) {
    accounts.push({ id: "orange", label: "Orange Money", number: orange, holder: settings.payment_orange_name?.trim() || "" });
  }
  const rib = settings.payment_morocco_rib?.trim();
  if (rib) {
    accounts.push({
      id: "morocco",
      label: settings.payment_morocco_bank?.trim() || "Compte Maroc",
      number: rib,
      holder: settings.payment_morocco_holder?.trim() || "",
    });
  }
  return accounts;
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
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [method, setMethod] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const accounts = useMemo(() => paymentAccounts(settings), [settings]);
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
        body: { key, paymentMethod: method || "autre", dataUrl },
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

  if (error) {
    return (
      <div className="rb-order-missing">
        <h1 className="rb-title">Commande introuvable</h1>
        <p className="rb-lead">{error}</p>
        <Link href="/boutique/commandes" className="rb-btn">Mes commandes</Link>
      </div>
    );
  }
  if (!order) return <div style={{ minHeight: "50vh" }} />;

  const current = order.status === "CANCELLED" ? -1 : stepIndex(order.status);
  const waitingPayment = order.status === "AWAITING_PAYMENT" || order.status === "PROOF_SENT";
  const supportDigits = getSupportPhoneDigits(settings);

  return (
    <div className="rb-order">
      <header className="rb-order-head">
        <span className="rb-kicker">Commande {order.reference}</span>
        <h1 className="rb-title">{order.status === "CANCELLED" ? "Commande annulée" : order.statusLabel}</h1>
        {order.status === "CANCELLED" && order.cancelReason && <p className="rb-lead">Motif : {order.cancelReason}</p>}
      </header>

      {order.status !== "CANCELLED" && (
        <ol className="rb-steps">
          {ORDER_STEPS.map((step, index) => (
            <li key={step.status} className={index < current ? "done" : index === current ? "current" : ""}>
              <span className="rb-step-dot">{index < current ? <Check size={13} /> : index + 1}</span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      )}

      {order.trackingNumber && (
        <div className="rb-tracking">
          <PackageCheck size={20} />
          <span>
            Numéro de suivi : <strong>{order.trackingNumber}</strong>
          </span>
          {isTransitTrackingNumber(order.trackingNumber) && (
            <Link href={`/tracking/${encodeURIComponent(order.trackingNumber)}`} className="rb-btn rb-btn-soft">
              Suivre le colis
            </Link>
          )}
        </div>
      )}

      <div className="rb-order-grid">
        {waitingPayment && (
          <section className="rb-pay">
            <h2>Payer {formatFcfa(order.totalFcfa)}</h2>
            {order.status === "PROOF_SENT" ? (
              <p className="rb-pay-ok">
                <Check size={17} /> Preuve reçue : la boutique vérifie votre paiement. Vous pouvez en envoyer une autre si besoin.
              </p>
            ) : (
              <p className="rb-muted">{siteText(settings, "boutique_payment_text")}</p>
            )}

            {accounts.length === 0 ? (
              <p className="rb-muted">
                Les comptes de paiement ne sont pas encore affichés en ligne : écrivez à la boutique sur WhatsApp pour les recevoir.
              </p>
            ) : (
              <div className="rb-accounts">
                {accounts.map((account) => (
                  <label key={account.id} className={`rb-account ${method === account.id ? "active" : ""}`}>
                    <input type="radio" name="method" checked={method === account.id} onChange={() => setMethod(account.id)} />
                    <span className="rb-account-info">
                      <strong>{account.label}</strong>
                      <span className="rb-account-number">{account.number}</span>
                      {account.holder && <span className="rb-muted">{account.holder}</span>}
                    </span>
                    <span className="rb-account-actions">
                      {account.link && (
                        <a href={account.link} target="_blank" rel="noopener noreferrer" className="rb-mini">
                          Ouvrir Wave
                        </a>
                      )}
                      <button type="button" className="rb-mini" onClick={() => copy(account.id, account.number)}>
                        {copied === account.id ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied === account.id ? "Copié" : "Copier"}</span>
                      </button>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="rb-proof">
              <input
                ref={fileInput}
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button type="button" className="rb-btn rb-btn-soft rb-btn-block" onClick={() => fileInput.current?.click()}>
                <FileUp size={18} />
                <span>{file ? file.name : "Choisir la capture du paiement"}</span>
              </button>
              {sendError && <p className="rb-error">{sendError}</p>}
              <button type="button" className="rb-btn rb-btn-block" disabled={!file || sending} onClick={sendProof}>
                {sending ? "Envoi…" : "Envoyer la preuve de paiement"}
              </button>
            </div>
          </section>
        )}

        <section className="rb-recap">
          <h2>Votre commande</h2>
          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                <span>
                  {item.quantity} × {item.productName}
                  {variantLabel(item) && <span className="rb-muted"> · {variantLabel(item)}</span>}
                </span>
                <span>{formatFcfa(item.lineTotalFcfa)}</span>
              </li>
            ))}
            <li>
              <span>{order.delivery.label}</span>
              <span>{formatFcfa(order.delivery.priceFcfa)}</span>
            </li>
            <li className="rb-recap-total">
              <span>Total</span>
              <span>{formatFcfa(order.totalFcfa)}</span>
            </li>
          </ul>
          <p className="rb-muted rb-recap-to">
            Livraison à {[order.customer.address, order.customer.city, order.customer.country].filter(Boolean).join(", ")}
          </p>
          <WhatsAppButton
            href={whatsappLink(supportDigits, customerOrderMessage(order, pageUrl, order.status !== "AWAITING_PAYMENT"))}
            label="Écrire à la boutique"
            block
          />
          <p className="rb-muted rb-recap-keep">Gardez ce lien : il vous permet de suivre votre commande.</p>
        </section>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rb-order-head { padding: 14px 0 10px; }
        .rb-steps { list-style: none; display: flex; gap: 8px; margin: 6px 0 22px; padding: 0; overflow-x: auto; }
        .rb-steps li { flex: 1 0 auto; display: flex; align-items: center; gap: 8px; padding: 8px 14px 8px 8px; border-radius: 9999px; background: #F3EBDF; color: #8C7D75; font-size: 0.84rem; font-weight: 700; white-space: nowrap; }
        .rb-steps li.done { color: #3A2A21; }
        .rb-steps li.current { background: #3A2A21; color: #FFFBF4; }
        .rb-step-dot { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #FFFBF4; color: #3A2A21; font-size: 0.76rem; }
        .rb-tracking { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 20px; padding: 14px 18px; border-radius: 20px; background: #FFFFFF; border: 1px solid #EADFD3; }
        .rb-order-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 28px; align-items: start; }
        .rb-pay, .rb-recap { display: grid; gap: 14px; padding: 22px; border-radius: 24px; background: linear-gradient(165deg, #FFFDF9, #FBF3E8); border: 1px solid #EFE6D9; }
        .rb-pay h2, .rb-recap h2 { margin: 0; font-size: 1.2rem; }
        .rb-pay-ok { display: flex; gap: 8px; align-items: flex-start; margin: 0; color: #1E7A43; font-weight: 600; line-height: 1.45; }
        .rb-accounts { display: grid; gap: 10px; }
        .rb-account { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 20px; background: #FFFFFF; border: 1px solid #EADFD3; cursor: pointer; }
        .rb-account.active { border-color: #3A2A21; box-shadow: inset 0 0 0 1px #3A2A21; }
        .rb-account input { accent-color: #3A2A21; }
        .rb-account-info { flex: 1; display: grid; gap: 2px; min-width: 0; }
        .rb-account-number { font-family: var(--c-font-mono); font-weight: 700; word-break: break-all; }
        .rb-account-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
        .rb-mini { display: inline-flex; align-items: center; gap: 5px; min-height: 34px; padding: 0 12px; border: 0; border-radius: 9999px; background: #EADDCB; color: #3A2A21; font: inherit; font-size: 0.8rem; font-weight: 700; text-decoration: none; cursor: pointer; }
        .rb-proof { display: grid; gap: 10px; }
        .rb-recap ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .rb-recap li { display: flex; justify-content: space-between; gap: 12px; font-size: 0.94rem; }
        .rb-recap li span:last-child { font-weight: 700; white-space: nowrap; }
        .rb-recap-total { padding-top: 10px; border-top: 1px solid #EADFD3; font-size: 1.08rem; font-weight: 800; }
        .rb-recap-to, .rb-recap-keep { margin: 0; font-size: 0.86rem; }
        .rb-order-missing { display: grid; justify-items: start; gap: 14px; padding: 40px 0; }
        @media (max-width: 860px) { .rb-order-grid { grid-template-columns: 1fr; } }
        @media (max-width: 560px) {
          .rb-account { flex-wrap: wrap; }
          .rb-account-actions { width: 100%; justify-content: flex-start; padding-left: 28px; }
        }
      `,
        }}
      />
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "50vh" }} />}>
      <OrderView />
    </Suspense>
  );
}
