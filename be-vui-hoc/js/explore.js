// KHÁM PHÁ – ngày tháng, ngày và đêm, bên trái và bên phải
import { register, go, h, say, live, sleep, rand, pick, shuffle, praise, menuCard, progressDots, toast } from './ui.js';
import { sfx } from './sound.js';
import { bump } from './store.js';
import { L, isEn } from './i18n.js';
import { answerButtons, roundEnd, roundDots } from './play.js';

const THEME = 'var(--green)';
const COLORS = ['pink', 'orange', 'yellow', 'green', 'blue', 'purple', 'red'];

/* ---------------- Menu ---------------- */
register('explore', {
  title: () => L('Khám Phá', 'Explore'), parent: 'home', theme: THEME,
  render(root) {
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' }, h('div', null,
        h('h2', { text: L('🌈 Khám Phá', '🌈 Explore') }),
        h('p', { text: L('Tìm hiểu thế giới quanh con', 'Learn about the world around you') }))),
      h('div', { class: 'cards three' },
        menuCard({ emoji: '📅', label: L('Ngày tháng', 'Days and months'), sub: L('Hôm nay là thứ mấy?', 'What day is it today?'), color: 'pink', cls: 'tall', onClick: () => go('dates') }),
        menuCard({ emoji: '🌞', label: L('Ngày và đêm', 'Day and night'), sub: L('Sáng, trưa, chiều, tối', 'Morning, noon, afternoon, night'), color: 'blue', cls: 'tall', onClick: () => go('daynight') }),
        menuCard({ emoji: '👈👉', label: L('Trái và phải', 'Left and right'), sub: L('Bên nào là bên trái?', 'Which side is left?'), color: 'purple', cls: 'tall', onClick: () => go('leftright') }),
      )));
    say(L('Khám phá. Con muốn tìm hiểu về ngày tháng, ngày và đêm, hay bên trái bên phải?',
      'Explore. Do you want to learn about days and months, day and night, or left and right?'));
  },
});

/* =====================================================================
   NGÀY THÁNG
   ===================================================================== */
const WEEK = {
  vi: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};
