// Test compatibility issues with different note field names
const fs = require('fs');

async function testNoteFieldCompatibility() {
  try {
    const converterModule = await import('./src/utils/midiToMusicXML.js');
    const midiToMusicXML = converterModule.midiToMusicXML;
    
    console.log('Testing note field compatibility...');
    
    // Test 1: Normal case with note.midi (like @tonejs/midi)
    const midiWithMidiField = {
      header: { ppq: 480 },
      tracks: [{
        notes: [{
          midi: 60, // Middle C
          time: 0,
          duration: 0.5,
          velocity: 0.8
        }]
      }]
    };
    
    console.log('\nTest 1: note.midi field');
    try {
      const result1 = midiToMusicXML(midiWithMidiField);
      console.log('✓ Success with note.midi');
      console.log('Output length:', result1.length);
    } catch (e) {
      console.log('✗ Failed with note.midi:', e.message);
    }
    
    // Test 2: Case with note.noteNumber (potential alternate format)
    const midiWithNoteNumberField = {
      header: { ppq: 480 },
      tracks: [{
        notes: [{
          noteNumber: 60, // Middle C
          time: 0,
          duration: 0.5,
          velocity: 0.8
        }]
      }]
    };
    
    console.log('\nTest 2: note.noteNumber field');
    try {
      const result2 = midiToMusicXML(midiWithNoteNumberField);
      console.log('✓ Success with note.noteNumber');
      console.log('Output length:', result2.length);
    } catch (e) {
      console.log('✗ Failed with note.noteNumber:', e.message);
      console.log('Error details:', e.stack);
    }
    
    // Test 3: Case with missing MIDI number field
    const midiWithMissingField = {
      header: { ppq: 480 },
      tracks: [{
        notes: [{
          time: 0,
          duration: 0.5,
          velocity: 0.8
          // Missing midi/noteNumber field
        }]
      }]
    };
    
    console.log('\nTest 3: missing MIDI number field');
    try {
      const result3 = midiToMusicXML(midiWithMissingField);
      console.log('✓ Success with missing field');
      console.log('Output length:', result3.length);
    } catch (e) {
      console.log('✗ Failed with missing field:', e.message);
      console.log('Error details:', e.stack);
    }
    
    // Test 4: Invalid MIDI number
    const midiWithInvalidNumber = {
      header: { ppq: 480 },
      tracks: [{
        notes: [{
          midi: null,
          time: 0,
          duration: 0.5,
          velocity: 0.8
        }]
      }]
    };
    
    console.log('\nTest 4: invalid MIDI number (null)');
    try {
      const result4 = midiToMusicXML(midiWithInvalidNumber);
      console.log('✓ Success with invalid number');
      console.log('Output length:', result4.length);
    } catch (e) {
      console.log('✗ Failed with invalid number:', e.message);
      console.log('Error details:', e.stack);
    }
    
  } catch (error) {
    console.error('Failed to load converter:', error);
  }
}

testNoteFieldCompatibility();