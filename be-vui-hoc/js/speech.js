// Giọng nói hướng dẫn (Web Speech API): tự chọn giọng NỮ nhẹ nhàng, tự nhiên nhất có trên máy
// cho ngôn ngữ đang dùng (Tiếng Việt hoặc English).
const synth = window.speechSynthesis || null;
let voices = [];
let chosen = null;
const settings = { lang: 'vi', rate: 0.9, pitch: 1, voiceURI: '' };
let current = null;
const listeners = new Set();

/* ---------------- Nhận diện giọng ---------------- */
const isVi = (v) => /^vi([-_]|$)/i.test(v.lang || '') || /vietnam|tiếng việt/i.test(v.name || '');
const isEnglish = (v) => /^en([-_]|$)/i.test(v.lang || '');
const forLang = (v, lang) => (lang === 'en' ? isEnglish(v) : isVi(v));

const VI_MALE = /\b(an|nam ?minh|male|nam)\b/i;
const EN_MALE = /\b(david|mark|guy|ryan|daniel|alex|fred|tom|aaron|arthur|gordon|oliver|rishi|christopher|eric|roger|steffan|andrew|brian|george|james|william|thomas|liam|ralph|albert|junior|eddy|reed|rocko|grandpa|bruce|evan|nathan|lee|connor|mitchell|sam|luke|duncan|male)\b/i;
// Các giọng "vui nhộn" của Apple – không hợp để dạy bé
const NOVELTY = /\b(bad news|good news|bahh|bells|boing|bubbles|cellos|deranged|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|kathy|princess|grandma|flo|shelley|sandy)\b/i;

// Giọng nữ tiếng Anh nhẹ nhàng, xếp theo độ ưu tiên (điểm cộng thêm)
const EN_FEMALE = [
  [/\bjenny\b/i, 40], [/\bava\b/i, 38], [/\bemma\b/i, 36], [/\bzoe\b/i, 36], [/\ballison\b/i, 34], [/\baria\b/i, 33],
  [/\bsamantha\b/i, 32], [/google us english/i, 30], [/\bmichelle\b/i, 30], [/\bnicky\b/i, 28], [/\bsusan\b/i, 28],
  [/\bserena\b/i, 27], [/\bsonia\b/i, 26], [/\blibby\b/i, 26], [/google uk english female/i, 26], [/\bana\b/i, 25],
  [/\bkate\b/i, 24], [/\bmartha\b/i, 24], [/\bkaren\b/i, 22], [/\bmoira\b/i, 20], [/\btessa\b/i, 20], [/\bzira\b/i, 14],
  [/\bfemale\b/i, 12],
];

const cleanName = (v) => (v.name || '').replace(/vietnam(ese)?|việt nam|english|united states|united kingdom/gi, ' ');

export function isMaleVoice(v) {
  return isVi(v) ? VI_MALE.test(cleanName(v)) : EN_MALE.test(cleanName(v));
}

/** Chấm điểm một giọng đọc cho ngôn ngữ lang. -1 = không dùng được. */
export function voiceScore(v, lang = settings.lang) {
  if (!forLang(v, lang)) return -1;
  const n = v.name || '';
  const quality = /premium|cao cấp/i.test(n) ? 12 : /enhanced|nâng cao/i.test(n) ? 8 : /natural|neural/i.test(n) ? 10 : 0;
  if (lang === 'vi') {
    // HoaiMy (Edge) và Linh (iPad, Mac) là giọng nữ; An, NamMinh là giọng nam
    if (/hoai ?my/i.test(n)) return 100;
    if (/linh/i.test(n)) return 80 + quality;
    if (isMaleVoice(v)) return 10;
    if (/google/i.test(n)) return 70;
    return 50 + quality;
  }
  if (NOVELTY.test(n)) return 1;
  if (isMaleVoice(v)) return 5;
  let s = 40 + quality;
  const hit = EN_FEMALE.find(([re]) => re.test(n));
  if (hit) s += hit[1];
  if (/^en[-_]us/i.test(v.lang)) s += 6; else if (/^en[-_]gb/i.test(v.lang)) s += 3;
  return s;
}

/** 'nữ' | 'nam' | '' (không rõ) – để hiện trong Góc ba mẹ. */
export function voiceGender(v) {
  if (isMaleVoice(v)) return 'male';
  const n = v.name || '';
  if (isVi(v)) return /hoai ?my|linh|google/i.test(n) ? 'female' : '';
  return EN_FEMALE.some(([re]) => re.test(n)) ? 'female' : '';
}

/* ---------------- Nạp & chọn giọng ---------------- */
function loadVoices() {
  if (!synth) return;
  const before = voices.length;
  voices = synth.getVoices() || [];
  chooseVoice();
  if (voices.length !== before) listeners.forEach((fn) => { try { fn(); } catch (e) { /* */ } });
}

