import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
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
  
  const [position, setPosition] = useState(defaultPosition);
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
    'bottom-left-offset': { bottom: 20, left: 280 },
    'bottom-right-offset': { bottom: 20, right: 280 }
  };

  // Posições magnéticas expandidas
  const magneticExpandedPositions = {
    'left-expanded': { top: 80, left: 0, bottom: 0, width: '300px' },
    'right-expanded': { top: 80, right: 0, bottom: 0, width: '300px' },
    'top-expanded': { top: 80, left: 0, right: 0, height: '200px' },
    'bottom-expanded': { bottom: 0, left: 0, right: 0, height: '200px' }
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
    console.log('🎯 [MagneticWidget] findNearestMagneticPosition called:', { x, y, title });
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let nearestPosition = null;
    let minDistance = Infinity;
    let shouldExpand = false;

    const edgeThreshold = 30;
    
    if (x < edgeThreshold) {
      shouldExpand = true;
      nearestPosition = 'left-expanded';
    } else if (x > windowWidth - edgeThreshold) {
      shouldExpand = true;
      nearestPosition = 'right-expanded';
    } else if (y < 80 + edgeThreshold) {
      shouldExpand = true;
      nearestPosition = 'top-expanded';
    } else if (y > windowHeight - edgeThreshold) {
      shouldExpand = true;
      nearestPosition = 'bottom-expanded';
    }

    if (!shouldExpand) {
      Object.entries(magneticPositions).forEach(([pos, coords]) => {
        let posX, posY;

        if (coords.left === '50%') {
          posX = windowWidth / 2;
        } else if (coords.left !== undefined) {
          posX = coords.left;
        } else if (coords.right !== undefined) {
          posX = windowWidth - coords.right;
        }

        if (coords.top === '50%') {
          posY = windowHeight / 2;
        } else if (coords.top !== undefined) {
          posY = coords.top;
        } else if (coords.bottom !== undefined) {
          posY = windowHeight - coords.bottom;
        }

        const distance = Math.sqrt(Math.pow(x - posX, 2) + Math.pow(y - posY, 2));

        if (distance < minDistance && distance < magneticZones) {
          minDistance = distance;
          nearestPosition = pos;
        }
      });
    }

    const result = {
      position: nearestPosition,
      shouldExpand: shouldExpand
    };
    
    console.log('🎯 [MagneticWidget] findNearestMagneticPosition result:', result);
    return result;
  }, [magneticZones, title]);

  // Manipuladores de arrasto
  const handleMouseDown = useCallback((e) => {
    console.log('🎯 [MagneticWidget] Mouse down:', { title, e: e.type });
    
    if (e.target.closest('.widget-controls')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
    widgetRef.current.classList.add('is-dragging');
  }, [title]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setCustomPosition({ x: newX, y: newY });
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    console.log('🎯 [MagneticWidget] Mouse up:', { title });
    
    setIsDragging(false);
    widgetRef.current.classList.remove('is-dragging');

    const magneticResult = findNearestMagneticPosition(mousePositionRef.current.x, mousePositionRef.current.y);
    
    if (magneticResult.position) {
      console.log('🎯 [MagneticWidget] Setting magnetic position:', magneticResult.position);
      setPosition(magneticResult.position);
      setCustomPosition(null);
    } else {
      console.log('🎯 [MagneticWidget] Keeping custom position:', customPosition);
      setCustomPosition(customPosition);
    }

    if (onPositionChange) {
      onPositionChange(magneticResult.position || customPosition);
    }
  }, [isDragging, customPosition, onPositionChange, findNearestMagneticPosition, title]);

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
    console.log('🎯 [MagneticWidget] getPositionStyle called:', {
      title,
      customPosition,
      propsPosition,
      position,
      isPinned
    });

    // Usar posição customizada (dragging) primeiro
    if (customPosition && !isPinned) {
      return {
        position: 'fixed',
        left: `${customPosition.x}px`,
        top: `${customPosition.y}px`,
        zIndex: isDragging ? 1001 : 1000,
      };
    }

    // Usar posição fixa do props ou estado
    const currentPosition = propsPosition || position;

    // Verificar se é uma posição normal
    if (magneticPositions[currentPosition]) {
      return {
        position: 'fixed',
        ...magneticPositions[currentPosition],
        zIndex: isPinned ? 1001 : 1000,
      };
    }

    // Fallback para posição padrão
    return {
      position: 'fixed',
      ...magneticPositions['top-right'],
      zIndex: isPinned ? 1001 : 1000,
    };
  }, [customPosition, propsPosition, position, isPinned, isDragging, title]);

  if (!isVisible) {
    return null;
  }

  const widgetClasses = `
    magnetic-widget
    transition-all duration-300 ease-in-out
    ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl' : 'cursor-grab'}
    opacity-100 translate-y-0
    ${isPinned ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
    bg-white border border-gray-300 shadow-lg
    ${className}
  `;

  return (
    <Card
      ref={widgetRef}
      className={`${widgetClasses} rounded-sm`}
      style={getPositionStyle()}
      onMouseDown={handleMouseDown}
      {...restProps}
    >
      {/* Cabeçalho do widget */}
      <div className="flex items-center justify-between p-1.5 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3 h-3 text-gray-500" />
          {Icon && <Icon className="w-3 h-3 text-gray-700" />}
          <span className="text-xs font-semibold text-gray-800">{title}</span>
        </div>
        
        <div className="flex items-center gap-0.5 widget-controls">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimized}
            className="w-5 h-5 p-0 hover:bg-gray-300 rounded-sm"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePinned}
            className={`w-5 h-5 p-0 hover:bg-gray-300 rounded-sm ${isPinned ? 'text-blue-600' : 'text-gray-500'}`}
            title={isPinned ? "Desafixar" : "Fixar"}
          >
            {isPinned ? <Pin className="w-2.5 h-2.5" /> : <PinOff className="w-2.5 h-2.5" />}
          </Button>
        </div>
      </div>
      
      {/* Conteúdo do widget */}
      {!isMinimized && (
        <div className="p-2">
          {children}
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
