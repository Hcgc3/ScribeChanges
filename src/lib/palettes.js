// Symbol palettes (MuseScore's Palettes panel): every symbol the editor can put in the
// score, by category. `glyph` is text drawn in Noto Music (Unicode musical symbols),
// `icon` a small SVG drawn by PalettePanel, `label` the name shown in the tooltip.
// The rest says what applying it does (see applySymbol in score-store).

const G = (cp) => String.fromCodePoint(cp);
const CLEF_G = G(0x1d11e);
const CLEF_C = G(0x1d121);
const CLEF_F = G(0x1d122);
const FLAT = '♭';
const NATURAL = '♮';
const SHARP = '♯';
const DYN = { p: G(0x1d18f), m: G(0x1d190), f: G(0x1d191), s: G(0x1d18d), z: G(0x1d18e), r: G(0x1d18c) };
const dyn = (text) => [...text].map((c) => DYN[c] || c).join('');

const mark = (label, icon, m, extra = {}) => ({ label, icon, kind: 'mark', mark: m, ...extra });
const articulation = (label, icon, name, attrs) => mark(label, icon, { group: 'articulations', name, attrs });
const ornament = (label, glyphOrIcon, name, extra = {}) => mark(label, null, { group: 'ornaments', name, ...extra }, glyphOrIcon);

// MusicXML <sound dynamics> (percent of a forte of 90 velocity)
const DYNAMICS = [
  ['ppp', 22], ['pp', 36], ['p', 54], ['mp', 71], ['mf', 89], ['f', 106], ['ff', 124], ['fff', 141],
  ['sf', 124], ['sfz', 124], ['sffz', 141], ['fp', 106], ['rfz', 124],
];
const dynamic = ([name, value]) => ({
  label: `Dinâmica ${name}`,
  glyph: dyn(name),
  kind: 'direction',
  direction: { types: [['dynamics', null, {}, [[name]]]], placement: 'below', sound: { dynamics: value }, replace: 'dynamics' },
});

const metronome = (bpm) => ({
  label: `Semínima = ${bpm}`,
  text: `♩ = ${bpm}`,
  kind: 'direction',
  direction: {
    types: [['metronome', null, {}, [['beat-unit', 'quarter'], ['per-minute', bpm]]]],
    placement: 'above', sound: { tempo: bpm }, replace: 'metronome',
  },
});
const tempoText = (word, bpm) => ({
  label: `${word} (${bpm})`,
  text: word,
  bold: true,
  kind: 'direction',
  direction: { types: [['words', word, { 'font-weight': 'bold' }]], placement: 'above', sound: bpm ? { tempo: bpm } : null },
});
const words = (label, text, { at = 'note', sound = null, placement = 'above', italic = false } = {}) => ({
  label,
  text,
  italic,
  kind: 'direction',
  direction: { types: [['words', text, italic ? { 'font-style': 'italic' } : {}]], placement, sound, at },
});

const KEY_NAMES = ['Dób', 'Solb', 'Réb', 'Láb', 'Mib', 'Sib', 'Fá', 'Dó', 'Sol', 'Ré', 'Lá', 'Mi', 'Si', 'Fá#', 'Dó#'];
const MINOR_NAMES = ['Láb', 'Mib', 'Sib', 'Fá', 'Dó', 'Sol', 'Ré', 'Lá', 'Mi', 'Si', 'Fá#', 'Dó#', 'Sol#', 'Ré#', 'Lá#'];
const keySignature = (fifths) => ({
  label: `${KEY_NAMES[fifths + 7]} maior / ${MINOR_NAMES[fifths + 7]} menor`,
  // Up to three accidentals drawn, more as a count (4♯) so the button stays readable
  text: fifths === 0 ? '∅' : Math.abs(fifths) > 3 ? `${Math.abs(fifths)}${fifths > 0 ? SHARP : FLAT}` : (fifths > 0 ? SHARP : FLAT).repeat(Math.abs(fifths)),
  kind: 'key',
  fifths,
});

