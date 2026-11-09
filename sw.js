/* Alfred Professeur : fonctionne sans internet après la première ouverture */
var CACHE = "alfred-professeur-v2";
var FICHIERS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  var memeSite = url.origin === self.location.origin;
  var police = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!memeSite && !police) return;
  /* Réseau d'abord (pour recevoir les mises à jour), sinon la copie gardée */
  e.respondWith(fetch(e.request).then(function (r) {
    if (r && (r.ok || r.type === "opaque")) { var copie = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copie); }); }
    return r;
  }).catch(function () {
    return caches.match(e.request).then(function (m) { return m || (e.request.mode === "navigate" ? caches.match("index.html") : undefined); });
  }));
});
