import { useCallback, useRef, useEffect } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';

export const usePan = () => {
  const {
    panState,
    setPanState,
    startPan,
    // updatePan, // removido: não utilizado
    endPan,
    resetPan,
    editMode,
    viewSettings,
  } = useScoreStore();

  const momentumRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  // Cached dimensions (updated externally via optional setters if desired)
  const contentSizeRef = useRef({ width: 0, height: 0 });
  const viewportSizeRef = useRef({ width: 0, height: 0 });

  // Public setter helpers (optional usage by component)
  const setContentSize = useCallback(
    (w, h) => {
      contentSizeRef.current = { width: w || 0, height: h || 0 };
    },
    []
  );
  const setViewportSize = useCallback(
    (w, h) => {
      viewportSizeRef.current = { width: w || 0, height: h || 0 };
    },
    []
  );

  // Compute clamped pan ensuring content keeps at least a margin in view
  const clampPan = useCallback(
    (x, y) => {
      const zoom = viewSettings.zoom || 1;
      const contentW = contentSizeRef.current.width * zoom;
      const contentH = contentSizeRef.current.height * zoom;
      const vpW = viewportSizeRef.current.width || window.innerWidth;
      const vpH = viewportSizeRef.current.height || window.innerHeight;
      const margin = 64; // px leeway before hard edge

      // If content smaller than viewport, center automatically
      let minX, maxX, minY, maxY;
      if (contentW <= vpW) {
        const centeredX = Math.round((vpW - contentW) / 2);
        minX = maxX = centeredX;
      } else {
        minX = Math.min(margin, vpW - contentW - margin);
        maxX = Math.max(vpW - contentW - margin, margin); // ensure min<max ordering handled below
        if (minX > maxX) [minX, maxX] = [maxX, minX];
      }
      if (contentH <= vpH) {
        const centeredY = Math.round((vpH - contentH) / 2);
        minY = maxY = centeredY;
      } else {
        minY = Math.min(margin, vpH - contentH - margin);
        maxY = Math.max(vpH - contentH - margin, margin);
        if (minY > maxY) [minY, maxY] = [maxY, minY];
      }

      const clampedX = Math.min(Math.max(x, minX), maxX);
      const clampedY = Math.min(Math.max(y, minY), maxY);
      return { x: clampedX, y: clampedY };
    },
    [viewSettings.zoom]
  );

  // Enhanced pan with momentum and boundaries
  const enhancedUpdatePan = useCallback(
    (x, y) => {
      if (!panState.isDragging || editMode.isActive) return;
      const now = Date.now();
      const timeDelta = now - lastMoveTimeRef.current;
      lastMoveTimeRef.current = now;
      const deltaX = x - panState.lastX;
      const deltaY = y - panState.lastY;
      if (timeDelta > 0) {
        velocityRef.current.x = (deltaX / timeDelta) * 16;
        velocityRef.current.y = (deltaY / timeDelta) * 16;
      }
      const dampingFactor = 0.95;
      const smoothDeltaX = deltaX * dampingFactor;
      const smoothDeltaY = deltaY * dampingFactor;
      const next = clampPan(
        panState.x + smoothDeltaX,
        panState.y + smoothDeltaY
      );
      setPanState({ x: next.x, y: next.y, lastX: x, lastY: y });
    },
    [panState, editMode.isActive, clampPan, setPanState]
  );

  // Enhanced end pan with momentum
  const enhancedEndPan = useCallback(() => {
    if (!panState.isDragging) return;

    endPan();

    // Apply momentum if velocity is significant
    const velocityThreshold = 0.5;
    const maxMomentum = 100;

    if (
      Math.abs(velocityRef.current.x) > velocityThreshold ||
      Math.abs(velocityRef.current.y) > velocityThreshold
    ) {
      // Clamp momentum to reasonable values
      momentumRef.current.x = Math.max(
        -maxMomentum,
        Math.min(maxMomentum, velocityRef.current.x * 10)
      );
      momentumRef.current.y = Math.max(
        -maxMomentum,
        Math.min(maxMomentum, velocityRef.current.y * 10)
      );

      // Start momentum animation
      const animateMomentum = () => {
        const friction = 0.9;
        momentumRef.current.x *= friction;
        momentumRef.current.y *= friction;

        setPanState((prev) => {
          const next = clampPan(
            prev.x + momentumRef.current.x,
            prev.y + momentumRef.current.y
          );
          return { ...prev, x: next.x, y: next.y };
        });

        // Continue animation if momentum is still significant
        if (
          Math.abs(momentumRef.current.x) > 0.1 ||
          Math.abs(momentumRef.current.y) > 0.1
        ) {
          animationFrameRef.current = requestAnimationFrame(animateMomentum);
        } else {
          momentumRef.current = { x: 0, y: 0 };
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateMomentum);
    }

    // Reset velocity
    velocityRef.current = { x: 0, y: 0 };
  }, [panState.isDragging, endPan, clampPan, setPanState]);

  // Smooth pan to clamped position
  const panTo = useCallback(
    (targetX, targetY, duration = 300) => {
      const { x: clampedX, y: clampedY } = clampPan(targetX, targetY);
      const startX = panState.x;
      const startY = panState.y;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentX = startX + (clampedX - startX) * easeOut;
        const currentY = startY + (clampedY - startY) * easeOut;
        setPanState((prev) => ({ ...prev, x: currentX, y: currentY }));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    },
    [panState.x, panState.y, clampPan, setPanState]
  );

  // Center content precisely considering zoom & dimensions
  const centerContent = useCallback(() => {
    const zoom = viewSettings.zoom || 1;
    const contentW = contentSizeRef.current.width * zoom;
    const contentH = contentSizeRef.current.height * zoom;
    const vpW = viewportSizeRef.current.width || window.innerWidth;
    const vpH = viewportSizeRef.current.height || window.innerHeight;
    const targetX = Math.round((vpW - contentW) / 2);
    const targetY = Math.round((vpH - contentH) / 2);
    panTo(targetX, targetY, 250);
  }, [panTo, viewSettings.zoom]);

  // Handle mouse events with enhanced functionality
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button === 0 && !editMode.isActive) {
        e.preventDefault();

        // Cancel any ongoing momentum animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          momentumRef.current = { x: 0, y: 0 };
        }

        startPan(e.clientX, e.clientY);
        lastMoveTimeRef.current = Date.now();
      }
    },
    [startPan, editMode.isActive]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (panState.isDragging) {
        e.preventDefault();
        enhancedUpdatePan(e.clientX, e.clientY);
      }
    },
    [panState.isDragging, enhancedUpdatePan]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (panState.isDragging) {
        e.preventDefault();
        enhancedEndPan();
      }
    },
    [panState.isDragging, enhancedEndPan]
  );

  // Handle touch events for mobile
  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 1 && !editMode.isActive) {
        const touch = e.touches[0];

        // Cancel any ongoing momentum animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          momentumRef.current = { x: 0, y: 0 };
        }

        startPan(touch.clientX, touch.clientY);
        lastMoveTimeRef.current = Date.now();
      }
    },
    [startPan, editMode.isActive]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (e.touches.length === 1 && panState.isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        enhancedUpdatePan(touch.clientX, touch.clientY);
      }
    },
    [panState.isDragging, enhancedUpdatePan]
  );

  const handleTouchEnd = useCallback(() => {
    if (panState.isDragging) enhancedEndPan();
  }, [panState.isDragging, enhancedEndPan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    panState,
    panTo,
    centerContent,
    resetPan,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setContentSize,
    setViewportSize,
  };
};
