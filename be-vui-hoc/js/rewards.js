// ĐỔI QUÀ – bé gom sao để đổi quà do ba mẹ đặt (đi khu vui chơi, mua đồ chơi…)
import { register, go, h, say, overlay, confetti, updateStars, holdToActivate } from './ui.js';
import { sfx } from './sound.js';
import { store, redeem } from './store.js';
import { choreName } from './selfcare.js';
import { L } from './i18n.js';
import { ROUTINES } from './selfcare.js';

const THEME = 'var(--yellow)';

/** Tên quà: tên ba mẹ đặt, hoặc tên mẫu theo ngôn ngữ. */
export function rewardName(r) {
  if (r.name && r.name.trim()) return r.name.trim();
  if (r.key === 'park') return L('Đi khu vui chơi cuối tuần', 'A weekend trip to the playground');
  if (r.key === 'toy') return L('Mua một món đồ chơi', 'A new toy');
  return L('Quà', 'Reward');
}

/** Bảng luật nhận sao (dùng cho cả bé và Góc ba mẹ). */
export function ruleRows() {
  const r = store.data.rules;
  return [
    ['task', '👧', L('Ngày đi học: tự làm xong 1 việc (sáng hoặc tối)', 'School day: do 1 job by yourself (morning or evening)'), r.task],
    ['routine', '🏅', L('Làm hết 5 việc của 1 buổi', 'Finish all 5 jobs of the morning or the evening'), r.routine],
    ['exercise', '📝', L('Làm xong 1 bài tập hôm nay', "Finish 1 of today's exercises"), r.exercise],
    ['allDone', '🎓', L('Làm hết bài tập hôm nay', "Finish all of today's exercises"), r.allDone],
  ];
}

