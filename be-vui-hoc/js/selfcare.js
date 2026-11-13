// BÉ TỰ LẬP – việc buổi sáng/chiều/tối, hướng dẫn từng bước, trò chơi dọn đồ chơi
// Ghi chú: các chuỗi dùng L(tiếng Việt, tiếng Anh); dữ liệu bọc trong byLang() để đổi ngôn ngữ được ngay.
import { register, go, h, say, live, sleep, award, praise, celebrate, menuCard, progressDots, shuffle, rand, toast } from './ui.js';
import { sfx } from './sound.js';
import { routineDone, markRoutine } from './store.js';
import { L, byLang } from './i18n.js';
import { numWord } from './vi.js';

const THEME = 'var(--pink)';
const tapDone = () => L(' Làm xong mỗi bước thì bấm nút Xong rồi.', ' Tap Done after each step.');
const step = (n, text) => L(`Bước ${numWord(n)}. ${text}.`, `Step ${numWord(n)}. ${text}.`);

/* ---------------- Dữ liệu ---------------- */
export const ROUTINES = byLang(() => ({
  morning: {
    title: L('Buổi sáng', 'Morning'), emoji: '☀️', color: 'yellow',
    intro: L('Chào buổi sáng! Con dậy rồi, mình cùng tự làm các việc buổi sáng nhé. Con chạm vào từng việc để nghe hướng dẫn.',
      "Good morning! You are awake. Let's do our morning jobs all by ourselves. Tap each job to hear what to do."),
    tasks: [
      { id: 'toilet', e: '🚽', t: L('Tự đi vệ sinh', 'Use the toilet'),
        say: L('Ngủ dậy rồi, con tự đi vệ sinh nhé.', 'You are up! Go to the toilet all by yourself.'),
        steps: L(['Tự đi vào nhà vệ sinh', 'Đi vệ sinh xong nhớ xả nước', 'Rửa tay bằng xà phòng cho sạch'],
          ['Walk to the bathroom by yourself', 'Flush the toilet when you finish', 'Wash your hands with soap']) },
      { id: 'face', e: '💦', t: L('Tự rửa mặt', 'Wash my face'),
        say: L('Con tự rửa mặt cho sạch sẽ, tỉnh táo nhé.', 'Wash your face so you feel fresh and awake.'),
        steps: L(['Vốc nước sạch lên mặt', 'Xoa nhẹ trán, hai má, mũi và cằm', 'Lau khô bằng khăn của con'],
          ['Splash clean water on your face', 'Gently rub your forehead, cheeks, nose and chin', 'Dry your face with your own towel']) },
      { id: 'undress', e: '👚', t: L('Tự cởi đồ ngủ', 'Take off pajamas'), guide: 'undress' },
      { id: 'dress', e: '👗', t: L('Tự mặc đồ mới', 'Put on clean clothes'), guide: 'dress' },
      { id: 'hair', e: '🎀', t: L('Nhờ ba mẹ làm tóc', 'Ask Mom or Dad to do my hair'),
        say: L('Con mang lược đến nhờ ba mẹ làm tóc nhé. Nhớ nói lời nhờ thật lễ phép.', 'Bring your comb and ask Mom or Dad to do your hair. Remember to ask nicely.'),
        steps: L(['Mang lược và dây buộc tóc đến cho ba mẹ', 'Nói: Ba mẹ ơi, làm tóc giúp con với ạ!', 'Ngồi yên để ba mẹ chải tóc', 'Nói: Con cảm ơn ba mẹ ạ!'],
          ['Bring the comb and hair ties to Mom or Dad', 'Say: Can you please do my hair?', 'Sit still while they brush your hair', 'Say: Thank you!']) },
      { id: 'bag', e: '🎒', t: L('Tự đeo túi', 'Put on my bag'),
        say: L('Con tự đeo túi đi học nhé.', 'Put on your school bag all by yourself.'),
        steps: L(['Xem trong túi có bình nước và khăn chưa', 'Kéo khoá túi lại', 'Tự đeo túi lên hai vai'],
          ['Check that your water bottle and towel are in the bag', 'Zip up the bag', 'Put the bag on both shoulders']) },
      { id: 'school', e: '🏫', t: L('Đi đến lớp', 'Go to class'),
        say: L('Đến giờ đi học rồi! Con vui vẻ đến lớp nhé.', "It's time for school! Let's go to class with a big smile."),
        steps: L(['Tự mang giày dép', 'Chào ba mẹ trước khi đi', 'Đến lớp chào cô và các bạn'],
          ['Put on your shoes by yourself', 'Say goodbye to Mom and Dad', 'Say hello to your teacher and friends']) },
    ],
  },
  afternoon: {
    title: L('Buổi chiều', 'Afternoon'), emoji: '🌤️', color: 'orange',
    intro: L('Con đi học về rồi! Mình cùng tự làm các việc buổi chiều nhé.', "You are home from school! Let's do our afternoon jobs."),
    tasks: [
      { id: 'shoesOn', e: '🥿', t: L('Tự mang giày dép', 'Put on my shoes'), guide: 'shoesOn' },
      { id: 'shoesOff', e: '🗄️', t: L('Cởi giày dép, cất vào tủ', 'Take off shoes, put them away'), guide: 'shoesOff' },
      { id: 'toys', e: '🧸', t: L('Chơi xong cất đồ chơi', 'Put toys away after playing'), game: 'tidy' },
    ],
  },
  evening: {
    title: L('Buổi tối', 'Evening'), emoji: '🌙', color: 'purple',
    intro: L('Buổi tối rồi! Mình cùng tự làm các việc buổi tối nhé.', "It's evening! Let's do our evening jobs."),
    tasks: [
      { id: 'eat', e: '🥄', t: L('Tự múc ăn', 'Feed myself'),
        say: L('Đến giờ ăn rồi. Con tự cầm muỗng múc ăn nhé.', "It's time to eat. Hold your spoon and feed yourself."),
        steps: L(['Ngồi ngay ngắn vào bàn ăn', 'Tự cầm muỗng múc cơm', 'Ăn gọn gàng, không làm rơi vãi', 'Ăn xong mang chén vào bồn rửa'],
          ['Sit up straight at the table', 'Hold your spoon and scoop your food', 'Eat neatly without spilling', 'Take your bowl to the sink when you finish']) },
      { id: 'veggie', e: '🥦', t: L('Ăn một ít rau', 'Eat some vegetables'),
        say: L('Mỗi ngày con phải ăn một ít rau nhé. Rau giúp con khoẻ mạnh, mau lớn và đi vệ sinh dễ dàng.', 'Eat some vegetables every day. Vegetables help you grow strong and healthy.'),
        steps: L(['Tự múc một ít rau vào chén', 'Nhai thật kỹ rồi nuốt', 'Ăn hết phần rau của mình'],
          ['Scoop some vegetables into your bowl', 'Chew well, then swallow', 'Finish all your vegetables']) },
      { id: 'fold', e: '🧺', t: L('Tự xếp gọn quần áo', 'Fold my clothes'), guide: 'fold' },
      { id: 'bed', e: '🛏️', t: L('Tự leo lên giường ngủ', 'Climb into bed'),
        say: L('Đến giờ đi ngủ rồi. Con tự leo lên giường nhé.', "It's bedtime. Climb into bed all by yourself."),
        steps: L(['Chúc ba mẹ ngủ ngon', 'Tự leo lên giường thật cẩn thận', 'Nằm ngay ngắn, đắp chăn', 'Nhắm mắt và ngủ ngoan'],
          ['Say good night to Mom and Dad', 'Climb into bed carefully', 'Lie down and pull up your blanket', 'Close your eyes and sleep tight']) },
    ],
  },
}));

