const CACHE='portfel-plus-offline-v29';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key.startsWith('portfel-plus-offline-')).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;const path=new URL(request.url).pathname;if(path.endsWith('/manifest.webmanifest')){event.respondWith(fetch(request).catch(()=>caches.match(request)));return;}event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));});
