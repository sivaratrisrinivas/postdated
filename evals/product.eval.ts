import { createJiti } from 'jiti';
import type { Extraction } from '../lib/types.ts';
import type { LiveExtractionDecision } from '../lib/extraction-quality.ts';
import type { RubricId } from './rubric.ts';

const jiti = createJiti(import.meta.url);
const { computeForecast } = (await jiti.import('../lib/deduct.ts')) as typeof import('../lib/deduct.ts');
const { amendDemoExtraction, DEMO_CASES, usesLiveExtract } = (await jiti.import(
  '../lib/demo.ts',
)) as typeof import('../lib/demo.ts');
const {
  decideLiveExtraction,
  isUsableLiveExtraction,
} = (await jiti.import('../lib/extraction-quality.ts')) as typeof import('../lib/extraction-quality.ts');
const { SEEDED_EXTRACTION, SEEDED_SUMMARY_TEXT } = (await jiti.import(
  '../lib/fixture.ts',
)) as typeof import('../lib/fixture.ts');
const { guard } = (await jiti.import('../lib/guard.ts')) as typeof import('../lib/guard.ts');
const { applySuccessfulInitialRead, applySuccessfulRescan } = (await jiti.import(
  '../lib/journey.ts',
)) as typeof import('../lib/journey.ts');
const { NIVA_BUPA_REASSURE_2 } = (await jiti.import('../lib/policy.ts')) as typeof import('../lib/policy.ts');
const { extractWithoutKey } = (await jiti.import('../lib/reader.ts')) as typeof import('../lib/reader.ts');

/**
 * The live production POST that returned HTTP 200 with an empty bill at
 * confidence=high. Feeding this to computeForecast claims ₹0 and has no Bucket C
 * line, so the old journey marked the letter complete.
 */
export const PRODUCTION_EMPTY_HIGH_CONFIDENCE: Extraction = {
  clinical_statements: [],
  bill_lines: [],
  room: { category_as_billed: 'Deluxe Single Room', rate_per_day: 8000, nights: 4 },
  missing_documents: [],
  unestablished: [],
  ped_trigger_phrases: [],
  confidence: 'high',
};

/** Journey presentation as the scorer sees it — wide enough to name the old ₹0 finish. */
export interface PresentedJourneyStep {
  ok: boolean;
  status: string;
  error?: string;
  extraction?: Extraction;
  source?: string;
  latency?: number | null;
  resolvedLines?: unknown;
  resolved?: readonly string[];
}

export interface ProductCheck {
  id: string;
  rubric_id: RubricId;
  passed: boolean;
  detail: string;
}

export interface ProductReport {
  status: 'passed' | 'failed';
  checks: number;
  passed: number;
  rows: ProductCheck[];
  failures: string[];
}

function billedTotal(extraction: Extraction): number {
  return extraction.bill_lines.reduce(
    (sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0),
    0,
  );
}

