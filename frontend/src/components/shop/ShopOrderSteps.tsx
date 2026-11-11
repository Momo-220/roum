import { Check } from "lucide-react";
import { ORDER_STEPS, stepIndex, type ShopOrderStatus } from "@/shared/shop";

/** Les étapes d'une commande, dans le cadre crème du trajet Roum Transit. */
export function ShopOrderSteps({ status }: { status: ShopOrderStatus }) {
  const current = status === "CANCELLED" ? -1 : stepIndex(status);
  return (
    <section className="rbs-route" aria-label="Étapes de la commande">
      <ol className="rbs-steps">
        {ORDER_STEPS.map((step, index) => (
          <li
            key={step.status}
            className={index < current ? "done" : index === current ? "current" : ""}
            aria-current={index === current ? "step" : undefined}
          >
            <span className="rbs-dot">{index < current && <Check size={12} strokeWidth={3} />}</span>
            <span className="rbs-label">{step.label}</span>
          </li>
        ))}
      </ol>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rbs-route { margin-bottom: 30px; padding: 24px 18px 20px; border: 1px solid #EFE6D9; border-radius: 30px; background: linear-gradient(180deg, #FFFDF9 0%, #FBF3E8 100%); }
        .rbs-steps { display: flex; margin: 0; padding: 0; list-style: none; }
        .rbs-steps li { position: relative; flex: 1 1 0; display: flex; flex-direction: column; align-items: center; gap: 9px; min-width: 0; text-align: center; }
        .rbs-steps li + li::before { content: ""; position: absolute; top: 11px; right: 50%; width: 100%; height: 2px; background: #EADFD3; }
        .rbs-steps li.done::before, .rbs-steps li.current::before { background: #6B5844; transition: background 0.3s ease; }
        .rbs-dot {
          position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%; background: #E2D5C8; color: #FFFBF4;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .rbs-steps li.done .rbs-dot, .rbs-steps li.current .rbs-dot { background: #6B5844; }
        .rbs-steps li.current .rbs-dot { box-shadow: 0 0 0 6px rgba(107, 88, 68, 0.16); }
        .rbs-label { padding: 0 4px; color: #7D6E64; font-size: 0.84rem; font-weight: 600; line-height: 1.25; }
        .rbs-steps li.done .rbs-label { color: #3A2A21; }
        .rbs-steps li.current .rbs-label { color: #3A2A21; font-weight: 800; }
        @media (max-width: 520px) {
          .rbs-route { padding: 20px 8px 16px; border-radius: 26px; }
          .rbs-label { padding: 0 2px; font-size: 0.7rem; }
          .rbs-dot { width: 22px; height: 22px; }
          .rbs-steps li + li::before { top: 10px; }
        }
      `,
        }}
      />
    </section>
  );
}
