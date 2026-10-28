// Mouse note input (MuseScore style): maps a point on the score to a staff, measure,
// time position and pitch, and draws the "shadow" note and the input caret.
//
// OSMD layout is in units of 10px; a staff is 4 units tall (lines 1 unit apart),
// so each half unit is one diatonic step.

import { diatonicToPitch, pitchName, measureInfo } from './scoreEditor';

const UNIT = 10;
const DIATONIC_STEP = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 }; // OSMD NoteEnum -> step
const XML_OCTAVE_OFFSET = 21; // OSMD octave 1 = C4 (XML octave 4), 7 steps per octave

let ghost = null;
let caret = null;

// Diatonic index (XML octaves) of a clef's middle staff line, e.g. B4 = 34 in treble
const middleLineOf = (clef) => {
  if (!clef?.ClefPitch) return 34;
  const p = clef.ClefPitch;
  return p.Octave * 7 + (DIATONIC_STEP[p.FundamentalNote] ?? 0) + (3 - clef.Line) * 2 + XML_OCTAVE_OFFSET;
};

const pageElementOf = (osmd, system) => {
  const pages = osmd.GraphicSheet?.MusicPages || [];
  const index = pages.indexOf(system?.Parent);
  return osmd.container?.querySelector(`#osmdCanvasPage${index + 1}`) || null;
};

// Point (client px) -> page units, honouring zoom (the page is scaled) and mirrored margins
const toPageUnits = (pageEl, clientX, clientY) => {
  const rect = pageEl.getBoundingClientRect();
  const scale = rect.width / (pageEl.offsetWidth || 1);
  const shift = parseFloat(pageEl.dataset.mirrorShift) || 0;
  return { x: ((clientX - rect.left) / scale - shift) / UNIT, y: (clientY - rect.top) / scale / UNIT };
};

const measureContext = (gm) => {
  const staff = gm.ParentStaff;
  const instrument = staff?.ParentInstrument;
  return {
    staffNumber: (instrument?.Staves || []).indexOf(staff) + 1,
    instrument,
  };
};

// Find the staff measure and position under a point. Returns null off the music.
export function hitTest(osmd, clientX, clientY) {
  const sheet = osmd?.GraphicSheet;
  if (!sheet) return null;
  let best = null;
  for (const measuresAtIndex of sheet.MeasureList || []) {
    for (const gm of measuresAtIndex || []) {
      if (!gm?.PositionAndShape || !gm.ParentMusicSystem) continue;
      const pageEl = pageElementOf(osmd, gm.ParentMusicSystem);
      if (!pageEl) continue;
      const r = pageEl.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) continue;
      const p = toPageUnits(pageEl, clientX, clientY);
      const { x: mx, y: top } = gm.PositionAndShape.AbsolutePosition;
      const width = gm.PositionAndShape.Size.width;
      if (p.x < mx || p.x > mx + width) continue;
      // Vertical reach: the staff plus ledger-line space above and below
      const dist = p.y < top - 1 ? top - 1 - p.y : p.y > top + 5 ? p.y - top - 5 : 0;
      if (dist > 3) continue;
      if (!best || dist < best.dist) best = { gm, p, pageEl, dist, top, mx };
    }
  }
  if (!best) return null;
  const { gm, p, pageEl, top } = best;
  const { staffNumber, instrument } = measureContext(gm);
  const partIndex = osmd.Sheet.Instruments.indexOf(instrument);
  const measureIndex = gm.parentSourceMeasure?.measureListIndex ?? 0;
  const info = measureInfo(partIndex, measureIndex);
  if (!info || partIndex < 0 || staffNumber < 1) return null;

  // Time: the nearest existing chord/rest position in the measure (MuseScore snaps to segments)
  let entry = null;
  for (const se of gm.staffEntries || []) {
    const x = gm.PositionAndShape.AbsolutePosition.x + se.PositionAndShape.RelativePosition.x;
    if (!entry || Math.abs(x - p.x) < Math.abs(entry.x - p.x)) entry = { x, se };
  }
  const wholes = entry ? (entry.se.relInMeasureTimestamp?.RealValue ?? 0) : 0;
  const start = Math.round(wholes * 4 * info.divisions);
  // A lone whole-measure rest is drawn centred: show the input at the first beat instead
  const onlyMeasureRest = (gm.staffEntries || []).length === 1
    && (gm.staffEntries[0].graphicalVoiceEntries || []).every((gve) => gve.notes.every((n) => n.sourceNote?.isRest?.()));
  const firstBeatX = gm.PositionAndShape.AbsolutePosition.x + (gm.beginInstructionsWidth || 0) + 1.5;
  const x = !entry ? p.x : onlyMeasureRest ? firstBeatX : entry.x;

  // Pitch: half a unit per diatonic step from the top line
  const steps = Math.round((p.y - top) / 0.5);
  const middle = middleLineOf(gm.InitiallyActiveClef);
  const diatonic = middle + 4 - steps;
  const pitch = diatonicToPitch(diatonic, info.fifths);
  return {
    partIndex, staff: staffNumber, voice: '1', measureIndex, start,
    pitch, diatonic, steps, top, x, pageEl, middle, fifths: info.fifths,
  };
}

// ---- overlays ----------------------------------------------------------------------------------

const ensure = (node, className) => {
  if (node) return node;
  const n = document.createElement('div');
  n.className = className;
  n.setAttribute('aria-hidden', 'true');
  return n;
};

