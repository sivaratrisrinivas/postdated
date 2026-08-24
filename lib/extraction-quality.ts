import type { Extraction } from './types';

export const UNREADABLE_BILL_ERROR =
  'The photograph did not yield a readable bill. Try a sharper, brighter page.';

/**
 * A live read that names a room but returns no charges is not a letter. Production
 * saw this as confidence=high, bill_lines=[], source=live, and the UI treated it as
 * "this read is complete." That is a failed read, not a ₹0 forecast.
 *
 * This function never invents line items. It only decides whether the model output
 * is enough to show.
 */
export function isUsableLiveExtraction(extraction: Extraction): boolean {
  const billed = extraction.bill_lines.reduce(
    (sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0),
    0,
  );
  return extraction.bill_lines.length > 0 && billed > 0;
}

export type LiveExtractionDecision =
  | { ok: true; extraction: Extraction; source: 'live' }
  | { ok: false; status: 422; error: string };

/** Empty or missing output is worth one more model call. A usable bill is not retried. */
export function shouldRetryLiveRead(extraction: Extraction | null): boolean {
  return extraction === null || !isUsableLiveExtraction(extraction);
}

/**
 * Called after the one allowed retry. An empty high-confidence bill is a failed
 * read: 422, never HTTP 200 wrapping that extraction, and never invented lines.
 */
export function decideLiveExtraction(extraction: Extraction): LiveExtractionDecision {
  if (isUsableLiveExtraction(extraction)) {
    return { ok: true, extraction, source: 'live' };
  }
  return { ok: false, status: 422, error: UNREADABLE_BILL_ERROR };
}
