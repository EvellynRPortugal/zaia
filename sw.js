/* Service Worker da Zaia — cache leve do "casco" do app pra abrir offline */
const CACHE = 'zaia-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Firebase, Spotify, Google e afins: sempre pela rede (dados ao vivo)
  if (!url.startsWith(self.location.origin) ||
      url.includes('firestore') || url.includes('googleapis') ||
      url.includes('firebaseio') || url.includes('spotify') ||
      url.includes('google') || url.includes('gstatic')) {
    return; // deixa o navegador tratar normalmente
  }
  // Arquivos do próprio app: cache primeiro, rede como reforço
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copia = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
