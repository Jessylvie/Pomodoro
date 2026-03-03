const CACHE_VERSION = 'v4';
const CACHE_NAME = `pomodoro-${CACHE_VERSION}`;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/index.html', '/manifest.json']).catch(() => {});
    })
  );
  // 立即激活新版本，不等待旧版本关闭
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] 删除旧缓存:', k);
        return caches.delete(k);
      }))
    )
  );
  // 立即接管所有页面
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    // 网络优先策略：先尝试从网络获取最新版本
    fetch(e.request).then(response => {
      if (e.request.method === 'GET' && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(() => {
      // 网络失败时才用缓存（离线模式）
      return caches.match(e.request).then(cached => cached || caches.match('/index.html'));
    })
  );
});
