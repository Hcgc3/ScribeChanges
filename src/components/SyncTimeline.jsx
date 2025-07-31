import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/Ui/button.jsx';
import { Card, CardContent } from '@/components/Ui/card.jsx';
import { Play, Pause, Plus, Trash2, Move } from 'lucide-react';

const SyncTimeline = ({ 
  midiData, 
  audioDuration = 0, 
  onSyncPointsChange,
  isPlaying = false,
  currentTime = 0 
}) => {
  const [syncPoints, setSyncPoints] = useState([]);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const timelineRef = useRef(null);
  const midiTimelineRef = useRef(null);

  // Initialize with default sync points
  useEffect(() => {
    if (midiData && audioDuration > 0 && syncPoints.length === 0) {
      const defaultPoints = [
        { id: 1, midiTime: 0, audioTime: 0, label: 'Start' },
        { id: 2, midiTime: midiData.duration || 30, audioTime: audioDuration, label: 'End' }
      ];
      setSyncPoints(defaultPoints);
      if (onSyncPointsChange) {
        onSyncPointsChange(defaultPoints);
      }
    }
  }, [midiData, audioDuration]);

  // Handle timeline click to add sync point
  const handleTimelineClick = (e, timeline) => {
    if (!isAddingPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    
    let time, otherTime;
    if (timeline === 'midi') {
      time = (clickX / timelineWidth) * (midiData?.duration || 30);
      otherTime = currentTime; // Use current audio time
    } else {
      time = (clickX / timelineWidth) * audioDuration;
      otherTime = currentTime; // Use current MIDI time
    }

    const newPoint = {
      id: Date.now(),
      midiTime: timeline === 'midi' ? time : otherTime,
      audioTime: timeline === 'audio' ? time : otherTime,
      label: `Sync ${syncPoints.length + 1}`
    };

    const updatedPoints = [...syncPoints, newPoint].sort((a, b) => a.midiTime - b.midiTime);
    setSyncPoints(updatedPoints);
    setIsAddingPoint(false);
    
    if (onSyncPointsChange) {
      onSyncPointsChange(updatedPoints);
    }
  };

  // Handle drag start
  const handleDragStart = (e, point) => {
    setDraggedPoint(point);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, timeline) => {
    e.preventDefault();
    if (!draggedPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    
    let newTime;
    if (timeline === 'midi') {
      newTime = (dropX / timelineWidth) * (midiData?.duration || 30);
    } else {
      newTime = (dropX / timelineWidth) * audioDuration;
    }

    const updatedPoints = syncPoints.map(point => {
      if (point.id === draggedPoint.id) {
        return {
          ...point,
          [timeline === 'midi' ? 'midiTime' : 'audioTime']: Math.max(0, newTime)
        };
      }
      return point;
    }).sort((a, b) => a.midiTime - b.midiTime);

    setSyncPoints(updatedPoints);
    setDraggedPoint(null);
    
    if (onSyncPointsChange) {
      onSyncPointsChange(updatedPoints);
    }
  };

  // Remove sync point
  const removeSyncPoint = (pointId) => {
    const updatedPoints = syncPoints.filter(point => point.id !== pointId);
    setSyncPoints(updatedPoints);
    
    if (onSyncPointsChange) {
      onSyncPointsChange(updatedPoints);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render timeline with sync points
  const renderTimeline = (type, duration, currentPos) => {
    const points = syncPoints.map(point => ({
      ...point,
      position: type === 'midi' ? point.midiTime : point.audioTime
    }));

    return (
      <div className="relative">
        <div 
          ref={type === 'midi' ? midiTimelineRef : timelineRef}
          className={`h-16 bg-slate-800 rounded-lg border-2 border-dashed cursor-pointer relative overflow-hidden ${
            isAddingPoint ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600'
          }`}
          onClick={(e) => handleTimelineClick(e, type)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, type)}
        >
          {/* Timeline background */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600" />
          
          {/* Current time indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20"
            style={{ left: `${duration > 0 ? (currentPos / duration) * 100 : 0}%` }}
          />
          
          {/* Sync points */}
          {points.map(point => (
            <div
              key={point.id}
              className="absolute top-1 bottom-1 w-1 bg-red-500 cursor-move z-10 group"
              style={{ left: `${duration > 0 ? (point.position / duration) * 100 : 0}%` }}
              draggable
              onDragStart={(e) => handleDragStart(e, point)}
            >
              {/* Sync point handle */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" />
              
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {point.label}: {formatTime(point.position)}
              </div>
              
              {/* Delete button */}
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-6 -right-2 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSyncPoint(point.id);
                }}
              >
                <Trash2 className="w-2 h-2" />
              </Button>
            </div>
          ))}
          
          {/* Timeline labels */}
          <div className="absolute bottom-1 left-2 text-xs text-slate-300">
            0:00
          </div>
          <div className="absolute bottom-1 right-2 text-xs text-slate-300">
            {formatTime(duration)}
          </div>
        </div>
        
        {/* Timeline title */}
        <div className="mt-2 text-center">
          <h4 className="text-sm font-medium text-slate-300">
            {type === 'midi' ? 'MIDI Timeline' : 'Audio Timeline'}
          </h4>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Sync Timeline</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isAddingPoint ? "default" : "outline"}
                onClick={() => setIsAddingPoint(!isAddingPoint)}
                className={isAddingPoint ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600 text-slate-300"}
              >
                <Plus className="w-4 h-4 mr-1" />
                {isAddingPoint ? 'Click to Add' : 'Add Sync Point'}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          {isAddingPoint && (
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                Click on either timeline to add a sync point. The point will be created at the current playback position.
              </p>
            </div>
          )}

          {/* MIDI Timeline */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">MIDI Timeline</h4>
            {renderTimeline('midi', midiData?.duration || 30, currentTime)}
          </div>

          {/* Audio Timeline */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Audio Timeline</h4>
            {renderTimeline('audio', audioDuration, currentTime)}
          </div>

          {/* Sync Points List */}
          {syncPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Sync Points</h4>
              <div className="space-y-2">
                {syncPoints.map(point => (
                  <div key={point.id} className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Move className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">{point.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <span>MIDI: {formatTime(point.midiTime)}</span>
                      <span>Audio: {formatTime(point.audioTime)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSyncPoint(point.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-1">Tips:</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Drag sync points to adjust timing</li>
              <li>• Add multiple sync points for better accuracy</li>
              <li>• Use the playback controls to find precise moments</li>
              <li>• Sync points help align MIDI playback with audio/video</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncTimeline;

