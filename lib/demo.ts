import { exposureFor } from './exposure';
import { SEEDED_EXTRACTION } from './fixture';
import type { Disallowance, Extraction } from './types';

export type DemoCaseId = 'seeded' | 'photo' | 'pdf';

export interface DemoCase {
  id: DemoCaseId;
  title: string;
  description: string;
  asset?: string;
  format: 'fixture' | 'image' | 'pdf';
  fallback: Extraction;
}

/**
 * These are deliberate demo entry points, not hidden production data. All three use the
 * same committed extraction so a judge gets one letter per load. Live photograph reading
 * is the custom camera/upload path. The public JPG is a preview of that page, not a
 * live-vision case — a Cerebras read of it has returned an empty high-confidence bill.
 */
export const DEMO_CASES: readonly DemoCase[] = [
  {
    id: 'seeded',
    title: 'Original worked case',
    description: 'Fastest path · committed fixture · no key needed',
    format: 'fixture',
    fallback: SEEDED_EXTRACTION,
  },
  {
    id: 'photo',
    title: 'Public photo sample',
    description: 'Public JPG · committed extraction · same letter as the fixture',
    asset: '/samples/discharge-summary-photo.jpg',
    format: 'image',
    fallback: SEEDED_EXTRACTION,
  },
  {
    id: 'pdf',
    title: 'Print-ready sample',
    description: 'Print-ready PDF · committed extraction · no live PDF vision',
    asset: '/samples/discharge-summary.pdf',
    format: 'pdf',
    fallback: SEEDED_EXTRACTION,
  },
];

export function demoCaseFor(id: DemoCaseId): DemoCase {
  return DEMO_CASES.find((demoCase) => demoCase.id === id) ?? DEMO_CASES[0];
}

/** Committed demo buttons never call the live reader. Custom camera/upload still can. */
export function usesLiveExtract(demoCase: DemoCase): boolean {
  return demoCase.id !== 'seeded' && demoCase.id !== 'photo' && demoCase.id !== 'pdf';
}

/**
 * A deterministic amended read keeps the demo rehearsable without pretending that a
 * before/after photograph was uploaded. A real amended photograph goes through the live
 * extraction route instead.
 */
export function amendDemoExtraction(extraction: Extraction, line: Disallowance): Extraction {
  const reason = line.reason.toLowerCase();
  const exposure = exposureFor(line.reason);

  const stillOpen = (item: string): boolean => {
    if (reason.includes(item.toLowerCase())) return false;
    return !(exposure && exposureFor(item)?.id === exposure.id);
  };

  return {
    ...extraction,
    missing_documents: extraction.missing_documents.filter(stillOpen),
    unestablished: extraction.unestablished.filter(stillOpen),
  };
}
