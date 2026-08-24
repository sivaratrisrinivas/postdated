import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { amendDemoExtraction, DEMO_CASES } from './demo';
import { computeForecast } from './deduct';
import { UNREADABLE_BILL_ERROR } from './extraction-quality';
import { SEEDED_EXTRACTION } from './fixture';
import {
  applySuccessfulInitialRead,
  applySuccessfulRescan,
  provenanceSource,
  shouldUseDemoFallback,
  stageFor,
  withGreyedLines,
} from './journey';
import { NIVA_BUPA_REASSURE_2 } from './policy';
import type { Extraction } from './types';

function mustApply(result: ReturnType<typeof applySuccessfulRescan>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected a usable extraction to apply');
  return result;
}

describe('stageFor', () => {
  it('keeps a rescan on the re-photograph screen even while the image is being read', () => {
    expect(
      stageFor({ hasPolicy: true, hasActiveLine: false, status: 'rescan' }),
    ).toBe('rescan');
  });

  it('does not jump back to capture after one action has been confirmed', () => {
    expect(
      stageFor({ hasPolicy: true, hasActiveLine: false, status: 'complete' }),
    ).toBe('complete');
  });

  it('opens the ask sheet over every other post-policy stage', () => {
    expect(stageFor({ hasPolicy: true, hasActiveLine: true, status: 'ready' })).toBe('action');
    expect(stageFor({ hasPolicy: true, hasActiveLine: true, status: 'rescan' })).toBe('action');
  });
});

describe('provenanceSource', () => {
  it('labels a demo case without a live read as a demo, not a silent fixture', () => {
    expect(provenanceSource('fixture_no_key', 'demo')).toBe('demo');
    expect(provenanceSource('fixture_error', 'demo')).toBe('demo');
    expect(provenanceSource('fixture_unreadable', 'demo')).toBe('demo');
  });

  it('never relabels a custom upload as a demo case', () => {
    expect(provenanceSource('fixture_no_key', 'custom')).toBe('fixture');
    expect(provenanceSource('live', 'custom')).toBe('live');
  });
});

describe('shouldUseDemoFallback', () => {
  it('allows a fallback only for committed demo cases', () => {
    expect(shouldUseDemoFallback('demo')).toBe(true);
    expect(shouldUseDemoFallback('custom')).toBe(false);
    expect(shouldUseDemoFallback('rescan')).toBe(false);
  });
});

