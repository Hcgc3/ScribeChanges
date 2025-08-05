import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  RotateCcw, 
  Maximize2,
  Minimize2,
  Navigation
} from 'lucide-react';

/**
 * Componente de navegação estilo OpenStreetMap para partituras
 */
const OSMNavigationControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onPan, 
  onReset, 
  onFullscreen,
  zoomLevel = 1.0,
  isPanning = false,
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (isPanning) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && isPanning) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setPanOffset({ x: deltaX, y: deltaY });
      
      if (onPan) {
        onPan({ deltaX, deltaY });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <Card className="p-2 bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200">
        <div className="flex flex-col gap-1">
          {/* Controles de zoom */}
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomIn}
              className="w-10 h-10 p-0 hover:bg-yellow-50 hover:border-yellow-300"
              title="Ampliar (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <div className="text-xs text-center py-1 px-2 bg-gray-50 rounded border">
              {Math.round(zoomLevel * 100)}%
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomOut}
              className="w-10 h-10 p-0 hover:bg-yellow-50 hover:border-yellow-300"
              title="Reduzir (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 my-1" />

          {/* Controles de navegação */}
          <div className="flex flex-col gap-1">
            <Button
              variant={isPanning ? "default" : "outline"}
              size="sm"
              onClick={() => onPan && onPan({ toggle: true })}
              className={`w-10 h-10 p-0 ${
                isPanning 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'hover:bg-yellow-50 hover:border-yellow-300'
              }`}
              title="Ferramenta de Movimento (Pan)"
            >
              <Move className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-10 h-10 p-0 hover:bg-yellow-50 hover:border-yellow-300"
              title="Resetar Vista"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onFullscreen}
              className="w-10 h-10 p-0 hover:bg-yellow-50 hover:border-yellow-300"
              title="Ecrã Completo"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 my-1" />

          {/* Indicador de navegação */}
          <div className="flex items-center justify-center p-1">
            <Navigation className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OSMNavigationControls;

