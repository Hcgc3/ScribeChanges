import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/Ui/button.jsx';
import { Card, CardContent } from '@/components/Ui/card.jsx';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import * as Tone from 'tone';

const PlaybackControls = ({ 
  midiData, 
  isPlaying, 
  onPlayPause, 
  onStop,
  isCollapsed = false,
  onToggleCollapse,
  onCurrentTimeUpdate
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [selectedInstrument, setSelectedInstrument] = useState('piano');
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  
  const synthRef = useRef(null);
  const partRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Initialize Tone.js synth
  useEffect(() => {
    const initializeSynth = async () => {
      try {
        // Create different instruments
        const instruments = {
          piano: new Tone.PolySynth(Tone.MonoSynth).toDestination(),
          guitar: new Tone.PolySynth(Tone.PluckSynth).toDestination(),
          violin: new Tone.PolySynth(Tone.FMSynth).toDestination(),
          flute: new Tone.PolySynth(Tone.AMSynth).toDestination()
        };

        synthRef.current = instruments[selectedInstrument];
        
        // Set initial volume
        synthRef.current.volume.value = Tone.gainToDb(volume / 100);
      } catch (error) {
        console.error('Error initializing synth:', error);
      }
    };

    initializeSynth();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, [selectedInstrument]);

  // Update volume
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = isMuted ? -Infinity : Tone.gainToDb(volume / 100);
    }
  }, [volume, isMuted]);

  // Create Tone.js Part from MIDI data
  useEffect(() => {
    if (midiData && synthRef.current) {
      try {
        // Convert MIDI to Tone.js format
        const notes = [];
        if (midiData.tracks && midiData.tracks.length > 0) {
          const track = midiData.tracks[0];
          track.notes.forEach(note => {
            notes.push({
              time: note.time,
              note: Tone.Frequency(note.midi, 'midi').toNote(),
              duration: note.duration
            });
          });
        }

        // Create Tone.js Part
        if (partRef.current) {
          partRef.current.dispose();
        }

        partRef.current = new Tone.Part((time, note) => {
          synthRef.current.triggerAttackRelease(note.note, note.duration, time);
        }, notes);

        // Set duration
        setDuration(midiData.duration || 0);
        
      } catch (error) {
        console.error('Error creating Tone.js part:', error);
      }
    }
  }, [midiData]);

  // Handle play/pause
  const handlePlayPause = async () => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      if (isPlaying) {
        Tone.Transport.pause();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        if (partRef.current) {
          partRef.current.start();
        }
        Tone.Transport.start();
        
        // Update progress
        progressIntervalRef.current = setInterval(() => {
          setCurrentTime(Tone.Transport.seconds);
          if (onCurrentTimeUpdate) onCurrentTimeUpdate(Tone.Transport.seconds);
        }, 100);
      }

      onPlayPause();
    } catch (error) {
      console.error('Error handling play/pause:', error);
    }
  };

  // Handle stop
  const handleStop = () => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    setCurrentTime(0);
    if (onCurrentTimeUpdate) onCurrentTimeUpdate(0);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    if (partRef.current) {
      partRef.current.stop();
    }
    
    onStop();
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    Tone.Transport.bpm.value = Tone.Transport.bpm.value * (newSpeed / speed);
  };

  // Handle instrument change
  const handleInstrumentChange = (instrument) => {
    setSelectedInstrument(instrument);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress bar click handler
  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    Tone.Transport.seconds = newTime;
    setCurrentTime(newTime);
  };

  if (isCollapsed) {
    return (
      <div className="bg-card/90 backdrop-blur-md border-t border-border p-2">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="sharpblend-yellow text-black hover:opacity-90 rounded-full w-8 h-8 p-0"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/90 backdrop-blur-md border-t border-border p-4">
      <div className="max-w-6xl mx-auto space-y-4 fade-in-up">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div 
            className="w-full h-2 bg-muted rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full sharpblend-yellow rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          {/* Transport Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                Tone.Transport.seconds = Math.max(0, currentTime - 10);
    setCurrentTime(Tone.Transport.seconds);
    if (onCurrentTimeUpdate) onCurrentTimeUpdate(Tone.Transport.seconds);
              }}
              className="text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-12 p-0"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="text-slate-300 hover:text-white"
            >
              <Square className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                Tone.Transport.seconds = Math.min(duration, currentTime + 10);
                setCurrentTime(Tone.Transport.seconds);
              }}
              className="text-slate-300 hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-slate-300 w-12">{speed.toFixed(1)}x</span>
          </div>

          {/* Instrument Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Instrument:</span>
            <select 
              value={selectedInstrument}
              onChange={(e) => handleInstrumentChange(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
            >
              <option value="piano">Piano</option>
              <option value="guitar">Guitar</option>
              <option value="violin">Violin</option>
              <option value="flute">Flute</option>
            </select>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-slate-300 w-8">{volume}%</span>
          </div>

          {/* Loop and Settings */}
          <div className="flex items-center gap-2">
            <Button
              variant={isLooping ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsLooping(!isLooping)}
              className={isLooping ? "bg-purple-600 hover:bg-purple-700" : "text-slate-300 hover:text-white"}
            >
              <Repeat className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;

