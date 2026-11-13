// Lưu tiến độ & cài đặt trên máy (localStorage)
const KEY = 'bevuihoc.v1';

export const STARS_PER_STICKER = 5;
// [biểu tượng, tên tiếng Việt, tên tiếng Anh]
export const STICKERS = [
  ['🦄', 'kỳ lân', 'unicorn'], ['🐱', 'con mèo', 'kitty'], ['🐰', 'con thỏ', 'bunny'], ['🦋', 'con bướm', 'butterfly'], ['🌸', 'bông hoa', 'flower'],
  ['👑', 'vương miện', 'crown'], ['🧚‍♀️', 'nàng tiên', 'fairy'], ['🌈', 'cầu vồng', 'rainbow'], ['🧜‍♀️', 'nàng tiên cá', 'mermaid'], ['👸', 'công chúa', 'princess'],
  ['🐶', 'chú chó', 'puppy'], ['🐼', 'gấu trúc', 'panda'], ['🐬', 'cá heo', 'dolphin'], ['🦢', 'thiên nga', 'swan'], ['🐨', 'gấu túi', 'koala'],
  ['🐧', 'chim cánh cụt', 'penguin'], ['🦊', 'con cáo', 'fox'], ['🐞', 'bọ rùa', 'ladybug'], ['🦒', 'hươu cao cổ', 'giraffe'], ['🐘', 'con voi', 'elephant'],
  ['🐻', 'con gấu', 'bear'], ['🐷', 'chú heo', 'piggy'], ['🦁', 'sư tử', 'lion'], ['🐢', 'con rùa', 'turtle'], ['🐙', 'bạch tuộc', 'octopus'],
  ['🐳', 'cá voi', 'whale'], ['🦜', 'con vẹt', 'parrot'], ['🦉', 'cú mèo', 'owl'], ['🐝', 'ong mật', 'honeybee'], ['🦓', 'ngựa vằn', 'zebra'],
  ['🦩', 'hồng hạc', 'flamingo'], ['🍭', 'kẹo mút', 'lollipop'], ['🎠', 'ngựa gỗ', 'carousel horse'], ['💎', 'viên kim cương', 'diamond'], ['🏆', 'cúp vàng', 'gold trophy'],
  ['💖', 'trái tim', 'heart'],
];

const DEFAULTS = {
  name: '',
  lang: 'vi', // 'vi' = Tiếng Việt, 'en' = English
  stars: 0,
  rate: 0.9,
  voices: { vi: '', en: '' }, // giọng đọc ba mẹ tự chọn cho từng ngôn ngữ ('' = tự động)
  sound: true,
  restMinutes: 20,
  level: 1,
  letters: {},
  routine: { date: '', done: {} },
  stats: { count: 0, write: 0, selfcare: 0, math: 0, explore: 0 },
};

const clone = (o) => JSON.parse(JSON.stringify(o));

function load() {
  const d = clone(DEFAULTS);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const p = JSON.parse(raw) || {};
    const voices = { ...d.voices, ...(p.voices || {}) };
    if (p.voiceURI && !voices.vi) voices.vi = p.voiceURI; // bản cũ chỉ lưu một giọng
    delete p.voiceURI;
    return {
      ...d, ...p, voices,
      stats: { ...d.stats, ...(p.stats || {}) },
      routine: p.routine && p.routine.done ? p.routine : d.routine,
      letters: p.letters || {},
    };
  } catch (e) {
    return d;
  }
}

export const store = {
  data: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* bộ nhớ đầy / chế độ riêng tư */ }
  },
  set(patch) { Object.assign(this.data, patch); this.save(); },
};

export function unlockedCount() {
  return Math.min(STICKERS.length, Math.floor(store.data.stars / STARS_PER_STICKER));
}

/** Cộng sao, trả về danh sách chỉ số nhãn dán vừa mở khoá. */
export function addStars(n) {
  const before = unlockedCount();
  store.data.stars += n;
  store.save();
  const after = unlockedCount();
  const out = [];
  for (let i = before; i < after; i++) out.push(i);
  return out;
}

export function bump(stat) {
  store.data.stats[stat] = (store.data.stats[stat] || 0) + 1;
  store.save();
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Danh sách việc đã làm hôm nay của một thói quen (sáng/tối). */
export function routineDone(kind) {
  if (store.data.routine.date !== todayKey()) {
    store.data.routine = { date: todayKey(), done: {} };
    store.save();
  }
  const done = store.data.routine.done;
  return done[kind] || (done[kind] = []);
}

export function markRoutine(kind, id) {
  const list = routineDone(kind);
  if (list.includes(id)) return false;
  list.push(id);
  bump('selfcare');
  return true;
}

export function resetProgress() {
  const { name, lang, rate, voices, sound, restMinutes } = store.data;
  store.data = { ...clone(DEFAULTS), name, lang, rate, voices, sound, restMinutes };
  store.save();
}
