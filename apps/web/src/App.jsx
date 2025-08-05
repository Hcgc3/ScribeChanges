import React, { useState, useEffect } from 'react'
import { Button } from '@ui/button.jsx'
import { Badge } from '@ui/badge.jsx'
import { Music, Maximize2, Minimize2, Settings, HelpCircle, Edit, Hash, Clock, Brain, Zap, Gauge } from 'lucide-react'
import AdvancedSheetMusicOSMD from './components/AdvancedSheetMusicOSMD.jsx' // Versão funcional incremental
import FullscreenSheetMusic from './components/FullscreenSheetMusic.jsx'
import MagneticPlaybackControls from './components/MagneticPlaybackControls.jsx'
import MagneticNavigationControls from './components/MagneticNavigationControls.jsx'
import MagneticAnalysisWidget from './components/MagneticAnalysisWidget.jsx'
import AudioEngine from './components/AudioEngine.jsx'
import AnalysisPanel from './components/AnalysisPanel.jsx'
import SheetMusicOSMD from './components/SheetMusicOSMD.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import FileManager from './components/FileManager.jsx'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp.jsx'
import PracticeMode from './components/PracticeMode.jsx'
import NotationEditor from './components/NotationEditor.jsx'
import MeasureNumbers from './components/MeasureNumbers.jsx'
import TempoMapVisual from './components/TempoMapVisual.jsx'
import WidgetsPanel from './components/WidgetsPanel.jsx'
import { ErrorBoundary } from './components/ErrorHandler.jsx'
import './App.css'

