/**
 * The live photograph reader the shipped app actually calls.
 *
 * The original brief assumed Claude. The running product sends a single Chat Completions
 * request to Cerebras (`gemma-4-31b`) and keeps every rupee in deterministic code.
 * Arithmetic never reaches this client.
 */
export const LIVE_READER = {
  provider: 'Cerebras',
  model: 'gemma-4-31b',
  env: 'CEREBRAS_API_KEY',
  apiUrl: 'https://api.cerebras.ai/v1/chat/completions',
} as const;

export function hasLiveReaderKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env[LIVE_READER.env]);
}

export function liveExtractMissingKeyError(): string {
  return `Live image reading is not configured. Add ${LIVE_READER.env} and try again.`;
}

export function livePolicyMissingKeyError(): string {
  return `Policy photo reading is not configured. Add ${LIVE_READER.env}, or pick the supported insurer instead.`;
}

export type ExtractWithoutKey =
  | { kind: 'fixture'; source: 'fixture_no_key' }
  | { kind: 'error'; status: 503; error: string };

/**
 * Custom uploads must fail when the key is missing. Only a committed demo case may
 * use the seeded extraction — otherwise the UI would pretend the uploaded page was read.
 */
export function extractWithoutKey(allowFixture: boolean): ExtractWithoutKey {
  if (allowFixture) return { kind: 'fixture', source: 'fixture_no_key' };
  return { kind: 'error', status: 503, error: liveExtractMissingKeyError() };
}
