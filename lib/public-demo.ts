import { createHash } from 'node:crypto';

export interface PublicDemoConfig {
  liveEnabled: boolean;
  providerApiKey: string | null;
  approvedImageDigests: ReadonlySet<string>;
}

export function readPublicDemoConfig(
  env: Record<string, string | undefined> = process.env,
): PublicDemoConfig {
  const approvedImageDigests = new Set<string>();
  for (const digest of (env.POSTDATED_PUBLIC_DEMO_FAKE_DIGESTS ?? '').split(',')) {
    const normalized = digest.trim().toLowerCase();
    if (/^[a-f0-9]{64}$/.test(normalized)) approvedImageDigests.add(normalized);
  }

  return {
    liveEnabled: env.POSTDATED_PUBLIC_DEMO_LIVE === 'true',
    providerApiKey: env.ANTHROPIC_API_KEY ?? null,
    approvedImageDigests,
  };
}

export function imageDigest(base64Image: string): string {
  return createHash('sha256').update(Buffer.from(base64Image, 'base64')).digest('hex');
}
