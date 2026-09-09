# CONTEXT — POSTDATED

The shared vocabulary for this build. Three people are writing code in parallel against one demo; if
we use three names for the same thing, the integration at T+3:15 fails.

Transcribed from [POSTDATED.md](./POSTDATED.md), which is the spec. Where the two disagree, the spec wins.

## The domain

| Term | Means |
|---|---|
| **TPA** | Third Party Administrator — processes the claim on the insurer's behalf. The adversary whose voice the letter is written in. |
| **Discharge summary** | The signed medico-legal record of the admission. Photographed at the counter. **The system never writes into it** — see Fabrication guard. |
| **Indoor case papers** | The ward's day-by-day nursing and treatment notes. The single most common missing document. |
| **Disallowance** | A line the insurer refuses to pay. Not "rejection" — a claim is usually *partially* disallowed, and the partial is the whole point. |
| **Repudiation ground** | The stated reason for a disallowance. The taxonomy of these, from public Ombudsman awards, is our ground truth (see `research/`). |
| **Room-rent sub-limit** | The ₹/day room cap in the policy. Exceeding it triggers a **proportionate deduction**. |
| **Proportionate deduction** | The cut applied across the *whole* bill — not just the room charge — when the room exceeds the sub-limit. The exact scope is per-insurer clause text; see `research/policy-parameters.md`. |
| **Non-payable consumables** | Gloves, syringes, PPE. Excluded by the IRDAI standardised list and per-insurer lists. |
| **Pre-auth** | Pre-authorisation — the cashless approval request the hospital desk files *before* treatment. The B2B surface. |
| **Medical necessity** | Whether the clinical narrative establishes that inpatient admission was required. The judgement the live reader makes; not a fact it may invent. |

## The three buckets

The core analytical split. Every disallowance is exactly one of these, and the product only targets C.

| Bucket | What it is | Recoverable at the counter? |
|---|---|---|
| **A** | The family agreed to it and never read it — room-rent sub-limit, consumables | **No.** Gone the moment the room was chosen. Shown anyway, plainly, as *"this money is gone."* |
| **B** | The hospital was indifferent — put the patient in a room the policy didn't allow | No |
| **C** | **A form was incomplete** — missing documents, an unwritten sentence | **Yes.** ~72% of the loss. This is the product. |

Showing Bucket A honestly is load-bearing: it is the reason a user believes the Bucket C lines.

## The product's own nouns

| Term | Means |
|---|---|
| **The letter** | The hero artefact. The future denial letter, forward-dated ~26 days, itemised in rupees. Not "the report", not "the analysis". |
| **The ask sheet** | What the user is told to physically do. Rendered EN / KN / HI, designed to be held up to a ward clerk. |
| **Document demand** | Output type 1 — *"ask the nursing station for the indoor case papers."* |
| **Doctor question** | Output type 2 — a question only the treating doctor can answer and sign. |
| **Fabrication guard** | The check that every clinical noun in any generated output appears in the source document or a doctor-confirmed list. Anything else is **blocked** and converted into a red `ASK THE DOCTOR` item. |
| **Dialect card** | The per-payer plain-English summary of how one TPA actually adjudicates, induced from prior cases. The B2B asset the hospital keeps. |
| **The moment** | Saturday 4 PM, discharge counter, doctor still on the floor, ~40 minutes before the file goes read-only. State it exactly; never as a category. |

## Words we do not use

These are not style preferences. Each one has a specific failure attached.

- **Never "looting."** The hospital is on our side on Bucket C — they want the claim approved too. We cannot accuse our buyer and invoice them in the same breath. Say instead: *"most of what families lose isn't stolen — it's dropped."*
- **Never rewrite a clinical fact.** Not "improve the wording", not "strengthen the narrative." That is upcoding-as-a-service and one judge sentence ends the pitch. We demand documents and we ask the doctor. Nothing else.
- **Never a model-emitted percentage.** The pre-auth indicator is a literal count over the seeded corpus — *"queried in 9 of 11 seeded Star cases."* Never "74%".
- **Never claim calibration.** The forecast is the live reader imitating a TPA medical officer, not a model trained on real approve/deny pairs. We report **coverage** against public Ombudsman grounds, and we say the false-green rate is unmeasured.

## The architectural line

**Arithmetic never touches the model, and we say that on stage.**

| Deterministic code | Live reader — Cerebras `gemma-4-31b` |
|---|---|
| Sub-limits, co-pay, waiting periods | Reading the photographed summary |
| Proportionate deduction, all rupee roll-up | Optional policy-page extraction |
| Letter versioning, the diff, the grey-out | Judging medical necessity for this payer |
| HTML letter render, the ask sheet | Phrasing missing documents and doctor questions |
| **The fabrication guard** | (dialect card was not built — see BUILD-TODAY.md) |
