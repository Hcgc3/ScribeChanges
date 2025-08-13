import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Snap zones configuration
const SNAP_ZONES = {
  TOP_LEFT: { x: 0, y: 0, width: 200, height: 100, priority: 1 },
  TOP_RIGHT: { x: -200, y: 0, width: 200, height: 100, priority: 1 },
  TOP_CENTER: { x: -100, y: 0, width: 200, height: 80, priority: 2 },
  BOTTOM_LEFT: { x: 0, y: -120, width: 250, height: 120, priority: 1 },
  BOTTOM_RIGHT: { x: -250, y: -120, width: 250, height: 120, priority: 1 },
  BOTTOM_CENTER: { x: -125, y: -80, width: 250, height: 80, priority: 2 },
  LEFT_EDGE: { x: 0, y: 100, width: 60, height: -200, priority: 3 },
  RIGHT_EDGE: { x: -60, y: 100, width: 60, height: -200, priority: 3 },
};

// Default widget metadata (not fully persisted)
const DEFAULT_WIDGETS = {
  mediaControls: {
    id: 'mediaControls',
    type: 'MediaControls',
    title: 'Controlos de Reprodução',
    position: { x: 20, y: 20 },
    size: { width: 440, height: 140 },
    minSize: { width: 320, height: 100 },
    maxSize: { width: 640, height: 200 },
    isVisible: true,
    isPinned: false,
    isMinimized: false,
    isDragging: false,
    canClose: false,
    canResize: true,
    canMinimize: true,
    zIndex: 100,
    snapZone: 'TOP_LEFT',
    lastPosition: null,
  },
  editingTools: {
    id: 'editingTools',
    type: 'EditingTools',
    title: 'Ferramentas de Edição',
    position: { x: 20, y: 120 },
    size: { width: 360, height: 280 },
    minSize: { width: 280, height: 200 },
    maxSize: { width: 560, height: 400 },
    isVisible: true,
    isPinned: false,
    isMinimized: false,
    isDragging: false,
    canClose: true,
    canResize: true,
    canMinimize: true,
    zIndex: 99,
    snapZone: 'LEFT_EDGE',
    lastPosition: null,
  },
  properties: {
    id: 'properties',
    type: 'Properties',
    title: 'Propriedades',
    position: { x: -320, y: 20 },
    size: { width: 300, height: 400 },
    minSize: { width: 260, height: 300 },
    maxSize: { width: 480, height: 600 },
    isVisible: false,
    isPinned: false,
    isMinimized: false,
    isDragging: false,
    canClose: true,
    canResize: true,
    canMinimize: true,
    zIndex: 98,
    snapZone: 'RIGHT_EDGE',
    lastPosition: null,
  },
  pageSizeEditor: {
    id: 'pageSizeEditor',
    type: 'PageSizeEditor',
    title: 'Editor de Tamanho de Página',
    position: { x: 20, y: 300 },
    size: { width: 280, height: 350 },
    minSize: { width: 260, height: 300 },
    maxSize: { width: 400, height: 600 },
    isVisible: false,
    isPinned: false,
    isMinimized: false,
    isDragging: false,
    canClose: true,
    canResize: true,
    canMinimize: true,
    zIndex: 97,
    snapZone: 'LEFT_EDGE',
    lastPosition: null,
  },
  quickActions: {
    id: 'quickActions',
    type: 'QuickActions',
    title: 'Ações Rápidas',
    position: { x: -200, y: -180 },
    size: { width: 220, height: 240 },
    minSize: { width: 180, height: 180 },
    maxSize: { width: 320, height: 360 },
    isVisible: true,
    isPinned: false,
    isMinimized: false,
    isDragging: false,
    canClose: true,
    canResize: false,
    canMinimize: true,
    zIndex: 96,
    snapZone: 'BOTTOM_RIGHT',
    lastPosition: null,
  },
};

