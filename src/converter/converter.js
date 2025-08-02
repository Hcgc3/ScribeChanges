import logCollector from '../lib/logCollector.js';
// Glue module: full MIDI → MusicXML pipeline
import { parseMidi } from './midiParser.js';
import { quantizeEvents } from './quantizer.js';
import { transformMeasure } from './transformer.js';
import { serializeToMusicXML } from './xmlSerializer.js';
import { Score, Part } from './model.js';
// import logger from './logger.winston.js';

export async function midiBufferToMusicXML(buffer) {
  try {
    logCollector.log('[Converter] Starting MIDI-to-MusicXML conversion');
    const timings = {};
    let t0, t1;

    // 1. Parse MIDI
    t0 = performance.now();
    const { divisions, events } = (() => {
      try {
        const result = parseMidi(buffer);
        logCollector.log('[Converter] MIDI parsed:', result);
        return result;
      } catch (err) {
        logCollector.error('[Converter] Error in parseMidi:', err);
        throw err;
      }
    })();
    t1 = performance.now();
    timings.parseMidi = t1 - t0;

    // 2. Quantize events into measures
    t0 = performance.now();
    const measuresRaw = (() => {
      try {
        const result = quantizeEvents(events, divisions);
        logCollector.log('[Converter] Events quantized:', result);
        return result;
      } catch (err) {
        logCollector.error('[Converter] Error in quantizeEvents:', err);
        throw err;
      }
    })();
    t1 = performance.now();
    timings.quantizeEvents = t1 - t0;

    // 3. Transform measures to model objects
    t0 = performance.now();
    const measures = (() => {
      try {
        const result = measuresRaw.map(m => transformMeasure(m, divisions));
        logCollector.log('[Converter] Measures transformed:', result);
        return result;
      } catch (err) {
        logCollector.error('[Converter] Error in transformMeasure:', err);
        throw err;
      }
    })();
    t1 = performance.now();
    timings.transformMeasures = t1 - t0;

    // 4. Build Score object
    t0 = performance.now();
    let score;
    try {
      score = new Score({
        parts: [new Part({ id: 'P1', measures })],
        divisions,
      });
      logCollector.log('[Converter] Score built:', score);
    } catch (err) {
      logCollector.error('[Converter] Error building Score:', err);
      throw err;
    }
    t1 = performance.now();
    timings.buildScore = t1 - t0;

    // 5. Serialize to MusicXML
    t0 = performance.now();
    try {
      const xml = serializeToMusicXML(score);
      logCollector.log('[Converter] MusicXML serialized:', xml);
      t1 = performance.now();
      timings.serializeToMusicXML = t1 - t0;
      logCollector.log('[Converter] Performance timings (ms):', timings);
      return xml;
    } catch (err) {
      logCollector.error('[Converter] Error in serializeToMusicXML:', err);
      throw err;
    }
  } catch (err) {
    logCollector.error('[Converter] Conversion failed:', err);
    throw err;
  }
}
