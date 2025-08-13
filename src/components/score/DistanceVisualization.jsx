import React from 'react';

const DistanceVisualization = ({ 
  distanceVisualization, 
  dragState, 
  editMode,
  // containerRect removido: não utilizado
}) => {
  if (!distanceVisualization.show || !dragState.isDragging) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Alignment Guide Lines */}
      {distanceVisualization.lines.map((line, index) => (
        <div
          key={`line-${index}`}
          className="absolute"
          style={{
            left: line.type === 'vertical' ? `${line.x}px` : 0,
            top: line.type === 'horizontal' ? `${line.y}px` : 0,
            width: line.type === 'vertical' ? '1px' : '100%',
            height: line.type === 'horizontal' ? '1px' : '100%',
            backgroundColor: line.color,
            opacity: line.opacity || 0.6,
            borderStyle: 'dashed',
            borderWidth: '1px',
            borderColor: line.color,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}

      {/* Distance Measurements */}
      {distanceVisualization.measurements.map((measurement, index) => (
        <div
          key={`measurement-${index}`}
          className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{
            left: `${measurement.position.x}px`,
            top: `${measurement.position.y}px`,
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            zIndex: 50,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="font-mono">{measurement.value}</div>
            {measurement.type && (
              <div className="text-xs opacity-75 capitalize">
                {measurement.type.replace('-', ' ')}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Drag Guidelines */}
      {dragState.isDragging && dragState.draggedPoint && (
        <>
          {/* Horizontal movement guide */}
          <div
            className="absolute h-px bg-blue-400 opacity-60"
            style={{
              left: 0,
              right: 0,
              top: `${dragState.currentPosition.y}px`,
              borderTop: '1px dashed #60a5fa',
            }}
          />
          
          {/* Vertical movement guide */}
          <div
            className="absolute w-px bg-blue-400 opacity-60"
            style={{
              top: 0,
              bottom: 0,
              left: `${dragState.currentPosition.x}px`,
              borderLeft: '1px dashed #60a5fa',
            }}
          />

          {/* Start position indicator */}
          <div
            className="absolute w-2 h-2 bg-green-500 rounded-full opacity-75"
            style={{
              left: `${dragState.startPosition.x - 4}px`,
              top: `${dragState.startPosition.y - 4}px`,
            }}
          />

          {/* Current position indicator */}
          <div
            className="absolute w-2 h-2 bg-red-500 rounded-full"
            style={{
              left: `${dragState.currentPosition.x - 4}px`,
              top: `${dragState.currentPosition.y - 4}px`,
            }}
          />

          {/* Movement vector line */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <line
              x1={dragState.startPosition.x}
              y1={dragState.startPosition.y}
              x2={dragState.currentPosition.x}
              y2={dragState.currentPosition.y}
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
            
            {/* Arrow head */}
            <polygon
              points={`${dragState.currentPosition.x},${dragState.currentPosition.y} ${dragState.currentPosition.x - 8},${dragState.currentPosition.y - 4} ${dragState.currentPosition.x - 8},${dragState.currentPosition.y + 4}`}
              fill="#8b5cf6"
              opacity="0.7"
            />
          </svg>
        </>
      )}

      {/* Snap indicators */}
      {editMode.controlPoints
        .filter(point => point.id !== dragState.draggedPoint)
        .map(point => {
          const distance = Math.abs(point.position.x - dragState.currentPosition.x);
          const isNearby = distance < 20; // Snap threshold
          
          if (!isNearby) return null;
          
          return (
            <div
              key={`snap-${point.id}`}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${point.position.x - 2}px`,
                top: `${point.position.y - 2}px`,
              }}
            />
          );
        })}
    </div>
  );
};

export default DistanceVisualization;
