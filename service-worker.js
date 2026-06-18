/* ============================================================
   SERVICE WORKER – ENI APP
   Permite funcionamiento offline y caché de archivos
   ============================================================ */

const CACHE_NAME = "eni-cache-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* ============================
   INSTALACIÓN DEL SERVICE WORKER
   ============================ */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/* ============================
   ACTIVACIÓN
   ============================ */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* ============================
   INTERCEPTAR PETICIONES
   ============================ */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si existe en caché → lo devuelve
      if (response) return response;

      // Si no existe → intenta obtenerlo de internet
      return fetch(event.request).catch(() => {
        // Si falla (sin internet) → no hace nada especial
        return new Response(
          "Sin conexión y el recurso no está en caché.",
          { status: 503, statusText: "Offline" }
        );
      });
    })
  );
});
