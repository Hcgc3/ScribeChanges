/**
 * VoiceSeparator: Advanced musical voice separation system
 * Separates notes into distinct musical voices using multiple analysis techniques
 */
class VoiceSeparator {
  constructor(options = {}) {
    this.config = {
      pitchThreshold: options.pitchThreshold || 60, // Middle C
      chordTolerance: options.chordTolerance || 100, // ms tolerance for simultaneous notes
      voiceRangeTolerance: options.voiceRangeTolerance || 12, // semitones
      minChordSize: options.minChordSize || 2,
      maxVoices: options.maxVoices || 4,
      ...options
    };
  }

  /**
   * Main voice separation method
   * @param {Array} notes - Array of note objects with properties: pitch, startTime, duration, velocity
   * @returns {Array} Array of voice groups, each containing notes for that voice
   */
  separateVoices(notes) {
    if (!this.validateInput(notes)) return [];

    // Sort notes by start time for processing
    const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);
    
    // Apply multiple separation strategies
    const simultaneousGroups = this.groupSimultaneousNotes(sortedNotes);
    const voiceAssignments = this.assignNotesToVoices(simultaneousGroups);
    
    return this.formatVoiceOutput(voiceAssignments, sortedNotes);
  }

  /**
   * Validate input notes array
   */
  validateInput(notes) {
    return Array.isArray(notes) && 
           notes.length > 0 && 
           notes.every(note => this.isValidNote(note));
  }

  /**
   * Check if note object has required properties
   */
  isValidNote(note) {
    return note && 
           typeof note.pitch === 'number' && 
           typeof note.startTime === 'number' &&
           note.pitch >= 0 && note.pitch <= 127;
  }

  /**
   * Group notes that occur simultaneously or nearly simultaneously
   */
  groupSimultaneousNotes(notes) {
    const groups = [];
    let currentGroup = [];
    let currentTime = null;

    for (const note of notes) {
      if (currentTime === null || 
          Math.abs(note.startTime - currentTime) <= this.config.chordTolerance) {
        currentGroup.push(note);
        currentTime = currentTime || note.startTime;
      } else {
        if (currentGroup.length > 0) {
          groups.push({
            time: currentTime,
            notes: [...currentGroup]
          });
        }
        currentGroup = [note];
        currentTime = note.startTime;
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      groups.push({
        time: currentTime,
        notes: currentGroup
      });
    }

    return groups;
  }

  /**
   * Assign notes to voices based on pitch patterns and musical logic
   */
  assignNotesToVoices(groups) {
    const voices = [];
    
    for (const group of groups) {
      if (group.notes.length === 1) {
        // Single note - assign to best fitting voice
        this.assignSingleNote(group.notes[0], voices);
      } else {
        // Multiple simultaneous notes - handle as chord or separate voices
        this.assignChordNotes(group.notes, voices);
      }
    }

    return voices;
  }

  /**
   * Assign a single note to the most appropriate voice
   */
  assignSingleNote(note, voices) {
    let bestVoice = null;
    let bestScore = -Infinity;

    // Try to find the best existing voice
    for (let i = 0; i < voices.length; i++) {
      const voice = voices[i];
      const score = this.calculateVoiceCompatibility(note, voice);
      
      if (score > bestScore) {
        bestScore = score;
        bestVoice = i;
      }
    }

    // Create new voice if no good match found or max voices not reached
    if (bestScore < 0.3 && voices.length < this.config.maxVoices) {
      voices.push([note]);
    } else if (bestVoice !== null) {
      voices[bestVoice].push(note);
    } else {
      // Fallback: add to least populated voice
      const leastPopulated = voices.reduce((min, voice, idx) => 
        voices[min].length > voice.length ? idx : min, 0);
      voices[leastPopulated].push(note);
    }
  }

  /**
   * Handle simultaneous notes (chords or multiple voices)
   */
  assignChordNotes(chordNotes, voices) {
    // Sort chord notes by pitch
    const sortedChord = [...chordNotes].sort((a, b) => a.pitch - b.pitch);
    
    // Determine if this should be treated as a chord or separate voices
    if (this.isLikelyChord(sortedChord)) {
      this.assignChordToVoice(sortedChord, voices);
    } else {
      // Assign each note individually
      for (const note of sortedChord) {
        this.assignSingleNote(note, voices);
      }
    }
  }

  /**
   * Determine if simultaneous notes form a musical chord
   */
  isLikelyChord(notes) {
    if (notes.length < this.config.minChordSize) return false;
    
    // Check if notes form reasonable intervals
    const intervals = [];
    for (let i = 1; i < notes.length; i++) {
      intervals.push(notes[i].pitch - notes[i-1].pitch);
    }
    
    // Common chord intervals (3rds, 4ths, 5ths, etc.)
    const commonIntervals = [3, 4, 5, 7, 8, 9, 12];
    return intervals.some(interval => commonIntervals.includes(interval));
  }

  /**
   * Assign an entire chord to the most appropriate voice
   */
  assignChordToVoice(chord, voices) {
    const bassPitch = chord[0].pitch;
    let bestVoice = null;
    let bestScore = -Infinity;

    // Find voice that best matches the bass note
    for (let i = 0; i < voices.length; i++) {
      const voice = voices[i];
      if (voice.length === 0) continue;
      
      const lastNote = voice[voice.length - 1];
      const pitchDistance = Math.abs(lastNote.pitch - bassPitch);
      const score = 1 / (1 + pitchDistance / 12); // Closer pitches get higher scores
      
      if (score > bestScore) {
        bestScore = score;
        bestVoice = i;
      }
    }

    // Assign chord to best voice or create new voice
    if (bestVoice !== null && bestScore > 0.3) {
      voices[bestVoice].push(...chord);
    } else if (voices.length < this.config.maxVoices) {
      voices.push([...chord]);
    } else {
      // Fallback: distribute notes among existing voices
      chord.forEach((note, idx) => {
        const voiceIdx = idx % voices.length;
        voices[voiceIdx].push(note);
      });
    }
  }

  /**
   * Calculate how well a note fits with an existing voice
   */
  calculateVoiceCompatibility(note, voice) {
    if (voice.length === 0) return 0.5;

    const lastNote = voice[voice.length - 1];
    const pitchDistance = Math.abs(note.pitch - lastNote.pitch);
    const timeDistance = Math.abs(note.startTime - lastNote.startTime);

    // Prefer notes that are close in pitch and reasonable in time
    const pitchScore = Math.max(0, 1 - pitchDistance / this.config.voiceRangeTolerance);
    const timeScore = timeDistance > 0 ? Math.min(1, 1000 / timeDistance) : 1;
    
    return (pitchScore * 0.7) + (timeScore * 0.3);
  }

  /**
   * Format the voice assignments into the final output structure
   */
  formatVoiceOutput(voices, originalNotes) {
    // Ensure all voices are properly sorted by time
    const sortedVoices = voices.map(voice => 
      voice.sort((a, b) => a.startTime - b.startTime)
    );

    // Remove empty voices and sort by average pitch (highest first)
    return sortedVoices
      .filter(voice => voice.length > 0)
      .map(voice => ({
        notes: voice,
        averagePitch: voice.reduce((sum, note) => sum + note.pitch, 0) / voice.length,
        noteCount: voice.length
      }))
      .sort((a, b) => b.averagePitch - a.averagePitch)
      .map(voice => voice.notes);
  }

  /**
   * Alternative separation method: simple pitch-based separation (legacy support)
   */
  separateByPitch(notes, threshold = null) {
    const pitchThreshold = threshold || this.config.pitchThreshold;
    
    if (!this.validateInput(notes)) return [];
    
    const melody = notes.filter(note => note.pitch >= pitchThreshold);
    const accompaniment = notes.filter(note => note.pitch < pitchThreshold);
    
    return [melody, accompaniment].filter(voice => voice.length > 0);
  }

  /**
   * Get voice statistics for analysis
   */
  getVoiceStats(voices) {
    return voices.map((voice, index) => ({
      voiceIndex: index,
      noteCount: voice.length,
      pitchRange: {
        min: Math.min(...voice.map(n => n.pitch)),
        max: Math.max(...voice.map(n => n.pitch))
      },
      avgPitch: voice.reduce((sum, n) => sum + n.pitch, 0) / voice.length,
      duration: voice.length > 0 ? 
        Math.max(...voice.map(n => n.startTime + (n.duration || 0))) - 
        Math.min(...voice.map(n => n.startTime)) : 0
    }));
  }
}

export default VoiceSeparator;