const MONTHS = {
  vi: ['Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_EMO = ['❄️', '🧧', '🌱', '🌷', '🌞', '🏖️', '🍉', '🌻', '🎒', '🍂', '🌧️', '🎄'];
const week = () => L(WEEK.vi, WEEK.en);
const months = () => L(MONTHS.vi, MONTHS.en);
const weekIdx = (d) => (d.getDay() + 6) % 7; // Thứ Hai = 0

function dateSentence(d) {
  const w = week()[weekIdx(d)];
  return isEn()
    ? `${w}, ${MONTHS.en[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    : `${w}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

register('dates', {
  title: () => L('Ngày tháng', 'Days and months'), parent: 'explore', theme: THEME,
  render(root, { tab = 'today' } = {}) {
    const life = live();
    const tabs = h('div', { class: 'chips' }, [
      ['today', L('📅 Hôm nay', '📅 Today')], ['week', L('🗓️ Các ngày trong tuần', '🗓️ Days of the week')], ['months', L('🌸 Các tháng trong năm', '🌸 Months of the year')],
    ].map(([k, label]) => h('button', { class: 'chip' + (k === tab ? ' on' : ''), onClick: () => { sfx.tap(); go('dates', { tab: k }); } }, label)));
    const body = h('div');
    root.append(h('div', { class: 'menu' }, h('div', { class: 'menu-head' }, tabs), body));
    const now = new Date();

    if (tab === 'today') {
      let offset = 0;
      const card = h('div', { class: 'cal' });
      const label = h('h2', { class: 'cal-label' });
      const draw = () => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
        card.innerHTML = '';
        card.append(
          h('div', { class: 'cal-week', text: week()[weekIdx(d)] }),
          h('div', { class: 'cal-day', text: d.getDate() }),
          h('div', { class: 'cal-month', text: `${months()[d.getMonth()]} ${isEn() ? '' : '· '}${d.getFullYear()}` }));
        const [text, speech] = offset === 0
          ? [L('Hôm nay', 'Today'), L(`Hôm nay là ${dateSentence(d)}.`, `Today is ${dateSentence(d)}.`)]
          : offset < 0
            ? [L('Hôm qua', 'Yesterday'), L(`Hôm qua là ${dateSentence(d)}.`, `Yesterday was ${dateSentence(d)}.`)]
            : [L('Ngày mai', 'Tomorrow'), L(`Ngày mai là ${dateSentence(d)}.`, `Tomorrow will be ${dateSentence(d)}.`)];
        label.textContent = text;
        say(speech);
      };
      const btn = (text, off, color) => h('button', { class: `btn ${color}`, onClick: () => { sfx.tap(); offset = off; draw(); } }, text);
      card.addEventListener('click', draw);
      body.append(h('div', { class: 'cal-wrap' }, label, card,
        h('div', { class: 'row' },
          btn(L('⬅️ Hôm qua', '⬅️ Yesterday'), -1, 'blue'), btn(L('📅 Hôm nay', '📅 Today'), 0, 'pink'), btn(L('Ngày mai ➡️', 'Tomorrow ➡️'), 1, 'purple'))));
      draw();
      return;
    }

    const isWeek = tab === 'week';
    const names = isWeek ? week() : months();
    const cur = isWeek ? weekIdx(now) : now.getMonth();
    const describe = (k) => {
      if (isWeek) {
        const extra = k === cur ? L(' Hôm nay là ' + names[k] + '.', ' Today is ' + names[k] + '.')
          : k >= 5 ? L(' Đây là ngày cuối tuần, con được nghỉ học.', ' It is the weekend. No school today!') : '';
        return names[k] + '.' + extra;
      }
      const days = k === 1 ? L('28 hoặc 29', '28 or 29') : MONTH_DAYS[k];
      return L(`${names[k]} có ${days} ngày.`, `${names[k]} has ${days} days.`) + (k === cur ? L(' Bây giờ đang là ' + names[k] + '.', ' It is ' + names[k] + ' now.') : '');
    };
    const tiles = names.map((n, k) => h('button', {
      class: `card ${COLORS[k % COLORS.length]} date-tile` + (k === cur ? ' today' : ''),
      onClick: () => { sfx.tap(); say(describe(k)); },
    },
    k === cur ? h('span', { class: 'badge', text: isWeek ? L('Hôm nay', 'Today') : L('Tháng này', 'This month') }) : null,
    h('span', { class: 'emo', text: isWeek ? (k >= 5 ? '🎈' : '🎒') : MONTH_EMO[k] }),
    h('span', { class: 'lbl', text: n }),
    isWeek ? null : h('span', { class: 'sub', text: k + 1 })));

    async function readAll() {
      for (let k = 0; k < names.length; k++) {
        if (!life.alive) return;
        tiles.forEach((t, j) => t.classList.toggle('lit', j === k));
        if (!(await say(names[k]))) break;
        await sleep(150);
      }
      tiles.forEach((t) => t.classList.remove('lit'));
    }

    body.append(
      h('div', { class: 'row', style: { justifyContent: 'flex-start', marginBottom: '20px' } },
        h('button', { class: 'btn blue', onClick: readAll }, L('🔊 Đọc lần lượt', '🔊 Read them in order')),
        h('button', { class: 'btn pink', onClick: () => go('datequiz', { kind: tab }) }, L('🎮 Chơi đố vui', '🎮 Play a quiz'))),
      h('div', { class: 'cards date-grid' }, tiles));
    say(isWeek
      ? L('Một tuần có bảy ngày. Con chạm vào từng ngày để nghe nhé.', 'A week has seven days. Tap each day to hear its name.')
      : L('Một năm có mười hai tháng. Con chạm vào từng tháng để nghe nhé.', 'A year has twelve months. Tap each month to hear its name.'));
  },
});

register('datequiz', {
  title: () => L('Đố vui ngày tháng', 'Days and months quiz'), parent: (p) => ['dates', { tab: p.kind }], theme: THEME, fixed: true,
  render(root, { kind, hw }) {
    const life = live();
    const isWeek = kind === 'week';
    const names = isWeek ? week() : months();
    const N = names.length;
    const now = new Date();
    const cur = isWeek ? weekIdx(now) : now.getMonth();
    let q = 0, lastAns = -1;
    const dots = roundDots(kind, hw);
    const body = h('div', { class: 'quiz-body' });
    root.append(h('div', { class: 'play' }, h('div', { class: 'play-head' }, h('span'), dots), body));

    function next() {
      if (!life.alive) return;
      dots.set(q);
      if (dots.over(q)) { roundEnd(life, () => go('datequiz', { kind }), 'explore', kind); return; }
      let type, base, ans;
      do {
        type = q === 0 ? 'now' : pick(['after', 'before', 'after']);
        base = rand(0, N - 1);
        ans = type === 'now' ? cur : type === 'after' ? (base + 1) % N : (base + N - 1) % N;
      } while (ans === lastAns);
      lastAns = ans;
      const ask = type === 'now'
        ? (isWeek ? L('Hôm nay là thứ mấy?', 'What day is it today?') : L('Bây giờ đang là tháng mấy?', 'What month is it now?'))
        : type === 'after'
          ? (isWeek ? L(`Sau ${names[base]} là ngày nào?`, `What day comes after ${names[base]}?`) : L(`Sau ${names[base]} là tháng nào?`, `What month comes after ${names[base]}?`))
          : (isWeek ? L(`Trước ${names[base]} là ngày nào?`, `What day comes before ${names[base]}?`) : L(`Trước ${names[base]} là tháng nào?`, `What month comes before ${names[base]}?`));
      const others = shuffle([...Array(N).keys()].filter((k) => k !== ans && k !== base)).slice(0, 2);
      const opts = shuffle([ans, ...others]).map((k) => [k, names[k]]);
      const answers = answerButtons(opts, async (v, b, wrap) => {
        if (v === ans) {
          b.classList.add('right');
          wrap.querySelectorAll('.ans').forEach((x) => (x.disabled = true));
          sfx.ding(); bump('explore');
          toast(praise());
          await say(L(`Đúng rồi! ${names[ans]}.`, `That's right! ${names[ans]}.`));
          q++;
          await sleep(300);
          next();
        } else {
          b.classList.add('wrong');
          sfx.oops();
          say(L('Chưa đúng rồi. Con thử lại nhé!', 'Not quite. Try again!'));
        }
      }, 'ans word');
      body.innerHTML = '';
      body.append(
        h('div', { class: 'quiz-emo', text: isWeek ? '🗓️' : '📅' }),
        h('h2', { class: 'quiz-q', text: ask, onClick: () => say(ask) }),
        answers);
      say(ask);
    }
    next();
  },
});

/* =====================================================================
   NGÀY VÀ ĐÊM
   ===================================================================== */
const TIMES = [
  { id: 'morning', e: '🌅', vi: 'Buổi sáng', en: 'Morning', sky: 'linear-gradient(#ffd7a8, #bfe6ff 70%)', orb: '🌞', x: 18, y: 40, act: '🪥', day: true,
    sVi: 'Buổi sáng, mặt trời mọc, trời sáng dần. Con thức dậy, rửa mặt và đi học.',
    sEn: 'Morning. The sun comes up and the sky gets bright. We wake up, wash our face, and go to school.' },
  { id: 'noon', e: '☀️', vi: 'Buổi trưa', en: 'Noon', sky: 'linear-gradient(#7cc8ff, #d8f1ff 75%)', orb: '☀️', x: 50, y: 12, act: '🍚', day: true,
    sVi: 'Buổi trưa, mặt trời lên cao, trời rất sáng. Con ăn trưa rồi ngủ trưa.',
    sEn: 'Noon. The sun is high and the sky is very bright. We eat lunch and take a nap.' },
  { id: 'afternoon', e: '🌇', vi: 'Buổi chiều', en: 'Afternoon', sky: 'linear-gradient(#ffb37a, #ffd9b0 60%, #ffe9d2)', orb: '🌞', x: 82, y: 38, act: '🧸', day: true,
    sVi: 'Buổi chiều, mặt trời xuống thấp dần. Con tan học về nhà và vui chơi.',
    sEn: 'Afternoon. The sun goes down low. We come home from school and play.' },
  { id: 'night', e: '🌙', vi: 'Ban đêm', en: 'Night', sky: 'linear-gradient(#1b2452, #3b3f80 80%)', orb: '🌙', x: 70, y: 16, act: '😴', day: false,
    sVi: 'Ban đêm, mặt trời lặn, trời tối. Trên trời có mặt trăng và các vì sao. Con đi ngủ.',
    sEn: 'Night. The sun has set and the sky is dark. The moon and the stars come out. We go to sleep.' },
];

register('daynight', {
  title: () => L('Ngày và đêm', 'Day and night'), parent: 'explore', theme: THEME, fixed: true,
  render(root) {
    const hr = new Date().getHours();
    let cur = hr < 11 ? 0 : hr < 14 ? 1 : hr < 18 ? 2 : 3;
    const sky = h('div', { class: 'sky' });
    const orb = h('div', { class: 'orb' });
    const stars = h('div', { class: 'stars', text: '⭐ ✨ ⭐ ✨ ⭐ ✨ ⭐' });
    const act = h('div', { class: 'act' });
    const tag = h('div', { class: 'sky-tag' });
    sky.append(stars, orb, h('div', { class: 'ground' }, h('span', { text: '🌳' }), h('span', { text: '🏠' }), act, h('span', { text: '🌷' })), tag);
    const btns = TIMES.map((t, k) => h('button', { class: 'chip big', onClick: () => { sfx.tap(); show(k, true); } }, `${t.e} ${L(t.vi, t.en)}`));

    function show(k, speak) {
      cur = k;
      const t = TIMES[k];
      sky.style.background = t.sky;
      sky.classList.toggle('night', !t.day);
      orb.textContent = t.orb;
      orb.style.left = t.x + '%';
      orb.style.top = t.y + '%';
      act.textContent = t.act;
      tag.textContent = t.day ? L('☀️ Ban ngày', '☀️ Daytime') : L('🌙 Ban đêm', '🌙 Nighttime');
      btns.forEach((b, j) => b.classList.toggle('on', j === k));
      if (speak) say(L(t.sVi, t.sEn));
    }
    orb.addEventListener('click', () => show(cur, true));

    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' },
        h('div', { class: 'chips' }, btns),
        h('button', { class: 'btn pink', onClick: () => go('dnquiz') }, L('🎮 Chơi đố vui', '🎮 Play a quiz'))),
      sky));
    show(cur, false);
    say(L('Ban ngày trời sáng, có mặt trời. Ban đêm trời tối, có mặt trăng và các vì sao. Con chạm vào từng buổi để xem nhé.',
      'In the daytime the sky is bright and the sun is out. At night the sky is dark, and we see the moon and stars. Tap each time of day to see it.'));
  },
});

