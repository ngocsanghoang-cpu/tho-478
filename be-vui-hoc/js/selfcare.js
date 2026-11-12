// BÉ TỰ LẬP – thói quen buổi sáng/tối, hướng dẫn từng bước, trò chơi dọn đồ chơi
import { register, go, h, say, live, sleep, giveStars, praise, celebrate, menuCard, progressDots, shuffle, rand, toast } from './ui.js';
import { sfx } from './sound.js';
import { routineDone, markRoutine } from './store.js';
import { numWord } from './vi.js';

const THEME = 'var(--green)';

/* ---------------- Dữ liệu ---------------- */
const ROUTINES = {
  morning: {
    title: 'Buổi sáng', emoji: '☀️',
    intro: 'Chào buổi sáng! Mình cùng làm các việc buổi sáng nhé. Con chạm vào từng việc để nghe hướng dẫn.',
    tasks: [
      { id: 'bed', e: '🛏️', t: 'Gấp chăn gối', say: 'Con dậy rồi! Hãy tự gấp chăn và xếp gối gọn gàng nhé.', steps: ['Kéo chăn cho phẳng', 'Gấp đôi chăn lại', 'Đặt gối ngay ngắn ở đầu giường'] },
      { id: 'toilet', e: '🚽', t: 'Đi vệ sinh', say: 'Con tự đi vệ sinh nhé.', steps: ['Đi vệ sinh', 'Nhớ xả nước', 'Rửa tay bằng xà phòng'] },
      { id: 'teeth', e: '🪥', t: 'Đánh răng', guide: 'teeth' },
      { id: 'face', e: '💦', t: 'Rửa mặt', say: 'Con tự rửa mặt cho sạch sẽ nhé.', steps: ['Vốc nước sạch lên mặt', 'Xoa nhẹ trán, hai má và cằm', 'Lau khô bằng khăn của con'] },
      { id: 'clothes', e: '👕', t: 'Tự mặc quần áo', guide: 'dress' },
      { id: 'breakfast', e: '🥣', t: 'Ăn sáng', say: 'Đến giờ ăn sáng rồi. Con tự xúc ăn nhé.', steps: ['Ngồi ngay ngắn vào bàn', 'Tự xúc ăn gọn gàng', 'Ăn xong mang bát vào bồn rửa'] },
      { id: 'bag', e: '🎒', t: 'Đeo cặp, đi giày', say: 'Chuẩn bị đi học thôi!', steps: ['Kiểm tra cặp sách và bình nước', 'Tự đi giày', 'Chào bố mẹ trước khi đi'] },
    ],
  },
  evening: {
    title: 'Buổi tối', emoji: '🌙',
    intro: 'Buổi tối rồi! Mình cùng làm các việc buổi tối nhé.',
    tasks: [
      { id: 'toys', e: '🧸', t: 'Cất đồ chơi', game: 'tidy', say: 'Chơi xong con tự cất đồ chơi nhé.' },
      { id: 'bath', e: '🛁', t: 'Tắm', say: 'Đến giờ tắm rồi.', steps: ['Cởi quần áo bỏ vào giỏ đồ bẩn', 'Tắm cùng bố mẹ, kỳ cọ sạch sẽ', 'Lau khô người và mặc đồ ngủ'] },
      { id: 'dinner', e: '🍽️', t: 'Ăn tối, dọn bát', say: 'Ăn tối xong con giúp bố mẹ dọn bát nhé.', steps: ['Tự ăn hết phần cơm của mình', 'Mang bát đũa vào bồn rửa', 'Lau miệng và rửa tay'] },
      { id: 'teeth', e: '🪥', t: 'Đánh răng', guide: 'teeth' },
      { id: 'pack', e: '📚', t: 'Soạn cặp sách', say: 'Con tự soạn cặp cho ngày mai nhé.', steps: ['Xem ngày mai học gì', 'Cất sách vở vào cặp', 'Để cặp ở chỗ quen thuộc'] },
      { id: 'sleep', e: '😴', t: 'Đi ngủ đúng giờ', say: 'Đến giờ đi ngủ rồi.', steps: ['Đi vệ sinh trước khi ngủ', 'Chúc bố mẹ ngủ ngon', 'Nằm ngay ngắn và nhắm mắt lại'] },
    ],
  },
};

