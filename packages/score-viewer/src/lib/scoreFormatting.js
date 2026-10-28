// Score formatting: turns the formatting settings into OSMD EngravingRules before
// every render, and applies the few things OSMD can't do itself to the SVG after
// it (mirrored margins, notehead/rest scaling, per-note notehead sizes).
//
// Physical sizes are kept in mm and converted to OSMD units (1 unit = a quarter of
// the staff height) on every render, so changing the scale never moves the margins.

export const BASE_STAFF_HEIGHT_MM = 7;
// Default page margins (mm): 15 mm all round, as MuseScore/Dorico; room for the title on top
export const DEFAULT_MARGINS = { topMm: 15, bottomMm: 15, leftMm: 15, rightMm: 15 };

export const DEFAULT_FORMATTING = {
  page: { mirrorMargins: false },
  system: {
    masterScale: 1,          // everything (staff, notes, text) relative to the page
    systemScale: 1,          // staff + notes only; text keeps its size
    leftMm: 0,               // extra inset of systems inside the page margins
    rightMm: 0,
    systemDistanceMm: 10,    // between systems
    staffDistanceMm: 8,      // between staves of one system
    stretchLastSystem: false,
    // Join runs of empty measures into one multi-measure rest. Off: while writing, every
    // measure must be its own (a new score is all empty measures)
    multiRests: false,
  },
  elements: {
    symbolScale: 1,          // all music glyphs (VexFlow notation font)
    noteheadScale: 1,
    restScale: 1,
    noteSpacing: 1,          // inside measures
    measurePadding: 0.7,     // sp, before the first note of a measure
    fixedMeasureWidth: false,
    measureWidth: 20,        // sp, when fixed
    stemWidth: 0.12,         // sp
    stemLength: 3.5,         // sp, one octave
    beamWidth: 0.5,          // sp
    staffLineWidth: 0.1,     // sp
    stemDirection: 'rule',   // 'rule' (computed, see applyStemDirections) | 'xml' (as in the file)
    middleLineStem: 'up',    // stem of a lone note on the middle line
  },
  text: {
    title: 1,
    chords: 1,
    tempo: 1,
    dynamics: 1,
    systemText: 1,
    measureNumbers: 1,
  },
};

// Rules whose OSMD defaults are scaled by the settings above (read once per OSMD instance)
const SCALED_DEFAULT_RULES = [
  'VexFlowDefaultNotationFontScale', 'VoiceSpacingMultiplierVexflow', 'VoiceSpacingAddendVexflow',
  'StemMinLength', 'StemMaxLength', 'IdealStemLength', 'BeamWidth', 'BeamSpaceWidth',
  'SheetTitleHeight', 'SheetSubtitleHeight', 'SheetComposerHeight', 'SheetAuthorHeight',
  'ChordSymbolTextHeight', 'InstantaneousTempoTextHeight', 'ContinuousTempoTextHeight',
  'ContinuousDynamicTextHeight', 'DynamicTextHeight', 'UnknownTextHeight', 'MoodTextHeight',
  'InstrumentLabelTextHeight', 'MeasureNumberLabelHeight', 'StaffDistance', 'BetweenStaffDistance',
];

const TEXT_RULES = {
  title: ['SheetTitleHeight', 'SheetSubtitleHeight', 'SheetComposerHeight', 'SheetAuthorHeight'],
  chords: ['ChordSymbolTextHeight'],
  tempo: ['InstantaneousTempoTextHeight', 'ContinuousTempoTextHeight'],
  dynamics: ['ContinuousDynamicTextHeight', 'DynamicTextHeight'],
  systemText: ['UnknownTextHeight', 'MoodTextHeight', 'InstrumentLabelTextHeight'],
  measureNumbers: ['MeasureNumberLabelHeight'],
};

export const mergeFormatting = (formatting = {}) => ({
  page: { ...DEFAULT_FORMATTING.page, ...formatting.page },
  system: { ...DEFAULT_FORMATTING.system, ...formatting.system },
  elements: { ...DEFAULT_FORMATTING.elements, ...formatting.elements },
  text: { ...DEFAULT_FORMATTING.text, ...formatting.text },
});

// Staff height in mm that the master and system scales give (drives the render width)
export const staffHeightFor = (formatting) => {
  const { system } = mergeFormatting(formatting);
  return BASE_STAFF_HEIGHT_MM * system.masterScale * system.systemScale;
};

