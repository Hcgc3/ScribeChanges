import { log } from './logger.js';
import { Measure } from './model.js';

// ================================
// BEAT TRACKER - Melhorado
// ================================

class BeatTracker {
  // Calculate IOIs (inter-onset intervals) from note events
  calculateIOIs(midiEvents) {
    const onsets = midiEvents.filter(e => e.type === 'note').map(e => e.absTime).sort((a, b) => a - b);
    let iois = [];
    for (let i = 1; i < onsets.length; i++) {
      iois.push(onsets[i] - onsets[i - 1]);
    }
    return iois;
  }

  // Cluster IOIs into bins and find the most common interval
  clusterIOIs(iois, binSize) {
    let bins = {};
    for (let ioi of iois) {
      let bin = Math.round(ioi / binSize) * binSize;
      bins[bin] = (bins[bin] || 0) + 1;
    }
    // Find bin with highest count
    let maxBin = binSize;
    let maxCount = 0;
    for (let bin in bins) {
      if (bins[bin] > maxCount) {
        maxCount = bins[bin];
        maxBin = parseInt(bin);
      }
    }
    return maxBin;
  }

  // Build beat grid using the most common interval
  findBeats(midiEvents, divisions) {
    const iois = this.calculateIOIs(midiEvents);
    const ticksPerQuarter = divisions;
    // Use appropriate bin size based on divisions
    const binSize = Math.max(ticksPerQuarter / 8, 10);
    const beatInterval = this.clusterIOIs(iois, binSize);

    // Guard against invalid beatInterval
    if (!Number.isFinite(beatInterval) || beatInterval <= 0) {
      // Fallback: use ticksPerQuarter or return empty grid
      if (ticksPerQuarter > 0) {
        return [];
      }
    }

    // Build grid from first onset
    const onsets = midiEvents.filter(e => e.type === 'note').map(e => e.absTime).sort((a, b) => a - b);
    let beatGrid = [];
    if (onsets.length === 0) return beatGrid;

    let current = onsets[0];
    let last = onsets[onsets.length - 1];
    // Prevent infinite loop
    let maxBeats = 10000;
    let count = 0;
    while (current <= last + beatInterval && count < maxBeats) {
      beatGrid.push(current);
      current += beatInterval;
      count++;
    }
    return beatGrid;
  }
}

// ================================
// QUANTIZAÇÃO REAL
// ================================

function snapToGrid(absTime, divisions, granularity) {
  const gridSize = divisions * granularity;
  return Math.round(absTime / gridSize) * gridSize;
}

function quantizeToGrid(events, divisions, granularity, snapToGridEnabled = true) {
  if (!snapToGridEnabled) return events;
  
  return events.map(event => {
    if (event.type === 'note') {
      const quantizedStart = snapToGrid(event.absTime, divisions, granularity);
      const quantizedEnd = snapToGrid(event.absTime + event.duration, divisions, granularity);
      
      return {
        ...event,
        absTime: quantizedStart,
        duration: Math.max(divisions * 0.125, quantizedEnd - quantizedStart) // mínimo 32nd note
      };
    }
    return event;
  });
}

// ================================
// MAPEAMENTO COMPLETO DE DURAÇÕES
// ================================

