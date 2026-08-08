import { describe, expect, it } from 'vitest';
import { SEEDED_SUMMARY_TEXT } from './fixture';
import { guard } from './guard';

/**
 * POSTDATED.md §9 is the most important section in the spec, and this is the code that
 * enforces it. The refusal is a demo beat, not an error path — a judge says "add that
 * the patient had a fever" and the system has to say no on stage.
 */

describe('guard — blocks clinical facts the record does not contain', () => {
  it('refuses the fever the judge asks for', () => {
    const verdict = guard('Patient had a fever on admission.', SEEDED_SUMMARY_TEXT);
    expect(verdict.allowed).toBe(false);
  });

  it('names the term it refused, so the refusal is legible on stage', () => {
    const verdict = guard('Patient had a fever on admission.', SEEDED_SUMMARY_TEXT);
    if (verdict.allowed) throw new Error('expected a block');
    expect(verdict.blocked_terms).toContain('fever');
  });

  it('converts the refusal into a question addressed to the treating doctor', () => {
    const verdict = guard('Patient had a fever on admission.', SEEDED_SUMMARY_TEXT);
    if (verdict.allowed) throw new Error('expected a block');
    expect(verdict.ask_the_doctor).toMatch(/doctor/i);
    expect(verdict.ask_the_doctor).toContain('fever');
  });

  it('refuses the upcoding sentence the earlier design would have written', () => {
    // "oral therapy failed, IV antibiotics required" — §9 names this exact example.
    const verdict = guard(
      'Oral therapy failed and IV antibiotics were required.',
      SEEDED_SUMMARY_TEXT,
    );
    expect(verdict.allowed).toBe(false);
  });

  it('refuses sepsis, which nothing in the record supports', () => {
    expect(guard('Findings consistent with sepsis.', SEEDED_SUMMARY_TEXT).allowed).toBe(false);
  });
});

describe('guard — permits what the record already says', () => {
  it('allows the diagnosis as written', () => {
    const verdict = guard(
      'Symptomatic cholelithiasis with chronic calculous cholecystitis.',
      SEEDED_SUMMARY_TEXT,
    );
    expect(verdict.allowed).toBe(true);
  });

  it('allows the procedure as written', () => {
    expect(guard('Laparoscopic cholecystectomy under GA.', SEEDED_SUMMARY_TEXT).allowed).toBe(true);
  });

  it('is not fooled by a negated mention', () => {
    // The summary says "No history of fever or jaundice". A substring match would read
    // that as licence to assert jaundice, which is exactly the failure this guards.
    const verdict = guard('Patient was jaundiced at admission.', SEEDED_SUMMARY_TEXT);
    expect(verdict.allowed).toBe(false);
  });
});

describe('guard — leaves the two permitted output types alone', () => {
  it('allows a document demand, which carries no clinical claim', () => {
    const verdict = guard(
      'Ask the nursing station for the indoor case papers before you leave.',
      SEEDED_SUMMARY_TEXT,
    );
    expect(verdict.allowed).toBe(true);
  });

  it('allows a question addressed to the doctor, even about a term not in the record', () => {
    // A question is not an assertion. This is the whole escape valve: the system may
    // ask about a fever, it may never state one.
    const verdict = guard(
      'Ask the treating doctor: does the record state whether there was fever?',
      SEEDED_SUMMARY_TEXT,
    );
    expect(verdict.allowed).toBe(true);
  });

  it('allows a rupee line, which is arithmetic and not clinical', () => {
    const verdict = guard(
      'Room rent exceeds eligible category (Single Private Room).',
      SEEDED_SUMMARY_TEXT,
    );
    expect(verdict.allowed).toBe(true);
  });
});

describe('guard — quotes the record back instead of claiming a term is absent', () => {
  it('names the negating sentence for a term the record rules out', () => {
    // Saying "fever is not in the record" invites a judge to point out that it is.
    // Quoting "No history of fever or jaundice" shows the guard reads negation.
    const verdict = guard('Patient had a fever on admission.', SEEDED_SUMMARY_TEXT);
    if (verdict.allowed) throw new Error('expected a block');
    expect(verdict.negations['fever']).toContain('No history of fever');
  });

  it('carries no negation for a term the record never mentions', () => {
    const verdict = guard('Findings consistent with sepsis.', SEEDED_SUMMARY_TEXT);
    if (verdict.allowed) throw new Error('expected a block');
    expect(verdict.negations['sepsis']).toBeUndefined();
  });
});

describe('guard — a doctor may add what the system may not', () => {
  it('allows a term once the treating doctor has confirmed and signed it', () => {
    const verdict = guard('Patient had a fever on admission.', SEEDED_SUMMARY_TEXT, ['fever']);
    expect(verdict.allowed).toBe(true);
  });
});
