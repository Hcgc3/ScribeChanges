export { default as ScoreViewer } from './components/ScoreViewer.jsx';
export { default as EditControls } from './components/EditControls.jsx';
export { default as DistanceVisualization } from './components/DistanceVisualization.jsx';
export { default as MusicalControlPoint } from './components/MusicalControlPoint.jsx';

export * from './hooks/useZoom.js';
export * from './hooks/usePan.js';
export * from './hooks/useEditMode.js';
export * from './hooks/useMusicalAnalysis.js';
export * from './lib/tonePlayer.js';
export * from './lib/osmdMidiExtractor.js';

// Note: import the styles via side-effect in your app if needed:
// import '@music-editor/score-viewer/styles/score.css';
