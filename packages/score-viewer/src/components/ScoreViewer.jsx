import React, { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import {
  Upload,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
} from 'lucide-react';
import { useScoreStore, getRenderWidthPx, getPaperScale } from '@/lib/stores/score-store';
import { useZoom } from '../hooks/useZoom';
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

const ScoreViewer = () => {
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
        let musicXmlContent = file;
        if (file instanceof File) {
          musicXmlContent = await file.text();
        } else if (typeof file === 'object' && typeof file.content === 'string') {
          musicXmlContent = file.content;
        }
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
    'rendering-sheet': 'A renderizar partitura...',
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
          pageFormat: 'A4_Portrait',
        });
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

  // Ctrl/Cmd + = / - / 0 zoom the score instead of the browser page
  useEffect(() => {
    if (!hasFile) return;
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasFile, zoomIn, zoomOut, resetZoom]);

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

  // DnD file load
  useEffect(() => {
    if (file) return;

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
        if (/(\.(xml|musicxml|mxl))$/i.test(droppedFile.name)) {
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
  }, [file, loadScore, setError]);

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

      {/* Upload area when no file is loaded */}
      {!hasFile && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ border: '2px dashed #666', borderRadius: '12px', padding: '60px 40px', textAlign: 'center', backgroundColor: '#2a2a2a', transition: 'all 0.3s ease', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <Upload size={48} style={{ color: '#888', marginBottom: '20px' }} />
            </div>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Upload Music Score</h3>
            <p style={{ color: '#888', marginBottom: '20px' }}>
              Drag and drop your MusicXML file here, or click to browse
            </p>
            <Button onClick={handleFileUpload} style={{ backgroundColor: '#FFD700', color: 'black' }}>
              Choose File
            </Button>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '15px' }}>
              Supported formats: .xml, .musicxml, .mxl
            </p>
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

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#333',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'white'
          }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
            <p style={{ margin: 0, fontSize: '16px' }}>
              {loadingMessages[loadingState] || 'Loading...'}
            </p>
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
                <div ref={hostRef} className="score-host" style={{ width: renderWidth }} />
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
