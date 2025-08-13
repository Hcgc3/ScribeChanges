// Utility to extract MIDI-compatible note events from an OpenSheetMusicDisplay instance
// Produces a flat array of events plus optional track separation by instrument.
// Each event: { startFraction, durationFraction, startSeconds, durationSeconds, midi, pitch, octave, step, alter, velocity, instrument, instrumentIndex, channel }

const STEP_TO_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const TOLERANCE = 0.0001; // Tolerância para comparações de ponto flutuante
const VERTICAL_ENTRY_KEYS = ['verticalSourceStaffEntries','VerticalSourceStaffEntries','verticalStaffEntries','verticalSourceStaffEntryContainers','VerticalSourceStaffEntryContainers'];

/**
 * Converte um objeto Pitch (ou similar) para um número MIDI (C4 = 60).
 * Prioriza pitch.halfTone se for um valor MIDI válido (0-127).
 * @param {object} pitch - O objeto Pitch do OSMD.
 * @returns {number|null} O número MIDI correspondente ou null se a conversão falhar.
 */
function getMidiNumber(pitch) {
  if (!pitch) return null;

  // 1. Tentar usar pitch.halfTone se for um valor MIDI válido
  if (typeof pitch.halfTone === 'number') {
    if (pitch.halfTone >= 0 && pitch.halfTone <= 127) {
      return pitch.halfTone;
    } else {
      // Se halfTone estiver fora do range MIDI, pode ser um offset que precisa de ajuste.
      // A suposição de +12 é baseada na observação de C3=48, C4=60, etc.
      // console.warn('pitch.halfTone fora do range MIDI (0-127). Tentando ajuste: ' + pitch.halfTone);
      return pitch.halfTone + 12; // Exemplo de ajuste, pode variar dependendo da versão do OSMD
    }
  }

  // 2. Fallback para conversão baseada em step, octave, alter
  try {
    const step = (pitch.step || pitch.Step || '').toUpperCase();
    const octave = pitch.octave ?? pitch.Octave ?? 4; // C4 como oitava padrão
    const alter = pitch.alter ?? pitch.Alter ?? 0;

    if (!(step in STEP_TO_SEMITONE)) {
      // console.warn('Passo de pitch desconhecido: ' + step);
      return null;
    }

    const semitone = STEP_TO_SEMITONE[step] + alter;
    // Fórmula MIDI: C-1 = 0, então C4 (Dó central) = 60 -> (oitava + 1) * 12 + semitom
    const midi = (octave + 1) * 12 + semitone;

    // Validação final para garantir que o MIDI está no range válido
    if (midi >= 0 && midi <= 127) {
      return midi;
    } else {
      // console.warn('Número MIDI calculado fora do range válido (0-127): ' + midi);
      return null;
    }
  } catch (e) {
    console.error('Erro na conversão de pitch para MIDI:', e);
    return null;
  }
}

/**
 * Converte um objeto Fraction / fraction-like (numerador/denominador) para um valor numérico de nota inteira.
 * OSMD: nota inteira = 1, quarto = 1/4.
 * @param {object} f - O objeto Fraction.
 * @returns {number} O valor numérico da nota inteira.
 */
function fractionToWhole(f) {
  if (!f) return 0;
  if (typeof f.RealValue === 'number') return f.RealValue; // OSMD Fraction tem getter RealValue
  if (typeof f.numerator === 'number' && typeof f.denominator === 'number' && f.denominator !== 0) {
    return f.numerator / f.denominator;
  }
  return 0;
}

/**
 * Converte a duração da nota inteira para segundos dado o tempo em BPM (quarter notes por minuto).
 * @param {number} whole - Duração em unidades de nota inteira.
 * @param {number} tempoBPM - Tempo em batidas por minuto.
 * @returns {number} Duração em segundos.
 */
function wholeToSeconds(whole, tempoBPM) {
  const quarterSeconds = 60 / (tempoBPM || 120);
  return whole * 4 * quarterSeconds; // nota inteira = 4 quartos
}

/**
 * Helper: obtém um array de forma segura tentando múltiplos nomes de propriedades candidatas.
 * @param {object} obj - O objeto a partir do qual extrair o array.
 * @param {string[]} candidates - Nomes de propriedades candidatas.
 * @returns {Array} O array encontrado ou um array vazio.
 */
function pickArray(obj, candidates) {
  if (!obj) return [];
  for (const name of candidates) {
    const v = obj[name];
    if (Array.isArray(v) && v.length) return v;
  }
  return [];
}

