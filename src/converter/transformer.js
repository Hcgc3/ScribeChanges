// Transformer: maps quantized events to NoteEvent/DirectionEvent objects
import { NoteEvent, DirectionEvent } from './model.js';
import { log } from './logger.js';

// ================================
// MAPEAMENTO DE DURAÇÕES MELHORADO
// ================================

function getNoteType(duration, divisions, allowDotted = true) {
  // Basic note types with their division values
  const basicTypes = [
    { name: 'whole', value: divisions * 4 },
    { name: 'half', value: divisions * 2 },
    { name: 'quarter', value: divisions },
    { name: 'eighth', value: divisions / 2 },
    { name: '16th', value: divisions / 4 },
    { name: '32nd', value: divisions / 8 },
    { name: '64th', value: divisions / 16 }
  ];

  // Dotted note types (1.5x duration)
  const dottedTypes = [
    { name: 'whole', value: divisions * 6, dots: 1 },
    { name: 'half', value: divisions * 3, dots: 1 },
    { name: 'quarter', value: divisions * 1.5, dots: 1 },
    { name: 'eighth', value: divisions * 0.75, dots: 1 },
    { name: '16th', value: divisions * 0.375, dots: 1 }
  ];

  // Triplet note types
  const tripletTypes = [
    { name: 'quarter', value: divisions / 1.5, triplet: true }, // quarter note triplet
    { name: 'eighth', value: divisions / 3, triplet: true },    // eighth note triplet
    { name: '16th', value: divisions / 6, triplet: true }       // 16th note triplet
  ];

  const tolerance = 0.15; // 15% tolerance

  // Check dotted notes first (if allowed)
  if (allowDotted) {
    for (const type of dottedTypes) {
      const diff = Math.abs(duration - type.value);
      if (diff < type.value * tolerance) {
        return { name: type.name, dots: type.dots };
      }
    }
  }

  // Check triplets
  for (const type of tripletTypes) {
    const diff = Math.abs(duration - type.value);
    if (diff < type.value * tolerance) {
      return { name: type.name, triplet: true };
    }
  }

  // Check basic types
  let closest = basicTypes[0];
  let minDiff = Math.abs(duration - basicTypes[0].value);

  for (const type of basicTypes) {
    const diff = Math.abs(duration - type.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = type;
    }
  }

  // Accept if within tolerance
  if (minDiff < closest.value * tolerance) {
    return { name: closest.name };
  }

  // Fallback to closest match
  return { name: closest.name };
}

function quantizeDuration(duration, divisions, snapToGrid = true) {
  if (!snapToGrid) return duration;

  // All possible musical durations
  const musicalValues = [
    divisions * 6,    // dotted whole
    divisions * 4,    // whole
    divisions * 3,    // dotted half
    divisions * 2,    // half
    divisions * 1.5,  // dotted quarter
    divisions,        // quarter
    divisions * 0.75, // dotted eighth
    divisions / 2,    // eighth
    divisions / 3,    // eighth triplet
    divisions * 0.375,// dotted 16th
    divisions / 4,    // 16th
    divisions / 6,    // 16th triplet
    divisions / 8,    // 32nd
    divisions / 16    // 64th
  ];

  // Find closest musical value
  let closest = musicalValues[0];
  let minDiff = Math.abs(duration - closest);

  for (const value of musicalValues) {
    const diff = Math.abs(duration - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = value;
    }
  }

  return Math.round(closest);
}

// ================================
// BEAMING INTELIGENTE
// ================================

function calculateBeams(notes, divisions) {
  const beamGroups = [];
  let currentGroup = [];
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    
    // Skip rests and notes that can't be beamed
    if (note.rest || !canBeBeamed(note, divisions)) {
      if (currentGroup.length >= 2) {
        beamGroups.push([...currentGroup]);
      }
      currentGroup = [];
      continue;
    }
    
    // Check if note can join current group
    if (canJoinBeamGroup(note, currentGroup, notes, divisions)) {
      currentGroup.push(i);
    } else {
      // Start new group if current has enough notes
      if (currentGroup.length >= 2) {
        beamGroups.push([...currentGroup]);
      }
      currentGroup = [i];
    }
  }
  
  // Add final group if valid
  if (currentGroup.length >= 2) {
    beamGroups.push(currentGroup);
  }
  
  return beamGroups;
}

