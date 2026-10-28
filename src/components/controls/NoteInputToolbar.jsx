import React, { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PenLine, Undo2, Redo2, Trash2, X, Shapes } from 'lucide-react';
import { TooltipProvider } from '../ui/tooltip';
import { ToolbarButton, ToolbarSeparator } from './WidgetToolbar';
import { useScoreStore } from '@/lib/stores/score-store';
import { typeFor, slotOfVoice, hasEditor } from '@music-editor/score-viewer/lib/scoreEditor';

// MuseScore's note input toolbar: durations 1-7, dot, rest, accidentals, tie, delete, undo.
// Always shown: outside note input its buttons act on the selected note (MuseScore).

const FLAGS = { eighth: 1, '16th': 2, '32nd': 3, '64th': 4 };

// Duration glyph drawn in SVG (no music font needed)
const NoteGlyph = ({ type, className }) => {
  const hollow = type === 'whole' || type === 'half';
  const stem = type !== 'whole';
  const flags = FLAGS[type] || 0;
  return (
    <svg viewBox="0 0 16 24" className={className} aria-hidden="true">
      <ellipse cx="6.5" cy="18" rx="4.2" ry="3" transform="rotate(-20 6.5 18)" fill={hollow ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth={hollow ? 1.6 : 0} />
      {stem && <line x1="10.4" y1="17" x2="10.4" y2="2.5" stroke="currentColor" strokeWidth="1.4" />}
      {Array.from({ length: flags }, (_, i) => (
        <path key={i} d={`M10.4 ${2.5 + i * 3.2} q4.5 2.6 3 8`} fill="none" stroke="currentColor" strokeWidth="1.4" />
      ))}
    </svg>
  );
};

const RestGlyph = ({ className }) => (
  <svg viewBox="0 0 16 24" className={className} aria-hidden="true">
    <path d="M6 3 l5 6 l-3.5 4 l4 6 c-3-1.5-5.5-.5-4 3 c-4-3-2.5-6 1-5 l-4.5-6 l3-4 z" fill="currentColor" />
  </svg>
);

const DotGlyph = ({ count = 1, className }) => (
  <svg viewBox="0 0 16 24" className={className} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <circle key={i} cx={count === 1 ? 8 : 5 + i * 6} cy="15" r="2" fill="currentColor" />)}
  </svg>
);

const TieGlyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M3 12 q9 8 18 0 q-9 5 -18 0" fill="currentColor" />
  </svg>
);

const textIcon = (text) => {
  const Icon = ({ className }) => (
    <span className={`${className} flex items-center justify-center text-[15px] leading-none font-serif`}>{text}</span>
  );
  return Icon;
};

const DURATIONS = [
  ['64th', 'Semifusa', '1'], ['32nd', 'Fusa', '2'], ['16th', 'Semicolcheia', '3'], ['eighth', 'Colcheia', '4'],
  ['quarter', 'Semínima', '5'], ['half', 'Mínima', '6'], ['whole', 'Semibreve', '7'],
];
// Voices 1-4: the digit like the other buttons, with the voice's colour (palette tokens
// --voice-N in App.css, the same colour as the note input caret) as a thin bar under it
const VOICES = [1, 2, 3, 4];
const voiceIcons = Object.fromEntries(VOICES.map((slot) => [slot, ({ className }) => (
  <span className={`${className} relative flex flex-col items-center justify-center text-[13px] font-semibold leading-none`}>
    {slot}
    <span className="absolute -bottom-[3px] h-[2px] w-3 rounded-full" style={{ background: `hsl(var(--voice-${slot}))` }} />
  </span>
)]));

