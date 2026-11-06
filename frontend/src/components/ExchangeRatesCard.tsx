"use client";

import { useState } from "react";
import { getExchangeRates } from "@/shared";

const CURRENCIES = [
  { settingKey: "exchange_rate_rmb", rateKey: "rmb", label: "1 Yuan (RMB)", plural: "Yuans" },
  { settingKey: "exchange_rate_usd", rateKey: "usd", label: "1 Dollar (USD)", plural: "Dollars" },
  { settingKey: "exchange_rate_eur", rateKey: "eur", label: "1 Euro (EUR)", plural: "Euros" },
] as const;

interface ExchangeRatesCardProps {
  settings: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
}

/** Taux réglés en francs CFA, avec le calcul inverse pour vérifier un montant d'un coup d'œil. */
export function ExchangeRatesCard({ settings, onChange, onSave }: ExchangeRatesCardProps) {
  const [fcfaAmount, setFcfaAmount] = useState("10000");
  const rates = getExchangeRates(settings);
  const amount = Number(fcfaAmount) > 0 ? Number(fcfaAmount) : 0;

  return (
    <div className="card-clean erc">
      <h3>Taux de change</h3>
      <p>Les prix des articles et les montants en Yuans se mettent à jour dès l&apos;enregistrement.</p>

      <div className="erc-fields">
        {CURRENCIES.map(({ settingKey, label }) => (
          <label key={settingKey}>
            <span>{label}</span>
            <div className="erc-input">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={settings[settingKey] ?? ""}
                onChange={(event) => onChange(settingKey, event.target.value)}
              />
              <em>FCFA</em>
            </div>
          </label>
        ))}
      </div>

      <div className="erc-fcfa">
        <label>
          <span>Franc CFA (FCFA)</span>
          <div className="erc-input">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="500"
              value={fcfaAmount}
              onChange={(event) => setFcfaAmount(event.target.value)}
            />
            <em>FCFA</em>
          </div>
        </label>
        <ul aria-label="Équivalent en devises">
          {CURRENCIES.map(({ rateKey, plural }) => (
            <li key={rateKey}>
              <strong>{(amount / rates[rateKey]).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</strong> {plural}
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="btn btn-primary" onClick={onSave}>
        Enregistrer les taux
      </button>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .erc {
          display: grid;
          gap: 16px;
          padding: 26px;
          border-radius: 20px;
        }

        .erc h3 {
          margin: 0;
          color: var(--brown-dark);
          font-size: 1.15rem;
          font-weight: 800;
        }

        .erc > p {
          margin: -10px 0 0;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .erc-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 14px;
        }

        .erc label > span {
          display: block;
          margin-bottom: 5px;
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
        }

        .erc-input {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          background: #FFFFFF;
        }

        .erc-input:focus-within {
          border-color: var(--border-hover);
        }

        .erc-input input {
          flex: 1;
          min-width: 0;
          min-height: 44px;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--text-main);
          font-family: inherit;
          font-weight: 600;
        }

        .erc-input em {
          flex-shrink: 0;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-style: normal;
          font-weight: 700;
        }

        .erc-fcfa {
          display: grid;
          grid-template-columns: minmax(170px, 1fr) minmax(0, 2fr);
          align-items: end;
          gap: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border-light);
        }

        .erc-fcfa ul {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .erc-fcfa li {
          padding: 8px 13px;
          border-radius: 9999px;
          background: #F3EBDF;
          color: #3A2A21;
          font-size: 0.82rem;
        }

        .erc-fcfa strong {
          font-weight: 800;
        }

        .erc .btn {
          justify-self: start;
        }

        @media (max-width: 600px) {
          .erc {
            padding: 20px 16px;
          }

          .erc-fcfa {
            grid-template-columns: minmax(0, 1fr);
          }

          .erc .btn {
            justify-self: stretch;
            min-height: 46px;
          }
        }
      `,
        }}
      />
    </div>
  );
}
