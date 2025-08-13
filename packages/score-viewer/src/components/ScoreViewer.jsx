import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  AlertCircle, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { useScoreStore } from '@/lib/stores/score-store';
import { useZoom } from '../hooks/useZoom';
import { usePan } from '../hooks/usePan';
import { useEditMode } from '../hooks/useEditMode';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import '../styles/score.css';



const ScoreViewer = () => {

  // Destructure store and compute hasFile/lockView FIRST
  const {
    file,
    loadingState,
    error,
    viewSettings,
    renderOptions,
    osmdInstance,
    setOSMDInstance,
    setLoadingState,
    setError,
    setMetadata,
    updateViewSettings,
    loadScore,
  } = useScoreStore();

  // Initialize all refs before any usage
  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const osmdRef = useRef(null);
  const fileInputRef = useRef(null);
  const sheetContentRef = useRef(null);
  const baseContentHeightRef = useRef(0);
  const lastMeasuredPagesRef = useRef(0);
  const zoomValueRef = useRef(1);
  const baseContentWidthRef = useRef(0); // unscaled total width of content (for horizontal scrollbar)
  const scrollDragRef = useRef({ startY: 0, startScrollTop: 0, thumbHeight: 0, trackHeight: 0 });
  const scrollTrackRef = useRef(null);
  const isDraggingScrollRef = useRef(false);
  const scrollThumbSnapshotRef = useRef(null); // { totalHeight, clientHeight, thumbPx, trackPx }

  const hasFile = !!(file && (
    (typeof File !== 'undefined' && file instanceof File) ||
    (typeof file === 'object' && typeof file.content === 'string' && file.content.length > 0)
  ));
  const lockView = hasFile ? (viewSettings?.lockView !== false) : false; // disable lock-view on initial upload page

  // ...existing code...

  // Sum of visible (scaled) parts of pages inside viewport (kept)
  const getVisiblePagesScaledHeight = useCallback(() => {
    const vp = viewportRef.current;
    const cont = containerRef.current;
    if (!vp || !cont) return 0;
    const vpRect = vp.getBoundingClientRect();
    const svgs = cont.querySelectorAll('svg');
    let visible = 0;
    svgs.forEach(svg => {
      const r = svg.getBoundingClientRect();
      const top = Math.max(r.top, vpRect.top);
      const bottom = Math.min(r.bottom, vpRect.bottom);
      if (bottom > top) visible += (bottom - top);
    });
    return visible;
  }, []); // No external dependencies used, so dependency array can be empty

  const updateScrollMetrics = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const currentZoom = zoomValueRef.current || 1;

    // Re-measure unscaled base height if not dragging scrollbar
    if (lockView && !isDraggingScrollRef.current) {
      try {
        const container = containerRef.current;
        const svgs = container?.querySelectorAll('svg');
        const pageCount = svgs?.length || 0;
        if (pageCount > 0 && container) {
          // Get current zoom level
          const currentZoom = zoomValueRef.current || 1;
          // Validate zoom value
          if (currentZoom <= 0 || !isFinite(currentZoom)) {
            console.warn('Invalid zoom value for measurement:', currentZoom);
            return;
          }
          // Method 1: Measure entire container (includes all margins and gaps)
          const containerRect = container.getBoundingClientRect();
          let scaledSpan = containerRect.height;
          // Method 2: Calculate from first to last page + CSS margins (fallback)
          if (scaledSpan <= 0) {
            const firstSvg = svgs[0];
            const lastSvg = svgs[pageCount - 1];
            if (firstSvg && lastSvg) {
              const firstRect = firstSvg.getBoundingClientRect();
              const lastRect = lastSvg.getBoundingClientRect();
              // CSS-defined spacing (adjust these values to match your actual CSS)
              const TOP_MARGIN_PX = 40;
              const BOTTOM_MARGIN_PX = 40;
              const PAGE_GAP_PX = 32;
              // Calculate total gaps between pages
              const totalGapPx = pageCount > 1 ? PAGE_GAP_PX * (pageCount - 1) : 0;
              // Page span + margins + gaps
              const pageSpan = lastRect.bottom - firstRect.top;
              scaledSpan = pageSpan + TOP_MARGIN_PX + BOTTOM_MARGIN_PX + totalGapPx;
            }
          }
          // Convert to unscaled (logical) height
          const unscaledSpan = scaledSpan / currentZoom;
          // Validate measurement
          if (unscaledSpan > 0 && isFinite(unscaledSpan) && unscaledSpan < 100000) {
            // Only update if significantly different (avoid micro-updates)
            const currentBase = baseContentHeightRef.current || 0;
            const sizeDifference = Math.abs(unscaledSpan - currentBase);
            const threshold = Math.max(10, currentBase * 0.01); // 1% or 10px minimum
            if (sizeDifference > threshold || lastMeasuredPagesRef.current !== pageCount) {
              baseContentHeightRef.current = unscaledSpan;
              lastMeasuredPagesRef.current = pageCount;
              // Debug logging (remove in production)
              console.debug('Content height updated:', {
                pageCount,
                scaledSpan: Math.round(scaledSpan),
                unscaledSpan: Math.round(unscaledSpan),
                zoom: currentZoom
              });
            }
          } else {
            console.warn('Invalid measurement result:', {
              scaledSpan,
              unscaledSpan,
              currentZoom,
              pageCount
            });
          }
        } else if (pageCount === 0) {
          // No pages - reset measurements
          baseContentHeightRef.current = 0;
          lastMeasuredPagesRef.current = 0;
        }
      } catch (error) {
        console.error('Error measuring content height:', error);
        // Don't update measurements on error to maintain last known good values
      }
    }
    const unscaledContentHeight = baseContentHeightRef.current || 0; // logical height (pre-scale)
    const viewportHeight = vp.clientHeight; // visual height
    const totalScaledHeight = unscaledContentHeight * currentZoom; // visual content height
    // Determine if all pages fit entirely (no scroll needed)
    const allPagesFit = totalScaledHeight <= viewportHeight + 0.5; // epsilon
    // Max scrollTop in unscaled units so both top and bottom margins are always visible
    let maxScrollTop = 0;
    if (!allPagesFit) {
      // Add margin to both top and bottom
      const marginUnscaled = BOTTOM_MARGIN_PX / currentZoom;
      maxScrollTop = unscaledContentHeight - (viewportHeight / currentZoom) + marginUnscaled * 2;
      if (maxScrollTop < 0) maxScrollTop = 0;
    }
    // Clamp scrollTop if exceeding max
    if (lockView) {
      if (vp.scrollTop > maxScrollTop) {
        vp.scrollTop = maxScrollTop;
      }
    }
    // Prepare metrics (keep existing fields; redefine effectiveScrollHeight as totalScaledHeight for thumb calc convenience)
    const newMetrics = {
      scrollTop: vp.scrollTop,
      scrollHeight: vp.scrollHeight, // unscaled (logical)
      clientHeight: vp.clientHeight,
      effectiveScrollHeight: totalScaledHeight, // visual total pages height
    };
    if (isDraggingScrollRef.current) {
      setScrollMetrics(prev => ({ ...prev, scrollTop: newMetrics.scrollTop }));
      return;
    }
    setScrollMetrics(prev => {
      if (Math.abs(prev.scrollTop - newMetrics.scrollTop) > 1 ||
          Math.abs(prev.scrollHeight - newMetrics.scrollHeight) > 1 ||
          Math.abs(prev.clientHeight - newMetrics.clientHeight) > 1 ||
          Math.abs(prev.effectiveScrollHeight - newMetrics.effectiveScrollHeight) > 1) {
        return newMetrics;
      }
      return prev;
    });
  }, [lockView, getVisiblePagesScaledHeight, viewportRef, baseContentHeightRef, lastMeasuredPagesRef, zoomValueRef, isDraggingScrollRef, setScrollMetrics, containerRef]);
  // Ref for unscaled total width of content (for horizontal scrollbar)
  const baseContentWidthRef = useRef(0);





  // Handler for horizontal scrollbar thumb drag
  const onScrollbarThumbMouseDownHorizontal = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const trackEl = document.querySelector('.custom-scroll-track.horizontal');
    const vp = viewportRef.current;
    if (!trackEl || !vp) return;

    const trackRect = trackEl.getBoundingClientRect();
    const totalScaled = (baseContentWidthRef?.current || 0) * (zoomValueRef.current || 1) || 1;
    const visibleScaled = scrollMetrics.clientWidth;
    const ratio = totalScaled > 0 ? visibleScaled / totalScaled : 0;
    const rawThumbPx = trackRect.width * ratio;
    const thumbPx = Math.max(30, Math.min(rawThumbPx, trackRect.width));
    const thumbTravelDistance = Math.max(0, trackRect.width - thumbPx);

    scrollDragRef.current = {
      startX: e.clientX,
      startScrollLeft: vp.scrollLeft,
      thumbWidth: thumbPx,
      trackWidth: thumbTravelDistance,
    };

    setIsDraggingScroll(true);
    isDraggingScrollRef.current = true;

    const onMove = (ev) => {
      const { startX, startScrollLeft, trackWidth } = scrollDragRef.current;
      const deltaX = ev.clientX - startX;
      // Recompute maxScrollLeft dynamically for drag
      const currentZoom = zoomValueRef.current || 1;
      const unscaledContentWidth = baseContentWidthRef?.current || 0;
      const viewportWidth = vp.clientWidth;
      const totalScaledWidth = unscaledContentWidth * currentZoom;
      const allPagesFit = totalScaledWidth <= viewportWidth + 0.5;
      let maxScrollLeft = 0;
      if (!allPagesFit) {
        maxScrollLeft = unscaledContentWidth - (viewportWidth / currentZoom);
        if (maxScrollLeft < 0) maxScrollLeft = 0;
      }

      const scrollRange = maxScrollLeft;
      const scrollDelta = (deltaX / (trackWidth || 1)) * (scrollRange || 0);
      let newScrollLeft = Math.min(Math.max(0, startScrollLeft + scrollDelta), maxScrollLeft);
      vp.scrollLeft = newScrollLeft;
      updateScrollMetrics();
    };

    const onUp = () => {
      setIsDraggingScroll(false);
      isDraggingScrollRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp, { once: true });
  }, [updateScrollMetrics, scrollMetrics.clientWidth, viewportRef, baseContentWidthRef, zoomValueRef, scrollDragRef, setIsDraggingScroll, isDraggingScrollRef]);
  
  console.log('ScoreViewer component rendered at:', Date.now());
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const osmdRef = useRef(null);
  const fileInputRef = useRef(null);
  const viewportRef = useRef(null);
  const sheetContentRef = useRef(null);

  
  // Clamp zoom to sane range
  const clampZoom = (z) => Math.max(0.2, Math.min(z, 2.5));

  const [scrollMetrics, setScrollMetrics] = useState({ 
    scrollTop: 0, 
    scrollHeight: 0, 
    clientHeight: 0,
    effectiveScrollHeight: 0,
  });

  const baseContentHeightRef = useRef(0); // unscaled total height of pages (including margins)
  const lastMeasuredPagesRef = useRef(0);

  const zoomValueRef = useRef(1); // holds current zoom safely for early callbacks

  // Bottom margin (visual px) after last page when scrolling (does NOT apply when all pages fit)
  const BOTTOM_MARGIN_PX = 50;


  // Simple container size validation - let OSMD handle its own sizing
  const ensureContainerSize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return false;
    
    // Just ensure container is visible and has basic styling
    el.style.display = 'block';
    el.style.visibility = 'visible';
    
    // Let CSS and OSMD handle dimensions naturally
    el.offsetHeight; // Force layout
    
    // Just check that container exists and is visible
    const rect = el.getBoundingClientRect();
    return rect.width > 0; // Only require width > 0, OSMD will determine height
  }, [containerRef]);

  // Extract score metadata function
  const extractScoreMetadata = useCallback((osmd) => {
    try {
      const sheet = osmd?.sheet || osmd?.Sheet || {};
      const safe = (val, fallback = '') => { 
        try { 
          if (val == null) return fallback; 
          if (typeof val === 'string' || typeof val === 'number') return String(val); 
          if (typeof val === 'boolean') return val ? 'true' : 'false'; 
          if (typeof val === 'object') { 
            if (typeof val.text === 'string' || typeof val.text === 'number') return String(val.text); 
            if (typeof val.label === 'string' || typeof val.label === 'number') return String(val.label); 
            if (Array.isArray(val)) return val.map((v) => safe(v, '')).filter(Boolean).join(' '); 
            const s = val.toString?.(); 
            if (s && s !== '[object Object]') return String(s); 
          } 
          return fallback; 
        } catch { 
          return fallback; 
        } 
      };
      
      const title = safe(sheet.TitleString) || safe(sheet.title) || 'Sem título';
      const composer = safe(sheet.ComposerString) || safe(sheet.composer) || 'Compositor desconhecido';
      const firstMeasure = sheet.sourceMeasures?.[0];
      const timeSigObj = firstMeasure?.timeSignatures?.[0];
      const timeSignature = safe(timeSigObj?.toString?.()) || '4/4';
      const keySigObj = sheet.keySignatures?.[0];
      const keySignature = safe(keySigObj?.keySignature) || safe(keySigObj) || 'C major';
      const tempo = typeof sheet.defaultStartTempoInBpm === 'number' ? sheet.defaultStartTempoInBpm : 120;
      const measures = Array.isArray(sheet.sourceMeasures) ? sheet.sourceMeasures.length : 0;
      const instruments = Array.isArray(sheet.instruments) ? 
        sheet.instruments.map((i) => safe(i?.name) || safe(i?.NameString) || safe(i?.Name) || 'Instrumento').filter(Boolean) : [];
      
      return { 
        title, 
        composer, 
        keySignature, 
        timeSignature, 
        tempo, 
        duration: measures, 
        measures, 
        instruments 
      };
    } catch (err) {
      console.error('Error extracting metadata:', err);
      return { 
        title: 'Sem título', 
        composer: 'Compositor desconhecido', 
        keySignature: 'C major', 
        timeSignature: '4/4', 
        tempo: 120, 
        duration: 0, 
        measures: 0, 
        instruments: [], 
      };
    }
  }, []);

  // CORREÇÃO: LoadScoreFile com validação de container
  const loadScoreFile = React.useCallback(async (scoreFile) => {
    if (!osmdInstance) {
      console.warn('Cannot load score: OSMD not ready or container not ready');
      return;
    }
    try {
      setLoadingState('reading-file');
      setError(null);
      const isMXL = scoreFile?.name?.toLowerCase?.().endsWith('.mxl');
      let content;
      if (scoreFile.content) {
        content = scoreFile.content;
      } else if (scoreFile instanceof File) {
        content = await readFileContent(scoreFile);
      } else {
        throw new Error('Formato de ficheiro não suportado');
      }
      if (typeof content === 'string') {
      try { osmdInstance.rawMusicXML = content; } catch { console.warn('Failed to set rawMusicXML'); }
      }
      if (isMXL) {
        setLoadingState('decompressing');
        await new Promise(r => setTimeout(r, 50));
      }
      setLoadingState('parsing-data');
      await osmdInstance.load(content);
      try { 
        osmdInstance.setOptions({ 
          autoResize: false, 
          responsive: false, 
          pageFormat: 'A4_Portrait' 
        }); 
      } catch { console.warn('Failed to set OSMD options'); }
      setLoadingState('rendering-sheet');
      const hasValidDimensions = await ensureContainerSize();
      if (!hasValidDimensions) {
        throw new Error('Container não tem dimensões válidas para renderização');
      }
      await new Promise((r) => requestAnimationFrame(r));
      try { if (osmdInstance.zoom !== 1) osmdInstance.zoom = 1; } catch { /* intentionally ignored for compatibility */ }
      console.log('Loading score: calling OSMD render...');
      await osmdInstance.render();
      console.log('Loading score: OSMD render completed');
      updateScrollMetrics();
      const extractedMetadata = extractScoreMetadata(osmdInstance);
      setMetadata(extractedMetadata);
      const getTotalPages = (osmd) => { 
        try { 
          return (
            osmd?.GraphicSheet?.Pages?.length ||
            osmd?.graphic?.pages?.length ||
            osmd?.GraphicalMusicSheet?.Pages?.length ||
            1
          ); 
        } catch { 
          return 1; 
        } 
      };
      updateViewSettings({ totalPages: getTotalPages(osmdInstance), pageIndex: 0 });
      setLoadingState('success');
      updateScrollMetrics();
    } catch (err) {
      console.error('Error loading score:', err);
      setError({ 
        type: 'parse', 
        message: 'Erro ao carregar a partitura', 
        details: err.message, 
        timestamp: new Date(), 
        recoverable: true, 
      });
      setLoadingState('error');
    }
  }, [osmdInstance, setLoadingState, setError, ensureContainerSize, updateScrollMetrics, setMetadata, updateViewSettings, extractScoreMetadata]);

  const readFileContent = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    const name = file.name?.toLowerCase?.() || '';
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler o ficheiro'));
    if (name.endsWith('.mxl')) reader.readAsArrayBuffer(file); 
    else reader.readAsText(file);
  });

    // Load score when file and OSMD are available
  useEffect(() => { 
    if (hasFile && osmdInstance) { 
      loadScoreFile(file); 
    }
  }, [hasFile, file, osmdInstance, loadScoreFile]); // file and osmdInstance added

  // Clean up OSMD when file is removed
  useEffect(() => {
    if (!file && osmdInstance) {
      console.log('Cleaning up OSMD instance...');
      try {
        // Clear the container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        // Reset OSMD references
        setOSMDInstance(null);
        osmdRef.current = null;
        // Reset metadata and view settings
        setMetadata(null);
        updateViewSettings({ totalPages: 1, pageIndex: 0 });
      } catch (err) {
        console.error('Error cleaning up OSMD:', err);
      }
    }
  }, [file, osmdInstance, setOSMDInstance, setMetadata, updateViewSettings]); // file and osmdInstance added

  // Configurar viewport
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    
    if (lockView) {
      vp.style.overflowY = 'auto';
      vp.style.overflowX = 'hidden';
      vp.style.cursor = 'default';
      vp.style.height = '100vh';
      vp.style.maxHeight = '100vh';
      vp.style.minHeight = '100vh';
    } else {
      vp.style.overflowY = 'auto';
      vp.style.overflowX = 'auto';
      vp.style.cursor = 'grab';
      vp.style.height = '100%';
      vp.style.maxHeight = '';
      vp.style.minHeight = '';
    }
    updateScrollMetrics();
  }, [lockView, updateScrollMetrics]);

  const {
    zoom,
    smoothZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomTo,
  } = useZoom();
  zoomValueRef.current = zoom;

  const {
    panState,
    panTo,
    centerContent,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePan();

  const {
    editMode,
    distanceVisualization,
    startDrag,
    updateDrag,
    endDrag,
  } = useEditMode();

  const [dragOver, setDragOver] = useState(false);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const scrollDragRef = useRef({ startY: 0, startScrollTop: 0, thumbHeight: 0, trackHeight: 0 });
  const scrollTrackRef = useRef(null);
  const isDraggingScrollRef = useRef(false);
  const scrollThumbSnapshotRef = useRef(null); // { totalHeight, clientHeight, thumbPx, trackPx }

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
    if (containerRef.current && !osmdInstance && !osmdRef.current && file) {
      console.log('Initializing OSMD for file...');
      
      try {
        ensureContainerSize();
        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          ...renderOptions,
          backend: 'svg',
          autoResize: false,
          responsive: false,
          pageFormat: 'A4_Portrait',
        });
        setOSMDInstance(osmd);
        osmdRef.current = osmd;
        console.log('OSMD initialized successfully');
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
  }, [renderOptions, setOSMDInstance, setError, file, ensureContainerSize]);

  // Resize handling with proper throttling
  useEffect(() => {
    if (!osmdInstance) return;
    
    let timeoutId;
    let isRendering = false;
    let lastRenderTime = 0;
    const minRenderInterval = 1000; // Increased to 1 second to prevent WebGL spam
    
    const onResize = () => {
      if (isRendering) return;
      
      const now = Date.now();
      if (now - lastRenderTime < minRenderInterval) {
        return;
      }
      
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        if (isRendering || !osmdInstance) return;
        isRendering = true;
        lastRenderTime = Date.now();
        
        try { 
          if (ensureContainerSize()) {
            await osmdInstance.render(); 
            updateScrollMetrics();
          }
        } catch (error) {
          console.warn('Resize render error:', error);
        } finally {
          isRendering = false;
        }
      }, 500);
    };
    
    window.addEventListener('resize', onResize);
    
    return () => { 
      clearTimeout(timeoutId); 
      window.removeEventListener('resize', onResize); 
    };
  }, [osmdInstance, updateScrollMetrics, ensureContainerSize]);

  // View mode changes are handled by CSS only - no re-rendering needed

  // Wheel events - only when file is loaded
  useEffect(() => {
    if (!file || !osmdInstance) return; // Don't handle wheel events on upload page
    
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        smoothZoom(delta, e.clientX, e.clientY);
        return;
      }
      
      if (!lockView) {
        e.preventDefault();
        const z = zoom || 1;
        const dx = -e.deltaX / z;
        const dy = -e.deltaY / z;
        panTo((panState?.x || 0) + dx, (panState?.y || 0) + dy, 0);
      }
    };
    
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('wheel', handleWheel, { passive: false });
      return () => viewport.removeEventListener('wheel', handleWheel);
    }
  }, [smoothZoom, zoom, panState?.x, panState?.y, panTo, lockView, file, osmdInstance]);

  // Safari pinch gesture support - only when file is loaded
  useEffect(() => {
    if (!file || !osmdInstance) return; // Don't handle gestures on upload page
    
    const viewport = viewportRef.current;
    if (!viewport) return;
    
    let lastScale = 1;
    
    const onGestureStart = (e) => { 
      e.preventDefault(); 
      lastScale = e.scale ?? 1; 
    };
    
    const onGestureChange = (e) => { 
      e.preventDefault(); 
      const scale = e.scale ?? 1; 
      const d = scale - lastScale; 
      lastScale = scale; 
      
      if (Math.abs(d) < 0.01) return; 
      
      smoothZoom(d > 0 ? 1 : -1, e.clientX ?? window.innerWidth/2, e.clientY ?? window.innerHeight/2); 
    };
    
    const onGestureEnd = (e) => { e.preventDefault(); };
    
    viewport.addEventListener('gesturestart', onGestureStart, { passive: false });
   const viewportRef = useRef(null);
   const containerRef = useRef(null);
   const pageRef = useRef(null);
   const osmdRef = useRef(null);
   const fileInputRef = useRef(null);
   const sheetContentRef = useRef(null);
   const baseContentHeightRef = useRef(0); // unscaled total height of pages (including margins)
   const lastMeasuredPagesRef = useRef(0);
   const zoomValueRef = useRef(1); // holds current zoom safely for early callbacks
   const baseContentWidthRef = useRef(0); // unscaled total width of content (for horizontal scrollbar)
   const scrollDragRef = useRef({ startY: 0, startScrollTop: 0, thumbHeight: 0, trackHeight: 0 });
   const scrollTrackRef = useRef(null);
   const isDraggingScrollRef = useRef(false);
   const scrollThumbSnapshotRef = useRef(null); // { totalHeight, clientHeight, thumbPx, trackPx }
    document.addEventListener('mouseup', handleMouseUp);
    return () => { 
      document.removeEventListener('mousemove', handleMouseMove); 
      document.removeEventListener('mouseup', handleMouseUp); 
    };
  }, [panState.isDragging, handleMouseMove, handleMouseUp, file, osmdInstance]);

  // DnD file load
  useEffect(() => {
    if (file) return;
    
    const onDragOver = (e) => { 
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) { 
        e.preventDefault(); 
        setDragOver(true); 
      } 
    };
    
    const onDrop = (e) => { 
      e.preventDefault(); 
      setDragOver(false); 
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
    
    const onDragLeaveOrEnd = () => setDragOver(false);
    
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragleave', onDragLeaveOrEnd);
    window.addEventListener('dragend', onDragLeaveOrEnd);
    
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragleave', onDragLeaveOrEnd);
      window.removeEventListener('dragend', onDragLeaveOrEnd);
    };
  }, [file, loadScore, setError]);

  // Global fallbacks for zooming
  useEffect(() => {
    const onGlobalWheel = (e) => { 
      if (e.ctrlKey) { 
        e.preventDefault(); 
        const delta = e.deltaY > 0 ? -1 : 1; 
        smoothZoom(delta, e.clientX, e.clientY); 
      } 
    };
    
    const onGStart = (e) => { e.preventDefault(); };
    const onGChange = (e) => { 
      e.preventDefault(); 
      const cx = e.clientX ?? window.innerWidth / 2; 
      const cy = e.clientY ?? window.innerHeight / 2; 
      smoothZoom((e.scale ?? 1) > 1 ? 1 : -1, cx, cy); 
    };
    const onGEnd = (e) => { e.preventDefault(); };
    
    window.addEventListener('wheel', onGlobalWheel, { passive: false, capture: true });
    window.addEventListener('gesturestart', onGStart, { passive: false, capture: true });
    window.addEventListener('gesturechange', onGChange, { passive: false, capture: true });
    window.addEventListener('gestureend', onGEnd, { passive: false, capture: true });
    
    return () => {
      window.removeEventListener('wheel', onGlobalWheel, { capture: true });
      window.removeEventListener('gesturestart', onGStart, { capture: true });
      window.removeEventListener('gesturechange', onGChange, { capture: true });
      window.removeEventListener('gestureend', onGEnd, { capture: true });
    };
  }, [smoothZoom, file, osmdInstance]);

  const handleFileChange = (e) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      loadScore(file); 
    } 
  };
  
  const handleFileUpload = () => { 
    fileInputRef.current?.click(); 
  };

  // Funções de fit melhoradas
  const fitPageToViewportWidth = useCallback(() => {
    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page) return;
    const available = Math.max(0, viewport.clientWidth - 64);
    const rect = page.getBoundingClientRect();
    const baseWidth = rect.width / (zoom || 1);
    // Additional logic would go here
  }, [zoom]);

  return (
    <div className={`music-sheet-container ${!hasFile ? 'upload-mode' : ''}`} style={{ background: hasFile ? '#f5f5f5' : '#1e1e1e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.musicxml,.mxl"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Upload area when no file is loaded */}
      {!hasFile && (
        <div className={`upload-area ${dragOver ? 'drag-over' : ''}`} style={{
          border: '2px dashed #666',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          backgroundColor: dragOver ? '#333' : '#2a2a2a',
          transition: 'all 0.3s ease',
          maxWidth: '500px',
          width: '90%'
        }}>
          <Upload size={48} style={{ color: '#888', marginBottom: '20px' }} />
          <h3 style={{ color: '#fff', marginBottom: '10px' }}>Upload Music Score</h3>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            Drag and drop your MusicXML file here, or click to browse
          </p>
          <Button onClick={handleFileUpload} style={{ backgroundColor: '#007acc', color: 'white' }}>
            Choose File
          </Button>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '15px' }}>
            Supported formats: .xml, .musicxml, .mxl
          </p>
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

      {/* Main viewport - only shown when file is loaded */}
      {hasFile && (
        <div
          ref={viewportRef}
          className="sheet-viewport"
          style={{
            width: '100%',
            height: '100vh',
            overflow: lockView ? 'auto' : 'auto',
            cursor: lockView ? 'default' : 'grab',
            position: 'relative'
          }}
          onMouseDown={lockView ? undefined : handleMouseDown}
          onTouchStart={lockView ? undefined : handleTouchStart}
        >
          <div
            ref={containerRef}
            className="sheet-content"
            style={{
              transform: lockView ? 'none' : `translate(${panState?.x || 0}px, ${panState?.y || 0}px) scale(${zoom || 1})`,
              transformOrigin: '0 0',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: lockView ? '40px 20px' : '20px'
            }}
          />
        </div>
      )}

      {/* Zoom controls - only shown when file is loaded */}
      {hasFile && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 100
        }}>
          <Button
            onClick={zoomIn}
            size="sm"
            style={{ backgroundColor: '#333', color: 'white' }}
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            onClick={zoomOut}
            size="sm"
            style={{ backgroundColor: '#333', color: 'white' }}
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            onClick={resetZoom}
            size="sm"
            style={{ backgroundColor: '#333', color: 'white' }}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      )}

      {/* Edit controls - only shown when edit mode is active */}
      {editMode.isActive && (
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