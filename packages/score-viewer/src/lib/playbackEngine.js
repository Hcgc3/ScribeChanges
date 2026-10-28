import * as Tone from 'tone';
import { useScoreStore } from '@/lib/stores/score-store';
import { initTone, getSynth, setMasterVolume } from './tonePlayer';
import { buildTimeline, stepAtSeconds } from './playbackTimeline';
import { extractScoreMetadata } from './scoreInfo';

// Playback engine: plays the OSMD timeline through Tone and draws a playback
// line (and note highlights) in sync, so sound, line and selection share one clock.
//
// Everything is scheduled in transport ticks computed at REF_BPM. The transport
// bpm is then REF_BPM * (chosen tempo / score tempo), so the BPM control changes
// the speed live without rescheduling.

const REF_BPM = 120;
const SELECTED_CLASS = 'score-note-selected';
const PLAYING_CLASS = 'score-note-playing';
// The playback line reaches a bit above and below the staff system
const PLAYHEAD_OVERHANG = 10;

let osmd = null;
let sheet = null;
let timeline = null;
let scheduled = false;
let currentStep = 0;
let noteElements = new Map(); // SVG <g> -> step index
let noteToElement = new Map(); // OSMD Note -> SVG <g>
let selectedElements = [];
let playingElements = new Set();
let positions = []; // per step: { page, x, top, height } in page px
let playhead = null;
let smoothFrame = null;

const transport = () => Tone.getTransport();
const ticksAt = (seconds) => Math.round(seconds * (REF_BPM / 60) * transport().PPQ);
const secondsAtTicks = (ticks) => ticks / transport().PPQ / (REF_BPM / 60);
const store = () => useScoreStore.getState();
const tempoScale = () => (timeline ? timeline.startBpm / (store().playbackState.tempo || timeline.startBpm) : 1);
const playheadMode = () => store().viewSettings.playheadMode ?? 'smooth';
const highlightOn = () => store().viewSettings.highlightPlayingNotes ?? true;

const releaseAll = () => {
  for (let ch = 0; ch < 16; ch++) {
    try { getSynth(ch)?.releaseAll(); } catch { /* channel not created */ }
  }
};

// ---- playback line ------------------------------------------------------------

// Where each step is drawn, read straight from OSMD's layout (OSMD units are
// 10px): x of the leftmost note, the staff system's top/height and its page
// <div>. Same geometry as OSMD's cursor, without moving it 600+ times (~2s).
const UNIT_PX = 10;
const measurePositions = () => {
  positions = [];
  if (!osmd || !timeline) return;
  const pages = osmd.GraphicSheet?.MusicPages || [];
  const container = osmd.container;
  let last = null;
  for (const step of timeline.steps) {
    let pos = null;
    for (const note of step.notes) {
      const staffEntry = osmd.EngravingRules.GNote(note)?.parentVoiceEntry?.parentStaffEntry;
      const system = staffEntry?.parentMeasure?.ParentMusicSystem;
      if (!system?.StaffLines?.length) continue;
      const x = staffEntry.PositionAndShape.AbsolutePosition.x * UNIT_PX;
      if (pos && x >= pos.x) continue;
      const first = system.StaffLines[0];
      const lastLine = system.StaffLines[system.StaffLines.length - 1];
      const sysY = system.PositionAndShape.AbsolutePosition.y;
      const top = sysY + first.PositionAndShape.RelativePosition.y;
      const bottom = sysY + lastLine.PositionAndShape.RelativePosition.y + lastLine.StaffHeight;
      const pageIndex = pages.indexOf(system.Parent);
      pos = {
        page: container?.querySelector(`#osmdCanvasPage${pageIndex + 1}`) || last?.page,
        x,
        top: top * UNIT_PX,
        height: (bottom - top) * UNIT_PX,
      };
    }
    pos = pos || last;
    positions.push(pos);
    last = pos;
  }
};

