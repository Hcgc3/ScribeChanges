import { useCallback, useRef, useEffect } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';

export const usePan = () => {
  const { panState, setPanState, startPan, endPan, resetPan, editMode, viewSettings } = useScoreStore();
  const freezeMode = !!viewSettings?.freezeMode;

  const momentumRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  // Throttle refs for high-frequency pointer moves
  const frameRequestedRef = useRef(false);
  const pendingPointRef = useRef(null);

  const processPendingPan = useCallback(() => {
    frameRequestedRef.current = false;
    if (!pendingPointRef.current) return;
    const { x, y } = pendingPointRef.current;
    pendingPointRef.current = null;

    // Original enhancedUpdatePan logic (inlined for rAF throttle)
    if (!panState.isDragging || editMode.isActive) return;
    const now = Date.now();
    const timeDelta = now - lastMoveTimeRef.current;
    lastMoveTimeRef.current = now;

    const rawDeltaX = x - panState.lastX;
    const rawDeltaY = y - panState.lastY;
    const deltaX = freezeMode ? 0 : rawDeltaX;
    const deltaY = rawDeltaY;

    if (timeDelta > 0) {
      velocityRef.current.x = freezeMode ? 0 : (deltaX / timeDelta) * 16;
      velocityRef.current.y = (deltaY / timeDelta) * 16;
    }

    const dampingFactor = 0.95;
    const smoothDeltaX = deltaX * dampingFactor;
    const smoothDeltaY = deltaY * dampingFactor;

    setPanState({
      x: freezeMode ? panState.x : panState.x + smoothDeltaX,
      y: panState.y + smoothDeltaY,
      lastX: x,
      lastY: y,
    });
  }, [panState, setPanState, editMode.isActive, freezeMode]);

  // Throttled version: accumulates latest pointer position and applies once per frame
  const enhancedUpdatePan = useCallback((x, y) => {
    pendingPointRef.current = { x, y };
    if (!frameRequestedRef.current) {
      frameRequestedRef.current = true;
      requestAnimationFrame(processPendingPan);
    }
  }, [processPendingPan]);

  const enhancedEndPan = useCallback(() => {
    if (!panState.isDragging) return;

    endPan();

    const velocityThreshold = 0.5;
    const maxMomentum = 100;

    if (Math.abs(velocityRef.current.x) > velocityThreshold || Math.abs(velocityRef.current.y) > velocityThreshold) {
      momentumRef.current.x = freezeMode ? 0 : Math.max(-maxMomentum, Math.min(maxMomentum, velocityRef.current.x * 10));
      momentumRef.current.y = Math.max(-maxMomentum, Math.min(maxMomentum, velocityRef.current.y * 10));

      const animateMomentum = () => {
        const friction = 0.92;
        momentumRef.current.x = freezeMode ? 0 : momentumRef.current.x * friction;
        momentumRef.current.y *= friction;

        setPanState((prev) => ({
          ...prev,
          x: freezeMode ? prev.x : prev.x + momentumRef.current.x,
          y: prev.y + momentumRef.current.y,
        }));

        if (Math.abs(momentumRef.current.x) > 0.1 || Math.abs(momentumRef.current.y) > 0.1) {
          animationFrameRef.current = requestAnimationFrame(animateMomentum);
        } else {
          momentumRef.current = { x: 0, y: 0 };
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateMomentum);
    }

    velocityRef.current = { x: 0, y: 0 };
  }, [panState.isDragging, endPan, setPanState, freezeMode]);

  const panTo = useCallback((targetX, targetY, duration = 300) => {
    const startX = panState.x;
    const startY = panState.y;
    const tx = freezeMode ? startX : targetX;
    const ty = targetY;
    const startTime = Date.now();

    if (duration === 0) {
      setPanState((prev) => ({ ...prev, x: tx, y: ty }));
      return;
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentX = startX + (tx - startX) * easeOut;
      const currentY = startY + (ty - startY) * easeOut;
      setPanState((prev) => ({ ...prev, x: currentX, y: currentY }));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [panState.x, panState.y, setPanState, freezeMode]);

  const centerContent = useCallback(() => { panTo(0, 0); }, [panTo]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0 && !editMode.isActive) {
      e.preventDefault();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        momentumRef.current = { x: 0, y: 0 };
      }
      startPan(e.clientX, e.clientY);
      lastMoveTimeRef.current = Date.now();
    }
  }, [startPan, editMode.isActive]);

  const handleMouseMove = useCallback((e) => {
    if (panState.isDragging) {
      e.preventDefault();
      enhancedUpdatePan(e.clientX, e.clientY);
    }
  }, [panState.isDragging, enhancedUpdatePan]);

  const handleMouseUp = useCallback((e) => {
    if (panState.isDragging) {
      e.preventDefault();
      enhancedEndPan();
    }
  }, [panState.isDragging, enhancedEndPan]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1 && !editMode.isActive) {
      const touch = e.touches[0];
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        momentumRef.current = { x: 0, y: 0 };
      }
      startPan(touch.clientX, touch.clientY);
      lastMoveTimeRef.current = Date.now();
    }
  }, [startPan, editMode.isActive]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && panState.isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      enhancedUpdatePan(touch.clientX, touch.clientY);
    }
  }, [panState.isDragging, enhancedUpdatePan]);

  const handleTouchEnd = useCallback(() => {
    if (panState.isDragging) {
      enhancedEndPan();
    }
  }, [panState.isDragging, enhancedEndPan]);

  useEffect(() => () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); }, []);

  return { panState, panTo, centerContent, resetPan, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd };
};
