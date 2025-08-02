import React, { useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

/**
 * SheetMusicOSMD renders MusicXML using OSMD and exposes a cursor API.
 * Props:
 *   musicXML: string (MusicXML data as string)
 *   currentTime: number (current playback time in seconds)
 *   onCursorNote: function (called with note info when cursor moves)
 */
const SheetMusicOSMD = ({ musicXML, currentTime, onCursorNote }) => {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const lastCursorNoteRef = useRef(null);

  // Load and render MusicXML
  useEffect(() => {
    if (!musicXML || !containerRef.current) return;
    if (!osmdRef.current) {
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawPartNames: false,
        drawFingerings: false,
        drawMeasureNumbers: true,
        drawCredits: false,
        drawMetronomeMarks: true,
      });
    }
    osmdRef.current.load(musicXML).then(() => {
      osmdRef.current.render();
      osmdRef.current.cursor.show();
    });
  }, [musicXML]);

  // Move cursor based on currentTime
  useEffect(() => {
    if (!osmdRef.current || !osmdRef.current.cursor || !musicXML) return;
    const osmd = osmdRef.current;
    // Find the closest note to currentTime
    const notes = osmd.cursor.NotesUnderCursor();
    // TODO: Implement mapping from currentTime to cursor position
    // For now, just keep cursor visible
    osmd.cursor.show();
    // Optionally, call onCursorNote with note info
    if (onCursorNote && notes && notes.length > 0) {
      const note = notes[0];
      if (lastCursorNoteRef.current !== note) {
        lastCursorNoteRef.current = note;
        onCursorNote(note);
      }
    }
  }, [currentTime, musicXML, onCursorNote]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'white' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default SheetMusicOSMD;
