// TẬP VIẾT – tô chữ cái (tiếng Việt hoặc tiếng Anh), chữ hoa và chữ số bằng ngón tay hoặc Apple Pencil
import { register, go, h, say, live, sleep, praise, confetti, toast } from './ui.js';
import { hwTrace, hwWriteFor, rewardExercise } from './homework.js';
import { sfx } from './sound.js';
import { store, bump } from './store.js';
import { L, isEn, byLang } from './i18n.js';
import { numWord, cap } from './vi.js';

const THEME = 'var(--purple)';

// Tiếng Việt: 29 chữ cái – [cách đọc âm, hình, từ ví dụ]
const VI = {
  a: ['a', '👗', 'áo đầm'], ă: ['á', '🍚', 'ăn cơm'], â: ['ớ', '🫖', 'ấm trà'], b: ['bờ', '🦋', 'bướm'],
  c: ['cờ', '🐟', 'cá'], d: ['dờ', '🍓', 'dâu'], đ: ['đờ', '💡', 'đèn'], e: ['e', '👶', 'em bé'],
  ê: ['ê', '🐸', 'ếch'], g: ['gờ', '🐔', 'gà'], h: ['hờ', '🌸', 'hoa'], i: ['i', '🔵', 'viên bi'],
  k: ['ca', '🍦', 'kem'], l: ['lờ', '🍃', 'lá'], m: ['mờ', '🐱', 'mèo'], n: ['nờ', '🎀', 'nơ'],
  o: ['o', '🐝', 'ong'], ô: ['ô', '☂️', 'cái ô'], ơ: ['ơ', '🌶️', 'quả ớt'], p: ['pờ', '🔋', 'pin'],
  q: ['quy', '🍎', 'quả táo'], r: ['rờ', '🐢', 'rùa'], s: ['sờ', '⭐', 'ngôi sao'], t: ['tờ', '🦐', 'tôm'],
  u: ['u', '👢', 'đôi ủng'], ư: ['ư', '🦁', 'sư tử'], v: ['vờ', '🐘', 'voi'], x: ['xờ', '🚲', 'xe đạp'],
  y: ['i dài', '👩‍⚕️', 'y tá'],
};
// English: 26 letters – [picture, example word]
const EN = {
  a: ['🍎', 'apple'], b: ['🦋', 'butterfly'], c: ['🐱', 'cat'], d: ['🐶', 'dog'], e: ['🐘', 'elephant'], f: ['🌸', 'flower'],
  g: ['🍇', 'grapes'], h: ['👒', 'hat'], i: ['🍦', 'ice cream'], j: ['🧃', 'juice'], k: ['🪁', 'kite'], l: ['🦁', 'lion'],
  m: ['🌙', 'moon'], n: ['👃', 'nose'], o: ['🍊', 'orange'], p: ['🐼', 'panda'], q: ['👸', 'queen'], r: ['🐰', 'rabbit'],
  s: ['☀️', 'sun'], t: ['🐯', 'tiger'], u: ['☂️', 'umbrella'], v: ['🎻', 'violin'], w: ['🐳', 'whale'], x: ['🎶', 'xylophone'],
  y: ['🪀', 'yo-yo'], z: ['🦓', 'zebra'],
};
export const SETS = byLang(() => {
  const lower = Object.keys(L(VI, EN));
  return {
    lower: { title: L('Chữ thường', 'Lowercase'), chars: lower },
    upper: { title: L('Chữ hoa', 'Uppercase'), chars: lower.map((c) => c.toUpperCase()) },
    digits: { title: L('Chữ số', 'Numbers'), chars: '0123456789'.split('') },
  };
});

const COLORS = ['#ff6b9a', '#9b5de5', '#4ea8de', '#2ec4b6', '#ff9f1c', '#2b2d42'];
const FONT = (px) => `700 ${px}px Andika, "Chalkboard SE", "Comic Sans MS", ui-rounded, sans-serif`;