function ranked(lang) {
  return voices.filter((v) => forLang(v, lang)).sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang));
}

function chooseVoice() {
  chosen = voices.find((v) => settings.voiceURI && v.voiceURI === settings.voiceURI) || ranked(settings.lang)[0] || null;
}

/** Gọi lại khi danh sách giọng của máy thay đổi (giọng thường nạp chậm hơn trang). */
export function onVoicesChanged(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function initSpeech(opts = {}) {
  Object.assign(settings, opts);
  if (!synth) return;
  loadVoices();
  if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices);
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
export const langVoices = (lang = settings.lang) => ranked(lang);
export const currentVoice = () => chosen;

/**
 * Tình trạng giọng đọc cho ngôn ngữ đang dùng:
 *  'ok' – có giọng nữ | 'male' – chỉ có giọng nam | 'none' – máy không có giọng cho ngôn ngữ này
 *  'unknown' – chưa đọc được danh sách giọng | 'unsupported' – trình duyệt không hỗ trợ
 */
export function voiceStatus() {
  if (!synth) return 'unsupported';
  if (!voices.length) return 'unknown';
  if (!chosen) return 'none';
  if (!forLang(chosen, settings.lang)) return 'ok'; // ba mẹ tự chọn giọng khác
  return isMaleVoice(chosen) ? 'male' : 'ok';
}

/** Lời khuyên cho ba mẹ khi máy chưa có giọng nữ phù hợp. Trả về null nếu giọng đã ổn. */
export function voiceAdvice() {
  const st = voiceStatus();
  if (st === 'ok' || st === 'unknown') return null;
  const en = settings.lang === 'en';
  const ua = navigator.userAgent || '';
  const apple = /iPad|iPhone|Macintosh/.test(ua);
  const mac = /Macintosh/.test(ua) && !('ontouchend' in document);
  const edge = /Edg\//.test(ua);
  let problem, fix;
  if (en) {
    problem = st === 'male' ? 'This device only has a male English voice.'
      : st === 'none' ? 'This browser has no English voice, so the words are shown but not spoken.'
        : 'This browser cannot read aloud.';
    if (apple) fix = mac
      ? 'On a Mac: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → English → download “Ava” or “Samantha”. Then reopen this page in Safari.'
      : 'On iPad: Settings → Accessibility → Spoken Content → Voices → English → download “Ava” or “Samantha” (Enhanced). Then close the app and open it again in Safari.';
    else if (/Android/.test(ua)) fix = 'On Android: Settings → System → Languages → Text-to-speech output → choose Google and install English voice data.';
    else fix = edge ? 'Microsoft Edge has gentle female voices such as “Jenny”, but they need an internet connection. Check the connection and reload.'
      : 'On a computer, open this page in Microsoft Edge or Google Chrome: both include a gentle female English voice.';
  } else {
    problem = st === 'male' ? 'Máy này chỉ có giọng nam tiếng Việt.'
      : st === 'none' ? 'Trình duyệt này chưa có giọng đọc tiếng Việt nên bạn Thỏ chỉ hiện chữ, chưa đọc được.'
        : 'Trình duyệt này không hỗ trợ đọc giọng nói.';
    if (apple) fix = mac
      ? 'Trên máy Mac: Cài đặt hệ thống → Trợ năng → Nội dung được đọc → Giọng nói hệ thống → Quản lý giọng nói → Tiếng Việt → tải giọng nữ “Linh” (bản Nâng cao). Rồi mở lại trang bằng Safari.'
      : 'Trên iPad: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt → tải giọng nữ “Linh” (nên chọn bản Nâng cao). Rồi đóng hẳn ứng dụng và mở lại bằng Safari.';
    else if (/Android/.test(ua)) fix = 'Trên Android: Cài đặt → Hệ thống → Ngôn ngữ → Đầu ra văn bản thành giọng nói → chọn Google, tải dữ liệu giọng Tiếng Việt. Rồi mở lại trang bằng Chrome.';
    else fix = edge ? 'Microsoft Edge có giọng nữ “HoaiMy” rất tự nhiên nhưng cần có mạng. Hãy kiểm tra kết nối rồi tải lại trang.'
      : 'Trên máy tính, hãy mở trang này bằng trình duyệt Microsoft Edge: Edge có sẵn giọng nữ tiếng Việt “HoaiMy” đọc rất tự nhiên (cần có mạng).';
  }
  return { status: st, problem, fix };
}

/* ---------------- Đọc ---------------- */
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
    // Máy có danh sách giọng nhưng không có giọng cho ngôn ngữ này: không đọc bằng giọng
    // ngôn ngữ khác (nghe rất khó hiểu), chỉ hiện chữ trong bong bóng.
    if (voices.length && !chosen) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (chosen && chosen.lang) || (settings.lang === 'en' ? 'en-US' : 'vi-VN');
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
