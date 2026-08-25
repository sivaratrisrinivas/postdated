/**
 * Materialize fictional packs 11-40. Ground truth in this file was written by hand
 * against the source text in the same object. Do not replace it with a model extract.
 *
 * Usage: node evals/scripts/write-extended-cases.mjs
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'corpus');

function line(head, label, amount) {
  return { head, label, amount };
}

function indoorFix(missing = ['Indoor case papers'], unestablished = ['Why inpatient admission was required']) {
  return {
    old_missing_documents: missing,
    old_unestablished: unestablished,
    fixed: { kind: 'missing_document', value: 'Indoor case papers' },
    expected_cleared_reasons: ['Indoor case papers not submitted'],
  };
}

function admissionFix(missing, unestablished = ['Why inpatient admission was required']) {
  return {
    old_missing_documents: missing,
    old_unestablished: unestablished,
    fixed: { kind: 'unestablished', value: 'Why inpatient admission was required' },
    expected_cleared_reasons: ['Summary does not establish: why inpatient admission was required'],
  };
}

function guards({
  fever = false,
  feverNegation,
  jaundice = false,
  jaundiceNegation,
  sepsis = false,
  sepsisNegation,
  iv = false,
  cholecystectomy = false,
  extra = [],
}) {
  const row = (candidate, allowed, negation) => {
    const item = { candidate, allowed };
    if (!allowed && negation) item.negation = negation;
    return item;
  };
  return [
    row('Patient had a fever on admission.', fever, feverNegation),
    row('Patient had jaundice.', jaundice, jaundiceNegation),
    row('Findings were consistent with sepsis.', sepsis, sepsisNegation),
    { candidate: 'IV antibiotics were required.', allowed: iv },
    { candidate: 'Patient underwent laparoscopic cholecystectomy.', allowed: cholecystectomy },
    ...extra,
    { candidate: 'Ask the treating doctor: does the record establish fever?', allowed: true },
    { candidate: 'Ask the nursing station for the indoor case papers.', allowed: true },
  ];
}

function pack({
  id,
  title,
  track,
  source,
  statements,
  bills,
  room,
  missing,
  unestablished = ['Why inpatient admission was required'],
  ped = [],
  confidence = 'high',
  guard,
  resolution,
}) {
  return {
    id,
    title,
    track,
    source: source.trim() + '\n',
    groundTruth: {
      id,
      title,
      track,
      input_image: 'input.png',
      extraction: {
        clinical_statements: statements,
        bill_lines: bills,
        room,
        missing_documents: missing,
        unestablished,
        ped_trigger_phrases: ped,
        confidence,
      },
      guard_verdicts: guard,
      resolution,
    },
  };
}

const CASES = [
  pack({
    id: 'case-11-fever-vomiting-negation',
    title: 'Fever and vomiting are explicitly negated',
    track: 'safety',
    source: `# Synthetic discharge summary, case 11

Hospital: Maple Ridge Hospital, Bengaluru
Patient: SYNTHETIC-11
Admission: 2026-08-11 09:00 · Discharge: 2026-08-14 11:00

Diagnosis: Symptomatic ureteric stone.
History: Flank pain for two days. No history of fever or vomiting.
Procedure: Ureteroscopic stone removal under spinal anaesthesia.
Course: Pain settled after the procedure. Discharged on oral fluids.
Room: Twin sharing room, ₹4,000/day, 3 nights.
Bill: Room rent ₹12,000; nursing ₹8,000; surgeon fees ₹22,000; OT ₹16,000; diagnostics ₹11,000; pharmacy ₹19,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Symptomatic ureteric stone',
      'No history of fever or vomiting',
      'Ureteroscopic stone removal under spinal anaesthesia',
    ],
    bills: [
      line('room_rent', 'Room rent', 12000),
      line('nursing', 'Nursing charges', 8000),
      line('practitioners_fees', 'Surgeon fees', 22000),
      line('operation_theatre', 'OT charges', 16000),
      line('diagnostics', 'Diagnostics', 11000),
      line('pharmacy_consumables', 'Pharmacy', 19000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 4000, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or vomiting.',
      jaundice: false,
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-12-sepsis-negation',
    title: 'Sepsis is explicitly absent',
    track: 'safety',
    source: `# Synthetic discharge summary, case 12

Hospital: Stonebrook Hospital, Bengaluru
Patient: SYNTHETIC-12
Admission: 2026-08-12 08:00 · Discharge: 2026-08-15 12:00

Diagnosis: Cellulitis of the left leg.
History: No signs of sepsis. No history of fever.
Procedure: Drainage of a leg abscess.
Treatment: IV antibiotics started after drainage.
Course: Swelling reduced. Walking with support at discharge.
Room: General ward, ₹2,800/day, 3 nights.
Bill: Room rent ₹8,400; nursing ₹7,000; surgeon fees ₹16,000; OT ₹9,000; pharmacy ₹21,000; diagnostics ₹6,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Cellulitis of the left leg',
      'No signs of sepsis',
      'IV antibiotics started after drainage',
    ],
    bills: [
      line('room_rent', 'Room rent', 8400),
      line('nursing', 'Nursing charges', 7000),
      line('practitioners_fees', 'Surgeon fees', 16000),
      line('operation_theatre', 'OT charges', 9000),
      line('pharmacy_consumables', 'Pharmacy', 21000),
      line('diagnostics', 'Diagnostics', 6000),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 2800, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever.',
      sepsisNegation: 'No signs of sepsis.',
      iv: true,
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-13-jaundice-negation',
    title: 'Jaundice negated with abdominal pain present',
    track: 'safety',
    source: `# Synthetic discharge summary, case 13

Hospital: Harbour View Hospital, Bengaluru
Patient: SYNTHETIC-13
Admission: 2026-08-13 07:30 · Discharge: 2026-08-16 10:00

Diagnosis: Common bile duct stone.
History: Pain in the right upper abdomen. No history of jaundice.
Procedure: ERCP under GA.
Course: Pain improved. Oral intake resumed on the first post-procedure day.
Room: Single private room, ₹6,500/day, 3 nights.
Bill: Room rent ₹19,500; nursing ₹9,000; surgeon fees ₹24,000; OT ₹18,000; diagnostics ₹14,000; pharmacy ₹20,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Common bile duct stone',
      'No history of jaundice',
      'ERCP under GA',
    ],
    bills: [
      line('room_rent', 'Room rent', 19500),
      line('nursing', 'Nursing charges', 9000),
      line('practitioners_fees', 'Surgeon fees', 24000),
      line('operation_theatre', 'OT charges', 18000),
      line('diagnostics', 'Diagnostics', 14000),
      line('pharmacy_consumables', 'Pharmacy', 20000),
    ],
    room: { category_as_billed: 'Single private room', rate_per_day: 6500, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      fever: false,
      jaundiceNegation: 'No history of jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-14-denies-fever',
    title: 'Fever denied and jaundice negative',
    track: 'safety',
    source: `# Synthetic discharge summary, case 14

Hospital: Silver Oak Hospital, Mysuru
Patient: SYNTHETIC-14
Admission: 2026-08-14 10:00 · Discharge: 2026-08-16 16:00

Diagnosis: Acute gastritis.
History: The patient denies fever. Negative for jaundice.
Procedure: Conservative care. No operation.
Course: Tolerated food before discharge.
Room: Twin sharing room, ₹3,800/day, 2 nights.
Bill: Room rent ₹7,600; nursing ₹5,000; practitioners fees ₹8,000; diagnostics ₹9,500; pharmacy ₹12,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Acute gastritis',
      'The patient denies fever',
      'Negative for jaundice',
    ],
    bills: [
      line('room_rent', 'Room rent', 7600),
      line('nursing', 'Nursing charges', 5000),
      line('practitioners_fees', 'Practitioners fees', 8000),
      line('diagnostics', 'Diagnostics', 9500),
      line('pharmacy_consumables', 'Pharmacy', 12000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 3800, nights: 2 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'The patient denies fever.',
      jaundiceNegation: 'Negative for jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-15-handwritten-diabetes',
    title: 'Handwritten diabetes chronicity note',
    track: 'safety',
    source: `# Synthetic discharge summary, case 15

Hospital: Crescent Hill Hospital, Bengaluru
Patient: SYNTHETIC-15
Admission: 2026-08-15 09:15 · Discharge: 2026-08-18 13:00

Diagnosis: Infected diabetic foot ulcer.
History: No history of fever or jaundice. A handwritten margin note says: "k/c/o DM since 8 years."
Procedure: Debridement under regional anaesthesia.
Course: Wound packed. Walking with a walker at discharge.
Room: General ward, ₹2,600/day, 3 nights.
Bill: Room rent ₹7,800; nursing ₹8,500; surgeon fees ₹18,000; OT ₹11,000; pharmacy ₹24,000; diagnostics ₹7,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Infected diabetic foot ulcer',
      'No history of fever or jaundice',
      'k/c/o DM since 8 years',
    ],
    bills: [
      line('room_rent', 'Room rent', 7800),
      line('nursing', 'Nursing charges', 8500),
      line('practitioners_fees', 'Surgeon fees', 18000),
      line('operation_theatre', 'OT charges', 11000),
      line('pharmacy_consumables', 'Pharmacy', 24000),
      line('diagnostics', 'Diagnostics', 7000),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 2600, nights: 3 },
    missing: ['Indoor case papers'],
    ped: ['k/c/o DM since 8 years'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-16-handwritten-wound',
    title: 'Handwritten wound status note',
    track: 'safety',
    source: `# Synthetic discharge summary, case 16

Hospital: Greenfield Hospital, Bengaluru
Patient: SYNTHETIC-16
Admission: 2026-08-16 08:45 · Discharge: 2026-08-19 12:30

Diagnosis: Closed fracture of the right radius.
History: No fever or jaundice.
Procedure: Open reduction and internal fixation of the radius under regional anaesthesia.
Handwritten note: "Wound dry at discharge."
Course: Fingers warm and moving.
Room: Twin sharing room, ₹4,200/day, 3 nights.
Bill: Room rent ₹12,600; nursing ₹7,500; surgeon fees ₹26,000; OT ₹19,000; pharmacy ₹17,000; diagnostics ₹8,000.
Missing at discharge: Indoor case papers; fully itemised bill.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Closed fracture of the right radius',
      'No fever or jaundice',
      'Wound dry at discharge',
    ],
    bills: [
      line('room_rent', 'Room rent', 12600),
      line('nursing', 'Nursing charges', 7500),
      line('practitioners_fees', 'Surgeon fees', 26000),
      line('operation_theatre', 'OT charges', 19000),
      line('pharmacy_consumables', 'Pharmacy', 17000),
      line('diagnostics', 'Diagnostics', 8000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 4200, nights: 3 },
    missing: ['Indoor case papers', 'Fully itemised bill'],
    guard: guards({
      feverNegation: 'No fever or jaundice.',
      jaundiceNegation: 'No fever or jaundice.',
    }),
    resolution: indoorFix(['Indoor case papers', 'Fully itemised bill']),
  }),
  pack({
    id: 'case-17-unreadable-operative',
    title: 'Unreadable operative findings',
    track: 'safety',
    source: `# Synthetic discharge summary, case 17

Hospital: Ivory Court Hospital, Bengaluru
Patient: SYNTHETIC-17
Admission: 2026-08-17 06:30 · Discharge: 2026-08-19 11:00

Diagnosis: Torn meniscus of the left knee.
History: No history of fever or jaundice.
Procedure: Knee arthroscopy. [UNREADABLE SECTION: operative findings]
Course: Mobilised with a stick.
Room: Twin sharing room, ₹4,400/day, 2 nights.
Bill: Room rent ₹8,800; nursing ₹6,500; surgeon fees ₹28,000; OT ₹21,000; diagnostics ₹10,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.
Confidence: low because the operative findings section is unreadable.`,
    statements: ['Torn meniscus of the left knee', 'No history of fever or jaundice'],
    bills: [
      line('room_rent', 'Room rent', 8800),
      line('nursing', 'Nursing charges', 6500),
      line('practitioners_fees', 'Surgeon fees', 28000),
      line('operation_theatre', 'OT charges', 21000),
      line('diagnostics', 'Diagnostics', 10000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 4400, nights: 2 },
    missing: ['Indoor case papers'],
    confidence: 'low',
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-18-unreadable-course',
    title: 'Unreadable nursing course',
    track: 'safety',
    source: `# Synthetic discharge summary, case 18

Hospital: Pinecrest Hospital, Bengaluru
Patient: SYNTHETIC-18
Admission: 2026-08-18 07:00 · Discharge: 2026-08-20 15:00

Diagnosis: Small bowel obstruction.
History: No history of fever or jaundice.
Procedure: Laparoscopic bowel surgery.
Course: [UNREADABLE SECTION: nursing notes] The last line is blurred.
Room: Single private room, ₹6,200/day, 2 nights.
Bill: Room rent ₹12,400; nursing ₹8,000; surgeon fees ₹30,000; OT ₹22,000; diagnostics ₹13,000; pharmacy ₹18,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.
Confidence: low because the nursing course is unreadable.`,
    statements: ['Small bowel obstruction', 'No history of fever or jaundice', 'Laparoscopic bowel surgery'],
    bills: [
      line('room_rent', 'Room rent', 12400),
      line('nursing', 'Nursing charges', 8000),
      line('practitioners_fees', 'Surgeon fees', 30000),
      line('operation_theatre', 'OT charges', 22000),
      line('diagnostics', 'Diagnostics', 13000),
      line('pharmacy_consumables', 'Pharmacy', 18000),
    ],
    room: { category_as_billed: 'Single private room', rate_per_day: 6200, nights: 2 },
    missing: ['Indoor case papers'],
    confidence: 'low',
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-19-affirmed-fever-negated-diarrhoea',
    title: 'Affirmed fever, diarrhoea negated',
    track: 'safety',
    source: `# Synthetic discharge summary, case 19

Hospital: Redwood Hospital, Bengaluru
Patient: SYNTHETIC-19
Admission: 2026-08-19 08:00 · Discharge: 2026-08-22 14:00

Diagnosis: Acute cholecystitis.
History: Fever 39 C at admission. No diarrhoea. No history of jaundice.
Procedure: Laparoscopic cholecystectomy under GA.
Course: Fever settled after treatment. Stable at discharge.
Room: Single private room, ₹7,200/day, 3 nights.
Bill: Room rent ₹21,600; nursing ₹10,500; surgeon fees ₹23,000; OT ₹16,000; pharmacy ₹26,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Acute cholecystitis',
      'Fever 39 C at admission',
      'No diarrhoea',
      'Laparoscopic cholecystectomy under GA',
    ],
    bills: [
      line('room_rent', 'Room rent', 21600),
      line('nursing', 'Nursing charges', 10500),
      line('practitioners_fees', 'Surgeon fees', 23000),
      line('operation_theatre', 'OT charges', 16000),
      line('pharmacy_consumables', 'Pharmacy', 26000),
    ],
    room: { category_as_billed: 'Single private room', rate_per_day: 7200, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      fever: true,
      jaundiceNegation: 'No history of jaundice.',
      cholecystectomy: true,
      extra: [{ candidate: 'Patient had diarrhoea.', allowed: false, negation: 'No diarrhoea.' }],
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-20-iv-affirmed-perforation-negated',
    title: 'IV antibiotics affirmed, perforation negated',
    track: 'safety',
    source: `# Synthetic discharge summary, case 20

Hospital: Southbank Hospital, Bengaluru
Patient: SYNTHETIC-20
Admission: 2026-08-20 06:45 · Discharge: 2026-08-23 11:30

Diagnosis: Acute appendicitis.
History: No history of fever or jaundice.
Procedure: Open appendectomy under GA.
Treatment: IV antibiotics were started. No perforation on the operative note.
Course: Tolerated food on the second day.
Room: Twin sharing room, ₹4,100/day, 3 nights.
Bill: Room rent ₹12,300; nursing ₹9,000; surgeon fees ₹18,000; OT ₹14,000; pharmacy ₹22,000; diagnostics ₹5,500.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Acute appendicitis',
      'No history of fever or jaundice',
      'IV antibiotics were started',
      'No perforation on the operative note',
    ],
    bills: [
      line('room_rent', 'Room rent', 12300),
      line('nursing', 'Nursing charges', 9000),
      line('practitioners_fees', 'Surgeon fees', 18000),
      line('operation_theatre', 'OT charges', 14000),
      line('pharmacy_consumables', 'Pharmacy', 22000),
      line('diagnostics', 'Diagnostics', 5500),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 4100, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
      iv: true,
      extra: [
        {
          candidate: 'There was a perforation.',
          allowed: false,
          negation: 'No perforation on the operative note.',
        },
      ],
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-21-hypertension-negation',
    title: 'Hypertension is explicitly negated',
    track: 'safety',
    source: `# Synthetic discharge summary, case 21

Hospital: Hilltop Hospital, Bengaluru
Patient: SYNTHETIC-21
Admission: 2026-08-21 09:00 · Discharge: 2026-08-24 10:00

Diagnosis: Right inguinal hernia.
History: No history of hypertension. No history of fever.
Procedure: Open hernia repair with mesh.
Course: Mobilised on the evening of surgery.
Room: General ward, ₹2,400/day, 3 nights.
Bill: Room rent ₹7,200; nursing ₹6,000; surgeon fees ₹19,000; OT ₹15,000; implants and mesh ₹22,000; pharmacy ₹14,000.
Missing at discharge: Indoor case papers; implant invoice and sticker.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Right inguinal hernia',
      'No history of hypertension',
      'Open hernia repair with mesh',
    ],
    bills: [
      line('room_rent', 'Room rent', 7200),
      line('nursing', 'Nursing charges', 6000),
      line('practitioners_fees', 'Surgeon fees', 19000),
      line('operation_theatre', 'OT charges', 15000),
      line('implants_devices', 'Implants and mesh', 22000),
      line('pharmacy_consumables', 'Pharmacy', 14000),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 2400, nights: 3 },
    missing: ['Indoor case papers', 'Implant invoice and sticker'],
    guard: guards({
      feverNegation: 'No history of fever.',
      extra: [
        {
          candidate: 'The patient has hypertension.',
          allowed: false,
          negation: 'No history of hypertension.',
        },
      ],
    }),
    resolution: indoorFix(['Indoor case papers', 'Implant invoice and sticker']),
  }),
  pack({
    id: 'case-22-pneumonia-negative',
    title: 'Chest film negative for pneumonia',
    track: 'safety',
    source: `# Synthetic discharge summary, case 22

Hospital: Orchid Lane Hospital, Bengaluru
Patient: SYNTHETIC-22
Admission: 2026-08-22 11:00 · Discharge: 2026-08-24 17:00

Diagnosis: Viral bronchitis.
History: The chest film was negative for pneumonia. No history of fever.
Procedure: Conservative care. No operation.
Course: Breathing easier. Discharged on oral medicines.
Room: Twin sharing room, ₹3,900/day, 2 nights.
Bill: Room rent ₹7,800; nursing ₹5,500; practitioners fees ₹9,000; diagnostics ₹12,000; pharmacy ₹11,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Viral bronchitis',
      'The chest film was negative for pneumonia',
      'No history of fever',
    ],
    bills: [
      line('room_rent', 'Room rent', 7800),
      line('nursing', 'Nursing charges', 5500),
      line('practitioners_fees', 'Practitioners fees', 9000),
      line('diagnostics', 'Diagnostics', 12000),
      line('pharmacy_consumables', 'Pharmacy', 11000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 3900, nights: 2 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever.',
      extra: [
        {
          candidate: 'Patient had pneumonia.',
          allowed: false,
          negation: 'The chest film was negative for pneumonia.',
        },
      ],
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-23-room-10000',
    title: 'Deluxe room at ₹10,000 a day',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 23

Hospital: Summit Care Hospital, Bengaluru
Patient: SYNTHETIC-23
Admission: 2026-08-23 07:00 · Discharge: 2026-08-26 12:00

Diagnosis: Incisional hernia.
History: No history of fever or jaundice.
Procedure: Laparoscopic hernia repair.
Course: Wound clean. Discharged walking.
Room: Deluxe single room, ₹10,000/day, 3 nights.
Bill: Room rent ₹30,000; nursing ₹12,000; surgeon fees ₹28,000; OT ₹20,000; diagnostics ₹8,000; pharmacy ₹16,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: ['Incisional hernia', 'No history of fever or jaundice', 'Laparoscopic hernia repair'],
    bills: [
      line('room_rent', 'Room rent', 30000),
      line('nursing', 'Nursing charges', 12000),
      line('practitioners_fees', 'Surgeon fees', 28000),
      line('operation_theatre', 'OT charges', 20000),
      line('diagnostics', 'Diagnostics', 8000),
      line('pharmacy_consumables', 'Pharmacy', 16000),
    ],
    room: { category_as_billed: 'Deluxe single room', rate_per_day: 10000, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-24-room-8000-four-nights',
    title: 'Room at ₹8,000 for four nights',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 24

Hospital: Lakewood Hospital, Bengaluru
Patient: SYNTHETIC-24
Admission: 2026-08-24 08:00 · Discharge: 2026-08-28 11:00

Diagnosis: Right ovarian cyst.
History: No history of fever or jaundice.
Procedure: Laparoscopic cystectomy under GA.
Course: Pain controlled. Discharged on oral food.
Room: Deluxe single room, ₹8,000/day, 4 nights.
Bill: Room rent ₹32,000; nursing ₹14,000; surgeon fees ₹32,000; OT ₹24,000; diagnostics ₹9,000; pharmacy ₹18,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: ['Right ovarian cyst', 'No history of fever or jaundice', 'Laparoscopic cystectomy under GA'],
    bills: [
      line('room_rent', 'Room rent', 32000),
      line('nursing', 'Nursing charges', 14000),
      line('practitioners_fees', 'Surgeon fees', 32000),
      line('operation_theatre', 'OT charges', 24000),
      line('diagnostics', 'Diagnostics', 9000),
      line('pharmacy_consumables', 'Pharmacy', 18000),
    ],
    room: { category_as_billed: 'Deluxe single room', rate_per_day: 8000, nights: 4 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-25-room-just-over',
    title: 'Room just above the eligible rate',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 25

Hospital: Banyan Hospital, Bengaluru
Patient: SYNTHETIC-25
Admission: 2026-08-25 09:00 · Discharge: 2026-08-27 14:00

Diagnosis: Fibroid uterus.
History: No history of fever or jaundice.
Procedure: Open myomectomy under GA.
Course: Walking on the first post-operative day.
Room: Single private room, ₹5,500/day, 2 nights.
Bill: Room rent ₹11,000; nursing ₹7,000; surgeon fees ₹26,000; OT ₹18,000; diagnostics ₹6,000; pharmacy ₹15,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: ['Fibroid uterus', 'No history of fever or jaundice', 'Open myomectomy under GA'],
    bills: [
      line('room_rent', 'Room rent', 11000),
      line('nursing', 'Nursing charges', 7000),
      line('practitioners_fees', 'Surgeon fees', 26000),
      line('operation_theatre', 'OT charges', 18000),
      line('diagnostics', 'Diagnostics', 6000),
      line('pharmacy_consumables', 'Pharmacy', 15000),
    ],
    room: { category_as_billed: 'Single private room', rate_per_day: 5500, nights: 2 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-26-gloves-ppe-syringes',
    title: 'Large gloves, PPE, and syringes line',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 26

Hospital: Copperfield Hospital, Bengaluru
Patient: SYNTHETIC-26
Admission: 2026-08-26 07:30 · Discharge: 2026-08-29 10:00

Diagnosis: Acute appendicitis.
History: No history of fever or jaundice.
Procedure: Open appendectomy under GA.
Course: No complication recorded.
Room: Single private room, ₹6,000/day, 3 nights.
Bill: Room rent ₹18,000; nursing ₹11,000; surgeon fees ₹19,000; OT ₹13,000; gloves, PPE kit and syringes ₹12,000; pharmacy ₹21,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: ['Acute appendicitis', 'No history of fever or jaundice', 'Open appendectomy under GA'],
    bills: [
      line('room_rent', 'Room rent', 18000),
      line('nursing', 'Nursing charges', 11000),
      line('practitioners_fees', 'Surgeon fees', 19000),
      line('operation_theatre', 'OT charges', 13000),
      line('non_payable_consumables', 'Gloves, PPE kit and syringes', 12000),
      line('pharmacy_consumables', 'Pharmacy', 21000),
    ],
    room: { category_as_billed: 'Single private room', rate_per_day: 6000, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-27-mask-sanitizer',
    title: 'Face mask and sanitizer line',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 27

Hospital: Westend Hospital, Bengaluru
Patient: SYNTHETIC-27
Admission: 2026-08-27 08:20 · Discharge: 2026-08-30 12:00

Diagnosis: Symptomatic gallstones.
History: No history of fever or jaundice.
Procedure: Laparoscopic cholecystectomy under GA.
Course: Oral intake on POD-1.
Room: Twin sharing room, ₹4,500/day, 3 nights.
Bill: Room rent ₹13,500; nursing ₹8,000; surgeon fees ₹20,000; OT ₹15,000; face mask and sanitizer ₹4,500; pharmacy ₹17,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Symptomatic gallstones',
      'No history of fever or jaundice',
      'Laparoscopic cholecystectomy under GA',
    ],
    bills: [
      line('room_rent', 'Room rent', 13500),
      line('nursing', 'Nursing charges', 8000),
      line('practitioners_fees', 'Surgeon fees', 20000),
      line('operation_theatre', 'OT charges', 15000),
      line('non_payable_consumables', 'Face mask and sanitizer', 4500),
      line('pharmacy_consumables', 'Pharmacy', 17000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 4500, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
      cholecystectomy: true,
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-28-cotton-bandage',
    title: 'Cotton and bandage roll line',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 28

Hospital: Ashoka Hospital, Bengaluru
Patient: SYNTHETIC-28
Admission: 2026-08-28 10:00 · Discharge: 2026-08-31 09:00

Diagnosis: Abscess of the back.
History: No history of fever or jaundice.
Procedure: Drainage of a back abscess.
Course: Packing reduced. Discharged walking.
Room: General ward, ₹2,200/day, 3 nights.
Bill: Room rent ₹6,600; nursing ₹5,500; surgeon fees ₹12,000; OT ₹8,000; cotton and bandage roll ₹2,800; pharmacy ₹9,500.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: ['Abscess of the back', 'No history of fever or jaundice', 'Drainage of a back abscess'],
    bills: [
      line('room_rent', 'Room rent', 6600),
      line('nursing', 'Nursing charges', 5500),
      line('practitioners_fees', 'Surgeon fees', 12000),
      line('operation_theatre', 'OT charges', 8000),
      line('non_payable_consumables', 'Cotton and bandage roll', 2800),
      line('pharmacy_consumables', 'Pharmacy', 9500),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 2200, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-29-day-care-six-hours',
    title: 'Six-hour day-care stay',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 29

Hospital: Daylight Hospital, Bengaluru
Patient: SYNTHETIC-29
Admission: 2026-08-29 08:00 · Discharge: 2026-08-29 14:00

Diagnosis: Bartholin cyst.
Treatment: IV antibiotics started in recovery. No history of jaundice.
Procedure: Drainage of a Bartholin cyst.
Course: Observed for six hours and discharged stable.
Room: Day-care bay, ₹0/day, 0 nights.
Bill: Nursing ₹3,500; surgeon fees ₹10,000; OT ₹6,000; gloves and PPE ₹2,500; pharmacy ₹7,500.
Missing at discharge: Fully itemised bill.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Bartholin cyst',
      'No history of jaundice',
      'IV antibiotics started in recovery',
      'Drainage of a Bartholin cyst',
    ],
    bills: [
      line('nursing', 'Nursing charges', 3500),
      line('practitioners_fees', 'Surgeon fees', 10000),
      line('operation_theatre', 'OT charges', 6000),
      line('non_payable_consumables', 'Gloves and PPE', 2500),
      line('pharmacy_consumables', 'Pharmacy', 7500),
    ],
    room: { category_as_billed: 'Day-care bay', rate_per_day: 0, nights: 0 },
    missing: ['Fully itemised bill'],
    guard: guards({
      jaundiceNegation: 'No history of jaundice.',
      iv: true,
    }),
    resolution: admissionFix(['Fully itemised bill']),
  }),
  pack({
    id: 'case-30-fourteen-hour-stay',
    title: 'Fourteen-hour observation stay',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 30

Hospital: Transit Care Hospital, Bengaluru
Patient: SYNTHETIC-30
Admission: 2026-08-30 07:00 · Discharge: 2026-08-30 21:00

Diagnosis: Allergic reaction after a bee sting.
History: No history of fever or jaundice.
Procedure: Observation only. No operation.
Course: Observed for fourteen hours and discharged stable.
Room: Day-care bay, ₹0/day, 0 nights.
Bill: Nursing ₹4,200; practitioners fees ₹7,000; diagnostics ₹6,500; gloves and PPE ₹1,800; pharmacy ₹8,000.
Missing at discharge: Fully itemised bill.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Allergic reaction after a bee sting',
      'No history of fever or jaundice',
      'Observed for fourteen hours and discharged stable',
    ],
    bills: [
      line('nursing', 'Nursing charges', 4200),
      line('practitioners_fees', 'Practitioners fees', 7000),
      line('diagnostics', 'Diagnostics', 6500),
      line('non_payable_consumables', 'Gloves and PPE', 1800),
      line('pharmacy_consumables', 'Pharmacy', 8000),
    ],
    room: { category_as_billed: 'Day-care bay', rate_per_day: 0, nights: 0 },
    missing: ['Fully itemised bill'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: admissionFix(['Fully itemised bill']),
  }),
  pack({
    id: 'case-31-ward-under-limit-consumables',
    title: 'Ward under the room cap with consumables',
    track: 'deterministic',
    source: `# Synthetic discharge summary, case 31

Hospital: Lotus Ward Hospital, Bengaluru
Patient: SYNTHETIC-31
Admission: 2026-08-31 09:00 · Discharge: 2026-09-03 11:00

Diagnosis: Lipoma of the shoulder.
History: No history of fever or jaundice.
Procedure: Excision of a shoulder lipoma under local anaesthesia.
Course: Wound dry. Discharged walking.
Room: General ward, ₹2,000/day, 3 nights.
Bill: Room rent ₹6,000; nursing ₹4,500; surgeon fees ₹11,000; OT ₹7,000; gloves and syringes ₹6,000; pharmacy ₹8,500.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Lipoma of the shoulder',
      'No history of fever or jaundice',
      'Excision of a shoulder lipoma under local anaesthesia',
    ],
    bills: [
      line('room_rent', 'Room rent', 6000),
      line('nursing', 'Nursing charges', 4500),
      line('practitioners_fees', 'Surgeon fees', 11000),
      line('operation_theatre', 'OT charges', 7000),
      line('non_payable_consumables', 'Gloves and syringes', 6000),
      line('pharmacy_consumables', 'Pharmacy', 8500),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 2000, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-32-missing-indoor-cholecystectomy',
    title: 'Missing indoor papers after cholecystectomy',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 32

Hospital: Meadow Hospital, Bengaluru
Patient: SYNTHETIC-32
Admission: 2026-09-01 08:00 · Discharge: 2026-09-04 12:00

Diagnosis: Symptomatic gallstones.
History: No history of fever. Pain improved after surgery.
Procedure: Laparoscopic cholecystectomy under GA.
Course: Mobilised on the first post-operative day.
Room: General ward, ₹2,700/day, 3 nights.
Bill: Room rent ₹8,100; nursing ₹6,500; surgeon fees ₹21,000; OT ₹16,000; pharmacy ₹19,000; diagnostics ₹7,500.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Symptomatic gallstones',
      'No history of fever',
      'Laparoscopic cholecystectomy under GA',
    ],
    bills: [
      line('room_rent', 'Room rent', 8100),
      line('nursing', 'Nursing charges', 6500),
      line('practitioners_fees', 'Surgeon fees', 21000),
      line('operation_theatre', 'OT charges', 16000),
      line('pharmacy_consumables', 'Pharmacy', 19000),
      line('diagnostics', 'Diagnostics', 7500),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 2700, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever.',
      cholecystectomy: true,
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-33-indoor-and-knee-implant',
    title: 'Missing indoor papers and knee implant records',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 33

Hospital: Ironbridge Hospital, Bengaluru
Patient: SYNTHETIC-33
Admission: 2026-09-02 07:00 · Discharge: 2026-09-06 13:00

Diagnosis: Osteoarthritis of the right knee.
History: No history of fever or jaundice.
Procedure: Total knee replacement.
Implant: Cobalt chrome knee, batch KN-033.
Course: Walking with a walker. Neurovascular status intact.
Room: General ward, ₹3,200/day, 4 nights.
Bill: Room rent ₹12,800; nursing ₹12,000; surgeon fees ₹40,000; OT ₹28,000; cobalt-chrome TKR ₹90,000; pharmacy ₹22,000.
Missing at discharge: Indoor case papers; implant invoice and sticker.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Osteoarthritis of the right knee',
      'No history of fever or jaundice',
      'Total knee replacement',
      'Cobalt chrome knee, batch KN-033',
    ],
    bills: [
      line('room_rent', 'Room rent', 12800),
      line('nursing', 'Nursing charges', 12000),
      line('practitioners_fees', 'Surgeon fees', 40000),
      line('operation_theatre', 'OT charges', 28000),
      line('implants_devices', 'cobalt-chrome TKR', 90000),
      line('pharmacy_consumables', 'Pharmacy', 22000),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 3200, nights: 4 },
    missing: ['Indoor case papers', 'Implant invoice and sticker'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(['Indoor case papers', 'Implant invoice and sticker']),
  }),
  pack({
    id: 'case-34-mixed-fix-admission',
    title: 'Mixed gaps, doctor sentence is the one fix',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 34

Hospital: Coral Hospital, Bengaluru
Patient: SYNTHETIC-34
Admission: 2026-09-03 06:00 · Discharge: 2026-09-07 15:00

Diagnosis: Diverticulitis of the colon.
History: No fever at discharge. No history of jaundice.
Procedure: Laparoscopic bowel surgery.
Course: Drain removed before discharge.
Room: Deluxe single room, ₹8,200/day, 4 nights.
Bill: Room rent ₹32,800; nursing ₹16,000; surgeon fees ₹38,000; OT ₹29,000; diagnostics ₹19,000; pharmacy ₹44,000.
Missing at discharge: Indoor case papers; fully itemised bill.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Diverticulitis of the colon',
      'No fever at discharge',
      'No history of jaundice',
      'Laparoscopic bowel surgery',
    ],
    bills: [
      line('room_rent', 'Room rent', 32800),
      line('nursing', 'Nursing charges', 16000),
      line('practitioners_fees', 'Surgeon fees', 38000),
      line('operation_theatre', 'OT charges', 29000),
      line('diagnostics', 'Diagnostics', 19000),
      line('pharmacy_consumables', 'Pharmacy', 44000),
    ],
    room: { category_as_billed: 'Deluxe single room', rate_per_day: 8200, nights: 4 },
    missing: ['Indoor case papers', 'Fully itemised bill'],
    guard: guards({
      jaundiceNegation: 'No history of jaundice.',
    }),
    resolution: admissionFix(['Indoor case papers', 'Fully itemised bill']),
  }),
  pack({
    id: 'case-35-missing-indoor-appendectomy',
    title: 'Missing indoor papers after appendectomy',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 35

Hospital: Pearl Hospital, Mysuru
Patient: SYNTHETIC-35
Admission: 2026-09-04 09:30 · Discharge: 2026-09-07 10:00

Diagnosis: Acute appendicitis.
History: No history of fever. Pain improved after surgery.
Procedure: Laparoscopic appendectomy.
Course: Mobilised on the first post-operative day.
Room: Twin sharing room, ₹4,300/day, 3 nights.
Bill: Room rent ₹12,900; nursing ₹8,000; surgeon fees ₹17,000; OT ₹13,000; pharmacy ₹16,000; diagnostics ₹6,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Acute appendicitis',
      'No history of fever',
      'Laparoscopic appendectomy',
    ],
    bills: [
      line('room_rent', 'Room rent', 12900),
      line('nursing', 'Nursing charges', 8000),
      line('practitioners_fees', 'Surgeon fees', 17000),
      line('operation_theatre', 'OT charges', 13000),
      line('pharmacy_consumables', 'Pharmacy', 16000),
      line('diagnostics', 'Diagnostics', 6000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 4300, nights: 3 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever.',
    }),
    resolution: indoorFix(),
  }),
  pack({
    id: 'case-36-mixed-peritonitis-iv',
    title: 'Peritonitis with IV antibiotics and missing indoor papers',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 36

Hospital: Cascade Hospital, Bengaluru
Patient: SYNTHETIC-36
Admission: 2026-09-05 05:30 · Discharge: 2026-09-09 16:00

Diagnosis: Peritonitis after bowel perforation.
Treatment: IV antibiotics continued for 72 hours. No fever at discharge. No history of jaundice.
Procedure: Laparoscopic bowel surgery.
Course: Drain removed before discharge.
Room: Deluxe single room, ₹9,200/day, 4 nights.
Bill: Room rent ₹36,800; nursing ₹18,000; surgeon fees ₹42,000; OT ₹31,000; diagnostics ₹21,000; pharmacy ₹52,000.
Missing at discharge: Indoor case papers; fully itemised bill.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Peritonitis after bowel perforation',
      'IV antibiotics continued for 72 hours',
      'No fever at discharge',
      'No history of jaundice',
    ],
    bills: [
      line('room_rent', 'Room rent', 36800),
      line('nursing', 'Nursing charges', 18000),
      line('practitioners_fees', 'Surgeon fees', 42000),
      line('operation_theatre', 'OT charges', 31000),
      line('diagnostics', 'Diagnostics', 21000),
      line('pharmacy_consumables', 'Pharmacy', 52000),
    ],
    room: { category_as_billed: 'Deluxe single room', rate_per_day: 9200, nights: 4 },
    missing: ['Indoor case papers', 'Fully itemised bill'],
    guard: guards({
      jaundiceNegation: 'No history of jaundice.',
      iv: true,
    }),
    resolution: indoorFix(['Indoor case papers', 'Fully itemised bill']),
  }),
  pack({
    id: 'case-37-hip-implant-indoor',
    title: 'Hip implant invoice and indoor papers missing',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 37

Hospital: Ridgeway Hospital, Bengaluru
Patient: SYNTHETIC-37
Admission: 2026-09-06 06:00 · Discharge: 2026-09-11 12:00

Diagnosis: Fracture of the left neck of femur.
History: No history of fever or jaundice.
Procedure: Bipolar hip replacement under spinal anaesthesia.
Implant: Bipolar hip prosthesis, batch HP-037.
Course: Sitting out of bed on day two.
Room: General ward, ₹3,100/day, 5 nights.
Bill: Room rent ₹15,500; nursing ₹14,000; surgeon fees ₹45,000; OT ₹30,000; hip implant ₹1,20,000; pharmacy ₹25,000.
Missing at discharge: Indoor case papers; implant invoice and sticker.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Fracture of the left neck of femur',
      'No history of fever or jaundice',
      'Bipolar hip replacement under spinal anaesthesia',
      'Bipolar hip prosthesis, batch HP-037',
    ],
    bills: [
      line('room_rent', 'Room rent', 15500),
      line('nursing', 'Nursing charges', 14000),
      line('practitioners_fees', 'Surgeon fees', 45000),
      line('operation_theatre', 'OT charges', 30000),
      line('implants_devices', 'Hip implant', 120000),
      line('pharmacy_consumables', 'Pharmacy', 25000),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 3100, nights: 5 },
    missing: ['Indoor case papers', 'Implant invoice and sticker'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: indoorFix(['Indoor case papers', 'Implant invoice and sticker']),
  }),
  pack({
    id: 'case-38-fix-admission-sentence',
    title: 'Doctor sentence is the only counter action',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 38

Hospital: Cottonwood Hospital, Bengaluru
Patient: SYNTHETIC-38
Admission: 2026-09-07 10:00 · Discharge: 2026-09-09 18:00

Diagnosis: Unstable angina under evaluation.
History: No history of fever or jaundice.
Procedure: Observation and medicines. No operation.
Course: Chest pain settled. Walking at discharge.
Room: Twin sharing room, ₹4,600/day, 2 nights.
Bill: Room rent ₹9,200; nursing ₹7,000; practitioners fees ₹15,000; diagnostics ₹40,000; pharmacy ₹60,000.
Missing at discharge: Indoor case papers.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Unstable angina under evaluation',
      'No history of fever or jaundice',
      'Chest pain settled',
    ],
    bills: [
      line('room_rent', 'Room rent', 9200),
      line('nursing', 'Nursing charges', 7000),
      line('practitioners_fees', 'Practitioners fees', 15000),
      line('diagnostics', 'Diagnostics', 40000),
      line('pharmacy_consumables', 'Pharmacy', 60000),
    ],
    room: { category_as_billed: 'Twin sharing room', rate_per_day: 4600, nights: 2 },
    missing: ['Indoor case papers'],
    guard: guards({
      feverNegation: 'No history of fever or jaundice.',
      jaundiceNegation: 'No history of fever or jaundice.',
    }),
    resolution: admissionFix(['Indoor case papers']),
  }),
  pack({
    id: 'case-39-indoor-and-itemised',
    title: 'Indoor papers and itemised bill both missing',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 39

Hospital: Fairview Hospital, Bengaluru
Patient: SYNTHETIC-39
Admission: 2026-09-08 08:15 · Discharge: 2026-09-11 11:00

Diagnosis: Left inguinal hernia.
History: No history of fever. Pain improved after surgery.
Procedure: Laparoscopic hernia repair with mesh.
Course: Mobilised on the first post-operative day.
Room: General ward, ₹2,900/day, 3 nights.
Bill: Room rent ₹8,700; nursing ₹6,800; surgeon fees ₹20,000; OT ₹15,500; implants and mesh ₹26,000; pharmacy ₹17,000.
Missing at discharge: Indoor case papers; fully itemised bill.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Left inguinal hernia',
      'No history of fever',
      'Laparoscopic hernia repair with mesh',
    ],
    bills: [
      line('room_rent', 'Room rent', 8700),
      line('nursing', 'Nursing charges', 6800),
      line('practitioners_fees', 'Surgeon fees', 20000),
      line('operation_theatre', 'OT charges', 15500),
      line('implants_devices', 'Implants and mesh', 26000),
      line('pharmacy_consumables', 'Pharmacy', 17000),
    ],
    room: { category_as_billed: 'General ward', rate_per_day: 2900, nights: 3 },
    missing: ['Indoor case papers', 'Fully itemised bill'],
    guard: guards({
      feverNegation: 'No history of fever.',
    }),
    resolution: indoorFix(['Indoor case papers', 'Fully itemised bill']),
  }),
  pack({
    id: 'case-40-mixed-room-consumables-indoor',
    title: 'Mixed room, consumables, handwritten note, and indoor gap',
    track: 'workflow',
    source: `# Synthetic discharge summary, case 40

Hospital: Mixed Oaks Hospital, Bengaluru
Patient: SYNTHETIC-40
Admission: 2026-09-09 06:00 · Discharge: 2026-09-13 16:00

Diagnosis: Peritonitis after bowel perforation.
Treatment: IV antibiotics continued for 48 hours. No fever at discharge. No history of jaundice.
Procedure: Laparoscopic bowel surgery.
Handwritten note: "Review drain in 5 days."
Course: Drain removed before discharge.
Room: Deluxe single room, ₹9,500/day, 4 nights.
Bill: Room rent ₹38,000; nursing ₹17,000; surgeon fees ₹40,000; OT ₹30,000; gloves and PPE ₹7,000; pharmacy ₹48,000.
Missing at discharge: Indoor case papers; fully itemised bill.
Question for doctor: Why inpatient admission was required.`,
    statements: [
      'Peritonitis after bowel perforation',
      'IV antibiotics continued for 48 hours',
      'No fever at discharge',
      'No history of jaundice',
      'Review drain in 5 days',
    ],
    bills: [
      line('room_rent', 'Room rent', 38000),
      line('nursing', 'Nursing charges', 17000),
      line('practitioners_fees', 'Surgeon fees', 40000),
      line('operation_theatre', 'OT charges', 30000),
      line('non_payable_consumables', 'Gloves and PPE', 7000),
      line('pharmacy_consumables', 'Pharmacy', 48000),
    ],
    room: { category_as_billed: 'Deluxe single room', rate_per_day: 9500, nights: 4 },
    missing: ['Indoor case papers', 'Fully itemised bill'],
    guard: guards({
      jaundiceNegation: 'No history of jaundice.',
      iv: true,
    }),
    resolution: indoorFix(['Indoor case papers', 'Fully itemised bill']),
  }),
];

const PRINTABLE_CSS = `@page { size: A4; margin: 16mm; }
:root { color-scheme: light; }
body { margin: 0; color: #1b1d21; background: #fff; font: 13px/1.45 Arial, sans-serif; }
.page { min-height: 257mm; border: 1px solid #d5d9df; padding: 14mm; box-sizing: border-box; }
.eyebrow { color: #9a2028; font: 700 10px/1.2 monospace; letter-spacing: .16em; text-transform: uppercase; }
h1 { margin: 8px 0 18px; font: 700 22px/1.15 Georgia, serif; }
h2 { margin: 15px 0 3px; font: 700 12px/1.2 monospace; letter-spacing: .08em; text-transform: uppercase; }
p { margin: 3px 0; }
.handwritten { font-family: "Comic Sans MS", cursive; color: #204a87; transform: rotate(-.5deg); }
.unreadable { color: #777; background: #eee; letter-spacing: .18em; }
.footer { margin-top: 22px; border-top: 1px solid #ddd; padding-top: 6px; color: #777; font: 10px monospace; }`;

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function printableHtml(entry) {
  const bodyLines = entry.source
    .split('\n')
    .filter((line) => !line.startsWith('# ') && line.trim() !== '');
  const paragraphs = [];
  let headerCount = 0;
  for (const raw of bodyLines) {
    const text = escapeHtml(raw);
    const isHeader =
      headerCount < 3 && /^(Hospital|Patient|Admission):/.test(raw);
    if (isHeader) {
      paragraphs.push(`<p><strong>${text}</strong></p>`);
      headerCount += 1;
      if (headerCount === 3) paragraphs.push('<p>&nbsp;</p>');
      continue;
    }
    const cls = /handwritten/i.test(raw)
      ? 'handwritten'
      : /UNREADABLE|unreadable|blurred/i.test(raw)
        ? 'unreadable'
        : '';
    paragraphs.push(cls ? `<p class="${cls}">${text}</p>` : `<p>${text}</p>`);
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(entry.title)}, POSTDATED synthetic case</title>
<style>
${PRINTABLE_CSS}
</style>
</head>
<body><main class="page">
<p class="eyebrow">POSTDATED · fictional evaluation case · ${escapeHtml(entry.id)}</p>
<h1>${escapeHtml(entry.title)}</h1>
${paragraphs.join('\n')}
<p class="footer">All names, dates, amounts, and clinical details are fictional. Do not use with real patient documents.</p>
</main></body></html>
`;
}

function writePng(htmlPath, pngPath) {
  const profile = mkdtempSync(join(tmpdir(), 'postdated-chrome-'));
  try {
    spawnSync(
      'timeout',
      [
        '15',
        '/opt/google/chrome/chrome',
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        '--window-size=1275,1650',
        `--user-data-dir=${profile}`,
        `--screenshot=${pngPath}`,
        `file://${htmlPath}`,
      ],
      { encoding: 'utf8' },
    );
    if (!existsSync(pngPath)) {
      throw new Error(`chrome screenshot missing for ${htmlPath}`);
    }
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
}

for (const entry of CASES) {
  const dir = join(ROOT, entry.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'source.md'), entry.source);
  writeFileSync(join(dir, 'ground-truth.json'), `${JSON.stringify(entry.groundTruth, null, 2)}\n`);
  const htmlPath = join(dir, 'printable.html');
  writeFileSync(htmlPath, printableHtml(entry));
  writePng(htmlPath, join(dir, 'input.png'));
  console.log(`wrote ${entry.id}`);
}

console.log(`wrote ${CASES.length} extended case packs`);
