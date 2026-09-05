/* 有給休暇 確認アプリ － オフライン用（ホーム画面からアプリとして起動するため） */
const CACHE = 'yukyu-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon.svg'];

self.addEventListener('install', function(ev){
  ev.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function(ev){
  ev.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                           .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* データ（yukyu-secure.js）とページ本体は「まずネットワーク」＝更新をすぐ反映。
   つながらないときだけキャッシュを使う。画像などは「まずキャッシュ」。 */
self.addEventListener('fetch', function(ev){
  const req = ev.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const fresh = req.mode === 'navigate'
             || url.pathname.endsWith('/index.html')
             || url.pathname.endsWith('yukyu-secure.js')
             || url.pathname.endsWith('yukyu-data.js');
  if(fresh){
    ev.respondWith(
      fetch(req).then(function(res){
        const copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match('./index.html');
        });
      })
    );
  } else {
    ev.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){
          const copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
          return res;
        });
      })
    );
  }
});
