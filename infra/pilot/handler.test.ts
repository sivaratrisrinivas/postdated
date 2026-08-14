import { describe, expect, it } from 'vitest';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import type { PilotBoundaryConfig } from '@/lib/pilot-boundary';
import type { PilotProvider } from '@/lib/pilot-provider';
import { createPilotLambdaHandler, type HttpApiV2Event } from './handler';

const CONFIG: PilotBoundaryConfig = {
  enabled: true,
  accessUsers: new Map([['desk-executive-1', 'pilot-test-token']]),
  providerApproved: true,
  providerConfigured: true,
  bedrockModelId: 'anthropic.claude-sonnet-4-6-v1:0',
  challengeDigests: new Map([
    ['fake-challenge-1', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'],
  ]),
  timeoutMs: 50,
};

const EVENT: HttpApiV2Event = {
  version: '2.0',
  routeKey: 'POST /pilot/analyze',
  rawPath: '/pilot/analyze',
  rawQueryString: '',
  headers: {
    authorization: 'Bearer pilot-test-token',
    'content-type': 'application/json',
    'x-pilot-user': 'desk-executive-1',
  },
  requestContext: { http: { method: 'POST', path: '/pilot/analyze' } },
  body: JSON.stringify({
    mode: 'fake-challenge',
    challenge_id: 'fake-challenge-1',
    image: 'aGVsbG8=',
    media_type: 'image/jpeg',
  }),
  isBase64Encoded: false,
};

describe('AWS pilot HTTP adapter', () => {
  it('converts an HTTP API event into the authenticated pilot acceptance seam', async () => {
    const provider: PilotProvider = { analyze: async () => SEEDED_EXTRACTION };
    const handler = createPilotLambdaHandler(() => CONFIG, () => provider);

    const response = await handler(EVENT);

    expect(response.statusCode).toBe(200);
    expect(response.headers?.['cache-control']).toBe('no-store');
    expect(JSON.parse(response.body)).toEqual({
      extraction: SEEDED_EXTRACTION,
      source: 'pilot-provider',
      challenge_id: 'fake-challenge-1',
    });
  });

  it('keeps the AWS adapter disabled when its deployment gate is off', async () => {
    let invoked = false;
    const handler = createPilotLambdaHandler(
      () => ({ ...CONFIG, enabled: false }),
      () => ({
        analyze: async () => {
          invoked = true;
          return SEEDED_EXTRACTION;
        },
      }),
    );

    const response = await handler(EVENT);

    expect(response.statusCode).toBe(503);
    expect(invoked).toBe(false);
  });
});