function canBeBeamed(note, divisions) {
  const beamableTypes = ['eighth', '16th', '32nd', '64th'];
  return beamableTypes.includes(note.type) && !note.triplet;
}

function canJoinBeamGroup(note, currentGroup, allNotes, divisions) {
  if (currentGroup.length === 0) return true;
  
  const lastIndex = currentGroup[currentGroup.length - 1];
  const lastNote = allNotes[lastIndex];
  
  // Must be same type to beam together
  if (note.type !== lastNote.type) return false;
  
  // Check for beat boundaries (don't beam across beats)
  const beatDuration = divisions; // quarter note beat
  const lastBeat = Math.floor(lastNote.absTime / beatDuration);
  const currentBeat = Math.floor(note.absTime / beatDuration);
  
  return lastBeat === currentBeat;
}

function applyBeaming(notes, beamGroups) {
  beamGroups.forEach(group => {
    group.forEach((noteIndex, i) => {
      if (!notes[noteIndex].beams) notes[noteIndex].beams = [];
      
      if (i === 0) {
        notes[noteIndex].beams.push('begin');
      } else if (i === group.length - 1) {
        notes[noteIndex].beams.push('end');
      } else {
        notes[noteIndex].beams.push('continue');
      }
    });
  });
}

// ================================
// CONVERSÃO DE PITCH MELHORADA
// ================================

function midiToPitch(midiNumber) {
  const stepNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const chromatic = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  
  let step = stepNames[chromatic];
  let alter = 0;
  
  // Convert sharps to flats where appropriate for better engraving
  const sharpToFlat = {
    'C#': { step: 'D', alter: -1 },
    'D#': { step: 'E', alter: -1 },
    'F#': { step: 'G', alter: -1 },
    'G#': { step: 'A', alter: -1 },
    'A#': { step: 'B', alter: -1 }
  };
  
  if (step.includes('#')) {
    if (sharpToFlat[step]) {
      step = sharpToFlat[step].step;
      alter = sharpToFlat[step].alter;
    } else {
      step = step[0];
      alter = 1;
    }
  }
  
  return { step, alter, octave };
}

// ================================
// DETECÇÃO DE STEMS
// ================================

function calculateStem(pitch, measureContext) {
  // Default stem direction based on pitch
  const midiNumber = (pitch.octave + 1) * 12 + 
    ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(pitch.step) + 
    (pitch.alter || 0);
  
  // Middle line (B4 = MIDI 71) is the threshold
  if (midiNumber >= 71) {
    return 'down';
  } else {
    return 'up';
  }
}

// ================================
// VALIDAÇÃO DE DADOS
// ================================

function validateNoteData(note, index) {
  const errors = [];
  
  if (!note) {
    errors.push(`Note at index ${index} is undefined`);
  } else {
    if (!note.rest) {
      if (typeof note.noteNumber !== 'number' || note.noteNumber < 0 || note.noteNumber > 127) {
        errors.push(`Note at index ${index} has invalid noteNumber: ${note.noteNumber}`);
      }
    }
    
    if (typeof note.duration !== 'number' || note.duration <= 0) {
      errors.push(`Note at index ${index} has invalid duration: ${note.duration}`);
    }
    
    if (note.velocity !== undefined && (typeof note.velocity !== 'number' || note.velocity < 0 || note.velocity > 127)) {
      errors.push(`Note at index ${index} has invalid velocity: ${note.velocity}`);
    }
  }
  
  return errors;
}

function validateMeasureData(measure) {
  const errors = [];
  
  if (!measure) {
    errors.push('Measure is undefined');
    return errors;
  }
  
  if (!Array.isArray(measure.notes)) {
    errors.push('Measure missing or malformed notes array');
  }
  
  if (typeof measure.number !== 'number' || measure.number < 1) {
    errors.push(`Invalid measure number: ${measure.number}`);
  }
  
  return errors;
}