const has = (rules, key) => Object.prototype.hasOwnProperty.call(rules, key);

// Returns { rebuildGraphic } when the stems changed (see applyStemDirections)
export function applyFormattingRules(osmd, pageSettings = {}, formatting = {}) {
  const rules = osmd?.EngravingRules;
  if (!rules) return { rebuildGraphic: false };
  const f = mergeFormatting(formatting);
  if (!rules.__formattingDefaults) {
    rules.__formattingDefaults = Object.fromEntries(SCALED_DEFAULT_RULES.filter((k) => has(rules, k)).map((k) => [k, rules[k]]));
  }
  const d = rules.__formattingDefaults;
  const set = (key, value) => { if (has(rules, key) && Number.isFinite(value)) rules[key] = value; };

  const staffMm = pageSettings.staffHeight || staffHeightFor(f);
  const mm = (value) => value / (staffMm / 4);
  const margins = pageSettings.margins || {};

  // 1. Page margins (with mirroring, left = inner and right = outer; even pages are shifted after render)
  set('PageLeftMargin', mm(margins.leftMm ?? DEFAULT_MARGINS.leftMm));
  set('PageRightMargin', mm(margins.rightMm ?? DEFAULT_MARGINS.rightMm));
  set('PageTopMargin', mm(margins.topMm ?? DEFAULT_MARGINS.topMm));
  set('PageBottomMargin', mm(margins.bottomMm ?? DEFAULT_MARGINS.bottomMm));

  // 2. System geometry
  set('SystemLeftMargin', mm(f.system.leftMm));
  set('SystemRightMargin', mm(f.system.rightMm));
  set('MinimumDistanceBetweenSystems', mm(f.system.systemDistanceMm));
  set('BetweenStaffDistance', mm(f.system.staffDistanceMm));
  if (d.StaffDistance && d.BetweenStaffDistance) set('StaffDistance', mm(f.system.staffDistanceMm) * (d.StaffDistance / d.BetweenStaffDistance));
  if (has(rules, 'StretchLastSystemLine')) rules.StretchLastSystemLine = !!f.system.stretchLastSystem;
  // Multi-rests are grouped while loading and OSMD can't undo it on the same sheet:
  // the store reloads the score when this setting changes (see updateFormatting)
  if (has(rules, 'RenderMultipleRestMeasures')) rules.RenderMultipleRestMeasures = !!f.system.multiRests;

  // 3. Elements
  const e = f.elements;
  set('VexFlowDefaultNotationFontScale', d.VexFlowDefaultNotationFontScale * e.symbolScale);
  set('VoiceSpacingMultiplierVexflow', d.VoiceSpacingMultiplierVexflow * e.noteSpacing);
  set('VoiceSpacingAddendVexflow', d.VoiceSpacingAddendVexflow * e.noteSpacing);
  set('MeasureLeftMargin', e.measurePadding);
  if (has(rules, 'FixedMeasureWidth')) rules.FixedMeasureWidth = !!e.fixedMeasureWidth;
  if (e.fixedMeasureWidth) set('FixedMeasureWidthFixedValue', e.measureWidth);
  set('StemWidth', e.stemWidth);
  const stemFactor = e.stemLength / (d.IdealStemLength || 3);
  set('IdealStemLength', e.stemLength);
  set('StemMinLength', d.StemMinLength * stemFactor);
  set('StemMaxLength', d.StemMaxLength * stemFactor);
  set('BeamWidth', e.beamWidth);
  if (d.BeamWidth && d.BeamSpaceWidth) set('BeamSpaceWidth', e.beamWidth * (d.BeamSpaceWidth / d.BeamWidth));
  set('StaffLineWidth', e.staffLineWidth);
  // Ledger lines are in px (not sp): a bit heavier than the staff lines
  set('LedgerLineWidth', Math.max(0.8, e.staffLineWidth * 10 * 1.5));
  if (has(rules, 'LedgerLineColorDefault')) rules.LedgerLineColorDefault = '#000000';
  const stemsChanged = applyStemDirections(osmd, e);

  // Text: scales with the master scale (it's in units), but not with the system scale
  Object.entries(TEXT_RULES).forEach(([group, keys]) => {
    keys.forEach((key) => { if (d[key] != null) set(key, (d[key] * f.text[group]) / f.system.systemScale); });
  });
  return { rebuildGraphic: stemsChanged };
}

