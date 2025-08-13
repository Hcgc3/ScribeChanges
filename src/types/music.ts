// Music-related TypeScript definitions

export interface ScoreMetadata {
  title?: string;
  composer?: string;
  arranger?: string;
  copyright?: string;
  keySignature?: string;
  timeSignature?: string;
  tempo?: number;
  duration?: number;
  measures?: number;
  instruments?: string[];
}

export interface ScoreFile {
  id: string;
  name: string;
  path: string;
  type: 'musicxml' | 'midi' | 'mxl';
  size: number;
  lastModified: Date;
  metadata?: ScoreMetadata;
  content?: string | ArrayBuffer;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  tempo: number;
  volume: number;
  loop: boolean;
  loopStart?: number;
  loopEnd?: number;
}

export interface ScoreSelection {
  type: 'note' | 'measure' | 'staff' | 'system' | 'page';
  startMeasure?: number;
  endMeasure?: number;
  startBeat?: number;
  endBeat?: number;
  staffIndex?: number;
  noteIndex?: number;
  voiceIndex?: number;
}

export interface ScoreViewSettings {
  zoom: number;
  pageIndex: number;
  totalPages: number;
  viewMode: 'page' | 'continuous' | 'horizontal';
  showMeasureNumbers: boolean;
  showPageNumbers: boolean;
  autoResize: boolean;
}

export interface EditingAction {
  type: 'note' | 'rest' | 'measure' | 'key' | 'tempo' | 'time';
  target: ScoreSelection;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface UndoRedoState {
  history: EditingAction[];
  currentIndex: number;
  maxHistorySize: number;
}

export interface ExportOptions {
  format: 'musicxml' | 'midi' | 'pdf' | 'png' | 'svg';
  quality?: 'low' | 'medium' | 'high';
  pageRange?: [number, number];
  includeMetadata?: boolean;
  resolution?: number;
}

export interface ImportOptions {
  autoDetectFormat?: boolean;
  preserveFormatting?: boolean;
  mergeParts?: boolean;
  transposeKey?: string;
}

// OSMD-related types
export interface OSMDOptions {
  autoResize: boolean;
  backend: 'svg' | 'canvas';
  drawTitle: boolean;
  drawSubtitle: boolean;
  drawComposer: boolean;
  drawCredits: boolean;
  drawPartNames: boolean;
  drawMeasureNumbers: boolean;
  measureNumberInterval: number;
  pageFormat: 'A4' | 'Letter' | 'Endless';
  pageBackgroundColor: string;
  renderSingleHorizontalStaffline: boolean;
}

export interface ScoreRenderOptions extends OSMDOptions {
  zoom: number;
  responsive: boolean;
  followCursor: boolean;
  cursorColor: string;
}

// Audio-related types
export interface AudioSettings {
  masterVolume: number;
  instrumentVolumes: Record<string, number>;
  reverbLevel: number;
  chorusLevel: number;
  soundFont?: string;
  audioContext?: AudioContext;
}

export interface MetronomeSettings {
  enabled: boolean;
  volume: number;
  sound: 'click' | 'beep' | 'wood';
  accentFirstBeat: boolean;
  countIn: number;
}

// Error types
export interface ScoreError {
  type: 'parse' | 'render' | 'audio' | 'file' | 'network';
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
}

export type ScoreLoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ScoreState {
  file: ScoreFile | null;
  loadingState: ScoreLoadingState;
  error: ScoreError | null;
  metadata: ScoreMetadata | null;
  selection: ScoreSelection | null;
  viewSettings: ScoreViewSettings;
  playbackState: PlaybackState;
  undoRedo: UndoRedoState;
  renderOptions: ScoreRenderOptions;
  audioSettings: AudioSettings;
  metronome: MetronomeSettings;
}

