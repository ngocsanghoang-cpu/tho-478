// Điểm khởi động: màn chào (chọn ngôn ngữ), trang chính, bộ sưu tập nhãn dán, nhắc nghỉ
import { register, go, back, h, $, say, repeatSay, updateStars, menuCard, holdToActivate, overlay, currentScreen, sleep } from './ui.js';
import { initSpeech, voiceAdvice, onVoicesChanged } from './speech.js';
import { unlockAudio, setSoundEnabled, sfx } from './sound.js';
import { store, STICKERS, STARS_PER_STICKER, unlockedCount, isSchoolDay } from './store.js';
import { L, lang } from './i18n.js';
import { numWord } from './vi.js';
import { ROUTINES, routineCount, currentRoutine, mealTimerRunning } from './selfcare.js';
import './writing.js';
import './counting.js';
import './math.js';
import './explore.js';
import { rewardName } from './rewards.js';
import { homeworkProgress } from './homework.js';
import './parents.js';
import { isPlaying, readyTickets } from './playtime.js';
import './sync.js';

document.documentElement.lang = lang();
initSpeech({ lang: lang(), rate: store.data.rate, voiceURI: store.data.voices[lang()] || '' });
setSoundEnabled(store.data.sound);

const APP_NAME = () => L('Bé Vui Học', 'Happy Learning');

/* ---------------- Màn chào ---------------- */
// Màn hình đầu tiên. Lần bấm Start cũng là thao tác cho phép iPad phát tiếng.
// Ứng dụng dùng tiếng Anh; ba mẹ có thể đổi ngôn ngữ trong Góc ba mẹ.
register('splash', {
  render(root) {
    const notice = h('div', { class: 'warn voice-note' });
    const showNotice = () => {
      const adv = voiceAdvice();
      notice.hidden = !adv;
      notice.innerHTML = '';
      if (adv) notice.append(h('b', { text: '🔇 ' + adv.problem }), h('span', { text: ' ' + adv.fix }));
    };
    showNotice();
    const off = onVoicesChanged(showNotice);
    const t = setTimeout(showNotice, 1500);

    root.append(h('div', { class: 'splash' },
      h('div', { class: 'logo', text: '🐰' }),
      h('h1', { text: APP_NAME() }),
      h('p', { text: L('Tự lập • Bài tập • Tập viết • Học đếm • Học toán • Khám phá', 'I can do it • Exercises • Writing • Counting • Math • Explore') }),
      h('button', {
        class: 'btn big pink pulse',
        onClick: () => { unlockAudio(); go('home', { first: true }); },
      }, L('▶️ Bắt đầu', '▶️ Start')),
      notice,
      h('p', { class: 'hint', text: L('Nhớ bật âm lượng và tắt chế độ im lặng để nghe bạn Thỏ nhé!', 'Turn the volume up and silent mode off to hear Bunny!') })));
    return () => { off(); clearTimeout(t); };
  },
});

/* ---------------- Trang chính ---------------- */
function greeting() {
  const hr = new Date().getHours();
  return hr < 11 ? L('Chào buổi sáng', 'Good morning') : hr < 14 ? L('Chào buổi trưa', 'Hello') : hr < 18 ? L('Chào buổi chiều', 'Good afternoon') : L('Chào buổi tối', 'Good evening');
}

