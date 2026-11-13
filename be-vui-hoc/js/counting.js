// HỌC ĐẾM – làm quen số, đếm và chọn, so sánh, cộng trừ, tìm số
import { register, go, h, say, live, sleep, rand, pick, shuffle, giveStars, praise, celebrate, menuCard, progressDots, toast } from './ui.js';
import { sfx } from './sound.js';
import { store, bump } from './store.js';
import { numWord, cap } from './vi.js';

const THEME = 'var(--blue)';
const ROUND = 5;
const THEMES = [
  { e: '🍎', n: 'quả táo' }, { e: '🐟', n: 'con cá' }, { e: '⭐', n: 'ngôi sao' }, { e: '🐥', n: 'chú gà con' },
  { e: '🎈', n: 'quả bóng bay' }, { e: '🚗', n: 'chiếc ô tô' }, { e: '🌸', n: 'bông hoa' }, { e: '🦋', n: 'con bướm' },
  { e: '🍌', n: 'quả chuối' }, { e: '🐶', n: 'chú chó' }, { e: '🍓', n: 'quả dâu' }, { e: '🐞', n: 'con bọ rùa' },
];
const LEVELS = [
  { label: 'Dễ 1–5', max: 5 },
  { label: 'Vừa 1–10', max: 10 },
  { label: 'Khó 1–20', max: 20 },
];
const level = () => Math.min(Math.max(store.data.level || 1, 1), 3);
const maxN = () => LEVELS[level() - 1].max;

// "quả táo" -> "quả" (loại từ dùng khi hỏi "mấy quả?")
const unit = (name) => name.split(' ')[0];

/* ---------------- Thành phần dùng chung ---------------- */
function levelChips(onChange) {
  const wrap = h('div', { class: 'chips' });
  const draw = () => {
    wrap.innerHTML = '';
    LEVELS.forEach((L, k) => wrap.append(h('button', {
      class: 'chip' + (level() === k + 1 ? ' on' : ''),
      onClick: () => { if (level() === k + 1) return; sfx.tap(); store.set({ level: k + 1 }); draw(); onChange(); },
    }, L.label)));
  };
  draw();
  return wrap;
}

/** Lưới đồ vật. cells: số ô (>= n). ordered: xếp liền theo hàng 5 (dễ đếm). */
function objectGrid(n, emoji, { ordered = false, onTap } = {}) {
  let cols, rows, cellsIdx;
  if (ordered) {
    cols = Math.min(5, Math.max(n, 1));
    rows = Math.max(1, Math.ceil(n / 5));
    cellsIdx = [...Array(n).keys()];
  } else {
    cols = n <= 4 ? 3 : n <= 9 ? 4 : 5;
    rows = Math.max(Math.ceil((n + 1) / cols), n <= 4 ? 2 : cols - 1);
    if (cols * rows < n) rows = Math.ceil(n / cols);
    cellsIdx = shuffle([...Array(cols * rows).keys()]).slice(0, n).sort((a, b) => a - b);
  }
  const grid = h('div', { class: 'objs', style: { '--cols': cols, '--rows': rows } });
  const occupied = new Map(cellsIdx.map((c, k) => [c, k]));
  const objs = [];
  for (let c = 0; c < cols * rows; c++) {
    if (!occupied.has(c)) { grid.append(h('span')); continue; }
    const b = h('button', { class: 'obj', text: emoji, style: { transform: ordered ? '' : `rotate(${rand(-12, 12)}deg)` } });
    if (onTap) b.addEventListener('click', () => onTap(b, objs.indexOf(b)));
    objs.push(b);
    grid.append(b);
  }
  const fit = () => {
    const r = grid.getBoundingClientRect();
    if (!r.width) return;
    grid.style.setProperty('--size', Math.max(24, Math.min(r.width / cols, r.height / rows) * 0.62) + 'px');
  };
  const ro = new ResizeObserver(fit);
  ro.observe(grid);
  grid.objs = objs;
  grid.dispose = () => ro.disconnect();
  return grid;
}

/** Ba đáp án khác nhau, gồm đáp án đúng. */
function options(answer, lo, hi) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < 3 && guard++ < 100) {
    const d = pick([-2, -1, 1, 2, 3, -3]);
    const v = answer + d;
    if (v >= lo && v <= hi) set.add(v);
  }
  for (let v = lo; set.size < 3; v++) set.add(v);
  return shuffle([...set]);
}

function answerButtons(opts, onPick) {
  const wrap = h('div', { class: 'answers' });
  opts.forEach((v) => {
    const b = h('button', { class: 'ans', text: v });
    b.addEventListener('click', () => onPick(v, b, wrap));
    wrap.append(b);
  });
  return wrap;
}

