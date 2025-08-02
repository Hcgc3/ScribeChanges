import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

const SheetMusicRenderer = ({ midiData, width = 800, height = 600, currentTime = 0, onPlaybackEnd, onHighlightNote }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  // Convert MIDI data to VexFlow notes and measures
  // Returns { measures, timeSignature, flatNotes: [{note, measureIdx, noteIdx, start, end}] }
  // Returns { measures, timeSignature, flatNotes: [{note, measureIdx, noteIdx, start, end}] }
  // Also returns lastNoteEndTime for end-of-playback detection
  const convertMidiToVexFlow = (midiData) => {
    if (!midiData || !midiData.tracks || midiData.tracks.length === 0) {
      return { measures: [], timeSignature: [4, 4] };
    }

    // Get time signature from MIDI header (default to 4/4)
    let timeSig = [4, 4];
    if (midiData.header && midiData.header.timeSignatures && midiData.header.timeSignatures.length > 0) {
      const ts = midiData.header.timeSignatures[0];
      timeSig = [ts.timeSignature[0], ts.timeSignature[1]];
    }

    // Find the first track with notes
    let trackWithNotes = null;
    for (let i = 0; i < midiData.tracks.length; i++) {
      const track = midiData.tracks[i];
      if (track.notes && track.notes.length > 0) {
        trackWithNotes = track;
        break;
      }
    }
    if (!trackWithNotes) {
      return { measures: [], timeSignature: timeSig };
    }

    // Group notes into measures based on time signature and note start times
    const notes = trackWithNotes.notes;
    const ticksPerBeat = midiData.header.ppq || 480;
    const beatsPerMeasure = timeSig[0];
    const beatValue = timeSig[1];
    const ticksPerMeasure = ticksPerBeat * beatsPerMeasure * (4 / beatValue);

    // Find total number of measures
    let lastNoteEnd = 0;
    let lastNoteEndTime = 0;
    notes.forEach(n => {
      const end = n.ticks + n.durationTicks;
      if (end > lastNoteEnd) lastNoteEnd = end;
      if (n.time + n.duration > lastNoteEndTime) lastNoteEndTime = n.time + n.duration;
    });
    const numMeasures = Math.ceil(lastNoteEnd / ticksPerMeasure);

    // Prepare measures array
    const measures = Array.from({ length: numMeasures }, () => []);

    // Helper: MIDI note number to VexFlow key
    const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
    function midiToVexKey(midi) {
      const octave = Math.floor(midi / 12) - 1;
      const noteName = noteNames[midi % 12];
      return { key: noteName.replace('#', ''), accidental: noteName.includes('#') ? '#' : null, octave };
    }

    // Place notes in measures and collect flat note info for highlighting
    const flatNotes = [];
    notes.forEach((note, i) => {
      const measureIdx = Math.floor(note.ticks / ticksPerMeasure);
      const { key, accidental, octave } = midiToVexKey(note.midi);
      // Duration to VexFlow duration string (with tolerance)
      let durQ = note.durationTicks / ticksPerBeat;
      let duration = 'q';
      const tol = 0.18; // tolerance for floating point errors
      if (Math.abs(durQ - 4) < tol) duration = 'w';
      else if (Math.abs(durQ - 2) < tol) duration = 'h';
      else if (Math.abs(durQ - 1) < tol) duration = 'q';
      else if (Math.abs(durQ - 0.5) < tol) duration = '8';
      else if (Math.abs(durQ - 0.25) < tol) duration = '16';
      else if (durQ > 4) duration = 'w';
      else if (durQ > 2) duration = 'h';
      else if (durQ > 1) duration = 'q';
      else if (durQ > 0.5) duration = '8';
      else duration = '16';
      const vexNote = new StaveNote({
        keys: [`${key}/${octave}`],
        duration
      });
      if (accidental) vexNote.addModifier(new Accidental(accidental), 0);
      const noteIdx = measures[measureIdx].length;
      measures[measureIdx].push(vexNote);
      flatNotes.push({
        note: vexNote,
        measureIdx,
        noteIdx,
        start: note.time,
        end: note.time + note.duration
      });
    });

    // Fill incomplete measures with rests and trim overfilled measures
    for (let m = 0; m < measures.length; m++) {
      let totalBeats = measures[m].reduce((sum, n) => {
        // Map VexFlow duration to beats
        const d = n.getDuration();
        if (d === 'w') return sum + 4;
        if (d === 'h') return sum + 2;
        if (d === 'q') return sum + 1;
        if (d === '8') return sum + 0.5;
        if (d === '16') return sum + 0.25;
        return sum;
      }, 0);
      // If overfilled, trim notes from the end
      while (totalBeats > beatsPerMeasure && measures[m].length > 0) {
        const last = measures[m].pop();
        const d = last.getDuration();
        if (d === 'w') totalBeats -= 4;
        else if (d === 'h') totalBeats -= 2;
        else if (d === 'q') totalBeats -= 1;
        else if (d === '8') totalBeats -= 0.5;
        else if (d === '16') totalBeats -= 0.25;
      }
      // If underfilled, add rests
      while (totalBeats < beatsPerMeasure) {
        let restDur = 'q';
        let restBeats = 1;
        if (beatsPerMeasure - totalBeats >= 1) {
          restDur = 'q'; restBeats = 1;
        } else if (beatsPerMeasure - totalBeats >= 0.5) {
          restDur = '8'; restBeats = 0.5;
        } else {
          restDur = '16'; restBeats = 0.25;
        }
        measures[m].push(new StaveNote({ keys: ['b/4'], duration: restDur + 'r' }));
        totalBeats += restBeats;
      }
    }

    return { measures, timeSignature: timeSig, flatNotes, lastNoteEndTime };
  };

  // Render the sheet music
  // Track last highlighted note index to avoid repeated triggers
  const lastHighlightRef = useRef(null);

  const renderSheetMusic = () => {
    if (!containerRef.current || !midiData) return;

    try {
      containerRef.current.innerHTML = '';
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(width, height);
      rendererRef.current = renderer;
      const context = renderer.getContext();
      context.setFont('Arial', 10);

      // Convert MIDI to VexFlow measures, time signature, and flatNotes
      const { measures, timeSignature, flatNotes, lastNoteEndTime } = convertMidiToVexFlow(midiData);

      // Smooth bar position calculation
      let barInfo = null;
      let highlightIdx = null;
      if (flatNotes.length > 0 && typeof currentTime === 'number') {
        // Find the two notes between which currentTime falls
        let idx = flatNotes.findIndex(n => currentTime < n.start);
        if (idx === -1) idx = flatNotes.length; // after last note
        let prev = flatNotes[idx - 1] || flatNotes[0];
        let next = flatNotes[idx] || flatNotes[flatNotes.length - 1];
        let t0 = prev.start;
        let t1 = next.start;
        let frac = t1 > t0 ? (currentTime - t0) / (t1 - t0) : 0;
        frac = Math.max(0, Math.min(1, frac));
        if (currentTime >= flatNotes[flatNotes.length - 1].end) {
          prev = flatNotes[flatNotes.length - 1];
          next = prev;
          frac = 1;
        }
        barInfo = { prev, next, frac, idx };
        // Highlight the note that the bar is closest to (prev)
        highlightIdx = idx - 1 >= 0 ? idx - 1 : 0;
      }

      // Fire onHighlightNote only when the highlighted note changes
      if (typeof onHighlightNote === 'function' && flatNotes.length > 0) {
        if (highlightIdx !== null && lastHighlightRef.current !== highlightIdx) {
          lastHighlightRef.current = highlightIdx;
          onHighlightNote(flatNotes[highlightIdx]);
        }
      }

      // End-of-playback detection
      if (typeof onPlaybackEnd === 'function' && currentTime > lastNoteEndTime + 0.01) {
        onPlaybackEnd();
      }

      if (measures.length > 0) {
        const staveWidth = Math.max(200, (width - 40) / measures.length);
        for (let m = 0; m < measures.length; m++) {
          const measureNotes = measures[m];
          // Create stave for this measure
          const stave = new Stave(10 + (m * staveWidth), 40, staveWidth);
          if (m === 0) {
            stave.addClef('treble').addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
          }
          stave.setContext(context).draw();
          // Create voice for this measure
          const voice = new Voice({ num_beats: timeSignature[0], beat_value: timeSignature[1] });
          voice.addTickables(measureNotes);
          // Format and justify the notes to fit the measure
          new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
          // Render voice
          voice.draw(context, stave);
          // Draw smooth bar after notes to prevent flicker
          if (barInfo && (barInfo.prev.measureIdx === m || (barInfo.prev.measureIdx < m && barInfo.next.measureIdx >= m))) {
            // Interpolate X between prev and next note, or keep at end if after last note
            const noteCount = measureNotes.length;
            let prevX = stave.getNoteStartX();
            let nextX = stave.getNoteStartX() + (staveWidth - 40);
            if (barInfo.prev.measureIdx === m) {
              prevX = stave.getNoteStartX() + (staveWidth - 40) * (barInfo.prev.noteIdx / noteCount);
            }
            if (barInfo.next.measureIdx === m) {
              nextX = stave.getNoteStartX() + (staveWidth - 40) * (barInfo.next.noteIdx / noteCount);
            }
            if (barInfo.prev.measureIdx < m && barInfo.next.measureIdx === m) {
              prevX = stave.getNoteStartX();
            }
            if (barInfo.prev.measureIdx === m && barInfo.frac === 1) {
              prevX = nextX;
            }
            const barX = prevX + (nextX - prevX) * barInfo.frac;
            const barY = stave.getYForLine(0) - 20;
            const barHeight = stave.getHeight() + 24;
            context.save();
            context.globalAlpha = 0.25;
            context.fillStyle = '#ffe066';
            context.fillRect(barX - 4, barY, 8, barHeight);
            context.restore();
          }
        }
      } else {
        context.fillText('No notes found in MIDI file', width / 2 - 80, height / 2);
      }
      setIsRendered(true);
    } catch (error) {
      console.error('Error rendering sheet music:', error);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: ${height}px; color: #666;">
            <div style="text-align: center;">
              <p>Error rendering sheet music</p>
              <p style="font-size: 12px;">${error.message}</p>
            </div>
          </div>
        `;
      }
    }
  };

  // Effect to render when MIDI data or currentTime changes
  useEffect(() => {
    if (midiData) {
      renderSheetMusic();
    }
    // eslint-disable-next-line
  }, [midiData, width, height, currentTime]);

  // Render a simple demo score if no MIDI data
  const renderDemoScore = () => {
    if (!containerRef.current) return;

    try {
      containerRef.current.innerHTML = '';

      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();

      // Create a stave
      const stave = new Stave(10, 40, width - 20);
      stave.addClef('treble').addTimeSignature('4/4');
      stave.setContext(context).draw();

      // Create some demo notes
      const notes = [
        new StaveNote({ keys: ['c/4'], duration: 'q' }),
        new StaveNote({ keys: ['d/4'], duration: 'q' }),
        new StaveNote({ keys: ['e/4'], duration: 'q' }),
        new StaveNote({ keys: ['f/4'], duration: 'q' })
      ];

      // Create a voice and add the notes
      const voice = new Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables(notes);

      // Format and justify the notes
      new Formatter().joinVoices([voice]).format([voice], width - 40);

      // Render voice
      voice.draw(context, stave);

      setIsRendered(true);
    } catch (error) {
      console.error('Error rendering demo score:', error);
    }
  };

  // Render demo if no MIDI data
  useEffect(() => {
    if (!midiData) {
      renderDemoScore();
    }
  }, [width, height]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div 
        ref={containerRef}
        className="sheet-music-container"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export default SheetMusicRenderer;

