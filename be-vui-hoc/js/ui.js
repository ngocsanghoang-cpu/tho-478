// Tiện ích giao diện: tạo phần tử, điều hướng, lời thoại, phần thưởng
import { speak, stopSpeech } from './speech.js';
import { sfx } from './sound.js';
import { store, addStars, STICKERS, starsFor, noteLearn, LEARN_KINDS } from './store.js';
import { L } from './i18n.js';

/* ---------------- Tạo phần tử ---------------- */
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv;
      }
    } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const $ = (id) => document.getElementById(id);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- Điều hướng ---------------- */
const screens = {};
let cur = null;
let life = { alive: true };

export function register(name, def) { screens[name] = def; }

/** Đối tượng "còn sống" của màn hình hiện tại – dùng để huỷ các tác vụ bất đồng bộ khi rời màn hình. */
export const live = () => life;
export const currentScreen = () => cur && cur.name;

export function go(name, params = {}) {
  const def = screens[name];
  if (!def) { console.warn('Không có màn hình', name); return; }
  life.alive = false;
  life = { alive: true };
  stopSpeech();
  hideBubble();
  if (cur && cur.cleanup) { try { cur.cleanup(); } catch (e) { console.error(e); } }

  const root = $('app');
  root.innerHTML = '';
  root.className = def.fixed ? 'fixed' : '';
  root.scrollTop = 0;
  document.body.dataset.screen = name;
  document.body.style.setProperty('--theme', def.theme || 'var(--orange)');

  const parent = typeof def.parent === 'function' ? def.parent(params) : def.parent;
  cur = { name, params, def, parent, cleanup: null };
  setTitle(typeof def.title === 'function' ? def.title(params) : def.title || '');
  $('backBtn').hidden = !parent || parent === 'home';
  $('homeBtn').hidden = name === 'home';

  const cleanup = def.render(root, params);
  cur.cleanup = typeof cleanup === 'function' ? cleanup : null;
}

export function back() {
  if (!cur || !cur.parent) { go('home'); return; }
  const [n, p] = Array.isArray(cur.parent) ? cur.parent : [cur.parent, {}];
  go(n, p);
}

export function setTitle(t) { $('title').textContent = t; }

/* ---------------- Lời thoại của bạn Thỏ ---------------- */
let lastSaid = '';
let sayToken = 0;

export function say(text, opts) {
  lastSaid = text;
  const my = ++sayToken;
  $('sayText').textContent = text;
  $('bubble').classList.add('speaking');
  return speak(text, opts).then((ok) => {
    if (my === sayToken) hideBubble();
    return ok;
  });
}

export function hideBubble() {
  sayToken++;
  const b = $('bubble');
  if (b) b.classList.remove('speaking');
}

export function repeatSay() { if (lastSaid) say(lastSaid); }

const PRAISE = {
  vi: ['Giỏi quá!', 'Tuyệt vời!', 'Con làm tốt lắm!', 'Hoan hô!', 'Xuất sắc!', 'Con giỏi lắm!', 'Siêu quá!', 'Đúng rồi, giỏi quá!'],
  en: ['Great job!', 'Wonderful!', 'Well done!', 'Hooray!', 'Excellent!', 'You did it!', 'Super!', 'Yes, that is right!'],
};
const TRY = {
  vi: ['Chưa đúng rồi, con thử lại nhé!', 'Gần đúng rồi, cố lên nào!', 'Không sao đâu, mình thử lại nhé!'],
  en: ['Not quite. Try again!', 'Almost! You can do it!', "That's okay. Let's try again!"],
};

export function praise() {
  const p = pick(L(PRAISE.vi, PRAISE.en));
  const n = (store.data.name || '').trim();
  if (!n || Math.random() >= 0.5) return p;
  return L(`${p.replace(/!$/, '')}, ${n} ơi!`, `${p.replace(/!$/, '')}, ${n}!`);
}
export const encourage = () => pick(L(TRY.vi, TRY.en));

