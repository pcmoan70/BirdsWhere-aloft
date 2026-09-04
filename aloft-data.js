/* aloft-data.js — assemble the app's DATA / WX / OVL from per-day tiles.
 *
 * Replaces the old inlined __DATA__/__WEATHER__/__OVERLAY__ blobs. Reads the
 * manifest, then fetches (through AloftTiles, so everything is cached on-device)
 * every day/week the manifest lists and concatenates them back into the exact
 * shapes the renderer already expects:
 *   DATA = { meta, radars, times[], frames[] }
 *   WX   = { meta, frames[] }   (frames carry sparse frost/front/wind point features)
 *   OVL  = { ...shared, weeks: { "<w>": { week, against, png(blobURL), ... } } }
 *
 * Historical tiles are immutable (pure cache-first); the manifest + radar index
 * revalidate so a newly-appended day shows up.
 */
(function () {
  "use strict";
  window.AloftData = {
    async load(base) {
      base = base || "tiles/";
      // The manifest is the index that busts every other tile via its version, so
      // it must never be HTTP-cached. Fetch it fresh (no-store), bypassing the
      // tile cache entirely; the tiles it points to stay cached as usual.
      const manifest = await fetch(base + "manifest.json", { cache: "no-store" })
        .then(r => r.json());
      // Content version: appended to immutable tile URLs so a format/extent change
      // re-fetches instead of serving a stale-shaped tile from the on-device cache.
      const V = manifest.version ? ("?v=" + manifest.version) : "";

      // --- migration: all days, concatenated in chronological (manifest) order ---
      const migDays = manifest.days || [];
      const [radars, ...migTiles] = await Promise.all([
        AloftTiles.json(base + "radars.json", { immutable: false }),
        ...migDays.map(d => AloftTiles.json(base + "migration/" + d + ".json" + V, { immutable: true })),
      ]);
      const DATA = { meta: manifest.migration.meta, radars: radars.radars, times: [], frames: [] };
      for (const t of migTiles) { DATA.times.push(...t.times); DATA.frames.push(...t.frames); }

      // --- weather: only the days inside the navigable (migration) window ---
      // The ERA5 archive can hold a year of weather, but the app can only scrub the
      // migration day range, so loading (and caching) the rest is pure waste -- it
      // would blow the on-device cache budget and evict the migration tiles. Older
      // weather stays deployed for when the window is widened; the client just skips it.
      let WX = { frames: [] };
      if (manifest.weather && manifest.weather.days && manifest.weather.days.length) {
        let wxDays = manifest.weather.days;
        if (migDays.length) {
          const lo = migDays[0], hi = migDays[migDays.length - 1];
          wxDays = wxDays.filter(d => d >= lo && d <= hi);
        }
        const wxTiles = await Promise.all(
          wxDays.map(d => AloftTiles.json(base + "weather/" + d + ".json" + V, { immutable: true })));
        WX = { meta: (wxTiles[0] && wxTiles[0].meta) || manifest.weather.meta, frames: [] };
        for (const t of wxTiles) WX.frames.push(...t.frames);
      }

      // --- overlay: shared meta + one blob-URL PNG per week ---
      let OVL = {};
      if (manifest.overlay && manifest.overlay.weeks) {
        OVL = Object.assign({}, manifest.overlay.shared);
        OVL.weeks = {};
        await Promise.all(Object.keys(manifest.overlay.weeks).map(async w => {
          const meta = Object.assign({}, manifest.overlay.weeks[w]);
          meta.png = await AloftTiles.blobURL(base + "overlay/w" + w + ".png" + V, { immutable: true });
          OVL.weeks[w] = meta;
        }));
      }

      // --- flow routes: one streamline tile per model week ---
      let FLOW = null;
      if (manifest.flow && manifest.flow.weeks && manifest.flow.weeks.length) {
        const ws = manifest.flow.weeks;
        const tiles = await Promise.all(
          ws.map(w => AloftTiles.json(base + "flow/" + w + ".json" + V, { immutable: true })));
        FLOW = { weeks: {} };
        ws.forEach((w, i) => { FLOW.weeks[w] = tiles[i]; });
      }

      // --- night shadow + US NEXRAD layer (both optional; tolerate absence) ---
      // phase_utc.json maps every date|phase to a canonical UTC instant (from the
      // European centroid) so the client can draw the true solar terminator;
      // nexrad.json is the separate US east-coast radar layer, its own scale.
      // Both update as radars/days are processed, independently of the manifest
      // version, so they must NOT be version-cached -- fetch fresh (no-store).
      const [PHASEUTC, US] = await Promise.all([
        fetch(base + "phase_utc.json", { cache: "no-store" })
          .then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(base + "nexrad.json", { cache: "no-store" })
          .then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      return { DATA, OVL, WX, FLOW, PHASEUTC, US, manifest };
    }
  };
})();
