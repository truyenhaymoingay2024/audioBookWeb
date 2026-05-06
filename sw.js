const CACHE_NAME = 'tungu-audio-v2026.05.06'; 
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
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Đã mở cache v2026.05.06');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Kích hoạt và xóa Cache cũ (v1) nếu có bản mới
self.addEventListener('activate', event => {
    // Giành quyền kiểm soát các tab đang mở ngay lập tức
    event.waitUntil(self.clients.claim());
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Đang xóa cache cũ:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Phân luồng chiến lược Cache
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // 1. Đối với data.js và index.html -> ƯU TIÊN MẠNG (Network First)
    // Luôn tải dữ liệu mới nhất. Chỉ dùng cache khi mất mạng.
    if (requestUrl.pathname.endsWith('data.js') || requestUrl.pathname.endsWith('index.html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Tải thành công thì update luôn vào cache để dành lúc offline
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    // Mất mạng thì lấy từ cache ra
                    return caches.match(event.request);
                })
        );
    } 
    // 2. Đối với hình ảnh, CSS, JS tĩnh -> ƯU TIÊN CACHE (Cache First)
    // Giúp web load cực nhanh và tiết kiệm dung lượng
    else {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request).then(fetchRes => {
                        // Tranh thủ lưu vào cache nếu chưa có
                        const responseClone = fetchRes.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                        return fetchRes;
                    });
                })
        );
    }
});