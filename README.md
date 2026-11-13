# tho-478

Repo này có hai ứng dụng web:

| Thư mục | Ứng dụng |
|---|---|
| `index.html` | Ứng dụng thở 4-7-8 |
| [`be-vui-hoc/`](be-vui-hoc/) | **Bé Vui Học (Happy Learning)**: dạy bé tự lập, làm bài tập, tập viết, học đếm, học toán và khám phá trên iPad, có giọng nữ hướng dẫn bằng tiếng Anh |

---

## 🐰 Bé Vui Học

Đây là ứng dụng web (PWA) chạy trên Safari của iPad. Khi thêm vào Màn hình chính, ứng dụng mở toàn màn hình như app thật và **vẫn dùng được khi không có mạng**.

### Ngôn ngữ và giọng đọc

- Ứng dụng dùng **tiếng Anh** cho toàn bộ chữ trên màn hình và lời đọc. Trên màn hình, ứng dụng có tên “Happy Learning”.
- Bạn Thỏ (Bunny) đọc mọi hướng dẫn bằng giọng có sẵn trên máy. Ứng dụng tự chọn **giọng nữ** tiếng Anh nhẹ nhàng nhất mà máy có: Ava, Samantha (iPad, Mac), Jenny (Microsoft Edge), Google US English (Chrome). Giọng nam và các giọng “vui nhộn” bị bỏ qua.
- Mọi câu Bunny nói cũng hiện thành chữ trong bong bóng ở thanh trên cùng. Bé chạm vào bong bóng để nghe lại.
- Bản tiếng Việt vẫn còn trong ứng dụng: ba mẹ đổi được ở *For parents → Language*. Giọng tiếng Việt phụ thuộc vào máy (Linh trên iPad, HoaiMy trên Edge) và chất lượng không ổn định, nên tiếng Anh là mặc định.

