// HỌC TOÁN – bốn phép tính bằng hình ảnh: cộng, trừ, nhân, chia
import { register, go, h, say, live, sleep, rand, pick, praise, menuCard, progressDots, toast } from './ui.js';
import { sfx } from './sound.js';
import { bump } from './store.js';
import { L } from './i18n.js';
import { numWord, cap } from './vi.js';
import { ROUND, THEMES, many, unit, things, thereIs, level, levelName, levelChips, objectGrid, options, answerButtons, roundEnd } from './play.js';

const THEME = 'var(--orange)';
const levelLabels = () => [L('Dễ', 'Easy'), L('Vừa', 'Medium'), L('Khó', 'Hard')];

const OPS = {
  add: { sign: '+', emoji: '➕', color: 'pink', vi: 'Phép cộng', en: 'Addition', subVi: 'Thêm vào', subEn: 'Putting together' },
  sub: { sign: '−', emoji: '➖', color: 'blue', vi: 'Phép trừ', en: 'Subtraction', subVi: 'Bớt đi', subEn: 'Taking away' },
  mul: { sign: '×', emoji: '✖️', color: 'purple', vi: 'Phép nhân', en: 'Multiplication', subVi: 'Nhiều nhóm bằng nhau', subEn: 'Equal groups' },
  div: { sign: '÷', emoji: '➗', color: 'green', vi: 'Phép chia', en: 'Division', subVi: 'Chia đều cho các bạn', subEn: 'Sharing equally' },
};
const opName = (op) => L(OPS[op].vi, OPS[op].en);

/* ---------------- Menu ---------------- */
register('math', {
  title: () => L('Học Toán', 'Math'), parent: 'home', theme: THEME,
  render(root) {
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: L('🧮 Học Toán', '🧮 Math') }),
          h('p', { text: L('Chọn mức độ rồi chọn phép tính nhé', 'Pick a level, then pick a game') })),
        levelChips(() => say(L(`Mức ${levelName().toLowerCase()}`, levelName())), levelLabels())),
      h('div', { class: 'cards' }, Object.entries(OPS).map(([op, o]) =>
        menuCard({ emoji: o.emoji, label: L(o.vi, o.en), sub: L(o.subVi, o.subEn), color: o.color, onClick: () => go('op', { op }) })))));
    say(L('Học toán. Con muốn học phép tính nào: cộng, trừ, nhân, hay chia?', 'Math. What do you want to learn: adding, taking away, multiplying, or sharing?'));
  },
});

/** Sinh một câu hỏi theo phép tính và mức độ. */
function makeQuestion(op, th) {
  const lv = level();
  const u = unit(th);
  const pl = many(th);
  if (op === 'add') {
    const max = [5, 10, 20][lv - 1];
    const a = rand(1, Math.min(max - 1, 10));
    const b = rand(1, Math.min(max - a, 10));
    return {
      a, b, ans: a + b, lo: 1, hi: max + 2,
      ask: L(`Có ${things(a, th)}, thêm ${numWord(b)} ${u} nữa. Tất cả có mấy ${u}?`,
        `${thereIs(a)} ${things(a, th)}. Add ${numWord(b)} more. How many ${pl} are there in all?`),
      ok: L(`${cap(numWord(a))} cộng ${numWord(b)} bằng ${numWord(a + b)}.`, `${cap(numWord(a))} plus ${numWord(b)} equals ${numWord(a + b)}.`),
      hint: L('Chưa đúng. Con đếm tất cả ở hai bên nhé.', 'Not quite. Count all of them on both sides.'),
    };
  }
  if (op === 'sub') {
    const max = [5, 10, 20][lv - 1];
    const a = rand(2, max);
    const b = rand(1, a - 1);
    return {
      a, b, ans: a - b, lo: 0, hi: max,
      ask: L(`Có ${things(a, th)}, bớt đi ${numWord(b)} ${u}. Còn lại mấy ${u}?`,
        `${thereIs(a)} ${things(a, th)}. Take away ${numWord(b)}. How many ${pl} are left?`),
      ok: L(`${cap(numWord(a))} trừ ${numWord(b)} bằng ${numWord(a - b)}.`, `${cap(numWord(a))} minus ${numWord(b)} equals ${numWord(a - b)}.`),
      hint: L(`Chưa đúng. Con đếm những ${u} không bị gạch nhé.`, 'Not quite. Count the ones that are not crossed out.'),
    };
  }
  if (op === 'mul') {
    const [a, b] = lv === 1 ? [rand(1, 3), rand(1, 3)] : lv === 2 ? [rand(1, 5), rand(1, 5)] : [rand(2, 9), rand(2, 5)];
    return {
      a, b, ans: a * b, lo: 1, hi: a * b + 6,
      ask: L(`Có ${numWord(a)} nhóm, mỗi nhóm có ${things(b, th)}. Tất cả có mấy ${u}?`,
        `There ${a === 1 ? 'is' : 'are'} ${numWord(a)} ${a === 1 ? 'group' : 'groups'} of ${things(b, th)}. How many ${pl} are there in all?`),
      ok: L(`${cap(numWord(a))} nhân ${numWord(b)} bằng ${numWord(a * b)}.`, `${cap(numWord(a))} times ${numWord(b)} equals ${numWord(a * b)}.`),
      hint: L('Chưa đúng. Con đếm tất cả các nhóm nhé.', 'Not quite. Count all the groups together.'),
    };
  }
  // chia: a = tổng số, b = số bạn, ans = mỗi bạn được
  const [d, q] = lv === 1 ? [rand(1, 2), rand(1, 3)] : lv === 2 ? [rand(2, 3), rand(1, 4)] : [rand(2, 5), rand(1, 6)];
  const total = d * q;
  return {
    a: total, b: d, ans: q, lo: 1, hi: q + 4,
    ask: L(`Có ${things(total, th)}, chia đều cho ${numWord(d)} bạn. Mỗi bạn được mấy ${u}?`,
      `${thereIs(total)} ${things(total, th)}. Share them equally among ${numWord(d)} ${d === 1 ? 'friend' : 'friends'}. How many ${pl} does each friend get?`),
    ok: L(`${cap(numWord(total))} chia ${numWord(d)} bằng ${numWord(q)}.`, `${cap(numWord(total))} divided by ${numWord(d)} equals ${numWord(q)}.`),
    hint: L('Chưa đúng. Con thử chia lần lượt cho từng bạn nhé.', 'Not quite. Try giving one to each friend in turn.'),
  };
}

