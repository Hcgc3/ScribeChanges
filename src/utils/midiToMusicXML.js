// Basic MIDI to MusicXML converter (monophonic, single track, quarter notes only)
// Limitations: no polyphony, no ties, no rests, no time signature changes

let Midi;
try {
  // Try ES module import (for browser/webpack)
  ({ Midi } = await import('@tonejs/midi'));
} catch (e) {
  // Fallback for Node.js CommonJS
  const pkg = require('@tonejs/midi');
  Midi = pkg.Midi;
}

function midiNoteToXmlPitch(midi) {
  const stepNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const step = stepNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  let alter = '';
  let baseStep = step;
  if (step.includes('#')) {
    baseStep = step[0];
    alter = '<alter>1</alter>';
  }
  return `<pitch><step>${baseStep}</step>${alter}<octave>${octave}</octave></pitch>`;
}

function durationToXmlTypeAndDivs(durationDivs, divisions) {
  // Map duration in divisions to MusicXML type/divs/dot
  // Returns {type, divs, dot}
  const table = [
    { type: 'whole', divs: divisions * 4 },
    { type: 'half', divs: divisions * 2 },
    { type: 'quarter', divs: divisions },
    { type: 'eighth', divs: divisions / 2 },
    { type: '16th', divs: divisions / 4 },
    { type: '32nd', divs: divisions / 8 },
  ];
  for (const entry of table) {
    // Dotted
    if (Math.abs(durationDivs - entry.divs * 1.5) < 2) return { type: entry.type, divs: entry.divs * 1.5, dot: true };
    if (Math.abs(durationDivs - entry.divs) < 2) return { type: entry.type, divs: entry.divs, dot: false };
  }
  // Default to quarter
  return { type: 'quarter', divs: divisions, dot: false };
}