/** Số việc đã làm hôm nay (chỉ tính những việc có trong danh sách). */
export function routineCount(kind) {
  const ids = ROUTINES()[kind].tasks.map((t) => t.id);
  return routineDone(kind).filter((id) => ids.includes(id)).length;
}

/** Buổi phù hợp theo giờ hiện tại. */
export function currentRoutine() {
  const hr = new Date().getHours();
  return hr < 11 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
}

// Mỗi bước: [biểu tượng, tiếng Việt, tiếng Anh, số giây (nếu có hẹn giờ)]
const steps = (list) => list.map(([e, vi, en, secs]) => ({ e, t: L(vi, en), secs }));

const GUIDES = byLang(() => ({
  hands: {
    title: L('Rửa tay', 'Wash hands'), emoji: '🧼', auto: true, countAloud: true,
    intro: L('Mình cùng rửa tay thật sạch nhé! Con làm theo cô từng bước.', "Let's wash our hands nice and clean! Follow me step by step."),
    done: L('Tay con sạch thơm rồi! Giỏi quá!', 'Your hands are clean and fresh! Great job!'),
    steps: steps([
      ['🚰', 'Làm ướt tay và xoa xà phòng', 'Wet your hands and add soap', 4],
      ['🤲', 'Chà hai lòng bàn tay vào nhau', 'Rub your palms together', 5],
      ['🖐️', 'Chà mu bàn tay', 'Rub the backs of your hands', 5],
      ['🙌', 'Đan các ngón tay vào nhau và chà', 'Lace your fingers and rub between them', 5],
      ['👍', 'Xoay và chà ngón tay cái', 'Twist and rub your thumbs', 5],
      ['☝️', 'Chụm đầu ngón tay, chà vào lòng bàn tay', 'Rub your fingertips on your palm', 5],
      ['💧', 'Xả sạch xà phòng dưới vòi nước', 'Rinse off the soap under the water', 5],
      ['🧻', 'Lau khô tay bằng khăn sạch', 'Dry your hands with a clean towel', 4],
    ]),
  },
  teeth: {
    title: L('Đánh răng 2 phút', 'Brush teeth for 2 minutes'), emoji: '🪥', auto: true,
    intro: L('Mình cùng đánh răng trong hai phút nhé! Cô sẽ nhắc con chải từng chỗ.', "Let's brush our teeth for two minutes! I will tell you where to brush."),
    done: L('Răng con trắng sạch rồi! Con cười thật tươi nào!', 'Your teeth are sparkling clean! Give me a big smile!'),
    steps: steps([
      ['🪥', 'Lấy bàn chải, bóp kem bằng hạt đậu', 'Get your toothbrush and a pea-sized bit of toothpaste', 8],
      ['😁', 'Chải mặt ngoài răng hàm trên', 'Brush the outside of your top teeth', 20],
      ['😬', 'Chải mặt ngoài răng hàm dưới', 'Brush the outside of your bottom teeth', 20],
      ['👄', 'Chải mặt trong răng hàm trên', 'Brush the inside of your top teeth', 20],
      ['👅', 'Chải mặt trong răng hàm dưới', 'Brush the inside of your bottom teeth', 20],
      ['🦷', 'Chải mặt nhai, đưa bàn chải tới lui', 'Brush the chewing sides, back and forth', 20],
      ['😛', 'Chải lưỡi thật nhẹ nhàng', 'Brush your tongue gently', 10],
      ['🥛', 'Súc miệng bằng nước sạch', 'Rinse your mouth with clean water', 8],
    ]),
  },
  dress: {
    title: L('Tự mặc đồ mới', 'Put on clean clothes'), emoji: '👗', auto: false,
    intro: L('Con tự mặc quần áo mới nhé.', 'Put on your clean clothes all by yourself.') + tapDone(),
    done: L('Con đã tự mặc quần áo rồi! Trông con thật xinh xắn, gọn gàng!', 'You got dressed all by yourself! You look so pretty and neat!'),
    steps: steps([
      ['👚', 'Tìm cổ áo và mặt trước của áo', 'Find the collar and the front of your shirt'],
      ['🙆‍♀️', 'Chui đầu qua cổ áo', 'Put your head through the collar'],
      ['💪', 'Xỏ từng tay vào ống tay áo', 'Push each arm through a sleeve'],
      ['👗', 'Kéo áo xuống cho thẳng', 'Pull your shirt down straight'],
      ['👖', 'Ngồi xuống, xỏ từng chân vào quần', 'Sit down and put each leg into your pants'],
      ['🧍‍♀️', 'Đứng lên, kéo quần lên cao', 'Stand up and pull your pants up'],
      ['🪞', 'Soi gương xem đã gọn gàng chưa', 'Look in the mirror. Are you neat and tidy?'],
    ]),
  },
  undress: {
    title: L('Tự cởi đồ ngủ', 'Take off pajamas'), emoji: '👚', auto: false,
    intro: L('Con tự cởi đồ ngủ nhé.', 'Take off your pajamas all by yourself.') + tapDone(),
    done: L('Con đã tự cởi đồ rồi! Giỏi quá!', 'You took off your pajamas by yourself! Great job!'),
    steps: steps([
      ['🔘', 'Cởi nút áo, nếu áo có nút', 'Undo the buttons, if your shirt has buttons'],
      ['🙆‍♀️', 'Kéo áo lên qua đầu', 'Pull your shirt up over your head'],
      ['💪', 'Rút từng tay ra khỏi ống tay áo', 'Pull each arm out of its sleeve'],
      ['🪑', 'Ngồi xuống, kéo quần xuống', 'Sit down and pull your pants down'],
      ['🦵', 'Rút từng chân ra khỏi ống quần', 'Pull each leg out'],
      ['🧺', 'Bỏ đồ ngủ vào giỏ', 'Put your pajamas in the basket'],
    ]),
  },
  shoesOn: {
    title: L('Tự mang giày dép', 'Put on my shoes'), emoji: '🥿', auto: false,
    intro: L('Con tự mang giày dép nhé.', 'Put on your shoes all by yourself.') + tapDone(),
    done: L('Con đã tự mang giày dép rồi! Giỏi quá!', 'You put on your shoes by yourself! Great job!'),
    steps: steps([
      ['🪑', 'Ngồi xuống ghế hoặc bậc thấp', 'Sit down on a chair or a low step'],
      ['🥿', 'Đặt hai chiếc giày cạnh nhau, mũi giày quay ra ngoài là đúng chân', 'Put your shoes side by side. The toes should point outward'],
      ['🦶', 'Xỏ chân vào, kéo gót giày lên', 'Slide your foot in and pull up the heel'],
      ['🩹', 'Dán quai hoặc cài khoá cho chặt', 'Close the strap or buckle tightly'],
      ['🚶‍♀️', 'Đứng lên đi thử vài bước', 'Stand up and take a few steps'],
    ]),
  },
  shoesOff: {
    title: L('Cởi giày dép, cất vào tủ', 'Take off shoes, put them away'), emoji: '🗄️', auto: false,
    intro: L('Về đến nhà rồi! Con tự cởi giày dép và cất vào tủ nhé.', 'You are home! Take off your shoes and put them in the shoe cabinet.'),
    done: L('Giày dép đã nằm gọn trong tủ rồi! Giỏi quá!', 'Your shoes are neatly in the cabinet! Great job!'),
    steps: steps([
      ['🪑', 'Ngồi xuống ghế hoặc bậc thấp', 'Sit down on a chair or a low step'],
      ['🩹', 'Mở quai dán hoặc khoá giày', 'Open the strap or buckle'],
      ['🦶', 'Rút từng chân ra', 'Pull each foot out'],
      ['🥿', 'Ghép hai chiếc giày thành một đôi', 'Put your two shoes together as a pair'],
      ['🗄️', 'Cất đôi giày vào tủ giày', 'Put your shoes in the shoe cabinet'],
    ]),
  },
  fold: {
    title: L('Tự xếp gọn quần áo', 'Fold my clothes'), emoji: '🧺', auto: false,
    intro: L('Con tự xếp quần áo cho gọn gàng nhé.', 'Fold your clothes neatly all by yourself.') + tapDone(),
    done: L('Quần áo của con xếp thật gọn gàng! Giỏi quá!', 'Your clothes are folded so neatly! Great job!'),
    steps: steps([
      ['👚', 'Trải áo thật phẳng, mặt trước úp xuống', 'Lay your shirt flat, front side down'],
      ['↔️', 'Gấp hai tay áo vào giữa', 'Fold both sleeves to the middle'],
      ['⬆️', 'Gấp đôi áo từ dưới lên', 'Fold the shirt in half from the bottom up'],
      ['👖', 'Gấp đôi quần theo chiều dọc, rồi gấp đôi lần nữa', 'Fold your pants in half the long way, then in half again'],
      ['🗄️', 'Cất quần áo vào đúng ngăn tủ', 'Put your clothes in the right drawer'],
    ]),
  },
}));

