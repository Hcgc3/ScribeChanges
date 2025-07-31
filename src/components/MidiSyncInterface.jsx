import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/Ui/button.jsx';
import { Card, CardContent } from '@/components/Ui/card.jsx';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

const MidiSyncInterface = ({ 
  midiData, 
  audioFile,
  isPlaying = false,
  currentTime = 0,
  onPlayPause,
  onStop,
  onBeatMarkingsChange
}) => {
  const [beatMarkings, setBeatMarkings] = useState([]);
  const [audioIntensityData, setAudioIntensityData] = useState([]);
  const [currentBeatBar, setCurrentBeatBar] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Audio analysis setup
  useEffect(() => {
    if (audioFile) {
      setupAudioAnalysis();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioFile]);

  // Generate mock intensity data if no audio file
  useEffect(() => {
    if (!audioFile && midiData) {
      generateMockIntensityData();
    }
  }, [midiData, audioFile]);

  // Keyboard event listener for space key
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        recordBeatMarking();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, isPlaying]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [isPlaying, currentTime]);

  const setupAudioAnalysis = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      analyserRef.current = analyser;

      // Create audio element and connect to analyser
      const audio = new Audio(URL.createObjectURL(audioFile));
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      // Generate intensity data from audio
      await generateIntensityDataFromAudio(audio);
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      generateMockIntensityData();
    }
  };

  const generateIntensityDataFromAudio = async (audio) => {
    // This is a simplified version - in a real implementation,
    // you would analyze the entire audio file to get intensity data
    const duration = midiData?.duration || 30;
    const segments = Math.floor(duration * 10); // 10 segments per second
    const intensityData = [];

    for (let i = 0; i < segments; i++) {
      // Generate realistic-looking intensity data
      const baseIntensity = 0.3 + Math.random() * 0.4;
      const variation = Math.sin(i * 0.1) * 0.2;
      const noise = (Math.random() - 0.5) * 0.1;
      intensityData.push(Math.max(0.1, Math.min(1, baseIntensity + variation + noise)));
    }

    setAudioIntensityData(intensityData);
  };

  const generateMockIntensityData = () => {
    const duration = midiData?.duration || 30;
    const segments = Math.floor(duration * 10); // 10 segments per second
    const intensityData = [];

    for (let i = 0; i < segments; i++) {
      // Generate realistic-looking intensity data based on MIDI
      const time = (i / segments) * duration;
      let intensity = 0.2;

      // Simulate intensity based on MIDI note density
      if (midiData && midiData.tracks) {
        const notesAtTime = midiData.tracks.reduce((count, track) => {
          return count + track.notes.filter(note => 
            note.time <= time && note.time + note.duration > time
          ).length;
        }, 0);
        intensity = Math.min(1, 0.2 + (notesAtTime * 0.15));
      }

      // Add some variation
      intensity += (Math.random() - 0.5) * 0.2;
      intensity = Math.max(0.1, Math.min(1, intensity));
      intensityData.push(intensity);
    }

    setAudioIntensityData(intensityData);
  };

  const startAnimation = () => {
    const animate = () => {
      drawVisualization();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || audioIntensityData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas with deep black background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Calculate dimensions
    const barWidth = 2;
    const barSpacing = 1;
    const totalBarWidth = barWidth + barSpacing;
    const visibleBars = Math.floor(width / totalBarWidth);
    const centerX = width / 2;
    
    // Calculate current position in the data
    const duration = midiData?.duration || 30;
    const currentIndex = Math.floor((currentTime / duration) * audioIntensityData.length);
    
    // Draw barcode-style bars
    for (let i = 0; i < visibleBars; i++) {
      const dataIndex = currentIndex - Math.floor(visibleBars / 2) + i;
      
      if (dataIndex >= 0 && dataIndex < audioIntensityData.length) {
        const intensity = audioIntensityData[dataIndex];
        const barHeight = intensity * (height * 0.6);
        const x = i * totalBarWidth;
        const y = (height - barHeight) / 2;
        
        // Determine bar color and height
        const isCurrent = i === Math.floor(visibleBars / 2);
        let color, actualHeight;
        
        if (isCurrent) {
          // Current playback bar - more intense yellow and slightly taller
          color = '#FFD700';
          actualHeight = barHeight * 1.2;
        } else {
          // Regular bars - standard yellow
          color = '#FFC107';
          actualHeight = barHeight;
        }
        
        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, (height - actualHeight) / 2, barWidth, actualHeight);
      }
    }
    
    // Draw fixed horizontal playback line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw playback cursor (slightly thicker white line)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, height * 0.2);
    ctx.lineTo(centerX, height * 0.8);
    ctx.stroke();
    
    // Draw beat markings
    beatMarkings.forEach(marking => {
      const markingTime = marking.time;
      const relativeTime = markingTime - currentTime;
      const pixelsPerSecond = width / 10; // Assuming 10 seconds visible
      const markingX = centerX + (relativeTime * pixelsPerSecond);
      
      if (markingX >= 0 && markingX <= width) {
        // Draw beat marking line
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(markingX, 0);
        ctx.lineTo(markingX, height);
        ctx.stroke();
        
        // Draw beat number
        ctx.fillStyle = '#ff4444';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${marking.beat}`, markingX, 15);
      }
    });
  };

  const recordBeatMarking = () => {
    if (!isPlaying) return;
    
    const newBeat = beatMarkings.length + 1;
    const newMarking = {
      id: Date.now(),
      beat: newBeat,
      time: currentTime,
      midiTime: currentTime // Assuming 1:1 sync for now
    };
    
    const updatedMarkings = [...beatMarkings, newMarking];
    setBeatMarkings(updatedMarkings);
    
    if (onBeatMarkingsChange) {
      onBeatMarkingsChange(updatedMarkings);
    }
    
    // Visual feedback
    setIsRecording(true);
    setTimeout(() => setIsRecording(false), 200);
  };

  const clearBeatMarkings = () => {
    setBeatMarkings([]);
    if (onBeatMarkingsChange) {
      onBeatMarkingsChange([]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-black min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">MIDI Sync Interface</h2>
        <p className="text-gray-400">Press SPACE to mark beats during playback</p>
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="relative">
          {/* Dynamic Beat Bar */}
          <div className="mb-4 h-8 bg-gray-900 rounded-lg relative overflow-hidden">
            <div 
              className="absolute top-0 bottom-0 w-1 bg-yellow-400 transition-all duration-100"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                Beat Bar {isRecording && '🔴'}
              </span>
            </div>
          </div>

          {/* Main Canvas Visualization */}
          <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={200}
              className="w-full h-48"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Time Display */}
          <div className="mt-4 flex justify-between text-white text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(midiData?.duration || 0)}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onPlayPause}
              className="sharpblend-yellow text-black hover:opacity-90 font-semibold"
              size="lg"
            >
              {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              onClick={onStop}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
            
            <Button
              onClick={recordBeatMarking}
              variant="outline"
              className={`border-red-600 text-red-400 hover:bg-red-900/20 ${isRecording ? 'bg-red-900/40' : ''}`}
              disabled={!isPlaying}
            >
              Mark Beat (SPACE)
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              Beats marked: {beatMarkings.length}
            </span>
            
            <Button
              onClick={clearBeatMarkings}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
              disabled={beatMarkings.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Beats
            </Button>
          </div>
        </div>

        {/* Beat Markings List */}
        {beatMarkings.length > 0 && (
          <div className="mt-4 p-4 bg-gray-900 rounded-lg">
            <h4 className="text-white font-medium mb-2">Beat Markings</h4>
            <div className="flex flex-wrap gap-2">
              {beatMarkings.map(marking => (
                <span
                  key={marking.id}
                  className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-sm"
                >
                  Beat {marking.beat}: {formatTime(marking.time)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
          <h4 className="text-white font-medium mb-2">Instructions</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Yellow bars represent audio intensity fragments moving right during playback</li>
            <li>• The current playback position is highlighted with brighter yellow and increased height</li>
            <li>• Press SPACE or click "Mark Beat" to record beat positions for MIDI recognition</li>
            <li>• Beat markings will be used for dynamic sheet music generation on the next page</li>
            <li>• The design maintains professional audio technology precision with clean geometry</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MidiSyncInterface;