/**
 * Extrai a duração de uma nota a partir de um objeto nota ou sourceNote.
 * @param {object} noteObj - O objeto nota ou sourceNote do OSMD.
 * @returns {number} A duração da nota em unidades de nota inteira.
 */
function getNoteDuration(noteObj) {
  if (!noteObj) return 0;
  const durationProps = [
    noteObj.Length, noteObj.length,
    noteObj.Duration, noteObj.duration
  ];
  for (const prop of durationProps) {
    const dur = fractionToWhole(prop);
    if (dur > 0) return dur;
  }
  // console.warn("Não foi possível determinar a duração da nota. Usando 0.25 (um quarto de nota) como padrão.", noteObj);
  return 0.25; // Duração padrão (um quarto de nota)
}

/**
 * Extrai eventos MIDI de uma instância OSMD, percorrendo as medidas.
 * @param {object} osmdInstance - A instância do OpenSheetMusicDisplay.
 * @param {number} tempo - O tempo em BPM.
 * @param {number[]} measureStartWholes - Array com o início de cada medida em unidades de nota inteira.
 * @returns {Array} Array de eventos MIDI.
 */
function extractFromMeasures(osmdInstance, tempo, measureStartWholes) {
  const sheet = osmdInstance.sheet || osmdInstance.Sheet;
  const sourceMeasures = pickArray(sheet, ['sourceMeasures', 'SourceMeasures']);
  const events = [];
  const skipTiedContinuation = new WeakSet();

  sourceMeasures.forEach((measure, mi) => {
    const verticalEntries = pickArray(measure, VERTICAL_ENTRY_KEYS);
    verticalEntries.forEach(vse => {
      const staffEntries = pickArray(vse, ['staffEntries', 'StaffEntries']);
      staffEntries.forEach(se => {
        const voiceEntries = pickArray(se, ['voiceEntries', 'VoiceEntries']);
        voiceEntries.forEach(ve => {
          const notes = pickArray(ve, ['Notes', 'notes']);
          notes.forEach(note => {
            try {
              const graphical = note; // possível GraphicalNote
              const srcNote = note.sourceNote || note.SourceNote || note;
              if (skipTiedContinuation.has(srcNote) || skipTiedContinuation.has(graphical)) return;
              const isRest = srcNote.isRest || note.isRest;
              if (isRest) return;
              const pitch = srcNote.Pitch || srcNote.pitch;
              const midi = getMidiNumber(pitch) ?? getMidiNumber(note.Pitch) ?? getMidiNumber(note.pitch);
              if (midi == null) return;

              let tsWhole = 0;
              try {
                if (typeof srcNote.getAbsoluteTimestamp === 'function') tsWhole = fractionToWhole(srcNote.getAbsoluteTimestamp());
                else if (srcNote.absoluteTimestamp) tsWhole = fractionToWhole(srcNote.absoluteTimestamp);
                else {
                  const measureStartTime = measureStartWholes[mi] || 0;
                  const localTimestamp = srcNote.Timestamp || note.Timestamp || ve.Timestamp;
                  tsWhole = measureStartTime + fractionToWhole(localTimestamp);
                }
              } catch { tsWhole = measureStartWholes[mi] || 0; }

              let durWhole = getNoteDuration(srcNote);

              const tieObj = srcNote.NoteTie || srcNote.noteTie || srcNote.tie;
              const isTieStart = tieObj && (tieObj.StartNote === srcNote || tieObj.startNote === srcNote);
              const isTieEndOnly = tieObj && !isTieStart && (tieObj.EndNote === srcNote || tieObj.endNote === srcNote);
              if (isTieEndOnly) {
                // continuação já agregada ao início
                return;
              }
              if (isTieStart) {
                let current = tieObj.EndNote || tieObj.endNote;
                const visited = new Set();
                while (current && !visited.has(current)) {
                  visited.add(current);
                  const contSrc = current.sourceNote || current.SourceNote || current;
                  if (contSrc === srcNote) break; // proteção
                  durWhole += getNoteDuration(contSrc);
                  // marcar ambas as referências (source e gráfica se existir ligação inversa)
                  skipTiedContinuation.add(contSrc);
                  // Tentar marcar também possíveis wrappers gráficos (heurística)
                  if (current !== contSrc) skipTiedContinuation.add(current);
                  const nextTie = current.NoteTie || current.noteTie || current.tie;
                  if (!nextTie || !nextTie.EndNote || nextTie.EndNote === current) break;
                  current = nextTie.EndNote;
                }
              }

              const startSeconds = wholeToSeconds(tsWhole, tempo);
              const durationSeconds = wholeToSeconds(durWhole, tempo);
              const velocity = (typeof srcNote.NoteOnVelocity === 'number' ? srcNote.NoteOnVelocity / 127 : 0.8);

              events.push({
                startFraction: tsWhole,
                durationFraction: durWhole,
                startSeconds,
                durationSeconds,
                midi,
                pitch: pitch?.step || pitch?.Step,
                octave: pitch?.octave ?? pitch?.Octave,
                step: pitch?.step || pitch?.Step,
                alter: pitch?.alter ?? pitch?.Alter ?? 0,
                velocity,
                instrument: 'Default',
                instrumentIndex: 0,
                channel: 0,
                voiceIndex: 0,
              });
            } catch {}
          });
        });
      });
    });
  });
  return events;
}