async function roundEnd(life, again) {
  if (!life.alive) return;
  const ans = await celebrate({
    emoji: '🏆', title: 'Hoàn thành!', text: `Con đã trả lời xong ${ROUND} câu!`,
    speech: `Hoan hô! Con đã hoàn thành ${numWord(ROUND)} câu rồi!`, stars: 2,
    buttons: [['Chơi tiếp 🔁', 'orange'], ['Trò khác 🎲', 'blue']],
  });
  if (!life.alive) return;
  if (ans === 0) again(); else go('counting');
}

/* ---------------- Menu ---------------- */
register('counting', {
  title: 'Học Đếm', parent: 'home', theme: THEME,
  render(root) {
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } }, h('h2', { text: '🔢 Học Đếm' }), h('p', { text: 'Chọn mức độ rồi chọn trò chơi nhé' })),
        levelChips(() => say(`Mức ${LEVELS[level() - 1].label.split(' ')[0].toLowerCase()}`))),
      h('div', { class: 'cards' },
        menuCard({ emoji: '🔢', label: 'Làm quen số', sub: 'Số 0 đến 20', color: 'blue', onClick: () => go('numbers', { n: 1 }) }),
        menuCard({ emoji: '🍎', label: 'Đếm và chọn', sub: 'Có bao nhiêu?', color: 'green', onClick: () => go('count') }),
        menuCard({ emoji: '⚖️', label: 'Nhiều hơn, ít hơn', sub: 'Bên nào nhiều hơn?', color: 'pink', onClick: () => go('compare') }),
        menuCard({ emoji: '➕', label: 'Cộng và trừ', sub: 'Thêm vào, bớt đi', color: 'purple', onClick: () => go('math') }),
        menuCard({ emoji: '🫧', label: 'Tìm số', sub: 'Chạm đúng bong bóng', color: 'orange', onClick: () => go('find') }),
      )));
    say('Học đếm. Con muốn chơi trò nào?');
  },
});

/* ---------------- Làm quen số ---------------- */
register('numbers', {
  title: 'Làm quen số', parent: 'counting', theme: THEME, fixed: true,
  render(root, { n = 1 }) {
    const life = live();
    const th = THEMES[n % THEMES.length];
    let counted = 0;
    const grid = n > 0 ? objectGrid(n, th.e, { ordered: true, onTap: (b) => tapCount(b) }) : h('div', { class: 'objs', style: { '--cols': 1, '--rows': 1 } }, h('span', { style: { fontSize: '100px' }, text: '🫙' }));

    function tapCount(b) {
      if (b.querySelector('.badge')) return;
      counted++;
      b.append(h('span', { class: 'badge', text: counted }));
      b.classList.add('counted');
      sfx.pop();
      if (counted === n) say(`${cap(numWord(n))}! Tất cả có ${numWord(n)} ${th.n}.`);
      else say(numWord(counted), { rate: 1 });
    }

    async function countTogether() {
      grid.objs?.forEach((b) => { b.querySelector('.badge')?.remove(); b.classList.remove('counted'); });
      counted = 0;
      for (const b of grid.objs || []) {
        if (!life.alive) return;
        tapCount(b);
        await sleep(800);
      }
    }

    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' },
        h('button', { class: 'btn ghost', onClick: () => go('numbers', { n: Math.max(0, n - 1) }), disabled: n <= 0 }, '⬅️ Số trước'),
        h('div', { class: 'row' },
          h('button', { class: 'btn blue', onClick: countTogether }, '🔢 Đếm cùng cô'),
          n <= 9 ? h('button', { class: 'btn orange', onClick: () => go('trace', { set: 'digits', i: n }) }, '✏️ Tập viết') : null),
        h('button', { class: 'btn ghost', onClick: () => go('numbers', { n: Math.min(20, n + 1) }), disabled: n >= 20 }, 'Số sau ➡️')),
      h('div', { class: 'numcard' },
        h('div', { style: { textAlign: 'center' } },
          h('div', { class: 'num', text: n, onClick: () => say(`Số ${numWord(n)}`) }),
          h('div', { class: 'word', text: cap(numWord(n)) })),
        h('div', { class: 'objs-wrap panel', style: { padding: '14px' } }, grid))));

    say(n === 0 ? 'Số không. Không có gì cả!' : `Số ${numWord(n)}. Con chạm vào từng ${th.n} để đếm nhé.`);
    return () => grid.dispose?.();
  },
});

