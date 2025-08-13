import { useCallback, useRef, useEffect } from 'react';
import { useWidgetStore } from '../stores/widget-store';

export const useDrag = (widgetId, options = {}) => {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    constraints,
    snapToGrid = false,
    gridSize = 10,
    // momentum = true, // removido: não utilizado
  } = options;

  const {
    widgets,
    startDrag,
    updateDrag,
    endDrag,
    // moveWidget, // removido: não utilizado
  } = useWidgetStore();

  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const velocity = useRef({ x: 0, y: 0 });

  const widget = widgets[widgetId];

  const calculateVelocity = useCallback((currentPos, currentTime) => {
    const deltaTime = currentTime - lastTime.current;
    if (deltaTime > 0) {
      velocity.current = {
        x: (currentPos.x - lastPosition.current.x) / deltaTime,
        y: (currentPos.y - lastPosition.current.y) / deltaTime,
      };
    }
    lastPosition.current = currentPos;
    lastTime.current = currentTime;
  }, []);

  const getMousePosition = useCallback((event) => {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }, []);

  const getTouchPosition = useCallback((event) => {
    const touch = event.touches[0] || event.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  const applyConstraints = useCallback((position) => {
    if (!constraints) return position;

    return {
      x: Math.max(constraints.left || 0, Math.min(constraints.right || Infinity, position.x)),
      y: Math.max(constraints.top || 0, Math.min(constraints.bottom || Infinity, position.y)),
    };
  }, [constraints]);

  const applyGridSnap = useCallback((position) => {
    if (!snapToGrid) return position;

    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  }, [snapToGrid, gridSize]);

  const handleStart = useCallback((position) => {
    if (!widget || widget.pinned) return false;

    isDragging.current = true;
    const currentTime = Date.now();
    
    lastPosition.current = position;
    lastTime.current = currentTime;
    velocity.current = { x: 0, y: 0 };

    startDrag(widgetId, position);
    onDragStart?.({ widgetId, position, timestamp: currentTime });

    return true;
  }, [widget, widgetId, startDrag, onDragStart]);

  const handleMove = useCallback((position) => {
    if (!isDragging.current || !widget) return;

    const currentTime = Date.now();
    calculateVelocity(position, currentTime);

    let constrainedPosition = applyConstraints(position);
    constrainedPosition = applyGridSnap(constrainedPosition);

    updateDrag(widgetId, constrainedPosition, velocity.current);
    onDragMove?.({ 
      widgetId, 
      position: constrainedPosition, 
      velocity: velocity.current,
      timestamp: currentTime 
    });
  }, [widget, widgetId, updateDrag, onDragMove, calculateVelocity, applyConstraints, applyGridSnap]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current || !widget) return;

    isDragging.current = false;
    const currentTime = Date.now();

    endDrag(widgetId);
    onDragEnd?.({ 
      widgetId, 
      velocity: velocity.current,
      timestamp: currentTime 
    });

    // Reset velocity
    velocity.current = { x: 0, y: 0 };
  }, [widget, widgetId, endDrag, onDragEnd]);

  // Mouse events
  const handleMouseDown = useCallback((event) => {
    event.preventDefault();
    const position = getMousePosition(event);
    if (handleStart(position)) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [handleStart, getMousePosition, handleMouseMove, handleMouseUp]);

  const handleMouseMove = useCallback((event) => {
    event.preventDefault();
    const position = getMousePosition(event);
    handleMove(position);
  }, [handleMove, getMousePosition]);

  const handleMouseUp = useCallback((event) => {
    event.preventDefault();
    handleEnd();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleEnd, handleMouseMove]);

  // Touch events
  const handleTouchStart = useCallback((event) => {
    event.preventDefault();
    const position = getTouchPosition(event);
    if (handleStart(position)) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
  }, [handleStart, getTouchPosition, handleTouchMove, handleTouchEnd]);

  const handleTouchMove = useCallback((event) => {
    event.preventDefault();
    const position = getTouchPosition(event);
    handleMove(position);
  }, [handleMove, getTouchPosition]);

  const handleTouchEnd = useCallback((event) => {
    event.preventDefault();
    handleEnd();
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, [handleEnd, handleTouchMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Drag handlers
  const dragHandlers = {
    onMouseDown: handleMouseDown,
    onTouchStart: handleTouchStart,
  };

  // Drag state
  const dragState = widget?.dragState || {
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    momentum: false,
  };

  return {
    dragRef,
    dragHandlers,
    dragState,
    isDragging: dragState.isDragging,
    position: widget?.position || { x: 0, y: 0 },
    velocity: velocity.current,
  };
};