const GUIDES = {
  hands: {
    title: 'Rửa tay', emoji: '🧼', auto: true, countAloud: true,
    intro: 'Mình cùng rửa tay thật sạch nhé! Con làm theo cô từng bước.',
    done: 'Tay con sạch thơm rồi! Giỏi quá!',
    steps: [
      { e: '🚰', t: 'Làm ướt tay và xoa xà phòng', secs: 4 },
      { e: '🤲', t: 'Chà hai lòng bàn tay vào nhau', secs: 5 },
      { e: '🖐️', t: 'Chà mu bàn tay', secs: 5 },
      { e: '🙌', t: 'Đan các ngón tay vào nhau và chà', secs: 5 },
      { e: '👍', t: 'Xoay và chà ngón tay cái', secs: 5 },
      { e: '☝️', t: 'Chụm đầu ngón tay, chà vào lòng bàn tay', secs: 5 },
      { e: '💧', t: 'Xả sạch xà phòng dưới vòi nước', secs: 5 },
      { e: '🧻', t: 'Lau khô tay bằng khăn sạch', secs: 4 },
    ],
  },
  teeth: {
    title: 'Đánh răng 2 phút', emoji: '🪥', auto: true,
    intro: 'Mình cùng đánh răng trong hai phút nhé! Cô sẽ nhắc con chải từng chỗ.',
    done: 'Răng con trắng sạch rồi! Con cười thật tươi nào!',
    steps: [
      { e: '🪥', t: 'Lấy bàn chải, bóp kem bằng hạt đậu', secs: 8 },
      { e: '😁', t: 'Chải mặt ngoài răng hàm trên', secs: 20 },
      { e: '😬', t: 'Chải mặt ngoài răng hàm dưới', secs: 20 },
      { e: '👄', t: 'Chải mặt trong răng hàm trên', secs: 20 },
      { e: '👅', t: 'Chải mặt trong răng hàm dưới', secs: 20 },
      { e: '🦷', t: 'Chải mặt nhai, đưa bàn chải tới lui', secs: 20 },
      { e: '😛', t: 'Chải lưỡi thật nhẹ nhàng', secs: 10 },
      { e: '🥛', t: 'Súc miệng bằng nước sạch', secs: 8 },
    ],
  },
  dress: {
    title: 'Tự mặc quần áo', emoji: '👕', auto: false,
    intro: 'Con tự mặc quần áo nhé. Làm xong mỗi bước thì bấm nút Xong rồi.',
    done: 'Con đã tự mặc quần áo rồi! Trông con thật gọn gàng!',
    steps: [
      { e: '👚', t: 'Tìm cổ áo và mặt trước của áo' },
      { e: '🙆', t: 'Chui đầu qua cổ áo' },
      { e: '💪', t: 'Xỏ từng tay vào ống tay áo' },
      { e: '👖', t: 'Ngồi xuống, xỏ từng chân vào quần' },
      { e: '🧍', t: 'Đứng lên, kéo quần lên cao' },
      { e: '🧦', t: 'Đi tất vào hai chân' },
      { e: '🪞', t: 'Soi gương xem đã gọn gàng chưa' },
    ],
  },
};

