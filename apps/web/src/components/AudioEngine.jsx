import React, { useState, useEffect, useRef, useCallback } from 'react';
// Importação normal do Tone.js com verificação de contexto
import * as Tone from 'tone';

// ✅ Função helper para verificar se o áudio pode ser usado
const canUseAudio = () => {
  try {
    return Tone.context.state === 'running';
  } catch (error) {
    return false;
  }
};
import { Button } from '@ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card.jsx';
import { Slider } from '@ui/slider.jsx';
import { Badge } from '@ui/badge.jsx';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle
} from 'lucide-react';

/**
 * Motor de áudio avançado usando Tone.js
 */
const AudioEngine = ({ 
  musicXML = null,
  selectedMeasures = [],
  onTimeUpdate,
  onPlaybackStateChange,
  className = ""
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [tempo, setTempo] = useState(120);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const synthRef = useRef(null);
  const sequenceRef = useRef(null);
  const transportRef = useRef(null);
  const notesRef = useRef([]);

    useEffect(() => {
    // ✅ Não inicializar automaticamente - aguardar gesto do usuário
    console.log('🎵 AudioEngine carregado. Clique Play para ativar áudio.');

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      // ✅ Verificar se audio context está ativo antes de parar
      if (canUseAudio()) {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
    };
  }, []);

  // Processar MusicXML para notas (simulação)
  useEffect(() => {
    if (musicXML && isInitialized) {
      processMusicXML();
    }
  }, [musicXML, isInitialized]);

  const processMusicXML = useCallback(() => {
    // Simulação de processamento de MusicXML
    // Em uma implementação real, seria necessário um parser de MusicXML
    const mockNotes = [
      { note: 'G4', time: '0:0:0', duration: '4n' },
      { note: 'A4', time: '0:1:0', duration: '4n' },
      { note: 'B4', time: '0:2:0', duration: '4n' },
      { note: 'C5', time: '0:3:0', duration: '4n' },
      { note: 'D5', time: '1:0:0', duration: '2n' },
      { note: 'E5', time: '1:2:0', duration: '4n' },
      { note: 'F#5', time: '1:3:0', duration: '4n' },
      { note: 'G5', time: '2:0:0', duration: '8n' },
      { note: 'F#5', time: '2:0:2', duration: '8n' },
      { note: 'E5', time: '2:1:0', duration: '8n' },
      { note: 'D5', time: '2:1:2', duration: '8n' },
      { note: 'C5', time: '2:2:0', duration: '2n' },
      { note: 'G4', time: '3:0:0', duration: '1n' }
    ];

    notesRef.current = mockNotes;
    setDuration(16); // 4 compassos * 4 tempos = 16 tempos
    
    console.log('Notas processadas:', mockNotes.length);
  }, []);

  // Atualizar volume
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = isMuted ? -Infinity : Tone.gainToDb(volume);
    }
  }, [volume, isMuted]);

  // Atualizar tempo
  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  // Controles de reprodução
  const handlePlay = useCallback(async () => {
    try {
      // ✅ Iniciar contexto de áudio apenas após gesto do usuário
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('✅ AudioContext iniciado após gesto do usuário');
      }

      // Inicializar motor de áudio se ainda não foi inicializado
      if (!isInitialized) {
        // Criar sintetizador
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "triangle"
          },
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          }
        }).toDestination();

        // Configurar volume inicial
        synthRef.current.volume.value = Tone.gainToDb(volume);

        // Configurar tempo
        Tone.Transport.bpm.value = tempo;

        setIsInitialized(true);
        console.log('Motor de áudio inicializado após primeira reprodução');
      }

      // Criar sequência se não existir
      if (!sequenceRef.current && notesRef.current.length > 0) {
        const notesToPlay = selectedMeasures.length > 0 
          ? filterNotesByMeasures(notesRef.current, selectedMeasures)
          : notesRef.current;

        sequenceRef.current = new Tone.Part((time, note) => {
          synthRef.current.triggerAttackRelease(note.note, note.duration, time);
        }, notesToPlay.map(note => [note.time, note]));

        sequenceRef.current.loop = isLooping;
        sequenceRef.current.start(0);
      }

      // Configurar callback de tempo
      const timeCallback = (time) => {
        const currentSeconds = Tone.Transport.seconds;
        setCurrentTime(currentSeconds);
        if (onTimeUpdate) {
          onTimeUpdate(currentSeconds);
        }
      };

      Tone.Transport.scheduleRepeat(timeCallback, '16n');

      // Iniciar reprodução
      Tone.Transport.start();
      setIsPlaying(true);

      if (onPlaybackStateChange) {
        onPlaybackStateChange({ isPlaying: true, currentTime: Tone.Transport.seconds });
      }

    } catch (error) {
      console.error('Erro ao reproduzir:', error);
    }
  }, [isInitialized, selectedMeasures, isLooping, onTimeUpdate, onPlaybackStateChange]);

  const handlePause = useCallback(() => {
    Tone.Transport.pause();
    setIsPlaying(false);

    if (onPlaybackStateChange) {
      onPlaybackStateChange({ isPlaying: false, currentTime: Tone.Transport.seconds });
    }
  }, [onPlaybackStateChange]);

  const handleStop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    Tone.Transport.seconds = 0;

    if (onPlaybackStateChange) {
      onPlaybackStateChange({ isPlaying: false, currentTime: 0 });
    }
  }, [onPlaybackStateChange]);

  const handleSeek = useCallback((newTime) => {
    const wasPlaying = isPlaying;
    
    if (wasPlaying) {
      handleStop();
    }
    
    Tone.Transport.seconds = newTime;
    setCurrentTime(newTime);
    
    if (wasPlaying) {
      setTimeout(() => handlePlay(), 100);
    }
  }, [isPlaying, handleStop, handlePlay]);

  // Filtrar notas por compassos selecionados
  const filterNotesByMeasures = (notes, measures) => {
    return notes.filter(note => {
      const measure = Math.floor(parseFloat(note.time.split(':')[0])) + 1;
      return measures.includes(measure);
    });
  };

  // Formatação de tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-blue-600" />
          Motor de Áudio Avançado
          {selectedMeasures.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedMeasures.length} compasso(s) selecionado(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controles principais */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSeek(Math.max(0, currentTime - 5))}
            disabled={!isInitialized}
            className="w-10 h-10 p-0"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="lg"
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={!isInitialized || notesRef.current.length === 0}
            className="w-12 h-12 p-0"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={!isInitialized}
            className="w-10 h-10 p-0"
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSeek(Math.min(duration, currentTime + 5))}
            disabled={!isInitialized}
            className="w-10 h-10 p-0"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 min-w-12">
              {formatTime(currentTime)}
            </span>
            
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                onValueChange={(value) => handleSeek(value[0])}
                max={duration}
                step={0.1}
                className="w-full"
                disabled={!isInitialized}
              />
            </div>
            
            <span className="text-sm text-gray-600 min-w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controles secundários */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="w-8 h-8 p-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <div className="w-20">
              <Slider
                value={[volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
                disabled={isMuted}
              />
            </div>
            
            <span className="text-xs text-gray-600 min-w-8">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Opções */}
          <div className="flex items-center gap-2">
            <Button
              variant={isLooping ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLooping(!isLooping)}
              className="w-8 h-8 p-0"
              title="Repetir"
            >
              <Repeat className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Controle de tempo */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Tempo:</span>
          <div className="flex-1">
            <Slider
              value={[tempo]}
              onValueChange={(value) => setTempo(value[0])}
              min={60}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <Badge variant="outline" className="min-w-16 text-center">
            {tempo} BPM
          </Badge>
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isInitialized && Tone.context.state === 'running' 
                ? 'bg-green-500' 
                : 'bg-yellow-500'
            }`} />
            {isInitialized && Tone.context.state === 'running' 
              ? 'Motor ativo' 
              : 'Clique em Play para ativar áudio'
            }
          </div>
          
          <div>
            {notesRef.current.length} nota(s) carregada(s)
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioEngine;

