import { useCallback, useRef, useEffect } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';

export const useZoom = () => {
  const { viewSettings, setZoom, panState, setPanState } = useScoreStore();

  const zoomTimeoutRef = useRef(null);
  const lastZoomTimeRef = useRef(0);
  const zoomVelocityRef = useRef(0);
  const rafPendingRef = useRef(false);
  const pendingZoomRef = useRef(null);

  const applyPendingZoom = useCallback(() => {
    rafPendingRef.current = false;
    if (!pendingZoomRef.current) return;
    const { delta, centerX, centerY } = pendingZoomRef.current;
    pendingZoomRef.current = null;

    // Original smoothZoom logic (below) executes once per animation frame
    const now = Date.now();
    const timeDelta = now - lastZoomTimeRef.current;
    lastZoomTimeRef.current = now;

    const velocity = Math.abs(delta) / Math.max(timeDelta, 16);
    zoomVelocityRef.current = velocity;

    const baseStep = viewSettings.zoomStep ?? 0.1;
    const velocityMultiplier = Math.min(Math.max(velocity * 0.1, 0.5), 3.0);
    const dynamicStep = baseStep * velocityMultiplier;

    const zoomDirection = delta > 0 ? 1 : -1;
    const newZoom = Math.max(
      viewSettings.minZoom ?? 0.25,
      Math.min(viewSettings.maxZoom ?? 4.0, viewSettings.zoom + dynamicStep * zoomDirection)
    );

    if (centerX !== 0 || centerY !== 0) {
      const zoomRatio = newZoom / viewSettings.zoom;
      const offsetX = ((centerX - window.innerWidth / 2) * (1 - zoomRatio)) / newZoom;
      const offsetY = ((centerY - window.innerHeight / 2) * (1 - zoomRatio)) / newZoom;
      setPanState({ x: panState.x + offsetX, y: panState.y + offsetY });
    }

    setZoom(newZoom);

    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);

    zoomTimeoutRef.current = setTimeout(() => {
      if (zoomVelocityRef.current > 2) {
        const momentumDelta = zoomDirection * dynamicStep * 0.3;
        const momentumZoom = Math.max(
          viewSettings.minZoom ?? 0.25,
          Math.min(viewSettings.maxZoom ?? 4.0, newZoom + momentumDelta)
        );
        setZoom(momentumZoom);
      }
      zoomVelocityRef.current = 0;
    }, 150);
  }, [viewSettings.zoom, viewSettings.zoomStep, viewSettings.minZoom, viewSettings.maxZoom, setZoom, panState, setPanState]);

  // Throttled smoothZoom: coalesces rapid wheel/pinch deltas into one per frame
  const smoothZoom = useCallback((delta, centerX = 0, centerY = 0) => {
    pendingZoomRef.current = { delta, centerX, centerY };
    if (!rafPendingRef.current) {
      rafPendingRef.current = true;
      requestAnimationFrame(applyPendingZoom);
    }
  }, [applyPendingZoom]);

  const zoomTo = useCallback((targetZoom, duration = 300) => {
    const startZoom = viewSettings.zoom;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentZoom = startZoom + (targetZoom - startZoom) * easeOut;
      setZoom(currentZoom);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [viewSettings.zoom, setZoom]);

  const zoomIn = useCallback(() => {
    const step = (viewSettings.zoomStep ?? 0.1) * 2;
    const targetZoom = Math.min(viewSettings.maxZoom ?? 4.0, (viewSettings.zoom ?? 1) + step);
    zoomTo(targetZoom);
  }, [viewSettings.zoom, viewSettings.zoomStep, viewSettings.maxZoom, zoomTo]);

  const zoomOut = useCallback(() => {
    const step = (viewSettings.zoomStep ?? 0.1) * 2;
    const targetZoom = Math.max(viewSettings.minZoom ?? 0.25, (viewSettings.zoom ?? 1) - step);
    zoomTo(targetZoom);
  }, [viewSettings.zoom, viewSettings.zoomStep, viewSettings.minZoom, zoomTo]);

  const resetZoom = useCallback(() => {
    zoomTo(1.0);
    setTimeout(() => setPanState({ x: 0, y: 0 }), 150);
  }, [zoomTo, setPanState]);

  const fitToWidth = useCallback((containerWidth, contentWidth = 800) => {
    const targetZoom = Math.min(
      viewSettings.maxZoom ?? 4.0,
      Math.max(viewSettings.minZoom ?? 0.25, (containerWidth * 0.9) / contentWidth)
    );
    zoomTo(targetZoom);
  }, [viewSettings.minZoom, viewSettings.maxZoom, zoomTo]);

  const fitToHeight = useCallback((containerHeight, contentHeight = 1100) => {
    const targetZoom = Math.min(
      viewSettings.maxZoom ?? 4.0,
      Math.max(viewSettings.minZoom ?? 0.25, (containerHeight * 0.9) / contentHeight)
    );
    zoomTo(targetZoom);
  }, [viewSettings.minZoom, viewSettings.maxZoom, zoomTo]);

  useEffect(() => () => { if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current); }, []);

  return { zoom: viewSettings.zoom, minZoom: viewSettings.minZoom, maxZoom: viewSettings.maxZoom, smoothZoom, zoomTo, zoomIn, zoomOut, resetZoom, fitToWidth, fitToHeight };
};
