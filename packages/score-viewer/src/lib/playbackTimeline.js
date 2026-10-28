// Playback timeline built from OSMD's own model (not from parsed XML), so every
// sounding note is tied to the cursor position and the SVG element it was drawn as.
//
// A step is one cursor position: all voice entries starting at the same time.
// Times follow the enrolled timestamp (repeats are played out) and the measure
// tempos; `seconds` is at the score's own tempo.

const WHOLE_NOTE_BEATS = 4;
const DEFAULT_BPM = 120;

const wholesToSeconds = (wholes, bpm) => (wholes * WHOLE_NOTE_BEATS * 60) / bpm;

export function buildTimeline(osmd) {
  const sheet = osmd?.Sheet;
  if (!sheet?.MusicPartManager) return null;

  const instruments = sheet.Instruments || [];
  const startBpm = sheet.DefaultStartTempoInBpm || sheet.userStartTempoInBPM || DEFAULT_BPM;
  const iterator = sheet.MusicPartManager.getIterator();

  const steps = [];
  const events = [];
  let bpm = startBpm;
  let prevWhole = 0;
  let seconds = 0;
  let endSeconds = 0;

  while (!iterator.EndReached) {
    const whole = iterator.CurrentEnrolledTimestamp.RealValue;
    seconds += wholesToSeconds(whole - prevWhole, bpm);
    prevWhole = whole;
    const measureBpm = iterator.CurrentMeasure?.TempoInBPM;
    if (measureBpm > 0) bpm = measureBpm;

    const voiceEntries = (iterator.CurrentVoiceEntries || []).filter((ve) => !ve.IsGrace);
    if (voiceEntries.length) {
      const index = steps.length;
      const notes = [];
      let stepEnd = seconds;
      for (const voiceEntry of voiceEntries) {
        for (const note of voiceEntry.Notes) {
          notes.push(note);
          const lengthSeconds = wholesToSeconds(note.Length?.RealValue || 0, bpm);
          stepEnd = Math.max(stepEnd, seconds + lengthSeconds);
          if (note.isRest() || typeof note.halfTone !== 'number') continue;
          // Tied notes sound once, for the whole tie
          const tie = note.NoteTie;
          if (tie && tie.StartNote !== note) continue;
          const instrument = note.ParentStaff?.ParentInstrument;
          const durationSeconds = tie ? wholesToSeconds(tie.Duration.RealValue, bpm) : lengthSeconds;
          events.push({
            step: index,
            // OSMD halfTone 48 = C4; PlaybackTranspose comes from <transpose><chromatic>
            midi: note.halfTone + 12 + (instrument?.PlaybackTranspose || 0),
            seconds,
            durationSeconds,
            channel: Math.max(0, instruments.indexOf(instrument)) % 16,
            velocity: 0.75,
            // Notes to highlight while it sounds (all of a tie)
            notes: tie ? tie.Notes : [note],
          });
          endSeconds = Math.max(endSeconds, seconds + durationSeconds);
        }
      }
      endSeconds = Math.max(endSeconds, stepEnd);
      steps.push({
        index,
        whole,
        seconds,
        bpm,
        measureIndex: iterator.CurrentMeasureIndex,
        iterator: iterator.clone(),
        notes,
      });
    }
    iterator.moveToNext();
  }

  return { steps, events, startBpm, totalSeconds: endSeconds };
}

// Last step starting at or before `seconds`
export function stepAtSeconds(timeline, seconds) {
  const { steps } = timeline;
  let lo = 0;
  let hi = steps.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (steps[mid].seconds <= seconds + 1e-6) lo = mid;
    else hi = mid - 1;
  }
  return Math.max(0, lo);
}
