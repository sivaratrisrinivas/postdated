import { documentDemandFor, doctorQuestionFor } from './asks';
import { exposureFor } from './exposure';
import { NON_PAYABLE_CONSUMABLES, type Policy } from './policy';
import type { Disallowance, Extraction, Forecast } from './types';

/** POSTDATED.md §4: the letter is dated ~26 days ahead. */
const FORWARD_DAYS = 26;

/**
 * The whole of the arithmetic. No model call reaches this file, and none ever should —
 * "arithmetic never touches the model" is a claim made from the stage, and this module
 * is the thing that makes it true.
 */
export function computeForecast(
  extraction: Extraction,
  policy: Policy,
  dischargeDate: Date = new Date(),
): Forecast {
  const claimed = extraction.bill_lines.reduce((sum, l) => sum + l.amount, 0);

  const lines: Disallowance[] = [
    ...roomRentExcess(extraction, policy),
    ...proportionateOnOtherHeads(extraction, policy),
    ...nonPayableConsumables(extraction),
  ];

  // Bucket C can only expose money the policy has not already taken. Without this
  // clamp a generous exposure table would let the letter disallow more than the bill.
  const residual = claimed - lines.reduce((sum, l) => sum + l.amount, 0);
  lines.push(...recoverable(extraction, residual));

  const disallowed = lines.reduce((sum, l) => sum + l.amount, 0);

  return {
    claimed,
    approved: claimed - disallowed,
    disallowed,
    lines,
    letter_date: addDays(dischargeDate, FORWARD_DAYS),
  };
}

/**
 * The ratio. Returns null when there is nothing to apportion — either the schedule
 * never elected a room category, or the room billed within the eligible rate.
 */
function proportion(extraction: Extraction, policy: Policy) {
  const mod = policy.room_type_modification;
  if (!mod.elected) return null;

  const actual = extraction.room.rate_per_day;
  if (actual <= mod.eligible_rate_per_day) return null;

  return {
    eligible_rate: mod.eligible_rate_per_day,
    actual_rate: actual,
    /** "Eligible Room Rent limit / Room Rent actually incurred" — the clause's own equation. */
    payable_fraction: mod.eligible_rate_per_day / actual,
    category: mod.category,
  };
}

/**
 * Room rent is one of the four Associated Medical Expenses, but the clause treats it
 * separately: the ratio applies to the other heads "in addition to the difference in
 * room rent". So the room line is a plain subtraction, not a proportion.
 */
function roomRentExcess(extraction: Extraction, policy: Policy): Disallowance[] {
  const p = proportion(extraction, policy);
  if (!p) return [];

  const billed = headTotal(extraction, ['room_rent']);
  const eligible = p.eligible_rate * extraction.room.nights;
  const excess = Math.max(0, billed - eligible);
  if (excess === 0) return [];

  return [
    {
      bucket: 'A',
      reason: `Room rent exceeds eligible category (${p.category})`,
      amount: Math.round(excess),
      basis:
        `${policy.product} schedule elects ${p.category} at ₹${p.eligible_rate.toLocaleString('en-IN')}/day. ` +
        `Billed at ₹${p.actual_rate.toLocaleString('en-IN')}/day for ${extraction.room.nights} nights. ` +
        `${policy.clause_ref}`,
    },
  ];
}

/**
 * Nursing, practitioners' fees and operation theatre — the three heads the ratio
 * multiplies. Deliberately not a filter over `policy.proportionate_heads`: pharmacy,
 * implants, diagnostics and anaesthesia are absent because the clause's list is
 * closed, and a future insurer with a wider list gets its own policy record.
 */
function proportionateOnOtherHeads(extraction: Extraction, policy: Policy): Disallowance[] {
  const p = proportion(extraction, policy);
  if (!p) return [];

  const heads = policy.proportionate_heads.filter((h) => h !== 'room_rent');
  const inScope = headTotal(extraction, heads);
  if (inScope === 0) return [];

  // One rounding, on the total, so the line on the letter equals the sum of its parts.
  const amount = Math.round(inScope * (1 - p.payable_fraction));
  if (amount === 0) return [];

  return [
    {
      bucket: 'A',
      reason: 'Proportionate deduction on associated medical expenses',
      amount,
      basis:
        `₹${p.eligible_rate.toLocaleString('en-IN')} ÷ ₹${p.actual_rate.toLocaleString('en-IN')} ` +
        `= ${(p.payable_fraction * 100).toFixed(1)}% payable, applied to nursing, ` +
        `practitioners' fees and operation theatre charges only. ` +
        `Pharmacy, implants, diagnostics and anaesthesia are outside the clause. ` +
        `"${policy.clause_verbatim}"`,
    },
  ];
}

function nonPayableConsumables(extraction: Extraction): Disallowance[] {
  const lines = extraction.bill_lines.filter(
    (l) =>
      l.head === 'non_payable_consumables' ||
      NON_PAYABLE_CONSUMABLES.some((c) => l.label.toLowerCase().includes(c)),
  );
  const amount = lines.reduce((sum, l) => sum + l.amount, 0);
  if (amount === 0) return [];

  return [
    {
      bucket: 'A',
      reason: 'Non-payable consumables',
      amount,
      basis:
        'IRDAI standardised non-payable list, plus the insurer\'s own. Matched against ' +
        `bill lines: ${lines.map((l) => l.label).join('; ')}.`,
    },
  ];
}

/**
 * Bucket C — the only part still moveable at the counter. Each line carries the
 * physical ask, and the two kinds of ask are the only outputs this system produces.
 */
function recoverable(extraction: Extraction, residual: number): Disallowance[] {
  const candidates: Disallowance[] = [
    ...extraction.missing_documents.map(
      (doc): Disallowance => ({
        bucket: 'C',
        reason: `${doc} not submitted`,
        amount: exposureFor(doc),
        basis: `The payer treats the charges this record substantiates as unproven without it.`,
        action: documentDemandFor(doc),
      }),
    ),
    ...extraction.unestablished.map(
      (item): Disallowance => ({
        bucket: 'C',
        reason: `Summary does not establish: ${item.toLowerCase()}`,
        amount: exposureFor(item),
        basis:
          'Only the treating doctor can answer this, and only the doctor can sign it. ' +
          'The system does not write it.',
        action: doctorQuestionFor(item),
      }),
    ),
  ];

  // Take lines in order until the residual is exhausted; trim the one that crosses.
  const kept: Disallowance[] = [];
  let left = Math.max(0, residual);
  for (const line of candidates) {
    if (left === 0) break;
    const amount = Math.min(line.amount, left);
    kept.push({ ...line, amount });
    left -= amount;
  }
  return kept;
}

function headTotal(extraction: Extraction, heads: readonly string[]): number {
  return extraction.bill_lines
    .filter((l) => heads.includes(l.head))
    .reduce((sum, l) => sum + l.amount, 0);
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}
