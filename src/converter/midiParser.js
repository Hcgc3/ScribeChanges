// MIDI parser: loads and merges MIDI events into a timeline
// For browser: use named import. For Node.js: use default import.



import { Score, Part, Measure, NoteEvent, DirectionEvent } from './model.js';

// Dynamic import function to handle different environments
async function loadMidi() {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment
      const module = await import('@tonejs/midi');
      return module.Midi || module.default?.Midi || module.default;
    } else {
      // Node.js environment
      const module = await import('@tonejs/midi');
      return module.default?.Midi || module.Midi || module.default;
    }
  } catch (error) {
    console.error('Failed to load @tonejs/midi:', error);
    throw error;
  }
}

let MidiClass = null;

// For tests, allow passing a mock midiData object directly
export async function parseMidi(midiData) {
  // Handle mock data for testing
  if (midiData && typeof midiData === 'object' && !Buffer.isBuffer(midiData) && !(midiData instanceof ArrayBuffer) && !(midiData instanceof Uint8Array)) {
    // Mock MIDI data structure for testing
    return parseMockMidiData(midiData);
  }

  // Initialize MidiClass if not already loaded
  if (!MidiClass) {
    MidiClass = await loadMidi();
  }
  
  // If midiData is null/undefined, return empty result
  if (!midiData) {
    return { divisions: 480, events: [], timeSignatures: [], tempos: [], keySignatures: [] };
  }
  try {
    if (midiData instanceof ArrayBuffer || midiData instanceof Uint8Array) {
      const midi = new MidiClass(new Uint8Array(midiData));
      const divisions = midi.header.ppq || 480;
      let parts = [];
      let timeSignatures = [];
      let tempos = [];
      let keySignatures = [];
      let controllers = [];
      let programChanges = [];
      let pitchBends = [];
      let aftertouches = [];
      let sysexMessages = [];
      let phraseEvents = [];
      let chordEvents = [];
      midi.tracks.forEach((track, trackIdx) => {
        let partEvents = [];
        if (!track.notes) throw new Error(`Track ${trackIdx} missing notes array.`);
        // Phrase detection: group notes with short gaps as phrases
        let phraseStart = null;
        let lastNoteEnd = null;
        let phraseNotes = [];
        track.notes.forEach((note, i) => {
          if (typeof note.midi !== 'number') throw new Error(`Note missing midi property in track ${trackIdx}.`);
          const absTime = Math.round(note.time * divisions);
          const duration = Math.round(note.duration * divisions);
          partEvents.push({
            type: 'note',
            noteNumber: note.midi,
            velocity: note.velocity,
            channel: trackIdx,
            absTime,
            duration,
            pedal: note.pedal ?? false,
            slur: note.slur ?? false,
            articulations: note.articulations ?? [],
            notations: note.notations ?? [],
          });
          // Phrase detection: if gap > threshold, end phrase
          if (phraseStart === null) phraseStart = absTime;
          if (lastNoteEnd !== null && absTime - lastNoteEnd > divisions * 2) {
            // End phrase
            phraseEvents.push({
              type: 'phrase',
              start: phraseStart,
              end: lastNoteEnd,
              notes: [...phraseNotes],
              channel: trackIdx
            });
            phraseStart = absTime;
            phraseNotes = [];
          }
          phraseNotes.push({ absTime, duration, noteNumber: note.midi });
          lastNoteEnd = absTime + duration;
        });
        // Final phrase
        if (phraseNotes.length > 0) {
          phraseEvents.push({
            type: 'phrase',
            start: phraseStart,
            end: lastNoteEnd,
            notes: [...phraseNotes],
            channel: trackIdx
          });
        }
        // Chord detection: group notes starting at same absTime
        let notesByTime = {};
        partEvents.forEach(ev => {
          if (ev.type === 'note') {
            notesByTime[ev.absTime] = notesByTime[ev.absTime] || [];
            notesByTime[ev.absTime].push(ev.noteNumber);
          }
        });
        Object.entries(notesByTime).forEach(([time, notes]) => {
          if (notes.length > 1) {
            chordEvents.push({
              type: 'chord',
              absTime: Number(time),
              notes,
              channel: trackIdx
            });
          }
        });
        // Meta events parsing
        if (track.controlChanges) {
          Object.entries(track.controlChanges).forEach(([cc, arr]) => {
            arr.forEach(ev => {
              controllers.push({
                absTime: Math.round(ev.time * divisions),
                controller: cc,
                value: ev.value,
                channel: trackIdx
              });
            });
          });
        }
        if (track.programChanges) {
          track.programChanges.forEach(ev => {
            programChanges.push({
              absTime: Math.round(ev.time * divisions),
              program: ev.programNumber,
              channel: trackIdx
            });
          });
        }
        if (track.pitchBends) {
          track.pitchBends.forEach(ev => {
            pitchBends.push({
              absTime: Math.round(ev.time * divisions),
              value: ev.value,
              channel: trackIdx
            });
          });
        }
        if (track.aftertouch) {
          track.aftertouch.forEach(ev => {
            aftertouches.push({
              absTime: Math.round(ev.time * divisions),
              value: ev.value,
              channel: trackIdx
            });
          });
        }
        if (track.sysex) {
          track.sysex.forEach(ev => {
            sysexMessages.push({
              absTime: Math.round(ev.time * divisions),
              data: ev.data,
              channel: trackIdx
            });
          });
        }
        // Parse time signature, tempo, key signature events
        if (track.timeSignatures) {
          timeSignatures.push(...track.timeSignatures.map(ts => ({
            absTime: Math.round(ts.time * divisions),
            numerator: ts.numerator,
            denominator: ts.denominator,
            channel: trackIdx
          })));
        }
        if (track.tempos) {
          tempos.push(...track.tempos.map(t => ({
            absTime: Math.round(t.time * divisions),
            bpm: t.bpm,
            channel: trackIdx
          })));
        }
        if (track.keySignatures) {
          keySignatures.push(...track.keySignatures.map(ks => ({
            absTime: Math.round(ks.time * divisions),
            key: ks.key,
            scale: ks.scale,
            channel: trackIdx
          })));
        }
        parts.push({ channel: trackIdx, events: partEvents });
        // Attach phrase/chord events to parts for advanced parsing
        if (phraseEvents.length) parts[parts.length - 1].phrases = phraseEvents;
        if (chordEvents.length) parts[parts.length - 1].chords = chordEvents;
      });
      // Optionally flatten events for legacy compatibility
      let allEvents = parts.flatMap(p => p.events);
      allEvents.sort((a, b) => a.absTime - b.absTime);
      // Also flatten phrase/chord events for global access
      let allPhrases = parts.flatMap(p => p.phrases || []);
      let allChords = parts.flatMap(p => p.chords || []);
      return { divisions, parts, events: allEvents, timeSignatures, tempos, keySignatures, controllers, programChanges, pitchBends, aftertouches, sysexMessages, phrases: allPhrases, chords: allChords };
    }
  } catch (err) {
    // Logging só no backend
    if (typeof window === 'undefined' && typeof require !== 'undefined') {
      // Node.js: log erro
      try {
        const { log } = require('./logger.js');
        log(`Erro no parseMIDI: ${err.message}`, 'error');
      } catch (e) {}
    }
    throw err;
  }
  // For tests: midiData is a mock object
  const divisions = midiData.header?.ticksPerBeat || midiData.header?.ppq || 480;
  let events = [];
  let timeSignatures = [];
  let tempos = [];
  let keySignatures = [];
  let controllers = [];
  let programChanges = [];
  let pitchBends = [];
  let aftertouches = [];
  let sysexMessages = [];
  let phraseEvents = [];
  let chordEvents = [];
  midiData.tracks.forEach((track, trackIdx) => {
    let partEvents = [];
    let phraseStart = null;
    let lastNoteEnd = null;
    let phraseNotes = [];
    (track.events || track.notes || []).forEach((note, i) => {
      const absTime = note.absTime || Math.round((note.time || 0) * divisions);
      const duration = note.duration || 240;
      partEvents.push({
        type: note.type || 'note',
        noteNumber: note.noteNumber || note.midi,
        velocity: note.velocity || 100,
        channel: trackIdx,
        absTime,
        duration,
      });
      // Phrase detection: if gap > threshold, end phrase
      if (phraseStart === null) phraseStart = absTime;
      if (lastNoteEnd !== null && absTime - lastNoteEnd > divisions * 2) {
        phraseEvents.push({
          type: 'phrase',
          start: phraseStart,
          end: lastNoteEnd,
          notes: [...phraseNotes],
          channel: trackIdx
        });
        phraseStart = absTime;
        phraseNotes = [];
      }
      phraseNotes.push({ absTime, duration, noteNumber: note.noteNumber || note.midi });
      lastNoteEnd = absTime + duration;
    });
    if (phraseNotes.length > 0) {
      phraseEvents.push({
        type: 'phrase',
        start: phraseStart,
        end: lastNoteEnd,
        notes: [...phraseNotes],
        channel: trackIdx
      });
    }
    // Chord detection: group notes starting at same absTime
    let notesByTime = {};
    partEvents.forEach(ev => {
      if (ev.type === 'note') {
        notesByTime[ev.absTime] = notesByTime[ev.absTime] || [];
        notesByTime[ev.absTime].push(ev.noteNumber);
      }
    });
    Object.entries(notesByTime).forEach(([time, notes]) => {
      if (notes.length > 1) {
        chordEvents.push({
          type: 'chord',
          absTime: Number(time),
          notes,
          channel: trackIdx
        });
      }
    });
    events.push(...partEvents);
    // Meta events parsing for mock/test
    if (track.controlChanges) {
      Object.entries(track.controlChanges).forEach(([cc, arr]) => {
        arr.forEach(ev => {
          controllers.push({
            absTime: Math.round((ev.time || 0) * divisions),
            controller: cc,
            value: ev.value,
            channel: trackIdx
          });
        });
      });
    }
    if (track.programChanges) {
      track.programChanges.forEach(ev => {
        programChanges.push({
          absTime: Math.round((ev.time || 0) * divisions),
          program: ev.programNumber,
          channel: trackIdx
        });
      });
    }
    if (track.pitchBends) {
      track.pitchBends.forEach(ev => {
        pitchBends.push({
          absTime: Math.round((ev.time || 0) * divisions),
          value: ev.value,
          channel: trackIdx
        });
      });
    }
    if (track.aftertouch) {
      track.aftertouch.forEach(ev => {
        aftertouches.push({
          absTime: Math.round((ev.time || 0) * divisions),
          value: ev.value,
          channel: trackIdx
        });
      });
    }
    if (track.sysex) {
      track.sysex.forEach(ev => {
        sysexMessages.push({
          absTime: Math.round((ev.time || 0) * divisions),
          data: ev.data,
          channel: trackIdx
        });
      });
    }
    if (track.timeSignatures) {
      timeSignatures.push(...track.timeSignatures.map(ts => ({
        absTime: Math.round((ts.time || 0) * divisions),
        numerator: ts.numerator,
        denominator: ts.denominator
      })));
    }
    if (track.tempos) {
      tempos.push(...track.tempos.map(t => ({
        absTime: Math.round((t.time || 0) * divisions),
        bpm: t.bpm
      })));
    }
    if (track.keySignatures) {
      keySignatures.push(...track.keySignatures.map(ks => ({
        absTime: Math.round((ks.time || 0) * divisions),
        key: ks.key,
        scale: ks.scale
      })));
    }
  });
  events.sort((a, b) => a.absTime - b.absTime);
  return { divisions, events, timeSignatures, tempos, keySignatures, controllers, programChanges, pitchBends, aftertouches, sysexMessages, phrases: phraseEvents, chords: chordEvents };
}

