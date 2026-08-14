import { guard } from '../lib/guard.ts';
import { loadCorpus, type CasePack } from './corpus.ts';

export interface GuardReport {
  cases: number;
  claims: number;
  blocked: number;
  blockRate: number;
  failures: string[];
}

export function runGuardEval(packs: CasePack[] = loadCorpus()): GuardReport {
  let claims = 0;
  let blocked = 0;
  const failures: string[] = [];

  for (const pack of packs) {
    for (const expected of pack.groundTruth.guard_verdicts) {
      const actual = guard(expected.candidate, pack.source);
      claims += 1;
      if (!actual.allowed) blocked += 1;

      if (actual.allowed !== expected.allowed) {
        failures.push(
          `${pack.groundTruth.id}: ${JSON.stringify(expected.candidate)} expected ` +
            `${expected.allowed ? 'allowed' : 'blocked'} but was ` +
            `${actual.allowed ? 'allowed' : 'blocked'}`,
        );
        continue;
      }

      if (expected.negation && actual.allowed === false) {
        const quoted = Object.values(actual.negations).join(' ');
        if (!quoted.includes(expected.negation)) {
          failures.push(
            `${pack.groundTruth.id}: ${JSON.stringify(expected.candidate)} did not quote ` +
              `the expected negation ${JSON.stringify(expected.negation)}`,
          );
        }
      }
    }
  }

  return {
    cases: packs.length,
    claims,
    blocked,
    blockRate: claims === 0 ? 0 : blocked / claims,
    failures,
  };
}

export function printGuardReport(report: GuardReport): void {
  console.log(
    `guard: ${report.blocked}/${report.claims} adversarial claims blocked ` +
      `(${(report.blockRate * 100).toFixed(1)}%) across ${report.cases} fictional cases`,
  );
  if (report.failures.length > 0) {
    for (const failure of report.failures) console.error(`  FAIL ${failure}`);
  }
}
