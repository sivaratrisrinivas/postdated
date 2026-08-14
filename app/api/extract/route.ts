import { NextResponse } from 'next/server';
import { parseExtraction } from '@/lib/extraction-contract';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import { createAnthropicPilotProvider } from '@/lib/pilot-provider';
import { imageDigest, readPublicDemoConfig, type PublicDemoConfig } from '@/lib/public-demo';

/**
 * Public demonstration boundary. It is deliberately not the protected pilot boundary.
 * Fixture behavior is allowed here only after the caller explicitly selects fake-demo mode.
 */

function publicDemoResponse(payload: unknown, status = 200): NextResponse {
  const result = NextResponse.json(payload, { status });
  result.headers.set('cache-control', 'no-store');
  result.headers.set('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
  result.headers.set('referrer-policy', 'no-referrer');
  result.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  result.headers.set('x-content-type-options', 'nosniff');
  result.headers.set('x-frame-options', 'DENY');
  return result;
}

export function createPublicDemoPostHandler(
  readConfig: () => PublicDemoConfig = readPublicDemoConfig,
  createProvider: (apiKey: string) => ReturnType<typeof createAnthropicPilotProvider> =
    createAnthropicPilotProvider,
) {
  return async function POST(request: Request) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return publicDemoResponse({ error: 'invalid request body' }, 400);
    }

    const image = (body as { image?: unknown })?.image;
    const mediaType = (body as { media_type?: unknown })?.media_type;
    const mode = (body as { mode?: unknown })?.mode;
    const resolvedMediaType: 'image/jpeg' | 'image/png' | 'image/webp' | null =
      mediaType === undefined ||
      mediaType === 'image/jpeg' ||
      mediaType === 'image/png' ||
      mediaType === 'image/webp'
        ? (mediaType ?? 'image/jpeg')
        : null;

    if (mode !== 'fake-demo') {
      return publicDemoResponse({ error: 'explicit fake-demo mode is required' }, 400);
    }
    if (typeof image !== 'string' || !image) {
      return publicDemoResponse({ error: 'no image' }, 400);
    }
    if (
      image.length > 11_000_000 ||
      image.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(image)
    ) {
      return publicDemoResponse({ error: 'invalid image' }, 400);
    }
    if (resolvedMediaType === null) {
      return publicDemoResponse({ error: 'unsupported image type' }, 400);
    }

    const config = readConfig();
    const digest = imageDigest(image);
    if (!config.approvedImageDigests.has(digest)) {
      return publicDemoResponse(
        {
          error: 'approved fake-demo document required',
          message: 'This public route accepts only an allowlisted fake demonstration document.',
        },
        400,
      );
    }
    if (!config.liveEnabled || !config.providerApiKey) {
      return publicDemoResponse({ extraction: SEEDED_EXTRACTION, source: 'fixture_fake_demo' });
    }

    try {
      const provider = createProvider(config.providerApiKey);
      const started = Date.now();
      const extraction = await provider.analyze({
        image,
        mediaType: resolvedMediaType,
        challengeId: 'fake-demo',
        signal: new AbortController().signal,
      });

      return publicDemoResponse({
        extraction: parseExtraction(extraction),
        source: 'live',
        latency_ms: Date.now() - started,
      });
    } catch {
      return publicDemoResponse({ extraction: SEEDED_EXTRACTION, source: 'fixture_error' });
    }
  };
}

export const POST = createPublicDemoPostHandler();
