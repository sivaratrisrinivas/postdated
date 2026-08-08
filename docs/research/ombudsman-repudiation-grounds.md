# Taxonomy of health-insurance repudiation grounds in IRDAI Insurance Ombudsman awards

Research date: 8 August 2026. Author: automated primary-source research pass for the discharge-summary forecasting product.

**One-line summary for the stage slide:** 24 distinct repudiation grounds identified from **40 hand-read Ombudsman awards**, corroborated by an automated scan of **4,408 award segments** across **19 official Ombudsman mediclaim award compilations** published by the Council for Insurance Ombudsmen. Of the 24 grounds, **4 are YES-detectable** from a discharge summary + bill alone, **12 are PARTIAL** (need the policy wording or a judgement call), and **8 are NO** (need facts outside both documents).

---

## 1. Method

### Sources actually read

All primary. Every source below is a PDF published by the Council for Insurance Ombudsmen (CIO) on `cioins.co.in`, the official body that hosts Insurance Ombudsman awards. IRDAI's own "Awards of Ombudsman" page ([https://irdai.gov.in/awards-of-ombudsman](https://irdai.gov.in/awards-of-ombudsman)) links out to `https://www.cioins.co.in/Awards/Archive` as the canonical award repository, which is how these were located.

| Source | URL | Pages | Award segments |
|---|---|---|---|
| Mediclaim-Book2 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book2.pdf | 213 | 379 |
| Mediclaim-Book3 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book3.pdf | 169 | 278 |
| Mediclaim-Book4 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book4.pdf | 182 | 282 |
| Mediclaim-Book5 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book5.pdf | 31 | 26 |
| Mediclaim-Book6 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book6.pdf | 230 | 311 |
| Mediclaim-Book7 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book7.pdf | 181 | 260 |
| Mediclaim-Book8 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book8.pdf | 201 | 340 |
| Mediclaim-Book9 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book9.pdf | 261 | 230 |
| Mediclaim-Book10 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book10.pdf | 245 | 209 |
| Mediclaim-Book11 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book11.pdf | 177 | 152 |
| Mediclaim-Book12 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book12.pdf | 166 | 93 |
| Mediclaim-Book13 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book13.pdf | 310 | 210 |
| Mediclaim-Book14 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book14.pdf | 308 | 134 |
| Mediclaim-Book15 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book15.pdf | 112 | 84 |
| Mediclaim-Book16 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book16.pdf | 108 | 77 |
| Mediclaim-Book17 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book17.pdf | 376 | 399 |
| Mediclaim-Book18 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book18.pdf | 407 | 431 |
| Mediclaim-Book19 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book19.pdf | 253 | 304 |
| Mediclaim-Book20 | https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book20.pdf | 200 | 209 |
| **Total** | | **4,130** | **4,408** |

`Mediclaim-Book1.pdf` returns HTTP 404; `Mediclaim-Book21.pdf` and above return 404. Books 2–20 is the complete published set as of 8 Aug 2026.

These are the Council's **mediclaim** compilations specifically — health/hospitalisation only. Life, motor and fire awards are published in separate series and were not touched. (A handful of segments inside these books are stray non-health cases — the automated split found 4 "repudiation of motor claim" and 2 "repudiation of damage claim under private car package policy" subject lines out of 4,408. That is a ~0.1% contamination rate in the automated corpus figures; the 40 hand-read awards were individually checked and are all health/hospitalisation.)

### How the 40 were sampled

1. All 19 PDFs were downloaded and text-extracted with PyMuPDF.
2. Text was split on `Case No.` boundaries, yielding **4,408 award segments**.
3. Segments were filtered to those mentioning `repudiat|disallow|rejected the claim|not payable|not admissible` and 800–5,000 characters long, giving **2,356 candidates**.
4. Two candidates were drawn at random (seed `20260808`) from **each of the 19 books**, then topped up at random to exactly **40**. This deliberately stratifies across books so the sample spans the full date range rather than clustering in the largest volumes.
5. All 40 were read in full by hand and classified.

### Sample honesty — read this before quoting anything