/* ---------------- Hiệu ứng ---------------- */
export function toast(text) {
  const t = h('div', { class: 'toast', text });
  document.body.append(t);
  setTimeout(() => t.remove(), 1500);
}

export function confetti(count = 46) {
  const items = ['⭐', '🌟', '🎉', '🎈', '💖', '✨', '🌈', '🌸', '🦋'];
  const W = window.innerWidth, H = window.innerHeight;
  for (let i = 0; i < count; i++) {
    const s = h('div', { class: 'fx', text: pick(items) });
    const size = rand(26, 54);
    s.style.fontSize = size + 'px';
    s.style.left = rand(0, W) + 'px';
    s.style.top = '-60px';
    document.body.append(s);
    const dx = rand(-120, 120);
    const anim = s.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx}px, ${H + 120}px) rotate(${rand(-360, 360)}deg)`, opacity: 0.9 },
    ], { duration: rand(1600, 2800), delay: rand(0, 500), easing: 'cubic-bezier(.3,.6,.6,1)' });
    anim.onfinish = () => s.remove();
  }
}

function starFly(n, fromEl) {
  const target = $('stars').getBoundingClientRect();
  const r = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
  const x1 = target.left + 24, y1 = target.top + target.height / 2;
  for (let i = 0; i < Math.min(n, 6); i++) {
    const s = h('div', { class: 'fx', text: '⭐' });
    s.style.fontSize = '54px';
    s.style.left = (x0 - 27) + 'px';
    s.style.top = (y0 - 27) + 'px';
    document.body.append(s);
    const a = s.animate([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${rand(-60, 60)}px, ${rand(-90, -40)}px) scale(1.3)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(.6)`, opacity: 1 },
    ], { duration: 900, delay: i * 120, easing: 'ease-in-out' });
    a.onfinish = () => s.remove();
  }
}

export function updateStars(animate) {
  $('starCount').textContent = store.data.stars;
  if (animate) {
    const s = $('stars');
    s.classList.remove('bump');
    void s.offsetWidth;
    s.classList.add('bump');
  }
}

/** Thưởng sao. Nếu mở được nhãn dán mới thì hiện thông báo. */
export function giveStars(n, fromEl) {
  if (n <= 0) return;
  const unlocked = addStars(n);
  sfx.star();
  starFly(n, fromEl);
  setTimeout(() => updateStars(true), 950);
  unlocked.forEach((idx) => {
    const [emo, vi, en] = STICKERS[idx];
    const name = L(vi, en);
    overlay((close) => [
      h('div', { class: 'emo', text: emo }),
      h('h2', { text: L('Nhãn dán mới!', 'New sticker!') }),
      h('p', { text: L(`Con đã mở khoá: ${name}`, `You unlocked: the ${name}`) }),
      h('div', { class: 'row' }, h('button', { class: 'btn big yellow', onClick: () => close() }, L('Tuyệt quá! 🎉', 'Yay! 🎉'))),
    ], () => { confetti(); sfx.fanfare(); say(L(`Hoan hô! Con nhận được nhãn dán ${name}!`, `Hooray! You got a new sticker: the ${name}!`)); });
  });
}

/** true nếu loại việc này có sao nhưng hôm nay bé đã nhận đủ sao học. */
export function isCapped(kind) {
  return LEARN_KINDS.includes(kind) && (+store.data.rules[kind] || 0) > 0 && starsFor(kind) === 0;
}
export const capNote = () => L('Hôm nay con đã nhận đủ sao học rồi. Muốn thêm sao, con hãy tự làm các việc của mình nhé!',
  'You have earned all your learning stars for today. For more stars, do your own jobs by yourself!');

/**
 * Thưởng sao theo luật ba mẹ đặt. kind: 'task' | 'routine' | 'lesson' | 'trace'.
 * Sao học bị giới hạn mỗi ngày. Trả về số sao đã thưởng.
 */
