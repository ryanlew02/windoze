let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain = 0.07,
  type: OscillatorType = 'sine',
) {
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

export function playWindowOpen() {
  try {
    const c = ctx(), t = c.currentTime;
    tone(c, 880,  t,        0.07, 0.06);
    tone(c, 1320, t + 0.04, 0.09, 0.04);
  } catch { /* AudioContext unavailable */ }
}

export function playWindowClose() {
  try {
    const c = ctx(), t = c.currentTime;
    tone(c, 660, t,        0.08, 0.05);
    tone(c, 440, t + 0.04, 0.10, 0.03);
  } catch {}
}

export function playNotification() {
  try {
    const c = ctx(), t = c.currentTime;
    tone(c, 1047, t,       0.15, 0.06);
    tone(c, 1319, t + 0.1, 0.18, 0.05);
  } catch {}
}

export function playBootChime() {
  try {
    const c = ctx(), t = c.currentTime;
    tone(c, 523,  t,       0.22, 0.07);
    tone(c, 659,  t + 0.2, 0.22, 0.07);
    tone(c, 784,  t + 0.4, 0.22, 0.07);
    tone(c, 1047, t + 0.6, 0.50, 0.08);
  } catch {}
}
