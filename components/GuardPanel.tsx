'use client';

import { useState } from 'react';
import { guard, type Verdict } from '@/lib/guard';

const JUDGE_SUGGESTIONS = [
  'Patient had a fever on admission',
  'Oral therapy failed, IV antibiotics required',
  'Findings consistent with sepsis',
] as const;

/**
 * A deliberately tucked-away demo of the non-negotiable boundary: the system refuses to add a
 * clinical fact that is absent or negated in the photographed record.
 */
export function GuardPanel({ sourceText }: { sourceText: string }) {
  const [draft, setDraft] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  function check(text: string) {
    setDraft(text);
    setVerdict(text.trim() ? guard(text, sourceText) : null);
  }

  return (
    <section className="support-panel">
      <h2>Fabrication guard</h2>
      <p>Try to make it write a clinical fact the record does not contain.</p>

      <textarea
        value={draft}
        onChange={(event) => check(event.target.value)}
        rows={3}
        placeholder="Add that the patient had a fever…"
        aria-label="Test the fabrication guard"
      />

      <div className="support-suggestions">
        {JUDGE_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="support-suggestion"
            onClick={() => check(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {verdict && (
        <div
          className={`support-verdict ${verdict.allowed ? 'is-allowed' : 'is-blocked'}`}
          aria-live="polite"
        >
          {verdict.allowed ? (
            <>
              <p className="support-verdict-label">Permitted</p>
              <p>{explainAllowed(verdict.reason)}</p>
            </>
          ) : (
            <>
              <p className="support-verdict-label">Blocked</p>
              <ul>
                {verdict.blocked_terms.map((term) => {
                  const negation = verdict.negations[term];
                  return (
                    <li key={term}>
                      <strong>{term}</strong>{' '}
                      {negation ? (
                        <>
                          appears in the record only to be ruled out, so it is not established:
                          <span className="negation">“{negation}”</span>
                        </>
                      ) : (
                        <>is nowhere in the record, so the system will not write it.</>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="doctor-ask">{verdict.ask_the_doctor}</p>
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