// ---- stem directions --------------------------------------------------------------------

// OSMD NoteEnum (semitones) -> diatonic step within the octave
const DIATONIC_STEP = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
const diatonic = (pitch) => pitch.Octave * 7 + (DIATONIC_STEP[pitch.FundamentalNote] ?? 0);
const STEM_UP = 0;   // StemDirectionType.Up
const STEM_DOWN = 1; // StemDirectionType.Down

// Diatonic value of a clef's middle (3rd) staff line, e.g. B4 for the treble clef
const middleLineOf = (clef) => diatonic(clef.ClefPitch) + (3 - clef.Line) * 2;
const isClef = (instruction) => instruction && 'ClefPitch' in instruction && 'Line' in instruction;

// Stems of the notes in `voiceEntries`, by position against the middle line
// (steps; <= 0 is the middle line or below). Counted: more notes at/below the
// middle line -> up, more above -> down; a tie goes to the note furthest from
// the line, then to `middleUp`.
const directionFor = (positions, middleUp) => {
  let below = 0;
  let above = 0;
  let furthest = 0;
  positions.forEach((p) => {
    if (p > 0) above++; else below++;
    if (Math.abs(p) > Math.abs(furthest)) furthest = p;
  });
  if (below !== above) return below > above ? STEM_UP : STEM_DOWN;
  if (furthest !== 0) return furthest < 0 ? STEM_UP : STEM_DOWN;
  return middleUp ? STEM_UP : STEM_DOWN;
};

// Stem directions for single-voice staves (lone notes, chords and beamed groups).
// Staves with several voices in a measure keep the file's stems (voice 1 up /
// voice 2 down), as do grace notes.
//
// OSMD decides stems when it builds the graphical sheet (at load) and only keeps a
// direction that comes from the XML, so the computed one is written to
// StemDirectionXml (the file's own value is kept in __fileStem to restore it).
// Returns true when any direction changed: the graphic then has to be rebuilt.
export function applyStemDirections(osmd, elements) {
  const sheet = osmd?.Sheet;
  const rules = osmd?.EngravingRules;
  if (!sheet || !rules) return false;
  const byRule = elements.stemDirection !== 'xml';
  rules.SetWantedStemDirectionByXml = true;
  let changed = false;
  const setStem = (ve, dir) => {
    if (ve.__fileStem === undefined) ve.__fileStem = ve.StemDirectionXml;
    const next = dir === undefined ? ve.__fileStem : dir;
    if (ve.StemDirectionXml !== next) { ve.StemDirectionXml = next; changed = true; }
  };

  const activeClefs = [];
  const positionOf = (note, staffIndex) => {
    const clef = activeClefs[staffIndex];
    return clef && note.Pitch ? diatonic(note.Pitch) - middleLineOf(clef) : null;
  };
  const middleUp = elements.middleLineStem !== 'down';
  const beamsDone = new Set();

  sheet.SourceMeasures.forEach((measure) => {
    (measure.FirstInstructionsStaffEntries || []).forEach((entry, staffIndex) => {
      const clef = entry?.Instructions?.find(isClef);
      if (clef) activeClefs[staffIndex] = clef;
    });

    // Voices per staff in this measure
    const voicesPerStaff = [];
    measure.VerticalSourceStaffEntryContainers.forEach((container) => {
      container.StaffEntries.forEach((staffEntry, staffIndex) => {
        if (!staffEntry) return;
        voicesPerStaff[staffIndex] = voicesPerStaff[staffIndex] || new Set();
        staffEntry.VoiceEntries.forEach((ve) => voicesPerStaff[staffIndex].add(ve.ParentVoice));
      });
    });

    measure.VerticalSourceStaffEntryContainers.forEach((container) => {
      container.StaffEntries.forEach((staffEntry, staffIndex) => {
        if (!staffEntry) return;
        const midClef = staffEntry.Instructions?.find(isClef);
        if (midClef) activeClefs[staffIndex] = midClef;
        const singleVoice = (voicesPerStaff[staffIndex]?.size || 0) <= 1;

        staffEntry.VoiceEntries.forEach((ve) => {
          if (!byRule || !singleVoice || ve.IsGrace) {
            setStem(ve, undefined);
            return;
          }
          const notes = ve.Notes.filter((n) => !n.isRest());
          if (!notes.length) return;
          const beam = notes.find((n) => n.NoteBeam)?.NoteBeam;
          if (beam) {
            if (beamsDone.has(beam)) return;
            beamsDone.add(beam);
            // The whole group shares one direction, from all of its notes
            const groupNotes = beam.Notes.filter((n) => !n.isRest());
            const positions = groupNotes.map((n) => positionOf(n, staffIndex)).filter((p) => p !== null);
            if (!positions.length) return;
            const dir = directionFor(positions, middleUp);
            new Set(groupNotes.map((n) => n.ParentVoiceEntry)).forEach((entry) => setStem(entry, dir));
          } else {
            const positions = notes.map((n) => positionOf(n, staffIndex)).filter((p) => p !== null);
            if (positions.length) setStem(ve, directionFor(positions, middleUp));
          }
        });
      });
    });
  });
  return changed;
}

