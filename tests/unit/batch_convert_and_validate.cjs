#!/usr/bin/env node
// Batch MIDI-to-MusicXML conversion and validation script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MIDI_DIR = process.argv[2] || 'tests/unit';
const OUT_DIR = process.argv[3] || 'tests/unit/batch_output';
const SCHEMA = 'schema/musicxml_reduced.xsd';
const EXT_MIDI = '.mid';
const EXT_XML = '.musicxml';
const CONVERTER = 'scripts/convert_midi_to_musicxml.mjs';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function findFiles(dir, ext) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push(fullPath);
    }
  });
  return results;
}

function convertMidiToMusicXML(midiFile, outFile) {
  try {
    execSync(`node ${CONVERTER} "${midiFile}" "${outFile}"`, { stdio: 'pipe' });
    return { midiFile, outFile, success: true };
  } catch (err) {
    return { midiFile, outFile, success: false, error: err.message };
  }
}

function validateMusicXML(xmlFile) {
  try {
    execSync(`xmllint --noout --schema ${SCHEMA} "${xmlFile}"`, { stdio: 'pipe' });
    return { xmlFile, valid: true };
  } catch (err) {
    return { xmlFile, valid: false, error: err.message };
  }
}

const midiFiles = findFiles(MIDI_DIR, EXT_MIDI);
if (midiFiles.length === 0) {
  console.log('No MIDI files found for batch processing.');
  process.exit(0);
}

console.log(`Processing ${midiFiles.length} MIDI files in ${MIDI_DIR}...`);
let report = [];
midiFiles.forEach(midiFile => {
  const base = path.basename(midiFile, EXT_MIDI);
  const outFile = path.join(OUT_DIR, base + EXT_XML);
  const conv = convertMidiToMusicXML(midiFile, outFile);
  let val = null;
  if (conv.success) {
    val = validateMusicXML(outFile);
  }
  report.push({ midi: midiFile, xml: outFile, conversion: conv, validation: val });
});

console.log('\nBatch Report:');
report.forEach(r => {
  if (r.conversion.success && r.validation && r.validation.valid) {
    console.log(`✔ ${r.midi} → ${r.xml} [valid]`);
  } else if (!r.conversion.success) {
    console.log(`✖ ${r.midi} conversion failed.`);
    if (r.conversion.error) console.log(r.conversion.error.split('\n')[0]);
  } else if (r.validation && !r.validation.valid) {
    console.log(`✖ ${r.xml} failed validation.`);
    if (r.validation.error) console.log(r.validation.error.split('\n')[0]);
  }
});

const allValid = report.every(r => r.conversion.success && r.validation && r.validation.valid);
if (allValid) {
  console.log('All files converted and validated successfully!');
  process.exit(0);
} else {
  console.log('Some files failed conversion or validation.');
  process.exit(1);
}
