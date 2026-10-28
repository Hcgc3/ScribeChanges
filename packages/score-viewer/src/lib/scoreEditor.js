// Score editing on the MusicXML itself (OSMD has no editing API): every edit changes
// the XML document, which is then loaded again. Works like MuseScore's note input:
// a note is written over whatever is at that time position in its staff/voice, the
// part of the measure it overwrites is cut, and gaps are filled with rests.
//
// Times are in MusicXML divisions; durations given as quarters (1 = quarter note).

const STEPS = 'CDEFGAB';
const STEP_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_ORDER = 'FCGDAEB';
const FLAT_ORDER = 'BEADGCF';
// Note types by length in quarters
const TYPES = [[8, 'breve'], [4, 'whole'], [2, 'half'], [1, 'quarter'], [0.5, 'eighth'], [0.25, '16th'], [0.125, '32nd'], [0.0625, '64th']];
export const DURATION_QUARTERS = Object.fromEntries(TYPES.map(([q, t]) => [t, q]));
const MIN_DIVISIONS = 96; // enough for 64ths, dotted 32nds and triplets

let doc = null;

// ---- document ------------------------------------------------------------------------------

export function loadEditor(xml) {
  const parsed = new DOMParser().parseFromString(xml, 'application/xml');
  if (parsed.querySelector('parsererror') || !parsed.querySelector('score-partwise')) {
    throw new Error('Só é possível editar MusicXML (partwise) não comprimido');
  }
  doc = parsed;
  // Rescale up front: positions computed before the first edit must use the final divisions
  [...doc.querySelectorAll('score-partwise > part')].forEach(ensureDivisions);
  return doc;
}

export const hasEditor = () => !!doc;
export const getEditorXml = () => (doc ? new XMLSerializer().serializeToString(doc) : null);
export const closeEditor = () => { doc = null; };

const el = (name, text, attrs = {}) => {
  const node = doc.createElement(name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text != null) node.textContent = String(text);
  return node;
};
const child = (node, name) => [...node.children].find((c) => c.tagName === name);
const num = (node, name, fallback = 0) => {
  const c = child(node, name);
  return c ? Number(c.textContent) : fallback;
};

const partAt = (partIndex) => [...doc.querySelectorAll('score-partwise > part')][partIndex];
const measuresOf = (part) => [...part.children].filter((c) => c.tagName === 'measure');

// Multiply every duration in a part so it has at least MIN_DIVISIONS per quarter
function ensureDivisions(part) {
  const divisionsNodes = [...part.querySelectorAll('attributes > divisions')];
  const current = divisionsNodes.length ? Number(divisionsNodes[0].textContent) : 1;
  if (current >= MIN_DIVISIONS) return;
  const factor = Math.ceil(MIN_DIVISIONS / current);
  divisionsNodes.forEach((d) => { d.textContent = String(Number(d.textContent) * factor); });
  part.querySelectorAll('note > duration, backup > duration, forward > duration, direction > offset, harmony > offset')
    .forEach((d) => { d.textContent = String(Math.round(Number(d.textContent) * factor)); });
}

// Attributes in force at measure `m` (they carry over from earlier measures)
function contextAt(part, m) {
  const ctx = { divisions: 1, fifths: 0, beats: 4, beatType: 4, staves: 1 };
  measuresOf(part).slice(0, m + 1).forEach((measure) => {
    [...measure.children].filter((c) => c.tagName === 'attributes').forEach((a) => {
      if (child(a, 'divisions')) ctx.divisions = num(a, 'divisions');
      const key = child(a, 'key');
      if (key && child(key, 'fifths')) ctx.fifths = num(key, 'fifths');
      const time = child(a, 'time');
      if (time && child(time, 'beats')) { ctx.beats = Number(child(time, 'beats').textContent.split('+')[0]); ctx.beatType = num(time, 'beat-type', 4); }
      if (child(a, 'staves')) ctx.staves = num(a, 'staves');
    });
  });
  ctx.measureLength = Math.round((ctx.beats * 4 * ctx.divisions) / ctx.beatType);
  return ctx;
}

// ---- pitches ---------------------------------------------------------------------------------

export const keyAlter = (step, fifths) => {
  if (fifths > 0 && SHARP_ORDER.slice(0, fifths).includes(step)) return 1;
  if (fifths < 0 && FLAT_ORDER.slice(0, -fifths).includes(step)) return -1;
  return 0;
};
export const pitchToMidi = (p) => (p.octave + 1) * 12 + STEP_SEMITONES[p.step] + (p.alter || 0);
// Spell a MIDI number in a key: sharps in sharp keys, flats in flat keys
export function midiToPitch(midi, fifths = 0) {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const natural = Object.entries(STEP_SEMITONES).find(([, s]) => s === pc);
  if (natural) {
    // Prefer the key's own alteration when it spells this pitch class (e.g. Cb in Gb major)
    return { step: natural[0], alter: 0, octave };
  }
  if (fifths >= 0) {
    const step = Object.entries(STEP_SEMITONES).find(([, s]) => s === pc - 1)[0];
    return { step, alter: 1, octave };
  }
  const step = Object.entries(STEP_SEMITONES).find(([, s]) => s === (pc + 1) % 12)[0];
  return { step, alter: -1, octave: pc === 11 ? octave + 1 : octave };
}
// Diatonic index (7 per octave, C4 = 28) <-> pitch, alteration taken from the key
export const diatonicToPitch = (d, fifths) => {
  const step = STEPS[((d % 7) + 7) % 7];
  return { step, alter: keyAlter(step, fifths), octave: Math.floor(d / 7) };
};
export const pitchToDiatonic = (p) => p.octave * 7 + STEPS.indexOf(p.step);
export const pitchName = (p) => {
  const names = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };
  const acc = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' }[p.alter || 0];
  return `${names[p.step]}${acc}${p.octave}`;
};

// ---- reading a measure ------------------------------------------------------------------------

