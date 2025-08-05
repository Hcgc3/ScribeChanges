import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Clock, Play, Pause, BarChart3, TrendingUp } from 'lucide-react'

// Componente React para visualização e controle de mapa de tempo musical
// Integra com OSMD e Tone.js para mudanças de tempo em tempo real
// @param {boolean} isVisible - Estado de visibilidade do mapa
// @param {function} onTempoChange - Callback para mudanças de tempo
// @param {Object} osmdInstance - Instância OSMD para sincronização
// @param {number} currentTempo - Tempo atual em BPM
// @param {Array} tempoMap - Array de mudanças de tempo [{measure, tempo, timestamp}]
const TempoMapVisual = ({ 
  isVisible = true,
  onTempoChange,
  osmdInstance,
  currentTempo = 120,
  tempoMap = []
}) => {
  // Estados para controle de tempo
  const [isMapVisible, setIsMapVisible] = useState(isVisible)
  const [globalTempo, setGlobalTempo] = useState(currentTempo)
  const [tempoChanges, setTempoChanges] = useState(tempoMap)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedMeasure, setSelectedMeasure] = useState(null)
  
  // Estados para visualização
  const [showTempoLine, setShowTempoLine] = useState(true)
  const [autoDetectTempo, setAutoDetectTempo] = useState(true)
  const [measureCount, setMeasureCount] = useState(0)
  
  // Ref para canvas de visualização
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  // Efeito para sincronização com props
  useEffect(() => {
    setIsMapVisible(isVisible)
  }, [isVisible])

  useEffect(() => {
    setGlobalTempo(currentTempo)
  }, [currentTempo])

  useEffect(() => {
    setTempoChanges(tempoMap)
  }, [tempoMap])

  // Efeito para contar compassos do OSMD
  useEffect(() => {
    if (osmdInstance && osmdInstance.Sheet) {
      try {
        const sheet = osmdInstance.Sheet
        const sourceMeasures = sheet.SourceMeasures
        if (sourceMeasures && sourceMeasures.length > 0) {
          setMeasureCount(sourceMeasures.length)
        }
      } catch (error) {
        console.warn('Erro ao acessar compassos OSMD:', error)
        setMeasureCount(8) // Fallback para 8 compassos
      }
    } else {
      setMeasureCount(8) // Fallback padrão
    }
  }, [osmdInstance])

  // Handler para mudança de tempo global
  const handleGlobalTempoChange = (newTempo) => {
    const tempo = Array.isArray(newTempo) ? newTempo[0] : newTempo
    setGlobalTempo(tempo)
    onTempoChange?.(tempo, 0) // Measure 0 = global tempo
  }

  // Handler para adicionar mudança de tempo específica
  const handleAddTempoChange = (measure, tempo) => {
    const newChange = {
      measure,
      tempo,
      timestamp: Date.now(),
      id: `tempo_${measure}_${Date.now()}`
    }
    
    const updatedChanges = [...tempoChanges, newChange].sort((a, b) => a.measure - b.measure)
    setTempoChanges(updatedChanges)
    onTempoChange?.(tempo, measure)
  }

  // Handler para remover mudança de tempo
  const handleRemoveTempoChange = (changeId) => {
    const updatedChanges = tempoChanges.filter(change => change.id !== changeId)
    setTempoChanges(updatedChanges)
  }

  // Função para desenhar gráfico de tempo
  const drawTempoGraph = () => {
    const canvas = canvasRef.current
    if (!canvas || measureCount === 0) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Limpar canvas
    ctx.clearRect(0, 0, width, height)

    if (!showTempoLine) return

    // Configurar estilo
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.fillStyle = '#3b82f6'
    
    // Desenhar linha base de tempo global
    const baseY = height * 0.5
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    ctx.lineTo(width, baseY)
    ctx.stroke()

    // Desenhar mudanças de tempo
    if (tempoChanges.length > 0) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 3
      
      tempoChanges.forEach((change, index) => {
        const x = (change.measure / measureCount) * width
        const tempoRatio = change.tempo / globalTempo
        const y = baseY - (tempoRatio - 1) * height * 0.3
        
        // Desenhar ponto de mudança
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        
        // Desenhar linha até próxima mudança ou final
        if (index < tempoChanges.length - 1) {
          const nextChange = tempoChanges[index + 1]
          const nextX = (nextChange.measure / measureCount) * width
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(nextX, y)
          ctx.stroke()
        } else {
          // Linha até o final
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(width, y)
          ctx.stroke()
        }
      })
    }
  }

  // Efeito para redesenhar gráfico
  useEffect(() => {
    if (isMapVisible && showTempoLine) {
      drawTempoGraph()
    }
  }, [isMapVisible, showTempoLine, tempoChanges, globalTempo, measureCount])

  // Preset tempos comuns
  const tempoPresets = [
    { name: 'Largo', bpm: 40 },
    { name: 'Adagio', bpm: 66 },
    { name: 'Andante', bpm: 76 },
    { name: 'Moderato', bpm: 108 },
    { name: 'Allegro', bpm: 120 },
    { name: 'Presto', bpm: 168 }
  ]

  if (!isMapVisible) {
    return null
  }

  return (
    <Card className="tempo-map-widget bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg w-80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-blue-600" />
          Mapa de Tempo
          <Badge variant="outline" className="ml-auto">
            {globalTempo} BPM
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controle de tempo global */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-700">Tempo Global</Label>
            <span className="text-sm font-mono text-gray-600">{globalTempo} BPM</span>
          </div>
          <Slider
            value={[globalTempo]}
            onValueChange={handleGlobalTempoChange}
            min={40}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Presets de tempo */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-700">Presets:</Label>
          <div className="grid grid-cols-3 gap-1">
            {tempoPresets.map((preset) => (
              <Button
                key={preset.name}
                variant={globalTempo === preset.bpm ? "default" : "outline"}
                size="sm"
                onClick={() => handleGlobalTempoChange(preset.bpm)}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Visualização gráfica */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-700">Visualização</Label>
            <Switch
              checked={showTempoLine}
              onCheckedChange={setShowTempoLine}
            />
          </div>
          {showTempoLine && (
            <div className="border rounded-md p-2 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={280}
                height={80}
                className="w-full h-20 border-none"
              />
            </div>
          )}
        </div>

        {/* Lista de mudanças de tempo */}
        {tempoChanges.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Mudanças de Tempo:</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {tempoChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm"
                >
                  <span className="font-mono">
                    Comp. {change.measure}: {change.tempo} BPM
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTempoChange(change.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles de gravação */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={() => setIsRecording(!isRecording)}
            className="flex-1"
          >
            {isRecording ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Parar Gravação
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Gravar Mudanças
              </>
            )}
          </Button>
        </div>

        {/* Status */}
        <div className="text-xs text-gray-500">
          {measureCount > 0 ? (
            <span>✅ {measureCount} compassos • {tempoChanges.length} mudanças</span>
          ) : (
            <span>⚠️ Aguardando dados de partitura</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TempoMapVisual
