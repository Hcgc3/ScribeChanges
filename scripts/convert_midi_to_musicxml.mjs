#!/usr/bin/env node
// CLI wrapper for midiBufferToMusicXML
import fs from 'fs';
import pkg from '@tonejs/midi';
const { Midi } = pkg;
import { midiBufferToMusicXML } from '../src/converter/converter.js';

const [,, midiPath, outXmlPath] = process.argv;
if (!midiPath || !outXmlPath) {
  console.error('Usage: node convert_midi_to_musicxml.mjs <input.mid> <output.musicxml>');
  process.exit(1);
}


(async () => {
  try {
    const midiBuffer = fs.readFileSync(midiPath);
    // Ensure midiBuffer is Uint8Array for Midi constructor
    const xml = await midiBufferToMusicXML(new Uint8Array(midiBuffer));
    fs.writeFileSync(outXmlPath, xml);
    console.log(`Converted ${midiPath} to ${outXmlPath}`);
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(2);
  }
})();
