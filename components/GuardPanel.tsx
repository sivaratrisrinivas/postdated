'use client';

import { useState } from 'react';
import { guard, type Verdict } from '@/lib/guard';

/**
 * The refusal beat. §13, 2:10–2:40: a judge says "add that he had a fever" and the
 * system refuses on stage.
 *
 * §9: "Show the refusal. Do not describe it." So this is a real input wired to the
 * real guard — the same function the tests cover — not a scripted animation.
 */

const JUDGE_SUGGESTIONS = [
  'Patient had a fever on admission',
  'Oral therapy failed, IV antibiotics required',
  'Findings consistent with sepsis',
] as const;

export function GuardPanel({ sourceText }: { sourceText: string }) {
  const [draft, setDraft] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  function check(text: string) {
    setDraft(text);
    setVerdict(text.trim() ? guard(text, sourceText) : null);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/45">
        Fabrication guard
      </h2>
      <p className="mt-2 text-[0.84rem] leading-snug text-white/65">
        Try to make it write a clinical fact the record does not contain.
      </p>

      <textarea
        value={draft}
        onChange={(e) => check(e.target.value)}
        rows={2}
        placeholder="Add that the patient had a fever…"
        className="mt-4 w-full resize-none rounded-xl border border-white/12 bg-black/40 px-3.5 py-3 text-[0.9rem] leading-snug text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {JUDGE_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => check(s)}
            className="rounded-full bg-white/8 px-2.5 py-1 font-mono text-[0.6rem] text-white/55 transition-colors hover:bg-white/14 hover:text-white/80"
          >
            {s}
          </button>
        ))}
      </div>

      {verdict && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3.5 ${
            verdict.allowed
              ? 'border-[#3FA96B]/35 bg-[#3FA96B]/10'
              : 'border-[#E5484D]/45 bg-[#E5484D]/12'
          }`}
          aria-live="polite"
        >
          {verdict.allowed ? (
            <>
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#6FD79B]">
                Permitted
              </p>
              <p className="mt-1.5 text-[0.84rem] leading-snug text-white/75">
                {explainAllowed(verdict.reason)}
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#FF8A8D]">
                Blocked
              </p>
              <p className="mt-1.5 text-[0.84rem] leading-snug text-white/85">
                <span className="font-mono font-bold text-[#FF8A8D]">
                  {verdict.blocked_terms.join(', ')}
                </span>{' '}
                {verdict.blocked_terms.length === 1 ? 'does' : 'do'} not appear in the record,
                so the system will not write {verdict.blocked_terms.length === 1 ? 'it' : 'them'}.
              </p>
              <p className="mt-3 rounded-lg bg-black/35 px-3 py-2.5 font-mono text-[0.72rem] leading-relaxed text-[#FFB3B5]">
                {verdict.ask_the_doctor}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function explainAllowed(reason: Extract<Verdict, { allowed: true }>['reason']): string {
  switch (reason) {
    case 'is_a_question':
      return 'A question asserts nothing. The system may ask about anything; it may state only what the record says.';
    case 'affirmed_in_source':
      return 'Every clinical term here appears in the photographed record, un-negated.';
    case 'doctor_confirmed':
      return 'The treating doctor confirmed and signed this.';
    case 'no_clinical_claim':
      return 'No clinical claim here — this is a document demand or arithmetic.';
  }
}
