import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import {
  EXTRACTION_SCHEMA,
  EXTRACTION_SYSTEM,
  ExtractionValidationError,
  parseExtraction,
} from './extraction-contract';
import { PilotProviderFailure, type PilotProvider } from './pilot-provider';

const REGION = process.env.AWS_REGION ?? 'ap-south-1';

/**
 * AWS-only provider adapter. The caller must keep the image in memory and must
 * configure Bedrock retention and logging controls outside this module.
 */
export function createBedrockPilotProvider(
  modelId: string,
  client: BedrockRuntimeClient = new BedrockRuntimeClient({ region: REGION }),
): PilotProvider {
  return {
    async analyze(input) {
      try {
        const response = await client.send(
          new ConverseCommand({
            modelId,
            system: [{ text: EXTRACTION_SYSTEM }],
            messages: [
              {
                role: 'user',
                content: [
                  {
                    image: {
                      format: input.mediaType.slice('image/'.length) as 'jpeg' | 'png' | 'webp',
                      source: { bytes: Buffer.from(input.image, 'base64') },
                    },
                  },
                  {
                    text:
                      'This is fake challenge case ' +
                      `${input.challengeId}. Extract only what is present in the document.`,
                  },
                ],
              },
            ],
            inferenceConfig: { maxTokens: 16_000 },
            outputConfig: {
              effort: 'low',
              textFormat: {
                type: 'json_schema',
                structure: {
                  jsonSchema: {
                    name: 'postdated_extraction',
                    schema: JSON.stringify(EXTRACTION_SCHEMA),
                  },
                },
              },
            },
          }),
          { abortSignal: input.signal },
        );

        if (response.stopReason === 'content_filtered' || response.stopReason === 'guardrail_intervened') {
          throw new PilotProviderFailure('refused');
        }

        const text =
          response.output &&
          'message' in response.output &&
          response.output.message
            ? response.output.message.content?.find(isTextBlock)?.text
            : undefined;
        if (!text) throw new PilotProviderFailure('malformed');

        try {
          return parseExtraction(JSON.parse(text));
        } catch (error) {
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

function isTextBlock(block: ContentBlock): block is ContentBlock.TextMember {
  return 'text' in block && typeof block.text === 'string';
}
