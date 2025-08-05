import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Button } from '@/components/ui/button.jsx';
import { X, Maximize2 } from 'lucide-react';

/**
 * Componente de partitura em modo fullscreen
 */
const FullscreenSheetMusic = ({ 
  musicXML, 
  currentTime = 0, 
  onCursorNote,
  onOSMDReady,
  onExitFullscreen,
  enableKeyboardShortcuts = true,
  className = ""
}) => {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Configurações otimizadas para fullscreen
  const fullscreenOSMDOptions = {
    autoResize: true,
    backend: 'svg',
    renderSingleHorizontalStaffline: false,
    
    // Layout otimizado para fullscreen
    pageFormat: 'Endless',
    pageTopMargin: 5,
    pageBottomMargin: 5,
    pageLeftMargin: 5,
    pageRightMargin: 5,
    
    // Espaçamento otimizado para tela cheia
    spacingBetweenNotes: 1.5,
    spacingBetweenTextLines: 0.5,
    spacingBetweenSystems: 10.0,
    spacingBetweenStaves: 8.0,
    
    // Configurações de compasso para fullscreen
    minimumMeasureWidth: 120,
    maximumMeasureWidth: 400,
    measureNumberLabelHeight: 3.0,
    
    // Tipografia escalável para fullscreen
    defaultFontFamily: 'Times New Roman, serif',
    defaultFontSize: 14,
    titleFontSize: 24,
    subtitleFontSize: 18,
    composerFontSize: 14,
    
    // Elementos visuais otimizados
    drawTitle: true,
    drawSubtitle: true,
    drawComposer: true,
    drawLyricist: true,
    drawPartNames: true,
    drawMeasureNumbers: true,
    drawCredits: false,
    drawMetronomeMarks: true,
    drawTimeSignatures: true,
    drawKeySignatures: true,
    drawFingerings: true,
    
    // Configurações específicas para fullscreen
    compactMode: false,
    pageBackgroundColor: '#FFFFFF',
    systemLeftMargin: 20,
    systemRightMargin: 20,
    systemTopMargin: 15,
    systemBottomMargin: 15,
  };

  // Monitorar mudanças de dimensão da janela
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          if (onExitFullscreen) {
            onExitFullscreen();
          }
          break;
        case 'F11':
          e.preventDefault();
          // Permitir que o navegador gerencie F11
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, onExitFullscreen]);

  // Inicializar OSMD
  useEffect(() => {
    if (!musicXML || !containerRef.current || isInitialized) return;
    
    setIsLoading(true);
    setError(null);

    const initializeOSMD = async () => {
      try {
        // Limpar container anterior
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Criar nova instância OSMD com configurações de fullscreen
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, fullscreenOSMDOptions);

        // Carregar e renderizar MusicXML
        await osmdRef.current.load(musicXML);
        await osmdRef.current.render();
        
        // Mostrar cursor
        if (osmdRef.current.cursor) {
          osmdRef.current.cursor.show();
        }

        // Callback quando OSMD está pronto
        if (onOSMDReady) {
          onOSMDReady(osmdRef.current);
        }

        setIsInitialized(true);
        setIsLoading(false);
        console.log('OSMD fullscreen inicializado com sucesso');
      } catch (err) {
        console.error('Erro ao carregar MusicXML em fullscreen:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeOSMD();
  }, [musicXML, isInitialized]);

  // Re-renderizar quando as dimensões mudam
  useEffect(() => {
    if (osmdRef.current && isInitialized && dimensions.width > 0) {
      try {
        osmdRef.current.render();
      } catch (error) {
        console.warn('Erro ao re-renderizar em fullscreen:', error);
      }
    }
  }, [dimensions, isInitialized]);

  // Atualizar posição do cursor baseado no tempo atual
  useEffect(() => {
    if (!osmdRef.current || !osmdRef.current.cursor || !isInitialized || currentTime < 0) return;

    try {
      const cursor = osmdRef.current.cursor;
      
      // Resetar cursor
      cursor.reset();
      
      // Simular movimento do cursor baseado no tempo
      const totalSteps = Math.floor(currentTime * 2); // 2 passos por segundo
      
      for (let i = 0; i < totalSteps && !cursor.iterator.endReached; i++) {
        cursor.next();
      }
      
      cursor.show();
      
      // Callback com informações da nota atual
      if (onCursorNote) {
        const notes = cursor.NotesUnderCursor();
        if (notes && notes.length > 0) {
          onCursorNote({
            note: notes[0],
            timestamp: currentTime
          });
        }
      }
    } catch (error) {
      console.warn('Erro ao atualizar cursor em fullscreen:', error);
    }
  }, [currentTime, isInitialized, onCursorNote]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        osmdRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-red-600 text-lg mb-4 text-center">
            Erro ao carregar partitura em fullscreen
          </div>
          <div className="text-gray-600 text-sm text-center mb-6">
            {error}
          </div>
          <div className="flex justify-center">
            <Button onClick={onExitFullscreen} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Sair do Fullscreen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-white z-40 ${className}`}>
      {/* Indicador de carregamento */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-blue-600 text-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            Carregando partitura em fullscreen...
          </div>
        </div>
      )}
      
      {/* Botão de saída discreto */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExitFullscreen}
        className="absolute top-4 right-4 z-50 bg-black bg-opacity-20 hover:bg-black hover:bg-opacity-40 text-white border-0"
        title="Sair do Fullscreen (ESC)"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Container da partitura fullscreen */}
      <div 
        ref={containerRef} 
        className="w-full h-full overflow-auto"
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #fefefe 0%, #f8f9fa 100%)'
        }}
      />

      {/* Indicador de modo fullscreen */}
      {isInitialized && (
        <div className="absolute bottom-4 left-4 z-50">
          <div className="bg-black bg-opacity-60 text-white text-xs px-3 py-2 rounded-full flex items-center gap-2">
            <Maximize2 className="w-3 h-3" />
            Modo Fullscreen
            <span className="text-gray-300">•</span>
            <span className="text-gray-300">ESC para sair</span>
          </div>
        </div>
      )}

      {/* Informações de dimensão (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 z-50">
          <div className="bg-black bg-opacity-60 text-white text-xs px-3 py-2 rounded-full">
            {dimensions.width} × {dimensions.height}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenSheetMusic;

