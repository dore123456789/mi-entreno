// ---------- Modo sin conexión ----------
// Guarda los archivos de la app en el móvil para poder abrirla sin cobertura.
//  - Archivos de la app: primero se piden a internet (así llegan las
//    actualizaciones); si no hay conexión, se usa la copia guardada.
//  - Lector de fotos (cdn.jsdelivr.net): primero la copia guardada, porque
//    son archivos grandes que no cambian.

const CACHE = "mi-entreno-v2";

const ARCHIVOS = [
  "./",
  "index.html",
  "style.css",
  "ejercicios.js",
  "motor.js",
  "plan.js",
  "foto.js",
  "app.js",
  "manifest.webmanifest",
  "iconos/apple-touch-icon.png",
  "iconos/icono-192.png",
  "iconos/icono-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;
  const url = new URL(peticion.url);

  // Lector de fotos: copia guardada primero.
  if (url.hostname === "cdn.jsdelivr.net") {
    evento.respondWith(
      caches.match(peticion).then((guardada) =>
        guardada || fetch(peticion).then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((c) => c.put(peticion, copia));
          }
          return respuesta;
        })
      )
    );
    return;
  }

  // Archivos de la app: internet primero, copia si no hay conexión.
  // Si internet tarda más de 3 s (poca cobertura en el box), también la copia.
  if (url.origin === self.location.origin) {
    // cache: "no-cache" → pregunta siempre al servidor si hay versión nueva
    // (si no la hay, la respuesta es mínima). Así las actualizaciones llegan
    // al momento y no 10 minutos después.
    const deInternet = fetch(peticion, { cache: "no-cache" }).then((respuesta) => {
      if (respuesta.ok) {
        const copia = respuesta.clone();
        caches.open(CACHE).then((c) => c.put(peticion, copia));
      }
      return respuesta;
    });
    const conLimite = Promise.race([
      deInternet,
      new Promise((_, mal) => setTimeout(() => mal(new Error("lento")), 3000)),
    ]);
    evento.respondWith(
      conLimite.catch(() =>
        caches.match(peticion, { ignoreSearch: true })
          // Sin copia guardada: se sigue esperando a internet.
          .then((guardada) => guardada || deInternet)
      )
    );
  }
});
