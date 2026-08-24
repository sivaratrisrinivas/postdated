import { describe, expect, it } from 'vitest';
import { loadCorpus } from './corpus';
import { runGuardEval } from './guard.eval';
import { runResolutionEval } from './resolution.eval';

describe('eval corpus', () => {
  it('holds 40 handwritten fictional cases', () => {
    expect(loadCorpus()).toHaveLength(40);
  });

  it('passes the offline guard and resolution gates', () => {
    expect(runGuardEval().failures).toEqual([]);
    expect(runResolutionEval().failures).toEqual([]);
  });
});
