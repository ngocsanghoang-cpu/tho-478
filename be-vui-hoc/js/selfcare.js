// BÉ TỰ LẬP – việc buổi sáng/chiều/tối, hướng dẫn từng bước, trò chơi dọn đồ chơi
import { register, go, h, say, live, sleep, giveStars, praise, celebrate, menuCard, progressDots, shuffle, rand, toast } from './ui.js';
import { sfx } from './sound.js';
import { routineDone, markRoutine } from './store.js';
import { numWord } from './vi.js';

const THEME = 'var(--green)';

/* ---------------- Dữ liệu ---------------- */
export const ROUTINES = {
  morning: {
    title: 'Buổi sáng', emoji: '☀️', color: 'yellow',
    intro: 'Chào buổi sáng! Con dậy rồi, mình cùng tự làm các việc buổi sáng nhé. Con chạm vào từng việc để nghe hướng dẫn.',
    tasks: [
      { id: 'toilet', e: '🚽', t: 'Tự đi vệ sinh', say: 'Ngủ dậy rồi, con tự đi vệ sinh nhé.', steps: ['Tự đi vào nhà vệ sinh', 'Đi vệ sinh xong nhớ xả nước', 'Rửa tay bằng xà phòng cho sạch'] },
      { id: 'face', e: '💦', t: 'Tự rửa mặt', say: 'Con tự rửa mặt cho sạch sẽ, tỉnh táo nhé.', steps: ['Vốc nước sạch lên mặt', 'Xoa nhẹ trán, hai má, mũi và cằm', 'Lau khô bằng khăn của con'] },
      { id: 'undress', e: '🩳', t: 'Tự cởi đồ ngủ', guide: 'undress' },
      { id: 'dress', e: '👕', t: 'Tự mặc đồ mới', guide: 'dress' },
      { id: 'hair', e: '🎀', t: 'Nhờ ba mẹ làm tóc', say: 'Con mang lược đến nhờ ba mẹ làm tóc nhé. Nhớ nói lời nhờ thật lễ phép.', steps: ['Mang lược và dây buộc tóc đến cho ba mẹ', 'Nói: Ba mẹ ơi, làm tóc giúp con với ạ!', 'Ngồi yên để ba mẹ chải tóc', 'Nói: Con cảm ơn ba mẹ ạ!'] },
      { id: 'bag', e: '🎒', t: 'Tự đeo túi', say: 'Con tự đeo túi đi học nhé.', steps: ['Xem trong túi có bình nước và khăn chưa', 'Kéo khoá túi lại', 'Tự đeo túi lên hai vai'] },
      { id: 'school', e: '🏫', t: 'Đi đến lớp', say: 'Đến giờ đi học rồi! Con vui vẻ đến lớp nhé.', steps: ['Tự mang giày dép', 'Chào ba mẹ trước khi đi', 'Đến lớp chào cô và các bạn'] },
    ],
  },
  afternoon: {
    title: 'Buổi chiều', emoji: '🌤️', color: 'orange',
    intro: 'Con đi học về rồi! Mình cùng tự làm các việc buổi chiều nhé.',
    tasks: [
      { id: 'shoesOn', e: '👟', t: 'Tự mang giày dép', guide: 'shoesOn' },
      { id: 'shoesOff', e: '🗄️', t: 'Cởi giày dép, cất vào tủ', guide: 'shoesOff' },
      { id: 'toys', e: '🧸', t: 'Chơi xong cất đồ chơi', game: 'tidy' },
    ],
  },
  evening: {
    title: 'Buổi tối', emoji: '🌙', color: 'purple',
    intro: 'Buổi tối rồi! Mình cùng tự làm các việc buổi tối nhé.',
    tasks: [
      { id: 'eat', e: '🥄', t: 'Tự múc ăn', say: 'Đến giờ ăn rồi. Con tự cầm muỗng múc ăn nhé.', steps: ['Ngồi ngay ngắn vào bàn ăn', 'Tự cầm muỗng múc cơm', 'Ăn gọn gàng, không làm rơi vãi', 'Ăn xong mang chén vào bồn rửa'] },
      { id: 'veggie', e: '🥦', t: 'Ăn một ít rau', say: 'Mỗi ngày con phải ăn một ít rau nhé. Rau giúp con khoẻ mạnh, mau lớn và đi vệ sinh dễ dàng.', steps: ['Tự múc một ít rau vào chén', 'Nhai thật kỹ rồi nuốt', 'Ăn hết phần rau của mình'] },
      { id: 'fold', e: '🧺', t: 'Tự xếp gọn quần áo', guide: 'fold' },
      { id: 'bed', e: '🛏️', t: 'Tự leo lên giường ngủ', say: 'Đến giờ đi ngủ rồi. Con tự leo lên giường nhé.', steps: ['Chúc ba mẹ ngủ ngon', 'Tự leo lên giường thật cẩn thận', 'Nằm ngay ngắn, đắp chăn', 'Nhắm mắt và ngủ ngoan'] },
    ],
  },
};

