// BA MẸ XÁC NHẬN – bé tích việc, ba mẹ xác nhận (trên điện thoại hoặc ngay trên iPad) rồi sao mới được cộng.
// Khi ba mẹ xác nhận hết việc của một buổi: thưởng thêm sao và bé nhận một vé chơi.
import { store, todaysTicks, todaysPlay, bump, adjustStars } from './store.js';
import { ROUTINES, todaysChores, taskStars, dk, tickKey } from './selfcare.js';
import { giveStars, toast, say, updateStars, refresh } from './ui.js';
import { sfx } from './sound.js';
import { L } from './i18n.js';

/** Mọi việc của hôm nay (các buổi + việc ba mẹ giao), kèm khoá, tên, số sao. */
export function todayTaskList() {
  const out = [];
  let order = 0;
  for (const [kind, R] of Object.entries(ROUTINES())) {
    for (const t of R.tasks) {
      out.push({ key: tickKey(kind, t.id), kind, group: `${R.emoji} ${R.title}`, e: t.e, t: t.t, stars: taskStars(t), order: order++ });
    }
  }
  for (const c of todaysChores()) {
    out.push({ key: tickKey('chore', c.id), kind: 'chore', group: L('📋 Việc ba mẹ giao', '📋 Extra jobs'), e: c.e, t: c.t, stars: c.stars, order: order++ });
  }
  return out;
}

export const statusOf = (key) => (todaysTicks()[key] || {}).s || '';
/** Các việc bé đã tích, đang chờ ba mẹ xác nhận. */
export const pendingList = () => todayTaskList().filter((t) => statusOf(t.key) === 'pending');

const listeners = new Set();
/** Gọi fn() mỗi khi có việc được xác nhận / từ chối (để đồng bộ và vẽ lại màn hình). */
export const onDecision = (fn) => listeners.add(fn);
const ticketListeners = new Set();
/** Gọi fn(buổi) khi bé nhận được một vé chơi. */
export const onTicket = (fn) => ticketListeners.add(fn);

/**
 * Áp dụng một loạt quyết định của ba mẹ: [{ key, ok }].
 * Trả về { stars, tickets } để nơi gọi báo cho bé. Mỗi việc chỉ được trả sao một lần.
 */
export function decide(list) {
  const items = todaysTicks();
  const tasks = todayTaskList();
  let stars = 0;
  let rejected = 0;
  let changed = false;
  for (const { key, ok } of list) {
    const task = tasks.find((t) => t.key === key);
    if (!task) continue;
    const it = items[key] || (items[key] = { at: Date.now() });
    if (ok) {
      if (it.s === 'ok') continue;
      it.s = 'ok';
      if (!it.paid) { it.paid = true; stars += task.stars; bump('selfcare'); }
    } else {
      if (it.s === 'no') continue;
      if (it.paid) { it.paid = false; adjustStars(-task.stars); } // ba mẹ đổi ý sau khi đã xác nhận
      it.s = 'no';
      rejected++;
    }
    it.dt = Date.now();
    changed = true;
  }
  if (!changed) return { stars: 0, tickets: [], rejected: 0 };

  // Buổi nào được xác nhận hết việc: thưởng thêm sao + 1 vé chơi (mỗi buổi một lần trong ngày)
  const play = todaysPlay();
  const tickets = [];
  for (const [kind, R] of Object.entries(ROUTINES())) {
    const id = dk(kind);
    if (play.bonus[id]) continue;
    if (R.tasks.every((t) => (items[tickKey(kind, t.id)] || {}).s === 'ok')) {
      play.bonus[id] = true;
      play.tickets[id] = 'ready';
      stars += Math.max(0, +store.data.rules.routine || 0);
      tickets.push(kind);
    }
  }
  store.save();
  listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  return { stars, tickets, rejected };
}

/** Áp dụng quyết định rồi báo cho bé (sao bay, lời nói, vé chơi). Dùng cho cả điện thoại ba mẹ và iPad. */
export function decideAndTell(list) {
  const r = decide(list);
  if (!r.stars && !r.rejected && !r.tickets.length) { updateStars(); return r; }
  if (r.stars) { giveStars(r.stars); sfx.ding(); toast(`+${r.stars} ⭐`); } else updateStars();
  refresh(['home', 'selfcare', 'routine', 'task']);
  let msg = '';
  if (r.stars) msg += L(`Ba mẹ đã xác nhận việc của con. Con được ${r.stars} sao! `, `Mom and Dad checked your jobs. You earn ${r.stars} ${r.stars === 1 ? 'star' : 'stars'}! `);
  if (r.rejected) msg += L('Có việc ba mẹ thấy chưa đạt, con làm lại nhé. ', 'One job is not done yet. Please do it again. ');
  if (r.tickets.length) ticketListeners.forEach((fn) => { try { fn(r.tickets, msg); } catch (e) { console.error(e); } });
  else if (msg) say(msg.trim());
  return r;
}
