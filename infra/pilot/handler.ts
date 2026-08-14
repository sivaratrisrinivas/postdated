import {
  handlePilotRequest,
  readPilotBoundaryConfig,
  type PilotBoundaryConfig,
} from '../../lib/pilot-boundary';
import { createBedrockPilotProvider } from '../../lib/bedrock-pilot-provider';
import type { PilotProvider } from '../../lib/pilot-provider';

export interface HttpApiV2Event {
  version: '2.0';
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers?: Record<string, string | undefined>;
  requestContext: { http: { method: string; path: string } };
  body?: string | null;
  isBase64Encoded?: boolean;
}

export interface HttpApiV2Response {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: false;
}

export function createPilotLambdaHandler(
  readConfig: () => PilotBoundaryConfig = readPilotBoundaryConfig,
  createProvider: (modelId: string) => PilotProvider = createBedrockPilotProvider,
) {
  return async function handler(event: HttpApiV2Event): Promise<HttpApiV2Response> {
    const config = readConfig();
    let provider: PilotProvider | null = null;
    if (config.providerConfigured && config.bedrockModelId) {
      try {
        provider = createProvider(config.bedrockModelId);
      } catch {
        provider = null;
      }
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(event.headers ?? {})) {
      if (value !== undefined) headers.set(name, value);
    }

    const body = event.isBase64Encoded
      ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
      : event.body ?? '';
    const request = new Request(`https://pilot.postdated.invalid${event.rawPath}`, {
      method: event.requestContext.http.method,
      headers,
      body: event.requestContext.http.method === 'GET' ? undefined : body,
    });
    const response = await handlePilotRequest(request, { config, provider });

    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  };
}

export const handler = createPilotLambdaHandler();