// ---- per-note notehead sizes (session only; kept on the Note objects' identity) ---------

const noteheadOverrides = new WeakMap(); // Note -> { mode: 'cue' | 'custom', scale }
// Conventional cue size. OSMD's own IsCueNote only applies to notes marked cue in the XML.
export const CUE_NOTEHEAD_SCALE = 0.72;

// mode: 'normal' | 'cue' | 'custom' (with scale)
export function setNoteheadSize(notes, mode, scale = 1) {
  (notes || []).forEach((note) => {
    if (note.isRest?.()) return;
    if (mode === 'cue') noteheadOverrides.set(note, { mode, scale: CUE_NOTEHEAD_SCALE });
    else if (mode === 'custom') noteheadOverrides.set(note, { mode, scale });
    else noteheadOverrides.delete(note);
  });
}

export function getNoteheadSize(note) {
  return (note && noteheadOverrides.get(note)) || { mode: 'normal', scale: 1 };
}

// ---- after render ----------------------------------------------------------------------------

const scaleAroundCenter = (el, scale) => {
  if (!el || Math.abs(scale - 1) < 1e-3) return;
  const box = el.getBBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  el.setAttribute('transform', `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`);
};

const forEachGraphicalNote = (osmd, fn) => {
  for (const page of osmd.GraphicSheet?.MusicPages || []) {
    for (const system of page.MusicSystems || []) {
      for (const staffLine of system.StaffLines || []) {
        for (const measure of staffLine.Measures || []) {
          for (const staffEntry of measure.staffEntries || []) {
            for (const voiceEntry of staffEntry.graphicalVoiceEntries || []) {
              for (const gNote of voiceEntry.notes || []) fn(gNote);
            }
          }
        }
      }
    }
  }
};

export function applyFormattingPostRender(osmd, pageSettings = {}, formatting = {}, renderWidthPx = 0) {
  const container = osmd?.container;
  if (!container) return;
  const f = mergeFormatting(formatting);
  const margins = pageSettings.margins || {};

  // Mirrored margins: pages are laid out with left = inner, right = outer; even
  // (left-hand) pages swap them by moving their content by (outer - inner)
  const pxPerMm = renderWidthPx && pageSettings.widthMm ? renderWidthPx / pageSettings.widthMm : 0;
  const shift = f.page.mirrorMargins
    ? ((margins.rightMm ?? DEFAULT_MARGINS.rightMm) - (margins.leftMm ?? DEFAULT_MARGINS.leftMm)) * pxPerMm
    : 0;
  container.querySelectorAll(':scope > div[id^="osmdCanvasPage"]').forEach((page, index) => {
    const dx = index % 2 === 1 ? shift : 0;
    const svg = page.querySelector('svg');
    page.dataset.mirrorShift = String(dx);
    page.style.overflow = dx ? 'hidden' : '';
    if (svg) svg.style.transform = dx ? `translateX(${dx}px)` : '';
  });

  // Notehead / rest scaling and per-note sizes
  const { noteheadScale, restScale } = f.elements;
  forEachGraphicalNote(osmd, (gNote) => {
    const note = gNote.sourceNote;
    const isRest = note?.isRest?.();
    const scale = isRest ? restScale : noteheadScale * (noteheadOverrides.get(note)?.scale || 1);
    if (Math.abs(scale - 1) < 1e-3) return;
    const heads = gNote.getNoteheadSVGs?.() || [];
    const head = heads.length > 1 ? heads[gNote.vfnoteIndex ?? 0] : heads[0];
    try { scaleAroundCenter(head, scale); } catch { /* not in the DOM */ }
  });
}