const DN_ITEMS = [
  ['☀️', 'Mặt trời chiếu sáng', 'The sun is shining', true], ['🌈', 'Cầu vồng trên trời', 'A rainbow in the sky', true],
  ['🏫', 'Con đi học', 'Going to school', true], ['🛝', 'Chơi cầu trượt ngoài sân', 'Playing on the slide', true],
  ['🥪', 'Ăn bữa trưa', 'Eating lunch', true], ['🐓', 'Gà trống gáy gọi dậy', 'The rooster wakes us up', true],
  ['🌻', 'Hoa hướng dương đón nắng', 'Sunflowers in the sunshine', true], ['🕶️', 'Đeo kính râm vì nắng chói', 'Wearing sunglasses in the bright sun', true],
  ['🌙', 'Mặt trăng trên trời', 'The moon in the sky', false], ['⭐', 'Các vì sao lấp lánh', 'The stars are twinkling', false],
  ['😴', 'Con đi ngủ', 'Going to sleep', false], ['🦉', 'Cú mèo thức dậy', 'The owl wakes up', false],
  ['🦇', 'Dơi bay đi kiếm ăn', 'Bats fly out to find food', false], ['🔦', 'Bật đèn pin vì trời tối', 'Using a flashlight in the dark', false],
  ['🛌', 'Đắp chăn ngủ ngon', 'Sleeping under a blanket', false], ['🎆', 'Xem pháo hoa', 'Watching fireworks', false],
];

