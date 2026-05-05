# projection-engine Specification

## Purpose
TBD - created by archiving change bootstrap-gnss-atlas. Update Purpose after archive.
## Requirements
### Requirement: Curated catalog of 8 projections

The system SHALL ship a fixed, curated catalog of exactly 8 named projections, partitioned into a "common" group and a "fun" group. The catalog SHALL contain: Web Mercator, Equirectangular (Plate Carrée), Equal Earth, Lambert Conformal Conic, Albers Equal-Area Conic, UTM (auto-zoned), Bonne, and Waterman Butterfly.

#### Scenario: Catalog contents

- **WHEN** the projection catalog is enumerated
- **THEN** it SHALL contain exactly the eight named projections above, with the first six categorized as `"common"` and the last two as `"fun"`

#### Scenario: Picker reflects the catalog

- **WHEN** the user opens any projection picker UI in the application
- **THEN** the picker SHALL list every projection in the catalog with its display name and category, and SHALL NOT list any projection not in the catalog

### Requirement: Projection metadata drives UI and behavior

Each projection in the catalog SHALL be described by a metadata record specifying at minimum: a stable `id`, a human-readable `displayName`, a `category` (`"common"` or `"fun"`), a `family` classification, the geometric properties it `preserves` and `distorts` (any subset of `shape`, `area`, `distance`, `direction`), a boolean `supportsInvert` flag, a boolean `needsLocationContext` flag, a `build` function returning a configured `GeoProjection`, and short and long human-readable explanation strings.

#### Scenario: Explanation cards render from metadata

- **WHEN** the user requests an explanation card for a projection in any section
- **THEN** the rendered card SHALL display the projection's `displayName`, what it preserves, what it distorts, and its `longExplanation` text — all read from the metadata record

#### Scenario: Editing-enabled flag is sourced from metadata

- **WHEN** the projection-comparer evaluates whether a panel should accept geometry editing
- **THEN** that evaluation SHALL be based on the projection's `supportsInvert` metadata flag and SHALL NOT be hardcoded per-projection elsewhere in the codebase

### Requirement: UTM auto-zones from the global location

When the UTM projection is in use, the central meridian SHALL be derived from the current global location's longitude using the standard 6°-zone formula (`floor((lon + 180) / 6) * 6 + 3`), and the projection SHALL rebuild whenever the global location changes such that its zone changes.

#### Scenario: UTM follows the location

- **WHEN** the global location moves into a different UTM zone (e.g., from longitude 5°E to 95°E)
- **THEN** any panel rendering the UTM projection SHALL rebuild with the new zone's central meridian and re-render

#### Scenario: Hemisphere is handled

- **WHEN** the global location is in the southern hemisphere
- **THEN** the UTM projection SHALL be configured with the appropriate southern-hemisphere false northing such that southern-latitude features render correctly

### Requirement: TopoJSON coastline basemap

The projection engine SHALL render a coastline-only basemap from a bundled `world-atlas` TopoJSON file (110m resolution by default). No raster tiles SHALL be requested or rendered. The basemap SHALL be rendered consistently across all 8 projections.

#### Scenario: Coastlines render in any projection

- **WHEN** the engine renders any projection from the catalog
- **THEN** continental coastlines SHALL be drawn as SVG paths transformed by that projection's `GeoPath` generator

#### Scenario: No tile requests are made

- **WHEN** the application is in any state during normal use
- **THEN** the network panel SHALL show no requests to any raster tile server (e.g., `tile.openstreetmap.org`, `*.basemaps.cartocdn.com`)

### Requirement: Reusable `<ProjectedMap>` component

The engine SHALL expose a reusable React component that accepts at minimum: a projection id (or projection metadata record), a width and height, a list of geographic geometries to render, optional overlay layers (e.g., satellite markers), and event callbacks for clicks and drags. The component SHALL render an `<svg>` whose contents are managed by D3 from within React effects, with React owning the root DOM and D3 owning child path/marker rendering.

#### Scenario: Component renders in either section

- **WHEN** either the GNSS Sky section or the Projection Comparer section needs to render a map
- **THEN** it SHALL do so by mounting one or more instances of `<ProjectedMap>` with appropriate props

#### Scenario: Click events report geographic coordinates

- **WHEN** the user clicks on a `<ProjectedMap>` whose projection supports `.invert()`
- **THEN** the click callback SHALL receive the lat/lon of the clicked location, computed via the projection's inverse

#### Scenario: Resize is supported

- **WHEN** the rendering container changes size
- **THEN** the component SHALL re-fit the projection and re-render basemap, geometries, and overlays at the new dimensions without losing state

