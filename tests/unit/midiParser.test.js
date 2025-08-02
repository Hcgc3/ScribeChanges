// midiParser unit test example
import { parseMidi } from '../../src/converter/midiParser.js';

describe('midiParser', () => {
  it('should parse MIDI and return events array', async () => {
    // Simulate a minimal MIDI input (mock)
    const midiData = {
      tracks: [
        { events: [ { type: 'note', noteNumber: 60, absTime: 0, duration: 240 } ] }
      ],
      header: { ticksPerBeat: 480 }
    };
    const result = await parseMidi(midiData);
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events[0].type).toBe('note');
  });

  it('should detect phrases and chords in MIDI input', async () => {
    const midiData = {
      tracks: [
        {
          notes: [
            { midi: 60, velocity: 100, time: 0, duration: 1 },
            { midi: 64, velocity: 100, time: 1.1, duration: 1 }, // short gap, same phrase
            { midi: 67, velocity: 100, time: 2.2, duration: 1 }, // short gap, same phrase
            { midi: 60, velocity: 100, time: 6, duration: 1 },   // long gap, new phrase
            { midi: 64, velocity: 100, time: 6, duration: 1 },   // chord with previous
          ]
        }
      ],
      header: { ppq: 480 }
    };
    const result = await parseMidi(midiData);
    // Phrase detection: should find 2 phrases
    expect(Array.isArray(result.phrases)).toBe(true);
    expect(result.phrases.length).toBe(2);
    // Chord detection: should find at least one chord
    expect(Array.isArray(result.chords)).toBe(true);
    expect(result.chords.length).toBeGreaterThanOrEqual(1);
    // Chord notes should match [60,64] at absTime 2880
    const chord = result.chords.find(c => c.notes.includes(60) && c.notes.includes(64));
    expect(chord).toBeDefined();
  });
});
