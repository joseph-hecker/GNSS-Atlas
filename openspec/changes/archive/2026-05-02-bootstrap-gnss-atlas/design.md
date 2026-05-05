## Context

The repository is empty apart from the OpenSpec scaffold. There is no prior code, no prior architecture, and no users to migrate. This change therefore defines the entire architecture from first principles rather than evolving an existing system.

The product is GNSS Atlas, a beginner-focused educational SPA with two sections:

1. **GNSS Sky** — visualize where GPS satellites are in the sky at a chosen time, projected onto a Web Mercator world map.
2. **Projection Comparer** — render the world side-by-side in two projections, with shared geographic geometries that users can draw, drag, and edit on either side.

Both sections share a single rendering approach (D3-based projection of geographic data onto an SVG canvas) and a single global location model. The audience is GIS-curious beginners; the design therefore favors clarity, minimal chrome, and explanatory affordances over professional-tool density. There is no backend, no authentication, and no persistence beyond the URL/local storage.

Key external constraints:

- **TLE data must be fetched from the browser.** CelesTrak is the data source. CORS support is expected but not contractual.
- **TLE accuracy degrades after ~7-14 days of propagation.** This bounds the time-selection window.
- **D3's `.invert()` is not implemented for every projection in `d3-geo-projection`.** This bounds which projections support interactive editing.

## Goals / Non-Goals

**Goals:**

- One unified rendering layer (`<ProjectedMap>`) used by both sections, parameterized by projection, basemap, geometries, and overlays.
- A single global location model that both sections read from and write to.
- A single geographic data model for user-drawn geometries: vertices live in lat/lon, projections are pure views over that model.
- Static-only deployment: `npm run build` produces a folder that can be dropped on any static host.
- An explicit, curated catalog of 8 projections with metadata that drives both UI (picker labels, explanation cards) and behavior (whether editing is available).
- Beginner-first UX: opinionated defaults, plain-language explanation cards, no jargon without a tooltip.

**Non-Goals:**

- Multi-constellation GNSS support (GLONASS, Galileo, BeiDou). GPS only.
- Satellite ground-track curves, RINEX/SP3 ingestion, RTK/PPP simulation.
- Historical TLE archives. Time selection is bounded to ±7 days from "now".
- Tile-based slippy maps (Leaflet/MapLibre/OpenLayers). All rendering is D3 SVG over a TopoJSON coastline basemap.
- Distance/area measurement readouts, GPX/KML import/export, Tissot's indicatrices, manual UTM zone override. These are deferred to follow-up changes.
- Tests beyond a smoke build. Test infrastructure is intentionally out of scope for the bootstrap change; it can be added in a follow-up.
- Server-side rendering, authentication, persistence, analytics.

## Decisions

### Decision 1: Vite + React + TypeScript as the build/runtime baseline

**Choice**: Vite for the build tool, React 18 for the UI framework, TypeScript for the language.

**Rationale**:

- Vite is the lowest-friction modern React build tool; near-instant dev server, minimal configuration, well-supported.
- React is the only constraint the user gave; no other framework was considered.
- TypeScript was chosen over plain JavaScript (after a brief detour) because the data flowing through this app — geographic coordinates, TLEs, satellite state vectors, projection parameters — is strongly shape-y and benefits from compiler-checked types. The cost is modest given the small initial codebase.

**Alternatives considered**:

- *Next.js*: Rejected. SSR adds complexity for a static SPA with no SEO requirements and no server-side data needs. App Router would also push us toward server components for no benefit.
- *Create React App*: Deprecated; Vite supersedes it.
- *Plain JavaScript*: Briefly chosen, then reverted. JSDoc would have been the fallback type story; TS is cleaner.

### Decision 2: D3 (`d3-geo` + `d3-geo-projection`) is the single rendering library for both sections

**Choice**: All map rendering in both sections is done with D3's geographic projection system, drawing SVG into a React-managed container. No Leaflet, MapLibre, or OpenLayers.

**Rationale**:

- The user's clarification that satellites should be plotted on a *static* Web Mercator (not a slippy basemap) eliminated the original need for a tile-based map library in Section 1.
- D3 has first-class support for ~50 projections, including all 8 in our catalog and any reasonable extension. No other library covers this breadth.
- A single rendering layer means a single mental model, a single `<ProjectedMap>` component, and a single set of interaction primitives shared across both sections.
- Coastline-only basemaps (no tiles) actually *help* the educational story: distortion is far more visible against minimal scaffolding than against busy raster tiles.
- Bundle size remains small (low hundreds of KB including the world-atlas TopoJSON at 110m resolution).

**Alternatives considered**:

