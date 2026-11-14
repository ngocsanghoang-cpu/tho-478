// ĐỒNG BỘ VỚI ĐIỆN THOẠI BA MẸ – qua Firebase Realtime Database (REST, không cần thư viện).
// iPad của bé gửi: danh sách việc hôm nay, việc bé đã tích, số sao.
// Điện thoại ba mẹ gửi: xác nhận / chưa đạt, đổi loại ngày, giao việc thêm, thưởng hoặc trừ sao.
// Dữ liệu nằm tại  <url>/families/<mã gia đình>/…  ; ai biết mã mới đọc, ghi được.
import { store, todayKey, todaysAsks, todaysTicks, todaysPlay, isSchoolDay, setTodaySchool, adjustStars } from './store.js';
import { todayTaskList, decideAndTell, onDecision } from './approve.js';
import { onTick, choreName } from './selfcare.js';
import { giveStars, updateStars, refresh, say } from './ui.js';
import { L } from './i18n.js';

export const syncOn = () => !!(store.data.sync.url && store.data.sync.code);
export const familyBase = (url, code) => `${String(url).trim().replace(/\/+$/, '')}/families/${encodeURIComponent(String(code).trim())}`;
const base = () => familyBase(store.data.sync.url, store.data.sync.code);

export const syncState = { ok: null, error: '', at: 0 };

