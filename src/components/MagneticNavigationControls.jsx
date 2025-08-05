import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import MagneticWidget from './MagneticWidget.jsx';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  RotateCcw, 
  Maximize2,
  Navigation,
  MousePointer,
  Grid,
  Eye
} from 'lucide-react';

/**
 * Controles de navegação magnéticos - Sistema de zoom e navegação
 * @param {number} zoomLevel - Nível de zoom atual
 * @param {string} position - Posição magnética atual
 * @param {function} onPositionChange - Callback para mudança de posição
 * @param {string} defaultPosition - Posição inicial padrão
 */
const MagneticNavigationControls = ({
  zoomLevel = 1.0,
  isPanning = false,
  isSelectionMode = false,
  showGrid = false,
  // Props de posicionamento magnético
  position,
  onPositionChange,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onPan,
  onReset,
  onFullscreen,
  onToggleSelection,
  onToggleGrid,
  defaultPosition = "top-right",
  defaultPinned = false,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // FORCE: Disable expanded mode completely
  const isExpandedDisabled = true;

  // DEBUG: Performance monitoring following debugging.md methodology
  const startTime = performance.now();
  console.log('🧭 MagneticNavigationControls - Render Performance:', {
    zoomLevel,
    isPanning,
    isSelectionMode,
    showGrid,
    isExpanded,
    renderStartTime: startTime,
    timestamp: new Date().toISOString()
  });

  // Performance end measurement
  setTimeout(() => {
    const endTime = performance.now();
    console.log('🧭 MagneticNavigationControls - Render Complete:', {
      renderTime: `${(endTime - startTime).toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });
  }, 0);

  // Detectar orientação baseada na posição
  const getButtonLayout = () => {
    const currentPos = position || defaultPosition;
    // Vertical para posições left/right, horizontal para bottom/top
    if (currentPos.includes('left') || currentPos.includes('right')) {
      return 'flex-col'; // Vertical (top to bottom)
    }
    return 'flex-row'; // Horizontal (left to right)
  };

  // Controles principais (sempre visíveis)
  const MainControls = () => {
    const isVertical = getButtonLayout() === 'flex-col';
    
    return (
      <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-1.5`}>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          className="w-8 h-8 p-0 hover:bg-yellow-50 hover:border-yellow-300"
          title="Reduzir (Zoom Out)"
        >
          <ZoomOut className="w-3 h-3" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          className="w-8 h-8 p-0 hover:bg-yellow-50 hover:border-yellow-300"
          title="Ampliar (Zoom In)"
        >
          <ZoomIn className="w-3 h-3" />
        </Button>

        <Button
          variant={isPanning ? "default" : "outline"}
          size="sm"
          onClick={() => onPan && onPan({ toggle: true })}
          className={`w-8 h-8 p-0 ${
            isPanning 
              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
              : 'hover:bg-yellow-50 hover:border-yellow-300'
          }`}
          title="Ferramenta de Movimento (Pan)"
        >
          <Move className="w-3 h-3" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-8 h-8 p-0 hover:bg-yellow-50 hover:border-yellow-300"
          title="Resetar Vista"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onFullscreen}
          className="w-8 h-8 p-0 hover:bg-yellow-50 hover:border-yellow-300"
          title="Ecrã Completo"
        >
          <Maximize2 className="w-3 h-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {/* Disabled expansion */}}
          className="w-8 h-8 p-0 hover:bg-yellow-50 opacity-50 cursor-not-allowed"
          title="Opções (expansão desativada)"
          disabled={true}
        >
          <Eye className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  // Controles expandidos
  const ExpandedControls = () => (
    <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
      {/* Slider de zoom */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600 text-center">Zoom Preciso</div>
        <Slider
          value={[zoomLevel * 100]}
          onValueChange={(value) => onZoomChange && onZoomChange(value[0] / 100)}
          min={30}
          max={300}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>30%</span>
          <span>300%</span>
        </div>
      </div>

      {/* Ferramentas adicionais */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600 text-center">Ferramentas</div>
        
        <div className="flex flex-col gap-1">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelection}
            className={`w-full h-8 text-xs ${
              isSelectionMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'hover:bg-blue-50 hover:border-blue-300'
            }`}
            title="Modo de Seleção"
          >
            <MousePointer className="w-3 h-3 mr-1" />
            Seleção
          </Button>

          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={onToggleGrid}
            className={`w-full h-8 text-xs ${
              showGrid 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'hover:bg-green-50 hover:border-green-300'
            }`}
            title="Mostrar Grelha"
          >
            <Grid className="w-3 h-3 mr-1" />
            Grelha
          </Button>
        </div>
      </div>

      {/* Informações de estado */}
      <div className="space-y-1">
        <div className="text-xs text-gray-600 text-center">Estado</div>
        
        <div className="space-y-1">
          {isPanning && (
            <Badge variant="secondary" className="w-full text-xs justify-center">
              Modo Pan Ativo
            </Badge>
          )}
          
          {isSelectionMode && (
            <Badge variant="secondary" className="w-full text-xs justify-center bg-blue-100 text-blue-800">
              Modo Seleção
            </Badge>
          )}
          
          {showGrid && (
            <Badge variant="secondary" className="w-full text-xs justify-center bg-green-100 text-green-800">
              Grelha Visível
            </Badge>
          )}
        </div>
      </div>

      {/* Atalhos de teclado */}
      <div className="space-y-1">
        <div className="text-xs text-gray-600 text-center">Atalhos</div>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Zoom In:</span>
            <span>+</span>
          </div>
          <div className="flex justify-between">
            <span>Zoom Out:</span>
            <span>-</span>
          </div>
          <div className="flex justify-between">
            <span>Reset:</span>
            <span>R</span>
          </div>
          <div className="flex justify-between">
            <span>Fullscreen:</span>
            <span>F</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MagneticWidget
      title="Navegação"
      icon={Navigation}
      showHeader={false}
      defaultPosition={position || defaultPosition}
      defaultPinned={defaultPinned}
      onPositionChange={onPositionChange}
      className={getButtonLayout() === 'flex-col' ? 'min-w-fit' : 'min-w-80'}
      {...props}
    >
      <div className="space-y-0">
        <MainControls />
        {false && <ExpandedControls />}
      </div>
    </MagneticWidget>
  );
};

export default MagneticNavigationControls;

