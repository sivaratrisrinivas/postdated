import { readFileSync } from 'node:fs';
import { createJiti } from 'jiti';
import { summariseProcess, type ProcessTrace } from '../lib/process.ts';
import type { Extraction } from '../lib/types.ts';
import { loadCorpus, type CasePack } from './corpus.ts';

const jiti = createJiti(import.meta.url);
const { evaluateLiveWorkflow } = (await jiti.import('../lib/evaluation.ts')) as typeof import('../lib/evaluation.ts');
const { NIVA_BUPA_REASSURE_2 } = (await jiti.import('../lib/policy.ts')) as typeof import('../lib/policy.ts');

interface ExtractRow {
  id: string;
  source: string;
  latencyMs: number | null;
  moneyExact: string;
  room: string;
  missingDocuments: string;
  missingDocumentsRecall: string;
  missingDocumentsPrecision: string;
  unestablished: string;
  unestablishedRecall: string;
  unestablishedPrecision: string;
  pedPhrases: string;
  pedPhrasesRecall: string;
  pedPhrasesPrecision: string;
  hallucinatedFields: number;
  groundedClinicalStatements: string;
  safeAbstention: string;
  workflow: string;
  workflowChecks: string;
  processTrace: string;
  modelCalls: number | string;
  toolCalls: number | string;
  processSteps: number | string;
  modelLatencyShare: string;
  localLatencyShare: string;
  failures: string[];
  warnings: string[];
}

export interface ExtractReport {
  status: 'skipped' | 'passed' | 'failed';
  rows: ExtractRow[];
  failures: string[];
  warnings: string[];
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function recall(actual: readonly string[], expected: readonly string[]): string {
  if (expected.length === 0) return actual.length === 0 ? '100%' : '0%';
  const matched = expected.filter((value) => actual.includes(value)).length;
  return `${Math.round((matched / expected.length) * 100)}%`;
}

function precision(actual: readonly string[], expected: readonly string[]): string {
  if (actual.length === 0) return expected.length === 0 ? '100%' : 'n/a';
  const matched = actual.filter((value) => expected.includes(value)).length;
  return `${Math.round((matched / actual.length) * 100)}%`;
}

function exactMoney(actual: Extraction, expected: Extraction): [number, number] {
  const remaining = [...actual.bill_lines];
  let matched = 0;
  for (const wanted of expected.bill_lines) {
    const index = remaining.findIndex(
      (line) => line.head === wanted.head && line.amount === wanted.amount,
    );
    if (index === -1) continue;
    matched += 1;
    remaining.splice(index, 1);
  }
  return [matched, expected.bill_lines.length];
}

function hallucinatedFields(actual: Extraction, source: string): number {
  const normalisedSource = source.toLowerCase().replace(/\s+/g, ' ');
  return actual.clinical_statements.filter(
    (statement) => !normalisedSource.includes(statement.toLowerCase().replace(/\s+/g, ' ')),
  ).length;
}

function scoreExtraction(
  pack: CasePack,
  actual: Extraction,
  source: string,
  sourceKind: string,
  latencyMs: number,
): ExtractRow {
  const expected = pack.groundTruth.extraction;
  const [moneyMatched, moneyTotal] = exactMoney(actual, expected);
  const roomChecks = [
    actual.room.category_as_billed === expected.room.category_as_billed,
    actual.room.rate_per_day === expected.room.rate_per_day,
    actual.room.nights === expected.room.nights,
  ];
  const missingDocumentsExact = sameSet(actual.missing_documents, expected.missing_documents);
  const unestablishedExact = sameSet(actual.unestablished, expected.unestablished);
  const pedExact = sameSet(actual.ped_trigger_phrases, expected.ped_trigger_phrases);
  const hallucinated = hallucinatedFields(actual, source);
  const safeAbstention =
    expected.confidence === 'low' ? actual.confidence !== 'high' : actual.confidence !== 'low';
  const failures: string[] = [];
  const warnings: string[] = [];

  if (sourceKind !== 'live') failures.push(`route returned ${sourceKind}, not live`);
  if (moneyMatched !== moneyTotal) failures.push(`money ${moneyMatched}/${moneyTotal} exact`);
  if (roomChecks.some((check) => !check)) failures.push(`room fields ${roomChecks.filter(Boolean).length}/3 exact`);
  if (!missingDocumentsExact) warnings.push('missing documents do not exactly match');
  if (!unestablishedExact) failures.push('unestablished items do not exactly match');
  if (!pedExact) warnings.push('PED trigger phrases do not exactly match');
  if (hallucinated > 0) failures.push(`${hallucinated} clinical statements are not in the source`);
  if (!safeAbstention) failures.push('confidence did not safely abstain for this case');

  return {
    id: pack.groundTruth.id,
    source: sourceKind,
    latencyMs,
    moneyExact: `${moneyMatched}/${moneyTotal}`,
    room: `${roomChecks.filter(Boolean).length}/3`,
    missingDocuments: missingDocumentsExact ? 'exact' : 'mismatch',
    missingDocumentsRecall: recall(actual.missing_documents, expected.missing_documents),
    missingDocumentsPrecision: precision(actual.missing_documents, expected.missing_documents),
    unestablished: unestablishedExact ? 'exact' : 'mismatch',
    unestablishedRecall: recall(actual.unestablished, expected.unestablished),
    unestablishedPrecision: precision(actual.unestablished, expected.unestablished),
    pedPhrases: pedExact ? 'exact' : 'mismatch',
    pedPhrasesRecall: recall(actual.ped_trigger_phrases, expected.ped_trigger_phrases),
    pedPhrasesPrecision: precision(actual.ped_trigger_phrases, expected.ped_trigger_phrases),
    hallucinatedFields: hallucinated,
    groundedClinicalStatements: `${actual.clinical_statements.length - hallucinated}/${actual.clinical_statements.length}`,
    safeAbstention: safeAbstention ? 'pass' : 'fail',
    workflow: 'not-run',
    workflowChecks: 'not-run',
    processTrace: 'not-run',
    modelCalls: 'n/a',
    toolCalls: 'n/a',
    processSteps: 'n/a',
    modelLatencyShare: 'unmeasured',
    localLatencyShare: 'unmeasured',
    failures,
    warnings,
  };
}

export async function runExtractEval(
  packs: CasePack[] = loadCorpus(),
  baseUrl = process.env.POSTDATED_EVAL_URL ?? 'http://localhost:3000',
): Promise<ExtractReport> {
  if (!process.env.CEREBRAS_API_KEY) {
    console.log('extract: SKIPPED — set CEREBRAS_API_KEY and run the dev server to score live extraction');
    return { status: 'skipped', rows: [], failures: [], warnings: [] };
  }

  const rows: ExtractRow[] = [];
  const failures: string[] = [];
  const warnings: string[] = [];
  const delayMs = Number(process.env.POSTDATED_EVAL_DELAY_MS ?? 13_000);
  for (const pack of packs) {
    if (rows.length + failures.length > 0 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/extract`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          image: readFileSync(pack.imagePath).toString('base64'),
          media_type: 'image/png',
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${pack.groundTruth.id}: could not call ${baseUrl}/api/extract (${message})`);
      continue;
    }

    const body = (await response.json()) as {
      extraction?: Extraction;
      source?: string;
      latency_ms?: number;
      trace?: ProcessTrace;
    };
    if (!response.ok || !body.extraction || !body.source) {
      failures.push(`${pack.groundTruth.id}: route returned HTTP ${response.status}`);
      continue;
    }
    const measuredLatency = body.latency_ms ?? Date.now() - started;
    const row = scoreExtraction(
      pack,
      body.extraction,
      pack.source,
      body.source,
      measuredLatency,
    );
    const process = summariseProcess(body.trace, measuredLatency);
    row.processTrace = process.traceComplete ? 'complete' : 'missing/incomplete';
    row.modelCalls = process.traceComplete ? process.modelCalls : 'n/a';
    row.toolCalls = process.traceComplete ? process.toolCalls : 'n/a';
    row.processSteps = process.traceComplete ? process.steps : 'n/a';
    row.modelLatencyShare = formatRatio(process.modelCallRatio);
    row.localLatencyShare = formatRatio(process.localStepRatio);
    if (!process.traceComplete) row.failures.push('process telemetry is missing or incomplete');
    const workflow = evaluateLiveWorkflow(
      {
        id: pack.groundTruth.id,
        source: pack.source,
        extraction: pack.groundTruth.extraction,
        guard_verdicts: pack.groundTruth.guard_verdicts,
        resolution: pack.groundTruth.resolution,
      },
      body.extraction,
      NIVA_BUPA_REASSURE_2,
    );
    row.workflow = workflow.failures.length === 0 ? 'pass' : 'fail';
    row.workflowChecks = `${workflow.passed}/${workflow.checks}`;
    row.failures.push(...workflow.failures.map((failure) => `workflow: ${failure}`));
    rows.push(row);
    failures.push(...row.failures.map((failure) => `${pack.groundTruth.id}: ${failure}`));
    warnings.push(...row.warnings.map((warning) => `${pack.groundTruth.id}: ${warning}`));
  }

