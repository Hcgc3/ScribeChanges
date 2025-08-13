import React, { useRef, useEffect, useState } from 'react';
import { 
  GripVertical, 
  Pin, 
  PinOff, 
  Minimize2, 
  Maximize2, 
  Eye, 
  EyeOff, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWidgetStore } from '@/lib/stores/widget-store';
import { useAppStore } from '@/lib/stores/app-store';

const MagneticWidget = ({ 
  widgetId, 
  children, 
  className = '',
  showHeaderControl = false // Show header control for primary widget
}) => {
  const widgetRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Select only this widget's state to avoid re-renders from other widgets
  const widget = useWidgetStore((state) => state.widgets[widgetId]);

  // Select only the info relevant to this widget from drag state
  const snapPreview = useWidgetStore((state) =>
    state.dragState.activeWidget === widgetId ? state.dragState.snapPreview : null
  );
  const simulatedPosition = useWidgetStore((state) =>
    state.dragState.activeWidget === widgetId ? state.dragState.simulatedPosition : null
  );

  // Stable action methods (call directly from store to avoid subscribing to changes)
  const toggleWidgetPin = (id) => useWidgetStore.getState().toggleWidgetPin(id);
  const toggleWidgetMinimize = (id) => useWidgetStore.getState().toggleWidgetMinimize(id);
  const closeWidget = (id) => useWidgetStore.getState().closeWidget(id);
  const bringToFront = (id) => useWidgetStore.getState().bringToFront(id);
  const startDrag = (id, start, offset) => useWidgetStore.getState().startDrag(id, start, offset);
  const updateDrag = (pos) => useWidgetStore.getState().updateDrag(pos);
  const endDrag = () => useWidgetStore.getState().endDrag();
  const toggleWidgetVisibility = (id) => useWidgetStore.getState().toggleWidgetVisibility(id);

  const {
    header,
    showHeader,
    toggleHeader,
  } = useAppStore();

  useEffect(() => {
    const element = widgetRef.current;
    if (!element) return;

    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let offset = { x: 0, y: 0 };

    const isButton = (el) => !!el.closest('button, [role="button"], .no-drag');

    const handleMouseDown = (e) => {
      const w = useWidgetStore.getState().widgets[widgetId];
      if (!w || w.isPinned) return;
      // Only start drag from explicit drag handle and not on buttons
      const handle = e.target.closest('.widget-drag-handle');
      if (!handle || isButton(e.target)) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = element.getBoundingClientRect();
      offset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      startPos = { x: e.clientX, y: e.clientY };

      if (startDrag(widgetId, startPos, offset)) {
        isDragging = true;
        bringToFront(widgetId);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      updateDrag({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      endDrag();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    const handleTouchStart = (e) => {
      const w = useWidgetStore.getState().widgets[widgetId];
      if (!w || w.isPinned) return;
      const handle = e.target.closest('.widget-drag-handle');
      if (!handle || isButton(e.target)) return;

      e.preventDefault();

      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();

      offset = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      startPos = { x: touch.clientX, y: touch.clientY };

      if (startDrag(widgetId, startPos, offset)) {
        isDragging = true;
        bringToFront(widgetId);
      }
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      updateDrag({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      endDrag();
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [widgetId]);

  if (!widget || !widget.isVisible) {
    return null;
  }

  const handlePin = (e) => {
    e.stopPropagation();
    toggleWidgetPin(widgetId);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    toggleWidgetMinimize(widgetId);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    closeWidget(widgetId);
  };

  // new: toggle widget visibility (hide from within the widget)
  const handleToggleVisibility = (e) => {
    e.stopPropagation();
    toggleWidgetVisibility(widgetId);
  };

  const handleShowHeader = (e) => {
    e.stopPropagation();
    showHeader();
  };

  const handleToggleHeader = (e) => {
    e.stopPropagation();
    toggleHeader();
  };

  // Calculate position (handle negative values for right/bottom positioning)
  const position = {
    left: widget.position.x >= 0 ? widget.position.x : undefined,
    right: widget.position.x < 0 ? Math.abs(widget.position.x) : undefined,
    top: widget.position.y >= 0 ? widget.position.y : undefined,
    bottom: widget.position.y < 0 ? Math.abs(widget.position.y) : undefined,
  };

  const widgetClasses = [
    'magnetic-widget',
    'absolute bg-background/95',
    'border border-border/20 rounded-lg shadow-lg',
    widget.isDragging ? 'transition-none will-change-transform' : 'transition-all duration-200 ease-out',
    'pointer-events-auto',
    'flex flex-col overflow-hidden',
    widget.isDragging ? 'shadow-2xl scale-105 z-50' : '',
    widget.isPinned ? 'ring-2 ring-primary/30' : '',
    widget.isMinimized ? 'h-auto' : '',
    snapPreview ? 'ring-2 ring-primary/50' : '',
    className,
  ].filter(Boolean).join(' ');

  const titleBarClasses = [
    'widget-title-bar',
    'flex items-center justify-between px-3 py-2',
    'border-b border-border/10',
    'select-none touch-none',
  ].filter(Boolean).join(' ');

  // Translate while dragging to avoid mutating state per frame
  const translateStyle = widget.isDragging && simulatedPosition
    ? {
        transform: `translate3d(${simulatedPosition.x - widget.position.x}px, ${simulatedPosition.y - widget.position.y}px, 0)`,
        willChange: 'transform',
      }
    : { transform: 'translate3d(0,0,0)' };

  return (
    <div
      ref={widgetRef}
      className={widgetClasses}
      style={{
        ...position,
        ...translateStyle,
        width: widget.size.width,
        height: widget.isMinimized ? 'auto' : widget.size.height,
        zIndex: widget.zIndex,
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title Bar */}
      <div className={titleBarClasses}>
        {/* Left Section - Grip and Title act as drag handle */}
        <div className="widget-drag-handle flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing">
          <GripVertical 
            className={`w-4 h-4 text-muted-foreground ${widget.isPinned ? 'opacity-50' : ''}`} 
          />
          <span className="text-sm font-medium truncate">
            {widget.title}
          </span>
        </div>

        {/* Right Section - Controls */}
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Controls marked as no-drag to avoid hijacking */}
          <div className="flex items-center gap-1 no-drag">
            {/* Header Control - Show when header is hidden and this is primary widget */}
            {showHeaderControl && !header.isVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowHeader}
                className="w-6 h-6 p-0 text-primary hover:text-primary/80"
                title="Mostrar Header"
              >
                <Eye className="w-3 h-3" />
              </Button>
            )}

            {/* Header Control - Toggle when header is visible and this is primary widget */}
            {showHeaderControl && header.isVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleHeader}
                className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
                title="Ocultar Header"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            )}

            {/* new: Widget Visibility Toggle - hides this widget */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleVisibility}
              className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
              title="Ocultar Widget"
            >
              <EyeOff className="w-3 h-3" />
            </Button>

            {/* Pin/Unpin */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePin}
              className={`w-6 h-6 p-0 ${widget.isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title={widget.isPinned ? 'Desafixar' : 'Fixar'}
            >
              {widget.isPinned ? (
                <PinOff className="w-3 h-3" />
              ) : (
                <Pin className="w-3 h-3" />
              )}
            </Button>

            {/* Minimize/Maximize */}
            {widget.canMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
                title={widget.isMinimized ? 'Expandir' : 'Minimizar'}
              >
                {widget.isMinimized ? (
                  <Maximize2 className="w-3 h-3" />
                ) : (
                  <Minimize2 className="w-3 h-3" />
                )}
              </Button>
            )}

            {/* Close */}
            {widget.canClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-6 h-6 p-0 text-muted-foreground hover:text-destructive"
                title="Fechar"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {!widget.isMinimized && (
        <div className="widget-content p-3 flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      )}

      {/* Drag Preview Indicator */}
      {widget.isDragging && snapPreview && (
        <div className="absolute -inset-1 border-2 border-primary/50 rounded-lg pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

export default MagneticWidget;

