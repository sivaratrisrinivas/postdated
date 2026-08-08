import type { BillHead } from './types';

/**
 * Seeded policy parameters. Hand-read from the public wording, not model-extracted —
 * see docs/research/policy-parameters.md for the sourcing of every field here.
 */
export interface Policy {
  insurer: string;
  product: string;
  sum_insured: number;
  room_type_modification: RoomTypeModification;
  /** The closed list the proportionate ratio multiplies. Order is the clause's order. */
  proportionate_heads: BillHead[];
  clause_verbatim: string;
  clause_ref: string;
}

/**
 * ReAssure 2.0 carries NO room-rent cap by default — the wording says room rent is
 * "At Actuals unless otherwise specified in the Policy Schedule", and markets that as
 * "We don't limit your choice". A cap exists only when the policyholder bought the
 * §4.21 Room Type Modification option and a category was written onto the schedule.
 *
 * This is why the seeded case below elects a category. Without the election there is no
 * ratio, no Bucket A, and the demo's "₹48,000 we cannot recover" has no basis at all.
 */
export type RoomTypeModification =
  | { elected: false }
  | { elected: true; category: string; eligible_rate_per_day: number };

export const NIVA_BUPA_REASSURE_2: Policy = {
  insurer: 'Niva Bupa Health Insurance',
  product: 'ReAssure 2.0',
  sum_insured: 500_000,

  room_type_modification: {
    elected: true,
    category: 'Single Private Room',
    eligible_rate_per_day: 5_000,
  },

  // Four heads. No "etc.", no residual category — every bill line maps to
  // in-scope or out-of-scope with zero judgement. That is the whole reason
  // this product was chosen to lead with over Star Health.
  proportionate_heads: [
    'room_rent',
    'nursing',
    'practitioners_fees',
    'operation_theatre',
  ],

  clause_verbatim:
    'Associated Medical Expenses shall include Room Rent, nursing charges, ' +
    "Medical Practitioners' fees and operation theatre charges.",
  clause_ref: 'ReAssure 2.0 policy wording, §4.21 Room Type Modification (p.13)',
};

/**
 * The IRDAI standardised non-payable list plus the insurer's own. Matched against
 * bill labels by the deterministic engine — never by the model.
 */
export const NON_PAYABLE_CONSUMABLES = [
  'gloves',
  'ppe kit',
  'syringes',
  'apron',
  'face mask',
  'sanitizer',
  'cotton',
  'bandage roll',
] as const;