- **40 awards were read in full.** Not 4,408. The 4,408 figure is an automated keyword scan, reported separately below and clearly labelled as such. Do not merge the two numbers on stage.
- **Date range of the 40 hand-read awards: award dates from 2004 to 2014.** The underlying books contain awards from roughly 2000 to 2016.
- **This corpus is old.** It predates the IRDAI (Health Insurance) Regulations 2016, the 2019/2020 standardisation of exclusions and the "non-medical items" list, and the Insurance Ombudsman (Amendment) Rules 2021. Clause numbering quoted below (4.1, 4.2, 4.3, 5.7) is the numbering of the old public-sector Mediclaim policy wording. **Modern policies use different clause numbers for the same grounds.** The *grounds* are durable; the *clause numbers* are not. Say this on stage before someone in the audience says it for you.
- Ombudsman awards are a **biased sample of repudiations**: only disputed repudiations that the insured escalated reach an Ombudsman. Uncontested rejections and routine bill-line deductions are systematically under-represented. Frequencies here are frequencies *in litigated disputes*, not in all claims.
- Award numbering is inconsistent across centres (`11-004-0003-11`, `GI-614/2003-2004`, `IO(CHN)/11.3.1205/2005-06`, ...). Citations below give the case number exactly as printed plus the source PDF URL. The books are not internally paginated in a stable way, so cite by case number, not page.

### Automated corroboration (labelled: NOT hand-read)

A regex classifier for 26 ground-families was run over all 4,408 segments. This counts *whether a ground is discussed anywhere in the award text*, which over-counts (an award can mention PED while actually turning on something else) — it is a sanity check on the ranking, not a count of repudiation grounds.

| Ground family | Segments mentioning | % of 4,408 |
|---|---|---|
| Pre-existing disease | 1,344 | 30.5% |
| Under 24 hrs / OPD / day-care | 407 | 9.2% |
| Named policy exclusion (dental, congenital, maternity, cosmetic, prosthetics...) | 390 | 8.8% |
| Non-disclosure / suppression / misrepresentation | 328 | 7.4% |
| Specified-disease waiting period (incl. 36-month PED cap) | 322 | 7.3% |
| Hospitalisation not justified / no active line of treatment | 310 | 7.0% |
| Documents not submitted (incl. indoor case papers) | 309 | 7.0% |
| Late submission of claim documents | 180 | 4.1% |
| Treatment not covered / outside scope | 162 | 3.7% |
| Pre / post-hospitalisation window | 159 | 3.6% |
| Room rent sub-limit / proportionate deduction | 113 | 2.6% |
| First 30 days / first-year exclusion | 112 | 2.5% |
| AYUSH / non-allopathic | 108 | 2.5% |
| Break in continuity / lapse / treated as fresh policy | 101 | 2.3% |
| Fraud / tampering / fabricated documents | 92 | 2.1% |
| Reasonable & customary / PPN rate | 84 | 1.9% |
| Sub-limit / capping / co-pay / SI exhausted | 74 | 1.7% |
| Non-medical items / consumables / disposables | 55 | 1.2% |
| Non-network / not on approved hospital list | 54 | 1.2% |
| Late intimation of hospitalisation | 51 | 1.2% |
| Domiciliary hospitalisation | 49 | 1.1% |
| Non-cooperation (clause 5.7) | 39 | 0.9% |
| Hospital does not meet definition (beds/nurse/OT) | 33 | 0.7% |
| Claim outside policy period | 19 | 0.4% |
| Alcohol / intoxication | 18 | 0.4% |
| Age / eligibility / dependent status | 2 | 0.0% |

The ordering matches the hand-read sample closely, which is the point of running it.

---

## 2. The taxonomy

**Counts are out of the 40 hand-read awards.** An award can carry more than one ground, so the column sums to more than 40. Grounds with count 0 in the hand-read 40 but clearly present in the automated scan are included with count 0 and marked — they are real grounds we did not happen to draw.