- *Leaflet for Section 1, D3 for Section 2*: The original two-library plan. Rejected after the user clarified Section 1's static-projection model.
- *OpenLayers for both*: Supports multiple projections and tiles, but its imperative API and weight are a poor match for a beginner-focused SPA. Significant glue to integrate with React.
- *MapLibre GL JS*: Beautiful for tiles but Web-Mercator-locked; doesn't help Section 2.

### Decision 3: Geographic-coordinates data model; projections are pure views

**Choice**: All user-authored data — the global location, every geometry vertex, every satellite sub-point — is stored in geographic coordinates (lat/lon, WGS-84). Each projection is treated as a stateless function `lat/lon → pixel` (with `.invert()` going the other way where supported).

**Rationale**:

- Side-by-side projection comparison is only meaningful if both panels render the *same* underlying data. The geometry must therefore be projection-independent.
- Editing a shape on one projection and seeing it update on the other falls out naturally: pointer events on a panel are inverted to lat/lon, the model updates, both panels re-render.
- This model maps cleanly to GeoJSON, opening a cheap path to import/export later.

**Alternatives considered**:

- *Per-projection geometry copies*: Rejected. Diverges immediately on edit and defeats the educational point.
- *Pixel-space geometries with reprojection on demand*: Rejected. Couples the model to a viewport size.

### Decision 4: 8 curated projections with metadata-driven UI

**Choice**: Ship exactly 8 projections (Web Mercator, Equirectangular, Equal Earth, Lambert Conformal Conic, Albers Equal-Area Conic, UTM, Bonne, Waterman Butterfly), each described by a metadata record:

```
{
  id: ProjectionId,
  displayName: string,
  category: 'common' | 'fun',
  family: 'cylindrical' | 'conic' | 'pseudocylindrical' | 'polyhedral' | 'other',
  preserves: ('shape' | 'area' | 'distance' | 'direction')[],
  distorts:  ('shape' | 'area' | 'distance' | 'direction')[],
  supportsInvert: boolean,           // gates interactive editing
  needsLocationContext: boolean,     // true for UTM (auto-zone)
  build: (ctx: LocationCtx) => GeoProjection,
  shortExplanation: string,          // 1-2 sentences for the picker
  longExplanation: string,           // for the explanation card
}
```

**Rationale**:

- Eight projections is enough variety to teach distortion without overwhelming a beginner.
- One metadata record per projection drives the picker, the explanation card, the editing-enabled flag, and the build function — keeping projection-specific concerns out of every other component.
- `needsLocationContext` cleanly handles UTM's per-location central meridian (Decision 5).
- Adding a 9th projection later is a single record.

**Alternatives considered**:

- *Expose all ~50 d3 projections*: Rejected. Beginner overload, no curation, no per-projection explanations.
- *Hardcoded switch in components*: Rejected. Spreads projection knowledge across the codebase.

### Decision 5: UTM auto-selects its zone from the global location

**Choice**: When UTM is chosen as a projection, the central meridian is computed from the current global location's longitude (`floor((lon + 180) / 6) * 6 + 3`), and the projection rebuilds whenever the global location moves. There is no manual zone override in this change.

**Rationale**:

- For the beginner audience, "which UTM zone am I in?" is itself one of the things they're trying to learn. Auto-zoning is the correct default.
- Manual override is easy to add as a follow-up.
- Implementation: UTM is built from `d3.geoTransverseMercator()` with `.rotate([-centralMeridian, 0])`, plus a north-vs-south hemisphere false-northing.

**Alternatives considered**:

- *Manual zone picker*: Pro-tool feature; deferred.
- *Dual auto + manual*: More UI surface than warranted at v1.

### Decision 6: Geometry editing is gated by projection `.invert()` support

**Choice**: A geometry is editable on a panel iff that panel's projection has a working `.invert()`. Pointer events fire `.invert()` to convert pixel coordinates to lat/lon; if `.invert()` is absent or unreliable for some projections (notably some polyhedral/interrupted projections in `d3-geo-projection`), that panel becomes view-only and shows a small "view-only on this projection" badge.

**Rationale**:

- All 6 "common" projections support `.invert()` cleanly; editing works there.
- Among the "fun" pair, Bonne supports invert; Waterman Butterfly's invert is partial. Marking it view-only is honest, simple, and avoids brittle UX.
- Editing in any one of the (up to) two panels still updates the model and both views — so the user is never blocked.

**Risks**: A user might be confused why one panel is editable and the other isn't. Mitigation: show the badge and a one-line tooltip ("This projection is view-only because it can't reliably translate clicks back to coordinates").

### Decision 7: TLEs fetched from CelesTrak with a static fallback

