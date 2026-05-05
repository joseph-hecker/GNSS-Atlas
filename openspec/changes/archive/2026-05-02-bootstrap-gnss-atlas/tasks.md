## 1. Project scaffolding

- [x] 1.1 Replace placeholder `package.json` with a proper `name`, `private: true`, `type: "module"`, and stable scripts: `dev`, `build`, `preview`, `lint`, `format`.
- [x] 1.2 Initialize Vite + React + TypeScript project files (`index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`) following the standard Vite React-TS template structure.
- [x] 1.3 Add Tailwind CSS (`tailwind.config.ts`, `postcss.config.js`, `src/index.css` with `@tailwind` directives) and verify a sample utility class renders.
- [x] 1.4 Add ESLint with `eslint:recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`, `plugin:@typescript-eslint/recommended`. Add `.eslintrc.cjs` and `.eslintignore`.
- [x] 1.5 Add Prettier with `.prettierrc` and `.prettierignore`. Wire `npm run format` to format `src/`.
- [x] 1.6 Add a top-level `README.md` documenting the dev/build/lint/format scripts and the static-deploy story.
- [x] 1.7 Add a `.gitignore` covering `node_modules`, `dist`, editor folders, and OS files. Verify a clean `git status` after a fresh `npm install` and build.

## 2. App shell, routing, and global location state

- [x] 2.1 Install runtime dependencies: `react`, `react-dom`, `react-router-dom`.
- [x] 2.2 Create a top-level `<AppLayout>` with a persistent location sidebar (or header) and a main content slot for the active section.
- [x] 2.3 Add `react-router-dom` v6 routes: `/` redirects to `/sky`; `/sky` renders the GNSS Sky placeholder; `/compare` renders the Projection Comparer placeholder; add a navigation control (tabs or a top nav) that switches between them.
- [x] 2.4 Define the `Location` and `LocationContext` types in `src/state/location.ts` (lat, lon, datum: `"WGS-84"`, `selectedTimeUtc: Date`).
- [x] 2.5 Implement `LocationProvider` (Context + `useReducer`) with actions for setting location and setting selected time. Provide a `useLocation()` hook for descendants.
- [x] 2.6 Choose and apply a deterministic default location (e.g., Greenwich Royal Observatory) and default selected time of `new Date()` at provider mount.
- [x] 2.7 Validate location setters: reject latitudes outside `[-90, 90]` and longitudes outside `[-180, 180]` without mutating state.
- [x] 2.8 Verify route-switching preserves the location and time values across navigations between `/sky` and `/compare`.

## 3. Coordinate format display and entry

- [x] 3.1 Install `proj4` and `mgrs`. Define a `convertLatLon` helper module exposing functions for lat/lon → DMS, lat/lon → UTM `{zone, hemisphere, easting, northing}`, and lat/lon → MGRS.
- [x] 3.2 Build the read-only Location Panel rows that display the current location in Decimal, DMS, UTM, and MGRS formats. Wire to `useLocation()` so all rows update on any location change.
- [x] 3.3 Handle UTM/MGRS edge cases (poles, antimeridian) by displaying a clear placeholder rather than throwing.
- [x] 3.4 Add the Decimal-Degrees input form: two number inputs for lat and lon, with submit and inline validation.
- [x] 3.5 Add the DMS input form: parse strings like `51°28'40"N 0°00'05"W` into lat/lon; reject malformed input with an inline message.
- [x] 3.6 Add a place-name search input that calls Nominatim from the browser, renders a small results list, and updates the global location when a user picks a result. Display a non-blocking error message on geocoding failure.

## 4. Time selection control

- [x] 4.1 Add a time picker UI in the GNSS Sky section that supports both an absolute date/time input and a slider, both bounded to `[now - 7 days, now + 7 days]` (range computed at picker open).
- [x] 4.2 Wire the picker to the `selectedTimeUtc` field in the location context. Include a "Now" reset button that re-snaps to the current time and re-evaluates the bounds.
- [x] 4.3 Clamp out-of-range inputs (typed dates, slider drag past edges, scroll) to the in-range bounds; never propagate an out-of-range value to the model.

