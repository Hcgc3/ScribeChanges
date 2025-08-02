// CommonJS version of midiToMusicXML for CLI testing
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

function durationToXmlTypeAndDivs(durationQ) {
  if (Math.abs(durationQ - 4) < 0.2) return { type: 'whole', divs: 4 };
  if (Math.abs(durationQ - 2) < 0.2) return { type: 'half', divs: 2 };
  if (Math.abs(durationQ - 1) < 0.2) return { type: 'quarter', divs: 1 };
  if (Math.abs(durationQ - 0.5) < 0.2) return { type: 'eighth', divs: 0.5 };
  if (Math.abs(durationQ - 0.25) < 0.2) return { type: '16th', divs: 0.25 };
  return { type: 'quarter', divs: 1 };
}

function midiToMusicXML(midi) {
  if (!midi || !midi.tracks || midi.tracks.length === 0) return '';
  const track = midi.tracks.find(t => t.notes && t.notes.length > 0);
  if (!track) return '';
  const notes = track.notes;
  const times = new Set();
  for (const note of notes) {
    times.add(Number(note.time.toFixed(6)));
    times.add(Number((note.time + note.duration).toFixed(6)));
  }
  const sortedTimes = Array.from(times).sort((a, b) => a - b);
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<score-partwise version="3.1">\n  <part-list>\n    <score-part id=\"P1\"><part-name>Music</part-name></score-part>\n  </part-list>\n  <part id=\"P1\">`;
  const divisions = 4;
  let measureNum = 1;
  let measureDivs = 0;
  const measureMaxDivs = divisions * 4;
  xml += `\n    <measure number=\"${measureNum}\">\n      <attributes>\n        <divisions>${divisions}</divisions>\n        <key><fifths>0</fifths></key>\n        <time><beats>4</beats><beat-type>4</beat-type></time>\n        <clef><sign>G</sign><line>2</line></clef>\n      </attributes>`;
  for (let i = 0; i < sortedTimes.length - 1; i++) {
    const t0 = sortedTimes[i];
    const t1 = sortedTimes[i + 1];
    const durQ = t1 - t0;
    if (durQ < 1e-6) continue;
    const sounding = notes.filter(n => n.time <= t0 + 1e-6 && n.time + n.duration > t0 + 1e-6);
    if (sounding.length === 0) {
      let restLeft = durQ;
      while (restLeft > 0) {
        const { type, divs } = durationToXmlTypeAndDivs(Math.min(restLeft, 4));
        if (measureDivs + divs * divisions > measureMaxDivs) {
          xml += `\n    </measure>\n    <measure number=\"${++measureNum}\">`;
          measureDivs = 0;
        }
        xml += `\n      <note><rest/><duration>${divs * divisions}</duration><type>${type}</type></note>`;
        measureDivs += divs * divisions;
        restLeft -= divs;
      }
    } else {
      const notesStarting = sounding.filter(n => Math.abs(n.time - t0) < 1e-6);
      if (notesStarting.length === 0) continue;
      let left = durQ;
      while (left > 0) {
        const { type, divs } = durationToXmlTypeAndDivs(Math.min(left, 4));
        if (measureDivs + divs * divisions > measureMaxDivs) {
          xml += `\n    </measure>\n    <measure number=\"${++measureNum}\">`;
          measureDivs = 0;
        }
        for (let j = 0; j < notesStarting.length; j++) {
          const note = notesStarting[j];
          xml += `\n      <note${j > 0 ? '<chord/>' : ''}>${midiNoteToXmlPitch(note.midi)}<duration>${divs * divisions}</duration><type>${type}</type></note>`;
        }
        measureDivs += divs * divisions;
        left -= divs;
      }
    }
  }
  xml += '\n    </measure>\n  </part>\n</score-partwise>';
  return xml;
}

module.exports = { midiToMusicXML };
