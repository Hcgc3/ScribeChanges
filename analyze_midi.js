#!/usr/bin/env node

import fs from 'fs';
import { parseMidi } from './src/converter/midiParser.js';

async function analyzeMIDI() {
  try {
    // Read the test MIDI file
    const midiBuffer = fs.readFileSync('./Test/teste.mid');
    console.log('MIDI file loaded, size:', midiBuffer.length, 'bytes');
    
    // Parse MIDI in detail
    const midiData = await parseMidi(midiBuffer);
    console.log('MIDI parsing result:');
    console.log('- Divisions:', midiData.divisions);
    console.log('- Total events:', midiData.events.length);
    console.log('- Parts:', midiData.parts?.length || 0);
    
    console.log('\nFirst 10 note events:');
    const noteEvents = midiData.events.filter(e => e.type === 'note');
    noteEvents.slice(0, 10).forEach((note, i) => {
      // Convert noteNumber to pitch name
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const step = noteNames[note.noteNumber % 12];
      const octave = Math.floor(note.noteNumber / 12) - 1;
      
      console.log(`  ${i+1}: Note ${note.noteNumber} (${step}${octave}) at ${note.absTime}, duration ${note.duration}, velocity ${note.velocity?.toFixed(3)}`);
    });
    
    console.log('\nTime signatures:', midiData.timeSignatures);
    console.log('Tempos:', midiData.tempos);
    console.log('Key signatures:', midiData.keySignatures);
    
    // Check what notes should be in the first measure
    console.log('\nNotes in first 1920 ticks (4 quarter notes at 480 PPQ):');
    const firstMeasureNotes = noteEvents.filter(n => n.absTime < 1920);
    firstMeasureNotes.forEach((note, i) => {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const step = noteNames[note.noteNumber % 12];
      const octave = Math.floor(note.noteNumber / 12) - 1;
      console.log(`  ${i+1}: ${step}${octave} at tick ${note.absTime} (beat ${(note.absTime/480).toFixed(2)})`);
    });
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

analyzeMIDI();