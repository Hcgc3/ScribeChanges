import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

const SheetMusicRenderer = ({ midiData, width = 800, height = 600 }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  // Convert MIDI data to VexFlow notes
  const convertMidiToVexFlow = (midiData) => {
    if (!midiData || !midiData.tracks || midiData.tracks.length === 0) {
      console.log('No MIDI data or tracks available:', midiData);
      return [];
    }

    console.log('MIDI data structure:', midiData);
    console.log('Number of tracks:', midiData.tracks.length);
    
    const notes = [];
    
    // Find the first track with notes
    let trackWithNotes = null;
    for (let i = 0; i < midiData.tracks.length; i++) {
      const track = midiData.tracks[i];
      console.log(`Track ${i}:`, track);
      console.log(`Track ${i} notes length:`, track.notes ? track.notes.length : 'no notes property');
      
      if (track.notes && track.notes.length > 0) {
        trackWithNotes = track;
        console.log(`Using track ${i} with ${track.notes.length} notes`);
        break;
      }
    }
    
    if (!trackWithNotes) {
      console.log('No tracks with notes found');
      return [];
    }

    trackWithNotes.notes.forEach((note, index) => {
      try {
        // Convert MIDI note number to VexFlow note format
        const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
        const octave = Math.floor(note.midi / 12) - 1;
        const noteName = noteNames[note.midi % 12];
        const vexNote = noteName + '/' + octave;

        // Determine note duration based on MIDI duration
        let duration = 'q'; // quarter note default
        if (note.duration <= 0.25) duration = '16';
        else if (note.duration <= 0.5) duration = '8';
        else if (note.duration <= 1) duration = 'q';
        else if (note.duration <= 2) duration = 'h';
        else duration = 'w';

        const vexFlowNote = new StaveNote({
          keys: [vexNote],
          duration: duration
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

    return notes.slice(0, 8); // Limit to 8 notes for demo
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

      // Create a stave
      const stave = new Stave(10, 40, width - 20);
      stave.addClef('treble').addTimeSignature('4/4');
      stave.setContext(context).draw();

      // Convert MIDI to VexFlow notes
      const notes = convertMidiToVexFlow(midiData);

      if (notes.length > 0) {
        // Create a voice in 4/4 and add the notes
        const voice = new Voice({ num_beats: 4, beat_value: 4 });
        voice.addTickables(notes);

        // Format and justify the notes to fit the stave
        new Formatter().joinVoices([voice]).format([voice], width - 40);

        // Render voice
        voice.draw(context, stave);
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

