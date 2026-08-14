import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from './route';

const BASE_REQUEST = {
  image: 'aGVsbG8=',
  media_type: 'image/jpeg',
};

function request(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = '';
});

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe('public fake-demo extraction boundary', () => {
  it('does not expose fixture behavior without an explicit fake-demo mode', async () => {
    const response = await POST(request(BASE_REQUEST));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: 'explicit fake-demo mode is required' });
  });

  it('allows the committed fixture only through explicit fake-demo mode', async () => {
    const response = await POST(request({ ...BASE_REQUEST, mode: 'fake-demo' }));
    const payload = await json(response);

    expect(response.status).toBe(200);
    expect(payload.source).toBe('fixture_no_key');
    expect(payload.extraction).toBeDefined();
  });
});
