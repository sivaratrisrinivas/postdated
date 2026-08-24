import { afterEach, describe, expect, it } from 'vitest';
import {
  extractWithoutKey,
  hasLiveReaderKey,
  LIVE_READER,
  liveExtractMissingKeyError,
  livePolicyMissingKeyError,
} from './reader';

describe('live reader identity', () => {
  it('names the Cerebras Chat Completions client the routes actually call', () => {
    expect(LIVE_READER.provider).toBe('Cerebras');
    expect(LIVE_READER.model).toBe('gemma-4-31b');
    expect(LIVE_READER.env).toBe('CEREBRAS_API_KEY');
    expect(LIVE_READER.apiUrl).toBe('https://api.cerebras.ai/v1/chat/completions');
  });

  it('puts the required env name in both missing-key errors', () => {
    expect(liveExtractMissingKeyError()).toContain(LIVE_READER.env);
    expect(livePolicyMissingKeyError()).toContain(LIVE_READER.env);
  });
});

describe('extractWithoutKey', () => {
  it('returns the seeded fixture only when a demo case asked for it', () => {
    expect(extractWithoutKey(true)).toEqual({ kind: 'fixture', source: 'fixture_no_key' });
  });

  it('refuses a custom upload instead of pretending the seeded case was read', () => {
    expect(extractWithoutKey(false)).toEqual({
      kind: 'error',
      status: 503,
      error: liveExtractMissingKeyError(),
    });
  });
});

describe('hasLiveReaderKey', () => {
  const previous = process.env.CEREBRAS_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.CEREBRAS_API_KEY;
    else process.env.CEREBRAS_API_KEY = previous;
  });

  it('is false when the env is missing or empty', () => {
    delete process.env.CEREBRAS_API_KEY;
    expect(hasLiveReaderKey()).toBe(false);
    expect(hasLiveReaderKey({ })).toBe(false);
    expect(hasLiveReaderKey({ CEREBRAS_API_KEY: '' })).toBe(false);
  });

  it('is true when the env is set', () => {
    expect(hasLiveReaderKey({ CEREBRAS_API_KEY: 'test-key' })).toBe(true);
  });
});
