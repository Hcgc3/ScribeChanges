// Automated MusicXML output fix and comparison script
// Usage: node scripts/auto_fix_and_compare.js

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
  const match = compareOutputs();
  if (match) {
    console.log('✅ Output matches reference. Proceed to next fix.');
  } else {
    console.log('❌ Output does NOT match reference. Refine the fix and retry.');
  }
}

main();
