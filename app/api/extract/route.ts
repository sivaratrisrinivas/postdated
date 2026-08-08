import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { SEEDED_EXTRACTION } from '@/lib/fixture';
import type { Extraction } from '@/lib/types';

/**
 * The one live model call on the demo's critical path: a photographed discharge summary
 * in, strict JSON out. Nothing here computes a rupee — see lib/deduct.ts.
 *
 * The API key stays on this side. It is never sent to the browser.
 */

const MODEL = 'claude-opus-5';

/**
 * Extraction is not intelligence-sensitive and the demo has a ~10s latency budget, so
 * this runs at low effort with thinking left on. If the venue makes that too slow, add
 * `thinking: { type: 'disabled' }` — legal on Opus 5 at effort `high` or below — and
 * re-measure. Don't raise effort; it buys nothing here.
 */
const EFFORT = 'low' as const;

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
      description:
        'Verbatim spans copied from the photograph. Never paraphrase, never infer, ' +
        'never add a finding the page does not contain.',
      items: { type: 'string' },
    },
    bill_lines: {
      type: 'array',
      description: 'One entry per printed bill line. Amounts in whole rupees, as printed.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['head', 'label', 'amount'],
        properties: {
          head: { type: 'string', enum: HEADS },
          label: { type: 'string', description: 'The line as printed on the bill.' },
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
      description:
        'Documents a payer will demand that this page does not contain and does not ' +
        'attach — e.g. "Indoor case papers", "Itemised bill", "Implant invoice and sticker".',
      items: { type: 'string' },
    },
    unestablished: {
      type: 'array',
      description:
        'Phrase each as the thing the record fails to establish, so it can be turned ' +
        'into a question for the treating doctor. Never write the missing sentence.',
      items: { type: 'string' },
    },
    ped_trigger_phrases: {
      type: 'array',
      description:
        'Verbatim phrases a payer typically quotes to argue pre-existing disease, ' +
        'such as "k/c/o DM since 15 years". Copy exactly. Do not judge whether the ' +
        'argument would succeed.',
      items: { type: 'string' },
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
} as const;

const SYSTEM = `You read a photographed Indian hospital discharge summary and final bill, and you return structured data about what is on the page.

You are standing in for a TPA medical officer reading this file three weeks from now. Report what they will find missing.

Hard rules, in order of importance:

1. You never write a clinical fact. Not a diagnosis, not a symptom, not a finding, not a justification. If the page does not say it, it does not exist. There is a deterministic guard downstream that will block you and it will be visible when it does.
2. clinical_statements are verbatim spans. Copy the characters off the page.
3. unestablished is a list of things the record fails to establish. Phrase each so it becomes a question for the doctor. "Why inpatient admission was required" — not "Patient required inpatient admission for IV antibiotics".
4. You do no arithmetic. Report bill amounts exactly as printed. Do not total them, do not compute a deduction, do not estimate what will be disallowed.
5. If the photograph is unreadable in part, say so via confidence and omit the field. A confident wrong number is worse than a gap.`;

export async function POST(request: Request) {
  try {
    const { image, media_type } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'no image' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fall back to the committed fixture rather than fail the demo.
      return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_no_key' });
    }

    const client = new Anthropic();
    const started = Date.now();

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16_000,
      system: SYSTEM,
      output_config: {
        effort: EFFORT,
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
                media_type: media_type ?? 'image/jpeg',
                data: image,
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
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_refusal' });
    }

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') {
      return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_no_text' });
    }

    const extraction = JSON.parse(text.text) as Extraction;

    return NextResponse.json({
      extraction,
      source: 'live',
      latency_ms: Date.now() - started,
      usage: response.usage,
    });
  } catch (error) {
    // The demo never dies on this path. §14: three pre-photographed cases, one keystroke.
    console.error('extract failed', error);
    return NextResponse.json({ extraction: SEEDED_EXTRACTION, source: 'fixture_error' });
  }
}
