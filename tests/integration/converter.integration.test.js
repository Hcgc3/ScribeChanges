// Example integration test for the full converter pipeline
import { parseMidi } from '../../src/converter/midiParser.js';
import { quantizeEvents } from '../../src/converter/quantizer.js';
import { transformMeasure } from '../../src/converter/transformer.js';
import { serializeToMusicXML } from '../../src/converter/xmlSerializer.js';

describe('Full Converter Pipeline', () => {
  it('should convert MIDI to MusicXML end-to-end', () => {
    // Mock MIDI input
    const midiData = {
      tracks: [
        { events: [ { type: 'note', noteNumber: 60, absTime: 0, duration: 240 } ] }
      ],
      header: { ticksPerBeat: 480 }
    };
    // Step 1: Parse MIDI
    const parsed = parseMidi(midiData);
    // Step 2: Quantize
    const quantized = quantizeEvents(parsed.events, parsed.divisions, 4);
    // Step 3: Transform (map each measure)
    const measures = quantized.map(m => transformMeasure(m, parsed.divisions));
    // Build minimal score object
    const score = { divisions: parsed.divisions, parts: [{ measures }] };
    // Step 4: Serialize
    const xml = serializeToMusicXML(score);
    expect(xml).toContain('<score-partwise');
    expect(xml).toContain('<note');
    expect(xml).toContain('<pitch>');
  });
});