## 5. Projection engine and `<ProjectedMap>`

- [x] 5.1 Install `d3-geo`, `d3-geo-projection`, `d3-selection`, `d3-drag`, `topojson-client`, `world-atlas`.
- [x] 5.2 Create `src/projections/catalog.ts` defining the `ProjectionMetadata` type and exporting an array of exactly 8 records: Web Mercator, Equirectangular, Equal Earth, Lambert Conformal Conic, Albers Equal-Area Conic, UTM (auto-zoned), Bonne, Waterman Butterfly. Include for each: `id`, `displayName`, `category`, `family`, `preserves`, `distorts`, `supportsInvert`, `needsLocationContext`, `build(ctx)`, `shortExplanation`, `longExplanation`.
- [x] 5.3 Implement the `build` function for each projection using the appropriate `d3.geo*` constructor. For UTM, derive central meridian from `ctx.location.lon` via `floor((lon + 180) / 6) * 6 + 3` and apply correct false northing for southern hemisphere.
- [x] 5.4 Bundle a 110m world-atlas TopoJSON in `src/assets/` (or import via the `world-atlas` package). Convert to GeoJSON `FeatureCollection` of land/coastline once, memoized.
- [x] 5.5 Implement `<ProjectedMap>` as a React component that renders a single `<svg>` and uses `useEffect` to render basemap, geometries, and overlays via D3. Accept props: `projectionId` (or metadata), `width`, `height`, `geometries`, `overlays`, `onClick`, `onPointerEvents`. Re-fit projection on size or projection-id changes.
- [x] 5.6 Verify `<ProjectedMap>` `onClick` returns lat/lon (via `.invert()`) for click events on projections that support invert; for projections that don't, return `null` and surface that to callers.
- [x] 5.7 Render an explanation card component fed by a `ProjectionMetadata` record (display name, preserves/distorts chips, long-explanation paragraph).
- [x] 5.8 Verify the basemap renders correctly in all 8 projections by mounting a debug page that cycles through them.

## 6. Geometry model

- [x] 6.1 Define geometry types in `src/state/geometry.ts`: discriminated union of `Point | Line | Polygon | Circle`, all with WGS-84 lat/lon vertices (and km radius for `Circle`). Include a stable `id` per geometry.
- [x] 6.2 Implement a `GeometryStore` (Context + `useReducer`) with actions: `add`, `update`, `delete`, `replaceAll`. Expose `useGeometries()` for descendants of the comparer section.
- [x] 6.3 Implement render helpers in `<ProjectedMap>` for each geometry primitive: points as `<circle>` markers, lines as projected `<path>`, polygons as projected `<path>` with closed ring, circles as `d3.geoCircle()`-generated GeoJSON projected through the panel's `GeoPath`.

## 7. Drawing and editing interactions

- [x] 7.1 Implement a `ToolMode` type (`select | draw-point | draw-line | draw-polygon | draw-circle | delete`) and a `ToolModeContext` shared by both comparer panels.
- [x] 7.2 Build the drawing toolbar UI with one button per mode and a clear active-state indicator. Wire it to `ToolModeContext`.
- [x] 7.3 In `<ProjectedMap>`, implement `draw-point`: a single click on an editable panel adds a `Point` at the inverted lat/lon.
- [x] 7.4 Implement `draw-line`: clicks append vertices to an in-progress line drawn live; `Enter` or double-click finalizes and commits to the store.
- [x] 7.5 Implement `draw-polygon`: clicks append vertices to an in-progress polygon drawn live; `Enter`, double-click, or click on the first vertex closes and commits the ring.
- [x] 7.6 Implement `draw-circle`: click sets center, drag-out sets radius (computed as the spherical great-circle distance from center to cursor); a numeric radius input is also offered.
- [x] 7.7 Implement `select` mode editing: dragging a geometry's body translates all vertices/center by the equivalent geographic delta; dragging a vertex handle moves only that vertex; dragging a circle's edge handle resizes its `radiusKm`.
- [x] 7.8 Implement `delete` mode: clicking on a geometry removes it from the store.
- [x] 7.9 Display a "view-only" badge on any panel whose projection has `supportsInvert: false`, and ensure such panels ignore drawing and editing pointer events.

