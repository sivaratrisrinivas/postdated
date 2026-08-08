import type { DoctorQuestion, DocumentDemand } from './types';

/**
 * The physical asks, pre-translated. BUILD-TODAY.md cut runtime translation and kept the
 * beat: "three hardcoded pre-translated strings in the seeded case."
 *
 * Hardcoding is also the only way to get these *right*. Splicing an English document name
 * into a Kannada sentence template produces something no ward clerk would read, and this
 * sheet exists to be held up to a ward clerk.
 *
 * The English document name stays in parentheses on purpose — that is what the paperwork
 * is actually called at a Bengaluru counter, in any language the conversation happens in.
 *
 * ⚠️ A native Kannada and Hindi reader should eyeball these before the demo. They are
 * standard constructions but they have not been checked by a speaker.
 */

const DOCUMENT_DEMANDS: Record<string, DocumentDemand> = {
  'Indoor case papers': {
    kind: 'document_demand',
    ask: 'Before you leave, ask the nursing station for the indoor case papers — the ward\'s day-by-day record.',
    ask_kn:
      'ಹೊರಡುವ ಮೊದಲು ನರ್ಸಿಂಗ್ ಸ್ಟೇಷನ್‌ನಲ್ಲಿ ವಾರ್ಡ್‌ನ ದಿನನಿತ್ಯದ ದಾಖಲೆಗಳನ್ನು (Indoor Case Papers) ಕೇಳಿ ಪಡೆಯಿರಿ.',
    ask_hi:
      'जाने से पहले नर्सिंग स्टेशन से वार्ड का रोज़ का रिकॉर्ड (Indoor Case Papers) मांगकर साथ ले जाएँ।',
  },
  'Itemised bill': {
    kind: 'document_demand',
    ask: 'Ask billing for the fully itemised bill, not the summary bill.',
    ask_kn: 'ಬಿಲ್ಲಿಂಗ್ ವಿಭಾಗದಿಂದ ಸಾರಾಂಶ ಬಿಲ್ ಅಲ್ಲ, ಪೂರ್ಣ ವಿವರವಾದ ಬಿಲ್ (Itemised Bill) ಕೇಳಿ ಪಡೆಯಿರಿ.',
    ask_hi: 'बिलिंग से सारांश बिल नहीं, पूरा विस्तृत बिल (Itemised Bill) मांगें।',
  },
  'Implant invoice and sticker': {
    kind: 'document_demand',
    ask: 'Ask theatre staff for the implant invoice and the batch sticker.',
    ask_kn: 'ಆಪರೇಷನ್ ಥಿಯೇಟರ್ ಸಿಬ್ಬಂದಿಯಿಂದ ಇಂಪ್ಲಾಂಟ್ ಇನ್‌ವಾಯ್ಸ್ ಮತ್ತು ಬ್ಯಾಚ್ ಸ್ಟಿಕ್ಕರ್ ಕೇಳಿ ಪಡೆಯಿರಿ.',
    ask_hi: 'ऑपरेशन थिएटर स्टाफ़ से इम्प्लांट का इनवॉइस और बैच स्टिकर मांगें।',
  },
};

const DOCTOR_QUESTIONS: Record<string, DoctorQuestion> = {
  'Why inpatient admission was required': {
    kind: 'doctor_question',
    ask: 'Ask the treating doctor to write in the record why admission was necessary, and to sign it.',
    ask_kn:
      'ಚಿಕಿತ್ಸೆ ನೀಡಿದ ವೈದ್ಯರನ್ನು ಕೇಳಿ: ರೋಗಿಯನ್ನು ಏಕೆ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಿಸಬೇಕಾಯಿತು ಎಂಬುದನ್ನು ದಾಖಲೆಯಲ್ಲಿ ಬರೆದು ಸಹಿ ಮಾಡಲು ತಿಳಿಸಿ.',
    ask_hi:
      'इलाज करने वाले डॉक्टर से कहें: मरीज़ को भर्ती करना क्यों ज़रूरी था, यह रिकॉर्ड में लिखकर हस्ताक्षर करें।',
  },
};

/**
 * Falls back to an English-only ask rather than a machine-spliced one. A missing
 * translation should read as plain English, never as broken Kannada.
 */
export function documentDemandFor(document: string): DocumentDemand {
  return (
    DOCUMENT_DEMANDS[document] ?? {
      kind: 'document_demand',
      ask: `Before you leave, ask the nursing station for: ${document}.`,
      ask_kn: `ಹೊರಡುವ ಮೊದಲು ನರ್ಸಿಂಗ್ ಸ್ಟೇಷನ್‌ನಲ್ಲಿ ಇದನ್ನು ಕೇಳಿ ಪಡೆಯಿರಿ: ${document}.`,
      ask_hi: `जाने से पहले नर्सिंग स्टेशन से यह मांगें: ${document}.`,
    }
  );
}

export function doctorQuestionFor(item: string): DoctorQuestion {
  return (
    DOCTOR_QUESTIONS[item] ?? {
      kind: 'doctor_question',
      ask: `Ask the treating doctor to write in the record — and sign — the answer to: ${item.toLowerCase()}.`,
      ask_kn: `ಚಿಕಿತ್ಸೆ ನೀಡಿದ ವೈದ್ಯರನ್ನು ಕೇಳಿ, ದಾಖಲೆಯಲ್ಲಿ ಬರೆದು ಸಹಿ ಮಾಡಲು ತಿಳಿಸಿ: ${item}.`,
      ask_hi: `इलाज करने वाले डॉक्टर से कहें कि रिकॉर्ड में लिखकर हस्ताक्षर करें: ${item}.`,
    }
  );
}