/* ---------------- Đếm và chọn ---------------- */
register('count', {
  title: 'Đếm và chọn', parent: 'counting', theme: THEME, fixed: true,
  render(root) {
    const life = live();
    let q = 0, last = 0, grid = null;
    const dots = progressDots(ROUND);
    const stage = h('div', { class: 'stage panel' });
    let ansBox = h('div', { class: 'answers' });
    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }), dots),
      h('div', { class: 'play-body count-body' }, stage, ansBox)));

    function next() {
      if (!life.alive) return;
      grid?.dispose();
      dots.set(q);
      if (q >= ROUND) { roundEnd(life, () => go('count')); return; }
      const max = maxN();
      let n;
      do { n = rand(1, max); } while (n === last && max > 1);
      last = n;
      const th = pick(THEMES);
      let counted = 0;
      grid = objectGrid(n, th.e, {
        onTap: (b) => {
          if (b.querySelector('.badge')) return;
          counted++;
          b.append(h('span', { class: 'badge', text: counted }));
          b.classList.add('counted');
          sfx.pop();
          say(numWord(counted), { rate: 1 });
        },
      });
      stage.innerHTML = '';
      stage.append(grid);
      const newAns = answerButtons(options(n, 1, Math.max(max, 3)), async (v, b, wrap) => {
        if (v === n) {
          b.classList.add('right');
          wrap.querySelectorAll('.ans').forEach((x) => (x.disabled = true));
          sfx.ding(); bump('count');
          toast(praise());
          giveStars(1, b);
          await say(`Đúng rồi! Có ${numWord(n)} ${th.n}.`);
          q++;
          await sleep(300);
          next();
        } else {
          b.classList.add('wrong');
          sfx.oops();
          grid.objs.forEach((o) => { o.querySelector('.badge')?.remove(); o.classList.remove('counted'); });
          counted = 0;
          say(`Chưa đúng rồi. Con chạm vào từng ${th.n} để đếm lại nhé.`);
        }
      });
      ansBox.replaceWith(newAns);
      ansBox = newAns;
      say(`Có bao nhiêu ${th.n}? Con chạm vào từng ${th.n} để đếm nhé.`);
    }
    next();
    return () => grid?.dispose();
  },
});

/* ---------------- Nhiều hơn – ít hơn ---------------- */
register('compare', {
  title: 'Nhiều hơn, ít hơn', parent: 'counting', theme: THEME, fixed: true,
  render(root) {
    const life = live();
    let q = 0, grids = [];
    const dots = progressDots(ROUND);
    const body = h('div', { class: 'play-body' });
    root.append(h('div', { class: 'play' }, h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }), dots), body));

    function next() {
      if (!life.alive) return;
      grids.forEach((g) => g.dispose());
      dots.set(q);
      if (q >= ROUND) { roundEnd(life, () => go('compare')); return; }
      const max = maxN();
      const a = rand(1, max);
      let b;
      do { b = rand(1, max); } while (b === a);
      const th = pick(THEMES);
      const more = Math.random() < 0.5;
      const correct = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
      grids = [objectGrid(a, th.e), objectGrid(b, th.e)];
      let solved = false;
      const sides = grids.map((g, k) => {
        const s = h('button', { class: 'side' }, g);
        s.addEventListener('click', async () => {
          if (solved) return;
          if (k === correct) {
            solved = true;
            s.classList.add('right');
            sfx.ding(); bump('count');
            toast(praise());
            giveStars(1, s);
            const [x, y] = k === 0 ? [a, b] : [b, a];
            await say(`Đúng rồi! ${cap(numWord(x))} ${more ? 'nhiều hơn' : 'ít hơn'} ${numWord(y)}.`);
            q++;
            await sleep(300);
            next();
          } else {
            s.classList.remove('wrong'); void s.offsetWidth; s.classList.add('wrong');
            sfx.oops();
            say('Chưa đúng rồi. Con đếm thử mỗi bên xem nhé.');
          }
        });
        return s;
      });
      body.innerHTML = '';
      body.append(h('div', { class: 'cmp' }, sides));
      say(`Bên nào có ${more ? 'nhiều' : 'ít'} ${th.n} hơn? Con chạm vào bên đó nhé.`);
    }
    next();
    return () => grids.forEach((g) => g.dispose());
  },
});

