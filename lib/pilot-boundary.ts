import { createHash, timingSafeEqual } from 'node:crypto';
import { ExtractionValidationError, parseExtraction } from './extraction-contract';
import {
  PilotProviderFailure,
  type PilotProvider,
  type PilotProviderInput,
} from './pilot-provider';
import { jsonSecurityResponse } from './http-security';

export type { PilotProvider, PilotProviderInput } from './pilot-provider';
export { PilotProviderFailure } from './pilot-provider';

export interface PilotBoundaryConfig {
  enabled: boolean;
  accessUsers: ReadonlyMap<string, string>;
  providerApproved: boolean;
  providerConfigured: boolean;
  bedrockModelId: string | null;
  challengeDigests: ReadonlyMap<string, string>;
  timeoutMs: number;
}

export interface PilotBoundaryDependencies {
  config: PilotBoundaryConfig;
  provider: PilotProvider | null;
}

const MAX_IMAGE_BASE64_LENGTH = 11_000_000;
const CHALLENGE_ID_PATTERN = /^fake-[a-z0-9][a-z0-9._-]{0,63}$/i;
const PILOT_USER_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function readPilotBoundaryConfig(
  env: Record<string, string | undefined> = process.env,
): PilotBoundaryConfig {
  const timeout = Number(env.POSTDATED_PILOT_TIMEOUT_MS ?? 15_000);
  const accessUsers = new Map<string, string>();
  for (const entry of (env.POSTDATED_PILOT_USERS ?? '').split(',')) {
    const separator = entry.indexOf('=');
    if (separator <= 0) continue;
    const userId = entry.slice(0, separator).trim();
    const token = entry.slice(separator + 1).trim();
    if (PILOT_USER_ID_PATTERN.test(userId) && token.length >= 16 && token.length <= 256) {
      accessUsers.set(userId, token);
    }
  }
  const challengeDigests = new Map<string, string>();
  for (const entry of (env.POSTDATED_PILOT_FAKE_CHALLENGES ?? '').split(',')) {
    const [challengeId, digest] = entry.trim().split('=');
    if (
      challengeId &&
      CHALLENGE_ID_PATTERN.test(challengeId) &&
      /^[a-f0-9]{64}$/i.test(digest ?? '')
    ) {
      challengeDigests.set(challengeId, digest.toLowerCase());
    }
  }

  return {
    enabled: env.POSTDATED_PILOT_ENABLED === 'true',
    accessUsers,
    providerApproved: env.POSTDATED_PILOT_PROVIDER_APPROVED === 'true',
    bedrockModelId: env.POSTDATED_PILOT_BEDROCK_MODEL_ID?.trim() || null,
    providerConfigured: Boolean(env.POSTDATED_PILOT_BEDROCK_MODEL_ID?.trim()),
    challengeDigests,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 60_000) : 15_000,
  };
}

function errorResponse(status: number, code: string, message: string): Response {
  return jsonSecurityResponse({ error: { code, message } }, status);
}

function successResponse(payload: unknown): Response {
  return jsonSecurityResponse(payload);
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

function pilotUser(request: Request): string | null {
  const userId = request.headers.get('x-pilot-user')?.trim();
  return userId && PILOT_USER_ID_PATTERN.test(userId) ? userId : null;
}

function tokensMatch(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return (
    actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes)
  );
}

function authenticatedPilotUser(
  request: Request,
  accessUsers: ReadonlyMap<string, string>,
): string | null {
  const userId = pilotUser(request);
  const expectedToken = userId ? accessUsers.get(userId) : undefined;
  return expectedToken && tokensMatch(bearerToken(request), expectedToken) ? userId : null;
}

function isBase64Image(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_IMAGE_BASE64_LENGTH &&
    value.length % 4 === 0 &&
    /^[A-Za-z0-9+/]*={0,2}$/.test(value)
  );
}

function parseRequest(body: unknown): {
  image: string;
  mediaType: PilotProviderInput['mediaType'];
  challengeId: string;
} | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const candidate = body as Record<string, unknown>;
  if (
    candidate.mode !== 'fake-challenge' ||
    !isBase64Image(candidate.image) ||
    typeof candidate.challenge_id !== 'string' ||
    !CHALLENGE_ID_PATTERN.test(candidate.challenge_id) ||
    !MEDIA_TYPES.includes(candidate.media_type as (typeof MEDIA_TYPES)[number])
  ) {
    return null;
  }

  return {
    image: candidate.image,
    mediaType: candidate.media_type as PilotProviderInput['mediaType'],
    challengeId: candidate.challenge_id,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PilotProviderFailure('timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function handlePilotRequest(
  request: Request,
  dependencies: PilotBoundaryDependencies,
): Promise<Response> {
  const { config, provider } = dependencies;

  if (request.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.');
  }
  if (!config.enabled) {
    return errorResponse(503, 'PILOT_DISABLED', 'The protected pilot boundary is disabled.');
  }
  if (
    config.accessUsers.size === 0 ||
    !config.providerApproved ||
    !config.providerConfigured ||
    config.challengeDigests.size === 0 ||
    !provider
  ) {
    return errorResponse(
      503,
      'PILOT_NOT_CONFIGURED',
      'The protected pilot boundary is not configured.',
    );
  }
  if (!authenticatedPilotUser(request, config.accessUsers)) {
    return errorResponse(401, 'UNAUTHENTICATED', 'Pilot authentication is required.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'INVALID_REQUEST', 'The pilot request body is invalid.');
  }

  const input = parseRequest(body);
  if (!input) {
    return errorResponse(
      400,
      'INVALID_REQUEST',
      'Only explicit fake-challenge submissions are accepted by the pilot boundary.',
    );
  }
  const expectedDigest = config.challengeDigests.get(input.challengeId);
  const actualDigest = createHash('sha256').update(Buffer.from(input.image, 'base64')).digest('hex');
  if (!expectedDigest || !tokensMatch(actualDigest, expectedDigest)) {
    return errorResponse(
      400,
      'INVALID_CHALLENGE',
      'The fake challenge document is not an approved challenge.',
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    let output: unknown;
    try {
      output = await withTimeout(
        provider.analyze({ ...input, signal: controller.signal }),
        config.timeoutMs,
      );
    } finally {
      clearTimeout(timer);
    }

    try {
      return successResponse({
        extraction: parseExtraction(output),
        source: 'pilot-provider',
        challenge_id: input.challengeId,
      });
    } catch (error) {
      if (error instanceof ExtractionValidationError) {
        return errorResponse(
          502,
          'PILOT_MALFORMED_PROVIDER_OUTPUT',
          'The provider returned unusable analysis.',
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof PilotProviderFailure) {
      if (error.kind === 'timeout') {
        return errorResponse(
          504,
          'PILOT_PROVIDER_TIMEOUT',
          'The provider did not finish the analysis in time.',
        );
      }
      if (error.kind === 'refused') {
        return errorResponse(502, 'PILOT_PROVIDER_REFUSED', 'The provider refused the analysis.');
      }
      if (error.kind === 'malformed') {
        return errorResponse(
          502,
          'PILOT_MALFORMED_PROVIDER_OUTPUT',
          'The provider returned unusable analysis.',
        );
      }
    }

    return errorResponse(502, 'PILOT_PROVIDER_ERROR', 'The pilot analysis could not be completed.');
  }
}
