import { afterEach, describe, expect, it } from 'vitest';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import { liveExtractMissingKeyError } from '@/lib/reader';
import { POST } from './route';

const IMAGE = 'aGVsbG8=';

function request(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/extract without a live key', () => {
  const previous = process.env.CEREBRAS_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.CEREBRAS_API_KEY;
    else process.env.CEREBRAS_API_KEY = previous;
  });

  it('rejects a custom upload and names CEREBRAS_API_KEY', async () => {
    delete process.env.CEREBRAS_API_KEY;
    const response = await POST(
      request({ image: IMAGE, media_type: 'image/jpeg' }),
    );
    const body = (await response.json()) as { error?: string; extraction?: unknown };

    expect(response.status).toBe(503);
    expect(body.extraction).toBeUndefined();
    expect(body.error).toBe(liveExtractMissingKeyError());
    expect(body.error).toContain('CEREBRAS_API_KEY');
  });

  it('does not treat allow_fixture=false as a seeded case', async () => {
    delete process.env.CEREBRAS_API_KEY;
    const response = await POST(
      request({ image: IMAGE, media_type: 'image/jpeg', allow_fixture: false }),
    );
    const body = (await response.json()) as { extraction?: unknown };

    expect(response.status).toBe(503);
    expect(body.extraction).toBeUndefined();
  });

  it('returns the committed fixture only for a demo case', async () => {
    delete process.env.CEREBRAS_API_KEY;
    const response = await POST(
      request({ image: IMAGE, media_type: 'image/jpeg', allow_fixture: true }),
    );
    const body = (await response.json()) as { extraction?: unknown; source?: string };

    expect(response.status).toBe(200);
    expect(body.source).toBe('fixture_no_key');
    expect(body.extraction).toEqual(SEEDED_EXTRACTION);
  });
});