function getDurationType(duration, ticksPerQuarter, allowDots = true) {
  // Mapeamento básico de durações
  const basicDurations = {
    [ticksPerQuarter * 4]: 'whole',
    [ticksPerQuarter * 2]: 'half',
    [ticksPerQuarter]: 'quarter',
    [ticksPerQuarter / 2]: 'eighth',
    [ticksPerQuarter / 4]: '16th',
    [ticksPerQuarter / 8]: '32nd',
    [ticksPerQuarter / 16]: '64th'
  };
  
  // Mapeamento de durações pontuadas
  const dottedDurations = {
    [ticksPerQuarter * 6]: { type: 'whole', dots: 1 },
    [ticksPerQuarter * 3]: { type: 'half', dots: 1 },
    [ticksPerQuarter * 1.5]: { type: 'quarter', dots: 1 },
    [ticksPerQuarter * 0.75]: { type: 'eighth', dots: 1 },
    [ticksPerQuarter * 0.375]: { type: '16th', dots: 1 }
  };
  
  // Verificar durações pontuadas primeiro
  if (allowDots) {
    for (const [dur, info] of Object.entries(dottedDurations)) {
      if (Math.abs(duration - parseFloat(dur)) < ticksPerQuarter * 0.05) {
        return info;
      }
    }
  }
  
  // Verificar durações básicas
  for (const [dur, type] of Object.entries(basicDurations)) {
    if (Math.abs(duration - parseFloat(dur)) < ticksPerQuarter * 0.05) {
      return { type, dots: 0 };
    }
  }
  
  // Detectar triplets
  const tripletDurations = {
    [ticksPerQuarter / 3]: 'eighth',
    [ticksPerQuarter / 6]: '16th',
    [ticksPerQuarter / 12]: '32nd'
  };
  
  for (const [dur, type] of Object.entries(tripletDurations)) {
    if (Math.abs(duration - parseFloat(dur)) < ticksPerQuarter * 0.02) {
      return { type, dots: 0, triplet: true };
    }
  }
  
  // Fallback: encontrar a duração mais próxima
  const durations = Object.keys(basicDurations).map(Number).sort((a, b) => a - b);
  let closestDuration = durations[0];
  let minDiff = Math.abs(duration - closestDuration);
  
  for (const dur of durations) {
    const diff = Math.abs(duration - dur);
    if (diff < minDiff) {
      minDiff = diff;
      closestDuration = dur;
    }
  }
  
  return { type: basicDurations[closestDuration], dots: 0 };
}

// ================================
// GERAÇÃO DE PAUSAS
// ================================

function generateRests(measure, ticksPerQuarter) {
  const measureDuration = measure.timeSignature.numerator * 
    (ticksPerQuarter * 4 / measure.timeSignature.denominator);
  
  let timeline = [];
  let currentTime = 0;
  
  // Ordenar eventos por tempo
  const sortedEvents = [...measure.notes, ...measure.directions]
    .sort((a, b) => a.absTime - b.absTime);
  
  for (const event of sortedEvents) {
    const relativeTime = event.absTime % measureDuration;
    
    // Se há gap antes do evento, adicionar rest
    if (relativeTime > currentTime) {
      const restDuration = relativeTime - currentTime;
      
      // Dividir rests longos em múltiplos rests se necessário
      const rests = splitLongDuration(restDuration, ticksPerQuarter, currentTime);
      timeline.push(...rests);
    }
    
    timeline.push(event);
    
    if (event.type === 'note') {
      currentTime = relativeTime + event.duration;
    } else {
      currentTime = relativeTime;
    }
  }
  
  // Rest final se necessário
  if (currentTime < measureDuration) {
    const restDuration = measureDuration - currentTime;
    const rests = splitLongDuration(restDuration, ticksPerQuarter, currentTime);
    timeline.push(...rests);
  }
  
  // Separar notes e directions
  measure.notes = timeline.filter(e => e.type === 'note' || e.type === 'rest');
  measure.directions = timeline.filter(e => e.type === 'direction');
}

function splitLongDuration(duration, ticksPerQuarter, startTime) {
  const rests = [];
  let remaining = duration;
  let currentPos = startTime;
  
  // Durações preferidas para rests (do maior para o menor)
  const restSizes = [
    ticksPerQuarter * 4, // whole rest
    ticksPerQuarter * 2, // half rest
    ticksPerQuarter,     // quarter rest
    ticksPerQuarter / 2, // eighth rest
    ticksPerQuarter / 4, // 16th rest
    ticksPerQuarter / 8  // 32nd rest
  ];
  
  while (remaining > 0) {
    let used = false;
    
    for (const size of restSizes) {
      if (remaining >= size && !used) {
        const restInfo = getDurationType(size, ticksPerQuarter);
        rests.push({
          type: 'rest',
          duration: size,
          absTime: currentPos,
          durationType: restInfo.type,
          dots: restInfo.dots || 0
        });
        
        remaining -= size;
        currentPos += size;
        used = true;
        break;
      }
    }
    
    // Se não conseguiu usar nenhum tamanho padrão, usar o menor
    if (!used) {
      const minSize = restSizes[restSizes.length - 1];
      const restInfo = getDurationType(minSize, ticksPerQuarter);
      rests.push({
        type: 'rest',
        duration: minSize,
        absTime: currentPos,
        durationType: restInfo.type,
        dots: 0
      });
      
      remaining -= minSize;
      currentPos += minSize;
    }
  }
  
  return rests;
}

