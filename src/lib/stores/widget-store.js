import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Widgets are laid out for this score-area size and shrink below it, so they
// keep the same share of the screen instead of piling up on small displays.
const DESIGN_AREA = { width: 1440, height: 800 };
const MIN_UI_SCALE = 0.6;
const MAX_UI_SCALE = 1;
// Height of a minimized widget (title bar only), before scaling
const TITLE_BAR_HEIGHT = 37;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const getUiScale = (area) => clamp(
  Math.min(area.width / DESIGN_AREA.width, area.height / DESIGN_AREA.height),
  MIN_UI_SCALE,
  MAX_UI_SCALE,
);

// A widget's place is an anchor (left/center/right × top/bottom) plus an offset in
// screen px from that edge, so it stays glued to its corner when the window
// changes size. Returns CSS for an absolutely positioned, scaled widget.
export const getWidgetPlacement = (widget, area, scale, padding = 16) => {
  const { anchor, offset } = widget;
  const w = widget.size.width * scale;
  const h = (widget.isMinimized ? TITLE_BAR_HEIGHT : widget.size.height) * scale;
  const style = {};
  let translate = '';

  if (anchor.x === 'center') {
    const limit = Math.max(0, (area.width - w) / 2 - padding);
    style.left = `calc(50% + ${clamp(offset.x, -limit, limit)}px)`;
    translate = 'translateX(-50%) ';
  } else {
    style[anchor.x] = clamp(offset.x, padding, Math.max(padding, area.width - w - padding));
  }
  style[anchor.y] = clamp(offset.y, padding, Math.max(padding, area.height - h - padding));

  return {
    style,
    transform: `${translate}scale(${scale})`,
    transformOrigin: `${anchor.x} ${anchor.y}`,
  };
};

// Picks the anchor nearest to where a widget was dropped (rect in score-area px).
const rectToPlacement = (rect, area) => {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const x = cx < area.width / 3 ? 'left' : cx > (area.width * 2) / 3 ? 'right' : 'center';
  const y = cy < area.height / 2 ? 'top' : 'bottom';
  return {
    anchor: { x, y },
    offset: {
      x: x === 'left' ? rect.left : x === 'right' ? area.width - rect.left - rect.width : cx - area.width / 2,
      y: y === 'top' ? rect.top : area.height - rect.top - rect.height,
    },
  };
};

// Default widget metadata (not fully persisted)
const DEFAULT_WIDGETS = {
  mediaControls: {
    id: 'mediaControls',
    type: 'MediaControls',
    title: 'Controlos de Reprodução',
    anchor: { x: 'center', y: 'bottom' },
    offset: { x: 0, y: 16 },
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
  },
  editingTools: {
    id: 'editingTools',
    type: 'EditingTools',
    title: 'Ferramentas de Edição',
    anchor: { x: 'left', y: 'top' },
    offset: { x: 16, y: 16 },
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
  },
  properties: {
    id: 'properties',
    type: 'Properties',
    title: 'Propriedades',
    anchor: { x: 'right', y: 'top' },
    offset: { x: 16, y: 16 },
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
  },
  pageSizeEditor: {
    id: 'pageSizeEditor',
    type: 'PageSizeEditor',
    title: 'Editor de Tamanho de Página',
    anchor: { x: 'left', y: 'bottom' },
    offset: { x: 16, y: 16 },
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
  },
  quickActions: {
    id: 'quickActions',
    type: 'QuickActions',
    title: 'Ações Rápidas',
    // Sits above the score viewer's zoom controls
    anchor: { x: 'right', y: 'bottom' },
    offset: { x: 16, y: 72 },
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
  },
};

const IDLE_DRAG_STATE = {
  activeWidget: null,
  startRect: null,
  grabOffset: { x: 0, y: 0 },
  isDragging: false,
  snapPreview: null,
  simulatedPosition: null, // visual top-left during drag, applied as a transform only
};

