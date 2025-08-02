// Unit test for VoiceSeparator
import VoiceSeparator from '../../src/converter/VoiceSeparator.js';

describe('VoiceSeparator', () => {
  it('should separate notes into melody and accompaniment by pitch', () => {
    const notes = [
      { pitch: 72, duration: 480 }, // C5
      { pitch: 60, duration: 480 }, // C4
      { pitch: 55, duration: 480 }, // G3
      { pitch: 64, duration: 480 }, // E4
      { pitch: 50, duration: 480 }, // D3
    ];
    const separator = new VoiceSeparator();
    const voices = separator.separateVoices(notes);
    expect(voices.length).toBe(2);
    expect(voices[0].every(n => n.pitch >= 60)).toBe(true); // melody
    expect(voices[1].every(n => n.pitch < 60)).toBe(true); // accompaniment
  });
});
