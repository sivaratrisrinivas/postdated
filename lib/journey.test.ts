import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { amendDemoExtraction, DEMO_CASES } from './demo';
import { computeForecast } from './deduct';
import { SEEDED_EXTRACTION } from './fixture';
import {
  applySuccessfulRescan,
  provenanceSource,
  shouldUseDemoFallback,
  stageFor,
  withGreyedLines,
} from './journey';
import { NIVA_BUPA_REASSURE_2 } from './policy';

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

describe('one-action demo journey', () => {
  it('keeps the committed public sample files on disk', () => {
    expect(existsSync(path.join(process.cwd(), 'public/samples/discharge-summary-photo.jpg'))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), 'public/samples/discharge-summary.pdf'))).toBe(true);
    expect(existsSync(path.join(process.cwd(), 'public/brand/postdated-mark.png'))).toBe(true);
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
      const after = applySuccessfulRescan({
        nextExtraction: amended,
        policy: NIVA_BUPA_REASSURE_2,
        resolvedLines: [action],
        nextSource: 'demo',
        nextLatency: null,
      });
      const display = withGreyedLines(
        computeForecast(after.extraction, NIVA_BUPA_REASSURE_2),
        after.resolvedLines,
      );

      expect(after.status).toBe('complete');
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
