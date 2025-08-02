import { serializeToMusicXML } from '../../src/converter/xmlSerializer.js';
import fs from 'fs';

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
fs.writeFileSync('tests/unit/test_output.musicxml', xml);
console.log('MusicXML file written to tests/unit/test_output.musicxml');
