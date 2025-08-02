// Edge case unit test for corrupted MIDI
import { parseMidi } from '../../src/converter/midiParser.js';

describe('midiParser edge cases', () => {
  it('should handle corrupted MIDI input gracefully', () => {
    const corruptedMIDI = null;
    expect(() => parseMidi(corruptedMIDI)).not.toThrow();
  });
  it('should handle missing tracks/events', () => {
    const midiData = { tracks: [], header: { ticksPerBeat: 480 } };
    const result = parseMidi(midiData);
    expect(result.events.length).toBe(0);
  });
});
