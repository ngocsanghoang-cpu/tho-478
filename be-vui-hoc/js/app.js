// Điểm khởi động: màn chào, trang chính, bộ sưu tập nhãn dán, nhắc nghỉ
import { register, go, back, h, $, say, repeatSay, updateStars, menuCard, holdToActivate, overlay, currentScreen, sleep } from './ui.js';
import { initSpeech } from './speech.js';
import { unlockAudio, setSoundEnabled, sfx } from './sound.js';
import { store, STICKERS, STARS_PER_STICKER, unlockedCount, routineDone } from './store.js';
import { numWord } from './vi.js';
import './selfcare.js';
import './writing.js';
import './counting.js';
import './parents.js';

initSpeech({ rate: store.data.rate, voiceURI: store.data.voiceURI });
setSoundEnabled(store.data.sound);

/* ---------------- Màn chào ---------------- */
register('splash', {
  render(root) {
    root.append(h('div', { class: 'splash' },
      h('div', { class: 'logo', text: '🦉' }),
      h('h1', { text: 'Bé Vui Học' }),
      h('p', { text: 'Tự lập • Tập viết • Học đếm' }),
      h('button', {
        class: 'btn big orange pulse',
        onClick: () => { unlockAudio(); go('home', { first: true }); },
      }, '▶️ Bắt đầu'),
      h('p', { class: 'hint', text: 'Nhớ bật âm lượng và tắt chế độ im lặng trên iPad để nghe Cú Mèo hướng dẫn nhé!' })));
  },
});

/* ---------------- Trang chính ---------------- */
function greeting() {
  const hr = new Date().getHours();
  return hr < 11 ? 'Chào buổi sáng' : hr < 14 ? 'Chào buổi trưa' : hr < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
}

register('home', {
  title: 'Bé Vui Học',
  render(root, { first } = {}) {
    const name = (store.data.name || '').trim();
    const hr = new Date().getHours();
    const kind = hr < 12 ? 'morning' : 'evening';
    const done = routineDone(kind).length;
    const total = kind === 'morning' ? 7 : 6;

    const parentsBtn = h('button', { class: 'card white hold-ring' },
      h('span', { class: 'emo', text: '👨‍👩‍👧' }),
      h('span', null, h('span', { class: 'lbl', text: 'Góc bố mẹ' }), h('br'), h('span', { class: 'sub', text: 'Giữ 2 giây để vào' })));
    holdToActivate(parentsBtn, 2000, () => { sfx.ding(); go('parents'); },
      () => say('Đây là góc của bố mẹ. Bố mẹ giữ nút này hai giây để vào nhé.'));

    root.append(h('div', { class: 'menu' },
      h('div', { class: 'home-hello' },
        h('span', { class: 'wave', text: '👋' }),
        h('div', null,
          h('h2', { text: `${greeting()}${name ? ', ' + name : ''}!` }),
          h('p', { text: `Hôm nay: ${kind === 'morning' ? '☀️ việc buổi sáng' : '🌙 việc buổi tối'} ${done}/${total}` }))),
      h('div', { class: 'cards three' },
        menuCard({ emoji: '🧒', label: 'Bé Tự Lập', sub: 'Tự làm việc của mình', color: 'green', cls: 'tall', onClick: () => go('selfcare') }),
        menuCard({ emoji: '✏️', label: 'Tập Viết', sub: 'Tô chữ cái và chữ số', color: 'orange', cls: 'tall', onClick: () => go('writing') }),
        menuCard({ emoji: '🔢', label: 'Học Đếm', sub: 'Đếm, so sánh, cộng trừ', color: 'blue', cls: 'tall', onClick: () => go('counting') })),
      h('div', { class: 'home-row' },
        menuCard({ emoji: '🎁', label: 'Nhãn dán của con', sub: `${unlockedCount()}/${STICKERS.length}`, color: 'yellow', onClick: () => go('stickers') }),
        parentsBtn)));

    if (first) say(`${greeting()}${name ? ' ' + name : ''}! Cô là Cú Mèo. Hôm nay con muốn học gì nào? Tự lập, tập viết, hay học đếm?`);
    else say('Con muốn chơi gì nào?');
  },
});

