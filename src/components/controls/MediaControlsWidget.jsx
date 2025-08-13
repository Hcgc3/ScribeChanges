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
  Shuffle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import MagneticWidget from './MagneticWidget';
import { useScoreStore } from '@/lib/stores/score-store';
import { initTone, isToneReady, loadToneSequence, startTransportFromBeginning, stopTransport, extractMidiData, forceResumeAudio } from '@music-editor/score-viewer';

const MediaControlsWidget = () => {
  const {
    playbackState,
    play,
    pause,
    stop,
    setCurrentTime,
    setTempo,
    setVolume,
    toggleLoop,
    metronome,
    toggleMetronome,
  } = useScoreStore();

  const {
    isPlaying,
    isPaused,
    currentTime,
    duration,
    tempo,
    volume,
    loop,
  } = playbackState;

  const handlePlayCore = useCallback(async () => {
    try {
      if (!isToneReady()) {
        await initTone();
      }
      play();
      const { osmdInstance, metadata } = useScoreStore.getState();
      if (osmdInstance) {
        const midiData = extractMidiData(osmdInstance, { tempo: metadata?.tempo, rawXML: osmdInstance.rawMusicXML });
        console.log('[MIDI Extract] events:', midiData.events.length, midiData.events.slice(0,5));
        await loadToneSequence({
          events: midiData.events,
          tempo: midiData.tempo,
          tempoEvents: midiData.tempoEvents,
          measureStartWholes: midiData.measureStartWholes
        });
        await startTransportFromBeginning();
      }
    } catch (e) {
      console.warn('Playback init failed', e);
    }
  }, [play]);

  const unlockAudio = useCallback(() => {
    try {
      // Synchronous attempt (no await) to satisfy gesture requirement
      forceResumeAudio();
    } catch {}
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      stopTransport();
      return;
    }
    // Kick off async logic after synchronous unlock
    handlePlayCore();
  };

  const handleStop = () => {
    stop();
  };

  const handleProgressChange = (value) => {
    setCurrentTime(value[0]);
  };

  const handleTempoChange = (value) => {
    setTempo(value[0]);
  };

  const handleVolumeChange = (value) => {
    setVolume(value[0] / 100);
  };

  const handleVolumeToggle = () => {
    setVolume(volume > 0 ? 0 : 0.8);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MagneticWidget widgetId="mediaControls" showHeaderControl={true}>
      <div className="media-controls-content space-y-3">
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="w-8 h-8 p-0"
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            disabled
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onPointerDown={unlockAudio}
            onClick={handlePlayPause}
            className="w-10 h-10 p-0 bg-primary hover:bg-primary/90"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            disabled
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLoop}
            className={`w-8 h-8 p-0 ${loop ? 'text-primary' : ''}`}
          >
            {loop ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            onValueChange={handleProgressChange}
            max={duration || 100}
            step={0.1}
            className="w-full"
            disabled={!duration}
          />
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeToggle}
              className="w-6 h-6 p-0"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-16"
            />
            <span className="text-xs text-muted-foreground w-8">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Tempo Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">BPM:</span>
            <Slider
              value={[tempo]}
              onValueChange={handleTempoChange}
              min={60}
              max={200}
              step={1}
              className="w-16"
            />
            <span className="text-xs text-muted-foreground w-8">
              {tempo}
            </span>
          </div>
        </div>

        {/* Metronome */}
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMetronome}
              className={`text-xs ${metronome.enabled ? 'text-primary' : ''}`}
            >
              Metrónomo
            </Button>
          </div>
          
          {metronome.enabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Vol:</span>
              <Slider
                value={[metronome.volume * 100]}
                onValueChange={(value) => {
                  // Update metronome volume
                  console.log('Metronome volume:', value[0]);
                }}
                max={100}
                step={1}
                className="w-12"
              />
            </div>
          )}
        </div>
      </div>
    </MagneticWidget>
  );
};

export default MediaControlsWidget;

