// Âm thanh hiệu ứng tạo bằng Web Audio (không cần tệp âm thanh)
let ctx = null;
let enabled = true;

export function setSoundEnabled(v) { enabled = !!v; }

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    // Phát một mẫu im lặng để iOS cho phép âm thanh
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch (e) { /* bỏ qua */ }
}

function tone(freq, at, dur, { type = 'sine', vol = 0.18, slide = 0 } = {}) {
  if (!ctx || !enabled) return;
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap() { tone(660, 0, 0.08, { type: 'triangle', vol: 0.12 }); },
  pop() { tone(500, 0, 0.12, { type: 'sine', vol: 0.2, slide: 2.2 }); },
  ding() { tone(784, 0, 0.18); tone(1047, 0.1, 0.3); },
  oops() { tone(330, 0, 0.18, { type: 'triangle', vol: 0.15 }); tone(247, 0.15, 0.3, { type: 'triangle', vol: 0.15 }); },
  star() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.18, { vol: 0.1 })); },
  fanfare() {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.12, 0.2, { type: 'triangle', vol: 0.16 }));
    [523, 659, 784, 1047].forEach((f) => tone(f, 0.4, 0.6, { type: 'triangle', vol: 0.09 }));
  },
  tick() { tone(1200, 0, 0.04, { type: 'square', vol: 0.03 }); },
};
