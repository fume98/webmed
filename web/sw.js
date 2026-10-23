// Guarda la app en el equipo para que abra sin internet. Los datos van por IndexedDB, no por acá.
const CACHE = 'agenda-pl-v2';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'demo.js', 'manifest.webmanifest', 'logo-full.png', 'logo-mono.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return;
  // Red primero (para recibir actualizaciones), y si no hay conexión, la copia guardada.
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && (u.origin === location.origin || u.host.includes('fonts.g'))) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request).then((m) => m || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
