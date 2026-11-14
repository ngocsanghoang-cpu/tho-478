// Service Worker: lưu ứng dụng để dùng khi không có mạng.
// Khi có mạng, luôn lấy bản mới nhất từ máy chủ (bản lưu chỉ dùng khi mất mạng hoặc mạng quá chậm),
// nên mỗi lần phát hành bản mới bé thấy ngay ở lần mở kế tiếp.
// Nhớ tăng VERSION (và APP_VERSION trong js/app.js) mỗi lần phát hành.
const VERSION = 'bevuihoc-v17';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/ui.js', 'js/speech.js', 'js/sound.js', 'js/store.js', 'js/vi.js', 'js/i18n.js', 'js/play.js', 'js/math.js', 'js/explore.js', 'js/rewards.js', 'js/homework.js', 'js/approve.js', 'js/playtime.js', 'js/sync.js', 'js/parent.js', 'parent.html', 'css/parent.css',
  'js/selfcare.js', 'js/writing.js', 'js/counting.js', 'js/parents.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' = bỏ qua bộ nhớ đệm HTTP của trình duyệt, lấy thẳng từ máy chủ
  e.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;

  // Phông chữ: trả bản lưu ngay, cập nhật ở nền (ít khi đổi)
  if (isFont) {
    e.respondWith(caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    }));
    return;
  }

  // Tệp của ứng dụng: ưu tiên máy chủ; mất mạng hoặc quá 4 giây thì dùng bản lưu
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    if (!cached) return network;
    const slow = new Promise((resolve) => setTimeout(() => resolve(cached), 4000));
    return Promise.race([network.catch(() => cached), slow]);
  })());
});