// ================================
// TRANSFORMAÇÃO PRINCIPAL
// ================================

export function transformMeasure(measure, divisions) {
  try {
    // Validate input
    const measureErrors = validateMeasureData(measure);
    if (measureErrors.length > 0) {
      throw new Error(`Invalid measure: ${measureErrors.join(', ')}`);
    }
    
    // Sort notes by onset time to preserve musical order
    const sortedNotes = [...measure.notes].sort((a, b) => {
      const timeA = a.absTime || 0;
      const timeB = b.absTime || 0;
      return timeA - timeB;
    });
    
    const transformedNotes = [];
    
    // Transform each note
    for (let idx = 0; idx < sortedNotes.length; idx++) {
      const rawNote = sortedNotes[idx];
      
      // Validate note data
      const noteErrors = validateNoteData(rawNote, idx);
      if (noteErrors.length > 0) {
        log(`Note validation warnings: ${noteErrors.join(', ')}`, 'warn');
        continue; // Skip invalid notes
      }
      
      // Quantize duration
      const quantizedDuration = quantizeDuration(rawNote.duration, divisions);
      const typeInfo = getNoteType(quantizedDuration, divisions, true);
      
      if (rawNote.rest || rawNote.type === 'rest') {
        // Create rest
        transformedNotes.push(new NoteEvent({
          rest: true,
          duration: quantizedDuration,
          type: typeInfo.name,
          dots: typeInfo.dots || 0,
          voice: rawNote.voice || 1,
          ties: rawNote.ties || [],
          articulations: rawNote.articulations || [],
          notations: rawNote.notations || [],
          triplet: typeInfo.triplet || false,
          absTime: rawNote.absTime || 0,
          idx
        }));
      } else {
        // Create note
        const pitch = midiToPitch(rawNote.noteNumber);
        const stem = calculateStem(pitch, measure);
        
        transformedNotes.push(new NoteEvent({
          pitch,
          noteNumber: rawNote.noteNumber,
          duration: quantizedDuration,
          type: typeInfo.name,
          dots: typeInfo.dots || 0,
          voice: rawNote.voice || 1,
          stem,
          ties: rawNote.ties || [],
          articulations: rawNote.articulations || [],
          velocity: rawNote.velocity || 64,
          pedal: rawNote.pedal || false,
          slur: rawNote.slur || false,
          notations: rawNote.notations || [],
          triplet: typeInfo.triplet || false,
          absTime: rawNote.absTime || 0,
          idx
        }));
      }
    }
    
    // Apply intelligent beaming
    const beamGroups = calculateBeams(transformedNotes, divisions);
    applyBeaming(transformedNotes, beamGroups);
    
    // Transform directions
    const transformedDirections = (measure.directions || []).map((dir, idx) => {
      return new DirectionEvent({
        ...dir,
        absTime: dir.absTime || 0,
        idx
      });
    });
    
    return {
      ...measure,
      notes: transformedNotes,
      directions: transformedDirections
    };
    
  } catch (error) {
    log(`[transformMeasure] Error in measure ${measure?.number || 'unknown'}: ${error.message}`, 'error');
    throw error;
  }
}

// ================================
// APLICAÇÃO DE METADADOS
// ================================

function applyMetadataToMeasure(measure, meta, absTime = 0) {
  const { timeSignatures = [], tempos = [], keySignatures = [] } = meta;
  let updatedMeasure = { ...measure };
  
  // Find applicable time signature
  const applicableTS = timeSignatures
    .filter(ts => ts.absTime <= absTime)
    .sort((a, b) => b.absTime - a.absTime)[0];
  
  if (applicableTS) {
    updatedMeasure.timeSignature = {
      numerator: applicableTS.numerator,
      denominator: applicableTS.denominator
    };
  }
  
  // Find applicable tempo
  const applicableTempo = tempos
    .filter(t => t.absTime <= absTime)
    .sort((a, b) => b.absTime - a.absTime)[0];
  
  if (applicableTempo) {
    updatedMeasure.tempo = {
      bpm: applicableTempo.bpm
    };
  }
  
  // Find applicable key signature
  const applicableKS = keySignatures
    .filter(ks => ks.absTime <= absTime)
    .sort((a, b) => b.absTime - a.absTime)[0];
  
  if (applicableKS) {
    updatedMeasure.keySignature = {
      fifths: applicableKS.key || 0,
      scale: applicableKS.scale || 'major'
    };
  }
  
  return updatedMeasure;
}