function inferMeasureDuration(measure) {
  // Try explicit Duration
  if (measure?.Duration) {
    const v = fractionToWhole(measure.Duration);
    if (v > 0) return v;
  }
  // Try verticalSourceStaffEntries max timestamp + max note length
  const verticalEntries = pickArray(measure, VERTICAL_ENTRY_KEYS);
  let maxEnd = 0;
  verticalEntries.forEach(vse => {
    const staffEntries = pickArray(vse, ['staffEntries','StaffEntries']);
    staffEntries.forEach(se => {
      const voiceEntries = pickArray(se, ['voiceEntries','VoiceEntries']);
      voiceEntries.forEach(ve => {
        const notes = pickArray(ve, ['Notes','notes']);
        notes.forEach(note => {
          const src = note.sourceNote || note.SourceNote || note;
            const ts = (() => {
              try { if (typeof src.getAbsoluteTimestamp === 'function') return fractionToWhole(src.getAbsoluteTimestamp()); } catch {}
              return fractionToWhole(src.Timestamp || note.Timestamp || ve.Timestamp);
            })();
            const dur = getNoteDuration(src);
            if (ts + dur > maxEnd) maxEnd = ts + dur;
        });
      });
    });
  });
  if (maxEnd > 0) return maxEnd;
  return 1; // fallback whole note
}

// Ensure deepDebugContext exists early
function deepDebugContextSafe(label, measures) {
  try {
    const first = measures?.[0];
    console.warn(label, {
      measures: measures?.length || 0,
      firstMeasureKeys: first ? Object.keys(first) : null,
      firstMeasureRaw: first
    });
  } catch {}
}

