import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Widgets are laid out for this score-area size and shrink below it, so they
// keep the same share of the screen instead of piling up on small displays.
const DESIGN_AREA = { width: 1440, height: 800 };
// Every widget is drawn this much larger than its design size (same factor for all)
const WIDGET_SIZE = 1.2;
const MIN_UI_SCALE = 0.7;
const MAX_UI_SCALE = 1.2;
// Height of a minimized widget (title bar only), before scaling
const TITLE_BAR_HEIGHT = 37;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const getUiScale = (area) => clamp(
  Math.min(area.width / DESIGN_AREA.width, area.height / DESIGN_AREA.height) * WIDGET_SIZE,
  MIN_UI_SCALE,
  MAX_UI_SCALE,
);

// A widget's place is an anchor (left/center/right × top/bottom) plus an offset in
// screen px from that edge, so it stays glued to its corner when the window
// changes size. Returns CSS for an absolutely positioned, scaled widget.
// `measured` is the rendered layout size of content-sized widgets (unscaled).
export const getWidgetPlacement = (widget, area, scale, padding = 16, measured = null) => {
  const { anchor, offset } = widget;
  const w = (measured?.width ?? widget.size.width) * scale;
  const h = (measured?.height ?? (widget.isMinimized ? TITLE_BAR_HEIGHT : widget.size.height)) * scale;
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

// Toolbar widgets lay their buttons out in a row, or in an icon column when they
// are docked to the left/right edge (`dock`, set when a drop snaps to that edge).
// `orientation` 'auto' follows the dock; 'horizontal'/'vertical' is a manual
// override from the widget menu.
export const getWidgetOrientation = (widget) => {
  if (!widget?.orientable) return 'horizontal';
  if (widget.orientation === 'horizontal' || widget.orientation === 'vertical') return widget.orientation;
  return widget.dock ? 'vertical' : 'horizontal';
};

// Orientation plus the side tooltips should open on (away from the nearest edge)
export const useWidgetOrientation = (widgetId) => {
  const orientation = useWidgetStore((state) => getWidgetOrientation(state.widgets[widgetId]));
  const anchor = useWidgetStore((state) => state.widgets[widgetId]?.anchor);
  const tooltipSide = orientation === 'vertical'
    ? (anchor?.x === 'right' ? 'left' : 'right')
    : (anchor?.y === 'bottom' ? 'top' : 'bottom');
  return { orientation, tooltipSide };
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

const SETTLE_GAP = 8;
// Bringing the pointer this close to an edge of the score area glues the widget
// to that edge (left/right also dock it as a column)
const EDGE_ZONE = 64;
const rectsOverlap = (a, b) => (
  a.left < b.left + b.width && b.left < a.left + a.width &&
  a.top < b.top + b.height && b.top < a.top + a.height
);

// After a drop, move the widget off any widget it landed on: first along its
// edge (above/below the others), then (if `beside`) next to them. Returns null
// when nothing fits. Rects are in score-area px.
const findFreeRect = (rect, others, area, pad, { beside: allowBeside = true } = {}) => {
  const fits = (r) => r.left >= pad - 1 && r.top >= pad - 1
    && r.left + r.width <= area.width - pad + 1 && r.top + r.height <= area.height - pad + 1;
  const free = (r) => others.every((o) => !rectsOverlap(r, o));
  if (free(rect)) return rect;

  const along = [];
  const beside = [];
  others.forEach((o) => {
    along.push({ ...rect, top: o.top + o.height + SETTLE_GAP }, { ...rect, top: o.top - rect.height - SETTLE_GAP });
    beside.push({ ...rect, left: o.left + o.width + SETTLE_GAP }, { ...rect, left: o.left - rect.width - SETTLE_GAP });
  });
  const distance = (c) => Math.abs(c.left - rect.left) + Math.abs(c.top - rect.top);
  for (const candidates of allowBeside ? [along, beside] : [along]) {
    const valid = candidates.filter((c) => fits(c) && free(c)).sort((a, b) => distance(a) - distance(b));
    if (valid.length) return valid[0];
  }
  return null;
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
    orientable: true,
    orientation: 'auto',
    dock: null,
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
    orientable: true,
    orientation: 'auto',
    dock: 'left',
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
    orientable: true,
    orientation: 'auto',
    dock: 'right',
  },
};

const IDLE_DRAG_STATE = {
  activeWidget: null,
  startRect: null,
  grabOffset: { x: 0, y: 0 },
  isDragging: false,
  snapPreview: null,
  snap: { x: null, y: null }, // edges the drop will glue to: x left/right/center, y top/bottom
  simulatedPosition: null, // visual top-left during drag, applied as a transform only
};

// Fields of a widget that are saved between sessions
const PERSISTED_FIELDS = ['title', 'anchor', 'offset', 'size', 'isVisible', 'isPinned', 'isMinimized', 'orientation', 'dock'];
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

      // Widget just dropped; MagneticWidget measures it and calls settleWidget
      settlingWidget: null,
      settleDrop: null, // drop rect (size before any orientation change)

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

      // `rect` = current rendered rect (score-area px): the widget keeps its
      // top-left there after switching between row and column
      setWidgetOrientation: (id, orientation, rect = null) => {
        const widget = get().getWidget(id);
        if (!widget?.orientable) return;
        get().updateWidget(id, { orientation });
        if (rect) set({ settlingWidget: id, settleDrop: rect });
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

        // Magnetic edges: glue to an edge when the widget's own edge is close to it
        // or when the pointer is (so dragging "to the bottom" works whatever part
        // of the widget you hold), plus the horizontal centre
        const snap = { x: null, y: null };
        if (magneticSettings.enableMagneticSnap) {
          const d = magneticSettings.snapDistance;
          const right = area.width - width - pad;
          const centre = (area.width - width) / 2;
          const bottom = area.height - height - pad;
          if (point.x < EDGE_ZONE || Math.abs(x - pad) < d) { x = pad; snap.x = 'left'; }
          else if (point.x > area.width - EDGE_ZONE || Math.abs(x - right) < d) { x = right; snap.x = 'right'; }
          else if (Math.abs(x - centre) < d) { x = centre; snap.x = 'center'; }
          if (point.y < EDGE_ZONE || Math.abs(y - pad) < d) { y = pad; snap.y = 'top'; }
          else if (point.y > area.height - EDGE_ZONE || Math.abs(y - bottom) < d) { y = bottom; snap.y = 'bottom'; }
        }
        const snapPreview = snap.x || snap.y;

        set({ dragState: { ...dragState, snap, snapPreview, simulatedPosition: { x, y } } });
      },

      endDrag: () => {
        const { dragState, viewport } = get();
        if (!dragState.isDragging || !dragState.activeWidget) return;

        const { activeWidget, simulatedPosition, startRect, snap } = dragState;
        const moved = simulatedPosition
          && (simulatedPosition.x !== startRect.left || simulatedPosition.y !== startRect.top);
        if (get().getWidget(activeWidget)) {
          const placement = moved
            ? {
                ...rectToPlacement({ left: simulatedPosition.x, top: simulatedPosition.y, width: startRect.width, height: startRect.height }, viewport.scoreArea),
                // Snapped to a side edge = docked there (vertical toolbar in 'auto')
                dock: snap.x === 'left' || snap.x === 'right' ? snap.x : null,
              }
            : {};
          get().updateWidget(activeWidget, { ...placement, isDragging: false });
        }

        set({
          dragState: { ...IDLE_DRAG_STATE },
          settlingWidget: moved ? activeWidget : null,
          settleDrop: moved ? { left: simulatedPosition.x, top: simulatedPosition.y, width: startRect.width, height: startRect.height, snap } : null,
        });
      },

      // `rect` and `others` ([{ id, rect }]) are the rendered rects after the drop
      // (its orientation may have changed its size), in score-area px
      settleWidget: (id, rect, others) => {
        const { viewport, layoutSettings, settleDrop } = get();
        const area = viewport.scoreArea;
        const pad = layoutSettings.scoreAreaPadding;
        set({ settlingWidget: null, settleDrop: null });
        const widget = get().getWidget(id);
        if (!widget) return;

        // Line the widget up with the edges it was dropped against, using its final
        // size (a drop that switched row <-> column resized it around its anchor).
        // Free axes keep the drop position.
        const resized = settleDrop
          && (Math.abs(settleDrop.width - rect.width) > 1 || Math.abs(settleDrop.height - rect.height) > 1);
        const snap = settleDrop?.snap || {};
        const from = resized ? settleDrop : rect;
        const maxLeft = Math.max(pad, area.width - rect.width - pad);
        const maxTop = Math.max(pad, area.height - rect.height - pad);
        const placed = {
          ...rect,
          left: snap.x === 'left' ? pad
            : snap.x === 'right' ? maxLeft
              : snap.x === 'center' ? (area.width - rect.width) / 2
                : clamp(from.left, pad, maxLeft),
          top: snap.y === 'top' ? pad
            : snap.y === 'bottom' ? maxTop
              : clamp(from.top, pad, maxTop),
        };

        const otherRects = others.map((o) => o.rect);
        const free = findFreeRect(placed, otherRects, area, pad, { beside: !widget.dock });
        if (free) {
          const movedBy = Math.abs(free.left - rect.left) + Math.abs(free.top - rect.top);
          if (movedBy > 0.5) get().updateWidget(id, rectToPlacement(free, area));
          return;
        }
        if (!widget.dock) return;

        // Docked to a side with no room above/below: it keeps the edge (where it
        // was dropped) and the widgets in the way move inward, next to it
        const edge = { ...placed, left: widget.dock === 'left' ? pad : area.width - placed.width - pad };
        get().updateWidget(id, rectToPlacement(edge, area));
        others.forEach(({ id: otherId, rect: o }) => {
          if (!otherId || !rectsOverlap(edge, o)) return;
          const shifted = {
            ...o,
            left: widget.dock === 'left' ? edge.left + edge.width + SETTLE_GAP : edge.left - o.width - SETTLE_GAP,
          };
          get().updateWidget(otherId, rectToPlacement(shifted, area));
        });
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
                ? { ...widget, anchor: def.anchor, offset: def.offset, size: def.size, orientation: def.orientation, dock: def.dock, isPinned: false, isMinimized: false, isDragging: false }
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