const time = (beats, beatType, symbol) => ({
  label: symbol === 'common' ? 'Compasso C (4/4)' : symbol === 'cut' ? 'Compasso cortado (2/2)' : `Compasso ${beats}/${beatType}`,
  ...(symbol ? { glyph: symbol === 'common' ? G(0x1d134) : G(0x1d135) } : { fraction: [beats, beatType] }),
  kind: 'time',
  beats,
  beatType,
  symbol,
});

export const PALETTES = [
  {
    id: 'clefs',
    title: 'Claves',
    symbols: [
      { label: 'Clave de sol', glyph: CLEF_G, kind: 'clef', clef: { sign: 'G', line: 2 } },
      { label: 'Clave de fá', glyph: CLEF_F, kind: 'clef', clef: { sign: 'F', line: 4 } },
      { label: 'Clave de dó na 3.ª (alto)', glyph: CLEF_C, kind: 'clef', clef: { sign: 'C', line: 3 } },
      { label: 'Clave de dó na 4.ª (tenor)', glyph: CLEF_C, sub: '4', kind: 'clef', clef: { sign: 'C', line: 4 } },
      { label: 'Clave de sol 8vb', glyph: G(0x1d11f), kind: 'clef', clef: { sign: 'G', line: 2, octave: -1 } },
      { label: 'Clave de sol 8va', glyph: G(0x1d120), kind: 'clef', clef: { sign: 'G', line: 2, octave: 1 } },
      { label: 'Clave de fá 8vb', glyph: G(0x1d124), kind: 'clef', clef: { sign: 'F', line: 4, octave: -1 } },
      { label: 'Clave de percussão', glyph: G(0x1d125), kind: 'clef', clef: { sign: 'percussion' } },
    ],
  },
  {
    id: 'keys',
    title: 'Armações de clave',
    symbols: [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7].map(keySignature),
  },
  {
    id: 'time',
    title: 'Fórmulas de compasso',
    symbols: [
      time(2, 4), time(3, 4), time(4, 4), time(5, 4), time(6, 4), time(3, 8), time(6, 8), time(9, 8), time(12, 8),
      time(2, 2), time(3, 2), time(4, 4, 'common'), time(2, 2, 'cut'),
    ],
  },
  {
    id: 'accidentals',
    title: 'Alterações',
    symbols: [
      { label: 'Dobrado bemol', glyph: G(0x1d12b), kind: 'accidental', alter: -2 },
      { label: 'Bemol', glyph: FLAT, kind: 'accidental', alter: -1 },
      { label: 'Bequadro', glyph: NATURAL, kind: 'accidental', alter: 0 },
      { label: 'Sustenido', glyph: SHARP, kind: 'accidental', alter: 1 },
      { label: 'Dobrado sustenido', glyph: G(0x1d12a), kind: 'accidental', alter: 2 },
    ],
  },
  {
    id: 'articulations',
    title: 'Articulações',
    symbols: [
      articulation('Acento', 'accent', 'accent'),
      articulation('Staccato', 'staccato', 'staccato'),
      articulation('Staccatissimo', 'staccatissimo', 'staccatissimo'),
      articulation('Tenuto', 'tenuto', 'tenuto'),
      articulation('Portato (tenuto-staccato)', 'portato', 'detached-legato'),
      articulation('Marcato', 'marcato', 'strong-accent', { type: 'up' }),
      articulation('Acento suave (stress)', 'stress', 'stress'),
      articulation('Átono (unstress)', 'unstress', 'unstress'),
    ],
  },
  {
    id: 'ornaments',
    title: 'Ornamentos',
    symbols: [
      ornament('Trilo', { glyph: G(0x1d196) }, 'trill-mark'),
      ornament('Grupeto', { glyph: G(0x1d197) }, 'turn'),
      ornament('Grupeto invertido', { glyph: G(0x1d198) }, 'inverted-turn'),
      ornament('Mordente', { icon: 'mordent' }, 'mordent'),
      ornament('Mordente invertido', { icon: 'inverted-mordent' }, 'inverted-mordent'),
      ornament('Trémulo (1 traço)', { icon: 'tremolo-1' }, 'tremolo', { text: 1, attrs: { type: 'single' }, replace: ['tremolo'] }),
      ornament('Trémulo (2 traços)', { icon: 'tremolo-2' }, 'tremolo', { text: 2, attrs: { type: 'single' }, replace: ['tremolo'] }),
      ornament('Trémulo (3 traços)', { icon: 'tremolo-3' }, 'tremolo', { text: 3, attrs: { type: 'single' }, replace: ['tremolo'] }),
    ],
  },
  {
    id: 'breaths',
    title: 'Respirações e suspensões',
    symbols: [
      mark('Fermata', null, { name: 'fermata', attrs: { type: 'upright' } }, { glyph: G(0x1d110) }),
      mark('Fermata invertida', null, { name: 'fermata', attrs: { type: 'inverted' } }, { glyph: G(0x1d111) }),
      mark('Respiração', null, { group: 'articulations', name: 'breath-mark' }, { glyph: G(0x1d112) }),
      mark('Cesura', null, { group: 'articulations', name: 'caesura' }, { glyph: G(0x1d113) }),
    ],
  },
  {
    id: 'dynamics',
    title: 'Dinâmicas',
    symbols: DYNAMICS.map(dynamic),
  },
  {
    id: 'lines',
    title: 'Linhas',
    hint: 'Selecione as notas (Shift+clique) que a linha abrange',
    symbols: [
      { label: 'Ligadura de expressão', icon: 'slur', kind: 'spanner', value: 'slur' },
      { label: 'Crescendo', glyph: G(0x1d192), kind: 'spanner', value: 'crescendo' },
      { label: 'Diminuendo', glyph: G(0x1d193), kind: 'spanner', value: 'diminuendo' },
      { label: 'Oitava acima (8va)', text: '8va', italic: true, kind: 'spanner', value: '8va' },
      { label: 'Oitava abaixo (8vb)', text: '8vb', italic: true, kind: 'spanner', value: '8vb' },
    ],
  },
  {
    id: 'barlines',
    title: 'Barras de compasso',
    symbols: [
      { label: 'Barra simples', glyph: G(0x1d100), kind: 'barline', value: 'normal', at: 'end' },
      { label: 'Barra dupla', glyph: G(0x1d101), kind: 'barline', value: 'double', at: 'end' },
      { label: 'Barra final', glyph: G(0x1d102), kind: 'barline', value: 'final', at: 'end' },
      { label: 'Barra tracejada', glyph: G(0x1d104), kind: 'barline', value: 'dashed', at: 'end' },
      { label: 'Início de repetição', glyph: G(0x1d106), kind: 'barline', value: 'repeat-start' },
      { label: 'Fim de repetição', glyph: G(0x1d107), kind: 'barline', value: 'repeat-end', at: 'end' },
      { label: 'Casa 1 (volta)', text: '1.', boxed: true, kind: 'barline', value: 'volta-1' },
      { label: 'Casa 2 (volta)', text: '2.', boxed: true, kind: 'barline', value: 'volta-2' },
    ],
  },
  {
    id: 'repeats',
    title: 'Repetições e saltos',
    symbols: [
      { label: 'Segno', glyph: G(0x1d10b), kind: 'direction', direction: { types: [['segno']], sound: { segno: 'segno' }, at: 'start' } },
      { label: 'Coda', glyph: G(0x1d10c), kind: 'direction', direction: { types: [['coda']], sound: { coda: 'coda' }, at: 'start' } },
      words('Da capo', 'D.C.', { at: 'end', sound: { dacapo: 'yes' } }),
      words('Da capo al Fine', 'D.C. al Fine', { at: 'end', sound: { dacapo: 'yes' } }),
      words('Dal segno', 'D.S.', { at: 'end', sound: { dalsegno: 'segno' } }),
      words('Dal segno al Coda', 'D.S. al Coda', { at: 'end', sound: { dalsegno: 'segno' } }),
      words('Fine', 'Fine', { at: 'end', sound: { fine: 'yes' } }),
      words('Para a Coda', 'To Coda', { at: 'end', sound: { tocoda: 'coda' } }),
    ],
  },
  {
    id: 'tempo',
    title: 'Tempo',
    symbols: [
      metronome(60), metronome(80), metronome(100), metronome(120), metronome(140),
      tempoText('Largo', 50), tempoText('Adagio', 70), tempoText('Andante', 90), tempoText('Moderato', 110),
      tempoText('Allegro', 132), tempoText('Presto', 180),
      words('Ritardando', 'rit.', { italic: true }), words('Accelerando', 'accel.', { italic: true }),
      words('A tempo', 'a tempo'),
    ],
  },
  {
    id: 'text',
    title: 'Texto',
    symbols: [
      { label: 'Texto de pauta', text: 'Txt', kind: 'direction', ask: 'Texto de pauta' },
      {
        label: 'Marca de ensaio', text: 'A', boxed: true, kind: 'direction',
        direction: ({ nextRehearsalMark }) => ({ types: [['rehearsal', nextRehearsalMark(), { enclosure: 'square' }]], at: 'start' }),
      },
      words('dolce', 'dolce', { italic: true, placement: 'below' }),
      words('espressivo', 'espress.', { italic: true, placement: 'below' }),
      words('cresc.', 'cresc.', { italic: true, placement: 'below' }),
      words('dim.', 'dim.', { italic: true, placement: 'below' }),
      words('legato', 'legato', { italic: true, placement: 'below' }),
      words('pizzicato', 'pizz.'),
      words('arco', 'arco'),
    ],
  },
  {
    id: 'noteheads',
    title: 'Cabeças de nota',
    symbols: [
      { label: 'Normal', icon: 'head-normal', kind: 'notehead', value: 'normal' },
      { label: 'Cruz (x)', icon: 'head-x', kind: 'notehead', value: 'x' },
      { label: 'Losango', icon: 'head-diamond', kind: 'notehead', value: 'diamond' },
      { label: 'Barra (slash)', icon: 'head-slash', kind: 'notehead', value: 'slash' },
      { label: 'Triângulo', icon: 'head-triangle', kind: 'notehead', value: 'triangle' },
      { label: 'Círculo com cruz', icon: 'head-circle-x', kind: 'notehead', value: 'circle-x' },
    ],
  },
  {
    id: 'arpeggios',
    title: 'Arpejos',
    symbols: [
      mark('Arpejo', 'arpeggio', { name: 'arpeggiate', all: true }),
      mark('Arpejo para cima', 'arpeggio-up', { name: 'arpeggiate', all: true, attrs: { direction: 'up' } }),
      mark('Arpejo para baixo', 'arpeggio-down', { name: 'arpeggiate', all: true, attrs: { direction: 'down' } }),
    ],
  },
  {
    id: 'fingering',
    title: 'Dedilhações e técnicas',
    symbols: [
      ...[1, 2, 3, 4, 5].map((n) => mark(`Dedo ${n}`, null, { group: 'technical', name: 'fingering', text: n, pitchOnly: true, replace: ['fingering'] }, { text: String(n) })),
      mark('Arco para baixo', null, { group: 'technical', name: 'down-bow' }, { glyph: G(0x1d1aa) }),
      mark('Arco para cima', null, { group: 'technical', name: 'up-bow' }, { glyph: G(0x1d1ab) }),
      mark('Harmónico', null, { group: 'technical', name: 'harmonic' }, { text: 'o' }),
      mark('Abafado (+)', null, { group: 'technical', name: 'stopped' }, { text: '+' }),
      mark('Polegar', null, { group: 'technical', name: 'thumb-position' }, { icon: 'thumb' }),
    ],
  },
];

// Staff text asked from the user: the symbol to apply
export const staffTextSymbol = (text) => ({
  label: 'Texto de pauta',
  kind: 'direction',
  direction: { types: [['words', text]], placement: 'above' },
});
