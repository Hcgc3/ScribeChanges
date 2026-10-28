import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FORMATTING, DEFAULT_MARGINS, mergeFormatting, staffHeightFor } from '@music-editor/score-viewer/lib/scoreFormatting';
import {
  loadEditor, hasEditor, getEditorXml, closeEditor, writeAt, deleteAt, transposeAt, setAlterAt, tieFrom,
  nextPosition, DURATION_QUARTERS, diatonicToPitch, pitchToDiatonic, measureInfo, typeFor, voiceFor,
  toggleTie, toggleNoteMark, setNotehead, addDirection, addSpanner, setClef, setKey, setTime, setBarline,
  nextRehearsalMark,
} from '@music-editor/score-viewer/lib/scoreEditor';
import { targetFromNote, notePitch } from '@music-editor/score-viewer/lib/noteInput';
import { readScoreFile } from '@music-editor/score-viewer/lib/scoreFile';

const UNDO_LIMIT = 100;
const LETTER_STEPS = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };

export const MM_TO_PX = 96 / 25.4;
// OSMD lays a page out in units of 10px with a 4-unit (40px) staff, and takes the
// page width from its container. Giving the container a fixed width of
// pageWidth / staffHeight * 40px keeps the configured staff size and makes the
// layout independent of the window size (no reflow on resize or browser zoom).
const OSMD_STAFF_HEIGHT_PX = 40;
export const getRenderWidthPx = ({ widthMm = 210, staffHeight = 7 } = {}) =>
  Math.round((widthMm / staffHeight) * OSMD_STAFF_HEIGHT_PX);
// Resolves after the browser has painted (so a "rendering" overlay shows before a
// blocking OSMD render); the timeout covers background tabs where rAF is paused.
const nextPaint = () => new Promise((resolve) => {
  let done = false;
  const finish = () => { if (!done) { done = true; resolve(); } };
  requestAnimationFrame(() => setTimeout(finish, 0));
  setTimeout(finish, 100);
});

// CSS scale at which a rendered page shows at paper size, i.e. what 100% zoom means.
export const getPaperScale = (pageSettings = {}) =>
  ((pageSettings.widthMm || 210) * MM_TO_PX) / getRenderWidthPx(pageSettings);

