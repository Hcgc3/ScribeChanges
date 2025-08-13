import * as Tone from 'tone';

let ready = false;
let currentPart = null;
let scheduledIds = [];

// New audio graph nodes
let masterGain = null;
let limiter = null; // safety to avoid speaker damage
let channelGains = []; // up to 16 MIDI channels
let synths = []; // per-channel polysynths

function createChannel(index){
  const gain = new Tone.Gain(0.8).connect(masterGain);
  const poly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.5 }
  });
  poly.connect(gain);
  channelGains[index] = gain;
  synths[index] = poly;
}

function ensureChannels(count = 16){
  for(let i=0;i<count;i++){
    if(!channelGains[i]) createChannel(i);
  }
}

export const forceResumeAudio = async () => {
  try { await Tone.start(); } catch {}
  try { const ctx = Tone.getContext(); if (ctx.state !== 'running') await ctx.rawContext.resume(); } catch {}
};

export const initTone = async () => {
  if (ready) return { synths, transport: Tone.Transport };
  await forceResumeAudio();
  limiter = new Tone.Limiter(-3).toDestination();
  masterGain = new Tone.Gain(0.8).connect(limiter);
  ensureChannels();
  Tone.Transport.bpm.value = 120;
  Tone.Transport.loop = false;
  ready = true;
  return { synths, transport: Tone.Transport };
};

export const isToneReady = () => ready;
export const getSynth = (ch = 0) => synths[ch];
export const getTransport = () => Tone.Transport;
export const setMasterVolume = (v) => { if(masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v)); };
export const getMasterVolume = () => masterGain ? masterGain.gain.value : 0;
export const setChannelVolume = (ch, v) => { if(channelGains[ch]) channelGains[ch].gain.value = Math.max(0, Math.min(1, v)); };
export const getChannelVolume = (ch) => channelGains[ch] ? channelGains[ch].gain.value : 0;

export const playTestChord = async () => {
  await initTone();
  const now = Tone.now();
  synths[0].triggerAttackRelease(['C4','E4','G4'], '2n', now);
};

export const applyTempoMap = (tempoEvents = [], measureStartWholes = []) => {
  if (!tempoEvents.length) return;
  Tone.Transport.bpm.cancelScheduledValues(0);
  tempoEvents.forEach(evt => {
    try {
      const measureStartWhole = measureStartWholes[evt.measureIndex] || 0;
      const seconds = (measureStartWhole * 4) * (60 / (tempoEvents[0].bpm || 120));
      Tone.Transport.bpm.setValueAtTime(evt.bpm, seconds);
    } catch {}
  });
};

function clearManualSchedules() {
  if (!scheduledIds.length) return;
  try { scheduledIds.forEach(id => Tone.Transport.clear(id)); } catch {}
  scheduledIds = [];
}

function hasIrregularDurations(events) {
  if (!Array.isArray(events)) return false;
  const standardDurRe = /^(1n|2n|4n|8n|16n|32n)(\.|t)?$/;
  return events.some(e => {
    const d = e.duration;
    if (!d || typeof d !== 'string') return true;
    return !standardDurRe.test(d);
  });
}

export const loadToneSequence = async ({ events, tempo, tempoEvents, measureStartWholes }) => {
  await initTone();
  Tone.Transport.stop();
  Tone.Transport.cancel();
  clearManualSchedules();
  if (currentPart) { try { currentPart.dispose(); } catch {} currentPart = null; }
  if (Array.isArray(tempoEvents) && tempoEvents.length) applyTempoMap(tempoEvents, measureStartWholes || []); else if (typeof tempo === 'number') Tone.Transport.bpm.value = tempo;
  if (!Array.isArray(events) || !events.length) return null;
  const irregular = hasIrregularDurations(events);
  ensureChannels();
  try {
    if (!irregular) {
      currentPart = new Tone.Part((time, value) => {
        const ch = value.channel ?? 0;
        const s = synths[ch] || synths[0];
        s.triggerAttackRelease(value.note, value.duration || value.durationSeconds, time, value.velocity ?? 0.8);
      }, events.map(e => [e.startSeconds, e]));
      currentPart.start(0);
    } else {
      events.forEach(ev => {
        const id = Tone.Transport.schedule(time => {
          const ch = ev.channel ?? 0;
          const s = synths[ch] || synths[0];
          s.triggerAttackRelease(ev.note, ev.durationSeconds, time, ev.velocity ?? 0.8);
        }, ev.startSeconds);
        scheduledIds.push(id);
      });
    }
  } catch (e) {
    console.warn('[loadToneSequence] scheduling fallback', e);
    events.forEach(ev => {
      const id = Tone.Transport.schedule(time => {
        const ch = ev.channel ?? 0;
        const s = synths[ch] || synths[0];
        s.triggerAttackRelease(ev.note, ev.durationSeconds, time, ev.velocity ?? 0.8);
      }, ev.startSeconds);
      scheduledIds.push(id);
    });
  }
  return currentPart;
};

export const startTransportFromBeginning = async () => {
  await initTone();
  Tone.Transport.stop();
  Tone.Transport.seconds = 0;
  Tone.Transport.start();
};

export const stopTransport = () => { if (isToneReady()) Tone.Transport.stop(); };
