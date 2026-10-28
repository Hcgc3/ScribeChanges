import React, { useRef, useEffect, useState } from 'react';
import { 
  GripVertical, 
  Pin, 
  PinOff, 
  Minimize2, 
  Maximize2, 
  Eye, 
  EyeOff, 
  X,
  EllipsisVertical,
  Columns3,
  Rows3,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useWidgetStore, getWidgetPlacement, useWidgetOrientation } from '../../lib/stores/widget-store';
import { useAppStore } from '@/lib/stores/app-store';

const MagneticWidget = ({ 
  widgetId, 
  children, 
  className = '',
  showHeaderControl = false // Show header control for primary widget
}) => {
  const widgetRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  // Layout size of a content-sized (toolbar) widget, before scaling
  const [measured, setMeasured] = useState(null);
  const { orientation } = useWidgetOrientation(widgetId);
  
  // Select only this widget's state to avoid re-renders from other widgets
  const widget = useWidgetStore((state) => state.widgets[widgetId]);

  // Select only the info relevant to this widget from drag state
  const snapPreview = useWidgetStore((state) =>
    state.dragState.activeWidget === widgetId ? state.dragState.snapPreview : null
  );
  const simulatedPosition = useWidgetStore((state) =>
    state.dragState.activeWidget === widgetId ? state.dragState.simulatedPosition : null
  );
  const dragStart = useWidgetStore((state) =>
    state.dragState.activeWidget === widgetId ? state.dragState.startRect : null
  );
  const scoreArea = useWidgetStore((state) => state.viewport.scoreArea);
  const uiScale = useWidgetStore((state) => state.uiScale);
  const padding = useWidgetStore((state) => state.layoutSettings.scoreAreaPadding);

  // Stable action methods (call directly from store to avoid subscribing to changes)
  const toggleWidgetPin = (id) => useWidgetStore.getState().toggleWidgetPin(id);
  const toggleWidgetMinimize = (id) => useWidgetStore.getState().toggleWidgetMinimize(id);
  const closeWidget = (id) => useWidgetStore.getState().closeWidget(id);
  const startDrag = (id, start, offset) => useWidgetStore.getState().startDrag(id, start, offset);
  const updateDrag = (pos) => useWidgetStore.getState().updateDrag(pos);
  const endDrag = () => useWidgetStore.getState().endDrag();
  const toggleWidgetVisibility = (id) => useWidgetStore.getState().toggleWidgetVisibility(id);
  const setWidgetOrientation = (id, o) => {
    const element = widgetRef.current;
    const area = element?.parentElement?.getBoundingClientRect();
    const r = element?.getBoundingClientRect();
    const rect = area && r ? { left: r.left - area.left, top: r.top - area.top, width: r.width, height: r.height } : null;
    useWidgetStore.getState().setWidgetOrientation(id, o, rect);
  };

  const headerVisible = useAppStore((state) => state.header.isVisible);
  const showHeader = () => useAppStore.getState().showHeader();
  const toggleHeader = () => useAppStore.getState().toggleHeader();

  useEffect(() => {
    const element = widgetRef.current;
    if (!element) return;

    let isDragging = false;

    const isButton = (el) => !!el.closest('button, [role="button"], .no-drag');

    // Pointer and widget rect in score-area coordinates (the overlay starts below the header)
    const toArea = (clientX, clientY) => {
      const area = element.parentElement.getBoundingClientRect();
      return { x: clientX - area.left, y: clientY - area.top };
    };
    const beginDrag = (clientX, clientY) => {
      const area = element.parentElement.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const startRect = { left: rect.left - area.left, top: rect.top - area.top, width: rect.width, height: rect.height };
      const grab = { x: clientX - rect.left, y: clientY - rect.top };
      return startDrag(widgetId, startRect, grab);
    };

    const handleMouseDown = (e) => {
      const w = useWidgetStore.getState().widgets[widgetId];
      if (!w || w.isPinned) return;
      // Only start drag from explicit drag handle and not on buttons
      const handle = e.target.closest('.widget-drag-handle');
      if (!handle || isButton(e.target)) return;

      e.preventDefault();
      e.stopPropagation();

      if (beginDrag(e.clientX, e.clientY)) {
        isDragging = true;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      updateDrag(toArea(e.clientX, e.clientY));
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
      if (beginDrag(touch.clientX, touch.clientY)) {
        isDragging = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      updateDrag(toArea(touch.clientX, touch.clientY));
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

  // Toolbar widgets size themselves to their buttons; track that size so the
  // placement can keep them inside the score area
  const contentSized = !!widget?.orientable;
  useEffect(() => {
    const element = widgetRef.current;
    if (!contentSized || !element) return;
    const ro = new ResizeObserver(() => {
      setMeasured((prev) => {
        const next = { width: element.offsetWidth, height: element.offsetHeight };
        return prev && prev.width === next.width && prev.height === next.height ? prev : next;
      });
    });
    ro.observe(element);
    return () => ro.disconnect();
  }, [contentSized, widget?.isVisible]);

  // Right after a drop: report where the widget ended up so the store can move it
  // off any widget it landed on
  const settling = useWidgetStore((state) => state.settlingWidget === widgetId);
  useEffect(() => {
    const element = widgetRef.current;
    const areaElement = element?.parentElement;
    if (!settling || !areaElement) return;
    const area = areaElement.getBoundingClientRect();
    const toArea = (r) => ({ left: r.left - area.left, top: r.top - area.top, width: r.width, height: r.height });
    const others = [...areaElement.querySelectorAll(':scope > .magnetic-widget')]
      .filter((other) => other !== element)
      .map((other) => ({ id: other.dataset.widgetId, rect: toArea(other.getBoundingClientRect()) }));
    // The score viewer's zoom controls are not a widget but must not be covered either
    const zoomControls = document.querySelector('.score-zoom-controls');
    if (zoomControls) others.push({ id: null, rect: toArea(zoomControls.getBoundingClientRect()) });
    useWidgetStore.getState().settleWidget(widgetId, toArea(element.getBoundingClientRect()), others);
  }, [settling, widgetId]);

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

  // Anchored to a corner/edge of the score area and scaled to the screen size
  const placement = getWidgetPlacement(widget, scoreArea, uiScale, padding, contentSized ? measured : null);
  const vertical = orientation === 'vertical';

  const widgetClasses = [
    'magnetic-widget',
    'absolute bg-background/95',
    'border border-border/20 rounded-lg shadow-lg',
    widget.isDragging ? 'will-change-transform' : '',
    'pointer-events-auto',
    'flex flex-col overflow-hidden',
    widget.isDragging ? 'shadow-2xl' : '',
    widget.isPinned ? 'ring-2 ring-primary/30' : '',
    widget.isMinimized ? 'h-auto' : '',
    snapPreview ? 'ring-2 ring-primary/50' : '',
    className,
  ].filter(Boolean).join(' ');

  const titleBarClasses = [
    'widget-title-bar',
    vertical ? 'flex items-center justify-center gap-0.5 px-1 py-1' : 'flex items-center justify-between gap-2 px-3 py-2',
    'border-b border-border/10',
    'select-none touch-none',
  ].filter(Boolean).join(' ');

  // All widget controls in one menu: the only way to reach them in the narrow
  // vertical layout, and where the orientation is chosen in both layouts
  const widgetMenu = (trigger) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={vertical ? (widget.anchor.x === 'right' ? 'left' : 'right') : 'bottom'} className="w-52">
        <DropdownMenuLabel className="text-xs">{widget.title}</DropdownMenuLabel>
        {widget.orientable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Orientação</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={widget.orientation || 'auto'}
              onValueChange={(value) => setWidgetOrientation(widgetId, value)}
            >
              <DropdownMenuRadioItem value="auto">Automática</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="horizontal">Horizontal</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="vertical">Vertical</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}
        {vertical && (
          <>
            <DropdownMenuSeparator />
            {showHeaderControl && (
              <DropdownMenuItem onSelect={() => (headerVisible ? toggleHeader() : showHeader())}>
                {headerVisible ? <EyeOff /> : <Eye />}
                {headerVisible ? 'Ocultar Header' : 'Mostrar Header'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => toggleWidgetPin(widgetId)}>
              {widget.isPinned ? <PinOff /> : <Pin />}
              {widget.isPinned ? 'Desafixar' : 'Fixar'}
            </DropdownMenuItem>
            {widget.canMinimize && (
              <DropdownMenuItem onSelect={() => toggleWidgetMinimize(widgetId)}>
                {widget.isMinimized ? <Maximize2 /> : <Minimize2 />}
                {widget.isMinimized ? 'Expandir' : 'Minimizar'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => toggleWidgetVisibility(widgetId)}>
              <EyeOff />
              Ocultar Widget
            </DropdownMenuItem>
            {widget.canClose && (
              <DropdownMenuItem variant="destructive" onSelect={() => closeWidget(widgetId)}>
                <X />
                Fechar
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Translate while dragging; the anchor is only recomputed on drop
  const dragTranslate = widget.isDragging && simulatedPosition && dragStart
    ? `translate3d(${simulatedPosition.x - dragStart.left}px, ${simulatedPosition.y - dragStart.top}px, 0) `
    : '';

  return (
    <div
      ref={widgetRef}
      data-widget-id={widgetId}
      className={widgetClasses}
      style={{
        ...placement.style,
        transform: dragTranslate + placement.transform,
        transformOrigin: placement.transformOrigin,
        width: contentSized ? 'max-content' : widget.size.width,
        height: contentSized || widget.isMinimized ? 'auto' : widget.size.height,
        zIndex: widget.zIndex,
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title Bar */}
      {vertical ? (
        <div className={titleBarClasses}>
          <div className="widget-drag-handle flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing" title={widget.title}>
            <GripVertical className={`w-4 h-4 text-muted-foreground ${widget.isPinned ? 'opacity-50' : ''}`} />
          </div>
          {widgetMenu(
            <Button
              variant="ghost"
              size="sm"
              className="no-drag w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
              title="Opções do widget"
            >
              <EllipsisVertical className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ) : (
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
            {/* Orientation (toolbar widgets only) */}
            {widget.orientable && widgetMenu(
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
                title="Orientação"
              >
                {orientation === 'vertical' ? <Rows3 className="w-3 h-3" /> : <Columns3 className="w-3 h-3" />}
              </Button>
            )}

            {/* Header Control - Show when header is hidden and this is primary widget */}
            {showHeaderControl && !headerVisible && (
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
            {showHeaderControl && headerVisible && (
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
      )}

      {/* Content */}
      {!widget.isMinimized && (
        <div className={`widget-content ${contentSized ? 'p-1.5' : 'p-3'} flex-1 min-h-0 overflow-auto`}>
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

