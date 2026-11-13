// BÀI TẬP HÔM NAY – mỗi ngày có một số bài cố định, chỉ những bài này mới được sao.
// Nhờ vậy việc học có thưởng rõ ràng mà sao không bị "lạm phát": chơi thêm bao nhiêu cũng không thêm sao.
import { register, go, h, say, giveStars } from './ui.js';
import { sfx } from './sound.js';
import { store, todayKey } from './store.js';
import { L } from './i18n.js';
import { SETS } from './writing.js';

const THEME = 'var(--purple)';
export const TRACE_PER_EXERCISE = 3; // một bài tập viết = tô đạt 3 chữ

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

/** Trạng thái bài tập của hôm nay (tự làm mới khi sang ngày). */
function state() {
  if (!store.data.homework || store.data.homework.date !== todayKey()) {
    store.data.homework = { date: todayKey(), done: [], prog: {}, bonus: false };
  }
  return store.data.homework;
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
  for (let k = 0; picked.length < Math.min(hw.count, enabled.length) && k < 40; k++) {
    const list = enabled.filter((x) => x.cat === cats[k % 3] && !picked.includes(x));
    if (!list.length) continue;
    picked.push(list[(day + Math.floor(k / 3)) % list.length]);
  }
  const st = state();
  return picked.map((x) => {
    const ex = { ...x, name: exerciseName(x), done: st.done.includes(x.id) };
    if (x.cat === 'write') {
      const chars = SETS()[x.set].chars;
      const start = (day * TRACE_PER_EXERCISE) % chars.length;
      ex.chars = [...Array(TRACE_PER_EXERCISE)].map((_, i) => chars[(start + i) % chars.length]);
      ex.got = (st.prog[x.id] || []).filter((c) => ex.chars.includes(c));
      ex.name = `${ex.name}: ${ex.chars.join(', ')}`;
    }
    return ex;
  });
}

export function homeworkProgress() {
  const list = todaysExercises();
  return { done: list.filter((x) => x.done).length, total: list.length };
}

/** Số sao tối đa mỗi ngày từ bài tập. */
export function maxHomeworkPerDay() {
  const r = store.data.rules;
  const n = Math.min(store.data.hw.count, EXERCISES.filter((x) => !store.data.hw.off.includes(x.id)).length);
  return n ? n * r.exercise + r.allDone : 0;
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
  return { stars: +r.exercise || 0, bonus, k: done, n: total, all: done === total };
}

/** Gọi khi bé trả lời xong một lượt đố. Trả về kết quả nếu đó là bài tập hôm nay còn chưa làm. */
export function hwQuiz(id) {
  const ex = todaysExercises().find((x) => x.id === id && !x.done);
  return ex ? complete(ex) : null;
}

/**
 * Gọi khi bé tô đạt một chữ. Trả về null nếu chữ này không thuộc bài tập hôm nay,
 * hoặc { left: số chữ còn lại, result: kết quả khi xong cả bài }.
 */
export function hwTrace(set, ch) {
  const ex = todaysExercises().find((x) => x.set === set && !x.done && x.chars.includes(ch));
  if (!ex) return null;
  const st = state();
  const got = st.prog[ex.id] || (st.prog[ex.id] = []);
  if (!got.includes(ch)) got.push(ch);
  store.save();
  const left = ex.chars.filter((c) => !got.includes(c));
  return { left, next: left[0], result: left.length ? null : complete(ex) };
}

/** Bài tập viết hôm nay của một bộ chữ (để màn tô chữ biết chữ nào cần tô). */
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
    const chars = SETS()[ex.set].chars;
    const next = ex.chars.find((c) => !ex.got.includes(c)) || ex.chars[0];
    go('trace', { set: ex.set, i: chars.indexOf(next), hw: true });
  } else go(ex.to[0], { ...(ex.to[1] || {}), hw: true });
}

/* ---------------- Màn "Bài tập hôm nay" ---------------- */
register('homework', {
  title: () => L('Bài tập hôm nay', "Today's exercises"), parent: 'home', theme: THEME,
  render(root) {
    const list = todaysExercises();
    const r = store.data.rules;
    const doneCount = list.filter((x) => x.done).length;
    const bar = h('i');
    const cards = list.map((ex, k) => {
      const sub = ex.done ? L('Đã xong ✅', 'Done ✅')
        : ex.cat === 'write' ? L(`Tô đạt ${TRACE_PER_EXERCISE} chữ (${ex.got.length}/${TRACE_PER_EXERCISE})`, `Trace ${TRACE_PER_EXERCISE} well (${ex.got.length}/${TRACE_PER_EXERCISE})`)
          : L('Trả lời đủ 5 câu', 'Answer all 5 questions');
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
          h('p', { text: L(`Con đã làm ${doneCount}/${list.length} bài. Mỗi bài ${r.exercise} ⭐, làm hết thưởng thêm ${r.allDone} ⭐.`,
            `You did ${doneCount} of ${list.length}. Each one earns ${r.exercise} ⭐, plus ${r.allDone} ⭐ for finishing them all.`) }),
          h('div', { class: 'progress-bar', style: { marginTop: '10px' } }, bar))),
      list.length ? h('div', { class: 'rewards' }, cards)
        : h('p', { class: 'warn', text: L('Hôm nay không có bài tập.', 'No exercises today.') }),
      h('p', { class: 'r-sub', text: L('Con vẫn có thể chơi thêm ở Tập Viết, Học Đếm, Học Toán, Khám Phá. Chơi thêm thì không tính sao.',
        'You can still play more in Writing, Counting, Math and Explore. Extra play earns no stars.') })));
    requestAnimationFrame(() => { bar.style.width = list.length ? `${100 * doneCount / list.length}%` : '0'; });

    const left = list.length - doneCount;
    if (!list.length) say(L('Hôm nay không có bài tập.', 'No exercises today.'));
    else if (!left) say(L('Con đã làm hết bài tập hôm nay rồi. Giỏi quá!', "You finished all of today's exercises. Great job!"));
    else say(L(`Hôm nay con có ${list.length} bài tập, còn ${left} bài chưa làm. Con chạm vào bài để bắt đầu nhé.`,
      `You have ${list.length} exercises today, and ${left} still to do. Tap one to begin.`));
  },
});

