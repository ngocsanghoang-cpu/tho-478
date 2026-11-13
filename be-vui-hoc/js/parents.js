// GÓC BỐ MẸ – cài đặt giọng đọc, tên bé, giờ nghỉ, xem tiến độ
import { register, go, h, say, updateStars } from './ui.js';
import { store, resetProgress, unlockedCount, STICKERS } from './store.js';
import { ROUTINES, routineCount } from './selfcare.js';
import { getVoices, hasVietnamese, configureSpeech, speechSupported, currentVoice } from './speech.js';
import { setSoundEnabled } from './sound.js';

register('parents', {
  title: 'Góc ba mẹ', parent: 'home', theme: 'var(--purple)',
  render(root) {
    const d = store.data;
    const letters = Object.keys(d.letters);
    const count = (prefix) => letters.filter((k) => k.startsWith(prefix + ':')).length;

    // Tên bé
    const nameInput = h('input', { type: 'text', value: d.name, placeholder: 'Ví dụ: Bin, Na, Su…', maxlength: 20 });
    nameInput.addEventListener('change', () => store.set({ name: nameInput.value.trim() }));

    // Giọng đọc
    const voiceSel = h('select');
    const fillVoices = () => {
      const vs = getVoices();
      const vi = vs.filter((v) => /^vi/i.test(v.lang));
      const other = vs.filter((v) => !/^vi/i.test(v.lang));
      voiceSel.innerHTML = '';
      voiceSel.append(h('option', { value: '' }, 'Tự động (ưu tiên tiếng Việt)'));
      vi.forEach((v) => voiceSel.append(h('option', { value: v.voiceURI }, `🇻🇳 ${v.name}`)));
      other.forEach((v) => voiceSel.append(h('option', { value: v.voiceURI }, `${v.name} (${v.lang})`)));
      voiceSel.value = d.voiceURI || '';
    };
    fillVoices();
    voiceSel.addEventListener('change', () => { store.set({ voiceURI: voiceSel.value }); configureSpeech({ voiceURI: voiceSel.value }); test(); });

    const rate = h('input', { type: 'range', min: 0.6, max: 1.3, step: 0.05, value: d.rate });
    const rateLbl = h('b', { text: Number(d.rate).toFixed(2) + '×' });
    rate.addEventListener('input', () => { rateLbl.textContent = Number(rate.value).toFixed(2) + '×'; });
    rate.addEventListener('change', () => { store.set({ rate: +rate.value }); configureSpeech({ rate: +rate.value }); test(); });

    const sound = h('input', { type: 'checkbox', style: { width: '30px', height: '30px', accentColor: 'var(--purple)' } });
    sound.checked = d.sound;
    sound.addEventListener('change', () => { store.set({ sound: sound.checked }); setSoundEnabled(sound.checked); });

    const rest = h('select');
    [[0, 'Tắt'], [10, '10 phút'], [15, '15 phút'], [20, '20 phút'], [30, '30 phút'], [45, '45 phút']].forEach(([v, t]) => rest.append(h('option', { value: v }, t)));
    rest.value = String(d.restMinutes);
    rest.addEventListener('change', () => store.set({ restMinutes: +rest.value }));

    function test() {
      const n = (store.data.name || '').trim();
      say(`Xin chào${n ? ' ' + n : ''}! Mình cùng học nhé. Một, hai, ba, bốn, năm.`);
    }

    const voiceInfo = h('div');
    const renderVoiceInfo = () => {
      voiceInfo.innerHTML = '';
      if (!speechSupported()) {
        voiceInfo.append(h('p', { class: 'warn', text: '⚠️ Trình duyệt này không hỗ trợ đọc giọng nói. Hãy mở bằng Safari trên iPad.' }));
      } else if (!hasVietnamese()) {
        voiceInfo.append(h('div', { class: 'warn' },
          h('p', { style: { margin: 0 }, text: '⚠️ Chưa tìm thấy giọng tiếng Việt. Trên iPad hãy vào:' }),
          h('p', { style: { margin: '6px 0 0' }, text: 'Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt → tải giọng “Linh” (nên chọn bản Nâng cao). Sau đó đóng hẳn ứng dụng và mở lại.' })));
      } else {
        const v = currentVoice();
        voiceInfo.append(h('p', { style: { margin: 0 }, text: `✅ Đang dùng giọng: ${v ? v.name : 'mặc định'}` }));
      }
    };
    renderVoiceInfo();
    const t = setTimeout(() => { fillVoices(); renderVoiceInfo(); }, 800);

    const stat = (num, label) => h('div', { class: 'stat' }, h('b', { text: num }), h('span', { text: label }));

    root.append(h('div', { class: 'parents' },
      h('div', { class: 'box' },
        h('h3', { text: '👶 Thông tin bé' }),
        h('div', { class: 'field' }, h('label', { text: 'Tên gọi ở nhà' }), nameInput),
        h('p', { style: { margin: 0, fontSize: '16px', color: 'var(--muted)' }, text: 'Cú Mèo sẽ gọi tên bé khi khen.' })),

      h('div', { class: 'box' },
        h('h3', { text: '🔊 Giọng nói hướng dẫn' }),
        voiceInfo,
        h('div', { class: 'field' }, h('label', { text: 'Giọng đọc' }), voiceSel),
        h('div', { class: 'field' }, h('label', { text: 'Tốc độ đọc' }), rate, rateLbl),
        h('div', { class: 'field' }, h('label', { text: 'Âm thanh hiệu ứng' }), sound),
        h('button', { class: 'btn purple', onClick: test }, '▶️ Nghe thử')),

      h('div', { class: 'box' },
        h('h3', { text: '⏰ Nhắc nghỉ ngơi' }),
        h('div', { class: 'field' }, h('label', { text: 'Nhắc bé nghỉ sau' }), rest),
        h('p', { style: { margin: 0, fontSize: '16px', color: 'var(--muted)' }, text: 'Khi đến giờ, ứng dụng sẽ nhắc bé nghỉ mắt 1 phút rồi mới chơi tiếp.' })),

      h('div', { class: 'box' },
        h('h3', { text: '📈 Tiến độ của bé' }),
        h('div', { class: 'stat-grid' },
          stat(d.stars, '⭐ Tổng số sao'),
          stat(`${unlockedCount()}/${STICKERS.length}`, '🎁 Nhãn dán'),
          stat(`${count('lower')}/29`, '✏️ Chữ thường'),
          stat(`${count('upper')}/29`, '✏️ Chữ hoa'),
          stat(`${count('digits')}/10`, '✏️ Chữ số'),
          stat(d.stats.count, '🔢 Câu đếm đúng'),
          stat(d.stats.selfcare, '🧒 Việc tự lập'),
          ...Object.keys(ROUTINES).map((k) => stat(`${routineCount(k)}/${ROUTINES[k].tasks.length}`, `${ROUTINES[k].emoji} ${ROUTINES[k].title} hôm nay`)))),

      h('div', { class: 'box' },
        h('h3', { text: '📱 Cài lên màn hình chính iPad' }),
        h('ol', null,
          h('li', { text: 'Mở trang này bằng Safari.' }),
          h('li', { text: 'Bấm nút Chia sẻ (ô vuông có mũi tên lên) → “Thêm vào MH chính”.' }),
          h('li', { text: 'Mở ứng dụng “Bé Vui Học” từ màn hình chính – chạy toàn màn hình và dùng được khi không có mạng.' }),
          h('li', { text: 'Mẹo: bật Truy cập được hướng dẫn (Cài đặt → Trợ năng) để khoá bé trong ứng dụng.' }))),

      h('div', { class: 'box' },
        h('h3', { text: '♻️ Đặt lại' }),
        h('button', {
          class: 'btn red', onClick: () => {
            if (confirm('Xoá toàn bộ sao, nhãn dán và tiến độ của bé?')) {
              resetProgress(); updateStars(); go('parents');
            }
          },
        }, '🗑️ Xoá tiến độ'))));

    return () => clearTimeout(t);
  },
});
