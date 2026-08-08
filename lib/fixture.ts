import type { Extraction } from './types';

/**
 * The committed fixture. BUILD-TODAY.md: "The fixture is the insurance policy."
 *
 * Everything downstream builds against this, so venue wifi can die and the demo still
 * runs. When the live vision call returns something good, this gets replaced by that
 * output verbatim — it is not hand-tuned afterwards.
 */

/** The photographed page, transcribed. The fabrication guard checks candidate text against this. */
export const SEEDED_SUMMARY_TEXT = `
KRISHNA MULTISPECIALITY HOSPITAL, BENGALURU
DISCHARGE SUMMARY

Patient: Ramachandra P.            Age/Sex: 71/M            IP No: 2026/08/4471
Admitted: 04-08-2026              Discharged: 08-08-2026     Ward: Deluxe Single Room

Diagnosis: Symptomatic cholelithiasis with chronic calculous cholecystitis.

History: Patient presented with recurrent right hypochondrial pain for 3 months,
worse after meals. k/c/o DM since 15 years, on oral hypoglycaemics. No history of
fever or jaundice.

Investigations: USG abdomen - multiple gallstones, largest 14mm, GB wall thickened.
LFT within normal limits. HbA1c 7.8%.

Procedure: Laparoscopic cholecystectomy done under GA on 05-08-2026.
Intra-op: adhesions at Calot's triangle. Endoclips applied. No bile leak.

Course in hospital: Post-operative period uneventful. Patient ambulated on POD-1.
Orals resumed POD-1. Sugars monitored. Wound healthy at discharge.

Advice: Tab Pantoprazole 40mg OD x 5 days. Review in OPD after 7 days.
Suture removal on POD-8.

Dr. S. Venkatesh, MS
Consultant Surgeon
`.trim();

export const SEEDED_EXTRACTION: Extraction = {
  clinical_statements: [
    'Symptomatic cholelithiasis with chronic calculous cholecystitis',
    'Laparoscopic cholecystectomy done under GA on 05-08-2026',
    'Post-operative period uneventful',
    'Patient ambulated on POD-1',
  ],

  room: {
    category_as_billed: 'Deluxe Single Room',
    rate_per_day: 8_000,
    nights: 4,
  },

  bill_lines: [
    { head: 'room_rent', label: 'Room rent (4 nights @ 8,000)', amount: 32_000 },
    { head: 'nursing', label: 'Nursing charges', amount: 12_000 },
    { head: 'practitioners_fees', label: "Surgeon & physicians' fees", amount: 30_000 },
    { head: 'operation_theatre', label: 'Operation theatre charges', amount: 14_000 },
    { head: 'non_payable_consumables', label: 'Gloves, PPE kit, syringes', amount: 15_000 },
    { head: 'pharmacy_consumables', label: 'Pharmacy', amount: 42_000 },
    { head: 'implants_devices', label: 'Endoclips and trocar', amount: 35_000 },
    { head: 'diagnostics', label: 'Laboratory and imaging', amount: 28_000 },
    { head: 'anaesthesia_blood_oxygen', label: 'Anaesthesia, oxygen', amount: 20_000 },
    { head: 'misc', label: 'Registration and admin', amount: 12_000 },
  ],

  // The single most common missing document. Named exactly as the ward names it.
  missing_documents: ['Indoor case papers'],

  // Note the shape: a question, not a sentence we would write into the record.
  unestablished: ['Why inpatient admission was required'],

  // The free micro-beat. Insurers lift this phrasing verbatim to argue pre-existing
  // disease. We cannot adjudicate that — we can point at the exact sentence.
  ped_trigger_phrases: ['k/c/o DM since 15 years'],

  confidence: 'high',
};
