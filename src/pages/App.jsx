import React, { useState, useEffect } from 'react';
import { Button } from '@/components/Ui/button.jsx';
import { Card, CardContent } from '@/components/Ui/card.jsx';
import { Upload, Music, Play, Pause, Volume2, Settings, FileMusic, Home } from 'lucide-react';
import '@/styles/App.css';

// Import Tone.js and MIDI parsing
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

// Import custom components
import SheetMusicRenderer from '@/components/SheetMusicRenderer.jsx';
import PlaybackControls from '@/components/PlaybackControls.jsx';
import TestMidiLoader from '@/components/TestMidiLoader.jsx';
import YouTubePlayer from '@/components/YouTubePlayer.jsx';
import EnhancedMidiSyncInterface from '@/components/EnhancedMidiSyncInterface.jsx';
import MyScoresManager from '@/components/MyScoresManager.jsx';

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'sync', 'playback', 'scores'
  const [midiData, setMidiData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [syncPoints, setSyncPoints] = useState([]);
  const [beatMarkings, setBeatMarkings] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [currentScore, setCurrentScore] = useState(null);

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (file && (file.type === 'audio/midi' || file.name.endsWith('.mid') || file.name.endsWith('.midi'))) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const midi = new Midi(arrayBuffer);
        setMidiData(midi);
        console.log('MIDI data loaded:', midi);
        setCurrentView('sync');
        console.log('Current view set to sync');
      } catch (error) {
        console.error('Error parsing MIDI file:', error);
        alert('Error parsing MIDI file. Please try a different file.');
      }
    } else {
      alert('Please upload a valid MIDI file (.mid or .midi)');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // File input handler
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Navigation handlers
  const goToUpload = () => setCurrentView('upload');
  const goToSync = () => setCurrentView('sync');
  const goToPlayback = () => setCurrentView('playback');
  const goToScores = () => setCurrentView('scores');

  useEffect(() => {
    const resumeAudioContext = async () => {
      if (Tone.context.state === 'suspended') {
        try {
          await Tone.context.resume();
          console.log('AudioContext resumed successfully');
        } catch (e) {
          console.error('Error resuming AudioContext:', e);
        }
      }
    };

    // Attempt to resume on initial load or view change
    if (currentView === 'sync' && midiData) {
      resumeAudioContext();
    }

    // Also attempt to resume on any user interaction
    const handleUserGesture = () => {
      resumeAudioContext();
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };

    window.addEventListener('click', handleUserGesture);
    window.addEventListener('keydown', handleUserGesture);

    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, [currentView, midiData]);
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleStop = () => setIsPlaying(false);
  const toggleControlsCollapse = () => setIsControlsCollapsed(!isControlsCollapsed);

  // YouTube handlers
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeUrlChange = (url) => {
    setYoutubeUrl(url);
    const videoId = extractVideoId(url);
    setYoutubeVideoId(videoId || '');
  };

  // Audio file handler
  const handleAudioFileChange = (file) => {
    setAudioFile(file);
  };

  // Sync points handler
  const handleSyncPointsChange = (points) => {
    setSyncPoints(points);
  };

  // Beat markings handler
  const handleBeatMarkingsChange = (markings) => {
    setBeatMarkings(markings);
  };

  // Score management handlers
  const handleLoadScore = (midiData, scoreInfo) => {
    setMidiData(midiData);
    setCurrentScore(scoreInfo);
    setCurrentView('playback');
  };

  const handleSaveCurrentScore = () => {
    if (midiData && currentScore) {
      // Score is already saved, just update last played
      const scores = JSON.parse(localStorage.getItem('sheetMusicScores') || '[]');
      const updatedScores = scores.map(score => 
        score.id === currentScore.id 
          ? { ...score, lastPlayed: new Date().toISOString() }
          : score
      );
      localStorage.setItem('sheetMusicScores', JSON.stringify(updatedScores));
    }
  };

  // Upload Screen Component
  const UploadScreen = () => (
    <div className="min-h-screen sharpblend-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 fade-in-up">
          <div className="flex justify-center mb-4">
            <div className="p-4 sharpblend-yellow rounded-full pulse-yellow">
              <Music className="w-12 h-12 text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Sheet Music Viewer</h1>
          <p className="text-gray-300 text-lg">Upload your MIDI file to get started</p>
        </div>

        <Card className="bg-card border-border backdrop-blur-sm hover-lift">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                isDragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary hover:bg-primary/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Drop your MIDI file here
              </h3>
              <p className="text-muted-foreground mb-6">
                Or click to browse and select a file
              </p>
              <input
                type="file"
                accept=".mid,.midi,audio/midi"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button className="sharpblend-yellow text-black hover:opacity-90 font-semibold">
                  Browse Files
                </Button>
              </label>
            </div>
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Supported formats: .mid, .midi
              </p>
            </div>
            
            <TestMidiLoader onMidiLoad={handleFileUpload} />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Sync Screen Component
  const SyncScreen = () => (
    <div className="min-h-screen sharpblend-gradient p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sync Timeline</h1>
            <p className="text-gray-300">Set sync points between your MIDI and audio/video</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={goToUpload} className="border-border text-foreground hover:bg-primary hover:text-primary-foreground">
              ← Back
            </Button>
            <Button onClick={goToPlayback} className="sharpblend-yellow text-black hover:opacity-90 font-semibold">
              Continue to Playback →
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 slide-in-left">
          {/* Audio/Video Source */}
          <Card className="bg-card border-border backdrop-blur-sm hover-lift">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Audio/Video Source</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    YouTube URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                
                {youtubeVideoId && (
                  <div className="mt-4">
                    <YouTubePlayer
                      videoId={youtubeVideoId}
                      isPlaying={isPlaying}
                      onReady={() => console.log('YouTube player ready')}
                      onStateChange={(event) => console.log('YouTube state change:', event)}
                      onTimeUpdate={(time) => console.log('YouTube time:', time)}
                    />
                  </div>
                )}
                
                <div className="text-center text-muted-foreground">or</div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Upload Audio File
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleAudioFileChange(e.target.files[0])}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white"
                  />
                </div>
                
                {audioFile && (
                  <div className="mt-4">
                    <audio 
                      controls 
                      className="w-full"
                      src={URL.createObjectURL(audioFile)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* MIDI Info */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">MIDI Information</h3>
              {midiData ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white">{Math.round(midiData.duration)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tracks:</span>
                    <span className="text-white">{midiData.tracks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Notes:</span>
                    <span className="text-white">
                      {midiData.tracks.reduce((total, track) => total + track.notes.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tempo:</span>
                    <span className="text-white">{Math.round(midiData.header.tempos[0]?.bpm || 120)} BPM</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">No MIDI file loaded</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced MIDI Sync Interface */}
        <EnhancedMidiSyncInterface
          midiData={midiData}
          audioFile={audioFile}
          youtubeVideoId={youtubeVideoId}
          onBeatMarkingsChange={handleBeatMarkingsChange}
        />
      </div>
    </div>
  );

  // Playback Screen Component
  const PlaybackScreen = () => (
    <div className="min-h-screen sharpblend-gradient text-white flex flex-col">
      {/* Navigation Bar */}
      <div className="sticky-header bg-card/80 backdrop-blur-md border-b border-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={goToUpload} className="text-foreground hover:bg-primary hover:text-primary-foreground">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" onClick={goToScores} className="text-foreground hover:bg-primary hover:text-primary-foreground">
              <FileMusic className="w-4 h-4 mr-2" />
              My Scores
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-primary hover:text-primary-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet Music Viewer */}
      <div className="flex-1 overflow-hidden">
        <SheetMusicRenderer 
          midiData={midiData}
          width={window.innerWidth - 40}
          height={isControlsCollapsed ? window.innerHeight - 140 : window.innerHeight - 240}
        />
      </div>

      {/* Playback Panel */}
      <div className="flex-shrink-0">
        <PlaybackControls
          midiData={midiData}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          isCollapsed={isControlsCollapsed}
          onToggleCollapse={toggleControlsCollapse}
        />
      </div>
    </div>
  );

  // My Scores Screen Component
  const MyScoresScreen = () => (
    <MyScoresManager 
      onLoadScore={handleLoadScore}
      onBackToUpload={goToUpload}
    />
  );

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'upload':
        return <UploadScreen />;
      case 'sync':
        return <SyncScreen />;
      case 'playback':
        return <PlaybackScreen />;
      case 'scores':
        return <MyScoresScreen />;
      default:
        return <UploadScreen />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentView()}
    </div>
  );
}

export default App;

