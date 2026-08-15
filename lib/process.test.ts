import { describe, expect, it } from 'vitest';
import { summariseProcess, type ProcessTrace } from './process';

describe('process telemetry', () => {
  it('reports model and local step ratios without blending them into quality', () => {
    const trace: ProcessTrace = {
      tool_calls: 0,
      model_calls: 1,
      steps: [
        { name: 'input_validation', latency_ms: 10 },
        { name: 'model_call', latency_ms: 80 },
        { name: 'response_parse', latency_ms: 10 },
      ],
      total_latency_ms: 100,
    };

    expect(summariseProcess(trace, 105)).toMatchObject({
      traceComplete: true,
      toolCalls: 0,
      modelCalls: 1,
      steps: 3,
      modelCallRatio: 0.8,
      localStepRatio: 0.2,
    });
  });

  it('marks missing telemetry as unmeasured', () => {
    expect(summariseProcess(undefined, 42)).toMatchObject({
      traceComplete: false,
      totalLatencyMs: 42,
      modelCallRatio: null,
    });
  });
});
