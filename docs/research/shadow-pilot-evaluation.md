# How to Measure the One-Hospital Shadow Pilot Honestly

**Researched:** 14 August 2026

**Decision ticket:** [GitHub issue #4](https://github.com/sivaratrisrinivas/postdated/issues/4)

**Scope:** one hospital, one verified Niva Bupa ReAssure 2.0 policy configuration, adult planned
cashless inpatient discharges, supervised shadow mode

## Short answer

The first pilot should answer a small question:

> Can POSTDATED read the chosen documents, show useful and supported risks, refuse unsafe claims,
> and fit the insurance-desk workflow well enough to justify a larger test?

It cannot honestly prove that POSTDATED reduces disallowances or predicts insurer decisions. A
small pilot at one hospital is too narrow for that claim, and fixing a warning before submission
changes the insurer's eventual outcome.

Measure seven separate things instead of publishing one vague “accuracy” number:

1. document-reading accuracy;
2. preventable-risk recall;
3. dangerous false-green cases;
4. false-alarm burden;
5. evidence-based resolution accuracy;
6. end-to-end speed and failure rate; and
7. employee task success, workload, and confidence.

Every percentage must include its numerator, denominator, and a 95% binomial confidence interval.
Keep the system in shadow mode even if it meets the proposed targets below. Passing this pilot is
permission for a larger supervised pilot, not permission for employees to depend on the result.

## What the sources establish

The following are research facts. The numerical pilot targets later in this report are our proposed
choices, not numbers dictated by these sources.

- NIST says AI accuracy should include false-positive and false-negative rates, human-AI team
  performance, realistic test sets representing expected use, and results split by meaningful data
  segments. It also says the test method and data must be documented. [NIST AI Risk Management
  Framework 1.0, pp. 12–13](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf)
- The joint FDA, Health Canada, and MHRA good-machine-learning-practice principles say test data
  should represent the intended users, inputs, and use conditions; test data should be independent
  from development data; the reference truth should use the best available method and state its
  limits; and evaluation should cover the human-AI team, not just the model.
  [Health Canada: Good machine learning practice, principles 3–8](https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/good-machine-learning-practice-medical-device-development.html)
- STARD treats sensitivity and specificity as comparisons with a defined reference standard and
  warns that false-positive and false-negative counts change with the setting and the cases being
  tested. POSTDATED is not a diagnostic device, but the same confusion-matrix discipline is useful
  for its binary risk warnings. [STARD 2015](https://www.bmj.com/content/351/bmj.h5527)
- Work on noisy scanned forms uses fully annotated documents and separate precision, recall, and F1
  measurements for document-understanding tasks. This supports scoring individual extracted fields,
  not merely asking whether a whole response “looks right.” [FUNSD original paper](https://arxiv.org/abs/1905.13538)
- ISO defines usability in relation to named users, goals, and a real context of use. FDA human-
  factors guidance similarly evaluates representative users performing critical tasks in realistic
  conditions and looks for use errors that could cause harm. These are useful methods here, although
  this report does not claim that POSTDATED is an FDA-regulated medical device.
  [ISO 9241-11:2018](https://www.iso.org/standard/63500.html),
  [FDA human-factors guidance, sections 8.1 and 8.1.1](https://www.fda.gov/files/medical%20devices/published/Applying-Human-Factors-and-Usability-Engineering-to-Medical-Devices---Guidance-for-Industry-and-Food-and-Drug-Administration-Staff.pdf)
- A pilot is mainly for learning whether a larger study is feasible. The CONSORT pilot extension
  recommends setting progression rules before the study and warns against formal effectiveness
  claims from a usually underpowered pilot. Its scope is randomized trials, while this pilot is not
  randomized; the feasibility principle is still directly useful.
  [CONSORT extension for pilot and feasibility trials](https://www.bmj.com/content/355/bmj.i5239)
- For small counts, a normal approximation can give misleading confidence intervals. NIST documents
  exact binomial intervals for small samples and small numbers of failures.
  [NIST/SEMATECH handbook, section 7.2.4.1](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm)
- The System Usability Scale (SUS) is a ten-question overall usability measure scored from 0 to 100.
  A large original evaluation found a broad mean close to 70 across many products; it is a comparison
  aid, not proof that a particular workflow is safe. [Brooke's original SUS chapter](https://hci-studies.org/methods-and-measures/downloads/SUS_Brooke1996.pdf),
  [Bangor, Kortum, and Miller's empirical evaluation](https://doi.org/10.1080/10447310802205776)
- NASA-TLX measures perceived workload across mental demand, physical demand, time pressure,
  performance, effort, and frustration. It can reveal that an apparently usable tool adds too much
  pressure at discharge. [Official NASA-TLX resource](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/)

## The reference truth

The pilot needs a human answer sheet prepared without looking at POSTDATED's answer. Otherwise the
system is marking its own homework.

For every case, build three separate truth records:

| Truth record | Who creates it | What it contains |
|---|---|---|
| Document transcription | One trained annotator, with a second person checking every money and policy field | Exactly what the photographs say: bill rows, amounts, room rate, nights, dates, policy version and elected options, and verbatim clinical spans |
| Risk reference | Two insurance-domain reviewers working independently, then resolving disagreements | Which supported preventable risks are present, which policy clause and document evidence support each one, what action is allowed, and how serious a miss would be |
| Final outcome | Hospital records after the insurer acts | The submitted evidence, insurer query or disallowance, amount, and stated reason, linked only by the private pilot ID |

Record raw reviewer agreement and Cohen's kappa before resolving disagreements. Kappa was created to
measure agreement on categories after accounting for agreement expected by chance.
[Cohen's original paper](https://doi.org/10.1177/001316446002000104)

The final insurer outcome is useful, but it is not a clean label for the original warning:

- If staff fix a real gap, the insurer may pay. That does not make the original warning false.
- If the insurer pays despite a thin document, that shows the warning was conservative, not
  necessarily invented.
- If another undisclosed fact drives the decision, POSTDATED could not have seen it from the chosen
  inputs.

Therefore score the initial system against the independent risk reference. Use the later insurer
outcome as descriptive follow-up and as a way to discover missed risk types. Do not call it model
calibration yet.

## Freeze the test before starting

Before the first pilot case:

1. Freeze the model name, prompt, extraction schema, calculator version, policy UIN, approved policy
   schedule options, and warning rules.
2. Publish the case inclusion and exclusion rules from the pilot decision: adult, planned, cashless
   inpatient discharge using the supported policy. Exclude emergency, ICU, maternity, mental-health,
   pre-existing-disease disputes, and other unsupported cases.
3. Write the reviewer handbook with examples of each supported risk, a clean case, an unreadable
   photograph, a permitted document demand, and a permitted doctor question.
4. Lock the proposed targets and stop rules in this report or a dated pilot protocol.
5. Keep pilot cases out of future prompt or rule changes until their current-version results have
   been recorded. If the system changes, give the new version a new evaluation period.

This prevents cherry-picking, changing the answer key after seeing failures, and accidentally
treating repeated runs of one case as independent evidence.

## 1. Document-reading accuracy

### Unit of measurement

Score one field at a time. The required fields for this pilot are:

- selected policy UIN/version and approved schedule options;
- bill row label, bill category, and whole-rupee amount;
- bill total, room category, room rate, and number of nights;
- whether each required document was supplied;
- verbatim clinical spans used by any warning; and
- the source page or image region supporting every displayed fact.

### Metrics

| Metric | Plain-English meaning | Calculation |
|---|---|---|
| Critical-field exact match | Did every money- or policy-changing field match the answer sheet exactly? | exact critical fields / all critical fields |
| Field recall | How much printed information did the system find? | correctly extracted fields / fields present in truth |
| Field precision | How much extracted information was real? | correctly extracted fields / fields returned by system |
| Hallucinated-field rate | How often did the system return a field not supported by the document? | unsupported returned fields / returned fields |
| Amount error | How wrong were money values? | report exact-match rate and absolute rupee error; do not hide errors inside an average |
| Safe-abstention rate | When a field was unreadable, did the system say so instead of guessing? | correct “needs human review” results / truly unreadable fields |
| Complete-case extraction | Could all required deterministic checks run safely? | cases with every required field correct or visibly unresolved / all cases |

Split results by discharge summary versus bill, typed versus handwritten content, photo-quality band,
phone versus desktop upload, and high/medium/low model confidence. Do not collect patient demographic
details merely to make a chart; collect only segments that can plausibly change document-reading
performance and are approved for the pilot.

### Proposed gate

- **Stop:** any invented clinical statement reaches the employee, any wrong policy version is used,
  or any wrong bill total is presented as certain.
- **Amend and repeat shadow testing:** critical-field exact match is below 95%, amount exact match is
  below 99%, or safe abstention on unreadable critical fields is below 95%.
- A visible “needs human review” is not an extraction failure. A confident guess is.

These percentages are proposed engineering targets, not published standards. Money and policy errors
also need to be listed individually, because one ₹1,00,000 mistake matters more than many correct
small fields.

## 2. Risk-warning accuracy

Create a fixed list of supported risk opportunities for each case. For this pilot that list should
remain narrow: verified Niva Bupa room-category deductions, separately billed non-payable items,
missing required documents, and missing evidence that must become a doctor question. Unsupported
risks must result in “needs human review,” not a green result.

For every risk opportunity, compare POSTDATED with the independent risk reference:

| | Human says risk exists | Human says risk does not exist |
|---|---:|---:|
| POSTDATED warns | True positive | False positive |
| POSTDATED does not warn | False negative | True negative |

Report:

- **preventable-risk recall** = true positives / (true positives + false negatives);
- **warning precision** = true positives / (true positives + false positives);
- **specificity** = true negatives / (true negatives + false positives);
- **case false-green rate** = cases where POSTDATED showed no preventable action although at least
  one supported preventable risk was present / all cases with a supported preventable risk;
- **warning burden** = total warnings and false warnings per case;
- **fully traceable warning rate** = warnings with the correct source evidence, approved policy rule,
  deterministic calculation where applicable, and allowed action / all warnings; and
- counts by individual risk type. A good overall number must not hide that one risk type always fails.

Do not calculate F1 as the headline. F1 gives false alarms and misses equal weight, while a dangerous
false green is more serious here. Show recall and precision separately.

### Proposed gate

- **Stop:** any supported critical risk is missed and the screen presents the case as safe; any
  warning cites evidence that is not in the uploaded source; or any generated output states a new
  clinical fact.
- **Amend and repeat shadow testing:** observed preventable-risk recall is below 90%, warning
  precision is below 80%, or fully traceable warning rate is below 100%.
- **Required before a larger supervised pilot:** no observed dangerous false green in the frozen
  challenge set or the real shadow cases. This is a safety screen, not proof that the true miss rate
  is zero.

## 3. Dangerous missed warnings

Define severity before reviewers see results:

- **Critical miss:** the employee could reasonably stop acting because POSTDATED showed no action,
  while the independent reviewers say a supported missing document or doctor question could expose
  the whole claim or a major claim head to disallowance.
- **Important miss:** a supported preventable risk was missed but the result was not a false green
  and the likely consequence was smaller or already visible elsewhere.
- **Unsupported situation:** the case is outside the frozen rules. The correct output is “needs human
  review.” Treating it as safe is critical; abstaining is correct.

Report critical and important misses as separate case lists with the source evidence, root cause,
and corrective action. Do not bury them inside an average rupee score.

For each missed-warning rate, show an exact 95% binomial confidence interval. For example, even zero
misses in 30 independent risk-positive cases has an upper two-sided 95% exact bound of about 11.6%.
That is why “0/30 misses” does not prove a zero miss rate. The next phase needs more hospitals, more
policy versions, and a larger independent set.

## 4. False alarms

A false alarm is not “the employee did not act.” It is a warning that the independent reviewers say
was unsupported by the available document and approved policy. Keep these separate:

- unsupported warning — a real false positive;
- supported warning that staff chose not to act on;
- supported warning that could not be fixed before discharge;
- unavoidable policy deduction, which belongs in the separate information panel rather than the
  preventable work list; and
- uncertain case correctly sent to human review.

For each false alarm, record employee time spent, whether it caused an unnecessary doctor or ward
request, and whether it reduced trust in later warnings. Report false warnings per case, precision,
and total wasted employee minutes. The proposed 80% precision gate means no more than one unsupported
warning for every four supported warnings; the time measure tells us whether even that is too costly.

## 5. Evidence-based resolution

Test resolution with paired old and new documents. Include three kinds of new upload:

1. the required evidence was genuinely added;
2. a different but irrelevant sentence or document was added; and
3. the employee uploaded a new image but the gap remained.

For every original warning, record one of four outcomes:

| System action | Evidence really fixed the gap | Evidence did not fix the gap |
|---|---:|---:|
| Warning clears | Correct clear | **Unsafe clear** |
| Warning remains | Stale warning | Correct hold |

Also verify that the new supporting span is shown to the employee and exists verbatim in the new
document. A doctor question can clear only from doctor-confirmed, signed source evidence. A button
press, a new filename, or a new photograph alone is never evidence.

Report correct-clear recall, correct-hold rate, stale-warning rate, unsafe-clear rate, and exact
before/after evidence links.

### Proposed gate

- **Stop:** any unsafe clear, any resolution caused only by a button or upload event, or any new
  clinical fact created by the system.
- **Amend and repeat:** overall resolution decision accuracy is below 95% or correct-clear recall is
  below 90%.
- **Required:** 100% of cleared warnings show the exact new supporting evidence.

## 6. Latency and reliability

Measure what the employee experiences, not only model API time.

- Start: the employee presses “check documents” after selecting the files.
- End: the complete work list is usable, or a clear safe-failure message is shown.
- Record client upload time, server/model time, total time, device class, connection type, image
  size, retries, timeouts, and whether the employee abandoned the case.

Report median, 95th percentile, maximum, timeout rate, retry rate, and safe-failure rate. Do not
remove slow failures from the denominator.

### Proposed gate

- median end-to-end time at or below 10 seconds;
- 95th percentile at or below 30 seconds;
- fewer than 2% technical failures across all attempts; and
- 100% of failures end in an honest retry, retake, or human-review message.

The time targets come from POSTDATED's intended discharge-counter workflow and original ten-second
design goal, not from an external safety standard. A prepared demo fixture must never appear as if it
were the result of a real case; that would corrupt both safety and every accuracy measurement.

## 7. Employee usability and workload

Invite every available insurance-desk employee who matches the intended role, aiming for at least
5–8 people for formative learning. This is not enough for formal human-factors validation; FDA's
medical-device guidance generally discusses a minimum of 15 participants for each distinct user
population. The smaller number is acceptable only because this phase is supervised formative work,
not a regulatory validation claim.

Each employee should complete at least three realistic cases after the same short training:

1. log in and select the approved policy;
2. upload the summary and itemised bill;
3. notice and correct a wrong or uncertain extracted field;
4. distinguish an unavoidable deduction from a preventable action;
5. open the evidence behind a warning;
6. produce the correct document demand or doctor question;
7. handle an unreadable image or “needs human review” result;
8. upload corrected evidence and verify that only the right warning clears; and
9. download the clearly labelled pilot report or ask sheet.

Run these tasks on the actual devices and network, with normal interruptions and time pressure.
The moderator should not guide the employee during a measured task.

Record:

- unassisted task completion for every task;
- critical use errors, non-critical errors, help requests, and abandoned tasks;
- time per case and additional time compared with the normal desk process;
- whether the employee correctly understood “possible risk,” “needs human review,” and “not an
  insurer decision”;
- SUS after the employee has used several cases;
- NASA-TLX after a representative case if the team can administer it consistently; and
- a short interview: what was confusing, what created work, what was trusted too much, and what was
  ignored.

### Proposed gate

- zero critical use errors that could create a false sense of safety or an improper clinical claim;
- at least 90% unassisted completion across critical tasks;
- median SUS at least 70;
- median extra desk time no more than five minutes per case after the first two learning cases; and
- no employee mistakes the simulation for an insurer decision after the standard training.

Again, these are proposed progression targets. Show every participant's result when the employee
sample is small; a mean alone can hide that one person could not safely finish the workflow.

## Practical pilot shape

Use two linked sets.

### A. Frozen challenge set before real cases

Use at least 50 independent fake or safely anonymised case packs:

- at least 30 containing supported preventable-risk opportunities;
- at least 15 clean cases with no supported preventable action;
- at least 20 paired old/new document changes spread across valid fixes, irrelevant changes, and
  unchanged gaps; and
- deliberately difficult photographs: skew, glare, blur, handwriting, multi-page order, subtotal
  rows, and conflicting values.

One case can satisfy more than one of these requirements. Ensure every supported risk type and every
critical task appears several times. Do not reuse the committed Ravi fixture or its close rewrites as
independent test evidence.

### B. Consecutive hospital shadow cases

Run 30–50 consecutive eligible cases, or all eligible cases over four weeks if fewer are available.
“Consecutive” means staff do not select only the easy photographs. Keep the normal claim process
unchanged. POSTDATED's output remains advisory and cannot submit, edit, or clear a medical record.

For each case keep only the approved minimal evaluation record after raw images are deleted:

- private pilot ID;
- product and frozen rule version;
- document-quality labels;
- extraction comparisons without patient text where possible;
- warning, reviewer, resolution, timing, task, and failure records;
- employee role ID rather than name; and
- later insurer reason and amount when available.

The hospital's consent, privacy, security, and retention approvals remain prerequisites; this report
does not replace them.

## The pilot dashboard

The weekly dashboard should show counts first:

| Area | Show |
|---|---|
| Cases | eligible, attempted, completed, excluded, abandoned, awaiting outcome |
| Extraction | exact critical fields / total; amount errors; invented fields; abstentions |
| Warnings | TP, FP, FN, TN by risk type; recall; precision; false-green cases |
| Safety | fabricated clinical facts; dangerous misses; unsupported evidence; unsafe clears |
| Resolution | correct clears, stale warnings, unsafe clears, correct holds |
| Speed | median, p95, maximum, retries, timeouts, safe failures |
| Employees | critical-task completion, use errors, help requests, time, SUS, workload |
| Outcomes | insurer queries/disallowances by reason, clearly labelled descriptive follow-up |

For every rate show `count / denominator`, the percentage, and the exact 95% interval. Preserve every
failed attempt in the denominator. Add a short failure list with case IDs and root causes.

## Progression decision

Use three possible decisions after the pilot:

### Continue to a larger supervised shadow pilot

Only if all stop conditions remain at zero, the proposed accuracy and usability gates are met, and
the hospital agrees that the workflow is worth continuing. This still does not allow operational
dependence.

### Continue after changes and repeat the affected tests

Use this when there is no uncontained safety failure but extraction, false alarms, speed, or
usability misses a proposed target. Change the system, freeze a new version, and evaluate on new
cases rather than reporting the improved result on the cases used to fix it.

### Stop

Stop the current version if it invents a clinical fact, silently swaps in fixture data, clears a
warning without evidence, uses an unapproved policy rule, or gives a dangerous false green. Find the
root cause and return to offline testing before another real case.

## What not to claim

After this small pilot, even a good result supports only:

> “In one supervised hospital shadow pilot, this frozen version met the stated feasibility and
> safety-screening targets on these documents, employees, policy rules, and cases.”

It does not support:

- “POSTDATED prevents claim disallowances”;
- “POSTDATED predicts insurer decisions with X% accuracy”;
- “the dangerous-miss rate is zero”;
- “the result generalises to other hospitals, insurers, policy versions, or excluded case types”;
- “₹X was saved,” unless a later study has a credible comparison group and avoids double counting;
  or
- “hospital tested” without naming the scope and supervised shadow conditions.

## Implications for the current codebase

The existing tests are a useful starting point, but they are not pilot evidence:

- `lib/deduct.test.ts` checks deterministic Niva Bupa arithmetic against one hand-built bill and
  related edge cases.
- `lib/guard.test.ts` checks a small fixed clinical vocabulary against the committed Ravi summary.
- `app/api/extract/route.ts` returns the Ravi fixture when the API key is missing, the model refuses,
  no text is returned, or an exception occurs. Pilot mode must return an honest error instead; a
  fixture result would count as fabricated patient data and make the evaluation meaningless.
- `lib/exposure.ts` contains seeded ₹85,000 and ₹40,000 Bucket C amounts. These cannot be scored as
  predicted rupee exposure or shown as case-specific money in the pilot without a documented,
  approved derivation from that case.
- The current type does not carry source page/region evidence for every field and warning, and the
  API casts parsed JSON without additional semantic validation. Both are needed before the proposed
  traceability and extraction measures can be collected.
- The present “resolved” interaction is not a measured old-versus-new evidence comparison. Unsafe
  clear and stale-warning tests must exist before any real corrected document is used.

The immediate build priorities are therefore: a real annotation format, source-linked extraction,
honest failure states, a frozen supported-risk checklist, paired-document resolution logic, and an
event log that records the denominators above without retaining raw medical images.