/** Số việc đã làm hôm nay (chỉ tính những việc có trong danh sách). */
export function routineCount(kind) {
  const ids = ROUTINES[kind].tasks.map((t) => t.id);
  return routineDone(kind).filter((id) => ids.includes(id)).length;
}

/** Buổi phù hợp theo giờ hiện tại. */
export function currentRoutine() {
  const hr = new Date().getHours();
  return hr < 11 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
}

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
    title: 'Tự mặc đồ mới', emoji: '👕', auto: false,
    intro: 'Con tự mặc quần áo mới nhé. Làm xong mỗi bước thì bấm nút Xong rồi.',
    done: 'Con đã tự mặc quần áo rồi! Trông con thật gọn gàng!',
    steps: [
      { e: '👚', t: 'Tìm cổ áo và mặt trước của áo' },
      { e: '🙆', t: 'Chui đầu qua cổ áo' },
      { e: '💪', t: 'Xỏ từng tay vào ống tay áo' },
      { e: '👕', t: 'Kéo áo xuống cho thẳng' },
      { e: '👖', t: 'Ngồi xuống, xỏ từng chân vào quần' },
      { e: '🧍', t: 'Đứng lên, kéo quần lên cao' },
      { e: '🪞', t: 'Soi gương xem đã gọn gàng chưa' },
    ],
  },
  undress: {
    title: 'Tự cởi đồ ngủ', emoji: '🩳', auto: false,
    intro: 'Con tự cởi đồ ngủ nhé. Làm xong mỗi bước thì bấm nút Xong rồi.',
    done: 'Con đã tự cởi đồ rồi! Giỏi quá!',
    steps: [
      { e: '🔘', t: 'Cởi nút áo, nếu áo có nút' },
      { e: '🙆', t: 'Kéo áo lên qua đầu' },
      { e: '💪', t: 'Rút từng tay ra khỏi ống tay áo' },
      { e: '🪑', t: 'Ngồi xuống, kéo quần xuống' },
      { e: '🦵', t: 'Rút từng chân ra khỏi ống quần' },
      { e: '🧺', t: 'Bỏ đồ ngủ vào giỏ' },
    ],
  },
  shoesOn: {
    title: 'Tự mang giày dép', emoji: '👟', auto: false,
    intro: 'Con tự mang giày dép nhé. Làm xong mỗi bước thì bấm nút Xong rồi.',
    done: 'Con đã tự mang giày dép rồi! Giỏi quá!',
    steps: [
      { e: '🪑', t: 'Ngồi xuống ghế hoặc bậc thấp' },
      { e: '👟', t: 'Đặt hai chiếc giày cạnh nhau, mũi giày quay ra ngoài là đúng chân' },
      { e: '🦶', t: 'Xỏ chân vào, kéo gót giày lên' },
      { e: '🩹', t: 'Dán quai hoặc cài khoá cho chặt' },
      { e: '🚶', t: 'Đứng lên đi thử vài bước' },
    ],
  },
  shoesOff: {
    title: 'Cởi giày dép, cất vào tủ', emoji: '🗄️', auto: false,
    intro: 'Về đến nhà rồi! Con tự cởi giày dép và cất vào tủ nhé.',
    done: 'Giày dép đã nằm gọn trong tủ rồi! Giỏi quá!',
    steps: [
      { e: '🪑', t: 'Ngồi xuống ghế hoặc bậc thấp' },
      { e: '🩹', t: 'Mở quai dán hoặc khoá giày' },
      { e: '🦶', t: 'Rút từng chân ra' },
      { e: '👟', t: 'Ghép hai chiếc giày thành một đôi' },
      { e: '🗄️', t: 'Cất đôi giày vào tủ giày' },
    ],
  },
  fold: {
    title: 'Tự xếp gọn quần áo', emoji: '🧺', auto: false,
    intro: 'Con tự xếp quần áo cho gọn gàng nhé. Làm xong mỗi bước thì bấm nút Xong rồi.',
    done: 'Quần áo của con xếp thật gọn gàng! Giỏi quá!',
    steps: [
      { e: '👕', t: 'Trải áo thật phẳng, mặt trước úp xuống' },
      { e: '↔️', t: 'Gấp hai tay áo vào giữa' },
      { e: '⬆️', t: 'Gấp đôi áo từ dưới lên' },
      { e: '👖', t: 'Gấp đôi quần theo chiều dọc, rồi gấp đôi lần nữa' },
      { e: '🗄️', t: 'Cất quần áo vào đúng ngăn tủ' },
    ],
  },
};