// Score Store - Music score state management
export const useScoreStore = create(
  persist(
    (set, get) => ({
      // Current score state
      file: null,
      loadingState: 'idle', // 'idle' | 'loading' | 'success' | 'error'
      error: null,
      metadata: null,
      osmdInstance: null,
      // SVG render cache keyed by normalized zoom (e.g. 0.5,1,1.5)
      svgCache: {},

      // Selection and editing
      selection: null,
      editHistory: [],
      editHistoryIndex: -1,
      maxHistorySize: 50,

      // View settings
      viewSettings: {
        zoom: 1.0,
        // Added zoom constraints and step for enhanced zoom control
        minZoom: 0.2,
        maxZoom: 6.0,
        zoomStep: 0.2,
        pageIndex: 0,
        totalPages: 1,
        viewMode: 'page', // 'page' (fixed A4) | 'continuous' (future editing)
        showMeasureNumbers: true,
        showPageNumbers: true,
        autoResize: true,
        // Freeze horizontal pan
        freezeMode: false,
        // Lock view: disable drag pan and use native scrollbars
        lockView: false,
        // Playback line: 'smooth' glides with the audio, 'step' jumps note to note
        playheadMode: 'smooth',
        // Colour the notes while they sound
        highlightPlayingNotes: true,
      },

      // Page settings for custom page sizes
      pageSettings: {
        // Original user-entered values
        width: 210,
        height: 297,
        unit: 'mm',
        staffHeight: 7, // default staff height in mm
        symbolSize: 1.0, // overall music glyph scale
        // Normalized base mm
        widthMm: 210,
        heightMm: 297,
        // Derived px
        widthPx: 794,
        heightPx: 1123,
        preset: 'a4-portrait',
        lastAppliedFormat: 'A4_P',
        // Page margins (mm)
        margins: { ...DEFAULT_MARGINS },
      },

      // Advanced formatting (Formatação panel); applied to OSMD before every render
      formatting: DEFAULT_FORMATTING,

      // Note input (edit mode), MuseScore style. caret/last: { partIndex, staff, voice,
      // measureIndex, start (divisions) }; last = the note just written
      // reselect: { partIndex, staff, measureIndex, start, pitch? } to select again after the reload
      // voice: MuseScore's voice 1-4 notes are written in (polyphony)
      // chordMode: clicks add the note to the chord there instead of replacing it
      editing: { active: false, duration: 'quarter', dots: 0, rest: false, voice: 1, chordMode: false, caret: null, last: null, message: null, reselect: null },
      editUndo: [],
      editRedo: [],
      // Palettes panel (symbols by category, MuseScore F9)
      palettesOpen: false,
      togglePalettes: (open) => set((s) => ({ palettesOpen: typeof open === 'boolean' ? open : !s.palettesOpen })),

      // Pan state for viewport panning
      panState: {
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0,
        isDragging: false,
      },

      // Edit mode state (for interactive score editing overlays)
      editMode: {
        isActive: false,
        showGrid: false,
        showDistances: false,
        controlPoints: [],
        selectedElement: null,
        musicalAnalysis: null,
      },

      // Playback state
      playbackState: {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        tempo: 120,
        volume: 0.8,
        loop: false,
        loopStart: null,
        loopEnd: null,
      },

      // Render options
      renderOptions: {
        autoResize: true,
        backend: 'svg',
        drawTitle: true,
        drawSubtitle: true,
        drawComposer: true,
        drawCredits: false,
        drawPartNames: true,
        drawMeasureNumbers: true,
        measureNumberInterval: 1,
        pageFormat: 'A4',
        pageBackgroundColor: '#FFFFFF',
        renderSingleHorizontalStaffline: false,
        zoom: 1.0,
        responsive: false, // fixed page layout for A4
        followCursor: true,
        cursorColor: '#FFD700',
      },

      // Audio settings
      audioSettings: {
        masterVolume: 0.8,
        instrumentVolumes: {},
        reverbLevel: 0.2,
        chorusLevel: 0.1,
        soundFont: null,
        audioContext: null,
      },

      // Metronome
      metronome: {
        enabled: false,
        volume: 0.6,
        sound: 'click',
        accentFirstBeat: true,
        countIn: 0,
      },

      // Actions
      initialize: () => {
        // Initialize any score-related settings or state
        // This can be expanded later for any score initialization logic
        set((state) => ({
          ...state,
          loadingState: 'idle',
          error: null,
        }));
      },

      setFile: (file) => {
        set({ file, loadingState: 'idle', error: null });
      },

      setLoadingState: (state) => {
        set({ loadingState: state });
      },

      setError: (error) => {
        set({ error, loadingState: 'error' });
      },

      setMetadata: (metadata) => {
        set({ metadata });
      },

      setOSMDInstance: (instance) => {
        set({ osmdInstance: instance });
      },

      // Re-render the score after `mutate(osmd)` (rules/options changes), showing the
      // "rendering" overlay first: OSMD's render blocks the page for a moment.
      renderScore: async (mutate) => {
        const osmd = get().osmdInstance;
        if (!osmd) return false;
        set({ loadingState: 'rendering-sheet' });
        await nextPaint();
        try {
          mutate?.(osmd);
          osmd.render();
          return true;
        } catch (e) {
          console.error('renderScore error', e);
          return false;
        } finally {
          set({ loadingState: 'success' });
        }
      },

      // Selection management
      setSelection: (selection) => {
        set({ selection });
      },

      clearSelection: () => {
        set({ selection: null });
      },

      // Edit mode management
      setEditMode: (payload) => {
        set({ editMode: payload });
      },

      // Pan management
      setPanState: (payload) => {
        set((state) => ({ panState: { ...state.panState, ...payload } }));
      },

      startPan: (startX, startY) => {
        set((state) => ({
          panState: { ...state.panState, isDragging: true, lastX: startX, lastY: startY },
        }));
      },

      updatePan: (x, y) => {
        set((state) => {
          if (!state.panState.isDragging) return { panState: state.panState };
          const deltaX = x - state.panState.lastX;
          const deltaY = y - state.panState.lastY;
          return {
            panState: {
              ...state.panState,
              x: state.panState.x + deltaX,
              y: state.panState.y + deltaY,
              lastX: x,
              lastY: y,
            },
          };
        });
      },

      endPan: () => {
        set((state) => ({ panState: { ...state.panState, isDragging: false } }));
      },

      resetPan: () => {
        set({ panState: { x: 0, y: 0, lastX: 0, lastY: 0, isDragging: false } });
      },

      // Edit history management
      addToHistory: (action) => {
        set((state) => {
          const newHistory = state.editHistory.slice(0, state.editHistoryIndex + 1);
          newHistory.push({
            ...action,
            timestamp: new Date(),
          });

          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }

          return {
            editHistory: newHistory,
            editHistoryIndex: newHistory.length - 1,
          };
        });
      },

      undo: () => {
        const { editHistory, editHistoryIndex } = get();
        if (editHistoryIndex > 0) {
          const action = editHistory[editHistoryIndex];
          // Apply reverse action
          if (action.type === 'page-settings' && action.before) {
            const s = get();
            // Revert page settings without re-render history pollution
            const revert = action.before;
            // Minimal reapply: call applyPageSettings to ensure render and cache clear
            s.applyPageSettings({
              width: revert.width,
              height: revert.height,
              unit: revert.unit,
              preset: revert.preset,
              margins: revert.margins,
            });
          }
          set({ editHistoryIndex: editHistoryIndex - 1 });
        }
      },

      redo: () => {
        const { editHistory, editHistoryIndex } = get();
        if (editHistoryIndex < editHistory.length - 1) {
          const action = editHistory[editHistoryIndex + 1];
          if (action.type === 'page-settings' && action.after) {
            const s = get();
            const apply = action.after;
            s.applyPageSettings({
              width: apply.width,
              height: apply.height,
              unit: apply.unit,
              preset: apply.preset,
              margins: apply.margins,
            });
          }
          set({ editHistoryIndex: editHistoryIndex + 1 });
        }
      },

      clearHistory: () => {
        set({ editHistory: [], editHistoryIndex: -1 });
      },

      // View settings
      updateViewSettings: (settings) => {
        set((state) => ({
          viewSettings: { ...state.viewSettings, ...settings },
        }));
      },

      // Page settings
      updatePageSettings: (settings) => {
        set((state) => ({
          pageSettings: { ...state.pageSettings, ...settings, margins: { ...state.pageSettings.margins, ...(settings.margins || {}) } },
        }));
      },

      // Utility: unit conversions
      _convertToMm: (value, unit) => {
        switch(unit) {
          case 'mm': return value;
          case 'cm': return value * 10;
          case 'in': return value * 25.4;
          case 'px': return value / 3.7795275591; // 96 DPI
          default: return value;
        }
      },
      _convertFromMm: (mm, unit) => {
        switch(unit) {
          case 'mm': return mm;
          case 'cm': return mm / 10;
            case 'in': return mm / 25.4;
          case 'px': return mm * 3.7795275591;
          default: return mm;
        }
      },

      // Apply and re-render page settings through OSMD
      applyPageSettings: async (payload = {}) => {
        const state = get();
        const osmd = state.osmdInstance;
        if (!osmd) return { ok: false, error: 'OSMD instance not ready' };
        const prevSettings = { ...state.pageSettings };
        const prevPages = state.viewSettings.totalPages;
        const merged = { ...state.pageSettings, ...payload, margins: { ...state.pageSettings.margins, ...(payload.margins || {}) } };
        const { width, height, unit, preset, margins, staffHeight, symbolSize } = merged;
        const widthMm = state._convertToMm(width, unit);
        const heightMm = state._convertToMm(height, unit);
        const PRESET_MAP = { 'a4-portrait': 'A4_P', 'a4-landscape': 'A4_L', 'a3-portrait': 'A3_P', 'a3-landscape': 'A3_L', 'letter-portrait': 'Letter_P', 'letter-landscape': 'Letter_L', 'legal-portrait': 'Legal_P', 'tabloid-portrait': 'Tabloid_P' };
        let pageFormat = PRESET_MAP[preset] || PRESET_MAP[merged.preset];
        if (!pageFormat) pageFormat = `${Math.round(widthMm)}x${Math.round(heightMm)}`;
        try {
          await state.clearSVGCache();
          // Apply symbol size to OSMD engraving rules before rendering
          if (osmd && osmd.EngravingRules && symbolSize) {
            osmd.EngravingRules.NoteHeadScale = symbolSize;
            if (osmd.EngravingRules.ClefSize !== undefined) osmd.EngravingRules.ClefSize = symbolSize;
            if (osmd.EngravingRules.AccidentalSize !== undefined) osmd.EngravingRules.AccidentalSize = symbolSize;
            if (osmd.EngravingRules.OrnamentSize !== undefined) osmd.EngravingRules.OrnamentSize = symbolSize;
            if (osmd.EngravingRules.ArticulationSize !== undefined) osmd.EngravingRules.ArticulationSize = symbolSize;
            if (osmd.EngravingRules.FingeringSize !== undefined) osmd.EngravingRules.FingeringSize = symbolSize;
            if (osmd.EngravingRules.LyricFontSize !== undefined) osmd.EngravingRules.LyricFontSize = Math.round(10 * symbolSize);
          }
          // Store first: the render wrapper formats the score from pageSettings
          set((s) => ({
            pageSettings: { ...s.pageSettings, width: merged.width, height: merged.height, unit: merged.unit, staffHeight, symbolSize, preset: merged.preset, widthMm, heightMm, widthPx: state._convertFromMm(widthMm, 'px'), heightPx: state._convertFromMm(heightMm, 'px'), lastAppliedFormat: pageFormat, margins: { ...margins } },
          }));
          osmd.setOptions({ pageFormat });
          // The viewer's host element is OSMD's container; size it before rendering
          // (continuous mode sizes itself to the single system)
          const continuous = state.viewSettings.viewMode === 'continuous';
          if (osmd.container && !continuous) osmd.container.style.width = `${getRenderWidthPx({ widthMm, staffHeight: merged.staffHeight })}px`;
          set({ loadingState: 'rendering-sheet' });
          await nextPaint();
          try {
            osmd.render();
          } finally {
            set({ loadingState: 'success' });
          }
          let totalPages = state.viewSettings.totalPages;
          try { totalPages = osmd.GraphicSheet?.MusicPages?.length || totalPages; } catch {}
          // Compute page drop warning
          let pageDropWarning = null;
          if (prevPages > 0 && totalPages < prevPages) {
            const dropPct = (1 - totalPages / prevPages) * 100;
            if (dropPct >= 50) pageDropWarning = { prev: prevPages, now: totalPages, dropPct: Math.round(dropPct) };
          }
          set((s) => ({
            viewSettings: { ...s.viewSettings, totalPages, pageIndex: Math.min(s.viewSettings.pageIndex, totalPages - 1) }
          }));
          // History push (lightweight)
          if (state.addToHistory) {
            state.addToHistory({ type: 'page-settings', before: prevSettings, after: { ...prevSettings, width, height, unit, preset, widthMm, heightMm, margins: { ...margins }, pageFormat }, pagesBefore: prevPages, pagesAfter: totalPages });
          }
          return { ok: true, pageFormat, pages: totalPages, warning: pageDropWarning };
        } catch (e) {
          console.error('applyPageSettings error', e);
          return { ok: false, error: e?.message || 'Unknown error' };
        }
      },

      // Merge a formatting patch ({ page|system|elements|text: {...} }) and re-render.
      // The master/system scales change the staff height, i.e. the render width,
      // so they go through applyPageSettings.
      updateFormatting: async (patch = {}) => {
        const prev = mergeFormatting(get().formatting);
        const next = mergeFormatting({
          page: { ...prev.page, ...patch.page },
          system: { ...prev.system, ...patch.system },
          elements: { ...prev.elements, ...patch.elements },
          text: { ...prev.text, ...patch.text },
        });
        set({ formatting: next });
        if (prev.system.multiRests !== next.system.multiRests) return get().reloadScore();
        const staffHeight = staffHeightFor(next);
        if (Math.abs(staffHeight - (get().pageSettings.staffHeight || 7)) > 1e-6) {
          return get().applyPageSettings({ staffHeight });
        }
        return get().renderScore();
      },

      // Load the current file again (settings OSMD only reads while loading, e.g. multi-rests)
      reloadScore: async () => {
        const { file, osmdInstance: osmd, formatting } = get();
        if (!osmd || !file) return false;
        set({ loadingState: 'rendering-sheet' });
        await nextPaint();
        try {
          const content = typeof File !== 'undefined' && file instanceof File ? await file.text() : file.content;
          osmd.EngravingRules.RenderMultipleRestMeasures = !!mergeFormatting(formatting).system.multiRests;
          await osmd.load(content);
          osmd.render();
          return true;
        } catch (e) {
          console.error('reloadScore error', e);
          return false;
        } finally {
          set({ loadingState: 'success' });
        }
      },

      resetFormatting: async (section) => {
        const current = mergeFormatting(get().formatting);
        const next = section ? { ...current, [section]: DEFAULT_FORMATTING[section] } : DEFAULT_FORMATTING;
        set({ formatting: next });
        const staffHeight = staffHeightFor(next);
        if (Math.abs(staffHeight - (get().pageSettings.staffHeight || 7)) > 1e-6) {
          return get().applyPageSettings({ staffHeight });
        }
        return get().renderScore();
      },

      // Everything back to the default formatting, page margins included
      resetAllFormatting: async () => {
        set({ formatting: DEFAULT_FORMATTING });
        return get().applyPageSettings({ margins: { ...DEFAULT_MARGINS }, staffHeight: staffHeightFor(DEFAULT_FORMATTING) });
      },

      // 'page' (pages) | 'continuous' (one long system, no pages)
      setViewMode: async (mode) => {
        const continuous = mode === 'continuous';
        const { viewSettings, pageSettings, osmdInstance } = get();
        if ((viewSettings.viewMode === 'continuous') === continuous) return true;
        set({ viewSettings: { ...viewSettings, viewMode: continuous ? 'continuous' : 'page' } });
        if (!osmdInstance) return true;
        return get().renderScore((osmd) => {
          osmd.setOptions({
            renderSingleHorizontalStaffline: continuous,
            pageFormat: continuous ? 'Endless' : (pageSettings.lastAppliedFormat || 'A4_P'),
          });
          if (!continuous && osmd.container) osmd.container.style.width = `${getRenderWidthPx(pageSettings)}px`;
        });
      },

      // ---- note input ----------------------------------------------------------------

      // The XML edit session (also used outside note input, for the selected note)
      _ensureEditor: async () => {
        if (hasEditor()) return true;
        const { file, editing } = get();
        if (!file) return false;
        try {
          const content = typeof File !== 'undefined' && file instanceof File ? await file.text() : file.content;
          loadEditor(content);
          return true;
        } catch (e) {
          set({ editing: { ...editing, message: e.message } });
          return false;
        }
      },

      // ---- the selected note (outside note input, MuseScore style) --------------------

      _editSelected: async (op) => {
        const { selection, osmdInstance } = get();
        if (!selection?.note || !osmdInstance) return false;
        if (!(await get()._ensureEditor())) return false;
        const target = targetFromNote(osmdInstance, selection.note);
        if (!target) return false;
        const chordPitches = (selection.note.ParentVoiceEntry?.Notes || []).map(notePitch).filter(Boolean);
        const result = get()._commitEdit(() => op(target, chordPitches));
        if (!result) return false;
        set((s) => ({ editing: { ...s.editing, reselect: result.reselect || target } }));
        return true;
      },

      // New value for the selected note/chord/rest: shorter leaves rests, longer
      // overwrites what follows (and ties over the barline)
      setSelectedDuration: (type, dots = 0) => get()._editSelected((t, chord) => {
        const info = writeAt({ ...t, quarters: DURATION_QUARTERS[type], dots, pitches: t.pitch ? chord : null });
        return info && { ...info, reselect: { ...t } };
      }),

      toggleSelectedDot: () => get()._editSelected((t, chord) => {
        const current = typeFor(t.quarters);
        if (!current) return null;
        const info = writeAt({ ...t, quarters: DURATION_QUARTERS[current.type], dots: current.dots ? 0 : 1, pitches: t.pitch ? chord : null });
        return info && { ...info, reselect: { ...t } };
      }),

      // Delete: the note becomes a rest of the same value (one note of a chord just goes)
      deleteSelected: () => get()._editSelected((t) => {
        const info = deleteAt({ ...t, pitch: t.pitch });
        return info && { ...info, reselect: { ...t, pitch: info.pitches?.[0] || null } };
      }),

      transposeSelected: (semitones) => get()._editSelected((t) => {
        if (!t.pitch) return null;
        const info = transposeAt({ ...t, pitch: t.pitch }, semitones);
        return info && { ...info, reselect: { ...t, pitch: info.pitches[info.pitchIndex] } };
      }),

      // Move the selected note/chord to another voice (MuseScore Ctrl+Alt+1-4): it leaves a
      // rest behind and overwrites what that voice had there
      moveSelectedToVoice: (slot) => get()._editSelected((t, chord) => {
        if (!t.pitch) return null;
        const voice = voiceFor(t.partIndex, t.staff, slot);
        if (voice === t.voice) return null;
        const { divisions } = measureInfo(t.partIndex, t.measureIndex);
        // The chord's whole value (dots included) as plain quarters
        const quarters = Math.round(t.quarters * divisions) / divisions;
        deleteAt({ ...t, pitch: null });
        const info = writeAt({ ...t, voice, quarters, dots: 0, pitches: chord });
        return info && { ...info, reselect: { ...t } };
      }),

      setAccidentalSelected: (alter) => get()._editSelected((t) => {
        if (!t.pitch) return null;
        const info = setAlterAt({ ...t, pitch: t.pitch }, alter);
        return info && { ...info, reselect: { ...t, pitch: info.pitches[info.pitchIndex] } };
      }),

      clearReselect: () => set((s) => ({ editing: { ...s.editing, reselect: null } })),

      startEditing: async () => {
        const { file, editing } = get();
        if (!file || editing.active) return !!file;
        try {
          if (!(await get()._ensureEditor())) return false;
          set({ editing: { ...editing, active: true, message: null, caret: editing.caret || { partIndex: 0, staff: 1, voice: '1', measureIndex: 0, start: 0 } } });
          return true;
        } catch (e) {
          set({ editing: { ...editing, message: e.message } });
          return false;
        }
      },

      stopEditing: () => set((s) => ({ editing: { ...s.editing, active: false } })),
      toggleEditing: () => (get().editing.active ? get().stopEditing() : get().startEditing()),

      setInputDuration: (duration) => set((s) => ({ editing: { ...s.editing, duration } })),
      // Voice 1-4: the caret moves to that voice (outside note input it moves the selection)
      toggleChordMode: () => set((s) => ({ editing: { ...s.editing, chordMode: !s.editing.chordMode } })),

      // Add a note to the chord of the last entered note (note input) or of the selected
      // note: a letter above the chord's top note (Shift+A-G) or an interval above it (Alt+2-9)
      addToChord: async ({ letter = null, interval = null }) => {
        const { editing, selection, osmdInstance } = get();
        let target = null;
        let pitches = null;
        if (editing.active) {
          if (!editing.last?.pitches?.length) { get().setEditMessage('Escreva uma nota primeiro'); return; }
          target = editing.last;
          pitches = editing.last.pitches;
        } else {
          if (!selection?.note || selection.note.isRest?.() || !osmdInstance) return;
          if (!(await get()._ensureEditor())) return;
          target = targetFromNote(osmdInstance, selection.note);
          pitches = (selection.note.ParentVoiceEntry?.Notes || []).map(notePitch).filter(Boolean);
        }
        if (!target || !pitches.length) return;
        const top = Math.max(...pitches.map(pitchToDiatonic));
        let d;
        if (letter) {
          d = top + 1;
          while (((d % 7) + 7) % 7 !== LETTER_STEPS[letter.toLowerCase()]) d++;
        } else d = top + (interval - 1);
        const info0 = measureInfo(target.partIndex, target.measureIndex);
        const pitch = diatonicToPitch(d, info0?.fifths ?? 0);
        const info = get()._commitEdit(() => writeAt({ ...target, quarters: 1, pitches: [pitch], chord: true }));
        if (!info) return;
        if (editing.active) {
          set((s) => ({ editing: { ...s.editing, last: { ...target, pitches: info.pitches, pitchIndex: info.pitches.length - 1 } } }));
        } else {
          set((s) => ({ editing: { ...s.editing, reselect: { ...target, pitch } } }));
        }
      },

      // "+" / tie button: note input ties the last note to a new one; on a selection it
      // ties to the next note of the same pitch (or writes one), or removes the tie
      toggleTieSelected: () => get()._editSelected((t) => {
        if (!t.pitch) return null;
        const info = toggleTie(t);
        return info && { ...info, reselect: { ...t } };
      }),

      // ---- palettes: a symbol on the selection (or the last entered note) ---------------
      _symbolTargets: async () => {
        const { editing, selection, osmdInstance } = get();
        if (!(await get()._ensureEditor())) return null;
        if (editing.active) {
          const t = editing.last || editing.caret;
          return t ? { from: t, to: t, note: !!editing.last } : null;
        }
        if (!selection || !osmdInstance) return null;
        if (selection.note) {
          const t = targetFromNote(osmdInstance, selection.note);
          return t && { from: t, to: t, note: !selection.note.isRest?.() };
        }
        // A range: its first and last notes
        const notes = (selection.notes || []).filter((n) => !n.isRest?.());
        const first = notes[0] && targetFromNote(osmdInstance, notes[0]);
        const last = notes.length && targetFromNote(osmdInstance, notes[notes.length - 1]);
        return first ? { from: first, to: last || first, note: true, range: true } : null;
      },

      applySymbol: async (symbol) => {
        const targets = await get()._symbolTargets();
        if (!targets) { get().setEditMessage('Selecione uma nota ou um compasso primeiro'); return false; }
        const { from, to } = targets;
        const needsNote = ['mark', 'notehead', 'accidental', 'spanner'].includes(symbol.kind);
        if (needsNote && !targets.note) { get().setEditMessage('Este símbolo vai numa nota: selecione uma nota'); return false; }
        const { editing } = get();
        const info = get()._commitEdit(() => {
          switch (symbol.kind) {
            case 'mark': return toggleNoteMark(from, symbol.mark);
            case 'notehead': return setNotehead(from, symbol.value);
            case 'accidental': return setAlterAt({ ...from, pitch: from.pitch || null, pitchIndex: from.pitchIndex ?? null }, symbol.alter);
            case 'direction': return addDirection(from, typeof symbol.direction === 'function' ? symbol.direction({ nextRehearsalMark }) : symbol.direction);
            case 'spanner': return addSpanner(from, to, symbol.value);
            case 'clef': return setClef(from, symbol.clef);
            case 'key': return setKey(from.measureIndex, symbol.fifths);
            case 'time': return setTime(from.measureIndex, symbol.beats, symbol.beatType, symbol.symbol);
            case 'barline': return setBarline(symbol.at === 'end' ? to.measureIndex : from.measureIndex, symbol.value);
            default: return null;
          }
        });
        if (!info) return false;
        if (!editing.active && from) set((s) => ({ editing: { ...s.editing, reselect: { ...from } } }));
        if (editing.active && symbol.kind === 'accidental' && editing.last) {
          set((s) => ({ editing: { ...s.editing, last: { ...editing.last, pitches: info.pitches || editing.last.pitches } } }));
        }
        return true;
      },

      setInputVoice: (slot) => {
        const { editing, selection } = get();
        if (!editing.active && selection?.note) get().moveSelectedToVoice(slot);
        set((s) => ({
          editing: {
            ...s.editing,
            voice: slot,
            caret: s.editing.caret && hasEditor()
              ? { ...s.editing.caret, voice: voiceFor(s.editing.caret.partIndex, s.editing.caret.staff, slot) }
              : s.editing.caret,
          },
        }));
      },
      toggleInputDot: (count = 1) => set((s) => ({ editing: { ...s.editing, dots: s.editing.dots === count ? 0 : count } })),
      toggleInputRest: () => set((s) => ({ editing: { ...s.editing, rest: !s.editing.rest } })),
      setEditMessage: (message) => set((s) => ({ editing: { ...s.editing, message } })),

      // Run an edit on the XML; on success the score reloads from the new XML
      _commitEdit: (fn) => {
        const before = getEditorXml();
        let info;
        try {
          info = fn();
        } catch (e) {
          set((s) => ({ editing: { ...s.editing, message: e.message } }));
          return null;
        }
        if (!info) return null;
        const after = getEditorXml();
        const { file, editUndo } = get();
        set({
          editUndo: [...editUndo, before].slice(-UNDO_LIMIT),
          editRedo: [],
          file: { name: file?.name || 'Partitura.musicxml', content: after, edit: true },
        });
        return info;
      },

      // Write at a hit/caret target with the current duration (note, or rest in rest mode)
      enterAt: (target, { chord = false, pitch } = {}) => {
        const { editing } = get();
        const quarters = DURATION_QUARTERS[editing.duration];
        const pitches = editing.rest ? null : [pitch || target.pitch];
        // Into the chosen voice (1-4) of that staff
        target = { ...target, voice: voiceFor(target.partIndex, target.staff, editing.voice || 1) };
        const info = get()._commitEdit(() => writeAt({ ...target, quarters, dots: editing.dots, pitches, chord }));
        if (!info) return;
        // pitchIndex: the note just added (a chord's accidental/arrows act on it only)
        const last = pitches ? { ...target, pitches: info.pitches, pitchIndex: (info.pitches?.length || 1) - 1 } : null;
        const caret = nextPosition({ ...target, measureIndex: info.measureIndex, start: info.start }) || { ...target };
        set((s) => ({ editing: { ...s.editing, caret, last, message: null } }));
      },

      // A-G at the caret, in the octave nearest to the previous note (or the middle line)
      enterLetter: (letter, middleLine) => {
        const { editing } = get();
        const caret = editing.caret;
        if (!caret) return;
        const step = LETTER_STEPS[letter.toLowerCase()];
        const ref = editing.last?.pitches?.[0] ? pitchToDiatonic(editing.last.pitches[0]) : middleLine;
        let d = Math.floor(ref / 7) * 7 + step;
        if (d - ref > 3) d -= 7;
        if (ref - d > 3) d += 7;
        const info = measureInfo(caret.partIndex, caret.measureIndex);
        get().enterAt(caret, { pitch: diatonicToPitch(d, info?.fifths ?? 0) });
      },

      transposeLast: (semitones) => {
        const { last } = get().editing;
        if (!last) return;
        const info = get()._commitEdit(() => transposeAt(last, semitones));
        if (info) set((s) => ({ editing: { ...s.editing, last: { ...last, pitches: info.pitches } } }));
      },

      setAccidentalLast: (alter) => {
        const { last } = get().editing;
        if (!last) return;
        const info = get()._commitEdit(() => setAlterAt(last, alter));
        if (info) set((s) => ({ editing: { ...s.editing, last: { ...last, pitches: info.pitches } } }));
      },

      deleteLast: () => {
        const { last } = get().editing;
        if (!last) return;
        const info = get()._commitEdit(() => deleteAt(last));
        if (info) set((s) => ({ editing: { ...s.editing, caret: { ...last }, last: null } }));
      },

      tieLast: () => {
        const { last, duration, dots } = get().editing;
        if (!last) return;
        const info = get()._commitEdit(() => tieFrom(last, DURATION_QUARTERS[duration], dots));
        if (!info) return;
        const next = { ...last, measureIndex: info.measureIndex, start: info.start - 0 };
        set((s) => ({ editing: { ...s.editing, caret: nextPosition(next) || next } }));
      },

      undoEdit: () => {
        const { editUndo, editRedo, file } = get();
        if (!editUndo.length) return;
        const current = getEditorXml();
        const previous = editUndo[editUndo.length - 1];
        loadEditor(previous);
        set((s) => ({
          editUndo: editUndo.slice(0, -1),
          editRedo: [...editRedo, current],
          file: { name: file?.name, content: previous, edit: true },
          editing: { ...s.editing, last: null },
        }));
      },

      redoEdit: () => {
        const { editUndo, editRedo, file } = get();
        if (!editRedo.length) return;
        const current = getEditorXml();
        const next = editRedo[editRedo.length - 1];
        loadEditor(next);
        set((s) => ({
          editRedo: editRedo.slice(0, -1),
          editUndo: [...editUndo, current],
          file: { name: file?.name, content: next, edit: true },
          editing: { ...s.editing, last: null },
        }));
      },

      // Ficheiro > Guardar: the edited (or original) MusicXML as a download
      downloadMusicXml: async () => {
        const { file } = get();
        if (!file) return;
        const content = getEditorXml()
          || (typeof File !== 'undefined' && file instanceof File ? await file.text() : file.content);
        const name = (file.name || 'Partitura').replace(/\.(mxl|xml|musicxml)$/i, '') + '.musicxml';
        const url = URL.createObjectURL(new Blob([content], { type: 'application/vnd.recordare.musicxml+xml' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },

      toggleFreezeMode: () => {
        set((state) => ({ viewSettings: { ...state.viewSettings, freezeMode: !state.viewSettings.freezeMode } }));
      },

      // New: toggle lock view mode
      toggleLockView: () => {
        set((state) => ({ viewSettings: { ...state.viewSettings, lockView: !state.viewSettings.lockView } }));
      },

      setZoom: (zoom) => {
        const min = get().viewSettings.minZoom ?? 0.25;
        const max = get().viewSettings.maxZoom ?? 4.0;
        const clampedZoom = Math.max(min, Math.min(max, zoom));
        set((state) => ({
          viewSettings: { ...state.viewSettings, zoom: clampedZoom },
          renderOptions: { ...state.renderOptions, zoom: clampedZoom },
        }));
      },

      // Multiplicative steps so each click feels the same at any zoom level
      zoomIn: () => {
        const { viewSettings } = get();
        get().setZoom(viewSettings.zoom * (1 + viewSettings.zoomStep));
      },

      zoomOut: () => {
        const { viewSettings } = get();
        get().setZoom(viewSettings.zoom / (1 + viewSettings.zoomStep));
      },

      resetZoom: () => {
        get().setZoom(1.0);
      },

      setPage: (pageIndex) => {
        set((state) => ({
          viewSettings: { ...state.viewSettings, pageIndex },
        }));
      },

      nextPage: () => {
        const { viewSettings } = get();
        if (viewSettings.pageIndex < viewSettings.totalPages - 1) {
          get().setPage(viewSettings.pageIndex + 1);
        }
      },

      previousPage: () => {
        const { viewSettings } = get();
        if (viewSettings.pageIndex > 0) {
          get().setPage(viewSettings.pageIndex - 1);
        }
      },

      // Playback controls
      updatePlaybackState: (state) => {
        set((prevState) => ({
          playbackState: { ...prevState.playbackState, ...state },
        }));
      },

      play: () => {
        set((state) => ({
          playbackState: { ...state.playbackState, isPlaying: true, isPaused: false },
        }));
      },

      pause: () => {
        set((state) => ({
          playbackState: { ...state.playbackState, isPlaying: false, isPaused: true },
        }));
      },

      stop: () => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            isPlaying: false,
            isPaused: false,
            currentTime: 0,
          },
        }));
      },

      setCurrentTime: (time) => {
        set((state) => ({
          playbackState: { ...state.playbackState, currentTime: time },
        }));
      },

      setTempo: (tempo) => {
        const clampedTempo = Math.max(30, Math.min(300, tempo));
        set((state) => ({
          playbackState: { ...state.playbackState, tempo: clampedTempo },
        }));
      },

      setVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set((state) => ({
          playbackState: { ...state.playbackState, volume: clampedVolume },
        }));
      },

      toggleLoop: () => {
        set((state) => ({
          playbackState: { ...state.playbackState, loop: !state.playbackState.loop },
        }));
      },

      setLoopRegion: (start, end) => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            loopStart: start,
            loopEnd: end,
            loop: true,
          },
        }));
      },

      clearLoopRegion: () => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            loopStart: null,
            loopEnd: null,
            loop: false,
          },
        }));
      },

      // Render options
      updateRenderOptions: (options) => {
        set((state) => ({
          renderOptions: { ...state.renderOptions, ...options },
        }));
      },

      // Audio settings
      updateAudioSettings: (settings) => {
        set((state) => ({
          audioSettings: { ...state.audioSettings, ...settings },
        }));
      },

      // Metronome
      updateMetronome: (settings) => {
        set((state) => ({
          metronome: { ...state.metronome, ...settings },
        }));
      },

      toggleMetronome: () => {
        set((state) => ({
          metronome: { ...state.metronome, enabled: !state.metronome.enabled },
        }));
      },

      // SVG Cache actions
      setSVGCacheEntry: (zoom, svgString, meta = {}) => {
        const key = Number(zoom).toFixed(2);
        set((state) => ({ svgCache: { ...state.svgCache, [key]: { svg: svgString, timestamp: Date.now(), ...meta } } }));
      },
      getSVGCacheEntry: (zoom) => {
        const key = Number(zoom).toFixed(2);
        return get().svgCache[key];
      },
      clearSVGCache: () => set({ svgCache: {} }),

      // File operations
      loadScore: async (picked) => {
        try {
          // Another file: drop the edit session of the previous one
          closeEditor();
          set((s) => ({ loadingState: 'loading', error: null, selection: null, editUndo: [], editRedo: [], editing: { ...s.editing, active: false, caret: null, last: null, reselect: null } }));
          // Picked/dropped files become MusicXML text once (.mxl unpacked)
          const file = await readScoreFile(picked);

          // Extract metadata from file (lightweight, sync-ish)
          const metadata = await get().extractMetadata(file);
          set((state) => ({
            file,
            metadata,
            // Só atualiza para 'reading-file' se não estiver em 'success'
            loadingState: state.loadingState === 'success' ? 'success' : 'reading-file',
            viewSettings: { ...state.viewSettings, pageIndex: 0 },
          }));

          // Add to recent files
          const { addRecentFile } = await import('./app-store.js');
          addRecentFile({
            id: file.name + '-' + Date.now(),
            name: file.name,
            path: file.path || '',
            metadata,
          });

        } catch (error) {
          console.error('Error loading score:', error);
          set({
            error: {
              type: 'file',
              message: 'Erro ao carregar partitura',
              details: error.message,
              timestamp: new Date(),
              recoverable: true,
            },
            loadingState: 'error',
          });
        }
      },

      extractMetadata: async (file) => {
        // Basic metadata extraction
        // In a real implementation, this would parse the MusicXML/MIDI file
        return {
          title: file.name.replace(/\.[^/.]+$/, ''),
          composer: 'Desconhecido',
          keySignature: 'C major',
          timeSignature: '4/4',
          tempo: 120,
          duration: 0,
          measures: 0,
          instruments: [],
        };
      },

      // Export functions
      exportScore: async (format, options = {}) => {
        const { file, osmdInstance } = get();
        if (!file || !osmdInstance) {
          throw new Error('Nenhuma partitura carregada');
        }

        try {
          switch (format) {
            case 'pdf':
              return await get().exportToPDF(options);
            case 'png':
              return await get().exportToPNG(options);
            case 'svg':
              return await get().exportToSVG(options);
            case 'midi':
              return await get().exportToMIDI(options);
            case 'musicxml':
              return await get().exportToMusicXML(options);
            default:
              throw new Error(`Formato não suportado: ${format}`);
          }
        } catch (error) {
          console.error('Export error:', error);
          throw error;
        }
      },

      exportToPDF: async (options) => {
        // PDF export implementation would go here
        console.log('Exporting to PDF:', options);
        return new Blob(['PDF content'], { type: 'application/pdf' });
      },

      exportToPNG: async (options) => {
        // PNG export implementation would go here
        console.log('Exporting to PNG:', options);
        return new Blob(['PNG content'], { type: 'image/png' });
      },

      exportToSVG: async (options) => {
        // SVG export implementation would go here
        console.log('Exporting to SVG:', options);
        return new Blob(['SVG content'], { type: 'image/svg+xml' });
      },

      exportToMIDI: async (options) => {
        // MIDI export implementation would go here
        console.log('Exporting to MIDI:', options);
        return new Blob(['MIDI content'], { type: 'audio/midi' });
      },

      exportToMusicXML: async (options) => {
        // MusicXML export implementation would go here
        console.log('Exporting to MusicXML:', options);
        return new Blob(['MusicXML content'], { type: 'application/xml' });
      },

      // Reset store
      reset: () => {
        set({
          file: null,
          loadingState: 'idle',
          error: null,
          metadata: null,
          osmdInstance: null,
          selection: null,
          editHistory: [],
          editHistoryIndex: -1,
          viewSettings: {
            zoom: 1.0,
            minZoom: 0.2,
            maxZoom: 6.0,
            zoomStep: 0.2,
            pageIndex: 0,
            totalPages: 1,
            viewMode: 'page',
            showMeasureNumbers: true,
            showPageNumbers: true,
            autoResize: true,
            freezeMode: false,
            lockView: false,
            playheadMode: 'smooth',
            highlightPlayingNotes: true,
          },
          panState: { x: 0, y: 0, lastX: 0, lastY: 0, isDragging: false },
          editMode: {
            isActive: false,
            showGrid: false,
            showDistances: false,
            controlPoints: [],
            selectedElement: null,
            musicalAnalysis: null,
          },
          playbackState: {
            isPlaying: false,
            isPaused: false,
            currentTime: 0,
            duration: 0,
            tempo: 120,
            volume: 0.8,
            loop: false,
            loopStart: null,
            loopEnd: null,
          },
        });
      },
    }),
    {
      name: 'music-editor-score-store',
      // v1: new default formatting/margins (earlier saves get them once)
      version: 1,
      migrate: (persisted, version) => {
        if (version < 1 && persisted) {
          delete persisted.formatting;
          if (persisted.pageSettings) persisted.pageSettings = { ...persisted.pageSettings, margins: { ...DEFAULT_MARGINS } };
        }
        return persisted;
      },
      partialize: (state) => ({
        viewSettings: state.viewSettings,
        pageSettings: state.pageSettings,
        formatting: state.formatting,
        renderOptions: state.renderOptions,
        audioSettings: state.audioSettings,
        metronome: state.metronome,
      }),
    }
  )
);

