## Why

GNSS receivers and online maps both quietly mislead non-expert users: positioning accuracy varies by an order of magnitude depending on satellite geometry, and familiar web maps distort areas, distances, and shapes in ways most viewers never notice. There is no approachable, browser-based tool that lets a beginner *see* both phenomena interactively. GNSS Atlas fills that gap with two short, focused experiences that turn invisible distortions into visible ones.

This change bootstraps the entire application from an empty repository: the build setup, the shared rendering and data layers, and the first usable version of both feature sections.

## What Changes

- Initialize a Vite + React + TypeScript single-page application in the repository root.
- Add Tailwind, ESLint, Prettier, and React Router as the core dev/runtime baseline.
- Add a shared geographic rendering layer built on D3 (`d3-geo`, `d3-geo-projection`) backed by a TopoJSON coastline basemap, capable of rendering the same lat/lon data through any of 8 supported projections.
- Add a global app-state location model (lat/lon) shared across all sections, plus coordinate-format conversions (Lat/Lon decimal, DMS, UTM, MGRS) using `proj4js`.
- Add a `gnss-sky` section that fetches GPS-only TLEs from CelesTrak in the browser, propagates them with `satellite.js` for a user-selected time within a ±7-day window of "now", and plots satellite sub-points on a Web Mercator world map. Clicking a satellite reveals medium-depth info (PRN, name, altitude, sub-point lat/lon, velocity, azimuth/elevation from the global location, visible-from-here flag).
- Add a `projection-comparer` section that renders the world side-by-side in two user-selected projections, both centered on the global location. Users can draw and edit point / line / polygon / circle geometries in geographic coordinates; edits in either panel update the shared model and re-render both views in sync.
- Bundle 8 projections out of the box: Web Mercator, Equirectangular, Equal Earth, Lambert Conformal Conic, Albers Equal-Area Conic, UTM (auto-zoned from the global location), Bonne, and Waterman Butterfly. Geometry editing is enabled on projections whose D3 implementation supports `.invert()`; the rest are view-only.
- Deliver as a fully static SPA with no backend; deployable to any static host.

## Capabilities

### New Capabilities

- `app-shell`: Vite/React/TypeScript build, top-level layout, routing between the two sections, and global state container for the shared location.
- `location-model`: Single-source-of-truth location (lat/lon + datum + selected time), coordinate-format conversions (Lat/Lon decimal, DMS, UTM, MGRS), and the location-picker UI (click on map / enter coordinates / search by place name).
- `projection-engine`: Shared D3-based projection rendering layer, the catalog of 8 supported projections (with metadata about distortion properties and `.invert()` support), the TopoJSON coastline basemap, and the reusable `<ProjectedMap>` React component.
- `geometry-model`: Geographic-coordinate geometry primitives (point, line, polygon, spherical small-circle), in-memory store, and editing/dragging interactions that round-trip through projection inverses.
- `gnss-sky`: Section 1 experience — TLE fetching from CelesTrak, SGP4 propagation via `satellite.js`, time selection within ±7 days of now, satellite sub-point plotting on a Web Mercator basemap, and the per-satellite info panel (medium depth).
- `projection-comparer`: Section 2 experience — side-by-side dual projection picker, synchronized rendering of shared geometries, drawing/editing UI, and plain-language explanation cards for each projection.

### Modified Capabilities

<!-- None. This is a greenfield bootstrap; no existing specs to modify. -->

## Impact

- **Repository**: Adds the full SPA source tree (`src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, ESLint/Prettier configs). Replaces the placeholder `package.json`.
- **Dependencies (runtime)**: `react`, `react-dom`, `react-router-dom`, `d3-geo`, `d3-geo-projection`, `d3-selection`, `d3-drag`, `topojson-client`, `world-atlas`, `proj4`, `mgrs`, `satellite.js`.
- **Dependencies (dev)**: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `prettier`, `@types/*`.
- **External services**: Browser-side `fetch` to CelesTrak (`celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json`) for TLEs; relies on CelesTrak CORS. A static cached TLE JSON in `public/` is included as a fallback for offline use and to absorb CORS or outage failures.
- **Hosting / ops**: Static SPA only — deployable to GitHub Pages, Netlify, Vercel, or any static host. No server, no database, no API keys.
- **Out of scope (for this change)**: Multi-constellation support (GLONASS, Galileo, BeiDou), satellite ground-track curves, post-processed (SP3) ephemerides, Tissot's indicatrix overlays, GPX/KML import, distance/area measurement readouts, manual UTM zone override, and authentication of any kind. These are explicitly deferred to follow-up changes.
