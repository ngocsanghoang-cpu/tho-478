// HỌC ĐẾM – làm quen số, đếm và chọn, nhiều hơn/ít hơn, tìm số
import { register, go, h, say, live, sleep, rand, pick, shuffle, praise, menuCard, progressDots, toast } from './ui.js';
import { sfx } from './sound.js';
import { bump } from './store.js';
import { L } from './i18n.js';
import { numWord, cap } from './vi.js';
import { ROUND, THEMES, one, many, things, thereIs, level, maxN, levelName, levelChips, objectGrid, options, answerButtons, roundEnd, roundDots } from './play.js';

const THEME = 'var(--blue)';

/* ---------------- Menu ---------------- */
register('counting', {
  title: () => L('Học Đếm', 'Counting'), parent: 'home', theme: THEME,
  render(root) {
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: L('🔢 Học Đếm', '🔢 Counting') }),
          h('p', { text: L('Chọn mức độ rồi chọn trò chơi nhé', 'Pick a level, then pick a game') })),
        levelChips(() => say(L(`Mức ${levelName().toLowerCase()}`, levelName())))),
      h('div', { class: 'cards' },
        menuCard({ emoji: '🔢', label: L('Làm quen số', 'Meet the numbers'), sub: L('Số 0 đến 20', 'Numbers 0 to 20'), color: 'blue', onClick: () => go('numbers', { n: 1 }) }),
        menuCard({ emoji: '🍓', label: L('Đếm và chọn', 'Count and choose'), sub: L('Có bao nhiêu?', 'How many?'), color: 'pink', onClick: () => go('count') }),
        menuCard({ emoji: '⚖️', label: L('Nhiều hơn, ít hơn', 'More or fewer'), sub: L('Bên nào nhiều hơn?', 'Which side has more?'), color: 'purple', onClick: () => go('compare') }),
        menuCard({ emoji: '🫧', label: L('Tìm số', 'Find the number'), sub: L('Chạm đúng bong bóng', 'Pop the right bubble'), color: 'orange', onClick: () => go('find') }),
      )));
    say(L('Học đếm. Con muốn chơi trò nào?', 'Counting. Which game do you want to play?'));
  },
});

/* ---------------- Làm quen số ---------------- */
register('numbers', {
  title: () => L('Làm quen số', 'Meet the numbers'), parent: 'counting', theme: THEME, fixed: true,
  render(root, { n = 1 }) {
    const life = live();
    const th = THEMES[n % THEMES.length];
    let counted = 0;
    const grid = n > 0
      ? objectGrid(n, th.e, { ordered: true, onTap: (b) => tapCount(b) })
      : h('div', { class: 'objs', style: { '--cols': 1, '--rows': 1 } }, h('span', { style: { fontSize: '100px' }, text: '🫙' }));

    function tapCount(b) {
      if (b.querySelector('.badge')) return;
      counted++;
      b.append(h('span', { class: 'badge', text: counted }));
      b.classList.add('counted');
      sfx.pop();
      if (counted === n) say(L(`${cap(numWord(n))}! Tất cả có ${things(n, th)}.`, `${cap(numWord(n))}! ${thereIs(n)} ${things(n, th)} in all.`));
      else say(numWord(counted), { rate: 1 });
    }

    async function countTogether() {
      (grid.objs || []).forEach((b) => { b.querySelector('.badge')?.remove(); b.classList.remove('counted'); });
      counted = 0;
      for (const b of grid.objs || []) {
        if (!life.alive) return;
        tapCount(b);
        await sleep(850);
      }
    }

    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' },
        h('button', { class: 'btn ghost', onClick: () => go('numbers', { n: Math.max(0, n - 1) }), disabled: n <= 0 }, L('⬅️ Số trước', '⬅️ Back')),
        h('div', { class: 'row' },
          h('button', { class: 'btn blue', onClick: countTogether }, L('🔢 Đếm cùng cô', '🔢 Count with me')),
          n <= 9 ? h('button', { class: 'btn orange', onClick: () => go('trace', { set: 'digits', i: n }) }, L('✏️ Tập viết', '✏️ Trace it')) : null),
        h('button', { class: 'btn ghost', onClick: () => go('numbers', { n: Math.min(20, n + 1) }), disabled: n >= 20 }, L('Số sau ➡️', 'Next ➡️'))),
      h('div', { class: 'numcard' },
        h('div', { style: { textAlign: 'center' } },
          h('div', { class: 'num', text: n, onClick: () => say(L(`Số ${numWord(n)}`, `Number ${numWord(n)}`)) }),
          h('div', { class: 'word', text: cap(numWord(n)) })),
        h('div', { class: 'objs-wrap panel', style: { padding: '14px' } }, grid))));

    say(n === 0
      ? L('Số không. Không có gì cả!', 'Zero. Nothing at all!')
      : L(`Số ${numWord(n)}. Con chạm vào từng ${one(th)} để đếm nhé.`, `Number ${numWord(n)}. Tap each ${one(th)} to count.`));
    return () => grid.dispose?.();
  },
});

