"use client";

import type { LucideIcon } from "lucide-react";

/** Les dates de la base sont en UTC, au format « AAAA-MM-JJ HH:MM:SS ». */
export function parseDbDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** « à l'instant », « il y a 12 min », « il y a 3 h », « hier à 14:05 », puis la date. */
export function timeAgo(value: string | null | undefined): string {
  const date = parseDbDate(value);
  if (!date) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (hours < 12 && date.toDateString() === new Date().toDateString()) return `il y a ${hours} h`;
  if (date.toDateString() === new Date().toDateString()) return `aujourd'hui à ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `hier à ${time}`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + ` à ${time}`;
}

/** Interrupteur en pilule, plus clair qu'une case à cocher. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`sx-switch ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="sx-track" aria-hidden="true">
        <span className="sx-thumb" />
      </span>
      <span className="sx-label">{label}</span>
    </label>
  );
}

/** Carte chiffrée de l'admin ; cliquable quand elle sert de filtre. */
export function Metric({
  icon: Icon,
  title,
  value,
  sub,
  pill,
  active,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  sub: string;
  pill?: { label: string; tone: "up" | "gold" | "neutral" };
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="metric-card-header">
        <div className="metric-card-label">
          <span className="metric-icon-box">
            <Icon size={17} strokeWidth={2} />
          </span>
          <span className="metric-card-title">{title}</span>
        </div>
        {pill && <span className={`ios-trend-pill ios-trend-pill-${pill.tone}`}>{pill.label}</span>}
      </div>
      <div className="metric-card-body">
        <div className="metric-card-value">{value}</div>
        <div className="metric-card-sub">{sub}</div>
      </div>
    </>
  );
  return onClick ? (
    <button type="button" className={`ios-metric-card sx-metric ${active ? "active" : ""}`} onClick={onClick} aria-pressed={active}>
      {body}
    </button>
  ) : (
    <div className="ios-metric-card">{body}</div>
  );
}

/** Styles communs aux trois onglets de la boutique. */
export const SHOP_UI_STYLES = `
  .sx-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 0.86rem; font-weight: 600; color: #3A2A21; }
  .sx-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
  .sx-track { position: relative; flex-shrink: 0; width: 40px; height: 24px; border-radius: 9999px; background: #E2D5C8; transition: background 0.18s ease; }
  .sx-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(28, 20, 15, 0.25); transition: transform 0.18s ease; }
  .sx-switch.on .sx-track { background: #3A2A21; }
  .sx-switch.on .sx-thumb { transform: translateX(16px); }
  .sx-switch input:focus-visible + .sx-track { box-shadow: 0 0 0 3px rgba(107, 88, 68, 0.25); }
  .sx-switch.disabled { opacity: 0.55; cursor: wait; }
  .sx-metric { width: 100%; text-align: left; font: inherit; cursor: pointer; }
  .sx-metric.active { border-color: #3A2A21; box-shadow: 0 0 0 1px #3A2A21; }
  .sx-metric.active .metric-icon-box { background: var(--brown-dark); color: #FFFFFF; border-color: var(--brown-dark); }
`;
