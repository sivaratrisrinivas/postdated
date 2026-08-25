import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MIN_CORPUS_CASES,
  MIN_CORPUS_SPLIT,
  assertCorpusReleaseGate,
  corpusSplit,
  loadCorpus,
} from './corpus';

describe('eval corpus release gate', () => {
  it('keeps at least forty fictional packs in the original 4/3/3 split', () => {
    const packs = loadCorpus();
    const gate = assertCorpusReleaseGate(packs);
    const split = corpusSplit(packs);

    expect(gate.failures).toEqual([]);
    expect(gate.ok).toBe(true);
    expect(packs.length).toBeGreaterThanOrEqual(MIN_CORPUS_CASES);
    expect(split.safety).toBeGreaterThanOrEqual(MIN_CORPUS_SPLIT.safety);
    expect(split.deterministic).toBeGreaterThanOrEqual(MIN_CORPUS_SPLIT.deterministic);
    expect(split.workflow).toBeGreaterThanOrEqual(MIN_CORPUS_SPLIT.workflow);
  });

  it('keeps every pack complete, tracked, and source-grounded', () => {
    const packs = loadCorpus();

    expect(packs.every((pack) => existsSync(pack.sourcePath))).toBe(true);
    expect(packs.every((pack) => existsSync(pack.htmlPath))).toBe(true);
    expect(packs.every((pack) => existsSync(pack.imagePath))).toBe(true);
    expect(
      packs.every((pack) =>
        pack.groundTruth.extraction.clinical_statements.every((statement) =>
          pack.source.toLowerCase().replace(/\s+/g, ' ').includes(statement.toLowerCase().replace(/\s+/g, ' ')),
        ),
      ),
    ).toBe(true);
  });
});
