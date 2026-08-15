import { printExtractReport, runExtractEval } from './extract.eval.ts';
import {
  evaluateHumanAlignment,
  loadHumanAlignmentReviews,
  printHumanAlignmentReport,
} from './human-alignment.ts';
import { evaluateBias, loadPairwiseReviews, printBiasReport } from './bias.eval.ts';
import { printGuardReport, runGuardEval } from './guard.eval.ts';
import { printInvariantReport, runInvariantEval } from './invariants.eval.ts';
import { printResolutionReport, runResolutionEval } from './resolution.eval.ts';
import { printWorkflowReport, runWorkflowEval } from './workflow.eval.ts';

const guardReport = runGuardEval();
printGuardReport(guardReport);

const resolutionReport = runResolutionEval();
printResolutionReport(resolutionReport);

const invariantReport = runInvariantEval();
printInvariantReport(invariantReport);

const workflowReport = runWorkflowEval();
printWorkflowReport(workflowReport);

const extractReport = await runExtractEval();
printExtractReport(extractReport);

const humanAlignmentReport = evaluateHumanAlignment(loadHumanAlignmentReviews());
printHumanAlignmentReport(humanAlignmentReport);

const biasReport = evaluateBias(loadPairwiseReviews());
printBiasReport(biasReport);

console.log('\nPOSTDATED evaluation table');
console.log('ground coverage: 4 fully / 12 partly / 8 not seen (hand-read public Ombudsman taxonomy)');
console.log('policy-parameter extraction: see per-field extract rows vs hand-read ground truth');
console.log(
  `guard adversarial block recall: ${(guardReport.adversarialBlockRate * 100).toFixed(1)}% ` +
    `(${guardReport.adversarialBlocked}/${guardReport.expectedBlocked})`,
);
console.log(`guard false-block rate: ${(guardReport.falseBlockRate * 100).toFixed(1)}%`);
console.log(`reference workflow: ${workflowReport.passed}/${workflowReport.checks} checks passed`);
console.log('latency per letter: reported per live extract row when CEREBRAS_API_KEY is set');
console.log(`diagnostic wording warnings: ${extractReport.warnings.length}`);
console.log('false-green rate: unmeasured — say so');

if (
  guardReport.failures.length > 0 ||
  resolutionReport.failures.length > 0 ||
  invariantReport.failures.length > 0 ||
  workflowReport.failures.length > 0 ||
  extractReport.status === 'failed' ||
  humanAlignmentReport.status === 'failed' ||
  biasReport.status === 'failed'
) {
  process.exitCode = 1;
}