/* ---------------- Menu ---------------- */
register('selfcare', {
  title: () => L('Bé Tự Lập', 'I Can Do It'), parent: 'home', theme: THEME,
  render(root) {
    const jobs = (n, total) => L(`${n}/${total} việc`, `${n}/${total} jobs`);
    const card = (kind) => {
      const R = ROUTINES()[kind];
      return menuCard({ emoji: R.emoji, label: R.title, sub: jobs(routineCount(kind), R.tasks.length), color: R.color, badge: kind === currentRoutine() ? L('Bây giờ', 'Now') : null, onClick: () => go('routine', { kind }) });
    };
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' }, h('div', null,
        h('h2', { text: L('👧 Bé Tự Lập', '👧 I Can Do It') }),
        h('p', { text: L('Con tự làm việc của mình nhé!', 'I can do things all by myself!') }))),
      h('div', { class: 'cards three' }, card('morning'), card('afternoon'), card('evening')),
      h('h3', { style: { fontSize: '28px', margin: '30px 0 16px' }, text: L('🌟 Tập từng kỹ năng', '🌟 Practice one skill') }),
      h('div', { class: 'cards' },
        menuCard({ emoji: '👗', label: L('Mặc quần áo', 'Get dressed'), sub: L('Từng bước một', 'Step by step'), color: 'pink', onClick: () => go('guide', { id: 'dress' }) }),
        menuCard({ emoji: '🥿', label: L('Mang giày dép', 'Put on shoes'), sub: L('Đúng chân trái, phải', 'Left foot, right foot'), color: 'blue', onClick: () => go('guide', { id: 'shoesOn' }) }),
        menuCard({ emoji: '🧺', label: L('Xếp quần áo', 'Fold clothes'), sub: L('Gấp gọn, cất tủ', 'Fold and put away'), color: 'purple', onClick: () => go('guide', { id: 'fold' }) }),
        menuCard({ emoji: '🧸', label: L('Dọn đồ chơi', 'Tidy up'), sub: L('Kéo đồ vào đúng chỗ', 'Drag things to their place'), color: 'orange', onClick: () => go('tidy') }),
        menuCard({ emoji: '🧼', label: L('Rửa tay', 'Wash hands'), sub: L('8 bước sạch khuẩn', '8 steps to clean hands'), color: 'green', onClick: () => go('guide', { id: 'hands' }) }),
        menuCard({ emoji: '🪥', label: L('Đánh răng', 'Brush teeth'), sub: L('Hẹn giờ 2 phút', '2-minute timer'), color: 'yellow', onClick: () => go('guide', { id: 'teeth' }) }),
      )));
    say(L('Bé tự lập. Hôm nay con muốn tự làm việc gì nào?', 'I can do it! What do you want to do by yourself today?'));
  },
});