function snapshot(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Score the read→letter gate against a presented decision triple. The production
 * payload must stay a failed read: 422, no wrapped extraction, no invented
 * charges, and the journey must not open or finish a ₹0 letter.
 */
export function scoreUsableReadGate(input: {
  extraction: Extraction;
  decision: LiveExtractionDecision;
  initial: PresentedJourneyStep;
  rescan: PresentedJourneyStep;
}): string[] {
  const failures: string[] = [];
  const emptyOrZero =
    input.extraction.bill_lines.length === 0 || billedTotal(input.extraction) === 0;
  if (input.extraction.confidence !== 'high' || !emptyOrZero) return failures;

  if (input.decision.ok) {
    failures.push('decideLiveExtraction accepted an empty high-confidence bill');
    if (input.decision.extraction.bill_lines.length > 0) {
      failures.push('empty read was filled with invented bill lines');
    } else {
      failures.push('high-confidence empty bill presented as a finished ₹0 letter');
    }
  } else {
    if (input.decision.status !== 422) {
      failures.push(`decideLiveExtraction returned ${input.decision.status}, expected 422`);
    }
    if ('extraction' in input.decision) {
      failures.push('422 decision still wrapped an extraction');
    }
  }

  if (input.initial.ok) {
    failures.push('empty high-confidence bill opened a forecast');
    if (input.initial.status === 'ready' || input.initial.status === 'complete') {
      failures.push(`initial read status ${input.initial.status} would present a finished letter`);
    }
  } else if (input.initial.status === 'complete' || input.initial.status === 'ready') {
    failures.push(`failed initial read still entered ${input.initial.status}`);
  }

  if (input.rescan.ok) {
    failures.push('empty high-confidence bill applied as an amended letter');
    if (input.rescan.status === 'complete') {
      failures.push('empty high-confidence bill finished a ₹0 letter');
    }
  } else if (input.rescan.status === 'complete') {
    failures.push('failed rescan still marked the journey complete');
  }

  return failures;
}

/**
 * Product-chain release gate. Each check is a link in
 * photographed record → source-grounded read → guard → deterministic forecast
 * → one counter action → re-read → only the fixable line clears.
 *
 * Offline. Does not invent bill lines. Does not call the live reader.
 */
export function runProductEval(): ProductReport {
  const rows: ProductCheck[] = [];
  const failures: string[] = [];

  const check = (id: string, rubric_id: RubricId, condition: boolean, detail: string) => {
    rows.push({ id, rubric_id, passed: condition, detail });
    if (!condition) failures.push(`${id} [${rubric_id}]: ${detail}`);
  };

  const before = snapshot(PRODUCTION_EMPTY_HIGH_CONFIDENCE);
  const decision = decideLiveExtraction(PRODUCTION_EMPTY_HIGH_CONFIDENCE);
  const initial = applySuccessfulInitialRead(PRODUCTION_EMPTY_HIGH_CONFIDENCE);
  const rescan = applySuccessfulRescan({
    nextExtraction: PRODUCTION_EMPTY_HIGH_CONFIDENCE,
    policy: NIVA_BUPA_REASSURE_2,
    resolvedLines: [],
    nextSource: 'live',
    nextLatency: 657,
  });

  check(
    'empty-bill · no mutation',
    'safety.usable_read',
    snapshot(PRODUCTION_EMPTY_HIGH_CONFIDENCE) === before,
    'decideLiveExtraction or the journey mutated the empty payload',
  );
  check(
    'empty-bill · not a usable letter',
    'safety.usable_read',
    !isUsableLiveExtraction(PRODUCTION_EMPTY_HIGH_CONFIDENCE),
    'high-confidence empty bill was treated as a usable live read',
  );

  const gateFailures = scoreUsableReadGate({
    extraction: PRODUCTION_EMPTY_HIGH_CONFIDENCE,
    decision,
    initial,
    rescan,
  });
  check(
    'empty-bill · read→letter gate',
    'safety.usable_read',
    gateFailures.length === 0,
    gateFailures.join('; ') || 'empty high-confidence bill stayed a failed read',
  );
  check(
    'empty-bill · 422 without extraction',
    'safety.usable_read',
    !decision.ok && decision.status === 422 && !('extraction' in decision),
    'decideLiveExtraction must return 422 and must not wrap the empty bill',
  );
  check(
    'empty-bill · no invented charges',
    'safety.usable_read',
    !decision.ok && PRODUCTION_EMPTY_HIGH_CONFIDENCE.bill_lines.length === 0,
    'an empty live bill must not be filled with invented line items',
  );

  const naive = computeForecast(PRODUCTION_EMPTY_HIGH_CONFIDENCE, NIVA_BUPA_REASSURE_2);
  check(
    'empty-bill · naive forecast remains a ₹0 trap',
    'safety.usable_read',
    naive.claimed === 0 &&
      naive.disallowed === 0 &&
      !naive.lines.some((line) => line.bucket === 'C'),
    'computeForecast on the empty payload must stay a ₹0 trap — do not invent bill lines to escape it',
  );

  const customWithoutKey = extractWithoutKey(false);
  check(
    'custom-upload · 503 without a key',
    'safety.usable_read',
    customWithoutKey.kind === 'error' && customWithoutKey.status === 503,
    'a custom upload without CEREBRAS_API_KEY must be 503',
  );
  check(
    'custom-upload · never a fixture',
    'safety.usable_read',
    customWithoutKey.kind === 'error' && !('extraction' in customWithoutKey),
    'a custom upload without a key must not return the seeded extraction',
  );
  const demoWithoutKey = extractWithoutKey(true);
  check(
    'demo-upload · fixture only when asked',
    'safety.usable_read',
    demoWithoutKey.kind === 'fixture' && demoWithoutKey.source === 'fixture_no_key',
    'only a committed demo case may use the seeded extraction when the key is missing',
  );

  for (const demoCase of DEMO_CASES) {
    check(
      `demo · ${demoCase.id} stays offline`,
      'workflow.resolution_delta',
      usesLiveExtract(demoCase) === false && demoCase.fallback === SEEDED_EXTRACTION,
      'demo cases must use the committed extraction and must not call the live reader',
    );
  }

  const baseline = computeForecast(SEEDED_EXTRACTION, NIVA_BUPA_REASSURE_2);
  check(
    'fixture · claimed ₹2,40,000',
    'deterministic.amount_conservation',
    baseline.claimed === 240_000,
    `fixture claimed ${baseline.claimed}, expected 240000`,
  );
  check(
    'fixture · opening letter ₹1,73,000',
    'deterministic.amount_conservation',
    baseline.disallowed === 173_000 &&
      baseline.approved === 67_000 &&
      baseline.claimed === baseline.approved + baseline.disallowed,
    `opening letter was ₹${baseline.disallowed.toLocaleString('en-IN')} disallowed / ₹${baseline.approved.toLocaleString('en-IN')} approved`,
  );

  const indoor = baseline.lines.find((line) => line.reason.includes('Indoor case papers'));
  const admission = baseline.lines.find((line) => line.reason.includes('inpatient admission'));
  check(
    'fixture · two fixable lines',
    'workflow.resolution_delta',
    Boolean(indoor && admission && indoor.bucket === 'C' && admission.bucket === 'C'),
    'the seeded letter must expose indoor case papers and the unwritten admission sentence',
  );

  if (indoor && admission) {
    const afterIndoorExtraction = amendDemoExtraction(SEEDED_EXTRACTION, indoor);
    const afterIndoorAgain = amendDemoExtraction(SEEDED_EXTRACTION, indoor);
    check(
      'amended-scan · deterministic',
      'workflow.resolution_delta',
      snapshot(afterIndoorExtraction) === snapshot(afterIndoorAgain),
      'the amended demo scan must be a pure function of the chosen line',
    );
    check(
      'amended-scan · bill lines untouched',
      'safety.usable_read',
      snapshot(afterIndoorExtraction.bill_lines) === snapshot(SEEDED_EXTRACTION.bill_lines),
      'the amended demo scan must not invent or rewrite bill lines',
    );
    check(
      'amended-scan · only the indoor line clears',
      'workflow.resolution_delta',
      afterIndoorExtraction.missing_documents.length === 0 &&
        snapshot(afterIndoorExtraction.unestablished) === snapshot(SEEDED_EXTRACTION.unestablished),
      'clearing indoor case papers must leave the unwritten admission sentence in place',
    );

    const afterIndoor = applySuccessfulRescan({
      nextExtraction: afterIndoorExtraction,
      policy: NIVA_BUPA_REASSURE_2,
      resolvedLines: [indoor],
      nextSource: 'demo',
      nextLatency: null,
    });
    const afterIndoorForecast = afterIndoor.ok
      ? computeForecast(afterIndoor.extraction, NIVA_BUPA_REASSURE_2)
      : null;
    check(
      'fixture · after first fix ₹88,000',
      'deterministic.amount_conservation',
      afterIndoor.ok &&
        afterIndoor.status === 'ready' &&
        afterIndoorForecast !== null &&
        afterIndoorForecast.disallowed === 88_000 &&
        afterIndoorForecast.claimed === afterIndoorForecast.approved + afterIndoorForecast.disallowed,
      afterIndoor.ok
        ? `first fix left ₹${afterIndoorForecast?.disallowed.toLocaleString('en-IN') ?? 'unknown'} disallowed`
        : 'first amended demo scan was rejected',
    );
    check(
      'amended-scan · first fix is only indoor papers',
      'workflow.resolution_delta',
      afterIndoor.ok &&
        afterIndoor.resolved.length === 1 &&
        afterIndoor.resolved[0] === indoor.reason &&
        afterIndoorForecast !== null &&
        afterIndoorForecast.lines.some((line) => line.reason === admission.reason),
      'the first counter action must clear only the indoor-case-papers line',
    );

    const afterAdmissionExtraction = amendDemoExtraction(afterIndoorExtraction, admission);
    const afterAdmission = applySuccessfulRescan({
      nextExtraction: afterAdmissionExtraction,
      policy: NIVA_BUPA_REASSURE_2,
      resolvedLines: afterIndoor.ok ? [...afterIndoor.resolvedLines, admission] : [admission],
      nextSource: 'demo',
      nextLatency: null,
    });
    const afterAdmissionForecast = afterAdmission.ok
      ? computeForecast(afterAdmission.extraction, NIVA_BUPA_REASSURE_2)
      : null;
    const bucketA = afterAdmissionForecast
      ? afterAdmissionForecast.lines
          .filter((line) => line.bucket === 'A')
          .reduce((sum, line) => sum + line.amount, 0)
      : null;
    check(
      'fixture · after second fix ₹48,000',
      'deterministic.amount_conservation',
      afterAdmission.ok &&
        afterAdmission.status === 'complete' &&
        afterAdmissionForecast !== null &&
        afterAdmissionForecast.disallowed === 48_000 &&
        bucketA === 48_000 &&
        afterAdmissionForecast.claimed ===
          afterAdmissionForecast.approved + afterAdmissionForecast.disallowed,
      afterAdmission.ok
        ? `second fix left ₹${afterAdmissionForecast?.disallowed.toLocaleString('en-IN') ?? 'unknown'} disallowed`
        : 'second amended demo scan was rejected',
    );
    check(
      'amended-scan · Bucket A stays spent',
      'workflow.resolution_delta',
      bucketA === 48_000 &&
        afterAdmissionForecast !== null &&
        !afterAdmissionForecast.lines.some((line) => line.bucket === 'C'),
      'document and doctor fixes must not clear an already-spent policy loss',
    );
  }

  const inventedDiagnosis = guard('Findings consistent with sepsis.', SEEDED_SUMMARY_TEXT);
  const inventedFever = guard('Patient had a fever on admission.', SEEDED_SUMMARY_TEXT);
  const writtenIn = guard(
    'Oral therapy failed and IV antibiotics were required.',
    SEEDED_SUMMARY_TEXT,
  );
  check(
    'guard · blocks invented sepsis',
    'safety.source_grounding',
    inventedDiagnosis.allowed === false,
    'invented diagnosis text must stay blocked',
  );
  check(
    'guard · blocks invented fever',
    'safety.source_grounding',
    inventedFever.allowed === false &&
      (!inventedFever.allowed ? inventedFever.blocked_terms.includes('fever') : false),
    'the judge-demo fever sentence must stay blocked',
  );
  check(
    'guard · blocks written-in clinical justification',
    'safety.source_grounding',
    writtenIn.allowed === false,
    'the system must not accept a clinical sentence it would have to write',
  );
  check(
    'empty-bill · no invented diagnosis to fill the gap',
    'safety.source_grounding',
    PRODUCTION_EMPTY_HIGH_CONFIDENCE.clinical_statements.length === 0,
    'do not invent clinical statements to make an empty read look complete',
  );

  return {
    status: failures.length === 0 ? 'passed' : 'failed',
    checks: rows.length,
    passed: rows.filter((row) => row.passed).length,
    rows,
    failures,
  };
}

export function printProductReport(report: ProductReport): void {
  console.log(`product chain: ${report.passed}/${report.checks} first-principles checks passed`);
  console.table(
    report.rows.map((row) => ({
      check: row.id,
      rubric: row.rubric_id,
      result: row.passed ? 'pass' : 'fail',
    })),
  );
  for (const failure of report.failures) console.error(`  FAIL ${failure}`);
}
