/**
 * Seeded exposure figures — POSTDATED.md §11 lists the demo cases as seeded, and this
 * is the seeded part of them.
 *
 * These are what the TPA *asserts* is unsubstantiated when a document is missing. They
 * are not derived by us and they are never emitted by the model — a rupee figure from
 * Claude would violate the architectural line in CONTEXT.md. In a real implementation
 * each figure would be the residual of the bill heads that document substantiates, read
 * off the payer's own prior decisions for that hospital.
 *
 * An item with no figure here contributes nothing and is left off the letter entirely.
 * A red line with no rupees against it is not a disallowance, it is noise — and inventing
 * a number to fill it would be the one thing this whole design refuses to do.
 */
const SEEDED_EXPOSURE: ReadonlyArray<{ matches: readonly string[]; amount: number }> = [
  {
    // A live read of the same page phrased this as "Indoor case papers / nursing notes",
    // so the lookup matches on the phrase rather than on string equality.
    matches: ['indoor case papers', 'nursing notes', 'ward notes', 'day-wise treatment record'],
    amount: 85_000,
  },
  {
    matches: [
      'inpatient admission was required',
      'why admission',
      'medically necessary',
      'medical necessity',
      'length of stay',
      'room category',
    ],
    amount: 40_000,
  },
];

export function exposureFor(item: string): number {
  const needle = normalise(item);
  return SEEDED_EXPOSURE.find((e) => e.matches.some((m) => needle.includes(normalise(m))))?.amount ?? 0;
}

/** Punctuation and casing vary between a hand-written fixture and a live read. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
