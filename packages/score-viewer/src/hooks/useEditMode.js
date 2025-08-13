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

  const toggleEditMode = useCallback((osmdInstance, containerElement) => {
    osmdInstanceRef.current = osmdInstance;
    containerRef.current = containerElement;

    if (!editMode.isActive) {
      if (osmdInstance && containerElement) {
        const analysis = analyzeScore(osmdInstance);
        const containerRect = containerElement.getBoundingClientRect();
        const controlPoints = generateControlPoints(analysis, containerRect);
        
        setEditMode({
          isActive: true,
          showGrid: false,
          showDistances: true,
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

  const toggleDistances = useCallback(() => {
    setEditMode({
      ...editMode,
      showDistances: !editMode.showDistances
    });
  }, [editMode, setEditMode]);

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

    setDistanceVisualization({
      show: true,
      lines: generateDistanceLines(point, editMode.controlPoints),
      measurements: []
    });
  }, [editMode, setEditMode]);

  const updateDrag = useCallback((event) => {
    if (!dragState.isDragging || !dragState.draggedPoint) return;

    const point = editMode.controlPoints.find(p => p.id === dragState.draggedPoint);
    if (!point) return;

    let newX = event.clientX - dragState.offset.x;
    let newY = event.clientY - dragState.offset.y;

    if (point.constraints) {
      if (point.constraints.axis === 'horizontal') newY = point.position.y;
      if (point.constraints.axis === 'vertical') newX = point.position.x;
      if (point.constraints.minX !== undefined) newX = Math.max(newX, point.constraints.minX);
      if (point.constraints.maxX !== undefined) newX = Math.min(newX, point.constraints.maxX);
      if (point.constraints.minY !== undefined) newY = Math.max(newY, point.constraints.minY);
      if (point.constraints.maxY !== undefined) newY = Math.min(newY, point.constraints.maxY);
    }

    const newPosition = { x: newX, y: newY };
    
    setDragState(prev => ({
      ...prev,
      currentPosition: newPosition
    }));

    const updatedPoints = editMode.controlPoints.map(p => 
      p.id === dragState.draggedPoint 
        ? { ...p, position: newPosition }
        : p
    );

    setEditMode({
      ...editMode,
      controlPoints: updatedPoints
    });

    const updatedPoint = { ...point, position: newPosition };
    setDistanceVisualization({
      show: true,
      lines: generateDistanceLines(updatedPoint, updatedPoints),
      measurements: calculateDistanceMeasurements(updatedPoint, dragState.startPosition, newPosition)
    });
  }, [dragState, editMode, setEditMode]);

  const endDrag = useCallback(() => {
    if (dragState.isDragging && dragState.draggedPoint) {
      const point = editMode.controlPoints.find(p => p.id === dragState.draggedPoint);
      if (point) {
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

    setTimeout(() => {
      setDistanceVisualization({
        show: false,
        lines: [],
        measurements: []
      });
    }, 1000);
  }, [dragState, editMode]);

  const generateDistanceLines = useCallback((draggedPoint, allPoints) => {
    const lines = [];
    allPoints.forEach(point => {
      if (point.id === draggedPoint.id) return;
      const distance = Math.abs(point.position.x - draggedPoint.position.x);
      if (distance < 50) {
        lines.push({ type: 'vertical', x: point.position.x, color: '#f59e0b', opacity: 0.6 });
      }
    });
    return lines;
  }, []);

  const calculateDistanceMeasurements = useCallback((point, startPos, currentPos) => {
    const distance = Math.abs(currentPos.x - startPos.x);
    return [{
      position: { x: (startPos.x + currentPos.x) / 2, y: point.position.y - 30 },
      value: `${distance.toFixed(0)}px`,
      type: point.type === 'barline' ? 'measure-spacing' : 'beat-spacing'
    }];
  }, []);

  const hideElement = useCallback((elementId) => {
    if (!elementId && !editMode.selectedElement) return;
    const targetId = elementId || editMode.selectedElement;
    const updatedPoints = editMode.controlPoints.map(point => 
      point.id === targetId 
        ? { ...point, hidden: true }
        : point
    );
    setEditMode({ ...editMode, controlPoints: updatedPoints, selectedElement: null });
  }, [editMode, setEditMode]);

  const restoreAllElements = useCallback(() => {
    const updatedPoints = editMode.controlPoints.map(point => ({ ...point, hidden: false }));
    setEditMode({ ...editMode, controlPoints: updatedPoints });
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
