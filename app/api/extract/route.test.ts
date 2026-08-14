import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import { readPublicDemoConfig, type PublicDemoConfig } from '@/lib/public-demo';
import { createPublicDemoPostHandler, POST } from './route';

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
  it('keeps public live processing disabled unless both explicit gates are configured', () => {
    expect(
      readPublicDemoConfig({
        ANTHROPIC_API_KEY: 'public-key',
        POSTDATED_PUBLIC_DEMO_FAKE_DIGESTS:
          '2CF24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824,not-a-digest',
      }),
    ).toEqual({
      liveEnabled: false,
      providerApiKey: 'public-key',
      approvedImageDigests: new Set([
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      ]),
    });
  });

  it('does not expose fixture behavior without an explicit fake-demo mode', async () => {
    const response = await POST(request(BASE_REQUEST));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: 'explicit fake-demo mode is required' });
  });

  it('allows the committed fixture only through explicit fake-demo mode', async () => {
    const post = createPublicDemoPostHandler(
      () => ({
        liveEnabled: false,
        providerApiKey: null,
        approvedImageDigests: new Set([
          '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        ]),
      }),
      () => ({ analyze: async () => SEEDED_EXTRACTION }),
    );
    const response = await post(request({ ...BASE_REQUEST, mode: 'fake-demo' }));
    const payload = await json(response);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload).toEqual({ extraction: SEEDED_EXTRACTION, source: 'fixture_fake_demo' });
  });

  it('does not invoke a provider when the public live gate is off', async () => {
    let invoked = false;
    const config: PublicDemoConfig = {
      liveEnabled: false,
      providerApiKey: 'public-test-key',
      approvedImageDigests: new Set(['2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824']),
    };
    const post = createPublicDemoPostHandler(() => config, () => ({
      analyze: async () => {
        invoked = true;
        return SEEDED_EXTRACTION;
      },
    }));

    const response = await post(request({ ...BASE_REQUEST, mode: 'fake-demo' }));

    expect(response.status).toBe(200);
    expect((await json(response)).source).toBe('fixture_fake_demo');
    expect(invoked).toBe(false);
  });

  it('rejects an unapproved image even when the public live gate is off', async () => {
    const post = createPublicDemoPostHandler(
      () => ({ liveEnabled: false, providerApiKey: null, approvedImageDigests: new Set() }),
      () => ({ analyze: async () => SEEDED_EXTRACTION }),
    );

    const response = await post(request({ ...BASE_REQUEST, mode: 'fake-demo' }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      error: 'approved fake-demo document required',
      message: 'This public route accepts only an allowlisted fake demonstration document.',
    });
  });

  it('rejects an unapproved document before a public provider call', async () => {
    let invoked = false;
    const config: PublicDemoConfig = {
      liveEnabled: true,
      providerApiKey: 'public-test-key',
      approvedImageDigests: new Set(),
    };
    const post = createPublicDemoPostHandler(() => config, () => ({
      analyze: async () => {
        invoked = true;
        return SEEDED_EXTRACTION;
      },
    }));

    const response = await post(request({ ...BASE_REQUEST, mode: 'fake-demo' }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      error: 'approved fake-demo document required',
      message: 'This public route accepts only an allowlisted fake demonstration document.',
    });
    expect(invoked).toBe(false);
  });

  it('allows a provider only for an explicitly allowlisted fake document', async () => {
    const config: PublicDemoConfig = {
      liveEnabled: true,
      providerApiKey: 'public-test-key',
      approvedImageDigests: new Set(['2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824']),
    };
    const post = createPublicDemoPostHandler(() => config, () => ({
      analyze: async () => SEEDED_EXTRACTION,
    }));

    const response = await post(request({ ...BASE_REQUEST, mode: 'fake-demo' }));

    expect(response.status).toBe(200);
    expect((await json(response)).source).toBe('live');
  });
});
