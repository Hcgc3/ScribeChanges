import React, { useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Timer,
  SlidersHorizontal,
  Waves,
  Footprints,
  Highlighter,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider } from '@/components/ui/tooltip';
import MagneticWidget from './MagneticWidget';
import { ToolbarRoot, ToolbarGroup, ToolbarSeparator, ToolbarButton } from './WidgetToolbar';
import { useWidgetOrientation } from '@/lib/stores/widget-store';
import { useShallow } from 'zustand/react/shallow';
import { useScoreStore } from '@/lib/stores/score-store';
import {
  forceResumeAudio,
  togglePlayback,
  stopPlayback,
  seekMeasure,
  seekToSeconds,
  setPlaybackTempo,
  setPlaybackVolume,
  togglePlaybackLoop,
  setPlayheadMode,
  setHighlightPlayingNotes,
} from '@music-editor/score-viewer';

const MediaControlsWidget = () => {
  const { orientation, tooltipSide } = useWidgetOrientation('mediaControls');
  const {
    playbackState,
    metronome,
    toggleMetronome,
    hasScore,
    selection,
    playheadMode,
    highlightPlaying,
  } = useScoreStore(useShallow((s) => ({
    playbackState: s.playbackState,
    metronome: s.metronome,
    toggleMetronome: s.toggleMetronome,
    hasScore: !!s.osmdInstance,
    selection: s.selection,
    playheadMode: s.viewSettings.playheadMode ?? 'smooth',
    highlightPlaying: s.viewSettings.highlightPlayingNotes ?? true,
  })));

  const {
    isPlaying,
    isPaused,
    currentTime,
    duration,
    tempo,
    volume,
    loop,
    loopStart,
    loopEnd,
  } = playbackState;

  const unlockAudio = useCallback(() => {
    // Synchronous attempt (no await) inside the gesture, before the async start
    forceResumeAudio().catch(() => {});
  }, []);

  const handlePlayPause = () => togglePlayback();
  const handleStop = () => stopPlayback();
  const handleProgressChange = (value) => seekToSeconds(value[0]);
  const handleTempoChange = (value) => setPlaybackTempo(value[0]);
  const handleVolumeChange = (value) => setPlaybackVolume(value[0] / 100);
  const handleVolumeToggle = () => setPlaybackVolume(volume > 0 ? 0 : 0.8);

  // Loop label: a range ("c. 3–5") when looping part of the piece
  const loopRange = loop && loopStart != null && loopEnd != null && loopEnd > loopStart;
  const loopLabel = loop
    ? (loopRange && selection?.startMeasure ? `Loop: c. ${selection.startMeasure}–${selection.endMeasure}` : 'Loop: partitura inteira')
    : (selection?.type === 'range' ? `Repetir c. ${selection.startMeasure}–${selection.endMeasure}` : 'Repetir tudo');

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const transport = (
    <ToolbarGroup orientation={orientation}>
      <ToolbarButton
        icon={isPlaying ? Pause : Play}
        label={isPlaying ? 'Pausa' : 'Reproduzir'}
        shortcut={selection ? `Espaço · começa no c. ${selection.startMeasure}` : 'Espaço'}
        disabled={!hasScore}
        tooltipSide={tooltipSide}
        primary
        iconClassName={isPlaying ? 'w-5 h-5' : 'w-5 h-5 ml-0.5'}
        onPointerDown={unlockAudio}
        onClick={handlePlayPause}
      />
      <ToolbarButton icon={Square} label="Parar" tooltipSide={tooltipSide} onClick={handleStop} disabled={!isPlaying && !isPaused} />
      <ToolbarButton icon={SkipBack} label="Compasso anterior" tooltipSide={tooltipSide} onClick={() => seekMeasure(-1)} disabled={!hasScore} />
      <ToolbarButton icon={SkipForward} label="Compasso seguinte" tooltipSide={tooltipSide} onClick={() => seekMeasure(1)} disabled={!hasScore} />
      <ToolbarButton icon={loopRange ? Repeat1 : Repeat} label={loopLabel} shortcut="Shift+clique nas notas escolhe o intervalo" tooltipSide={tooltipSide} active={loop} onClick={togglePlaybackLoop} disabled={!hasScore} />
    </ToolbarGroup>
  );

  const smooth = playheadMode === 'smooth';
  const viewButtons = (
    <ToolbarGroup orientation={orientation}>
      <ToolbarButton
        icon={smooth ? Waves : Footprints}
        label={smooth ? 'Linha contínua' : 'Linha aos saltos'}
        shortcut={smooth ? 'Clique: saltar de nota em nota' : 'Clique: deslizar com o áudio'}
        tooltipSide={tooltipSide}
        onClick={() => setPlayheadMode(smooth ? 'step' : 'smooth')}
      />
      <ToolbarButton
        icon={Highlighter}
        label={highlightPlaying ? 'Destaque das notas: ligado' : 'Destaque das notas: desligado'}
        tooltipSide={tooltipSide}
        active={highlightPlaying}
        onClick={() => setHighlightPlayingNotes(!highlightPlaying)}
      />
    </ToolbarGroup>
  );

  const metronomeButton = (
    <ToolbarButton icon={Timer} label="Metrónomo" tooltipSide={tooltipSide} active={metronome.enabled} onClick={toggleMetronome} />
  );

  const volumeSlider = (
    <Slider value={[volume * 100]} onValueChange={handleVolumeChange} max={100} step={1} className="w-16" aria-label="Volume" />
  );

  const tempoSlider = (
    <Slider value={[tempo]} onValueChange={handleTempoChange} min={30} max={300} step={1} className="w-16" aria-label="Tempo" />
  );

  return (
    <MagneticWidget widgetId="mediaControls" showHeaderControl={true}>
      <TooltipProvider>
        {orientation === 'vertical' ? (
          <ToolbarRoot orientation="vertical">
            {transport}
            <ToolbarSeparator orientation="vertical" />
            <ToolbarGroup orientation="vertical">
              <ToolbarButton icon={volume === 0 ? VolumeX : Volume2} label={volume === 0 ? 'Ativar som' : 'Silenciar'} tooltipSide={tooltipSide} onClick={handleVolumeToggle} />
              {metronomeButton}
              <Popover>
                <PopoverTrigger asChild>
                  <ToolbarButton icon={SlidersHorizontal} label="Volume e andamento" tooltipSide={tooltipSide} />
                </PopoverTrigger>
                <PopoverContent side={tooltipSide} className="w-56 space-y-3 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-12">Volume</span>
                    <Slider value={[volume * 100]} onValueChange={handleVolumeChange} max={100} step={1} className="flex-1" aria-label="Volume" />
                    <span className="w-8 text-right tabular-nums">{Math.round(volume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-12">BPM</span>
                    <Slider value={[tempo]} onValueChange={handleTempoChange} min={30} max={300} step={1} className="flex-1" aria-label="Tempo" />
                    <span className="w-8 text-right tabular-nums">{tempo}</span>
                  </div>
                </PopoverContent>
              </Popover>
            </ToolbarGroup>
            <ToolbarSeparator orientation="vertical" />
            {viewButtons}
            <ToolbarSeparator orientation="vertical" />
            <span className="text-[10px] leading-none text-muted-foreground tabular-nums pb-0.5">{formatTime(currentTime)}</span>
          </ToolbarRoot>
        ) : (
          <ToolbarRoot orientation="horizontal" className="px-1">
            {transport}
            <ToolbarSeparator orientation="horizontal" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                onValueChange={handleProgressChange}
                max={duration || 100}
                step={0.1}
                className="w-40"
                disabled={!duration}
                aria-label="Posição"
              />
              <span>{formatTime(duration)}</span>
            </div>
            <ToolbarSeparator orientation="horizontal" />
            <div className="flex items-center gap-1">
              <ToolbarButton icon={volume === 0 ? VolumeX : Volume2} label={volume === 0 ? 'Ativar som' : 'Silenciar'} tooltipSide={tooltipSide} onClick={handleVolumeToggle} />
              {volumeSlider}
            </div>
            <div className="flex items-center gap-2 pl-2 text-xs text-muted-foreground tabular-nums">
              <span>BPM</span>
              {tempoSlider}
              <span className="w-7">{tempo}</span>
            </div>
            {metronomeButton}
            <ToolbarSeparator orientation="horizontal" />
            {viewButtons}
          </ToolbarRoot>
        )}
      </TooltipProvider>
    </MagneticWidget>
  );
};

export default MediaControlsWidget;

