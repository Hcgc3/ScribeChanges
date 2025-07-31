import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { 
  FileMusic, 
  Play, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Music,
  Star,
  StarOff,
  Edit3,
  FolderOpen,
  Grid,
  List
} from 'lucide-react';

const MyScoresManager = ({ onLoadScore, onBackToUpload }) => {
  const [scores, setScores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'duration'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'favorites', 'recent'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [selectedScores, setSelectedScores] = useState([]);

  // Load scores from localStorage on component mount
  useEffect(() => {
    loadScoresFromStorage();
  }, []);

  // Load scores from localStorage
  const loadScoresFromStorage = () => {
    try {
      const savedScores = localStorage.getItem('sheetMusicScores');
      if (savedScores) {
        const parsedScores = JSON.parse(savedScores);
        setScores(parsedScores);
      } else {
        // Initialize with some demo scores
        const demoScores = [
          {
            id: '1',
            name: 'Sample MIDI',
            fileName: 'sample.mid',
            duration: 234,
            tracks: 23,
            notes: 3275,
            bpm: 125,
            dateAdded: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            isFavorite: true,
            tags: ['classical', 'piano'],
            thumbnail: null
          }
        ];
        setScores(demoScores);
        saveScoresToStorage(demoScores);
      }
    } catch (error) {
      console.error('Error loading scores from storage:', error);
      setScores([]);
    }
  };

  // Save scores to localStorage
  const saveScoresToStorage = (scoresToSave) => {
    try {
      localStorage.setItem('sheetMusicScores', JSON.stringify(scoresToSave));
    } catch (error) {
      console.error('Error saving scores to storage:', error);
    }
  };

  // Add new score
  const addScore = (midiData, fileName) => {
    const newScore = {
      id: Date.now().toString(),
      name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
      fileName: fileName,
      duration: Math.round(midiData.duration || 0),
      tracks: midiData.tracks?.length || 0,
      notes: midiData.tracks?.reduce((total, track) => total + track.notes.length, 0) || 0,
      bpm: Math.round(midiData.header?.tempos?.[0]?.bpm || 120),
      dateAdded: new Date().toISOString(),
      lastPlayed: null,
      isFavorite: false,
      tags: [],
      thumbnail: null,
      midiData: midiData // Store the actual MIDI data
    };

    const updatedScores = [newScore, ...scores];
    setScores(updatedScores);
    saveScoresToStorage(updatedScores);
    return newScore;
  };

  // Delete score
  const deleteScore = (scoreId) => {
    const updatedScores = scores.filter(score => score.id !== scoreId);
    setScores(updatedScores);
    saveScoresToStorage(updatedScores);
    setSelectedScores(selectedScores.filter(id => id !== scoreId));
  };

  // Toggle favorite
  const toggleFavorite = (scoreId) => {
    const updatedScores = scores.map(score => 
      score.id === scoreId ? { ...score, isFavorite: !score.isFavorite } : score
    );
    setScores(updatedScores);
    saveScoresToStorage(updatedScores);
  };

  // Update last played
  const updateLastPlayed = (scoreId) => {
    const updatedScores = scores.map(score => 
      score.id === scoreId ? { ...score, lastPlayed: new Date().toISOString() } : score
    );
    setScores(updatedScores);
    saveScoresToStorage(updatedScores);
  };

  // Load score for playback
  const loadScore = (score) => {
    updateLastPlayed(score.id);
    if (onLoadScore) {
      onLoadScore(score.midiData, score);
    }
  };

  // Filter and sort scores
  const getFilteredAndSortedScores = () => {
    let filteredScores = scores;

    // Apply search filter
    if (searchTerm) {
      filteredScores = filteredScores.filter(score =>
        score.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        score.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'favorites':
        filteredScores = filteredScores.filter(score => score.isFavorite);
        break;
      case 'recent':
        filteredScores = filteredScores.filter(score => 
          score.lastPlayed && 
          new Date(score.lastPlayed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filteredScores.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'duration':
        filteredScores.sort((a, b) => b.duration - a.duration);
        break;
      case 'date':
      default:
        filteredScores.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
    }

    return filteredScores;
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render score card
  const renderScoreCard = (score) => (
    <Card 
      key={score.id} 
      className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-all cursor-pointer group"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-blue-300 transition-colors">
              {score.name}
            </h3>
            <p className="text-slate-400 text-sm">{score.fileName}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(score.id);
            }}
            className="text-slate-400 hover:text-yellow-400"
          >
            {score.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(score.duration)}
          </div>
          <div className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            {score.tracks} tracks
          </div>
          <div className="flex items-center gap-1">
            <FileMusic className="w-3 h-3" />
            {score.notes} notes
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {score.bpm} BPM
          </div>
        </div>

        <div className="text-xs text-slate-400 mb-3">
          Added: {formatDate(score.dateAdded)}
          {score.lastPlayed && (
            <span className="ml-2">• Last played: {formatDate(score.lastPlayed)}</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => loadScore(score)}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            <Play className="w-3 h-3 mr-1" />
            Play
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              deleteScore(score.id);
            }}
            className="border-slate-600 text-slate-300 hover:bg-red-600 hover:border-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render score list item
  const renderScoreListItem = (score) => (
    <Card 
      key={score.id} 
      className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-all cursor-pointer"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
              <FileMusic className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">{score.name}</h3>
              <p className="text-slate-400 text-sm">{score.fileName}</p>
            </div>
            <div className="text-sm text-slate-300 text-center">
              <div>{formatDuration(score.duration)}</div>
              <div className="text-xs text-slate-400">{score.tracks} tracks</div>
            </div>
            <div className="text-sm text-slate-300 text-center">
              <div>{score.bpm} BPM</div>
              <div className="text-xs text-slate-400">{score.notes} notes</div>
            </div>
            <div className="text-sm text-slate-300 text-center">
              <div>{formatDate(score.dateAdded)}</div>
              <div className="text-xs text-slate-400">Added</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(score.id);
              }}
              className="text-slate-400 hover:text-yellow-400"
            >
              {score.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              onClick={() => loadScore(score)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Play
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                deleteScore(score.id);
              }}
              className="border-slate-600 text-slate-300 hover:bg-red-600 hover:border-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const filteredScores = getFilteredAndSortedScores();

  return (
    <div className="min-h-screen sharpblend-gradient p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Scores</h1>
            <p className="text-gray-300">Manage your saved sheet music</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBackToUpload} className="border-border text-foreground hover:bg-primary hover:text-primary-foreground">
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 slide-in-left">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search scores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 bg-input border border-border rounded-md text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All Scores</option>
              <option value="favorites">Favorites</option>
              <option value="recent">Recently Played</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-input border border-border rounded-md text-foreground focus:border-primary focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="duration">Sort by Duration</option>
            </select>

            <div className="flex border border-border rounded-md overflow-hidden">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="rounded-none border-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="rounded-none border-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border backdrop-blur-sm hover-lift">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{scores.length}</div>
              <div className="text-muted-foreground text-sm">Total Scores</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border backdrop-blur-sm hover-lift">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{scores.filter(s => s.isFavorite).length}</div>
              <div className="text-muted-foreground text-sm">Favorites</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border backdrop-blur-sm hover-lift">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(scores.reduce((total, score) => total + score.duration, 0) / 60)}m
              </div>
              <div className="text-muted-foreground text-sm">Total Duration</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border backdrop-blur-sm hover-lift">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {scores.filter(s => s.lastPlayed && new Date(s.lastPlayed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-muted-foreground text-sm">Played This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Scores Grid/List */}
        {filteredScores.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No scores found</h3>
              <p className="text-slate-400 mb-4">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Upload your first MIDI file to get started.'}
              </p>
              <Button onClick={onBackToUpload} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload MIDI File
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {filteredScores.map(score => 
              viewMode === 'grid' ? renderScoreCard(score) : renderScoreListItem(score)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyScoresManager;

