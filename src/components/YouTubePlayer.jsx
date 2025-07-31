import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Ui/button.jsx';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const YouTubePlayer = ({ 
  videoId, 
  onReady, 
  onStateChange, 
  onTimeUpdate,
  currentTime = 0,
  isPlaying = false,
  volume = 70 
}) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const timeUpdateIntervalRef = useRef(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [videoId]);

  // Initialize YouTube player
  const initializePlayer = () => {
    if (!containerRef.current || !videoId) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '315',
      width: '560',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handleStateChange
      }
    });
  };

  // Handle player ready
  const handlePlayerReady = (event) => {
    setIsPlayerReady(true);
    playerRef.current.setVolume(volume);
    
    if (onReady) {
      onReady(event);
    }

    // Start time update interval
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        if (onTimeUpdate) {
          onTimeUpdate(currentTime);
        }
      }
    }, 100);
  };

  // Handle state change
  const handleStateChange = (event) => {
    if (onStateChange) {
      onStateChange(event);
    }
  };

  // Control functions
  const play = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.playVideo();
    }
  };

  const pause = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.pauseVideo();
    }
  };

  const seekTo = (seconds) => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(seconds, true);
    }
  };

  const setPlayerVolume = (vol) => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.setVolume(vol);
    }
  };

  const mute = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const unmute = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  };

  // Sync with external controls
  useEffect(() => {
    if (isPlayerReady) {
      if (isPlaying) {
        play();
      } else {
        pause();
      }
    }
  }, [isPlaying, isPlayerReady]);

  useEffect(() => {
    if (isPlayerReady) {
      setPlayerVolume(volume);
    }
  }, [volume, isPlayerReady]);

  // Extract video ID from YouTube URL
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Expose control functions
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.seekTo = seekTo;
      playerRef.current.play = play;
      playerRef.current.pause = pause;
      playerRef.current.mute = mute;
      playerRef.current.unmute = unmute;
      playerRef.current.setVolume = setPlayerVolume;
    }
  }, [isPlayerReady]);

  if (!videoId) {
    return (
      <div className="w-full h-64 bg-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-slate-400">No YouTube video selected</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <div ref={containerRef} className="w-full h-64" />
        
        {/* Custom controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={isPlaying ? pause : play}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={isMuted ? unmute : mute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {!isPlayerReady && (
        <div className="mt-2 text-center">
          <p className="text-slate-400 text-sm">Loading YouTube player...</p>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;