// ================================
// DETECÇÃO DE ACORDES
// ================================

function groupSimultaneousNotes(notes, tolerance = 10) {
  let groups = [];
  let processed = new Set();
  
  for (let i = 0; i < notes.length; i++) {
    if (processed.has(i) || notes[i].type !== 'note') continue;
    
    let group = [notes[i]];
    processed.add(i);
    
    // Encontrar notas simultâneas (dentro da tolerância)
    for (let j = i + 1; j < notes.length; j++) {
      if (processed.has(j) || notes[j].type !== 'note') continue;
      
      if (Math.abs(notes[j].absTime - notes[i].absTime) <= tolerance) {
        group.push(notes[j]);
        processed.add(j);
      }
    }
    
    if (group.length > 1) {
      // Ordenar notas do acorde por altura (grave para agudo)
      group.sort((a, b) => a.pitch - b.pitch);
      
      groups.push({
        type: 'chord',
        notes: group,
        absTime: group[0].absTime,
        duration: Math.max(...group.map(n => n.duration)),
        pitches: group.map(n => n.pitch)
      });
    } else {
      groups.push(group[0]);
    }
  }
  
  return groups;
}

// ================================
// DETECÇÃO DE LIGADURAS (TIES)
// ================================

function detectTies(measures, ticksPerQuarter) {
  for (let measureIdx = 0; measureIdx < measures.length; measureIdx++) {
    const measure = measures[measureIdx];
    
    // Ties dentro do mesmo compasso
    for (let i = 0; i < measure.notes.length - 1; i++) {
      const currentNote = measure.notes[i];
      const nextNote = measure.notes[i + 1];
      
      if (shouldBeTied(currentNote, nextNote)) {
        currentNote.tie = { type: 'start' };
        nextNote.tie = { type: 'stop' };
      }
    }
    
    // Ties entre compassos
    if (measureIdx < measures.length - 1) {
      const nextMeasure = measures[measureIdx + 1];
      const lastNote = measure.notes[measure.notes.length - 1];
      const firstNote = nextMeasure.notes[0];
      
      if (lastNote && firstNote && shouldBeTied(lastNote, firstNote)) {
        lastNote.tie = { type: 'start' };
        firstNote.tie = { type: 'stop' };
        
        // Ajustar duração se necessário
        const overlap = (lastNote.absTime + lastNote.duration) - firstNote.absTime;
        if (overlap > 0) {
          lastNote.duration -= overlap;
        }
      }
    }
  }
}

function shouldBeTied(note1, note2) {
  return note1.type === 'note' && 
         note2.type === 'note' &&
         note1.pitch === note2.pitch &&
         Math.abs((note1.absTime + note1.duration) - note2.absTime) < 10; // 10 tick tolerance
}

// ================================
// SEPARAÇÃO DE VOZES
// ================================

function separateVoices(notes, maxVoices = 4) {
  if (notes.length === 0) return [[]];
  
  // Separar por simultaneidade primeiro
  const simultaneousGroups = groupSimultaneousNotes(notes, 20);
  
  // Algoritmo de separação baseado em altura e continuidade
  let voices = [];
  
  for (const item of simultaneousGroups) {
    if (item.type === 'chord') {
      // Distribuir notas do acorde pelas vozes
      const chordNotes = item.notes.sort((a, b) => b.pitch - a.pitch); // agudo para grave
      
      for (let i = 0; i < chordNotes.length && i < maxVoices; i++) {
        if (!voices[i]) voices[i] = [];
        voices[i].push(chordNotes[i]);
      }
    } else {
      // Nota única - encontrar a voz mais apropriada
      let bestVoice = 0;
      let bestScore = -Infinity;
      
      for (let v = 0; v < Math.min(maxVoices, voices.length + 1); v++) {
        if (!voices[v]) voices[v] = [];
        
        const score = calculateVoiceScore(item, voices[v]);
        if (score > bestScore) {
          bestScore = score;
          bestVoice = v;
        }
      }
      
      voices[bestVoice].push(item);
    }
  }
  
  // Ordenar cada voz por tempo
  voices.forEach(voice => {
    voice.sort((a, b) => a.absTime - b.absTime);
  });
  
  return voices.filter(voice => voice.length > 0);
}