/* ---------------- Menu ---------------- */
register('selfcare', {
  title: 'Bé Tự Lập', parent: 'home', theme: THEME,
  render(root) {
    const m = routineDone('morning').length, e = routineDone('evening').length;
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' }, h('div', null, h('h2', { text: '🧒 Bé Tự Lập' }), h('p', { text: 'Con tự làm việc của mình nhé!' }))),
      h('div', { class: 'cards' },
        menuCard({ emoji: '☀️', label: 'Buổi sáng', sub: `${m}/${ROUTINES.morning.tasks.length} việc`, color: 'yellow', onClick: () => go('routine', { kind: 'morning' }) }),
        menuCard({ emoji: '🌙', label: 'Buổi tối', sub: `${e}/${ROUTINES.evening.tasks.length} việc`, color: 'purple', onClick: () => go('routine', { kind: 'evening' }) }),
        menuCard({ emoji: '🧼', label: 'Rửa tay', sub: '8 bước sạch khuẩn', color: 'blue', onClick: () => go('guide', { id: 'hands' }) }),
        menuCard({ emoji: '🪥', label: 'Đánh răng', sub: 'Hẹn giờ 2 phút', color: 'green', onClick: () => go('guide', { id: 'teeth' }) }),
        menuCard({ emoji: '👕', label: 'Mặc quần áo', sub: 'Từng bước một', color: 'pink', onClick: () => go('guide', { id: 'dress' }) }),
        menuCard({ emoji: '🧸', label: 'Dọn đồ chơi', sub: 'Kéo đồ vào đúng chỗ', color: 'orange', onClick: () => go('tidy') }),
      )));
    say('Bé tự lập. Hôm nay con muốn tự làm việc gì nào?');
  },
});

/* ---------------- Danh sách việc trong ngày ---------------- */
register('routine', {
  title: (p) => ROUTINES[p.kind].title, parent: 'selfcare', theme: THEME,
  render(root, { kind }) {
    const R = ROUTINES[kind];
    const done = routineDone(kind);
    const bar = h('i');
    const tiles = R.tasks.map((t) => h('button', {
      class: 'tile' + (done.includes(t.id) ? ' done' : ''),
      onClick: () => { sfx.tap(); openTask(kind, t); },
    }, h('span', { class: 'emo', text: t.e }), h('span', { class: 'lbl', text: t.t })));
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: `${R.emoji} ${R.title}` }),
          h('p', { text: `Con đã làm ${done.length}/${R.tasks.length} việc` }),
          h('div', { class: 'progress-bar', style: { marginTop: '10px' } }, bar))),
      h('div', { class: 'routine-tiles' }, tiles)));
    requestAnimationFrame(() => { bar.style.width = (100 * done.length / R.tasks.length) + '%'; });

    if (done.length === R.tasks.length) say(`Con đã làm xong hết các việc ${R.title.toLowerCase()} rồi. Giỏi quá!`);
    else if (done.length === 0) say(R.intro);
    else say(`Con còn ${numWord(R.tasks.length - done.length)} việc nữa thôi. Cố lên!`);
  },
});

function openTask(kind, t) {
  if (t.guide) go('guide', { id: t.guide, kind, task: t.id });
  else if (t.game) go('tidy', { kind, task: t.id });
  else go('task', { kind, id: t.id });
}

/** Đánh dấu một việc đã xong + chúc mừng nếu hoàn thành cả buổi. */
async function completeTask(kind, id, fromEl) {
  const fresh = markRoutine(kind, id);
  if (fresh) giveStars(1, fromEl);
  const R = ROUTINES[kind];
  if (fresh && routineDone(kind).length === R.tasks.length) {
    await celebrate({
      emoji: R.emoji === '☀️' ? '🌞' : '🌟',
      title: 'Xong hết rồi!',
      text: `Con đã tự làm tất cả việc ${R.title.toLowerCase()}!`,
      stars: 3,
      buttons: [['Tuyệt vời! 🎉', 'green']],
    });
  }
  go('routine', { kind });
}

