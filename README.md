# BirdsWhere — Migration Aloft

**Live site: https://pcmoan70.github.io/BirdsWhere-aloft/**

An interactive map of bird migration measured by weather radar. 139 European
radars (plus US east-coast NEXRAD) report how many birds are aloft, how high, and
which way they are heading, as vertical profiles. Each timeline frame is one
**solar phase** (Dawn, Day, Dusk, Night I–III), keyed to local sunrise/sunset so a
phase means the same thing across the map. Traffic (**MT**) counts birds crossing
a 1 km line during the phase; most migration is nocturnal.

## Functions

### Timeline & playback (bottom bar)
- **Play / pause** the sequence of solar phases; **scrub** the slider; **step** one
  phase at a time. Playback stops at the last phase rather than wrapping.
- **Phase strip** under the date filters which phases the scrubber visits (e.g.
  nights only).
- **Day / phase mode** toggles between per-phase frames and one aggregated frame
  per whole day.

### Representation
- **Vector** — each radar draws per-sector arrows; length, thickness and warm
  colour (dark → bright) encode traffic volume on a log scale, direction is the
  birds' heading.
- **Flow** — the same measurements blended into an animated field between radars;
  blank areas have no radar in range.

### Radar marks & detail
- A **dashed** arrow = density measured but no direction (heading borrowed from
  neighbours); a **hollow ring** = no data this phase (ordinary outage); a
  **red cross** = silent for a whole solar day.
- **Click a radar** for its full profile: traffic by phase, flight altitudes, and
  the compass-sector breakdown (with a link out to the aloft/CROW profile).

### Traffic included / Measure
- **All echoes** vs **Birds only** (biological filtering).
- **Per hour** (rate) vs **Phase total** — so a 2-hour Dusk compares fairly with a
  long Day.
- **This frame** panel: reporting radars, network traffic, mean altitude, bird-like
  speed, and leading heading.

### Weather features (0.25° ECMWF)
- **Wind barbs** — meteorological convention (half feather 5 kt, full 10 kt,
  pennant 50 kt), for the **migration band** (strongest of 925/850 hPa, ~800–1500 m,
  from 5 m/s) or the **surface** (10 m), toggleable.
- **Precipitation front** — grey wiggly-edged regions birds won't cross.
- **Ground frost** — blue hatched regions (≤0 °C skin temp); a frost triggers
  departures.

### Particle traces
- Passive tracers riding the migration-band wind — where the wind alone would carry
  a bird. **Click** to drop a **purple, persistent swarm** (no lifetime) you can
  follow indefinitely; **right-click** to seed the **Nearctic**
  departure line (American Atlantic coast, Miami→Labrador, teal). Enable the
  **European departure line** to also seed the Atlantic-facing European seaboard
  (North Cape→Morocco, amber) on right-click.
- Tracers advect **in lockstep with the timeline** (one phase ≈ 3.4 h, dispersing,
  up to ~8 simulated days); a still timeline is a still picture, and stepping
  backwards or restarting resets them.
- **Radar-driven release (automatic)** — with this on, each phase the radars seed
  tracers along the US shoreline by their own traffic (daytime phases release ¼ as
  many). Each tracer draws its **size/guild** from the radar-night's spread of
  flight speeds (airspeed = ground speed − wind), which sets its endurance aloft —
  small passerine a few days to a wader up to ~two weeks; colour runs pale (short)
  to orange (long-haul).

- **Clear particle swarms** — a settings button removes every tracer (dropped,
  seeded, and radar-driven) at once. Auto-playback stops at the end of the date
  range rather than looping.

### US east-coast radars (NEXRAD)
- Adds the American seaboard radars as **teal traffic-volume discs** (each disc
  grows/brightens with its density, own uncalibrated scale shown as a ramp in
  settings); they light up as the night shadow reaches them.

### Night shadow
- Shades the sunlit side warm and the night side dark for each date/phase (true
  solar terminator), optionally kept visible during playback. Because the map spans
  an ocean, a "night" phase falls at different clock times in America and Europe.

### Migration routes
- **Average routes (per week)** — streamlines of the week-mean radar flow field;
  line thickness = mean bird flow, arrows = mean direction. Shows the structure of
  the average field, not individual tracks.

### Breeding-species turnover overlay
- A background wash modelling how the expected breeding community changes this week
  — one colour where species arrive, the other where they leave. The
  **zero-change cutoff** slider (0–75%) leaves the middle of the scale uncoloured so
  only meaningful gains/losses tint the map.

### Other
- **Flight altitude** legend for the current frame.
- **Open on your phone** — a QR code (with the URL) in settings.
- **Controls:** drag to pan; wheel or double-click to zoom; `+` / `−` / `0` zoom and
  reset; `←` / `→` step phases; `space` plays. Side and bottom panels collapse.

---

This repo holds **only the servable site** (`index.html`, the `aloft-*.js` client,
and the `tiles/` data window). It is generated from the private
`Birdswhere_aloft_workspace` repo (template, build, and the radar/weather pipeline)
and should not be edited by hand.
