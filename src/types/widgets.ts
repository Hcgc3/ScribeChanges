// Widget system TypeScript definitions

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface MagneticZone {
  id: string;
  bounds: Bounds;
  type: 'corner' | 'edge' | 'custom';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'center';
  snapDistance: number;
  priority: number;
  active: boolean;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Position;
  currentPosition: Position;
  offset: Position;
  velocity: Position;
  momentum: boolean;
}

export interface WidgetState {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  visible: boolean;
  pinned: boolean;
  minimized: boolean;
  zIndex: number;
  dragState: DragState;
  snapZone: MagneticZone | null;
  lastUpdated: Date;
}

export type WidgetType = 
  | 'media-controls'
  | 'editing-tools'
  | 'properties'
  | 'quick-actions'
  | 'file-browser'
  | 'settings'
  | 'help';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  icon: string;
  defaultPosition: Position;
  defaultSize: Size;
  minSize: Size;
  maxSize?: Size;
  resizable: boolean;
  collapsible: boolean;
  closable: boolean;
  persistent: boolean;
  zIndex: number;
}

export interface WidgetProps {
  widget: WidgetState;
  config: WidgetConfig;
  onPositionChange: (id: string, position: Position) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onPinChange: (id: string, pinned: boolean) => void;
  onMinimizeChange: (id: string, minimized: boolean) => void;
  onClose?: (id: string) => void;
  children: React.ReactNode;
}

export interface MagneticPhysics {
  snapDistance: number;
  snapStrength: number;
  dampening: number;
  momentum: boolean;
  momentumDecay: number;
  collisionDetection: boolean;
  boundaryConstraints: boolean;
  smoothTransitions: boolean;
  transitionDuration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface CollisionInfo {
  hasCollision: boolean;
  collidingWidgets: string[];
  suggestedPosition?: Position;
  avoidanceVector?: Position;
}

export interface WidgetLayout {
  viewport: Size;
  widgets: Record<string, WidgetState>;
  magneticZones: MagneticZone[];
  physics: MagneticPhysics;
  collisions: Record<string, CollisionInfo>;
}

export interface WidgetPreferences {
  userId?: string;
  layouts: Record<string, WidgetLayout>;
  defaultLayout: string;
  autoSave: boolean;
  saveInterval: number;
  version: string;
}

// Widget-specific content types
export interface MediaControlsData {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  tempo: number;
  loop: boolean;
  shuffle: boolean;
}

export interface EditingToolsData {
  selectedTool: string;
  availableTools: string[];
  toolSettings: Record<string, any>;
  shortcuts: Record<string, string>;
}

export interface PropertiesData {
  selectedElement: any;
  properties: Record<string, any>;
  editableProperties: string[];
  validationRules: Record<string, any>;
}

export interface QuickActionsData {
  actions: QuickAction[];
  recentActions: string[];
  favoriteActions: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  category: string;
  action: () => void;
  disabled?: boolean;
  tooltip?: string;
}

// Event types
export interface WidgetEvent {
  type: 'drag-start' | 'drag-move' | 'drag-end' | 'snap' | 'collision' | 'pin' | 'hide' | 'show' | 'minimize' | 'restore';
  widgetId: string;
  position?: Position;
  data?: any;
  timestamp: Date;
}

export interface DragEvent extends WidgetEvent {
  type: 'drag-start' | 'drag-move' | 'drag-end';
  startPosition: Position;
  currentPosition: Position;
  delta: Position;
  velocity: Position;
}

export interface SnapEvent extends WidgetEvent {
  type: 'snap';
  snapZone: MagneticZone;
  snapPosition: Position;
  snapStrength: number;
}

export interface CollisionEvent extends WidgetEvent {
  type: 'collision';
  collidingWidgets: string[];
  collisionBounds: Bounds;
  resolution: 'avoid' | 'overlap' | 'stack';
}

// Hook types
export interface UseDragOptions {
  onDragStart?: (event: DragEvent) => void;
  onDragMove?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  constraints?: Bounds;
  snapToGrid?: boolean;
  gridSize?: number;
  momentum?: boolean;
}

export interface UseMagneticSnapOptions {
  snapDistance: number;
  snapStrength: number;
  zones: MagneticZone[];
  onSnap?: (event: SnapEvent) => void;
  enabled: boolean;
}

export interface UseCollisionDetectionOptions {
  widgets: Record<string, WidgetState>;
  onCollision?: (event: CollisionEvent) => void;
  resolution: 'avoid' | 'overlap' | 'stack';
  enabled: boolean;
}

// Store types
export interface WidgetStore {
  widgets: Record<string, WidgetState>;
  configs: Record<string, WidgetConfig>;
  layout: WidgetLayout;
  preferences: WidgetPreferences;
  
  // Actions
  addWidget: (config: WidgetConfig, initialState?: Partial<WidgetState>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetState>) => void;
  moveWidget: (id: string, position: Position) => void;
  toggleVisibility: (id: string) => void;
  togglePin: (id: string) => void;
  toggleMinimize: (id: string) => void;
  hideAllWidgets: () => void;
  showAllWidgets: () => void;
  resetLayout: () => void;
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  updatePhysics: (physics: Partial<MagneticPhysics>) => void;
  updateMagneticZones: (zones: MagneticZone[]) => void;
}

