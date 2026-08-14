import { printExtractReport, runExtractEval } from './extract.eval.ts';
import { printGuardReport, runGuardEval } from './guard.eval.ts';
import { printInvariantReport, runInvariantEval } from './invariants.eval.ts';
import { printResolutionReport, runResolutionEval } from './resolution.eval.ts';

const guardReport = runGuardEval();
printGuardReport(guardReport);

const resolutionReport = runResolutionEval();
printResolutionReport(resolutionReport);

const invariantReport = runInvariantEval();
printInvariantReport(invariantReport);

const extractReport = await runExtractEval();
printExtractReport(extractReport);

console.log('\nPOSTDATED evaluation table');
console.log('ground coverage: 4 fully / 12 partly / 8 not seen (hand-read public Ombudsman taxonomy)');
console.log('policy-parameter extraction: see per-field extract rows vs hand-read ground truth');
console.log(`guard block rate: ${(guardReport.blockRate * 100).toFixed(1)}%`);
console.log('latency per letter: reported per live extract row when CEREBRAS_API_KEY is set');
console.log(`diagnostic wording warnings: ${extractReport.warnings.length}`);
console.log('false-green rate: unmeasured — say so');

if (
  guardReport.failures.length > 0 ||
  resolutionReport.failures.length > 0 ||
  invariantReport.failures.length > 0 ||
  extractReport.status === 'failed'
) {
  process.exitCode = 1;
}
