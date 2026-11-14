// GIỜ CHƠI – mọi trò chơi và bài tập đều bị khoá. Ba mẹ xác nhận bé làm xong hết việc của một buổi
// thì bé có một vé chơi (mặc định 10 phút). Hết giờ là khoá lại ngay.
import { store, todaysPlay } from './store.js';
import { setGuard, go, h, $, say, overlay, confetti, currentScreen, refresh } from './ui.js';
import { sfx } from './sound.js';
import { L } from './i18n.js';
import { onTicket } from './approve.js';
import { ROUTINES, dk } from './selfcare.js';

// Các màn hình bị khoá (trò chơi + bài tập)
const LOCKED = new Set(['games', 'homework', 'writing', 'trace', 'counting', 'numbers', 'count', 'compare', 'find', 'math', 'op',
  'explore', 'dates', 'datequiz', 'daynight', 'dnquiz', 'leftright', 'lrquiz', 'tidy']);

export const playMinutes = () => Math.max(0.05, +store.data.playMinutes || 10);
/** Số mili giây chơi còn lại (0 nếu đang khoá). */
export const playLeft = () => Math.max(0, (todaysPlay().until || 0) - Date.now());
export const isPlaying = () => playLeft() > 0;
/** Số vé chơi bé đang có mà chưa dùng. */
export const readyTickets = () => Object.values(todaysPlay().tickets).filter((v) => v === 'ready').length;

const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const minsText = () => { const m = playMinutes(); return m >= 1 ? Math.round(m) : m; };

let wasPlaying = false;
let warned = false;

/** Dùng một vé: mở khoá trong số phút quy định. */
export function startPlay() {
  const play = todaysPlay();
  const id = Object.keys(play.tickets).find((k) => play.tickets[k] === 'ready');
  if (!id) return false;
  play.tickets[id] = 'used';
  play.until = Date.now() + playMinutes() * 60000;
  store.save();
  wasPlaying = true;
  warned = false;
  drawPill();
  return true;
}

function drawPill() {
  const pill = $('playPill');
  if (!pill) return;
  const left = playLeft();
  pill.hidden = left <= 0;
  if (left > 0) pill.textContent = `🎮 ${mmss(left)}`;
}

function lockNow() {
  wasPlaying = false;
  drawPill();
  sfx.oops();
  const onLocked = LOCKED.has(currentScreen());
  if (onLocked) go('home'); else refresh(['home']);
  overlay((close) => [
    h('div', { class: 'emo', text: '⏰' }),
    h('h2', { text: L('Hết giờ chơi rồi!', 'Play time is over!') }),
    h('p', { text: L('Con làm việc của buổi tiếp theo để được chơi tiếp nhé.', 'Do your next jobs to earn more play time.') }),
    h('div', { class: 'row' }, h('button', { class: 'btn big green', onClick: () => close() }, L('Dạ! 👍', 'OK! 👍'))),
  ], () => say(L('Hết giờ chơi rồi. Con làm việc của buổi tiếp theo để được chơi tiếp nhé!', 'Play time is over. Do your next jobs to earn more play time!')));
}

setInterval(() => {
  const left = playLeft();
  if (left > 0) {
    wasPlaying = true;
    drawPill();
    if (left <= 60000 && !warned && playMinutes() > 2) { warned = true; say(L('Còn một phút chơi nữa thôi nhé!', 'One more minute of play time!')); }
  } else if (wasPlaying) lockNow();
}, 1000);

/** Hộp thoại khi bé có vé chơi: bắt đầu chơi ngay hoặc để sau. then(name, params) sau khi bắt đầu. */
function offerPlay(intro, name, params) {
  const mins = minsText();
  overlay((close) => [
    h('div', { class: 'emo', text: '🎮' }),
    h('h2', { text: L(`Con được chơi ${mins} phút!`, `You earned ${mins} minutes of play!`) }),
    h('p', { text: L('Đồng hồ chạy ngay khi con bấm bắt đầu. Hết giờ trò chơi sẽ khoá lại.', 'The clock starts when you tap start. When time is up, the games lock again.') }),
    h('div', { class: 'row' },
      h('button', { class: 'btn big pink pulse', onClick: () => close(true) }, L('▶️ Chơi ngay', '▶️ Play now')),
      h('button', { class: 'btn ghost', onClick: () => close(false) }, L('Để sau', 'Later'))),
  ], () => { confetti(30); sfx.fanfare(); say((intro || '') + L(`Con được chơi ${mins} phút! Con bấm Chơi ngay để bắt đầu nhé.`, `You earned ${mins} minutes of play! Tap Play now to begin.`)); })
    .then((yes) => {
      if (!yes || !startPlay()) { refresh(['home']); return; }
      if (name) go(name, params); else refresh(['home']);
      say(L(`Bắt đầu ${mins} phút chơi. Con chọn trò chơi hoặc làm bài tập nhé!`, `Your ${mins} minutes start now. Pick a game or do your exercise!`));
    });
}

/** Chặn vào màn hình bị khoá. Trả về true nếu được vào. */
function guard(name, params) {
  if (!LOCKED.has(name) || isPlaying()) return true;
  if (readyTickets() > 0) { offerPlay('', name, params); return false; }
  sfx.oops();
  const kinds = Object.entries(ROUTINES());
  const play = todaysPlay();
  const next = kinds.find(([k]) => !play.bonus[dk(k)]); // buổi đầu tiên chưa được xác nhận xong
  const which = next ? next[1].title.toLowerCase() : '';
  overlay((close) => [
    h('div', { class: 'emo', text: '🔒' }),
    h('h2', { text: L('Trò chơi đang khoá', 'The games are locked') }),
    h('p', { text: which
      ? L(`Con làm hết việc ${which}, rồi nhờ ba mẹ kiểm tra. Sau đó con được chơi ${minsText()} phút!`, `Finish your ${which} jobs and ask Mom or Dad to check them. Then you can play for ${minsText()} minutes!`)
      : L('Hôm nay con đã dùng hết giờ chơi rồi. Mai mình chơi tiếp nhé!', 'You used all your play time for today. See you tomorrow!') }),
    h('div', { class: 'row' },
      h('button', { class: 'btn big pink', onClick: () => close() }, L('Dạ! 👍', 'OK! 👍'))),
  ], () => say(which
    ? L(`Trò chơi đang khoá. Con làm hết việc ${which}, rồi nhờ ba mẹ kiểm tra. Sau đó con được chơi ${minsText()} phút!`, `The games are locked. Finish your ${which} jobs and ask Mom or Dad to check them. Then you can play for ${minsText()} minutes!`)
    : L('Hôm nay con đã dùng hết giờ chơi rồi. Mai mình chơi tiếp nhé!', 'You used all your play time for today. See you tomorrow!')))
  return false;
}
setGuard(guard);

// Bé vừa nhận vé chơi (ba mẹ xác nhận xong một buổi)
onTicket((kinds, intro) => offerPlay(intro));

drawPill();
