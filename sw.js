/* Mapa sebe — service worker */
var CACHE = "zjh-pwa-v23";
var SHELL = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./mapa.html","./quests.json"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }));
  self.skipWaiting();
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});

/* HTML a quests.json = NETWORK-FIRST (vždy zkus čerstvé → appka se sama aktualizuje).
   Statické (ikony, mapy) = CACHE-FIRST (rychlé, offline). */
self.addEventListener("fetch", function(e){
  if(e.request.method!=="GET") return;
  var url = new URL(e.request.url);
  var isNav = e.request.mode==="navigate";
  var isHTML = isNav || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  var isData = url.pathname.indexOf("quests.json")>=0;

  if(isHTML || isData){
    e.respondWith(
      fetch(e.request).then(function(res){
        if(res && res.ok){ var clone=res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, clone); }); }
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(hit){ return hit || caches.match("./index.html"); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        if(res && res.ok){ var clone=res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, clone); }); }
        return res;
      }).catch(function(){ return caches.match("./index.html"); });
    })
  );
});
