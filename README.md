# GNSS Atlas

An educational, browser-only single-page app for exploring two things most digital maps quietly hide:

1. **GPS satellite geometry** — where the GPS constellation is at any chosen moment within ±7 days of now, and what that means for accuracy from your location.
2. **Map projection distortion** — the same point/line/polygon/circle drawn side-by-side in two different projections, so you can *see* how shape, area, distance, and direction warp.

GNSS Atlas runs entirely in your browser. No backend, no API keys, no accounts. Deploy the `dist/` folder anywhere.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **D3** (`d3-geo`, `d3-geo-projection`) for all map rendering
- **proj4js** + **mgrs** for coordinate-format conversions
- **satellite.js** for SGP4 TLE propagation
- **TopoJSON** (`world-atlas` 110m) for the coastline basemap
- TLEs fetched live from [CelesTrak](https://celestrak.org/), with a bundled fallback

## Scripts

```bash
npm install     # one-time setup
npm run dev     # start the Vite dev server (default http://localhost:5173)
npm run build   # type-check and produce the static dist/ bundle
npm run preview # serve the built bundle locally
npm run lint    # ESLint over src/
npm run format  # Prettier-format src/
```

## Deploy

```bash
npm run build
```

Upload the contents of `dist/` to any static host — GitHub Pages, Netlify, Vercel, S3 + CloudFront, plain Nginx, anything. There is no server runtime to provision.

## Supported Projections

The Projection Comparer ships with eight curated projections:

| # | Projection                  | Category | Notes                                                  |
| - | --------------------------- | -------- | ------------------------------------------------------ |
| 1 | Web Mercator                | Common   | The web default; conformal; severe area distortion     |
| 2 | Equirectangular (Plate Carrée) | Common | Simplest possible: Lat = Y, Lon = X                    |
| 3 | Equal Earth                 | Common   | Modern equal-area; the Mercator counter-example        |
| 4 | Lambert Conformal Conic     | Common   | Used in aviation; mid-latitude conformal               |
| 5 | Albers Equal-Area Conic     | Common   | USGS standard for U.S. maps                            |
| 6 | UTM (auto-zoned)            | Common   | What surveyors use; central meridian follows location  |
| 7 | Bonne                       | Fun      | Heart-shaped pseudoconic, equal-area                   |
| 8 | Waterman Butterfly          | Fun      | Polyhedral; view-only (no reliable inverse)            |

## Project Structure

```
src/
  assets/            static assets (TopoJSON basemap, etc.)
  layout/            top-level shell, nav, sidebar
  projections/       projection catalog and metadata
  sections/
    sky/             "GNSS Sky" — satellites on Web Mercator
    compare/         "Projection Comparer" — side-by-side projections
  state/             global Context providers (location, geometry, tools)
  components/        reusable UI primitives (incl. <ProjectedMap>)
  lib/               pure utilities (coord conversions, TLE fetch, SGP4)
```

## Data Sources & Credits

- Coastlines: [`world-atlas`](https://github.com/topojson/world-atlas) (Natural Earth, 110m)
- TLEs: [CelesTrak](https://celestrak.org/) GPS-OPS group
- Geocoding: [OpenStreetMap Nominatim](https://nominatim.org/)
