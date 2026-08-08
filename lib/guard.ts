/**
 * The fabrication guard. POSTDATED.md §9.
 *
 * Every clinical noun in any generated output must appear — affirmed, not negated — in
 * the source document, or on a list the treating doctor has confirmed. Anything else is
 * blocked and converted into a red ASK THE DOCTOR item.
 *
 * The guard is deliberately dumb and deliberately deterministic. It is the check on the
 * model, so the model does not get to be part of it.
 */

export type Verdict =
  | { allowed: true; reason: 'no_clinical_claim' | 'affirmed_in_source' | 'doctor_confirmed' | 'is_a_question' }
  | {
      allowed: false;
      blocked_terms: string[];
      /**
       * Term → the sentence in the record that mentions it only to rule it out.
       * Absent for terms the record never mentions at all.
       *
       * This distinction matters on stage: "fever is not in the record" invites a judge
       * to point out that it is. "The record says 'No history of fever or jaundice'"
       * demonstrates that the guard reads negation, which is the stronger claim.
       */
      negations: Record<string, string>;
      ask_the_doctor: string;
    };

/**
 * Clinical vocabulary the system might plausibly be pushed into asserting. Not a
 * medical ontology — a deny-by-default list for the surfaces this product generates.
 * Multi-word entries match across any whitespace.
 */
const CLINICAL_LEXICON = [
  // Symptoms and signs
  'fever', 'pyrexia', 'febrile', 'rigors', 'chills',
  'jaundice', 'icterus', 'pallor', 'cyanosis',
  'vomiting', 'nausea', 'diarrhoea', 'constipation',
  'breathlessness', 'dyspnoea', 'tachycardia', 'bradycardia',
  'hypotension', 'hypertension', 'tachypnoea', 'desaturation',
  'dehydration', 'altered sensorium', 'giddiness', 'syncope',
  'pain', 'tenderness', 'guarding', 'rigidity', 'distension',
  // Diagnoses
  'sepsis', 'septicaemia', 'septic shock', 'peritonitis', 'pancreatitis',
  'cholelithiasis', 'cholecystitis', 'choledocholithiasis', 'cholangitis',
  'gallstones', 'empyema', 'abscess', 'cellulitis', 'pneumonia',
  'urinary tract infection', 'uti', 'anaemia', 'thrombocytopenia',
  'acute kidney injury', 'diabetes', 'diabetes mellitus', 'ketoacidosis',
  'perforation', 'obstruction', 'malignancy', 'metastasis',
  // Procedures and therapy
  'cholecystectomy', 'laparotomy', 'laparoscopy', 'ercp', 'drainage',
  'intubation', 'ventilation', 'transfusion', 'dialysis',
  'iv antibiotics', 'intravenous antibiotics', 'iv fluids', 'inotropes',
  'general anaesthesia', 'spinal anaesthesia',
  // Findings
  'adhesions', 'bile leak', 'perforated', 'gangrenous', 'necrosis',
  'wound infection', 'dehiscence', 'collection', 'effusion',
] as const;

/** Abbreviations that need a hard word boundary or they match inside ordinary words. */
const ABBREVIATIONS = ['GA', 'ICU', 'DM', 'HTN', 'IV', 'NPO', 'POD'] as const;

/** If the only mention in the source is negated, the record does not affirm the term. */
const NEGATION_CUES = [
  'no ', 'not ', 'nil ', 'without ', 'absent', 'denies', 'denied',
  'negative for', 'ruled out', 'free of', 'no h/o', 'no history of',
];

/** How far back from a mention to look for a negation cue. */
const NEGATION_WINDOW = 40;

