/* Zaia V8 — somente navegação e ativos estáticos, sem cachear respostas privadas. */
const CACHE = 'zaia-v8-dark-cosmico';
const CORE = ['./','./index.html','./icon-192.png','./icon-512.png','./icon-maskable.png','./apple-touch-icon.png','./zaia_logo.png','./zaia_logo_sec.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.all(CORE.map(async path=>{try{const response=await fetch(path,{cache:'reload'});if(response.ok)await cache.put(path,response);}catch(_){}}));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('zaia-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 // Apenas a navegação e arquivos locais conhecidos; nunca respostas de APIs ou imagens externas.
 const path=url.pathname.substring(self.registration.scope.length ? new URL(self.registration.scope).pathname.length : 0);
 const isNavigation=request.mode==='navigate';
 const known=CORE.some(p=>p.replace(/^\.\//,'')===path);
 if(!isNavigation&&!known)return;
 event.respondWith((async()=>{
   try{
     const response=await fetch(request);
     if(response.ok&&response.type==='basic'){
       const cache=await caches.open(CACHE);
       await cache.put(request,response.clone());
     }
     return response;
   }catch(error){
     const cached=await caches.match(request);
     if(cached)return cached;
     if(isNavigation){const fallback=await caches.match('./index.html');if(fallback)return fallback;}
     return Response.error();
   }
 })());
});
