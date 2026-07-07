// 潮兴纺织 Service Worker — 离线缓存 + 秒开 (无CDN)
var CACHE = "cx-v4";

// 安装时预缓存核心文件
self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll([
        "/",
        "/index.html",
        "/products.json",
        "/bg.jpg",
        "/js/xlsx.full.min.js"
      ]);
    }).then(function(){ return self.skipWaiting(); })
  );
});

// 激活时清理旧缓存
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// 本站资源：缓存优先 + 后台刷新
self.addEventListener("fetch", function(e){
  var url = e.request.url;

  if(url.indexOf(self.location.hostname) >= 0 &&
     (url.endsWith(".json") || url.endsWith(".html") || url.endsWith(".jpg") ||
      url.endsWith(".jpeg") || url.endsWith(".png") || url.endsWith(".webp") ||
      url.indexOf("/js/") >= 0)){
    e.respondWith(
      caches.match(e.request).then(function(cached){
        var fetchPromise = fetch(e.request).then(function(res){
          if(res.ok){
            var copy = res.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          }
          return res;
        }).catch(function(){ return cached; });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 其他请求走网络
  e.respondWith(
    fetch(e.request).catch(function(){
      return caches.match(e.request);
    })
  );
});
