import React, { useEffect } from 'react';
import Header from './components/layout/Header';
import { ScoreViewer } from '@music-editor/score-viewer';
import WidgetManager from './components/layout/WidgetManager';
import FormattingPanel from './components/controls/FormattingPanel';
import PalettePanel from './components/controls/PalettePanel';
import NewScoreDialog from './components/layout/NewScoreDialog';
import NoteInputToolbar from './components/controls/NoteInputToolbar';
import { useAppStore } from './lib/stores/app-store';
import { useScoreStore } from './lib/stores/score-store';
import './App.css';

function App() {
  const { 
    initialize, 
    theme, 
    header,
    getScoreAreaHeight,
    handleKeyboardShortcut,
    cleanup 
  } = useAppStore();
  
  // Narrow selections: the score store changes constantly (playback time, loading state)
  const initializeScore = useScoreStore((s) => s.initialize);
  const file = useScoreStore((s) => s.file);
  const formattingOpen = useAppStore((s) => s.modals.formatting);
  const palettesOpen = useScoreStore((s) => s.palettesOpen);

  // Initialize app
  useEffect(() => {
    initialize();
    initializeScore();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initialize, initializeScore, cleanup]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      handleKeyboardShortcut(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyboardShortcut]);

  // Calculate dynamic styles
  const scoreAreaHeight = getScoreAreaHeight();
  const headerVisible = header.isVisible || header.isHovered;

  return (
    <div className={`app min-h-screen bg-background text-foreground ${theme}`}>
      {/* Dynamic Header */}
      <Header />

      {/* Main Content Area */}
      <main 
        className="relative transition-all duration-300 ease-in-out"
        style={{
          marginTop: headerVisible ? `${header.height ?? 64}px` : '0px',
          height: `${scoreAreaHeight}px`,
        }}
      >
        {/* Score Viewer - Full area usage */}
        <div className="score-container h-full w-full relative">
          <ScoreViewer onCreateNew={() => useAppStore.getState().openModal('newScore')} />
        </div>

        {file && <NoteInputToolbar />}
        {file && formattingOpen && <FormattingPanel />}
        {file && palettesOpen && <PalettePanel />}
        <NewScoreDialog />

        {/* Widgets apenas depois de ficheiro carregado */}
        {file && (
          <div className="widgets-overlay absolute inset-0 pointer-events-none">
            <WidgetManager />
          </div>
        )}
      </main>

      {/* Debug Info - Development only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50 pointer-events-none">
          <div>Header: {header.isVisible ? 'Visible' : 'Hidden'} | Hovered: {header.isHovered ? 'Yes' : 'No'} | Pinned: {header.isPinned ? 'Yes' : 'No'}</div>
          <div>Score Height: {scoreAreaHeight}px | Theme: {theme}</div>
        </div>
      )}
    </div>
  );
}

export default App;

