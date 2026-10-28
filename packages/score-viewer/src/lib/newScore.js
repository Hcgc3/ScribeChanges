// New score: builds a MusicXML document (empty measures with whole-measure rests)
// from the "Nova partitura" options, so it loads through the same path as a file.

// clef: [sign, line, octaveChange]; transpose: written -> sounding (chromatic, diatonic)
export const INSTRUMENT_GROUPS = [
  {
    label: 'Teclas',
    items: [
      { id: 'piano', name: 'Piano', abbr: 'Pno.', program: 1, staves: [['G', 2], ['F', 4]] },
      { id: 'organ', name: 'Órgão', abbr: 'Org.', program: 20, staves: [['G', 2], ['F', 4]] },
    ],
  },
  {
    label: 'Cordas',
    items: [
      { id: 'violin', name: 'Violino', abbr: 'Vln.', program: 41, staves: [['G', 2]] },
      { id: 'viola', name: 'Viola', abbr: 'Vla.', program: 42, staves: [['C', 3]] },
      { id: 'cello', name: 'Violoncelo', abbr: 'Vc.', program: 43, staves: [['F', 4]] },
      { id: 'bass', name: 'Contrabaixo', abbr: 'Cb.', program: 44, staves: [['F', 4]], transpose: [-12, -7] },
      { id: 'guitar', name: 'Guitarra', abbr: 'Gtr.', program: 25, staves: [['G', 2, -1]] },
      { id: 'ebass', name: 'Baixo elétrico', abbr: 'B. el.', program: 34, staves: [['F', 4, -1]] },
    ],
  },
  {
    label: 'Madeiras',
    items: [
      { id: 'flute', name: 'Flauta', abbr: 'Fl.', program: 74, staves: [['G', 2]] },
      { id: 'oboe', name: 'Oboé', abbr: 'Ob.', program: 69, staves: [['G', 2]] },
      { id: 'clarinet', name: 'Clarinete em Sib', abbr: 'Cl.', program: 72, staves: [['G', 2]], transpose: [-2, -1] },
      { id: 'bassoon', name: 'Fagote', abbr: 'Fg.', program: 71, staves: [['F', 4]] },
      { id: 'altosax', name: 'Saxofone Alto', abbr: 'Sax. A.', program: 66, staves: [['G', 2]], transpose: [-9, -5] },
      { id: 'tenorsax', name: 'Saxofone Tenor', abbr: 'Sax. T.', program: 67, staves: [['G', 2]], transpose: [-14, -8] },
    ],
  },
  {
    label: 'Metais',
    items: [
      { id: 'trumpet', name: 'Trompete em Sib', abbr: 'Tpt.', program: 57, staves: [['G', 2]], transpose: [-2, -1] },
      { id: 'horn', name: 'Trompa em Fá', abbr: 'Tpa.', program: 61, staves: [['G', 2]], transpose: [-7, -4] },
      { id: 'trombone', name: 'Trombone', abbr: 'Tbn.', program: 58, staves: [['F', 4]] },
      { id: 'tuba', name: 'Tuba', abbr: 'Tba.', program: 59, staves: [['F', 4]] },
    ],
  },
  {
    label: 'Vozes',
    items: [
      { id: 'soprano', name: 'Soprano', abbr: 'S.', program: 53, staves: [['G', 2]] },
      { id: 'alto', name: 'Contralto', abbr: 'A.', program: 53, staves: [['G', 2]] },
      { id: 'tenor', name: 'Tenor', abbr: 'T.', program: 53, staves: [['G', 2, -1]] },
      { id: 'basso', name: 'Baixo', abbr: 'B.', program: 53, staves: [['F', 4]] },
    ],
  },
];

export const INSTRUMENTS = Object.fromEntries(INSTRUMENT_GROUPS.flatMap((g) => g.items).map((i) => [i.id, i]));

export const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '2/2', '6/8', '9/8', '12/8', '5/4', '7/8'];

const MAJOR_KEYS = ['Dób', 'Solb', 'Réb', 'Láb', 'Mib', 'Sib', 'Fá', 'Dó', 'Sol', 'Ré', 'Lá', 'Mi', 'Si', 'Fá#', 'Dó#'];
const MINOR_KEYS = ['Láb', 'Mib', 'Sib', 'Fá', 'Dó', 'Sol', 'Ré', 'Lá', 'Mi', 'Si', 'Fá#', 'Dó#', 'Sol#', 'Ré#', 'Lá#'];
export const keyName = (fifths, mode = 'major') =>
  mode === 'minor' ? `${MINOR_KEYS[fifths + 7]} menor` : `${MAJOR_KEYS[fifths + 7]} Maior`;

