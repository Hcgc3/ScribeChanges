import { useCallback } from 'react';

export const useMusicalAnalysis = () => {
  
  // Analyze musical content from OSMD instance
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
      
      // Get time signature from first measure
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

      // Analyze each measure
      if (sheet.sourceMeasures) {
        sheet.sourceMeasures.forEach((sourceMeasure, measureIndex) => {
          const measureData = {
            index: measureIndex,
            number: measureIndex + 1,
            timeSignature,
            beats: [],
            barLine: null
          };

          // Find notes and their positions within the measure
          if (sourceMeasure.verticalSourceStaffEntryContainers) {
            sourceMeasure.verticalSourceStaffEntryContainers.forEach((container) => {
              if (container.sourceStaffEntries) {
                container.sourceStaffEntries.forEach((staffEntry) => {
                  if (staffEntry.voiceEntries) {
                    staffEntry.voiceEntries.forEach((voiceEntry) => {
                      if (voiceEntry.notes && voiceEntry.notes.length > 0) {
                        // Calculate beat position based on note duration and position
                        const duration = voiceEntry.length ? voiceEntry.length.realValue : 0.25;
                        const beatPosition = calculateBeatPosition(
                          container.timestamp, 
                          timeSignature,
                          duration
                        );

                        measureData.beats.push({
                          position: beatPosition,
                          duration: duration,
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

          // Sort beats by position
          measureData.beats.sort((a, b) => a.position - b.position);

          // Add bar line information
          measureData.barLine = {
            type: 'single', // Could be 'double', 'final', etc.
            position: 'end'
          };

          measures.push(measureData);
        });
      }

      return {
        measures,
        timeSignature,
        keySignature: 'C', // Could be extracted from key signature
        tempo: 120 // Could be extracted from tempo markings
      };

    } catch (error) {
      console.error('Error analyzing score:', error);
      return {
        measures: [],
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: 'C',
        tempo: 120
      };
    }
  }, []);

  // Calculate beat position within a measure
  const calculateBeatPosition = useCallback((timestamp, timeSignature) => {
    if (!timestamp) return 0;
    
    // Convert timestamp to beat position
    const beatsPerMeasure = timeSignature.numerator;
    const beatValue = (1 / timeSignature.denominator) * 4; // Quarter note = 1 beat in 4/4
    
    return (timestamp.realValue / beatValue) % beatsPerMeasure;
  }, []);

  // Get note type from duration
  const getNoteType = useCallback((duration) => {
    if (duration >= 1) return 'whole';
    if (duration >= 0.5) return 'half';
    if (duration >= 0.25) return 'quarter';
    if (duration >= 0.125) return 'eighth';
    if (duration >= 0.0625) return 'sixteenth';
    return 'thirty-second';
  }, []);

  // Generate control points based on musical analysis
  const generateControlPoints = useCallback((analysis, containerRect) => {
    if (!analysis || !analysis.measures || !containerRect) {
      return [];
    }

    const controlPoints = [];

    analysis.measures.forEach((measure, measureIndex) => {
      // Calculate measure position (simplified)
      const measureWidth = containerRect.width / analysis.measures.length;
      const measureX = measureIndex * measureWidth;

      // Add bar line control point (larger)
      controlPoints.push({
        id: `barline-${measureIndex}`,
        type: 'barline',
        measureIndex,
        position: { x: measureX + measureWidth - 10, y: containerRect.height / 2 },
        size: 'large',
        color: '#10b981', // Green for bar lines
        draggable: true,
        constraints: {
          axis: 'horizontal', // Only horizontal movement
          minX: measureX + measureWidth * 0.7,
          maxX: measureX + measureWidth * 1.3
        }
      });

      // Add beat control points (smaller) - only for occupied beats
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
          color: '#3b82f6', // Blue for beats
          draggable: true,
          constraints: {
            axis: 'horizontal',
            minX: measureX,
            maxX: measureX + measureWidth
          },
          metadata: {
            duration: beat.duration,
            notes: beat.notes
          }
        });
      });
    });

    return controlPoints;
  }, []);

  return {
    analyzeScore,
    generateControlPoints,
    calculateBeatPosition,
    getNoteType
  };
};
