const CACHE = 'trinitarian-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

self.addEventListener('push', function(e) {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Trinitarian', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      data: data.data || {},
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  const data = e.notification.data;
  let url = 'https://trinitarian.app/';
  if (data.sermon_id) url += '?sermon=' + data.sermon_id;
  e.waitUntil(clients.openWindow(url));
});