/* ---------------- Danh sách việc trong ngày ---------------- */
register('routine', {
  title: (p) => ROUTINES()[p.kind].title, parent: 'selfcare', theme: THEME,
  render(root, { kind }) {
    const R = ROUTINES()[kind];
    const done = routineDone(kind);
    const n = routineCount(kind);
    const total = R.tasks.length;
    const bar = h('i');
    const tiles = R.tasks.map((t) => h('button', {
      class: 'tile' + (done.includes(t.id) ? ' done' : ''),
      onClick: () => { sfx.tap(); openTask(kind, t); },
    }, h('span', { class: 'emo', text: t.e }), h('span', { class: 'lbl', text: t.t })));
    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' },
        h('div', { style: { flex: 1 } },
          h('h2', { text: `${R.emoji} ${R.title}` }),
          h('p', { text: L(`Con đã làm ${n}/${total} việc`, `You did ${n} of ${total} jobs`) }),
          h('div', { class: 'progress-bar', style: { marginTop: '10px' } }, bar))),
      h('div', { class: 'routine-tiles' }, tiles)));
    requestAnimationFrame(() => { bar.style.width = (100 * n / total) + '%'; });

    const left = total - n;
    if (n === total) say(L(`Con đã làm xong hết các việc ${R.title.toLowerCase()} rồi. Giỏi quá!`, `You finished all your ${R.title.toLowerCase()} jobs. Great job!`));
    else if (n === 0) say(R.intro);
    else say(L(`Con còn ${numWord(left)} việc nữa thôi. Cố lên!`, `Only ${numWord(left)} more ${left === 1 ? 'job' : 'jobs'} to go. You can do it!`));
  },
});

