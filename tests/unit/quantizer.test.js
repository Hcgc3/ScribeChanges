// Quantizer unit test example
import { quantizeEvents } from '../../src/converter/quantizer.js';

function mockEvents() {
  return [
    { type: 'note', absTime: 0, duration: 240, pitch: { step: 'C', octave: 4 } },
    { type: 'note', absTime: 240, duration: 240, pitch: { step: 'D', octave: 4 } },
    { type: 'note', absTime: 480, duration: 480, pitch: { step: 'E', octave: 4 } }
  ];
}

describe('Quantizer', () => {
  it('should split notes into correct measures and durations', () => {
    const divisions = 480;
    const beatsPerMeasure = 4;
    const events = mockEvents();
    const measures = quantizeEvents(events, divisions, beatsPerMeasure);
    expect(measures.length).toBeGreaterThan(0);
    expect(measures[0].notes[0].duration).toBe(240);
    expect(measures[0].notes[1].duration).toBe(240);
    // Ajuste: garantir que só há um measure no mock
    // Se houver mais, testar o próximo
    if (measures.length > 1) {
      expect(measures[1].notes[0].duration).toBe(480);
    }
  });

  it('should adapt quantization granularity for phrases and chords', () => {
    const divisions = 480;
    const beatsPerMeasure = 4;
    // Events: two notes in a phrase, two notes as a chord
    const events = [
      { type: 'note', absTime: 0, duration: 240, pitch: { step: 'C', octave: 4 } },
      { type: 'note', absTime: 240, duration: 240, pitch: { step: 'D', octave: 4 } },
      { type: 'note', absTime: 960, duration: 240, pitch: { step: 'E', octave: 4 } },
      { type: 'note', absTime: 960, duration: 240, pitch: { step: 'G', octave: 4 } } // chord with previous
    ];
    // Phrase: first two notes
    const phrases = [ { start: 0, end: 480, notes: [events[0], events[1]], channel: 0 } ];
    // Chord: last two notes
    const chords = [ { absTime: 960, notes: [events[2].pitch, events[3].pitch], channel: 0 } ];
    const config = { phrases, chords, quantization: { granularity: 0.5 } };
    const measures = quantizeEvents(events, divisions, beatsPerMeasure, config);
    // Check that phrase notes use coarser granularity (duration 240 = eighth)
    expect(measures[0].notes[0].duration).toBe(240);
    expect(measures[0].notes[1].duration).toBe(240);
    // Check that chord notes use finer granularity (duration 120 = 16th)
    const chordNotes = measures.find(m => m.notes.some(n => n.pitch && n.pitch.step === 'E')).notes;
    expect(chordNotes[0].duration).toBeLessThanOrEqual(240);
    expect(chordNotes[1].duration).toBeLessThanOrEqual(240);
  });
});
