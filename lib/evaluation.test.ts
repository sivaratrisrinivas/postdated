import { describe, expect, it } from 'vitest';
import { loadCorpus } from '../evals/corpus';
import { NIVA_BUPA_REASSURE_2 } from './policy';
import {
  evaluateLiveWorkflow,
  evaluateReferenceWorkflow,
  type EvaluationCase,
} from './evaluation';

function evaluationCase(pack: ReturnType<typeof loadCorpus>[number]): EvaluationCase {
  return {
    id: pack.groundTruth.id,
    source: pack.source,
    extraction: pack.groundTruth.extraction,
    guard_verdicts: pack.groundTruth.guard_verdicts,
    resolution: pack.groundTruth.resolution,
  };
}

describe('evaluation workflow contract', () => {
  it('passes the reference extraction through every product step', () => {
    const reports = loadCorpus().map((pack) =>
      evaluateReferenceWorkflow(evaluationCase(pack), NIVA_BUPA_REASSURE_2),
    );

    expect(reports.every((report) => report.failures.length === 0)).toBe(true);
    expect(reports.every((report) => Object.values(report.phasePassRates).every((rate) => rate === 1))).toBe(true);
  });

  it('fails live workflow evaluation when the model invents a clinical statement', () => {
    const pack = loadCorpus()[0];
    if (!pack) throw new Error('corpus is empty');
    const input = evaluationCase(pack);
    const actual = {
      ...input.extraction,
      clinical_statements: [...input.extraction.clinical_statements, 'Patient had sepsis'],
    };

    const report = evaluateLiveWorkflow(input, actual, NIVA_BUPA_REASSURE_2);

    expect(report.failures.some((failure) => failure.includes('live source grounding'))).toBe(true);
  });

  it('fails live workflow evaluation when a high-confidence empty bill would become a ₹0 letter', () => {
    const pack = loadCorpus()[0];
    if (!pack) throw new Error('corpus is empty');
    const emptyHighConfidence = {
      clinical_statements: [] as string[],
      bill_lines: [] as typeof pack.groundTruth.extraction.bill_lines,
      room: { category_as_billed: 'Deluxe Single Room', rate_per_day: 8000, nights: 4 },
      missing_documents: [] as string[],
      unestablished: [] as string[],
      ped_trigger_phrases: [] as string[],
      confidence: 'high' as const,
    };

    const report = evaluateLiveWorkflow(evaluationCase(pack), emptyHighConfidence, NIVA_BUPA_REASSURE_2);

    expect(report.failures.some((failure) => failure.includes('finished ₹0 letter'))).toBe(true);
    expect(report.baseline.claimed).toBe(0);
    expect(report.baseline.disallowed).toBe(0);
  });
});
