# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a 35–50 year-old adult child at a mid-tier Bengaluru private hospital's
discharge counter after a parent has been admitted for several days. They are holding discharge
paperwork, have not read the policy wording, and need to know what can still be fixed before the
doctor and ward records become unavailable.

The paying customer is the hospital insurance-desk executive who processes cashless claims and
wants the paperwork to survive the payer's review.

## Product Purpose

POSTDATED reads a photographed discharge summary and bill, applies a known insurer policy, and
shows the likely future deduction letter early enough for the family or hospital desk to act.
Success means the user can identify and request the highest-value fix while the doctor and records
are still in the building.

## Positioning

The product turns a future insurance consequence into a present, editable artefact: a forecast
letter with rupee figures and payer-style reasons, followed by the one physical document request
or doctor question that can address a recoverable line.

## Operating Context

The core use scene is a busy hospital discharge counter in Bengaluru, often with poor lighting,
bad connectivity, small type, multiple pages, handwriting, abbreviations, and limited time. The
forecast is meant to be understood with the sound off and the ask sheet may be held up to a ward
clerk in English, Kannada, or Hindi.

## Capabilities and Constraints

- The current demo supports one pre-parsed insurer policy or an optional policy-photo read, three
  committed demo cases, a custom single-image discharge-summary upload, a deterministic forecast,
  a document/doctor ask, a before-you-sign gate, and a re-photograph loop.
- The core consumer journey must be achievable in no more than three screens/actions: capture,
  read the future letter, and act on one fixable line.
- The system never invents a clinical fact. It may demand a document or ask the treating doctor a
  question; only the doctor can confirm and sign a clinical statement.
- Arithmetic, policy deductions, resolution state, and the fabrication guard remain deterministic
  code paths rather than model-generated claims.
- The app is session-only: no auth, accounts, HIS integration, claim filing, or retention of
  photographed medical documents.
- Synthetic demo data must be labelled honestly. The forecast is not calibrated against real
  approved/denied pairs and false-green rate is unmeasured.

## Evidence on Hand

- Product brief and safety boundary: `POSTDATED.md` and `CONTEXT.md`.
- Hand-read Ombudsman repudiation-ground taxonomy: `docs/research/ombudsman-repudiation-grounds.md`.
- Per-insurer policy parameters: `docs/research/policy-parameters.md`.
- Ten fictional image-based evaluation cases and handwritten ground truth: `evals/corpus/`.
- The deterministic guard, forecast engine, and current seeded demo fixture are in `lib/`.

## Product Principles

- Show the consequence early enough to change the outcome.
- Make the next physical action unambiguous.
- Never write a clinical fact the record does not establish.
- Keep arithmetic and policy logic auditable and deterministic.
- Be explicit about what the system cannot see or promise.

## Accessibility & Inclusion

The critical action must be keyboard reachable, focus-visible, and legible at desktop and mobile
widths. The trilingual ask sheet must preserve Kannada and Devanagari shaping and use sufficiently
large text to be shown to a clerk.
