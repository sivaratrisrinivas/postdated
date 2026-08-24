import { computeForecast } from './deduct';
import { isUsableLiveExtraction, UNREADABLE_BILL_ERROR } from './extraction-quality';
import type { Policy } from './policy';
import type { Disallowance, Extraction, Forecast } from './types';

export type JourneyStatus = 'idle' | 'ready' | 'rescan' | 'complete';
export type JourneyStage = 'policy' | 'capture' | 'forecast' | 'action' | 'rescan' | 'complete';
export type CaptureMode = 'custom' | 'demo' | 'rescan';
export type ProvenanceSource = 'live' | 'fixture' | 'demo';

export function stageFor(input: {
  hasPolicy: boolean;
  hasActiveLine: boolean;
  status: JourneyStatus;
}): JourneyStage {
  if (!input.hasPolicy) return 'policy';
  if (input.hasActiveLine) return 'action';
  if (input.status === 'rescan') return 'rescan';
  if (input.status === 'complete') return 'complete';
  if (input.status === 'ready') return 'forecast';
  return 'capture';
}

export function provenanceSource(
  routeSource: string | undefined,
  mode: CaptureMode,
): ProvenanceSource {
  if (routeSource === 'live') return 'live';
  return mode === 'demo' ? 'demo' : 'fixture';
}

export function shouldUseDemoFallback(mode: CaptureMode): boolean {
  return mode === 'demo';
}

export function equivalentLine(left: Disallowance, right: Disallowance): boolean {
  return (
    left.reason === right.reason ||
    (left.action?.kind === right.action?.kind && left.action?.ask === right.action?.ask)
  );
}

export function withGreyedLines(
  forecast: Forecast,
  resolvedLines: readonly Disallowance[],
): Forecast {
  const currentReasons = new Set(forecast.lines.map((line) => line.reason));
  const greyedLines = resolvedLines.filter((line) => !currentReasons.has(line.reason));
  return greyedLines.length > 0
    ? { ...forecast, lines: [...forecast.lines, ...greyedLines] }
    : forecast;
}

export type ApplyInitialReadResult =
  | { ok: true; status: 'ready' }
  | { ok: false; error: string; status: 'idle' };

export type ApplyRescanResult =
  | {
      ok: true;
      extraction: Extraction;
      source: ProvenanceSource;
      latency: number | null;
      resolvedLines: Disallowance[];
      resolved: string[];
      status: 'ready' | 'complete';
    }
  | { ok: false; error: string; status: 'rescan' };

/**
 * A high-confidence empty bill is a failed read. Do not open a ₹0 forecast or
 * mark the journey complete — the capture screen should offer another photograph.
 */
export function applySuccessfulInitialRead(extraction: Extraction): ApplyInitialReadResult {
  if (!isUsableLiveExtraction(extraction)) {
    return { ok: false, error: UNREADABLE_BILL_ERROR, status: 'idle' };
  }
  return { ok: true, status: 'ready' };
}

/**
 * After an amended read, keep any lines the new extraction no longer supports.
 * If a Bucket C line is still open, return to the forecast so the next fix can
 * run — the working fixture path is ₹1,73,000 → ₹88,000 → ₹48,000. Only when
 * nothing recoverable remains does the journey open the final-result screen.
 *
 * An empty high-confidence bill never reaches computeForecast. That path used
 * to finish a ₹0 letter because claimed=0 leaves no Bucket C line.
 */
export function applySuccessfulRescan(input: {
  nextExtraction: Extraction;
  policy: Policy;
  resolvedLines: readonly Disallowance[];
  nextSource: ProvenanceSource;
  nextLatency: number | null;
}): ApplyRescanResult {
  if (!isUsableLiveExtraction(input.nextExtraction)) {
    return { ok: false, error: UNREADABLE_BILL_ERROR, status: 'rescan' };
  }

  const nextForecast = computeForecast(input.nextExtraction, input.policy);
  const resolvedHistory = input.resolvedLines.filter(
    (oldLine) => !nextForecast.lines.some((newLine) => equivalentLine(oldLine, newLine)),
  );
  const nextResolved = resolvedHistory.map((line) => line.reason);
  const stillOpen = nextForecast.lines.some(
    (line) => line.bucket === 'C' && !nextResolved.includes(line.reason),
  );

  return {
    ok: true,
    extraction: input.nextExtraction,
    source: input.nextSource,
    latency: input.nextLatency,
    resolvedLines: resolvedHistory,
    resolved: nextResolved,
    status: stillOpen ? 'ready' : 'complete',
  };
}
