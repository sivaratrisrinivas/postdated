import { describe, expect, it } from 'vitest';
import { computeForecast } from './deduct';
import { NIVA_BUPA_REASSURE_2, type Policy } from './policy';
import type { Extraction } from './types';

/**
 * Expected values here come from the worked example in docs/research/policy-parameters.md
 * §3.4 — hand-derived against Niva's four-head list, not recomputed the way the code does.
 */

/** Ravi's father. Laparoscopic cholecystectomy, four nights, ₹2,40,000 final bill. */
const ravi: Extraction = {
  clinical_statements: [],
  room: { category_as_billed: 'Deluxe Single Room', rate_per_day: 8_000, nights: 4 },
  bill_lines: [
    { head: 'room_rent', label: 'Room rent (4 nights @ 8,000)', amount: 32_000 },
    { head: 'nursing', label: 'Nursing charges', amount: 12_000 },
    { head: 'practitioners_fees', label: "Surgeon & physicians' fees", amount: 30_000 },
    { head: 'operation_theatre', label: 'Operation theatre charges', amount: 14_000 },
    { head: 'non_payable_consumables', label: 'Gloves, PPE kit, syringes', amount: 15_000 },
    { head: 'pharmacy_consumables', label: 'Pharmacy', amount: 42_000 },
    { head: 'implants_devices', label: 'Endoclips and trocar', amount: 35_000 },
    { head: 'diagnostics', label: 'Laboratory and imaging', amount: 28_000 },
    { head: 'anaesthesia_blood_oxygen', label: 'Anaesthesia, oxygen', amount: 20_000 },
    { head: 'misc', label: 'Registration and admin', amount: 12_000 },
  ],
  missing_documents: ['Indoor case papers'],
  unestablished: ['Why inpatient admission was required'],
  ped_trigger_phrases: [],
  confidence: 'high',
};

describe('computeForecast — Niva Bupa proportionate deduction', () => {
  it('bills the whole ₹2,40,000 it was given', () => {
    expect(computeForecast(ravi, NIVA_BUPA_REASSURE_2).claimed).toBe(240_000);
  });

  it('charges the room-rent excess at the plain difference, not the ratio', () => {
    // ₹8,000/night actual against a ₹5,000/night elected category, four nights:
    // 32,000 − 20,000 = 12,000. The clause calls this "the difference in room rent".
    const roomLine = computeForecast(ravi, NIVA_BUPA_REASSURE_2).lines.find((l) =>
      l.reason.includes('Room rent'),
    );
    expect(roomLine?.amount).toBe(12_000);
  });

  it('applies the ratio to the other three heads and nothing else', () => {
    // Payable fraction 5,000/8,000 = 0.625, so 0.375 is cut from each in-scope head:
    //   nursing            12,000 × 0.375 =  4,500
    //   practitioners      30,000 × 0.375 = 11,250
    //   operation theatre   14,000 × 0.375 =  5,250
    //                                       -------
    //                                        21,000
    const line = computeForecast(ravi, NIVA_BUPA_REASSURE_2).lines.find((l) =>
      l.reason.includes('Proportionate deduction'),
    );
    expect(line?.amount).toBe(21_000);
  });

  it('leaves pharmacy, implants, diagnostics and anaesthesia untouched by the ratio', () => {
    // The clause names the first three as exclusions. Anaesthesia survives because the
    // list is closed — HDFC Ergo's wording would hit it, Niva's does not.
    const forecast = computeForecast(ravi, NIVA_BUPA_REASSURE_2);
    const proportionateTotal = forecast.lines
      .filter((l) => l.reason.includes('Room rent') || l.reason.includes('Proportionate'))
      .reduce((sum, l) => sum + l.amount, 0);
    expect(proportionateTotal).toBe(33_000);
  });

  it('disallows non-payable consumables in full', () => {
    const line = computeForecast(ravi, NIVA_BUPA_REASSURE_2).lines.find((l) =>
      l.reason.includes('Non-payable'),
    );
    expect(line?.amount).toBe(15_000);
  });

  it('puts the room and consumables lines in Bucket A, totalling ₹48,000', () => {
    const forecast = computeForecast(ravi, NIVA_BUPA_REASSURE_2);
    const bucketA = forecast.lines
      .filter((l) => l.bucket === 'A')
      .reduce((sum, l) => sum + l.amount, 0);
    expect(bucketA).toBe(48_000);
  });

  it('puts the missing document and the unwritten sentence in Bucket C, totalling ₹1,25,000', () => {
    const forecast = computeForecast(ravi, NIVA_BUPA_REASSURE_2);
    const bucketC = forecast.lines
      .filter((l) => l.bucket === 'C')
      .reduce((sum, l) => sum + l.amount, 0);
    expect(bucketC).toBe(125_000);
  });

  it('reaches the SMS numbers: ₹1,73,000 disallowed, ₹67,000 approved', () => {
    const forecast = computeForecast(ravi, NIVA_BUPA_REASSURE_2);
    expect(forecast.disallowed).toBe(173_000);
    expect(forecast.approved).toBe(67_000);
  });

  it('never returns a fractional rupee', () => {
    for (const line of computeForecast(ravi, NIVA_BUPA_REASSURE_2).lines) {
      expect(Number.isInteger(line.amount)).toBe(true);
    }
  });
});

describe('computeForecast — the schedule election is load-bearing', () => {
  const noElection: Policy = {
    ...NIVA_BUPA_REASSURE_2,
    room_type_modification: { elected: false },
  };

  it('produces no proportionate deduction at all when Room Type Modification was never bought', () => {
    // "We don't limit your choice." Same bill, same upgrade, no cap — so no ratio.
    const forecast = computeForecast(ravi, noElection);
    expect(forecast.lines.some((l) => l.reason.includes('Proportionate'))).toBe(false);
    expect(forecast.lines.some((l) => l.reason.includes('Room rent'))).toBe(false);
  });

  it('still disallows the non-payable consumables, which do not depend on room category', () => {
    expect(computeForecast(ravi, noElection).lines.some((l) => l.reason.includes('Non-payable'))).toBe(
      true,
    );
  });
});

describe('computeForecast — the room upgrade may not have happened', () => {
  const withinCategory: Extraction = {
    ...ravi,
    room: { category_as_billed: 'Single Private Room', rate_per_day: 4_500, nights: 4 },
    bill_lines: ravi.bill_lines.map((l) =>
      l.head === 'room_rent' ? { ...l, amount: 18_000 } : l,
    ),
  };

  it('deducts nothing proportionate when the room billed under the eligible rate', () => {
    const forecast = computeForecast(withinCategory, NIVA_BUPA_REASSURE_2);
    expect(forecast.lines.some((l) => l.reason.includes('Proportionate'))).toBe(false);
  });
});

describe('computeForecast — the forward date is the idea', () => {
  it('dates the letter 26 days after the discharge it was handed', () => {
    const discharge = new Date('2026-08-08T00:00:00Z');
    const forecast = computeForecast(ravi, NIVA_BUPA_REASSURE_2, discharge);
    expect(forecast.letter_date.toISOString().slice(0, 10)).toBe('2026-09-03');
  });
});
