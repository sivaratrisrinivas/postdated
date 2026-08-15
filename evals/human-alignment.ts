import { existsSync, readFileSync } from 'node:fs';
import { RUBRIC_VERSION, rubricIds, type RubricId } from './rubric.ts';

export const HUMAN_ALIGNMENT_THRESHOLD = 0.8;
export const MIN_HUMAN_ALIGNMENT_DECISIONS = 20;

export type ReviewDecision = 'pass' | 'fail';

export interface HumanAlignmentReview {
  case_id: string;
  rubric_id: RubricId;
  automated_decision: ReviewDecision;
  human_decision: ReviewDecision;
  expert_decision: ReviewDecision;
  /** Concise rubric evidence recorded before the decision; never hidden chain-of-thought. */
  evidence_codes: string[];
}

export interface HumanAlignmentReport {
  status: 'unmeasured' | 'passed' | 'failed';
  rubricVersion: string;
  decisions: number;
  humanAgreement: number | null;
  expertAgreement: number | null;
  humanExpertAgreement: number | null;
  failures: string[];
}

export function evaluateHumanAlignment(
  reviews: readonly HumanAlignmentReview[],
): HumanAlignmentReport {
  const failures: string[] = [];
  const validRubrics = new Set(rubricIds());
  for (const review of reviews) {
    if (!validRubrics.has(review.rubric_id)) {
      failures.push(`${review.case_id}: unknown rubric ${review.rubric_id}`);
    }
    if (review.evidence_codes.length === 0) {
      failures.push(`${review.case_id}: decision has no evidence code`);
    }
  }

  const humanAgreement = agreement(reviews, 'automated_decision', 'human_decision');
  const expertAgreement = agreement(reviews, 'automated_decision', 'expert_decision');
  const humanExpertAgreement = agreement(reviews, 'human_decision', 'expert_decision');
  if (reviews.length > 0 && reviews.length < MIN_HUMAN_ALIGNMENT_DECISIONS) {
    failures.push(
      `only ${reviews.length} decisions; need at least ${MIN_HUMAN_ALIGNMENT_DECISIONS} before claiming alignment`,
    );
  }
  if (expertAgreement !== null && expertAgreement < HUMAN_ALIGNMENT_THRESHOLD) {
    failures.push(`automated/expert agreement ${(expertAgreement * 100).toFixed(1)}% is below 80%`);
  }
  if (humanAgreement !== null && humanAgreement < HUMAN_ALIGNMENT_THRESHOLD) {
    failures.push(`automated/human agreement ${(humanAgreement * 100).toFixed(1)}% is below 80%`);
  }

  return {
    status:
      reviews.length === 0
        ? 'unmeasured'
        : failures.length === 0
          ? 'passed'
          : 'failed',
    rubricVersion: RUBRIC_VERSION,
    decisions: reviews.length,
    humanAgreement,
    expertAgreement,
    humanExpertAgreement,
    failures,
  };
}

export function loadHumanAlignmentReviews(path = process.env.POSTDATED_HUMAN_ALIGNMENT_PATH): HumanAlignmentReview[] {
  if (!path || !existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error('human alignment file must contain an array');
  return parsed as HumanAlignmentReview[];
}

export function printHumanAlignmentReport(report: HumanAlignmentReport): void {
  const format = (value: number | null) => (value === null ? 'unmeasured' : `${(value * 100).toFixed(1)}%`);
  console.log(
    `human alignment: ${report.status}; ${report.decisions} decisions; ` +
      `human ${format(report.humanAgreement)}, expert ${format(report.expertAgreement)}, ` +
      `human↔expert ${format(report.humanExpertAgreement)}`,
  );
  for (const failure of report.failures) console.error(`  FAIL ${failure}`);
}

function agreement(
  reviews: readonly HumanAlignmentReview[],
  left: 'automated_decision' | 'human_decision',
  right: 'automated_decision' | 'human_decision' | 'expert_decision',
): number | null {
  if (reviews.length === 0) return null;
  const matches = reviews.filter((review) => review[left] === review[right]).length;
  return matches / reviews.length;
}
