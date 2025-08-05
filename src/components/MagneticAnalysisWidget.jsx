import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import MagneticWidget from './MagneticWidget.jsx';
import { 
  Brain, 
  Music, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Lightbulb,
  ChevronRight,
  Sparkles,
  Download,
  Share
} from 'lucide-react';

/**
 * Widget de análise musical magnético - Análise harmônica, melódica e rítmica
 * @param {Array} selectedMeasures - Compassos selecionados para análise
 * @param {string} musicXML - Dados MusicXML para análise
 * @param {string} position - Posição magnética atual
 * @param {function} onPositionChange - Callback para mudança de posição
 * @param {function} onAnalysisComplete - Callback quando análise completa
 */
const MagneticAnalysisWidget = ({
  selectedMeasures = [],
  musicXML = null,
  // Props de posicionamento magnético
  position,
  onPositionChange,
  onAnalysisComplete,
  defaultPosition = "center-right",
  defaultPinned = false,
  ...props
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('harmonic');
  const [isExpanded, setIsExpanded] = useState(false);
  // FORCE: Disable expanded mode completely
  const isExpandedDisabled = true;

  // Simular análise quando há seleção - com validação segura
  useEffect(() => {
    if (selectedMeasures && selectedMeasures.length > 0) {
      performAnalysis();
    } else {
      setAnalysisData(null);
    }
  }, [selectedMeasures]);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simular tempo de análise
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Dados simulados de análise (placeholder para IA)
    const mockAnalysis = {
      harmonic: {
        key: 'Sol Maior',
        chords: ['G', 'Am', 'D', 'G'],
        progression: 'I-ii-V-I',
        modulations: [],
        complexity: 'Simples'
      },
      melodic: {
        range: 'G4 - G5',
        intervals: ['2ª maior', '2ª maior', '2ª maior'],
        contour: 'Ascendente',
        phrases: 2,
        motifs: ['Escala ascendente', 'Arpegio descendente']
      },
      rhythmic: {
        timeSignature: '4/4',
        tempo: '120 BPM',
        patterns: ['Semínimas uniformes', 'Colcheias agrupadas'],
        syncopation: 'Baixa',
        complexity: 'Moderada'
      },
      historical: {
        period: 'Período Clássico',
        style: 'Estilo galante',
        characteristics: [
          'Melodias claras',
          'Harmonias funcionais',
          'Estrutura formal'
        ]
      }
    };
    
    setAnalysisData(mockAnalysis);
    setIsAnalyzing(false);
    
    if (onAnalysisComplete) {
      onAnalysisComplete(mockAnalysis);
    }
  };

  // Detectar orientação baseada na posição
  const getButtonLayout = () => {
    const currentPos = position || defaultPosition;
    if (typeof currentPos === 'string') {
      if (currentPos.includes('left') || currentPos.includes('right')) {
        return 'flex-col'; // Vertical (top to bottom)
      } else if (currentPos.includes('bottom')) {
        return 'flex-row'; // Horizontal (left to right)
      }
    }
    console.error('❌ [MagneticAnalysisWidget] currentPos is not a valid string:', currentPos);
    return 'flex-row'; // Default to horizontal
  };

  // Resumo compacto (sempre visível)
  const CompactSummary = () => {
    if (isAnalyzing) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-100 border-t-yellow-600 rounded-full animate-spin" />
          <span className="text-sm">Analisando...</span>
        </div>
      );
    }

    if (!analysisData) {
      return (
        <div className="text-center text-gray-500">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Selecione compassos para análise</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {analysisData.harmonic.key}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {selectedMeasures && selectedMeasures.length ? selectedMeasures.length : 0} compasso(s)
          </Badge>
        </div>
        
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Progressão:</span>
            <span className="font-medium">{analysisData.harmonic.progression}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Período:</span>
            <span className="font-medium text-xs">{analysisData.historical.period}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {/* Disabled expansion */}}
          className="w-full h-6 text-xs hover:bg-yellow-50 opacity-50 cursor-not-allowed"
          disabled={true}
        >
          Detalhes (expansão desativada)
        </Button>
      </div>
    );
  };

  // Análise detalhada (expandida)
  const DetailedAnalysis = () => (
    <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="harmonic" className="text-xs">Harm.</TabsTrigger>
          <TabsTrigger value="melodic" className="text-xs">Mel.</TabsTrigger>
          <TabsTrigger value="rhythmic" className="text-xs">Rít.</TabsTrigger>
        </TabsList>

        {/* Análise Harmónica */}
        <TabsContent value="harmonic" className="space-y-2 mt-2">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Acordes:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysisData.harmonic.chords.map((chord, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {chord}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-xs text-gray-500">Complexidade:</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {analysisData.harmonic.complexity}
              </Badge>
            </div>
          </div>
        </TabsContent>

        {/* Análise Melódica */}
        <TabsContent value="melodic" className="space-y-2 mt-2">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Âmbito:</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {analysisData.melodic.range}
              </Badge>
            </div>
            
            <div>
              <span className="text-xs text-gray-500">Contorno:</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {analysisData.melodic.contour}
              </Badge>
            </div>
            
            <div>
              <span className="text-xs text-gray-500">Motivos:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysisData.melodic.motifs.map((motif, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {motif}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Análise Rítmica */}
        <TabsContent value="rhythmic" className="space-y-2 mt-2">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Compasso:</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {analysisData.rhythmic.timeSignature}
              </Badge>
            </div>
            
            <div>
              <span className="text-xs text-gray-500">Complexidade:</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {analysisData.rhythmic.complexity}
              </Badge>
            </div>
            
            <div>
              <span className="text-xs text-gray-500">Padrões:</span>
              <div className="space-y-1 mt-1">
                {analysisData.rhythmic.patterns.map((pattern, index) => (
                  <div key={index} className="text-xs text-gray-700 flex items-start gap-1">
                    <ChevronRight className="w-2 h-2 mt-0.5 text-gray-400" />
                    {pattern}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contexto histórico */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-blue-600" />
          <span className="text-xs font-medium">Contexto Histórico</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs">
            <span className="text-gray-500">Estilo:</span>
            <span className="ml-2 font-medium">{analysisData.historical.style}</span>
          </div>
          
          <div className="text-xs text-gray-600">
            {analysisData.historical.characteristics.map((char, index) => (
              <div key={index} className="flex items-start gap-1">
                <ChevronRight className="w-2 h-2 mt-0.5 text-gray-400" />
                {char}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-1 pt-2 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => console.log('Exportar análise')}
        >
          <Download className="w-3 h-3 mr-1" />
          Exportar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => console.log('Partilhar análise')}
        >
          <Share className="w-3 h-3 mr-1" />
          Partilhar
        </Button>
      </div>

      {/* Nota sobre IA */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Análise gerada por IA • Placeholder
      </div>
    </div>
  );

  return (
    <MagneticWidget
      title="Análise Musical"
      icon={Brain}
      showHeader={false}
      defaultPosition={position || defaultPosition}
      defaultPinned={defaultPinned}
      onPositionChange={onPositionChange}
      className="min-w-48 max-w-64"
      {...props}
    >
      <div className="space-y-0">
        <CompactSummary />
        {false && analysisData && <DetailedAnalysis />}
      </div>
    </MagneticWidget>
  );
};

export default MagneticAnalysisWidget;