/** Lời thoại & ví dụ cho một chữ / số. */
function describe(set, ch) {
  if (set === 'digits') {
    const n = +ch;
    const w = numWord(n);
    const word = n === 0 ? L('không có quả nào', 'no apples') : L(`${w} quả táo`, `${w} ${n === 1 ? 'apple' : 'apples'}`);
    return {
      emoji: n === 0 ? '🫙' : '🍎'.repeat(n), word,
      intro: L(`Số ${w}. Con hãy dùng ngón tay tô theo số ${w} nhé.`, `Number ${w}. Trace the number ${w} with your finger.`),
      ex: L(`${w}. ${word}`, `${cap(w)}. ${cap(word)}.`),
      name: L(`số ${w}`, `the number ${w}`),
    };
  }
  const up = set === 'upper';
  const key = ch.toLowerCase();
  if (isEn()) {
    const [emoji, word] = EN[key];
    const U = key.toUpperCase();
    const ex = `${cap(word)} starts with the letter ${U}.`;
    return {
      emoji, word: up ? cap(word) : word, ex,
      intro: `${up ? 'Capital letter' : 'Letter'} ${U}. ${ex} Trace the dotted letter with your finger.`,
      name: up ? `capital letter ${U}` : `the letter ${U}`,
    };
  }
  const [sound, emoji, word] = VI[key];
  return {
    emoji, word: up ? cap(word) : word, ex: `${sound}, ${word}`,
    intro: `Chữ ${sound}${up ? ' hoa' : ''}. ${sound}, ${word}. Con hãy tô theo nét chấm nhé.`,
    name: `chữ ${sound}${up ? ' hoa' : ''}`,
  };
}

export const starsOf = (set, ch) => store.data.letters[`${set}:${ch}`] || 0;

/* ---------------- Danh sách chữ ---------------- */
register('writing', {
  title: () => L('Tập Viết', 'Writing'), parent: 'home', theme: THEME,
  render(root, { set = 'lower' } = {}) {
    const S = SETS()[set];
    const tabs = h('div', { class: 'chips' }, Object.entries(SETS()).map(([k, v]) =>
      h('button', { class: 'chip' + (k === set ? ' on' : ''), onClick: () => { sfx.tap(); go('writing', { set: k }); } }, v.title)));
    const grid = h('div', { class: 'letter-grid' }, S.chars.map((ch, i) => {
      const st = starsOf(set, ch);
      return h('button', { class: 'ltile' + (st ? ' has' : ''), onClick: () => { sfx.tap(); go('trace', { set, i }); } },
        h('span', { class: 'ch', text: ch }),
        h('span', { class: 'st', text: st ? '🌸'.repeat(st) : '' }));
    }));
    const doneCount = S.chars.filter((c) => starsOf(set, c)).length;
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } }, h('h2', { text: L('✏️ Tập Viết', '✏️ Writing') }), h('p', { text: L(`Đã tô ${doneCount}/${S.chars.length} ${S.title.toLowerCase()}`, `Traced ${doneCount} of ${S.chars.length} ${S.title.toLowerCase()}`) })),
        tabs),
      grid));
    say(L(`${S.title}. Con chọn một ${set === 'digits' ? 'số' : 'chữ'} để tập tô nhé.`, `${S.title}. Pick a ${set === 'digits' ? 'number' : 'letter'} to trace.`));
  },
});

