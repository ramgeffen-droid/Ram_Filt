const CACHE="ram-fit-v10";
const ASSETS=["./","./index.html","./styles.css","./app.js","./reminder-enhance.js","./workout-flex.js","./health-tracking.js","./meal-expansion.js","./report-share.js","./barcode-food.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("message",e=>{if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
  const req=e.request;
  const url=new URL(req.url);
  if(req.mode==="navigate"){
    e.respondWith(fetch(req,{cache:"no-store"}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return res}).catch(()=>caches.match("./index.html")));
    return;
  }
  if(url.origin===self.location.origin){
    e.respondWith(fetch(req,{cache:"no-store"}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req)));
    return;
  }
});
self.addEventListener("push",e=>{let data={title:"Ram Fit",body:"יש עדכון חדש"};try{data={...data,...e.data.json()}}catch{if(e.data)data.body=e.data.text()}e.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:"./icon-192.png",badge:"./icon-192.png",data:data.url||"./"}))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{for(const w of ws){if("focus" in w)return w.focus()}return clients.openWindow(e.notification.data||"./")}))});