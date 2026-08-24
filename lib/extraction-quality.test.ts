import { describe, expect, it } from 'vitest';
import {
  decideLiveExtraction,
  isUsableLiveExtraction,
  UNREADABLE_BILL_ERROR,
} from './extraction-quality';
import { SEEDED_EXTRACTION } from './fixture';
import type { Extraction } from './types';

/** The live production POST that returned 200 with an empty bill at high confidence. */
const emptyHighConfidence: Extraction = {
  clinical_statements: [],
  bill_lines: [],
  room: { category_as_billed: 'Deluxe Single Room', rate_per_day: 8000, nights: 4 },
  missing_documents: [],
  unestablished: [],
  ped_trigger_phrases: [],
  confidence: 'high',
};

describe('isUsableLiveExtraction', () => {
  it('rejects a high-confidence empty bill', () => {
    expect(isUsableLiveExtraction(emptyHighConfidence)).toBe(false);
  });

  it('rejects bill lines that sum to zero', () => {
    expect(
      isUsableLiveExtraction({
        ...emptyHighConfidence,
        bill_lines: [{ head: 'misc', label: 'Registration', amount: 0 }],
      }),
    ).toBe(false);
  });

  it('accepts the committed fixture', () => {
    expect(isUsableLiveExtraction(SEEDED_EXTRACTION)).toBe(true);
  });

  it('does not invent charges to make an empty read look full', () => {
    const decision = decideLiveExtraction(emptyHighConfidence, false);
    expect(decision.ok).toBe(false);
    if (decision.ok) throw new Error('empty read must not pass');
    expect(decision.error).toBe(UNREADABLE_BILL_ERROR);
  });
});

describe('decideLiveExtraction', () => {
  it('fails a custom upload instead of substituting the seeded bill', () => {
    const decision = decideLiveExtraction(emptyHighConfidence, false);
    expect(decision).toEqual({ ok: false, status: 422, error: UNREADABLE_BILL_ERROR });
  });

  it('lets a demo case use the committed extraction when the live page is empty', () => {
    const decision = decideLiveExtraction(emptyHighConfidence, true);
    expect(decision).toEqual({
      ok: true,
      extraction: SEEDED_EXTRACTION,
      source: 'fixture_unreadable',
    });
  });

  it('keeps a usable live read as live', () => {
    const decision = decideLiveExtraction(SEEDED_EXTRACTION, false);
    expect(decision).toEqual({
      ok: true,
      extraction: SEEDED_EXTRACTION,
      source: 'live',
    });
  });
});
