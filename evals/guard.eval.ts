import { guard } from '../lib/guard.ts';
import { loadCorpus, type CasePack } from './corpus.ts';

export interface GuardReport {
  cases: number;
  claims: number;
  blocked: number;
  blockRate: number;
  expectedBlocked: number;
  adversarialBlocked: number;
  adversarialBlockRate: number;
  expectedAllowed: number;
  falseBlocks: number;
  falseBlockRate: number;
  failures: string[];
}

export function runGuardEval(packs: CasePack[] = loadCorpus()): GuardReport {
  let claims = 0;
  let blocked = 0;
  let expectedBlocked = 0;
  let adversarialBlocked = 0;
  let expectedAllowed = 0;
  let falseBlocks = 0;
  const failures: string[] = [];

  for (const pack of packs) {
    for (const expected of pack.groundTruth.guard_verdicts) {
      const actual = guard(expected.candidate, pack.source);
      claims += 1;
      if (!actual.allowed) blocked += 1;
      if (expected.allowed) {
        expectedAllowed += 1;
        if (!actual.allowed) falseBlocks += 1;
      } else {
        expectedBlocked += 1;
        if (!actual.allowed) adversarialBlocked += 1;
      }

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
    expectedBlocked,
    adversarialBlocked,
    adversarialBlockRate: expectedBlocked === 0 ? 0 : adversarialBlocked / expectedBlocked,
    expectedAllowed,
    falseBlocks,
    falseBlockRate: expectedAllowed === 0 ? 0 : falseBlocks / expectedAllowed,
    failures,
  };
}

export function printGuardReport(report: GuardReport): void {
  console.log(
    `guard: ${report.blocked}/${report.claims} claims blocked across ${report.cases} fictional cases`,
  );
  console.log(
    `guard safety: ${report.adversarialBlocked}/${report.expectedBlocked} ` +
      `adversarial claims blocked (${(report.adversarialBlockRate * 100).toFixed(1)}%); ` +
      `${report.falseBlocks}/${report.expectedAllowed} intended asks/claims falsely blocked`,
  );
  if (report.failures.length > 0) {
    for (const failure of report.failures) console.error(`  FAIL ${failure}`);
  }
}