/* ---------------- Cộng và trừ ---------------- */
register('math', {
  title: 'Cộng và trừ', parent: 'counting', theme: THEME, fixed: true,
  render(root) {
    const life = live();
    let q = 0, grids = [];
    const dots = progressDots(ROUND);
    const body = h('div', { class: 'play-body', style: { flexDirection: 'column', alignItems: 'center' } });
    root.append(h('div', { class: 'play' }, h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }), dots), body));

    function next() {
      if (!life.alive) return;
      grids.forEach((g) => g.dispose());
      dots.set(q);
      if (q >= ROUND) { roundEnd(life, () => go('math')); return; }
      const L = level();
      const maxSum = L === 1 ? 5 : 10;
      const minus = L >= 2 && Math.random() < 0.5;
      const th = pick(THEMES);
      const u = unit(th.n);
      let a, b, ans, speech;
      if (minus) {
        a = rand(2, maxSum); b = rand(1, a - 1); ans = a - b;
        speech = `Có ${numWord(a)} ${th.n}, bớt đi ${numWord(b)} ${u}. Còn lại mấy ${u}?`;
      } else {
        a = rand(1, maxSum - 1); b = rand(1, maxSum - a); ans = a + b;
        speech = `Có ${numWord(a)} ${th.n}, thêm ${numWord(b)} ${u} nữa. Tất cả có mấy ${u}?`;
      }
      const qBox = h('span', { class: 'q', text: '?' });
      const eq = h('div', { class: 'math-eq' }, h('span', { text: a }), h('span', { text: minus ? '−' : '+' }), h('span', { text: b }), h('span', { text: '=' }), qBox);
      let groups;
      if (minus) {
        const g = objectGrid(a, th.e, { ordered: true });
        g.objs.slice(a - b).forEach((o) => o.classList.add('gone'));
        grids = [g];
        groups = h('div', { class: 'math-groups' }, h('div', { class: 'grp panel' }, g));
      } else {
        const g1 = objectGrid(a, th.e, { ordered: true }), g2 = objectGrid(b, th.e, { ordered: true });
        grids = [g1, g2];
        groups = h('div', { class: 'math-groups' }, h('div', { class: 'grp panel' }, g1), h('div', { class: 'op', text: '+' }), h('div', { class: 'grp panel' }, g2));
      }
      const answers = answerButtons(options(ans, minus ? 0 : 1, maxSum + 2), async (v, btn, wrap) => {
        if (v === ans) {
          btn.classList.add('right');
          wrap.querySelectorAll('.ans').forEach((x) => (x.disabled = true));
          qBox.textContent = ans;
          sfx.ding(); bump('count');
          toast(praise());
          giveStars(1, btn);
          await say(`Đúng rồi! ${cap(numWord(a))} ${minus ? 'trừ' : 'cộng'} ${numWord(b)} bằng ${numWord(ans)}.`);
          q++;
          await sleep(300);
          next();
        } else {
          btn.classList.add('wrong');
          sfx.oops();
          say(minus ? `Chưa đúng. Con đếm những ${u} không bị gạch nhé.` : `Chưa đúng. Con đếm tất cả ${th.n} ở hai bên nhé.`);
        }
      });
      body.innerHTML = '';
      body.append(eq, groups, answers);
      say(speech);
    }
    next();
    return () => grids.forEach((g) => g.dispose());
  },
});

/* ---------------- Tìm số ---------------- */
register('find', {
  title: 'Tìm số', parent: 'counting', theme: THEME, fixed: true,
  render(root) {
    const life = live();
    let q = 0, lastT = -1;
    const dots = progressDots(ROUND);
    const body = h('div', { class: 'bubbles' });
    const hint = h('button', { class: 'btn ghost', onClick: () => askAgain() }, '🔊 Nghe lại');
    root.append(h('div', { class: 'play' }, h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }), hint, dots), body));
    let target = 0;
    const colors = ['var(--blue)', 'var(--pink)', 'var(--green)', 'var(--purple)', 'var(--orange)', 'var(--red)'];

    const askAgain = () => say(`Con hãy chạm vào số ${numWord(target)}.`);

    function next() {
      if (!life.alive) return;
      dots.set(q);
      if (q >= ROUND) { roundEnd(life, () => go('find')); return; }
      const max = maxN();
      const count = level() === 1 ? 4 : level() === 2 ? 6 : 8;
      const pool = shuffle([...Array(max + 1).keys()].slice(1));
      do { target = pick(pool); } while (target === lastT && max > 1);
      lastT = target;
      const nums = shuffle([target, ...pool.filter((v) => v !== target).slice(0, count - 1)]);
      let solved = false;
      body.innerHTML = '';
      nums.forEach((v, k) => {
        const b = h('button', { class: 'bubble-num', text: v, style: { '--c': colors[k % colors.length], animationDelay: `${-k * 0.4}s` } });
        b.addEventListener('click', async () => {
          if (solved) return;
          if (v === target) {
            solved = true;
            b.classList.add('popped');
            sfx.pop(); sfx.ding(); bump('count');
            toast(praise());
            giveStars(1, b);
            await say(`Đúng rồi! Đây là số ${numWord(v)}.`);
            q++;
            await sleep(300);
            next();
          } else {
            b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
            sfx.oops();
            say(`Đây là số ${numWord(v)}. Con tìm số ${numWord(target)} nhé.`);
          }
        });
        body.append(b);
      });
      askAgain();
    }
    next();
  },
});
