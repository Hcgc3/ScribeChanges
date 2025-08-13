// Global application TypeScript definitions

import { ScoreState } from './music';
import { WidgetStore } from './widgets';

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  language: string;
  autoSave: boolean;
  autoSaveInterval: number;
  showWelcomeScreen: boolean;
  enableAnimations: boolean;
  enableSounds: boolean;
  enableHapticFeedback: boolean;
  enableKeyboardShortcuts: boolean;
  debugMode: boolean;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface UIState {
  theme: Theme;
  isFullscreen: boolean;
  sidebarOpen: boolean;
  modalStack: string[];
  activeModal: string | null;
  viewport: ViewportSize;
  headerVisible: boolean;
  loading: boolean;
  error: AppError | null;
  notifications: Notification[];
  settings: AppSettings;
}

export interface AppError {
  id: string;
  type: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  dismissible: boolean;
  actions?: ErrorAction[];
}

export interface ErrorAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
}

export interface FileState {
  currentFile: string | null;
  recentFiles: RecentFile[];
  fileHistory: FileHistoryEntry[];
  uploadProgress: Record<string, number>;
  downloadProgress: Record<string, number>;
}

export interface RecentFile {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
  thumbnail?: string;
  metadata?: any;
}

export interface FileHistoryEntry {
  id: string;
  action: 'open' | 'save' | 'export' | 'import' | 'create' | 'delete';
  fileName: string;
  filePath: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: string;
  description: string;
  category: string;
  enabled: boolean;
  global?: boolean;
}

export interface HotkeyConfig {
  shortcuts: KeyboardShortcut[];
  enabled: boolean;
  preventDefault: boolean;
  stopPropagation: boolean;
}

export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  fps: number;
  audioLatency: number;
  lastUpdated: Date;
}

export interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: Date;
  sessionId: string;
  userId?: string;
}

export interface UserPreferences {
  userId?: string;
  settings: AppSettings;
  shortcuts: KeyboardShortcut[];
  recentFiles: RecentFile[];
  favoriteActions: string[];
  customTheme?: CustomTheme;
  version: string;
  lastSync: Date;
}

export interface CustomTheme {
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

// Store interfaces
export interface AppStore {
  // State
  ui: UIState;
  files: FileState;
  preferences: UserPreferences;
  performance: PerformanceMetrics;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleFullscreen: () => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId?: string) => void;
  setViewport: (size: ViewportSize) => void;
  setHeaderVisible: (visible: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addRecentFile: (file: RecentFile) => void;
  removeRecentFile: (id: string) => void;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  trackEvent: (event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>) => void;
}

// Combined store type
export interface RootStore {
  app: AppStore;
  score: ScoreState;
  widgets: WidgetStore;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  overlay?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  description?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type EventHandler<T = any> = (event: T) => void;

export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_API_URL?: string;
  VITE_ANALYTICS_ID?: string;
  VITE_SENTRY_DSN?: string;
  VITE_DEBUG?: string;
}

declare global {
  interface Window {
    __APP_VERSION__: string;
    __BUILD_TIME__: string;
    __COMMIT_HASH__: string;
  }
}

export {};