/* ---------------- Bộ sưu tập nhãn dán ---------------- */
register('stickers', {
  title: 'Nhãn dán', parent: 'home', theme: 'var(--yellow)',
  render(root) {
    const have = unlockedCount();
    const need = have >= STICKERS.length ? 0 : STARS_PER_STICKER - (store.data.stars % STARS_PER_STICKER);
    const bar = h('i');
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: '🎁 Nhãn dán của con' }),
          h('p', { text: need ? `Còn ${need} ⭐ nữa để mở nhãn dán mới` : 'Con đã sưu tập đủ tất cả nhãn dán!' }),
          h('div', { class: 'progress-bar', style: { marginTop: '10px' } }, bar))),
      h('div', { class: 'sticker-grid' }, STICKERS.map(([e, n], i) => i < have
        ? h('button', { class: 'sticker', text: e, onClick: (ev) => { sfx.pop(); ev.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(10deg)' }, { transform: 'scale(1)' }], 500); say(n); } })
        : h('button', { class: 'sticker locked', text: '❓', onClick: () => say('Con hãy học thêm để mở nhãn dán này nhé!') })))));
    requestAnimationFrame(() => { bar.style.width = need ? `${100 * (STARS_PER_STICKER - need) / STARS_PER_STICKER}%` : '100%'; });
    say(have ? `Con đã có ${numWord(have)} nhãn dán. Cứ ${numWord(STARS_PER_STICKER)} ngôi sao con sẽ được thêm một nhãn dán mới!`
      : `Con hãy học để nhận sao nhé. Cứ ${numWord(STARS_PER_STICKER)} ngôi sao con sẽ được một nhãn dán!`);
  },
});

/* ---------------- Thanh trên cùng ---------------- */
$('homeBtn').addEventListener('click', () => { sfx.tap(); go('home'); });
$('backBtn').addEventListener('click', () => { sfx.tap(); back(); });
$('bubble').addEventListener('click', () => repeatSay());
$('stars').addEventListener('click', () => say(`Con có ${numWord(store.data.stars)} ngôi sao.`));

/* ---------------- Nhắc nghỉ ngơi ---------------- */
let activeSecs = 0;
let resting = false;
setInterval(() => {
  if (document.hidden || resting || currentScreen() === 'splash' || currentScreen() === 'parents') return;
  const limit = (store.data.restMinutes || 0) * 60;
  if (!limit) return;
  activeSecs++;
  if (activeSecs >= limit) restBreak();
}, 1000);

async function restBreak() {
  resting = true;
  const mins = store.data.restMinutes;
  let left = 60;
  const num = h('h2', { text: `${left}` });
  const btn = h('button', { class: 'btn big green', disabled: true }, 'Chơi tiếp ▶️');
  await overlay((close) => {
    btn.addEventListener('click', () => close());
    return [
      h('div', { class: 'emo', text: '👀' }),
      h('h2', { text: 'Nghỉ mắt một chút nhé!' }),
      h('p', { text: 'Con nhìn ra cửa sổ thật xa, chớp mắt, vươn vai và uống một ngụm nước.' }),
      num,
      h('div', { class: 'row' }, btn),
    ];
  }, async () => {
    say(`Con đã học ${numWord(mins)} phút rồi. Mình nghỉ một chút nhé. Con nhìn ra xa cho mắt nghỉ, vươn vai và uống nước nào!`);
    while (left > 0) {
      await sleep(1000);
      left--;
      num.textContent = left > 0 ? `${left}` : '✅';
    }
    btn.disabled = false;
    btn.classList.add('pulse');
    say('Giỏi lắm! Con có thể chơi tiếp rồi.');
  });
  activeSecs = 0;
  resting = false;
}

/* ---------------- Chặn thu phóng bằng hai ngón trên iPad ---------------- */
['gesturestart', 'gesturechange'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault()));

/* ---------------- Chạy ngoại tuyến (Service Worker) ---------------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

updateStars();
go('splash');
