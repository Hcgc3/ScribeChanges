import { useCallback, useEffect, useState } from 'react';
import { useWidgetStore } from '../stores/widget-store';

export const useMagneticSnap = (widgetId, options = {}) => {
  const {
    snapDistance = 20,
    snapStrength = 0.8,
    onSnap,
    enabled = true,
  } = options;

  const {
    widgets,
    layout,
    findNearestMagneticZone,
    updateMagneticZones,
  } = useWidgetStore();

  const [activeZones, setActiveZones] = useState([]);
  const [nearestZone, setNearestZone] = useState(null);

  const widget = widgets[widgetId];
  const { magneticZones, physics } = layout;

  // Find magnetic zones near the widget
  const findNearbyZones = useCallback((position, size) => {
    if (!enabled || !magneticZones.length) return [];

    const nearby = magneticZones.filter(zone => {
      const distance = calculateDistanceToZone(position, size, zone);
      return distance <= snapDistance * 2; // Larger detection area
    });

    return nearby;
  }, [enabled, magneticZones, snapDistance]);

  // Calculate distance from widget to magnetic zone
  const calculateDistanceToZone = useCallback((position, size, zone) => {
    const widgetCenter = {
      x: position.x + size.width / 2,
      y: position.y + size.height / 2,
    };

    const zoneCenter = {
      x: (zone.bounds.left + zone.bounds.right) / 2,
      y: (zone.bounds.top + zone.bounds.bottom) / 2,
    };

    return Math.sqrt(
      Math.pow(widgetCenter.x - zoneCenter.x, 2) +
      Math.pow(widgetCenter.y - zoneCenter.y, 2)
    );
  }, []);

  // Check if widget should snap to a zone
  const checkForSnap = useCallback((position, size) => {
    if (!enabled) return null;

    const zone = findNearestMagneticZone(position, size);
    
    if (zone && zone.id !== nearestZone?.id) {
      setNearestZone(zone);
      onSnap?.({
        widgetId,
        zone,
        snapPosition: zone.snapPosition,
        snapStrength,
      });
      return zone;
    }

    if (!zone && nearestZone) {
      setNearestZone(null);
    }

    return zone;
  }, [enabled, widgetId, nearestZone, onSnap, snapStrength, findNearestMagneticZone]);

  // Apply magnetic force to position
  const applyMagneticForce = useCallback((position, size, force = snapStrength) => {
    const zone = checkForSnap(position, size);
    
    if (!zone) return position;

    // Calculate magnetic pull
    const snapPos = zone.snapPosition;
    const magneticPosition = {
      x: position.x + (snapPos.x - position.x) * force,
      y: position.y + (snapPos.y - position.y) * force,
    };

    return magneticPosition;
  }, [checkForSnap, snapStrength]);

  // Get visual feedback for magnetic zones
  const getMagneticFeedback = useCallback(() => {
    if (!widget || !enabled) return { zones: [], nearest: null };

    const nearby = findNearbyZones(widget.position, widget.size);
    
    return {
      zones: nearby.map(zone => ({
        ...zone,
        distance: calculateDistanceToZone(widget.position, widget.size, zone),
        active: zone.id === nearestZone?.id,
      })),
      nearest: nearestZone,
    };
  }, [widget, enabled, findNearbyZones, calculateDistanceToZone, nearestZone]);

  // Update active zones when widget moves
  useEffect(() => {
    if (!widget || !enabled) {
      setActiveZones([]);
      return;
    }

    const nearby = findNearbyZones(widget.position, widget.size);
    setActiveZones(nearby);
  }, [widget?.position, widget?.size, enabled, findNearbyZones]);

  // Snap animation
  const animateSnap = useCallback((targetPosition, duration = physics.transitionDuration) => {
    if (!widget || !enabled) return Promise.resolve();

    return new Promise((resolve) => {
      const startPosition = widget.position;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentPosition = {
          x: startPosition.x + (targetPosition.x - startPosition.x) * easeOut,
          y: startPosition.y + (targetPosition.y - startPosition.y) * easeOut,
        };

        // Update widget position
        useWidgetStore.getState().updateWidget(widgetId, { position: currentPosition });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }, [widget, enabled, widgetId, physics.transitionDuration]);

  // Snap to nearest zone
  const snapToNearest = useCallback(async () => {
    if (!widget || !nearestZone || !enabled) return false;

    const snapPosition = nearestZone.snapPosition;
    
    if (physics.smoothTransitions) {
      await animateSnap(snapPosition);
    } else {
      useWidgetStore.getState().moveWidget(widgetId, snapPosition);
    }

    return true;
  }, [widget, nearestZone, enabled, physics.smoothTransitions, animateSnap, widgetId]);

  // Force snap to specific zone
  const snapToZone = useCallback(async (zoneId) => {
    const zone = magneticZones.find(z => z.id === zoneId);
    if (!zone || !widget) return false;

    const snapPosition = useWidgetStore.getState().calculateSnapPosition(
      widget.position,
      widget.size,
      zone
    );

    if (physics.smoothTransitions) {
      await animateSnap(snapPosition);
    } else {
      useWidgetStore.getState().moveWidget(widgetId, snapPosition);
    }

    return true;
  }, [magneticZones, widget, physics.smoothTransitions, animateSnap, widgetId]);

  // Create custom magnetic zone
  const createCustomZone = useCallback((bounds, snapPosition, options = {}) => {
    const zone = {
      id: `custom-${Date.now()}`,
      bounds,
      type: 'custom',
      position: 'custom',
      snapDistance: options.snapDistance || snapDistance,
      priority: options.priority || 1,
      active: true,
      snapPosition,
      ...options,
    };

    const newZones = [...magneticZones, zone];
    updateMagneticZones(newZones);

    return zone.id;
  }, [magneticZones, snapDistance, updateMagneticZones]);

  // Remove custom magnetic zone
  const removeCustomZone = useCallback((zoneId) => {
    const newZones = magneticZones.filter(zone => zone.id !== zoneId);
    updateMagneticZones(newZones);
  }, [magneticZones, updateMagneticZones]);

  return {
    // State
    activeZones,
    nearestZone,
    enabled,
    
    // Methods
    checkForSnap,
    applyMagneticForce,
    getMagneticFeedback,
    snapToNearest,
    snapToZone,
    createCustomZone,
    removeCustomZone,
    animateSnap,
    
    // Utilities
    calculateDistanceToZone,
    findNearbyZones,
  };
};

