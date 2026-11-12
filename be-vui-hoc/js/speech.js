// Giọng nói hướng dẫn: dùng giọng tiếng Việt có sẵn trên iPad (Web Speech API)
const synth = window.speechSynthesis || null;
let voices = [];
let chosen = null;
const settings = { rate: 0.9, pitch: 1.1, voiceURI: '' };
let current = null;

function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices() || [];
  chooseVoice();
}

function chooseVoice() {
  const vi = voices.filter((v) => /^vi/i.test(v.lang));
  chosen = voices.find((v) => v.voiceURI === settings.voiceURI)
    || vi.find((v) => /linh/i.test(v.name) && /enhanced|nâng cao|premium/i.test(v.name))
    || vi.find((v) => /linh/i.test(v.name))
    || vi[0]
    || null;
}

export function initSpeech(opts = {}) {
  Object.assign(settings, opts);
  if (!synth) return;
  loadVoices();
  if ('onvoiceschanged' in synth) synth.onvoiceschanged = loadVoices;
  let tries = 0;
  const t = setInterval(() => {
    loadVoices();
    if (voices.length || ++tries > 30) clearInterval(t);
  }, 300);
}

export function configureSpeech(opts) {
  Object.assign(settings, opts);
  chooseVoice();
}

export const speechSupported = () => !!synth;
export const getVoices = () => voices.slice();
export const hasVietnamese = () => voices.some((v) => /^vi/i.test(v.lang));
export const currentVoice = () => chosen;

function finish(job, ok) {
  if (job.done) return;
  job.done = true;
  clearTimeout(job.timer);
  if (current === job) current = null;
  job.resolve(ok);
}

export function stopSpeech() {
  if (current) finish(current, false);
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
}

/** Đọc một câu. Trả về Promise: true khi đọc xong, false nếu bị ngắt. */
export function speak(text, { rate } = {}) {
  return new Promise((resolve) => {
    const wasBusy = !!(synth && (synth.speaking || synth.pending));
    stopSpeech();
    if (!text) { resolve(false); return; }
    const r = rate || settings.rate;
    const job = { resolve, done: false };
    // Dự phòng: một số phiên bản Safari không gọi onend
    job.timer = setTimeout(() => finish(job, true), 1200 + (text.length * 95) / r);
    current = job;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    if (chosen) u.voice = chosen;
    u.rate = r;
    u.pitch = settings.pitch;
    u.onend = () => finish(job, true);
    u.onerror = () => finish(job, false);
    job.u = u; // giữ tham chiếu để Safari không xoá mất utterance
    const go = () => {
      if (job.done) return;
      try { synth.resume(); } catch (e) { /* */ }
      synth.speak(u);
    };
    if (wasBusy) setTimeout(go, 80); else go();
  });
}