const placePlayhead = (pos, x = pos.x) => {
  if (!pos?.page) return;
  if (!playhead) {
    playhead = document.createElement('div');
    playhead.className = 'score-playhead';
    playhead.setAttribute('aria-hidden', 'true');
  }
  if (playhead.parentElement !== pos.page) pos.page.appendChild(playhead);
  // Even pages may be shifted for mirrored margins (see scoreFormatting)
  const shift = parseFloat(pos.page.dataset.mirrorShift) || 0;
  playhead.style.transform = `translate(${x + shift}px, ${pos.top - PLAYHEAD_OVERHANG}px)`;
  playhead.style.height = `${pos.height + PLAYHEAD_OVERHANG * 2}px`;
};

const removePlayhead = () => {
  playhead?.remove();
  playhead = null;
};

// Keep the playback line inside the score viewport while playing
const followPlayhead = () => {
  const viewport = playhead?.closest('.score-viewport');
  if (!viewport) return;
  const c = playhead.getBoundingClientRect();
  const v = viewport.getBoundingClientRect();
  const margin = 48;
  let dy = 0;
  let dx = 0;
  if (c.bottom > v.bottom - margin) dy = c.top - v.top - margin * 2;
  else if (c.top < v.top + margin) dy = c.top - v.top - margin;
  if (c.right > v.right - margin) dx = c.left - v.left - margin * 2;
  else if (c.left < v.left + margin) dx = c.left - v.left - margin;
  if (dx || dy) viewport.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
};

// Step mode (and every seek/stop): the line jumps to the step
const moveCursorTo = (index, { follow = false, place = true } = {}) => {
  if (!timeline?.steps[index]) return;
  currentStep = index;
  if (place) placePlayhead(positions[index]);
  if (follow) followPlayhead();
};

// Smooth mode: glide between steps on the same system, following the audio clock
// (ticks at the context's current time, i.e. what is being heard now)
const smoothTick = () => {
  smoothFrame = requestAnimationFrame(smoothTick);
  if (!timeline || playheadMode() !== 'smooth') return;
  const seconds = secondsAtTicks(transport().getTicksAtTime(Tone.immediate()));
  const i = stepAtSeconds(timeline, seconds);
  const pos = positions[i];
  const next = positions[i + 1];
  if (!pos) return;
  let x = pos.x;
  const from = timeline.steps[i].seconds;
  const to = timeline.steps[i + 1]?.seconds;
  if (next && next.page === pos.page && next.top === pos.top && to > from) {
    x += (next.x - pos.x) * Math.min(1, Math.max(0, (seconds - from) / (to - from)));
  }
  placePlayhead(pos, x);
};

const startSmooth = () => {
  if (smoothFrame == null) smoothFrame = requestAnimationFrame(smoothTick);
};

const stopSmooth = () => {
  if (smoothFrame != null) cancelAnimationFrame(smoothFrame);
  smoothFrame = null;
};

// ---- note <-> SVG mapping (selection, highlights) ---------------------------

const buildNoteElements = () => {
  noteElements = new Map();
  noteToElement = new Map();
  if (!timeline || !osmd?.EngravingRules) return;
  for (const step of timeline.steps) {
    for (const note of step.notes) {
      try {
        const g = osmd.EngravingRules.GNote(note)?.getSVGGElement?.();
        if (!g) continue;
        const el = g.closest('.vf-stavenote') || g;
        noteElements.set(el, step.index);
        noteToElement.set(note, el);
      } catch { /* not drawn (e.g. hidden staff) */ }
    }
  }
};

const highlightRange = (start, end) => {
  selectedElements.forEach((el) => el.classList.remove(SELECTED_CLASS));
  selectedElements = [];
  if (start == null) return;
  noteElements.forEach((index, el) => {
    if (index >= start && index <= end) {
      el.classList.add(SELECTED_CLASS);
      selectedElements.push(el);
    }
  });
};

const setPlaying = (notes, on) => {
  for (const note of notes) {
    const el = noteToElement.get(note);
    if (!el) continue;
    if (on) { el.classList.add(PLAYING_CLASS); playingElements.add(el); }
    else { el.classList.remove(PLAYING_CLASS); playingElements.delete(el); }
  }
};