export function extractMidiEvents(osmdInstance, options = {}) {
  if (!osmdInstance) return { events: [], tracks: [], tempoEvents: [] };
  const sheet = osmdInstance.sheet || osmdInstance.Sheet;
  if (!sheet) return { events: [], tracks: [], tempoEvents: [] };
  const defaultTempo = sheet.defaultStartTempoInBpm || 120;
  const sourceMeasures = pickArray(sheet, ['sourceMeasures', 'SourceMeasures']);
  if (!sourceMeasures.length) deepDebugContextSafe('[Debug] No sourceMeasures', []);
  const useSimplePath = false; // was true; disabled to allow tie-aware extractFromMeasures path
  const tempoEvents = [{ measureIndex: 0, bpm: defaultTempo }];
  const measureStartWholes = sourceMeasures.map((_, i) => i);
  let events = [];
  // NEW: capture raw XML early
  const rawXML = options.rawXML || osmdInstance.rawMusicXML;
  if (useSimplePath && sourceMeasures.length) {
    try {
      const divisions = (() => {
        try { return sourceMeasures[0]?.Attributes?.divisions || sourceMeasures[0]?.attributes?.divisions || sourceMeasures[0].Divisions || sourceMeasures[0].divisions; } catch { return null; }
      })() || 2;
      console.warn('[SimplePath] divisions:', divisions, 'measures:', sourceMeasures.length, 'm0 keys:', Object.keys(sourceMeasures[0]||{}));
      const quarterPerDivision = 1 / divisions;
      sourceMeasures.forEach((measure, mi) => {
        const verticals = pickArray(measure, VERTICAL_ENTRY_KEYS);
        if (!verticals.length) console.warn('[SimplePath] measure', mi, 'no vertical arrays, keys:', Object.keys(measure||{}));
        const staffEntryBlocks = verticals.length ? verticals : [measure];
        const voiceTime = new Map();
        staffEntryBlocks.forEach(v => {
          const staffEntries = pickArray(v, ['staffEntries','StaffEntries']);
            if (!staffEntries.length) console.warn('[SimplePath] no staffEntries in block keys:', Object.keys(v||{}));
          staffEntries.forEach(se => {
            const voiceEntries = pickArray(se, ['voiceEntries','VoiceEntries']);
            if (!voiceEntries.length) console.warn('[SimplePath] no voiceEntries; staffEntry keys:', Object.keys(se||{}));
            voiceEntries.forEach(ve => {
              const notes = pickArray(ve, ['Notes','notes']);
              if (!notes.length) console.warn('[SimplePath] empty notes; voiceEntry keys:', Object.keys(ve||{}));
              const vId = ve?.voiceId || ve?.VoiceId || 0;
              if (!voiceTime.has(vId)) voiceTime.set(vId, 0);
              notes.forEach(note => {
                const src = note.sourceNote || note.SourceNote || note;
                if (src.isRest || note.isRest) return;
                const pitch = src.Pitch || src.pitch || note.Pitch || note.pitch; if (!pitch) return;
                const midi = getMidiNumber(pitch); if (midi == null) return;
                const rawDur = src.Duration || src.duration || note.Duration || note.duration || src.Length || src.length;
                const durDivs = typeof rawDur === 'number' ? rawDur : (rawDur?.numerator && rawDur?.denominator ? (rawDur.numerator / rawDur.denominator) * divisions : divisions);
                const durQuarter = durDivs * quarterPerDivision;
                const startQuarter = voiceTime.get(vId);
                const startWhole = startQuarter / 4 + measureStartWholes[mi];
                const durWhole = durQuarter / 4;
                events.push({ startFraction: startWhole, durationFraction: durWhole, midi, pitch: pitch.step||pitch.Step, octave: pitch.octave??pitch.Octave, step: pitch.step||pitch.Step, alter: pitch.alter??pitch.Alter??0, velocity:0.8, instrument:'Simple', instrumentIndex:0, channel:0, voiceIndex:vId });
                voiceTime.set(vId, startQuarter + durDivs);
              });
            });
          });
        });
      });
      if (!events.length) {
        console.warn('[MIDI Extract Simple] Nenhum evento na via simples.');
        deepDebugContextSafe('[Debug SimplePath measures dump]', sourceMeasures);
      }
    } catch (e) {
      console.warn('[MIDI Extract Simple] Falhou via simples:', e);
    }
  }
  if (!events.length) {
    const complex = extractFromMeasures(osmdInstance, defaultTempo, measureStartWholes);
    if (complex.length) events = complex; else deepDebugContextSafe('[Debug ComplexPath measures dump]', sourceMeasures);
  }
  if (!events.length) {
    // brute force + deep scan already defined earlier in file
    try {
      console.warn('[MIDI Extract Debug] Executando brute force scan');
      sourceMeasures.forEach((measure, mi) => {
        const verts = pickArray(measure, VERTICAL_ENTRY_KEYS);
        verts.forEach(v => {
          const staffEntries = pickArray(v, ['staffEntries','StaffEntries']);
          staffEntries.forEach(se => {
            const ves = pickArray(se, ['voiceEntries','VoiceEntries']);
            ves.forEach(ve => {
              pickArray(ve, ['Notes','notes']).forEach(note => {
                try {
                  const src = note.sourceNote || note.SourceNote || note;
                  if (src.isRest || note.isRest) return;
                  const pitch = src.Pitch || src.pitch || note.Pitch || note.pitch; if (!pitch) return;
                  const midi = getMidiNumber(pitch); if (midi == null) return;
                  const startWhole = measureStartWholes[mi];
                  const durWhole = 0.25; // fallback
                  events.push({ startFraction: startWhole, durationFraction: durWhole, midi, pitch: pitch.step||pitch.Step, octave: pitch.octave??pitch.Octave, step: pitch.step||pitch.Step, alter: pitch.alter??pitch.Alter??0, velocity:0.8, instrument:'BruteForce', instrumentIndex:0, channel:0, voiceIndex:0 });
                } catch {}
              });
            });
          });
        });
      });
      console.warn('[MIDI Extract Debug] Brute force events count:', events.length);
    } catch (e) { console.warn('[MIDI Extract Debug] brute force failed', e); }
  }
  if (!events.length) {
    const deepEvents = deepScanForNotes(osmdInstance, tempoEvents, measureStartWholes);
    if (deepEvents.length) events = deepEvents;
  }
  // RAW XML FALLBACK
  if (!events.length) {
    if (typeof rawXML === 'string' && rawXML.length > 0) {
      try {
        console.warn('[MIDI Extract RawXML Early] rawXML length:', rawXML.length);
        const rawEvents = parseRawMusicXMLForNotes(rawXML);
        console.warn('[MIDI Extract RawXML Early] parsed events:', rawEvents.length, rawEvents.slice(0,5));
        if (rawEvents.length) events = rawEvents; else console.warn('[MIDI Extract RawXML Early] Nenhum evento extraído do XML cru');
      } catch (e) {
        console.warn('[MIDI Extract RawXML Early] Falha ao analisar raw XML', e);
      }
    } else {
      console.warn('[MIDI Extract RawXML Early] rawXML indisponível', typeof rawXML, rawXML && rawXML.length);
    }
  }
  if (!events.length) return { events: [], tracks: [], tempoEvents };
  // Compute seconds
  events = dedupeEvents(events); // remove duplicates before timing
  events.forEach(ev => {
    ev.startSeconds = wholeToSeconds(ev.startFraction, defaultTempo);
    ev.durationSeconds = wholeToSeconds(ev.durationFraction, defaultTempo);
    ev.endSeconds = ev.startSeconds + ev.durationSeconds;
    // Assign channel round-robin by voice
    ev.channel = typeof ev.voiceIndex === 'number' ? (ev.voiceIndex % 16) : 0;
  });
  events.sort((a,b)=> a.startFraction - b.startFraction || a.midi - b.midi);
  return { tempo: defaultTempo, tempoEvents, events, tracks: [{ instrumentIndex:0, instrument:'Default', events }] };
}

