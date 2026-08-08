/**
 * Seeded exposure figures — POSTDATED.md §11 lists the demo cases as seeded, and this
 * is the seeded part of them.
 *
 * These are what the TPA *asserts* is unsubstantiated when a document is missing. They
 * are not derived by us and they are never emitted by the model — a rupee figure from
 * Claude would violate the architectural line in CONTEXT.md. In a real implementation
 * each figure would be the residual of the bill heads that document substantiates,
 * read off the payer's own prior decisions for that hospital.
 *
 * Anything not in this table contributes nothing, so an extraction that surfaces a
 * missing document we have no exposure figure for shows on the letter with no rupees
 * against it rather than a number we made up.
 */
export const SEEDED_EXPOSURE: Readonly<Record<string, number>> = {
  'Indoor case papers': 85_000,
  'Why inpatient admission was required': 40_000,
};

export function exposureFor(item: string): number {
  return SEEDED_EXPOSURE[item] ?? 0;
}
