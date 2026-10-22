const V = 'cb-v3';
const ARCHIVOS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';   // lector de QR de respaldo (se guarda para usarlo sin internet)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all([c.addAll(ARCHIVOS), c.add(JSQR).catch(() => {})])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (r.url === JSQR){   // copia guardada primero; si no existe, la descarga y la guarda (solo si llegó bien)
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok){ const copia = res.clone(); caches.open(V).then(c => c.put(r, copia)); }
      return res;
    })));
    return;
  }
  if (u.origin !== location.origin) return;
  // Red primero (así llegan las actualizaciones); sin red, usa la copia guardada.
  e.respondWith(fetch(r).then(res => {
    if (res.ok){ const copia = res.clone(); caches.open(V).then(c => c.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
