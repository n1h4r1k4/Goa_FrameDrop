import type { ReactNode } from "react";

/**
 * The poster's two building blocks. A Panel is a sheet of paper tacked to the
 * green page with a pink pin; PanelHead is the serif title strip at the top of
 * one. Section rules inside a panel are hazard tape (<Tape />).
 */

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`hh-panel relative overflow-hidden ${className}`}>
      <span className="hh-pin" aria-hidden />
      {children}
    </div>
  );
}

export function PanelHead({
  step,
  title,
  badge,
  right,
}: {
  step?: number;
  title: string;
  /** small status chip on the right (dark green pill) */
  badge?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-ink/15 px-5 pb-3 pt-6 sm:px-6">
      <h2
        className="hh-h text-goa-green"
        style={{ fontSize: "clamp(1.35rem, 3.4vw, 2rem)" }}
      >
        {step !== undefined && <span className="text-ink/35">{step}. </span>}
        {title}
      </h2>
      {badge && (
        <span className="shrink-0 rounded-full bg-goa-green px-3 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-sun-1">
          {badge}
        </span>
      )}
      {right}
    </div>
  );
}

/** Sub-section title inside a panel ("2. Builder profile"). */
export function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <h3 className="hh-h mb-3 text-[1.15rem] text-goa-green">
      <span className="text-ink/35">{step}. </span>
      {title}
    </h3>
  );
}

/** Edge-to-edge hazard divider between panel sections. */
export function Tape({ className = "" }: { className?: string }) {
  return <div className={`hh-tape ${className}`} aria-hidden />;
}
