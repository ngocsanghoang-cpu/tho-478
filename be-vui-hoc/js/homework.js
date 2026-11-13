// BÀI TẬP HÔM NAY – mỗi ngày có một số bài cố định, mỗi bài làm khoảng 10 phút; chỉ những bài này mới được sao.
// Nhờ vậy việc học có thưởng rõ ràng mà sao không bị "lạm phát": chơi thêm bao nhiêu cũng không thêm sao.
import { register, go, h, say, giveStars, onNavigate } from './ui.js';
import { sfx } from './sound.js';
import { store, todayKey, isSchoolDay } from './store.js';
import { L } from './i18n.js';
import { SETS } from './writing.js';

const THEME = 'var(--purple)';

// Các loại bài tập. cat: nhóm (viết, số, khám phá) – mỗi ngày lấy xoay vòng từ các nhóm.
export const EXERCISES = [
  { id: 'w-lower', cat: 'write', set: 'lower', e: '✏️', vi: 'Tô chữ thường', en: 'Trace lowercase letters' },
  { id: 'w-upper', cat: 'write', set: 'upper', e: '🔠', vi: 'Tô chữ hoa', en: 'Trace uppercase letters' },
  { id: 'w-digits', cat: 'write', set: 'digits', e: '🔢', vi: 'Tô chữ số', en: 'Trace numbers' },
  { id: 'count', cat: 'number', e: '🍓', vi: 'Đếm và chọn', en: 'Count and choose', to: ['count'] },
  { id: 'compare', cat: 'number', e: '⚖️', vi: 'Nhiều hơn, ít hơn', en: 'More or fewer', to: ['compare'] },
  { id: 'find', cat: 'number', e: '🫧', vi: 'Tìm số', en: 'Find the number', to: ['find'] },
  { id: 'add', cat: 'number', e: '➕', vi: 'Phép cộng', en: 'Addition', to: ['op', { op: 'add' }] },
  { id: 'sub', cat: 'number', e: '➖', vi: 'Phép trừ', en: 'Subtraction', to: ['op', { op: 'sub' }] },
  { id: 'mul', cat: 'number', e: '✖️', vi: 'Phép nhân', en: 'Multiplication', to: ['op', { op: 'mul' }] },
  { id: 'div', cat: 'number', e: '➗', vi: 'Phép chia', en: 'Division', to: ['op', { op: 'div' }] },
  { id: 'week', cat: 'explore', e: '🗓️', vi: 'Đố các ngày trong tuần', en: 'Days of the week quiz', to: ['datequiz', { kind: 'week' }] },
  { id: 'months', cat: 'explore', e: '📅', vi: 'Đố các tháng trong năm', en: 'Months of the year quiz', to: ['datequiz', { kind: 'months' }] },
  { id: 'dn', cat: 'explore', e: '🌞', vi: 'Đố ngày hay đêm', en: 'Day or night quiz', to: ['dnquiz'] },
  { id: 'lr', cat: 'explore', e: '👈', vi: 'Đố trái hay phải', en: 'Left or right quiz', to: ['lrquiz'] },
];
export const exerciseName = (x) => L(x.vi, x.en);

const dayIndex = () => {
  const d = new Date();
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
};

/** Số phút bé phải làm cho mỗi bài tập (ba mẹ đặt, mặc định 10 phút: khoảng thời gian bé tập trung được). */
export const exerciseMinutes = () => Math.max(0.05, +store.data.hw.minutes || 10);

/** Trạng thái bài tập của hôm nay (tự làm mới khi sang ngày). */
function state() {
  if (!store.data.homework || store.data.homework.date !== todayKey()) {
    store.data.homework = { date: todayKey(), done: [], prog: {}, time: {}, bonus: false };
  }
  const st = store.data.homework;
  if (!st.time) st.time = {};
  if (!st.prog) st.prog = {};
  return st;
}

/**
 * Tiến độ một bài: secs = số giây bé đã thật sự làm, target = số giây cần có,
 * count = số câu đúng / số chữ tô đạt, need = số tối thiểu (để bé không ngồi chờ hết giờ).
 * Bài xong khi đủ thời gian VÀ đủ số câu tối thiểu.
 */
export function exerciseStatus(id) {
  const st = state();
  const secs = st.time[id] || 0;
  const target = Math.round(exerciseMinutes() * 60);
  const count = st.prog[id] || 0;
  const need = Math.max(1, Math.ceil(exerciseMinutes()));
  return { secs, target, count, need, minsLeft: Math.max(1, Math.ceil((target - secs) / 60)), over: secs >= target && count >= need };
}

/** Số bài tập của một ngày: ngày nghỉ nhiều hơn ngày đi học (mặc định gấp đôi). */
export function exerciseCount(school = isSchoolDay()) {
  const hw = store.data.hw;
  const enabled = EXERCISES.filter((x) => !hw.off.includes(x.id)).length;
  return Math.min(enabled, hw.count * (school ? 1 : Math.max(1, +hw.offMult || 1)));
}

