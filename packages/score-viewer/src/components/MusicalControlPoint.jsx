import React from 'react';

const MusicalControlPoint = ({ 
  point, 
  onDragStart, 
  onDrag, 
  onDragEnd, 
  isSelected, 
  zoom = 1 
}) => {
  if (point.hidden) return null;

  const getPointStyle = () => {
    const baseSize = point.size === 'large' ? 16 : point.size === 'medium' ? 12 : 8;
    const size = baseSize / zoom;
    
    const baseStyles = {
      position: 'absolute',
      left: point.position.x - size / 2,
      top: point.position.y - size / 2,
      width: size,
      height: size,
      borderRadius: point.type === 'barline' ? '2px' : '50%',
      backgroundColor: point.color,
      border: isSelected ? '2px solid #000' : '1px solid rgba(255,255,255,0.8)',
      cursor: point.draggable ? 'grab' : 'default',
      zIndex: 1000,
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    };

    switch (point.type) {
      case 'barline':
        return { ...baseStyles, borderRadius: '2px', backgroundColor: '#10b981', transform: 'scaleY(1.5)' };
      case 'beat':
        return { ...baseStyles, backgroundColor: '#3b82f6', borderRadius: '50%' };
      case 'staff':
        return { ...baseStyles, backgroundColor: '#f59e0b', borderRadius: '4px' };
      case 'corner':
        return { ...baseStyles, backgroundColor: '#ef4444', borderRadius: '2px', transform: 'rotate(45deg)' };
      default:
        return baseStyles;
    }
  };

  const handleMouseDown = (e) => {
    if (!point.draggable) return;
    e.preventDefault();
    e.stopPropagation();
    onDragStart?.(point.id, point.position, e);
  };

  const handleMouseMove = (e) => { onDrag?.(e); };
  const handleMouseUp = (e) => { onDragEnd?.(e); };

  const getTooltipText = () => {
    switch (point.type) {
      case 'barline':
        return `Barra de compasso ${point.measureIndex + 1}`;
      case 'beat':
        return `Tempo ${point.beatPosition?.toFixed(1) || point.beatIndex + 1} - ${point.noteType || 'nota'}`;
      case 'staff':
        return `Pauta ${point.staffIndex + 1}`;
      case 'corner':
        return 'Canto da página';
      default:
        return point.type;
    }
  };

  return (
    <div
      style={getPointStyle()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      title={getTooltipText()}
      className={`musical-control-point ${point.type} ${isSelected ? 'selected' : ''}`}
      data-point-id={point.id}
      data-point-type={point.type}
    >
      {point.type === 'barline' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '2px', height: '80%', backgroundColor: 'rgba(255,255,255,0.8)' }} />
      )}
      {point.type === 'beat' && point.noteType && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '50%' }} />
      )}
    </div>
  );
};

export default MusicalControlPoint;