## 8. GNSS Sky section

- [x] 8.1 Install `satellite.js`. Add a TLE fetcher module that requests `https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json` from the browser, with a 6-hour `localStorage` cache.
- [x] 8.2 Add a bundled fallback file `public/tles/gps-ops.fallback.json` with a recent GPS-OPS TLE snapshot. Wire the fetcher to fall back to it on any network/CORS/non-2xx failure.
- [x] 8.3 Display a small "TLE epoch: <UTC timestamp>" badge in the Sky section reading the most recent epoch from the loaded payload, plus an additional "(fallback data)" suffix when the fallback was used.
- [x] 8.4 Implement an SGP4 propagation module that, given the loaded TLEs and a UTC `Date`, returns for each satellite: PRN/name, ECI position, ECEF position, sub-point `(lat, lon, altitudeKm)`, velocity vector, and az/el from a given observer location. Use `satellite.js` helpers.
- [x] 8.5 Memoize propagation by `(tleSetId, selectedTimeUtc)` so the time slider remains responsive.
- [x] 8.6 Render the Sky section as a `<ProjectedMap>` with `projectionId: 'web-mercator'`, plotting one marker per satellite at its sub-point. Visually distinguish above-horizon (visible from the global location) from below-horizon satellites.
- [x] 8.7 Implement satellite click → open info panel showing PRN/name, sub-lat, sub-lon, altitude (km), velocity magnitude, az, el, and `visible from here` boolean. Recompute on any change to selected time, location, or selected satellite.
- [x] 8.8 Closing the info panel (close button or click on empty map area) clears the selected satellite.

## 9. Projection Comparer section

- [x] 9.1 Build the section layout: two side-by-side `<ProjectedMap>` panels, each with its own projection picker dropdown sourced from the catalog.
- [x] 9.2 Default the left panel to Web Mercator and the right panel to Equal Earth on first open.
- [x] 9.3 Render the projection explanation card beneath (or beside) each panel, fed from the panel's current projection metadata.
- [x] 9.4 Wire both panels to the shared `GeometryStore` so any draw/edit operation on one is rendered live on the other.
- [x] 9.5 Re-center both panels on the global location when it changes (adjust each projection's `rotate` or rebuild as required by the projection metadata, e.g. UTM).
- [x] 9.6 Mount the drawing toolbar (from Section 7) above the two panels so a single mode controls editing in both.
- [x] 9.7 Verify that geometries drawn on a `supportsInvert: true` panel are also rendered (read-only) on a `supportsInvert: false` panel without errors.

## 10. Polish, smoke-test, and ship

- [x] 10.1 Add an empty-state hint in each section ("Click anywhere on the map to set your location" / "Pick a tool and draw a shape").
- [x] 10.2 Apply a consistent Tailwind-based style pass: typography, spacing, button states, focus rings. Aim for clean and minimal — distortion is the visual headline.
- [x] 10.3 Smoke-test the full app: fresh `npm install`, `npm run dev` works; `npm run build` succeeds; `npm run preview` serves a working SPA; both sections behave per spec; CelesTrak fetch succeeds, then disable network and verify fallback works.
- [x] 10.4 Smoke-test deployment: run `npm run build` and serve the `dist/` directory through any static file server; verify the app loads and runs end-to-end.
- [x] 10.5 Update `README.md` with a brief project description, screenshots (optional), the dev/build instructions, the "no backend" claim, and a list of the 8 supported projections.
