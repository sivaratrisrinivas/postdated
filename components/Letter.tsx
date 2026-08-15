'use client';

import type { Disallowance, Forecast } from '@/lib/types';
import type { Policy } from '@/lib/policy';

export interface LetterProps {
  forecast: Forecast;
  resolved: ReadonlySet<string>;
  policy: Policy;
  onLineSelect?: (line: Disallowance) => void;
}

/**
 * The product's hero artefact. It stays deliberately static in the forecast screen so the
 * user has one clear next decision: open the highest-value recoverable line beside it.
 */
export function Letter({ forecast, resolved, policy, onLineSelect }: LetterProps) {
  const live = forecast.lines.filter((line) => !resolved.has(line.reason));
  const disallowed = live.reduce((sum, line) => sum + line.amount, 0);
  const approved = forecast.claimed - disallowed;

  return (
    <article className="letter-paper">
      <Watermark />

      <div className="letter-inner">
        <Letterhead date={forecast.letter_date} policy={policy} />
        <Totals claimed={forecast.claimed} approved={approved} disallowed={disallowed} />

        <ul className="letter-lines">
          {forecast.lines.map((line) => (
            <Line
              key={line.reason}
              line={line}
              struck={resolved.has(line.reason)}
              onSelect={onLineSelect}
            />
          ))}
        </ul>

        <Footer />
      </div>
    </article>
  );
}

function Watermark() {
  return (
    <div aria-hidden className="watermark">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index}>Predicted · not issued by Niva Bupa · Predicted</span>
      ))}
    </div>
  );
}

function Letterhead({ date, policy }: { date: Date; policy: Policy }) {
  return (
    <header className="letter-head">
      <p className="letter-head-name">{policy.insurer}</p>
      <p className="letter-head-subtitle">Claims adjudication · Health reimbursement</p>

      <div className="letter-meta">
        <dl>
          <div className="letter-meta-row">
            <dt>Read no.</dt>
            <dd>POSTDATED / SESSION-ONLY</dd>
          </div>
          <div className="letter-meta-row">
            <dt>Source</dt>
            <dd>Discharge summary + final bill</dd>
          </div>
          <div className="letter-meta-row">
            <dt>Policy</dt>
            <dd>{policy.product}</dd>
          </div>
        </dl>

        <div className="letter-date">
          <p className="letter-date-label">Date of this letter</p>
          <p className="letter-date-value">{formatDate(date)}</p>
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
    <section className="letter-totals">
      <h2>Claim decision</h2>
      <dl className="letter-total-rows">
        <TotalRow label="Amount claimed" value={claimed} />
        <TotalRow label="Amount approved" value={approved} />
      </dl>

      <div className="letter-disallowed">
        <p className="letter-total-label">Total disallowed</p>
        <p className="letter-disallowed-amount" aria-live="polite">
          {rupees(disallowed)}
        </p>
      </div>
    </section>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="letter-total-row">
      <dt>{label}</dt>
      <dd>{rupees(value)}</dd>
    </div>
  );
}

function Line({
  line,
  struck,
  onSelect,
}: {
  line: Disallowance;
  struck: boolean;
  onSelect?: (line: Disallowance) => void;
}) {
  const recoverable = line.bucket === 'C' && !struck;

  const content = (
    <span className="letter-line-content">
      <span className="letter-line-marker" aria-hidden>
        {struck ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="m3.5 8.2 2.7 2.7 6.3-6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="letter-line-amount">{rupees(line.amount)}</span>
        <span className="letter-line-reason">{line.reason}</span>

        {recoverable && (
          <span className="letter-line-status">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="m2.5 6.2 2 2 5-5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Fixable now · tap for the exact ask
          </span>
        )}

        {line.bucket === 'A' && (
          <span className="letter-line-gone">This money is gone · tap to see the clause</span>
        )}
      </span>
    </span>
  );

  return (
    <li className={`letter-line ${struck ? 'is-struck' : ''}`}>
      {onSelect ? (
        <button
          type="button"
          className="letter-line-button"
          onClick={() => onSelect(line)}
          aria-label={`Inspect ${line.reason}`}
        >
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  );
}

function Footer() {
  return (
    <footer className="letter-footer">
      <p>
        Disallowances are stated with reference to the policy schedule and the documents on
        record at the time of adjudication.
      </p>
      <p className="disclaimer">
        Forecast produced by POSTDATED. Not issued by, endorsed by, or affiliated with any
        insurer or TPA.
      </p>
    </footer>
  );
}

function rupees(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
