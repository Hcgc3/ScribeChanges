// transformer unit test example
import { transformQuantized } from '../../src/converter/transformer.js';

describe('transformer', () => {
  it('should transform quantized measures to model', () => {
    const quantized = [
      { number: 1, notes: [ { rest: false, noteNumber: 60, duration: 240, type: 'eighth' } ] }
    ];
    const model = transformQuantized(quantized, 480);
    expect(model).toBeDefined();
    expect(model.parts).toBeDefined();
    expect(model.parts[0].measures.length).toBe(1);
    expect(model.parts[0].measures[0].notes[0].pitch.step).toBe('C');
  });
});