export const DEFAULT_NEW_SCORE = {
  title: 'Nova partitura',
  composer: '',
  instruments: ['piano'],
  time: '4/4',
  fifths: 0,
  mode: 'major',
  tempo: 100,
  measures: 32,
  paper: 'a4',
  landscape: false,
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DIVISIONS = 4; // per quarter: enough for any beat type down to 16ths

// MusicXML keys are written keys: a transposing instrument (sounding = written +
// chromatic) is written `-chromatic` semitones away, i.e. 7 fifths per semitone.
// E.g. concert D (2#) -> alto sax in Eb (-9) -> B (5#).
export const writtenFifths = (concertFifths, chromatic = 0) => {
  let shift = (((-chromatic * 7) % 12) + 12) % 12;
  if (shift > 6) shift -= 12;
  let fifths = concertFifths + shift;
  if (fifths > 7) fifths -= 12;
  if (fifths < -7) fifths += 12;
  return fifths;
};

export function buildNewScoreXml(options) {
  const o = { ...DEFAULT_NEW_SCORE, ...options };
  const [beats, beatType] = o.time.split('/').map(Number);
  const measureDuration = (beats * 4 * DIVISIONS) / beatType;
  const parts = o.instruments.map((id, i) => ({ ...INSTRUMENTS[id], partId: `P${i + 1}` })).filter((p) => p.name);
  const measures = Math.max(1, Math.min(999, Math.round(o.measures)));

  const partList = parts.map((p, i) => `
    <score-part id="${p.partId}">
      <part-name>${esc(p.name)}</part-name>
      <part-abbreviation>${esc(p.abbr)}</part-abbreviation>
      <score-instrument id="${p.partId}-I1"><instrument-name>${esc(p.name)}</instrument-name></score-instrument>
      <midi-instrument id="${p.partId}-I1"><midi-channel>${(i % 15) + 1 + (i >= 9 ? 1 : 0)}</midi-channel><midi-program>${p.program}</midi-program></midi-instrument>
    </score-part>`).join('');

  const partXml = parts.map((p, partIndex) => {
    const staves = p.staves.length;
    const restsFor = () => p.staves.map((_, s) => `
      <note><rest measure="yes"/><duration>${measureDuration}</duration><voice>${s * 4 + 1}</voice>${staves > 1 ? `<staff>${s + 1}</staff>` : ''}</note>${s < staves - 1 ? `
      <backup><duration>${measureDuration}</duration></backup>` : ''}`).join('');

    const body = Array.from({ length: measures }, (_, m) => {
      const first = m === 0;
      const last = m === measures - 1;
      const attributes = first ? `
      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key><fifths>${writtenFifths(o.fifths, p.transpose?.[0])}</fifths><mode>${o.mode}</mode></key>
        <time${o.time === '2/2' ? ' symbol="cut"' : ''}><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>${staves > 1 ? `
        <staves>${staves}</staves>` : ''}${p.staves.map(([sign, line, octave], s) => `
        <clef${staves > 1 ? ` number="${s + 1}"` : ''}><sign>${sign}</sign><line>${line}</line>${octave ? `<clef-octave-change>${octave}</clef-octave-change>` : ''}</clef>`).join('')}${p.transpose ? `
        <transpose><diatonic>${p.transpose[1]}</diatonic><chromatic>${p.transpose[0]}</chromatic></transpose>` : ''}
      </attributes>` : '';
      // Tempo mark on the top part only
      const tempo = first && partIndex === 0 ? `
      <direction placement="above">
        <direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${o.tempo}</per-minute></metronome></direction-type>
        <sound tempo="${o.tempo}"/>
      </direction>` : '';
      const barline = last ? `
      <barline location="right"><bar-style>light-heavy</bar-style></barline>` : '';
      return `
    <measure number="${m + 1}">${attributes}${tempo}${restsFor()}${barline}
    </measure>`;
    }).join('');
    return `
  <part id="${p.partId}">${body}
  </part>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${esc(o.title)}</work-title></work>
  <identification>${o.composer ? `<creator type="composer">${esc(o.composer)}</creator>` : ''}<encoding><software>Editor de Partituras</software></encoding></identification>
  <part-list>${partList}
  </part-list>${partXml}
</score-partwise>
`;
}
