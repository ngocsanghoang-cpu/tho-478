// TRANG CỦA BA MẸ (mở trên điện thoại) – xác nhận việc bé đã tích, đổi loại ngày, giao việc thêm, thưởng sao.
// Đọc và ghi cùng dữ liệu Firebase với iPad của bé (xem sync.js). Trang này đứng riêng, không dùng các tệp khác của ứng dụng.
const LS = 'bvh.parent';
let cfg = { url: '', code: '', lang: 'en' };
try { cfg = { ...cfg, ...(JSON.parse(localStorage.getItem(LS)) || {}) }; } catch (e) { /* */ }
const saveCfg = () => { try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch (e) { /* */ } };

// Đường link từ iPad có kèm địa chỉ và mã gia đình: parent.html#u=…&c=…
if (location.hash.length > 1) {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get('u') && p.get('c')) {
    cfg.url = p.get('u'); cfg.code = p.get('c'); saveCfg();
    history.replaceState(null, '', location.pathname + location.search);
  }
}

const L = (vi, en) => (cfg.lang === 'vi' ? vi : en);
const root = document.getElementById('root');

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const base = () => `${cfg.url.trim().replace(/\/+$/, '')}/families/${encodeURIComponent(cfg.code.trim())}`;
async function api(method, path, body) {
  const res = await fetch(`${base()}/${path}.json`, {
    method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
const day = () => `days/${todayKey()}`;

let state = { meta: null, doc: null, error: '' };
let lastJson = '';
let busy = false;

async function load(force) {
  if (!cfg.url || !cfg.code) { setup(); return; }
  if (busy) return;
  busy = true;
  try {
    const [meta, doc] = await Promise.all([api('GET', 'meta'), api('GET', day())]);
    state = { meta: meta || {}, doc: doc || {}, error: '' };
  } catch (e) {
    state = { ...state, error: String(e && e.message || e) };
  }
  busy = false;
  const json = JSON.stringify(state) + cfg.lang;
  if (force || json !== lastJson) { lastJson = json; render(); }
}

/* ---------------- Ghi ---------------- */
async function decide(keys, ok) {
  const ticks = (state.doc && state.doc.ticks) || {};
  const now = Date.now();
  try {
    await Promise.all(keys.map((key) => api('PUT', `${day()}/ticks/${key}`, { s: ok ? 'ok' : 'no', at: (ticks[key] && ticks[key].at) || now, dt: now, by: 'parent' })));
  } catch (e) { alert(L('Không gửi được. Kiểm tra mạng rồi thử lại.', 'Could not send. Check your connection and try again.')); }
  load(true);
}
const setType = async (type) => { await api('PUT', `${day()}/set/type`, type).catch(() => {}); load(true); };
const setAsk = async (id, on) => { await api('PUT', `${day()}/set/asks/${id}`, on).catch(() => {}); load(true); };
async function bonus(n) {
  if (!n) return;
  const id = `b${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  await api('PUT', `${day()}/bonus/${id}`, { n, at: Date.now() }).catch(() => {});
  alert(n > 0 ? L(`Đã thưởng ${n} ⭐. iPad sẽ cộng khi đang mở.`, `Sent ${n} ⭐. The iPad adds them when it is open.`)
    : L(`Đã trừ ${-n} ⭐. iPad sẽ trừ khi đang mở.`, `Took away ${-n} ⭐. The iPad applies it when it is open.`));
}

/* ---------------- Màn cài đặt kết nối ---------------- */
function setup(msg) {
  const url = h('input', { type: 'url', placeholder: 'https://…firebasedatabase.app', value: cfg.url, autocapitalize: 'off', autocomplete: 'off' });
  const code = h('input', { type: 'text', placeholder: L('Mã gia đình', 'Family code'), value: cfg.code, autocapitalize: 'off', autocomplete: 'off' });
  root.innerHTML = '';
  root.append(
    h('div', { class: 'top' }, h('h1', { text: L('🐰 Trang của ba mẹ', '🐰 Parents') }), langBtn()),
    h('div', { class: 'box' },
      h('h2', { text: L('Kết nối với iPad của bé', "Connect to your child's iPad") }),
      h('p', { class: 'muted', text: L('Cách dễ nhất: trên iPad vào For parents → Parent phone, bấm “Share link” rồi mở link đó trên điện thoại này. Hoặc nhập tay hai ô dưới đây, giống hệt trên iPad.',
        'Easiest: on the iPad open For parents → Parent phone, tap “Share link”, and open that link on this phone. Or type the two values below exactly as shown on the iPad.') }),
      msg ? h('p', { class: 'warn', text: msg }) : null,
      h('label', { class: 'muted', text: L('Địa chỉ cơ sở dữ liệu', 'Database URL') }), url,
      h('label', { class: 'muted', text: L('Mã gia đình', 'Family code') }), code,
      h('button', { class: 'btn wide', onClick: () => { cfg.url = url.value.trim(); cfg.code = code.value.trim(); saveCfg(); lastJson = ''; load(true); } }, L('Kết nối', 'Connect'))));
}

const langBtn = () => h('button', { class: 'chip', onClick: () => { cfg.lang = cfg.lang === 'vi' ? 'en' : 'vi'; saveCfg(); lastJson = ''; if (cfg.url && cfg.code) load(true); else setup(); } }, cfg.lang === 'vi' ? '🇬🇧 English' : '🇻🇳 Tiếng Việt');

/* ---------------- Màn chính ---------------- */
function render() {
  const { meta, doc, error } = state;
  const tasks = Object.entries((doc && doc.tasks) || {}).map(([key, t]) => ({ key, ...t })).sort((a, b) => (a.o || 0) - (b.o || 0));
  const ticks = (doc && doc.ticks) || {};
  const st = (key) => (ticks[key] && ticks[key].s) || '';
  const pending = tasks.filter((t) => st(t.key) === 'pending');
  const type = (doc && doc.set && doc.set.type) || (meta && meta.type) || 'school';
  const stale = meta && meta.date && meta.date !== todayKey();
  const playing = meta && meta.playUntil > Date.now();
  const timeOf = (key) => { const at = ticks[key] && ticks[key].at; return at ? new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''; };
  const starText = (t) => `+${t.s || 0} ⭐`;

  const taskRow = (t, big) => {
    const s = st(t.key);
    const tag = { ok: [L('Đã xác nhận', 'Checked'), 'ok'], pending: [L('Chờ ba mẹ', 'Waiting'), 'pending'], no: [L('Chưa đạt', 'Not yet'), 'no'] }[s] || [L('Chưa làm', 'Not done'), ''];
    const actions = s === 'pending'
      ? [h('button', { class: 'btn', onClick: () => decide([t.key], true) }, big ? L('✅ Đạt', '✅ Yes') : '✅'),
        h('button', { class: 'btn no', onClick: () => decide([t.key], false) }, big ? L('Chưa đạt', 'Not yet') : '✖')]
      : s === 'ok'
        ? [h('button', { class: 'btn ghost small', onClick: () => { if (confirm(L('Bỏ xác nhận việc này và trừ lại sao?', 'Undo this check and take the stars back?'))) decide([t.key], false); } }, L('Hoàn tác', 'Undo'))]
        : [h('button', { class: 'btn ghost small', onClick: () => decide([t.key], true) }, L('✅ Đạt', '✅ Yes'))];
    return h('div', { class: 'row' },
      h('span', { class: 'e', text: t.e || '⭐' }),
      h('span', { class: 't' }, t.t, h('small', { text: big ? `${t.g || ''} · ${L('tích lúc', 'ticked')} ${timeOf(t.key)} · ${starText(t)}` : `${t.a ? t.a + ' · ' : ''}${starText(t)}` })),
      big ? null : h('span', { class: `tag ${tag[1]}`, text: tag[0] }),
      actions);
  };

  const groups = [];
  tasks.forEach((t) => { let g = groups.find((x) => x.g === t.g); if (!g) groups.push(g = { g: t.g, items: [] }); g.items.push(t); });
  const chores = Object.entries((meta && meta.chores) || {});
  const asks = { ...((meta && meta.asks) || {}), ...((doc && doc.set && doc.set.asks) || {}) };
  const amount = h('input', { type: 'number', value: 5, min: 1, max: 99, inputmode: 'numeric' });
  const amt = () => Math.max(1, Math.min(99, Math.round(+amount.value) || 1));

  root.innerHTML = '';
  root.append(...[
    h('div', { class: 'top' },
      h('h1', { text: `🐰 ${(meta && meta.name) || L('Bé', 'My child')}` }),
      h('span', { class: 'stars', text: `⭐ ${meta && meta.stars != null ? meta.stars : '–'}` })),
    error ? h('p', { class: 'warn', text: L(`Không kết nối được (${error}). Kiểm tra mạng, địa chỉ và mã gia đình.`, `Cannot connect (${error}). Check the connection, the URL and the family code.`) }) : null,
    stale || !meta || !meta.date ? h('p', { class: 'warn', text: L('Hôm nay iPad của bé chưa mở ứng dụng, nên chưa có danh sách việc. Mở ứng dụng trên iPad (có mạng) là danh sách hiện ra.',
      "The iPad has not opened the app today, so there is no job list yet. Open the app on the iPad (online) and the list appears.") }) : null,
    playing ? h('p', { class: 'muted', text: L(`🎮 Bé đang trong giờ chơi, còn khoảng ${Math.ceil((meta.playUntil - Date.now()) / 60000)} phút.`, `🎮 Play time is on: about ${Math.ceil((meta.playUntil - Date.now()) / 60000)} min left.`) })
      : meta && meta.tickets ? h('p', { class: 'muted', text: L(`🎟️ Bé đang có ${meta.tickets} vé chơi chưa dùng.`, `🎟️ ${meta.tickets} unused play ${meta.tickets === 1 ? 'ticket' : 'tickets'}.`) }) : null,

    h('div', { class: 'box' + (pending.length ? ' wait' : '') },
      h('h2', { text: pending.length ? L(`⏳ Chờ ba mẹ xác nhận (${pending.length})`, `⏳ Waiting for you (${pending.length})`) : L('✅ Không có việc nào đang chờ', '✅ Nothing waiting') }),
      pending.map((t) => taskRow(t, true)),
      pending.length > 1 ? h('button', { class: 'btn wide', onClick: () => decide(pending.map((t) => t.key), true) }, L('✅ Đạt tất cả', '✅ Yes to all')) : null,
      h('p', { class: 'muted', text: L('Bé chỉ được sao sau khi ba mẹ bấm Đạt. Xác nhận hết việc của một buổi thì bé được mở khoá chơi.', 'Stars are added only after you tap Yes. When every job of a session is checked, play time unlocks.') })),

    h('div', { class: 'box' },
      h('h2', { text: L('📅 Hôm nay', '📅 Today') }),
      h('div', { class: 'chips' },
        h('button', { class: 'chip' + (type === 'school' ? ' on' : ''), onClick: () => setType('school') }, L('🏫 Ngày đi học', '🏫 School day')),
        h('button', { class: 'chip' + (type === 'off' ? ' on' : ''), onClick: () => setType('off') }, L('🎈 Ngày nghỉ', '🎈 Day off'))),
      groups.map((g) => [h('div', { class: 'group', text: g.g || '' }), g.items.map((t) => taskRow(t, false))])),

    chores.length ? h('div', { class: 'box' },
      h('h2', { text: L('📋 Giao việc thêm hôm nay', '📋 Extra jobs today') }),
      chores.map(([id, c]) => h('div', { class: 'row' },
        h('span', { class: 'e', text: c.e || '⭐' }), h('span', { class: 't' }, c.t, h('small', { text: `+${c.s || 0} ⭐` })),
        h('button', { class: 'btn small ' + (asks[id] ? '' : 'ghost'), onClick: () => setAsk(id, !asks[id]) }, asks[id] ? L('✅ Đã giao', '✅ Assigned') : L('Giao', 'Assign'))))) : null,

    h('div', { class: 'box' },
      h('h2', { text: L('⭐ Thưởng hoặc trừ sao', '⭐ Bonus stars') }),
      h('div', { class: 'bonus' }, amount,
        h('button', { class: 'btn', onClick: () => bonus(amt()) }, L('➕ Thưởng', '➕ Give')),
        h('button', { class: 'btn no', onClick: () => { if (confirm(L('Trừ sao của bé?', 'Take stars away?'))) bonus(-amt()); } }, L('➖ Trừ', '➖ Take')))),

    h('div', { class: 'chips' }, langBtn(),
      h('button', { class: 'chip', onClick: () => load(true) }, L('🔄 Tải lại', '🔄 Refresh')),
      h('button', { class: 'chip', onClick: () => setup() }, L('⚙️ Kết nối', '⚙️ Connection'))),
  ].filter(Boolean));
}

load(true);
setInterval(() => { if (!document.hidden && cfg.url && cfg.code && !document.querySelector('input[type=url]')) load(); }, 4000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
