import type { BillHead, Extraction } from './types';

export const EXTRACTION_HEADS: readonly BillHead[] = [
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

export const EXTRACTION_SCHEMA = {
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
    clinical_statements: { type: 'array', items: { type: 'string' } },
    bill_lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['head', 'label', 'amount'],
        properties: {
          head: { type: 'string', enum: EXTRACTION_HEADS },
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
    missing_documents: { type: 'array', maxItems: 3, items: { type: 'string' } },
    unestablished: { type: 'array', maxItems: 3, items: { type: 'string' } },
    ped_trigger_phrases: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
} as const;

export const EXTRACTION_SYSTEM = `You read a photographed Indian hospital discharge summary and final bill, and you return structured data about what is on the page.

You are standing in for a TPA medical officer reading this file three weeks from now. Report what they will find missing.

Hard rules, in order of importance:

1. You never write a clinical fact. Not a diagnosis, not a symptom, not a finding, not a justification. If the page does not say it, it does not exist. There is a deterministic guard downstream that will block you and it will be visible when it does.
2. clinical_statements are verbatim spans. Copy the characters off the page.
3. unestablished is a list of things the record fails to establish. Phrase each so it becomes a question for the doctor. "Why inpatient admission was required" — not "Patient required inpatient admission for IV antibiotics".
4. You do no arithmetic. Report bill amounts exactly as printed. Do not total them, do not compute a deduction, do not estimate what will be disallowed. Skip any printed TOTAL, SUBTOTAL or NET PAYABLE row — those are sums, not charges.
5. If the photograph is unreadable in part, say so via confidence and omit the field. A confident wrong number is worse than a gap.

Be selective, not exhaustive. A discharge summary can be queried in twenty ways; a family standing at a counter with forty minutes can act on two or three. Return **at most three** missing_documents and **at most three** unestablished items, most consequential first — judged by how much money rides on each and whether it can still be obtained today.

Domain context for that judgement, from public Ombudsman awards: the single most common missing document in Indian health claims is the indoor case papers (the ward's day-by-day nursing and treatment record), and the single most consequential unwritten statement is why inpatient admission was required at all. Check for both before anything else. Report them only if this page genuinely lacks them.`;

export class ExtractionValidationError extends Error {
  constructor() {
    super('The provider returned an invalid extraction.');
    this.name = 'ExtractionValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown, maxItems = 100): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => typeof item === 'string' && item.length <= 2_000)
  );
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

export function parseExtraction(value: unknown): Extraction {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'clinical_statements',
      'bill_lines',
      'room',
      'missing_documents',
      'unestablished',
      'ped_trigger_phrases',
      'confidence',
    ])
  ) {
    throw new ExtractionValidationError();
  }

  const room = value.room;
  const billLines = value.bill_lines;
  if (
    !isStringArray(value.clinical_statements) ||
    !Array.isArray(billLines) ||
    billLines.length > 500 ||
    !isRecord(room) ||
    !hasOnlyKeys(room, ['category_as_billed', 'rate_per_day', 'nights']) ||
    typeof room.category_as_billed !== 'string' ||
    room.category_as_billed.length > 500 ||
    !isSafeInteger(room.rate_per_day) ||
    !isSafeInteger(room.nights) ||
    !isStringArray(value.missing_documents, 3) ||
    !isStringArray(value.unestablished, 3) ||
    !isStringArray(value.ped_trigger_phrases) ||
    !['high', 'medium', 'low'].includes(value.confidence as string)
  ) {
    throw new ExtractionValidationError();
  }

  const parsedBillLines = billLines.map((line) => {
    if (
      !isRecord(line) ||
      !hasOnlyKeys(line, ['head', 'label', 'amount']) ||
      !EXTRACTION_HEADS.includes(line.head as BillHead) ||
      typeof line.label !== 'string' ||
      line.label.length > 500 ||
      !isSafeInteger(line.amount)
    ) {
      throw new ExtractionValidationError();
    }

    return { head: line.head as BillHead, label: line.label, amount: line.amount };
  });

  return {
    clinical_statements: value.clinical_statements,
    bill_lines: parsedBillLines,
    room: {
      category_as_billed: room.category_as_billed,
      rate_per_day: room.rate_per_day,
      nights: room.nights,
    },
    missing_documents: value.missing_documents,
    unestablished: value.unestablished,
    ped_trigger_phrases: value.ped_trigger_phrases,
    confidence: value.confidence as Extraction['confidence'],
  };
}
