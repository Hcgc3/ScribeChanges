// Test current midiToMusicXML converter
const fs = require('fs');
const { Midi } = require('@tonejs/midi');

// Import the converter - need to handle ES module
let midiToMusicXML;

async function testConverter() {
  try {
    const converterModule = await import('./src/utils/midiToMusicXML.js');
    midiToMusicXML = converterModule.midiToMusicXML;
    
    console.log('Testing current converter...');
    
    const midiData = fs.readFileSync('./Test/teste.mid');
    const midi = new Midi(midiData);
    
    console.log('MIDI loaded successfully');
    console.log('Tracks:', midi.tracks.length);
    console.log('Notes in first track:', midi.tracks[0]?.notes?.length || 0);
    
    const musicXML = midiToMusicXML(midi);
    console.log('Conversion successful!');
    console.log('Generated MusicXML length:', musicXML.length);
    
    // Save output to verify
    fs.writeFileSync('/tmp/test_output.musicxml', musicXML);
    console.log('Output saved to /tmp/test_output.musicxml');
    
    // Show first few lines
    console.log('\nFirst 500 characters of output:');
    console.log(musicXML.substring(0, 500));
    
  } catch (error) {
    console.error('Error during conversion:', error);
    console.error('Stack trace:', error.stack);
  }
}

testConverter();