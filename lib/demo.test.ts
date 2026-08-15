import { describe, expect, it } from 'vitest';
import { amendDemoExtraction, DEMO_CASES } from './demo';
import { SEEDED_EXTRACTION } from './fixture';
import { computeForecast } from './deduct';
import { NIVA_BUPA_REASSURE_2 } from './policy';

describe('demo cases', () => {
  it('keeps the original fixture plus both committed public samples selectable', () => {
    expect(DEMO_CASES.map((demoCase) => demoCase.id)).toEqual(['seeded', 'photo', 'pdf']);
    expect(DEMO_CASES[1].asset).toBe('/samples/discharge-summary-photo.jpg');
    expect(DEMO_CASES[2].asset).toBe('/samples/discharge-summary.pdf');
  });

  it('removes the action source from the amended demo read', () => {
    const forecast = computeForecast(SEEDED_EXTRACTION, NIVA_BUPA_REASSURE_2);
    const actionLine = forecast.lines.find((line) => line.bucket === 'C');
    if (!actionLine) throw new Error('fixture should have a recoverable line');

    const amended = amendDemoExtraction(SEEDED_EXTRACTION, actionLine);
    expect(amended.missing_documents.length + amended.unestablished.length).toBe(
      SEEDED_EXTRACTION.missing_documents.length + SEEDED_EXTRACTION.unestablished.length - 1,
    );
  });
});
