// Lưu tiến độ & cài đặt trên máy (localStorage)
const KEY = 'bevuihoc.v1';

export const STARS_PER_STICKER = 5;
export const STICKERS = [
  ['🐶', 'chú chó'], ['🐱', 'con mèo'], ['🐰', 'con thỏ'], ['🐼', 'gấu trúc'], ['🦁', 'sư tử'],
  ['🐯', 'con hổ'], ['🐨', 'gấu túi'], ['🐸', 'con ếch'], ['🐵', 'chú khỉ'], ['🐧', 'chim cánh cụt'],
  ['🦄', 'kỳ lân'], ['🐬', 'cá heo'], ['🦒', 'hươu cao cổ'], ['🐘', 'con voi'], ['🦊', 'con cáo'],
  ['🐻', 'con gấu'], ['🐷', 'chú heo'], ['🐮', 'bò sữa'], ['🐔', 'gà mái'], ['🦋', 'con bướm'],
  ['🐞', 'bọ rùa'], ['🐢', 'con rùa'], ['🐙', 'bạch tuộc'], ['🦀', 'con cua'], ['🐳', 'cá voi'],
  ['🦜', 'con vẹt'], ['🦉', 'cú mèo'], ['🐝', 'ong mật'], ['🦓', 'ngựa vằn'], ['🦘', 'chuột túi'],
  ['🦖', 'khủng long'], ['🐲', 'con rồng'], ['🌈', 'cầu vồng'], ['🚀', 'tên lửa'], ['🏆', 'cúp vàng'],
  ['👑', 'vương miện'],
];

const DEFAULTS = {
  name: '',
  stars: 0,
  rate: 0.9,
  voiceURI: '',
  sound: true,
  restMinutes: 20,
  level: 1,
  letters: {},
  routine: { date: '', done: {} },
  stats: { count: 0, write: 0, selfcare: 0 },
};

const clone = (o) => JSON.parse(JSON.stringify(o));

function load() {
  const d = clone(DEFAULTS);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const p = JSON.parse(raw) || {};
    return {
      ...d, ...p,
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
  const { name, rate, voiceURI, sound, restMinutes } = store.data;
  store.data = { ...clone(DEFAULTS), name, rate, voiceURI, sound, restMinutes };
  store.save();
}