export function guard(
  candidate: string,
  sourceDocument: string,
  doctorConfirmed: readonly string[] = [],
): Verdict {
  if (isQuestion(candidate)) {
    return { allowed: true, reason: 'is_a_question' };
  }

  const claimed = clinicalTermsIn(candidate);
  if (claimed.length === 0) {
    return { allowed: true, reason: 'no_clinical_claim' };
  }

  const confirmed = doctorConfirmed.map((t) => t.toLowerCase());
  const blocked: string[] = [];
  const negations: Record<string, string> = {};

  for (const term of claimed) {
    if (confirmed.includes(term.toLowerCase())) continue;

    const support = supportFor(sourceDocument, term);
    if (support.affirmed) continue;

    blocked.push(term);
    if (support.negated_by) negations[term] = support.negated_by;
  }

  if (blocked.length === 0) {
    return {
      allowed: true,
      reason: confirmed.length > 0 ? 'doctor_confirmed' : 'affirmed_in_source',
    };
  }

  return {
    allowed: false,
    blocked_terms: blocked,
    negations,
    ask_the_doctor:
      `ASK THE DOCTOR: does the record establish ${blocked.join(', ')}? ` +
      'Only the treating doctor can answer this, and only the doctor can sign it.',
  };
}

/**
 * A question asserts nothing, so it is the escape valve — the system may ask about a
 * fever, it may never state one. Kept narrow on purpose: an assertion with a question
 * mark bolted on ("Patient had a fever?") is still an assertion.
 */
function isQuestion(candidate: string): boolean {
  const text = candidate.trim();
  if (/^ask\s+(the|your)\b/i.test(text)) return true;
  return /\?\s*$/.test(text) && /^(does|do|is|was|were|did|has|have|can|could|should|why|what|which|when)\b/i.test(text);
}

function clinicalTermsIn(text: string): string[] {
  const found = new Set<string>();

  for (const term of CLINICAL_LEXICON) {
    if (mentions(text, term)) found.add(term);
  }
  for (const abbr of ABBREVIATIONS) {
    if (new RegExp(`\\b${abbr}\\b`).test(text)) found.add(abbr);
  }

  // "cholelithiasis" implies nothing about "gallstones" and vice versa, but a longer
  // term that contains a shorter one would double-report. Drop the contained ones.
  const terms = [...found];
  return terms.filter(
    (t) => !terms.some((other) => other !== t && other.toLowerCase().includes(t.toLowerCase())),
  );
}

/** Substring-with-flexible-whitespace, case-insensitive. Catches "jaundiced" from "jaundice". */
function mentions(text: string, term: string): boolean {
  const pattern = term.split(/\s+/).map(escapeRegExp).join('\\s+');
  return new RegExp(pattern, 'i').test(text);
}

/**
 * Present *and* not negated. The seeded summary says "No history of fever or jaundice";
 * a plain substring match would read that as licence to assert both.
 *
 * When the only mentions are negated, the negating sentence comes back so callers can
 * quote the record rather than claim the term is absent from it.
 */
function supportFor(
  source: string,
  term: string,
): { affirmed: boolean; negated_by?: string } {
  const pattern = term.split(/\s+/).map(escapeRegExp).join('\\s+');
  const re = new RegExp(pattern, 'gi');
  const haystack = source.replace(/\s+/g, ' ');

  let negatedBy: string | undefined;

  for (const match of haystack.matchAll(re)) {
    const before = haystack
      .slice(Math.max(0, match.index - NEGATION_WINDOW), match.index)
      .toLowerCase();

    if (!NEGATION_CUES.some((cue) => before.includes(cue))) {
      return { affirmed: true }; // one un-negated mention is enough
    }
    negatedBy ??= sentenceAround(haystack, match.index);
  }

  return { affirmed: false, negated_by: negatedBy };
}

/** The sentence containing a given offset, so the record can be quoted verbatim. */
function sentenceAround(text: string, index: number): string {
  const start = Math.max(
    text.lastIndexOf('.', index) + 1,
    text.lastIndexOf('\n', index) + 1,
  );
  const dot = text.indexOf('.', index);
  const end = dot === -1 ? text.length : dot + 1;
  return text.slice(start, end).trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