/**
 * Danh sách bài tập hôm nay: chọn xoay vòng theo ngày từ các loại ba mẹ bật,
 * lần lượt qua 3 nhóm (viết, số, khám phá) để ngày nào cũng đa dạng.
 */
export function todaysExercises() {
  const hw = store.data.hw;
  const enabled = EXERCISES.filter((x) => !hw.off.includes(x.id));
  const day = dayIndex();
  const cats = ['write', 'number', 'explore'];
  const picked = [];
  const want = exerciseCount();
  for (let k = 0; picked.length < want && k < 60; k++) {
    const list = enabled.filter((x) => x.cat === cats[k % 3] && !picked.includes(x));
    if (!list.length) continue;
    picked.push(list[(day + Math.floor(k / 3)) % list.length]);
  }
  const st = state();
  return picked.map((x) => {
    const ex = { ...x, name: exerciseName(x), done: st.done.includes(x.id), ...exerciseStatus(x.id) };
    if (x.cat === 'write') {
      // Mỗi ngày bắt đầu từ một chữ khác; bé tô lần lượt các chữ kế tiếp cho tới khi đủ giờ
      const chars = SETS()[x.set].chars;
      ex.nextIndex = (day * 3 + ex.count) % chars.length;
    }
    return ex;
  });
}

export function homeworkProgress() {
  const list = todaysExercises();
  return { done: list.filter((x) => x.done).length, total: list.length };
}

/** Số sao tối đa từ bài tập trong một ngày đi học (school = true) hoặc ngày nghỉ (false). */
export function maxHomework(school) {
  const r = store.data.rules;
  const n = exerciseCount(school);
  return n ? n * r.exercise + r.allDone : 0;
}

/* ---------------- Phiên làm bài: đếm thời gian bé thật sự làm ---------------- */
const IDLE_MS = 45000; // quá 45 giây không chạm màn hình thì đồng hồ tạm dừng
let session = null;

/** Bắt đầu tính giờ cho một bài tập hôm nay. Trả về null nếu bài không có hoặc đã xong. */
export function startSession(id) {
  stopSession();
  if (!todaysExercises().some((x) => x.id === id && !x.done)) return null;
  const st = state();
  const me = { id, last: Date.now(), nudged: false, listeners: new Set() };
  const touch = () => { me.last = Date.now(); me.nudged = false; };
  document.addEventListener('pointerdown', touch, true);
  me.off = () => document.removeEventListener('pointerdown', touch, true);
  me.timer = setInterval(() => {
    if (session !== me || document.hidden) return;
    if (Date.now() - me.last > IDLE_MS) {
      if (!me.nudged) { me.nudged = true; say(L('Con ơi, mình làm tiếp nào!', "Let's keep going!")); }
      return;
    }
    st.time[id] = (st.time[id] || 0) + 1;
    if (st.time[id] % 5 === 0) store.save();
    me.listeners.forEach((fn) => fn());
  }, 1000);
  session = me;
  return me;
}

export function stopSession() {
  if (!session) return;
  clearInterval(session.timer);
  session.off();
  session = null;
  store.save();
}
onNavigate(stopSession); // rời màn hình là dừng tính giờ; thời gian đã làm vẫn được giữ lại trong ngày

/** Ghi nhận bé vừa làm đúng một câu / tô đạt một chữ của bài đang làm. */
export function noteItem(id) {
  const st = state();
  st.prog[id] = (st.prog[id] || 0) + 1;
  store.save();
}

const mmss = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

/** Thanh thời gian của bài đang làm: "⏱ 3:20 / 10:00". */
export function timeBar(id) {
  const fill = h('i');
  const text = h('b');
  const el = h('div', { class: 'timebar' }, h('span', { text: '⏱️' }), h('div', { class: 'progress-bar' }, fill), text);
  el.refresh = () => {
    const s = exerciseStatus(id);
    fill.style.width = Math.min(100, 100 * s.secs / s.target) + '%';
    text.textContent = s.secs >= s.target
      ? (s.over ? L('Đủ giờ rồi!', "Time's done!") : L(`Thêm ${s.need - s.count} câu nữa`, `${s.need - s.count} more`))
      : `${mmss(Math.min(s.secs, s.target))} / ${mmss(s.target)}`;
  };
  el.refresh();
  if (session && session.id === id) session.listeners.add(el.refresh);
  return el;
}

/** Ghi nhận một bài tập đã xong. Trả về { stars, bonus, k, n, all }. */
function complete(ex) {
  const st = state();
  st.done.push(ex.id);
  const { done, total } = homeworkProgress();
  const r = store.data.rules;
  let bonus = 0;
  if (done === total && !st.bonus) { st.bonus = true; bonus = +r.allDone || 0; }
  store.save();
  stopSession();
  return { stars: +r.exercise || 0, bonus, k: done, n: total, all: done === total };
}

/** Gọi khi một lượt đố kết thúc. Trả về kết quả nếu đó là bài tập hôm nay và bé đã làm đủ thời gian. */
export function hwQuiz(id) {
  const ex = todaysExercises().find((x) => x.id === id && !x.done);
  return ex && ex.over ? complete(ex) : null;
}

