/**
 * The vocabulary here is CONTEXT.md's. If you rename something, rename it there too.
 */

/** The four heads Niva Bupa's proportionate deduction applies to, plus the ones it doesn't. */
export type BillHead =
  // In scope for proportionate deduction (ReAssure 2.0 §"Associated Medical Expenses")
  | 'room_rent'
  | 'nursing'
  | 'practitioners_fees'
  | 'operation_theatre'
  // Explicitly out of scope — named as exclusions in the same clause
  | 'pharmacy_consumables'
  | 'implants_devices'
  | 'diagnostics'
  // Out of scope because the clause's list is closed (no "etc.")
  | 'anaesthesia_blood_oxygen'
  | 'non_payable_consumables'
  | 'misc';

export interface BillLine {
  head: BillHead;
  /** As printed on the hospital's final bill. */
  label: string;
  /** Whole rupees. No paise anywhere in this system. */
  amount: number;
}

/**
 * Everything the live photograph reader is allowed to return from a discharge summary.
 * Note what is absent: no diagnosis it inferred, no clinical claim, no rupee arithmetic.
 */
export interface Extraction {
  /** Verbatim spans only — every one must appear in the photographed document. */
  clinical_statements: string[];
  bill_lines: BillLine[];
  room: {
    /** e.g. "Single Private Room, Deluxe" — as written on the bill. */
    category_as_billed: string;
    rate_per_day: number;
    nights: number;
  };
  /** Documents the summary references or implies but does not itself contain. */
  missing_documents: string[];
  /**
   * Statements a TPA medical officer would query. Each is a question for the
   * treating doctor — never a sentence for the system to write.
   */
  unestablished: string[];
  /**
   * Phrases lifted verbatim that a payer typically quotes back as a
   * pre-existing-disease ground. Detection only; we never adjudicate PED.
   */
  ped_trigger_phrases: string[];
  confidence: 'high' | 'medium' | 'low';
}

export type Bucket = 'A' | 'B' | 'C';

export interface Disallowance {
  bucket: Bucket;
  /** The line as it will read on the letter. */
  reason: string;
  amount: number;
  /** Which clause or missing document this rests on. Shown on tap. */
  basis: string;
  /** Bucket C only: what the user physically does about it. */
  action?: DocumentDemand | DoctorQuestion;
}

export interface DocumentDemand {
  kind: 'document_demand';
  ask: string;
  ask_kn: string;
  ask_hi: string;
}

export interface DoctorQuestion {
  kind: 'doctor_question';
  ask: string;
  ask_kn: string;
  ask_hi: string;
}

export interface Forecast {
  claimed: number;
  approved: number;
  disallowed: number;
  lines: Disallowance[];
  /** Forward-dated ~26 days. The date is the idea. */
  letter_date: Date;
}