// Fields of a widget that are saved between sessions
const PERSISTED_FIELDS = ['title', 'anchor', 'offset', 'size', 'isVisible', 'isPinned', 'isMinimized'];
const pickPersisted = (widget) => Object.fromEntries(PERSISTED_FIELDS.map((k) => [k, widget[k]]));

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
      dragState: { ...IDLE_DRAG_STATE },

      // Viewport info
      viewport: {
        width: 1920,
        height: 1080,
        scoreArea: { x: 0, y: 0, width: 1920, height: 1016 },
      },

      // Widget scale for the current score area (see getUiScale)
      uiScale: 1,

      // Actions
      updateViewport: (viewport, scoreArea) => {
        const area = scoreArea || { x: 0, y: 0, width: viewport.width, height: viewport.height };
        set({ viewport: { ...viewport, scoreArea: area }, uiScale: getUiScale(area) });
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

      setWidgetSize: (id, size) => {
        const widget = get().getWidget(id);
        if (!widget || !widget.canResize) return;

        const constrainedSize = get().constrainSize(size, widget.minSize, widget.maxSize);
        get().updateWidget(id, { size: constrainedSize });
      },

      toggleWidgetVisibility: (id) => {
        const widget = get().getWidget(id);
        if (!widget) return;
        get().updateWidget(id, { isVisible: !widget.isVisible });
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

      // Widgets keep their anchor while hidden, so showing one puts it back in place
      showWidget: (id) => {
        if (!get().getWidget(id)) return;
        get().updateWidget(id, { isVisible: true });
      },

      bringToFront: (id) => {
        const { widgets } = get();
        const maxZ = Math.max(...Object.values(widgets).map(w => w.zIndex));
        if (widgets[id]?.zIndex === maxZ) return;
        get().updateWidget(id, { zIndex: maxZ + 1 });
      },

      // Drag and drop system. Rects and points are in score-area px.
      startDrag: (id, startRect, grabOffset) => {
        const widget = get().getWidget(id);
        if (!widget || widget.isPinned) return false;

        get().bringToFront(id);
        set({
          dragState: {
            ...IDLE_DRAG_STATE,
            activeWidget: id,
            startRect,
            grabOffset,
            isDragging: true,
            simulatedPosition: { x: startRect.left, y: startRect.top },
          },
        });
        get().updateWidget(id, { isDragging: true });
        return true;
      },

      updateDrag: (point) => {
        const { dragState, viewport, layoutSettings, magneticSettings } = get();
        if (!dragState.isDragging || !dragState.startRect) return;

        const { width, height } = dragState.startRect;
        const area = viewport.scoreArea;
        const pad = layoutSettings.scoreAreaPadding;
        let x = clamp(point.x - dragState.grabOffset.x, pad, Math.max(pad, area.width - width - pad));
        let y = clamp(point.y - dragState.grabOffset.y, pad, Math.max(pad, area.height - height - pad));

        // Magnetic edges: pull to the padded edges and the horizontal centre
        let snapPreview = null;
        if (magneticSettings.enableMagneticSnap) {
          const d = magneticSettings.snapDistance;
          const right = area.width - width - pad;
          const centre = (area.width - width) / 2;
          const bottom = area.height - height - pad;
          if (Math.abs(x - pad) < d) { x = pad; snapPreview = 'left'; }
          else if (Math.abs(x - right) < d) { x = right; snapPreview = 'right'; }
          else if (Math.abs(x - centre) < d) { x = centre; snapPreview = 'center'; }
          if (Math.abs(y - pad) < d) { y = pad; snapPreview = snapPreview || 'top'; }
          else if (Math.abs(y - bottom) < d) { y = bottom; snapPreview = snapPreview || 'bottom'; }
        }

        set({ dragState: { ...dragState, snapPreview, simulatedPosition: { x, y } } });
      },

      endDrag: () => {
        const { dragState, viewport } = get();
        if (!dragState.isDragging || !dragState.activeWidget) return;

        const { activeWidget, simulatedPosition, startRect } = dragState;
        if (get().getWidget(activeWidget)) {
          const moved = simulatedPosition
            && (simulatedPosition.x !== startRect.left || simulatedPosition.y !== startRect.top);
          const placement = moved
            ? rectToPlacement({ left: simulatedPosition.x, top: simulatedPosition.y, width: startRect.width, height: startRect.height }, viewport.scoreArea)
            : {};
          get().updateWidget(activeWidget, { ...placement, isDragging: false });
        }

        set({ dragState: { ...IDLE_DRAG_STATE } });
      },

      constrainSize: (size, minSize, maxSize) => {
        return {
          width: Math.max(minSize.width, Math.min(size.width, maxSize.width)),
          height: Math.max(minSize.height, Math.min(size.height, maxSize.height)),
        };
      },

      // Layout management
      saveLayout: (name) => {
        const { widgets } = get();
        const layout = {
          name,
          timestamp: new Date().toISOString(),
          widgets: Object.fromEntries(
            Object.entries(widgets).map(([id, widget]) => [id, pickPersisted(widget)])
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
          // Layouts saved before anchors existed only have x/y positions; skip those
          if (updatedWidgets[id] && savedWidget.anchor) {
            updatedWidgets[id] = {
              ...updatedWidgets[id],
              ...savedWidget,
            };
          }
        });

        set({ widgets: updatedWidgets });
        return true;
      },

      // Puts every widget back in its default place and size (visibility is kept)
      resetLayout: () => {
        const { widgets } = get();
        set({
          widgets: Object.fromEntries(
            Object.entries(widgets).map(([id, widget]) => {
              const def = DEFAULT_WIDGETS[id];
              return [id, def
                ? { ...widget, anchor: def.anchor, offset: def.offset, size: def.size, isPinned: false, isMinimized: false, isDragging: false }
                : widget];
            })
          ),
        });
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
        const { widgets, dragState, magneticSettings, viewport, uiScale } = get();
        return {
          widgets: Object.fromEntries(
            Object.entries(widgets).map(([id, widget]) => [id, pickPersisted(widget)])
          ),
          dragState,
          magneticSettings,
          viewport,
          uiScale,
          stats: get().getStats(),
        };
      },

      // Missing methods for WidgetManager
      initializeDefaultWidgets: () => {
        // Normalize sizes to be within min/max to avoid clipping
        const { widgets } = get();
        const normalized = Object.fromEntries(
          Object.entries(widgets).map(([id, w]) => {
            const def = DEFAULT_WIDGETS[id] || w;
            const size = get().constrainSize(w.size || def.size, def.minSize, def.maxSize);
            return [id, { ...w, size }];
          })
        );

        set({ widgets: normalized });
      },

      hideAllWidgets: () => {
        const { widgets } = get();
        set({
          widgets: Object.fromEntries(
            Object.entries(widgets).map(([id, w]) => [id, { ...w, isVisible: false }])
          ),
        });
      },

      showAllWidgets: () => {
        const { widgets } = get();
        set({
          widgets: Object.fromEntries(
            Object.entries(widgets).map(([id, w]) => [id, { ...w, isVisible: true }])
          ),
        });
      },

      cleanup: () => {
        // Cleanup any event listeners or timers if needed
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
      // v1: x/y positions replaced by anchor + offset
      version: 1,
      migrate: (persisted, version) => {
        if (version < 1 && persisted?.widgets) {
          persisted.widgets = Object.fromEntries(
            Object.entries(persisted.widgets).map(([id, w]) => {
              // eslint-disable-next-line no-unused-vars
              const { position, snapZone, ...rest } = w;
              return [id, rest];
            })
          );
        }
        return persisted;
      },
      // Persisted widgets only hold a few fields; lay them over the defaults so
      // id/type/limits are always present, even before WidgetManager mounts.
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        widgets: Object.fromEntries(
          Object.entries(DEFAULT_WIDGETS).map(([id, def]) => [id, { ...def, ...(persisted?.widgets?.[id] || {}) }])
        ),
      }),
      partialize: (state) => ({
        widgets: Object.fromEntries(
          Object.entries(state.widgets).map(([id, widget]) => [id, pickPersisted(widget)])
        ),
        magneticSettings: state.magneticSettings,
        layoutSettings: state.layoutSettings,
        // Do not persist dragState to avoid writes per move
      }),
    }
  )
);