/** Số sao tự lập tối đa mỗi ngày theo luật hiện tại. */
export function maxSelfcarePerDay() {
  const r = store.data.rules;
  const R = ROUTINES();
  return Object.values(R).reduce((sum, x) => sum + x.tasks.length * r.task + r.routine, 0);
}
register('rewards', {
  title: () => L('Đổi quà', 'Rewards'), parent: 'home', theme: THEME,
  render(root) {
    const d = store.data;
    const stars = d.stars;
    const list = d.rewards.filter((r) => r.cost > 0);

    const cards = list.map((r) => {
      const name = rewardName(r);
      const enough = stars >= r.cost;
      const missing = r.cost - stars;
      const bar = h('i');
      requestAnimationFrame(() => { bar.style.width = Math.min(100, 100 * stars / r.cost) + '%'; });
      const tell = () => say(enough
        ? L(`${name} cần ${r.cost} sao. Con đã đủ sao rồi! Con bấm Đổi quà rồi gọi ba mẹ nhé.`, `${name} costs ${r.cost} stars. You have enough stars! Tap Get it and call Mom or Dad.`)
        : L(`${name} cần ${r.cost} sao. Con còn thiếu ${missing} sao nữa. Cố lên!`, `${name} costs ${r.cost} stars. You need ${missing} more. Keep going!`));
      return h('div', { class: 'reward' + (enough ? ' ready' : ''), onClick: tell },
        h('div', { class: 'r-emo', text: r.emoji }),
        h('div', { class: 'r-main' },
          h('div', { class: 'r-name', text: name }),
          h('div', { class: 'progress-bar' }, bar),
          h('div', { class: 'r-sub', text: enough ? L(`Đủ sao rồi! (${r.cost} ⭐)`, `You have enough! (${r.cost} ⭐)`) : L(`${stars}/${r.cost} ⭐ · còn thiếu ${missing} ⭐`, `${stars}/${r.cost} ⭐ · ${missing} ⭐ to go`) })),
        enough ? h('button', { class: 'btn pink pulse', onClick: (e) => { e.stopPropagation(); askRedeem(r); } }, L('🎉 Đổi quà', '🎉 Get it')) : null);
    });

    const choreRows = d.chores.filter((c) => c.stars > 0).map((c) => [c.id, c.emoji, L(`Ba mẹ nhờ: ${choreName(c)}`, `When Mom or Dad asks: ${choreName(c)}`), c.stars]);
    const allRules = [...ruleRows().slice(0, 2), ...choreRows, ...ruleRows().slice(2)].filter((x) => x[3] > 0);
    const rules = allRules.map(([, emo, text, n]) =>
      h('li', null, h('span', { class: 'rule-emo', text: emo }), h('span', { class: 'rule-text', text }), h('b', { text: `+${n} ⭐` })));
    const hwNote = L(`Mỗi ngày có ${d.hw.count} bài tập. Chơi thêm ngoài bài tập thì không tính sao.`, `There are ${d.hw.count} exercises each day. Extra play earns no stars.`);
    const readRules = () => say(allRules.map(([, , text, n]) => L(`${text}: được ${n} sao.`, `${text}: ${n} ${n === 1 ? 'star' : 'stars'}.`)).join(' ') + ' ' + hwNote);

    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: L('🎁 Đổi quà', '🎁 Rewards') }),
          h('p', { text: L(`Con đang có ${stars} ⭐`, `You have ${stars} ⭐`) })),
        h('button', { class: 'btn yellow', onClick: () => go('stickers') }, L('🦄 Nhãn dán', '🦄 Stickers'))),
      list.length ? h('div', { class: 'rewards' }, cards)
        : h('p', { class: 'warn', text: L('Ba mẹ chưa đặt quà. Ba mẹ vào Góc ba mẹ để thêm quà nhé.', 'No rewards yet. Parents can add rewards in the For parents area.') }),

      h('div', { class: 'box rules-box' },
        h('h3', { text: L('⭐ Làm gì thì được sao?', '⭐ How do I earn stars?') }),
        h('ul', { class: 'rules' }, rules),
        h('p', { class: 'r-sub', text: hwNote }),
        h('button', { class: 'btn ghost small', onClick: readRules }, L('🔊 Nghe đọc', '🔊 Read aloud'))),

      d.redeemed.length ? h('div', { class: 'box' },
        h('h3', { text: L('🎀 Quà con đã đổi', '🎀 Rewards you got') }),
        h('ul', { class: 'rules' }, d.redeemed.slice(0, 10).map((x) =>
          h('li', null, h('span', { class: 'rule-emo', text: x.emoji }), h('span', { class: 'rule-text', text: `${x.name} · ${x.date.split('-').reverse().join('/')}` }), h('b', { text: `−${x.cost} ⭐` }))))) : null));

    const best = list.slice().sort((a, b) => a.cost - b.cost);
    const ready = best.find((r) => stars >= r.cost);
    const next = best.find((r) => stars < r.cost);
    if (ready) say(L(`Con có ${stars} sao. Con đã đủ sao để đổi quà: ${rewardName(ready)}!`, `You have ${stars} stars. That is enough for a reward: ${rewardName(ready)}!`));
    else if (next) say(L(`Con có ${stars} sao. Còn ${next.cost - stars} sao nữa là con đổi được quà: ${rewardName(next)}.`, `You have ${stars} stars. Only ${next.cost - stars} more for a reward: ${rewardName(next)}.`));
    else say(L(`Con có ${stars} sao.`, `You have ${stars} stars.`));

    /** Hỏi ba mẹ xác nhận (giữ nút 2 giây) rồi mới trừ sao. */
    function askRedeem(r) {
      const name = rewardName(r);
      overlay((close) => {
        const ok = h('button', { class: 'btn big green hold-ring' }, L('👨‍👩‍👧 Ba mẹ giữ 2 giây để đồng ý', '👨‍👩‍👧 Parents: hold 2 seconds to agree'));
        holdToActivate(ok, 2000, () => {
          if (!redeem(r, name)) { close(); return; }
          close(true);
        }, () => say(L('Ba mẹ giữ nút này hai giây để đồng ý đổi quà nhé.', 'Mom or Dad, hold this button for two seconds to agree.')));
        return [
          h('div', { class: 'emo', text: r.emoji }),
          h('h2', { text: name }),
          h('p', { text: L(`Đổi quà này sẽ dùng ${r.cost} ⭐. Con gọi ba mẹ nhé!`, `This reward uses ${r.cost} ⭐. Call Mom or Dad!`) }),
          h('div', { class: 'row', style: { flexDirection: 'column', alignItems: 'center' } }, ok,
            h('button', { class: 'btn ghost', onClick: () => close() }, L('Để sau', 'Not now'))),
        ];
      }, () => say(L(`Con muốn đổi quà: ${name}. Con gọi ba mẹ đến xem nhé!`, `You want this reward: ${name}. Call Mom or Dad to come and see!`)))
        .then((done) => {
          if (!done) return;
          updateStars(true);
          go('rewards');
          confetti(70);
          sfx.fanfare();
          say(L(`Chúc mừng con! Con đã đổi được quà: ${name}. Con giỏi lắm!`, `Congratulations! You got your reward: ${name}. You worked so hard!`));
        });
    }
  },
});
