/* Service Worker da Zaia — v3
   Estratégia: REDE PRIMEIRO (sempre pega a versão nova quando há internet),
   e usa o cache só como reserva quando estiver offline. */
const CACHE = 'zaia-v3';
const ARQUIVOS = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).catch(()=>{}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Serviços externos (Firebase, Spotify, Google): sempre pela rede, sem cache.
  if (!url.startsWith(self.location.origin) ||
      url.includes('firestore') || url.includes('googleapis') ||
      url.includes('firebaseio') || url.includes('spotify') ||
      url.includes('google') || url.includes('gstatic')) {
    return;
  }
  // Arquivos do próprio app: tenta a REDE primeiro; se falhar (offline), usa o cache.
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
        return resp;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