  const status = failures.length === 0 && rows.length === packs.length ? 'passed' : 'failed';
  return { status, rows, failures, warnings };
}

export function printExtractReport(report: ExtractReport): void {
  if (report.status === 'skipped') return;
  console.log('extract: per-field live scores');
  console.table(
    report.rows.map((row) => ({
      case: row.id,
      source: row.source,
      money: row.moneyExact,
      room: row.room,
      missing_docs: row.missingDocuments,
      missing_docs_recall: row.missingDocumentsRecall,
      missing_docs_precision: row.missingDocumentsPrecision,
      unestablished: row.unestablished,
      unestablished_recall: row.unestablishedRecall,
      unestablished_precision: row.unestablishedPrecision,
      PED: row.pedPhrases,
      PED_recall: row.pedPhrasesRecall,
      PED_precision: row.pedPhrasesPrecision,
      hallucinated: row.hallucinatedFields,
      grounded_clinical: row.groundedClinicalStatements,
      abstention: row.safeAbstention,
      workflow: row.workflow,
      workflow_checks: row.workflowChecks,
      process_trace: row.processTrace,
      model_calls: row.modelCalls,
      tool_calls: row.toolCalls,
      process_steps: row.processSteps,
      model_latency_share: row.modelLatencyShare,
      local_latency_share: row.localLatencyShare,
      latency_ms: row.latencyMs,
    })),
  );
  for (const failure of report.failures) console.error(`  FAIL ${failure}`);
  for (const warning of report.warnings) console.warn(`  WARN ${warning}`);
}

function formatRatio(value: number | null): string {
  return value === null ? 'unmeasured' : `${(value * 100).toFixed(1)}%`;
}
