import { computeForecast } from './deduct';
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

/**
 * One physical action, then a re-read, then the final result. Remaining Bucket C
 * lines stay visible on that result; they do not send the user back into another
 * "open the fix" loop.
 */
export function applySuccessfulRescan(input: {
  nextExtraction: Extraction;
  policy: Policy;
  resolvedLines: readonly Disallowance[];
  nextSource: ProvenanceSource;
  nextLatency: number | null;
}): {
  extraction: Extraction;
  source: ProvenanceSource;
  latency: number | null;
  resolvedLines: Disallowance[];
  resolved: string[];
  status: 'complete';
} {
  const nextForecast = computeForecast(input.nextExtraction, input.policy);
  const resolvedHistory = input.resolvedLines.filter(
    (oldLine) => !nextForecast.lines.some((newLine) => equivalentLine(oldLine, newLine)),
  );

  return {
    extraction: input.nextExtraction,
    source: input.nextSource,
    latency: input.nextLatency,
    resolvedLines: resolvedHistory,
    resolved: resolvedHistory.map((line) => line.reason),
    status: 'complete',
  };
}
