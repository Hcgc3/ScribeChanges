import React, { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWidgetStore } from '../../lib/stores/widget-store';
import MediaControlsWidget from '../controls/MediaControlsWidget';
import EditingToolsWidget from '../controls/EditingToolsWidget';
import PropertiesWidget from '../controls/PropertiesWidget';
import QuickActionsWidget from '../controls/QuickActionsWidget';
import PageSizeEditorWidget from '../controls/PageSizeEditorWidget';

const WidgetManager = () => {
  const containerRef = useRef(null);
  // Narrow selection: drag state changes every pointer move and must not re-render this
  const {
    widgets,
    configs,
    initializeDefaultWidgets,
    updateViewport,
    hideAllWidgets,
    showAllWidgets,
    cleanup,
  } = useWidgetStore(useShallow((state) => ({
    widgets: state.widgets,
    configs: state.configs,
    initializeDefaultWidgets: state.initializeDefaultWidgets,
    updateViewport: state.updateViewport,
    hideAllWidgets: state.hideAllWidgets,
    showAllWidgets: state.showAllWidgets,
    cleanup: state.cleanup,
  })));

  // Edges the dragged widget will glue to, shown as glowing strips
  const snapX = useWidgetStore((state) => {
    const x = state.dragState.isDragging ? state.dragState.snap.x : null;
    return x === 'left' || x === 'right' ? x : null;
  });
  const snapY = useWidgetStore((state) => (state.dragState.isDragging ? state.dragState.snap.y : null));
  const stripClass = 'absolute rounded-full bg-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.6)] animate-pulse pointer-events-none';

  // Initialize widgets on mount
  useEffect(() => {
    initializeDefaultWidgets();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initializeDefaultWidgets, cleanup]);

  // Keep viewport in sync with the actual overlay size (exclude header)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      updateViewport(
        { width: rect.width, height: rect.height },
        { x: 0, y: 0, width: rect.width, height: rect.height }
      );
    };

    // Initial measure
    measure();

    // Observe size changes of the overlay container
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    return () => ro.disconnect();
  }, [updateViewport]);

  // Global keyboard shortcuts for widgets
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+H - Hide all widgets
      if ((event.ctrlKey || event.metaKey) && event.key === 'h' && !event.shiftKey) {
        event.preventDefault();
        hideAllWidgets();
      }
      
      // Ctrl+Shift+H - Show all widgets
      if ((event.ctrlKey || event.metaKey) && event.key === 'H' && event.shiftKey) {
        event.preventDefault();
        showAllWidgets();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hideAllWidgets, showAllWidgets]);

  const renderWidget = (widgetId) => {
    const widget = widgets[widgetId];
    const config = configs[widgetId];

    if (!widget || !config || !widget.isVisible) {
      return null;
    }

    switch (widget.type) {
      case 'MediaControls':
        return <MediaControlsWidget key={widgetId} widgetId={widgetId} />;
      
      case 'EditingTools':
        return <EditingToolsWidget key={widgetId} widgetId={widgetId} />;
      
      case 'Properties':
        return <PropertiesWidget key={widgetId} widgetId={widgetId} />;
      
      case 'QuickActions':
        return <QuickActionsWidget key={widgetId} widgetId={widgetId} />;
      
      case 'PageSizeEditor':
        return <PageSizeEditorWidget key={widgetId} widgetId={widgetId} />;
      
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="widget-manager absolute inset-0 z-40 pointer-events-none">
      {snapX && (
        <div aria-hidden="true" className={`${stripClass} top-2 bottom-2 w-1.5 ${snapX === 'left' ? 'left-1' : 'right-1'}`} />
      )}
      {snapY && (
        <div aria-hidden="true" className={`${stripClass} left-2 right-2 h-1.5 ${snapY === 'top' ? 'top-1' : 'bottom-1'}`} />
      )}

      {/* Render all visible widgets */}
      {Object.keys(widgets).map(renderWidget)}
      
      {/* Widget overlay for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs pointer-events-none z-0">
          <div>Widgets: {Object.keys(widgets).length}</div>
          <div>Visible: {Object.values(widgets).filter(w => w.isVisible).length}</div>
          <div>Dragging: {Object.values(widgets).filter(w => w.isDragging).length}</div>
        </div>
      )}
    </div>
  );
};

export default WidgetManager;