register('home', {
  title: () => APP_NAME(),
  render(root, { first } = {}) {
    const name = (store.data.name || '').trim();
    const kind = currentRoutine();
    const R = ROUTINES()[kind];
    const done = routineCount(kind);
    const total = R.tasks.length;

    // Món quà gần nhất bé đang gom sao để đổi
    const stars = store.data.stars;
    const gifts = store.data.rewards.filter((r) => r.cost > 0).sort((a, b) => a.cost - b.cost);
    const goal = gifts.find((r) => stars < r.cost) || gifts[gifts.length - 1];
    const goalText = !goal ? L('Gom sao để đổi quà', 'Save stars for rewards')
      : stars >= goal.cost ? L('Đủ sao rồi! Vào đổi quà nhé', 'You have enough stars!')
        : L(`Còn ${goal.cost - stars} ⭐ nữa: ${rewardName(goal)}`, `${goal.cost - stars} ⭐ to go: ${rewardName(goal)}`);

    const hw = homeworkProgress();
    const hwSub = !hw.total ? L('Hôm nay không có bài', 'None today') : hw.done >= hw.total ? L('Xong hết rồi ✅', 'All done ✅') : L(`Đã làm ${hw.done}/${hw.total} bài`, `${hw.done} of ${hw.total} done`);

    // Trò chơi và bài tập bị khoá cho tới khi ba mẹ xác nhận bé làm xong một buổi
    const lock = isPlaying() ? null : readyTickets() ? '▶️' : '🔒';

    const parentsBtn = h('button', { class: 'card white hold-ring' },
      h('span', { class: 'emo', text: '👨‍👩‍👧' }),
      h('span', null, h('span', { class: 'lbl', text: L('Góc ba mẹ', 'For parents') }), h('br'), h('span', { class: 'sub', text: L('Giữ 2 giây để vào', 'Hold for 2 seconds') })));
    holdToActivate(parentsBtn, 2000, () => { sfx.ding(); go('parents'); },
      () => say(L('Đây là góc của ba mẹ. Ba mẹ giữ nút này hai giây để vào nhé.', 'This part is for Mom and Dad. Hold this button for two seconds to open it.')));

    root.append(h('div', { class: 'menu' },
      h('div', { class: 'home-hello' },
        h('span', { class: 'wave', text: '👋' }),
        h('div', null,
          h('h2', { text: `${greeting()}${name ? ', ' + name : ''}!` }),
          h('p', { text: (isSchoolDay() ? L('🏫 Ngày đi học', '🏫 School day') : L('🎈 Ngày nghỉ', '🎈 Day off'))
            + L(` · ${R.emoji} việc ${R.title.toLowerCase()} ${done}/${total}`, ` · ${R.emoji} ${R.title.toLowerCase()} jobs ${done}/${total}`) }))),
      h('div', { class: 'cards home-cards' },
        menuCard({ emoji: '👧', label: L('Bé Tự Lập', 'I Can Do It'), sub: L('Tự làm việc của mình', 'Doing things by myself'), color: 'pink', onClick: () => go('selfcare') }),
        menuCard({ emoji: '📝', label: L('Bài tập hôm nay', "Today's exercises"), sub: hwSub, color: 'red', badge: lock, onClick: () => go('homework') }),
        menuCard({ emoji: '✏️', label: L('Tập Viết', 'Writing'), sub: L('Tô chữ cái và chữ số', 'Trace letters and numbers'), color: 'purple', badge: lock, onClick: () => go('writing') }),
        menuCard({ emoji: '🔢', label: L('Học Đếm', 'Counting'), sub: L('Đếm, so sánh, tìm số', 'Count, compare, find'), color: 'blue', badge: lock, onClick: () => go('counting') }),
        menuCard({ emoji: '🧮', label: L('Học Toán', 'Math'), sub: L('Cộng, trừ, nhân, chia', 'Add, subtract, multiply, divide'), color: 'orange', badge: lock, onClick: () => go('math') }),
        menuCard({ emoji: '🌈', label: L('Khám Phá', 'Explore'), sub: L('Ngày tháng, ngày đêm, trái phải', 'Dates, day and night, left and right'), color: 'green', badge: lock, onClick: () => go('explore') })),
      h('div', { class: 'home-row' },
        h('button', { class: 'card yellow', onClick: () => { sfx.tap(); go('rewards'); } },
          h('span', { class: 'emo', text: goal ? goal.emoji : '🎡' }),
          h('span', null, h('span', { class: 'lbl', text: L('Đổi quà', 'Rewards') }), h('br'), h('span', { class: 'sub', text: goalText }))),
        parentsBtn)));

    if (first) {
      say(L(`${greeting()}${name ? ' ' + name : ''}! Cô là Thỏ Bông. Hôm nay con muốn học gì nào?`,
        `${greeting()}${name ? ', ' + name : ''}! I am Bunny. What would you like to learn today?`));
    } else say(L('Con muốn chơi gì nào?', 'What do you want to play?'));
  },
});