export function showGhost(hit, { rest = false } = {}) {
  ghost = ensure(ghost, 'note-input-ghost');
  if (ghost.parentElement !== hit.pageEl) hit.pageEl.appendChild(ghost);
  const shift = parseFloat(hit.pageEl.dataset.mirrorShift) || 0;
  const xPx = hit.x * UNIT + shift;
  // Ledger lines for notes above the top line / below the bottom line
  const ledgers = [];
  if (!rest) {
    for (let s = -2; s >= hit.steps; s -= 2) ledgers.push(s);
    for (let s = 10; s <= hit.steps; s += 2) ledgers.push(s);
  }
  const yPx = rest ? (hit.top + 2) * UNIT : (hit.top + hit.steps * 0.5) * UNIT;
  ghost.innerHTML = `${ledgers.map((s) => `<span class="note-input-ledger" style="top:${(hit.top + s * 0.5) * UNIT - yPx}px"></span>`).join('')}
    <span class="note-input-head${rest ? ' is-rest' : ''}"></span>
    <span class="note-input-label">${rest ? 'Pausa' : pitchName(hit.pitch)}</span>`;
  ghost.style.transform = `translate(${xPx}px, ${yPx}px)`;
  ghost.style.display = 'block';
}

export function hideGhost() {
  if (ghost) ghost.style.display = 'none';
}

// Caret at a (part, staff, measure, start): before the chord/rest there, else at the measure start
export function showCaret(osmd, target) {
  if (!osmd?.GraphicSheet || !target) { hideCaret(); return; }
  const info = measureInfo(target.partIndex, target.measureIndex);
  const instrument = osmd.Sheet.Instruments[target.partIndex];
  const staff = instrument?.Staves?.[target.staff - 1];
  const gm = (osmd.GraphicSheet.MeasureList[target.measureIndex] || []).find((m) => m?.ParentStaff === staff);
  if (!gm || !info) { hideCaret(); return; }
  const pageEl = pageElementOf(osmd, gm.ParentMusicSystem);
  if (!pageEl) { hideCaret(); return; }
  const wholes = target.start / (4 * info.divisions);
  const se = (gm.staffEntries || []).find((e) => Math.abs((e.relInMeasureTimestamp?.RealValue ?? -1) - wholes) < 1e-6);
  const mx = gm.PositionAndShape.AbsolutePosition.x;
  const x = se && target.start > 0
    ? mx + se.PositionAndShape.RelativePosition.x - 0.8
    : mx + (gm.beginInstructionsWidth || 0) + 0.3;
  const top = gm.PositionAndShape.AbsolutePosition.y;
  caret = ensure(caret, 'note-input-caret');
  if (caret.parentElement !== pageEl) pageEl.appendChild(caret);
  const shift = parseFloat(pageEl.dataset.mirrorShift) || 0;
  caret.style.transform = `translate(${x * UNIT + shift}px, ${(top - 1) * UNIT}px)`;
  caret.style.height = `${6 * UNIT}px`;
  caret.style.display = 'block';
}

export function hideCaret() {
  if (caret) caret.style.display = 'none';
}

export function clearNoteInputOverlays() {
  ghost?.remove();
  caret?.remove();
  ghost = null;
  caret = null;
}

// Middle-line diatonic of a staff at a measure (for letter entry: nearest octave)
export function middleLineAt(osmd, target) {
  const instrument = osmd?.Sheet?.Instruments?.[target.partIndex];
  const staff = instrument?.Staves?.[target.staff - 1];
  const gm = (osmd?.GraphicSheet?.MeasureList?.[target.measureIndex] || []).find((m) => m?.ParentStaff === staff);
  return middleLineOf(gm?.InitiallyActiveClef);
}

// ---- selection -> editor target --------------------------------------------------------------

const STEP_LETTERS = 'CDEFGAB';
const STEP_SEMI = [0, 2, 4, 5, 7, 9, 11];

// Written pitch of an OSMD note as { step, alter, octave } (XML octaves)
export function notePitch(note) {
  const p = note?.Pitch;
  if (!p || note.isRest?.()) return null;
  const idx = DIATONIC_STEP[p.FundamentalNote] ?? 0;
  const octave = p.Octave + 3;
  const midi = note.halfTone + 12;
  return { step: STEP_LETTERS[idx], alter: midi - ((octave + 1) * 12 + STEP_SEMI[idx]), octave };
}

// Where an OSMD note sits in the MusicXML: part, staff, voice, measure, start (divisions)
export function targetFromNote(osmd, note) {
  const ve = note?.ParentVoiceEntry;
  const sse = ve?.ParentSourceStaffEntry;
  const staff = note?.ParentStaff;
  const instrument = staff?.ParentInstrument;
  if (!ve || !sse || !instrument) return null;
  const measure = sse.VerticalContainerParent?.ParentMeasure || note.SourceMeasure;
  const partIndex = osmd.Sheet.Instruments.indexOf(instrument);
  const measureIndex = measure?.measureListIndex ?? 0;
  const info = measureInfo(partIndex, measureIndex);
  if (!info) return null;
  return {
    partIndex,
    staff: instrument.Staves.indexOf(staff) + 1,
    voice: String(ve.ParentVoice?.VoiceId ?? 1),
    measureIndex,
    start: Math.round((sse.Timestamp?.RealValue ?? 0) * 4 * info.divisions),
    pitch: notePitch(note),
    quarters: (note.Length?.RealValue ?? 0) * 4,
  };
}