function openTask(kind, t) {
  if (t.guide) go('guide', { id: t.guide, kind, task: t.id });
  else if (t.game) go('tidy', { kind, task: t.id });
  else go('task', { kind, id: t.id });
}

/** Đánh dấu một việc đã xong + chúc mừng nếu hoàn thành cả buổi. */
async function completeTask(kind, id, fromEl) {
  const fresh = markRoutine(kind, id);
  if (fresh) award('task', fromEl);
  const R = ROUTINES()[kind];
  if (fresh && routineCount(kind) === R.tasks.length) {
    await celebrate({
      emoji: { morning: '🌞', afternoon: '🏅', evening: '🌟' }[kind],
      title: L('Xong hết rồi!', 'All done!'),
      text: L(`Con đã tự làm tất cả việc ${R.title.toLowerCase()}!`, `You did all your ${R.title.toLowerCase()} jobs by yourself!`),
      kind: 'routine',
      buttons: [[L('Tuyệt vời! 🎉', 'Yay! 🎉'), 'green']],
    });
  }
  go('routine', { kind });
}

/* ---------------- Một việc (đọc các bước) ---------------- */
register('task', {
  title: (p) => ROUTINES()[p.kind].tasks.find((t) => t.id === p.id).t,
  parent: (p) => ['routine', { kind: p.kind }], theme: THEME, fixed: true,
  render(root, { kind, id }) {
    const life = live();
    const t = ROUTINES()[kind].tasks.find((x) => x.id === id);
    const items = t.steps.map((s, i) => h('li', null, h('b', { text: i + 1 }), s));
    const doneBtn = h('button', { class: 'btn big green pulse', onClick: () => { sfx.ding(); completeTask(kind, id, doneBtn); } }, L('✅ Con làm xong rồi!', '✅ I did it!'));
    root.append(h('div', { class: 'task' },
      h('div', { class: 'emo', text: t.e }),
      h('h2', { text: t.t }),
      h('ol', { class: 'steps' }, items),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onClick: () => readSteps() }, L('🔊 Nghe lại', '🔊 Hear again')),
        doneBtn)));

    async function readSteps() {
      if (!(await say(t.say))) return;
      for (let i = 0; i < t.steps.length; i++) {
        if (!life.alive) return;
        items.forEach((li, j) => li.classList.toggle('now', i === j));
        const ok = await say(step(i + 1, t.steps[i]));
        if (!ok || !life.alive) return;
        await sleep(250);
      }
      items.forEach((li) => li.classList.remove('now'));
      if (life.alive) say(L('Làm xong thì con bấm nút màu xanh nhé!', 'When you finish, tap the green button!'));
    }
    readSteps();
  },
});