// Chord mode: two noteheads on one stem
const ChordGlyph = ({ className }) => (
  <svg viewBox="0 0 16 24" className={className} aria-hidden="true">
    <ellipse cx="6.5" cy="18" rx="4.2" ry="3" transform="rotate(-20 6.5 18)" fill="currentColor" />
    <ellipse cx="6.5" cy="12" rx="4.2" ry="3" transform="rotate(-20 6.5 12)" fill="currentColor" />
    <line x1="10.4" y1="17" x2="10.4" y2="2.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const ACCIDENTALS = [[-2, '♭♭', 'Dobrado bemol'], [-1, '♭', 'Bemol'], [0, '♮', 'Bequadro'], [1, '♯', 'Sustenido'], [2, '×', 'Dobrado sustenido']];
const glyphs = Object.fromEntries(DURATIONS.map(([type]) => [type, (props) => <NoteGlyph type={type} {...props} />]));
const accidentalIcons = Object.fromEntries(ACCIDENTALS.map(([alter, text]) => [alter, textIcon(text)]));
const SingleDot = (props) => <DotGlyph count={1} {...props} />;
const DoubleDot = (props) => <DotGlyph count={2} {...props} />;

const NoteInputToolbar = () => {
  const {
    editing, selectedNote, canUndo, canRedo,
    toggleEditing, stopEditing, setInputDuration, toggleInputDot, toggleInputRest,
    setAccidentalLast, tieLast, deleteLast, undoEdit, redoEdit, setEditMessage,
    setSelectedDuration, deleteSelected, setAccidentalSelected, setInputVoice,
    toggleTieSelected, toggleChordMode, palettesOpen, togglePalettes,
  } = useScoreStore(useShallow((s) => ({
    toggleTieSelected: s.toggleTieSelected,
    toggleChordMode: s.toggleChordMode,
    palettesOpen: s.palettesOpen,
    togglePalettes: s.togglePalettes,
    setInputVoice: s.setInputVoice,
    editing: s.editing,
    selectedNote: s.selection?.note || null,
    setSelectedDuration: s.setSelectedDuration,
    deleteSelected: s.deleteSelected,
    setAccidentalSelected: s.setAccidentalSelected,
    canUndo: s.editUndo.length > 0,
    canRedo: s.editRedo.length > 0,
    toggleEditing: s.toggleEditing,
    stopEditing: s.stopEditing,
    setInputDuration: s.setInputDuration,
    toggleInputDot: s.toggleInputDot,
    toggleInputRest: s.toggleInputRest,
    setAccidentalLast: s.setAccidentalLast,
    tieLast: s.tieLast,
    deleteLast: s.deleteLast,
    undoEdit: s.undoEdit,
    redoEdit: s.redoEdit,
    setEditMessage: s.setEditMessage,
  })));

  // Messages (e.g. "measure not editable") fade after a few seconds
  useEffect(() => {
    if (!editing.message) return undefined;
    const t = setTimeout(() => setEditMessage(null), 3500);
    return () => clearTimeout(t);
  }, [editing.message, setEditMessage]);

  const inputting = editing.active;
  // Outside note input the buttons show and change the selected note's value
  const selected = !inputting && selectedNote ? typeFor((selectedNote.Length?.RealValue ?? 0) * 4) : null;
  const selectedIsNote = !!selectedNote && !selectedNote.isRest?.();
  const duration = inputting ? editing.duration : selected?.type;
  const dots = inputting ? editing.dots : selected?.dots ?? 0;
  const pickDuration = (type) => (inputting ? setInputDuration(type) : selected && setSelectedDuration(type, 0));
  const pickDots = (count) => (inputting
    ? toggleInputDot(count)
    : selected && setSelectedDuration(selected.type, selected.dots === count ? 0 : count));
  const canTarget = inputting ? !!editing.last : selectedIsNote;
  const pickAccidental = (alter) => (inputting ? setAccidentalLast(alter) : setAccidentalSelected(alter));
  const remove = inputting ? deleteLast : deleteSelected;
  const canRemove = inputting ? !!editing.last : !!selectedNote;
  // Voice of the selected note (1-4 on its staff), else the input voice
  const selectedStaff = selectedNote?.ParentStaff;
  const selectedSlot = !inputting && selectedNote && hasEditor() && selectedStaff
    ? slotOfVoice(
      Math.max(0, useScoreStore.getState().osmdInstance?.Sheet?.Instruments?.indexOf(selectedStaff.ParentInstrument) ?? 0),
      (selectedStaff.ParentInstrument?.Staves || []).indexOf(selectedStaff) + 1,
      selectedNote.ParentVoiceEntry?.ParentVoice?.VoiceId ?? 1,
    )
    : null;
  const voice = inputting ? editing.voice || 1 : selectedSlot || editing.voice || 1;
  const hint = inputting ? 'Na última nota (↑/↓ muda meio tom)' : canTarget ? 'Na nota selecionada (↑/↓ muda meio tom)' : 'Selecione uma nota primeiro';

  return (
    <div className="note-input-toolbar absolute left-1/2 top-3 z-[45] w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex flex-col items-center gap-1">
      <TooltipProvider>
        <div className="flex max-w-[calc(100vw-1.5rem)] items-center gap-0.5 overflow-x-auto rounded-xl border border-border/30 bg-background px-1.5 py-1 shadow-xl [scrollbar-width:none] [&>*]:shrink-0">
          <ToolbarButton icon={PenLine} label={inputting ? 'Sair da entrada de notas' : 'Entrada de notas'} shortcut="N" active={inputting} onClick={toggleEditing} />
          <ToolbarSeparator orientation="horizontal" />
          {DURATIONS.map(([type, label, key]) => (
            <ToolbarButton
              key={type}
              icon={glyphs[type]}
              iconClassName="w-4 h-5"
              label={label}
              shortcut={inputting || selected ? key : `${key} · selecione uma nota`}
              active={duration === type}
              disabled={!inputting && !selected}
              onClick={() => pickDuration(type)}
            />
          ))}
          <ToolbarSeparator orientation="horizontal" />
          <ToolbarButton icon={SingleDot} iconClassName="w-4 h-5" label="Ponto de aumentação" shortcut="." active={dots === 1} disabled={!inputting && !selected} onClick={() => pickDots(1)} />
          <ToolbarButton icon={DoubleDot} iconClassName="w-4 h-5" label="Duplo ponto" active={dots === 2} disabled={!inputting && !selected} onClick={() => pickDots(2)} />
          <ToolbarButton
            icon={RestGlyph}
            iconClassName="w-4 h-5"
            label={inputting ? 'Pausa' : 'Tornar em pausa'}
            shortcut={inputting ? '0' : 'Delete'}
            active={inputting ? editing.rest : !!selectedNote && !selectedIsNote}
            disabled={!inputting && !selectedIsNote}
            onClick={inputting ? toggleInputRest : deleteSelected}
          />
          <ToolbarSeparator orientation="horizontal" />
          {ACCIDENTALS.map(([alter, , label]) => (
            <ToolbarButton
              key={alter}
              icon={accidentalIcons[alter]}
              label={label}
              shortcut={inputting && !canTarget ? 'Escreva uma nota primeiro' : hint}
              disabled={!canTarget}
              onClick={() => pickAccidental(alter)}
            />
          ))}
          <ToolbarSeparator orientation="horizontal" />
          {VOICES.map((slot) => (
            <ToolbarButton
              key={slot}
              icon={voiceIcons[slot]}
              label={`Voz ${slot}`}
              shortcut={inputting ? `Ctrl+Alt+${slot}` : selectedIsNote ? `Mover a nota para a voz ${slot} (Ctrl+Alt+${slot})` : `Ctrl+Alt+${slot}`}
              active={voice === slot}
              onClick={() => setInputVoice(slot)}
            />
          ))}
          <ToolbarSeparator orientation="horizontal" />
          <ToolbarButton
            icon={ChordGlyph}
            iconClassName="w-4 h-5"
            label="Modo acorde"
            shortcut="Clique junta ao acorde · Shift+A-G · Alt+2-9 intervalo"
            active={editing.chordMode}
            onClick={toggleChordMode}
          />
          <ToolbarButton
            icon={TieGlyph}
            label={inputting ? 'Ligadura' : 'Ligar / desligar à nota seguinte'}
            shortcut="+"
            disabled={!canTarget}
            onClick={inputting ? tieLast : toggleTieSelected}
          />
          <ToolbarButton icon={Trash2} label={inputting ? 'Apagar última nota' : 'Apagar nota selecionada'} shortcut="Delete" disabled={!canRemove} onClick={remove} />
          <ToolbarSeparator orientation="horizontal" />
          <ToolbarButton icon={Undo2} label="Desfazer" shortcut="Ctrl+Z" disabled={!canUndo} onClick={undoEdit} />
          <ToolbarButton icon={Redo2} label="Refazer" shortcut="Ctrl+Shift+Z" disabled={!canRedo} onClick={redoEdit} />
          <ToolbarSeparator orientation="horizontal" />
          <ToolbarButton icon={Shapes} label="Paletas de símbolos" shortcut="F9" active={palettesOpen} onClick={() => togglePalettes()} />
          {inputting && (
            <>
              <ToolbarSeparator orientation="horizontal" />
              <ToolbarButton icon={X} label="Sair da entrada de notas" shortcut="Esc" onClick={stopEditing} />
            </>
          )}
        </div>
      </TooltipProvider>
      {editing.message && (
        <div className="rounded-md bg-destructive px-3 py-1 text-xs text-white shadow">{editing.message}</div>
      )}
    </div>
  );
};

export default NoteInputToolbar;
