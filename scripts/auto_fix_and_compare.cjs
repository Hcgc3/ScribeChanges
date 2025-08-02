// Automated MusicXML output fix and comparison script (CommonJS)
// Usage: node scripts/auto_fix_and_compare.cjs

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const midiFile = path.resolve('Test/teste.mid');
const outputFile = path.resolve('tests/unit/batch_output/Test.musicxml');
const referenceFile = path.resolve('Test/teste.musicxml');
const converterScript = path.resolve('scripts/convert_midi_to_musicxml.mjs');

function runConverter() {
  execSync(`node ${converterScript} ${midiFile} ${outputFile}`, { stdio: 'inherit' });
}

function readFileTrimmed(file) {
  return fs.readFileSync(file, 'utf8').replace(/\s+/g, '');
}

function compareOutputs() {
  const actual = readFileTrimmed(outputFile);
  const reference = readFileTrimmed(referenceFile);
  return actual === reference;
}

function main() {
  console.log('--- Running converter and comparing output ---');
  runConverter();
  // Print MIDI note info
  const { Midi } = require('@tonejs/midi');
  const midiData = fs.readFileSync(midiFile);
  const midi = new Midi(midiData);
  console.log('\n--- MIDI Notes ---');
  midi.tracks.forEach((track, ti) => {
    track.notes.forEach((note, ni) => {
      console.log(`Track ${ti} Note ${ni}: pitch=${note.name} (${note.midi}), start=${note.ticks}, durationTicks=${note.durationTicks}, durationSeconds=${note.duration}`);
    });
  });

  // Print MusicXML note info (simple XML parse)
  const xml2js = require('xml2js');
  const xmlContent = fs.readFileSync(outputFile, 'utf8');
  xml2js.parseString(xmlContent, (err, result) => {
    if (err) {
      console.error('Error parsing MusicXML:', err);
      return;
    }
    const part = result['score-partwise']?.part?.[0];
    if (!part) return;
    console.log('\n--- MusicXML Notes by Measure ---');
    part.measure.forEach((measure, mi) => {
      console.log(`Measure ${measure.$.number}:`);
      if (measure.note) {
        measure.note.forEach((note, ni) => {
          const pitch = note.pitch?.[0];
          const step = pitch?.step?.[0] || '-';
          const octave = pitch?.octave?.[0] || '-';
          const duration = note.duration?.[0] || '-';
          const type = note.type?.[0] || '-';
          const stem = note.stem?.[0] || '-';
          console.log(`  Note ${ni}: pitch=${step}${octave}, duration=${duration}, type=${type}, stem=${stem}`);
        });
      }
    });
  });

  const match = compareOutputs();
  if (match) {
    console.log('✅ Output matches reference. Proceed to next fix.');
  } else {
    console.log('❌ Output does NOT match reference. Refine the fix and retry.');
  }
}

main();
