import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

/**
 * Componente avançado SheetMusicOSMD - Integração progressiva da complexidade
 * Baseado no SheetMusicOSMD funcional + recursos avançados incrementais
 */
const AdvancedSheetMusicOSMD = ({ 
  musicXML, 
  currentTime = 0, 
  onCursorNote,
  customSettings = {},
  enableAdvancedSpacing = true,
  zoomLevel = 1.0,
  onLayoutOptimized,
  onOSMDReady,
  onError,
  // Novos props avançados - STEP 1
  enableSelection = false, // Desabilitado por padrão para debug
  enableOSMNavigation = false, // Desabilitado por padrão para debug
  onSelectionChange,
  measureNumber,
  pageIndex,
  isPlaying = false,
  playbackState,
  playbackData,
  onMeasureClick,
  onOSMDClick,
  onTimeUpdate,
  onPageChange,
  onMagneticData,
  onMagneticMode
}) => {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Estados avançados - STEP 1: Adicionar sem usar ainda
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [viewportTransform, setViewportTransform] = useState({ 
    scale: 1.0, 
    translateX: 0, 
    translateY: 0 
  });
  
  // Estados de seleção - ainda não utilizados
  const [selectionActive, setSelectionActive] = useState(false);
  const [selectionArea, setSelectionArea] = useState({ 
    x: 0, y: 0, width: 0, height: 0 
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedMeasures, setSelectedMeasures] = useState([]);

  // Configurações progressivamente mais avançadas - STEP 2
  const osmdOptions = React.useMemo(() => {
    // Configurações base que funcionam
    const baseConfig = {
      autoResize: true,
      backend: 'svg',
      renderSingleHorizontalStaffline: false,
      pageFormat: 'A4_P', // Manter A4_P por enquanto, não usar 'Endless' ainda
      pageTopMargin: 20,
      pageBottomMargin: 15,
      pageLeftMargin: 15,
      pageRightMargin: 10,
      spacingBetweenNotes: 1.0,
      spacingBetweenTextLines: 0.35,
      spacingBetweenSystems: 7.0,
      spacingBetweenStaves: 6.0,
      minimumMeasureWidth: 80,
      maximumMeasureWidth: 200,
      measureNumberLabelHeight: 2.0,
      defaultFontFamily: 'Times New Roman, serif',
      defaultFontSize: 10.5,
      titleFontSize: 16,
      subtitleFontSize: 12,
      composerFontSize: 10,
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
      compactMode: false,
      pageBackgroundColor: '#FFFFFF',
      systemLeftMargin: 10,
      systemRightMargin: 5,
      systemTopMargin: 8,
      systemBottomMargin: 8
    };

    // STEP 2: Adicionar melhorias avançadas graduais
    const advancedConfig = enableAdvancedSpacing ? {
      spacingBetweenNotes: 1.1, // Ligeiramente melhor
      spacingBetweenSystems: 7.5,
      minimumMeasureWidth: 90,
      maximumMeasureWidth: 220
    } : {};

    return {
      ...baseConfig,
      ...advancedConfig,
      ...customSettings
    };
  }, [customSettings, enableAdvancedSpacing]);

  /**
   * Inicializa e carrega OSMD - Cópia do SheetMusicOSMD
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

        // STEP 3: Adicionar eventos de click avançados
        setupClickEvents();

        // STEP 6: Gerar dados magnéticos básicos
        generateMagneticData();

        setIsInitialized(true);
        setIsLoading(false);
        console.log('OSMD avançado (versão incremental) inicializado com sucesso');
      } catch (err) {
        console.error('Erro ao carregar MusicXML:', err);
        setError(err.message);
        if (onError) {
          onError(err);
        }
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
   * STEP 4: Navegação por compasso (versão básica)
   */
  useEffect(() => {
    if (!osmdRef.current || !isInitialized || typeof measureNumber !== 'number') return;

    try {
      const cursor = osmdRef.current.cursor;
      if (cursor) {
        cursor.reset();
        
        // Navegar para o compasso especificado
        for (let i = 0; i < measureNumber && !cursor.iterator.endReached; i++) {
          cursor.next();
        }
        
        cursor.show();
        console.log(`Navegou para compasso ${measureNumber}`);
      }
    } catch (error) {
      console.warn('Erro na navegação por compasso:', error);
    }
  }, [measureNumber, isInitialized]);

  /**
   * STEP 5: Atualização de tempo de playback
   */
  useEffect(() => {
    if (!isInitialized || !onTimeUpdate) return;

    // Simular atualização de tempo baseado no estado de playback
    if (isPlaying && playbackData) {
      const interval = setInterval(() => {
        onTimeUpdate(Date.now());
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackData, onTimeUpdate, isInitialized]);

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

  /**
   * STEP 3: Configura eventos de click avançados (versão segura)
   */
  const setupClickEvents = useCallback(() => {
    if (!containerRef.current || !osmdRef.current) return;

    const handleContainerClick = (e) => {
      try {
        // Callback genérico de click
        if (onOSMDClick) {
          const rect = containerRef.current.getBoundingClientRect();
          const clickPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
          onOSMDClick(clickPos, e);
        }

        // Detectar click em compasso (versão básica)
        if (onMeasureClick && osmdRef.current) {
          // Implementação básica - pode ser melhorada depois
          const measureIndex = Math.floor(Math.random() * 10); // Placeholder
          onMeasureClick(measureIndex, e);
        }
      } catch (error) {
        console.warn('Erro no evento de click:', error);
      }
    };

    containerRef.current.addEventListener('click', handleContainerClick);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleContainerClick);
      }
    };
  }, [onOSMDClick, onMeasureClick]);

  /**
   * STEP 6: Gera dados magnéticos básicos
   */
  const generateMagneticData = useCallback(() => {
    if (!osmdRef.current || !onMagneticData) return;

    try {
      const magneticData = {
        measures: osmdRef.current.Sheet?.SourceMeasures?.length || 0,
        systems: osmdRef.current.GraphicSheet?.MusicSystems?.length || 0,
        pages: osmdRef.current.GraphicSheet?.MusicPages?.length || 1,
        tempo: 120, // Placeholder
        timeSignature: '4/4', // Placeholder
        keySignature: 'C', // Placeholder
        totalDuration: 60000 // Placeholder em ms
      };

      onMagneticData(magneticData);
      console.log('Dados magnéticos gerados:', magneticData);
    } catch (error) {
      console.warn('Erro ao gerar dados magnéticos:', error);
    }
  }, [onMagneticData]);

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
          Erro ao carregar partitura avançada
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
            Carregando partitura avançada...
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

export default AdvancedSheetMusicOSMD;
