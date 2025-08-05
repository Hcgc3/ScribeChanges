// Componente React para modo de prática musical avançado
// Integra com AudioEngine e OSMD para prática dirigida com loops e velocidade variável
// @param {Object} selection - Seleção atual da partitura para praticar
// @param {boolean} isActive - Estado de ativação do modo prática
// @param {function} onModeChange - Callback para mudanças de modo
// @param {Object} audioEngine - Referência ao motor de áudio
import React, { useState, useEffect, useRef } from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Play,
  Pause,
  Square,
  RotateCcw,
  Repeat,
  Target,
  Timer,
  TrendingUp,
  Volume2,
  Settings,
  CheckCircle
} from 'lucide-react';

/**
 * PracticeMode - Modo de prática avançado para partitura musical
 * Permite loop de seções, ajuste de velocidade e tracking de progresso
 */
const PracticeMode = ({
  selection = null,
  isActive = false,
  onModeChange,
  audioEngine = null,
  osmdInstance = null
}) => {
  // Estados do modo prática
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLoop, setCurrentLoop] = useState(0);
  const [targetLoops, setTargetLoops] = useState(5);
  
  // Configurações de prática
  const [practiceSpeed, setPracticeSpeed] = useState(60); // Percentagem da velocidade original
  const [originalTempo, setOriginalTempo] = useState(120);
  const [enableMetronome, setEnableMetronome] = useState(true);
  const [autoIncrementSpeed, setAutoIncrementSpeed] = useState(true);
  const [speedIncrementStep, setSpeedIncrementStep] = useState(5);
  
  // Estados de progresso
  const [sessionTime, setSessionTime] = useState(0);
  const [practiceProgress, setPracticeProgress] = useState(0);
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    totalLoops: 0,
    perfectLoops: 0,
    averageSpeed: 0,
    totalTime: 0
  });
  
  // Referências para timers
  const sessionTimerRef = useRef(null);
  const loopTimerRef = useRef(null);
  const speedIncreaseRef = useRef(null);

  // Calcular tempo atual baseado na velocidade de prática
  const getCurrentTempo = () => {
    return Math.round((originalTempo * practiceSpeed) / 100);
  };

  // Iniciar modo de prática
  const startPractice = () => {
    if (!selection) {
      return;
    }
    
    setIsPlaying(true);
    setIsPaused(false);
    
    // Iniciar timer da sessão
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    // Configurar audio engine para modo prática
    if (audioEngine) {
      audioEngine.setTempo(getCurrentTempo());
      audioEngine.setLoopRegion(selection.start, selection.end);
      audioEngine.enableLoop(true);
      audioEngine.enableMetronome(enableMetronome);
      audioEngine.play();
    }
    
    // Iniciar tracking do loop atual
    startLoopTracking();
  };

  // Pausar prática
  const pausePractice = () => {
    setIsPaused(true);
    setIsPlaying(false);
    
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    
    if (audioEngine) {
      audioEngine.pause();
    }
  };

  // Parar prática
  const stopPractice = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentLoop(0);
    
    // Limpar timers
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    if (loopTimerRef.current) {
      clearInterval(loopTimerRef.current);
    }
    if (speedIncreaseRef.current) {
      clearTimeout(speedIncreaseRef.current);
    }
    
    if (audioEngine) {
      audioEngine.stop();
      audioEngine.enableLoop(false);
    }
    
    // Atualizar estatísticas finais
    updateSessionStats();
  };

  // Reiniciar loop atual
  const restartCurrentLoop = () => {
    if (audioEngine && selection) {
      audioEngine.seekTo(selection.start);
    }
  };

  // Tracking do progresso do loop
  const startLoopTracking = () => {
    if (!audioEngine || !selection) return;
    
    loopTimerRef.current = setInterval(() => {
      const currentPosition = audioEngine.getCurrentPosition();
      const loopDuration = selection.end - selection.start;
      const progress = ((currentPosition - selection.start) / loopDuration) * 100;
      
      setPracticeProgress(Math.max(0, Math.min(100, progress)));
      
      // Detectar fim do loop
      if (currentPosition >= selection.end) {
        handleLoopComplete();
      }
    }, 100);
  };

  // Lidar com conclusão de um loop
  const handleLoopComplete = () => {
    const newLoopCount = currentLoop + 1;
    setCurrentLoop(newLoopCount);
    
    // Atualizar estatísticas
    setSessionStats(prev => ({
      ...prev,
      totalLoops: prev.totalLoops + 1,
      averageSpeed: ((prev.averageSpeed * prev.totalLoops) + practiceSpeed) / (prev.totalLoops + 1)
    }));
    
    // Verificar se atingiu o objetivo
    if (newLoopCount >= targetLoops) {
      handlePracticeGoalReached();
    }
    
    // Auto incremento de velocidade
    if (autoIncrementSpeed && newLoopCount % 3 === 0) {
      handleSpeedIncrement();
    }
    
    // Reset do progresso para próximo loop
    setPracticeProgress(0);
  };

  // Lidar com objetivo de prática atingido
  const handlePracticeGoalReached = () => {
    setSessionStats(prev => ({
      ...prev,
      perfectLoops: prev.perfectLoops + 1
    }));
    
    // Feedback visual/audio de sucesso
    if (audioEngine) {
      audioEngine.playSuccessSound?.();
    }
    
    // Parar automaticamente ou continuar conforme configuração
    stopPractice();
  };

  // Incrementar velocidade automaticamente
  const handleSpeedIncrement = () => {
    if (practiceSpeed < 100) {
      const newSpeed = Math.min(100, practiceSpeed + speedIncrementStep);
      setPracticeSpeed(newSpeed);
      
      if (audioEngine) {
        audioEngine.setTempo(Math.round((originalTempo * newSpeed) / 100));
      }
    }
  };

  // Atualizar estatísticas da sessão
  const updateSessionStats = () => {
    setSessionStats(prev => ({
      ...prev,
      totalTime: sessionTime
    }));
  };

  // Formatação de tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset das configurações
  const resetPracticeSettings = () => {
    setPracticeSpeed(60);
    setTargetLoops(5);
    setEnableMetronome(false);
    setAutoIncrementSpeed(false);
    setCurrentLoop(0);
    setSessionTime(0);
    setPracticeProgress(0);
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      if (speedIncreaseRef.current) clearTimeout(speedIncreaseRef.current);
    };
  }, []);

  if (!isActive) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Modo Prática
          </div>
          <Badge variant={isPlaying ? "default" : "secondary"}>
            {isPlaying ? "Ativo" : isPaused ? "Pausado" : "Parado"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seleção atual */}
        {selection ? (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Seleção Ativa</div>
            <div className="text-xs text-muted-foreground">
              Compassos {selection.startMeasure || 1} - {selection.endMeasure || 4}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
            Selecione uma seção da partitura para praticar
          </div>
        )}

        {/* Progresso do loop atual */}
        {isPlaying && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do Loop</span>
              <span>{Math.round(practiceProgress)}%</span>
            </div>
            <Progress value={practiceProgress} className="w-full" />
          </div>
        )}

        {/* Controles principais */}
        <div className="flex justify-center gap-2">
          {!isPlaying ? (
            <Button 
              onClick={startPractice} 
              disabled={!selection}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Iniciar Prática
            </Button>
          ) : (
            <>
              <Button onClick={pausePractice} variant="outline">
                <Pause className="h-4 w-4" />
              </Button>
              <Button onClick={stopPractice} variant="outline">
                <Square className="h-4 w-4" />
              </Button>
              <Button onClick={restartCurrentLoop} variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <Separator />

        {/* Configurações de velocidade */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">
              Velocidade: {practiceSpeed}% ({getCurrentTempo()} BPM)
            </Label>
            <Slider
              value={[practiceSpeed]}
              onValueChange={([value]) => {
                setPracticeSpeed(value);
                if (audioEngine && isPlaying) {
                  audioEngine.setTempo(Math.round((originalTempo * value) / 100));
                }
              }}
              min={25}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-increment" className="text-sm">
              Auto-incremento
            </Label>
            <Switch
              id="auto-increment"
              checked={autoIncrementSpeed}
              onCheckedChange={setAutoIncrementSpeed}
            />
          </div>
        </div>

        <Separator />

        {/* Configurações de loops */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">
              Meta de Loops: {targetLoops}
            </Label>
            <Slider
              value={[targetLoops]}
              onValueChange={([value]) => setTargetLoops(value)}
              min={1}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span>Loops Completos:</span>
            <span className="font-medium">
              {currentLoop} / {targetLoops}
              {currentLoop >= targetLoops && (
                <CheckCircle className="inline h-4 w-4 ml-1 text-green-500" />
              )}
            </span>
          </div>
        </div>

        <Separator />

        {/* Configurações adicionais */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="metronome" className="text-sm">
              Metrônomo
            </Label>
            <Switch
              id="metronome"
              checked={enableMetronome}
              onCheckedChange={(checked) => {
                setEnableMetronome(checked);
                if (audioEngine) {
                  audioEngine.enableMetronome(checked);
                }
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Estatísticas da sessão */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Estatísticas
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Tempo:</span>
              <span>{formatTime(sessionTime)}</span>
            </div>
            <div className="flex justify-between">
              <span>Loops:</span>
              <span>{sessionStats.totalLoops}</span>
            </div>
            <div className="flex justify-between">
              <span>Média Vel.:</span>
              <span>{Math.round(sessionStats.averageSpeed)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Perfeitos:</span>
              <span>{sessionStats.perfectLoops}</span>
            </div>
          </div>
        </div>

        {/* Reset */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetPracticeSettings}
          className="w-full"
        >
          <Settings className="h-4 w-4 mr-2" />
          Reset Configurações
        </Button>
      </CardContent>
    </Card>
  );
};

export default PracticeMode;
