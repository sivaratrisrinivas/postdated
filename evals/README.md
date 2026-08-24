# POSTDATED evaluation harness

This harness measures the claims the hackathon demo is allowed to make. It does not
produce one flattering headline score.

All forty case packs are fictional. They are synthetic documents, synthetic bills, and
synthetic ground truth. Nothing in `evals/` is a real patient record, and the harness
does not retain uploaded documents after a run.

The corpus keeps the original 10-case split: 16 safety cases, 12 deterministic-money
cases, and 12 end-to-end workflow cases. Every pack still runs through every offline
gate. The labels describe what the case is for, not a separate score.

## Evaluation design from first principles

The product promise is a chain, not a model benchmark:

```text
photographed record → source-grounded read → safe physical ask
                   → deterministic forecast → one counter action
                   → re-read → only the fixable line clears
```

Each link has a different kind of truth, so the harness keeps five gates separate:

| Gate | What is being proven | What counts as failure |
|---|---|---|
| Safety | The system never turns an absent/negated clinical fact into an assertion | Any unsupported clinical span, unsafe ask, or unsafe confidence on an unreadable case |
| Usable read | A photograph becomes a letter only when the read produced a real bill | A high-confidence empty `bill_lines` array shown as a finished ₹0 letter, or invented charges used to fill the gap |
| Deterministic | The money and state transitions obey the policy contract | Any balance error, duplicate charge, negative/fractional rupee, subtotal double-count, or policy loss cleared by a document fix |
| Non-deterministic task | A live read is useful without pretending to be calibrated | Field-level money/room errors, missed recoverable grounds, hallucinated text, or no safe abstention |
| End-to-end workflow | The same output survives the complete product journey | The read cannot produce a safe action, the action does not clear exactly its expected line, or applying it twice changes the result |

The safety, usable-read, deterministic, and reference-workflow tracks are release gates: zero failures.
The non-deterministic track reports field-level precision, recall, grounding, and abstention
separately; those numbers must not compensate for a safety or arithmetic failure. The reference
workflow is offline and uses hand-written truth. When a live key is present, each model response
is also fed through the deterministic forecast and physical-ask guard so the route is evaluated
as the app uses it, not as an isolated JSON endpoint.

### Clear rubric

The machine-readable rubric is versioned in `evals/rubric.ts` (`postdated-e2e-2026-08-24-v2`).
Every criterion has a binary question and concrete pass/fail examples. The release criteria are
source grounding, safe abstention, safe physical asks, usable read, amount conservation, invariance, and exact
resolution deltas. “Next action” is diagnostic because usefulness needs human review; it cannot
compensate for a safety failure.

The product-chain eval (`evals/product.eval.ts`) is the first-principles gate for the
running app, not the fictional corpus. It would have caught the production failure
where a live read returned `confidence=high` and `bill_lines=[]` and the UI presented
a finished ₹0 letter. It also locks the fixture path
₹1,73,000 → ₹88,000 → ₹48,000, the rule that a custom upload without
`CEREBRAS_API_KEY` is 503, that demo cases stay on the committed extraction, and
that the fabrication guard still blocks invented diagnosis text. It never invents
bill lines to make an empty read look full.

### Human alignment

The repository does not contain human labels yet, so the run reports human alignment as
**unmeasured**, never as a guessed score. To measure it, create a JSON array and point
`POSTDATED_HUMAN_ALIGNMENT_PATH` at it:

```json
[
  {
    "case_id": "case-01-fever-negation",
    "rubric_id": "safety.source_grounding",
    "automated_decision": "pass",
    "human_decision": "pass",
    "expert_decision": "pass",
    "evidence_codes": ["source_span"]
  }
]
```

The scorer reports automated agreement with both human and expert decisions, plus human–expert
agreement. It requires at least 20 adjudicated decisions and both automated agreement rates to be
at least 80% before reporting `passed`. Reviewers should be blinded to the automated decision and
record concise evidence codes before choosing pass/fail.

### Process tracking

Live extraction and policy routes return non-sensitive telemetry for input validation, the model
call, and response parsing. The live table reports model calls, tool calls, step count, per-case
latency, and model/local latency shares. The reference workflow separately reports checks by
phase; a fast response never earns quality credit.

### Bias control

For preference studies, put pairwise reviews in a JSON array and set
`POSTDATED_PAIRWISE_REVIEW_PATH`. `evals/bias.eval.ts` gives each comparison a stable seeded A/B
order, asks for evidence codes before the choice, and measures first-position bias and whether
the chosen output is systematically longer. Hidden chain-of-thought is not collected; the fixed
evidence checklist is the auditable substitute. The release limits are 10 percentage points for
position bias and 20% for normalized length bias, with at least 20 pairwise reviews.

## Run it

The offline checks — product chain, guard, resolution, invariants, and
reference workflow — need no API key:

```sh
npm run eval
```

That runs the product-chain, guard, and resolution checks, then skips live extraction with a clear message
when `CEREBRAS_API_KEY` is absent.

To score the live route, start the app in another terminal and set the key:

```sh
npm run dev
CEREBRAS_API_KEY=... npm run eval
```

Set `POSTDATED_EVAL_URL` when the app is not at `http://localhost:3000`.

The default `POSTDATED_EVAL_DELAY_MS=13000` spaces requests for Cerebras Free Trial's
5 requests-per-minute limit. Set it lower only when the account has a higher limit.

If `/api/extract` returns `source=fixture`, the case fails. The fixture is valid demo
fallback behaviour, but it is not an extraction evaluation.

## The case packs

Each folder contains:

- `source.md`: the fictional source document;
- `printable.html`: an A4-printable version of the same document;
- `input.png`: the image sent to the live extraction route;
- `ground-truth.json`: hand-written expected fields, guard verdicts, and the one document
  change allowed to clear during resolution.

The cases deliberately include negated symptoms, a handwritten note, missing indoor case
papers, a room above the schedule limit, non-payable consumables, an under-24-hour stay,
an unreadable section, an affirmed fever, an implant-document gap, a mixed case, and
thirty further handwritten variants that keep the same safety / money / workflow split.

## Metrics

| Metric | How this harness reports it |
|---|---|
| Ground coverage vs. Ombudsman taxonomy | **4 fully / 12 partly / 8 not seen**, from the hand-read public research already in `docs/research/ombudsman-repudiation-grounds.md` |
| Policy-parameter extraction accuracy | Per-field exact rows for bill money, room category/rate/nights, missing documents, unestablished items, PED phrases, hallucinated clinical fields, and safe abstention; compared with hand-written truth |
| Fabrication-guard safety | Adversarial block recall and false-block rate over every fictional case, with negation quotes checked where the source says “no” |
| Deterministic invariants | Totals balance, no negative/fractional rupees, no duplicate reasons, physical asks remain guard-safe, bill order is irrelevant, and printed subtotal rows cannot double a claim |
| Process and latency | Per-case milliseconds plus model/tool calls, step count, and model/local latency shares; fixture responses fail the case |
| **False-green rate** | **Unmeasured — say so.** There are no real approved/denied pairs in this corpus. |

The live table additionally reports precision alongside recall for unestablished items and
pre-existing-disease trigger phrases, source-grounded clinical statements, and whether the live
result survives the end-to-end workflow gate.

The extraction report intentionally does not collapse money, room fields, missing
documents, hallucinations, and abstention into a single number. A model can be right on
money and wrong on a safety field; the table must keep those facts visible.

The extraction report also shows set precision and recall for missing documents, unestablished
items, and PED phrases alongside the exact-string result. Exact matching remains visible because
wording matters for the demo, while precision/recall show whether a live read found the expected
issue under minor phrasing variation without flooding the user with extra asks. Missing-document
and PED exact-string differences are diagnostic warnings rather than release-gate failures: a
safe paraphrase or an extra safe ask should not create a false red. The gate still fails on
transport/fallback responses, money or room errors, wrong doctor questions, unsupported clinical
text, and unsafe confidence.

## What a stronger evaluation needs next

The forty-case harness is a deterministic release gate, not a calibration study.
Keep these as separate tracks rather than inventing one headline score:

1. **Safety gate:** zero unsupported clinical statements, zero unsafe high-confidence reads on
   unreadable cases, zero high-confidence empty bills presented as finished letters,
   guard-safe physical asks, and exact arithmetic invariants.
2. **Task utility:** blinded reviewers score whether a clinician or desk executive can identify
   the next document/doctor action in under 20 seconds.
3. **Extraction fidelity:** measure field-level precision, recall, and abstention on a larger,
   stratified corpus covering clear print, handwriting, blur, glare, skew, negation, and mixed
   bills.
4. **Outcome calibration:** only add false-green/false-red rates once paired approved/denied
   outcomes are available from a payer or a properly governed de-identified dataset. Until then,
   report the rate as unmeasured.
5. **Robustness:** run the same truth through image perturbations and harmless input changes such
   as bill-line reordering and duplicate total rows. The deterministic invariant suite covers the
   latter two now.

The offline reference workflow now covers the last-mile composition in this repository. It is
still not a calibration study: the model may be useful and safe on these cases while its future
deny/approve probability remains unknown.

The regression workflow in `.github/workflows/regression.yml` runs tests, type-checking, lint,
production build, and the 40-case offline eval on every push and pull request. The eval step
fails the job if any safety, money, or workflow gate fails, or if the corpus shrinks. Live
extraction remains an explicit opt-in because it consumes provider quota; when the key and
dev server are available, `npm run eval` adds that live gate.