**Choice**: On app load, fetch GPS-only TLEs from `https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json`. Cache the result in `localStorage` with a 6-hour TTL. If the fetch fails (CORS, network, outage), fall back to a static `public/tles/gps-ops.fallback.json` checked into the repository.

**Rationale**:

- CelesTrak is the de facto free public source for TLEs and historically supports CORS.
- The 6-hour TTL avoids hammering CelesTrak on every page load while keeping data fresh enough for ±7-day propagation.
- The static fallback guarantees the app *always works*, even offline or if CelesTrak's CORS posture changes. Updating the fallback is a manual or scheduled chore, but the app degrades gracefully without it.
- This keeps the architecture truly backend-free.

**Risks**: Fallback data ages. Mitigation: a small badge in the UI shows the TLE epoch when fallback is used, and the fallback can be refreshed by a GitHub Action in a follow-up change.

### Decision 8: Time selection is constrained to ±7 days from "now"

**Choice**: A slider/picker in the GNSS Sky section lets the user pick any moment in the range `[now - 7d, now + 7d]`. Default is "now". The slider step is 1 minute.

**Rationale**:

- TLE propagation accuracy degrades meaningfully past ~1-2 weeks.
- A bounded range produces an honest, beginner-friendly UI: no calendar pickers, no "why is the data wrong?" pitfalls.
- ±7 days covers the realistic surveying use case ("when later this week is sat geometry best?").

**Alternatives considered**:

- *Unbounded date picker*: Rejected — would silently produce wrong data far from the TLE epoch.
- *±24h*: Too narrow for the surveying-planning use case.

### Decision 9: Global location is React Context + `useReducer`; no external state library

**Choice**: A single `LocationProvider` exposes `{ location, selectedTimeUtc, setLocation, setTime }`. Sections read via a `useLocation()` hook. No Redux, Zustand, Jotai, or similar.

**Rationale**:

- The shared state is small (≤ a few fields) and updates are infrequent.
- Adding a state library would be ceremony out of proportion to need.
- If global state grows past a handful of fields, swapping in Zustand later is a few-hour change.

### Decision 10: Routing — two top-level routes, location persists across them

**Choice**: `react-router-dom` v6 with two routes: `/sky` and `/compare`. The location panel lives in a persistent sidebar so the global location is always visible and editable from anywhere. Default route redirects to `/sky`.

**Rationale**:

- Clear URLs make sharing specific sections trivial.
- A persistent sidebar visually communicates that location is global, not per-section.
- Two routes keeps mental load low. A future "About / Learn" route can be added without disturbing this layout.

## Risks / Trade-offs

- **CelesTrak CORS or outage** → Mitigated by `localStorage` cache + checked-in fallback JSON. App degrades but never breaks.
- **TLE accuracy past the ±7-day window** → Mitigated by hard-bounding the time slider; impossible to request data outside the safe range.
- **Some projections have no usable `.invert()`** → Mitigated by metadata flag and per-panel "view-only" badge. Users can always edit on the other panel.
- **D3 + React reconciliation friction** → Mitigated by treating the projection container as a single React-owned `<svg>` that D3 only renders into via `useEffect`; React owns DOM creation, D3 owns geometry rendering. No `d3.select` of React-managed nodes.
- **TopoJSON basemap size** → 110m world-atlas (~110 KB gzipped) is plenty for educational visualization. 50m is available later if higher detail is wanted.
- **No tests in this change** → Accepted. Bootstrap change focuses on shipping a working skeleton; a follow-up `add-test-infra` change introduces Vitest + React Testing Library.
- **Bundle size of `proj4js` + `mgrs`** → ~80-100 KB gzipped combined. Acceptable; both are needed for honest coordinate-format display.
- **Beginner confusion at first run** → Mitigated by sensible defaults: a default location (e.g. Greenwich Observatory), default time (now), default projection pair (Web Mercator vs Equal Earth) so the user sees something meaningful immediately.

## Migration Plan

This is a greenfield bootstrap; there is nothing to migrate. Deployment is `npm run build` followed by uploading `dist/` to any static host. No environment variables, no secrets, no infra.

## Open Questions

- **Default location**: What lat/lon should the app open at? Suggestion: Greenwich Royal Observatory (51.4769°N, 0.0005°W) for the symbolic value. Final choice deferred to implementation.
- **Place-name search provider**: Nominatim (OSM) is free and CORS-friendly but rate-limited. Acceptable for the beginner-traffic profile, but worth a usage-policy note in the UI ("Powered by OpenStreetMap Nominatim. Be kind."). To finalize during implementation.
- **Visual identity**: No branding decisions yet (logo, color palette beyond Tailwind defaults). Punted to a future design pass.
- **Hosting target**: GitHub Pages, Netlify, and Vercel all work. The build artifact is the same; the choice is operational.