export function midiToMusicXML(midi) {
  if (!midi || !midi.tracks || midi.tracks.length === 0) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<score-partwise version="3.1">\n  <part-list>\n    <score-part id=\"P1\"><part-name>Music</part-name></score-part>\n  </part-list>\n  <part id=\"P1\">\n    <measure number=\"1\">\n      <attributes>\n        <divisions>480</divisions>\n        <key><fifths>0</fifths></key>\n        <time><beats>4</beats><beat-type>4</beat-type></time>\n        <clef><sign>G</sign><line>2</line></clef>\n      </attributes>\n      <note><rest/><duration>1920</duration><type>whole</type></note>\n    </measure>\n  </part>\n</score-partwise>';
  }
  const track = midi.tracks.find(t => t.notes && t.notes.length > 0);
  if (!track || !track.notes || track.notes.length === 0) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<score-partwise version="3.1">\n  <part-list>\n    <score-part id=\"P1\"><part-name>Music</part-name></score-part>\n  </part-list>\n  <part id=\"P1\">\n    <measure number=\"1\">\n      <attributes>\n        <divisions>480</divisions>\n        <key><fifths>0</fifths></key>\n        <time><beats>4</beats><beat-type>4</beat-type></time>\n        <clef><sign>G</sign><line>2</line></clef>\n      </attributes>\n      <note><rest/><duration>1920</duration><type>whole</type></note>\n    </measure>\n  </part>\n</score-partwise>';
  }
  const notes = track.notes;
  // Build a granular event timeline: all note on/off, plus all unique note start/end times
  const times = new Set();
  for (const note of notes) {
    times.add(Number(note.time.toFixed(6)));
    times.add(Number((note.time + note.duration).toFixed(6)));
  }
  // Add all note on/off events for all tracks (for polyphony/overlap safety)
  for (const t of midi.tracks) {
    if (!t.notes) continue;
    for (const n of t.notes) {
      times.add(Number(n.time.toFixed(6)));
      times.add(Number((n.time + n.duration).toFixed(6)));
    }
  }
  const sortedTimes = Array.from(times).sort((a, b) => a - b);
  // For each interval, determine which notes are sounding
  let xml = `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<score-partwise version=\"3.1\">\n  <part-list>\n    <score-part id=\"P1\"><part-name>Music</part-name></score-part>\n  </part-list>\n  <part id=\"P1\">`;
  const divisions = midi.header.ppq || 480;
  let measureNum = 1;
  let measureDivs = 0;
  const measureMaxDivs = divisions * 4; // 4/4
  xml += `\n    <measure number=\"${measureNum}\">\n      <attributes>\n        <divisions>${divisions}</divisions>\n        <key><fifths>0</fifths></key>\n        <time><beats>4</beats><beat-type>4</beat-type></time>\n        <clef><sign>G</sign><line>2</line></clef>\n      </attributes>`;
  let outputNote = false;
  let lastNoteEnd = 0;
  for (const note of notes) {
    // Insert rest if there is a gap before this note
    const noteStartDivs = Math.round(note.time * divisions);
    if (noteStartDivs > lastNoteEnd) {
      let restLeft = noteStartDivs - lastNoteEnd;
      while (restLeft > 0) {
        const spaceLeft = measureMaxDivs - measureDivs;
        const chunk = Math.min(restLeft, spaceLeft);
        const { type, divs, dot } = durationToXmlTypeAndDivs(chunk, divisions);
        if (measureDivs + divs > measureMaxDivs) {
          xml += `\n    </measure>\n    <measure number=\"${++measureNum}\">`;
          measureDivs = 0;
        }
        xml += `\n      <note><rest/><duration>${divs}</duration><type>${type}</type>${dot ? '<dot/>' : ''}</note>`;
        measureDivs += divs;
        restLeft -= divs;
      }
    }
    // Output the note
    outputNote = true;
    let noteDivs = Math.round(note.duration * divisions);
    let remaining = noteDivs;
    let tieStart = false, tieStop = false;
    while (remaining > 0) {
      const spaceLeft = measureMaxDivs - measureDivs;
      const chunk = Math.min(remaining, spaceLeft);
      const { type, divs, dot } = durationToXmlTypeAndDivs(chunk, divisions);
      if (measureDivs + divs > measureMaxDivs) {
        xml += `\n    </measure>\n    <measure number=\"${++measureNum}\">`;
        measureDivs = 0;
      }
      let tieTag = '';
      if (remaining < noteDivs) tieStop = true;
      if (remaining > chunk) tieStart = true;
      if (tieStart || tieStop) {
        tieTag += tieStart ? '<tie type=\"start\"/>' : '';
        tieTag += tieStop ? '<tie type=\"stop\"/>' : '';
      }
      xml += `\n      <note>${midiNoteToXmlPitch(note.midi)}<duration>${divs}</duration><type>${type}</type>${dot ? '<dot/>' : ''}${tieTag}`;
      if (tieStart || tieStop) {
        xml += '<notations>';
        if (tieStart) xml += '<tied type=\"start\"/>';
        if (tieStop) xml += '<tied type=\"stop\"/>';
        xml += '</notations>';
      }
      xml += '</note>';
      measureDivs += divs;
      remaining -= divs;
    }
    lastNoteEnd = noteStartDivs + noteDivs;
  }
  // If there is remaining space in the last measure, fill with rest
  if (measureDivs < measureMaxDivs) {
    let restLeft = measureMaxDivs - measureDivs;
    while (restLeft > 0) {
      const chunk = restLeft;
      const { type, divs, dot } = durationToXmlTypeAndDivs(chunk, divisions);
      xml += `\n      <note><rest/><duration>${divs}</duration><type>${type}</type>${dot ? '<dot/>' : ''}</note>`;
      restLeft -= divs;
    }
  }
  if (!outputNote) {
    // Fallback: output a placeholder note if no notes were output
    xml += `\n      <note>${midiNoteToXmlPitch(60)}<duration>${divisions}</duration><type>quarter</type></note>`;
  }
  xml += '\n    </measure>\n  </part>\n</score-partwise>';
  return xml;
}
