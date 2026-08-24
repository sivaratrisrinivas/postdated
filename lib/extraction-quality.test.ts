import { describe, expect, it } from 'vitest';
import {
  decideLiveExtraction,
  isUsableLiveExtraction,
  shouldRetryLiveRead,
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

  it('retries an empty high-confidence read once, not a usable bill', () => {
    expect(shouldRetryLiveRead(null)).toBe(true);
    expect(shouldRetryLiveRead(emptyHighConfidence)).toBe(true);
    expect(shouldRetryLiveRead(SEEDED_EXTRACTION)).toBe(false);
  });
});

describe('decideLiveExtraction', () => {
  it('returns 422 after retry when bill_lines is still empty at high confidence', () => {
    const decision = decideLiveExtraction({ ...emptyHighConfidence, bill_lines: [], confidence: 'high' });
    expect(decision.ok).toBe(false);
    if (decision.ok) throw new Error('empty high-confidence bill must not pass');
    expect(decision.status).toBe(422);
    expect(decision.error).toBe(UNREADABLE_BILL_ERROR);
    expect(decision).not.toHaveProperty('extraction');
  });

  it('does not invent charges to make an empty read look full', () => {
    const decision = decideLiveExtraction(emptyHighConfidence);
    expect(decision.ok).toBe(false);
    if (decision.ok) throw new Error('empty read must not pass');
    expect(decision.error).toBe(UNREADABLE_BILL_ERROR);
  });

  it('fails a custom upload instead of substituting the seeded bill', () => {
    const decision = decideLiveExtraction(emptyHighConfidence);
    expect(decision).toEqual({ ok: false, status: 422, error: UNREADABLE_BILL_ERROR });
  });

  it('keeps a usable live read as live', () => {
    const decision = decideLiveExtraction(SEEDED_EXTRACTION);
    expect(decision).toEqual({
      ok: true,
      extraction: SEEDED_EXTRACTION,
      source: 'live',
    });
  });
});