/* ---------------- Hướng dẫn từng bước có hẹn giờ ---------------- */
register('guide', {
  title: (p) => GUIDES()[p.id].title,
  parent: (p) => (p.kind ? ['routine', { kind: p.kind }] : 'selfcare'), theme: THEME, fixed: true,
  render(root, params) {
    const G = GUIDES()[params.id];
    const life = live();
    let idx = -1;
    let paused = false;
    let token = 0;
    const PAUSE = L('⏸️ Tạm dừng', '⏸️ Pause');

    const dots = progressDots(G.steps.length);
    const emo = h('div', { class: 'guide-emo', text: G.emoji });
    const text = h('p', { class: 'guide-text', text: G.title });
    const C = 2 * Math.PI * 90;
    const fg = svgEl('circle', { class: 'fg', cx: 100, cy: 100, r: 90, 'stroke-dasharray': C, 'stroke-dashoffset': 0 });
    const num = h('div', { class: 'num' });
    const ring = h('div', { class: 'ring' },
      svgEl('svg', { viewBox: '0 0 200 200' }, svgEl('circle', { class: 'bg', cx: 100, cy: 100, r: 90 }), fg), num);
    ring.hidden = true;

    const pauseBtn = h('button', { class: 'btn orange', onClick: togglePause }, PAUSE);
    const nextBtn = h('button', { class: 'btn green big', onClick: () => { sfx.tap(); runStep(idx + 1); } },
      G.auto ? L('⏭️ Bước tiếp', '⏭️ Next step') : L('✅ Xong rồi', '✅ Done'));
    const startBtn = h('button', { class: 'btn green big pulse', onClick: () => { startBtn.remove(); controls.hidden = false; runStep(0); } }, L('▶️ Bắt đầu', '▶️ Start'));
    const controls = h('div', { class: 'row' },
      h('button', { class: 'btn ghost', onClick: () => idx >= 0 && runStep(idx) }, L('🔊 Nghe lại', '🔊 Hear again')),
      G.auto ? pauseBtn : null, nextBtn);
    controls.hidden = true;

    root.append(h('div', { class: 'guide' },
      h('div', { class: 'play-head' }, dots, h('div', { style: { fontSize: '22px', color: 'var(--muted)' }, text: L(`${G.steps.length} bước`, `${G.steps.length} steps`) })),
      h('div', { class: 'guide-main' }, h('div', null, emo, text), ring),
      h('div', { class: 'row' }, startBtn, controls)));

    say(G.intro + L(' Con bấm Bắt đầu nhé!', ' Tap Start!'));

    function togglePause() {
      paused = !paused;
      pauseBtn.textContent = paused ? L('▶️ Tiếp tục', '▶️ Resume') : PAUSE;
      if (paused) say(L('Tạm dừng.', 'Paused.'));
    }

    async function runStep(i) {
      const my = ++token;
      const alive = () => life.alive && my === token;
      if (i >= G.steps.length) { finish(); return; }
      idx = i;
      paused = false;
      pauseBtn.textContent = PAUSE;
      const s = G.steps[i];
      dots.set(i);
      emo.textContent = s.e;
      text.textContent = s.t;
      ring.hidden = !s.secs;
      if (s.secs) { setRing(s.secs, s.secs); }
      await say(step(i + 1, s.t));
      if (!alive()) return;
      if (s.secs) {
        for (let left = s.secs; left > 0; left--) {
          while (paused) { await sleep(200); if (!alive()) return; }
          setRing(left - 1, s.secs);
          if (G.countAloud) say(numWord(s.secs - left + 1), { rate: 1.1 });
          else if (left === 11 && s.secs >= 20) say(L('Cố lên, chải tiếp nào!', 'Keep going, keep brushing!'));
          else sfx.tick();
          await sleep(1000);
          if (!alive()) return;
        }
        sfx.ding();
        if (G.auto) { await sleep(400); if (alive()) runStep(i + 1); }
      }
    }

    function setRing(left, total) {
      num.textContent = left;
      fg.setAttribute('stroke-dashoffset', String(C * (1 - left / total)));
    }

    async function finish() {
      token++;
      dots.set(G.steps.length);
      toast(praise());
      const ans = await celebrate({
        emoji: G.emoji, title: L('Hoàn thành!', 'All done!'), text: G.done, speech: G.done, kind: params.kind ? null : 'skill',
        buttons: [[L('Làm lại 🔁', 'Do it again 🔁'), 'orange'], [L('Xong ✅', 'Done ✅'), 'green']],
      });
      if (!life.alive) return;
      if (params.kind) { completeTask(params.kind, params.task, null); return; }
      if (ans === 0) go('guide', params); else go('selfcare');
    }
  },
});

