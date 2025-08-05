import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import MagneticWidget from './MagneticWidget.jsx';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Music
} from 'lucide-react';

/**
 * Controles de reprodução magnéticos - Integra com sistema de posicionamento magnético
 * @param {boolean} isPlaying - Estado de reprodução
 * @param {number} currentTime - Tempo atual em segundos
 * @param {number} duration - Duração total em segundos
 * @param {number} volume - Volume (0-1)
 * @param {number} tempo - Tempo em BPM
 * @param {string} position - Posição magnética atual ("top-left", "bottom-center", etc.)
 * @param {function} onPositionChange - Callback para mudança de posição
 * @param {string} defaultPosition - Posição inicial padrão
 * @param {boolean} defaultPinned - Se inicia fixado
 */
const MagneticPlaybackControls = ({
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  volume = 0.7,
  tempo = 120,
  isLooping = false,
  isMuted = false,
  isShuffled = false,
  // Props de posicionamento magnético
  position,
  onPositionChange,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onTempoChange,
  onToggleLoop,
  onToggleMute,
  onToggleShuffle,
  onSkipBack,
  onSkipForward,
  selectedMeasures = [],
  defaultPosition = "bottom-center",
  defaultPinned = false,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // FORCE: Disable expanded mode completely
  const isExpandedDisabled = true;

  // DEBUG: Log state changes following debugging.md methodology
  console.log('🎵 MagneticPlaybackControls - State Update:', {
    isPlaying,
    currentTime,
    duration,
    volume,
    tempo,
    isExpanded,
    timestamp: new Date().toISOString()
  });

  // Formatação de tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Detectar orientação baseada na posição
  const getButtonLayout = () => {
    const currentPos = position || defaultPosition;
    if (typeof currentPos === 'string') {
      if (currentPos.includes('left') || currentPos.includes('right')) {
        return 'flex-col'; // Vertical (top to bottom)
      } else if (currentPos.includes('bottom')) {
        return 'flex-row'; // Horizontal (left to right)
      }
    }
    console.error('❌ [MagneticPlaybackControls] currentPos is not a valid string:', currentPos);
    return 'flex-row'; // Default to horizontal
  };

  // Controles principais (sempre visíveis)
  const MainControls = () => (
    <div className={`flex items-center gap-1.5 ${getButtonLayout()}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={onSkipBack}
        className="w-8 h-8 p-0 hover:bg-yellow-50"
        title="Retroceder 5s"
      >
        <SkipBack className="w-3 h-3" />
      </Button>

      <Button
        variant={isPlaying ? "secondary" : "default"}
        size="sm"
        onClick={() => {
          // DEBUG: Log event handlers following debugging.md methodology
          console.log('🎵 Play/Pause clicked:', {
            currentState: isPlaying,
            willCall: isPlaying ? 'onPause' : 'onPlay',
            timestamp: new Date().toISOString()
          });
          isPlaying ? onPause && onPause() : onPlay && onPlay();
        }}
        className="w-9 h-9 p-0 bg-yellow-500 hover:bg-yellow-600 text-white"
        title={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onStop}
        className="w-8 h-8 p-0 hover:bg-yellow-50"
        title="Parar"
      >
        <Square className="w-3 h-3" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onSkipForward}
        className="w-8 h-8 p-0 hover:bg-yellow-50"
        title="Avançar 5s"
      >
        <SkipForward className="w-3 h-3" />
      </Button>

      {/* Botão para expandir controles */}
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {/* Disabled expansion */}}
        className="w-8 h-8 p-0 hover:bg-yellow-50 opacity-50 cursor-not-allowed"
        title="Controles (expansão desativada)"
        disabled={true}
      >
        <Music className="w-3 h-3" />
      </Button>
    </div>
  );

  // Controles expandidos
  const ExpandedControls = () => (
    <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
      {/* Barra de progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <Slider
          value={[currentTime]}
          onValueChange={(value) => onSeek && onSeek(value[0])}
          max={duration}
          step={0.1}
          className="w-full"
        />
        
        {selectedMeasures.length > 0 && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {selectedMeasures.length} compasso(s) selecionado(s)
            </Badge>
          </div>
        )}
      </div>

      {/* Controles de volume */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMute}
          className="w-6 h-6 p-0"
          title={isMuted ? "Ativar som" : "Silenciar"}
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </Button>
        
        <div className="flex-1">
          <Slider
            value={[volume * 100]}
            onValueChange={(value) => onVolumeChange && onVolumeChange(value[0] / 100)}
            max={100}
            step={1}
            className="w-full"
            disabled={isMuted}
          />
        </div>
        
        <span className="text-xs text-gray-600 min-w-8">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Controles de tempo */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600 min-w-12">Tempo:</span>
        
        <div className="flex-1">
          <Slider
            value={[tempo]}
            onValueChange={(value) => onTempoChange && onTempoChange(value[0])}
            min={60}
            max={200}
            step={1}
            className="w-full"
          />
        </div>
        
        <Badge variant="outline" className="text-xs min-w-16 text-center">
          {tempo} BPM
        </Badge>
      </div>

      {/* Opções adicionais */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={isLooping ? "default" : "outline"}
          size="sm"
          onClick={onToggleLoop}
          className="w-8 h-8 p-0"
          title="Repetir"
        >
          <Repeat className="w-3 h-3" />
        </Button>

        <Button
          variant={isShuffled ? "default" : "outline"}
          size="sm"
          onClick={onToggleShuffle}
          className="w-8 h-8 p-0"
          title="Aleatório"
        >
          <Shuffle className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <MagneticWidget
      title="Reprodução"
      icon={Music}
      showHeader={false}
      defaultPosition={position || defaultPosition}
      defaultPinned={defaultPinned}
      onPositionChange={onPositionChange}
      className={getButtonLayout() === 'flex-col' ? 'min-w-fit' : 'min-w-48'}
      {...props}
    >
      <div className="space-y-0">
        <MainControls />
        {false && <ExpandedControls />}
      </div>
    </MagneticWidget>
  );
};

export default MagneticPlaybackControls;