/* ---------------- Một việc (đọc các bước) ---------------- */
register('task', {
  title: (p) => ROUTINES[p.kind].tasks.find((t) => t.id === p.id).t,
  parent: (p) => ['routine', { kind: p.kind }], theme: THEME, fixed: true,
  render(root, { kind, id }) {
    const life = live();
    const t = ROUTINES[kind].tasks.find((x) => x.id === id);
    const items = t.steps.map((s, i) => h('li', null, h('b', { text: i + 1 }), s));
    const doneBtn = h('button', { class: 'btn big green pulse', onClick: () => { sfx.ding(); completeTask(kind, id, doneBtn); } }, '✅ Con làm xong rồi!');
    root.append(h('div', { class: 'task' },
      h('div', { class: 'emo', text: t.e }),
      h('h2', { text: t.t }),
      h('ol', { class: 'steps' }, items),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onClick: () => readSteps() }, '🔊 Nghe lại'),
        doneBtn)));

    async function readSteps() {
      if (!(await say(t.say))) return;
      for (let i = 0; i < t.steps.length; i++) {
        if (!life.alive) return;
        items.forEach((li, j) => li.classList.toggle('now', i === j));
        const ok = await say(`Bước ${numWord(i + 1)}: ${t.steps[i]}.`);
        if (!ok || !life.alive) return;
        await sleep(250);
      }
      items.forEach((li) => li.classList.remove('now'));
      if (life.alive) say('Làm xong thì con bấm nút màu xanh nhé!');
    }
    readSteps();
  },
});

/* ---------------- Hướng dẫn từng bước có hẹn giờ ---------------- */
register('guide', {
  title: (p) => GUIDES[p.id].title,
  parent: (p) => (p.kind ? ['routine', { kind: p.kind }] : 'selfcare'), theme: THEME, fixed: true,
  render(root, params) {
    const G = GUIDES[params.id];
    const life = live();
    let idx = -1;
    let paused = false;
    let token = 0;

    const dots = progressDots(G.steps.length);
    const emo = h('div', { class: 'guide-emo', text: G.emoji });
    const text = h('p', { class: 'guide-text', text: G.title });
    const C = 2 * Math.PI * 90;
    const fg = svgEl('circle', { class: 'fg', cx: 100, cy: 100, r: 90, 'stroke-dasharray': C, 'stroke-dashoffset': 0 });
    const num = h('div', { class: 'num' });
    const ring = h('div', { class: 'ring' },
      svgEl('svg', { viewBox: '0 0 200 200' }, svgEl('circle', { class: 'bg', cx: 100, cy: 100, r: 90 }), fg), num);
    ring.hidden = true;

    const pauseBtn = h('button', { class: 'btn orange', onClick: togglePause }, '⏸️ Tạm dừng');
    const nextBtn = h('button', { class: 'btn green big', onClick: () => { sfx.tap(); runStep(idx + 1); } }, G.auto ? '⏭️ Bước tiếp' : '✅ Xong rồi');
    const startBtn = h('button', { class: 'btn green big pulse', onClick: () => { startBtn.remove(); controls.hidden = false; runStep(0); } }, '▶️ Bắt đầu');
    const controls = h('div', { class: 'row' },
      h('button', { class: 'btn ghost', onClick: () => idx >= 0 && runStep(idx) }, '🔊 Nghe lại'),
      G.auto ? pauseBtn : null, nextBtn);
    controls.hidden = true;

    root.append(h('div', { class: 'guide' },
      h('div', { class: 'play-head' }, dots, h('div', { style: { fontSize: '22px', color: 'var(--muted)' }, text: `${G.steps.length} bước` })),
      h('div', { class: 'guide-main' }, h('div', null, emo, text), ring),
      h('div', { class: 'row' }, startBtn, controls)));

    say(G.intro + ' Con bấm Bắt đầu nhé!');

    function togglePause() {
      paused = !paused;
      pauseBtn.textContent = paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
      if (paused) say('Tạm dừng.');
    }

    async function runStep(i) {
      const my = ++token;
      const alive = () => life.alive && my === token;
      if (i >= G.steps.length) { finish(); return; }
      idx = i;
      paused = false;
      pauseBtn.textContent = '⏸️ Tạm dừng';
      const s = G.steps[i];
      dots.set(i);
      emo.textContent = s.e;
      text.textContent = s.t;
      ring.hidden = !s.secs;
      if (s.secs) { setRing(s.secs, s.secs); }
      await say(`Bước ${numWord(i + 1)}. ${s.t}.`);
      if (!alive()) return;
      if (s.secs) {
        for (let left = s.secs; left > 0; left--) {
          while (paused) { await sleep(200); if (!alive()) return; }
          setRing(left - 1, s.secs);
          if (G.countAloud) say(numWord(s.secs - left + 1), { rate: 1.1 });
          else if (left === 11 && s.secs >= 20) say('Cố lên, chải tiếp nào!');
          else sfx.tick();
          await sleep(1000);
          if (!alive()) return;
        }
        sfx.ding();
        if (G.auto) { await sleep(400); if (alive()) runStep(i + 1); }
      }
    }

    function setRing(left, total) {
      num.textContent = left;
      fg.setAttribute('stroke-dashoffset', String(C * (1 - left / total)));
    }

    async function finish() {
      token++;
      dots.set(G.steps.length);
      bumpGuide();
      const ans = await celebrate({
        emoji: G.emoji, title: 'Hoàn thành!', text: G.done, speech: G.done, stars: params.kind ? 0 : 2,
        buttons: [['Làm lại 🔁', 'orange'], ['Xong ✅', 'green']],
      });
      if (!life.alive) return;
      if (params.kind) { completeTask(params.kind, params.task, null); return; }
      if (ans === 0) go('guide', params); else go('selfcare');
    }
    function bumpGuide() { toast(praise()); }
  },
});

