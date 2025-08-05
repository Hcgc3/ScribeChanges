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
 * @param {ReactNode} children - Conteúdo do widget
 * @param {string} title - Título do widget
 * @param {Component} icon - Ícone do widget
 * @param {string} defaultPosition - Posição inicial magnética
 * @param {boolean} defaultPinned - Se inicia fixado
 * @param {boolean} defaultMinimized - Se inicia minimizado
 * @param {function} onPositionChange - Callback para mudança de posição
 * @param {function} onPinnedChange - Callback para mudança de fixação
 * @param {function} onMinimizedChange - Callback para minimização
 * @param {number} magneticZones - Pixels para zona magnética
 * @param {string} className - Classes CSS adicionais
 */
const MagneticWidget = ({ 
  children,
  title = "Widget",
  icon: Icon = null,
  position: propsPosition, // Prop para posição recebida do parent
  defaultPosition = "top-right",
  defaultPinned = false,
  defaultMinimized = false,
  onPositionChange,
  onPinnedChange,
  onMinimizedChange,
  magneticZones = 50, // pixels para zona magnética
  className = "",
  // Filtrar props específicos que não devem ser passados para o DOM
  currentPage, // Filtrar este prop problemático
  totalPages, // Filtrar este prop problemático
  onNextPage, // Filtrar este prop problemático
  onPrevPage, // Filtrar este prop problemático
  onZoomIn, // Filtrar este prop problemático
  onZoomOut, // Filtrar este prop problemático
  onClose, // Filtrar este prop problemático
  onPlayingChange, // Filtrar este prop problemático
  onMove, // Filtrar este prop problemático
  onAnalysisResults, // Filtrar este prop problemático
  ...restProps
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isPinned, setIsPinned] = useState(defaultPinned);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Sempre visível inicialmente
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState(null);
  const [isMagneticExpanded, setIsMagneticExpanded] = useState(false); // Novo estado para expansão magnética
  
  const widgetRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const visibilityTimeoutRef = useRef(null);

    // Posições magnéticas predefinidas - sistema melhorado para UI responsiva
  const magneticPositions = {
    'top-left': { top: 80, left: 20 },      // Abaixo do header
    'top-right': { top: 80, right: 20 },    // Abaixo do header, lado direito
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'top-center': { top: 80, left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: 20, left: '50%', transform: 'translateX(-50%)' },
    'center-left': { top: '50%', left: 20, transform: 'translateY(-50%)' },
    'center-right': { top: '50%', right: 20, transform: 'translateY(-50%)' },
    // Novas posições intermediárias
    'top-left-offset': { top: 80, left: 280 },     // Segunda coluna esquerda
    'top-right-offset': { top: 80, right: 280 },   // Segunda coluna direita
    'bottom-left-offset': { bottom: 20, left: 280 },
    'bottom-right-offset': { bottom: 20, right: 280 }
  };

  // Detectar proximidade do rato para mostrar/ocultar widget
  useEffect(() => {
    // Se está fixado, sempre visível
    if (isPinned) {
      setIsVisible(true);
      return;
    }

  // Posições magnéticas expandidas para ocupar todo o lado do ecrã
  const magneticExpandedPositions = {
    'left-expanded': { top: 80, left: 0, bottom: 0, width: '300px' },
    'right-expanded': { top: 80, right: 0, bottom: 0, width: '300px' },
    'top-expanded': { top: 80, left: 0, right: 0, height: '200px' },
    'bottom-expanded': { bottom: 0, left: 0, right: 0, height: '200px' }
  };

  // Detectar proximidade do rato para mostrar/ocultar widget
  useEffect(() => {
    // Se está fixado, sempre visível
    if (isPinned) {
      setIsVisible(true);
      return;
    }

    // Se está a ser arrastado, sempre visível
    if (isDragging) {
      setIsVisible(true);
      return;
    }

    // Sempre visível, remover lógica de ocultação automática
    setIsVisible(true);

    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      
      if (!widgetRef.current) return;
    };

    return () => {
      clearTimeout(visibilityTimeoutRef.current);
    };
  }, [isPinned, isVisible, isDragging, magneticZones]);

  // Calcular posição magnética mais próxima
  const findNearestMagneticPosition = useCallback((x, y) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let nearestPosition = null;
    let minDistance = Infinity;
    let shouldExpand = false;

    // Verificar se está próximo das bordas para expansão magnética
    const edgeThreshold = 30; // pixels da borda para ativar expansão
    
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

    // Se não está próximo das bordas, verificar posições normais
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

    // Retornar null se nenhuma posição magnética estiver próxima
    return {
      position: nearestPosition,
      shouldExpand: shouldExpand
    };
  }, [magneticZones]);

  // Manipuladores de arrasto
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.widget-controls')) return;

    // Garantir que apenas um widget seja arrastado por vez
    if (document.querySelectorAll('.is-dragging').length > 0) return;

    setIsDragging(true);
    widgetRef.current.classList.add('is-dragging');

    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    // Suavizar movimento com debounce
    requestAnimationFrame(() => {
      setCustomPosition({ x, y });
    });

    // A posição magnética será verificada apenas ao soltar o widget
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    widgetRef.current.classList.remove('is-dragging');

    const magneticResult = findNearestMagneticPosition(mousePositionRef.current.x, mousePositionRef.current.y);
    
    if (magneticResult.position) {
      setPosition(magneticResult.position);
      setIsMagneticExpanded(magneticResult.shouldExpand);
      setCustomPosition(null);
    } else {
      // Preservar posição customizada se não estiver próxima de uma posição magnética
      setIsMagneticExpanded(false);
      setCustomPosition(customPosition);
    }

    if (onPositionChange) {
      onPositionChange(magneticResult.position || customPosition);
    }
  }, [isDragging, customPosition, position, onPositionChange]);

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

  // Manipuladores de estado
  const togglePinned = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    setIsVisible(newPinned || isVisible);
    
    if (onPinnedChange) {
      onPinnedChange(newPinned);
    }
  };

  const toggleMinimized = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    
    if (onMinimizedChange) {
      onMinimizedChange(newMinimized);
    }
  };

  // Calcular estilo de posicionamento
  const getPositionStyle = () => {
    // Usa posição customizada (dragging) primeiro
    if (customPosition && !isPinned && !isMagneticExpanded) {
      return {
        position: 'fixed',
        left: `${customPosition.x}px`,
        top: `${customPosition.y}px`,
        zIndex: isDragging ? 1001 : 1000,
      };
    }

    // Usa posição fixa do props ou estado
    const currentPosition = propsPosition || position;

    // Verificar se é uma posição expandida
    if (isMagneticExpanded && magneticExpandedPositions[currentPosition]) {
      return {
        position: 'fixed',
        ...magneticExpandedPositions[currentPosition],
        zIndex: isPinned ? 1001 : 1000,
      };
    }

    // Posições magnéticas normais
    if (typeof currentPosition === 'string' && magneticPositions[currentPosition]) {
      return {
        position: 'fixed',
        ...magneticPositions[currentPosition],
        zIndex: isPinned ? 1001 : 1000,
      };
    }

    // Fallback para coordenadas diretas
    if (typeof currentPosition === 'object' && currentPosition.x !== undefined) {
      return {
        position: 'fixed',
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        zIndex: isPinned ? 1001 : 1000,
      };
    }

    // Fallback padrão
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
    };
  };

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