const clearPlaying = () => {
  playingElements.forEach((el) => el.classList.remove(PLAYING_CLASS));
  playingElements = new Set();
};

// ---- scheduling ------------------------------------------------------------------

const publishTime = (index) => {
  const step = timeline?.steps[index];
  if (!step) return;
  store().setCurrentTime(step.seconds * tempoScale());
};

const schedule = () => {
  const t = transport();
  const draw = Tone.getDraw();
  t.cancel();
  if (!timeline) return;

  for (const ev of timeline.events) {
    const startTicks = ticksAt(ev.seconds);
    const durationTicks = Math.max(1, ticksAt(ev.durationSeconds));
    const frequency = Tone.Frequency(ev.midi, 'midi').toFrequency();
    t.schedule((time) => {
      const synth = getSynth(ev.channel) || getSynth(0);
      synth?.triggerAttackRelease(frequency, `${durationTicks}i`, time, ev.velocity);
      if (highlightOn()) draw.schedule(() => setPlaying(ev.notes, true), time);
    }, `${startTicks}i`);
    t.schedule((time) => {
      draw.schedule(() => setPlaying(ev.notes, false), time);
    }, `${startTicks + durationTicks}i`);
  }

  for (const step of timeline.steps) {
    t.schedule((time) => {
      draw.schedule(() => {
        // In smooth mode the frame loop draws the line; steps still follow/scroll and tick the clock
        moveCursorTo(step.index, { follow: true, place: playheadMode() !== 'smooth' });
        publishTime(step.index);
      }, time);
    }, `${ticksAt(step.seconds)}i`);
  }

  // End of the piece (not reached while looping a region inside it)
  t.schedule((time) => {
    draw.schedule(() => {
      if (!transport().loop) stopPlayback();
    }, time);
  }, `${ticksAt(timeline.totalSeconds)}i`);

  scheduled = true;
};

const applyTempo = () => {
  if (!timeline) return;
  transport().bpm.value = REF_BPM * (1 / tempoScale());
};

const applyLoop = () => {
  if (!timeline) return;
  const t = transport();
  const { loop, loopStart, loopEnd } = store().playbackState;
  t.loop = !!loop;
  if (!loop) return;
  const startStep = timeline.steps[loopStart ?? 0] || timeline.steps[0];
  const after = timeline.steps[(loopEnd ?? timeline.steps.length - 1) + 1];
  t.loopStart = `${ticksAt(startStep.seconds)}i`;
  t.loopEnd = `${ticksAt(after ? after.seconds : timeline.totalSeconds)}i`;
};

// Where play/stop return to: the selection, else the start
const homeStep = () => store().selection?.startStep ?? 0;

// ---- public API ----------------------------------------------------------------------

// Call after every OSMD render: graphical positions and SVG elements change.
export function attachPlayback(instance) {
  const isNewScore = instance?.Sheet !== sheet;
  if (isNewScore) stopPlayback({ keepPosition: false });
  osmd = instance;
  sheet = instance?.Sheet || null;
  timeline = buildTimeline(instance);
  scheduled = false;
  if (!timeline || !timeline.steps.length) return;

  buildNoteElements();
  measurePositions();
  clearPlaying();

  const s = store();
  if (isNewScore) {
    s.setSelection(null);
    s.clearLoopRegion();
    // An edit reloads the score as a new sheet: keep the chosen tempo then
    if (!s.file?.edit) s.updatePlaybackState({ tempo: Math.round(timeline.startBpm) });
    // Real title/composer/key/time from the score (loadScore only knew the file name)
    s.setMetadata({ ...(s.metadata || {}), ...extractScoreMetadata(instance, timeline) });
    currentStep = 0;
  } else {
    const sel = s.selection;
    if (sel?.startStep != null) highlightRange(sel.startStep, sel.endStep);
  }
  s.updatePlaybackState({ duration: timeline.totalSeconds * tempoScale() });
  moveCursorTo(Math.min(currentStep, timeline.steps.length - 1));
  publishTime(currentStep);
}