/* ---------------- Màn một phép tính ---------------- */
register('op', {
  title: (p) => opName(p.op), parent: 'math', theme: THEME, fixed: true,
  render(root, { op }) {
    const life = live();
    const O = OPS[op];
    let q = 0, grids = [], lastKey = '';
    const dots = progressDots(ROUND);
    const body = h('div', { class: 'play-body', style: { flexDirection: 'column', alignItems: 'center' } });
    let current = null;
    const hear = h('button', { class: 'btn ghost', onClick: () => current && say(current.ask) }, L('🔊 Nghe lại', '🔊 Hear again'));
    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }, levelLabels()), hear, dots), body));

    const panel = (...kids) => h('div', { class: 'grp panel' }, kids);

    function next() {
      if (!life.alive) return;
      grids.forEach((g) => g.dispose());
      grids = [];
      dots.set(q);
      if (q >= ROUND) { roundEnd(life, () => go('op', { op }), 'math', op); return; }
      const th = pick(THEMES);
      let Q;
      do { Q = makeQuestion(op, th); } while (`${Q.a},${Q.b}` === lastKey);
      lastKey = `${Q.a},${Q.b}`;
      current = Q;
      const { a, b, ans } = Q;
      const mk = (n, opt) => { const g = objectGrid(n, th.e, { ordered: true, ...opt }); grids.push(g); return g; };

      const qBox = h('span', { class: 'q', text: '?' });
      const eq = h('div', { class: 'math-eq' },
        h('span', { text: a }), h('span', { text: O.sign }), h('span', { text: b }), h('span', { text: '=' }), qBox);

      let scene;
      let reveal = () => {};
      if (op === 'add') {
        scene = h('div', { class: 'math-groups' }, panel(mk(a)), h('div', { class: 'op', text: '+' }), panel(mk(b)));
      } else if (op === 'sub') {
        const g = mk(a);
        g.objs.slice(a - b).forEach((o) => o.classList.add('gone'));
        scene = h('div', { class: 'math-groups' }, panel(g));
      } else if (op === 'mul') {
        scene = h('div', { class: 'math-many', style: { '--n': Math.min(a, 5) } },
          [...Array(a)].map(() => panel(mk(b, { perRow: b <= 3 ? b : Math.ceil(b / 2) }))));
      } else {
        const friends = [...Array(b)].map(() => {
          const g = mk(ans, { perRow: ans <= 3 ? ans : Math.ceil(ans / 2) });
          g.style.visibility = 'hidden';
          const mark = h('div', { class: 'share-q', text: '?' });
          const box = h('div', { class: 'grp panel share' }, h('div', { class: 'friend', text: '👧' }), h('div', { class: 'share-box' }, g, mark));
          box.show = () => { g.style.visibility = ''; mark.remove(); };
          return box;
        });
        reveal = () => friends.forEach((f) => f.show());
        scene = h('div', { class: 'math-div' },
          h('div', { class: 'grp panel total' }, mk(a, { perRow: a <= 10 ? Math.max(a, 1) : 10 })),
          h('div', { class: 'math-many', style: { '--n': b } }, friends));
      }

      const answers = answerButtons(options(ans, Q.lo, Q.hi), async (v, btn, wrap) => {
        if (v === ans) {
          btn.classList.add('right');
          wrap.querySelectorAll('.ans').forEach((x) => (x.disabled = true));
          qBox.textContent = ans;
          reveal();
          sfx.ding(); bump('math');
          toast(praise());
          await say(L(`Đúng rồi! ${Q.ok}`, `That's right! ${Q.ok}`));
          q++;
          await sleep(400);
          next();
        } else {
          btn.classList.add('wrong');
          sfx.oops();
          say(Q.hint);
        }
      });
      body.innerHTML = '';
      body.append(eq, scene, answers);
      say(Q.ask);
    }
    next();
    return () => grids.forEach((g) => g.dispose());
  },
});
