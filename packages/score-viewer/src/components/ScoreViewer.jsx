import React, { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FilePlus2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
} from 'lucide-react';
import { useScoreStore, getRenderWidthPx, getPaperScale } from '@/lib/stores/score-store';
import { useZoom } from '../hooks/useZoom';
import { attachPlayback, detachPlayback, selectAtPoint, togglePlayback, selectWhere } from '../lib/playbackEngine';
import { applyFormattingRules, applyFormattingPostRender } from '../lib/scoreFormatting';
import { hitTest, showGhost, hideGhost, showCaret, hideCaret, middleLineAt, targetFromNote } from '../lib/noteInput';
import { pitchToMidi } from '../lib/scoreEditor';
import { SCORE_FILE_PATTERN } from '../lib/scoreFile';

// MuseScore duration keys
const DURATION_KEYS = { 1: '64th', 2: '32nd', 3: '16th', 4: 'eighth', 5: 'quarter', 6: 'half', 7: 'whole' };
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import '../styles/score.css';

// Give each OSMD page its real size so the browser can skip painting pages
// that are scrolled out of view (content-visibility: auto in score.css).
const preparePages = (host) => {
  host.querySelectorAll(':scope > div').forEach((page) => {
    const svg = page.querySelector('svg');
    const w = parseFloat(svg?.getAttribute('width'));
    const h = parseFloat(svg?.getAttribute('height'));
    if (!w || !h) return;
    page.classList.add('score-page');
    page.style.containIntrinsicSize = `${w}px ${h}px`;
  });
};

// Mouse wheels send large discrete steps; trackpad pinch (ctrl+wheel in Chrome)
// sends small continuous deltas that map to exp(-delta/100).
const wheelZoomFactor = (e) => {
  const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  if (Math.abs(dy) >= 50) return dy > 0 ? 1 / 1.15 : 1.15;
  return Math.exp(-dy / 100);
};

