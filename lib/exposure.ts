/**
 * Seeded exposure figures — POSTDATED.md §11 lists the demo cases as seeded, and this
 * is the seeded part of them.
 *
 * These are what the TPA *asserts* is unsubstantiated when a document is missing. They
 * are not derived by us and they are never emitted by the model — a rupee figure from
 * the photograph reader would violate the architectural line in CONTEXT.md. In a real implementation
 * each figure would be the residual of the bill heads that document substantiates, read
 * off the payer's own prior decisions for that hospital.
 *
 * An item with no figure here contributes nothing and is left off the letter entirely.
 * A red line with no rupees against it is not a disallowance, it is noise — and inventing
 * a number to fill it would be the one thing this whole design refuses to do.
 */
const SEEDED_EXPOSURE: ReadonlyArray<{
  /** Distinct pot of money. Two extracted items must never both claim the same one. */
  id: string;
  matches: readonly string[];
  amount: number;
}> = [
  {
    id: 'ward_record',
    // A live read of the same page phrased this as "Indoor case papers / nursing notes"
    // and as "Indoor case papers (day-by-day nursing and treatment record)", so the
    // lookup matches on phrases rather than on string equality.
    matches: ['indoor case papers', 'nursing notes', 'ward notes', 'day wise treatment record'],
    amount: 85_000,
  },
  {
    id: 'admission_necessity',
    // Live reads phrase this several ways: "Why inpatient admission of 4 nights was
    // required", "Whether the Deluxe Single Room category was medically necessary".
    // They are the same argument about the same money, which is why they share an id.
    matches: [
      'inpatient admission',
      'why admission',
      'medically necessary',
      'medical necessity',
      'length of stay',
      'room category',
    ],
    amount: 40_000,
  },
];

export interface Exposure {
  id: string;
  amount: number;
}

export function exposureFor(item: string): Exposure | null {
  const needle = normalise(item);
  const hit = SEEDED_EXPOSURE.find((e) => e.matches.some((m) => needle.includes(normalise(m))));
  return hit ? { id: hit.id, amount: hit.amount } : null;
}

/** Punctuation and casing vary between a hand-written fixture and a live read. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
