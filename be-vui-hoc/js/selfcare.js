// BÉ TỰ LẬP – việc ngày đi học (sáng, tối), việc ba mẹ giao thêm, hướng dẫn từng bước, trò chơi dọn đồ chơi
// Ghi chú: các chuỗi dùng L(tiếng Việt, tiếng Anh); dữ liệu bọc trong byLang() để đổi ngôn ngữ được ngay.
import { register, go, h, say, live, sleep, award, giveStars, praise, celebrate, menuCard, progressDots, shuffle, rand, toast } from './ui.js';
import { sfx } from './sound.js';
import { store, routineDone, markRoutine, isSchoolDay, todaysAsks, todayKey } from './store.js';
import { L, byLang } from './i18n.js';
import { numWord } from './vi.js';

const THEME = 'var(--pink)';
const tapDone = () => L(' Làm xong mỗi bước thì bấm nút Xong rồi.', ' Tap Done after each step.');
const step = (n, text) => L(`Bước ${numWord(n)}. ${text}.`, `Step ${numWord(n)}. ${text}.`);

/* ---------------- Dữ liệu: việc của NGÀY ĐI HỌC ---------------- */
// goal: tiêu chí đạt (ba mẹ đặt). timer: số phút quy định (hiện đồng hồ đếm ngược).
export const ROUTINES = byLang(() => ({
  morning: {
    title: L('Buổi sáng', 'Morning'), emoji: '☀️', color: 'yellow',
    intro: L('Chào buổi sáng! Hôm nay con đi học. Mình cùng tự làm năm việc buổi sáng nhé. Con chạm vào từng việc để nghe hướng dẫn.',
      "Good morning! It's a school day. Let's do our five morning jobs all by ourselves. Tap each job to hear what to do."),
    tasks: [
      { id: 'toilet', e: '🚽', t: L('Tự đi vệ sinh và làm sạch', 'Use the toilet and clean up'),
        say: L('Ngủ dậy rồi, con tự đi vệ sinh và làm sạch nhé.', 'You are up! Go to the toilet and clean yourself up.'),
        goal: L('sạch sẽ, không có mùi hôi', 'clean, with no bad smell'),
        steps: L(['Tự đi vệ sinh', 'Lau rửa thật sạch', 'Xả nước', 'Rửa tay bằng xà phòng'],
          ['Use the toilet by yourself', 'Wipe and wash until you are clean', 'Flush the toilet', 'Wash your hands with soap']) },
      { id: 'face', e: '💦', t: L('Tự rửa mặt', 'Wash my face'),
        say: L('Con tự rửa mặt cho sạch sẽ nhé.', 'Wash your face nice and clean.'),
        goal: L('mặt sạch, mắt và miệng không có ghèn', 'a clean face, with nothing left around your eyes and mouth'),
        steps: L(['Vốc nước sạch lên mặt', 'Rửa kỹ khoé mắt và quanh miệng', 'Lau khô bằng khăn của con', 'Soi gương kiểm tra lại'],
          ['Splash clean water on your face', 'Wash the corners of your eyes and around your mouth', 'Dry your face with your own towel', 'Check in the mirror']) },
      { id: 'clothes', e: '👗', t: L('Cởi đồ ngủ, mặc quần áo mới', 'Change out of pajamas'),
        say: L('Con tự cởi đồ ngủ và mặc quần áo mới nhé.', 'Take off your pajamas and put on clean clothes all by yourself.'),
        steps: L(['Cởi áo và quần ngủ', 'Bỏ đồ ngủ vào giỏ', 'Mặc áo mới: chui đầu, rồi xỏ từng tay', 'Mặc quần hoặc váy', 'Soi gương xem đã gọn gàng chưa'],
          ['Take off your pajama top and bottoms', 'Put your pajamas in the basket', 'Put on your clean top: head first, then each arm', 'Put on your pants or skirt', 'Look in the mirror. Are you neat?']) },
      { id: 'medicine', e: '💊', t: L('Uống thuốc và 1 ly nước đầy', 'Take medicine and a full glass of water'),
        say: L('Đến giờ uống thuốc rồi. Con nhớ chỉ uống thuốc do ba mẹ đưa nhé.', "It's medicine time. Remember: only take the medicine Mom or Dad gives you."),
        goal: L('uống hết thuốc và một ly nước đầy', 'all your medicine and a full glass of water'),
        steps: L(['Nhận thuốc từ ba mẹ', 'Uống hết thuốc', 'Uống hết một ly nước đầy'],
          ['Get your medicine from Mom or Dad', 'Take all of your medicine', 'Drink a full glass of water']) },
      { id: 'shoes', e: '🥿', t: L('Mang tất, mang giày, đi học sớm', 'Socks and shoes on, ready early'),
        say: L('Con tự mang tất và mang giày để đi học sớm nhé.', 'Put on your socks and shoes so we can leave for school early.'),
        goal: L('xong sớm, kịp giờ đi học', 'ready early, in time for school'),
        steps: L(['Mang tất vào hai chân', 'Mang giày đúng chân trái, chân phải', 'Dán quai hoặc cài khoá cho chặt', 'Đeo túi, sẵn sàng đi học'],
          ['Put a sock on each foot', 'Put each shoe on the correct foot', 'Close the strap or buckle tightly', 'Put on your bag. Ready for school!']) },
    ],
  },
  evening: {
    title: L('Buổi tối', 'Evening'), emoji: '🌙', color: 'purple',
    intro: L('Con đi học về rồi! Mình cùng tự làm năm việc buổi tối nhé.', "You are home from school! Let's do our five evening jobs."),
    tasks: [
      { id: 'home', e: '🗄️', t: L('Cất giày vào tủ, bỏ đồ bẩn vào giỏ', 'Shoes in the cabinet, dirty clothes in the basket'),
        say: L('Về đến nhà rồi! Con cất giày vào tủ và bỏ quần áo bẩn vào giỏ nhé.', 'You are home! Put your shoes in the cabinet and your dirty clothes in the basket.'),
        steps: L(['Cởi giày, ghép thành một đôi', 'Cất giày vào tủ giày', 'Thay quần áo', 'Bỏ quần áo bẩn vào giỏ'],
          ['Take off your shoes and put them together as a pair', 'Put your shoes in the shoe cabinet', 'Change your clothes', 'Put your dirty clothes in the basket']) },
      { id: 'eat', e: '🥄', t: L('Tự xúc ăn hết trong 45 phút', 'Feed myself and finish in 45 minutes'), timer: 45,
        say: L('Đến giờ ăn rồi. Con tự xúc ăn và ăn hết trong bốn mươi lăm phút nhé.', "It's time to eat. Feed yourself and finish everything in forty-five minutes."),
        goal: L('ăn hết trong 45 phút: 1 chén cơm đầy, nửa chén thức ăn, nửa chén canh', 'everything eaten within 45 minutes: 1 full bowl of rice, half a bowl of food, half a bowl of soup'),
        steps: L(['Ngồi ngay ngắn vào bàn ăn', 'Tự xúc: một chén cơm đầy', 'Ăn hết nửa chén thức ăn', 'Ăn hết nửa chén canh'],
          ['Sit up straight at the table', 'Feed yourself: one full bowl of rice', 'Finish half a bowl of food', 'Finish half a bowl of soup']) },
      { id: 'milk', e: '🥛', t: L('Tự uống sữa (200 ml)', 'Drink my milk (200 ml)'),
        say: L('Con tự uống sữa nhé.', 'Drink your milk all by yourself.'),
        goal: L('uống hết 200 ml sữa', 'all 200 ml of milk finished'),
        steps: L(['Tự cầm ly hoặc hộp sữa', 'Uống hết sữa', 'Bỏ vỏ hộp vào thùng rác hoặc mang ly ra bồn rửa'],
          ['Hold your cup or milk box by yourself', 'Drink all of your milk', 'Throw the box away or take the cup to the sink']) },
      { id: 'toys', e: '🧸', t: L('Sắp xếp đồ chơi gọn gàng', 'Tidy up my toys'),
        say: L('Chơi xong rồi, con sắp xếp đồ chơi cho gọn gàng nhé.', 'Play time is over. Tidy up your toys.'),
        steps: L(['Nhặt hết đồ chơi trên sàn', 'Xếp từng món vào đúng hộp, đúng kệ', 'Nhìn lại xem sàn nhà đã gọn chưa'],
          ['Pick up all the toys from the floor', 'Put each toy in its box or on its shelf', 'Look around. Is the floor tidy?']) },
      { id: 'bed', e: '🛏️', t: L('Tự leo lên giường, tắt đèn và ngủ', 'Climb into bed, lights off, sleep'),
        say: L('Đến giờ đi ngủ rồi. Con tự leo lên giường, tắt đèn và ngủ nhé.', "It's bedtime. Climb into bed, turn off the light, and go to sleep."),
        steps: L(['Chúc ba mẹ ngủ ngon', 'Tự leo lên giường', 'Tắt đèn', 'Nhắm mắt và ngủ ngoan'],
          ['Say good night to Mom and Dad', 'Climb into bed by yourself', 'Turn off the light', 'Close your eyes and sleep tight']) },
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
  return new Date().getHours() < 12 ? 'morning' : 'evening';
}

/* ---------------- Việc ba mẹ giao thêm (phơi đồ, gấp đồ…) ---------------- */
const CHORE_INFO = byLang(() => ({
  hang: { t: L('Phơi đồ', 'Hang up the laundry'),
    steps: L(['Lấy từng món đồ ra khỏi chậu', 'Giũ cho thẳng', 'Móc lên móc hoặc vắt lên dây phơi', 'Phơi hết đồ, không để rơi xuống đất'],
      ['Take each piece out of the basket', 'Shake it out straight', 'Hang it on a hanger or on the line', 'Hang everything up and keep it off the floor']) },
  fold: { t: L('Gấp đồ', 'Fold the laundry'),
    steps: L(['Trải từng món đồ cho phẳng', 'Gấp gọn từng món', 'Xếp thành chồng ngay ngắn', 'Cất vào đúng ngăn tủ'],
      ['Lay each piece flat', 'Fold it neatly', 'Stack the clothes in a tidy pile', 'Put them in the right drawer']) },
}));

/** Tên một việc ba mẹ giao: tên ba mẹ đặt, hoặc tên mẫu theo ngôn ngữ. */
export function choreName(c) {
  if (c.name && c.name.trim()) return c.name.trim();
  const info = CHORE_INFO()[c.key];
  return info ? info.t : L('Việc thêm', 'Extra job');
}

/** Các việc thêm ba mẹ giao hôm nay, ở dạng giống một việc trong lịch. */
export function todaysChores() {
  const ids = todaysAsks();
  return store.data.chores.filter((c) => ids.includes(c.id)).map((c) => {
    const name = choreName(c);
    const info = (!c.name && CHORE_INFO()[c.key]) || { steps: [] };
    return { id: c.id, e: c.emoji, t: name, stars: c.stars, steps: info.steps,
      say: L(`Hôm nay ba mẹ nhờ con: ${name}. Làm xong con được ${c.stars} sao.`, `Today Mom and Dad ask you to: ${name}. You get ${c.stars} stars when you finish.`) };
  });
}

const findTask = (kind, id) => (kind === 'chore' ? todaysChores() : ROUTINES()[kind].tasks).find((t) => t.id === id);

/* ---------------- Đồng hồ cho việc có giờ quy định (bữa ăn 45 phút) ---------------- */
const timerKey = (id) => `bvh.timer.${todayKey()}.${id}`;
function timerEnd(id) {
  try { return +sessionStorage.getItem(timerKey(id)) || 0; } catch (e) { return 0; }
}
function timerStart(id, minutes) {
  const end = Date.now() + minutes * 60000;
  try { sessionStorage.setItem(timerKey(id), String(end)); } catch (e) { /* */ }
  return end;
}
/** true khi đang có đồng hồ bữa ăn chạy (để tạm hoãn lời nhắc nghỉ mắt). */
export function mealTimerRunning() {
  return ROUTINES().evening.tasks.some((t) => t.timer && timerEnd(t.id) > Date.now());
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
    const school = isSchoolDay();
    const jobs = (n, total) => L(`${n}/${total} việc`, `${n}/${total} jobs`);
    const holiday = () => say(L('Hôm nay là ngày nghỉ, con không đi học. Các việc ngày đi học sẽ có lại vào ngày con đi học nhé.',
      "Today is a day off. No school today! Your school-day jobs will be back on the next school day."));
    const card = (kind) => {
      const R = ROUTINES()[kind];
      return menuCard({ emoji: R.emoji, label: R.title, color: school ? R.color : 'white',
        sub: school ? jobs(routineCount(kind), R.tasks.length) : L('Ngày nghỉ 🎈', 'Day off 🎈'),
        badge: school && kind === currentRoutine() ? L('Bây giờ', 'Now') : null,
        onClick: () => (school ? go('routine', { kind }) : holiday()) });
    };
    const chores = todaysChores();
    const choreDone = routineDone('chore');
    const choreTiles = chores.map((c) => h('button', {
      class: 'tile' + (choreDone.includes(c.id) ? ' done' : ''),
      onClick: () => { sfx.tap(); go('task', { kind: 'chore', id: c.id }); },
    }, h('span', { class: 'emo', text: c.e }), h('span', { class: 'lbl', text: c.t }), h('span', { class: 'tile-stars', text: `+${c.stars} ⭐` })));

    root.append(h('div', { class: 'menu' },
      h('div', { class: 'menu-head' }, h('div', null,
        h('h2', { text: L('👧 Bé Tự Lập', '👧 I Can Do It') }),
        h('p', { text: school ? L('Việc của ngày đi học: mỗi việc 1 ⭐', 'School-day jobs: 1 ⭐ each') : L('Hôm nay là ngày nghỉ', 'Today is a day off') }))),
      h('div', { class: 'cards two' }, card('morning'), card('evening')),
      chores.length ? [
        h('h3', { class: 'sec', text: L('📋 Việc ba mẹ nhờ hôm nay', '📋 Jobs from Mom and Dad today') }),
        h('div', { class: 'routine-tiles' }, choreTiles)] : null,
      h('h3', { class: 'sec', text: L('🌟 Tập thêm cho quen tay (không tính sao)', '🌟 Extra practice (no stars)') }),
      h('div', { class: 'cards' },
        menuCard({ emoji: '👗', label: L('Mặc quần áo', 'Get dressed'), sub: L('Từng bước một', 'Step by step'), color: 'pink', onClick: () => go('guide', { id: 'dress' }) }),
        menuCard({ emoji: '🥿', label: L('Mang giày dép', 'Put on shoes'), sub: L('Đúng chân trái, phải', 'Left foot, right foot'), color: 'blue', onClick: () => go('guide', { id: 'shoesOn' }) }),
        menuCard({ emoji: '🧺', label: L('Xếp quần áo', 'Fold clothes'), sub: L('Gấp gọn, cất tủ', 'Fold and put away'), color: 'purple', onClick: () => go('guide', { id: 'fold' }) }),
        menuCard({ emoji: '🧸', label: L('Dọn đồ chơi', 'Tidy up'), sub: L('Kéo đồ vào đúng chỗ', 'Drag things to their place'), color: 'orange', onClick: () => go('tidy') }),
        menuCard({ emoji: '🧼', label: L('Rửa tay', 'Wash hands'), sub: L('8 bước sạch khuẩn', '8 steps to clean hands'), color: 'green', onClick: () => go('guide', { id: 'hands' }) }),
        menuCard({ emoji: '🪥', label: L('Đánh răng', 'Brush teeth'), sub: L('Hẹn giờ 2 phút', '2-minute timer'), color: 'yellow', onClick: () => go('guide', { id: 'teeth' }) }),
      )));

    const open = chores.filter((c) => !choreDone.includes(c.id));
    if (open.length) say(L(`Bé tự lập. Hôm nay ba mẹ nhờ con ${open.map((c) => c.t).join(', ')}.`, `I can do it! Today Mom and Dad ask you to: ${open.map((c) => c.t).join(', ')}.`));
    else if (!school) holiday();
    else say(L('Bé tự lập. Hôm nay con muốn tự làm việc gì nào?', 'I can do it! What do you want to do by yourself today?'));
  },
});

/* ---------------- Danh sách việc trong một buổi ---------------- */
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
      onClick: () => { sfx.tap(); go('task', { kind, id: t.id }); },
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

/** Đánh dấu một việc đã xong, thưởng sao, chúc mừng nếu hoàn thành cả buổi. */
async function completeTask(kind, id, fromEl) {
  const fresh = markRoutine(kind, id);
  if (kind === 'chore') {
    const c = findTask(kind, id);
    if (fresh && c) giveStars(c.stars, fromEl);
    go('selfcare');
    return;
  }
  if (fresh) award('task', fromEl);
  const R = ROUTINES()[kind];
  if (fresh && routineCount(kind) === R.tasks.length) {
    await celebrate({
      emoji: { morning: '🌞', evening: '🌟' }[kind],
      title: L('Xong hết rồi!', 'All done!'),
      text: L(`Con đã tự làm tất cả việc ${R.title.toLowerCase()}!`, `You did all your ${R.title.toLowerCase()} jobs by yourself!`),
      kind: 'routine',
      buttons: [[L('Tuyệt vời! 🎉', 'Yay! 🎉'), 'green']],
    });
  }
  go('routine', { kind });
}

/* ---------------- Một việc: các bước, tiêu chí đạt, đồng hồ (nếu có) ---------------- */
register('task', {
  title: (p) => (findTask(p.kind, p.id) || {}).t || '',
  parent: (p) => (p.kind === 'chore' ? 'selfcare' : ['routine', { kind: p.kind }]), theme: THEME,
  render(root, { kind, id }) {
    const life = live();
    const t = findTask(kind, id);
    if (!t) { go('selfcare'); return undefined; }
    const items = t.steps.map((s, i) => h('li', null, h('b', { text: i + 1 }), s));
    const doneBtn = h('button', { class: 'btn big green pulse', onClick: () => { sfx.ding(); completeTask(kind, id, doneBtn); } }, L('✅ Con làm xong rồi!', '✅ I did it!'));
    const goalText = t.goal ? L(`Đạt khi: ${t.goal}`, `Done well means: ${t.goal}`) : '';

    // Đồng hồ đếm ngược cho việc có giờ quy định
    let tick = null;
    let wake = null;
    let clock = null;
    if (t.timer) {
      const face = h('b', { class: 'clock-face' });
      const startBtn = h('button', { class: 'btn orange', onClick: () => { sfx.tap(); start(); } }, L(`▶️ Bắt đầu tính ${t.timer} phút`, `▶️ Start the ${t.timer}-minute timer`));
      clock = h('div', { class: 'clock' }, h('span', { text: '⏱️' }), face, startBtn);
      const told = new Set();
      const fmt = (ms) => { const sec = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
      const update = () => {
        const end = timerEnd(id);
        if (!end) { face.textContent = `${t.timer}:00`; return; }
        startBtn.hidden = true;
        const left = end - Date.now();
        face.textContent = fmt(left);
        if (left <= 0) {
          clearInterval(tick);
          clock.classList.add('over');
          face.textContent = L('Hết giờ', "Time's up");
          doneBtn.disabled = true;
          doneBtn.classList.remove('pulse');
          doneBtn.textContent = L('⏰ Hết giờ rồi', "⏰ Time's up");
          if (!told.has('end')) {
            told.add('end');
            say(L(`Hết ${t.timer} phút rồi. Hôm nay con chưa được sao việc này. Ngày mai con cố ăn nhanh hơn nhé!`,
              `The ${t.timer} minutes are over. No star for this job today. Try to eat a little faster tomorrow!`));
          }
          return;
        }
        const mins = Math.ceil(left / 60000);
        for (const mark of [15, 5]) {
          if (mins === mark && t.timer > mark && !told.has(mark)) {
            told.add(mark);
            say(L(`Con còn ${mark} phút nữa. Cố lên nào!`, `You have ${mark} minutes left. Keep going!`));
          }
        }
      };
      const run = () => {
        clearInterval(tick);
        tick = setInterval(() => { if (life.alive) update(); }, 1000);
        // Giữ màn hình sáng trong bữa ăn (nếu trình duyệt hỗ trợ)
        try { navigator.wakeLock && navigator.wakeLock.request('screen').then((w) => { wake = w; if (!life.alive) w.release(); }).catch(() => {}); } catch (e) { /* */ }
      };
      const start = () => {
        timerStart(id, t.timer);
        update(); run();
        say(L(`Bắt đầu tính giờ. Con có ${t.timer} phút để ăn hết nhé!`, `The timer starts now. You have ${t.timer} minutes to finish!`));
      };
      update();
      if (timerEnd(id) > Date.now()) run();
    }

    root.append(h('div', { class: 'task' },
      h('div', { class: 'emo', text: t.e }),
      h('h2', { text: t.t }),
      t.stars ? h('p', { class: 'task-stars', text: `+${t.stars} ⭐` }) : null,
      goalText ? h('p', { class: 'goal', text: '🎯 ' + goalText }) : null,
      clock,
      items.length ? h('ol', { class: 'steps' }, items) : null,
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
      if (!life.alive) return;
      if (goalText && !(await say(goalText + '.'))) return;
      if (life.alive && !doneBtn.disabled) say(L('Làm xong thì con bấm nút màu xanh nhé!', 'When you finish, tap the green button!'));
    }
    readSteps();
    return () => { clearInterval(tick); try { wake && wake.release(); } catch (e) { /* */ } };
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
        emoji: G.emoji, title: L('Hoàn thành!', 'All done!'), text: G.done, speech: G.done,
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
        speech: L('Hoan hô! Phòng của con gọn gàng sạch đẹp rồi!', 'Hooray! Your room is clean and tidy!'),
        buttons: params.kind ? [DONE] : [[L('Chơi lại 🔁', 'Play again 🔁'), 'orange'], DONE],
      });
      if (!life.alive) return;
      if (params.kind) completeTask(params.kind, params.task, null);
      else if (ans === 0) go('tidy', params);
      else go('selfcare');
    }
  },
});