function svgEl(tag, attrs, ...kids) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  kids.forEach((k) => el.append(k));
  return el;
}

/* ---------------- Trò chơi: Dọn đồ chơi ---------------- */
const BINS = byLang(() => [
  { id: 'toy', e: '📦', t: L('Hộp đồ chơi', 'Toy box') },
  { id: 'cloth', e: '🧺', t: L('Giỏ quần áo', 'Clothes basket') },
  { id: 'book', e: '📚', t: L('Giá sách', 'Bookshelf') },
  { id: 'shoe', e: '🗄️', t: L('Tủ giày', 'Shoe cabinet') },
]);
// [biểu tượng, tiếng Việt, tiếng Anh, chỗ cất]
const THINGS = byLang(() => [
  ['🧸', 'gấu bông', 'the teddy bear', 'toy'], ['🪆', 'búp bê', 'the doll', 'toy'], ['⚽', 'quả bóng', 'the ball', 'toy'],
  ['🧩', 'miếng xếp hình', 'the puzzle piece', 'toy'], ['🪀', 'con quay', 'the yo-yo', 'toy'], ['🦄', 'kỳ lân bông', 'the toy unicorn', 'toy'],
  ['👚', 'cái áo', 'the shirt', 'cloth'], ['👖', 'cái quần', 'the pants', 'cloth'], ['🧦', 'đôi tất', 'the socks', 'cloth'],
  ['👒', 'cái mũ', 'the hat', 'cloth'], ['👗', 'cái váy', 'the dress', 'cloth'],
  ['📕', 'quyển sách', 'the book', 'book'], ['✏️', 'bút chì', 'the pencil', 'book'], ['🖍️', 'bút sáp màu', 'the crayon', 'book'],
  ['📒', 'quyển vở', 'the notebook', 'book'],
  ['🥿', 'đôi giày', 'the shoes', 'shoe'], ['🩴', 'đôi dép', 'the flip-flops', 'shoe'], ['👡', 'đôi xăng đan', 'the sandals', 'shoe'],
  ['👢', 'đôi ủng', 'the boots', 'shoe'],
].map(([e, vi, en, bin]) => ({ e, n: L(vi, en), bin })));

const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