export function detachPlayback() {
  stopPlayback({ keepPosition: false });
  highlightRange(null);
  removePlayhead();
  positions = [];
  osmd = null;
  sheet = null;
  timeline = null;
  noteElements = new Map();
}

export async function startPlayback() {
  if (!timeline?.steps.length) return;
  await initTone();
  const t = transport();
  if (!scheduled) schedule();
  setMasterVolume(store().playbackState.volume ?? 0.8);
  applyTempo();
  applyLoop();

  // The cursor already sits where playback should start (stop, selection or seek put it there)
  let fromStep = currentStep;
  if (t.loop) {
    const { loopStart, loopEnd } = store().playbackState;
    if (fromStep < (loopStart ?? 0) || fromStep > (loopEnd ?? Infinity)) fromStep = loopStart ?? 0;
  }
  t.ticks = ticksAt(timeline.steps[fromStep].seconds);
  moveCursorTo(fromStep, { follow: true });
  t.start();
  startSmooth();
  store().updatePlaybackState({ isPlaying: true, isPaused: false });
}

export function pausePlayback() {
  transport().pause();
  releaseAll();
  stopSmooth();
  clearPlaying();
  moveCursorTo(currentStep);
  store().updatePlaybackState({ isPlaying: false, isPaused: true });
}

export function stopPlayback({ keepPosition = true } = {}) {
  try { transport().stop(); } catch { /* transport not started yet */ }
  releaseAll();
  stopSmooth();
  clearPlaying();
  store().updatePlaybackState({ isPlaying: false, isPaused: false });
  if (keepPosition && timeline) {
    moveCursorTo(homeStep());
    publishTime(homeStep());
  }
}

export function togglePlayback() {
  if (store().playbackState.isPlaying) pausePlayback();
  else startPlayback();
}

export function seekToStep(index) {
  if (!timeline?.steps.length) return;
  const i = Math.max(0, Math.min(timeline.steps.length - 1, index));
  if (store().playbackState.isPlaying) {
    releaseAll();
    clearPlaying();
    transport().ticks = ticksAt(timeline.steps[i].seconds);
  }
  moveCursorTo(i, { follow: true });
  publishTime(i);
}

// `seconds` as shown in the UI (at the chosen tempo)
export function seekToSeconds(seconds) {
  if (!timeline) return;
  seekToStep(stepAtSeconds(timeline, seconds / tempoScale()));
}

export function seekMeasure(delta) {
  if (!timeline?.steps.length) return;
  const { measureIndex } = timeline.steps[currentStep];
  const target = measureIndex + delta;
  // Previous: back to the start of this measure first if we're inside it
  const firstOfCurrent = timeline.steps.findIndex((s) => s.measureIndex === measureIndex);
  if (delta < 0 && currentStep > firstOfCurrent && store().playbackState.isPlaying) {
    seekToStep(firstOfCurrent);
    return;
  }
  const index = delta < 0
    ? timeline.steps.findIndex((s) => s.measureIndex === target)
    : timeline.steps.findIndex((s) => s.measureIndex >= target);
  if (index >= 0) seekToStep(index);
}

export function setPlaybackTempo(bpm) {
  store().setTempo(bpm);
  if (!timeline) return;
  applyTempo();
  store().updatePlaybackState({ duration: timeline.totalSeconds * tempoScale() });
  publishTime(currentStep);
}

// Loop the selected range, or the whole piece when nothing (or one note) is selected
export function togglePlaybackLoop() {
  const s = store();
  if (s.playbackState.loop) {
    s.clearLoopRegion();
  } else {
    const sel = s.selection;
    const range = sel?.startStep != null && sel.endStep > sel.startStep
      ? [sel.startStep, sel.endStep]
      : [0, (timeline?.steps.length || 1) - 1];
    s.setLoopRegion(range[0], range[1]);
  }
  applyLoop();
}