export function award(kind, fromEl) {
  const n = starsFor(kind);
  if (n > 0) {
    if (LEARN_KINDS.includes(kind)) noteLearn(n);
    giveStars(n, fromEl);
  }
  return n;
}

/* ---------------- Lớp phủ (hộp thoại) ---------------- */
const queue = [];
let openJob = null;

/** build(close) trả về các phần tử nội dung. onOpen chạy khi hộp thoại hiện ra. */
export function overlay(build, onOpen) {
  return new Promise((resolve) => {
    queue.push({ build, onOpen, resolve });
    pump();
  });
}

function pump() {
  if (openJob || !queue.length) return;
  const job = queue.shift();
  openJob = job;
  const ov = $('overlay');
  const close = (v) => {
    if (openJob !== job) return;
    openJob = null;
    ov.classList.remove('show');
    ov.innerHTML = '';
    job.resolve(v);
    setTimeout(pump, 120);
  };
  ov.innerHTML = '';
  ov.append(h('div', { class: 'dialog' }, job.build(close)));
  ov.classList.add('show');
  if (job.onOpen) job.onOpen();
}

/** Màn chúc mừng khi hoàn thành một lượt chơi. Trả về chỉ số nút được bấm. */
export function celebrate({ emoji = '🏆', title = L('Hoàn thành!', 'All done!'), text = '', speech, buttons = [[L('Tiếp tục', 'Continue'), 'green']], kind = null }) {
  const stars = kind ? starsFor(kind) : 0;
  const capped = kind ? isCapped(kind) : false;
  if (!speech) speech = `${title} ${text}`;
  if (stars) text = `${text} +${stars} ⭐`.trim();
  if (capped) { text = `${text} 🌙 ${capNote()}`.trim(); speech = `${speech} ${capNote()}`; }
  return overlay((close) => [
    h('div', { class: 'emo', text: emoji }),
    h('h2', { text: title }),
    text ? h('p', { text }) : null,
    h('div', { class: 'row' },
      buttons.map(([label, color], i) => h('button', { class: `btn big ${color || 'green'}`, onClick: () => close(i) }, label))),
  ], () => {
    confetti();
    sfx.fanfare();
    say(speech);
    if (kind) setTimeout(() => award(kind), 400);
  });
}

/* ---------------- Thành phần dùng chung ---------------- */
export function menuCard({ emoji, label, sub, color = 'green', badge, onClick, cls = '' }) {
  return h('button', { class: `card ${color} ${cls}`, onClick: () => { sfx.tap(); onClick(); } },
    badge ? h('span', { class: 'badge', text: badge }) : null,
    h('span', { class: 'emo', text: emoji }),
    h('span', { class: 'lbl', text: label }),
    sub ? h('span', { class: 'sub', text: sub }) : null);
}

export function progressDots(total) {
  const wrap = h('div', { class: 'dots' });
  for (let i = 0; i < total; i++) wrap.append(h('i'));
  wrap.set = (doneCount) => {
    [...wrap.children].forEach((d, i) => {
      d.className = i < doneCount ? 'done' : i === doneCount ? 'cur' : '';
    });
  };
  wrap.set(0);
  return wrap;
}

/** Nút phải giữ một lúc mới kích hoạt (khoá dành cho ba mẹ). */
export function holdToActivate(el, ms, onDone, onShortTap) {
  let timer = null;
  let fired = false;
  const start = (e) => {
    e.preventDefault();
    fired = false;
    el.classList.add('holding');
    timer = setTimeout(() => { fired = true; el.classList.remove('holding'); onDone(); }, ms);
  };
  const end = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    el.classList.remove('holding');
    if (!fired && onShortTap) onShortTap();
    fired = true;
  };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointerleave', () => { if (timer) end(); });
  el.addEventListener('pointercancel', () => { if (timer) { clearTimeout(timer); timer = null; el.classList.remove('holding'); } });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
