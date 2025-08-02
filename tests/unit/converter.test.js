// converter unit test example
import { midiBufferToMusicXML } from '../../src/converter/converter.js';

describe('converter', () => {
  it('should convert MIDI to MusicXML string', async () => {
    // Minimal mock MIDI input
    const midiData = {
      tracks: [ { events: [ { type: 'note', noteNumber: 60, absTime: 0, duration: 240 } ] } ],
      header: { ticksPerBeat: 480 }
    };
    const xml = await midiBufferToMusicXML(midiData);
    expect(typeof xml).toBe('string');
    expect(xml).toContain('<?xml');
    expect(xml).toContain('<score-partwise');
  });
});
