import { computeForecast } from './deduct';
import { isUsableLiveExtraction } from './extraction-quality';
import { guard } from './guard';
import type { Extraction, Forecast } from './types';
import type { Policy } from './policy';

export interface EvaluationGuardVerdict {
  candidate: string;
  allowed: boolean;
  negation?: string;
}

export interface EvaluationResolution {
  old_missing_documents: string[];
  old_unestablished: string[];
  fixed: { kind: 'missing_document' | 'unestablished'; value: string };
  expected_cleared_reasons: string[];
}

export interface EvaluationCase {
  id: string;
  source: string;
  extraction: Extraction;
  guard_verdicts: readonly EvaluationGuardVerdict[];
  resolution: EvaluationResolution;
}

export interface WorkflowEvaluation {
  id: string;
  checks: number;
  passed: number;
  failures: string[];
  phasePassRates: Record<string, number>;
  baseline: {
    claimed: number;
    approved: number;
    disallowed: number;
    recoverableLines: number;
  };
}

const EVALUATION_DATE = new Date('2026-08-01T00:00:00.000Z');

/**
 * Evaluate the product promise against a hand-written case, end to end:
 * source-grounded read → safe physical ask → deterministic letter → one real fix →
 * re-run. These are release gates, not a single blended score.
 */
export function evaluateReferenceWorkflow(
  input: EvaluationCase,
  policy: Policy,
): WorkflowEvaluation {
  const failures: string[] = [];
  const phaseCounts: Record<string, { checks: number; passed: number }> = {};
  let checks = 0;
  const check = (name: string, condition: boolean, detail: string) => {
    checks += 1;
    const phase = phaseFor(name);
    phaseCounts[phase] ??= { checks: 0, passed: 0 };
    phaseCounts[phase].checks += 1;
    if (condition) phaseCounts[phase].passed += 1;
    if (!condition) failures.push(`${input.id} · ${name}: ${detail}`);
  };

  check(
    'usable read',
    isUsableLiveExtraction(input.extraction),
    'hand-written truth has no usable bill lines',
  );

  const baseline = computeForecast(input.extraction, policy, EVALUATION_DATE);
  checkForecast(check, 'baseline deterministic contract', baseline);

  for (const statement of input.extraction.clinical_statements) {
    check(
      'source grounding',
      normalise(input.source).includes(normalise(statement)),
      `clinical statement is not a verbatim source span: ${JSON.stringify(statement)}`,
    );
  }

  for (const expected of input.guard_verdicts) {
    const actual = guard(expected.candidate, input.source);
    check(
      'guard verdict',
      actual.allowed === expected.allowed,
      `${JSON.stringify(expected.candidate)} expected ${expected.allowed ? 'allow' : 'block'}`,
    );
    if (expected.negation && !actual.allowed) {
      const quoted = Object.values(actual.negations).join(' ');
      check(
        'negation evidence',
        quoted.includes(expected.negation),
        `${JSON.stringify(expected.candidate)} did not quote ${JSON.stringify(expected.negation)}`,
      );
    }
  }

  for (const line of baseline.lines) {
    if (line.bucket !== 'C') continue;
    check('recoverable action', Boolean(line.action), `${line.reason} has no physical ask`);
    if (line.action) {
      check(
        'physical ask safety',
        guard(line.action.ask, input.source).allowed,
        `${line.reason} produced a guard-blocked ask`,
      );
    }
  }

  const orderChanged = computeForecast(
    { ...input.extraction, bill_lines: [...input.extraction.bill_lines].reverse() },
    policy,
    EVALUATION_DATE,
  );
  check(
    'bill order invariance',
    JSON.stringify(ledger(orderChanged)) === JSON.stringify(ledger(baseline)),
    'reordering bill lines changed the letter ledger',
  );

  const printedTotal = input.extraction.bill_lines.reduce((sum, line) => sum + line.amount, 0);
  const subtotalRow = computeForecast(
    {
      ...input.extraction,
      bill_lines: [
        ...input.extraction.bill_lines,
        { head: 'misc', label: 'TOTAL PAYABLE', amount: printedTotal },
      ],
    },
    policy,
    EVALUATION_DATE,
  );
  check(
    'subtotal invariance',
    JSON.stringify(ledger(subtotalRow)) === JSON.stringify(ledger(baseline)),
    'a printed total row changed the letter ledger',
  );

  const oldExtraction = withResolutionInputs(
    input.extraction,
    input.resolution.old_missing_documents,
    input.resolution.old_unestablished,
  );
  const newExtraction = removeResolutionInput(oldExtraction, input.resolution.fixed);
  const oldForecast = computeForecast(oldExtraction, policy, EVALUATION_DATE);
  const newForecast = computeForecast(newExtraction, policy, EVALUATION_DATE);
  checkForecast(check, 'pre-resolution deterministic contract', oldForecast);
  checkForecast(check, 'post-resolution deterministic contract', newForecast);

  const cleared = oldForecast.lines
    .filter((line) => !newForecast.lines.some((next) => next.reason === line.reason))
    .map((line) => line.reason);
  check(
    'resolution delta',
    sameSet(cleared, input.resolution.expected_cleared_reasons),
    `expected [${input.resolution.expected_cleared_reasons.join(', ')}], cleared [${cleared.join(', ')}]`,
  );

  const oldBucketA = oldForecast.lines.filter((line) => line.bucket === 'A');
  const newBucketA = newForecast.lines.filter((line) => line.bucket === 'A');
  check(
    'resolution preserves Bucket A',
    JSON.stringify(oldBucketA) === JSON.stringify(newBucketA),
    'a document/doctor fix changed an already-spent policy loss',
  );

  const fixedAgain = computeForecast(
    removeResolutionInput(newExtraction, input.resolution.fixed),
    policy,
    EVALUATION_DATE,
  );
  check(
    'resolution idempotence',
    JSON.stringify(ledger(fixedAgain)) === JSON.stringify(ledger(newForecast)),
    'applying the same document/doctor fix twice changed the letter again',
  );

  return {
    id: input.id,
    checks,
    passed: checks - failures.length,
    failures,
    phasePassRates: passRates(phaseCounts),
    baseline: {
      claimed: baseline.claimed,
      approved: baseline.approved,
      disallowed: baseline.disallowed,
      recoverableLines: baseline.lines.filter((line) => line.bucket === 'C').length,
    },
  };
}

