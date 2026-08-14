import { NextResponse } from 'next/server';
import { parseExtraction } from '@/lib/extraction-contract';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import { createAnthropicPilotProvider } from '@/lib/pilot-provider';

/**
 * Public demonstration boundary. It is deliberately not the protected pilot boundary.
 * Fixture behavior is allowed here only after the caller explicitly selects fake-demo mode.
 */

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
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
    return NextResponse.json({ error: 'explicit fake-demo mode is required' }, { status: 400 });
  }
  if (typeof image !== 'string' || !image) {
    return NextResponse.json({ error: 'no image' }, { status: 400 });
  }
  if (
    image.length > 11_000_000 ||
    image.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(image)
  ) {
    return NextResponse.json({ error: 'invalid image' }, { status: 400 });
  }
  if (resolvedMediaType === null) {
    return NextResponse.json({ error: 'unsupported image type' }, { status: 400 });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_no_key' });
    }

    const provider = createAnthropicPilotProvider(apiKey);
    const started = Date.now();
    const extraction = await provider.analyze({
      image,
      mediaType: resolvedMediaType,
      challengeId: 'fake-demo',
      signal: new AbortController().signal,
    });

    return NextResponse.json({
      extraction: parseExtraction(extraction),
      source: 'live',
      latency_ms: Date.now() - started,
    });
  } catch {
    // The public fake demo may use its explicit contingency. The pilot boundary never does.
    console.error('public fake-demo extraction failed');
    return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_error' });
  }
}