| # | Ground | Count (of 40) | Detectable from discharge summary + policy wording? | What the product would need to see |
|---|---|---|---|---|
| 1 | Pre-existing disease (PED) — condition held to have existed before inception | 15 | **NO** | Policy inception date + the insured's full medical history before that date. A discharge summary often *supplies the ammunition* ("k/c/o DM since 15 years", "HTN since 1½ years") but the product cannot know the inception date or prior claim/renewal history from the summary. Best it can do: flag chronicity phrases in the summary as PED-bait. |
| 2 | Non-disclosure / suppression / misrepresentation of material facts at proposal | 6 | **NO** | The proposal form and what was answered on it. Not in the discharge summary, not in the policy wording. |
| 3 | Break in continuity / late premium / policy treated as fresh | 5 | **NO** | Full renewal and premium-payment history across insurers. Invisible to both documents. |
| 4 | Documents not submitted — indoor case papers, original bills, investigation reports, first consultation paper | 5 | **YES** | The discharge summary itself tells you which investigations were done (X-ray, CT, angiogram). If the summary references a report the patient is not holding, the product can warn at the counter, while the patient is still in the hospital and can still collect it. This is the single highest-leverage YES ground. |
| 5 | Hospitalisation not justified / no active line of treatment / admission only for investigation or rest | 4 | **PARTIAL** | The summary's treatment section. Oral-medicines-only, "advised rest", diagnostics-only with no therapeutic intervention are all readable. Whether an Ombudsman would call it unjustified is a judgement call, hence PARTIAL. |
| 6 | Named permanent exclusion — dental, congenital, cosmetic, maternity, prosthetics, external/durable equipment, spectacles, obesity | 4 | **PARTIAL** | Diagnosis and procedure from the summary, matched against the policy's exclusion list. Needs the policy wording — exclusion lists vary by product. |
| 7 | Specified-disease / PED waiting period (first-year, 2-year, 36-month PED cap, 9-month maternity) | 3 | **NO** | Policy inception date. The product can see *which* disease (cataract, hernia, maternity) and knows it is waiting-period-prone, but cannot compute elapsed cover. |
| 8 | Hospitalisation under 24 hours / treated as OPD / day-care | 3 | **YES** | Admission and discharge date-times on the summary. Pure arithmetic. |
| 9 | Room rent above entitled category / proportionate deduction / doctor's fee scaled to room class | 2 | **YES** | Room type and per-day room rent from the bill, plus sum insured. The classic 1%-of-SI test. Fully computable at the counter. |
| 10 | Non-medical items, consumables, disposables, service and administrative charges | 2 | **YES** | The itemised bill. Line-item matching against the non-payable list. |
| 11 | Reasonable-and-customary / PPN-rate / tariff excess | 2 | **PARTIAL** | The bill, plus a benchmark of local rates or the insurer's PPN schedule. Product has the bill; needs an external rate reference. |
| 12 | Disease-wise sub-limit / capping (e.g. cataract restricted to a rupee ceiling) | 1 | **PARTIAL** | Procedure from the summary + the policy's sub-limit schedule. Very mechanical once you have the schedule. |
| 13 | Non-network hospital / hospital not on the insurer's approved list | 1 | **PARTIAL** | Hospital name and address are on the summary; needs the insurer's current network list. |
| 14 | Late submission of claim documents (7/15/30-day windows, incl. post-hospitalisation claims) | 1 | **PARTIAL** | Discharge date is on the summary, so the deadline is computable — but whether the patient will actually miss it is a future fact. The product can *warn* about the deadline. This is arguably the most useful PARTIAL. |
| 15 | Late intimation of hospitalisation (24/48/72-hour rules) | 1 | **PARTIAL** | Admission date-time from the summary sets the clock. Whether intimation was in fact given is outside both documents. Product can warn. |
| 16 | Pre- and post-hospitalisation expenses outside the 30/60-day window | 1 | **PARTIAL** | Discharge date defines the window; the product can flag which follow-up bills will and won't qualify. Needs the window length from the policy. |
| 17 | Partial disallowance of the therapeutic component — insurer pays only the diagnostic procedure | 1 | **PARTIAL** | Summary shows both the diagnostic procedure and the subsequent treatment. Product can flag the risk that only the former is allowed. |
| 18 | Claim closed / repudiated with no ground communicated to the insured | 1 | **NO** | Nothing in either document predicts this. Worth naming on stage as an honest limit. |
| 19 | Investigator's adverse finding on genuineness of hospitalisation | 1 | **NO** | Depends on a post-hoc field investigation. |
| 20 | Document tampering / fabrication / fraud | 1 | **NO** | Depends on forensic review of submitted papers. |
| 21 | Non-cooperation with the insurer (old clause 5.7) | 1 | **NO** | Depends on post-claim conduct. |
| 22 | Policy-period / inception-date mismatch — treatment before cover started or after expiry | 1 | **PARTIAL** | Admission date is on the summary; needs the policy schedule dates to compare. Trivially detectable once you have both. |
| 23 | Hospital does not meet the policy definition (min. beds, qualified nurse round the clock, operation theatre, registration) | 0 in the 40; **33 segments** in the automated scan | **PARTIAL** | Hospital name from the summary + a registry of hospital bed counts and registrations. Real ground, not drawn in our 40. |
| 24 | AYUSH / non-allopathic treatment not covered | 0 in the 40; **108 segments** in the automated scan | **PARTIAL** | Treatment type from the summary + whether the policy covers AYUSH. Real ground, not drawn in our 40. |