function svgEl(tag, attrs, ...kids) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  kids.forEach((k) => el.append(k));
  return el;
}

/* ---------------- Trò chơi: Dọn đồ chơi ---------------- */
const BINS = [
  { id: 'toy', e: '📦', t: 'Hộp đồ chơi' },
  { id: 'cloth', e: '🧺', t: 'Giỏ quần áo' },
  { id: 'book', e: '📚', t: 'Giá sách' },
];
const THINGS = [
  { e: '🧸', n: 'gấu bông', bin: 'toy' }, { e: '🚗', n: 'ô tô đồ chơi', bin: 'toy' }, { e: '⚽', n: 'quả bóng', bin: 'toy' },
  { e: '🧩', n: 'miếng xếp hình', bin: 'toy' }, { e: '🪀', n: 'con quay', bin: 'toy' }, { e: '🤖', n: 'rô bốt', bin: 'toy' },
  { e: '👕', n: 'cái áo', bin: 'cloth' }, { e: '👖', n: 'cái quần', bin: 'cloth' }, { e: '🧦', n: 'đôi tất', bin: 'cloth' },
  { e: '🧢', n: 'cái mũ', bin: 'cloth' }, { e: '👗', n: 'cái váy', bin: 'cloth' },
  { e: '📕', n: 'quyển sách', bin: 'book' }, { e: '✏️', n: 'bút chì', bin: 'book' }, { e: '🖍️', n: 'bút sáp màu', bin: 'book' },
  { e: '📒', n: 'quyển vở', bin: 'book' },
];

