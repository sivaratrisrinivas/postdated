import { describe, expect, it } from 'vitest';
import { evaluateBias, presentationOrder } from './bias.eval';
import {
  evaluateHumanAlignment,
  MIN_HUMAN_ALIGNMENT_DECISIONS,
  type HumanAlignmentReview,
} from './human-alignment';
import { EVAL_RUBRIC } from './rubric';

describe('evaluation rubric and review controls', () => {
  it('has unique criteria with concrete pass and fail examples', () => {
    const ids = EVAL_RUBRIC.map((criterion) => criterion.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(EVAL_RUBRIC.every((criterion) => criterion.pass_example && criterion.fail_example)).toBe(true);
    expect(ids).toContain('safety.usable_read');
  });

  it('does not claim human alignment from a tiny sample', () => {
    const review: HumanAlignmentReview = {
      case_id: 'case-01',
      rubric_id: 'safety.source_grounding',
      automated_decision: 'pass',
      human_decision: 'pass',
      expert_decision: 'pass',
      evidence_codes: ['source_span'],
    };
    const report = evaluateHumanAlignment([review]);
    expect(report.status).toBe('failed');
    expect(report.failures[0]).toContain(`${MIN_HUMAN_ALIGNMENT_DECISIONS}`);
  });

  it('detects a position-biased pairwise review set', () => {
    const reviews = Array.from({ length: 20 }, (_, index) => ({
      case_id: `case-${index}`,
      rubric_id: 'task.next_action',
      presentation_order: presentationOrder(`case-${index}`),
      choice: presentationOrder(`case-${index}`) === 'AB' ? ('A' as const) : ('B' as const),
      a_words: 10,
      b_words: 10,
      evidence_codes: ['actionability'],
    }));
    const report = evaluateBias(reviews);
    expect(report.status).toBe('failed');
    expect(report.positionBias).toBeGreaterThan(0.1);
  });
});
