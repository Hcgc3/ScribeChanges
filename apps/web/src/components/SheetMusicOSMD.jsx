import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

/**
 * Configurações avançadas de renderização
 */
const createVisualSettings = (customSettings = {}) => ({
  // Qualidade de renderização
  autoResize: true,
  backend: 'svg',
  renderSingleHorizontalStaffline: false,
  
  // Layout e margens
  pageFormat: 'A4_P',
  pageTopMargin: 20,
  pageBottomMargin: 15,
  pageLeftMargin: 15,
  pageRightMargin: 10,
  
  // Espaçamento
  spacingBetweenNotes: 1.0,
  spacingBetweenTextLines: 0.35,
  spacingBetweenSystems: 7.0,
  spacingBetweenStaves: 6.0,
  
  // Configurações de compasso
  minimumMeasureWidth: 80,
  maximumMeasureWidth: 200,
  measureNumberLabelHeight: 2.0,
  
  // Tipografia
  defaultFontFamily: 'Times New Roman, serif',
  defaultFontSize: 10.5,
  titleFontSize: 16,
  subtitleFontSize: 12,
  composerFontSize: 10,
  
  // Elementos visuais
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
  
  // Configurações avançadas
  compactMode: false,
  pageBackgroundColor: '#FFFFFF',
  systemLeftMargin: 10,
  systemRightMargin: 5,
  systemTopMargin: 8,
  systemBottomMargin: 8,
  
  // Sobrescrever com configurações customizadas
  ...customSettings
});

/**
 * Componente principal SheetMusicOSMD
 */
const SheetMusicOSMD = ({ 
  musicXML, 
  currentTime = 0, 
  onCursorNote,
  customSettings = {},
  enableAdvancedSpacing = true,
  zoomLevel = 1.0,
  onLayoutOptimized,
  onOSMDReady
}) => {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Configurações otimizadas de OSMD
  const osmdOptions = React.useMemo(() => 
    createVisualSettings(customSettings), [customSettings]);

  /**
   * Inicializa e carrega OSMD
   */
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

        // Criar nova instância OSMD
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, osmdOptions);

        // Carregar e renderizar MusicXML
        await osmdRef.current.load(musicXML);
        await osmdRef.current.render();
        
        // Mostrar cursor
        if (osmdRef.current.cursor) {
          osmdRef.current.cursor.show();
        }

        // Aplicar zoom se necessário
        if (zoomLevel !== 1.0) {
          osmdRef.current.zoom = zoomLevel;
        }

        // Callback de layout otimizado
        if (onLayoutOptimized) {
          const layoutData = {
            measures: osmdRef.current.Sheet?.SourceMeasures?.length || 0,
            systems: osmdRef.current.GraphicSheet?.MusicSystems?.length || 0,
            pages: osmdRef.current.GraphicSheet?.MusicPages?.length || 1
          };
          onLayoutOptimized(layoutData);
        }

        // Callback quando OSMD está pronto
        if (onOSMDReady) {
          onOSMDReady(osmdRef.current);
        }

        setIsInitialized(true);
        setIsLoading(false);
        console.log('OSMD inicializado com sucesso');
      } catch (err) {
        console.error('Erro ao carregar MusicXML:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeOSMD();
  }, [musicXML]);

  /**
   * Atualiza zoom quando necessário
   */
  useEffect(() => {
    if (osmdRef.current && isInitialized && zoomLevel > 0) {
      try {
        osmdRef.current.zoom = zoomLevel;
        osmdRef.current.render();
      } catch (error) {
        console.warn('Erro ao aplicar zoom:', error);
      }
    }
  }, [zoomLevel, isInitialized]);

  /**
   * Atualiza posição do cursor baseado no tempo atual
   */
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
      console.warn('Erro ao atualizar cursor:', error);
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
      <div className="w-full h-full bg-gray-50 flex items-center justify-center flex-col p-5">
        <div className="text-red-600 text-base mb-2">
          Erro ao carregar partitura
        </div>
        <div className="text-gray-600 text-sm text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative overflow-auto">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-blue-600 text-base flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            Carregando partitura...
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-96"
      />
    </div>
  );
};

export default SheetMusicOSMD;