/**
 * Gọi khi bé tô đạt một chữ trong lúc làm bài tập viết.
 * Trả về { result } khi đã đủ thời gian (xong bài), hoặc { minsLeft } nếu còn phải tô tiếp.
 */
export function hwTrace(set) {
  const ex = todaysExercises().find((x) => x.set === set && !x.done);
  if (!ex) return null;
  noteItem(ex.id);
  const s = exerciseStatus(ex.id);
  return s.over ? { result: complete(ex) } : { minsLeft: s.minsLeft };
}

/** Bài tập viết hôm nay (chưa xong) của một bộ chữ. */
export const hwWriteFor = (set) => todaysExercises().find((x) => x.set === set && !x.done) || null;

/** Thưởng sao + lời báo khi xong một bài tập. Trả về câu nói. */
export function rewardExercise(r, fromEl) {
  giveStars(r.stars + r.bonus, fromEl);
  return r.all
    ? L(`Con đã làm hết bài tập hôm nay! Con được ${r.stars + r.bonus} sao.`, `You finished all of today's exercises! You earn ${r.stars + r.bonus} stars.`)
    : L(`Xong bài tập ${r.k} trên ${r.n}. Con được ${r.stars} sao.`, `Exercise ${r.k} of ${r.n} done. You earn ${r.stars} ${r.stars === 1 ? 'star' : 'stars'}.`);
}

/** Mở một bài tập. */
export function openExercise(ex) {
  if (ex.cat === 'write') {
    go('trace', { set: ex.set, i: ex.nextIndex, hw: true });
  } else go(ex.to[0], { ...(ex.to[1] || {}), hw: true });
}

/* ---------------- Màn "Bài tập hôm nay" ---------------- */
register('homework', {
  title: () => L('Bài tập hôm nay', "Today's exercises"), parent: 'home', theme: THEME,
  render(root) {
    const list = todaysExercises();
    const r = store.data.rules;
    const doneCount = list.filter((x) => x.done).length;
    const mins = Math.round(exerciseMinutes());
    const bar = h('i');
    const cards = list.map((ex, k) => {
      const doneMin = Math.floor(ex.secs / 60);
      const sub = ex.done ? L('Đã xong ✅', 'Done ✅')
        : L(`${ex.cat === 'write' ? 'Tô chữ' : 'Trả lời câu hỏi'} trong ${mins} phút`, `${ex.cat === 'write' ? 'Trace' : 'Answer questions'} for ${mins} minutes`)
          + (ex.secs >= 30 ? L(` · đã làm ${doneMin || 1} phút`, ` · ${doneMin || 1} min done`) : '');
      return h('button', { class: 'reward hw' + (ex.done ? ' ready' : ''), onClick: () => {
        sfx.tap();
        if (ex.done) say(L('Bài này con làm xong rồi. Giỏi lắm!', 'You already finished this one. Well done!'));
        else openExercise(ex);
      } },
      h('div', { class: 'hw-num', text: k + 1 }),
      h('div', { class: 'r-emo', text: ex.e }),
      h('div', { class: 'r-main' }, h('div', { class: 'r-name', text: ex.name }), h('div', { class: 'r-sub', text: sub })),
      h('b', { class: 'hw-star', text: ex.done ? '✅' : `+${r.exercise} ⭐` }));
    });
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: L('📝 Bài tập hôm nay', "📝 Today's exercises") }),
          h('p', { text: L(`Con đã làm ${doneCount}/${list.length} bài. Mỗi bài làm ${mins} phút, được ${r.exercise} ⭐. Làm hết thưởng thêm ${r.allDone} ⭐.`,
            `You did ${doneCount} of ${list.length}. Each one takes ${mins} minutes and earns ${r.exercise} ⭐, plus ${r.allDone} ⭐ for finishing them all.`) }),
          h('div', { class: 'progress-bar', style: { marginTop: '10px' } }, bar))),
      list.length ? h('div', { class: 'rewards' }, cards)
        : h('p', { class: 'warn', text: L('Hôm nay không có bài tập.', 'No exercises today.') }),
      h('p', { class: 'r-sub', text: L('Con vẫn có thể chơi thêm ở Tập Viết, Học Đếm, Học Toán, Khám Phá. Chơi thêm thì không tính sao.',
        'You can still play more in Writing, Counting, Math and Explore. Extra play earns no stars.') })));
    requestAnimationFrame(() => { bar.style.width = list.length ? `${100 * doneCount / list.length}%` : '0'; });

    const left = list.length - doneCount;
    if (!list.length) say(L('Hôm nay không có bài tập.', 'No exercises today.'));
    else if (!left) say(L('Con đã làm hết bài tập hôm nay rồi. Giỏi quá!', "You finished all of today's exercises. Great job!"));
    else say(L(`Hôm nay con có ${list.length} bài tập, còn ${left} bài chưa làm. Mỗi bài làm ${mins} phút. Con chạm vào bài để bắt đầu nhé.`,
      `You have ${list.length} exercises today, and ${left} still to do. Each one takes ${mins} minutes. Tap one to begin.`));
  },
});