export const useWidgetStore = create(
  persist(
    (set, get) => ({
      // Widget registry
      widgets: { ...DEFAULT_WIDGETS },

      // Magnetic system settings
      magneticSettings: {
        snapDistance: 20,
        snapStrength: 0.8,
        animationDuration: 300,
        enablePhysics: true,
        enableCollisionDetection: true,
        enableMagneticSnap: true,
        dampening: 0.85,
        momentum: 0.15,
      },

      // Layout settings
      layoutSettings: {
        scoreAreaPadding: 16,
        widgetMinDistance: 8,
        boundaryConstraints: true,
        autoArrange: false,
        gridSnap: false,
        gridSize: 10,
      },

      // Drag state
      dragState: {
        activeWidget: null,
        startPosition: null,
        currentPosition: null,
        offset: { x: 0, y: 0 },
        isDragging: false,
        snapPreview: null,
        collisionPreview: [],
        simulatedPosition: null, // position used for transform-only during drag
        rafPending: false,
      },

      // Viewport info
      viewport: {
        width: 1920,
        height: 1080,
        scoreArea: { x: 0, y: 0, width: 1920, height: 1016 },
      },

      // Actions
      updateViewport: (viewport, scoreArea) => {
        // If scoreArea is not provided, calculate it based on viewport
        const calculatedScoreArea = scoreArea || {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        };
        
        set({ 
          viewport: { ...viewport, scoreArea: calculatedScoreArea } 
        });
        
        // Reposition widgets that are out of bounds
        get().repositionOutOfBoundsWidgets();
      },

      // Widget management
      getWidget: (id) => get().widgets[id],

      updateWidget: (id, updates) => {
        const { widgets } = get();
        if (!widgets[id]) return;

        set({
          widgets: {
            ...widgets,
            [id]: {
              ...widgets[id],
              ...updates,
            },
          },
        });
      },

      setWidgetPosition: (id, position) => {
        get().updateWidget(id, { position });
      },

      setWidgetSize: (id, size) => {
        const widget = get().getWidget(id);
        if (!widget || !widget.canResize) return;

        const constrainedSize = get().constrainSize(size, widget.minSize, widget.maxSize);
        get().updateWidget(id, { size: constrainedSize });
      },

      toggleWidgetVisibility: (id) => {
        const widget = get().getWidget(id);
        if (!widget) return;

        get().updateWidget(id, { 
          isVisible: !widget.isVisible,
          lastPosition: widget.isVisible ? widget.position : null,
        });
      },

      toggleWidgetPin: (id) => {
        const widget = get().getWidget(id);
        if (!widget) return;

        get().updateWidget(id, { isPinned: !widget.isPinned });
      },

      toggleWidgetMinimize: (id) => {
        const widget = get().getWidget(id);
        if (!widget || !widget.canMinimize) return;

        get().updateWidget(id, { isMinimized: !widget.isMinimized });
      },

      closeWidget: (id) => {
        const widget = get().getWidget(id);
        if (!widget || !widget.canClose) return;

        get().updateWidget(id, { isVisible: false });
      },

      showWidget: (id) => {
        const widget = get().getWidget(id);
        if (!widget) return;

        const position = widget.lastPosition || get().findBestPosition(widget);
        
        get().updateWidget(id, { 
          isVisible: true,
          position,
          lastPosition: null,
        });
      },

      bringToFront: (id) => {
        const { widgets } = get();
        const maxZ = Math.max(...Object.values(widgets).map(w => w.zIndex));
        
        get().updateWidget(id, { zIndex: maxZ + 1 });
      },

      // Drag and drop system
      startDrag: (id, startPosition, offset) => {
        const widget = get().getWidget(id);
        if (!widget || widget.isPinned) return false;

        get().bringToFront(id);
        
        const simulated = {
          x: widget.position.x,
          y: widget.position.y,
        };
        
        set({
          dragState: {
            activeWidget: id,
            startPosition,
            currentPosition: startPosition,
            offset,
            isDragging: true,
            snapPreview: null,
            collisionPreview: [],
            simulatedPosition: simulated,
            rafPending: false,
          },
        });

        // mark dragging in widget without persisting heavy changes
        get().updateWidget(id, { isDragging: true });
        return true;
      },

      updateDrag: (currentPosition) => {
        const { dragState } = get();
        if (!dragState.isDragging || !dragState.activeWidget) return;

        // Coalesce updates to next animation frame
        if (dragState.rafPending) {
          // update the latest pointer position only
          set({ dragState: { ...dragState, currentPosition } });
          return;
        }

        set({ dragState: { ...dragState, currentPosition, rafPending: true } });

        requestAnimationFrame(() => {
          const state = get();
          const ds = state.dragState;
          if (!ds.isDragging || !ds.activeWidget || !ds.currentPosition) {
            set({ dragState: { ...ds, rafPending: false } });
            return;
          }

          const widget = state.getWidget(ds.activeWidget);
          if (!widget) {
            set({ dragState: { ...ds, rafPending: false } });
            return;
          }

          // Calculate new position with offset
          const nextPos = {
            x: ds.currentPosition.x - ds.offset.x,
            y: ds.currentPosition.y - ds.offset.y,
          };

          // Apply boundary constraints
          const constrained = state.constrainToBounds(nextPos, widget.size);

          // Magnetic snap preview
          let finalPosition = constrained;
          let snapPreview = null;
          const { magneticSettings } = state;
          if (magneticSettings.enableMagneticSnap) {
            const snapResult = state.checkMagneticSnap(constrained, widget);
            if (snapResult) {
              finalPosition = snapResult.position;
              snapPreview = snapResult.zone;
            }
          }

          // Collisions (optional, still preview-only)
          const collisionPreview = magneticSettings.enableCollisionDetection 
            ? state.checkCollisions(finalPosition, widget)
            : [];

          // Update only drag state (simulated transform); do not persist widget.position now
          set({
            dragState: {
              ...ds,
              snapPreview,
              collisionPreview,
              simulatedPosition: finalPosition,
              rafPending: false,
            },
          });
        });
      },

      endDrag: () => {
        const { dragState } = get();
        if (!dragState.isDragging || !dragState.activeWidget) return;

        const widget = get().getWidget(dragState.activeWidget);
        if (widget) {
          // Commit final position (including snap)
          const committed = dragState.simulatedPosition || widget.position;
          get().setWidgetPosition(dragState.activeWidget, committed);

          if (dragState.snapPreview) {
            get().updateWidget(dragState.activeWidget, { snapZone: dragState.snapPreview });
          }

          get().updateWidget(dragState.activeWidget, { isDragging: false });
        }

        // Clear drag state
        set({
          dragState: {
            activeWidget: null,
            startPosition: null,
            currentPosition: null,
            offset: { x: 0, y: 0 },
            isDragging: false,
            snapPreview: null,
            collisionPreview: [],
            simulatedPosition: null,
            rafPending: false,
          },
        });
      },

      // Magnetic snap system
      checkMagneticSnap: (position, widget) => {
        const { magneticSettings } = get(); // viewport removido: não utilizado
        const { snapDistance, snapStrength } = magneticSettings;

        let bestSnap = null;
        let minDistance = snapDistance;

        Object.entries(SNAP_ZONES).forEach(([zoneName]) => {
          const zonePosition = get().getSnapZonePosition(zoneName, widget.size);
          const distance = Math.sqrt(
            Math.pow(position.x - zonePosition.x, 2) + 
            Math.pow(position.y - zonePosition.y, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestSnap = {
              zone: zoneName,
              position: {
                x: position.x + (zonePosition.x - position.x) * snapStrength,
                y: position.y + (zonePosition.y - position.y) * snapStrength,
              },
              distance,
            };
          }
        });

        return bestSnap;
      },

      getSnapZonePosition: (zoneName, widgetSize) => {
        const { viewport } = get();
        const zone = SNAP_ZONES[zoneName];
        if (!zone) return { x: 0, y: 0 };

        const { scoreArea } = viewport;
        
        // Safety check: if scoreArea is undefined, use viewport dimensions
        const area = scoreArea || { width: viewport.width, height: viewport.height };
        
        return {
          x: zone.x < 0 ? area.width + zone.x - widgetSize.width : zone.x,
          y: zone.y < 0 ? area.height + zone.y - widgetSize.height : zone.y,
        };
      },

      // Collision detection
      checkCollisions: (position, widget) => {
        const { widgets, layoutSettings } = get();
        const collisions = [];

        Object.values(widgets).forEach(otherWidget => {
          if (otherWidget.id === widget.id || !otherWidget.isVisible || otherWidget.isMinimized) {
            return;
          }

          const overlap = get().checkOverlap(
            { ...position, ...widget.size },
            { ...otherWidget.position, ...otherWidget.size },
            layoutSettings.widgetMinDistance
          );

          if (overlap) {
            collisions.push(otherWidget.id);
          }
        });

        return collisions;
      },

      checkOverlap: (rect1, rect2, margin = 0) => {
        return !(
          rect1.x + rect1.width + margin < rect2.x ||
          rect2.x + rect2.width + margin < rect1.x ||
          rect1.y + rect1.height + margin < rect2.y ||
          rect2.y + rect2.height + margin < rect1.y
        );
      },

      // Utility functions
      constrainToBounds: (position, size) => {
        const { viewport, layoutSettings } = get();
        const { scoreArea } = viewport;
        
        // Safety check: if scoreArea is undefined, use viewport dimensions
        if (!scoreArea) {
          const padding = layoutSettings.scoreAreaPadding;
          return {
            x: Math.max(padding, Math.min(position.x, viewport.width - size.width - padding)),
            y: Math.max(padding, Math.min(position.y, viewport.height - size.height - padding)),
          };
        }
        
        const padding = layoutSettings.scoreAreaPadding;

        return {
          x: Math.max(padding, Math.min(position.x, scoreArea.width - size.width - padding)),
          y: Math.max(padding, Math.min(position.y, scoreArea.height - size.height - padding)),
        };
      },

      constrainSize: (size, minSize, maxSize) => {
        return {
          width: Math.max(minSize.width, Math.min(size.width, maxSize.width)),
          height: Math.max(minSize.height, Math.min(size.height, maxSize.height)),
        };
      },

      findBestPosition: (widget) => {
        const { viewport } = get();
        const { scoreArea } = viewport;
        
        // Safety check: if scoreArea is undefined, use viewport dimensions
        const area = scoreArea || { width: viewport.width, height: viewport.height };
        
        // Try to find a position that doesn't overlap with other widgets
        const attempts = [
          { x: 20, y: 20 },
          { x: area.width - widget.size.width - 20, y: 20 },
          { x: 20, y: area.height - widget.size.height - 20 },
          { x: area.width - widget.size.width - 20, y: area.height - widget.size.height - 20 },
          { x: area.width / 2 - widget.size.width / 2, y: 20 },
        ];

        for (const position of attempts) {
          const collisions = get().checkCollisions(position, widget);
          if (collisions.length === 0) {
            return position;
          }
        }

        // If no good position found, return default
        return { x: 20, y: 20 };
      },

      repositionOutOfBoundsWidgets: () => {
        const { widgets } = get();
        
        Object.values(widgets).forEach(widget => {
          if (!widget.isVisible) return;

          const constrainedPosition = get().constrainToBounds(widget.position, widget.size);
          
          if (constrainedPosition.x !== widget.position.x || constrainedPosition.y !== widget.position.y) {
            get().setWidgetPosition(widget.id, constrainedPosition);
          }
        });
      },

      // Layout management
      saveLayout: (name) => {
        const { widgets } = get();
        const layout = {
          name,
          timestamp: new Date().toISOString(),
          widgets: Object.fromEntries(
            Object.entries(widgets).map(([id, widget]) => [
              id,
              {
                position: widget.position,
                size: widget.size,
                isVisible: widget.isVisible,
                isPinned: widget.isPinned,
                isMinimized: widget.isMinimized,
                snapZone: widget.snapZone,
              },
            ])
          ),
        };

        // Save to localStorage
        const savedLayouts = JSON.parse(localStorage.getItem('widget-layouts') || '[]');
        const existingIndex = savedLayouts.findIndex(l => l.name === name);
        
        if (existingIndex >= 0) {
          savedLayouts[existingIndex] = layout;
        } else {
          savedLayouts.push(layout);
        }
        
        localStorage.setItem('widget-layouts', JSON.stringify(savedLayouts));
        return layout;
      },

      loadLayout: (name) => {
        const savedLayouts = JSON.parse(localStorage.getItem('widget-layouts') || '[]');
        const layout = savedLayouts.find(l => l.name === name);
        
        if (!layout) return false;

        const { widgets } = get();
        const updatedWidgets = { ...widgets };

        Object.entries(layout.widgets).forEach(([id, savedWidget]) => {
          if (updatedWidgets[id]) {
            updatedWidgets[id] = {
              ...updatedWidgets[id],
              ...savedWidget,
            };
          }
        });

        set({ widgets: updatedWidgets });
        return true;
      },

      resetLayout: () => {
        const { widgets } = get();
        const resetWidgets = { ...widgets };

        // Reset to default positions
        resetWidgets.mediaControls.position = { x: 20, y: 20 };
        resetWidgets.editingTools.position = { x: 20, y: 120 };
        resetWidgets.properties.position = { x: -320, y: 20 };
        resetWidgets.quickActions.position = { x: -200, y: -180 };

        // Reset states
        Object.values(resetWidgets).forEach(widget => {
          widget.isVisible = true;
          widget.isPinned = false;
          widget.isMinimized = false;
          widget.isDragging = false;
        });

        set({ widgets: resetWidgets });
      },

      // Settings
      updateMagneticSettings: (settings) => {
        const { magneticSettings } = get();
        set({
          magneticSettings: {
            ...magneticSettings,
            ...settings,
          },
        });
      },

      updateLayoutSettings: (settings) => {
        const { layoutSettings } = get();
        set({
          layoutSettings: {
            ...layoutSettings,
            ...settings,
          },
        });
      },

      // Statistics
      getStats: () => {
        const { widgets } = get();
        const visibleWidgets = Object.values(widgets).filter(w => w.isVisible);
        const pinnedWidgets = Object.values(widgets).filter(w => w.isPinned);
        const minimizedWidgets = Object.values(widgets).filter(w => w.isMinimized);

        return {
          total: Object.keys(widgets).length,
          visible: visibleWidgets.length,
          pinned: pinnedWidgets.length,
          minimized: minimizedWidgets.length,
          dragging: get().dragState.isDragging ? 1 : 0,
        };
      },

      // Debug helpers
      getDebugInfo: () => {
        const { widgets, dragState, magneticSettings, viewport } = get();
        return {
          widgets: Object.fromEntries(
            Object.entries(widgets).map(([id, widget]) => [
              id,
              {
                position: widget.position,
                size: widget.size,
                isVisible: widget.isVisible,
                isPinned: widget.isPinned,
                snapZone: widget.snapZone,
              },
            ])
          ),
          dragState,
          magneticSettings,
          viewport,
          stats: get().getStats(),
        };
      },

      // Missing methods for WidgetManager
      initializeDefaultWidgets: () => {
        // Merge default metadata into any persisted widget state
        const current = get().widgets || {};
        const merged = Object.fromEntries(
          Object.entries(DEFAULT_WIDGETS).map(([id, def]) => [
            id,
            {
              ...def,
              ...current[id], // persisted state overrides position/size/visibility
            },
          ])
        );

        // Normalize sizes to be within min/max to avoid clipping
        const normalized = Object.fromEntries(
          Object.entries(merged).map(([id, w]) => {
            const def = DEFAULT_WIDGETS[id] || w;
            const size = get().constrainSize(w.size || def.size, def.minSize, def.maxSize);
            return [id, { ...w, size }];
          })
        );

        set({ widgets: normalized });
        console.log('Widgets initialized');
      },

      hideAllWidgets: () => {
        const { widgets } = get();
        const updatedWidgets = { ...widgets };
        
        Object.keys(updatedWidgets).forEach(id => {
          // Hide all widgets regardless of canClose
          updatedWidgets[id].isVisible = false;
        });
        
        set({ widgets: updatedWidgets });
      },

      showAllWidgets: () => {
        const { widgets } = get();
        const updatedWidgets = { ...widgets };
        
        Object.keys(updatedWidgets).forEach(id => {
          updatedWidgets[id].isVisible = true;
        });
        
        set({ widgets: updatedWidgets });
      },

      cleanup: () => {
        // Cleanup any event listeners or timers if needed
        console.log('Widget store cleanup');
      },

      // Add configs property for compatibility
      configs: {
        mediaControls: { type: 'media-controls' },
        editingTools: { type: 'editing-tools' },
        properties: { type: 'properties' },
        quickActions: { type: 'quick-actions' },
        pageSizeEditor: { type: 'page-size-editor' }, // added so widget renders
      },
    }),
    {
      name: 'music-editor-widget-store',
      partialize: (state) => ({
        widgets: Object.fromEntries(
          Object.entries(state.widgets).map(([id, widget]) => [
            id,
            {
              // keep essential and display fields
              title: widget.title,
              position: widget.position,
              size: widget.size,
              isVisible: widget.isVisible,
              isPinned: widget.isPinned,
              isMinimized: widget.isMinimized,
              snapZone: widget.snapZone,
            },
          ])
        ),
        magneticSettings: state.magneticSettings,
        layoutSettings: state.layoutSettings,
        // Do not persist dragState to avoid writes per move
      }),
    }
  )
);

