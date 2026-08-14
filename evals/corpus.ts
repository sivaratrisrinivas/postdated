import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Extraction } from '../lib/types.ts';

export interface GuardExpectation {
  candidate: string;
  allowed: boolean;
  negation?: string;
}

export interface GroundTruth {
  id: string;
  title: string;
  input_image: string;
  extraction: Extraction;
  guard_verdicts: GuardExpectation[];
  resolution: {
    old_missing_documents: string[];
    old_unestablished: string[];
    fixed: { kind: 'missing_document' | 'unestablished'; value: string };
    expected_cleared_reasons: string[];
  };
}

export interface CasePack {
  dir: string;
  sourcePath: string;
  htmlPath: string;
  imagePath: string;
  source: string;
  groundTruth: GroundTruth;
}

const CORPUS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'corpus');

export function loadCorpus(): CasePack[] {
  return readdirSync(CORPUS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = join(CORPUS_DIR, entry.name);
      const sourcePath = join(dir, 'source.md');
      const htmlPath = join(dir, 'printable.html');
      const imagePath = join(dir, 'input.png');
      return {
        dir,
        sourcePath,
        htmlPath,
        imagePath,
        source: readFileSync(sourcePath, 'utf8'),
        groundTruth: JSON.parse(readFileSync(join(dir, 'ground-truth.json'), 'utf8')) as GroundTruth,
      };
    })
    .sort((left, right) => left.groundTruth.id.localeCompare(right.groundTruth.id));
}
