import { createHash } from 'node:crypto';

export interface PublicDemoConfig {
  liveEnabled: boolean;
  providerApiKey: string | null;
  approvedDocuments: ReadonlyMap<string, PublicDemoDocument>;
}

export interface PublicDemoDocument {
  id: string;
  kind: 'fake' | 'anonymised';
}

const DOCUMENT_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

export function readPublicDemoConfig(
  env: Record<string, string | undefined> = process.env,
): PublicDemoConfig {
  const approvedDocuments = new Map<string, PublicDemoDocument>();
  for (const entry of (env.POSTDATED_PUBLIC_DEMO_DOCUMENTS ?? '').split(',')) {
    const [rawId, rawKind, rawDigest] = entry.trim().split(':');
    const id = rawId?.trim();
    const kind = rawKind?.trim();
    const normalizedDigest = rawDigest?.trim().toLowerCase();
    if (
      id &&
      DOCUMENT_ID_PATTERN.test(id) &&
      (kind === 'fake' || kind === 'anonymised') &&
      /^[a-f0-9]{64}$/.test(normalizedDigest ?? '')
    ) {
      approvedDocuments.set(normalizedDigest, { id, kind });
    }
  }

  return {
    liveEnabled: env.POSTDATED_PUBLIC_DEMO_LIVE === 'true',
    providerApiKey: env.ANTHROPIC_API_KEY?.trim() || null,
    approvedDocuments,
  };
}

export function imageDigest(base64Image: string): string {
  return createHash('sha256').update(Buffer.from(base64Image, 'base64')).digest('hex');
}
