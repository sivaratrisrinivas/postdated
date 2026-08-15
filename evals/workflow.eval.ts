import { createJiti } from 'jiti';
import { loadCorpus, type CasePack } from './corpus.ts';

const jiti = createJiti(import.meta.url);
const { evaluateReferenceWorkflow } = (await jiti.import('../lib/evaluation.ts')) as typeof import('../lib/evaluation.ts');
const { NIVA_BUPA_REASSURE_2 } = (await jiti.import('../lib/policy.ts')) as typeof import('../lib/policy.ts');

export interface WorkflowRow {
  id: string;
  checks: number;
  passed: number;
  baseline: string;
  phasePassRates: string;
  failures: string[];
}

export interface WorkflowReport {
  status: 'passed' | 'failed';
  cases: number;
  checks: number;
  passed: number;
  rows: WorkflowRow[];
  failures: string[];
}

/**
 * The reference workflow gate is intentionally offline. It proves that the corpus' hand-
 * written truth can survive the same composition the app uses, without allowing a live
 * model call to hide a deterministic regression.
 */
export function runWorkflowEval(packs: CasePack[] = loadCorpus()): WorkflowReport {
  const rows: WorkflowRow[] = [];
  const failures: string[] = [];

  for (const pack of packs) {
    const report = evaluateReferenceWorkflow(
      {
        id: pack.groundTruth.id,
        source: pack.source,
        extraction: pack.groundTruth.extraction,
        guard_verdicts: pack.groundTruth.guard_verdicts,
        resolution: pack.groundTruth.resolution,
      },
      NIVA_BUPA_REASSURE_2,
    );
    rows.push({
      id: report.id,
      checks: report.checks,
      passed: report.passed,
      baseline: `${report.baseline.claimed} claimed / ${report.baseline.disallowed} disallowed / ${report.baseline.recoverableLines} fixable`,
      phasePassRates: JSON.stringify(report.phasePassRates),
      failures: report.failures,
    });
    failures.push(...report.failures);
  }

  const checks = rows.reduce((sum, row) => sum + row.checks, 0);
  const passed = rows.reduce((sum, row) => sum + row.passed, 0);
  return {
    status: failures.length === 0 ? 'passed' : 'failed',
    cases: packs.length,
    checks,
    passed,
    rows,
    failures,
  };
}

export function printWorkflowReport(report: WorkflowReport): void {
  console.log(`workflow: ${report.passed}/${report.checks} reference checks passed across ${report.cases} cases`);
  console.table(
    report.rows.map((row) => ({
      case: row.id,
      checks: `${row.passed}/${row.checks}`,
      baseline: row.baseline,
      phases: row.phasePassRates,
    })),
  );
  for (const failure of report.failures) console.error(`  FAIL ${failure}`);
}
