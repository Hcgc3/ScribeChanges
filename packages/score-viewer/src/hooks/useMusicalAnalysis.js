import { useCallback } from 'react';

export const useMusicalAnalysis = () => {
  // Same implementation as app, trimmed for package
  const analyzeScore = useCallback((osmdInstance) => {
    if (!osmdInstance || !osmdInstance.sheet) {
      return {
        measures: [],
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: 'C',
        tempo: 120
      };
    }
    try {
      const sheet = osmdInstance.sheet;
      const measures = [];
      let timeSignature = { numerator: 4, denominator: 4 };
      if (sheet.sourceMeasures && sheet.sourceMeasures.length > 0) {
        const firstMeasure = sheet.sourceMeasures[0];
        if (firstMeasure.activeTimeSignature) {
          timeSignature = {
            numerator: firstMeasure.activeTimeSignature.numerator,
            denominator: firstMeasure.activeTimeSignature.denominator
          };
        }
      }
      if (sheet.sourceMeasures) {
        sheet.sourceMeasures.forEach((sourceMeasure, measureIndex) => {
          const measureData = { index: measureIndex, number: measureIndex + 1, timeSignature, beats: [], barLine: null };
          if (sourceMeasure.verticalSourceStaffEntryContainers) {
            sourceMeasure.verticalSourceStaffEntryContainers.forEach((container) => {
              if (container.sourceStaffEntries) {
                container.sourceStaffEntries.forEach((staffEntry) => {
                  if (staffEntry.voiceEntries) {
                    staffEntry.voiceEntries.forEach((voiceEntry) => {
                      if (voiceEntry.notes && voiceEntry.notes.length > 0) {
                        const duration = voiceEntry.length ? voiceEntry.length.realValue : 0.25;
                        const beatPosition = calculateBeatPosition(container.timestamp, timeSignature, duration);
                        measureData.beats.push({
                          position: beatPosition,
                          duration,
                          noteType: getNoteType(duration),
                          notes: voiceEntry.notes.map(note => ({
                            pitch: note.pitch ? `${note.pitch.fundamentalNote}${note.pitch.octave}` : 'C4',
                            accidental: note.pitch ? note.pitch.accidental : null
                          })),
                          timestamp: container.timestamp
                        });
                      }
                    });
                  }
                });
              }
            });
          }
          measureData.beats.sort((a, b) => a.position - b.position);
          measureData.barLine = { type: 'single', position: 'end' };
          measures.push(measureData);
        });
      }
      return { measures, timeSignature, keySignature: 'C', tempo: 120 };
    } catch (error) {
      console.error('Error analyzing score:', error);
      return { measures: [], timeSignature: { numerator: 4, denominator: 4 }, keySignature: 'C', tempo: 120 };
    }
  }, []);

  const calculateBeatPosition = useCallback((timestamp, timeSignature) => {
    if (!timestamp) return 0;
    const beatsPerMeasure = timeSignature.numerator;
    const beatValue = (1 / timeSignature.denominator) * 4;
    return (timestamp.realValue / beatValue) % beatsPerMeasure;
  }, []);

  const getNoteType = useCallback((duration) => {
    if (duration >= 1) return 'whole';
    if (duration >= 0.5) return 'half';
    if (duration >= 0.25) return 'quarter';
    if (duration >= 0.125) return 'eighth';
    if (duration >= 0.0625) return 'sixteenth';
    return 'thirty-second';
  }, []);

  const generateControlPoints = useCallback((analysis, containerRect) => {
    if (!analysis || !analysis.measures || !containerRect) return [];
    const controlPoints = [];
    analysis.measures.forEach((measure, measureIndex) => {
      const measureWidth = containerRect.width / analysis.measures.length;
      const measureX = measureIndex * measureWidth;
      controlPoints.push({
        id: `barline-${measureIndex}`,
        type: 'barline',
        measureIndex,
        position: { x: measureX + measureWidth - 10, y: containerRect.height / 2 },
        size: 'large',
        color: '#10b981',
        draggable: true,
        constraints: { axis: 'horizontal', minX: measureX + measureWidth * 0.7, maxX: measureX + measureWidth * 1.3 }
      });
      measure.beats.forEach((beat, beatIndex) => {
        const beatX = measureX + (beat.position / analysis.timeSignature.numerator) * measureWidth;
        controlPoints.push({
          id: `beat-${measureIndex}-${beatIndex}`,
          type: 'beat',
          measureIndex,
          beatIndex,
          beatPosition: beat.position,
          noteType: beat.noteType,
          position: { x: beatX, y: containerRect.height / 2 + 20 },
          size: 'small',
          color: '#3b82f6',
          draggable: true,
          constraints: { axis: 'horizontal', minX: measureX, maxX: measureX + measureWidth },
          metadata: { duration: beat.duration, notes: beat.notes }
        });
      });
    });
    return controlPoints;
  }, []);

  return { analyzeScore, generateControlPoints, calculateBeatPosition, getNoteType };
};
