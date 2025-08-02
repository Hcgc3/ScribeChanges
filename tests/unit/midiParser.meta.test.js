// Unit test for meta-event parsing in midiParser
import { parseMidi } from '../../src/converter/midiParser.js';

describe('midiParser meta-events', () => {
  it('should parse controller changes, program changes, pitch bends, aftertouch, sysex', () => {
    const midiData = {
      header: { ticksPerBeat: 480 },
      tracks: [
        {
          events: [],
          controlChanges: {
            64: [{ time: 0.5, value: 127 }], // Sustain pedal
            1: [{ time: 1.0, value: 64 }]    // Modulation
          },
          programChanges: [
            { time: 0.0, programNumber: 5 }
          ],
          pitchBends: [
            { time: 0.25, value: 8192 }
          ],
          aftertouch: [
            { time: 0.75, value: 80 }
          ],
          sysex: [
            { time: 1.5, data: [240, 67, 16, 4, 247] }
          ]
        }
      ]
    };
    const result = parseMidi(midiData);
    expect(result.controllers.length).toBe(2);
    const sortedControllers = result.controllers.sort((a, b) => a.absTime - b.absTime);
    expect(sortedControllers[0].controller).toBe('64');
    expect(sortedControllers[1].controller).toBe('1');
    expect(result.programChanges.length).toBe(1);
    expect(result.programChanges[0].program).toBe(5);
    expect(result.pitchBends.length).toBe(1);
    expect(result.pitchBends[0].value).toBe(8192);
    expect(result.aftertouches.length).toBe(1);
    expect(result.aftertouches[0].value).toBe(80);
    expect(result.sysexMessages.length).toBe(1);
    expect(result.sysexMessages[0].data).toEqual([240, 67, 16, 4, 247]);
  });
});
