// Quantizer time signature change test
import { quantizeEvents } from '../../src/converter/quantizer.js';

describe('Quantizer - Time Signature Changes', () => {
  it('should split measures and record time signature changes', () => {
    const divisions = 480;
    // Events span two measures, with a time signature change after first measure
    const events = [
      { type: 'note', absTime: 0, duration: 480 }, // measure 1
      { type: 'note', absTime: 480, duration: 960 }, // measure 2 (should be split by new time signature)
    ];
    const timeSignatures = [
      { absTime: 0, numerator: 4, denominator: 4 },
      { absTime: 480, numerator: 3, denominator: 4 },
    ];
    const measures = quantizeEvents(events, divisions, 4, { timeSignatures, debug: true });
    // Only check measures with notes
    const nonEmptyMeasures = measures.filter(m => m.notes && m.notes.length > 0);
    expect(nonEmptyMeasures.length).toBeGreaterThan(1);
    expect(nonEmptyMeasures[0].timeSignature.numerator).toBe(4);
    expect(nonEmptyMeasures[1].timeSignature.numerator).toBe(3);
    // Check notes are split correctly
    expect(nonEmptyMeasures[0].notes.length).toBe(1);
    expect(nonEmptyMeasures[1].notes.length).toBeGreaterThan(0);
  });
});