register('dnquiz', {
  title: () => L('Ngày hay đêm?', 'Day or night?'), parent: 'daynight', theme: THEME, fixed: true,
  render(root, { hw } = {}) {
    const life = live();
    let q = 0;
    const items = shuffle(DN_ITEMS);
    const dots = roundDots('dn', hw);
    const body = h('div', { class: 'quiz-body' });
    root.append(h('div', { class: 'play' }, h('div', { class: 'play-head' }, h('span'), dots), body));

    function next() {
      if (!life.alive) return;
      dots.set(q);
      if (dots.over(q)) { roundEnd(life, () => go('dnquiz'), 'explore', 'dn'); return; }
      const [emo, vi, en, isDay] = items[q % items.length];
      const label = L(vi, en);
      const ask = L(`${label}. Đây là ban ngày hay ban đêm?`, `${label}. Is it day or night?`);
      const answers = answerButtons([[true, L('☀️ Ban ngày', '☀️ Day')], [false, L('🌙 Ban đêm', '🌙 Night')]], async (v, b, wrap) => {
        if (v === isDay) {
          b.classList.add('right');
          wrap.querySelectorAll('.ans').forEach((x) => (x.disabled = true));
          sfx.ding(); bump('explore');
          toast(praise());
          await say(isDay ? L('Đúng rồi! Đó là ban ngày.', "That's right! That is daytime.") : L('Đúng rồi! Đó là ban đêm.', "That's right! That is nighttime."));
          q++;
          await sleep(300);
          next();
        } else {
          b.classList.add('wrong');
          sfx.oops();
          say(L('Chưa đúng. Con nghĩ lại nhé: lúc đó trời sáng hay trời tối?', 'Not quite. Think again: is the sky bright or dark then?'));
        }
      }, 'ans word');
      body.innerHTML = '';
      body.append(h('div', { class: 'quiz-emo big', text: emo }), h('h2', { class: 'quiz-q', text: label, onClick: () => say(ask) }), answers);
      say(ask);
    }
    next();
  },
});

