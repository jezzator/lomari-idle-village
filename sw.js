// Lomari: Idle Village — service worker: werkt offline, haalt updates op de achtergrond op.
const CACHE = 'lomari-v27';
const FILES = ["./", "index.html", "data.js", "lomari.js", "art.js", "engine.js", "balans.js", "ui.js", "dorp.jpg", "portret/beki.jpg", "portret/brakka.jpg", "portret/droki.jpg", "portret/elomi.jpg", "portret/kavo.jpg", "portret/koro.jpg", "portret/liri.jpg", "portret/melo.jpg", "portret/niko.jpg", "portret/nira.jpg", "portret/ori.jpg", "portret/piko.jpg", "portret/seli.jpg", "portret/sora.jpg", "portret/tiku.jpg", "portret/varo.jpg", "portret/veyra.jpg", "portret/yomi.jpg", "icoon-192.png", "icoon-512.png", "icoon-180.png", "icoon-maskable-512.png", "manifest.webmanifest"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const vers = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || vers;
  }));
});