/* ---------------- Menu ---------------- */
register('selfcare', {
  title: 'Bé Tự Lập', parent: 'home', theme: THEME,
  render(root) {
    const card = (kind) => {
      const R = ROUTINES[kind];
      return menuCard({ emoji: R.emoji, label: R.title, sub: `${routineCount(kind)}/${R.tasks.length} việc`, color: R.color, badge: kind === currentRoutine() ? 'Bây giờ' : null, onClick: () => go('routine', { kind }) });
    };
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' }, h('div', null, h('h2', { text: '🧒 Bé Tự Lập' }), h('p', { text: 'Con tự làm việc của mình nhé!' }))),
      h('div', { class: 'cards three' }, card('morning'), card('afternoon'), card('evening')),
      h('h3', { style: { fontSize: '28px', margin: '30px 0 16px' }, text: '🌟 Tập từng kỹ năng' }),
      h('div', { class: 'cards' },
        menuCard({ emoji: '👕', label: 'Mặc quần áo', sub: 'Từng bước một', color: 'pink', onClick: () => go('guide', { id: 'dress' }) }),
        menuCard({ emoji: '👟', label: 'Mang giày dép', sub: 'Đúng chân trái, phải', color: 'blue', onClick: () => go('guide', { id: 'shoesOn' }) }),
        menuCard({ emoji: '🧺', label: 'Xếp quần áo', sub: 'Gấp gọn, cất tủ', color: 'purple', onClick: () => go('guide', { id: 'fold' }) }),
        menuCard({ emoji: '🧸', label: 'Dọn đồ chơi', sub: 'Kéo đồ vào đúng chỗ', color: 'orange', onClick: () => go('tidy') }),
        menuCard({ emoji: '🧼', label: 'Rửa tay', sub: '8 bước sạch khuẩn', color: 'green', onClick: () => go('guide', { id: 'hands' }) }),
        menuCard({ emoji: '🪥', label: 'Đánh răng', sub: 'Hẹn giờ 2 phút', color: 'yellow', onClick: () => go('guide', { id: 'teeth' }) }),
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
    const n = routineCount(kind);
    const bar = h('i');
    const tiles = R.tasks.map((t) => h('button', {
      class: 'tile' + (done.includes(t.id) ? ' done' : ''),
      onClick: () => { sfx.tap(); openTask(kind, t); },
    }, h('span', { class: 'emo', text: t.e }), h('span', { class: 'lbl', text: t.t })));
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: `${R.emoji} ${R.title}` }),
          h('p', { text: `Con đã làm ${n}/${R.tasks.length} việc` }),
          h('div', { class: 'progress-bar', style: { marginTop: '10px' } }, bar))),
      h('div', { class: 'routine-tiles' }, tiles)));
    requestAnimationFrame(() => { bar.style.width = (100 * n / R.tasks.length) + '%'; });

    if (n === R.tasks.length) say(`Con đã làm xong hết các việc ${R.title.toLowerCase()} rồi. Giỏi quá!`);
    else if (n === 0) say(R.intro);
    else say(`Con còn ${numWord(R.tasks.length - n)} việc nữa thôi. Cố lên!`);
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
  if (fresh && routineCount(kind) === R.tasks.length) {
    await celebrate({
      emoji: { morning: '🌞', afternoon: '🏅', evening: '🌟' }[kind],
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
  { id: 'shoe', e: '🗄️', t: 'Tủ giày' },
];
const THINGS = [
  { e: '🧸', n: 'gấu bông', bin: 'toy' }, { e: '🚗', n: 'ô tô đồ chơi', bin: 'toy' }, { e: '⚽', n: 'quả bóng', bin: 'toy' },
  { e: '🧩', n: 'miếng xếp hình', bin: 'toy' }, { e: '🪀', n: 'con quay', bin: 'toy' }, { e: '🤖', n: 'rô bốt', bin: 'toy' },
  { e: '👕', n: 'cái áo', bin: 'cloth' }, { e: '👖', n: 'cái quần', bin: 'cloth' }, { e: '🧦', n: 'đôi tất', bin: 'cloth' },
  { e: '🧢', n: 'cái mũ', bin: 'cloth' }, { e: '👗', n: 'cái váy', bin: 'cloth' },
  { e: '📕', n: 'quyển sách', bin: 'book' }, { e: '✏️', n: 'bút chì', bin: 'book' }, { e: '🖍️', n: 'bút sáp màu', bin: 'book' },
  { e: '📒', n: 'quyển vở', bin: 'book' },
  { e: '👟', n: 'đôi giày', bin: 'shoe' }, { e: '🩴', n: 'đôi dép', bin: 'shoe' }, { e: '🥿', n: 'đôi giày búp bê', bin: 'shoe' },
  { e: '🥾', n: 'đôi ủng', bin: 'shoe' },
];

register('tidy', {
  title: 'Dọn đồ chơi', parent: (p) => (p.kind ? ['routine', { kind: p.kind }] : 'selfcare'), theme: THEME, fixed: true,
  render(root, params) {
    const life = live();
    const byBin = (id) => shuffle(THINGS.filter((t) => t.bin === id));
    const items = shuffle([...byBin('toy').slice(0, 3), ...byBin('cloth').slice(0, 2), ...byBin('book').slice(0, 2), ...byBin('shoe').slice(0, 2)]);
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
    const cols = 5, rows = 2;
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
      'Con hãy kéo từng đồ vật vào đúng chỗ: đồ chơi vào hộp, quần áo vào giỏ, sách bút lên giá sách, giày dép vào tủ giày.');

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
