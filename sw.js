const CACHE_NAME = 'tungu-audio-v1';
const ASSETS_TO_CACHE =[
    './',
    './index.html',
    './style.css',
    './main.js',
    './data.js',
    './avt.jpg'
];

// Cài đặt Service Worker và lưu các file tĩnh vào Cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Đã mở cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Kích hoạt và xóa Cache cũ nếu có bản mới
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Chặn các request và trả về từ Cache nếu có, không có thì tải từ Internet
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Trả về cache nếu tìm thấy, ngược lại gọi fetch(request)
                return response || fetch(event.request);
            })
    );
});