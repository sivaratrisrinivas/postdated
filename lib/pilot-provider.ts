import Anthropic from '@anthropic-ai/sdk';
import {
  EXTRACTION_SCHEMA,
  EXTRACTION_SYSTEM,
  ExtractionValidationError,
  parseExtraction,
} from './extraction-contract';
import type { Extraction } from './types';

export type PilotProviderFailureKind = 'refused' | 'malformed' | 'timeout' | 'unexpected';

export class PilotProviderFailure extends Error {
  readonly kind: PilotProviderFailureKind;

  constructor(kind: PilotProviderFailureKind) {
    super(`Pilot provider failure: ${kind}`);
    this.name = 'PilotProviderFailure';
    this.kind = kind;
  }
}

export interface PilotProviderInput {
  image: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  challengeId: string;
  signal: AbortSignal;
}

export interface PilotProvider {
  analyze(input: PilotProviderInput): Promise<unknown>;
}

export function createAnthropicPilotProvider(apiKey: string): PilotProvider {
  const client = new Anthropic({ apiKey });

  return {
    async analyze(input) {
      try {
        const response = await client.messages.create(
          {
            model: 'claude-opus-5',
            max_tokens: 16_000,
            system: EXTRACTION_SYSTEM,
            output_config: {
              effort: 'low',
              format: { type: 'json_schema', schema: EXTRACTION_SCHEMA },
            },
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: input.mediaType,
                      data: input.image,
                    },
                  },
                  {
                    type: 'text',
                    text:
                      'This is fake challenge case ' +
                      `${input.challengeId}. Extract only what is present in the document.`,
                  },
                ],
              },
            ],
          },
          { signal: input.signal },
        );

        if (response.stop_reason === 'refusal') throw new PilotProviderFailure('refused');

        const text = response.content.find((block) => block.type === 'text');
        if (!text || text.type !== 'text') throw new PilotProviderFailure('malformed');

        try {
          return parseExtraction(JSON.parse(text.text)) satisfies Extraction;
        } catch (error) {
          if (error instanceof PilotProviderFailure) throw error;
          if (error instanceof ExtractionValidationError || error instanceof SyntaxError) {
            throw new PilotProviderFailure('malformed');
          }
          throw error;
        }
      } catch (error) {
        if (error instanceof PilotProviderFailure) throw error;
        if (input.signal.aborted) throw new PilotProviderFailure('timeout');
        throw new PilotProviderFailure('unexpected');
      }
    },
  };
}
