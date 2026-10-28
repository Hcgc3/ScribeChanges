// Human-readable facts about the loaded score and its notes, read from OSMD's model.

const MAJOR_KEYS = ['Dób', 'Solb', 'Réb', 'Láb', 'Mib', 'Sib', 'Fá', 'Dó', 'Sol', 'Ré', 'Lá', 'Mi', 'Si', 'Fá#', 'Dó#'];
const MINOR_KEYS = ['Láb', 'Mib', 'Sib', 'Fá', 'Dó', 'Sol', 'Ré', 'Lá', 'Mi', 'Si', 'Fá#', 'Dó#', 'Sol#', 'Ré#', 'Lá#'];
const PITCH_NAMES = ['Dó', 'Dó#', 'Ré', 'Mib', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Sib', 'Si'];
const DURATIONS = [
  [1, 'Semibreve'], [0.5, 'Mínima'], [0.25, 'Semínima'], [0.125, 'Colcheia'],
  [0.0625, 'Semicolcheia'], [0.03125, 'Fusa'], [0.015625, 'Semifusa'],
];

// Key instruction of the first measure: Key = sharps (+) / flats (-), Mode 1 = minor
const firstKey = (sheet) => {
  const entries = sheet?.SourceMeasures?.[0]?.FirstInstructionsStaffEntries || [];
  for (const entry of entries) {
    const key = entry?.Instructions?.find((i) => typeof i?.Key === 'number' && 'Mode' in i);
    if (key) return key;
  }
  return null;
};

export function describeKey(keyInstruction) {
  if (!keyInstruction) return '—';
  const fifths = Math.max(-7, Math.min(7, keyInstruction.Key));
  return keyInstruction.Mode === 1
    ? `${MINOR_KEYS[fifths + 7]} menor`
    : `${MAJOR_KEYS[fifths + 7]} Maior`;
}

export function extractScoreMetadata(osmd, timeline) {
  const sheet = osmd?.Sheet;
  if (!sheet) return null;
  const ts = sheet.SourceMeasures?.[0]?.ActiveTimeSignature;
  return {
    title: sheet.TitleString || '',
    composer: sheet.ComposerString || '',
    keySignature: describeKey(firstKey(sheet)),
    timeSignature: ts ? `${ts.Numerator}/${ts.Denominator}` : '—',
    tempo: Math.round(timeline?.startBpm || sheet.DefaultStartTempoInBpm || 120),
    measures: sheet.SourceMeasures?.length || 0,
    instruments: (sheet.Instruments || []).map((i) => i.Name).filter(Boolean),
  };
}

export function describeDuration(note) {
  const value = note?.Length?.RealValue;
  if (!value) return '—';
  for (const [base, name] of DURATIONS) {
    if (Math.abs(value - base) < 1e-6) return name;
    if (Math.abs(value - base * 1.5) < 1e-6) return `${name} pontuada`;
    if (Math.abs(value - (base * 2) / 3) < 1e-6) return `${name} (tercina)`;
  }
  return `${note.Length.Numerator}/${note.Length.Denominator}`;
}

// Written pitch as notated, e.g. "Mib4"; rests -> "Pausa"
export function describePitch(note) {
  if (!note || note.isRest?.()) return 'Pausa';
  if (typeof note.halfTone !== 'number') return '—';
  const midi = note.halfTone + 12;
  return `${PITCH_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
