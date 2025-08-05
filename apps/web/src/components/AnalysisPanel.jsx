import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card.jsx';
import { Badge } from '@ui/badge.jsx';
import { Button } from '@ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs.jsx';
import { 
  Brain, 
  Music, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Lightbulb,
  ChevronRight,
  Sparkles
} from 'lucide-react';

/**
 * Painel de análise musical com placeholders para integração de IA
 */
const AnalysisPanel = ({ 
  selectedMeasures = [],
  musicXML = null,
  isVisible = false,
  onClose,
  className = ""
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('harmonic');

  // Simular análise quando há seleção
  useEffect(() => {
    if (selectedMeasures.length > 0) {
      performAnalysis();
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
      structural: {
        form: 'Binária simples',
        sections: ['A', 'B'],
        repetitions: 1,
        development: 'Sequencial'
      },
      historical: {
        period: 'Período Clássico',
        style: 'Estilo galante',
        composers: ['Mozart', 'Haydn'],
        characteristics: [
          'Melodias claras e equilibradas',
          'Harmonias funcionais',
          'Estrutura formal definida'
        ]
      },
      theoretical: {
        scale: 'Escala maior',
        modes: ['Jónico'],
        cadences: ['Cadência autêntica perfeita'],
        nonChordTones: ['Nota de passagem'],
        voice_leading: 'Movimento por graus conjuntos'
      }
    };
    
    setAnalysisData(mockAnalysis);
    setIsAnalyzing(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-40 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg">Análise Musical</h3>
                <p className="text-yellow-100 text-sm">
                  {selectedMeasures.length > 0 
                    ? `${selectedMeasures.length} compasso(s) selecionado(s)`
                    : 'Selecione compassos para análise'
                  }
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-yellow-700"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-yellow-100 border-t-yellow-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Analisando partitura...</p>
              <p className="text-sm text-gray-500 mt-2">
                Processamento com IA em andamento
              </p>
            </div>
          ) : analysisData ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="harmonic" className="text-xs">Harmónica</TabsTrigger>
                <TabsTrigger value="melodic" className="text-xs">Melódica</TabsTrigger>
                <TabsTrigger value="rhythmic" className="text-xs">Rítmica</TabsTrigger>
              </TabsList>

              {/* Análise Harmónica */}
              <TabsContent value="harmonic" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Music className="w-4 h-4 text-yellow-600" />
                      Análise Harmónica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500">Tonalidade:</span>
                      <Badge variant="outline" className="ml-2">
                        {analysisData.harmonic.key}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Progressão:</span>
                      <div className="mt-1">
                        <Badge variant="secondary">
                          {analysisData.harmonic.progression}
                        </Badge>
                      </div>
                    </div>
                    
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
                  </CardContent>
                </Card>

                {/* Contexto Histórico */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Contexto Histórico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Período:</span>
                      <p className="text-sm font-medium">
                        {analysisData.historical.period}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Características:</span>
                      <ul className="text-xs text-gray-700 mt-1 space-y-1">
                        {analysisData.historical.characteristics.map((char, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                            {char}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Análise Melódica */}
              <TabsContent value="melodic" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Análise Melódica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500">Âmbito:</span>
                      <Badge variant="outline" className="ml-2">
                        {analysisData.melodic.range}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Contorno:</span>
                      <Badge variant="secondary" className="ml-2">
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Análise Rítmica */}
              <TabsContent value="rhythmic" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Análise Rítmica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500">Compasso:</span>
                      <Badge variant="outline" className="ml-2">
                        {analysisData.rhythmic.timeSignature}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Tempo:</span>
                      <Badge variant="secondary" className="ml-2">
                        {analysisData.rhythmic.tempo}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Padrões:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisData.rhythmic.patterns.map((pattern, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles className="w-12 h-12 text-gray-300 mb-4" />
              <h4 className="font-medium text-gray-600 mb-2">
                Análise Inteligente
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Selecione compassos na partitura para obter análise detalhada com IA
              </p>
              <Badge variant="secondary" className="text-xs">
                Placeholder para IA
              </Badge>
            </div>
          )}
        </div>

        {/* Rodapé com ações */}
        {analysisData && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => console.log('Exportar análise')}
              >
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => console.log('Partilhar análise')}
              >
                Partilhar
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              Análise gerada por IA • Placeholder para integração futura
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;

