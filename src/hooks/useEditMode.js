import { useState, useCallback, useRef } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';
import { useMusicalAnalysis } from './useMusicalAnalysis';

export const useEditMode = () => {
  const { editMode, setEditMode } = useScoreStore();
  const { analyzeScore, generateControlPoints } = useMusicalAnalysis();
  
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedPoint: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const [distanceVisualization, setDistanceVisualization] = useState({
    show: false,
    lines: [],
    measurements: []
  });

  const containerRef = useRef(null);
  const osmdInstanceRef = useRef(null);

  // Toggle edit mode and analyze score
  const toggleEditMode = useCallback((osmdInstance, containerElement) => {
    osmdInstanceRef.current = osmdInstance;
    containerRef.current = containerElement;

    if (!editMode.isActive) {
      // Entering edit mode - analyze the score
      if (osmdInstance && containerElement) {
        const analysis = analyzeScore(osmdInstance);
        const containerRect = containerElement.getBoundingClientRect();
        const controlPoints = generateControlPoints(analysis, containerRect);
        
        setEditMode({
          isActive: true,
          showGrid: false, // grid disabled
          showDistances: true, // enable distances
          controlPoints,
          selectedElement: null,
          musicalAnalysis: analysis
        });
      } else {
        setEditMode({
          isActive: true,
          showGrid: false,
          showDistances: true,
          controlPoints: [],
          selectedElement: null,
          musicalAnalysis: null
        });
      }
    } else {
      // Exiting edit mode
      setEditMode({
        isActive: false,
        showGrid: false,
        showDistances: false,
        controlPoints: [],
        selectedElement: null,
        musicalAnalysis: null
      });
      setDragState({
        isDragging: false,
        draggedPoint: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
      });
      setDistanceVisualization({
        show: false,
        lines: [],
        measurements: []
      });
    }
  }, [editMode.isActive, setEditMode, analyzeScore, generateControlPoints]);

  // Toggle distance visualization
  const toggleDistances = useCallback(() => {
    setEditMode({
      ...editMode,
      showDistances: !editMode.showDistances
    });
  }, [editMode, setEditMode]);

  // Start dragging a control point
  const startDrag = useCallback((pointId, startPosition, event) => {
    const point = editMode.controlPoints.find(p => p.id === pointId);
    if (!point || !point.draggable) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    setDragState({
      isDragging: true,
      draggedPoint: pointId,
      startPosition,
      currentPosition: startPosition,
      offset
    });

    setEditMode({
      ...editMode,
      selectedElement: pointId
    });

    // Show distance visualization
    setDistanceVisualization({
      show: true,
      lines: generateDistanceLines(point, editMode.controlPoints),
      measurements: []
    });
  }, [editMode, setEditMode]);

  // Update drag position
  const updateDrag = useCallback((event) => {
    if (!dragState.isDragging || !dragState.draggedPoint) return;

    const point = editMode.controlPoints.find(p => p.id === dragState.draggedPoint);
    if (!point) return;

    // Calculate new position
    let newX = event.clientX - dragState.offset.x;
    let newY = event.clientY - dragState.offset.y;

    // Apply constraints
    if (point.constraints) {
      if (point.constraints.axis === 'horizontal') {
        newY = point.position.y; // Keep Y fixed
      }
      if (point.constraints.axis === 'vertical') {
        newX = point.position.x; // Keep X fixed
      }
      if (point.constraints.minX !== undefined) {
        newX = Math.max(newX, point.constraints.minX);
      }
      if (point.constraints.maxX !== undefined) {
        newX = Math.min(newX, point.constraints.maxX);
      }
      if (point.constraints.minY !== undefined) {
        newY = Math.max(newY, point.constraints.minY);
      }
      if (point.constraints.maxY !== undefined) {
        newY = Math.min(newY, point.constraints.maxY);
      }
    }

    const newPosition = { x: newX, y: newY };
    
    setDragState(prev => ({
      ...prev,
      currentPosition: newPosition
    }));

    // Update control point position
    const updatedPoints = editMode.controlPoints.map(p => 
      p.id === dragState.draggedPoint 
        ? { ...p, position: newPosition }
        : p
    );

    setEditMode({
      ...editMode,
      controlPoints: updatedPoints
    });

    // Update distance visualization
    const updatedPoint = { ...point, position: newPosition };
    setDistanceVisualization({
      show: true,
      lines: generateDistanceLines(updatedPoint, updatedPoints),
      measurements: calculateDistanceMeasurements(updatedPoint, dragState.startPosition, newPosition)
    });
  }, [dragState, editMode, setEditMode]);

  // End dragging
  const endDrag = useCallback(() => {
    if (dragState.isDragging && dragState.draggedPoint) {
      // Apply the final position and any musical logic here
      const point = editMode.controlPoints.find(p => p.id === dragState.draggedPoint);
      if (point) {
        // Placeholder: apply spacing changes; would interface with OSMD
        console.log('Apply spacing change', point);
      }
    }

    setDragState({
      isDragging: false,
      draggedPoint: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });

    // Hide distance visualization after a delay
    setTimeout(() => {
      setDistanceVisualization({
        show: false,
        lines: [],
        measurements: []
      });
    }, 1000);
  }, [dragState, editMode]);

  // Generate distance guide lines
  const generateDistanceLines = useCallback((draggedPoint, allPoints) => {
    const lines = [];
    
    // Find nearby points for alignment guides
    allPoints.forEach(point => {
      if (point.id === draggedPoint.id) return;
      
      const distance = Math.abs(point.position.x - draggedPoint.position.x);
      if (distance < 50) { // Show guide if within 50px
        lines.push({
          type: 'vertical',
          x: point.position.x,
          color: '#f59e0b', // Amber for alignment guides
          opacity: 0.6
        });
      }
    });

    return lines;
  }, []);

  // Calculate distance measurements
  const calculateDistanceMeasurements = useCallback((point, startPos, currentPos) => {
    const distance = Math.abs(currentPos.x - startPos.x);
    
    return [{
      position: {
        x: (startPos.x + currentPos.x) / 2,
        y: point.position.y - 30
      },
      value: `${distance.toFixed(0)}px`,
      type: point.type === 'barline' ? 'measure-spacing' : 'beat-spacing'
    }];
  }, []);

  // Hide selected element
  const hideElement = useCallback((elementId) => {
    if (!elementId && !editMode.selectedElement) return;
    
    const targetId = elementId || editMode.selectedElement;
    const updatedPoints = editMode.controlPoints.map(point => 
      point.id === targetId 
        ? { ...point, hidden: true }
        : point
    );

    setEditMode({
      ...editMode,
      controlPoints: updatedPoints,
      selectedElement: null
    });
  }, [editMode, setEditMode]);

  // Restore all hidden elements
  const restoreAllElements = useCallback(() => {
    const updatedPoints = editMode.controlPoints.map(point => ({
      ...point,
      hidden: false
    }));

    setEditMode({
      ...editMode,
      controlPoints: updatedPoints
    });
  }, [editMode, setEditMode]);

  return {
    editMode,
    dragState,
    distanceVisualization,
    toggleEditMode,
    toggleDistances,
    startDrag,
    updateDrag,
    endDrag,
    hideElement,
    restoreAllElements
  };
};