/**
 * Realiza uma pesquisa binária para encontrar a medida correspondente a um timestamp.
 * @param {number} whole - O timestamp em unidades de nota inteira.
 * @param {Array} measureInfos - Array de informações da medida, ordenado por startWhole.
 * @returns {object} A medida correspondente ou a primeira medida se não for encontrada.
 */
const findMeasureBinarySearch = (whole, measureInfos) => {
  let low = 0;
  let high = measureInfos.length - 1;
  let result = measureInfos[0]; // Fallback para a primeira medida

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const currentMeasure = measureInfos[mid];

    if (whole >= currentMeasure.startWhole) {
      result = currentMeasure;
      low = mid + 1; // Tentar encontrar uma medida mais à frente
    } else {
      high = mid - 1; // A medida está antes desta
    }
  }
  return result;
};

export function extractMidiData(osmdInstance, options = {}) {
  const { tempo: forcedTempo } = options;
  const { tempo, events, tempoEvents } = extractMidiEvents(osmdInstance, options);
  const effectiveTempo = forcedTempo || tempo || 120;
  // Build measure info again quickly (could refactor to share)
  const sheet = osmdInstance?.sheet || osmdInstance?.Sheet;
  const sourceMeasures = pickArray(sheet, ['sourceMeasures', 'SourceMeasures']);
  const measureInfos = [];
  let acc = 0;
  for (let i = 0; i < sourceMeasures.length; i++) {
    const m = sourceMeasures[i];
    let num = 4, den = 4;
    try {
      const ts = m?.activeTimeSignature || m?.TimeSignature || m?.timeSignature;
      if (ts) { num = ts.Numerator ?? ts.numerator ?? num; den = ts.Denominator ?? ts.denominator ?? den; }
      else if (Array.isArray(m?.timeSignatures) && m.timeSignatures[0]) { num = m.timeSignatures[0].numerator ?? num; den = m.timeSignatures[0].denominator ?? den; }
    } catch {}
    const lengthWhole = inferMeasureDuration(m);
    measureInfos.push({ index: i, startWhole: acc, lengthWhole, num, den });
    acc += lengthWhole;
  }
  const toTimeString = (startWhole) => {
    const mi = findMeasureBinarySearch(startWhole, measureInfos) || { startWhole: 0, num: 4, den: 4 };
    const localWhole = startWhole - mi.startWhole;
    const beatLenWhole = 1 / mi.den;
    const beatsFloat = localWhole / beatLenWhole;
    const beatIndex = Math.floor(beatsFloat);
    const remainderWhole = localWhole - beatIndex * beatLenWhole;
    const sixteenthLenWhole = 1 / 16;
    let sixteenths = Math.round(remainderWhole / sixteenthLenWhole);
    if (sixteenths >= 16) sixteenths = 0;
    return `${mi.index}:${beatIndex}:${sixteenths}`; // fix typo
  };
  const NOTE_VALUES = { '1n':1,'2n':0.5,'4n':0.25,'8n':0.125,'16n':0.0625,'32n':0.03125 };
  const durationToNotation = (durWhole) => {
    for (const [label,value] of Object.entries(NOTE_VALUES)) {
      if (Math.abs(durWhole - value) < TOLERANCE) return label;
      if (Math.abs(durWhole - value * 1.5) < TOLERANCE) return label + '.';
      if (Math.abs(durWhole - value * (2/3)) < TOLERANCE) return label + 't';
    }
    return `${(durWhole / 0.25).toFixed(3)}q`;
  };
  const pitchString = (event) => {
    const step = (event.step || 'C').toUpperCase();
    const alter = event.alter || 0;
    const accidental = alter === 1 ? '#' : (alter === -1 ? 'b' : '');
    const octave = (event.octave ?? 4);
    return `${step}${accidental}${octave}`;
  };
  const midiData = events.map(ev => ({
    time: toTimeString(ev.startFraction),
    note: pitchString(ev),
    duration: durationToNotation(ev.durationFraction),
    velocity: ev.velocity ?? 0.8,
    midi: ev.midi,
    instrument: ev.instrument,
    channel: ev.channel,
    startFraction: ev.startFraction,
    durationFraction: ev.durationFraction,
    startSeconds: ev.startSeconds,
    durationSeconds: ev.durationSeconds,
    endSeconds: ev.endSeconds,
  }));
  return { tempo: effectiveTempo, tempoEvents, events: midiData, measureStartWholes: measureInfos.map(m => m.startWhole) };
}

