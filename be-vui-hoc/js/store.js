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
    meal: 3,      // tự xúc ăn hết 1 bữa trong giờ quy định
    routine: 1,   // thưởng khi làm hết việc của 1 buổi
    exercise: 1,  // làm xong 1 bài tập hôm nay
    allDone: 1,   // thưởng khi làm hết bài tập hôm nay
  },
  // Bài tập hôm nay: count = số bài mỗi ngày đi học; offMult = ngày nghỉ nhân mấy lần;
  // minutes = số phút bé phải làm cho mỗi bài; off = các loại bài ba mẹ tắt
  hw: { count: 3, offMult: 2, minutes: 10, off: [] },
  homework: { date: '', done: [], prog: {}, time: {}, bonus: false }, // tiến độ bài tập của hôm nay
  schoolDays: [1, 2, 3, 4, 5],   // ngày đi học (0 = Chủ Nhật … 6 = Thứ Bảy): việc sáng/tối chỉ tính vào các ngày này
  // Việc ba mẹ giao thêm khi có (phơi đồ, gấp đồ…). key: việc mẫu có tên theo ngôn ngữ
  chores: [
    { id: 'hang', emoji: '👕', key: 'hang', name: '', stars: 2 },
    { id: 'fold', emoji: '🧺', key: 'fold', name: '', stars: 2 },
  ],
  asks: { date: '', ids: [] },   // việc thêm ba mẹ giao trong hôm nay
  dayType: { date: '', school: true }, // ba mẹ đổi riêng hôm nay thành ngày nghỉ / ngày đi học
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
      hw: { ...d.hw, ...(p.hw || {}), off: (p.hw && Array.isArray(p.hw.off)) ? p.hw.off : [] },
      homework: p.homework && p.homework.date ? { ...d.homework, ...p.homework } : d.homework,
      dayType: p.dayType && p.dayType.date ? p.dayType : d.dayType,
      rewards: Array.isArray(p.rewards) ? p.rewards : d.rewards,
      chores: Array.isArray(p.chores) ? p.chores : d.chores,
      schoolDays: Array.isArray(p.schoolDays) ? p.schoolDays : d.schoolDays,
      asks: p.asks && Array.isArray(p.asks.ids) ? p.asks : d.asks,
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
  const { name, lang, rate, voices, sound, restMinutes, rules, rewards, chores, schoolDays, hw } = store.data;
  store.data = { ...clone(DEFAULTS), name, lang, rate, voices, sound, restMinutes, rules, rewards, chores, schoolDays, hw };
  store.save();
}

/* ---------------- Luật nhận sao & đổi quà ---------------- */
/** Số sao cho một loại việc theo luật ba mẹ đặt ('task' | 'routine' | 'exercise' | 'allDone'). */
export function starsFor(kind) {
  return Math.max(0, +store.data.rules[kind] || 0);
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

/* ---------------- Ngày đi học & việc ba mẹ giao thêm ---------------- */
/** Hôm nay có phải ngày đi học không: theo lịch tuần, trừ khi ba mẹ đã đổi riêng cho hôm nay. */
export function isSchoolDay() {
  const o = store.data.dayType;
  if (o && o.date === todayKey()) return !!o.school;
  return store.data.schoolDays.includes(new Date().getDay());
}

/** Ba mẹ đổi riêng hôm nay thành ngày đi học (true) hoặc ngày nghỉ (false). Hết ngày thì tự về lịch tuần. */
export function setTodaySchool(school) {
  store.data.dayType = { date: todayKey(), school: !!school };
  store.save();
}

/** Danh sách id việc thêm ba mẹ giao hôm nay (tự xoá khi sang ngày mới). */
export function todaysAsks() {
  if (store.data.asks.date !== todayKey()) store.data.asks = { date: todayKey(), ids: [] };
  return store.data.asks.ids;
}

/** Ba mẹ giao / bỏ giao một việc thêm cho hôm nay. */
export function toggleAsk(id) {
  const ids = todaysAsks();
  const i = ids.indexOf(id);
  if (i >= 0) ids.splice(i, 1); else ids.push(id);
  store.save();
}
