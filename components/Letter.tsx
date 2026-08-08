'use client';

import type { Disallowance, Forecast } from '@/lib/types';

/**
 * The hero artefact. POSTDATED.md §4: "You do not receive advice. You receive the
 * adversary's own letter."
 *
 * Design constraints, from §13: it must read with the sound off, from across a room.
 * So the date and the disallowed figure are the two largest things on the page, and
 * every red line carries its rupees at the same weight as its reason.
 */

const INSURER = 'Niva Bupa Health Insurance Company Limited';

export interface LetterProps {
  forecast: Forecast;
  /** Bucket C reasons the user has since resolved. These strike through and stop counting. */
  resolved: ReadonlySet<string>;
  onTapLine: (line: Disallowance) => void;
}

export function Letter({ forecast, resolved, onTapLine }: LetterProps) {
  const live = forecast.lines.filter((l) => !resolved.has(l.reason));
  const disallowed = live.reduce((sum, l) => sum + l.amount, 0);
  const approved = forecast.claimed - disallowed;

  return (
    <article className="relative overflow-hidden bg-[#FAFAF7] text-[#1A1A1A] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_12px_32px_-8px_rgba(0,0,0,0.18)]">
      <Watermark />

      <div className="relative px-5 py-6 sm:px-8 sm:py-8">
        <Letterhead date={forecast.letter_date} />
        <Totals claimed={forecast.claimed} approved={approved} disallowed={disallowed} />

        <ul className="mt-6 divide-y divide-[#1A1A1A]/8 border-y border-[#1A1A1A]/12">
          {forecast.lines.map((line) => (
            <Line
              key={line.reason}
              line={line}
              struck={resolved.has(line.reason)}
              onTap={() => onTapLine(line)}
            />
          ))}
        </ul>

        <Footer />
      </div>
    </article>
  );
}

/**
 * §9 covers clinical fabrication but never addresses the artefact impersonating a real
 * insurer's letterhead. This closes that. One line, and it pre-empts the only awkward
 * question the spec does not already answer.
 */
function Watermark() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="-rotate-[24deg] whitespace-nowrap text-center font-mono text-[clamp(1rem,4.5vw,1.75rem)] font-bold uppercase leading-tight tracking-[0.12em] text-[#C1121F]/12">
        Predicted — not issued
        <br />
        by Niva Bupa
      </span>
    </div>
  );
}

function Letterhead({ date }: { date: Date }) {
  return (
    <header className="border-b-2 border-[#1A1A1A] pb-4">
      <p className="font-serif text-[0.95rem] font-bold uppercase leading-snug tracking-[0.06em] sm:text-base">
        {INSURER}
      </p>
      <p className="mt-0.5 font-serif text-[0.7rem] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
        Claims Adjudication · Health Reimbursement
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <dl className="font-mono text-[0.68rem] leading-relaxed text-[#1A1A1A]/70">
          <div className="flex gap-2">
            <dt className="w-[4.5rem] shrink-0">Claim No.</dt>
            <dd className="tabular-nums text-[#1A1A1A]">NB/BLR/2026/4471</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-[4.5rem] shrink-0">Insured</dt>
            <dd className="text-[#1A1A1A]">Ramachandra P., 71/M</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-[4.5rem] shrink-0">Policy</dt>
            <dd className="text-[#1A1A1A]">ReAssure 2.0</dd>
          </div>
        </dl>

        {/* The date is the idea, not the letterhead. So it gets the type. */}
        <div className="text-right">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[#C1121F]">
            Date of this letter
          </p>
          <p className="font-mono text-[1.35rem] font-bold tabular-nums leading-tight sm:text-2xl">
            {formatDate(date)}
          </p>
        </div>
      </div>
    </header>
  );
}

function Totals({
  claimed,
  approved,
  disallowed,
}: {
  claimed: number;
  approved: number;
  disallowed: number;
}) {
  return (
    <section className="mt-6">
      <h2 className="font-serif text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60">
        Claim decision
      </h2>
      <dl className="mt-3 space-y-1.5 font-mono text-sm tabular-nums">
        <Row label="Amount claimed" value={claimed} />
        <Row label="Amount approved" value={approved} />
      </dl>

      <div className="mt-4 border-t-2 border-[#C1121F] pt-3">
        <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#C1121F]">
          Total disallowed
        </p>
        {/* The one number a judge reads from the back row. */}
        <p
          className="font-mono text-[clamp(2.25rem,11vw,3.5rem)] font-bold tabular-nums leading-[1.05] text-[#C1121F] transition-all duration-500"
          aria-live="polite"
        >
          {rupees(disallowed)}
        </p>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[#1A1A1A]/70">{label}</dt>
      <dd className="font-semibold transition-all duration-500">{rupees(value)}</dd>
    </div>
  );
}

function Line({
  line,
  struck,
  onTap,
}: {
  line: Disallowance;
  struck: boolean;
  onTap: () => void;
}) {
  const recoverable = line.bucket === 'C' && !struck;

  return (
    <li>
      <button
        type="button"
        onClick={onTap}
        className={`group flex w-full items-start gap-3 py-3.5 text-left transition-opacity duration-500 ${
          struck ? 'opacity-35' : ''
        }`}
      >
        <span
          aria-hidden
          className={`mt-px font-mono text-sm font-bold ${
            struck ? 'text-[#1A7A3C]' : 'text-[#C1121F]'
          }`}
        >
          {struck ? '✓' : '✗'}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block font-mono text-[0.94rem] font-bold tabular-nums leading-tight ${
              struck ? 'text-[#1A7A3C] line-through' : 'text-[#C1121F]'
            }`}
          >
            {rupees(line.amount)}
          </span>
          <span
            className={`mt-1 block text-[0.82rem] leading-snug text-[#1A1A1A]/85 ${
              struck ? 'line-through' : ''
            }`}
          >
            {line.reason}
          </span>

          {recoverable && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#1A7A3C]">
              Fixable now
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          )}

          {/* Bucket A shown plainly. This honesty is load-bearing — it is the reason
              a user believes the Bucket C lines. */}
          {line.bucket === 'A' && (
            <span className="mt-1.5 block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#1A1A1A]/45">
              This money is gone
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function Footer() {
  return (
    <footer className="mt-6 space-y-2 border-t border-[#1A1A1A]/12 pt-4 font-mono text-[0.6rem] leading-relaxed text-[#1A1A1A]/50">
      <p>
        Disallowances are stated with reference to the policy schedule and the documents on
        record at the time of adjudication.
      </p>
      <p className="font-bold uppercase tracking-[0.1em] text-[#C1121F]/70">
        Forecast produced by POSTDATED. Not issued by, endorsed by, or affiliated with any
        insurer or TPA.
      </p>
    </footer>
  );
}

/** Indian digit grouping. ₹1,73,000 — not ₹173,000. Getting this wrong reads as foreign. */
function rupees(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