/**
 * Run the composition and safety gates on a live model result without pretending that
 * the model has a known approved/denied outcome. Field-level accuracy lives beside this
 * function in the extraction report; this gate only asks whether the result is safe to
 * feed into the deterministic workflow.
 */
export function evaluateLiveWorkflow(
  input: EvaluationCase,
  actual: Extraction,
  policy: Policy,
): WorkflowEvaluation {
  const failures: string[] = [];
  const phaseCounts: Record<string, { checks: number; passed: number }> = {};
  let checks = 0;
  const check = (name: string, condition: boolean, detail: string) => {
    checks += 1;
    const phase = phaseFor(name);
    phaseCounts[phase] ??= { checks: 0, passed: 0 };
    phaseCounts[phase].checks += 1;
    if (condition) phaseCounts[phase].passed += 1;
    if (!condition) failures.push(`${input.id} · ${name}: ${detail}`);
  };

  for (const statement of actual.clinical_statements) {
    check(
      'live source grounding',
      normalise(input.source).includes(normalise(statement)),
      `clinical statement is not a source span: ${JSON.stringify(statement)}`,
    );
  }

  const usable = isUsableLiveExtraction(actual);
  check(
    'live usable read',
    usable,
    actual.confidence === 'high' && actual.bill_lines.length === 0
      ? 'high-confidence empty bill presented as a finished ₹0 letter'
      : 'live extraction has no usable bill lines',
  );

  if (!usable) {
    return {
      id: input.id,
      checks,
      passed: checks - failures.length,
      failures,
      phasePassRates: passRates(phaseCounts),
      baseline: {
        claimed: 0,
        approved: 0,
        disallowed: 0,
        recoverableLines: 0,
      },
    };
  }

  const forecast = computeForecast(actual, policy, EVALUATION_DATE);
  checkForecast(check, 'live deterministic composition', forecast);
  for (const line of forecast.lines) {
    if (line.bucket !== 'C') continue;
    check('live recoverable action', Boolean(line.action), `${line.reason} has no physical ask`);
    if (line.action) {
      check(
        'live physical ask safety',
        guard(line.action.ask, input.source).allowed,
        `${line.reason} produced a guard-blocked ask`,
      );
    }
  }

  return {
    id: input.id,
    checks,
    passed: checks - failures.length,
    failures,
    phasePassRates: passRates(phaseCounts),
    baseline: {
      claimed: forecast.claimed,
      approved: forecast.approved,
      disallowed: forecast.disallowed,
      recoverableLines: forecast.lines.filter((line) => line.bucket === 'C').length,
    },
  };
}