/* =====================================================================
   BÊN TRÁI – BÊN PHẢI
   ===================================================================== */
const ANIMALS = [
  ['🐱', 'bạn mèo', 'cat'], ['🐶', 'bạn cún', 'puppy'], ['🐰', 'bạn thỏ', 'bunny'], ['🐻', 'bạn gấu', 'bear'],
  ['🦊', 'bạn cáo', 'fox'], ['🐼', 'bạn gấu trúc', 'panda'], ['🐸', 'bạn ếch', 'frog'], ['🦄', 'bạn kỳ lân', 'unicorn'],
];
const sideName = (left) => (left ? L('bên trái', 'left') : L('bên phải', 'right'));
const aName = (a) => L(a[1], 'the ' + a[2]);
const capS = (s) => s.charAt(0).toUpperCase() + s.slice(1);

register('leftright', {
  title: () => L('Trái và phải', 'Left and right'), parent: 'explore', theme: THEME, fixed: true,
  render(root) {
    const [a, b] = shuffle(ANIMALS).slice(0, 2);
    const half = (left, animal) => h('button', {
      class: 'lr-half ' + (left ? 'left' : 'right'),
      onClick: (ev) => {
        sfx.tap();
        ev.currentTarget.classList.remove('lit'); void ev.currentTarget.offsetWidth; ev.currentTarget.classList.add('lit');
        say(L(`Đây là ${sideName(left)}. ${capS(animal[1])} đang ở ${sideName(left)}.`, `This is the ${sideName(left)}. ${capS(aName(animal))} is on the ${sideName(left)}.`));
      },
    },
    h('div', { class: 'lr-arrow', text: left ? '👈' : '👉' }),
    h('div', { class: 'lr-animal', text: animal[0] }),
    h('div', { class: 'lr-name', text: left ? L('Bên trái', 'Left') : L('Bên phải', 'Right') }));

    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' },
        h('p', { style: { margin: 0, fontSize: '22px', color: 'var(--muted)' }, text: L('Chạm vào mỗi bên để nghe nhé', 'Tap each side to hear') }),
        h('button', { class: 'btn pink', onClick: () => go('lrquiz') }, L('🎮 Chơi đố vui', '🎮 Play a quiz'))),
      h('div', { class: 'lr' }, half(true, a), half(false, b))));
    say(L('Đây là bên trái, và đây là bên phải. Con giơ tay trái lên nào! Rồi giơ tay phải lên nào! Con chạm vào mỗi bên để nghe nhé.',
      'This is the left, and this is the right. Raise your left hand! Now raise your right hand! Tap each side to hear.'));
  },
});

