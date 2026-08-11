// Lydmotor - alle lyder genereres, ingen lydfiler
export const SPIN_MS = 4300;

let audioCtx = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

const playTone = (freq, startOffset, duration, gainPeak, type = "triangle") => {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
};

const playNoise = (startOffset, duration, gainPeak, filterFreq, filterQ = 1, type = "bandpass") => {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + startOffset;
  const frames = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(filterFreq, t0);
  filter.Q.value = filterQ;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration);
};

// Brusboks: klikk + kullsyre som freser ut
const playCanOpen = () => {
  playNoise(0, 0.05, 0.34, 2600, 3, "bandpass");
  playTone(240, 0.01, 0.05, 0.16, "square");
  playNoise(0.06, 0.85, 0.15, 5200, 0.6, "highpass");
};

// Bil som gir gass
const playCarRev = () => {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(65, t0);
  osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.34);
  osc.frequency.exponentialRampToValueAtTime(88, t0 + 0.72);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(700, t0);
  filter.frequency.linearRampToValueAtTime(2000, t0 + 0.34);
  filter.frequency.linearRampToValueAtTime(600, t0 + 0.72);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.2, t0 + 0.06);
  gain.gain.setValueAtTime(0.2, t0 + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.75);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.78);
  playNoise(0, 0.7, 0.05, 420, 0.7, "lowpass");
};

// Jackpot: myntklirr over stigende arpeggio
const playJackpot = (offset = 0) => {
  const arp = [523.25, 659.25, 783.99, 1046.5];
  arp.forEach((f, i) => playTone(f, offset + i * 0.075, 0.22, 0.12));
  const coins = [0.3, 0.37, 0.43, 0.5, 0.55, 0.62, 0.7, 0.79];
  coins.forEach((t, i) => {
    playTone(2093 + (i % 3) * 180, offset + t, 0.1, 0.075, "sine");
    playTone(3136 + (i % 2) * 220, offset + t + 0.005, 0.07, 0.045, "sine");
  });
  playTone(1046.5, offset + 0.86, 0.5, 0.11);
  playTone(1567.98, offset + 0.88, 0.5, 0.07);
};

export const playToggle = (isWeekend) => {
  if (isWeekend) playCanOpen();
  else playCarRev();
};

export const playSpin = (segments) => {
  const ticks = Math.min(46, Math.max(14, segments));
  const durationSec = SPIN_MS / 1000;
  for (let k = 0; k < ticks; k++) {
    const t = durationSec * (1 - Math.pow(1 - k / ticks, 1 / 3));
    playTone(1180, t, 0.035, 0.075, "square");
  }
  playJackpot(durationSec + 0.06);
};

export const playConfirm = () => {
  playTone(659.25, 0, 0.1, 0.11);
  playTone(987.77, 0.09, 0.22, 0.1);
};

export const playCheck = () => {
  playTone(1318.5, 0, 0.06, 0.07, "sine");
};
