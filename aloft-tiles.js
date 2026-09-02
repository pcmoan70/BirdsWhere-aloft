/* aloft-tiles.js — simple on-device tile cache over the browser Cache API.
 *
 * The aloft app fetches per-day / per-week data tiles from the server instead of
 * inlining everything. This wraps those fetches so a tile is downloaded once and
 * then served from the device (fast, and offline for anything already visited).
 *
 *   AloftTiles.json("data/weather/2024-10-15.json", { immutable: true })
 *   AloftTiles.buffer(url)            // ArrayBuffer (e.g. packed grids)
 *   AloftTiles.blobURL(url)           // object URL for <img> (overlay PNGs)
 *
 * immutable:true  -> historical tile, never changes -> pure cache-first.
 * immutable:false -> recent tile (last ~2 days) -> serve cache fast, refresh in
 *                    the background so the next view is up to date.
 *
 * One cache store, an LRU byte budget, no service worker. Historical tiles are
 * served gzip-compressed by the host (GitHub Pages/Fastly); the Cache API stores
 * the decoded body, so we re-serve it with a plain content-type.
 */
(function () {
  "use strict";
  const STORE = "aloft-tiles-v1";
  const LRU_KEY = "https://aloft.local/_lru";   // synthetic request holding the index
  let budget = 150 * 1024 * 1024;                // default cap; AloftTiles.setBudgetMB() overrides
  let idx = null;                                // in-memory { url: {size, at} }, mirrored to the store
  let idxDirty = false;

  const openStore = () => caches.open(STORE);

  function loadIndex(cache) {
    if (idx) return Promise.resolve(idx);
    return cache.match(LRU_KEY)
      .then(r => (r ? r.json() : {}))
      .catch(() => ({}))
      .then(o => (idx = o || {}));
  }
  function persistIndex(cache) {
    if (!idxDirty) return Promise.resolve();
    idxDirty = false;
    return cache.put(LRU_KEY, new Response(JSON.stringify(idx),
      { headers: { "content-type": "application/json" } })).catch(() => {});
  }

  // Record a stored tile and evict oldest entries if over budget.
  function note(cache, url, size) {
    idx[url] = { size: size, at: Date.now() };
    idxDirty = true;
    let total = 0;
    const entries = [];
    for (const u in idx) { total += idx[u].size || 0; entries.push(u); }
    if (total <= budget) return persistIndex(cache);
    entries.sort((a, b) => (idx[a].at || 0) - (idx[b].at || 0));   // oldest first
    let chain = Promise.resolve();
    for (let i = 0; i < entries.length && total > budget; i++) {
      const u = entries[i];
      total -= idx[u].size || 0;
      delete idx[u];
      chain = chain.then(() => cache.delete(u));
    }
    return chain.then(() => persistIndex(cache));
  }

  // Store a network Response's decoded body under `url` (plain content-type).
  function store(cache, url, res) {
    return res.clone().arrayBuffer().then(buf => {
      const ct = res.headers.get("content-type") || "application/octet-stream";
      return cache.put(url, new Response(buf, { headers: { "content-type": ct } }))
        .then(() => note(cache, url, buf.byteLength));
    });
  }

  function refresh(cache, url) {                  // background revalidate; errors ignored
    fetch(url, { cache: "no-cache" })
      .then(res => { if (res && res.ok) store(cache, url, res); })
      .catch(() => {});
  }

  // Core: return a Response for `url`, cache-first.
  function get(url, opts) {
    opts = opts || {};
    return openStore().then(cache =>
      loadIndex(cache).then(() => cache.match(url).then(hit => {
        if (hit) {
          if (idx[url]) { idx[url].at = Date.now(); idxDirty = true; persistIndex(cache); }
          if (!opts.immutable) refresh(cache, url);
          return hit;
        }
        return fetch(url).then(res => {
          if (!res || !res.ok) return res;         // don't cache errors; caller checks res.ok
          return store(cache, url, res).then(() => res, () => res);   // ensure cached before returning
        });
      })));
  }

  window.AloftTiles = {
    setBudgetMB(mb) { budget = Math.max(0, +mb || 0) * 1024 * 1024; },
    json(url, opts) { return get(url, opts).then(r => { if (!r.ok) throw new Error("tile " + r.status + " " + url); return r.json(); }); },
    buffer(url, opts) { return get(url, opts).then(r => { if (!r.ok) throw new Error("tile " + r.status + " " + url); return r.arrayBuffer(); }); },
    blobURL(url, opts) { return get(url, opts).then(r => { if (!r.ok) throw new Error("tile " + r.status + " " + url); return r.blob(); }).then(b => URL.createObjectURL(b)); },
    has(url) { return openStore().then(c => c.match(url)).then(Boolean); },
    prefetch(url, opts) { return get(url, opts).then(() => true).catch(() => false); },   // warm the cache, ignore result
    clear() { idx = null; return caches.delete(STORE); }
  };
})();