const ScoreViewer = ({ onCreateNew } = {}) => {
  const {
    file,
    loadingState,
    error,
    lockView: lockViewSetting,
    freezeMode,
    renderOptions,
    pageSettings,
    osmdInstance,
    setOSMDInstance,
    setLoadingState,
    setError,
    setMetadata,
    updateViewSettings,
    loadScore,
  } = useScoreStore(useShallow((s) => ({
    file: s.file,
    loadingState: s.loadingState,
    error: s.error,
    lockView: s.viewSettings.lockView,
    freezeMode: s.viewSettings.freezeMode,
    renderOptions: s.renderOptions,
    pageSettings: s.pageSettings,
    osmdInstance: s.osmdInstance,
    setOSMDInstance: s.setOSMDInstance,
    setLoadingState: s.setLoadingState,
    setError: s.setError,
    setMetadata: s.setMetadata,
    updateViewSettings: s.updateViewSettings,
    loadScore: s.loadScore,
  })));

  const hasFile = !!(file && (
    (typeof File !== 'undefined' && file instanceof File) ||
    (typeof file === 'object' && typeof file.content === 'string' && file.content.length > 0)
  ));
  // Locked view: no drag-to-pan, the cursor stays a pointer (scrollbars still work)
  const lockView = hasFile ? lockViewSetting !== false : false;

  const editModeActive = useScoreStore((s) => s.editMode.isActive);

  const viewportRef = useRef(null);
  const sizerRef = useRef(null);
  const stageRef = useRef(null);
  const hostRef = useRef(null);
  const zoomLabelRef = useRef(null);
  const osmdRef = useRef(null);
  const fileInputRef = useRef(null);

  const renderWidth = getRenderWidthPx(pageSettings);
  const continuous = useScoreStore((s) => s.viewSettings.viewMode === 'continuous');
  const noteInput = useScoreStore((s) => s.editing.active);
  const {
    zoomBy,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWidth,
    refresh,
  } = useZoom({
    viewportRef,
    sizerRef,
    stageRef,
    labelRef: zoomLabelRef,
    baseScale: getPaperScale(pageSettings),
  });

  // Load score when file and OSMD are available
  useEffect(() => {
    if (hasFile && osmdInstance) {
      (async () => {
        // loadScore already turned picked files (.mxl too) into MusicXML text
        const musicXmlContent = typeof file?.content === 'string' ? file.content : file;
        try {
          await osmdInstance.load(musicXmlContent);
          await osmdInstance.render();
          // The file reached the store through loadScore already; just mark it rendered
          setLoadingState('success');
        } catch (error) {
          setError({
            type: 'file',
            message: 'Erro ao carregar partitura',
            details: error.message,
            timestamp: new Date(),
            recoverable: true,
          });
          setLoadingState('error');
        }
      })();
    }
  }, [hasFile, file, osmdInstance, setError, setLoadingState]);

  // Clean up OSMD when file is removed
  useEffect(() => {
    if (!file && osmdInstance) {
      try {
        detachPlayback();
        if (hostRef.current) {
          hostRef.current.innerHTML = '';
        }
        setOSMDInstance(null);
        osmdRef.current = null;
        setMetadata(null);
        updateViewSettings({ totalPages: 1, pageIndex: 0 });
      } catch (err) {
        console.error('Error cleaning up OSMD:', err);
      }
    }
  }, [file, osmdInstance, setOSMDInstance, setMetadata, updateViewSettings]);

  const loadingMessages = {
    loading: 'A carregar partitura...',
    'reading-file': 'A ler ficheiro...',
    decompressing: 'A descomprimir arquivo MXL...',
    'parsing-data': 'A processar MusicXML...',
    'rendering-sheet': 'A renderizar...',
  };
  const isLoading = ['loading','reading-file','decompressing','parsing-data','rendering-sheet'].includes(loadingState);

  // Initialize OSMD only when we have a file to load
  useEffect(() => {
    if (hostRef.current && !osmdInstance && !osmdRef.current && file) {
      try {
        const osmd = new OpenSheetMusicDisplay(hostRef.current, {
          ...renderOptions,
          backend: 'svg',
          autoResize: false,
          responsive: false,
          // Saved view: pages in the saved format, or one continuous system
          ...(useScoreStore.getState().viewSettings.viewMode === 'continuous'
            ? { pageFormat: 'Endless', renderSingleHorizontalStaffline: true }
            : { pageFormat: useScoreStore.getState().pageSettings.lastAppliedFormat || 'A4_P', renderSingleHorizontalStaffline: false }),
        });
        osmd.FollowCursor = false; // the playback engine scrolls the score viewport itself
        // Decided when the graphic is first built (at load), so set it before any load
        osmd.EngravingRules.RenderMultipleRestMeasures = !!useScoreStore.getState().formatting?.system?.multiRests;
        // Every render goes through here: formatting rules are applied first; after it the
        // SVG tweaks OSMD can't do itself, then the playback timeline/selection is
        // re-attached (cursor positions and SVG notes are rebuilt by each render)
        const render = osmd.render.bind(osmd);
        osmd.render = (...args) => {
          const { pageSettings: page, formatting } = useScoreStore.getState();
          const { rebuildGraphic } = applyFormattingRules(osmd, page, formatting);
          if (rebuildGraphic) osmd.updateGraphic(); // stems are fixed when the graphic is built
          const result = render(...args);
          applyFormattingPostRender(osmd, page, formatting, getRenderWidthPx(page));
          // Right away (not only on resize): off-screen pages then skip painting
          preparePages(osmd.container);
          attachPlayback(osmd);
          // Note input caret (the page <div>s were just rebuilt)
          const { editing, clearReselect } = useScoreStore.getState();
          if (editing.active) showCaret(osmd, editing.caret); else hideCaret();
          // The note just edited (selection outside note input) is selected again
          const t = editing.reselect;
          if (t) {
            selectWhere(t.measureIndex, (n) => {
              const nt = targetFromNote(osmd, n);
              return nt && nt.partIndex === t.partIndex && nt.staff === t.staff && nt.start === t.start
                && (!t.pitch || (nt.pitch && pitchToMidi(nt.pitch) === pitchToMidi(t.pitch)));
            });
            clearReselect();
          }
          return result;
        };
        setOSMDInstance(osmd);
        osmdRef.current = osmd;
      } catch (err) {
        console.error('Error initializing OSMD:', err);
        setError({
          type: 'render',
          message: 'Erro ao inicializar o visualizador de partituras',
          details: err.message,
          timestamp: new Date(),
          recoverable: true,
        });
      }
    }
  }, [renderOptions, osmdInstance, setOSMDInstance, setError, file]);

  // The page layout no longer depends on the window size, so a resize only needs the
  // scroll area re-measured. Every OSMD render (load, page settings) resizes the stage.
  useEffect(() => {
    const stage = stageRef.current;
    if (!hasFile || !stage) return;
    const ro = new ResizeObserver(() => {
      if (hostRef.current) preparePages(hostRef.current);
      refresh();
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [hasFile, refresh]);

  // Ctrl/Cmd + wheel or trackpad pinch zooms around the cursor; a plain wheel scrolls natively.
  // Listening on window also stops the browser from zooming the whole UI.
  useEffect(() => {
    if (!hasFile) return;

    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomBy(wheelZoomFactor(e), { x: e.clientX, y: e.clientY });
    };

    // Safari reports pinch as gesture events with a cumulative scale
    let lastScale = 1;
    const onGestureStart = (e) => { e.preventDefault(); lastScale = 1; };
    const onGestureChange = (e) => {
      e.preventDefault();
      const scale = e.scale || 1;
      zoomBy(scale / lastScale, { x: e.clientX ?? window.innerWidth / 2, y: e.clientY ?? window.innerHeight / 2 });
      lastScale = scale;
    };
    const onGestureEnd = (e) => { e.preventDefault(); };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('gesturestart', onGestureStart, { passive: false });
    window.addEventListener('gesturechange', onGestureChange, { passive: false });
    window.addEventListener('gestureend', onGestureEnd, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('gesturestart', onGestureStart);
      window.removeEventListener('gesturechange', onGestureChange);
      window.removeEventListener('gestureend', onGestureEnd);
    };
  }, [hasFile, zoomBy]);

  // Note input: shadow note under the pointer, caret where the next note goes
  useEffect(() => {
    const vp = viewportRef.current;
    const osmd = osmdInstance;
    if (!hasFile || !vp || !osmd || !noteInput) {
      hideGhost();
      hideCaret();
      return;
    }
    showCaret(osmd, useScoreStore.getState().editing.caret);
    let frame = null;
    let point = null;
    const draw = () => {
      frame = null;
      const hit = point && hitTest(osmd, point.x, point.y);
      if (hit) showGhost(hit, { rest: useScoreStore.getState().editing.rest }); else hideGhost();
    };
    const onMove = (e) => {
      point = { x: e.clientX, y: e.clientY };
      if (frame == null) frame = requestAnimationFrame(draw);
    };
    const onLeave = () => { point = null; hideGhost(); };
    // Caret follows the store (after each entry or delete)
    const unsubscribe = useScoreStore.subscribe((state, prev) => {
      if (state.editing.caret !== prev.editing.caret) showCaret(osmd, state.editing.caret);
      if (state.editing.voice !== prev.editing.voice) vp.dataset.voice = String(state.editing.voice || 1);
    });
    vp.dataset.voice = String(useScoreStore.getState().editing.voice || 1);
    vp.addEventListener('pointermove', onMove);
    vp.addEventListener('pointerleave', onLeave);
    vp.classList.add('is-note-input');
    return () => {
      vp.removeEventListener('pointermove', onMove);
      vp.removeEventListener('pointerleave', onLeave);
      vp.classList.remove('is-note-input');
      if (frame != null) cancelAnimationFrame(frame);
      unsubscribe();
      hideGhost();
      hideCaret();
    };
  }, [hasFile, osmdInstance, noteInput]);

  // Switching page <-> continuous changes the whole geometry: start from the top-left
  useEffect(() => {
    viewportRef.current?.scrollTo(0, 0);
  }, [continuous]);

  // Ctrl/Cmd + = / - / 0 zoom the score instead of the browser page; Space plays/pauses
  useEffect(() => {
    if (!hasFile) return;
    const onKeyDown = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const store = useScoreStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      // Note input shortcuts (MuseScore): N, 1-7, ., 0, A-G, up/down, Delete, +, undo/redo, Esc
      if (!mod && !e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); store.toggleEditing(); return; }
      // Voices 1-4 (MuseScore Ctrl+Alt+1-4; e.code: Alt changes e.key on a Mac)
      const voiceKey = /^Digit([1-4])$/.exec(e.code);
      if (mod && e.altKey && voiceKey) { e.preventDefault(); store.setInputVoice(Number(voiceKey[1])); return; }
      // Chords (MuseScore): Shift+A-G adds that note above, Alt+2-9 an interval above
      if (store.editing.active || store.selection?.note) {
        const intervalKey = /^Digit([2-9])$/.exec(e.code);
        if (!mod && e.altKey && intervalKey) { e.preventDefault(); store.addToChord({ interval: Number(intervalKey[1]) }); return; }
        const letterKey = /^Key([A-G])$/.exec(e.code);
        if (!mod && !e.altKey && e.shiftKey && letterKey) { e.preventDefault(); store.addToChord({ letter: letterKey[1] }); return; }
      }
      if (e.key === 'F9' || (mod && e.altKey && e.code === 'KeyK')) { e.preventDefault(); store.togglePalettes?.(); return; }
      if (store.editing.active) {
        const key = e.key;
        if (key === 'Escape') { e.preventDefault(); store.stopEditing(); return; }
        if (mod && key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) store.redoEdit(); else store.undoEdit(); return; }
        if (mod && key.toLowerCase() === 'y') { e.preventDefault(); store.redoEdit(); return; }
        if (!mod && !e.altKey) {
          if (DURATION_KEYS[key]) { e.preventDefault(); store.setInputDuration(DURATION_KEYS[key]); return; }
          if (key === '.') { e.preventDefault(); store.toggleInputDot(1); return; }
          if (key === '0') { e.preventDefault(); store.toggleInputRest(); return; }
          if (/^[a-g]$/i.test(key) && !e.shiftKey) {
            e.preventDefault();
            store.enterLetter(key, middleLineAt(store.osmdInstance, store.editing.caret || {}));
            return;
          }
          if (key === '+') { e.preventDefault(); store.tieLast(); return; }
          if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); store.deleteLast(); return; }
        }
        if (key === 'ArrowUp' || key === 'ArrowDown') {
          e.preventDefault();
          store.transposeLast((key === 'ArrowUp' ? 1 : -1) * (mod ? 12 : 1));
          return;
        }
      } else if (store.selection?.note) {
        // A selected note outside note input (MuseScore): 1-7 change its value, . its dot,
        // Delete turns it into a rest, arrows move it
        const key = e.key;
        if (!mod && !e.altKey && DURATION_KEYS[key]) { e.preventDefault(); store.setSelectedDuration(DURATION_KEYS[key]); return; }
        if (!mod && !e.altKey && key === '.') { e.preventDefault(); store.toggleSelectedDot(); return; }
        if (!mod && (key === 'Delete' || key === 'Backspace')) { e.preventDefault(); store.deleteSelected(); return; }
        if (key === 'ArrowUp' || key === 'ArrowDown') {
          e.preventDefault();
          store.transposeSelected((key === 'ArrowUp' ? 1 : -1) * (mod ? 12 : 1));
          return;
        }
        if (!mod && key === '+') { e.preventDefault(); store.toggleTieSelected(); return; }
        if (mod && key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) store.redoEdit(); else store.undoEdit(); return; }
      }
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey
        && !e.target.closest?.('input, textarea, select, button, [contenteditable="true"], [role="slider"]')) {
        e.preventDefault();
        togglePlayback();
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasFile, zoomIn, zoomOut, resetZoom]);

  // A click (pointer barely moved, so not a pan) on the score selects the nearest
  // note: playback starts there; Shift+click selects a range (used for loops)
  useEffect(() => {
    const vp = viewportRef.current;
    if (!hasFile || !vp) return;
    let down = null;
    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      const rect = vp.getBoundingClientRect();
      if (e.clientX - rect.left >= vp.clientWidth || e.clientY - rect.top >= vp.clientHeight) return;
      down = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const onPointerUp = (e) => {
      if (!down || e.pointerId !== down.id) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved >= 5) return;
      const store = useScoreStore.getState();
      if (store.editing.active) {
        // Note input: write at the point (Shift: add to the chord there)
        const hit = hitTest(store.osmdInstance, e.clientX, e.clientY);
        if (hit) store.enterAt(hit, { chord: e.shiftKey || store.editing.chordMode });
        return;
      }
      selectAtPoint(e.clientX, e.clientY, { extend: e.shiftKey });
    };
    vp.addEventListener('pointerdown', onPointerDown, true);
    vp.addEventListener('pointerup', onPointerUp, true);
    return () => {
      vp.removeEventListener('pointerdown', onPointerDown, true);
      vp.removeEventListener('pointerup', onPointerUp, true);
    };
  }, [hasFile]);

  // Drag to pan (scrolls the viewport directly, no store updates per move)
  useEffect(() => {
    const vp = viewportRef.current;
    if (!hasFile || !vp || lockView) return;

    let drag = null;
    const onPointerDown = (e) => {
      if (e.button !== 0 || editModeActive) return;
      const rect = vp.getBoundingClientRect();
      // Leave clicks on the native scrollbars alone
      if (e.clientX - rect.left >= vp.clientWidth || e.clientY - rect.top >= vp.clientHeight) return;
      drag = { x: e.clientX, y: e.clientY, left: vp.scrollLeft, top: vp.scrollTop, id: e.pointerId };
      vp.setPointerCapture(e.pointerId);
      vp.classList.add('is-panning');
    };
    const onPointerMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!freezeMode) vp.scrollLeft = drag.left - (e.clientX - drag.x);
      vp.scrollTop = drag.top - (e.clientY - drag.y);
    };
    const onPointerUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      vp.classList.remove('is-panning');
    };

    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [hasFile, lockView, freezeMode, editModeActive]);

  // DnD file load (also over an open score: it replaces it)
  useEffect(() => {

    const onDragOver = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
      }
    };

    const onDrop = (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;

      if (files && files.length > 0) {
        const droppedFile = files[0];
        if (SCORE_FILE_PATTERN.test(droppedFile.name)) {
          loadScore(droppedFile);
        } else {
          setError({
            type: 'file',
            message: 'Formato de ficheiro não suportado',
            details: 'Por favor, selecione um ficheiro .xml, .musicxml ou .mxl',
            timestamp: new Date(),
            recoverable: true,
          });
        }
      }
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [loadScore, setError]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      loadScore(file);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="score-viewer-root">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.musicxml,.mxl"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Start screen when no file is loaded: create a new score or open a file */}
      {!hasFile && (
        <div className="score-start">
          <div className="score-start-cards">
            {onCreateNew && (
              <button type="button" className="score-start-card is-primary" onClick={onCreateNew}>
                <FilePlus2 size={40} />
                <span className="score-start-title">Nova partitura</span>
                <span className="score-start-sub">Instrumentos, compasso, tonalidade e página</span>
              </button>
            )}
            <button type="button" className="score-start-card" onClick={handleFileUpload}>
              <Upload size={40} />
              <span className="score-start-title">Abrir ficheiro</span>
              <span className="score-start-sub">MusicXML (.xml, .musicxml, .mxl) — ou arraste para aqui</span>
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '400px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <AlertCircle size={20} style={{ marginRight: '8px' }} />
            <strong>{error.message}</strong>
          </div>
          {error.details && (
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
              {error.details}
            </p>
          )}
        </div>
      )}

      {/* Loading overlay: CSS transform/opacity animations only, so they keep running
          on the compositor while OSMD's render blocks the page */}
      {isLoading && (
        <div className="score-loading" role="status" aria-live="polite">
          <div className="score-loading-card">
            <div className="score-loading-spinner" aria-hidden="true">
              <span className="score-loading-bar" />
              <span className="score-loading-bar" />
              <span className="score-loading-bar" />
            </div>
            <span className="score-loading-label">{loadingMessages[loadingState] || 'A carregar...'}</span>
          </div>
        </div>
      )}

      {/* Main viewport - only shown when file is loaded.
          sizer = scaled size (drives the native scroll range), stage = unscaled pages + transform */}
      {hasFile && (
        <div ref={viewportRef} className={`score-viewport${lockView ? '' : ' can-pan'}`}>
          <div className="score-frame">
            <div ref={sizerRef} className="score-sizer">
              <div ref={stageRef} className="score-stage">
                {/* Continuous mode: one system as wide as the music, so the host follows the SVG */}
                <div ref={hostRef} className="score-host" style={{ width: continuous ? 'max-content' : renderWidth }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom controls - only shown when file is loaded */}
      {hasFile && (
        <div className="score-zoom-controls">
          <Button variant="ghost" size="sm" onClick={zoomOut} title="Reduzir (Ctrl -)">
            <ZoomOut size={16} />
          </Button>
          <button type="button" className="score-zoom-label" onClick={resetZoom} title="Repor 100% (Ctrl 0)">
            {/* Text is set by useZoom so it stays live during a gesture */}
            <span ref={zoomLabelRef} />
          </button>
          <Button variant="ghost" size="sm" onClick={zoomIn} title="Ampliar (Ctrl +)">
            <ZoomIn size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fitToWidth()} title="Ajustar à largura">
            <MoveHorizontal size={16} />
          </Button>
        </div>
      )}

      {/* Edit controls - only shown when edit mode is active */}
      {editModeActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: '#333',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 100
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Edit Mode Active</h4>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Click and drag to measure distances
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoreViewer;
