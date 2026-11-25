const CACHE='kwatera-glowna-pwa-2.0.4-site';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.svg','./updates.js','./version.json'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(x=>new Request(new URL(x,self.registration.scope),{cache:'reload'})));
// Bootstrap the updater for legacy 2.0.1 clients, which have no update button.
if(await caches.has('kwatera-glowna-pwa-2.0.1-site'))await self.skipWaiting();})()));
self.addEventListener('message',e=>{if(e.data?.type==='KG_SKIP_WAITING')e.waitUntil(self.skipWaiting());});
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('kwatera-glowna-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url),scope=new URL(self.registration.scope);if(u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname))return;const version=new URL('./version.json',scope);if(u.pathname===version.pathname){e.respondWith(fetch(e.request,{cache:'no-store'}));return;}if(e.request.mode==='navigate'&&(u.pathname===scope.pathname||u.pathname===new URL('./index.html',scope).pathname)){e.respondWith(caches.open(CACHE).then(c=>c.match('./index.html')).then(r=>r||fetch(e.request)));return;}if(FILES.some(p=>new URL(p,scope).pathname===u.pathname)){e.respondWith(caches.open(CACHE).then(c=>c.match(e.request)).then(r=>r||fetch(e.request)));}});
