import { afterEach, describe, expect, it } from 'vitest';
import { SEEDED_EXTRACTION } from './fixture';
import {
  handlePilotRequest,
  PilotProviderFailure,
  readPilotBoundaryConfig,
  type PilotBoundaryConfig,
  type PilotProvider,
} from './pilot-boundary';

const PILOT_TOKEN = 'pilot-test-token';
const PILOT_USER = 'desk-executive-1';
const BASE_REQUEST = {
  mode: 'fake-challenge',
  challenge_id: 'fake-challenge-1',
  image: 'aGVsbG8=',
  media_type: 'image/jpeg',
};

const configured: PilotBoundaryConfig = {
  enabled: true,
  accessUsers: new Map([[PILOT_USER, PILOT_TOKEN]]),
  providerApproved: true,
  providerApiKey: 'pilot-provider-test-key',
  challengeDigests: new Map([
    ['fake-challenge-1', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'],
  ]),
  timeoutMs: 50,
};

const successfulProvider: PilotProvider = {
  analyze: async () => SEEDED_EXTRACTION,
};

function request(
  body: Record<string, unknown> = BASE_REQUEST,
  token: string | null = PILOT_TOKEN,
  user: string | null = PILOT_USER,
): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (user) headers.set('x-pilot-user', user);

  return new Request('http://localhost/api/pilot/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe('pilot HTTP boundary', () => {
  it('is disabled by default when no pilot environment is configured', () => {
    expect(readPilotBoundaryConfig({})).toEqual({
      enabled: false,
      accessUsers: new Map(),
      providerApproved: false,
      providerApiKey: null,
      challengeDigests: new Map(),
      timeoutMs: 15_000,
    });
  });

  it('loads distinct named pilot credentials from configuration', () => {
    const config = readPilotBoundaryConfig({
      POSTDATED_PILOT_USERS: 'desk-executive-1=first-token-123456,desk-executive-2=second-token-123456',
    });

    expect(config.accessUsers).toEqual(
      new Map([
        ['desk-executive-1', 'first-token-123456'],
        ['desk-executive-2', 'second-token-123456'],
      ]),
    );
  });

  it('is disabled by default and never invokes the provider', async () => {
    let invoked = false;
    const provider: PilotProvider = {
      analyze: async () => {
        invoked = true;
        return SEEDED_EXTRACTION;
      },
    };

    const response = await handlePilotRequest(request(), {
      config: { ...configured, enabled: false },
      provider,
    });

    expect(response.status).toBe(503);
    expect((await json(response)).error).toEqual({
      code: 'PILOT_DISABLED',
      message: 'The protected pilot boundary is disabled.',
    });
    expect(invoked).toBe(false);
  });

  it('fails closed when pilot credentials are missing', async () => {
    const response = await handlePilotRequest(request(), {
      config: { ...configured, providerApiKey: null },
      provider: successfulProvider,
    });

    expect(response.status).toBe(503);
    expect((await json(response)).error).toEqual({
      code: 'PILOT_NOT_CONFIGURED',
      message: 'The protected pilot boundary is not configured.',
    });
  });

  it('requires authentication before accepting a fake challenge', async () => {
    const response = await handlePilotRequest(request(BASE_REQUEST, null), {
      config: configured,
      provider: successfulProvider,
    });

    expect(response.status).toBe(401);
    expect((await json(response)).error).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Pilot authentication is required.',
    });
  });

  it('requires a named pilot user instead of accepting a shared bearer token', async () => {
    const response = await handlePilotRequest(request(BASE_REQUEST, PILOT_TOKEN, null), {
      config: configured,
      provider: successfulProvider,
    });

    expect(response.status).toBe(401);
    expect((await json(response)).error).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Pilot authentication is required.',
    });
  });

  it('rejects a token issued to a different named pilot user', async () => {
    const response = await handlePilotRequest(request(BASE_REQUEST, PILOT_TOKEN, 'desk-executive-2'), {
      config: configured,
      provider: successfulProvider,
    });

    expect(response.status).toBe(401);
    expect((await json(response)).error).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Pilot authentication is required.',
    });
  });

  it('accepts an explicit fake challenge through the controllable provider adapter', async () => {
    const response = await handlePilotRequest(request(), {
      config: configured,
      provider: successfulProvider,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(await json(response)).toEqual({
      extraction: SEEDED_EXTRACTION,
      source: 'pilot-provider',
      challenge_id: 'fake-challenge-1',
    });
  });

  it('rejects a request that does not explicitly identify a fake challenge', async () => {
    let invoked = false;
    const provider: PilotProvider = {
      analyze: async () => {
        invoked = true;
        return SEEDED_EXTRACTION;
      },
    };

    const response = await handlePilotRequest(
      request({ ...BASE_REQUEST, mode: 'fake-demo' }),
      { config: configured, provider },
    );

    expect(response.status).toBe(400);
    expect((await json(response)).error).toEqual({
      code: 'INVALID_REQUEST',
      message: 'Only explicit fake-challenge submissions are accepted by the pilot boundary.',
    });
    expect(invoked).toBe(false);
  });

  it('rejects a fake challenge image that is not on the approved digest list', async () => {
    let invoked = false;
    const provider: PilotProvider = {
      analyze: async () => {
        invoked = true;
        return SEEDED_EXTRACTION;
      },
    };

    const response = await handlePilotRequest(
      request({ ...BASE_REQUEST, image: 'aGVsbG8h' }),
      { config: configured, provider },
    );

    expect(response.status).toBe(400);
    expect((await json(response)).error).toEqual({
      code: 'INVALID_CHALLENGE',
      message: 'The fake challenge document is not an approved challenge.',
    });
    expect(invoked).toBe(false);
  });

  it('fails closed on malformed provider output without returning a fixture', async () => {
    const response = await handlePilotRequest(request(), {
      config: configured,
      provider: { analyze: async () => ({ nope: true }) },
    });

    expect(response.status).toBe(502);
    expect((await json(response)).error).toEqual({
      code: 'PILOT_MALFORMED_PROVIDER_OUTPUT',
      message: 'The provider returned unusable analysis.',
    });
  });

  it('fails closed when the provider refuses the analysis', async () => {
    const response = await handlePilotRequest(request(), {
      config: configured,
      provider: {
        analyze: async () => {
          throw new PilotProviderFailure('refused');
        },
      },
    });

    expect(response.status).toBe(502);
    expect((await json(response)).error).toEqual({
      code: 'PILOT_PROVIDER_REFUSED',
      message: 'The provider refused the analysis.',
    });
  });

  it('fails closed on provider timeout', async () => {
    const response = await handlePilotRequest(request(), {
      config: configured,
      provider: {
        analyze: async () => {
          throw new PilotProviderFailure('timeout');
        },
      },
    });

    expect(response.status).toBe(504);
    expect((await json(response)).error).toEqual({
      code: 'PILOT_PROVIDER_TIMEOUT',
      message: 'The provider did not finish the analysis in time.',
    });
  });

  it('fails closed on unexpected provider errors', async () => {
    const response = await handlePilotRequest(request(), {
      config: configured,
      provider: {
        analyze: async () => {
          throw new Error('provider secret must not reach the client');
        },
      },
    });

    expect(response.status).toBe(502);
    expect((await json(response)).error).toEqual({
      code: 'PILOT_PROVIDER_ERROR',
      message: 'The pilot analysis could not be completed.',
    });
  });
});