function checkForecast(
  check: (name: string, condition: boolean, detail: string) => void,
  label: string,
  forecast: Forecast,
): void {
  check(
    `${label} · amount conservation`,
    forecast.claimed === forecast.approved + forecast.disallowed &&
      forecast.disallowed === forecast.lines.reduce((sum, line) => sum + line.amount, 0),
    'claimed, approved, disallowed, and line totals do not balance',
  );
  check(
    `${label} · amount safety`,
    forecast.lines.every((line) => Number.isInteger(line.amount) && line.amount >= 0) &&
      forecast.disallowed <= forecast.claimed,
    'negative, fractional, or over-claim disallowance found',
  );
  check(
    `${label} · line uniqueness`,
    new Set(forecast.lines.map((line) => line.reason)).size === forecast.lines.length,
    'duplicate reasons could double-count a dispute',
  );
  check(
    `${label} · recoverable action contract`,
    forecast.lines.every((line) => line.bucket !== 'C' || Boolean(line.action)),
    'a Bucket C line has no document demand or doctor question',
  );
  check(
    `${label} · next action ordering`,
    isDescending(forecast.lines.filter((line) => line.bucket === 'C').map((line) => line.amount)),
    'recoverable lines are not ordered by consequence',
  );
}

function withResolutionInputs(
  extraction: Extraction,
  missingDocuments: string[],
  unestablished: string[],
): Extraction {
  return { ...extraction, missing_documents: missingDocuments, unestablished };
}

function removeResolutionInput(
  extraction: Extraction,
  fixed: EvaluationResolution['fixed'],
): Extraction {
  return withResolutionInputs(
    extraction,
    fixed.kind === 'missing_document'
      ? extraction.missing_documents.filter((value) => value !== fixed.value)
      : extraction.missing_documents,
    fixed.kind === 'unestablished'
      ? extraction.unestablished.filter((value) => value !== fixed.value)
      : extraction.unestablished,
  );
}

function ledger(forecast: Forecast) {
  return {
    claimed: forecast.claimed,
    approved: forecast.approved,
    disallowed: forecast.disallowed,
    lines: forecast.lines.map((line) => ({
      bucket: line.bucket,
      reason: line.reason,
      amount: line.amount,
    })),
  };
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function isDescending(values: readonly number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] >= value);
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function phaseFor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('source grounding')) return 'source_grounding';
  if (lower.includes('usable read')) return 'usable_read';
  if (lower.includes('guard') || lower.includes('negation')) return 'fabrication_guard';
  if (lower.includes('physical ask') || lower.includes('recoverable action')) return 'physical_action';
  if (lower.includes('resolution') || lower.includes('bucket a') || lower.includes('idempotence')) {
    return 'resolution';
  }
  if (lower.includes('invariance') || lower.includes('order') || lower.includes('subtotal')) return 'invariance';
  return 'deterministic_forecast';
}

function passRates(
  counts: Record<string, { checks: number; passed: number }>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(counts).map(([phase, count]) => [phase, count.checks === 0 ? 0 : count.passed / count.checks]),
  );
}
