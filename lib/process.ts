export interface ProcessStep {
  name: string;
  latency_ms: number;
}

export interface ProcessTrace {
  tool_calls: number;
  model_calls: number;
  steps: ProcessStep[];
  total_latency_ms: number;
}

export interface ProcessSummary {
  traceComplete: boolean;
  toolCalls: number;
  modelCalls: number;
  steps: number;
  totalLatencyMs: number;
  modelCallRatio: number | null;
  localStepRatio: number | null;
  stepRatios: Record<string, number>;
}

/**
 * Turn route telemetry into comparable process metrics. The eval never treats a fast
 * answer as a good answer; these numbers only explain where time and calls went.
 */
export function summariseProcess(
  trace: ProcessTrace | undefined,
  measuredLatencyMs: number,
): ProcessSummary {
  if (
    !trace ||
    !Array.isArray(trace.steps) ||
    !Number.isFinite(trace.total_latency_ms) ||
    trace.total_latency_ms < 0
  ) {
    return {
      traceComplete: false,
      toolCalls: 0,
      modelCalls: 0,
      steps: 0,
      totalLatencyMs: measuredLatencyMs,
      modelCallRatio: null,
      localStepRatio: null,
      stepRatios: {},
    };
  }

  const totalLatencyMs = Math.max(trace.total_latency_ms, 0);
  const measuredStepLatency = trace.steps.reduce(
    (sum, step) => sum + (Number.isFinite(step.latency_ms) && step.latency_ms >= 0 ? step.latency_ms : 0),
    0,
  );
  const modelCallLatency = trace.steps
    .filter((step) => step.name === 'model_call')
    .reduce((sum, step) => sum + step.latency_ms, 0);
  const stepRatios = Object.fromEntries(
    trace.steps.map((step) => [step.name, totalLatencyMs === 0 ? 0 : step.latency_ms / totalLatencyMs]),
  );

  return {
    traceComplete:
      Number.isFinite(trace.tool_calls) &&
      trace.tool_calls >= 0 &&
      Number.isFinite(trace.model_calls) &&
      trace.model_calls >= 0 &&
      trace.steps.every((step) => Number.isFinite(step.latency_ms) && step.latency_ms >= 0) &&
      measuredStepLatency <= totalLatencyMs + 5,
    toolCalls: trace.tool_calls,
    modelCalls: trace.model_calls,
    steps: trace.steps.length,
    totalLatencyMs,
    modelCallRatio: totalLatencyMs === 0 ? 0 : modelCallLatency / totalLatencyMs,
    localStepRatio: totalLatencyMs === 0 ? 0 : Math.max(0, totalLatencyMs - modelCallLatency) / totalLatencyMs,
    stepRatios,
  };
}
