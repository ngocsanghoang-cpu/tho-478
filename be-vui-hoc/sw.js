// Service Worker: lưu ứng dụng để dùng khi không có mạng
const VERSION = 'bevuihoc-v12';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/ui.js', 'js/speech.js', 'js/sound.js', 'js/store.js', 'js/vi.js', 'js/i18n.js', 'js/play.js', 'js/math.js', 'js/explore.js', 'js/rewards.js', 'js/homework.js',
  'js/selfcare.js', 'js/writing.js', 'js/counting.js', 'js/parents.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Trả bản lưu ngay, đồng thời cập nhật bản mới ở nền (kể cả phông chữ Google Fonts)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const cached = await cache.match(req, { ignoreSearch: !isFont });
    const network = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