// ================================
// TRANSFORMAÇÃO COMPLETA
// ================================

export function transformQuantized(measures, divisions = 480, meta = {}) {
  try {
    if (!Array.isArray(measures)) {
      throw new Error('Measures must be an array');
    }
    
    log(`Transforming ${measures.length} measures with divisions=${divisions}`, 'info');
    
    const { parts = [] } = meta;
    
    // Handle multi-part scores
    if (parts.length > 0) {
      const transformedParts = parts.map((part, partIndex) => {
        log(`Transforming part ${partIndex + 1}/${parts.length} (channel ${part.channel})`, 'info');
        
        // Filter metadata for this part if channel-specific
        const partMeta = {
          timeSignatures: meta.timeSignatures?.filter(ts => !ts.channel || ts.channel === part.channel) || [],
          tempos: meta.tempos?.filter(t => !t.channel || t.channel === part.channel) || [],
          keySignatures: meta.keySignatures?.filter(ks => !ks.channel || ks.channel === part.channel) || []
        };
        
        const transformedMeasures = part.measures.map((measure, measureIndex) => {
          const measureAbsTime = measure.absTime || (measureIndex * divisions * 4); // Estimate if not provided
          const measureWithMeta = applyMetadataToMeasure(measure, partMeta, measureAbsTime);
          return transformMeasure(measureWithMeta, divisions);
        });
        
        return {
          id: part.channel || partIndex + 1,
          name: part.name || `Part ${partIndex + 1}`,
          measures: transformedMeasures
        };
      });
      
      return {
        parts: transformedParts,
        divisions
      };
    }
    
    // Handle single-part score
    const transformedMeasures = measures.map((measure, measureIndex) => {
      const measureAbsTime = measure.absTime || (measureIndex * divisions * 4); // Estimate if not provided
      const measureWithMeta = applyMetadataToMeasure(measure, meta, measureAbsTime);
      return transformMeasure(measureWithMeta, divisions);
    });
    
    return {
      parts: [{
        id: 1,
        name: 'Part 1',
        measures: transformedMeasures
      }],
      divisions
    };
    
  } catch (error) {
    log(`[transformQuantized] Error: ${error.message}`, 'error');
    throw error;
  }
}

// ================================
// UTILITÁRIOS AUXILIARES
// ================================

export function getNoteDuration(type, dots = 0, divisions = 480) {
  const baseDurations = {
    'whole': divisions * 4,
    'half': divisions * 2,
    'quarter': divisions,
    'eighth': divisions / 2,
    '16th': divisions / 4,
    '32nd': divisions / 8,
    '64th': divisions / 16
  };
  
  let duration = baseDurations[type] || divisions;
  
  // Apply dots (each dot adds half the previous value)
  let dotValue = duration / 2;
  for (let i = 0; i < dots; i++) {
    duration += dotValue;
    dotValue /= 2;
  }
  
  return duration;
}

export function analyzeNoteComplexity(notes) {
  const stats = {
    totalNotes: notes.length,
    rests: 0,
    dotted: 0,
    triplets: 0,
    beamed: 0,
    ties: 0,
    articulations: 0,
    complexTypes: new Set()
  };
  
  notes.forEach(note => {
    if (note.rest) stats.rests++;
    if (note.dots > 0) stats.dotted++;
    if (note.triplet) stats.triplets++;
    if (note.beams && note.beams.length > 0) stats.beamed++;
    if (note.ties && note.ties.length > 0) stats.ties++;
    if (note.articulations && note.articulations.length > 0) stats.articulations++;
    
    stats.complexTypes.add(note.type);
  });
  
  return stats;
}