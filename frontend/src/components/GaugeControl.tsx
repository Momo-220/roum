"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

interface GaugeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** Repères cliquables sous la jauge. */
  ticks: number[];
  onChange: (value: number) => void;
}

/**
 * Jauge de quantité, à la manière d'un réglage de volume : on glisse, on appuie sur − et +,
 * ou on saisit directement une valeur, qui peut dépasser la fin de la jauge.
 */
export function GaugeControl({ label, value, min, max, step, unit, ticks, onChange }: GaugeControlProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const holdRef = useRef<{ delay?: ReturnType<typeof setTimeout>; repeat?: ReturnType<typeof setInterval> }>({});

  const decimals = step < 1 ? 1 : 0;
  const tidy = (next: number) => Math.max(min, Number(next.toFixed(decimals)));
  const percent = (next: number) => Math.min(100, Math.max(0, ((next - min) / (max - min)) * 100));

  const stopHold = () => {
    clearTimeout(holdRef.current.delay);
    clearInterval(holdRef.current.repeat);
  };

  useEffect(() => stopHold, []);

  // Maintenir − ou + fait défiler la valeur, comme un bouton de volume.
  const startHold = (direction: 1 | -1) => {
    const nudge = () => onChangeRef.current(tidy(valueRef.current + direction * step));
    nudge();
    holdRef.current.delay = setTimeout(() => {
      holdRef.current.repeat = setInterval(nudge, 70);
    }, 380);
  };

  const holdProps = (direction: 1 | -1) => ({
    onPointerDown: () => startHold(direction),
    onPointerUp: stopHold,
    onPointerLeave: stopHold,
    onPointerCancel: stopHold,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onChange(tidy(value + direction * step));
      }
    },
  });

  return (
    <div className="gauge">
      <div className="gauge-head">
        <span className="gauge-label">{label}</span>
        <label className="gauge-value">
          <input
            type="number"
            inputMode="decimal"
            min={min}
            step={step}
            aria-label={label}
            value={draft ?? value}
            style={{ width: `${Math.max(1, String(draft ?? value).length) + 0.6}ch` }}
            onChange={(event) => {
              setDraft(event.target.value);
              const next = parseFloat(event.target.value);
              if (Number.isFinite(next) && next >= min) onChange(tidy(next));
            }}
            onBlur={() => setDraft(null)}
          />
          <span>{unit}</span>
        </label>
      </div>

      <div className="gauge-row">
        <button type="button" className="gauge-btn" aria-label={`Diminuer : ${label}`} {...holdProps(-1)}>
          <Minus size={18} strokeWidth={2.4} />
        </button>

        <div className="gauge-track-wrap">
          <input
            type="range"
            className="gauge-range"
            aria-label={label}
            min={min}
            max={max}
            step={step}
            value={Math.min(value, max)}
            style={{ "--fill": `${percent(value)}%` } as React.CSSProperties}
            onChange={(event) => onChange(tidy(Number(event.target.value)))}
          />
          <div className="gauge-ticks">
            {ticks.map((tick) => (
              <button
                key={tick}
                type="button"
                className={`gauge-tick ${value === tick ? "active" : ""}`}
                style={{ left: `calc(15px + (100% - 30px) * ${percent(tick) / 100})` }}
                onClick={() => onChange(tick)}
              >
                {tick}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="gauge-btn" aria-label={`Augmenter : ${label}`} {...holdProps(1)}>
          <Plus size={18} strokeWidth={2.4} />
        </button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .gauge {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .gauge-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }

        .gauge-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: #3A2A21;
        }

        .gauge-value {
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
          color: #3A2A21;
          font-weight: 800;
          cursor: text;
        }

        .gauge-value input {
          min-width: 1.6ch;
          padding: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: inherit;
          font-family: var(--c-font-display);
          font-size: 2.1rem !important;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          text-align: right;
          font-variant-numeric: tabular-nums;
          -moz-appearance: textfield;
          appearance: textfield;
        }

        .gauge-value input::-webkit-outer-spin-button,
        .gauge-value input::-webkit-inner-spin-button {
          margin: 0;
          -webkit-appearance: none;
        }

        .gauge-value span {
          font-size: 0.95rem;
          font-weight: 700;
          color: #8C7D75;
        }

        .gauge-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .gauge-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          margin-top: -7px;
          border: 0;
          border-radius: 50%;
          background: #EFE6D9;
          color: #163B46;
          cursor: pointer;
          touch-action: manipulation;
          user-select: none;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .gauge-btn:hover {
          background: #E6D9C6;
        }

        .gauge-btn:active {
          transform: scale(0.9);
        }

        .gauge-btn:focus-visible {
          outline: 2px solid #1E4D5B;
          outline-offset: 2px;
        }

        .gauge-track-wrap {
          flex: 1;
          min-width: 0;
        }

        .gauge-range {
          display: block;
          width: 100%;
          height: 30px;
          margin: 0;
          background: transparent;
          cursor: pointer;
          touch-action: pan-y;
          -webkit-appearance: none;
          appearance: none;
        }

        .gauge-range:focus {
          outline: none;
        }

        .gauge-range::-webkit-slider-runnable-track {
          height: 10px;
          border-radius: 9999px;
          background:
            linear-gradient(90deg, #8FB3B6, #1E4D5B) 0 0 / var(--fill) 100% no-repeat,
            #EDE3D8;
        }

        .gauge-range::-moz-range-track {
          height: 10px;
          border-radius: 9999px;
          background: #EDE3D8;
        }

        .gauge-range::-moz-range-progress {
          height: 10px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #8FB3B6, #1E4D5B);
        }

        .gauge-range::-webkit-slider-thumb {
          width: 30px;
          height: 30px;
          margin-top: -10px;
          border: 3px solid #1E4D5B;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 4px 12px rgba(22, 59, 70, 0.28);
          transition: transform 0.15s ease;
          -webkit-appearance: none;
          appearance: none;
        }

        .gauge-range::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border: 3px solid #1E4D5B;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 4px 12px rgba(22, 59, 70, 0.28);
        }

        .gauge-range:active::-webkit-slider-thumb {
          transform: scale(1.14);
        }

        .gauge-range:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 5px rgba(30, 77, 91, 0.18);
        }

        .gauge-ticks {
          position: relative;
          height: 30px;
        }

        .gauge-tick {
          position: absolute;
          top: 0;
          min-width: 34px;
          min-height: 30px;
          padding: 0 4px;
          border: 0;
          background: transparent;
          color: #A99A90;
          font-family: var(--c-font-mono);
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transform: translateX(-50%);
          transition: color 0.15s ease;
        }

        .gauge-tick:hover,
        .gauge-tick.active {
          color: #1E4D5B;
        }
      `,
        }}
      />
    </div>
  );
}