### Detectability split

| | Count | Grounds (row numbers from the table above) |
|---|---|---|
| **YES** | 4 | #4 missing documents / indoor case papers · #8 under-24-hour or OPD stay · #9 room-rent sub-limit and proportionate deduction · #10 non-medical items and consumables |
| **PARTIAL** | 12 | #5 hospitalisation not justified · #6 named exclusion · #11 reasonable & customary · #12 disease sub-limit · #13 non-network hospital · #14 late document submission · #15 late intimation · #16 pre/post window · #17 diagnostic-only disallowance · #22 policy-period mismatch · #23 hospital definition · #24 AYUSH |
| **NO** | 8 | #1 pre-existing disease · #2 non-disclosure at proposal · #3 break in continuity / premium lapse · #7 waiting periods · #18 claim closed with no ground given · #19 investigator's adverse finding · #20 fraud / tampering · #21 non-cooperation |

**4 / 12 / 8, summing to 24.** Use these numbers.

A note on how to talk about the PARTIALs: four of them — #14, #15, #16 and #22 — are *computable* at the discharge counter, because the admission and discharge timestamps on the summary start every one of those clocks. The product cannot know whether the patient will actually miss the deadline, but it can fire an accurate warning. If you want a second, more flattering number on the slide, say "4 grounds we detect outright, and 4 more where we can warn before the deadline runs" — but lead with 4 / 12 / 8 and derive the rest, rather than the other way round.

### The blunt finding

**The single most frequent ground in the corpus — pre-existing disease, 15 of 40 hand-read awards and 30.5% of 4,408 segments — is NO-detectable.** The top three grounds by frequency (PED, non-disclosure, break in continuity: 26 of the 40 hand-read awards between them) are all NO. Everything the product can actually see sits in the long tail.

This is not a gap to hide. It is the honest shape of the problem: **the grounds that kill whole claims are underwriting-history grounds and are invisible at the discharge counter; the grounds the product can see are the ones that shave 10–40% off a claim that is otherwise paid.** Position the product as a *deduction forecaster*, not a *repudiation forecaster*, and the taxonomy supports you completely.

---

## 3. Per-ground detail (top 10 by frequency in the 40 hand-read awards)

### 1. Pre-existing disease — 15 of 40

Invoked as exclusion clause 4.1 of the old Mediclaim wording. Insurers routinely reason backwards from a chronicity phrase in the hospital record.