function calculateVoiceScore(note, voice) {
  if (voice.length === 0) return 0;
  
  const lastNote = voice[voice.length - 1];
  
  // Preferir continuidade temporal
  const timeGap = note.absTime - (lastNote.absTime + lastNote.duration);
  const timeScore = timeGap >= 0 ? 100 : -100; // Penalizar overlap
  
  // Preferir continuidade de altura
  const pitchDiff = Math.abs(note.pitch - lastNote.pitch);
  const pitchScore = Math.max(0, 50 - pitchDiff);
  
  return timeScore + pitchScore;
}

// ================================
// VALIDAÇÃO DE COMPASSOS
// ================================

function validateMeasures(measures, ticksPerQuarter) {
  const results = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  for (const measure of measures) {
    const validation = validateSingleMeasure(measure, ticksPerQuarter);
    
    if (!validation.valid) {
      results.valid = false;
      results.errors.push(`Measure ${measure.number}: ${validation.error}`);
    }
    
    if (validation.warnings.length > 0) {
      results.warnings.push(...validation.warnings.map(w => 
        `Measure ${measure.number}: ${w}`));
    }
  }
  
  return results;
}

function validateSingleMeasure(measure, ticksPerQuarter) {
  const expectedDuration = measure.timeSignature.numerator * 
    (ticksPerQuarter * 4 / measure.timeSignature.denominator);
  
  let actualDuration = 0;
  let hasOverlaps = false;
  const warnings = [];
  
  // Calcular duração total das notas/pausas
  const sortedEvents = measure.notes.sort((a, b) => a.absTime - b.absTime);
  
  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const relativeTime = event.absTime % expectedDuration;
    
    actualDuration = Math.max(actualDuration, relativeTime + (event.duration || 0));
    
    // Verificar overlaps
    if (i > 0) {
      const prevEvent = sortedEvents[i - 1];
      const prevEnd = (prevEvent.absTime % expectedDuration) + (prevEvent.duration || 0);
      
      if (relativeTime < prevEnd && event.type === 'note' && prevEvent.type === 'note') {
        hasOverlaps = true;
        warnings.push(`Overlap detected between notes at ${prevEvent.absTime} and ${event.absTime}`);
      }
    }
  }
  
  const durationDiff = Math.abs(actualDuration - expectedDuration);
  const tolerance = ticksPerQuarter * 0.1; // 10% tolerance
  
  return {
    valid: durationDiff <= tolerance,
    error: durationDiff > tolerance ? 
      `Duration mismatch: expected ${expectedDuration}, got ${actualDuration}` : null,
    warnings: warnings,
    hasOverlaps: hasOverlaps,
    actualDuration: actualDuration,
    expectedDuration: expectedDuration
  };
}

// ================================
// CONFIGURAÇÃO ADAPTATIVA
// ================================

function calculateAdaptiveSettings(midiEvents, divisions) {
  const noteEvents = midiEvents.filter(e => e.type === 'note');
  
  if (noteEvents.length === 0) {
    return {
      granularity: 0.25,
      tolerance: divisions * 0.1,
      maxVoices: 2
    };
  }
  
  // Analisar IOIs para determinar granularity
  const iois = [];
  for (let i = 1; i < noteEvents.length; i++) {
    iois.push(noteEvents[i].absTime - noteEvents[i-1].absTime);
  }
  
  const avgIOI = iois.reduce((sum, ioi) => sum + ioi, 0) / iois.length;
  const stdDev = Math.sqrt(
    iois.reduce((sum, ioi) => sum + Math.pow(ioi - avgIOI, 2), 0) / iois.length
  );
  
  // Determinar granularity baseada na complexidade rítmica
  let granularity;
  if (avgIOI > divisions) {
    granularity = 1.0; // Música lenta - granularity grossa
  } else if (avgIOI > divisions / 2) {
    granularity = 0.5; // Média
  } else if (avgIOI > divisions / 4) {
    granularity = 0.25; // Rápida
  } else {
    granularity = 0.125; // Muito rápida
  }
  
  // Tolerância baseada no desvio padrão
  const tolerance = Math.min(divisions / 8, stdDev * 0.5);
  
  // Determinar número máximo de vozes baseado na densidade
  const maxSimultaneous = analyzeMaxSimultaneousNotes(noteEvents);
  const maxVoices = Math.min(4, Math.max(1, maxSimultaneous));
  
  return {
    granularity,
    tolerance,
    maxVoices,
    avgIOI,
    stdDev,
    complexity: stdDev / avgIOI // Medida de complexidade rítmica
  };
}

