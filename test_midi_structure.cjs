// Test script to understand MIDI note structure
const fs = require('fs');
const { Midi } = require('@tonejs/midi');

console.log('Testing MIDI file structure...');

try {
  const midiData = fs.readFileSync('./Test/teste.mid');
  const midi = new Midi(midiData);
  
  console.log('MIDI header:', midi.header);
  console.log('Number of tracks:', midi.tracks.length);
  
  midi.tracks.forEach((track, index) => {
    console.log(`\nTrack ${index}:`);
    console.log('- Name:', track.name);
    console.log('- Channel:', track.channel);
    console.log('- Number of notes:', track.notes ? track.notes.length : 0);
    
    if (track.notes && track.notes.length > 0) {
      console.log('- First note structure:', JSON.stringify(track.notes[0], null, 2));
      console.log('- Note properties available:', Object.keys(track.notes[0]));
    }
  });
} catch (error) {
  console.error('Error loading MIDI file:', error);
}