import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Hash, Eye, EyeOff } from 'lucide-react'

// Componente React para exibição de números de compasso visuais
// Deve ser widget magnético com posicionamento flexível
// @param {boolean} isVisible - Estado de visibilidade dos números
// @param {function} onVisibilityChange - Callback para mudanças de visibilidade
// @param {Object} osmdInstance - Instância OSMD para acesso aos compassos
// @param {string} position - Posição dos números ('above' | 'below' | 'both')
const MeasureNumbers = ({ 
  isVisible = true, 
  onVisibilityChange, 
  osmdInstance, 
  position = 'above',
  onPositionChange 
}) => {
  // Estados locais para configuração
  const [showNumbers, setShowNumbers] = useState(isVisible)
  const [numberPosition, setNumberPosition] = useState(position)
  const [fontSize, setFontSize] = useState(12)
  const [numberColor, setNumberColor] = useState('#666666')
  const [measureCount, setMeasureCount] = useState(0)
  
  // Ref para container dos números
  const numbersContainerRef = useRef(null)

  // Efeito para sincronizar com props externas
  useEffect(() => {
    setShowNumbers(isVisible)
  }, [isVisible])

  // Efeito para contagem de compassos do OSMD
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
        setMeasureCount(0)
      }
    }
  }, [osmdInstance])

  // Handler para alternar visibilidade
  const handleVisibilityToggle = (visible) => {
    setShowNumbers(visible)
    onVisibilityChange?.(visible)
  }

  // Handler para mudança de posição
  const handlePositionChange = (newPosition) => {
    setNumberPosition(newPosition)
    onPositionChange?.(newPosition)
  }

  // Renderização de números baseada na posição de compassos do OSMD
  const renderMeasureNumbers = () => {
    if (!showNumbers || !osmdInstance || measureCount === 0) {
      return null
    }

    const numbers = []
    for (let i = 1; i <= measureCount; i++) {
      numbers.push(
        <Badge 
          key={i} 
          variant="outline" 
          className="measure-number"
          style={{
            fontSize: `${fontSize}px`,
            color: numberColor,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb',
            margin: '0 2px'
          }}
        >
          {i}
        </Badge>
      )
    }
    return numbers
  }

  return (
    <Card className="measure-numbers-widget bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-800">Números de Compasso</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVisibilityToggle(!showNumbers)}
            className="h-8 w-8 p-0"
          >
            {showNumbers ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </Button>
        </div>

        {/* Controles de visibilidade */}
        <div className="flex items-center justify-between">
          <Label htmlFor="show-numbers" className="text-sm text-gray-700">
            Mostrar números
          </Label>
          <Switch
            id="show-numbers"
            checked={showNumbers}
            onCheckedChange={handleVisibilityToggle}
          />
        </div>

        {/* Controles de posição */}
        {showNumbers && (
          <div className="space-y-3">
            <Label className="text-sm text-gray-700">Posição:</Label>
            <div className="flex gap-2">
              {['above', 'below', 'both'].map((pos) => (
                <Button
                  key={pos}
                  variant={numberPosition === pos ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePositionChange(pos)}
                  className="text-xs"
                >
                  {pos === 'above' ? 'Acima' : pos === 'below' ? 'Abaixo' : 'Ambos'}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Preview dos números */}
        {showNumbers && measureCount > 0 && (
          <div className="border-t pt-3">
            <Label className="text-xs text-gray-600 mb-2 block">
              Preview ({measureCount} compassos):
            </Label>
            <div 
              ref={numbersContainerRef}
              className="flex flex-wrap gap-1 max-h-20 overflow-y-auto"
            >
              {renderMeasureNumbers()}
            </div>
          </div>
        )}

        {/* Informações de status */}
        <div className="text-xs text-gray-500 border-t pt-2">
          {osmdInstance ? (
            <span>✅ OSMD conectado • {measureCount} compassos detectados</span>
          ) : (
            <span>⚠️ Aguardando conexão OSMD</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MeasureNumbers
