# How bird signals are extracted from weather radar

Migration Aloft shows **birds**, but weather radars don't measure birds — they
measure everything that reflects microwaves: rain, snow, insects, bats, birds,
and ground clutter, all mixed together. The bird signal has to be *extracted*.
This page explains how, for both the European and the US data feeding the map.

## 1. What the radar actually sees

A weather-radar volume scan is a set of conical sweeps at rising elevation
angles. Every range gate reports:

- **reflectivity** `Z` (dBZ) — how much power came back (bigger/more targets → brighter),
- **radial velocity** (m/s) — target motion **toward/away** from the radar (Doppler),
- on dual-polarisation radars, **ρhv** (cross-correlation ratio) — how uniform the
  targets in a gate are.

None of this is labelled "bird". Rain fills a gate uniformly (ρhv ≈ 1.0); birds
and insects are sparse, irregular scatterers (ρhv lower), sit at low reflectivity,
and — crucially — **move differently from the air around them**.

## 2. The biology filter

We keep only gates that look biological and drop the rest:

| test | keep | why |
|---|---|---|
| **ρhv < 0.95** | biology | rain/snow are coherent (ρhv ≈ 1); birds/insects are not |
| **η < 36 000 cm²/km³** | biology | anything brighter is precipitation |
| **range 5–35 km** | biology | closer = ground clutter; farther = the beam overshoots the birds |
| light noise floor | biology | drop receiver noise |

(These thresholds are the `vol2bird` defaults — see §5.)

## 3. From reflectivity to bird density

Reflectivity factor `Z` (dBZ) is converted to **reflectivity η** (cm²/km³), the
unit ornithologists use, with the standard bioRad relation

```
η = (1000 · π⁵ / λ⁴) · |K|² · 10^(dBZ/10)      [cm²/km³]
```

where `λ` is the radar wavelength (cm) and `|K|² = 0.93` (water). Bird **density**
is then

```
density = η / RCS            [birds/km³],   RCS = 11 cm² per bird
```

`RCS` is an assumed average radar cross-section per bird. Because Europe and the
US both use the same 11 cm², their densities are directly comparable.

## 4. Direction and speed

Birds move over the ground = their own flight through the air **plus** the wind.
Fitting the Doppler radial velocities around each height ring (a **VAD** /
Volume-Velocity fit) recovers the mean horizontal **ground velocity** `(u, v)` per
altitude layer → speed `ff` and heading `dd`. Subtracting the weather wind gives
the birds' **airspeed**, which we use as a size cue (fast flyers ≈ waders, slow ≈
passerines). A layer whose velocity spread `sd_vvp` is below ~2 m/s is too
coherent to be a flock and is flagged as untrusted wind.

## 5. Turning profiles into the map

Each scan becomes a **vertical profile**: for 25 layers of 200 m up to 5 km,
`(density, u, v, ff, η, …)`. Profiles are then aggregated per **solar phase**
(dawn/day/dusk/night, keyed to local sunrise/sunset), and each layer is sorted
into one of 8 compass **sectors** by its heading, so layers moving different ways
don't cancel. Migration Traffic (**MT**, birds crossing a 1 km line during the
phase) is

```
MT = Σ_layers ( density · ff )        integrated over height and the phase
```

That MT, its sector breakdown, and the mean flight altitude are what the map
draws.

## 6. Europe vs the US — the same recipe

- **Europe** — profiles come from [aloftdata.eu](https://aloftdata.eu), produced
  by the [`vol2bird`](https://github.com/adokter/vol2bird) algorithm
  ([bioRad](https://adriaandokter.com/bioRad/)) run on the OPERA radar network.
- **US** — we run our own lean, `vol2bird`-aligned reduction on raw NEXRAD Level II
  volumes (same η/density formula, same 11 cm² RCS, same thresholds and 25×200 m
  layers), then feed the **identical** aggregation as Europe. The US layer is drawn
  teal on its own uncalibrated scale.

## 7. Honest caveats

- **Birds *and* insects.** The biology filter keeps both — they overlap in
  reflectivity and ρhv. Daytime especially is dominated by insects, so the model
  down-weights daytime releases and uses airspeed to separate flyers.
- **Calibration.** Density in birds/km³ assumes a single average cross-section;
  real birds vary, so absolute counts are approximate (hence the US layer's own
  scale).
- **Weather contamination.** Heavy precipitation is removed, but light rain, melting
  snow, and ground clutter can leak through, especially without a full dual-pol
  clutter map.
- **One mean heading.** The Doppler fit gives the *average* motion of a layer, not
  the spread of individual birds.

Radar tells us *how many* animals are aloft, *how high*, and *which way* — a
remarkable, if imperfect, window on migration that happens mostly in the dark.