export default extractMidiEvents;

function dedupeEvents(events){
  if(!Array.isArray(events) || events.length<2) return events;
  const map = new Map();
  for(const ev of events){
    const key = ev.startFraction + '|' + ev.midi + '|' + (ev.channel??0);
    if(!map.has(key)) map.set(key, ev); else {
      const prev = map.get(key);
      if((ev.startFraction + ev.durationFraction) > (prev.startFraction + prev.durationFraction)){
        map.set(key, ev);
      }
    }
  }
  return Array.from(map.values());
}

function deepScanForNotes(osmdInstance, tempoEvents, measureStartWholes){
  const root = osmdInstance?.sheet || osmdInstance?.Sheet || osmdInstance;
  if(!root) return [];
  const visited = new WeakSet();
  const queue = [root];
  const results = [];
  let idx = 0;
  const MAX_NODES = 50000;
  function findFraction(obj, keyHintRegex){
    for (const k of Object.keys(obj||{})){
      if (keyHintRegex.test(k)){
        const val = obj[k];
        if (val && typeof val === 'object'){
          if (typeof val.RealValue === 'number') return val; // OSMD Fraction
          if (typeof val.numerator === 'number' && typeof val.denominator === 'number') return val;
        }
      }
    }
    return null;
  }
  function findPitchContainer(o){
    if(!o||typeof o!=='object') return null;
    if (o.Pitch || o.pitch) return o;
    // If has halfTone directly
    if (typeof o.halfTone === 'number') return o;
    return null;
  }
  while(queue.length){
    const cur = queue.shift();
    if(!cur || typeof cur!=='object') continue;
    if(visited.has(cur)) continue;
    visited.add(cur);
    if(results.length>2000) break; // safety
    const pitchHolder = findPitchContainer(cur);
    if(pitchHolder){
      // Try to derive pitch structure
      const pitchObj = pitchHolder.Pitch || pitchHolder.pitch || pitchHolder;
      const midi = getMidiNumber(pitchObj);
      if (midi!=null){
        // Attempt timestamp
        let tsFraction = findFraction(cur, /timestamp/i) || findFraction(pitchHolder, /timestamp/i);
        let startWhole = tsFraction ? fractionToWhole(tsFraction) : null;
        if (startWhole==null || !isFinite(startWhole) || startWhole===0){
          // fallback: sequential quarter placement
          startWhole = idx * 0.25;
        }
        // Attempt duration
        let durFraction = findFraction(cur, /length|duration/i) || findFraction(pitchHolder, /length|duration/i);
        let durWhole = durFraction ? fractionToWhole(durFraction) : 0;
        if (durWhole<=0) durWhole = 0.25;
        const tempo = tempoEvents?.[0]?.bpm || 120;
        const startSeconds = wholeToSeconds(startWhole, tempo);
        const durationSeconds = wholeToSeconds(durWhole, tempo);
        const step = (pitchObj.step || pitchObj.Step || 'C');
        const octave = pitchObj.octave ?? pitchObj.Octave ?? 4;
        const alter = pitchObj.alter ?? pitchObj.Alter ?? 0;
        results.push({
          startFraction: startWhole,
            durationFraction: durWhole,
            startSeconds,
            durationSeconds,
            endSeconds: startSeconds + durationSeconds,
            midi,
            pitch: step,
            octave,
            step,
            alter,
            velocity: 0.8,
            instrument: 'DeepScan',
            instrumentIndex: 0,
            channel: 0,
            voiceIndex: 0,
        });
        idx++;
      }
    }
    if(results.length>=1 && results.length<4){
      // allow a few initial results then continue scanning a bit more for ordering
    }
    // enqueue children
    if(results.length<1500 && visited.size<MAX_NODES){
      for (const k of Object.keys(cur)){
        const val = cur[k];
        if (val && typeof val === 'object'){
          if (Array.isArray(val)){
            for (const item of val){
              if (item && typeof item === 'object') queue.push(item);
            }
          } else {
            queue.push(val);
          }
        }
      }
    }
  }
  if(results.length){
    results.sort((a,b)=> a.startFraction - b.startFraction || a.midi - b.midi);
    console.warn('[MIDI Extract Debug][DeepScan] Gerados eventos:', results.length);
  } else {
    console.warn('[MIDI Extract Debug][DeepScan] Nenhuma nota encontrada no scan genérico');
  }
  return results;
}

