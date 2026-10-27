import { useCallback, useEffect, useRef } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';

// Zoom is applied straight to the DOM (sizer size + stage transform), so a wheel
// or pinch gesture never re-renders React or writes to localStorage per frame.
// The store only receives the final value once the gesture settles.
const COMMIT_DELAY_MS = 250;
// While zooming, the stage is a GPU layer that gets scaled as a bitmap; once the
// gesture settles the layer is dropped so the SVG is re-rasterized crisp.
const SETTLE_DELAY_MS = 160;
const ANIMATION_MS = 180;

const zoomStepFactor = () => 1 + (useScoreStore.getState().viewSettings.zoomStep ?? 0.2);

export const useZoom = ({ viewportRef, sizerRef, stageRef, labelRef, baseScale = 1 }) => {
  const zoomRef = useRef(useScoreStore.getState().viewSettings.zoom || 1);
  const baseScaleRef = useRef(baseScale);
  const sizeRef = useRef({ width: 0, height: 0 });
  const settleTimerRef = useRef(null);
  const commitTimerRef = useRef(null);
  const animationRef = useRef(null);
  const pendingRef = useRef(null);

  baseScaleRef.current = baseScale;

  const clamp = useCallback((z) => {
    const { minZoom = 0.25, maxZoom = 4 } = useScoreStore.getState().viewSettings;
    return Math.max(minZoom, Math.min(maxZoom, z));
  }, []);

  const markZooming = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.willChange = 'transform';
    clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      if (stageRef.current) stageRef.current.style.willChange = '';
    }, SETTLE_DELAY_MS);
  }, [stageRef]);

  const commit = useCallback(() => {
    clearTimeout(commitTimerRef.current);
    const { viewSettings, setZoom } = useScoreStore.getState();
    if (Math.abs(viewSettings.zoom - zoomRef.current) > 1e-4) setZoom(zoomRef.current);
  }, []);

  const scheduleCommit = useCallback(() => {
    clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(commit, COMMIT_DELAY_MS);
  }, [commit]);

  // Sets the zoom keeping the content point under `anchor` (client coords) fixed.
  const applyZoom = useCallback((nextZoom, anchor) => {
    const vp = viewportRef.current;
    const sizer = sizerRef.current;
    const stage = stageRef.current;
    const z = clamp(nextZoom);
    const prevScale = zoomRef.current * baseScaleRef.current;
    const scale = z * baseScaleRef.current;
    zoomRef.current = z;
    if (labelRef?.current) labelRef.current.textContent = `${Math.round(z * 100)}%`;
    if (!vp || !sizer || !stage) return;

    const vpRect = vp.getBoundingClientRect();
    const ax = anchor ? anchor.x : vpRect.left + vp.clientWidth / 2;
    const ay = anchor ? anchor.y : vpRect.top + vp.clientHeight / 2;
    const before = stage.getBoundingClientRect();
    const contentX = (ax - before.left) / prevScale;
    const contentY = (ay - before.top) / prevScale;

    const { width, height } = sizeRef.current;
    sizer.style.width = `${width * scale}px`;
    sizer.style.height = `${height * scale}px`;
    stage.style.transform = `scale(${scale})`;

    const after = stage.getBoundingClientRect();
    vp.scrollLeft += after.left + contentX * scale - ax;
    vp.scrollTop += after.top + contentY * scale - ay;
  }, [viewportRef, sizerRef, stageRef, labelRef, clamp]);

  // Wheel/pinch deltas are coalesced so the DOM is touched at most once per frame.
  const zoomBy = useCallback((factor, anchor) => {
    const pending = pendingRef.current;
    if (pending) {
      pending.factor *= factor;
      pending.anchor = anchor;
      return;
    }
    pendingRef.current = { factor, anchor };
    requestAnimationFrame(() => {
      const { factor: f, anchor: a } = pendingRef.current;
      pendingRef.current = null;
      cancelAnimationFrame(animationRef.current);
      markZooming();
      applyZoom(zoomRef.current * f, a);
      scheduleCommit();
    });
  }, [applyZoom, markZooming, scheduleCommit]);

  const zoomTo = useCallback((target, anchor) => {
    cancelAnimationFrame(animationRef.current);
    const start = zoomRef.current;
    const end = clamp(target);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / ANIMATION_MS, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      markZooming();
      applyZoom(start + (end - start) * eased, anchor);
      if (p < 1) animationRef.current = requestAnimationFrame(step);
      else commit();
    };
    animationRef.current = requestAnimationFrame(step);
  }, [applyZoom, clamp, markZooming, commit]);

  const zoomIn = useCallback(() => zoomTo(zoomRef.current * zoomStepFactor()), [zoomTo]);
  const zoomOut = useCallback(() => zoomTo(zoomRef.current / zoomStepFactor()), [zoomTo]);
  const resetZoom = useCallback(() => zoomTo(1), [zoomTo]);

  const fitToWidth = useCallback((gutter = 64) => {
    const vp = viewportRef.current;
    const { width } = sizeRef.current;
    if (!vp || !width) return;
    zoomTo((vp.clientWidth - gutter) / (width * baseScaleRef.current));
  }, [viewportRef, zoomTo]);

  // Re-measure the unscaled stage (after a render or page-size change) and re-apply.
  const refresh = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    sizeRef.current = { width: stage.offsetWidth, height: stage.offsetHeight };
    applyZoom(zoomRef.current);
  }, [stageRef, applyZoom]);

  // Zoom changes coming from elsewhere (e.g. the Quick Actions widget) go through the store.
  useEffect(() => useScoreStore.subscribe((state, prev) => {
    const z = state.viewSettings.zoom;
    if (z !== prev.viewSettings.zoom && Math.abs(z - zoomRef.current) > 1e-4) zoomTo(z);
  }), [zoomTo]);

  useEffect(() => () => {
    clearTimeout(settleTimerRef.current);
    clearTimeout(commitTimerRef.current);
    cancelAnimationFrame(animationRef.current);
  }, []);

  return { getZoom: () => zoomRef.current, zoomBy, zoomTo, zoomIn, zoomOut, resetZoom, fitToWidth, refresh };
};
