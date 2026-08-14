import { createJiti } from 'jiti';
import type { Extraction } from '../lib/types.ts';
import { loadCorpus, type CasePack } from './corpus.ts';

const jiti = createJiti(import.meta.url);
const { computeForecast } = (await jiti.import('../lib/deduct.ts')) as typeof import('../lib/deduct.ts');
const { NIVA_BUPA_REASSURE_2 } = (await jiti.import('../lib/policy.ts')) as typeof import('../lib/policy.ts');

export interface ResolutionReport {
  cases: number;
  passed: number;
  failures: string[];
}

function extractionWith(
  extraction: Extraction,
  missingDocuments: string[],
  unestablished: string[],
): Extraction {
  return { ...extraction, missing_documents: missingDocuments, unestablished };
}

export function runResolutionEval(packs: CasePack[] = loadCorpus()): ResolutionReport {
  const failures: string[] = [];
  let passed = 0;

  for (const pack of packs) {
    const truth = pack.groundTruth;
    const oldExtraction = extractionWith(
      truth.extraction,
      truth.resolution.old_missing_documents,
      truth.resolution.old_unestablished,
    );
    const fixed = truth.resolution.fixed;
    const newMissing = truth.resolution.old_missing_documents.filter(
      (value) => !(fixed.kind === 'missing_document' && value === fixed.value),
    );
    const newUnestablished = truth.resolution.old_unestablished.filter(
      (value) => !(fixed.kind === 'unestablished' && value === fixed.value),
    );
    const newExtraction = extractionWith(truth.extraction, newMissing, newUnestablished);
    const oldForecast = computeForecast(oldExtraction, NIVA_BUPA_REASSURE_2, new Date('2026-08-01'));
    const newForecast = computeForecast(newExtraction, NIVA_BUPA_REASSURE_2, new Date('2026-08-01'));
    const newReasons = new Set(newForecast.lines.map((line) => line.reason));
    const clearedReasons = oldForecast.lines
      .filter((line) => !newReasons.has(line.reason))
      .map((line) => line.reason);
    const expected = truth.resolution.expected_cleared_reasons;
    const expectedSet = new Set(expected);
    const unexpected = clearedReasons.filter((reason) => !expectedSet.has(reason));
    const missingExpected = expected.filter(
      (reason) => !clearedReasons.includes(reason),
    );

    if (unexpected.length > 0 || missingExpected.length > 0) {
      failures.push(
        `${truth.id}: expected only [${expected.join(', ')}] to clear; ` +
          `cleared [${clearedReasons.join(', ')}]`,
      );
      continue;
    }

    passed += 1;
  }

  return { cases: packs.length, passed, failures };
}

export function printResolutionReport(report: ResolutionReport): void {
  console.log(`resolution: ${report.passed}/${report.cases} paired document changes passed`);
  if (report.failures.length > 0) {
    for (const failure of report.failures) console.error(`  FAIL ${failure}`);
  }
}
