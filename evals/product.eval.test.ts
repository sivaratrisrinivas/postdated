import { afterEach, describe, expect, it } from 'vitest';
import { POST } from '../app/api/extract/route';
import { UNREADABLE_BILL_ERROR } from '../lib/extraction-quality';
import { SEEDED_EXTRACTION } from '../lib/fixture';
import { liveExtractMissingKeyError } from '../lib/reader';
import {
  PRODUCTION_EMPTY_HIGH_CONFIDENCE,
  runProductEval,
  scoreUsableReadGate,
} from './product.eval';

describe('product-chain eval', () => {
  it('passes the current read→letter, fixture-path, and guard gates', () => {
    const report = runProductEval();

    expect(report.status).toBe('passed');
    expect(report.failures).toEqual([]);
    expect(report.checks).toBeGreaterThanOrEqual(20);
  });

  it('fails if the production empty bill is accepted as a live letter', () => {
    const failures = scoreUsableReadGate({
      extraction: PRODUCTION_EMPTY_HIGH_CONFIDENCE,
      decision: {
        ok: true,
        extraction: PRODUCTION_EMPTY_HIGH_CONFIDENCE,
        source: 'live',
      },
      initial: { ok: true, status: 'ready' },
      rescan: {
        ok: true,
        extraction: PRODUCTION_EMPTY_HIGH_CONFIDENCE,
        source: 'live',
        latency: 657,
        resolvedLines: [],
        resolved: [],
        status: 'complete',
      },
    });

    expect(failures.some((failure) => failure.includes('finished ₹0 letter'))).toBe(true);
    expect(failures.some((failure) => failure.includes('opened a forecast'))).toBe(true);
    expect(failures.some((failure) => failure.includes('finished a ₹0 letter'))).toBe(true);
  });

  it('fails if an empty live read is filled with invented bill lines', () => {
    const failures = scoreUsableReadGate({
      extraction: PRODUCTION_EMPTY_HIGH_CONFIDENCE,
      decision: { ok: true, extraction: SEEDED_EXTRACTION, source: 'live' },
      initial: { ok: true, status: 'ready' },
      rescan: {
        ok: true,
        extraction: SEEDED_EXTRACTION,
        source: 'live',
        latency: null,
        resolvedLines: [],
        resolved: [],
        status: 'ready',
      },
    });

    expect(failures.some((failure) => failure.includes('invented bill lines'))).toBe(true);
  });

  it('passes only a 422 failed-read triple for the production payload', () => {
    expect(
      scoreUsableReadGate({
        extraction: PRODUCTION_EMPTY_HIGH_CONFIDENCE,
        decision: { ok: false, status: 422, error: UNREADABLE_BILL_ERROR },
        initial: { ok: false, error: UNREADABLE_BILL_ERROR, status: 'idle' },
        rescan: { ok: false, error: UNREADABLE_BILL_ERROR, status: 'rescan' },
      }),
    ).toEqual([]);
  });
});

describe('custom upload without a live key', () => {
  const previous = process.env.CEREBRAS_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.CEREBRAS_API_KEY;
    else process.env.CEREBRAS_API_KEY = previous;
  });

  it('returns 503 and never the seeded fixture', async () => {
    delete process.env.CEREBRAS_API_KEY;
    const response = await POST(
      new Request('http://localhost/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: 'aGVsbG8=', media_type: 'image/jpeg' }),
      }),
    );
    const body = (await response.json()) as { error?: string; extraction?: unknown; source?: string };

    expect(response.status).toBe(503);
    expect(body.extraction).toBeUndefined();
    expect(body.source).toBeUndefined();
    expect(body.error).toBe(liveExtractMissingKeyError());
  });
});
