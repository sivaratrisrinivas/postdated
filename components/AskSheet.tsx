'use client';

import { useState } from 'react';
import type { Disallowance } from '@/lib/types';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]['code'];

const FONT_FOR: Record<LanguageCode, string> = {
  en: 'var(--font-geist-sans)',
  kn: 'var(--font-kannada), var(--font-geist-sans)',
  hi: 'var(--font-devanagari), var(--font-geist-sans)',
};

export interface AskSheetProps {
  line: Disallowance;
  onResolve: (reason: string) => void;
  onClose: () => void;
}

/** The one physical action screen. It is a page in the journey, not an interrupting modal. */
export function AskSheet({ line, onResolve, onClose }: AskSheetProps) {
  const [lang, setLang] = useState<LanguageCode>('en');
  const action = line.action;

  return (
    <section className="action-stage" aria-labelledby="action-title">
      <button type="button" className="back-action" onClick={onClose}>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
          <path d="M12.25 7.5H2.75M6.5 3.25 2.25 7.5l4.25 4.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to the forecast
      </button>

      <div className="action-layout">
        <div className="action-intro">
          <div>
            <p className="step-count">03 / 03 · Take the next step</p>
            <h1 id="action-title" className="action-title">
              Fix the line while the file is still open.
            </h1>
          </div>
          <p className="action-intro-copy">
            Hold this screen up to the right person. POSTDATED never fills in a clinical fact; it
            asks for the document or the doctor who can confirm it.
          </p>
        </div>

        <article className="action-card">
          <p className="action-kind">
            {action?.kind === 'doctor_question' ? 'Ask the treating doctor' : 'Ask the ward desk'}
          </p>
          <p className="action-amount">₹{line.amount.toLocaleString('en-IN')}</p>
          <p className="action-reason">{line.reason}</p>

          {action ? (
            <>
              <div className="language-switcher" aria-label="Ask sheet language">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    className={`language-button ${lang === language.code ? 'is-selected' : ''}`}
                    onClick={() => setLang(language.code)}
                    lang={language.code}
                    style={{ fontFamily: FONT_FOR[language.code] }}
                  >
                    {language.label}
                  </button>
                ))}
              </div>

              <p
                lang={lang}
                style={{ fontFamily: FONT_FOR[lang] }}
                className="action-message"
              >
                {askIn(action, lang)}
              </p>
            </>
          ) : (
            <p className="action-message">{line.basis}</p>
          )}

          <p className="action-basis">
            {action?.kind === 'doctor_question'
              ? 'Only the treating doctor can answer and sign this. The system does not write the answer.'
              : line.basis}
          </p>

          {line.bucket === 'C' && (
            <button
              type="button"
              className="primary-action action-confirm"
              onClick={() => onResolve(line.reason)}
            >
              {action?.kind === 'doctor_question'
                ? 'Doctor answered and signed'
                : 'The ward handed it over'}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="m3 8.2 3.1 3.1L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </article>
      </div>
    </section>
  );
}

function askIn(action: NonNullable<Disallowance['action']>, lang: LanguageCode): string {
  if (lang === 'kn') return action.ask_kn;
  if (lang === 'hi') return action.ask_hi;
  return action.ask;
}
