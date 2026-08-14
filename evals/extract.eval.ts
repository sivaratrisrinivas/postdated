import { readFileSync } from 'node:fs';
import type { Extraction } from '../lib/types.ts';
import { loadCorpus, type CasePack } from './corpus.ts';

interface ExtractRow {
  id: string;
  source: string;
  latencyMs: number | null;
  moneyExact: string;
  room: string;
  missingDocuments: string;
  unestablished: string;
  pedPhrases: string;
  hallucinatedFields: number;
  safeAbstention: string;
  failures: string[];
}

export interface ExtractReport {
  status: 'skipped' | 'passed' | 'failed';
  rows: ExtractRow[];
  failures: string[];
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
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

  if (sourceKind !== 'live') failures.push(`route returned ${sourceKind}, not live`);
  if (moneyMatched !== moneyTotal) failures.push(`money ${moneyMatched}/${moneyTotal} exact`);
  if (roomChecks.some((check) => !check)) failures.push(`room fields ${roomChecks.filter(Boolean).length}/3 exact`);
  if (!missingDocumentsExact) failures.push('missing documents do not exactly match');
  if (!unestablishedExact) failures.push('unestablished items do not exactly match');
  if (!pedExact) failures.push('PED trigger phrases do not exactly match');
  if (hallucinated > 0) failures.push(`${hallucinated} clinical statements are not in the source`);
  if (!safeAbstention) failures.push('confidence did not safely abstain for this case');

  return {
    id: pack.groundTruth.id,
    source: sourceKind,
    latencyMs,
    moneyExact: `${moneyMatched}/${moneyTotal}`,
    room: `${roomChecks.filter(Boolean).length}/3`,
    missingDocuments: missingDocumentsExact ? 'exact' : 'mismatch',
    unestablished: unestablishedExact ? 'exact' : 'mismatch',
    pedPhrases: pedExact ? 'exact' : 'mismatch',
    hallucinatedFields: hallucinated,
    safeAbstention: safeAbstention ? 'pass' : 'fail',
    failures,
  };
}

export async function runExtractEval(
  packs: CasePack[] = loadCorpus(),
  baseUrl = process.env.POSTDATED_EVAL_URL ?? 'http://localhost:3000',
): Promise<ExtractReport> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('extract: SKIPPED — set ANTHROPIC_API_KEY and run the dev server to score live extraction');
    return { status: 'skipped', rows: [], failures: [] };
  }

  const rows: ExtractRow[] = [];
  const failures: string[] = [];
  for (const pack of packs) {
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
    };
    if (!response.ok || !body.extraction || !body.source) {
      failures.push(`${pack.groundTruth.id}: route returned HTTP ${response.status}`);
      continue;
    }
    const row = scoreExtraction(
      pack,
      body.extraction,
      pack.source,
      body.source,
      body.latency_ms ?? Date.now() - started,
    );
    rows.push(row);
    failures.push(...row.failures.map((failure) => `${pack.groundTruth.id}: ${failure}`));
  }

  const status = failures.length === 0 && rows.length === packs.length ? 'passed' : 'failed';
  return { status, rows, failures };
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
      unestablished: row.unestablished,
      PED: row.pedPhrases,
      hallucinated: row.hallucinatedFields,
      abstention: row.safeAbstention,
      latency_ms: row.latencyMs,
    })),
  );
  for (const failure of report.failures) console.error(`  FAIL ${failure}`);
}
