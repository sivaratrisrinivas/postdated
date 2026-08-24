import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Extraction } from '../lib/types.ts';

export type CorpusTrack = 'safety' | 'deterministic' | 'workflow';

/** Floor that fails CI if the fictional corpus shrinks. */
export const MIN_CORPUS_CASES = 40;

/** Same 4/3/3 mix as the original ten packs, scaled to forty. */
export const MIN_CORPUS_SPLIT: Record<CorpusTrack, number> = {
  safety: 16,
  deterministic: 12,
  workflow: 12,
};

const TRACKS = new Set<CorpusTrack>(['safety', 'deterministic', 'workflow']);

export interface GuardExpectation {
  candidate: string;
  allowed: boolean;
  negation?: string;
}

export interface GroundTruth {
  id: string;
  title: string;
  track: CorpusTrack;
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
      const truthPath = join(dir, 'ground-truth.json');
      for (const path of [sourcePath, htmlPath, imagePath, truthPath]) {
        if (!existsSync(path)) {
          throw new Error(`incomplete case pack ${entry.name}: missing ${path}`);
        }
      }
      const groundTruth = JSON.parse(readFileSync(truthPath, 'utf8')) as GroundTruth;
      if (!TRACKS.has(groundTruth.track)) {
        throw new Error(`${groundTruth.id} is missing a safety, deterministic, or workflow track`);
      }
      return {
        dir,
        sourcePath,
        htmlPath,
        imagePath,
        source: readFileSync(sourcePath, 'utf8'),
        groundTruth,
      };
    })
    .sort((left, right) => left.groundTruth.id.localeCompare(right.groundTruth.id));
}

export function corpusSplit(
  packs: CasePack[] = loadCorpus(),
): Record<CorpusTrack, number> {
  const split: Record<CorpusTrack, number> = { safety: 0, deterministic: 0, workflow: 0 };
  for (const pack of packs) {
    split[pack.groundTruth.track] += 1;
  }
  return split;
}

export interface CorpusReleaseGate {
  ok: boolean;
  cases: number;
  split: Record<CorpusTrack, number>;
  failures: string[];
}

/**
 * Release gate for the fictional case packs. Shrinking the corpus or dropping a
 * track is a failed build. This is a count check, not a quality score.
 */
export function assertCorpusReleaseGate(
  packs: CasePack[] = loadCorpus(),
): CorpusReleaseGate {
  const split = corpusSplit(packs);
  const failures: string[] = [];
  if (packs.length < MIN_CORPUS_CASES) {
    failures.push(`corpus shrank to ${packs.length} packs, floor is ${MIN_CORPUS_CASES}`);
  }
  for (const track of TRACKS) {
    if (split[track] < MIN_CORPUS_SPLIT[track]) {
      failures.push(
        `${track} shrank to ${split[track]} packs, floor is ${MIN_CORPUS_SPLIT[track]}`,
      );
    }
  }
  return { ok: failures.length === 0, cases: packs.length, split, failures };
}
