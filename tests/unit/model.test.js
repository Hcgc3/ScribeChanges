// model unit test example
import { Score, Part, Measure, NoteEvent } from '../../src/converter/model.js';

describe('model', () => {
  it('should create a Score with correct structure', () => {
    const score = new Score({ parts: [], divisions: 480 });
    expect(score.parts).toBeDefined();
    expect(Array.isArray(score.parts)).toBe(true);
  });
  it('should add Part and Measure correctly', () => {
    const score = new Score({ parts: [], divisions: 480 });
    const part = new Part({ id: 'P1', measures: [] });
    score.parts.push(part);
    const measure = new Measure({ number: 1 });
    part.measures.push(measure);
    expect(score.parts[0].measures[0].number).toBe(1);
  });
});
