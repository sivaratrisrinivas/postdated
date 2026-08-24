import { afterEach, describe, expect, it } from 'vitest';
import { livePolicyMissingKeyError } from '@/lib/reader';
import { POST } from './route';

describe('POST /api/policy without a live key', () => {
  const previous = process.env.CEREBRAS_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.CEREBRAS_API_KEY;
    else process.env.CEREBRAS_API_KEY = previous;
  });

  it('fails clearly and names CEREBRAS_API_KEY', async () => {
    delete process.env.CEREBRAS_API_KEY;
    const response = await POST(
      new Request('http://localhost/api/policy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: 'aGVsbG8=', media_type: 'image/jpeg' }),
      }),
    );
    const body = (await response.json()) as { error?: string; policy?: unknown };

    expect(response.status).toBe(503);
    expect(body.policy).toBeUndefined();
    expect(body.error).toBe(livePolicyMissingKeyError());
    expect(body.error).toContain('CEREBRAS_API_KEY');
  });
});
