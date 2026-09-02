# Attribution and licensing — Aloft migration map

This project combines several third-party data sources and one machine-learning
model, each with its own terms. Reuse is welcome, with attribution.

## Application

Code (`*.py`, `build.py`, `template.html`, `tools/*.py`) — **MIT**.

## Radar data

Vertical profile time series from **[aloftdata.eu](https://aloftdata.eu/)**
(BALTRAD processing chain), licensed **CC BY 4.0**.

> Content on aloftdata.eu is licensed under a CC BY 4.0 License.

The archive is not redistributed here; it is downloaded from the project's public
S3 bucket by `sync.py`.

## Species occurrence model

**BirdNET+ Geomodel V3.0.2 Global 12K**, by the
[BirdNET team](https://github.com/birdnet-team/geomodel) — Stefan Kahl, Max
Mauermann, Mario Lasseck, Connor Wood and Holger Klinck, with the K. Lisa Yang
Center for Conservation Bioacoustics (Cornell University), Chemnitz University of
Technology, and Museum für Naturkunde Berlin.

- Source code: **MIT**
- Trained weights: **CC BY-SA 4.0** — attribution *and* share-alike
- **Powered by BirdNET**

The licence prohibits use of the weights or derivatives **for poaching or
wildlife tracking intended to facilitate illegal capture, harm, trade or
exploitation, and for any military purpose**. Those prohibitions override the
otherwise permissive terms.

### Changes made

CC BY-SA requires that changes be indicated. Model output is used as follows:

- restricted to the 10,206 `aves` outputs, then to the 576 species on a
  GBIF-derived European breeding list;
- probabilities **summed** into an expected species count rather than thresholded;
- **differenced** between adjacent model weeks;
- spatially **smoothed** (gaussian, inside a land mask), **masked to land**, and
  faded where the assemblage is too thin for the measure to be stable;
- rendered to a Mercator-aligned PNG with a diverging colour ramp.

### Share-alike

The derived species-turnover tiles (`assets/overlay_w*.png`) are offered under
**CC BY-SA 4.0**, matching the weights they derive from. Whether model *output*
constitutes adapted material under CC BY-SA is not settled; applying share-alike
is the conservative reading and matches the BirdNET terms of use, which ask that
derivatives carry the same licence.

## Species list

Built from **[GBIF.org](https://www.gbif.org/)** occurrence records (Aves, Europe,
May–July), accessed 2026-08-27, via the public occurrence API. GBIF asks that
derived work cite GBIF.org. Individual records remain © their contributing
institutions under their own terms.

## Weather

**ECMWF Open Data** — real-time IFS forecasts at 0.25°, from ECMWF's free,
keyless open-data feed, licensed **CC BY 4.0**.

> By downloading data from the ECMWF open data dataset, you agree to the terms:
> Attribution 4.0 International (CC BY 4.0). Please attribute ECMWF.

Runs are anchored on a past date where possible, so the fields describe weather
that has already happened over the radar window rather than a forecast of it.
ECMWF keeps only about three days of runs, so the fetch is run daily and the
tiles accumulate.

Fields are compressed to sparse bird-relevant features — ground frost, the
leading edge of precipitation, and 850 hPa winds — not served as full grids.

## Cartography

Coastlines from **[Natural Earth](https://www.naturalearthdata.com/)** — public
domain, no attribution required; credited by custom.

## Typography

**IBM Plex Sans** and **IBM Plex Mono** — SIL Open Font Licence 1.1.

## No warranty

Model outputs are probabilistic predictions, not confirmed species observations;
false positives and negatives are expected. Radar profiles carry their own
measurement uncertainty and are contaminated by insects, particularly in summer.
Everything here is provided as is, without warranty.
