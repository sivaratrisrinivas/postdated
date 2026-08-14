import { describe, expect, it } from 'vitest';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import type { PilotBoundaryConfig, PilotProvider } from '@/lib/pilot-boundary';
import { createPilotPostHandler } from './route';

const config: PilotBoundaryConfig = {
  enabled: true,
  accessToken: 'pilot-test-token',
  providerApproved: true,
  providerApiKey: 'pilot-provider-test-key',
  challengeDigests: new Map([
    ['fake-challenge-1', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'],
  ]),
  timeoutMs: 50,
};

function request(): Request {
  return new Request('http://localhost/api/pilot/analyze', {
    method: 'POST',
    headers: {
      authorization: 'Bearer pilot-test-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'fake-challenge',
      challenge_id: 'fake-challenge-1',
      image: 'aGVsbG8=',
      media_type: 'image/jpeg',
    }),
  });
}

describe('protected pilot route wiring', () => {
  it('keeps the HTTP route injectable for the fake challenge acceptance seam', async () => {
    const provider: PilotProvider = { analyze: async () => SEEDED_EXTRACTION };
    const post = createPilotPostHandler(() => config, () => provider);

    const response = await post(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ source: 'pilot-provider' });
  });
});
