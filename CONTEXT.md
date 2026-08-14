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
| **Repudiation ground** | The stated reason for a disallowance. The taxonomy of these, from public Ombudsman awards, is our ground truth (see `docs/research/`). |
| **Room-rent sub-limit** | The ₹/day room cap in the policy. Exceeding it triggers a **proportionate deduction**. |
| **Proportionate deduction** | The cut applied across the *whole* bill — not just the room charge — when the room exceeds the sub-limit. The exact scope is per-insurer clause text; see `docs/research/policy-parameters.md`. |
| **Non-payable consumables** | Gloves, syringes, PPE. Excluded by the IRDAI standardised list and per-insurer lists. |
| **Pre-auth** | Pre-authorisation — the cashless approval request the hospital desk files *before* treatment. The B2B surface. |
| **Hospital insurance-desk executive** | A hospital employee who prepares and follows cashless claims using their knowledge of insurer and TPA rules. Not an insurer or TPA employee. |
| **Medical necessity** | Whether the clinical narrative establishes that inpatient admission was required. The judgement Claude makes; not a fact it may invent. |

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
| **Shadow pilot** | A supervised hospital trial where staff finish the normal claim process before inspecting POSTDATED and never change a real case because of its output. Corrected-document practice uses fake cases; results are measured before anyone depends on them. |
| **Pilot access** | Each approved hospital employee uses their own secure account. The pilot needs basic login and access records, but not a full hospital identity-system connection. |
| **Measurement receipt** | A patient-free record returned to the hospital after one shadow run, containing the frozen system version and observations needed for local evaluation. The hospital attaches it to its private case record; POSTDATED retains no shared case identifier and receives only approved aggregate outcomes. |
| **Pilot-wide stop** | An immediate block on all real-document uploads after a safety, privacy, policy-rule, access, or deletion failure. Any participant may trigger it without prior approval; named hospital and POSTDATED owners control restart. |
| **Work list** | The hospital insurance-desk executive's main screen: possible claim risks, missing documents, doctor questions, and rupee exposure. The letter is a secondary explanation screen. |
| **Risk forecast** | A simulation of preventable disallowance risks and the arguments a payer may make. It is not a promise or a calibrated prediction of the claim outcome. |
| **Evidence-based resolution** | A risk is cleared only when comparing the old and new documents finds evidence that the problem was fixed. A button press or a new upload alone cannot clear it. |
| **Draft policy rule** | A proposed translation of policy documents into calculator inputs. A Policy Analyst owns it, AI may help prepare it, and it cannot affect money until it is checked and approved by people. |
| **Policy configuration** | The complete set of documents describing the cover a customer actually bought: the base policy wording, Policy Schedule, riders or add-ons, endorsements, and later change notices. Missing or conflicting documents require human review before a rupee result may be shown. |
| **Policy override** | Clear wording in one policy document that changes or replaces a rule in another document. A newer date alone does not prove an override; without clear wording, the conflict needs human review. |
| **Rule evidence** | The proof kept with a policy rule: exact source passages, document and version identity, applicable Schedule or rider differences, uncertainty, named human decisions, test results, and change history. A rule without this proof cannot affect money. |
| **Rule test pack** | The agreed examples a policy rule must pass before affecting money, including applying and non-applying cases, boundaries, Schedule and rider differences, missing or conflicting documents, a full sample bill, and earlier tests. AI may suggest cases but cannot provide the trusted rupee answers. |
| **Policy Analyst** | The named person who creates and owns a draft policy rule. They may use AI, but cannot check or approve their own draft. |
| **Policy Reviewer** | A different named person who checks every part of a draft policy rule against the original policy documents. |
| **Policy Rules Owner** | The senior named person accountable for approving or rejecting a checked policy rule. |
| **Pilot Publisher** | The named person allowed to activate an approved policy rule for pilot use. In a small pilot, the Policy Rules Owner may also hold this role. |
| **Verified policy rule** | A rule for one exact policy configuration whose evidence was checked by a Policy Reviewer, whose full test pack passed, and whose exact version was approved and locked by the Policy Rules Owner. AI may prepare a draft but cannot check or approve it. |
| **Pilot-active policy rule** | A verified policy rule whose exact locked version a named Pilot Publisher has separately switched on for pilot calculations. Approval alone does not make a rule pilot-active. |
| **Disabled policy rule** | A rule stopped from affecting new calculations because it may be wrong or unsafe. It remains in the history with its evidence, past uses, reason for disabling, and the person and time responsible for the emergency stop. |
| **Needs human review** | The result shown when POSTDATED lacks enough reliable evidence. Uncertainty must remain visible and can never be changed into a confident green result. |
| **The letter** | The hero artefact: the risk forecast rendered as a simulated, forward-dated payer letter with itemised rupee exposure. Not a real denial letter or guaranteed claim outcome. |
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
- **Never claim calibration.** The forecast is Claude imitating a TPA medical officer, not a model trained on real approve/deny pairs. We report **coverage** against public Ombudsman grounds, and we say the false-green rate is unmeasured.

## The architectural line

**Arithmetic never touches the model, and we say that on stage.**

| Deterministic code | Claude |
|---|---|
| Sub-limits, co-pay, waiting periods | Reading the photographed summary |
| Proportionate deduction, all rupee roll-up | Extracting params from a 40-page wording |
| Letter versioning, the diff, the grey-out | Judging medical necessity for this payer |
| HTML→PDF render, the ask sheet | Writing in the TPA's register |
| **The fabrication guard** | Inducing the dialect card |
