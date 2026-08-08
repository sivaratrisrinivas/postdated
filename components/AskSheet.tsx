'use client';

import { useState } from 'react';
import type { Disallowance } from '@/lib/types';

/**
 * What the user physically does. CONTEXT.md: "Rendered EN / KN / HI, designed to be
 * held up to a ward clerk." So the type is big, there is exactly one instruction on
 * screen, and the language switch is one tap.
 *
 * Two output types only, per §9 — a document demand, or a question for the doctor.
 * There is no third tab and there is nowhere to type a clinical sentence.
 */

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]['code'];

/**
 * Indic scripts get their bundled face. Without it the Kannada conjuncts shape as
 * separate glyphs on any device lacking a system Kannada font, which is visibly wrong
 * to the clerk this sheet is held up to.
 */
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

export function AskSheet({ line, onResolve, onClose }: AskSheetProps) {
  const [lang, setLang] = useState<LanguageCode>('en');
  const action = line.action;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-black/8 px-5 pb-4 pt-5">
          <div>
            <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#1A7A3C]">
              {action?.kind === 'doctor_question' ? 'Ask the doctor' : 'Ask the ward'}
            </p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#C1121F]">
              ₹{line.amount.toLocaleString('en-IN')}
            </p>
            <p className="mt-0.5 text-[0.82rem] leading-snug text-black/70">{line.reason}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-lg p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          </button>
        </div>

        {action ? (
          <>
            <div className="flex gap-1 px-5 pt-4">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`rounded-full px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] transition-colors ${
                    lang === l.code
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-black/5 text-black/55 hover:bg-black/10'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Hold-up-to-a-clerk view. Nothing else competes with it. */}
            <p
              lang={lang}
              style={{ fontFamily: FONT_FOR[lang] }}
              className="px-5 py-6 text-[1.4rem] font-semibold leading-relaxed tracking-tight text-[#1A1A1A]"
            >
              {askIn(action, lang)}
            </p>
          </>
        ) : (
          <p className="px-5 py-6 text-[0.9rem] leading-relaxed text-black/60">
            {line.basis}
          </p>
        )}

        <div className="space-y-3 border-t border-black/8 px-5 py-4">
          <p className="font-mono text-[0.62rem] leading-relaxed text-black/45">{line.basis}</p>

          {line.bucket === 'C' && (
            <button
              type="button"
              onClick={() => {
                onResolve(line.reason);
                onClose();
              }}
              className="w-full rounded-xl bg-[#1A7A3C] px-4 py-3.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#166832]"
            >
              {action?.kind === 'doctor_question'
                ? 'Doctor answered and signed'
                : 'Ward handed it over'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function askIn(
  action: NonNullable<Disallowance['action']>,
  lang: LanguageCode,
): string {
  if (lang === 'kn') return action.ask_kn;
  if (lang === 'hi') return action.ask_hi;
  return action.ask;
}