register('tidy', {
  title: () => L('Dọn đồ chơi', 'Tidy up'), parent: (p) => (p.kind ? ['routine', { kind: p.kind }] : 'selfcare'), theme: THEME, fixed: true,
  render(root, params) {
    const life = live();
    const byBin = (id) => shuffle(THINGS().filter((t) => t.bin === id));
    const items = shuffle([...byBin('toy').slice(0, 3), ...byBin('cloth').slice(0, 2), ...byBin('book').slice(0, 2), ...byBin('shoe').slice(0, 2)]);
    let left = items.length;

    const room = h('div', { class: 'room' }, h('div', { class: 'win', text: '🪟' }));
    const binEls = BINS().map((b) => {
      const got = h('div', { class: 'got' });
      const el = h('div', { class: 'bin' }, h('div', { class: 'emo', text: b.e }), h('div', { class: 'lbl', text: b.t }), got);
      el.dataset.bin = b.id;
      el.got = got;
      return el;
    });
    root.append(h('div', { class: 'tidy' }, room, h('div', { class: 'bins' }, binEls)));

    // Rải đồ lên sàn theo lưới có xáo trộn để không chồng lên nhau
    const cols = 5, rows = 2;
    const cells = shuffle([...Array(cols * rows).keys()]);
    items.forEach((it, k) => {
      const c = cells[k];
      const x = ((c % cols) + 0.15 + Math.random() * 0.5) / cols * 100;
      const y = 22 + (Math.floor(c / cols) + 0.1 + Math.random() * 0.45) / rows * 62;
      const el = h('div', { class: 'toy', text: it.e });
      el.style.left = `calc(${x}% - 34px)`;
      el.style.top = `calc(${y}% - 20px)`;
      el.style.transform = `rotate(${rand(-20, 20)}deg)`;
      room.append(el);
      makeDraggable(el, it);
    });

    say((params.kind ? L('Chơi xong rồi, mình cùng cất đồ nhé! ', "Play time is over. Let's tidy up! ") : '') +
      L('Con hãy kéo từng đồ vật vào đúng chỗ: đồ chơi vào hộp, quần áo vào giỏ, sách bút lên giá sách, giày dép vào tủ giày.',
        'Drag each thing to the right place: toys in the toy box, clothes in the basket, books and pencils on the bookshelf, and shoes in the shoe cabinet.'));

    function binAt(x, y) {
      return binEls.find((b) => {
        const r = b.getBoundingClientRect();
        return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 30 && y <= r.bottom + 10;
      });
    }

    function makeDraggable(el, it) {
      let sx = 0, sy = 0, id = null, moved = false;
      const rot = el.style.transform;
      el.addEventListener('pointerdown', (e) => {
        if (id !== null) return;
        id = e.pointerId; moved = false;
        sx = e.clientX; sy = e.clientY;
        el.setPointerCapture(id);
        el.classList.add('drag');
        sfx.tap();
      });
      el.addEventListener('pointermove', (e) => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
        el.style.transform = `translate(${dx}px, ${dy}px) scale(1.2)`;
        binEls.forEach((b) => b.classList.toggle('hot', b === binAt(e.clientX, e.clientY)));
      });
      const up = (e) => {
        if (e.pointerId !== id) return;
        id = null;
        el.classList.remove('drag');
        binEls.forEach((b) => b.classList.remove('hot'));
        const bin = e.type === 'pointerup' ? binAt(e.clientX, e.clientY) : null;
        const binInfo = bin && BINS().find((b) => b.id === bin.dataset.bin);
        const binName = binInfo ? binInfo.t.toLowerCase() : '';
        if (!moved) {
          el.style.transform = rot;
          say(L(`Đây là ${it.n}. Con kéo ${it.n} vào đúng chỗ nhé.`, `This is ${it.n}. Drag it to the right place.`));
        } else if (bin && bin.dataset.bin === it.bin) {
          el.remove();
          bin.got.textContent += it.e;
          bin.classList.remove('yay'); void bin.offsetWidth; bin.classList.add('yay');
          sfx.pop();
          left--;
          if (left === 0) done();
          else say(L(`Đúng rồi! ${capFirst(it.n)} cất vào ${binName}.`, `That's right! You put ${it.n} in the ${binName}.`));
        } else {
          el.style.transform = rot;
          if (bin) {
            sfx.oops();
            say(L(`Ồ, ${it.n} không để ở ${binName}. Con thử chỗ khác nhé.`, `Oops, the ${binName} is not the place for ${it.n}. Try another place.`));
          }
        }
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    async function done() {
      await sleep(300);
      if (!life.alive) return;
      const DONE = [L('Xong ✅', 'Done ✅'), 'green'];
      const ans = await celebrate({
        emoji: '🏠', title: L('Gọn gàng quá!', 'So tidy!'), text: L('Phòng của con sạch đẹp rồi!', 'Your room is clean and neat!'),
        speech: L('Hoan hô! Phòng của con gọn gàng sạch đẹp rồi!', 'Hooray! Your room is clean and tidy!'), kind: params.kind ? null : 'skill',
        buttons: params.kind ? [DONE] : [[L('Chơi lại 🔁', 'Play again 🔁'), 'orange'], DONE],
      });
      if (!life.alive) return;
      if (params.kind) completeTask(params.kind, params.task, null);
      else if (ans === 0) go('tidy', params);
      else go('selfcare');
    }
  },
});
