# tho-478

Repo này có hai ứng dụng web:

| Thư mục | Ứng dụng |
|---|---|
| `index.html` | Ứng dụng thở 4-7-8 |
| [`be-vui-hoc/`](be-vui-hoc/) | **Bé Vui Học**: dạy bé tự lập, tập viết chữ và học đếm trên iPad, có giọng nói hướng dẫn tiếng Việt |

---

## 🦉 Bé Vui Học

Đây là ứng dụng web (PWA) chạy trên Safari của iPad. Khi thêm vào Màn hình chính, ứng dụng mở toàn màn hình như app thật và **vẫn dùng được khi không có mạng**. Cú Mèo dùng giọng tiếng Việt có sẵn trên iPad (giọng “Linh”) để đọc hướng dẫn cho bé. Mọi câu Cú Mèo nói cũng hiện thành chữ trong bong bóng ở thanh trên cùng. Bé chạm vào bong bóng để nghe lại.

### Các phần học

**🧒 Bé Tự Lập**
- ☀️ **Việc buổi sáng** (7 việc) và 🌙 **việc buổi tối** (6 việc). Bé chạm vào từng việc để nghe hướng dẫn từng bước. Làm xong, bé bấm “Con làm xong rồi!” để nhận sao. Danh sách được làm mới mỗi ngày.
- 🧼 **Rửa tay 8 bước**: tự chuyển bước theo giờ và đếm to “một, hai, ba…” để bé vừa rửa tay vừa tập đếm.
- 🪥 **Đánh răng 2 phút**: đồng hồ đếm ngược, nhắc bé chải từng mặt răng.
- 👕 **Tự mặc quần áo**: hướng dẫn từng bước.
- 🧸 **Dọn đồ chơi**: trò chơi kéo thả, bé cất đồ chơi vào hộp, quần áo vào giỏ, sách bút lên giá.

**✏️ Tập Viết**
- Có 29 chữ thường, 29 chữ hoa (gồm ă, â, đ, ê, ô, ơ, ư) và 10 chữ số. Chữ hiện trên nền giấy ô ly với nét chấm để bé tô.
- Bé tô bằng ngón tay hoặc Apple Pencil, được chọn màu bút, xoá từng nét hoặc xoá hết.
- Bé bấm **Xong** thì ứng dụng chấm điểm: tô kín chữ và không lem ra ngoài thì được 1–3 sao. Nếu tô còn thiếu, phần thiếu sẽ hiện màu cam.
- Chế độ **Tự viết**: chữ mẫu mờ đi để bé tự viết, làm được thì có thêm sao thưởng.
- Mỗi chữ đọc theo âm (bờ, cờ, dờ…) kèm từ ví dụ có hình (b – 🐄 bò).

**🔢 Học Đếm** (có 3 mức: 1–5, 1–10, 1–20)
- **Làm quen số 0–20**: bé chạm từng đồ vật để đếm, hoặc bấm “Đếm cùng cô”.
- **Đếm và chọn**: “Có bao nhiêu quả táo?”. Mỗi lần bé chạm, đồ vật được đánh số và đọc to.
- **Nhiều hơn, ít hơn**: bé chọn bên có nhiều hơn hoặc ít hơn.
- **Cộng và trừ** bằng hình ảnh (thêm vào, bớt đi).
- **Tìm số**: bé chạm vào bong bóng có số đúng.

**🎁 Phần thưởng**: cứ 5 ⭐ bé mở được 1 nhãn dán con vật mới, tổng cộng có 36 nhãn dán.

**👨‍👩‍👧 Góc bố mẹ** (phải giữ nút 2 giây mới vào được)
- Nhập tên gọi ở nhà của bé, để Cú Mèo gọi tên khi khen.
- Chọn giọng đọc, chỉnh tốc độ đọc, bật hoặc tắt âm thanh hiệu ứng.
- **Nhắc nghỉ ngơi**: sau 10–45 phút, ứng dụng nhắc bé nghỉ mắt 1 phút rồi mới chơi tiếp.
- Xem tiến độ học và xoá tiến độ.

### Cài lên iPad

1. Đưa thư mục `be-vui-hoc/` lên một trang web có HTTPS. Cách dễ nhất là **GitHub Pages**: vào *Settings → Pages* của repo, chọn nhánh cần đăng. Khi đó địa chỉ sẽ là
   `https://<tên-tài-khoản>.github.io/tho-478/be-vui-hoc/`
2. Mở địa chỉ đó bằng **Safari** trên iPad. Bấm nút **Chia sẻ** rồi chọn **Thêm vào MH chính**.
3. Mở ứng dụng **Bé Vui Học** từ màn hình chính và bấm **Bắt đầu**. Lần bấm này cho phép iPad phát tiếng.

**Nếu không nghe thấy tiếng:**
- Tắt chế độ im lặng và tăng âm lượng.
- Kiểm tra giọng tiếng Việt: *Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt → Linh*. Nên tải bản *Nâng cao* để giọng tự nhiên hơn. Tải xong thì đóng hẳn ứng dụng rồi mở lại.

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
├── index.html            # khung trang
├── manifest.webmanifest  # thông tin cài đặt PWA
├── sw.js                 # lưu ứng dụng để chạy ngoại tuyến
├── css/style.css         # giao diện
├── icons/                # biểu tượng ứng dụng
└── js/
    ├── app.js            # màn chào, trang chính, nhãn dán, nhắc nghỉ
    ├── ui.js             # điều hướng, lời thoại, phần thưởng, hiệu ứng
    ├── speech.js         # giọng nói tiếng Việt (Web Speech API)
    ├── sound.js          # âm thanh hiệu ứng (Web Audio)
    ├── store.js          # lưu tiến độ (localStorage)
    ├── vi.js             # đọc số bằng tiếng Việt
    ├── selfcare.js       # Bé Tự Lập
    ├── writing.js        # Tập Viết
    ├── counting.js       # Học Đếm
    └── parents.js        # Góc bố mẹ
```

Ứng dụng không cần cài thư viện hay build, không thu thập dữ liệu. Mọi tiến độ chỉ lưu trên iPad của bé.