register('lrquiz', {
  title: () => L('Trái hay phải?', 'Left or right?'), parent: 'leftright', theme: THEME, fixed: true,
  render(root, { hw } = {}) {
    const life = live();
    let q = 0;
    const dots = roundDots('lr', hw);
    const body = h('div', { class: 'quiz-body' });
    let ask = '';
    root.append(h('div', { class: 'play' },
      h('div', { class: 'play-head' }, h('button', { class: 'btn ghost', onClick: () => say(ask) }, L('🔊 Nghe lại', '🔊 Hear again')), dots), body));

    async function good(el, speech) {
      sfx.ding(); bump('explore');
      toast(praise());
      await say(speech);
      q++;
      await sleep(300);
      next();
    }
    function bad(el, pickedLeft) {
      el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
      sfx.oops();
      say(L(`Chưa đúng. Đây là ${sideName(pickedLeft)}. Con thử lại nhé.`, `Not quite. This is the ${sideName(pickedLeft)}. Try again.`));
    }
    const sideButtons = (onPick) => h('div', { class: 'answers' },
      [true, false].map((left) => {
        const b = h('button', { class: 'ans word' }, left ? L('👈 Bên trái', '👈 Left') : L('Bên phải 👉', 'Right 👉'));
        b.addEventListener('click', () => onPick(left, b));
        return b;
      }));

    function next() {
      if (!life.alive) return;
      dots.set(q);
      if (dots.over(q)) { roundEnd(life, () => go('lrquiz'), 'explore', 'lr'); return; }
      const type = ['which', 'side', 'move'][q % 3];
      const wantLeft = Math.random() < 0.5;
      let solved = false;
      body.innerHTML = '';

      if (type === 'which') {
        // Hai con vật – chạm vào con ở bên trái/phải
        const [a, b] = shuffle(ANIMALS).slice(0, 2);
        ask = L(`Bạn nào đang ở ${sideName(wantLeft)}? Con chạm vào bạn đó nhé.`, `Who is on the ${sideName(wantLeft)}? Tap that friend.`);
        const mk = (animal, left) => {
          const el = h('button', { class: 'lr-pick', text: animal[0] });
          el.addEventListener('click', () => {
            if (solved) return;
            if (left === wantLeft) { solved = true; el.classList.add('right'); good(el, L(`Đúng rồi! ${capS(animal[1])} ở ${sideName(left)}.`, `That's right! ${capS(aName(animal))} is on the ${sideName(left)}.`)); }
            else bad(el, left);
          });
          return el;
        };
        body.append(h('div', { class: 'lr-stage' }, mk(a, true), h('span'), mk(b, false)));
      } else if (type === 'side') {
        // Một con vật – nó đang ở bên nào?
        const a = pick(ANIMALS);
        ask = L(`${capS(a[1])} đang ở bên nào?`, `Which side is ${aName(a)} on?`);
        const slots = [h('span'), h('span'), h('span')];
        slots[wantLeft ? 0 : 2] = h('div', { class: 'lr-pick still', text: a[0] });
        body.append(h('div', { class: 'lr-stage' }, slots), sideButtons((left, btn) => {
          if (solved) return;
          if (left === wantLeft) { solved = true; btn.classList.add('right'); good(btn, L(`Đúng rồi! ${capS(a[1])} ở ${sideName(left)}.`, `That's right! ${capS(aName(a))} is on the ${sideName(left)}.`)); }
          else bad(btn, left);
        }));
      } else {
        // Đưa bạn thỏ sang trái/phải
        ask = L(`Con hãy đưa bạn thỏ sang ${sideName(wantLeft)}.`, `Move the bunny to the ${sideName(wantLeft)}.`);
        const bunny = h('div', { class: 'lr-pick still mover', text: '🐰' });
        const slot = (left) => h('span', { class: 'lr-goal', text: left === wantLeft ? '🥕' : '' });
        body.append(h('div', { class: 'lr-stage' }, slot(true), bunny, slot(false)), sideButtons((left, btn) => {
          if (solved) return;
          if (left === wantLeft) {
            solved = true; btn.classList.add('right');
            bunny.style.transform = `translateX(${left ? '-' : ''}110%)`;
            good(btn, L(`Đúng rồi! Bạn thỏ đã sang ${sideName(left)}.`, `That's right! The bunny moved to the ${sideName(left)}.`));
          } else bad(btn, left);
        }));
      }
      say(ask);
    }
    next();
  },
});
