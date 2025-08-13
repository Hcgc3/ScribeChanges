import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // App state
      isInitialized: false,
      isLoading: false,
      error: null,
      
      // Theme state
      theme: 'dark',
      
      // Viewport state
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
      },
      
      // Header state - Dynamic header system
      header: {
        isVisible: true,
        isHovered: false,
        isPinned: true,
        autoHideDelay: 2000,
        hoverZoneHeight: 3,
        animationDuration: 300,
        autoHideTimeout: null,
      },
      
      // Fullscreen state
      isFullscreen: false,
      
      // Modal state
      modals: {
        settings: false,
        about: false,
        help: false,
        export: false,
        share: false,
      },
      
      // Recent files
      recentFiles: [],
      recentFilesLimit: 12,
      
      // Performance metrics
      performance: {
        renderTime: 0,
        memoryUsage: 0,
        lastUpdate: new Date(),
      },

      // Actions
      initialize: () => {
        const { theme } = get();
        
        // Apply initial theme
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Set up viewport size listener
        const updateViewport = () => {
          get().updateViewport({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        };

        window.addEventListener('resize', updateViewport);
        updateViewport();

        // Set up fullscreen change listener
        const handleFullscreenChange = () => {
          const isFullscreen = !!document.fullscreenElement;
          set({ isFullscreen });
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Set up global keyboard shortcuts
        const handleKeyDown = (event) => {
          get().handleKeyboardShortcut(event);
        };

        document.addEventListener('keydown', handleKeyDown);

        set({ isInitialized: true });
        console.log('App initialized');
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Theme actions
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        
        // Apply theme to document
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setTheme: (theme) => {
        set({ theme });
        
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // Header actions - Dynamic header system
      toggleHeader: () => {
        const { header } = get();
        const newVisible = !header.isVisible;
        
        set({
          header: {
            ...header,
            isVisible: newVisible,
            isPinned: newVisible ? header.isPinned : false,
            isHovered: false,
          }
        });

        // Cancel any pending auto-hide
        if (header.autoHideTimeout) {
          clearTimeout(header.autoHideTimeout);
        }
      },

      showHeader: () => {
        const { header } = get();
        set({
          header: {
            ...header,
            isVisible: true,
          }
        });
      },

      hideHeader: () => {
        const { header } = get();
        set({
          header: {
            ...header,
            isVisible: false,
            isPinned: false,
            isHovered: false,
          }
        });

        // Cancel any pending auto-hide
        if (header.autoHideTimeout) {
          clearTimeout(header.autoHideTimeout);
        }
      },

      setHeaderHovered: (isHovered) => {
        const { header } = get();
        
        if (isHovered) {
          // Cancel any pending auto-hide when hovering
          if (header.autoHideTimeout) {
            clearTimeout(header.autoHideTimeout);
          }
          
          set({
            header: {
              ...header,
              isHovered: true,
              autoHideTimeout: null,
            }
          });
        } else {
          // Start auto-hide timer when leaving hover
          if (!header.isPinned) {
            get().startHeaderAutoHide();
          }
          
          set({
            header: {
              ...header,
              isHovered: false,
            }
          });
        }
      },

      pinHeader: () => {
        const { header } = get();
        
        // Cancel any pending auto-hide
        if (header.autoHideTimeout) {
          clearTimeout(header.autoHideTimeout);
        }
        
        set({
          header: {
            ...header,
            isVisible: true,
            isPinned: true,
            isHovered: false,
            autoHideTimeout: null,
          }
        });
      },

      unpinHeader: () => {
        const { header } = get();
        set({
          header: {
            ...header,
            isPinned: false,
          }
        });
      },

      setHeaderSettings: (settings) => {
        const { header } = get();
        set({
          header: {
            ...header,
            ...settings,
          }
        });
      },

      // Auto-hide header functionality
      startHeaderAutoHide: () => {
        const { header } = get();
        
        // Cancel existing timeout
        if (header.autoHideTimeout) {
          clearTimeout(header.autoHideTimeout);
        }

        const timeout = setTimeout(() => {
          const currentState = get();
          if (currentState.header.isHovered && !currentState.header.isPinned) {
            set({
              header: {
                ...currentState.header,
                isHovered: false,
                autoHideTimeout: null,
              }
            });
          }
        }, header.autoHideDelay);

        set({
          header: {
            ...header,
            autoHideTimeout: timeout,
          }
        });
      },

      cancelHeaderAutoHide: () => {
        const { header } = get();
        if (header.autoHideTimeout) {
          clearTimeout(header.autoHideTimeout);
          set({
            header: {
              ...header,
              autoHideTimeout: null,
            }
          });
        }
      },

      // Viewport actions
      updateViewport: (viewport) => set({ viewport }),

      // Fullscreen actions
      toggleFullscreen: () => {
        const isFullscreen = !get().isFullscreen;
        set({ isFullscreen });
        
        if (isFullscreen) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      },

      setFullscreen: (isFullscreen) => set({ isFullscreen }),

      // Modal actions
      openModal: (modalName) => {
        const { modals } = get();
        set({
          modals: {
            ...modals,
            [modalName]: true,
          }
        });
      },

      closeModal: (modalName) => {
        const { modals } = get();
        set({
          modals: {
            ...modals,
            [modalName]: false,
          }
        });
      },

      closeAllModals: () => {
        const { modals } = get();
        const closedModals = {};
        Object.keys(modals).forEach(key => {
          closedModals[key] = false;
        });
        set({ modals: closedModals });
      },

      // Performance actions
      updatePerformance: (metrics) => {
        const { performance } = get();
        set({
          performance: {
            ...performance,
            ...metrics,
            lastUpdate: new Date(),
          }
        });
      },

      // Recent files actions
      addRecentFile: (file) => {
        set((state) => {
          const existingIdx = state.recentFiles.findIndex((f) => f.id === file.id || (f.path && f.path === file.path && f.name === file.name));
          let updated = [...state.recentFiles];
          if (existingIdx !== -1) {
            // Move to top and update metadata
            const existing = { ...updated[existingIdx], ...file };
            updated.splice(existingIdx, 1);
            updated.unshift(existing);
          } else {
            updated.unshift(file);
          }
          if (updated.length > state.recentFilesLimit) {
            updated = updated.slice(0, state.recentFilesLimit);
          }
          return { recentFiles: updated };
        });
      },

      removeRecentFile: (id) => {
        set((state) => ({ recentFiles: state.recentFiles.filter((f) => f.id !== id) }));
      },

      clearRecentFiles: () => set({ recentFiles: [] }),

      // Keyboard shortcuts
      handleKeyboardShortcut: (event) => {
        const { key, ctrlKey, metaKey, shiftKey } = event;
        const isCtrl = ctrlKey || metaKey;

        // F11 - Toggle header
        if (key === 'F11') {
          event.preventDefault();
          get().toggleHeader();
          return true;
        }

        // Ctrl+Shift+H - Toggle header (alternative)
        if (isCtrl && shiftKey && key === 'H') {
          event.preventDefault();
          get().toggleHeader();
          return true;
        }

        // Escape - Show header if hidden
        if (key === 'Escape' && !get().header.isVisible) {
          event.preventDefault();
          get().showHeader();
          return true;
        }

        // Ctrl+Shift+F - Toggle fullscreen
        if (isCtrl && shiftKey && key === 'F') {
          event.preventDefault();
          get().toggleFullscreen();
          return true;
        }

        return false;
      },

      // Responsive breakpoints
      getBreakpoint: () => {
        const { width } = get().viewport;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        if (width < 1440) return 'desktop';
        return 'large';
      },

      isMobile: () => get().getBreakpoint() === 'mobile',
      isTablet: () => get().getBreakpoint() === 'tablet',
      isDesktop: () => ['desktop', 'large'].includes(get().getBreakpoint()),

      // Layout calculations
      getScoreAreaHeight: () => {
        const { viewport, header } = get();
        const headerHeight = (header.isVisible || header.isHovered) ? 64 : 0;
        return viewport.height - headerHeight;
      },

      getAvailableWidth: () => {
        const { viewport } = get();
        const breakpoint = get().getBreakpoint();
        
        switch (breakpoint) {
          case 'mobile':
            return viewport.width - 16; // 8px margins each side
          case 'tablet':
            return viewport.width - 32; // 16px margins each side
          default:
            return Math.min(1200, viewport.width - 48); // Max 1200px, 24px margins
        }
      },

      // Cleanup
      cleanup: () => {
        const { header } = get();
        if (header.autoHideTimeout) {
          clearTimeout(header.autoHideTimeout);
        }
      },
    }),
    {
      name: 'music-editor-app-store',
      partialize: (state) => ({
        theme: state.theme,
        header: {
          isVisible: state.header.isVisible,
          isPinned: state.header.isPinned,
          autoHideDelay: state.header.autoHideDelay,
          hoverZoneHeight: state.header.hoverZoneHeight,
          animationDuration: state.header.animationDuration,
        },
        isFullscreen: state.isFullscreen,
        recentFiles: state.recentFiles,
      }),
    }
  )
);

// Helper export so other modules can call without subscribing
export const addRecentFile = (file) => useAppStore.getState().addRecentFile(file);

