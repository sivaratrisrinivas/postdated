import { NextResponse } from 'next/server';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import type { Extraction } from '@/lib/types';

/**
 * The one live model call on the demo's critical path: a photographed discharge summary
 * in, strict JSON out. Nothing here computes a rupee — see lib/deduct.ts.
 *
 * The API key stays on this side. It is never sent to the browser.
 */

// Cerebras' public preview exposes image inputs on this model.
const MODEL = 'gemma-4-31b';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

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

Be selective, not exhaustive. A discharge summary can be queried in twenty ways; a family standing at a counter with forty minutes can act on two or three. Return **at most three** missing_documents and **at most three** unestablished items, most consequential first — judged by how much money rides on each and whether it can still be obtained today.

Domain context for that judgement, from public Ombudsman awards: the single most common missing document in Indian health claims is the indoor case papers (the ward's day-by-day nursing and treatment record), and the single most consequential unwritten statement is why inpatient admission was required at all. Check for both before anything else. Report them only if this page genuinely lacks them.`;

export async function POST(request: Request) {
  try {
    const { image, media_type } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'no image' }, { status: 400 });
    }
    if (!process.env.CEREBRAS_API_KEY) {
      // Fall back to the committed fixture rather than fail the demo.
      return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_no_key' });
    }

    const started = Date.now();

    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
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
                type: 'text',
                text:
                  'This is the discharge summary and final bill handed over at the counter. ' +
                  'Extract it. Report what a TPA will find missing.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${media_type ?? 'image/jpeg'};base64,${image}`,
                },
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

    if (!response.ok) {
      throw new Error(`Cerebras returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as CerebrasResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_no_text' });
    }

    const extraction = JSON.parse(text) as Extraction;

    return NextResponse.json({
      extraction,
      source: 'live',
      latency_ms: Date.now() - started,
      usage: data.usage,
    });
  } catch (error) {
    // The demo never dies on this path. §14: three pre-photographed cases, one keystroke.
    console.error('extract failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_error' });
  }
}
