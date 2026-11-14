// Điểm khởi động: màn chào (chọn ngôn ngữ), trang chính, bộ sưu tập nhãn dán, nhắc nghỉ
import { register, go, back, h, $, say, repeatSay, updateStars, menuCard, holdToActivate, overlay, currentScreen, sleep, refresh } from './ui.js';
import { initSpeech, voiceAdvice, onVoicesChanged } from './speech.js';
import { unlockAudio, setSoundEnabled, sfx } from './sound.js';
import { store, STICKERS, STARS_PER_STICKER, unlockedCount, isSchoolDay } from './store.js';
import { L, lang } from './i18n.js';
import { numWord } from './vi.js';
import { ROUTINES, routineCount, mealTimerRunning, tickStatus, taskStars, todaysChores, timeLabel, toMinutes } from './selfcare.js';
import './writing.js';
import './counting.js';
import './math.js';
import './explore.js';
import './rewards.js';
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

/* ---------------- Trang chính: hôm nay thứ mấy, nền trời theo buổi, việc cần làm và mốc giờ ---------------- */
function greeting() {
  const hr = new Date().getHours();
  return hr < 11 ? L('Chào buổi sáng', 'Good morning') : hr < 14 ? L('Chào buổi trưa', 'Hello') : hr < 18 ? L('Chào buổi chiều', 'Good afternoon') : L('Chào buổi tối', 'Good evening');
}
const WEEKDAYS = () => L(['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'], ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** Buổi trong ngày theo giờ hiện tại: quyết định màu nền trời của trang chính. */
function skyNow() {
  const hr = new Date().getHours();
  if (hr >= 5 && hr < 11) return { id: 'morning', orb: '🌞', label: L('Buổi sáng', 'Morning') };
  if (hr >= 11 && hr < 14) return { id: 'noon', orb: '☀️', label: L('Buổi trưa', 'Noon') };
  if (hr >= 14 && hr < 18) return { id: 'afternoon', orb: '🌤️', label: L('Buổi chiều', 'Afternoon') };
  return { id: 'night', orb: '🌙', label: hr >= 18 && hr < 22 ? L('Buổi tối', 'Evening') : L('Ban đêm', 'Night') };
}
const clockText = () => { const d = new Date(); return timeLabel(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`); };

register('home', {
  title: () => APP_NAME(),
  render(root, { first } = {}) {
    const name = (store.data.name || '').trim();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const sky = skyNow();
    const school = isSchoolDay();
    const weekday = WEEKDAYS()[now.getDay()];
    const dateText = L(`Ngày ${now.getDate()} tháng ${now.getMonth() + 1}`, `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`);

    // Việc hôm nay, xếp theo buổi và theo giờ. Việc đầu tiên chưa tích là việc "bây giờ / tiếp theo".
    const sessions = Object.entries(ROUTINES());
    const flat = sessions.flatMap(([kind, R]) => R.tasks.map((t) => ({ kind, t, st: tickStatus(kind, t.id) })));
    // Việc "bây giờ / tiếp theo": việc chưa tích đầu tiên tính từ buổi hiện tại trở đi
    // (buổi sáng đã qua mà còn sót việc thì không kéo bé quay lại, trừ khi phía sau không còn việc nào).
    const open = (x) => x.st === '' || x.st === 'no';
    const passed = flat.filter((x) => x.t.at && toMinutes(x.t.at) <= nowMin);
    const curKind = passed.length ? passed[passed.length - 1].kind : (flat[0] || {}).kind;
    const from = Math.max(0, flat.findIndex((x) => x.kind === curKind));
    const next = flat.slice(from).find(open) || flat.find(open);
    const STATUS = { ok: '✅', pending: '⏳', no: '↩️', '': '⬜' };

    const row = (kind, t, st, stars) => {
      const isNext = next && next.kind === kind && next.t.id === t.id;
      const due = isNext && t.at && toMinutes(t.at) <= nowMin;
      return h('button', {
        class: 'tl-row' + (st ? ` ${st}` : '') + (isNext ? ' next' : ''),
        onClick: () => { sfx.tap(); if (t.guide && kind !== 'chore') go('guide', { id: t.guide, kind, task: t.id }); else go('task', { kind, id: t.id }); },
      },
      h('span', { class: 'tl-time', text: t.at ? timeLabel(t.at) : '•' }),
      h('span', { class: 'tl-emo', text: t.e }),
      h('span', { class: 'tl-title' },
        t.at ? h('em', { class: 'tl-time2', text: timeLabel(t.at) }) : null,
        t.short || t.t, isNext ? h('small', { text: due ? L('Bây giờ', 'Now') : L('Tiếp theo', 'Next') }) : null),
      stars > 1 ? h('span', { class: 'tl-stars', text: `+${stars}⭐` }) : null,
      h('span', { class: 'tl-st', text: STATUS[st] || '⬜' }));
    };

    const cols = sessions.map(([kind, R]) => {
      const ok = routineCount(kind);
      const done = ok === R.tasks.length;
      return h('section', { class: 'tl-col' + (done ? ' done' : '') },
        h('h3', null, `${R.emoji} ${R.title}`, h('span', { text: done ? L('✅ xong', '✅ done') : `${ok}/${R.tasks.length}` })),
        R.tasks.map((t) => row(kind, t, tickStatus(kind, t.id), taskStars(t))));
    });
    const chores = todaysChores();
    let extra = null;
    if (chores.length) {
      extra = h('section', { class: 'tl-col wide' },
        h('h3', null, L('📋 Ba mẹ nhờ hôm nay', '📋 From Mom and Dad today')),
        h('div', { class: 'tl-wide' }, chores.map((c) => row('chore', c, tickStatus('chore', c.id), c.stars))));
    }

    // Ba nút nhỏ cuối màn hình: chơi (bị khoá), đổi quà, góc ba mẹ
    const stars = store.data.stars;
    const gifts = store.data.rewards.filter((r) => r.cost > 0).sort((a, b) => a.cost - b.cost);
    const goal = gifts.find((r) => stars < r.cost) || gifts[gifts.length - 1];
    const playState = isPlaying() ? '▶️' : readyTickets() ? '🎟️' : '🔒';
    const parentsBtn = h('button', { class: 'dock-btn hold-ring' }, h('span', { text: '👨‍👩‍👧' }), h('b', { text: L('Ba mẹ', 'Parents') }));
    holdToActivate(parentsBtn, 2000, () => { sfx.ding(); go('parents'); },
      () => say(L('Đây là góc của ba mẹ. Ba mẹ giữ nút này hai giây để vào nhé.', 'This part is for Mom and Dad. Hold this button for two seconds to open it.')));
    const clock = h('div', { class: 'home-clock', text: clockText() });

    root.append(h('div', { class: `home sky-${sky.id}` },
      h('div', { class: 'home-top' },
        h('div', { class: 'home-orb', text: sky.orb }),
        h('div', { class: 'home-day' },
          h('h1', { text: weekday }),
          h('p', { text: `${dateText} · ${sky.label} · ${school ? L('🏫 Ngày đi học', '🏫 School day') : L('🎈 Ngày nghỉ', '🎈 Day off')}` })),
        clock),
      h('div', { class: 'timeline' + (cols.length >= 3 ? ' compact' : ''), style: { '--cols': cols.length } }, cols, extra),
      h('div', { class: 'dock' },
        h('button', { class: 'dock-btn', onClick: () => { sfx.tap(); go('games'); } }, h('span', { text: '🎮' }), h('b', { text: L('Chơi', 'Play') }), h('i', { text: playState })),
        h('button', { class: 'dock-btn', onClick: () => { sfx.tap(); go('rewards'); } }, h('span', { text: goal ? goal.emoji : '🎁' }), h('b', { text: L('Đổi quà', 'Rewards') }),
          goal && stars < goal.cost ? h('i', { text: L(`còn ${goal.cost - stars}⭐`, `${goal.cost - stars}⭐ to go`) }) : goal ? h('i', { text: '🎉' }) : null),
        parentsBtn)));

    // Đồng hồ chạy; sang buổi khác thì vẽ lại để đổi nền trời
    const timer = setInterval(() => {
      clock.textContent = clockText();
      if (skyNow().id !== sky.id) refresh(['home']);
    }, 20000);
    requestAnimationFrame(() => { const el = root.querySelector('.tl-row.next'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); });

    const nextText = !next ? L('Con đã tích hết việc hôm nay rồi. Giỏi quá!', 'You ticked every job for today. Great job!')
      : L(`Việc tiếp theo của con${next.t.at ? ` lúc ${timeLabel(next.t.at)}` : ''}: ${next.t.t}.`, `Your next job${next.t.at ? ` at ${timeLabel(next.t.at)}` : ''}: ${next.t.t}.`);
    if (first) say(L(`${greeting()}${name ? ' ' + name : ''}! Hôm nay là ${weekday}. ${nextText}`, `${greeting()}${name ? ', ' + name : ''}! Today is ${weekday}. ${nextText}`));
    else say(nextText);
    return () => clearInterval(timer);
  },
});

/* ---------------- Khu trò chơi (bị khoá, chỉ mở trong giờ chơi) ---------------- */
register('games', {
  title: () => L('Giờ chơi', 'Play time'), parent: 'home', theme: 'var(--pink)',
  render(root) {
    const hw = homeworkProgress();
    const hwSub = !hw.total ? L('Hôm nay không có bài', 'None today') : hw.done >= hw.total ? L('Xong hết rồi ✅', 'All done ✅') : L(`Làm bài để được sao (${hw.done}/${hw.total})`, `Earn a star (${hw.done}/${hw.total})`);
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' }, h('div', null,
        h('h2', { text: L('🎮 Giờ chơi', '🎮 Play time') }),
        h('p', { text: L('Con chọn một trò chơi, hoặc làm bài tập để được thêm sao.', 'Pick a game, or do an exercise to earn a star.') }))),
      h('div', { class: 'cards home-cards' },
        menuCard({ emoji: '📝', label: L('Bài tập hôm nay', "Today's exercises"), sub: hwSub, color: 'red', onClick: () => go('homework') }),
        menuCard({ emoji: '✏️', label: L('Tập Viết', 'Writing'), sub: L('Tô chữ cái và chữ số', 'Trace letters and numbers'), color: 'purple', onClick: () => go('writing') }),
        menuCard({ emoji: '🔢', label: L('Học Đếm', 'Counting'), sub: L('Đếm, so sánh, tìm số', 'Count, compare, find'), color: 'blue', onClick: () => go('counting') }),
        menuCard({ emoji: '🧮', label: L('Học Toán', 'Math'), sub: L('Cộng, trừ, nhân, chia', 'Add, subtract, multiply, divide'), color: 'orange', onClick: () => go('math') }),
        menuCard({ emoji: '🌈', label: L('Khám Phá', 'Explore'), sub: L('Ngày tháng, ngày đêm, trái phải', 'Dates, day and night, left and right'), color: 'green', onClick: () => go('explore') }),
        menuCard({ emoji: '🧼', label: L('Tập kỹ năng', 'Practice skills'), sub: L('Rửa tay, mặc đồ, dọn đồ…', 'Wash hands, get dressed, tidy up…'), color: 'pink', onClick: () => go('selfcare') }))));
    say(L('Giờ chơi! Con muốn chơi gì nào?', 'Play time! What do you want to play?'));
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
