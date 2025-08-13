import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      },

      // Page settings for custom page sizes
      pageSettings: {
        // Original user-entered values
        width: 210,
        height: 297,
        unit: 'mm',
        // Normalized base mm
        widthMm: 210,
        heightMm: 297,
        // Derived px
        widthPx: 794,
        heightPx: 1123,
        preset: 'a4-portrait',
        lastAppliedFormat: 'A4_P',
        // Page margins (mm)
        margins: { topMm: 12, rightMm: 12, bottomMm: 14, leftMm: 12 },
      },

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
        const { width, height, unit, preset, margins } = merged;
        const widthMm = state._convertToMm(width, unit);
        const heightMm = state._convertToMm(height, unit);
        const PRESET_MAP = { 'a4-portrait': 'A4_P', 'a4-landscape': 'A4_L', 'a3-portrait': 'A3_P', 'a3-landscape': 'A3_L', 'letter-portrait': 'Letter_P', 'letter-landscape': 'Letter_L', 'legal-portrait': 'Legal_P', 'tabloid-portrait': 'Tabloid_P' };
        let pageFormat = PRESET_MAP[preset] || PRESET_MAP[merged.preset];
        if (!pageFormat) pageFormat = `${Math.round(widthMm)}x${Math.round(heightMm)}`;
        try {
          state.clearSVGCache();
          osmd.setOptions({ pageFormat });
          await osmd.render();
          let totalPages = state.viewSettings.totalPages;
          try { totalPages = osmd.GraphicSheet?.MusicPages?.length || totalPages; } catch {}
          // Compute page drop warning
          let pageDropWarning = null;
          if (prevPages > 0 && totalPages < prevPages) {
            const dropPct = (1 - totalPages / prevPages) * 100;
            if (dropPct >= 50) pageDropWarning = { prev: prevPages, now: totalPages, dropPct: Math.round(dropPct) };
          }
          set((s) => ({
            pageSettings: { ...s.pageSettings, width: merged.width, height: merged.height, unit: merged.unit, preset: merged.preset, widthMm, heightMm, widthPx: state._convertFromMm(widthMm, 'px'), heightPx: state._convertFromMm(heightMm, 'px'), lastAppliedFormat: pageFormat, margins: { ...margins } },
            viewSettings: { ...s.viewSettings, totalPages, pageIndex: Math.min(s.viewSettings.pageIndex, totalPages - 1) }
          }));
          // History push (lightweight)
          if (state.addToHistory) {
            state.addToHistory({ type: 'page-settings', before: prevSettings, after: { ...prevSettings, width, height, unit, preset, widthMm, heightMm, margins: { ...margins }, pageFormat }, pagesBefore: prevPages, pagesAfter: totalPages });
          }
          // Re-cache common zoom levels asynchronously
          setTimeout(() => {
            try {
              const common = [0.5, 1.0, 1.5];
              common.forEach(z => {
                if (!state.getSVGCacheEntry(z)) {
                  const svg = document.querySelector('.osmd-container svg');
                  if (svg) {
                    const clone = svg.cloneNode(true);
                    const str = new XMLSerializer().serializeToString(clone);
                    state.setSVGCacheEntry(z, str, { width: clone.getAttribute('width'), height: clone.getAttribute('height') });
                  }
                }
              });
            } catch {}
          }, 400);
          return { ok: true, pageFormat, pages: totalPages, warning: pageDropWarning };
        } catch (e) {
          console.error('applyPageSettings error', e);
          return { ok: false, error: e?.message || 'Unknown error' };
        }
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

      zoomIn: () => {
        const { viewSettings } = get();
        const newZoom = Math.min(viewSettings.maxZoom, viewSettings.zoom + viewSettings.zoomStep);
        get().setZoom(newZoom);
      },

      zoomOut: () => {
        const { viewSettings } = get();
        const newZoom = Math.max(viewSettings.minZoom, viewSettings.zoom - viewSettings.zoomStep);
        get().setZoom(newZoom);
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
      loadScore: async (file) => {
        try {
          set({ loadingState: 'loading', error: null });

          // Extract metadata from file (lightweight, sync-ish)
          const metadata = await get().extractMetadata(file);
          set({
            file,
            metadata,
            // Keep in loading; ScoreViewer will drive to success after OSMD render
            loadingState: 'reading-file',
            viewSettings: { ...get().viewSettings, pageIndex: 0 },
          });

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
      partialize: (state) => ({
        viewSettings: state.viewSettings,
        renderOptions: state.renderOptions,
        audioSettings: state.audioSettings,
        metronome: state.metronome,
      }),
    }
  )
);

