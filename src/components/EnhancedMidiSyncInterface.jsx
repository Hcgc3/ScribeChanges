import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/Ui/button.jsx';
import { Card, CardContent } from '@/components/Ui/card.jsx';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';
import { AudioAnalyzer, analyzeAudioFile, generateMockIntensityFromMIDI, createVisualizationData } from '../utils/audioAnalysis.js';

const EnhancedMidiSyncInterface = ({ 
  midiData, 
  audioFile,
  youtubeVideoId,
  onBeatMarkingsChange
}) => {
  const [beatMarkings, setBeatMarkings] = useState([]);
  const [audioIntensityData, setAudioIntensityData] = useState([]);
  const [realTimeIntensity, setRealTimeIntensity] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioAnalyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const realTimeUpdateRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingWaveform, setIsDraggingWaveform] = useState(false);
  const progressBarRef = useRef(null);

  // Initialize audio/video source
  useEffect(() => {
    if (audioFile) {
      setupAudioFile();
    } else if (youtubeVideoId) {
      setupYouTubePlayer();
    } else if (midiData) {
      // Fallback to MIDI-based mock data
      generateMockIntensityData();
      setDuration(midiData.duration || 30);
    }

    return () => {
      cleanup();
    };
  }, [audioFile, youtubeVideoId, midiData]);

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
  }, [currentTime, isPlaying])  // Animation loop - always running if data is available
  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [isPlaying, audioIntensityData, currentTime]); // Update current time for mock playback (MIDI only)
  useEffect(() => {
    let animationFrameId;
    const updateTime = () => {
      if (isPlaying) {
        setCurrentTime(prevTime => {
          let newTime = prevTime;
          if (audioRef.current) {
            newTime = audioRef.current.currentTime;
          } else if (youtubePlayerRef.current) {
            newTime = youtubePlayerRef.current.getCurrentTime();
          } else { // Mock playback for MIDI only
            newTime = prevTime + (1000 / 60) / 1000; // Increment by 1/60th of a second
          }

          if (newTime >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime);
    } else {
      cancelAnimationFrame(animationFrameId);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, duration, audioFile, youtubeVideoId]);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.stopVideo();
    }
  };

  const setupAudioFile = async () => {
    try {
      setIsAnalyzing(true);
      
      // Create audio element
      const audio = new Audio(URL.createObjectURL(audioFile));
      audioRef.current = audio;
      
      // Set up audio event listeners
      audio.addEventListener("loadedmetadata", async () => {
        setDuration(audio.duration);
        // Ensure AudioContext is resumed after a user gesture
        if (audio.audioContext && audio.audioContext.state === 'suspended') {
          await audio.audioContext.resume();
        }
        // Analyze audio file for intensity data
        try {
          const analysisResult = await analyzeAudioFile(audioFile);
          setAudioIntensityData(analysisResult.intensityData);
        } catch (error) {
          console.error("Error analyzing audio file:", error);
        }
        setIsAnalyzing(false);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.volume = volume;

    } catch (error) {
      console.error("Error setting up audio file:", error);
      generateMockIntensityDataForDuration(30);
      setIsAnalyzing(false);
    }
  };

  const setupYouTubePlayer = () => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        createYouTubePlayer();
      };
    } else {
      createYouTubePlayer();
    }
  };

  const createYouTubePlayer = () => {
    if (!youtubePlayerRef.current) {
      youtubePlayerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
        },
        events: {
          onReady: (event) => {
            const duration = event.target.getDuration();
            setDuration(duration);

          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startTimeTracking();
            } else if (event.data === window.YT.PlayerState.PAUSED || 
                      event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              stopTimeTracking();
            }
          }
        }
      });
    }
  };

  const startTimeTracking = () => {
    if (realTimeUpdateRef.current) {
      cancelAnimationFrame(realTimeUpdateRef.current);
    }
    const updateTime = () => {
      if (youtubePlayerRef.current && isPlaying) {
        const time = youtubePlayerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
      realTimeUpdateRef.current = requestAnimationFrame(updateTime);
    };
    updateTime();
  };

  const stopTimeTracking = () => {
    if (realTimeUpdateRef.current) {
      cancelAnimationFrame(realTimeUpdateRef.current);
      realTimeUpdateRef.current = null;
    }
  };





  const generateMockIntensityData = () => {
    const intensityData = generateMockIntensityFromMIDI(midiData);
    setAudioIntensityData(intensityData);
    setDuration(midiData?.duration || 30);
  };

  const handlePlayPause = async () => {
    try {
      // Ensure AudioContext is resumed before any playback starts
      if (Tone.context.state === 'suspended') {
        await Tone.context.resume();
        console.log('AudioContext resumed successfully before playback');
      }

      if (audioRef.current) {
        // Audio file playback
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } else if (youtubePlayerRef.current) {
        // YouTube playback
        if (isPlaying) {
          youtubePlayerRef.current.pauseVideo();
        } else {
          youtubePlayerRef.current.playVideo();
        }
      } else {
        // Mock playback for MIDI only
        setIsPlaying(!isPlaying);
        if (!isPlaying) {
          startMockPlayback();
        }
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else if (youtubePlayerRef.current) {
      youtubePlayerRef.current.stopVideo();
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const startMockPlayback = () => {
    // This function is now largely redundant as currentTime is updated by the useEffect hook
    // for MIDI-only playback. It primarily serves to set isPlaying to true.
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

    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    
    // Clear canvas with deep black background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Calculate dimensions - adjust bar width for better representation
    const barWidth = 4; // Increased from 2 for better visibility
    const barSpacing = 1;
    const totalBarWidth = barWidth + barSpacing;
    const visibleBars = Math.floor(width / totalBarWidth);
    const centerBarIndex = Math.floor(visibleBars / 2);

    // Calculate time window - show more time for better navigation
    const timeWindowSeconds = 10; // Show 10 seconds of audio
    const dataPointsPerSecond = audioIntensityData.length / duration;
    const dataPointsPerBar = Math.max(1, Math.floor((timeWindowSeconds * dataPointsPerSecond) / visibleBars));
    
    // Calculate the starting index for the bars based on current time
    const currentDataIndex = Math.floor(currentTime * dataPointsPerSecond);
    const startIndex = Math.max(0, currentDataIndex - (centerBarIndex * dataPointsPerBar));

    // Draw barcode-style bars
    for (let i = 0; i < visibleBars; i++) {
      const dataStartIndex = startIndex + (i * dataPointsPerBar);
      const dataEndIndex = Math.min(dataStartIndex + dataPointsPerBar, audioIntensityData.length);

      if (dataStartIndex >= 0 && dataStartIndex < audioIntensityData.length) {
        // Calculate average intensity for this bar's time window
        let totalIntensity = 0;
        let count = 0;
        for (let j = dataStartIndex; j < dataEndIndex; j++) {
          if (j < audioIntensityData.length) {
            totalIntensity += audioIntensityData[j];
            count++;
          }
        }
        const avgIntensity = count > 0 ? totalIntensity / count : 0;
        
        const barHeight = avgIntensity * (height * 0.7); // Increased height multiplier
        const x = i * totalBarWidth;

        // Determine bar color and height
        let color, actualHeight;
        
        // Highlight the bar closest to the center of the view
        if (i === centerBarIndex) {
          color = "#FFD700"; // More intense yellow for current bar
          actualHeight = Math.max(barHeight * 1.2, 4); // Minimum height for visibility
        } else {
          // Gradient effect based on distance from center
          const distance = Math.abs(i - centerBarIndex);
          const maxDistance = Math.max(centerBarIndex, visibleBars - centerBarIndex);
          const opacity = Math.max(0.3, 1 - (distance / maxDistance) * 0.7);
          color = `rgba(255, 193, 7, ${opacity})`; // Yellow with varying opacity
          actualHeight = Math.max(barHeight, 2); // Minimum height for visibility
        }

        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, (height - actualHeight) / 2, barWidth, actualHeight);
      }
    }
    
    // Draw fixed horizontal playback line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw playback cursor (thicker white line in the center)
    const centerX = width / 2;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, height * 0.1);
    ctx.lineTo(centerX, height * 0.9);
    ctx.stroke();
    
    // Draw beat markings
    beatMarkings.forEach(marking => {
      const markingTime = marking.time;
      const relativeTime = markingTime - currentTime;
      const pixelsPerSecond = width / timeWindowSeconds; // Pixels per second based on time window
      const markingX = centerX + (relativeTime * pixelsPerSecond);
      
      if (markingX >= 0 && markingX <= width) {
        // Draw beat marking line
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(markingX, 0);
        ctx.lineTo(markingX, height);
        ctx.stroke();
        
        // Draw beat number
        ctx.fillStyle = "#ff4444";
        ctx.font = "12px Inter";
        ctx.textAlign = "center";
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

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume(newVolume * 100);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDownWaveform = (e) => {
    setIsDraggingWaveform(true);
    handleMouseMoveWaveform(e);
  };

  const handleMouseMoveWaveform = useCallback((e) => {
    if (isDraggingWaveform && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      setCurrentTime(newTime);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      } else if (youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(newTime, true);
      }
    }
  }, [isDraggingWaveform, duration]);

  const handleMouseUpWaveform = () => {
    setIsDraggingWaveform(false);
  };

  // Progress bar interaction handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && progressBarRef.current) {
      const progressBar = progressBarRef.current;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      const clampedTime = Math.max(0, Math.min(newTime, duration));
      
      setCurrentTime(clampedTime);
      if (audioRef.current) {
        audioRef.current.currentTime = clampedTime;
      } else if (youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(clampedTime, true);
      }
    }
  }, [isDragging, duration]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    } else {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div className="w-full bg-black min-h-screen flex flex-col">
      {/* Hidden YouTube player */}
      {youtubeVideoId && <div id="youtube-player" style={{ display: 'none' }}></div>}
      
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Enhanced MIDI Sync Interface</h2>
            <p className="text-gray-400">
              {audioFile ? 'Audio file loaded' : youtubeVideoId ? 'YouTube video loaded' : 'MIDI-based visualization'} 
              - Press SPACE to mark beats during playback
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isAnalyzing && (
              <div className="text-yellow-400 text-sm">
                Analyzing audio...
              </div>
            )}
          </div>
        </div>
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
              onMouseDown={handleMouseDownWaveform}
              onMouseMove={handleMouseMoveWaveform}
              onMouseUp={handleMouseUpWaveform}
              onMouseLeave={handleMouseUpWaveform} // Stop dragging if mouse leaves canvas
            />
          </div>

          {/* Time Display */}
          <div className="mt-4 flex justify-between text-white text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Progress Bar */}
          <div 
            ref={progressBarRef}
            className="mt-2 w-full bg-gray-800 rounded-full h-2 relative cursor-pointer"
            onMouseDown={handleMouseDown}
          >
            <div 
              className="bg-yellow-400 h-full rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div 
              className="absolute -top-1 h-4 w-4 rounded-full bg-yellow-400 shadow"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: `translateX(-50%)` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePlayPause}
              className="sharpblend-yellow text-black hover:opacity-90 font-semibold"
              size="lg"
            >
              {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              onClick={handleStop}
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
          <div className="mb-4 p-4 bg-gray-900 rounded-lg">
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
        <div className="p-4 bg-gray-900/50 rounded-lg">
          <h4 className="text-white font-medium mb-2">Instructions</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Yellow bars represent audio intensity in barcode format</li>
            <li>• Bars move smoothly to the left as playback progresses</li>
            <li>• The white playback cursor remains fixed in the center</li>
            <li>• Press SPACE or click "Mark Beat" to record beat positions for MIDI recognition</li>
            <li>• Beat markings will be used for dynamic sheet music generation on the next page</li>
            <li>• {audioFile ? 'Audio file analysis provides accurate intensity visualization' : youtubeVideoId ? 'YouTube video provides synchronized playback' : 'MIDI-based visualization for demonstration'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMidiSyncInterface;

