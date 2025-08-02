import { serializeToMusicXML } from '../../src/converter/xmlSerializer.js';
import MusicXMLValidator from '../../src/converter/MusicXMLValidator.js';

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
const validator = new MusicXMLValidator();
const errors = validator.validate(xml);
console.log(errors.length === 0 ? 'MusicXML is valid.' : errors);
