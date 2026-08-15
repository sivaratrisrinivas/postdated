import { existsSync, readFileSync } from 'node:fs';

export const POSITION_BIAS_LIMIT = 0.1;
export const LENGTH_BIAS_LIMIT = 0.2;
export const MIN_PAIRWISE_REVIEWS = 20;

export type PresentationOrder = 'AB' | 'BA';
export type PairwiseChoice = 'A' | 'B' | 'tie';

export interface PairwiseReview {
  case_id: string;
  rubric_id: string;
  presentation_order: PresentationOrder;
  choice: PairwiseChoice;
  a_words: number;
  b_words: number;
  /** Evidence checklist completed before the preference decision. */
  evidence_codes: string[];
}

export interface BiasReport {
  status: 'unmeasured' | 'passed' | 'failed';
  reviews: number;
  firstPositionRate: number | null;
  positionBias: number | null;
  lengthBias: number | null;
  failures: string[];
}

/** Stable, seeded randomization prevents a scorer from learning that A is preferred. */
export function presentationOrder(seed: string): PresentationOrder {
  let hash = 2166136261;
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) % 2 === 0 ? 'AB' : 'BA';
}

export function evaluateBias(reviews: readonly PairwiseReview[]): BiasReport {
  const failures: string[] = [];
  for (const review of reviews) {
    if (review.evidence_codes.length === 0) failures.push(`${review.case_id}: no evidence checklist`);
    if (!Number.isInteger(review.a_words) || !Number.isInteger(review.b_words)) {
      failures.push(`${review.case_id}: output lengths must be integer word counts`);
    }
  }

  const decisive = reviews.filter((review) => review.choice !== 'tie');
  const firstPositionChoices = decisive.filter((review) =>
    review.presentation_order === 'AB' ? review.choice === 'A' : review.choice === 'B',
  ).length;
  const firstPositionRate = decisive.length === 0 ? null : firstPositionChoices / decisive.length;
  const positionBias = firstPositionRate === null ? null : Math.abs(firstPositionRate - 0.5);
  const lengthBias =
    decisive.length === 0
      ? null
      : decisive.reduce((sum, review) => {
          const chosen = review.choice === 'A' ? review.a_words : review.b_words;
          const other = review.choice === 'A' ? review.b_words : review.a_words;
          return sum + (chosen - other) / Math.max(chosen, other, 1);
        }, 0) / decisive.length;

  if (reviews.length > 0 && reviews.length < MIN_PAIRWISE_REVIEWS) {
    failures.push(`only ${reviews.length} pairwise reviews; need at least ${MIN_PAIRWISE_REVIEWS}`);
  }
  if (positionBias !== null && positionBias > POSITION_BIAS_LIMIT) {
    failures.push(`position bias ${(positionBias * 100).toFixed(1)}% exceeds 10%`);
  }
  if (lengthBias !== null && Math.abs(lengthBias) > LENGTH_BIAS_LIMIT) {
    failures.push(`length bias ${(lengthBias * 100).toFixed(1)}% exceeds 20%`);
  }

  return {
    status:
      reviews.length === 0 ? 'unmeasured' : failures.length === 0 ? 'passed' : 'failed',
    reviews: reviews.length,
    firstPositionRate,
    positionBias,
    lengthBias,
    failures,
  };
}

export function loadPairwiseReviews(path = process.env.POSTDATED_PAIRWISE_REVIEW_PATH): PairwiseReview[] {
  if (!path || !existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error('pairwise review file must contain an array');
  return parsed as PairwiseReview[];
}

export function printBiasReport(report: BiasReport): void {
  const format = (value: number | null) => (value === null ? 'unmeasured' : `${(value * 100).toFixed(1)}%`);
  console.log(
    `bias control: ${report.status}; ${report.reviews} pairwise reviews; ` +
      `first-position ${format(report.firstPositionRate)}, ` +
      `position bias ${format(report.positionBias)}, length bias ${format(report.lengthBias)}`,
  );
  for (const failure of report.failures) console.error(`  FAIL ${failure}`);
}
