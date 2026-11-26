/* ShinePro360 service worker: makes the site installable and keeps a copy of the app shell for a weak network.
   Network first, so a new version is always picked up when online. Supabase/API calls are never touched. */
const CACHE = 'sp360-shell-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const same = u.origin === self.location.origin, cdn = /(^|\.)(jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)$/.test(u.hostname);
  if (!same && !cdn) return;                      // Supabase, fonts, etc.: straight to the network
  e.respondWith(fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {}); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