Phần mô tả dưới đây dùng tên tiếng Việt của các mục cho dễ đọc; tên tiếng Anh trên màn hình ghi trong ngoặc ở lần đầu nhắc tới: Bé Tự Lập (I Can Do It), Bài tập hôm nay (Today's exercises), Tập Viết (Writing), Học Đếm (Counting), Học Toán (Math), Khám Phá (Explore), Đổi quà (Rewards), Góc ba mẹ (For parents).

### Cách hoạt động: bé tích việc, ba mẹ xác nhận, rồi mới được sao và được chơi

1. **Bé tích việc đã làm.** Trong Bé Tự Lập, bé làm xong việc nào thì bấm “I did it!”. Việc chuyển sang trạng thái ⏳ chờ ba mẹ, **chưa có sao**.
2. **Ba mẹ xác nhận thực tế.** Ba mẹ kiểm tra bé đã làm thật chưa rồi bấm **Yes** (đạt) hoặc **Not yet** (chưa đạt), trên điện thoại của ba mẹ hoặc ngay trên iPad (For parents → Check today's jobs).
   - Đạt: bé được sao của việc đó.
   - Chưa đạt: việc hiện ↩️, bé làm lại rồi tích lại.
3. **Xác nhận hết việc của một buổi** (sáng, trưa chiều, tối): bé được thưởng thêm sao và **một lần mở khoá chơi 10 phút**.
4. **Trò chơi và bài tập luôn bị khoá** (Today's exercises, Writing, Counting, Math, Explore, trò dọn đồ). Bé chỉ vào được trong 10 phút mở khoá. Trên thanh trên cùng có đồng hồ đếm ngược; còn 1 phút thì bạn Thỏ nhắc; hết giờ thì bé bị đưa về trang chính và mọi thứ khoá lại.
5. Vé chơi chỉ dùng trong ngày. Bé có thể bấm “Later” để dành vé và bắt đầu chơi sau.

Ba mẹ chỉnh được số phút mỗi lần mở khoá ở *For parents → Play time* (5–30 phút).

### Trang của ba mẹ trên điện thoại

Trang `parent.html` dành cho điện thoại của ba mẹ. Trên đó ba mẹ:
- Thấy các việc bé vừa tích đang chờ, bấm **Yes**, **Not yet** hoặc **Yes to all**.
- Xem toàn bộ việc hôm nay và trạng thái từng việc; đánh dấu đạt cả những việc bé quên tích; hoàn tác một xác nhận.
- Đổi hôm nay thành ngày đi học hoặc ngày nghỉ.
- Giao việc thêm (phơi đồ, gấp đồ…).
- Thưởng hoặc trừ sao.
- Đổi chữ trên trang sang tiếng Việt bằng nút 🇻🇳 ở cuối trang.

iPad và điện thoại nối với nhau qua một cơ sở dữ liệu trực tuyến miễn phí (Firebase Realtime Database). iPad đồng bộ khoảng 5 giây một lần khi ứng dụng đang mở và có mạng. **Khi chưa cài đặt phần này, ba mẹ vẫn xác nhận được ngay trên iPad.**

**Cài đặt một lần (khoảng 10 phút):**

1. Mở https://console.firebase.google.com, đăng nhập bằng tài khoản Google, bấm **Create a project** (đặt tên bất kỳ, có thể tắt Google Analytics).
2. Ở menu bên trái chọn **Build → Realtime Database → Create Database**. Chọn vị trí gần Việt Nam (Singapore), rồi chọn **Start in locked mode**.
3. Mở tab **Rules**, xoá nội dung cũ, dán đoạn dưới đây rồi bấm **Publish**:
   ```json
   {
     "rules": {
       "families": {
         "$code": { ".read": true, ".write": true }
       }
     }
   }
   ```
4. Mở tab **Data**, chép địa chỉ ở đầu trang. Nó có dạng `https://ten-du-an-default-rtdb.asia-southeast1.firebasedatabase.app`.
5. Trên iPad: giữ nút **For parents** 2 giây → mục **Parent phone** → dán địa chỉ vào ô *Database URL*. Ứng dụng tự tạo *Family code* và báo “Connected”.
6. Bấm **Share link**, gửi đường link sang điện thoại của ba mẹ (AirDrop, Zalo, tin nhắn…) và mở link đó. Có thể thêm trang này vào Màn hình chính của điện thoại.

Về bảo mật: với quy tắc ở bước 3, chỉ người biết mã gia đình (12 ký tự ngẫu nhiên, nằm trong đường link) mới đọc và ghi được dữ liệu, và không ai liệt kê được các mã. Dữ liệu gửi lên chỉ gồm tên gọi ở nhà của bé, danh sách việc trong ngày, trạng thái từng việc và số sao. Đừng chia sẻ đường link cho người ngoài.

Phần đồng bộ mới được kiểm thử với một máy chủ giả lập cùng giao thức, chưa chạy với một dự án Firebase thật.

### Các phần học

**👧 Bé Tự Lập**: các việc trong ngày, có lịch riêng cho **ngày đi học** và **ngày nghỉ**. Bé chạm vào từng việc để nghe hướng dẫn từng bước và tiêu chí đạt, làm xong thì bấm “Con làm xong rồi!” để nhận sao. Danh sách được làm mới mỗi ngày.

*Ngày đi học* (mặc định thứ Hai đến thứ Sáu)
- ☀️ **Buổi sáng** (5 việc)
  1. Tự đi vệ sinh và làm sạch. Đạt khi: sạch sẽ, không có mùi hôi.
  2. Tự rửa mặt. Đạt khi: mặt sạch, mắt và miệng không có ghèn.
  3. Tự cởi đồ ngủ và mặc quần áo mới.
  4. Uống thuốc và 1 ly nước đầy (chỉ uống thuốc do ba mẹ đưa).
  5. Tự mang tất, mang giày, đi học sớm.
- 🌙 **Buổi tối** (5 việc)
  1. Về nhà cất giày vào tủ, bỏ quần áo bẩn vào giỏ.
  2. Tự xúc ăn tối hết trong 45 phút: 1 chén cơm đầy, nửa chén thức ăn, nửa chén canh (3 ⭐).
  3. Tự uống sữa (200 ml).
  4. Sắp xếp đồ chơi gọn gàng.
  5. Tự leo lên giường, tắt đèn và ngủ.

*Ngày nghỉ* (cuối tuần, lễ)
- ☀️ **Buổi sáng**: đi vệ sinh và làm sạch, rửa mặt, đánh răng (hẹn giờ 2 phút), tự xúc ăn sáng (3 ⭐), uống sữa lúc 10 giờ sáng.
- 🌤️ **Buổi trưa, chiều**: tự xúc ăn trưa (3 ⭐), uống sữa lúc 4 giờ chiều.
- 🌙 **Buổi tối**: tự xúc ăn tối (3 ⭐), sắp xếp đồ chơi, uống sữa lúc 8 giờ tối, đánh răng.

*Chung cho cả hai loại ngày*
- 🥄 **Bữa ăn** có đồng hồ đếm ngược 45 phút. Nếu đã bật đồng hồ mà hết giờ thì bữa đó không được sao.
- 📋 **Việc ba mẹ giao thêm**: hôm nào có việc (phơi đồ, gấp đồ…), ba mẹ vào Góc ba mẹ bấm “Giao hôm nay”. Việc hiện trong Bé Tự Lập đến hết ngày.
- 🏫 **Đổi loại ngày**: nếu hôm nay bé nghỉ đột xuất (lễ, ốm…), ba mẹ bấm “Ngày nghỉ” trong Góc ba mẹ để chuyển sang lịch ngày nghỉ; chỉ áp dụng cho hôm đó. Ba mẹ cũng chọn được những ngày nào trong tuần là ngày đi học.
- 🌟 **Tập thêm cho quen tay** (không tính sao): mặc quần áo, mang giày dép, xếp quần áo, trò dọn đồ chơi, rửa tay 8 bước, đánh răng 2 phút.

**📝 Bài tập hôm nay**: mỗi ngày ứng dụng chọn sẵn một số bài, đổi theo ngày và xoay vòng qua ba nhóm (viết, số, khám phá). Chỉ những bài này mới được sao.
- Ngày đi học có 1 bài. Ngày nghỉ có gấp đôi, tức 2 bài.
- Bài tập cũng bị khoá như trò chơi: bé chỉ làm được trong 10 phút mở khoá sau mỗi buổi.
- **Mỗi bài làm 8 phút**, để vừa trong một lần mở khoá 10 phút. Bé trả lời liên tục (hoặc tô liên tục các chữ kế tiếp) cho tới khi đủ giờ; trên màn hình có thanh thời gian.
- Đồng hồ chỉ chạy khi bé đang làm: quá 45 giây không chạm màn hình thì tạm dừng và bạn Thỏ nhắc bé làm tiếp. Bé cũng phải làm đúng ít nhất 8 câu (hoặc tô đạt 8 chữ) thì bài mới tính xong.
- Bé rời bài giữa chừng thì thời gian đã làm vẫn được giữ lại trong ngày.
- Chơi thêm ngoài bài tập (vào thẳng Tập Viết, Học Đếm, Học Toán, Khám Phá) thì mỗi lượt vẫn là 5 câu và không tính sao, nên sao không bị “lạm phát”.
- Ba mẹ chỉnh được số bài mỗi ngày (0–5), số phút mỗi bài (3–15), hệ số ngày nghỉ (1, 2 hoặc 3 lần) và bật, tắt từng loại bài.

Có 14 loại bài tập, mỗi bài làm trong 8 phút:

| Nhóm | Bài tập | Bé làm gì |
|---|---|---|
| Viết | Tô chữ thường | Tô lần lượt các chữ thường |
| Viết | Tô chữ hoa | Tô lần lượt các chữ hoa |
| Viết | Tô chữ số | Tô lần lượt các chữ số |
| Số | Đếm và chọn | Đếm đồ vật rồi chọn số đúng |
| Số | Nhiều hơn, ít hơn | Chọn bên có nhiều hơn hoặc ít hơn |
| Số | Tìm số | Chạm vào bong bóng có số được đọc |
| Số | Phép cộng | Cộng bằng hình |
| Số | Phép trừ | Trừ bằng hình |
| Số | Phép nhân | Đếm các nhóm bằng nhau |
| Số | Phép chia | Chia đều cho các bạn |
| Khám phá | Đố các ngày trong tuần | Trước, sau một ngày là ngày nào |
| Khám phá | Đố các tháng trong năm | Trước, sau một tháng là tháng nào |
| Khám phá | Đố ngày hay đêm | Việc này vào ban ngày hay ban đêm |
| Khám phá | Đố trái hay phải | Bên trái hay bên phải |

**✏️ Tập Viết**
- Tiếng Việt: 29 chữ thường, 29 chữ hoa (gồm ă, â, đ, ê, ô, ơ, ư). Tiếng Anh: 26 chữ thường, 26 chữ hoa. Cả hai đều có 10 chữ số. Chữ hiện trên nền giấy ô ly với nét chấm để bé tô.
- Bé tô bằng ngón tay hoặc Apple Pencil, được chọn màu bút, xoá từng nét hoặc xoá hết.
- Bé bấm **Xong** thì ứng dụng chấm điểm: tô kín chữ và không lem ra ngoài thì được 1–3 bông hoa 🌸. Nếu tô còn thiếu, phần thiếu sẽ hiện màu cam.
- Chế độ **Tự viết**: chữ mẫu mờ đi để bé tự viết.
- Mỗi chữ có từ ví dụ kèm hình (b – 🦋 bướm, B – 🦋 butterfly).

**🔢 Học Đếm** (3 mức: 1–5, 1–10, 1–20)
- **Làm quen số 0–20**: bé chạm từng đồ vật để đếm, hoặc bấm “Đếm cùng cô”.
- **Đếm và chọn**: “Có bao nhiêu quả táo?”. Mỗi lần bé chạm, đồ vật được đánh số và đọc to.
- **Nhiều hơn, ít hơn**: bé chọn bên có nhiều hơn hoặc ít hơn.
- **Tìm số**: bé chạm vào bong bóng có số đúng.

**🧮 Học Toán** (3 mức: Dễ, Vừa, Khó), mỗi phép tính đều có hình minh hoạ
- ➕ **Phép cộng**: hai nhóm đồ vật gộp lại.
- ➖ **Phép trừ**: các đồ vật bị gạch đi.
- ✖️ **Phép nhân**: nhiều nhóm bằng nhau (“Có 3 nhóm, mỗi nhóm 2 quả táo”).
- ➗ **Phép chia**: chia đều cho các bạn. Trả lời đúng thì đồ vật hiện ra trong phần của từng bạn.

**🌈 Khám Phá**
- 📅 **Ngày tháng**: lịch “Hôm nay, hôm qua, ngày mai”, 7 ngày trong tuần, 12 tháng trong năm, kèm đố vui (“Sau thứ Hai là ngày nào?”).
- 🌞 **Ngày và đêm**: khung cảnh đổi theo sáng, trưa, chiều, tối, giải thích mặt trời, mặt trăng và việc làm từng buổi. Có đố vui “Ngày hay đêm?”.
- 👈👉 **Trái và phải**: bé chạm từng bên để nghe, rồi chơi đố: bạn nào ở bên trái, con vật đang ở bên nào, đưa bạn thỏ sang trái hoặc phải.

**⭐ Sao và 🎁 Đổi quà** (ý tưởng chính của ứng dụng)

Bé tự làm việc của mình và làm bài tập thì được sao. Sao gom lại để đổi quà thật do ba mẹ đặt, ví dụ đi khu vui chơi cuối tuần hoặc mua đồ chơi.

Luật nhận sao mặc định (ba mẹ chỉnh được từng mục, từ 0 đến 10 sao):

| Bé làm gì | Sao |
|---|---|
| 👧 Tự làm xong 1 việc, ba mẹ xác nhận | +1 ⭐ |
| 🥄 Tự xúc ăn hết 1 bữa trong 45 phút, ba mẹ xác nhận | +3 ⭐ |
| 🏅 Ba mẹ xác nhận hết việc của 1 buổi | +1 ⭐ thưởng và 10 phút chơi |
| 👕 Ba mẹ nhờ: phơi đồ | +2 ⭐ |
| 🧺 Ba mẹ nhờ: gấp đồ | +2 ⭐ |
| 📝 Làm xong 1 bài tập hôm nay (8 phút, trong giờ chơi) | +1 ⭐ |
| 🎓 Làm hết bài tập hôm nay | +1 ⭐ thưởng |

Với luật mặc định:

| | Tự lập | Bài tập | Tổng |
|---|---|---|---|
| Một ngày đi học hoàn hảo | 14 ⭐ | 2 ⭐ (1 bài + thưởng) | 16 ⭐ |
| Một ngày nghỉ hoàn hảo | 20 ⭐ | 3 ⭐ (2 bài + thưởng) | 23 ⭐ |
| Một tuần hoàn hảo (5 ngày đi học, 2 ngày nghỉ) | 110 ⭐ | 16 ⭐ | 126 ⭐ |

- Chưa tính việc ba mẹ giao thêm. Góc ba mẹ tự tính lại các con số này khi ba mẹ đổi luật, và ước tính mỗi món quà cần bao nhiêu tuần.
- Mục **Đổi quà** cho bé thấy còn thiếu bao nhiêu sao cho từng món quà, kèm bảng “Làm gì thì được sao?”.
- Khi đủ sao, bé bấm **Đổi quà**, ba mẹ giữ nút 2 giây để đồng ý rồi sao mới bị trừ. Quà đã đổi được lưu lại.
- Ba mẹ có thể **thưởng thêm** hoặc **trừ bớt** sao bằng tay.
- Khi tô chữ, bông hoa 🌸 (1–3) là điểm tô đẹp, khác với ngôi sao ⭐ dùng để đổi quà.
- **Nhãn dán** là quà tặng thêm: cứ nhận được 5 ⭐ thì mở 1 nhãn dán, không tốn sao.

**👨‍👩‍👧 Góc ba mẹ** (phải giữ nút 2 giây mới vào được)
- Đổi hôm nay thành ngày nghỉ hoặc ngày đi học, giao việc thêm trong ngày.
- Đặt quà (tên, hình, số sao cần có), chỉnh luật nhận sao, số bài tập mỗi ngày và ngày đi học trong tuần.
- Chọn ngôn ngữ, chọn giọng đọc, chỉnh tốc độ đọc, bật hoặc tắt âm thanh hiệu ứng.
- Nhập tên gọi ở nhà của bé, để bạn Thỏ gọi tên khi khen.
- **Nhắc nghỉ ngơi**: sau 10–45 phút, ứng dụng nhắc bé nghỉ mắt 1 phút rồi mới chơi tiếp.
- Xem tiến độ học và xoá tiến độ.

### Cài lên iPad

1. Đưa thư mục `be-vui-hoc/` lên một trang web có HTTPS. Cách dễ nhất là **GitHub Pages**: vào *Settings → Pages* của repo, chọn nhánh cần đăng. Khi đó địa chỉ sẽ là
   `https://<tên-tài-khoản>.github.io/tho-478/be-vui-hoc/`
2. Mở địa chỉ đó bằng **Safari** trên iPad. Bấm nút **Chia sẻ** rồi chọn **Thêm vào MH chính**.
3. Mở ứng dụng **Happy Learning** từ màn hình chính và bấm **Start**. Lần bấm này cũng cho phép iPad phát tiếng.

**Nếu không nghe thấy tiếng:**
- Tắt chế độ im lặng và tăng âm lượng.
- Kiểm tra giọng đọc: *Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói*. Tiếng Việt chọn *Linh*, tiếng Anh chọn *Ava* hoặc *Samantha*. Nên tải bản *Nâng cao* để giọng tự nhiên hơn. Tải xong thì đóng hẳn ứng dụng rồi mở lại.
- Trên máy tính Windows, nên mở bằng **Microsoft Edge**: Edge có sẵn giọng nữ tự nhiên cho cả tiếng Việt (HoaiMy) và tiếng Anh (Jenny).

**Mẹo:** bật *Truy cập được hướng dẫn* (Cài đặt → Trợ năng) để bé không thoát được khỏi ứng dụng.

### Chạy thử trên máy tính

```bash
cd be-vui-hoc
python3 -m http.server 8000
# mở http://localhost:8000
```

### Cấu trúc mã

```
be-vui-hoc/
├── index.html            # khung trang (ứng dụng của bé)
├── parent.html           # trang của ba mẹ trên điện thoại
├── manifest.webmanifest  # thông tin cài đặt PWA
├── sw.js                 # lưu ứng dụng để chạy ngoại tuyến
├── css/style.css         # giao diện
├── icons/                # biểu tượng ứng dụng
└── js/
    ├── app.js            # màn chào (chọn ngôn ngữ), trang chính, nhãn dán, nhắc nghỉ
    ├── ui.js             # điều hướng, lời thoại, phần thưởng, hiệu ứng
    ├── i18n.js           # ngôn ngữ: L('tiếng Việt', 'English')
    ├── speech.js         # chọn giọng nữ và đọc (Web Speech API)
    ├── sound.js          # âm thanh hiệu ứng (Web Audio)
    ├── store.js          # lưu tiến độ (localStorage)
    ├── vi.js             # đọc số thành chữ (Việt, Anh)
    ├── play.js           # thành phần chung của các trò chơi
    ├── selfcare.js       # Bé Tự Lập
    ├── writing.js        # Tập Viết
    ├── counting.js       # Học Đếm
    ├── math.js           # Học Toán: cộng, trừ, nhân, chia
    ├── explore.js        # Khám Phá: ngày tháng, ngày đêm, trái phải
    ├── rewards.js        # Đổi quà và bảng luật nhận sao
    ├── homework.js       # Bài tập hôm nay
    ├── approve.js        # Ba mẹ xác nhận việc, thưởng sao, cấp vé chơi
    ├── playtime.js       # Khoá trò chơi, giờ chơi 10 phút
    ├── sync.js           # Đồng bộ iPad với điện thoại ba mẹ (Firebase REST)
    ├── parent.js         # Trang của ba mẹ trên điện thoại (parent.html)
    └── parents.js        # Góc ba mẹ
```

Ứng dụng không cần cài thư viện hay build, không thu thập dữ liệu. Mọi tiến độ chỉ lưu trên iPad của bé.
