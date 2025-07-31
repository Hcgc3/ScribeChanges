import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

const SheetMusicRenderer = ({ midiData, width = 800, height = 600 }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  // Convert MIDI data to VexFlow notes
  const convertMidiToVexFlow = (midiData) => {
    if (!midiData || !midiData.tracks || midiData.tracks.length === 0) {
      return [];
    }

    const notes = [];
    
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
      return [];
    }

    // Convert first few notes and ensure they fit in measures
    const maxNotes = 16; // Limit for demo - 4 measures of 4 quarter notes each
    const selectedNotes = trackWithNotes.notes.slice(0, maxNotes);
    
    selectedNotes.forEach((note, index) => {
      try {
        // Convert MIDI note number to VexFlow note format
        const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
        const octave = Math.floor(note.midi / 12) - 1;
        const noteName = noteNames[note.midi % 12];
        const vexNote = noteName + '/' + octave;

        // Use quarter notes for simplicity and consistency
        const vexFlowNote = new StaveNote({
          keys: [vexNote],
          duration: 'q'
        });

        // Add accidentals if needed
        if (noteName.includes('#')) {
          vexFlowNote.addModifier(new Accidental('#'), 0);
        }

        notes.push(vexFlowNote);
      } catch (error) {
        console.warn('Error converting note:', note, error);
      }
    });

    // Ensure we have notes in multiples of 4 for 4/4 time signature
    while (notes.length % 4 !== 0 && notes.length < 16) {
      // Add rest notes to complete the measure
      notes.push(new StaveNote({ keys: ['b/4'], duration: 'qr' }));
    }

    return notes.slice(0, 16); // Limit to 16 notes (4 measures of 4 quarter notes)
  };

  // Render the sheet music
  const renderSheetMusic = () => {
    if (!containerRef.current || !midiData) return;

    try {
      // Clear previous render
      containerRef.current.innerHTML = '';

      // Create VexFlow renderer
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(width, height);
      rendererRef.current = renderer;

      const context = renderer.getContext();
      context.setFont('Arial', 10);

      // Convert MIDI to VexFlow notes
      const notes = convertMidiToVexFlow(midiData);

      if (notes.length > 0) {
        // Calculate number of measures (assuming 4 notes per measure for 4/4 time)
        const notesPerMeasure = 4;
        const numMeasures = Math.ceil(notes.length / notesPerMeasure);
        const staveWidth = Math.max(200, (width - 40) / numMeasures);

        // Create measures and render them
        for (let m = 0; m < numMeasures; m++) {
          const startNote = m * notesPerMeasure;
          const endNote = Math.min(startNote + notesPerMeasure, notes.length);
          const measureNotes = notes.slice(startNote, endNote);

          // Fill incomplete measures with rests
          while (measureNotes.length < notesPerMeasure) {
            measureNotes.push(new StaveNote({ keys: ['b/4'], duration: 'qr' }));
          }

          // Create stave for this measure
          const stave = new Stave(10 + (m * staveWidth), 40, staveWidth);
          
          // Add clef and time signature only to first measure
          if (m === 0) {
            stave.addClef('treble').addTimeSignature('4/4');
          }
          
          stave.setContext(context).draw();

          // Create voice for this measure
          const voice = new Voice({ num_beats: 4, beat_value: 4 });
          voice.addTickables(measureNotes);

          // Format and justify the notes to fit the measure
          new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);

          // Render voice
          voice.draw(context, stave);
        }
      } else {
        // Draw placeholder text if no notes
        context.fillText('No notes found in MIDI file', width / 2 - 80, height / 2);
      }

      setIsRendered(true);
    } catch (error) {
      console.error('Error rendering sheet music:', error);
      // Draw error message
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

  // Effect to render when MIDI data changes
  useEffect(() => {
    if (midiData) {
      renderSheetMusic();
    }
  }, [midiData, width, height]);

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

