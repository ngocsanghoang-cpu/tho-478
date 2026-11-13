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
  stars: 0,   // số sao đang có (đổi quà sẽ trừ)
  earned: 0,  // tổng số sao đã nhận từ trước tới nay (dùng để mở nhãn dán)
  // Luật nhận sao – ba mẹ chỉnh trong Góc ba mẹ
  rules: {
    task: 1,      // làm xong 1 việc tự lập
    routine: 2,   // thưởng khi làm hết việc của 1 buổi
    lesson: 2,    // học xong 1 bài (1 lượt 5 câu)
    trace: 1,     // tô đạt 1 chữ hoặc 1 số
    skill: 2,     // tập xong 1 kỹ năng (rửa tay, mặc đồ, dọn đồ…)
    dailyCap: 10, // số sao HỌC tối đa mỗi ngày (0 = không giới hạn); sao tự lập không bị giới hạn
  },
  learn: { date: '', stars: 0 }, // số sao học đã nhận hôm nay
  // Quà do ba mẹ đặt. key: quà mẫu có tên theo ngôn ngữ; name: tên ba mẹ tự đặt
  rewards: [
    { id: 'r1', emoji: '🎡', key: 'park', name: '', cost: 100 },
    { id: 'r2', emoji: '🧸', key: 'toy', name: '', cost: 150 },
  ],
  redeemed: [], // quà đã đổi: { emoji, name, cost, date }
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
      earned: p.earned == null ? (p.stars || 0) : p.earned,
      rules: { ...d.rules, ...(p.rules || {}) },
      learn: p.learn && p.learn.date ? p.learn : d.learn,
      rewards: Array.isArray(p.rewards) ? p.rewards : d.rewards,
      redeemed: Array.isArray(p.redeemed) ? p.redeemed : [],
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
  return Math.min(STICKERS.length, Math.floor(store.data.earned / STARS_PER_STICKER));
}

/** Cộng sao, trả về danh sách chỉ số nhãn dán vừa mở khoá. */
export function addStars(n) {
  const before = unlockedCount();
  store.data.stars += n;
  store.data.earned += n;
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
  const { name, lang, rate, voices, sound, restMinutes, rules, rewards } = store.data;
  store.data = { ...clone(DEFAULTS), name, lang, rate, voices, sound, restMinutes, rules, rewards };
  store.save();
}

/* ---------------- Luật nhận sao & đổi quà ---------------- */
// Sao "học" (bị giới hạn mỗi ngày). Sao tự lập (task, routine) không bị giới hạn.
export const LEARN_KINDS = ['lesson', 'trace', 'skill'];

function learnToday() {
  if (store.data.learn.date !== todayKey()) store.data.learn = { date: todayKey(), stars: 0 };
  return store.data.learn;
}

/** Số sao học còn có thể nhận hôm nay (Infinity nếu không giới hạn). */
export function learnLeft() {
  const cap = +store.data.rules.dailyCap || 0;
  return cap ? Math.max(0, cap - learnToday().stars) : Infinity;
}

/** Số sao sẽ nhận được cho một loại việc, đã tính giới hạn trong ngày. */
export function starsFor(kind) {
  const n = Math.max(0, +store.data.rules[kind] || 0);
  return LEARN_KINDS.includes(kind) ? Math.min(n, learnLeft()) : n;
}

/** Ghi nhận sao học đã nhận hôm nay. */
export function noteLearn(n) {
  learnToday().stars += n;
  store.save();
}

/** Đổi quà: trừ sao và ghi vào lịch sử. Trả về false nếu chưa đủ sao. */
export function redeem(reward, name) {
  if (store.data.stars < reward.cost) return false;
  store.data.stars -= reward.cost;
  store.data.redeemed.unshift({ emoji: reward.emoji, name, cost: reward.cost, date: todayKey() });
  store.data.redeemed = store.data.redeemed.slice(0, 50);
  store.save();
  return true;
}

/** Ba mẹ thưởng thêm hoặc trừ sao bằng tay. */
export function adjustStars(delta) {
  store.data.stars = Math.max(0, store.data.stars + delta);
  if (delta > 0) store.data.earned += delta;
  store.save();
}