function analyzeMaxSimultaneousNotes(noteEvents, tolerance = 10) {
  let maxSimultaneous = 1;
  
  for (let i = 0; i < noteEvents.length; i++) {
    let simultaneous = 1;
    const currentTime = noteEvents[i].absTime;
    
    for (let j = i + 1; j < noteEvents.length; j++) {
      if (Math.abs(noteEvents[j].absTime - currentTime) <= tolerance) {
        simultaneous++;
      } else {
        break;
      }
    }
    
    maxSimultaneous = Math.max(maxSimultaneous, simultaneous);
  }
  
  return maxSimultaneous;
}

// ================================
// FUNÇÕES AUXILIARES
// ================================

function preprocessTimeSignatureChanges(events, config) {
  if (!config.timeSignatures || config.timeSignatures.length <= 1) {
    return events;
  }
  
  let splitEvents = [];
  
  for (let event of events) {
    if (event.type === 'note') {
      const noteStart = event.absTime;
      const noteEnd = event.absTime + event.duration;
      let splits = [noteStart];
      
      // Encontrar pontos de divisão
      for (let i = 1; i < config.timeSignatures.length; i++) {
        const tsTime = config.timeSignatures[i].absTime;
        if (tsTime > noteStart && tsTime < noteEnd) {
          splits.push(tsTime);
        }
      }
      splits.push(noteEnd);
      
      // Criar segmentos
      for (let i = 0; i < splits.length - 1; i++) {
        const segmentStart = splits[i];
        const segmentEnd = splits[i + 1];
        const duration = segmentEnd - segmentStart;
        
        if (duration > 0) {
          // Encontrar time signature apropriada
          let timeSignature = config.timeSignatures[0];
          for (let j = config.timeSignatures.length - 1; j >= 0; j--) {
            if (segmentStart >= config.timeSignatures[j].absTime) {
              timeSignature = config.timeSignatures[j];
              break;
            }
          }
          
          splitEvents.push({
            ...event,
            absTime: segmentStart,
            duration: duration,
            timeSignature: timeSignature
          });
        }
      }
    } else {
      splitEvents.push(event);
    }
  }
  
  return splitEvents;
}

function createMeasuresFromEvents(events, divisions, beatsPerMeasure, config) {
  const ticksPerMeasure = beatsPerMeasure * divisions;
  
  // Determinar número total de compassos necessários
  let maxTime = 0;
  for (const event of events) {
    const endTime = event.absTime + (event.duration || 0);
    if (endTime > maxTime) maxTime = endTime;
  }
  
  const numMeasures = Math.ceil(maxTime / ticksPerMeasure);
  const measures = [];
  
  // Criar compassos vazios
  for (let i = 0; i < numMeasures; i++) {
    measures.push(new Measure({
      number: i + 1,
      notes: [],
      directions: [],
      timeSignature: {
        numerator: beatsPerMeasure,
        denominator: 4
      }
    }));
  }
  
  // Atribuir eventos aos compassos
  for (const event of events) {
    const measureIndex = Math.floor(event.absTime / ticksPerMeasure);
    
    if (measureIndex < measures.length) {
      if (event.type === 'note' || event.type === 'rest' || event.type === 'chord') {
        measures[measureIndex].notes.push(event);
      } else if (event.type === 'direction') {
        measures[measureIndex].directions.push(event);
      }
    }
  }
  
  // Remover compassos vazios no final
  while (measures.length > 0 && 
         measures[measures.length - 1].notes.length === 0 &&
         measures[measures.length - 1].directions.length === 0) {
    measures.pop();
  }
  
  return measures;
}

