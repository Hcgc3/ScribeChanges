// xmlSerializer unit test example
import { serializeToMusicXML } from '../../src/converter/xmlSerializer.js';

const mockScore = {
  divisions: 480,
  title: 'Test',
  composer: 'Composer',
  parts: [{
    measures: [
      {
        number: 1,
        notes: [
          { rest: false, pitch: { step: 'C', octave: 4 }, duration: 240, type: 'eighth', voice: 1 },
          { rest: true, duration: 240, type: 'eighth', voice: 1 }
        ]
      }
    ]
  }]
};

describe('xmlSerializer', () => {
  it('should output MusicXML with correct note/rest tags', () => {
    const xml = serializeToMusicXML(mockScore);
    expect(xml).toContain('<note');
    expect(xml).toContain('<rest/>');
    expect(xml).toContain('<pitch>');
    expect(xml).toContain('<step>C</step>');
    expect(xml).toContain('<duration>240</duration>');
  });

  it('should output phrase and chord info as <direction> and <harmony> blocks', () => {
    const scoreWithPhraseChord = {
      divisions: 480,
      title: 'PhraseChordTest',
      composer: 'Composer',
      parts: [{
        measures: [
          {
            number: 1,
            notes: [
              { rest: false, pitch: { step: 'C', octave: 4 }, duration: 240, type: 'eighth', voice: 1 }
            ],
            phrases: [
              { label: 'Intro', start: 0, end: 480 }
            ],
            chords: [
              { root: 'C', kind: 'major', name: 'Cmaj7' }
            ]
          }
        ]
      }]
    };
    const xml = serializeToMusicXML(scoreWithPhraseChord);
    expect(xml).toContain('<direction');
    expect(xml).toContain('Phrase: Intro');
    expect(xml).toContain('<harmony>');
    expect(xml).toContain('<root-step>C</root-step>');
    expect(xml).toContain('<kind>major</kind>');
  });
});
