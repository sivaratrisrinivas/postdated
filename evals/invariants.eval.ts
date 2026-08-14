import { createJiti } from 'jiti';
import { loadCorpus, type CasePack } from './corpus.ts';

const jiti = createJiti(import.meta.url);
const { guard } = (await jiti.import('../lib/guard.ts')) as typeof import('../lib/guard.ts');
const { computeForecast } = (await jiti.import('../lib/deduct.ts')) as typeof import('../lib/deduct.ts');
const { NIVA_BUPA_REASSURE_2 } = (await jiti.import('../lib/policy.ts')) as typeof import('../lib/policy.ts');

export interface InvariantReport {
  cases: number;
  checks: number;
  passed: number;
  failures: string[];
}

/**
 * Metamorphic and safety checks for the deterministic half of the product. These catch
 * regressions that a field-by-field extraction score cannot: money must balance, line order
 * must not matter, subtotal rows must not double a claim, and every physical ask must stay
 * inside the two allowed output types.
 */
export function runInvariantEval(packs: CasePack[] = loadCorpus()): InvariantReport {
  let checks = 0;
  const failures: string[] = [];

  function check(id: string, condition: boolean, detail: string) {
    checks += 1;
    if (!condition) failures.push(`${id}: ${detail}`);
  }

  for (const pack of packs) {
    const extraction = pack.groundTruth.extraction;
    const forecast = computeForecast(extraction, NIVA_BUPA_REASSURE_2, new Date('2026-08-01'));

    check(
      pack.groundTruth.id,
      forecast.claimed === forecast.approved + forecast.disallowed,
      'approved + disallowed does not equal claimed',
    );
    check(
      pack.groundTruth.id,
      forecast.disallowed <= forecast.claimed,
      'disallowed amount exceeds the claim',
    );
    check(
      pack.groundTruth.id,
      forecast.lines.every((line) => Number.isInteger(line.amount) && line.amount >= 0),
      'forecast contains a negative or fractional rupee amount',
    );

    const reasons = forecast.lines.map((line) => line.reason);
    check(
      pack.groundTruth.id,
      new Set(reasons).size === reasons.length,
      'forecast contains duplicate reasons',
    );
    check(
      pack.groundTruth.id,
      forecast.lines.every((line) => line.bucket !== 'C' || Boolean(line.action)),
      'a recoverable line has no physical ask',
    );

    for (const line of forecast.lines) {
      if (!line.action) continue;
      const verdict = guard(line.action.ask, pack.source);
      check(
        `${pack.groundTruth.id} · ${line.reason}`,
        verdict.allowed,
        'the generated physical ask was blocked by the fabrication guard',
      );
    }

    const reversed = computeForecast(
      { ...extraction, bill_lines: [...extraction.bill_lines].reverse() },
      NIVA_BUPA_REASSURE_2,
      new Date('2026-08-01'),
    );
    check(
      pack.groundTruth.id,
      JSON.stringify(ledger(reversed)) === JSON.stringify(ledger(forecast)),
      'reordering bill lines changed the forecast ledger',
    );

    const printedTotal = extraction.bill_lines.reduce((sum, line) => sum + line.amount, 0);
    const withSubtotal = computeForecast(
      {
        ...extraction,
        bill_lines: [
          ...extraction.bill_lines,
          { head: 'misc', label: 'TOTAL PAYABLE', amount: printedTotal },
        ],
      },
      NIVA_BUPA_REASSURE_2,
      new Date('2026-08-01'),
    );
    check(
      pack.groundTruth.id,
      JSON.stringify(ledger(withSubtotal)) === JSON.stringify(ledger(forecast)),
      'a printed total row changed the forecast ledger',
    );
  }

  return { cases: packs.length, checks, passed: checks - failures.length, failures };
}

function ledger(forecast: ReturnType<typeof computeForecast>) {
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

export function printInvariantReport(report: InvariantReport): void {
  console.log(
    `invariants: ${report.passed}/${report.checks} checks passed across ${report.cases} fictional cases`,
  );
  for (const failure of report.failures) console.error(`  FAIL ${failure}`);
}
