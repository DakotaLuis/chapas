// Sin conexión: la página se pide primero a la red (para que lleguen las
// versiones nuevas) y, si no hay red, sale la guardada; el resto (JavaScript
// con el nombre sellado, imágenes) sale de lo guardado y solo se pide una vez.
// En un bar con la wifi caída, una partida empezada se puede terminar.

const CACHE = 'chapas-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function redPrimero(req) {
  const cache = await caches.open(CACHE)
  try {
    const r = await fetch(req)
    if (r.ok) cache.put(req, r.clone())
    return r
  } catch {
    return (await cache.match(req)) ?? (await cache.match('./')) ?? Response.error()
  }
}

async function guardadoPrimero(req) {
  const cache = await caches.open(CACHE)
  const guardado = await cache.match(req)
  if (guardado) return guardado
  const r = await fetch(req)
  if (r.ok) cache.put(req, r.clone())
  return r
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  e.respondWith(req.mode === 'navigate' ? redPrimero(req) : guardadoPrimero(req))
})
