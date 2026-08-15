import { NextResponse } from 'next/server';
import type { ProcessTrace } from '@/lib/process';
import type { BillHead } from '@/lib/types';
import type { Policy } from '@/lib/policy';
import { validateImagePayload } from '@/lib/upload-validation';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const MODEL = 'gemma-4-31b';
const HEADS: BillHead[] = [
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
];

const POLICY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'insurer',
    'product',
    'sum_insured',
    'room_category',
    'eligible_rate_per_day',
    'proportionate_heads',
    'clause_verbatim',
    'clause_ref',
  ],
  properties: {
    insurer: { type: 'string' },
    product: { type: 'string' },
    sum_insured: { type: 'integer' },
    room_category: { type: 'string' },
    eligible_rate_per_day: { type: 'integer' },
    proportionate_heads: { type: 'array', items: { type: 'string', enum: HEADS } },
    clause_verbatim: { type: 'string' },
    clause_ref: { type: 'string' },
  },
} as const;

type PolicyResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

const SYSTEM = `Read a photographed Indian health-insurance policy schedule or room-rent clause.
Return only the exact policy fields in the requested schema. Never invent wording. If the page
does not show a field clearly, use an empty string or zero. The supported calculator needs the
room category, eligible daily rate, the exact closed list of associated medical expense heads,
and the verbatim clause plus its page or section reference.`;

export async function POST(request: Request) {
  const started = Date.now();
  try {
    const { image, media_type } = await request.json();
    const imagePayload = validateImagePayload(image, media_type);
    if (!imagePayload.ok) return NextResponse.json({ error: imagePayload.error }, { status: 400 });

    if (!process.env.CEREBRAS_API_KEY) {
      return NextResponse.json(
        { error: 'Policy photo reading is not configured. Pick the supported insurer instead.' },
        { status: 503 },
      );
    }

    const validatedAt = Date.now();
    const modelStarted = Date.now();
    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 2_048,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the policy schedule and room-rent clause from this page.' },
              {
                type: 'image_url',
                image_url: { url: `data:${imagePayload.mediaType};base64,${image}` },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'postdated_policy', strict: true, schema: POLICY_SCHEMA },
        },
      }),
    });
    const modelFinishedAt = Date.now();

    if (!response.ok) throw new Error(`Cerebras returned HTTP ${response.status}`);

    const data = (await response.json()) as PolicyResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('policy response was empty');

    const parsed = JSON.parse(text) as {
      insurer: string;
      product: string;
      sum_insured: number;
      room_category: string;
      eligible_rate_per_day: number;
      proportionate_heads: BillHead[];
      clause_verbatim: string;
      clause_ref: string;
    };

    const elected = Boolean(parsed.room_category && parsed.eligible_rate_per_day > 0);
    const policy: Policy = {
      insurer: parsed.insurer,
      product: parsed.product,
      sum_insured: parsed.sum_insured,
      room_type_modification: elected
        ? {
            elected: true,
            category: parsed.room_category,
            eligible_rate_per_day: parsed.eligible_rate_per_day,
          }
        : { elected: false },
      proportionate_heads: parsed.proportionate_heads,
      clause_verbatim: parsed.clause_verbatim,
      clause_ref: parsed.clause_ref,
    };
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

    return NextResponse.json({ policy, source: 'live', latency_ms: finishedAt - started, trace });
  } catch (error) {
    console.error('policy extraction failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json(
      { error: 'The policy page could not be read. Pick the insurer instead or try a clearer page.' },
      { status: 502 },
    );
  }
}