function App() {
  // DEBUG: App initialization following debugging.md methodology
  console.log('🚀 App - Initialization:', {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    reactVersion: React.version
  });

  // Estados principais
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [layoutInfo, setLayoutInfo] = useState(null)
  const [osmdInstance, setOsmdInstance] = useState(null)
  
  // Estados dos widgets magnéticos - posições otimizadas para melhor UX
  const [playbackPosition, setPlaybackPosition] = useState("bottom-center")
  const [navigationPosition, setNavigationPosition] = useState("top-right")
  const [analysisPosition, setAnalysisPosition] = useState("center-right")
  
  // Estados de visibilidade dos widgets
  const [showPlayback, setShowPlayback] = useState(true)
  const [showNavigation, setShowNavigation] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(true) // ATIVADO: Widget de análise musical
  
  // Estados dos componentes
  const [showAudioEngine, setShowAudioEngine] = useState(false)
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  
  // Estados de controle
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [tempo, setTempo] = useState(120)
  const [volume, setVolume] = useState(0.7)
  
  // Estados de reprodução avançados
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(16) // 4 compassos * 4 tempos
  const [isLooping, setIsLooping] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  // Estados de navegação e visualização
  const [isPanning, setIsPanning] = useState(false)
  const [showGrid, setShowGrid] = useState(true) // ATIVADO: Grid de posicionamento
  
  // Estados de reprodução e navegação musical
  const [currentMeasure, setCurrentMeasure] = useState(1)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [playbackState, setPlaybackState] = useState('stopped')
  const [playbackData, setPlaybackData] = useState(null)
  
  // Estados de interface
  const [useAdvancedRenderer, setUseAdvancedRenderer] = useState(true)
  const [theme, setTheme] = useState('light')
  
  // Estados de seleção e análise
  const [selectedMeasures, setSelectedMeasures] = useState([])
  const [analysisData, setAnalysisData] = useState(null)
  const [currentMusicXML, setCurrentMusicXML] = useState(null)
  
  // Estados de arquivo e erro
  const [importedFile, setImportedFile] = useState(null)
  const [fileManagerError, setFileManagerError] = useState(null)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showPracticeMode, setShowPracticeMode] = useState(false)
  const [practiceSelection, setPracticeSelection] = useState(null)
  const [errorHandler, setErrorHandler] = useState({ error: null, context: null })
  const [showNotationEditor, setShowNotationEditor] = useState(false)
  const [showWidgetsPanel, setShowWidgetsPanel] = useState(false)

  // Estados dos novos componentes visuais
  const [showMeasureNumbers, setShowMeasureNumbers] = useState(false)
  const [measureNumbersVisible, setMeasureNumbersVisible] = useState(false)
  const [showTempoMap, setShowTempoMap] = useState(false) // DESATIVADO: Visualização de tempo
  const [tempoMap, setTempoMap] = useState([])

  // Estado para controlar modo especialista
  const [expertMode, setExpertMode] = useState(true) // ATIVADO: Modo especialista com todas as funcionalidades

  // Aplicar tema quando mudar
  useEffect(() => {
    const applyTheme = (currentTheme) => {
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (currentTheme === 'light') {
        document.documentElement.classList.remove('dark')
      } else if (currentTheme === 'auto') {
        // Auto theme - usar preferência do sistema
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    applyTheme(theme)
  }, [theme])

  // MusicXML de exemplo seguindo o roadmap
  const sampleMusicXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`

  // Handlers de navegação
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Handlers de playback
  const handlePlay = () => {
    try {
      // DEBUG: Log play action following debugging.md methodology
      console.log('🎵 App - Play Action:', {
        currentState: isPlaying,
        willToggleTo: !isPlaying,
        timestamp: new Date().toISOString()
      });
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('❌ App - Play Error:', error);
      handleError(error, 'handlePlay');
    }
  }

  const handleStop = () => {
    try {
      // DEBUG: Log stop action following debugging.md methodology
      console.log('🛑 App - Stop Action:', {
        currentState: isPlaying,
        timestamp: new Date().toISOString()
      });
      setIsPlaying(false);
    } catch (error) {
      console.error('❌ App - Stop Error:', error);
      handleError(error, 'handleStop');
    }
  }

  const handleTempoChange = (newTempo) => {
    setTempo(newTempo)
  }

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume)
  }

  // Handlers de reprodução avançados
  const handleToggleLoop = () => {
    setIsLooping(!isLooping)
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleSkipBack = () => {
    setCurrentTime(Math.max(0, currentTime - 5))
  }

  const handleSkipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 5))
  }

  // Handlers de zoom e layout
  const handleZoomIn = () => {
    try {
      const startTime = performance.now();
      // DEBUG: Performance monitoring following debugging.md methodology
      console.log('🔍 App - Zoom In Start:', {
        currentZoom: zoomLevel,
        targetZoom: Math.min(zoomLevel + 0.1, 3.0),
        startTime,
        timestamp: new Date().toISOString()
      });
      
      setZoomLevel(prev => {
        const newZoom = Math.min(prev + 0.1, 3.0);
        const endTime = performance.now();
        console.log('🔍 App - Zoom In Complete:', {
          newZoom,
          executionTime: `${(endTime - startTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
        return newZoom;
      });
    } catch (error) {
      console.error('❌ App - Zoom In Error:', error);
      handleError(error, 'handleZoomIn');
    }
  }

  const handleZoomOut = () => {
    try {
      const startTime = performance.now();
      // DEBUG: Performance monitoring following debugging.md methodology
      console.log('🔍 App - Zoom Out Start:', {
        currentZoom: zoomLevel,
        targetZoom: Math.max(zoomLevel - 0.1, 0.5),
        startTime,
        timestamp: new Date().toISOString()
      });
      
      setZoomLevel(prev => {
        const newZoom = Math.max(prev - 0.1, 0.5);
        const endTime = performance.now();
        console.log('🔍 App - Zoom Out Complete:', {
          newZoom,
          executionTime: `${(endTime - startTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
        return newZoom;
      });
    } catch (error) {
      console.error('❌ App - Zoom Out Error:', error);
      handleError(error, 'handleZoomOut');
    }
  }

  // Handlers de navegação avançados
  const handlePan = (panData) => {
    if (panData.toggle !== undefined) {
      setIsPanning(!isPanning)
    }
  }

  const handleReset = () => {
    setZoomLevel(1.0)
    setIsPanning(false)
  }

  const handleToggleGrid = () => {
    setShowGrid(!showGrid)
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Handlers de análise
  const handleAnalysisRequest = (measures) => {
    setSelectedMeasures(measures)
    setShowAnalysisPanel(true)
  }

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data)
  }

  // Handlers de arquivo
  const handleFileImport = (file, musicXML) => {
    setImportedFile(file)
    setCurrentMusicXML(musicXML)
    setFileManagerError(null)
  }

  const handleFileError = (error) => {
    setFileManagerError(error)
  }

  // Handler de erro global
  const handleError = (error, context) => {
    setErrorHandler({ error, context })
  }

  // Handler de mudança de layout (callback do OSMD)
  const handleLayoutChange = (info) => {
    setLayoutInfo(info)
    if (info && info.totalPages) {
      setTotalPages(info.totalPages)
    }
  }

  // Handler para practice mode
  const handlePracticeStart = (selection) => {
    setPracticeSelection(selection)
    setShowPracticeMode(true)
  }

  // Handler para notation editor
  const handleNotationEdit = (musicXML) => {
    setCurrentMusicXML(musicXML)
  }

  // Handler para measure numbers
  const handleMeasureNumbersToggle = (visible) => {
    setMeasureNumbersVisible(visible)
  }

  // Handler para widgets panel
  const handleWidgetToggle = (widgetId, isSubState = false) => {
    console.log('🎛️ Widget Toggle:', { widgetId, isSubState });
    
    switch (widgetId) {
      case 'measureNumbers':
        if (isSubState) {
          console.log('Toggling measureNumbersVisible:', !measureNumbersVisible);
          setMeasureNumbersVisible(!measureNumbersVisible);
        } else {
          console.log('Toggling showMeasureNumbers:', !showMeasureNumbers);
          setShowMeasureNumbers(!showMeasureNumbers);
        }
        break;
      case 'tempoMap':
        console.log('Toggling showTempoMap:', !showTempoMap);
        setShowTempoMap(!showTempoMap);
        break;
      case 'analysisPanel':
        console.log('Toggling showAnalysisPanel:', !showAnalysisPanel);
        setShowAnalysisPanel(!showAnalysisPanel);
        break;
      case 'audioEngine':
        console.log('Toggling showAudioEngine:', !showAudioEngine);
        setShowAudioEngine(!showAudioEngine);
        break;
      case 'practiceMode':
        console.log('Toggling showPracticeMode:', !showPracticeMode);
        setShowPracticeMode(!showPracticeMode);
        break;
      case 'notationEditor':
        console.log('Toggling showNotationEditor:', !showNotationEditor);
        setShowNotationEditor(!showNotationEditor);
        break;
      case 'playbackControls':
        console.log('Toggling showPlayback:', !showPlayback);
        setShowPlayback(!showPlayback);
        break;
      case 'navigationControls':
        console.log('Toggling showNavigation:', !showNavigation);
        setShowNavigation(!showNavigation);
        break;
      case 'analysisWidget':
        console.log('Toggling showAnalysis:', !showAnalysis);
        setShowAnalysis(!showAnalysis);
        break;
      default:
        console.warn('Unknown widget:', widgetId);
    }
  };

  // Handler para tempo map
  const handleTempoMapUpdate = (newTempoMap) => {
    setTempoMap(newTempoMap)
  }

  // Handlers para OSMD em falta
  const handleOSMDReady = (osmdInstance) => {
    setOsmdInstance(osmdInstance)
    console.log('OSMD instance ready:', osmdInstance)
  }

  const handleMeasureClick = (measureData) => {
    console.log('Measure clicked:', measureData)
    // Implementar lógica de seleção de compasso
  }

  const handleOSMDClick = (clickData) => {
    console.log('OSMD clicked:', clickData)
    // Implementar lógica de clique geral
  }

  const handleTimeUpdate = (timeData) => {
    setCurrentTime(timeData.currentTime || 0)
    // Implementar lógica de atualização de tempo
  }

  const handlePageChange = (pageData) => {
    setCurrentPage(pageData.page || 1)
    setTotalPages(pageData.totalPages || 1)
  }

  const handleLayoutOptimized = (layoutData) => {
    setLayoutInfo(layoutData)
    if (layoutData?.totalPages) {
      setTotalPages(layoutData.totalPages)
    }
  }

  const handleCursorNote = (noteData) => {
    console.log('Cursor note:', noteData)
    // Implementar lógica de cursor de nota
  }

  const handleMagneticData = (magneticData) => {
    console.log('Magnetic data:', magneticData)
    // Implementar lógica de dados magnéticos
  }

  const handleMagneticMode = (modeData) => {
    console.log('Magnetic mode:', modeData)
    // Implementar lógica de modo magnético
  }

  // Keyboard shortcuts
  useEffect(() => {
    // DEBUG: Memory leak prevention following debugging.md methodology
    console.log('⌨️ App - Keyboard Shortcuts Setup:', {
      timestamp: new Date().toISOString(),
      action: 'addEventListener'
    });

    const handleKeyDown = (e) => {
      // DEBUG: Log keyboard events for debugging
      console.log('⌨️ App - Key Event:', {
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        timestamp: new Date().toISOString()
      });

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h':
            e.preventDefault()
            setShowShortcutsHelp(true)
            break
          case 's':
            e.preventDefault()
            setShowSettingsPanel(true)
            break
          case 'o':
            e.preventDefault()
            setShowFileManager(true)
            break
          case 'f':
            e.preventDefault()
            handleFullscreen()
            break
          case 'p':
            e.preventDefault()
            handlePlay()
            break
          case 'e':
            e.preventDefault()
            setShowNotationEditor(true)
            break
          default:
            break
        }
      } else {
        switch (e.key) {
          case 'Escape':
            setShowShortcutsHelp(false)
            setShowSettingsPanel(false)
            setShowFileManager(false)
            setShowAnalysisPanel(false)
            setShowPracticeMode(false)
            setShowNotationEditor(false)
            break
          case 'ArrowLeft':
            if (!e.target.matches('input, textarea, select')) {
              e.preventDefault()
              handlePrevPage()
            }
            break
          case 'ArrowRight':
            if (!e.target.matches('input, textarea, select')) {
              e.preventDefault()
              handleNextPage()
            }
            break
          case ' ':
            if (!e.target.matches('input, textarea, select')) {
              e.preventDefault()
              handlePlay()
            }
            break
          default:
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    // DEBUG: Memory leak prevention following debugging.md methodology
    return () => {
      console.log('⌨️ App - Keyboard Shortcuts Cleanup:', {
        timestamp: new Date().toISOString(),
        action: 'removeEventListener'
      });
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPlaying, currentPage, totalPages])

  const validPositions = ["top-right", "bottom-center", "center-right"];

  const handleNavigationPositionChange = (newPosition) => {
    if (validPositions.includes(newPosition)) {
      setNavigationPosition(newPosition);
    } else {
      console.error("Invalid navigation position:", newPosition);
    }
  };

  if (isFullscreen) {
    return (
      <ErrorBoundary onError={handleError}>
        <FullscreenSheetMusic
          musicXML={currentMusicXML || sampleMusicXML}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onExitFullscreen={handleFullscreen}
          onLayoutChange={handleLayoutChange}
          onOSMDReady={setOsmdInstance}
        />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary onError={handleError}>
      <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800 dark' 
          : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        
        {/* Header */}
        <header className={`backdrop-blur-sm shadow-sm border-b sticky top-0 z-20 transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-gray-900/80 border-gray-700/60'
            : 'bg-white/80 border-slate-200/60'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Music className={`h-8 w-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sheet Music Pro</h1>
                </div>
                <Badge variant="secondary" className={`${
                  theme === 'dark' 
                    ? 'bg-blue-900 text-blue-200 border-blue-800' 
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  Interactive Sheets
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseAdvancedRenderer(!useAdvancedRenderer)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Music className="h-4 w-4 mr-2" />
                  {useAdvancedRenderer ? 'Avançado' : 'Básico'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                  className={`${showAnalysisPanel 
                    ? 'text-blue-700 bg-blue-50' 
                    : 'text-gray-600'
                  } hover:text-gray-900`}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Análise IA
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFileManager(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Open
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWidgetsPanel(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Gauge className="h-4 w-4 mr-2" />
                  Widgets
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Opening Settings Panel'); // Debugging log
                    setShowSettingsPanel(true);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('🔧 Debug Tools - Activating hidden features');
                    setShowAudioEngine(!showAudioEngine);
                    setShowAnalysisPanel(!showAnalysisPanel);
                    setShowPracticeMode(!showPracticeMode);
                    setShowNotationEditor(!showNotationEditor);
                  }}
                  className="text-purple-600 hover:text-purple-900"
                  title="Toggle Debug Features"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Debug
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('🚀 Expert Mode - Toggling advanced features');
                    const newExpertMode = !expertMode;
                    setExpertMode(newExpertMode);
                    
                    if (newExpertMode) {
                      // Ativar todas as funcionalidades avançadas
                      setShowAnalysis(true);
                      setShowGrid(true);
                      setShowTempoMap(true);
                      setShowMeasureNumbers(true);
                      setMeasureNumbersVisible(true);
                      setUseAdvancedRenderer(true);
                    } else {
                      // Desativar funcionalidades avançadas
                      setShowAnalysis(false);
                      setShowGrid(false);
                      setShowTempoMap(false);
                    }
                  }}
                  className={`${expertMode 
                    ? 'text-orange-600 hover:text-orange-900 bg-orange-50' 
                    : 'text-gray-600 hover:text-orange-600'
                  }`}
                  title={expertMode ? "Disable Expert Mode" : "Enable Expert Mode"}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {expertMode ? "Expert" : "Basic"}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShortcutsHelp(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Maximize2 className="h-4 w-4 mr-2" />
                  )}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative flex-1">
          {/* Sheet Music Display */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className={`rounded-lg shadow-lg border overflow-hidden ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-slate-200/60'
            }`}>
              <AdvancedSheetMusicOSMD
                musicXML={currentMusicXML || sampleMusicXML}
                zoomLevel={zoomLevel}
                measureNumber={currentMeasure}
                pageIndex={currentPageIndex}
                isPlaying={isPlaying}
                currentTime={playbackTime}
                playbackState={playbackState}
                playbackData={playbackData}
                enableSelection={false}
                enableOSMNavigation={false}
                enableAdvancedSpacing={true}
                onError={handleError}
                onOSMDReady={handleOSMDReady}
                onMeasureClick={handleMeasureClick}
                onOSMDClick={handleOSMDClick}
                onTimeUpdate={handleTimeUpdate}
                onPageChange={handlePageChange}
                onLayoutOptimized={handleLayoutOptimized}
                onCursorNote={handleCursorNote}
                onMagneticData={handleMagneticData}
                onMagneticMode={handleMagneticMode}
              />
            </div>
          </div>
        </main>

        {/* Widgets Magnéticos */}
        {showPlayback && (
          <MagneticPlaybackControls
            position={playbackPosition}
            onPositionChange={setPlaybackPosition}
            defaultPinned={true}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onStop={handleStop}
            tempo={tempo}
            onTempoChange={handleTempoChange}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onClose={() => setShowPlayback(false)}
          />
        )}

        {showNavigation && (
          <MagneticNavigationControls
            position={navigationPosition}
            onPositionChange={handleNavigationPositionChange}
            defaultPinned={true}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onClose={() => setShowNavigation(false)}
            isSelectionMode={false}
            onToggleSelection={() => {}}
            isPanning={isPanning}
            onPan={setIsPanning}
            onReset={handleReset}
            onFullscreen={handleFullscreen}
            showGrid={showGrid}
            onToggleGrid={handleToggleGrid}
          />
        )}

        {showAnalysis && (
          <MagneticAnalysisWidget
            position={analysisPosition}
            onPositionChange={setAnalysisPosition}
            selectedMeasures={selectedMeasures}
            musicXML={currentMusicXML || sampleMusicXML}
            onAnalysisComplete={handleAnalysisRequest}
            onClose={() => setShowAnalysis(false)}
          />
        )}

        {/* Modais e Painéis */}
        {showAudioEngine && (
          <AudioEngine
            isVisible={showAudioEngine}
            onClose={() => setShowAudioEngine(false)}
            tempo={tempo}
            volume={volume}
            isPlaying={isPlaying}
            musicXML={currentMusicXML || sampleMusicXML}
            onError={handleError}
          />
        )}

        {showAnalysisPanel && (
          <AnalysisPanel
            isVisible={showAnalysisPanel}
            onClose={() => setShowAnalysisPanel(false)}
            selectedMeasures={selectedMeasures}
            musicXML={currentMusicXML || sampleMusicXML}
            onAnalysisComplete={handleAnalysisComplete}
            analysisData={analysisData}
          />
        )}

        {showSettingsPanel && (
          <SettingsPanel
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            settings={{
              zoomLevel,
              showPlayback,
              showNavigation,
              showAnalysis,
              tempo,
              volume,
              showMeasureNumbers,
              measureNumbersVisible,
              showTempoMap,
              theme
            }}
            onSettingsChange={(newSettings) => {
              if (newSettings.zoomLevel !== undefined) setZoomLevel(newSettings.zoomLevel)
              if (newSettings.showPlayback !== undefined) setShowPlayback(newSettings.showPlayback)
              if (newSettings.showNavigation !== undefined) setShowNavigation(newSettings.showNavigation)
              if (newSettings.showAnalysis !== undefined) setShowAnalysis(newSettings.showAnalysis)
              if (newSettings.tempo !== undefined) setTempo(newSettings.tempo)
              if (newSettings.volume !== undefined) setVolume(newSettings.volume)
              if (newSettings.showMeasureNumbers !== undefined) setShowMeasureNumbers(newSettings.showMeasureNumbers)
              if (newSettings.measureNumbersVisible !== undefined) setMeasureNumbersVisible(newSettings.measureNumbersVisible)
              if (newSettings.showTempoMap !== undefined) setShowTempoMap(newSettings.showTempoMap)
              if (newSettings.theme !== undefined) {
                setTheme(newSettings.theme)
              }
            }}
          />
        )}

        {showFileManager && (
          <FileManager
            isVisible={showFileManager}
            onClose={() => setShowFileManager(false)}
            onFileImport={handleFileImport}
            onError={handleFileError}
            currentFile={importedFile}
            error={fileManagerError}
          />
        )}

        {showShortcutsHelp && (
          <KeyboardShortcutsHelp
            isVisible={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
          />
        )}

        {showPracticeMode && (
          <PracticeMode
            isVisible={showPracticeMode}
            onClose={() => setShowPracticeMode(false)}
            musicXML={currentMusicXML || sampleMusicXML}
            selection={practiceSelection}
            onSelectionChange={setPracticeSelection}
            osmdInstance={osmdInstance}
          />
        )}

        {showNotationEditor && (
          <NotationEditor
            isVisible={showNotationEditor}
            onClose={() => setShowNotationEditor(false)}
            musicXML={currentMusicXML || sampleMusicXML}
            onMusicXMLChange={handleNotationEdit}
            onError={handleError}
          />
        )}

        {/* Componentes Visuais Fixos */}
        {showMeasureNumbers && (
          <div className="fixed top-20 right-4 z-30">
            <MeasureNumbers
              isVisible={measureNumbersVisible}
              onToggle={handleMeasureNumbersToggle}
              osmdInstance={osmdInstance}
              currentPage={currentPage}
              layoutInfo={layoutInfo}
            />
          </div>
        )}

        {showTempoMap && (
          <div className="fixed bottom-4 left-4 z-30">
            <TempoMapVisual
              isVisible={showTempoMap}
              onTempoChange={handleTempoChange}
              osmdInstance={osmdInstance}
              currentTempo={tempo}
              tempoMap={tempoMap}
            />
          </div>
        )}

        {/* Widgets Panel */}
        {showWidgetsPanel && (
          <WidgetsPanel
            isOpen={showWidgetsPanel}
            onClose={() => setShowWidgetsPanel(false)}
            theme={theme}
            widgetStates={{
              showMeasureNumbers,
              measureNumbersVisible,
              showTempoMap,
              showAnalysisPanel,
              showAudioEngine,
              showPracticeMode,
              showNotationEditor,
              showPlayback,
              showNavigation,
              showAnalysis
            }}
            onWidgetToggle={handleWidgetToggle}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App