const readPitch = (note) => {
  const p = child(note, 'pitch');
  return p ? { step: child(p, 'step').textContent, alter: num(p, 'alter', 0), octave: num(p, 'octave', 4) } : null;
};

const hasTie = (node, type) => [...node.children].some((c) => c.tagName === 'tie' && c.getAttribute('type') === type);

function readMeasure(measure) {
  const startNodes = [];
  const endNodes = [];
  const anchors = [];
  const groups = new Map(); // "staff|voice" -> events
  let pos = 0;
  let last = null;
  let seenNote = false;
  for (const node of [...measure.children]) {
    const tag = node.tagName;
    if (tag === 'note') {
      seenNote = true;
      if (child(node, 'chord') && last) {
        last.pitches.push(readPitch(node));
        last.nodes.push(node);
        last.tieStart.push(hasTie(node, 'start'));
        last.tieStop.push(hasTie(node, 'stop'));
        continue;
      }
      const staff = num(node, 'staff', 1);
      const voice = child(node, 'voice')?.textContent || '1';
      const duration = child(node, 'grace') ? 0 : num(node, 'duration', 0);
      const ev = {
        start: pos,
        duration,
        rest: !!child(node, 'rest'),
        pitches: child(node, 'rest') ? [] : [readPitch(node)],
        nodes: [node],
        tieStart: [hasTie(node, 'start')],
        tieStop: [hasTie(node, 'stop')],
        staff,
        voice,
        complex: !!(child(node, 'grace') || child(node, 'time-modification')),
      };
      const key = `${staff}|${voice}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(ev);
      pos += duration;
      last = ev;
    } else if (tag === 'backup') {
      pos -= num(node, 'duration');
    } else if (tag === 'forward') {
      pos += num(node, 'duration');
    } else if (tag === 'barline') {
      (node.getAttribute('location') === 'left' ? startNodes : endNodes).push(node);
    } else if (!seenNote && (tag === 'attributes' || tag === 'print')) {
      startNodes.push(node);
    } else {
      anchors.push({ node, pos });
    }
  }
  return { startNodes, endNodes, anchors, groups };
}

// ---- durations --------------------------------------------------------------------------------

// Note type + dots for a duration in quarters (null if not a single plain value)
export function typeFor(quarters) {
  for (let dots = 0; dots <= 2; dots++) {
    const base = quarters / (2 - 2 ** -dots);
    const match = TYPES.find(([q]) => Math.abs(q - base) < 1e-9);
    if (match) return { type: match[1], dots };
  }
  return null;
}

// Split a duration (divisions) into plain note values, largest first
function splitDuration(duration, divisions) {
  const parts = [];
  let left = duration;
  while (left > 0) {
    const q = left / divisions;
    const exact = typeFor(q);
    if (exact) { parts.push(left); break; }
    const fit = TYPES.find(([tq]) => tq * divisions <= left + 1e-9);
    if (!fit) { parts.push(left); break; }
    const d = Math.round(fit[0] * divisions);
    parts.push(d);
    left -= d;
  }
  return parts;
}

// ---- writing ------------------------------------------------------------------------------------

// Children of the original <note> worth keeping when a note is rewritten (new value,
// pitch, tie...): notehead, articulations/ornaments/slurs/fingering, lyrics
function carryExtras(n, original, tieStart, tieStop) {
  const notehead = original && child(original, 'notehead');
  if (notehead) n.insertBefore(notehead.cloneNode(true), child(n, 'staff') || child(n, 'beam') || null);
  const kept = original ? [...(child(original, 'notations')?.children || [])].filter((c) => c.tagName !== 'tied') : [];
  if (tieStart || tieStop || kept.length) {
    const notations = el('notations');
    if (tieStop) notations.appendChild(el('tied', null, { type: 'stop' }));
    if (tieStart) notations.appendChild(el('tied', null, { type: 'start' }));
    kept.forEach((c) => notations.appendChild(c.cloneNode(true)));
    n.appendChild(notations);
  }
  if (original) [...original.children].filter((c) => c.tagName === 'lyric').forEach((c) => n.appendChild(c.cloneNode(true)));
}

function noteNode(ev, pitch, { chord, divisions, fifths, tieStart, tieStop, wholeMeasureRest, stem, original }) {
  const n = el('note');
  if (chord) n.appendChild(el('chord'));
  if (pitch) {
    const p = el('pitch');
    p.appendChild(el('step', pitch.step));
    if (pitch.alter) p.appendChild(el('alter', pitch.alter));
    p.appendChild(el('octave', pitch.octave));
    n.appendChild(p);
  } else {
    n.appendChild(el('rest', null, wholeMeasureRest ? { measure: 'yes' } : {}));
  }
  n.appendChild(el('duration', ev.duration));
  if (tieStop) n.appendChild(el('tie', null, { type: 'stop' }));
  if (tieStart) n.appendChild(el('tie', null, { type: 'start' }));
  n.appendChild(el('voice', ev.voice));
  const t = typeFor(ev.duration / divisions);
  if (t && !wholeMeasureRest) {
    n.appendChild(el('type', t.type));
    for (let i = 0; i < t.dots; i++) n.appendChild(el('dot'));
  }
  if (pitch) {
    const keyA = keyAlter(pitch.step, fifths);
    if ((pitch.alter || 0) !== keyA) {
      const names = { '-2': 'flat-flat', '-1': 'flat', 0: 'natural', 1: 'sharp', 2: 'double-sharp' };
      n.appendChild(el('accidental', names[pitch.alter || 0]));
    }
    if (stem) n.appendChild(el('stem', stem));
  }
  if (ev.staffCount > 1) n.appendChild(el('staff', ev.staff));
  (ev.beams || []).forEach(([number, value]) => n.appendChild(el('beam', value, { number })));
  if (pitch) carryExtras(n, original, tieStart, tieStop);
  return n;
}

// Beam eighths and shorter inside each beat (dotted quarter in compound time)
function computeBeams(events, ctx) {
  const { divisions, beats, beatType } = ctx;
  const compound = beatType === 8 && beats % 3 === 0 && beats > 3;
  const beat = compound ? divisions * 1.5 : divisions;
  events.forEach((ev) => { ev.beams = []; });
  const beamable = (ev) => !ev.rest && ev.duration < divisions - 1e-9 && typeFor(ev.duration / divisions);
  let i = 0;
  while (i < events.length) {
    const window = Math.floor(events[i].start / beat);
    const run = [];
    while (i < events.length && beamable(events[i]) && Math.floor(events[i].start / beat) === window
      && Math.floor((events[i].start + events[i].duration - 1) / beat) === window) {
      run.push(events[i]);
      i++;
    }
    if (run.length >= 2) {
      run.forEach((ev, k) => {
        ev.beams.push([1, k === 0 ? 'begin' : k === run.length - 1 ? 'end' : 'continue']);
        // Secondary beams for 16ths and shorter
        if (ev.duration / divisions <= 0.25 + 1e-9) {
          const prev = run[k - 1] && run[k - 1].duration / divisions <= 0.25 + 1e-9;
          const next = run[k + 1] && run[k + 1].duration / divisions <= 0.25 + 1e-9;
          ev.beams.push([2, prev && next ? 'continue' : prev ? 'end' : next ? 'begin' : (k === 0 ? 'forward hook' : 'backward hook')]);
        }
      });
    }
    if (!run.length) i++;
  }
}

// Where <stem> goes inside an existing <note> (MusicXML element order)
const AFTER_STEM = ['notehead', 'notehead-text', 'staff', 'beam', 'notations', 'lyric', 'play', 'listen'];

function emitEvent(target, ev, ctx, staffCount, wholeMeasureRest, stem) {
  ev.staffCount = staffCount;
  if (ev.nodes && !ev.modified) {
    // Unchanged: keep the original nodes (lyrics, articulations...), only beams are redone
    ev.nodes.forEach((node) => {
      node.querySelectorAll(':scope > beam').forEach((b) => b.remove());
      if (stem && !ev.rest) {
        node.querySelectorAll(':scope > stem').forEach((st) => st.remove());
        const before = [...node.children].find((c) => AFTER_STEM.includes(c.tagName)) || null;
        node.insertBefore(el('stem', stem), before);
      }
      if (ev.beams?.length && !child(node, 'chord')) {
        const before = child(node, 'notations') || child(node, 'lyric') || null;
        ev.beams.forEach(([number, value]) => node.insertBefore(el('beam', value, { number }), before));
      }
      target.appendChild(node);
    });
    return;
  }
  if (ev.rest) {
    target.appendChild(noteNode(ev, null, { divisions: ctx.divisions, fifths: ctx.fifths, wholeMeasureRest }));
    return;
  }
  ev.pitches.forEach((pitch, k) => {
    target.appendChild(noteNode(ev, pitch, {
      chord: k > 0, divisions: ctx.divisions, fifths: ctx.fifths,
      tieStart: ev.tieStart?.[k], tieStop: ev.tieStop?.[k], stem,
      original: ev.nodes?.[k],
    }));
  });
}

function writeMeasure(measure, parsed, ctx, editedKey) {
  [...measure.children].forEach((c) => c.remove());
  parsed.startNodes.forEach((n) => measure.appendChild(n));
  const keys = [...parsed.groups.keys()].sort((a, b) => {
    const [sa, va] = a.split('|').map(Number);
    const [sb, vb] = b.split('|').map(Number);
    return sa - sb || va - vb;
  });
  const anchors = [...parsed.anchors].sort((a, b) => a.pos - b.pos);
  // A staff with several voices: voices 1/3 stems up, 2/4 down (MuseScore)
  const stemOf = (key) => {
    const staff = key.split('|')[0];
    const staffKeys = keys.filter((k) => k.split('|')[0] === staff && parsed.groups.get(k).some((e) => !e.rest));
    const slot = staffKeys.indexOf(key);
    return staffKeys.length > 1 && slot >= 0 ? (slot % 2 === 0 ? 'up' : 'down') : null;
  };
  let pos = 0;
  keys.forEach((key, gi) => {
    const stem = stemOf(key);
    if (pos > 0) { const b = el('backup'); b.appendChild(el('duration', pos)); measure.appendChild(b); }
    let cursor = 0;
    const events = parsed.groups.get(key).sort((a, b) => a.start - b.start);
    if (key === editedKey) computeBeams(events, ctx);
    events.forEach((ev) => {
      if (gi === 0) while (anchors.length && anchors[0].pos <= ev.start) measure.appendChild(anchors.shift().node);
      if (ev.start > cursor) { const f = el('forward'); f.appendChild(el('duration', ev.start - cursor)); measure.appendChild(f); }
      const wholeRest = ev.rest && events.length === 1 && ev.duration === ctx.measureLength;
      emitEvent(measure, ev, ctx, ctx.staves, wholeRest, stem);
      cursor = ev.start + ev.duration;
    });
    if (gi === 0) anchors.splice(0).forEach((a) => measure.appendChild(a.node));
    pos = cursor;
  });
  parsed.endNodes.forEach((n) => measure.appendChild(n));
}

// Rests covering [from, to), aligned to the beat like engravers write them: at each
// point the longest plain (undotted) value that starts on a multiple of itself
// (in 4/4 after beat 1: a quarter rest, then a half rest; never a dotted half)
const restsBetween = (from, to, voice, staff, divisions) => {
  const out = [];
  let at = from;
  while (at < to) {
    const fit = TYPES.map(([q]) => Math.round(q * divisions))
      .find((d) => d > 0 && at % d === 0 && at + d <= to);
    const d = fit || splitDuration(to - at, divisions)[0];
    out.push({ start: at, duration: d, rest: true, pitches: [], staff, voice, modified: true });
    at += d;
  }
  return out;
};

// Same pitches over a non-plain duration: tied notes
const tiedNotes = (start, duration, pitches, voice, staff, divisions, last = {}) => {
  const parts = splitDuration(duration, divisions);
  let at = start;
  return parts.map((d, k) => {
    const ev = {
      start: at, duration: d, rest: false, pitches: pitches.map((p) => ({ ...p })), staff, voice, modified: true,
      tieStop: pitches.map(() => k > 0 || !!last.tieStop),
      tieStart: pitches.map(() => k < parts.length - 1 || !!last.tieStart),
    };
    at += d;
    return ev;
  });
};

// ---- edit operations ----------------------------------------------------------------------------

function editMeasure(partIndex, measureIndex, staff, requestedVoice, fn) {
  const part = partAt(partIndex);
  if (!part) throw new Error('Parte inexistente');
  ensureDivisions(part);
  const measure = measuresOf(part)[measureIndex];
  if (!measure) throw new Error('Compasso inexistente');
  const ctx = contextAt(part, measureIndex);
  const parsed = readMeasure(measure);
  // Callers resolve MuseScore's voice 1-4 to the file's voice number (voiceFor)
  const voice = String(requestedVoice);
  const key = `${staff}|${voice}`;
  let events = parsed.groups.get(key);
  if (!events) {
    events = restsBetween(0, ctx.measureLength, voice, staff, ctx.divisions);
    parsed.groups.set(key, events);
  }
  if (events.some((e) => e.complex)) throw new Error('Este compasso tem tercinas ou appogiaturas: ainda não é editável');
  const result = fn(events, ctx, voice);
  let next = result.events.sort((a, b) => a.start - b.start);
  // Deleting the last note of a voice gives it a single whole-measure rest back
  // (a rest whose value was changed on purpose stays as written)
  if (result.collapse && next.every((e) => e.rest) && next.some((e) => e.modified)) {
    next = [{ start: 0, duration: ctx.measureLength, rest: true, pitches: [], staff, voice, modified: true }];
  }
  parsed.groups.set(key, next);
  writeMeasure(measure, parsed, ctx, key);
  return { ...result.info, ctx };
}

// Write a note (pitches) or a rest (pitches = null) at `start` (divisions), MuseScore
// style. `chord`: add the pitch to the note already starting there instead.
// Returns where the input caret goes next.
export function writeAt({ partIndex, measureIndex, staff = 1, voice = '1', start, quarters, dots = 0, pitches = null, chord = false, tieStop = false }) {
  if (chord && pitches) {
    const added = writeSegment({ partIndex, measureIndex, staff, voice, start, pitches, chord: true });
    if (added) return added;
  }
  // A value longer than what's left of the measure continues in the next one(s),
  // tied over the barline (rests just continue)
  const { divisions } = measureInfo(partIndex, measureIndex);
  let left = Math.round(quarters * divisions * (2 - 2 ** -dots));
  let m = measureIndex;
  let at = start;
  let info = null;
  let first = true;
  while (left > 0 && m < measureCount(partIndex)) {
    const room = measureInfo(partIndex, m).measureLength - at;
    const length = Math.min(left, room);
    const continues = left > room && m + 1 < measureCount(partIndex);
    info = writeSegment({
      partIndex, measureIndex: m, staff, voice: info?.voice || voice, start: at, length, pitches,
      tieStop: first ? tieStop : !!pitches, tieStart: continues && !!pitches,
    });
    if (first) info.first = { ...info, start: at, measureIndex: m };
    first = false;
    left -= length;
    m += 1;
    at = 0;
  }
  return info && { ...info, firstMeasureIndex: measureIndex, firstStart: start };
}

// One measure's part of writeAt: `length` divisions (clamped to the measure end)
function writeSegment({ partIndex, measureIndex, staff, voice, start, length = 0, pitches = null, chord = false, tieStop = false, tieStart = false }) {
  return editMeasure(partIndex, measureIndex, staff, voice, (events, ctx, voice) => {
    const { divisions, measureLength } = ctx;
    if (chord && pitches) {
      const at = events.find((e) => e.start === start && !e.rest);
      if (at) {
        const midis = at.pitches.map(pitchToMidi);
        pitches.filter((p) => !midis.includes(pitchToMidi(p))).forEach((p) => {
          at.pitches.push(p);
          at.tieStart?.push(false);
          at.tieStop?.push(false);
        });
        at.modified = true;
        return { events, info: { measureIndex, start: start + at.duration, staff, voice, partIndex, pitches: at.pitches } };
      }
      return { events, info: null };
    }
    const end = Math.min(start + length, measureLength);
    const kept = [];
    events.forEach((ev) => {
      const evEnd = ev.start + ev.duration;
      if (evEnd <= start || ev.start >= end) { kept.push(ev); return; }
      if (ev.start < start) {
        // Cut the part before the new note
        kept.push(...(ev.rest
          ? restsBetween(ev.start, start, voice, staff, divisions)
          : tiedNotes(ev.start, start - ev.start, ev.pitches, voice, staff, divisions, { tieStop: ev.tieStop?.some(Boolean) })));
      }
      if (evEnd > end) kept.push(...restsBetween(end, evEnd, voice, staff, divisions)); // the rest of it becomes rests
    });
    // A rest of a value chosen on purpose is written as that value (dotted too)
    const exactRest = !pitches && typeFor((end - start) / divisions);
    const inserted = pitches
      ? tiedNotes(start, end - start, pitches, voice, staff, divisions, { tieStop, tieStart })
      : exactRest
        ? [{ start, duration: end - start, rest: true, pitches: [], staff, voice, modified: true }]
        : restsBetween(start, end, voice, staff, divisions);
    // A new value for the same note keeps its articulations, lyrics... (MuseScore)
    const replaced = pitches && events.find((e) => e.start === start && !e.rest);
    if (replaced && inserted[0] && replaced.pitches.map(pitchToMidi).join() === pitches.map(pitchToMidi).join()) {
      inserted[0].nodes = replaced.nodes;
    }
    const all = [...kept, ...inserted].sort((a, b) => a.start - b.start);
    // Fill any gap with rests
    const filled = [];
    let cursor = 0;
    all.forEach((ev) => {
      if (ev.start > cursor) filled.push(...restsBetween(cursor, ev.start, voice, staff, divisions));
      filled.push(ev);
      cursor = Math.max(cursor, ev.start + ev.duration);
    });
    if (cursor < measureLength) filled.push(...restsBetween(cursor, measureLength, voice, staff, divisions));
    return { events: filled, info: { measureIndex, start: end, staff, voice, partIndex, pitches } };
  });
}

// Note at `start` becomes a rest of the same length (MuseScore's Delete). With
// `pitch` and a chord, only that note of the chord goes.
export function deleteAt({ partIndex, measureIndex, staff = 1, voice = '1', start, pitch = null }) {
  return editMeasure(partIndex, measureIndex, staff, voice, (events, ctx, voice) => {
    const at = events.find((e) => e.start === start);
    if (!at || at.rest) return { events, info: null };
    if (pitch && at.pitches.length > 1) {
      const i = at.pitches.findIndex((p) => pitchToMidi(p) === pitchToMidi(pitch));
      if (i >= 0) {
        at.pitches.splice(i, 1);
        at.tieStart?.splice(i, 1);
        at.tieStop?.splice(i, 1);
        at.modified = true;
        return { events, info: { measureIndex, start, staff, voice, partIndex, pitches: at.pitches } };
      }
    }
    const rests = restsBetween(at.start, at.start + at.duration, voice, staff, ctx.divisions);
    return { events: events.filter((e) => e !== at).concat(rests), info: { measureIndex, start, staff, voice, partIndex }, collapse: true };
  });
}

// Move the note at `start` by semitones (respelled in the key); `pitchIndex`: one note of a chord
export function transposeAt({ partIndex, measureIndex, staff = 1, voice = '1', start, pitchIndex: index = null, pitch = null }, semitones) {
  return editMeasure(partIndex, measureIndex, staff, voice, (events, ctx, voice) => {
    const at = events.find((e) => e.start === start && !e.rest);
    if (!at) return { events, info: null };
    // A chord note by its pitch (selection) or by index (note input)
    const pitchIndex = pitch ? at.pitches.findIndex((p) => pitchToMidi(p) === pitchToMidi(pitch)) : index;
    at.pitches = at.pitches.map((p, i) => (pitchIndex == null || i === pitchIndex ? midiToPitch(pitchToMidi(p) + semitones, ctx.fifths) : p));
    at.modified = true;
    return { events, info: { measureIndex, start, staff, voice, partIndex, pitches: at.pitches, pitchIndex } };
  });
}

// Set the accidental of the note at `start` (alter -2..2); `pitchIndex`: one note of a chord
export function setAlterAt({ partIndex, measureIndex, staff = 1, voice = '1', start, pitchIndex: index = null, pitch = null }, alter) {
  return editMeasure(partIndex, measureIndex, staff, voice, (events, ctx, voice) => {
    const at = events.find((e) => e.start === start && !e.rest);
    if (!at) return { events, info: null };
    const pitchIndex = pitch ? at.pitches.findIndex((p) => pitchToMidi(p) === pitchToMidi(pitch)) : index;
    at.pitches = at.pitches.map((p, i) => (pitchIndex == null || i === pitchIndex ? { ...p, alter } : p));
    at.modified = true;
    return { events, info: { measureIndex, start, staff, voice, partIndex, pitches: at.pitches, pitchIndex } };
  });
}

// Tie the note at `start` to a new note of the same pitch right after it
export function tieFrom(target, quarters, dots) {
  const info = editMeasure(target.partIndex, target.measureIndex, target.staff, target.voice, (events) => {
    const at = events.find((e) => e.start === target.start && !e.rest);
    if (!at) return { events, info: null };
    at.tieStart = at.pitches.map(() => true);
    at.tieStop = at.tieStop || at.pitches.map(() => false);
    at.modified = true;
    return { events, info: { pitches: at.pitches, end: at.start + at.duration } };
  });
  if (!info) return null;
  const next = nextPosition({ ...target, start: info.end });
  if (!next) return null;
  return writeAt({ ...next, quarters, dots, pitches: info.pitches.map((p) => ({ ...p })), tieStop: true });
}

// The caret after `start` in a measure moves to the next measure at its end
export function nextPosition({ partIndex, measureIndex, staff, voice, start }) {
  const part = partAt(partIndex);
  const ctx = contextAt(part, measureIndex);
  if (start < ctx.measureLength) return { partIndex, measureIndex, staff, voice, start };
  if (measureIndex + 1 >= measuresOf(part).length) return null;
  return { partIndex, measureIndex: measureIndex + 1, staff, voice, start: 0 };
}

// The event (note/chord/rest) at a target, read without changing anything
function peekEvent({ partIndex, measureIndex, staff = 1, voice = '1', start }) {
  const part = partAt(partIndex);
  const measure = part && measuresOf(part)[measureIndex];
  if (!measure) return null;
  const events = readMeasure(measure).groups.get(`${staff}|${voice}`) || [];
  const ev = events.find((e) => e.start === start);
  return ev ? { ev, measure, ctx: contextAt(part, measureIndex) } : null;
}

// Tie (or untie) the note at `target` to the next one (MuseScore "+" on a selection):
// the next note of the same pitch gets tied; with no such note a new one is written
export function toggleTie(target) {
  const found = peekEvent(target);
  if (!found || found.ev.rest) return null;
  const { ev, ctx } = found;
  const end = ev.start + ev.duration;
  const next = end < ctx.measureLength
    ? { ...target, start: end }
    : target.measureIndex + 1 < measureCount(target.partIndex) ? { ...target, measureIndex: target.measureIndex + 1, start: 0 } : null;
  const after = next && peekEvent(next)?.ev;
  const midis = ev.pitches.map(pitchToMidi);
  const shared = after && !after.rest ? after.pitches.map(pitchToMidi).filter((m) => midis.includes(m)) : [];
  const tied = ev.tieStart.some(Boolean);
  const setFlags = (t, flag, list, value) => editMeasure(t.partIndex, t.measureIndex, t.staff, t.voice, (events) => {
    const at = events.find((e) => e.start === t.start && !e.rest);
    if (!at) return { events, info: null };
    at[flag] = at.pitches.map((p, i) => (list.includes(pitchToMidi(p)) ? value : !!at[flag]?.[i]));
    at.modified = true;
    return { events, info: { ...t, pitches: at.pitches } };
  });
  if (shared.length) {
    setFlags(target, 'tieStart', shared, !tied);
    setFlags(next, 'tieStop', shared, !tied);
    return { ...target, pitches: ev.pitches };
  }
  if (tied) return setFlags(target, 'tieStart', midis, false);
  return tieFrom(target, ev.duration / ctx.divisions, 0);
}

// ---- symbols (palettes) ---------------------------------------------------------------------

// MusicXML element order inside <note>, <notations> and <attributes>
const NOTE_ORDER = ['grace', 'chord', 'pitch', 'unpitched', 'rest', 'duration', 'tie', 'instrument', 'voice', 'type', 'dot',
  'accidental', 'time-modification', 'stem', 'notehead', 'notehead-text', 'staff', 'beam', 'notations', 'lyric', 'play', 'listen'];
const NOTATIONS_ORDER = ['tied', 'slur', 'tuplet', 'glissando', 'slide', 'ornaments', 'technical', 'articulations', 'dynamics',
  'fermata', 'arpeggiate', 'non-arpeggiate', 'accidental-mark', 'other-notation'];
const ATTRIBUTES_ORDER = ['footnote', 'level', 'divisions', 'key', 'time', 'staves', 'part-symbol', 'instruments', 'clef',
  'staff-details', 'transpose', 'directive', 'measure-style'];
const BARLINE_ORDER = ['bar-style', 'footnote', 'level', 'wavy-line', 'segno', 'coda', 'fermata', 'ending', 'repeat'];

function insertOrdered(parent, node, order) {
  const i = order.indexOf(node.tagName);
  const before = [...parent.children].find((c) => order.indexOf(c.tagName) > i) || null;
  parent.insertBefore(node, before);
  return node;
}
const ensureChild = (parent, name, order) => child(parent, name) || insertOrdered(parent, el(name), order);
const removeIfEmpty = (node) => { if (node && !node.children.length && !node.textContent.trim()) node.remove(); };

// <note> nodes a mark goes on: the chord's first note, every note, or the given pitch's
function markNodes(ev, { all = false, pitch = null } = {}) {
  if (all) return ev.nodes;
  if (pitch) {
    const i = ev.pitches.findIndex((p) => pitchToMidi(p) === pitchToMidi(pitch));
    if (i >= 0) return [ev.nodes[i]];
  }
  return [ev.nodes[0]];
}

// Toggle a notation on the note at `target`. mark: { group?: 'articulations' | 'ornaments' |
// 'technical', name, attrs?, text?, all?, pitchOnly?, replace?: names it replaces }
export function toggleNoteMark(target, mark) {
  const found = peekEvent(target);
  if (!found || found.ev.rest) return null;
  const nodes = markNodes(found.ev, { all: mark.all, pitch: mark.pitchOnly ? target.pitch : null });
  const has = (n) => {
    const notations = child(n, 'notations');
    const parent = mark.group ? notations && child(notations, mark.group) : notations;
    return parent ? [...parent.children].find((c) => c.tagName === mark.name && (mark.text == null || c.textContent === String(mark.text))) : null;
  };
  const present = nodes.every(has);
  nodes.forEach((n) => {
    if (present) {
      const node = has(n);
      const parent = node.parentElement;
      node.remove();
      if (mark.group) removeIfEmpty(parent);
      removeIfEmpty(child(n, 'notations'));
      return;
    }
    const notations = ensureChild(n, 'notations', NOTE_ORDER);
    const parent = mark.group ? ensureChild(notations, mark.group, NOTATIONS_ORDER) : notations;
    // Marks of the same family replace each other (e.g. one tremolo, one fingering)
    [...parent.children].filter((c) => (mark.replace || []).includes(c.tagName)).forEach((c) => c.remove());
    const node = el(mark.name, mark.text ?? null, mark.attrs || {});
    if (mark.group) parent.appendChild(node); else insertOrdered(parent, node, NOTATIONS_ORDER);
  });
  return { ...target, pitches: found.ev.pitches };
}

// Notehead shape of the selected note ('normal' removes it)
export function setNotehead(target, value) {
  const found = peekEvent(target);
  if (!found || found.ev.rest) return null;
  markNodes(found.ev, { pitch: target.pitch }).forEach((n) => {
    child(n, 'notehead')?.remove();
    if (value !== 'normal') insertOrdered(n, el('notehead', value), NOTE_ORDER);
  });
  return { ...target, pitches: found.ev.pitches };
}

// A <direction> at the note/rest at `target` (or at the measure end with at: 'end').
// types: [[name, text?, attrs?, children?]], sound: attributes of <sound>,
// replace: a direction-type name whose direction at the same place is replaced
export function addDirection(target, { types, placement = 'above', sound = null, at = 'note', replace = null }) {
  const found = peekEvent(target);
  const part = partAt(target.partIndex);
  const measure = found?.measure || (part && measuresOf(part)[target.measureIndex]);
  if (!measure) return null;
  const ctx = contextAt(part, target.measureIndex);
  const dir = el('direction', null, placement ? { placement } : {});
  types.forEach(([name, text, attrs, kids]) => {
    const dt = el('direction-type');
    const node = el(name, text ?? null, attrs || {});
    (kids || []).forEach(([k, t, a]) => node.appendChild(el(k, t ?? null, a || {})));
    dt.appendChild(node);
    dir.appendChild(dt);
  });
  if (ctx.staves > 1) dir.appendChild(el('staff', target.staff || 1));
  if (sound) dir.appendChild(el('sound', null, sound));
  if (at === 'end') {
    const barline = [...measure.children].find((c) => c.tagName === 'barline' && c.getAttribute('location') !== 'left');
    measure.insertBefore(dir, barline || null);
  } else if (at === 'start') {
    measure.insertBefore(dir, [...measure.children].find((c) => ['note', 'backup', 'forward'].includes(c.tagName)) || null);
  } else if (at === 'after' && found) {
    measure.insertBefore(dir, found.ev.nodes[found.ev.nodes.length - 1].nextSibling);
  } else {
    const before = found ? found.ev.nodes[0] : [...measure.children].find((c) => c.tagName === 'note') || null;
    if (replace && before) {
      for (let prev = before.previousElementSibling; prev && prev.tagName === 'direction'; prev = prev.previousElementSibling) {
        if (prev.querySelector(`direction-type > ${replace}`)) { prev.remove(); break; }
      }
    }
    measure.insertBefore(dir, before);
  }
  return { ...target };
}

// Lines over a range: slur, crescendo/diminuendo hairpin, 8va/8vb
export function addSpanner(from, to, kind) {
  const first = peekEvent(from);
  const last = peekEvent(to);
  if (!first || !last) return null;
  if (kind === 'slur') {
    if (first.ev.rest || last.ev.rest || (from.measureIndex === to.measureIndex && from.start === to.start)) return null;
    const add = (n, type) => insertOrdered(ensureChild(n, 'notations', NOTE_ORDER), el('slur', null, { type, number: 1 }), NOTATIONS_ORDER);
    add(first.ev.nodes[0], 'start');
    add(last.ev.nodes[0], 'stop');
    return { ...from };
  }
  if (kind === 'crescendo' || kind === 'diminuendo') {
    addDirection(from, { types: [['wedge', null, { type: kind, number: 1 }]], placement: 'below' });
    addDirection(to, { types: [['wedge', null, { type: 'stop', number: 1 }]], placement: 'below', at: 'after' });
    return { ...from };
  }
  if (kind === '8va' || kind === '8vb') {
    addDirection(from, { types: [['octave-shift', null, { type: kind === '8va' ? 'down' : 'up', size: 8, number: 1 }]], placement: kind === '8va' ? 'above' : 'below' });
    addDirection(to, { types: [['octave-shift', null, { type: 'stop', size: 8, number: 1 }]], placement: kind === '8va' ? 'above' : 'below', at: 'after' });
    return { ...from };
  }
  return null;
}

// <attributes> at the start of a measure (created when missing)
function startAttributes(measure) {
  const existing = [...measure.children].find((c) => c.tagName === 'attributes');
  const firstNote = [...measure.children].find((c) => c.tagName === 'note' || c.tagName === 'backup' || c.tagName === 'forward');
  if (existing && (!firstNote || existing.compareDocumentPosition(firstNote) & Node.DOCUMENT_POSITION_FOLLOWING)) return existing;
  const attributes = el('attributes');
  const after = [...measure.children].filter((c) => c.tagName === 'print' || (c.tagName === 'barline' && c.getAttribute('location') === 'left')).pop();
  measure.insertBefore(attributes, after ? after.nextSibling : measure.firstChild);
  return attributes;
}

export function setClef({ partIndex, measureIndex, staff = 1 }, { sign, line, octave = 0 }) {
  const part = partAt(partIndex);
  const measure = part && measuresOf(part)[measureIndex];
  if (!measure) return null;
  const attributes = startAttributes(measure);
  const multi = contextAt(part, measureIndex).staves > 1;
  [...attributes.children].filter((c) => c.tagName === 'clef' && (!multi || (c.getAttribute('number') || '1') === String(staff))).forEach((c) => c.remove());
  const clef = el('clef', null, multi ? { number: staff } : {});
  clef.appendChild(el('sign', sign));
  if (line) clef.appendChild(el('line', line));
  if (octave) clef.appendChild(el('clef-octave-change', octave));
  insertOrdered(attributes, clef, ATTRIBUTES_ORDER);
  return { partIndex, measureIndex, staff };
}

// Concert key from a measure on, in every part (transposing instruments get theirs)
export function setKey(measureIndex, concertFifths, mode = 'major') {
  const parts = [...doc.querySelectorAll('score-partwise > part')];
  parts.forEach((part) => {
    const measure = measuresOf(part)[measureIndex];
    if (!measure) return;
    const chromatic = Number(
      [...measuresOf(part).slice(0, measureIndex + 1)].flatMap((m) => [...m.querySelectorAll('attributes > transpose > chromatic')]).pop()?.textContent || 0,
    );
    const attributes = startAttributes(measure);
    child(attributes, 'key')?.remove();
    const key = el('key');
    key.appendChild(el('fifths', writtenKey(concertFifths, chromatic)));
    key.appendChild(el('mode', mode));
    insertOrdered(attributes, key, ATTRIBUTES_ORDER);
  });
  return { measureIndex };
}

// Written key of a transposing instrument (same as newScore's writtenFifths)
function writtenKey(concert, chromatic) {
  let f = concert - ((((chromatic * 7) % 12) + 12) % 12);
  while (f < -7) f += 12;
  while (f > 7) f -= 12;
  if (f > 6) f -= 12;
  return f;
}

const isEmptyMeasure = (measure) => [...measure.children].every((c) => c.tagName !== 'note' || child(c, 'rest'));

// Time signature from a measure until the next change: only over empty measures for
// now (moving notes across new barlines is not done yet)
export function setTime(measureIndex, beats, beatType, symbol = null) {
  const parts = [...doc.querySelectorAll('score-partwise > part')];
  const first = measuresOf(parts[0]);
  let end = measureIndex + 1;
  while (end < first.length && !first[end].querySelector('attributes > time')) end++;
  const range = parts.flatMap((part) => measuresOf(part).slice(measureIndex, end));
  if (!range.every(isEmptyMeasure)) throw new Error('A fórmula de compasso só pode ser mudada em compassos vazios (por agora)');
  parts.forEach((part) => {
    const measure = measuresOf(part)[measureIndex];
    const attributes = startAttributes(measure);
    child(attributes, 'time')?.remove();
    const time = el('time', null, symbol ? { symbol } : {});
    time.appendChild(el('beats', beats));
    time.appendChild(el('beat-type', beatType));
    insertOrdered(attributes, time, ATTRIBUTES_ORDER);
    // Every staff of the range gets one whole-measure rest of the new length
    measuresOf(part).slice(measureIndex, end).forEach((m, k) => {
      const ctx = contextAt(part, measureIndex + k);
      const staffVoices = new Map();
      [...m.children].filter((c) => c.tagName === 'note').forEach((n) => {
        const st = num(n, 'staff', 1);
        if (!staffVoices.has(st)) staffVoices.set(st, child(n, 'voice')?.textContent || '1');
      });
      [...m.children].filter((c) => ['note', 'backup', 'forward'].includes(c.tagName)).forEach((c) => c.remove());
      const barline = [...m.children].find((c) => c.tagName === 'barline' && c.getAttribute('location') !== 'left');
      const staves = Math.max(ctx.staves, 1);
      for (let st = 1; st <= staves; st++) {
        if (st > 1) { const b = el('backup'); b.appendChild(el('duration', ctx.measureLength)); m.insertBefore(b, barline || null); }
        const ev = { duration: ctx.measureLength, voice: staffVoices.get(st) || String((st - 1) * 4 + 1), staff: st, staffCount: staves };
        m.insertBefore(noteNode(ev, null, { divisions: ctx.divisions, fifths: ctx.fifths, wholeMeasureRest: true }), barline || null);
      }
    });
  });
  return { measureIndex };
}

// Barlines, repeats and voltas, in every part. kind: 'normal' | 'double' | 'final' |
// 'dashed' | 'repeat-start' | 'repeat-end' | 'volta-1' | 'volta-2'
export function setBarline(measureIndex, kind) {
  [...doc.querySelectorAll('score-partwise > part')].forEach((part) => {
    const measure = measuresOf(part)[measureIndex];
    if (!measure) return;
    const barlineAt = (location) => {
      let b = [...measure.children].find((c) => c.tagName === 'barline' && (c.getAttribute('location') || 'right') === location);
      if (!b) {
        b = el('barline', null, { location });
        if (location === 'left') {
          const firstMusic = [...measure.children].find((c) => !['print', 'attributes'].includes(c.tagName));
          measure.insertBefore(b, firstMusic || null);
        } else measure.appendChild(b);
      }
      return b;
    };
    const style = (b, value) => { child(b, 'bar-style')?.remove(); if (value) insertOrdered(b, el('bar-style', value), BARLINE_ORDER); };
    if (kind.startsWith('volta-')) {
      const number = kind.split('-')[1];
      const left = barlineAt('left');
      child(left, 'ending')?.remove();
      insertOrdered(left, el('ending', `${number}.`, { number, type: 'start' }), BARLINE_ORDER);
      const right = barlineAt('right');
      child(right, 'ending')?.remove();
      insertOrdered(right, el('ending', null, { number, type: number === '1' ? 'stop' : 'discontinue' }), BARLINE_ORDER);
      return;
    }
    if (kind === 'repeat-start') {
      const left = barlineAt('left');
      style(left, 'heavy-light');
      child(left, 'repeat')?.remove();
      insertOrdered(left, el('repeat', null, { direction: 'forward' }), BARLINE_ORDER);
      return;
    }
    const right = barlineAt('right');
    child(right, 'repeat')?.remove();
    if (kind === 'repeat-end') {
      style(right, 'light-heavy');
      insertOrdered(right, el('repeat', null, { direction: 'backward' }), BARLINE_ORDER);
    } else {
      style(right, { normal: null, double: 'light-light', final: 'light-heavy', dashed: 'dashed' }[kind]);
    }
    removeIfEmpty(right);
  });
  return { measureIndex };
}

// Next rehearsal letter (A, B, C...) from the marks already in the score
export function nextRehearsalMark() {
  const count = doc ? doc.querySelectorAll('direction-type > rehearsal').length : 0;
  return String.fromCharCode(65 + (count % 26)) + (count >= 26 ? String(Math.floor(count / 26) + 1) : '');
}

// Key (fifths), divisions and measure length at a measure of a part
export function measureInfo(partIndex, measureIndex) {
  const part = partAt(partIndex);
  return part ? contextAt(part, measureIndex) : null;
}

// MuseScore voice 1-4 of a staff -> the voice number used in the file. Voice 1 is the
// staff's lowest voice (e.g. 5 on a piano's lower staff); the others follow it, skipping
// numbers another staff of the part already uses.
export function voiceFor(partIndex, staff, slot = 1) {
  const part = partAt(partIndex);
  if (!part) return String(slot);
  const byStaff = new Map();
  part.querySelectorAll('measure > note').forEach((n) => {
    const st = num(n, 'staff', 1);
    const v = Number(child(n, 'voice')?.textContent || 1);
    if (!byStaff.has(st)) byStaff.set(st, new Set());
    byStaff.get(st).add(v);
  });
  const own = [...(byStaff.get(staff) || [])].sort((a, b) => a - b);
  const others = new Set([...byStaff].filter(([st]) => st !== staff).flatMap(([, vs]) => [...vs]));
  const free = (v) => !others.has(v);
  const base = own[0] ?? (() => { let v = (staff - 1) * 4 + 1; while (!free(v)) v++; return v; })();
  // Voices this staff already has keep their order; new ones come after
  const voices = [base, ...own.filter((v) => v !== base)];
  let next = Math.max(...voices) + 1;
  while (voices.length < slot) {
    while (!free(next)) next++;
    voices.push(next++);
  }
  return String(voices[slot - 1]);
}

// Which MuseScore voice (1-4) a file voice number is on its staff
export function slotOfVoice(partIndex, staff, voice) {
  for (let slot = 1; slot <= 4; slot++) if (voiceFor(partIndex, staff, slot) === String(voice)) return slot;
  return 1;
}

export function measureCount(partIndex = 0) {
  const part = partAt(partIndex);
  return part ? measuresOf(part).length : 0;
}