// ================================
// FUNÇÃO PRINCIPAL MELHORADA
// ================================

export function quantizeEvents(events, divisions, beatsPerMeasure = 4, config = {}) {
  const logger = { info: (msg) => log(msg, 'info', config), warn: (msg) => log(msg, 'warn', config) };
  
  logger.info(`Starting quantization of ${events.length} events`);
  
  // 1. Configuração adaptativa
  const adaptiveSettings = calculateAdaptiveSettings(events, divisions);
  const finalConfig = {
    granularity: config.quantization?.granularity || adaptiveSettings.granularity,
    tolerance: config.quantization?.tolerance || adaptiveSettings.tolerance,
    maxVoices: config.maxVoices || adaptiveSettings.maxVoices,
    snapToGrid: config.quantization?.snapToGrid ?? true,
    generateRests: config.generateRests ?? true,
    detectTies: config.detectTies ?? true,
    separateVoices: config.separateVoices ?? false,
    ...config
  };
  
  logger.info(`Adaptive settings: granularity=${finalConfig.granularity}, tolerance=${finalConfig.tolerance}, maxVoices=${finalConfig.maxVoices}`);
  
  // 2. Pre-processamento: dividir notas em mudanças de time signature
  let processedEvents = preprocessTimeSignatureChanges(events, finalConfig);
  
  // 3. Quantização real das posições temporais
  if (finalConfig.snapToGrid) {
    processedEvents = quantizeToGrid(processedEvents, divisions, finalConfig.granularity);
  }
  
  // 4. Melhorar tipos de duração
  processedEvents = processedEvents.map(event => {
    if (event.type === 'note') {
      const durationInfo = getDurationType(event.duration, divisions, true);
      return {
        ...event,
        durationType: durationInfo.type,
        dots: durationInfo.dots || 0,
        triplet: durationInfo.triplet || false
      };
    }
    return event;
  });
  
  // 5. Agrupar acordes
  const noteEvents = processedEvents.filter(e => e.type === 'note');
  const otherEvents = processedEvents.filter(e => e.type !== 'note');
  const groupedNotes = groupSimultaneousNotes(noteEvents, finalConfig.tolerance);
  
  // 6. Separar vozes se solicitado
  let voices = [groupedNotes];
  if (finalConfig.separateVoices && groupedNotes.length > 0) {
    voices = separateVoices(groupedNotes, finalConfig.maxVoices);
  }
  
  // 7. Criar compassos
  const measures = createMeasuresFromEvents([...groupedNotes, ...otherEvents], 
    divisions, beatsPerMeasure, finalConfig);
  
  // 8. Gerar pausas se solicitado
  if (finalConfig.generateRests) {
    measures.forEach(measure => generateRests(measure, divisions));
  }
  
  // 9. Detectar ties se solicitado
  if (finalConfig.detectTies) {
    detectTies(measures, divisions);
  }
  
  // 10. Validar compassos
  const validation = validateMeasures(measures, divisions);
  if (!validation.valid) {
    logger.warn('Measure validation failed: ' + validation.errors.join(', '));
  }
  if (validation.warnings.length > 0) {
    logger.warn('Measure validation warnings: ' + validation.warnings.join(', '));
  }
  
  // 11. Estatísticas finais
  const stats = {
    totalMeasures: measures.length,
    totalNotes: measures.reduce((sum, m) => sum + m.notes.filter(n => n.type === 'note').length, 0),
    totalRests: measures.reduce((sum, m) => sum + m.notes.filter(n => n.type === 'rest').length, 0),
    validationErrors: validation.errors.length,
    voices: voices.length,
    adaptiveSettings
  };
  
  logger.info(`Quantization completed: ${stats.totalMeasures} measures, ${stats.totalNotes} notes, ${stats.totalRests} rests`);
  
  return measures;
}

// Manter compatibilidade com função original (caso seja usada em outros lugares)
export { quantizeEvents as quantizeEventsImproved };