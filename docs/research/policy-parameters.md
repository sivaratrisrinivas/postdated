# Retail Health Insurance — Machine-Usable Claim-Deduction Parameters

**Researched:** 8 Aug 2026 · **Scope:** Star Health, HDFC ERGO, Niva Bupa flagship retail indemnity products + IRDAI standardised non-payable list.

**Sourcing rule applied:** insurer's own domain or the IRDAI regulator portal only. No aggregators.

---

## 1. Method

| Insurer | Product | UIN | Wording version | Source URL | Notes |
|---|---|---|---|---|---|
| Star Health & Allied Insurance | **Family Health Optima Insurance Plan** | `SHAHLIP22030V062122` | `POL / FHO / V.13 / 2021` (12 pp.) | [irdai.gov.in — SHAHLIP22030V062122_HEALTH2052.pdf](https://irdai.gov.in/documents/37343/931203/SHAHLIP22030V062122_HEALTH2052.pdf/1656a56f-10ec-f930-2175-146470c26773?version=1.1&t=1668770129657&download=true) | **Sourced from the IRDAI filing repository, not starhealth.in.** `web.starhealth.in` and Star's CloudFront CDN were both unreachable from this environment (TLS/HTTP2 stall and DNS failure respectively). This is the version Star filed with the regulator. A newer `V.21` exists on starhealth.in — see §6. |
| HDFC ERGO General Insurance | **my: Optima Secure** | `HDFHLIP25041V062425` | Current "Optima Secure revision" wording (53 pp.) | [hdfcergo.com — optima-secure-revision-pw.pdf](https://www.hdfcergo.com/docs/default-source/downloads/policy-wordings/health/optima-secure-revision-pw.pdf) | Insurer's own domain. UIN appears in the running footer of every page. |
| Niva Bupa Health Insurance | **ReAssure 2.0** | `NBHHLIP27054V032627` | Current wording (34 pp.) | [transactions.nivabupa.com — ReAssure-2.0-Policy-Wording.pdf](https://transactions.nivabupa.com/pages/doc/policy_wording/ReAssure-2.0-Policy-Wording.pdf) | Insurer's own domain. The `www.nivabupa.com` DAM copy is an **older** wording, `NBHHLIP23169V012223` (24 pp.) — do not use it. |
| IRDAI | Modification Guidelines on Standardization in Health Insurance | Ref. `IRDAI/HLT/REG/CIR/176/09/2019` | 27 September 2019, Annexure I | [Landing page](https://irdai.gov.in/document-detail?documentId=392476) · [PDF](https://irdai.gov.in/documents/37343/365525/Modification+Guidelines+on+Standardization+in+Health+Insurance.pdf/c11bdea3-aef4-b638-6501-296ccc372ef2?version=1.1&t=1665917813498&download=true) | Effective for products filed on/after 1 Oct 2019; mandatory for all in-market products from 1 Oct 2020. |

**Effective dates:** none of the three wordings prints an explicit "effective from" date on the face of the document. Version identity is carried by the UIN (and, for Star, the `POL/FHO/V.13/2021` document code). Treat the UIN as the version key.

---

## 2. Calculator parameters (JSON)

> `null` = could not verify from the primary source. Never substitute a guess.

### 2.1 Star Health — Family Health Optima

```json
{
  "insurer": "Star Health and Allied Insurance Company Limited",
  "product": "Family Health Optima Insurance Plan",
  "uin": "SHAHLIP22030V062122",
  "wording_version": "POL / FHO / V.13 / 2021",
  "source_url": "https://irdai.gov.in/documents/37343/931203/SHAHLIP22030V062122_HEALTH2052.pdf/1656a56f-10ec-f930-2175-146470c26773?version=1.1&t=1668770129657&download=true",

  "room_rent": {
    "basis": "per_sum_insured_band",
    "unit": "INR_per_day_or_room_category",
    "reference": "Section 2 COVERAGE, item A — pp. 4-5",
    "bands": [
      { "sum_insured_inr": 100000,  "limit_type": "absolute_per_day", "limit_inr_per_day": 2000 },
      { "sum_insured_inr": 200000,  "limit_type": "absolute_per_day", "limit_inr_per_day": 5000 },
      { "sum_insured_inr": 300000,  "limit_type": "absolute_per_day", "limit_inr_per_day": 5000 },
      { "sum_insured_inr": 400000,  "limit_type": "absolute_per_day", "limit_inr_per_day": 5000 },
      { "sum_insured_inr": 500000,  "limit_type": "room_category", "room_category": "Single Standard A/C Room" },
      { "sum_insured_inr": 1000000, "limit_type": "room_category", "room_category": "Single Standard A/C Room" },
      { "sum_insured_inr": 1500000, "limit_type": "room_category", "room_category": "Single Standard A/C Room" },
      { "sum_insured_inr": 2000000, "limit_type": "room_category", "room_category": "Single Standard A/C Room" },
      { "sum_insured_inr": 2500000, "limit_type": "room_category", "room_category": "Single Standard A/C Room" }
    ],
    "icu_limit": null,
    "icu_note": "ICU charges are listed as a payable head under COVERAGE item C (p.5) but no separate ICU cap or ICU proportionate-deduction carve-out is stated. Contrast HDFC, which explicitly exempts ICU."
  },

  "proportionate_deduction": {
    "applies": true,
    "scope": "associated_medical_expenses_plus_room_rent_differential",
    "included_heads": ["Professional fees", "OT charges", "Procedure charges", "etc. (open-ended)"],
    "excluded_heads": ["Cost of pharmacy and consumables", "Cost of implants and medical devices", "Cost of diagnostics"],
    "icu_exempt": null,
    "waived_if_no_differential_billing": true,
    "formula_stated_in_wording": false,
    "reference": "SPECIFIC DEFINITION 'Associated medical expenses' (p.4) + Note under Section 2 COVERAGE item A (p.5)"
  },

  "copay": [
    {
      "percent": 20,
      "trigger": "age_at_entry",
      "condition": "Age at time of entry is 61 years and above",
      "applies_to": "each and every claim amount, fresh and renewal policies",
      "scope": "Applicable to coverage sections A to K and S",
      "reference": "Section AA Co-payment, p.7"
    }
  ],
  "copay_zone_based": null,
  "copay_zone_note": "The wording defines Zone 1 / Zone 1A / Zone 2 / Zone 3 (p.4) but no zone-linked co-payment clause was found in this version. Zones appear to drive premium, not co-pay.",
  "copay_non_network": null,

  "disease_sublimits": {
    "cataract": {
      "unit": "INR",
      "reference": "Section 2 COVERAGE item E, p.5",
      "bands": [
        { "sum_insured_inr": 100000,  "per_eye": null,  "per_policy_period": 12000, "note": "Stated as 'Up to 12,000/- per eye, per policy period' — single combined cap" },
        { "sum_insured_inr": 200000,  "per_eye": null,  "per_policy_period": 12000, "note": "Same merged cell as the 1,00,000 band" },
        { "sum_insured_inr": 300000,  "per_eye": 25000, "per_policy_period": 35000 },
        { "sum_insured_inr": 400000,  "per_eye": 30000, "per_policy_period": 45000 },
        { "sum_insured_inr": 500000,  "per_eye": 40000, "per_policy_period": 60000 },
        { "sum_insured_inr": 1000000, "per_eye": 50000, "per_policy_period": 75000 },
        { "sum_insured_inr": 1500000, "per_eye": null,  "per_policy_period": null, "note": "Row present in table but cell values not recoverable from the PDF text layer" },
        { "sum_insured_inr": 2000000, "per_eye": null,  "per_policy_period": null, "note": "same" },
        { "sum_insured_inr": 2500000, "per_eye": null,  "per_policy_period": null, "note": "same" }
      ]
    },
    "hernia": null,
    "knee_replacement": null,
    "organ_donor": { "limit": "lower of 10% of Sum Insured or INR 100000", "reference": "Section 2 COVERAGE item K, p.5" },
    "modern_treatments": {
      "note": "A per-SI table of caps for Uterine Artery Embolization/HIFU, Balloon Sinuplasty, Deep Brain Stimulation, Oral Chemotherapy, Immunotherapy (Monoclonal Antibody), Intra Vitreal injections, Robotic surgeries, Stereotactic radio surgeries, Bronchial Thermoplasty, Vaporisation of prostate, IONM, Stem cell therapy exists on p.7. Column-to-value mapping did not survive text extraction cleanly — re-read p.7 visually before hard-coding.",
      "values": null,
      "reference": "p.7"
    },
    "ambulance": { "limit_inr_per_hospitalisation": 750, "reference": "Section 2 COVERAGE item F, p.5" }
  },

  "waiting_periods": {
    "initial_days": 30,
    "initial_reference": "30-day waiting period — Code Excl 03, p.8",
    "pre_existing_disease_months": 48,
    "ped_reference": "Pre-Existing Diseases — Code Excl 01, p.8",
    "specific_illness_months": 24,
    "specific_reference": "Specified disease / procedure waiting period — Code Excl 02, p.8"
  },

  "non_payable_items": {
    "insurer_own_list_in_wording": null,
    "note": "This wording does not reproduce a non-payable items annexure. Apply the IRDAI Annexure I Lists I-IV (see section 4). No 'consumables cover' buy-back is present in this version.",
    "consumables_buyback_available": false
  }
}
```

### 2.2 HDFC ERGO — my: Optima Secure

```json
{
  "insurer": "HDFC ERGO General Insurance Company Limited",
  "product": "my: Optima Secure",
  "uin": "HDFHLIP25041V062425",
  "wording_version": "Optima Secure revision policy wording, 53 pp.",
  "source_url": "https://www.hdfcergo.com/docs/default-source/downloads/policy-wordings/health/optima-secure-revision-pw.pdf",

  "room_rent": {
    "basis": "at_actuals_by_default",
    "default_limit": "At Actuals",
    "limit_inr_per_day": null,
    "percent_of_sum_insured": null,
    "reference": "Section B-1.1 Hospitalization Expenses, clause (a), p.11",
    "verbatim": "Room Rent, boarding, nursing expenses as provided by the Hospital / Nursing Home. Room rent limit shall be 'At Actuals' unless otherwise specified in the Policy Schedule.",
    "icu_limit": "At Actuals",
    "icu_reference": "Section B-1.1 clause (b), p.11",
    "schedule_overridable": true,
    "optional_downgrades": [
      { "to": "Single Private Room", "reference": "Annexure C optional cover 'Modification of Room category coverage', options 1-2, p.29", "note": "ICU / ICCU still at Actuals" },
      { "to": "Shared Room",         "reference": "Annexure C optional cover, options 3-4, p.29", "note": "default in Optima Select plan is Single Private Room; can be downgraded to Shared. ICU / ICCU still at Actuals" }
    ]
  },

  "proportionate_deduction": {
    "applies": true,
    "scope": "room_rent_plus_all_associated_medical_expenses",
    "trigger": "Insured admitted in a room exceeding the category/limit stipulated in the Policy Schedule",
    "included_heads": ["Consultation fees", "Operation theatre charges", "Surgical appliances", "Nursing", "Anaesthesia", "Blood", "Oxygen"],
    "excluded_heads": ["Cost of pharmacy and consumables", "Cost of implants and medical devices", "Cost of diagnostics"],
    "icu_exempt": true,
    "icu_rule": "If admitted in an ICU/ICCU room exceeding the stipulated category, proportionate deduction applies ONLY to the ICU/ICCU room charges for those days; it does NOT apply to Associated Medical Expenses incurred during ICU/ICCU days.",
    "waived_if_no_differential_billing": true,
    "formula_stated_in_wording": true,
    "formula": "payable = admissible_rate_per_day / actual_rate_per_day  ×  (room_rent + associated_medical_expenses)",
    "reference": "Section B-1.1.1 Other Expenses, Note (iii), p.12; definition at Def. 5 'Associated Medical Expenses', p.7"
  },

  "copay": [],
  "copay_note": "No operative co-payment clause exists in this wording. 'Co-Payment' appears only as a standard definition (Def., p.4). No age-band, zone-band or non-network co-pay was found. If a schedule imposes one it comes from the Policy Schedule, not the wording.",

  "disease_sublimits": {
    "cataract": null,
    "hernia": null,
    "knee_replacement": null,
    "note": "No per-disease rupee sub-limits appear in the base wording. 'Sub-limit' is defined (Def. 28, p.9) as a Policy-Schedule-driven value: the calculator must read sub-limits off the schedule, not the wording. Cataract appears only in the Excl02 specified-disease waiting-period list ('Cataract and other disorders of lens'), not as a money cap.",
    "sublimits_source": "policy_schedule"
  },

  "waiting_periods": {
    "initial_days": 30,
    "initial_reference": "30-day waiting period: Code – Excl03, p.34",
    "pre_existing_disease_months": 36,
    "ped_reference": "Pre-Existing Diseases: Code – Excl01, p.34",
    "ped_reducible_to_months": [24, 12],
    "ped_reduction_reference": "Annexure C optional cover 'Modification of PED waiting period', p.28 — channel-level option only, not policyholder-selectable",
    "specific_illness_months": 24,
    "specific_reference": "Specified Disease/Procedure waiting period: Code – Excl02, p.34"
  },

  "non_payable_items": {
    "insurer_own_list_in_wording": "Annexure B to the policy — 'Non-Medical Expenses'",
    "annexure_b_reference": "Annexure B, referenced from Section B-2.3 'Protect Benefit', p.15-16",
    "consumables_buyback_available": true,
    "buyback_name": "Protect Benefit",
    "buyback_effect": "The Company indemnifies the Non-Medical Expenses listed under Annexure B incurred in relation to an admissible Section B-1 claim; Specific Exclusion (k) of Section C.2 is switched off for this cover.",
    "annexure_b_item_list": null,
    "annexure_b_note": "Annexure B is present in the PDF but the item list was not itemised in this pass — extract it before shipping the HDFC path. It is expected to track the IRDAI Lists I-IV."
  }
}
```

### 2.3 Niva Bupa — ReAssure 2.0

```json
{
  "insurer": "Niva Bupa Health Insurance Company Limited",
  "product": "ReAssure 2.0",
  "uin": "NBHHLIP27054V032627",
  "wording_version": "ReAssure 2.0 policy wording, 34 pp.",
  "source_url": "https://transactions.nivabupa.com/pages/doc/policy_wording/ReAssure-2.0-Policy-Wording.pdf",

  "room_rent": {
    "basis": "no_limit_by_default",
    "default_limit": "No room rent limit — any room category",
    "limit_inr_per_day": null,
    "percent_of_sum_insured": null,
    "reference": "Section 4.2 'Expenses during Hospitalization', clause 4.2.1, p.5",
    "verbatim": "We don't limit your choice. Choose the room you like, but choose judiciously to protect your Sum Insured.",
    "icu_limit": "up to Base Sum Insured, always — irrespective of room type chosen",
    "icu_reference": "Section 4.21 'Room Type Modification', p.13",
    "optional_downgrades": [
      { "to": "Single Private Room", "reference": "Section 4.21 Room Type Modification, p.13" },
      { "to": "Sharing Room",        "reference": "Section 4.21 Room Type Modification, p.13" }
    ],
    "note": "Room rent is only capped if the policyholder buys the 'Room Type Modification' option. The calculator must read the elected room category off the Policy Schedule; the wording carries no default cap."
  },

  "proportionate_deduction": {
    "applies": true,
    "scope": "associated_medical_expenses_only__narrowly_defined",
    "trigger": "Insured opts for a Hospital room higher than the eligible room category specified in the Policy Schedule",
    "included_heads": ["Room Rent", "Nursing charges", "Medical Practitioners' fees", "Operation theatre charges"],
    "included_heads_closed_list": true,
    "excluded_heads": ["Investigations / diagnostics", "Pharmacy and consumables", "Implants and devices", "everything else not in the four listed heads"],
    "surcharge_and_tax_included": true,
    "icu_exempt": null,
    "icu_note": "No explicit ICU carve-out from proportionate deduction. Section 4.21 says ICU is always paid up to Base Sum Insured regardless of room type, which functionally protects ICU but is not phrased as a proportionate-deduction exemption.",
    "waived_if_no_differential_billing": null,
    "formula_stated_in_wording": true,
    "formula": "payable = (eligible_room_rent_limit / room_rent_actually_incurred) × total_associated_medical_expenses",
    "reference": "Claims section, note (d), p.26"
  },

  "copay": [],
  "copay_note": "No default co-payment. Co-payment is an OPTIONAL cost-sharing feature (Section 4.19, p.13) whose percentage is set in the Policy Schedule. Not applicable to Annual Health Check-up, Live Healthy, Second Medical Opinion, Shared Accommodation Cash, e-consultation, Personal Accident or Hospital Daily Cash. No age-band, zone or non-network co-pay in the wording.",
  "copay_percent": null,

  "deductible": {
    "type": "optional_aggregate",
    "reference": "Section 4.18, p.13",
    "amount": null,
    "note": "Amount is schedule-driven. Excluded benefits mirror the co-pay carve-outs."
  },

  "disease_sublimits": {
    "cataract": {
      "type": "device_restriction_not_money_cap",
      "rule": "Mono-focal lens only, for Sum Insured up to INR 10 lakh",
      "limit_inr": null,
      "reference": "Section 4.2.1 note, p.5"
    },
    "hernia": null,
    "knee_replacement": null,
    "note": "No rupee disease sub-limits found in the wording. Section 6 confirms policies remain 'subject to all limits, sub limits, co-payments' set elsewhere — i.e. the Policy Schedule."
  },

  "waiting_periods": {
    "initial_days": 30,
    "initial_reference": "30-day waiting period (Code- Excl03), Section 5.1.3, p.15",
    "pre_existing_disease_months": 36,
    "ped_reference": "Pre-existing Diseases (Code–Excl01), Section 5.1.1, p.14",
    "ped_modifiable": true,
    "ped_modification_reference": "Section 4.20 'Pre-Existing Disease Waiting Time Modification', p.13 — can be increased or reduced",
    "specific_illness_months": 24,
    "specific_reference": "Specified disease/procedure waiting period (Code- Excl02), Section 5.1.2, p.15",
    "specific_carve_outs": "Accident covered from day 1; Cancer covered after the 30-day waiting period",
    "personal_waiting_period_months_max": 48,
    "personal_reference": "Personal Waiting Period, p.17"
  },

  "non_payable_items": {
    "insurer_own_list_in_wording": "Annexure I — reproduces the IRDAI Lists I / II / III / IV",
    "reference": "Claims section note (c), p.26 — 'The expenses that are not covered or subsumed into room charges / procedure charges / costs of treatment are placed as Annexure I.'",
    "consumables_buyback_available": true,
    "buybacks": [
      { "name": "Claim Safeguard",  "covers": "non-payable items in List I of Annexure I",            "reference": "p.11" },
      { "name": "Claim Safeguard+", "covers": "non-payable items in Lists I, II, III and IV of Annexure I", "reference": "p.11" }
    ],
    "note": "Niva Bupa is the only one of the three that both reproduces the IRDAI lists in its own annexure AND sells a two-tier buy-back keyed directly to those list numbers. This makes the non-payable calculation directly parameterisable: a boolean per buy-back toggles which IRDAI lists are disallowed."
  }
}
```

---

## 3. The proportionate-deduction clauses, verbatim

This is the clause the whole calculator turns on. **All three insurers apply it beyond the room charge — but they scope "beyond" differently, and the difference is material to the arithmetic.**

### 3.1 Star Health — Family Health Optima (UIN SHAHLIP22030V062122)

**(a) SPECIFIC DEFINITION — "Associated medical expenses", p.4:**

> "Associated medical expenses means medical expenses such as Professional fees, OT charges, Procedure charges, etc., which vary based on the room category occupied by the insured person whilst undergoing treatment in some of the hospitals. If Policy Holder chooses a higher room category above the eligibility defined in policy, then proportionate deduction will apply on the Associated Medical Expenses in addition to the difference in room rent. Such associated medical expenses do not include Cost of pharmacy and consumables, Cost of implants and medical devices and Cost of diagnostics."

**(b) Operative note under Section 2 COVERAGE, item A, p.5:**

> "Note: Expenses relating to hospitalization will be considered in proportion to the eligible room rent/room category stated in the policy schedule or actuals whichever is less. Proportionate deductions are not applied in respect of the hospitals which do not follow differential billing or for those expenses in respect of which differential billing is not adopted based on the room category."

### 3.2 HDFC ERGO — my: Optima Secure (UIN HDFHLIP25041V062425)

**(a) Section B-1.1.1 "Other Expenses", Note (iii), p.12:**

> "Proportionate deduction on Room Rent: In case the Insured Person is admitted in a room that exceeds the category/limit stipulated in the Policy Schedule, the reimbursement/payment of Room Rent charges including all Associated Medical Expenses incurred at Hospital shall be effected in the same proportion as the admissible rate per day bears to the actual rate per day of Room Rent charges. This condition is not applicable in respect of Hospitals where differential billing for Associated Medical Expenses is not followed based on Room Rent. In case the Insured Person is admitted in an ICU / ICCU room that exceeds the category/limit stipulated in the Policy Schedule then Proportionate deduction as stated above shall only apply on ICU / ICCU room charges for the days Insured Person was admitted in ICU / ICCU. Proportionate deduction will not apply for Associated Medical expenses incurred during the days Insured Person was admitted in ICU / ICCU."

**(b) Def. 5 "Associated Medical Expenses", p.7:**

> "Associated Medical Expenses means Consultation fees, charges on Operation theatre, surgical appliances & nursing, and expenses on Anesthesia, blood, oxygen incurred during Hospitalization of the Insured Person which vary based on the room category occupied by the insured person whilst undergoing treatment in some of the hospitals. If Policy Holder chooses a higher room category above the eligibility defined in Policy Schedule, then proportionate deduction will apply on the Associated Medical Expenses in addition to the difference in room rent. Such associated medical expenses do not include Cost of pharmacy and consumables, Cost of implants and medical devices and Cost of diagnostics. Proportionate deduction shall not be applicable to 'ICU charges'."

### 3.3 Niva Bupa — ReAssure 2.0 (UIN NBHHLIP27054V032627)

**(a) Claims section, note (d), p.26:**

> "If you opt for a Hospital room which is higher than the eligible room category as specified in your Policy Schedule, then We will pay only a pro-rated portion of the total Associated Medical Expenses (including surcharge or taxes thereon) as per the following formula:
>
> (Eligible Room Rent limit / Room Rent actually incurred) * total Associated Medical Expenses
>
> Associated Medical Expenses shall include Room Rent, nursing charges, Medical Practitioners' fees and operation theatre charges."

**(b) Section 4.21 "Room Type Modification", p.13:**

> "If you choose a room category higher than the room category available under your policy or as opted by you, claim settlement/payment may be subject to proportionate deductions on eligible medical expenses, based on the tariff arrangements agreed between the Us and the Network Provider and in accordance with the Policy terms."

### 3.4 Where the three differ — implementation-relevant deltas

All three ratio the bill down by `eligible_room_rate / actual_room_rate`. What that ratio multiplies is **not** the same.

| Dimension | Star Health FHO | HDFC ERGO Optima Secure | Niva Bupa ReAssure 2.0 |
|---|---|---|---|
| **Ratio numerator/denominator** | "eligible room rent/room category … or actuals whichever is less" — stated as a proportion, no formula written out | `admissible rate per day / actual rate per day` — explicit | `Eligible Room Rent limit / Room Rent actually incurred` — explicit, written as an equation |
| **What the ratio multiplies — definition style** | **Open-ended.** "Professional fees, OT charges, Procedure charges, **etc.**" — plus a broader operative note saying "*Expenses relating to hospitalization* will be considered in proportion". Ambiguous by construction. | **Closed inclusion list.** Consultation fees, OT charges, surgical appliances & nursing, anaesthesia, blood, oxygen. Applied to "Room Rent charges **including all** Associated Medical Expenses". | **Closed list, four heads only.** Room Rent, nursing charges, Medical Practitioners' fees, operation theatre charges. Nothing else. |
| **Surgeon / consultant fees hit?** | Yes ("Professional fees") | Yes ("Consultation fees") | Yes ("Medical Practitioners' fees") |
| **OT charges hit?** | Yes | Yes | Yes |
| **Investigations / diagnostics hit?** | **No** — explicitly carved out | **No** — explicitly carved out | **No** — not in the four-head list |
| **Pharmacy / consumables hit?** | **No** — explicitly carved out | **No** — explicitly carved out | **No** — not in the list |
| **Implants / devices hit?** | **No** — explicitly carved out | **No** — explicitly carved out | **No** — not in the list |
| **Anaesthesia / blood / oxygen hit?** | Unclear — falls under "etc." | **Yes** — named explicitly | **No** — not in the four-head list |
| **Surcharge / taxes on AME hit?** | Not addressed | Not addressed | **Yes** — "(including surcharge or taxes thereon)" |
| **ICU exemption** | Not stated | **Yes, two-part**: (i) blanket "Proportionate deduction shall not be applicable to 'ICU charges'"; (ii) if ICU itself exceeds the stipulated category, the ratio applies to ICU room charges only, never to AME on ICU days | Not stated as an exemption; instead ICU is always paid up to Base SI regardless of room type |
| **Waived where hospital does not do differential billing** | **Yes** — and additionally waived head-by-head for "those expenses in respect of which differential billing is not adopted" | **Yes** — hospital-level waiver only | **Not stated.** Instead conditioned on "tariff arrangements agreed between Us and the Network Provider" (§4.21), which is looser |
| **Formula written out as an equation** | No | No (prose, but unambiguous) | **Yes** |

**Practical consequence for the calculator:** on an identical bill with an identical room upgrade, **Niva Bupa deducts the least** (four heads), **HDFC deducts more** (adds anaesthesia/blood/oxygen/surgical appliances, but shields all ICU days), and **Star is the widest and least determinate** because of the "etc." and the "expenses relating to hospitalization" phrasing. If the demo claims arithmetic precision, Star's "etc." is the clause that will get challenged from the audience.

---

## 4. IRDAI standardised non-payable / optional items (Annexure I, Lists I–IV)

**Source:** IRDAI, *Modification Guidelines on Standardization in Health Insurance*, Ref. `IRDAI/HLT/REG/CIR/176/09/2019`, dated 27 September 2019, Annexure I (pp. 2–7).
**Landing page:** https://irdai.gov.in/document-detail?documentId=392476
**PDF:** https://irdai.gov.in/documents/37343/365525/Modification+Guidelines+on+Standardization+in+Health+Insurance.pdf/c11bdea3-aef4-b638-6501-296ccc372ef2?version=1.1&t=1665917813498&download=true

**Governing rule (Annexure I, p.2):** items are classified into four categories — List I items may be offered as optional cover; where costs fall in List II they are to be **subsumed into the room charges**, List III into the **procedure charges**, List IV into the **costs of treatment (including costs of diagnostics)**. Applicable to all health products filed on/after 1 Oct 2019; non-compliant in-market products withdrawn from 1 Oct 2020.

> Note for the calculator: List II/III/IV items are **not** separately disallowed line items in the strict sense — the regulator's instruction is that the hospital must not bill them separately because they are already inside the room / procedure / treatment charge. In practice an insurer disallows them when they appear as separate bill lines. Model them as "disallow if itemised separately".

### List I — Optional Items (68 items) — insurer may offer cover; otherwise not payable

BABY FOOD · BABY UTILITIES CHARGES · BEAUTY SERVICES · BELTS/BRACES · BUDS · COLD PACK/HOT PACK · CARRY BAGS · EMAIL/INTERNET CHARGES · FOOD CHARGES (OTHER THAN PATIENT's DIET PROVIDED BY HOSPITAL) · LEGGINGS · LAUNDRY CHARGES · MINERAL WATER · SANITARY PAD · TELEPHONE CHARGES · GUEST SERVICES · CREPE BANDAGE · DIAPER OF ANY TYPE · EYELET COLLAR · SLINGS · BLOOD GROUPING AND CROSS MATCHING OF DONORS SAMPLES · SERVICE CHARGES WHERE NURSING CHARGE ALSO CHARGED · TELEVISION CHARGES · SURCHARGES · ATTENDANT CHARGES · EXTRA DIET OF PATIENT (OTHER THAN THAT WHICH FORMS PART OF BED CHARGE) · BIRTH CERTIFICATE · CERTIFICATE CHARGES · COURIER CHARGES · CONVEYANCE CHARGES · MEDICAL CERTIFICATE · MEDICAL RECORDS · PHOTOCOPIES CHARGES · MORTUARY CHARGES · WALKING AIDS CHARGES · OXYGEN CYLINDER (FOR USAGE OUTSIDE THE HOSPITAL) · SPACER · SPIROMETRE · NEBULIZER KIT · STEAM INHALER · ARMSLING · THERMOMETER · CERVICAL COLLAR · SPLINT · DIABETIC FOOT WEAR · KNEE BRACES (LONG/SHORT/HINGED) · KNEE IMMOBILIZER/SHOULDER IMMOBILIZER · LUMBO SACRAL BELT · NIMBUS BED OR WATER OR AIR BED CHARGES · AMBULANCE COLLAR · AMBULANCE EQUIPMENT · ABDOMINAL BINDER · PRIVATE NURSES CHARGES – SPECIAL NURSING CHARGES · SUGAR FREE TABLETS · CREAMS POWDERS LOTIONS (Toiletries are not payable, only prescribed medical pharmaceuticals payable) · ECG ELECTRODES · GLOVES · NEBULISATION KIT · ANY KIT WITH NO DETAILS MENTIONED [DELIVERY KIT, ORTHOKIT, RECOVERY KIT, ETC] · KIDNEY TRAY · MASK · OUNCE GLASS · OXYGEN MASK · PELVIC TRACTION BELT · PAN CAN · TROLLY COVER · UROMETER, URINE JUG · AMBULANCE · VASOFIX SAFETY

### List II — Items to be subsumed into Room Charges (37 items)

BABY CHARGES (UNLESS SPECIFIED/INDICATED) · HAND WASH · SHOE COVER · CAPS · CRADLE CHARGES · COMB · EAU-DE-COLOGNE/ROOM FRESHENERS · FOOT COVER · GOWN · SLIPPERS · TISSUE PAPER · TOOTH PASTE · TOOTH BRUSH · BED PAN · FACE MASK · FLEXI MASK · HAND HOLDER · SPUTUM CUP · DISINFECTANT LOTIONS · LUXURY TAX · HVAC · HOUSE KEEPING CHARGES · AIR CONDITIONER CHARGES · IM IV INJECTION CHARGES · CLEAN SHEET · BLANKET/WARMER BLANKET · ADMISSION KIT · DIABETIC CHART CHARGES · DOCUMENTATION CHARGES / ADMINISTRATIVE EXPENSES · DISCHARGE PROCEDURE CHARGES · DAILY CHART CHARGES · ENTRANCE PASS / VISITORS PASS CHARGES · EXPENSES RELATED TO PRESCRIPTION ON DISCHARGE · FILE OPENING CHARGES · INCIDENTAL EXPENSES/MISC. CHARGES (NOT EXPLAINED) · PATIENT IDENTIFICATION BAND / NAME TAG · PULSEOXYMETER CHARGES

### List III — Items to be subsumed into Procedure Charges (23 items)

HAIR REMOVAL CREAM · DISPOSABLE RAZORS CHARGES (for site preparations) · EYE PAD · EYE SHIELD · CAMERA COVER · DVD, CD CHARGES · GAUSE SOFT · GAUZE · WARD AND THEATRE BOOKING CHARGES · ARTHROSCOPY AND ENDOSCOPY INSTRUMENTS · MICROSCOPE COVER · SURGICAL BLADES, HARMONIC SCALPEL, SHAVER · SURGICAL DRILL · EYE KIT · EYE DRAPE · X-RAY FILM · BOYLES APPARATUS CHARGES · COTTON · COTTON BANDAGE · SURGICAL TAPE · APRON · TORNIQUET · ORTHOBUNDLE, GYNAEC BUNDLE

### List IV — Items to be subsumed into costs of treatment (18 items)

ADMISSION/REGISTRATION CHARGES · HOSPITALISATION FOR EVALUATION/DIAGNOSTIC PURPOSE · URINE CONTAINER · BLOOD RESERVATION CHARGES AND ANTE NATAL BOOKING CHARGES · BIPAP MACHINE · CPAP/CAPD EQUIPMENTS · INFUSION PUMP – COST · HYDROGEN PEROXIDE\SPIRIT\DISINFECTANTS ETC · NUTRITION PLANNING CHARGES – DIETICIAN CHARGES – DIET CHARGES · HIV KIT · ANTISEPTIC MOUTHWASH · LOZENGES · MOUTH PAINT · VACCINATION CHARGES · ALCOHOL SWABS · SCRUB SOLUTION/STERILLIUM · GLUCOMETER & STRIPS · URINE BAG

> Transcription note: the IRDAI PDF is a scan with an imperfect text layer. Obvious OCR artefacts have been normalised (`FLEX! MASK` → `FLEXI MASK`, `LUM BO SACRAL BELT` → `LUMBO SACRAL BELT`, `PEL VIC` → `PELVIC`, `TROLL Y` → `TROLLY`, `EYE SHEILD` → `EYE SHIELD`, `CAPO EQUIPMENTS` → `CAPD EQUIPMENTS`, `ALCOHOL SWABES` → `ALCOHOL SWABS`, `SCRUB SOLUTIONISTERILLIUM` → `SCRUB SOLUTION/STERILLIUM`). Item *counts* per list are as printed. Verify the exact strings against the PDF before using them as literal match keys.

---

## 5. Recommendation: lead with **Niva Bupa ReAssure 2.0**

**Reason — it is the only one of the three that writes the deduction as an equation.**

> `(Eligible Room Rent limit / Room Rent actually incurred) * total Associated Medical Expenses`

That is a line of code, not an interpretation. It ships straight into a deterministic calculator, and on stage you can put the clause and the code side by side and they read identically. Neither Star nor HDFC gives you that.

Supporting reasons:

1. **Closed, four-item scope.** "Associated Medical Expenses shall include Room Rent, nursing charges, Medical Practitioners' fees and operation theatre charges." Four heads, no "etc.", no residual category. You can map every bill line to in-scope or out-of-scope with zero judgement.
2. **The non-payable list is already parameterised.** Niva reproduces the IRDAI Lists I–IV as its own Annexure I and sells two buy-backs keyed to list numbers — *Claim Safeguard* (List I) and *Claim Safeguard+* (Lists I–IV). That turns the consumables question into two booleans instead of a policy-reading exercise, and it lets you demo the same bill with the buy-back on and off.
3. **Waiting periods are clean and standard-coded** (Excl01 36m / Excl02 24m / Excl03 30d) with the Accident and Cancer carve-outs stated inline.
4. It also gives you a nice narrative beat: base ReAssure 2.0 has **no room rent cap at all**, so proportionate deduction only fires when the customer bought the Room Type Modification option. Showing "same bill, two policy configurations, one produces a deduction and one doesn't" is a strong demo of a parameterised calculator.

**Second choice: HDFC ERGO my: Optima Secure.** The prose is unambiguous and it is the only wording with a real ICU carve-out — genuinely richer logic, and the honest choice if you want to show the calculator handling a conditional. But there is no equation to point at, and the ICU rule is two nested conditions that take a paragraph to explain on stage.

**Do not lead with Star Health.** Its FHO wording actually has the nicest *tabulated* sub-limits of the three — a clean per-sum-insured room rent table, a cataract table, and a hard 20% age-61+ co-pay, all of which are trivially parseable. But the deduction clause itself is the weakest link: `"Professional fees, OT charges, Procedure charges, etc."` combined with `"Expenses relating to hospitalization will be considered in proportion"` cannot be implemented exactly as worded — you would be choosing what "etc." means, and that choice is the arithmetic. It contradicts "the arithmetic never touches the model" if a human had to guess a scope. Keep Star as the *second* insurer to show breadth of sub-limit tables, and be upfront that its scope is under-specified.

---

## 6. What I could not verify

1. **Star Health: current wording version.** I used `SHAHLIP22030V062122` (`POL/FHO/V.13/2021`) from the IRDAI filing repository. Star's own site advertises a newer **V.21** at `web.starhealth.in/sites/default/files/policy-clauses/01-FHO-Insurance-policy-colour.pdf` and a CloudFront mirror; **both were unreachable from this environment** (HTTP/2 stream error and DNS resolution failure). Room-rent bands, the cataract table and the 20% co-pay may have moved between V.13 and V.21. **Re-pull V.21 from a normal network before the demo** and diff the tables.
2. **Star Health: cataract limits for SI 15L / 20L / 25L.** The rows exist in the table on p.5 but the cell values did not survive text extraction. Recorded as `null`.
3. **Star Health: modern-treatment sub-limit grid (p.7).** The table has six treatment columns × nine SI rows; column-to-value alignment was corrupted by extraction. Values recorded as `null` — re-read the page visually.
4. **Star Health: ICU treatment under proportionate deduction.** No ICU carve-out is stated either way. Recorded as `null` rather than assumed.
5. **HDFC ERGO: Annexure B item list.** The annexure exists and is the basis of the *Protect Benefit* consumables buy-back, but I did not itemise it. Recorded as `null`. Likely mirrors IRDAI List I but must be confirmed before use.
6. **HDFC ERGO / Niva Bupa: room-rent caps.** Both default to no cap ("At Actuals" / no limit). Any actual cap is on the **Policy Schedule**, which is per-customer and not in the wording. The calculator must take room category as an input, not read it from a product table. This is a structural difference from Star, where the cap is in the wording.
7. **Effective dates.** None of the three wordings prints an effective/from date. UIN is the only reliable version key.
8. **Niva Bupa: whether proportionate deduction is waived for hospitals that do not do differential billing.** Star and HDFC both state this waiver explicitly; Niva does not. Recorded as `null` — do not assume the waiver applies.
9. **Zone- and network-based co-pay.** None of the three base wordings carries a zone-linked or non-network co-payment clause. Star defines four zones but only for (apparently) premium purposes. If the demo needs a zone co-pay, it is not sourceable from these three documents.