register('tidy', {
  title: 'Dọn đồ chơi', parent: (p) => (p.kind ? ['routine', { kind: p.kind }] : 'selfcare'), theme: THEME, fixed: true,
  render(root, params) {
    const life = live();
    const byBin = (id) => shuffle(THINGS.filter((t) => t.bin === id));
    const items = shuffle([...byBin('toy').slice(0, 3), ...byBin('cloth').slice(0, 3), ...byBin('book').slice(0, 2)]);
    let left = items.length;

    const room = h('div', { class: 'room' }, h('div', { class: 'win', text: '🪟' }));
    const binEls = BINS.map((b) => {
      const got = h('div', { class: 'got' });
      const el = h('div', { class: 'bin' }, h('div', { class: 'emo', text: b.e }), h('div', { class: 'lbl', text: b.t }), got);
      el.dataset.bin = b.id;
      el.got = got;
      return el;
    });
    root.append(h('div', { class: 'tidy' }, room, h('div', { class: 'bins' }, binEls)));

    // Rải đồ lên sàn theo lưới có xáo trộn để không chồng lên nhau
    const cols = 4, rows = 2;
    const cells = shuffle([...Array(cols * rows).keys()]);
    items.forEach((it, k) => {
      const c = cells[k];
      const x = ((c % cols) + 0.15 + Math.random() * 0.5) / cols * 100;
      const y = 22 + (Math.floor(c / cols) + 0.1 + Math.random() * 0.45) / rows * 62;
      const el = h('div', { class: 'toy', text: it.e });
      el.style.left = `calc(${x}% - 37px)`;
      el.style.top = `calc(${y}% - 20px)`;
      el.style.transform = `rotate(${rand(-20, 20)}deg)`;
      room.append(el);
      makeDraggable(el, it);
    });

    say((params.kind ? 'Chơi xong rồi, mình cùng cất đồ nhé! ' : '') +
      'Con hãy kéo từng đồ vật vào đúng chỗ: đồ chơi vào hộp, quần áo vào giỏ, sách bút lên giá sách.');

    function binAt(x, y) {
      return binEls.find((b) => {
        const r = b.getBoundingClientRect();
        return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 30 && y <= r.bottom + 10;
      });
    }

    function makeDraggable(el, it) {
      let sx = 0, sy = 0, id = null, moved = false, rot = el.style.transform;
      el.addEventListener('pointerdown', (e) => {
        if (id !== null) return;
        id = e.pointerId; moved = false;
        sx = e.clientX; sy = e.clientY;
        el.setPointerCapture(id);
        el.classList.add('drag');
        sfx.tap();
      });
      el.addEventListener('pointermove', (e) => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
        el.style.transform = `translate(${dx}px, ${dy}px) scale(1.2)`;
        binEls.forEach((b) => b.classList.toggle('hot', b === binAt(e.clientX, e.clientY)));
      });
      const up = (e) => {
        if (e.pointerId !== id) return;
        id = null;
        el.classList.remove('drag');
        binEls.forEach((b) => b.classList.remove('hot'));
        const bin = e.type === 'pointerup' ? binAt(e.clientX, e.clientY) : null;
        const binInfo = bin && BINS.find((b) => b.id === bin.dataset.bin);
        if (!moved) {
          el.style.transform = rot;
          say(`Đây là ${it.n}. Con kéo ${it.n} vào đúng chỗ nhé.`);
        } else if (bin && bin.dataset.bin === it.bin) {
          el.remove();
          bin.got.textContent += it.e;
          bin.classList.remove('yay'); void bin.offsetWidth; bin.classList.add('yay');
          sfx.pop();
          left--;
          if (left === 0) done();
          else say(`Đúng rồi! ${capFirst(it.n)} cất vào ${binInfo.t.toLowerCase()}.`);
        } else {
          el.style.transform = rot;
          if (bin) { sfx.oops(); say(`Ồ, ${it.n} không để ở ${binInfo.t.toLowerCase()}. Con thử chỗ khác nhé.`); }
        }
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    async function done() {
      await sleep(300);
      if (!life.alive) return;
      const ans = await celebrate({
        emoji: '🏠', title: 'Gọn gàng quá!', text: 'Phòng của con sạch đẹp rồi!',
        speech: 'Hoan hô! Phòng của con gọn gàng sạch đẹp rồi!', stars: params.kind ? 0 : 2,
        buttons: params.kind ? [['Xong ✅', 'green']] : [['Chơi lại 🔁', 'orange'], ['Xong ✅', 'green']],
      });
      if (!life.alive) return;
      if (params.kind) completeTask(params.kind, params.task, null);
      else if (ans === 0) go('tidy', params);
      else go('selfcare');
    }
  },
});

const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