function parseRawMusicXMLForNotes(rawXml) {
  if (typeof rawXml !== 'string') return [];
  // Basic normalization: remove comments
  const xml = rawXml.replace(/<!--[^]*?-->/g, '');
  // Part list (score-part) extraction
  const partInfos = [];
  const partListRegex = /<score-part(?:\s+id="([^"]+)")?[^>]*>([\s\S]*?)<\/score-part>/gi;
  let plMatch;
  while ((plMatch = partListRegex.exec(xml))) {
    const pid = plMatch[1] || `P${partInfos.length+1}`;
    const block = plMatch[2];
    const name = /<part-name>([\s\S]*?)<\/part-name>/i.exec(block)?.[1]?.trim() || 'Instrument';
    partInfos.push({ id: pid, name });
  }
  // Split parts with their content (after part-list)
  const partContentRegex = /<part\s+id="([^"]+)">([\s\S]*?)<\/part>/gi;
  const partSegments = [];
  let pcMatch;
  while ((pcMatch = partContentRegex.exec(xml))) {
    partSegments.push({ id: pcMatch[1], content: pcMatch[2] });
  }
  let currentDivisions = 1;
  const divisionRegex = /<divisions>(\d+)<\/divisions>/g;
  const STEP_MAP = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  const TYPE_TO_FACTOR = { whole:4, half:2, quarter:1, eighth:0.5, '8th':0.5, 'eighth-note':0.5, '16th':0.25, sixteenth:0.25, '32nd':0.125, '64th':0.0625 };
  const allEvents = [];
  partSegments.forEach((seg, partIndex) => {
    // determine instrument name
    const info = partInfos.find(p => p.id === seg.id) || { name: `Part ${partIndex+1}` };
    // reset divisionsPositions per part
    const divisionsPositions = [];
    let dm;
    while ((dm = divisionRegex.exec(seg.content))) {
      divisionsPositions.push({ index: dm.index, divisions: parseInt(dm[1],10) });
    }
    divisionRegex.lastIndex = 0; // reset global regex
    const noteRegex = /<note(\s[^>]*)?>([\s\S]*?)<\/note>/g;
    let noteMatch;
    const rawNotes = [];
    let localCurrentDivs = currentDivisions;
    while ((noteMatch = noteRegex.exec(seg.content))) {
      const block = noteMatch[2];
      if(!block) continue;
      const isRest = /<rest\b/i.test(block);
      if (/<grace\b/i.test(block)) continue; // skip grace notes for timing
      while (divisionsPositions.length && divisionsPositions[0].index < noteMatch.index) {
        localCurrentDivs = divisionsPositions.shift().divisions || localCurrentDivs;
      }
      const step = /<step>([A-G])<\/step>/i.exec(block)?.[1]?.toUpperCase() || 'C';
      const alter = parseInt(/<alter>([-+]?\d+)<\/alter>/i.exec(block)?.[1] || '0', 10);
      const octave = parseInt(/<octave>(\d+)<\/octave>/i.exec(block)?.[1] || '4', 10);
      let durDivs = parseFloat(/<duration>(\d+)<\/duration>/i.exec(block)?.[1] || '0');
      const type = /<type>([a-z0-9\-]+)<\/type>/i.exec(block)?.[1];
      const dots = (block.match(/<dot\/>/gi) || []).length;
      const isChord = /<chord\b/i.test(block);
      const tm = /<time-modification>[\s\S]*?<actual-notes>(\d+)<\/actual-notes>[\s\S]*?<normal-notes>(\d+)<\/normal-notes>[\s\S]*?<\/time-modification>/i.exec(block);
      let actualNotes=null, normalNotes=null;
      if(tm){ actualNotes = parseInt(tm[1],10)||null; normalNotes = parseInt(tm[2],10)||null; }
      if(!durDivs){
        if(type){
          const factor = TYPE_TO_FACTOR[type.toLowerCase()];
          if(factor!=null){
            durDivs = factor * localCurrentDivs;
            if(dots===1) durDivs *= 1.5; else if(dots===2) durDivs *= 1.75;
            if(actualNotes && normalNotes && actualNotes>0){ durDivs *= (normalNotes/actualNotes); }
          } else durDivs = localCurrentDivs;
        } else durDivs = localCurrentDivs;
      }
      if(durDivs<=0) durDivs = localCurrentDivs;
      const hasFermata = /<fermata\b/i.test(block);
      if(hasFermata) durDivs *= 1.5; // simple fermata expansion (could be configurable)
      const maxDivs = localCurrentDivs * 32; if(durDivs>maxDivs) durDivs = maxDivs;
      const voice = parseInt(/<voice>(\d+)<\/voice>/i.exec(block)?.[1] || '1', 10);
      const tieStart = !isRest && /<tie[^>]*type="start"/i.test(block);
      const tieStop = !isRest && /<tie[^>]*type="stop"/i.test(block);
      rawNotes.push({ step, alter, octave, durDivs, voice, divisions: localCurrentDivs, isChord, partIndex, instrument: info.name, tieStart, tieStop, isRest });
    }
    // Tie merging (skip rests)
    const tieMap = new Map();
    for(const rn of rawNotes){
      if(rn.isRest) continue;
      const midi = (rn.octave + 1) * 12 + (STEP_MAP[rn.step] + rn.alter);
      const key = rn.voice + '|' + midi;
      if(rn.tieStart && !rn.tieStop){
        if(!tieMap.has(key)) tieMap.set(key, rn); else tieMap.set(key, rn);
      } else if(!rn.tieStart && rn.tieStop){
        const startNote = tieMap.get(key);
        if(startNote){ startNote.durDivs += rn.durDivs; rn.durDivs = 0; tieMap.delete(key); }
      } else if(rn.tieStart && rn.tieStop){
        const startNote = tieMap.get(key);
        if(startNote){ startNote.durDivs += rn.durDivs; rn.durDivs = 0; }
      }
    }
    const processed = rawNotes.filter(n => n.durDivs > 0.0001);
    const voiceTime = new Map();
    const voiceLastStart = new Map();
    processed.forEach(n => {
      const v = n.voice;
      const divs = n.divisions || 1;
      if(!voiceTime.has(v)) voiceTime.set(v,0);
      if(!voiceLastStart.has(v)) voiceLastStart.set(v,0);
      let startDivs = voiceTime.get(v);
      if(n.isChord && !n.isRest){ startDivs = voiceLastStart.get(v) || startDivs; }
      const startQuarter = startDivs / divs;
      const durQuarter = n.durDivs / divs;
      if(n.isRest){
        // advance time only
        voiceTime.set(v, startDivs + n.durDivs);
        voiceLastStart.set(v, startDivs);
        return;
      }
      const event = {
        startFraction: (startQuarter)/4,
        durationFraction: (durQuarter)/4,
        midi: (n.octave + 1) * 12 + (STEP_MAP[n.step] + n.alter),
        pitch: n.step,
        octave: n.octave,
        step: n.step,
        alter: n.alter,
        velocity: 0.8,
        instrument: n.instrument,
        instrumentIndex: n.partIndex,
        channel: n.partIndex % 16,
        voiceIndex: v,
      };
      if(!n.isChord){
        voiceTime.set(v, startDivs + n.durDivs);
        voiceLastStart.set(v, startDivs);
      }
      allEvents.push(event);
    });
  });
  if(allEvents.length){
    allEvents.sort((a,b)=> a.startFraction - b.startFraction || a.midi - b.midi);
    const first = allEvents[0];
    const last = allEvents[allEvents.length-1];
    console.warn('[RawXML Parser] Parts:', partInfos.length, 'Events:', allEvents.length, 'Range', first.startFraction, '->', last.startFraction + last.durationFraction);
  } else {
    console.warn('[RawXML Parser] Nenhum evento após parsing de partes.');
  }
  return allEvents;
}