describe('committed demo journey', () => {
  it('keeps the committed public sample files on disk', () => {
    expect(existsSync(path.join(process.cwd(), 'public/samples/discharge-summary-photo.jpg'))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), 'public/samples/discharge-summary.pdf'))).toBe(true);
    expect(existsSync(path.join(process.cwd(), 'public/brand/postdated-mark.png'))).toBe(true);
  });

  it('opens every committed demo case, including the public JPG and PDF', () => {
    for (const demoCase of DEMO_CASES) {
      expect(applySuccessfulInitialRead(demoCase.fallback)).toEqual({ ok: true, status: 'ready' });
      expect(demoCase.fallback.bill_lines.length).toBeGreaterThan(0);
    }
  });

  it('walks the fixture path ₹1,73,000 → ₹88,000 → ₹48,000', () => {
    const first = computeForecast(SEEDED_EXTRACTION, NIVA_BUPA_REASSURE_2);
    const indoor = first.lines.find((line) => line.reason.includes('Indoor case papers'));
    const admission = first.lines.find((line) => line.reason.includes('inpatient admission'));
    if (!indoor || !admission) throw new Error('fixture should have both recoverable lines');

    const afterIndoor = mustApply(
      applySuccessfulRescan({
        nextExtraction: amendDemoExtraction(SEEDED_EXTRACTION, indoor),
        policy: NIVA_BUPA_REASSURE_2,
        resolvedLines: [indoor],
        nextSource: 'demo',
        nextLatency: null,
      }),
    );
    expect(afterIndoor.status).toBe('ready');
    expect(computeForecast(afterIndoor.extraction, NIVA_BUPA_REASSURE_2).disallowed).toBe(88_000);

    const afterAdmission = mustApply(
      applySuccessfulRescan({
        nextExtraction: amendDemoExtraction(afterIndoor.extraction, admission),
        policy: NIVA_BUPA_REASSURE_2,
        resolvedLines: [...afterIndoor.resolvedLines, admission],
        nextSource: 'demo',
        nextLatency: null,
      }),
    );
    expect(afterAdmission.status).toBe('complete');
    expect(computeForecast(afterAdmission.extraction, NIVA_BUPA_REASSURE_2).disallowed).toBe(48_000);
  });

  it('completes every committed demo case without a live key', () => {
    for (const demoCase of DEMO_CASES) {
      const before = computeForecast(demoCase.fallback, NIVA_BUPA_REASSURE_2);
      const action = before.lines.find((line) => line.bucket === 'C');
      if (!action) throw new Error(`${demoCase.id} should have a recoverable line`);
      expect(action.action?.ask).toBeTruthy();
      expect(action.action?.ask_kn).toMatch(/[\u0C80-\u0CFF]/);
      expect(action.action?.ask_hi).toMatch(/[\u0900-\u097F]/);

      const amended = amendDemoExtraction(demoCase.fallback, action);
      const after = mustApply(
        applySuccessfulRescan({
          nextExtraction: amended,
          policy: NIVA_BUPA_REASSURE_2,
          resolvedLines: [action],
          nextSource: 'demo',
          nextLatency: null,
        }),
      );
      const display = withGreyedLines(
        computeForecast(after.extraction, NIVA_BUPA_REASSURE_2),
        after.resolvedLines,
      );

      expect(after.status).toBe('ready');
      expect(after.resolved).toEqual([action.reason]);
      expect(display.disallowed).toBe(88_000);
      expect(display.approved).toBe(152_000);
      expect(display.lines.some((line) => line.reason === action.reason)).toBe(true);
      expect(computeForecast(after.extraction, NIVA_BUPA_REASSURE_2).disallowed).toBe(88_000);
    }
  });

  it('keeps Bucket A visible after the indoor-case-papers line is cleared', () => {
    const before = computeForecast(SEEDED_EXTRACTION, NIVA_BUPA_REASSURE_2);
    const indoor = before.lines.find((line) => line.reason.includes('Indoor case papers'));
    if (!indoor) throw new Error('seeded letter should include indoor case papers');

    const after = computeForecast(amendDemoExtraction(SEEDED_EXTRACTION, indoor), NIVA_BUPA_REASSURE_2);
    const bucketA = after.lines.filter((line) => line.bucket === 'A').reduce((sum, line) => sum + line.amount, 0);
    expect(bucketA).toBe(48_000);
    expect(after.lines.some((line) => line.reason.includes('inpatient admission'))).toBe(true);
  });
});

describe('empty high-confidence live read', () => {
  const emptyHighConfidence: Extraction = {
    clinical_statements: [],
    bill_lines: [],
    room: { category_as_billed: 'Deluxe Single Room', rate_per_day: 8000, nights: 4 },
    missing_documents: [],
    unestablished: [],
    ped_trigger_phrases: [],
    confidence: 'high',
  };

  it('does not finish a ₹0 letter from { bill_lines: [], confidence: high }', () => {
    const initial = applySuccessfulInitialRead(emptyHighConfidence);
    expect(initial.ok).toBe(false);
    if (initial.ok) throw new Error('empty high-confidence bill must not open a forecast');
    expect(initial.status).not.toBe('complete');
    expect(initial.status).toBe('idle');
    expect(initial.error).toBe(UNREADABLE_BILL_ERROR);

    const rescan = applySuccessfulRescan({
      nextExtraction: emptyHighConfidence,
      policy: NIVA_BUPA_REASSURE_2,
      resolvedLines: [],
      nextSource: 'live',
      nextLatency: 657,
    });
    expect(rescan.ok).toBe(false);
    if (rescan.ok) throw new Error('empty high-confidence bill must not apply');
    expect(rescan.status).not.toBe('complete');
    expect(rescan.status).toBe('rescan');
    expect(rescan.error).toBe(UNREADABLE_BILL_ERROR);
    expect(rescan).not.toHaveProperty('extraction');

    // The old path: computeForecast on this payload claims ₹0 and has no Bucket C,
    // so applySuccessfulRescan used to mark the journey complete.
    const naive = computeForecast(emptyHighConfidence, NIVA_BUPA_REASSURE_2);
    expect(naive.claimed).toBe(0);
    expect(naive.disallowed).toBe(0);
    expect(naive.lines.some((line) => line.bucket === 'C')).toBe(false);
  });
});