/* ---------------- Đếm và chọn ---------------- */
register('count', {
  title: () => L('Đếm và chọn', 'Count and choose'), parent: 'counting', theme: THEME, fixed: true,
  render(root, { hw } = {}) {
    const life = live();
    let q = 0, last = 0, grid = null;
    const dots = roundDots('count', hw);
    const stage = h('div', { class: 'stage panel' });
    let ansBox = h('div', { class: 'answers' });
    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }), dots),
      h('div', { class: 'play-body count-body' }, stage, ansBox)));

    function next() {
      if (!life.alive) return;
      grid?.dispose();
      dots.set(q);
      if (dots.over(q)) { roundEnd(life, () => go('count'), 'counting', 'count'); return; }
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
          await say(L(`Đúng rồi! Có ${things(n, th)}.`, `That's right! ${thereIs(n)} ${things(n, th)}.`));
          q++;
          await sleep(300);
          next();
        } else {
          b.classList.add('wrong');
          sfx.oops();
          grid.objs.forEach((o) => { o.querySelector('.badge')?.remove(); o.classList.remove('counted'); });
          counted = 0;
          say(L(`Chưa đúng rồi. Con chạm vào từng ${one(th)} để đếm lại nhé.`, `Not quite. Tap each ${one(th)} and count again.`));
        }
      });
      ansBox.replaceWith(newAns);
      ansBox = newAns;
      say(L(`Có bao nhiêu ${one(th)}? Con chạm vào từng ${one(th)} để đếm nhé.`, `How many ${many(th)} are there? Tap each ${one(th)} to count.`));
    }
    next();
    return () => grid?.dispose();
  },
});

/* ---------------- Nhiều hơn – ít hơn ---------------- */
register('compare', {
  title: () => L('Nhiều hơn, ít hơn', 'More or fewer'), parent: 'counting', theme: THEME, fixed: true,
  render(root, { hw } = {}) {
    const life = live();
    let q = 0, grids = [];
    const dots = roundDots('compare', hw);
    const body = h('div', { class: 'play-body' });
    root.append(h('div', { class: 'play' }, h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }), dots), body));

    function next() {
      if (!life.alive) return;
      grids.forEach((g) => g.dispose());
      dots.set(q);
      if (dots.over(q)) { roundEnd(life, () => go('compare'), 'counting', 'compare'); return; }
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
            const [x, y] = k === 0 ? [a, b] : [b, a];
            await say(L(
              `Đúng rồi! ${cap(numWord(x))} ${more ? 'nhiều hơn' : 'ít hơn'} ${numWord(y)}.`,
              `That's right! ${cap(numWord(x))} is ${more ? 'more' : 'less'} than ${numWord(y)}.`));
            q++;
            await sleep(300);
            next();
          } else {
            s.classList.remove('wrong'); void s.offsetWidth; s.classList.add('wrong');
            sfx.oops();
            say(L('Chưa đúng rồi. Con đếm thử mỗi bên xem nhé.', 'Not quite. Try counting each side.'));
          }
        });
        return s;
      });
      body.innerHTML = '';
      body.append(h('div', { class: 'cmp' }, sides));
      say(L(
        `Bên nào có ${more ? 'nhiều' : 'ít'} ${one(th)} hơn? Con chạm vào bên đó nhé.`,
        `Which side has ${more ? 'more' : 'fewer'} ${many(th)}? Tap that side.`));
    }
    next();
    return () => grids.forEach((g) => g.dispose());
  },
});

/* ---------------- Tìm số ---------------- */
register('find', {
  title: () => L('Tìm số', 'Find the number'), parent: 'counting', theme: THEME, fixed: true,
  render(root, { hw } = {}) {
    const life = live();
    let q = 0, lastT = -1, target = 0;
    const dots = roundDots('find', hw);
    const body = h('div', { class: 'bubbles' });
    const askAgain = () => say(L(`Con hãy chạm vào số ${numWord(target)}.`, `Tap the number ${numWord(target)}.`));
    const hint = h('button', { class: 'btn ghost', onClick: () => askAgain() }, L('🔊 Nghe lại', '🔊 Hear again'));
    root.append(h('div', { class: 'play' }, h('div', { class: 'play-head' }, levelChips(() => { q = 0; next(); }), hint, dots), body));
    const colors = ['var(--blue)', 'var(--pink)', 'var(--green)', 'var(--purple)', 'var(--orange)', 'var(--red)'];

    function next() {
      if (!life.alive) return;
      dots.set(q);
      if (dots.over(q)) { roundEnd(life, () => go('find'), 'counting', 'find'); return; }
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
            await say(L(`Đúng rồi! Đây là số ${numWord(v)}.`, `That's right! This is number ${numWord(v)}.`));
            q++;
            await sleep(300);
            next();
          } else {
            b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
            sfx.oops();
            say(L(`Đây là số ${numWord(v)}. Con tìm số ${numWord(target)} nhé.`, `This is number ${numWord(v)}. Find number ${numWord(target)}.`));
          }
        });
        body.append(b);
      });
      askAgain();
    }
    next();
  },
});
