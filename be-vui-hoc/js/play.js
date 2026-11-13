// Thành phần dùng chung cho các trò chơi: lưới đồ vật, nút đáp án, mức độ, kết thúc lượt
import { go, h, rand, pick, shuffle, celebrate } from './ui.js';
import { sfx } from './sound.js';
import { store } from './store.js';
import { L } from './i18n.js';
import { numWord } from './vi.js';

export const ROUND = 5;

// vi: tên tiếng Việt (có loại từ) | en: số ít | pl: số nhiều
export const THEMES = [
  { e: '🍎', vi: 'quả táo', en: 'apple', pl: 'apples' },
  { e: '🐟', vi: 'con cá', en: 'fish', pl: 'fish' },
  { e: '⭐', vi: 'ngôi sao', en: 'star', pl: 'stars' },
  { e: '🐥', vi: 'chú gà con', en: 'chick', pl: 'chicks' },
  { e: '🎈', vi: 'quả bóng bay', en: 'balloon', pl: 'balloons' },
  { e: '🧁', vi: 'cái bánh', en: 'cupcake', pl: 'cupcakes' },
  { e: '🌸', vi: 'bông hoa', en: 'flower', pl: 'flowers' },
  { e: '🦋', vi: 'con bướm', en: 'butterfly', pl: 'butterflies' },
  { e: '🍓', vi: 'quả dâu', en: 'strawberry', pl: 'strawberries' },
  { e: '🐰', vi: 'chú thỏ', en: 'bunny', pl: 'bunnies' },
  { e: '🍌', vi: 'quả chuối', en: 'banana', pl: 'bananas' },
  { e: '🐞', vi: 'con bọ rùa', en: 'ladybug', pl: 'ladybugs' },
];

/** Tên một vật: "quả táo" / "apple" */
export const one = (th) => L(th.vi, th.en);
/** Tên nhiều vật: "quả táo" / "apples" */
export const many = (th) => L(th.vi, th.pl);
/** Loại từ tiếng Việt ("quả"), hoặc danh từ số nhiều tiếng Anh ("apples") – dùng khi hỏi "mấy quả?" */
export const unit = (th) => L(th.vi.split(' ')[0], th.pl);
/** "ba quả táo" / "three apples" / "one apple" */
export const things = (n, th) => `${numWord(n)} ${L(th.vi, n === 1 ? th.en : th.pl)}`;
/** "There is" / "There are" */
export const thereIs = (n) => (n === 1 ? 'There is' : 'There are');

export const LEVELS = [
  { vi: 'Dễ', en: 'Easy', max: 5 },
  { vi: 'Vừa', en: 'Medium', max: 10 },
  { vi: 'Khó', en: 'Hard', max: 20 },
];
export const level = () => Math.min(Math.max(store.data.level || 1, 1), 3);
export const maxN = () => LEVELS[level() - 1].max;
export const levelName = () => L(LEVELS[level() - 1].vi, LEVELS[level() - 1].en);

/** Ba nút chọn mức độ. labels: nhãn riêng cho từng mức (mặc định "Dễ 1–5"…). */
export function levelChips(onChange, labels) {
  const wrap = h('div', { class: 'chips' });
  const draw = () => {
    wrap.innerHTML = '';
    LEVELS.forEach((lv, k) => wrap.append(h('button', {
      class: 'chip' + (level() === k + 1 ? ' on' : ''),
      onClick: () => { if (level() === k + 1) return; sfx.tap(); store.set({ level: k + 1 }); draw(); onChange(); },
    }, labels ? labels[k] : `${L(lv.vi, lv.en)} 1–${lv.max}`)));
  };
  draw();
  return wrap;
}

/**
 * Lưới đồ vật (emoji).
 *  ordered: xếp liền theo hàng (dễ đếm); nếu không thì rải ngẫu nhiên trong lưới.
 *  perRow: số vật mỗi hàng khi ordered (mặc định 5).
 */
export function objectGrid(n, emoji, { ordered = false, perRow = 5, onTap } = {}) {
  let cols, rows, cellsIdx;
  if (ordered) {
    cols = Math.min(perRow, Math.max(n, 1));
    rows = Math.max(1, Math.ceil(n / perRow));
    cellsIdx = [...Array(n).keys()];
  } else {
    cols = n <= 4 ? 3 : n <= 9 ? 4 : 5;
    rows = Math.max(Math.ceil((n + 1) / cols), n <= 4 ? 2 : cols - 1);
    if (cols * rows < n) rows = Math.ceil(n / cols);
    cellsIdx = shuffle([...Array(cols * rows).keys()]).slice(0, n).sort((a, b) => a - b);
  }
  const grid = h('div', { class: 'objs', style: { '--cols': cols, '--rows': rows } });
  const occupied = new Set(cellsIdx);
  const objs = [];
  for (let c = 0; c < cols * rows; c++) {
    if (!occupied.has(c)) { grid.append(h('span')); continue; }
    const b = h('button', { class: 'obj', style: { transform: ordered ? '' : `rotate(${rand(-12, 12)}deg)` } }, h('span', { class: 'e', text: emoji }));
    if (onTap) b.addEventListener('click', () => onTap(b, objs.indexOf(b)));
    objs.push(b);
    grid.append(b);
  }
  const fit = () => {
    const r = grid.getBoundingClientRect();
    if (!r.width) return;
    grid.style.setProperty('--size', Math.max(18, Math.min(r.width / cols, r.height / rows) * 0.62) + 'px');
  };
  const ro = new ResizeObserver(fit);
  ro.observe(grid);
  grid.objs = objs;
  grid.dispose = () => ro.disconnect();
  return grid;
}

/** Ba đáp án số khác nhau, gồm đáp án đúng. */
export function options(answer, lo, hi) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < 3 && guard++ < 100) {
    const v = answer + pick([-2, -1, 1, 2, 3, -3]);
    if (v >= lo && v <= hi) set.add(v);
  }
  for (let v = lo; set.size < 3; v++) set.add(v);
  return shuffle([...set]);
}

/** Hàng nút đáp án. opts: mảng giá trị, hoặc mảng [giá trị, nhãn]. */
export function answerButtons(opts, onPick, cls = 'ans') {
  const wrap = h('div', { class: 'answers' });
  opts.forEach((o) => {
    const [v, label] = Array.isArray(o) ? o : [o, o];
    const b = h('button', { class: cls, text: label });
    b.addEventListener('click', () => onPick(v, b, wrap));
    wrap.append(b);
  });
  return wrap;
}

/** Màn chúc mừng cuối lượt chơi, rồi chơi lại hoặc về menu. */
export async function roundEnd(life, again, menu) {
  if (!life.alive) return;
  const ans = await celebrate({
    emoji: '🏆', title: L('Hoàn thành!', 'Well done!'),
    text: L(`Con đã trả lời xong ${ROUND} câu!`, `You answered ${ROUND} questions!`),
    speech: L(`Hoan hô! Con đã hoàn thành ${numWord(ROUND)} câu rồi!`, `Hooray! You finished ${numWord(ROUND)} questions!`),
    stars: 2,
    buttons: [[L('Chơi tiếp 🔁', 'Play again 🔁'), 'orange'], [L('Trò khác 🎲', 'Other games 🎲'), 'blue']],
  });
  if (!life.alive) return;
  if (ans === 0) again(); else go(menu);
}
