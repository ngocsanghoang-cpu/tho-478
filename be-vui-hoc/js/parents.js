// GÓC BA MẸ – ngôn ngữ, giọng đọc, tên bé, giờ nghỉ, xem tiến độ
import { register, go, h, say, updateStars } from './ui.js';
import { store, resetProgress, unlockedCount, STICKERS, adjustStars } from './store.js';
import { rewardName, ruleRows, maxSelfcarePerDay, maxPerDay } from './rewards.js';
import { L, lang, setLang } from './i18n.js';
import { ROUTINES, routineCount } from './selfcare.js';
import { SETS, starsOf } from './writing.js';
import { getVoices, langVoices, voiceGender, voiceAdvice, onVoicesChanged, configureSpeech, currentVoice } from './speech.js';
import { setSoundEnabled } from './sound.js';

register('parents', {
  title: () => L('Góc ba mẹ', 'For parents'), parent: 'home', theme: 'var(--purple)',
  render(root) {
    const d = store.data;
    const cur = lang();
    const muted = { margin: 0, fontSize: '16px', color: 'var(--muted)' };

    // Ngôn ngữ
    const langBtns = h('div', { class: 'chips' }, [['vi', '🇻🇳 Tiếng Việt'], ['en', '🇬🇧 English']].map(([k, label]) =>
      h('button', { class: 'chip big' + (k === cur ? ' on' : ''), onClick: () => { setLang(k); go('parents'); } }, label)));

    // Tên bé
    const nameInput = h('input', { type: 'text', value: d.name, placeholder: L('Ví dụ: Na, Su, Bông…', 'For example: Mia, Lily…'), maxlength: 20 });
    nameInput.addEventListener('change', () => store.set({ name: nameInput.value.trim() }));

    // Giọng đọc (lưu riêng cho từng ngôn ngữ)
    const voiceSel = h('select');
    const genderText = (v) => ({ female: L(' – giọng nữ', ' – female'), male: L(' – giọng nam', ' – male') }[voiceGender(v)] || '');
    const fillVoices = () => {
      const mine = langVoices(cur);
      const other = getVoices().filter((v) => !mine.includes(v));
      voiceSel.innerHTML = '';
      voiceSel.append(h('option', { value: '' }, L('Tự động (giọng nữ hay nhất)', 'Automatic (best female voice)')));
      mine.forEach((v) => voiceSel.append(h('option', { value: v.voiceURI }, `⭐ ${v.name}${genderText(v)}`)));
      other.forEach((v) => voiceSel.append(h('option', { value: v.voiceURI }, `${v.name} (${v.lang})`)));
      voiceSel.value = d.voices[cur] || '';
    };
    fillVoices();
    voiceSel.addEventListener('change', () => {
      d.voices[cur] = voiceSel.value;
      store.save();
      configureSpeech({ voiceURI: voiceSel.value });
      renderVoiceInfo();
      test();
    });

    const rate = h('input', { type: 'range', min: 0.6, max: 1.3, step: 0.05, value: d.rate });
    const rateLbl = h('b', { text: Number(d.rate).toFixed(2) + '×' });
    rate.addEventListener('input', () => { rateLbl.textContent = Number(rate.value).toFixed(2) + '×'; });
    rate.addEventListener('change', () => { store.set({ rate: +rate.value }); configureSpeech({ rate: +rate.value }); test(); });

    const sound = h('input', { type: 'checkbox', style: { width: '30px', height: '30px', accentColor: 'var(--purple)' } });
    sound.checked = d.sound;
    sound.addEventListener('change', () => { store.set({ sound: sound.checked }); setSoundEnabled(sound.checked); });

    const rest = h('select');
    [0, 10, 15, 20, 30, 45].forEach((v) => rest.append(h('option', { value: v }, v ? L(`${v} phút`, `${v} minutes`) : L('Tắt', 'Off'))));
    rest.value = String(d.restMinutes);
    rest.addEventListener('change', () => store.set({ restMinutes: +rest.value }));

    function test() {
      const n = (store.data.name || '').trim();
      say(L(`Xin chào${n ? ' ' + n : ''}! Mình cùng học nhé. Một, hai, ba, bốn, năm.`,
        `Hello${n ? ', ' + n : ''}! Let's learn together. One, two, three, four, five.`));
    }

    const voiceInfo = h('div');
    function renderVoiceInfo() {
      voiceInfo.innerHTML = '';
      const adv = voiceAdvice();
      const v = currentVoice();
      if (adv) {
        voiceInfo.append(h('div', { class: 'warn' },
          h('p', { style: { margin: 0 }, text: '⚠️ ' + adv.problem }),
          h('p', { style: { margin: '6px 0 0' }, text: adv.fix })));
      } else if (v) {
        voiceInfo.append(h('p', { style: { margin: 0 }, text: L(`✅ Đang dùng giọng: ${v.name}`, `✅ Current voice: ${v.name}`) }));
        if (/linh|samantha/i.test(v.name) && !/enhanced|premium|nâng cao|cao cấp/i.test(v.name)) {
          voiceInfo.append(h('p', { style: { ...muted, marginTop: '6px' }, text: L(
            'Mẹo: trên iPad vào Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói, tải bản “Nâng cao” của giọng này để nghe tự nhiên hơn.',
            'Tip: on iPad go to Settings → Accessibility → Spoken Content → Voices and download the “Enhanced” version (or “Ava”) for a more natural sound.') }));
        }
      }
    }
    renderVoiceInfo();
    const off = onVoicesChanged(() => { fillVoices(); renderVoiceInfo(); });
    const t = setTimeout(() => { fillVoices(); renderVoiceInfo(); }, 800);

    /* ----- Quà và sao ----- */
    const EMOJIS = ['🎡', '🧸', '🎠', '🎢', '🍦', '🧁', '🍕', '🎬', '🏊', '🏖️', '🚲', '🎨', '📚', '👗', '🦄', '🪆', '🎈', '🎁'];
    const giftBox = h('div');
    const rulesBox = h('div');
    const sumBox = h('p', { class: 'warn' });
    const balance = h('b');
    const drawSummary = () => {
      const self = maxSelfcarePerDay();
      const cap = +d.rules.dailyCap || 0;
      balance.textContent = `${d.stars} ⭐`;
      sumBox.textContent = cap
        ? L(`Với luật này, một ngày bé làm hết mọi việc sẽ được tối đa ${self + cap} ⭐ (tự lập ${self} ⭐ + học ${cap} ⭐), tức khoảng ${(self + cap) * 7} ⭐ mỗi tuần.`,
          `With these rules, a perfect day earns up to ${self + cap} ⭐ (own jobs ${self} ⭐ + learning ${cap} ⭐), about ${(self + cap) * 7} ⭐ a week.`)
        : L(`Tự lập tối đa ${self} ⭐ mỗi ngày. Sao học đang không giới hạn, nên bé có thể gom sao rất nhanh bằng cách chơi nhiều.`,
          `Own jobs earn up to ${self} ⭐ a day. Learning stars have no limit, so stars can pile up quickly through play.`);
    };
    const drawGifts = () => {
      giftBox.innerHTML = '';
      const per = maxPerDay();
      d.rewards.forEach((r, i) => {
        const emo = h('select', { class: 'emo-sel' }, [...new Set([r.emoji, ...EMOJIS])].map((e) => h('option', { value: e }, e)));
        emo.value = r.emoji;
        emo.addEventListener('change', () => { r.emoji = emo.value; store.save(); });
        const name = h('input', { type: 'text', value: rewardName(r), maxlength: 40 });
        name.addEventListener('change', () => { r.name = name.value.trim(); r.key = ''; store.save(); });
        const cost = h('input', { type: 'number', class: 'cost', min: 1, max: 9999, value: r.cost, inputmode: 'numeric' });
        cost.addEventListener('change', () => { r.cost = Math.min(9999, Math.max(1, Math.round(+cost.value) || 1)); store.save(); drawGifts(); });
        const del = h('button', { class: 'btn ghost small', onClick: () => {
          if (confirm(L('Xoá món quà này?', 'Delete this reward?'))) { d.rewards.splice(i, 1); store.save(); drawGifts(); }
        } }, '🗑️');
        const days = per === Infinity ? '' : L(`≈ ${Math.ceil(r.cost / per)} ngày nếu bé làm hết mọi việc`, `≈ ${Math.ceil(r.cost / per)} perfect days`);
        giftBox.append(h('div', { class: 'gift-row' }, emo, name, cost, h('span', { text: '⭐' }), del, h('span', { class: 'gift-est', text: days })));
      });
      giftBox.append(h('button', { class: 'btn pink small', onClick: () => {
        d.rewards.push({ id: 'r' + Date.now(), emoji: '🎁', key: '', name: L('Quà mới', 'New reward'), cost: 50 });
        store.save(); drawGifts();
      } }, L('➕ Thêm quà', '➕ Add a reward')));
    };
    const stepper = (get, set) => {
      const val = h('b', { class: 'step-val', text: get() });
      const mk = (delta, label) => h('button', { class: 'btn ghost small', onClick: () => {
        set(Math.min(10, Math.max(0, get() + delta))); val.textContent = get(); store.save(); drawSummary(); drawGifts();
      } }, label);
      return h('span', { class: 'stepper' }, mk(-1, '−'), val, mk(1, '+'));
    };
    const drawRules = () => {
      rulesBox.innerHTML = '';
      ruleRows().forEach(([key, emo, text]) => rulesBox.append(h('div', { class: 'rule-row' },
        h('span', { class: 'rule-emo', text: emo }), h('span', { class: 'rule-text', text }),
        stepper(() => +d.rules[key] || 0, (v) => { d.rules[key] = v; }), h('span', { text: '⭐' }))));
      const capSel = h('select');
      [0, 5, 10, 15, 20, 30, 50].forEach((v) => capSel.append(h('option', { value: v }, v ? `${v} ⭐` : L('Không giới hạn', 'No limit'))));
      capSel.value = String(d.rules.dailyCap);
      capSel.addEventListener('change', () => { d.rules.dailyCap = +capSel.value; store.save(); drawSummary(); drawGifts(); });
      rulesBox.append(h('div', { class: 'rule-row' },
        h('span', { class: 'rule-emo', text: '🌙' }),
        h('span', { class: 'rule-text', text: L('Sao HỌC tối đa mỗi ngày (bài học, tô chữ, kỹ năng). Sao tự lập không bị giới hạn.', 'Most LEARNING stars per day (lessons, tracing, skills). Stars for own jobs are never limited.') }),
        capSel));
    };
    const adj = h('input', { type: 'number', class: 'cost', min: 1, max: 999, value: 5, inputmode: 'numeric' });
    const adjust = (sign) => { adjustStars(sign * Math.max(1, Math.round(+adj.value) || 1)); updateStars(true); drawSummary(); };
    drawGifts(); drawRules(); drawSummary();

    const stat = (num, label) => h('div', { class: 'stat' }, h('b', { text: num }), h('span', { text: label }));
    const traced = (set) => `${SETS()[set].chars.filter((c) => starsOf(set, c)).length}/${SETS()[set].chars.length}`;

    root.append(h('div', { class: 'parents' },
      h('div', { class: 'box' },
        h('h3', { text: L('🌐 Ngôn ngữ', '🌐 Language') }),
        langBtns,
        h('p', { style: { ...muted, marginTop: '10px' }, text: L('Đổi ngôn ngữ sẽ đổi cả chữ trên màn hình và giọng đọc.', 'Changing the language changes both the on-screen text and the voice.') })),

      h('div', { class: 'box' },
        h('h3', { text: L('👧 Thông tin bé', '👧 About your child') }),
        h('div', { class: 'field' }, h('label', { text: L('Tên gọi ở nhà', 'Nickname') }), nameInput),
        h('p', { style: muted, text: L('Bạn Thỏ sẽ gọi tên bé khi khen.', 'Bunny will say your child’s name when praising.') })),

      h('div', { class: 'box' },
        h('h3', { text: L('🎁 Quà của bé', '🎁 Rewards') }),
        h('p', { style: muted, text: L('Bé gom sao để đổi quà. Ba mẹ đặt tên quà và số sao cần có. Khi bé bấm Đổi quà, ba mẹ giữ nút 2 giây để đồng ý rồi sao mới bị trừ.',
          'Your child saves stars for rewards. Set each reward and its price. When she taps Get it, a parent holds a button for 2 seconds to agree before the stars are spent.') }),
        giftBox),

      h('div', { class: 'box' },
        h('h3', { text: L('⭐ Luật nhận sao', '⭐ Star rules') }),
        rulesBox,
        sumBox,
        h('div', { class: 'field' },
          h('label', null, L('Bé đang có ', 'Current stars: '), balance), adj,
          h('button', { class: 'btn green small', onClick: () => adjust(1) }, L('➕ Thưởng thêm', '➕ Give bonus')),
          h('button', { class: 'btn ghost small', onClick: () => adjust(-1) }, L('➖ Trừ bớt', '➖ Take away'))),
        h('p', { style: muted, text: L('Dùng “Thưởng thêm” khi bé làm việc tốt ngoài ứng dụng (ví dụ: giúp ba mẹ dọn nhà).', 'Use “Give bonus” for good deeds outside the app (for example, helping around the house).') })),

      h('div', { class: 'box' },
        h('h3', { text: L('🔊 Giọng nói hướng dẫn', '🔊 Voice') }),
        voiceInfo,
        h('div', { class: 'field' }, h('label', { text: L('Giọng đọc', 'Voice') }), voiceSel),
        h('div', { class: 'field' }, h('label', { text: L('Tốc độ đọc', 'Speed') }), rate, rateLbl),
        h('div', { class: 'field' }, h('label', { text: L('Âm thanh hiệu ứng', 'Sound effects') }), sound),
        h('button', { class: 'btn purple', onClick: test }, L('▶️ Nghe thử', '▶️ Test voice'))),

      h('div', { class: 'box' },
        h('h3', { text: L('⏰ Nhắc nghỉ ngơi', '⏰ Break reminder') }),
        h('div', { class: 'field' }, h('label', { text: L('Nhắc bé nghỉ sau', 'Remind after') }), rest),
        h('p', { style: muted, text: L('Khi đến giờ, ứng dụng sẽ nhắc bé nghỉ mắt 1 phút rồi mới chơi tiếp.', 'When time is up, the app asks your child to rest her eyes for 1 minute before playing again.') })),

      h('div', { class: 'box' },
        h('h3', { text: L('📈 Tiến độ của bé', '📈 Progress') }),
        h('div', { class: 'stat-grid' },
          stat(d.stars, L('⭐ Sao đang có', '⭐ Stars now')),
          stat(d.earned, L('🌟 Tổng sao đã nhận', '🌟 Stars earned in all')),
          stat(d.redeemed.length, L('🎁 Quà đã đổi', '🎁 Rewards redeemed')),
          stat(`${unlockedCount()}/${STICKERS.length}`, L('🎁 Nhãn dán', '🎁 Stickers')),
          stat(traced('lower'), '✏️ ' + SETS().lower.title),
          stat(traced('upper'), '✏️ ' + SETS().upper.title),
          stat(traced('digits'), '✏️ ' + SETS().digits.title),
          stat(d.stats.count, L('🔢 Câu đếm đúng', '🔢 Counting answers')),
          stat(d.stats.math || 0, L('🧮 Phép tính đúng', '🧮 Math answers')),
          stat(d.stats.explore || 0, L('🌈 Câu khám phá đúng', '🌈 Explore answers')),
          stat(d.stats.selfcare, L('👧 Việc tự lập', '👧 Jobs done')),
          ...Object.keys(ROUTINES()).map((k) => stat(`${routineCount(k)}/${ROUTINES()[k].tasks.length}`, `${ROUTINES()[k].emoji} ${ROUTINES()[k].title} ${L('hôm nay', 'today')}`)))),

      h('div', { class: 'box' },
        h('h3', { text: L('📱 Cài lên màn hình chính iPad', '📱 Add to the iPad Home Screen') }),
        h('ol', null, L([
          'Mở trang này bằng Safari.',
          'Bấm nút Chia sẻ (ô vuông có mũi tên lên) → “Thêm vào MH chính”.',
          'Mở ứng dụng “Bé Vui Học” từ màn hình chính – chạy toàn màn hình và dùng được khi không có mạng.',
          'Mẹo: bật Truy cập được hướng dẫn (Cài đặt → Trợ năng) để khoá bé trong ứng dụng.',
        ], [
          'Open this page in Safari.',
          'Tap the Share button (the square with an arrow) → “Add to Home Screen”.',
          'Open “Bé Vui Học” from the Home Screen. It runs full screen and works offline.',
          'Tip: turn on Guided Access (Settings → Accessibility) to keep your child inside the app.',
        ]).map((text) => h('li', { text })))),

      h('div', { class: 'box' },
        h('h3', { text: L('♻️ Đặt lại', '♻️ Reset') }),
        h('button', {
          class: 'btn red', onClick: () => {
            if (confirm(L('Xoá toàn bộ sao, nhãn dán và tiến độ của bé?', 'Delete all stars, stickers and progress?'))) {
              resetProgress(); updateStars(); go('parents');
            }
          },
        }, L('🗑️ Xoá tiến độ', '🗑️ Delete progress')))));

    return () => { clearTimeout(t); off(); };
  },
});