export function setPlaybackVolume(volume) {
  store().setVolume(volume);
  setMasterVolume(volume);
}

// Select the note under (or nearest to) a click. `extend` (Shift) selects a range.
// The note of a chord whose notehead is nearest to the point
const nearestNoteIn = (notes, clientY) => {
  let best = null;
  notes.forEach((note) => {
    let d = 0;
    try {
      const heads = osmd.EngravingRules.GNote(note)?.getNoteheadSVGs?.() || [];
      const r = (heads[0] || noteToElement.get(note))?.getBoundingClientRect();
      d = r ? Math.abs(r.top + r.height / 2 - clientY) : 0;
    } catch { d = 0; }
    if (!best || d < best.d) best = { note, d };
  });
  return best?.note || null;
};

function applySelection(startStep, endStep, anchor, note = null) {
  const s = store();
  const first = timeline.steps[startStep];
  const last = timeline.steps[endStep];
  s.setSelection({
    type: startStep === endStep ? 'note' : 'range',
    anchorStep: anchor,
    startStep,
    endStep,
    startMeasure: first.measureIndex + 1,
    endMeasure: last.measureIndex + 1,
    timestamp: first.whole,
    notes: timeline.steps.slice(startStep, endStep + 1).flatMap((st) => st.notes),
    // The clicked note itself (what duration/delete/pitch edits act on)
    note: startStep === endStep ? note : null,
  });
  if (startStep === endStep && note && noteToElement.get(note)) {
    highlightRange(null);
    const el = noteToElement.get(note);
    el.classList.add(SELECTED_CLASS);
    selectedElements = [el];
  } else {
    highlightRange(startStep, endStep);
  }
  // An active loop follows a new range selection
  if (s.playbackState.loop && endStep > startStep) {
    s.setLoopRegion(startStep, endStep);
    applyLoop();
  }
  seekToStep(startStep);
}

// Select the note under (or nearest to) a click. `extend` (Shift) selects a range.
export function selectAtPoint(clientX, clientY, { extend = false } = {}) {
  if (!timeline) return false;
  let index;
  let hitEl = document.elementFromPoint(clientX, clientY)?.closest?.('.vf-stavenote');
  if (hitEl && noteElements.has(hitEl)) {
    index = noteElements.get(hitEl);
  } else {
    // Nearest note head within reach of the click
    let best = Infinity;
    hitEl = null;
    noteElements.forEach((i, el) => {
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - clientX, 0, clientX - r.right);
      const dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
      const d = Math.hypot(dx, dy);
      if (d < best) { best = d; index = i; hitEl = el; }
    });
    if (best > 24) { index = undefined; hitEl = null; }
  }

  const s = store();
  if (index === undefined) {
    if (!extend) clearSelection();
    return false;
  }
  const anchor = extend && s.selection?.anchorStep != null ? s.selection.anchorStep : index;
  const note = nearestNoteIn(timeline.steps[index].notes.filter((n) => noteToElement.get(n) === hitEl), clientY);
  applySelection(Math.min(anchor, index), Math.max(anchor, index), anchor, note);
  return true;
}

// Select a note by where it is in the XML (after an edit reloads the score).
// `match(note)` -> boolean picks it among the notes of the steps in that measure.
export function selectWhere(measureIndex, match) {
  if (!timeline) return false;
  for (const step of timeline.steps) {
    if (step.measureIndex !== measureIndex) continue;
    const note = step.notes.find(match);
    if (note) {
      applySelection(step.index, step.index, step.index, note);
      return true;
    }
  }
  return false;
}

export function clearSelection() {
  store().setSelection(null);
  highlightRange(null);
}

export function setPlayheadMode(mode) {
  store().updateViewSettings({ playheadMode: mode });
  // Leaving smooth mode mid-play: snap the line to the current step
  if (mode !== 'smooth') moveCursorTo(currentStep);
}

export function setHighlightPlayingNotes(on) {
  store().updateViewSettings({ highlightPlayingNotes: on });
  if (!on) clearPlaying();
}
