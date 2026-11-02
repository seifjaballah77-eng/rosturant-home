const CACHE="matbakhi-cache-v9";
const IMAGE_CACHE="matbakhi-images-v1";
const CORE=["./","./index.html","./styles.css","./app.js","./spicy-recipes.js","./world-recipes.js","./dessert-recipes.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key!==IMAGE_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin===location.origin){
  event.respondWith(caches.match(req).then(cached=>{
   const fresh=fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}return res}).catch(()=>cached);
   return cached||fresh;
  }));
  return;
 }
 if(url.hostname==="upload.wikimedia.org"){
  event.respondWith(caches.open(IMAGE_CACHE).then(cache=>cache.match(req).then(cached=>{
   if(cached)return cached;
   return fetch(req).then(res=>{if(res&&(res.ok||res.type==="opaque"))cache.put(req,res.clone());return res}).catch(()=>cached||Response.error());
  })));
 }
});
self.addEventListener("message",event=>{if(event.data==="SKIP_WAITING")self.skipWaiting()});