async function req(method, path, body) {
  const res = await fetch(`${base()}/${path}.json`, {
    method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Mã gia đình ngẫu nhiên, khó đoán. */
export function newFamilyCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const a = new Uint32Array(12);
  crypto.getRandomValues(a);
  return [...a].map((n) => abc[n % abc.length]).join('');
}

/** Đường link mở trang của ba mẹ trên điện thoại, đã kèm địa chỉ và mã gia đình. */
export function parentLink() {
  const u = new URL('parent.html', location.href);
  u.hash = `u=${encodeURIComponent(store.data.sync.url.trim())}&c=${encodeURIComponent(store.data.sync.code.trim())}`;
  return u.href;
}

const day = () => `days/${todayKey()}`;
let lastTasks = '';
let lastMeta = '';

/** Gửi danh sách việc hôm nay + thông tin chung (chỉ gửi khi có thay đổi). */
async function publish() {
  const tasks = {};
  todayTaskList().forEach((t) => { tasks[t.key] = { e: t.e, t: t.t, g: t.group, s: t.stars, o: t.order }; });
  const tj = JSON.stringify(tasks);
  if (tj !== lastTasks) { await req('PUT', `${day()}/tasks`, tasks); lastTasks = tj; }

  const chores = {};
  store.data.chores.forEach((c) => { chores[c.id] = { e: c.emoji, t: choreName(c), s: c.stars }; });
  const asks = {};
  todaysAsks().forEach((id) => { asks[id] = true; });
  const meta = { name: store.data.name || '', stars: store.data.stars, type: isSchoolDay() ? 'school' : 'off', date: todayKey(),
    chores, asks, playUntil: todaysPlay().until || 0, tickets: Object.values(todaysPlay().tickets).filter((v) => v === 'ready').length };
  const mj = JSON.stringify(meta);
  if (mj !== lastMeta) { await req('PUT', 'meta', { ...meta, updated: Date.now() }); lastMeta = mj; }
}

/** Gửi trạng thái một việc (bé vừa tích, hoặc ba mẹ xác nhận ngay trên iPad). */
async function pushTick(key) {
  if (!syncOn()) return;
  const it = todaysTicks()[key];
  if (!it) return;
  try { await req('PUT', `${day()}/ticks/${key}`, { s: it.s, at: it.at || Date.now(), dt: it.dt || 0 }); } catch (e) { /* lần đồng bộ sau sẽ gửi lại */ }
}

/** Đọc dữ liệu của hôm nay từ máy chủ và áp dụng các thay đổi do ba mẹ gửi. */
async function pull() {
  const doc = (await req('GET', day())) || {};
  const local = todaysTicks();

  // 1. Loại ngày (ngày đi học / ngày nghỉ) ba mẹ đổi từ điện thoại
  const set = doc.set || {};
  if ((set.type === 'school' || set.type === 'off') && (set.type === 'school') !== isSchoolDay()) {
    setTodaySchool(set.type === 'school');
    refresh(['home', 'selfcare', 'routine']);
  }
  // 2. Việc thêm ba mẹ giao từ điện thoại (set.asks: { id: true | false })
  if (set.asks) {
    const ids = todaysAsks();
    let changed = false;
    for (const [id, on] of Object.entries(set.asks)) {
      const has = ids.includes(id);
      if (on && !has && store.data.chores.some((c) => c.id === id)) { ids.push(id); changed = true; }
      if (!on && has) { ids.splice(ids.indexOf(id), 1); changed = true; }
    }
    if (changed) {
      store.save();
      refresh(['home', 'selfcare']);
      say(L('Ba mẹ vừa nhờ con một việc mới. Con vào Bé Tự Lập xem nhé!', 'Mom and Dad have a new job for you. Look in I Can Do It!'));
    }
  }
  // 3. Xác nhận / chưa đạt
  const remote = doc.ticks || {};
  const decisions = [];
  for (const [key, r] of Object.entries(remote)) {
    const l = local[key];
    if (r.s !== 'ok' && r.s !== 'no') continue;
    if (l && l.s === r.s) continue;
    if (l && l.s === 'pending' && (l.at || 0) > (r.dt || 0)) continue; // bé đã làm lại và tích lại sau quyết định này
    decisions.push({ key, ok: r.s === 'ok' });
  }
  if (decisions.length) decideAndTell(decisions);
  // Việc bé đã tích mà máy chủ chưa có (lúc tích bị mất mạng): gửi lại
  for (const [key, l] of Object.entries(local)) {
    const r = remote[key];
    if (l.s === 'pending' && (!r || (r.s !== 'pending' && (r.dt || 0) < (l.at || 0)))) await pushTick(key);
    if ((l.s === 'ok' || l.s === 'no') && (!r || r.s !== l.s) && !decisions.some((d) => d.key === key)) await pushTick(key);
  }
  // 4. Thưởng / trừ sao ba mẹ gửi từ điện thoại (mỗi lần chỉ áp dụng một lần)
  if (store.data.applied.date !== todayKey()) store.data.applied = { date: todayKey(), ids: [] };
  for (const [id, b] of Object.entries(doc.bonus || {})) {
    if (store.data.applied.ids.includes(id)) continue;
    store.data.applied.ids.push(id);
    const n = Math.round(+b.n) || 0;
    if (n > 0) { giveStars(n); say(L(`Ba mẹ thưởng cho con ${n} sao!`, `Mom and Dad give you ${n} bonus ${n === 1 ? 'star' : 'stars'}!`)); }
    else if (n < 0) { adjustStars(n); updateStars(true); }
    store.save();
  }
}

let busy = false;
/** Một vòng đồng bộ: gửi việc hôm nay rồi nhận thay đổi. */
export async function syncNow() {
  if (!syncOn() || busy) return syncState;
  busy = true;
  try {
    await publish();
    await pull();
    await publish();
    Object.assign(syncState, { ok: true, error: '', at: Date.now() });
  } catch (e) {
    Object.assign(syncState, { ok: false, error: String(e && e.message || e), at: Date.now() });
  }
  busy = false;
  return syncState;
}

/** Ba mẹ đổi loại ngày hoặc giao việc ngay trên iPad: ghi lên máy chủ để điện thoại thấy giống vậy. */
export async function pushSet(path, value) {
  if (!syncOn()) return;
  try { await req('PUT', `${day()}/set/${path}`, value); } catch (e) { /* lần đồng bộ sau sẽ gửi lại qua meta */ }
}

/** Khi ba mẹ đổi địa chỉ hoặc mã: gửi lại toàn bộ. */
export function resetSync() { lastTasks = ''; lastMeta = ''; }

onTick((key) => { pushTick(key); });
onDecision(() => { Object.keys(todaysTicks()).forEach((k) => pushTick(k)); });

setInterval(() => { if (!document.hidden) syncNow(); }, 5000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(); });
syncNow();