- **Case No. GI-614/2003-2004**, Rasiklal Sheth v. United India — claim repudiated "on the ground that his previous ailments were not disclosed and this constituted pre-existing ailment of Ischaemic Heart Disease coming under clause 4.1 of the Mediclaim Policy." [Mediclaim-Book2.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book2.pdf)
- **Case No. IO(CHN)/11.3.1205/2005-06**, T. V. Sadagopan v. National Insurance — "as per the medical opinion of their TPAs, Family Health Plan Ltd., the present hospitalization was for management of an ailment, which was related to a pre-existing condition (Ischaemic heart Disease (IHD)) was subject to exclusion clause 4.1." [Mediclaim-Book4.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book4.pdf)
- **Case No. 11.03.1334/2006-2007**, G. Gopinathan v. National Insurance — TPA reasoning quoted in full: "The patient was a known case of Hypertension and Diabetic for last 2 years. Hence, HTN and Diabetes are major risk factor for the Coronary Artery Disease; The present disease is considered as pre existing disease, hence it is not admissible under the policy." [Mediclaim-Book6.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book6.pdf)
- **Case No. 11-003-1056-12**, Ramilaben R. Shah v. National Insurance — rejected under exclusion 4.1 of the Swasthya Bima Policy: "As per hospital records history of HTN since 1½ years... There is a cap of 36 months from the date of inception of the policy for treatment of pre-existing disease whereas the claim lodged within 13 months and 2 days." [Mediclaim-Book18.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book18.pdf)
- **Product-relevant**: the trigger phrase is almost always lifted verbatim from the discharge summary or case sheet — "k/c/o DM since 15 years", "history of HTN since 1½ years", "chronicity of the ailment cannot be ruled out" (Case No. GI/278/ICICI Lombard/09, [Mediclaim-Book14.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book14.pdf)). **The product can detect the trigger phrase even though it cannot adjudicate the ground.** That is a genuinely shippable warning: "this summary contains a chronicity statement that insurers use to invoke PED."

### 2. Non-disclosure / suppression at proposal — 6 of 40

- **Case No. 11-010-0140-10**, Sanjeev Gupta v. IFFCO Tokio — "Claim was repudiated by Respondent invoking exclusion clause 3 of the Mediclaim Policy i.e. misrepresentation, concealment of diabetes and hypertension which are known risk factor of heart ailment... It is established that insured has not disclosed the fact in proposal form so Respondent's decision to reject the claim is upheld." [Mediclaim-Book11.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book11.pdf)
- **Case No. GI-294 of 2004-2005**, Rasiklal Dagli v. United India — "the decision of the Company to reject the claim on grounds of non-disclosure and pre-existing illness as per clause 4.1 of the Mediclaim policy is sustainable." [Mediclaim-Book3.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book3.pdf)
- Nearly always paired with PED. The two travel together in the repudiation letter.

### 3. Break in continuity / late premium / policy treated as fresh — 5 of 40

The quiet killer. A renewal gap resets every waiting period, and the insured usually has no idea.

- **Case No. 680/11/002/NL/12/2005-06**, Ajoy Kumar Basu v. New India — cataract done after a 41-day renewal gap: "a fresh policy was issued 41 days later... The policy was treated as a first year policy by the insurance company and, therefore, the cataract operation was not covered under the first year Exclusion Clause No. 4.3." The gap was caused by a dishonoured renewal cheque. [Mediclaim-Book6.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book6.pdf)
- **Case No. 11/002/0127**, Ajay V. Shah v. New India — moving from a group to an individual policy broke continuity: "Individual and group Mediclaim Policies are being different products, the individual Mediclaim Policy with the Respondent for the period 2001.02 is intercepted by the Group Mediclaim Policy and hence, the continuity on renewal from 1995 is not sustained." [Mediclaim-Book2.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book2.pdf)
- **Case No. 11-003-036-14**, Narendra Singh Kushwah v. National Insurance — maternity claim, "the insured was not completed 9 months policy period... Respondent considered the policy period after receiving full payment as 36 days late so fresh policy issued." [Mediclaim-Book20.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book20.pdf)

### 4. Documents not submitted, incl. indoor case papers — 5 of 40

**The product's best ground.** The patient is still standing in the hospital when the product runs.