/* ---------------- Bộ sưu tập nhãn dán ---------------- */
register('stickers', {
  title: () => L('Nhãn dán', 'Stickers'), parent: 'rewards', theme: 'var(--yellow)',
  render(root) {
    const have = unlockedCount();
    const need = have >= STICKERS.length ? 0 : STARS_PER_STICKER - (store.data.earned % STARS_PER_STICKER);
    const bar = h('i');
    const per = numWord(STARS_PER_STICKER);
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: L('🎁 Nhãn dán của con', '🎁 My stickers') }),
          h('p', { text: need ? L(`Nhận thêm ${need} ⭐ nữa để mở nhãn dán mới (nhãn dán là quà tặng thêm, không tốn sao)`, `Earn ${need} more ⭐ to unlock a new sticker (stickers are a free bonus)`) : L('Con đã sưu tập đủ tất cả nhãn dán!', 'You collected every sticker!') }),
          h('div', { class: 'progress-bar', style: { marginTop: '10px' } }, bar))),
      h('div', { class: 'sticker-grid' }, STICKERS.map(([e, vi, en], i) => i < have
        ? h('button', { class: 'sticker', text: e, onClick: (ev) => { sfx.pop(); ev.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(10deg)' }, { transform: 'scale(1)' }], 500); say(L(vi, en)); } })
        : h('button', { class: 'sticker locked', text: '❓', onClick: () => say(L('Con hãy học thêm để mở nhãn dán này nhé!', 'Keep learning to unlock this sticker!')) })))));
    requestAnimationFrame(() => { bar.style.width = need ? `${100 * (STARS_PER_STICKER - need) / STARS_PER_STICKER}%` : '100%'; });
    say(have
      ? L(`Con đã có ${numWord(have)} nhãn dán. Cứ ${per} ngôi sao con sẽ được thêm một nhãn dán mới!`, `You have ${numWord(have)} ${have === 1 ? 'sticker' : 'stickers'}. Every ${per} stars gives you a new sticker!`)
      : L(`Con hãy học để nhận sao nhé. Cứ ${per} ngôi sao con sẽ được một nhãn dán!`, `Learn and play to earn stars. Every ${per} stars gives you a sticker!`));
  },
});

/* ---------------- Thanh trên cùng ---------------- */
$('homeBtn').addEventListener('click', () => { sfx.tap(); go('home'); });
$('backBtn').addEventListener('click', () => { sfx.tap(); back(); });
$('bubble').addEventListener('click', () => repeatSay());
$('stars').addEventListener('click', () => {
  const n = store.data.stars;
  say(L(`Con có ${numWord(n)} ngôi sao.`, `You have ${numWord(n)} ${n === 1 ? 'star' : 'stars'}.`));
});

/* ---------------- Nhắc nghỉ ngơi ---------------- */
let activeSecs = 0;
let resting = false;
setInterval(() => {
  if (document.hidden || resting || currentScreen() === 'splash' || currentScreen() === 'parents' || mealTimerRunning()) return;
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
  const btn = h('button', { class: 'btn big green', disabled: true }, L('Chơi tiếp ▶️', 'Keep playing ▶️'));
  await overlay((close) => {
    btn.addEventListener('click', () => close());
    return [
      h('div', { class: 'emo', text: '👀' }),
      h('h2', { text: L('Nghỉ mắt một chút nhé!', 'Time to rest your eyes!') }),
      h('p', { text: L('Con nhìn ra cửa sổ thật xa, chớp mắt, vươn vai và uống một ngụm nước.', 'Look far out the window, blink, stretch, and take a sip of water.') }),
      num,
      h('div', { class: 'row' }, btn),
    ];
  }, async () => {
    say(L(`Con đã học ${numWord(mins)} phút rồi. Mình nghỉ một chút nhé. Con nhìn ra xa cho mắt nghỉ, vươn vai và uống nước nào!`,
      `You have been learning for ${numWord(mins)} minutes. Let's take a little break. Look far away to rest your eyes, stretch, and drink some water!`));
    while (left > 0) {
      await sleep(1000);
      left--;
      num.textContent = left > 0 ? `${left}` : '✅';
    }
    btn.disabled = false;
    btn.classList.add('pulse');
    say(L('Giỏi lắm! Con có thể chơi tiếp rồi.', 'Good job! You can play again now.'));
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