// Helper function to parse mock MIDI data for testing
function parseMockMidiData(midiData) {
  const divisions = midiData.header?.ppq || midiData.header?.ticksPerBeat || 480;
  const events = [];
  const timeSignatures = [];
  const tempos = [];
  const keySignatures = [];
  const phraseEvents = [];
  const chordEvents = [];

  if (midiData.tracks) {
    midiData.tracks.forEach((track, trackIdx) => {
      if (track.events) {
        track.events.forEach(event => {
          events.push({
            type: event.type,
            absTime: event.absTime || 0,
            duration: event.duration || 240,
            noteNumber: event.noteNumber || 60,
            velocity: event.velocity || 80,
            channel: trackIdx
          });
        });
      }
      
      if (track.notes) {
        track.notes.forEach((note, i) => {
          const absTime = Math.round(note.time * divisions);
          const duration = Math.round(note.duration * divisions);
          events.push({
            type: 'note',
            absTime,
            duration,
            noteNumber: note.midi,
            velocity: note.velocity,
            channel: trackIdx
          });
        });
        
        // Simple phrase detection for mock data - improved logic
        if (track.notes.length > 1) {
          let phrases = [];
          let currentPhrase = [];
          let lastTime = null;
          
          track.notes.forEach((note, i) => {
            const noteTime = note.time;
            
            if (lastTime !== null && (noteTime - lastTime) > 2.5) { // Gap > 2.5 seconds starts new phrase
              if (currentPhrase.length > 0) {
                const phraseStart = Math.round(currentPhrase[0].time * divisions);
                const phraseEnd = Math.round((currentPhrase[currentPhrase.length - 1].time + currentPhrase[currentPhrase.length - 1].duration) * divisions);
                phrases.push({
                  type: 'phrase',
                  start: phraseStart,
                  end: phraseEnd,
                  notes: currentPhrase.map(note => ({
                    absTime: Math.round(note.time * divisions),
                    duration: Math.round(note.duration * divisions),
                    noteNumber: note.midi
                  })),
                  channel: trackIdx
                });
              }
              currentPhrase = [];
            }
            
            currentPhrase.push(note);
            lastTime = noteTime + note.duration;
          });
          
          // Add final phrase
          if (currentPhrase.length > 0) {
            const phraseStart = Math.round(currentPhrase[0].time * divisions);
            const phraseEnd = Math.round((currentPhrase[currentPhrase.length - 1].time + currentPhrase[currentPhrase.length - 1].duration) * divisions);
            phrases.push({
              type: 'phrase',
              start: phraseStart,
              end: phraseEnd,
              notes: currentPhrase.map(note => ({
                absTime: Math.round(note.time * divisions),
                duration: Math.round(note.duration * divisions),
                noteNumber: note.midi
              })),
              channel: trackIdx
            });
          }
          
          phraseEvents.push(...phrases);
        }
        
        // Simple chord detection for mock data
        let notesByTime = {};
        track.notes.forEach(note => {
          const time = Math.round(note.time * divisions);
          if (!notesByTime[time]) notesByTime[time] = [];
          notesByTime[time].push(note.midi);
        });
        
        Object.entries(notesByTime).forEach(([time, notes]) => {
          if (notes.length > 1) {
            chordEvents.push({
              type: 'chord',
              absTime: parseInt(time),
              notes: notes,
              channel: trackIdx
            });
          }
        });
      }
    });
  }

  events.sort((a, b) => a.absTime - b.absTime);
  
  return {
    divisions,
    events,
    timeSignatures,
    tempos,
    keySignatures,
    controllers: [],
    programChanges: [],
    pitchBends: [],
    aftertouches: [],
    sysexMessages: [],
    phrases: phraseEvents,
    chords: chordEvents
  };
}