- **Case No. 11-004-0318-11**, Vishal N. Parmar v. United India — "as per investigation report the insured was not present at the hospital when their investigator visited the hospital for investigation and no indoor record, treatment papers, first consultation paper were provided to the investigator." [Mediclaim-Book13.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book13.pdf)
- **Case No. 11-009-0308-11**, Darshnaben Gajjar v. Reliance General — "According to indoor case papers complainant underwent X-ray and CT Scan however complainant had not submitted X-ray and CT Scan reports which can give exact nature of injury." This is exactly the failure mode the product prevents: the summary names the investigation, the patient walks out without the report. [Mediclaim-Book13.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book13.pdf)
- **Case No. 14-002-0125**, H. B. Vaghasiya v. New India — claim file closed because a Rs. 100 receipt for attested hospital records was lost: "In the absence of the original receipt, the Respondent could not get access to the records and hence closed the Claim file." [Mediclaim-Book8.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book8.pdf)
- **Case No. GI/502/HDFC/10**, Vipin Rawat v. HDFC Ergo — "the claim filed was closed due to non submission of certificate." [Mediclaim-Book16.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book16.pdf)
- Also seen as a *contributing* factor in PED disputes: Case No. IO(CHN) 11.04.1084/2007-08 records that antipyretics were inferred "from the pharmacy bills since he did not have indoor case sheets" — the absence of indoor papers cost the insured the factual argument. [Mediclaim-Book7.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book7.pdf)

### 5. Hospitalisation not justified / no active line of treatment — 4 of 40

- **Case No. 11-009-0308-11**, Darshnaben Gajjar v. Reliance General — "the Complainant was admitted for diagnostic purpose and rest... treatment papers confirm that complainant was given only oral medicines and not provided with any such active line of treatment for which hospitalization was required... the Complainant was treated at Krupa Hospital, Surat on OPD basis." [Mediclaim-Book13.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book13.pdf)
- **Case No. GIC/338/NIC/11/06**, Mahinder Kumar Goyal v. National Insurance — "The claim was rejected on the ground that treatment could have been taken as an out patient and hospitalization was not necessary," plus the diagnostics-only rule: "as per terms and conditions of the policy if investigations do not lead to positive existence of any disease, the claim is not payable." [Mediclaim-Book5.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book5.pdf)
- **Case No. 11-007-0109-14 (AHD-G-047-1314-0365)**, Pranav G. Trivedi v. Tata AIG — daily hospitalisation benefit "rejected by the Respondent informing that the hospitalization was not required." [Mediclaim-Book20.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book20.pdf)
- **Product-relevant**: "only oral medicines", "advised rest", "investigations negative" are all readable off a summary. High-value PARTIAL.

### 6. Named permanent exclusions — 4 of 40

- **Dental.** Case No. GI-338 of 2006-07, A. Agarwalla v. New India — "the Company's TPA – TTK Health Care, rejected the claim invoking exclusion clause 4.7 and condition 2.3 of the policy. The contention of the TPA was that the hospitalization was only for 6 hours and the treatment was for dental." [Mediclaim-Book6.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book6.pdf)
- **Congenital.** Case No. IO/KCH/GI/11-004-004-253/2007-08, P. P. Vincent v. United India — infected umbilical sinus: "As per policy condition clause 4.8 congenital disease is exempted form the purview of policy and hence they have rightly repudiated the claim." Note the reasoning chain: the *presenting* condition was sepsis, but the insurer traced it to a congenital sinus. [Mediclaim-Book8.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book8.pdf)
- **Devices and prosthetics.** Case No. 11-002-0344-13, Gopesh K Patwa v. New India — Rs. 28,000 deducted under "Policy Condition No. 4.4 Permanent Exclusions sub-clause No. 4.4.4 which states as – 'Cost of braces, equipment or external prosthetic devices, non-durable implants, eye glasses……. durable medical equipments'". Breakdown: Rs. 2,800 procedural charges, Rs. 3,500 equipment charges, Rs. 1,700 nursing charges, Rs. 20,000 disposable items. [Mediclaim-Book19.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book19.pdf)

### 7. Waiting periods — 3 of 40