/* ---------------- Màn tô chữ ---------------- */
register('trace', {
  title: (p) => SETS()[p.set].title, parent: (p) => ['writing', { set: p.set }], theme: THEME, fixed: true,
  render(root, { set, i }) {
    const life = live();
    const S = SETS()[set];
    const ch = S.chars[i];
    const info = describe(set, ch);
    let mode = 'trace'; // 'trace' = tô theo nét chấm, 'free' = tự viết
    let color = COLORS[0];
    let strokes = [];
    let active = null;
    let M = null; // số đo bố cục
    let flashTimer = null;

    const guide = h('canvas', { class: 'guide' });
    const ink = h('canvas', { class: 'ink' });
    const board = h('div', { class: 'board' }, guide, ink);

    const modeChips = h('div', { class: 'chips', style: { justifyContent: 'center' } });
    const renderModes = () => {
      modeChips.innerHTML = '';
      [['trace', L('✏️ Tô chữ', '✏️ Trace')], ['free', L('🌟 Tự viết', '🌟 On my own')]].forEach(([k, label]) => modeChips.append(
        h('button', { class: 'chip' + (mode === k ? ' on' : ''), onClick: () => setMode(k) }, label)));
    };
    renderModes();

    const colorBtns = h('div', { class: 'colors' }, COLORS.map((c, k) => {
      const b = h('button', { class: k === 0 ? 'on' : '', style: { background: c }, 'aria-label': L('màu bút', 'pen color') });
      b.addEventListener('click', () => {
        color = c; sfx.tap();
        [...colorBtns.children].forEach((x) => x.classList.toggle('on', x === b));
      });
      return b;
    }));

    // Khi đang làm bài tập hôm nay, nút Tiếp đưa tới chữ kế tiếp của bài tập
    let hwNext = -1;
    const nextBtn = h('button', { class: 'btn blue small', onClick: () => go('trace', hwNext >= 0 ? { set, i: hwNext, hw: true } : { set, i: (i + 1) % S.chars.length }) }, L('Tiếp ➡️', 'Next ➡️'));
    const checkBtn = h('button', { class: 'btn big green', onClick: check }, L('✅ Xong', '✅ Done'));

    root.append(h('div', { class: 'trace' },
      h('div', { class: 'trace-side' },
        h('div', { class: 'trace-info' },
          h('div', { class: 'big', text: ch, onClick: () => say(info.intro) }),
          h('div', { class: 'ex', onClick: () => say(info.ex) },
            h('span', { class: 'e', text: info.emoji, style: set === 'digits' ? { fontSize: '30px', letterSpacing: '-4px', wordBreak: 'break-all' } : null }),
            set === 'digits' ? null : h('span', { class: 'w', text: info.word }))),
        modeChips,
        h('div', { class: 'trace-tools' },
          colorBtns,
          h('div', { class: 'row' },
            h('button', { class: 'btn ghost small', onClick: () => go('trace', { set, i: (i - 1 + S.chars.length) % S.chars.length }) }, L('⬅️ Trước', '⬅️ Back')),
            h('button', { class: 'btn ghost small', onClick: undo }, L('↩️ Xoá nét', '↩️ Undo')),
            h('button', { class: 'btn ghost small', onClick: clear }, L('🧽 Xoá hết', '🧽 Clear')),
            nextBtn),
          checkBtn)),
      board));

    const hwEx = hwWriteFor(set);
    if (hwEx && hwEx.chars.includes(ch) && !hwEx.got.includes(ch)) {
      say(L(`Bài tập hôm nay: tô ${hwEx.chars.length} chữ. `, `Today's exercise: trace ${hwEx.chars.length}. `) + info.intro);
    } else say(info.intro);

    /* --- Bố cục & vẽ nền --- */
    async function layout() {
      try {
        await Promise.race([document.fonts.load(FONT(100), ch), sleep(2500)]);
      } catch (e) { /* dùng phông dự phòng */ }
      if (!life.alive) return;
      const r = board.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = r.width, H = r.height;
      for (const c of [guide, ink]) {
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
        c.style.width = W + 'px'; c.style.height = H + 'px';
      }
      const g = guide.getContext('2d');
      let fs = Math.min(H * 0.6, W * 0.8);
      g.font = FONT(fs);
      let m = g.measureText(ch);
      let gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      if (gw > W * 0.8) { fs *= (W * 0.8) / gw; g.font = FONT(fs); m = g.measureText(ch); gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight; }
      const baseline = H * 0.74;
      const x = W / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
      const xh = g.measureText('x').actualBoundingBoxAscent || fs * 0.5;
      const stem = measureStem(fs);
      M = { W, H, dpr, fs, baseline, x, xh, stem, inkW: Math.max(12, stem * 1.1) };
      strokes = [];
      drawGuide();
      redrawInk();
    }

    function drawGuide(fillStyle) {
      const { W, H, dpr, fs, baseline, x, xh, stem } = M;
      const g = guide.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // Giấy ô ly
      const u = xh / 2;
      g.lineWidth = 1;
      g.strokeStyle = 'rgba(78,168,222,.16)';
      g.beginPath();
      for (let y = baseline % u; y < H; y += u) { g.moveTo(0, y); g.lineTo(W, y); }
      for (let xx = (W / 2) % u; xx < W; xx += u) { g.moveTo(xx, 0); g.lineTo(xx, H); }
      g.stroke();
      g.lineWidth = 2.5;
      g.strokeStyle = 'rgba(78,168,222,.45)';
      g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(0, baseline - xh); g.lineTo(W, baseline - xh); g.stroke();
      g.setLineDash([]);
      g.strokeStyle = 'rgba(239,71,111,.45)';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, baseline); g.lineTo(W, baseline); g.stroke();

      // Chữ mẫu
      g.font = FONT(fs);
      g.textBaseline = 'alphabetic';
      if (fillStyle) {
        g.fillStyle = fillStyle;
        g.fillText(ch, x, baseline);
      } else if (mode === 'trace') {
        g.fillStyle = '#ffe9c7';
        g.fillText(ch, x, baseline);
        g.setLineDash([1, Math.max(8, stem * 0.32)]);
        g.lineCap = 'round';
        g.lineWidth = Math.max(4, stem * 0.13);
        g.strokeStyle = '#b59a74';
        g.strokeText(ch, x, baseline);
        g.setLineDash([]);
      } else {
        g.fillStyle = 'rgba(43,45,66,.06)';
        g.fillText(ch, x, baseline);
      }
    }

    function measureStem(fs) {
      try {
        const size = Math.ceil(fs * 1.3);
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.font = FONT(fs);
        g.fillStyle = '#000';
        const base = size * 0.85;
        g.fillText('l', size * 0.3, base);
        const asc = g.measureText('l').actualBoundingBoxAscent || fs * 0.7;
        const y = Math.round(base - asc * 0.5);
        const row = g.getImageData(0, y, size, 1).data;
        let best = 0, run = 0;
        for (let k = 3; k < row.length; k += 4) {
          if (row[k] > 128) { run++; best = Math.max(best, run); } else run = 0;
        }
        return best > 2 ? best : fs * 0.1;
      } catch (e) {
        return fs * 0.1;
      }
    }

    /* --- Nét vẽ của bé --- */
    function pt(e) {
      const r = ink.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    function inkCtx() {
      const c = ink.getContext('2d');
      c.setTransform(M.dpr, 0, 0, M.dpr, 0, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = M.inkW;
      return c;
    }
    function drawSeg(c, s, a, b) {
      c.strokeStyle = s.color;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    function redrawInk() {
      if (!M) return;
      const c = inkCtx();
      c.clearRect(0, 0, M.W, M.H);
      for (const s of strokes) {
        for (let k = 0; k < s.pts.length; k++) drawSeg(c, s, s.pts[Math.max(0, k - 1)], s.pts[k]);
      }
    }

    ink.addEventListener('pointerdown', (e) => {
      if (!M || active) return;
      e.preventDefault();
      ink.setPointerCapture(e.pointerId);
      active = { id: e.pointerId, color, pts: [pt(e)] };
      strokes.push(active);
      const c = inkCtx();
      drawSeg(c, active, active.pts[0], active.pts[0]);
    });
    ink.addEventListener('pointermove', (e) => {
      if (!active || e.pointerId !== active.id) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      const c = inkCtx();
      for (const ev of (evs.length ? evs : [e])) {
        const p = pt(ev);
        const last = active.pts[active.pts.length - 1];
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) continue;
        active.pts.push(p);
        drawSeg(c, active, last, p);
      }
    });
    const endStroke = (e) => { if (active && e.pointerId === active.id) active = null; };
    ink.addEventListener('pointerup', endStroke);
    ink.addEventListener('pointercancel', endStroke);

    function undo() { sfx.tap(); strokes.pop(); redrawInk(); }
    function clear() { sfx.tap(); strokes = []; redrawInk(); if (M) drawGuide(); }
    function setMode(k) {
      if (mode === k) return;
      mode = k; sfx.tap(); renderModes(); clear();
      say(k === 'free'
        ? L(`Bây giờ con tự viết ${info.name} nhé. Chữ mẫu mờ hơn rồi đó!`, `Now write ${info.name} on your own. The guide is very faint now!`)
        : L(`Con tô theo nét chấm ${info.name} nhé.`, `Trace the dotted lines of ${info.name}.`));
    }

    /* --- Chấm điểm --- */
    function score() {
      const s = 0.25;
      const w = Math.max(1, Math.ceil(M.W * s)), hh = Math.max(1, Math.ceil(M.H * s));
      const c = document.createElement('canvas');
      c.width = w; c.height = hh;
      const g = c.getContext('2d', { willReadFrequently: true });
      const grab = () => g.getImageData(0, 0, w, hh).data;
      g.setTransform(s, 0, 0, s, 0, 0);
      g.font = FONT(M.fs);
      g.fillStyle = '#000'; g.strokeStyle = '#000';
      g.lineCap = 'round'; g.lineJoin = 'round';

      g.fillText(ch, M.x, M.baseline);
      const letter = grab();

      g.clearRect(0, 0, M.W, M.H);
      g.lineWidth = M.stem * 1.6;
      g.fillText(ch, M.x, M.baseline);
      g.strokeText(ch, M.x, M.baseline);
      const tol = grab();

      g.clearRect(0, 0, M.W, M.H);
      g.lineWidth = M.inkW;
      for (const st of strokes) {
        g.beginPath();
        st.pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
        if (st.pts.length === 1) g.lineTo(st.pts[0][0] + 0.1, st.pts[0][1]);
        g.stroke();
      }
      const inkD = grab();

      let L = 0, LI = 0, I = 0, IT = 0;
      const miss = new Uint8ClampedArray(letter.length);
      for (let k = 3; k < letter.length; k += 4) {
        const isL = letter[k] > 128, isI = inkD[k] > 128;
        if (isL) { L++; if (isI) LI++; else { miss[k - 3] = 255; miss[k - 2] = 120; miss[k - 1] = 30; miss[k] = 200; } }
        if (isI) { I++; if (tol[k] > 128) IT++; }
      }
      return { coverage: L ? LI / L : 0, precision: I ? IT / I : 0, ink: I, letterPx: L, miss: new ImageData(miss, w, hh) };
    }

    function flashMissing(img) {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').putImageData(img, 0, 0);
      const g = guide.getContext('2d');
      g.setTransform(M.dpr, 0, 0, M.dpr, 0, 0);
      g.globalAlpha = 0.75;
      g.imageSmoothingEnabled = true;
      g.drawImage(c, 0, 0, M.W, M.H);
      g.globalAlpha = 1;
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { if (life.alive && M) drawGuide(); }, 1800);
    }

    async function check() {
      if (!M) return;
      if (!strokes.length) { say(L(`Con hãy dùng ngón tay tô lên ${info.name} trước nhé.`, `Use your finger to trace ${info.name} first.`)); return; }
      const r = score();
      let stars = 0;
      if (r.coverage >= 0.75 && r.precision >= 0.82) stars = 3;
      else if (r.coverage >= 0.6 && r.precision >= 0.72) stars = 2;
      else if (r.coverage >= 0.45 && r.precision >= 0.6) stars = 1;

      if (!stars) {
        sfx.oops();
        if (r.coverage < 0.45) {
          flashMissing(r.miss);
          say(L('Con tô thêm phần màu cam còn thiếu nhé!', 'Color in the orange parts you missed!'));
        } else {
          say(L('Con cố tô ở bên trong nét chữ nhé. Mình thử lại nào!', "Try to stay inside the lines. Let's try again!"));
          strokes = []; redrawInk();
        }
        return;
      }

      const key = `${set}:${ch}`;
      store.data.letters[key] = Math.max(starsOf(set, ch), stars);
      bump('write');
      sfx.fanfare();
      const grad = guide.getContext('2d').createLinearGradient(0, 0, M.W, M.H);
      ['#ff6b9a', '#ffc94a', '#2ec4b6', '#4ea8de', '#9b5de5'].forEach((c, k, a) => grad.addColorStop(k / (a.length - 1), c));
      drawGuide(grad);
      if (stars === 3) confetti(30);
      // Bông hoa 🌸 = điểm tô đẹp (1–3). Ngôi sao ⭐ = phần thưởng để đổi quà, theo luật ba mẹ đặt.
      toast('🌸'.repeat(stars));
      const hw = hwTrace(set, ch); // chữ này có thuộc bài tập hôm nay không?
      nextBtn.classList.add('pulse');
      let msg = L(`${praise()} Con tô đẹp, được ${numWord(stars)} bông hoa.`, `${praise()} Neat tracing! You get ${numWord(stars)} ${stars === 1 ? 'flower' : 'flowers'}.`);
      if (hw && hw.result) {
        msg += ' ' + rewardExercise(hw.result, checkBtn);
        await say(msg);
        if (life.alive) go('homework');
        return;
      }
      if (hw) {
        const n = hw.left.length;
        hwNext = S.chars.indexOf(hw.next);
        msg += L(` Còn ${numWord(n)} chữ nữa là xong bài tập. Bấm Tiếp nhé!`, ` ${n === 1 ? 'One more' : numWord(n) + ' more'} to finish the exercise. Tap Next!`);
        await say(msg);
        return;
      }
      if (stars === 3 && mode === 'trace') msg += L(' Bây giờ con thử bấm Tự viết nhé!', ' Now try tapping On my own!');
      else if (stars < 3) msg += L(' Con có thể xoá và tô lại cho đẹp hơn nữa.', ' You can clear it and trace again to make it even nicer.');
      else msg += L(' Bấm Tiếp để sang chữ mới nhé!', ' Tap Next for a new one!');
      await say(msg);
    }

    const ro = new ResizeObserver(() => { clearTimeout(ro.t); ro.t = setTimeout(layout, 120); });
    ro.observe(board);
    layout();

    return () => { ro.disconnect(); clearTimeout(flashTimer); clearTimeout(ro.t); };
  },
});
