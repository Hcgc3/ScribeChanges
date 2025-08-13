import { useCallback, useRef, useEffect } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';

export const useZoom = () => {
  const { viewSettings, setZoom, panState, setPanState } = useScoreStore();

  const zoomTimeoutRef = useRef(null);
  const lastZoomTimeRef = useRef(0);
  const zoomVelocityRef = useRef(0);

  // Pixel rounding helper (align to device pixel to reduce blurriness while avoiding jumps)
  const roundPx = (v) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(v * dpr) / dpr;
  };

  // Smooth zoom keeping the point under the cursor fixed (transform-origin assumed 0 0 on scaled element)
  const smoothZoom = useCallback((delta, clientX = window.innerWidth / 2, clientY = window.innerHeight / 2) => {
    if (!Number.isFinite(delta) || delta === 0) return;

    const now = Date.now();
    const timeDelta = now - lastZoomTimeRef.current || 16;
    lastZoomTimeRef.current = now;

    // Velocity (normalized to ~60fps)
    const velocity = Math.abs(delta) / Math.max(timeDelta, 16);
    zoomVelocityRef.current = velocity;

    const currentZoom = viewSettings.zoom || 1;
    const minZoom = viewSettings.minZoom ?? 0.25;
    const maxZoom = viewSettings.maxZoom ?? 4.0;
    const baseStep = viewSettings.zoomStep ?? 0.1; // treated as % increment (0.1 = 10%)

    // Dynamic multiplicative factor for perceptually uniform zoom (same feel at any scale)
    const velocityMultiplier = Math.min(Math.max(velocity * 0.12, 0.5), 3.0);
    const stepFactor = 1 + baseStep * velocityMultiplier; // >1
    const zoomDirection = delta > 0 ? 1 : -1;

    // Target zoom (multiplicative) then clamp
    let targetZoom = zoomDirection > 0 ? currentZoom * stepFactor : currentZoom / stepFactor;
    targetZoom = Math.min(maxZoom, Math.max(minZoom, targetZoom));

    // If no effective change after clamping, abort
    if (Math.abs(targetZoom - currentZoom) < 1e-4) return;

    // Content coordinate of cursor before zoom (assuming translation then scale about 0,0)
    // screen = pan + content * zoom  =>  content = (screen - pan) / zoom
    const contentX = (clientX - panState.x) / currentZoom;
    const contentY = (clientY - panState.y) / currentZoom;

    // New pan so that the same content point stays under cursor:
    // client = newPan + content * newZoom  => newPan = client - content * newZoom
    const newPanX = roundPx(clientX - contentX * targetZoom);
    const newPanY = roundPx(clientY - contentY * targetZoom);

    // Apply pan first (so further events base on updated state)
    setPanState({ x: newPanX, y: newPanY });
    setZoom(targetZoom);

    // Momentum (deferred small extra zoom if fast wheel)
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => {
      const v = zoomVelocityRef.current;
      if (v > 2) {
        const momentumFactor = 1 + (baseStep * 0.25) * Math.min(v / 4, 1); // capped extra 25% of base step
        let momentumZoom = zoomDirection > 0 ? targetZoom * momentumFactor : targetZoom / momentumFactor;
        momentumZoom = Math.min(maxZoom, Math.max(minZoom, momentumZoom));
        // Recompute pan to keep cursor stable for momentum step
        const mContentX = (clientX - newPanX) / targetZoom; // same content point
        const mContentY = (clientY - newPanY) / targetZoom;
        const momentumPanX = roundPx(clientX - mContentX * momentumZoom);
        const momentumPanY = roundPx(clientY - mContentY * momentumZoom);
        setPanState({ x: momentumPanX, y: momentumPanY });
        setZoom(momentumZoom);
      }
      zoomVelocityRef.current = 0;
    }, 140);
  }, [viewSettings.zoom, viewSettings.zoomStep, viewSettings.minZoom, viewSettings.maxZoom, setZoom, panState.x, panState.y, setPanState]);

  // Smooth zoom to specific level (animated interpolation, still pixel-stable around center)
  const zoomTo = useCallback((targetZoom, duration = 300, anchorX = window.innerWidth / 2, anchorY = window.innerHeight / 2) => {
    const startZoom = viewSettings.zoom;
    const minZoom = viewSettings.minZoom ?? 0.25;
    const maxZoom = viewSettings.maxZoom ?? 4.0;
    targetZoom = Math.min(maxZoom, Math.max(minZoom, targetZoom));
    if (Math.abs(targetZoom - startZoom) < 1e-6) return;

    const startPanX = panState.x;
    const startPanY = panState.y;
    const contentX = (anchorX - startPanX) / startZoom;
    const contentY = (anchorY - startPanY) / startZoom;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      const currentZoom = startZoom + (targetZoom - startZoom) * easeOut;
      // Recompute pan each frame to keep anchor stable
      const panX = roundPx(anchorX - contentX * currentZoom);
      const panY = roundPx(anchorY - contentY * currentZoom);
      setPanState((prev) => ({ ...prev, x: panX, y: panY }));
      setZoom(currentZoom);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [viewSettings.zoom, viewSettings.minZoom, viewSettings.maxZoom, setZoom, panState.x, panState.y, setPanState]);

  const zoomIn = useCallback(() => {
    const baseStep = viewSettings.zoomStep ?? 0.1;
    zoomTo(viewSettings.zoom * (1 + baseStep * 2));
  }, [viewSettings.zoom, viewSettings.zoomStep, zoomTo]);

  const zoomOut = useCallback(() => {
    const baseStep = viewSettings.zoomStep ?? 0.1;
    zoomTo(viewSettings.zoom / (1 + baseStep * 2));
  }, [viewSettings.zoom, viewSettings.zoomStep, zoomTo]);

  const resetZoom = useCallback(() => {
    zoomTo(1.0, 250);
    setTimeout(() => setPanState({ x: 0, y: 0 }), 150);
  }, [zoomTo, setPanState]);

  const fitToWidth = useCallback((containerWidth, contentWidth = 800) => {
    if (!containerWidth) return;
    const targetZoom = (containerWidth * 0.9) / contentWidth;
    zoomTo(targetZoom, 300);
  }, [zoomTo]);

  const fitToHeight = useCallback((containerHeight, contentHeight = 1100) => {
    if (!containerHeight) return;
    const targetZoom = (containerHeight * 0.9) / contentHeight;
    zoomTo(targetZoom, 300);
  }, [zoomTo]);

  useEffect(() => () => { if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current); }, []);

  return { zoom: viewSettings.zoom, minZoom: viewSettings.minZoom, maxZoom: viewSettings.maxZoom, smoothZoom, zoomTo, zoomIn, zoomOut, resetZoom, fitToWidth, fitToHeight };
};
