// CLI script to convert teste.mid to generated.musicxml using midiToMusicXML (CommonJS)
const fs = require('fs');
const pkg = require('@tonejs/midi');
const { midiToMusicXML } = require('./midiToMusicXML.cjs');

const midi = new pkg.Midi(fs.readFileSync('./test/teste.mid'));
fs.writeFileSync('./test/generated.musicxml', midiToMusicXML(midi));
console.log('Conversion complete: generated.musicxml');
