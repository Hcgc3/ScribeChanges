import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@ui/button.jsx';
import { Card } from '@ui/card.jsx';
import { 
  Pin, 
  PinOff, 
  Move, 
  Minimize2, 
  Maximize2,
  GripVertical
} from 'lucide-react';

/**
 * Componente base para widgets magnéticos que podem ser fixados aos cantos
 * Integra com sistema de drag & drop magnético da aplicação de partitura
 */
const MagneticWidget = ({ 
  children,
  title = "Widget",
  icon: Icon = null,
  showHeader = true,
  position: propsPosition,
  defaultPosition = "top-right",
  defaultPinned = false,
  defaultMinimized = false,
  onPositionChange,
  onPinnedChange,
  onMinimizedChange,
  magneticZones = 50,
  className = "",
  // Filtrar props específicos que não devem ser passados para o DOM
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  onZoomIn,
  onZoomOut,
  onClose,
  onPlayingChange,
  onMove,
  onAnalysisResults,
  ...restProps
}) => {
  console.log('🎯 [MagneticWidget] Rendering:', { title, position: propsPosition || defaultPosition });
  
  const [position, setPosition] = useState(propsPosition || "bottom-center");
  const [isPinned, setIsPinned] = useState(defaultPinned);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState(null);
  
  const widgetRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const visibilityTimeoutRef = useRef(null);
  const rafRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const performanceRef = useRef({ 
    dragStartTime: 0, 
    moveCount: 0, 
    avgFrameTime: 0 
  });

  // Posições magnéticas predefinidas
  const magneticPositions = {
    'top-left': { top: 80, left: 20 },
    'top-right': { top: 80, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'top-center': { top: 80, left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: 20, left: '50%', transform: 'translateX(-50%)' },
    'center-left': { top: '50%', left: 20, transform: 'translateY(-50%)' },
    'center-right': { top: '50%', right: 20, transform: 'translateY(-50%)' },
    'top-left-offset': { top: 80, left: 280 },
    'top-right-offset': { top: 80, right: 280 },
    'bottom-left-offset': { bottom: 20, left: 280, display: 'flex', flexDirection: 'row' },
    'bottom-right-offset': { bottom: 20, right: 280, display: 'flex', flexDirection: 'row' }
  };

  // Posições magnéticas expandidas
  const magneticExpandedPositions = {
    'left-expanded': { 
      top: '50%', 
      left: 0, 
      width: '320px', 
      height: '400px',
      transform: 'translateY(-50%)',
      borderRadius: '0 8px 8px 0'
    },
    'right-expanded': { 
      top: '50%', 
      right: 0, 
      width: '320px', 
      height: '400px',
      transform: 'translateY(-50%)',
      borderRadius: '8px 0 0 8px'
    },
    'top-expanded': { 
      top: 80, 
      left: '50%', 
      right: 'auto',
      width: '500px', 
      height: '250px',
      transform: 'translateX(-50%)',
      borderRadius: '0 0 8px 8px'
    },
    'bottom-expanded': { 
      bottom: 0, 
      left: '50%', 
      right: 'auto',
      width: '500px', 
      height: '250px',
      transform: 'translateX(-50%)',
      borderRadius: '8px 8px 0 0'
    }
  };

  // Sistema de debugging para posição
  useEffect(() => {
    console.log('🎯 [MagneticWidget] Position state changed:', {
      title,
      position,
      propsPosition,
      isDragging,
      isPinned
    });

    if (typeof position !== 'string') {
      console.error('❌ [MagneticWidget] position is not a string:', position);
    }

    if (typeof propsPosition !== 'string') {
      console.error('❌ [MagneticWidget] propsPosition is not a string:', propsPosition);
    }
  }, [position, propsPosition, isDragging, isPinned, title]);

  // Detectar proximidade do rato para mostrar/ocultar widget
  useEffect(() => {
    if (isPinned || isDragging) {
      setIsVisible(true);
      return;
    }

    setIsVisible(true);

    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(visibilityTimeoutRef.current);
    };
  }, [isPinned, isVisible, isDragging, magneticZones]);

  // Calcular posição magnética mais próxima
  const findNearestMagneticPosition = useCallback((x, y) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let nearestPosition = null;
    let minDistance = Infinity;

    Object.entries(magneticPositions).forEach(([pos, coords]) => {
      let posX = coords.left !== undefined ? coords.left : windowWidth - coords.right;
      let posY = coords.top !== undefined ? coords.top : windowHeight - coords.bottom;

      // Adjust for 'bottom-center' snapping
      if (pos === 'bottom-center') {
        posX = windowWidth / 2; // Center horizontally
      }

      const distance = Math.sqrt(Math.pow(x - posX, 2) + Math.pow(y - posY, 2));

      if (distance < minDistance) {
        minDistance = distance;
        nearestPosition = pos;
      }
    });

    console.log('🎯 [MagneticWidget] Nearest position:', nearestPosition);
    return nearestPosition;
  }, [magneticPositions]);

  // Manipuladores de arrasto
  const handleMouseDown = useCallback((e) => {
    console.log('🎯 [MagneticWidget] Mouse down:', { title, e: e.type });
    
    if (e.target.closest('.widget-controls')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    // Start performance tracking
    performanceRef.current.dragStartTime = performance.now();
    performanceRef.current.moveCount = 0;
    
    const rect = widgetRef.current.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setDragOffset(offset);
    setIsDragging(true);

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
    
    // Add dragging class for CSS performance optimizations
    widgetRef.current.classList.add('is-dragging');
    document.body.style.userSelect = 'none'; // Prevent text selection during drag
  }, [title]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    // Throttle mousemove events for better performance
    const now = performance.now();
    if (now - lastMoveTimeRef.current < 16) { // ~60fps
      return;
    }
    
    // Track performance metrics
    performanceRef.current.moveCount++;
    const frameTime = now - lastMoveTimeRef.current;
    performanceRef.current.avgFrameTime = 
      (performanceRef.current.avgFrameTime + frameTime) / 2;
    
    lastMoveTimeRef.current = now;

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      setCustomPosition({ x: newX, y: newY });
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    // Calculate and log performance metrics
    const dragDuration = performance.now() - performanceRef.current.dragStartTime;
    const fps = performanceRef.current.moveCount / (dragDuration / 1000);
    
    console.log('🎯 [MagneticWidget] Drag Performance Report:', {
      title,
      dragDuration: `${dragDuration.toFixed(2)}ms`,
      moveEvents: performanceRef.current.moveCount,
      avgFPS: fps.toFixed(2),
      avgFrameTime: `${performanceRef.current.avgFrameTime.toFixed(2)}ms`
    });
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    setIsDragging(false);
    widgetRef.current.classList.remove('is-dragging');
    document.body.style.userSelect = '';

    const nearestPosition = findNearestMagneticPosition(
      mousePositionRef.current.x,
      mousePositionRef.current.y
    );

    if (nearestPosition) {
      console.log('🎯 [MagneticWidget] Snapping to position:', nearestPosition);
      setPosition(nearestPosition);
      setCustomPosition(null);
    } else {
      console.log('🎯 [MagneticWidget] Keeping custom position:', customPosition);
      setCustomPosition(customPosition);
    }

    if (onPositionChange) {
      onPositionChange(nearestPosition || customPosition);
    }
  }, [isDragging, customPosition, findNearestMagneticPosition, onPositionChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []);

  // Controles de toggle
  const togglePinned = useCallback(() => {
    console.log('🎯 [MagneticWidget] Toggle pinned:', { title, current: isPinned });
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    if (onPinnedChange) {
      onPinnedChange(newPinned);
    }
  }, [isPinned, onPinnedChange, title]);

  const toggleMinimized = useCallback(() => {
    console.log('🎯 [MagneticWidget] Toggle minimized:', { title, current: isMinimized });
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    if (onMinimizedChange) {
      onMinimizedChange(newMinimized);
    }
  }, [isMinimized, onMinimizedChange, title]);

  // Calcular estilo de posicionamento
  const getPositionStyle = useCallback(() => {
    if (customPosition && !isPinned) {
      return {
        position: 'fixed',
        left: `${customPosition.x}px`,
        top: `${customPosition.y}px`,
        zIndex: isDragging ? 1001 : 1000,
        transition: 'none',
      };
    }

    const currentPosition = propsPosition || position;

    if (magneticExpandedPositions[currentPosition]) {
      return {
        position: 'fixed',
        ...magneticExpandedPositions[currentPosition],
        zIndex: isPinned ? 1001 : 1000,
        transition: isDragging ? 'none' : 'all 0.2s ease-out',
      };
    }

    if (magneticPositions[currentPosition]) {
      const isBottomPosition = currentPosition.includes('bottom');
      const layout = isBottomPosition ? 'horizontal' : 'vertical';
      console.log('🎯 [MagneticWidget] Layout for position:', currentPosition, layout);

      // Force horizontal alignment for 'bottom-left-offset' and 'bottom-right-offset'
      if (currentPosition === 'bottom-left-offset' || currentPosition === 'bottom-right-offset') {
        return {
          position: 'fixed',
          ...magneticPositions[currentPosition],
          zIndex: isPinned ? 1001 : 1000,
          display: 'flex',
          flexDirection: 'row',
          transition: isDragging ? 'none' : 'all 0.2s ease-out',
        };
      }

      // Ensure center alignment for 'bottom-center'
      if (currentPosition === 'bottom-center') {
        return {
          position: 'fixed',
          ...magneticPositions[currentPosition],
          zIndex: isPinned ? 1001 : 1000,
          display: 'flex',
          justifyContent: 'center',
          transition: isDragging ? 'none' : 'all 0.2s ease-out',
        };
      }

      return {
        position: 'fixed',
        ...magneticPositions[currentPosition],
        zIndex: isPinned ? 1001 : 1000,
        display: 'flex',
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        transition: isDragging ? 'none' : 'all 0.2s ease-out',
      };
    }

    return {
      position: 'fixed',
      ...magneticPositions['top-right'],
      zIndex: isPinned ? 1001 : 1000,
      transition: isDragging ? 'none' : 'all 0.2s ease-out',
    };
  }, [customPosition, propsPosition, position, isPinned, isDragging, title]);

  useEffect(() => {
    if (position.includes('bottom')) {
      console.log('🎯 [MagneticWidget] Resetting to horizontal layout for bottom position:', position);
      setCustomPosition(null);
    }
  }, [position]);

  // Manipulador de drop
  const handleDrop = (event) => {
    event.preventDefault();
    const droppedPosition = event.dataTransfer.getData('text');

    if (typeof droppedPosition === 'string') {
      setPosition(droppedPosition);
      console.log('🎯 [MagneticWidget] Widget dropped at position:', droppedPosition);
    } else {
      console.error('❌ [MagneticWidget] Invalid position type during drop:', droppedPosition);
    }
  };

  useEffect(() => {
    const widgetElement = widgetRef.current;
    if (widgetElement) {
      widgetElement.addEventListener('drop', handleDrop);
      widgetElement.addEventListener('dragover', (e) => e.preventDefault());

      return () => {
        widgetElement.removeEventListener('drop', handleDrop);
        widgetElement.removeEventListener('dragover', (e) => e.preventDefault());
      };
    }
  }, [widgetRef]);

  // Validação de propsPosition
  useEffect(() => {
    if (typeof propsPosition !== 'string' || !propsPosition) {
      console.error('❌ [MagneticWidget] propsPosition is invalid or missing:', propsPosition);
      setPosition(defaultPosition); // Fallback to default position
    }
  }, [propsPosition, defaultPosition]);

  if (!isVisible) {
    return null;
  }

  // Check if current position is expanded
  const currentPosition = propsPosition || position;
  const isExpanded = false; // FORCE: Always false to disable expansion

  const widgetClasses = `
    magnetic-widget
    ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl is-dragging' : 'cursor-grab transition-all duration-300 ease-in-out'}
    ${isExpanded ? 'expanded-widget' : 'compact-widget'}
    opacity-100 translate-y-0
    ${isPinned ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
    bg-white border border-gray-300 shadow-lg
    ${className}
  `;

  return (
    <Card
      ref={widgetRef}
      className={`${widgetClasses} rounded-sm py-0`}
      style={getPositionStyle()}
      onMouseDown={handleMouseDown}
      {...restProps}
    >
      {/* Cabeçalho do widget - versão minimalista */}
      {showHeader && (
        <div className="flex items-center justify-between p-1 bg-white/90 backdrop-blur-sm border-b border-gray-200/50">
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-gray-400 opacity-50" />
            {Icon && <Icon className="w-3 h-3 text-gray-500" />}
            <span className="text-xs font-medium text-gray-600">{title}</span>
          </div>
          
          <div className="flex items-center gap-0.5 widget-controls opacity-70 hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimized}
              className="w-4 h-4 p-0 hover:bg-gray-200/50 rounded-sm"
              title={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? <Maximize2 className="w-2 h-2" /> : <Minimize2 className="w-2 h-2" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePinned}
              className={`w-4 h-4 p-0 hover:bg-gray-200/50 rounded-sm ${isPinned ? 'text-blue-500' : 'text-gray-400'}`}
              title={isPinned ? "Desafixar" : "Fixar"}
            >
              {isPinned ? <Pin className="w-2 h-2" /> : <PinOff className="w-2 h-2" />}
            </Button>
          </div>
        </div>
      )}
      
      {/* Conteúdo do widget */}
      {!isMinimized && (
        <div className={`widget-content ${isExpanded ? 'p-3' : 'p-3'}`}>
          {/* Debug info for expanded widgets */}
          {isExpanded && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              {typeof currentPosition === 'string' ? (
                <span className="font-semibold text-blue-800">
                  Modo Expandido: {currentPosition.replace('-expanded', '').toUpperCase()}
                </span>
              ) : (
                <span className="font-semibold text-red-800">
                  Erro: currentPosition não é uma string válida.
                </span>
              )}
            </div>
          )}
          {children}
        </div>
      )}
      
      {/* Controles flutuantes quando header está oculto */}
      {!showHeader && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 widget-controls opacity-0 hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimized}
            className="w-4 h-4 p-0 hover:bg-gray-200/50 rounded-sm"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <Maximize2 className="w-2 h-2" /> : <Minimize2 className="w-2 h-2" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePinned}
            className={`w-4 h-4 p-0 hover:bg-gray-200/50 rounded-sm ${isPinned ? 'text-blue-500' : 'text-gray-400'}`}
            title={isPinned ? "Desafixar" : "Fixar"}
          >
            {isPinned ? <Pin className="w-2 h-2" /> : <PinOff className="w-2 h-2" />}
          </Button>
        </div>
      )}
      
      {/* Indicador de posição magnética */}
      {isDragging && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {position.replace('-', ' ')}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MagneticWidget;
