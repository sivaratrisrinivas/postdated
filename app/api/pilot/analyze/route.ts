import {
  handlePilotRequest,
  readPilotBoundaryConfig,
  type PilotBoundaryConfig,
} from '@/lib/pilot-boundary';
import { createAnthropicPilotProvider, type PilotProvider } from '@/lib/pilot-provider';

/**
 * This is the protected pilot boundary, intentionally separate from the public demo route.
 * It is disabled unless the external pilot gates and dedicated credentials are present.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export function createPilotPostHandler(
  readConfig: () => PilotBoundaryConfig = readPilotBoundaryConfig,
  createProvider: (apiKey: string) => PilotProvider = createAnthropicPilotProvider,
) {
  return async function POST(request: Request) {
    const config = readConfig();
    let provider: PilotProvider | null = null;
    if (config.providerApiKey) {
      try {
        provider = createProvider(config.providerApiKey);
      } catch {
        provider = null;
      }
    }

    return handlePilotRequest(request, { config, provider });
  };
}

export const POST = createPilotPostHandler();