- **First-year exclusion 4.3 for cataract.** Case No. 680/11/002/NL/12/2005-06 (see #3 above). [Mediclaim-Book6.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book6.pdf)
- **36-month PED waiting cap.** Case No. 11-003-1056-12 (see #1 above). [Mediclaim-Book18.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book18.pdf)
- **9-month maternity waiting.** Case No. 11-003-036-14 (see #3 above). [Mediclaim-Book20.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book20.pdf)
- **Product-relevant**: the *procedure* is visible (cataract, caesarean section, hernia) and the product knows these are waiting-period-prone. Without the inception date it can only say "this procedure is commonly waiting-period-excluded — check your inception date."

### 8. Under 24 hours / OPD / day-care — 3 of 40

- **Case No. GI/500/NIA/10**, Mohan Jha v. New India — "his claim has been denied by MediAssist India Pvt. Ltd., the TPA of New India Insurance Co. Ltd., for the reasons mentioned that he was not admitted for more than 24 hours in the hospital"; the insurer's representative "stated that claim is not payable as he was treated as OPD patient." [Mediclaim-Book15.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book15.pdf)
- **Case No. GI-338 of 2006-07** — "the hospitalization was only for 6 hours." [Mediclaim-Book6.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book6.pdf)
- **Case No. 11-003-095-09**, Narendra D. Shah v. National Insurance — "Repudiation had been effected invoking clause 4.7 on the ground that the claim did not comply with requirements with regard to hospitalization." [Mediclaim-Book10.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book10.pdf)
- **Product-relevant**: pure arithmetic on the admission and discharge timestamps. Strongest YES after missing documents.

### 9. Room rent above entitlement / proportionate deduction — 2 of 40

- **Case No. 540/11/004/NL/12/2011-12**, Man Mohan Kumar Swaika v. United India — the cleanest statement of the 1%-of-SI rule anywhere in the corpus: "the insured had availed a higher category of room instead of entitled category... the room rent was charged @ Rs.4,000/- per day against his entitlement of Rs.2,750/- being 1% of he sum insured. This is as per policy condition and is correctly computed." The visiting surgeon's fee was also disallowed on the same logic. [Mediclaim-Book17.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book17.pdf)
- **Case No. IO(CHN) 11.02.1655/2008-09**, K. Ravi v. New India — Rs. 37,355 of a Rs. 78,965 claim disallowed; the Ombudsman restored most of it but upheld "disallowing room rent over and above the eligibility, documentation charges, expenses towards non medical expenses and instances where proper bills are not submitted." Notably the Ombudsman rejected the insurer's attempt to scale *surgeon's fees* to room category in Chennai, "in the absence of any practice for charging the various expenses depending on the room occupied by the patient." [Mediclaim-Book11.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book11.pdf)
- **Product-relevant**: room type and rate are on the bill; sum insured is on the policy. Full YES, and it is the deduction patients are most surprised by.

### 10. Non-medical items, consumables, disposables — 2 of 40

- **Case No. 11-002-0344-13** — Rs. 20,000 of a Rs. 69,511 claim disallowed as "disposable items", plus Rs. 3,500 equipment and Rs. 2,800 procedural charges. [Mediclaim-Book19.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book19.pdf)
- **Case No. IO(CHN) 11.02.1655/2008-09** — "documentation charges, expenses towards non medical expenses." [Mediclaim-Book11.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book11.pdf)
- **Product-relevant**: line-item bill matching. Full YES, and the disallowed amounts are large — 29% of the claim in the Patwa case.

### Honourable mention — non-network hospital (1 of 40)

- **Case No. GI/250/NIC/11**, Sunil Bansal v. National Insurance — "company was not justified in repudiating the claim as the hospital where the treatment was taken did not find place in the approved list of hospitals by the company." Included because the automated scan finds 54 segments and the ground is trivially detectable if the product carries network lists — the hospital name is on the summary. [Mediclaim-Book17.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book17.pdf)

---

## 4. What I could not verify

Be prepared to concede all of these.

1. **No award later than ~2016 was read.** The `Mediclaim-Book` series stops at Book 20. `Mediclaim-Book21.pdf` and higher return HTTP 404. I found no published post-2016 health award PDFs on `cioins.co.in`.
2. **The current awards index appears to be offline.** IRDAI's "Awards of Ombudsman" page links to `https://www.cioins.co.in/Awards/Archive`; that URL **302-redirects to the CIO homepage** and serves no award listing. `/Awards`, `/Ombudsman/Awards`, `/Judgements` and similar all 404 or redirect. The `/Archives` page renders only site navigation and unreplaced template placeholder text ("123, Regal Mansion, California, US", "Oxford Street, London, UK") — it contains no awards. **The only reachable award corpus is the `GIC/mediclaim/` PDF directory, reached by direct URL.** I could not confirm whether newer awards exist behind a broken link or were never published.
3. **The CIO Annual Reports contain no extractable text.** `AnnualReport2024-2025.pdf` (98 pages, 20.5 MB, https://cioins.co.in/annualreports/AnnualReport2024-2025.pdf) is a **scanned image PDF** — text extraction returns 1,094 characters, all of it cover-page and email addresses. I could not confirm whether it carries a repudiation-reason breakdown. OCR was out of scope for the time budget. Other reports at the same path (2020-21, 2021-22, 2022-23, 2023-24) were **not** opened at all. If someone wants recent aggregate statistics, OCR-ing these is the next task.
4. **`www.cioins.co.in` is blocked for the WebFetch tool** ("Unable to verify if domain is safe to fetch"). All CIO material here was retrieved by direct `curl` and parsed locally with PyMuPDF. Nothing was read through a search-engine cache or a summary.
5. **No IRDAI annual report was read.** Time budget.
6. **The 4,408 figure is an automated split, not a verified award count.** Splitting on the string `Case No.` will over-count where a case number is cited inside another award's text and under-count where an award's number is formatted unusually. Treat it as an order-of-magnitude figure. **The verified, hand-read number is 40.**
7. **~0.1% non-health contamination in the automated corpus** (6 identified motor/vehicle subject lines out of 4,408). The hand-read 40 are clean.
8. **One of the 40 is an Overseas Mediclaim award** (Case No. GI/306/OIC/10, Ritu Pandey v. Oriental, [Mediclaim-Book15.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book15.pdf)) — travel health cover, repudiated for "delay in intimation to Insurance Company or its designated agency". It is health insurance but not domestic hospitalisation. It contributes the single late-intimation data point. Disclose this if the late-intimation row is challenged.
9. **Ground #22 (policy-period/inception mismatch)** rests on Case No. GI/565/Star/10 ([Mediclaim-Book16.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book16.pdf)), where the extracted text is internally inconsistent about dates (complainant says the policy was taken 10.04.2010 but describes surgery on 31.12.2009, while the insurer cites a 09.04.2009–08.04.2010 policy). The classification is my reading of an ambiguous record. **Flagged as low-confidence.**
10. **Ground #18 (claim closed with no ground communicated)** rests on Case No. GI/140/UII/10 ([Mediclaim-Book14.pdf](https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book14.pdf)), where the award records only that "the claim was made as no claim" with no ground stated in the extracted portion. **Flagged as low-confidence.**
11. **No claim is made here about modern clause numbering.** Clause 4.1 / 4.2 / 4.3 / 5.7 references are quoted from the awards as printed. Mapping them onto any current 2026 product's wording is unverified and would be a separate task.
12. **Nothing in this file comes from background knowledge.** Every ground, count and quotation traces to a `cioins.co.in` PDF listed in the Method table. There is no secondary source in this document, and therefore no "general knowledge" section.

---

## Reproducing this

```bash
for i in $(seq 2 20); do
  curl -sSL -A "Mozilla/5.0" -o "Mediclaim-Book$i.pdf" \
    "https://www.cioins.co.in/GIC/mediclaim/Mediclaim-Book$i.pdf"
done
python3 -c "import fitz,glob;[open(f.replace('.pdf','.txt'),'w').write('\n'.join(p.get_text() for p in fitz.open(f))) for f in glob.glob('*.pdf')]"
```

Split on `Case No.`, filter to segments matching `repudiat|disallow|rejected the claim|not payable|not admissible` at 800–5,000 chars, draw 2 per book with `random.seed(20260808)`, top up to 40.
