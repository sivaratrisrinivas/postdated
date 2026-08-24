import { NextResponse } from 'next/server';
import { decideLiveExtraction } from '@/lib/extraction-quality';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import type { ProcessTrace } from '@/lib/process';
import { extractWithoutKey, hasLiveReaderKey, LIVE_READER } from '@/lib/reader';
import type { Extraction } from '@/lib/types';
import { validateImagePayload } from '@/lib/upload-validation';

/**
 * The one live model call on the demo's critical path: a photographed discharge summary
 * in, strict JSON out. Nothing here computes a rupee — see lib/deduct.ts.
 *
 * The API key stays on this side. It is never sent to the browser.
 */

const MODEL = LIVE_READER.model;

const HEADS = [
  'room_rent',
  'nursing',
  'practitioners_fees',
  'operation_theatre',
  'pharmacy_consumables',
  'implants_devices',
  'diagnostics',
  'anaesthesia_blood_oxygen',
  'non_payable_consumables',
  'misc',
] as const;

const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'clinical_statements',
    'bill_lines',
    'room',
    'missing_documents',
    'unestablished',
    'ped_trigger_phrases',
    'confidence',
  ],
  properties: {
    clinical_statements: {
      type: 'array',
      items: { type: 'string' },
    },
    bill_lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['head', 'label', 'amount'],
        properties: {
          head: { type: 'string', enum: HEADS },
          label: { type: 'string' },
          amount: { type: 'integer' },
        },
      },
    },
    room: {
      type: 'object',
      additionalProperties: false,
      required: ['category_as_billed', 'rate_per_day', 'nights'],
      properties: {
        category_as_billed: { type: 'string' },
        rate_per_day: { type: 'integer' },
        nights: { type: 'integer' },
      },
    },
    missing_documents: {
      type: 'array',
      items: { type: 'string' },
    },
    unestablished: {
      type: 'array',
      items: { type: 'string' },
    },
    ped_trigger_phrases: {
      type: 'array',
      items: { type: 'string' },
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
} as const;

type CerebrasResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: Record<string, number>;
};

const SYSTEM = `You read a photographed Indian hospital discharge summary and final bill, and you return structured data about what is on the page.

You are standing in for a TPA medical officer reading this file three weeks from now. Report what they will find missing.

Hard rules, in order of importance:

1. You never write a clinical fact. Not a diagnosis, not a symptom, not a finding, not a justification. If the page does not say it, it does not exist. There is a deterministic guard downstream that will block you and it will be visible when it does.
2. clinical_statements are verbatim spans. Copy the characters off the page.
3. unestablished is a list of things the record fails to establish. Phrase each so it becomes a question for the doctor. "Why inpatient admission was required" — not "Patient required inpatient admission for IV antibiotics".
4. You do no arithmetic. Report bill amounts exactly as printed. Do not total them, do not compute a deduction, do not estimate what will be disallowed. Skip any printed TOTAL, SUBTOTAL or NET PAYABLE row — those are sums, not charges.
5. If the photograph is unreadable in part, say so via confidence and omit the field. A confident wrong number is worse than a gap.

Be selective, not exhaustive. A discharge summary can be queried in twenty ways; a family standing at a counter with forty minutes can act on two or three. Return **at most three** missing_documents and **at most three** unestablished items, most consequential first — judged by how much money rides on each and whether it can still be obtained today. If the page has an explicit list such as "Missing at discharge", treat every listed item as evidence: copy each item faithfully and do not omit a secondary document just because a more common gap appears first. If the list says the bill is not fully itemised, preserve that as a request for the fully itemised bill.

For ped_trigger_phrases, copy the exact visible phrase when the page records a pre-existing condition or history that could trigger a pre-existing-disease review (for example, "k/c/o DM since 15 years"). Do not translate, expand, or infer it; omit it only when the phrase is not actually visible.

Domain context for that judgement, from public Ombudsman awards: the single most common missing document in Indian health claims is the indoor case papers (the ward's day-by-day nursing and treatment record), and the single most consequential unwritten statement is why inpatient admission was required at all. Check for both before anything else. Report them only if this page genuinely lacks them.`;

export async function POST(request: Request) {
  const started = Date.now();
  let allowFixture = false;
  try {
    const { image, media_type, allow_fixture } = await request.json();
    allowFixture = Boolean(allow_fixture);

    const imagePayload = validateImagePayload(image, media_type);
    if (!imagePayload.ok) return NextResponse.json({ error: imagePayload.error }, { status: 400 });
    if (!hasLiveReaderKey()) {
      const withoutKey = extractWithoutKey(allowFixture);
      if (withoutKey.kind === 'fixture') {
        return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: withoutKey.source });
      }
      return NextResponse.json({ error: withoutKey.error }, { status: withoutKey.status });
    }

    const validatedAt = Date.now();

    const modelStarted = Date.now();
    const response = await fetch(LIVE_READER.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env[LIVE_READER.env]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 4_096,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imagePayload.mediaType};base64,${image}`,
                },
              },
              {
                type: 'text',
                text:
                  'This is the discharge summary and final bill handed over at the counter. ' +
                  'Extract it. Report what a TPA will find missing.',
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'postdated_extraction',
            strict: true,
            schema: EXTRACTION_SCHEMA,
          },
        },
      }),
    });
    const modelFinishedAt = Date.now();

    if (!response.ok) {
      throw new Error(`${LIVE_READER.provider} returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as CerebrasResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      if (allowFixture) {
        return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_no_text' });
      }
      return NextResponse.json({ error: 'The image reader returned no extraction.' }, { status: 502 });
    }

    const parsed = JSON.parse(text) as Extraction;
    const decided = decideLiveExtraction(parsed, allowFixture);
    if (!decided.ok) {
      return NextResponse.json({ error: decided.error }, { status: decided.status });
    }

    const finishedAt = Date.now();
    const trace: ProcessTrace = {
      tool_calls: 0,
      model_calls: 1,
      steps: [
        { name: 'input_validation', latency_ms: validatedAt - started },
        { name: 'model_call', latency_ms: modelFinishedAt - modelStarted },
        { name: 'response_parse', latency_ms: finishedAt - modelFinishedAt },
      ],
      total_latency_ms: finishedAt - started,
    };

    return NextResponse.json({
      extraction: decided.extraction,
      source: decided.source,
      latency_ms: finishedAt - started,
      trace,
      usage: data.usage,
    });
  } catch (error) {
    if (allowFixture) {
      return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_error' });
    }
    console.error('extract failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json(
      { error: 'The image could not be read. Try a sharper, brighter photograph.' },
      { status: 502 },
    );
  }
}
