// GÓC BA MẸ – ngôn ngữ, giọng đọc, tên bé, giờ nghỉ, xem tiến độ
import { register, go, h, say, updateStars } from './ui.js';
import { store, resetProgress, unlockedCount, STICKERS, adjustStars, todaysAsks, toggleAsk, isSchoolDay, setTodaySchool } from './store.js';
import { EXERCISES, exerciseName, exerciseCount, maxHomework } from './homework.js';
import { rewardName, ruleRows, maxPerWeek } from './rewards.js';
import { L, lang, setLang } from './i18n.js';
import { ROUTINES, routineCount, choreName, maxSelfcare } from './selfcare.js';
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
      const days = d.schoolDays.length;
      const [s1, h1, s2, h2] = [maxSelfcare('school'), maxHomework(true), maxSelfcare('off'), maxHomework(false)];
      balance.textContent = `${d.stars} ⭐`;
      sumBox.textContent = L(
        `Với luật này: một ngày đi học hoàn hảo được ${s1 + h1} ⭐ (tự lập ${s1} + bài tập ${h1}). Một ngày nghỉ hoàn hảo được ${s2 + h2} ⭐ (tự lập ${s2} + bài tập ${h2}). Một tuần hoàn hảo (${days} ngày đi học, ${7 - days} ngày nghỉ): ${maxPerWeek()} ⭐, chưa tính việc ba mẹ giao thêm.`,
        `With these rules: a perfect school day earns ${s1 + h1} ⭐ (own jobs ${s1} + exercises ${h1}). A perfect day off earns ${s2 + h2} ⭐ (own jobs ${s2} + exercises ${h2}). A perfect week (${days} school days, ${7 - days} days off): ${maxPerWeek()} ⭐, not counting extra jobs you assign.`);
    };
    const drawGifts = () => {
      giftBox.innerHTML = '';
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
        const week = maxPerWeek();
        const days = week > 0 ? L(`≈ ${(r.cost / week).toFixed(1).replace('.0', '')} tuần hoàn hảo`, `≈ ${(r.cost / week).toFixed(1).replace('.0', '')} perfect weeks`) : '';
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
    };
    // Ngày đi học
    const DAY_NAMES = L(['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    const dayChips = h('div', { class: 'chips' });
    const drawDays = () => {
      dayChips.innerHTML = '';
      [1, 2, 3, 4, 5, 6, 0].forEach((k) => dayChips.append(h('button', { class: 'chip' + (d.schoolDays.includes(k) ? ' on' : ''), onClick: () => {
        d.schoolDays = d.schoolDays.includes(k) ? d.schoolDays.filter((x) => x !== k) : [...d.schoolDays, k];
        store.save(); drawDays(); drawSummary();
      } }, DAY_NAMES[k])));
    };
    drawDays();

    // Hôm nay là ngày đi học hay ngày nghỉ (ba mẹ đổi riêng cho hôm nay)
    const todayChips = h('div', { class: 'chips' });
    const drawToday = () => {
      todayChips.innerHTML = '';
      const school = isSchoolDay();
      [[true, L('🏫 Ngày đi học', '🏫 School day')], [false, L('🎈 Ngày nghỉ', '🎈 Day off')]].forEach(([v, label]) =>
        todayChips.append(h('button', { class: 'chip big' + (school === v ? ' on' : ''), onClick: () => { setTodaySchool(v); go('parents'); } }, label)));
    };
    drawToday();

    // Bài tập hôm nay: số bài mỗi ngày và các loại bài
    const hwCount = h('select');
    [0, 1, 2, 3, 4, 5].forEach((v) => hwCount.append(h('option', { value: v }, v ? L(`${v} bài`, `${v}`) : L('Không có bài tập', 'None'))));
    hwCount.value = String(d.hw.count);
    hwCount.addEventListener('change', () => { d.hw.count = +hwCount.value; store.save(); drawSummary(); drawGifts(); });
    const hwMins = h('select');
    [3, 5, 10, 15, 20].forEach((v) => hwMins.append(h('option', { value: v }, L(`${v} phút`, `${v} minutes`))));
    if (![3, 5, 10, 15, 20].includes(+d.hw.minutes)) hwMins.append(h('option', { value: d.hw.minutes }, L(`${d.hw.minutes} phút`, `${d.hw.minutes} minutes`)));
    hwMins.value = String(d.hw.minutes || 10);
    hwMins.addEventListener('change', () => { d.hw.minutes = +hwMins.value; store.save(); });
    const hwMult = h('select');
    [1, 2, 3].forEach((v) => hwMult.append(h('option', { value: v }, v === 1 ? L('Bằng ngày đi học', 'Same as school days') : L(`Gấp ${v} lần`, `${v} times as many`))));
    hwMult.value = String(d.hw.offMult || 2);
    hwMult.addEventListener('change', () => { d.hw.offMult = +hwMult.value; store.save(); drawSummary(); drawGifts(); });
    const hwTypes = h('div', { class: 'chips' });
    const drawTypes = () => {
      hwTypes.innerHTML = '';
      EXERCISES.forEach((x) => hwTypes.append(h('button', { class: 'chip' + (d.hw.off.includes(x.id) ? '' : ' on'), onClick: () => {
        d.hw.off = d.hw.off.includes(x.id) ? d.hw.off.filter((k) => k !== x.id) : [...d.hw.off, x.id];
        store.save(); drawTypes(); drawSummary(); drawGifts();
      } }, `${x.e} ${exerciseName(x)}`)));
    };
    drawTypes();

    // Việc ba mẹ giao thêm (phơi đồ, gấp đồ…)
    const choreBox = h('div');
    const drawChores = () => {
      choreBox.innerHTML = '';
      const asked = todaysAsks();
      d.chores.forEach((c, i) => {
        const on = asked.includes(c.id);
        const emo = h('select', { class: 'emo-sel' }, [...new Set([c.emoji, '👕', '🧺', '🧹', '🍽️', '🪴', '🐶', '🛏️', '🧽', '📚', '⭐'])].map((e) => h('option', { value: e }, e)));
        emo.value = c.emoji;
        emo.addEventListener('change', () => { c.emoji = emo.value; store.save(); });
        const name = h('input', { type: 'text', value: choreName(c), maxlength: 40 });
        name.addEventListener('change', () => { c.name = name.value.trim(); c.key = ''; store.save(); });
        const give = h('button', { class: 'btn small ' + (on ? 'green' : 'ghost'), onClick: () => { toggleAsk(c.id); drawChores(); } },
          on ? L('✅ Đã giao hôm nay', '✅ Assigned today') : L('Giao hôm nay', 'Assign today'));
        const del = h('button', { class: 'btn ghost small', onClick: () => {
          if (confirm(L('Xoá việc này?', 'Delete this job?'))) { d.chores.splice(i, 1); store.save(); drawChores(); }
        } }, '🗑️');
        choreBox.append(h('div', { class: 'gift-row' }, emo, name,
          stepper(() => +c.stars || 0, (v) => { c.stars = v; }), h('span', { text: '⭐' }), give, del));
      });
      choreBox.append(h('button', { class: 'btn pink small', onClick: () => {
        d.chores.push({ id: 'c' + Date.now(), emoji: '⭐', key: '', name: L('Việc mới', 'New job'), stars: 2 });
        store.save(); drawChores();
      } }, L('➕ Thêm việc', '➕ Add a job')));
    };
    drawChores();

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
        h('h3', { text: L('📅 Hôm nay', '📅 Today') }),
        todayChips,
        h('p', { style: { ...muted, marginTop: '10px' }, text: L('Nếu hôm nay bé được nghỉ (lễ, ốm…), ba mẹ bấm “Ngày nghỉ”: app chuyển sang lịch ngày nghỉ (3 bữa ăn, 3 cữ sữa, gấp đôi bài tập). Chỉ áp dụng cho hôm nay, mai tự trở về lịch tuần.',
          'If there is no school today (holiday, sick day…), tap “Day off”: the app switches to the day-off schedule (3 meals, 3 milk times, twice the exercises). This applies to today only; tomorrow follows the weekly schedule again.') })),

      h('div', { class: 'box' },
        h('h3', { text: L('📋 Giao việc thêm hôm nay', '📋 Assign extra jobs today') }),
        h('p', { style: muted, text: L('Hôm nào có việc (phơi đồ, gấp đồ…), ba mẹ bấm “Giao hôm nay”. Việc sẽ hiện trong Bé Tự Lập của bé đến hết ngày. Bé làm xong thì được số sao ba mẹ đặt.',
          'On days when there is an extra job (hanging or folding laundry…), tap “Assign today”. It appears under I Can Do It until the end of the day and earns the stars you set.') }),
        choreBox),

      h('div', { class: 'box' },
        h('h3', { text: L('🎁 Quà của bé', '🎁 Rewards') }),
        h('p', { style: muted, text: L('Bé gom sao để đổi quà. Ba mẹ đặt tên quà và số sao cần có. Khi bé bấm Đổi quà, ba mẹ giữ nút 2 giây để đồng ý rồi sao mới bị trừ.',
          'Your child saves stars for rewards. Set each reward and its price. When she taps Get it, a parent holds a button for 2 seconds to agree before the stars are spent.') }),
        giftBox),

      h('div', { class: 'box' },
        h('h3', { text: L('⭐ Luật nhận sao', '⭐ Star rules') }),
        h('div', { class: 'rule-row' }, h('span', { class: 'rule-emo', text: '🏫' }), h('span', { class: 'rule-text', text: L('Ngày đi học trong tuần (các ngày còn lại dùng lịch ngày nghỉ)', 'School days of the week (other days use the day-off schedule)') })),
        dayChips,
        rulesBox,
        h('div', { class: 'rule-row' }, h('span', { class: 'rule-emo', text: '📝' }),
          h('span', { class: 'rule-text', text: L('Số bài tập mỗi ngày đi học. Chơi thêm ngoài bài tập không tính sao.', 'Exercises per school day. Extra play earns no stars.') }), hwCount),
        h('div', { class: 'rule-row' }, h('span', { class: 'rule-emo', text: '⏱️' }),
          h('span', { class: 'rule-text', text: L('Mỗi bài bé phải làm trong bao lâu (đồng hồ chỉ chạy khi bé đang làm, ngồi không quá 45 giây thì tạm dừng)',
            'How long each exercise takes (the clock only runs while your child is working; it pauses after 45 idle seconds)') }), hwMins),
        h('div', { class: 'rule-row' }, h('span', { class: 'rule-emo', text: '🎈' }),
          h('span', { class: 'rule-text', text: L('Số bài tập vào ngày nghỉ', 'Exercises on days off') }), hwMult),
        h('p', { style: muted, text: L('Các loại bài được đưa vào bài tập (bấm để bật hoặc tắt):', 'Exercise types to include (tap to turn on or off):') }),
        hwTypes,
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
          stat(`${d.homework && d.homework.date ? d.homework.done.length : 0}/${exerciseCount()}`, L('📝 Bài tập hôm nay', "📝 Today's exercises")),
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
