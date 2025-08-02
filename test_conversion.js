#!/usr/bin/env node

import fs from 'fs';
import { midiBufferToMusicXML } from './src/converter/converter.js';

async function testConversion() {
  try {
    // Read the test MIDI file
    const midiBuffer = fs.readFileSync('./Test/teste.mid');
    console.log('MIDI file loaded, size:', midiBuffer.length, 'bytes');
    
    // Convert to MusicXML
    console.log('Starting conversion...');
    const musicXML = await midiBufferToMusicXML(midiBuffer);
    
    // Save the output
    fs.writeFileSync('./test_output.musicxml', musicXML);
    console.log('Conversion complete! Output saved to test_output.musicxml');
    console.log('MusicXML length:', musicXML.length, 'characters');
    
    // Show first few lines
    const lines = musicXML.split('\n');
    console.log('\nFirst 10 lines of output:');
    lines.slice(0, 10).forEach((line, i) => console.log(`${i+1}: ${line}`));
    
  } catch (error) {
    console.error('Conversion failed:', error);
    console.error(error.stack);
  }
}

testConversion();