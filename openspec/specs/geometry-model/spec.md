# geometry-model Specification

## Purpose
TBD - created by archiving change bootstrap-gnss-atlas. Update Purpose after archive.
## Requirements
### Requirement: Geographic-coordinate geometry primitives

The system SHALL support four geometry primitives whose vertices and parameters are stored exclusively in WGS-84 geographic coordinates: `Point` (a single lat/lon), `Line` (an ordered list of two or more lat/lon vertices), `Polygon` (an ordered closed ring of three or more lat/lon vertices), and `Circle` (a center lat/lon plus a radius in kilometers, interpreted as a spherical small circle on the Earth).

#### Scenario: Geometry shape is projection-independent

- **WHEN** any geometry is created or modified
- **THEN** its stored representation SHALL be lat/lon (or, for circles, lat/lon center + km radius), and SHALL NOT contain any pixel-space, projected, or projection-id-tagged coordinates

#### Scenario: Each primitive renders correctly

- **WHEN** any of the four primitives is added to a `<ProjectedMap>` with any catalog projection
- **THEN** the primitive SHALL render through that projection's `GeoPath` generator (using `d3.geoCircle()` for circles) and produce a visually correct shape for that projection

### Requirement: Single shared geometry store

The Projection Comparer SHALL maintain a single in-memory store of geometries shared across both projection panels. Both panels SHALL read from and write to this single store; no per-panel geometry copies SHALL exist.

#### Scenario: Edit on one panel updates both

- **WHEN** the user edits a geometry (move a vertex, drag the shape, change a circle's radius) on one panel
- **THEN** the shared store SHALL update and both panels SHALL re-render the updated geometry

#### Scenario: Add or delete propagates

- **WHEN** the user adds a new geometry on one panel or deletes an existing geometry from any UI control
- **THEN** the change SHALL be reflected in both panels' renderings

### Requirement: Drawing tool modes

The Projection Comparer SHALL provide a tool selector with at minimum the modes: `select`, `draw-point`, `draw-line`, `draw-polygon`, `draw-circle`, and `delete`. Only one mode SHALL be active at a time, and the active mode SHALL determine how clicks and drags on the panels are interpreted.

#### Scenario: Drawing a point

- **WHEN** the active mode is `draw-point` and the user clicks on a panel whose projection supports `.invert()`
- **THEN** a new `Point` geometry SHALL be added to the shared store at the clicked lat/lon

#### Scenario: Drawing a line

- **WHEN** the active mode is `draw-line`
- **THEN** each click on an editable panel SHALL append a vertex to a new in-progress line, and a double-click or `Enter` SHALL finalize the line with the accumulated vertices and add it to the shared store

#### Scenario: Drawing a polygon

- **WHEN** the active mode is `draw-polygon`
- **THEN** each click on an editable panel SHALL append a vertex to a new in-progress polygon, and a double-click, `Enter`, or click on the first vertex SHALL close the ring and add the polygon to the shared store

#### Scenario: Drawing a circle

- **WHEN** the active mode is `draw-circle`
- **THEN** the user SHALL be able to click a center on an editable panel and either drag outward to set the radius or enter a numeric radius (km) in a follow-up control, and the resulting `Circle` SHALL be added to the shared store

### Requirement: Editing existing geometries

In `select` mode, the user SHALL be able to (a) drag any geometry to translate it, and (b) drag any vertex of a `Line` or `Polygon` to move that vertex, and (c) drag a `Circle`'s edge handle to change its radius. All edits SHALL operate on the shared geometric model.

#### Scenario: Translate by dragging the shape

- **WHEN** the user mouses down on the body of a geometry on an editable panel and drags
- **THEN** every vertex of that geometry (or the center, for a circle) SHALL be offset by the equivalent geographic delta of the drag, computed through the panel's projection inverse

#### Scenario: Move a single vertex

- **WHEN** the user mouses down on a vertex handle of a line or polygon and drags
- **THEN** only that vertex's lat/lon SHALL update, and both panels SHALL re-render the geometry with the new vertex in place

#### Scenario: Resize a circle

- **WHEN** the user drags a circle's edge handle outward or inward
- **THEN** the circle's `radiusKm` SHALL update and the rendered small-circle SHALL grow or shrink in both panels

### Requirement: Editing is gated by projection invert support

A panel SHALL accept drawing and editing input only if its current projection's metadata declares `supportsInvert: true`. Panels whose projection has no usable invert SHALL be view-only, MUST visibly indicate that state, and SHALL NOT consume drawing or editing input events.

#### Scenario: View-only badge

- **WHEN** a panel's projection has `supportsInvert: false`
- **THEN** the panel SHALL display a small badge or label indicating the panel is view-only on that projection

#### Scenario: Editing falls through to the other panel

- **WHEN** a panel is view-only and the user attempts to draw or edit on it
- **THEN** the panel SHALL ignore the input, and the user SHALL still be able to perform the same edit on the other panel (if its projection supports invert)

