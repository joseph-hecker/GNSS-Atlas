# projection-comparer Specification

## Purpose
TBD - created by archiving change bootstrap-gnss-atlas. Update Purpose after archive.
## Requirements
### Requirement: Side-by-side projection panels

The Projection Comparer section SHALL render two projection panels side-by-side. Each panel SHALL be an instance of the `<ProjectedMap>` component and SHALL render the same coastline basemap and the same shared geometry set, differing only in the projection used.

#### Scenario: Two panels render at once

- **WHEN** the user navigates to the Projection Comparer section
- **THEN** the section SHALL render exactly two side-by-side projection panels, each with its own projection picker

#### Scenario: Same geometries appear in both panels

- **WHEN** the shared geometry store contains any geometry
- **THEN** that geometry SHALL be rendered in both panels through their respective projections

### Requirement: Independent projection selection per panel

Each panel SHALL have an independent projection picker that lists all projections in the catalog (Section 1's `projection-engine` capability). The two panels MAY have the same projection selected or different projections; the user is not constrained.

#### Scenario: Default projection pair

- **WHEN** the section is first opened with no prior state
- **THEN** the left panel SHALL default to Web Mercator and the right panel SHALL default to Equal Earth

#### Scenario: User changes a panel's projection

- **WHEN** the user picks a different projection from a panel's picker
- **THEN** that panel SHALL rebuild its projection, re-render the basemap and all geometries, and update its editability state based on the new projection's `supportsInvert` flag

#### Scenario: Both panels may share a projection

- **WHEN** the user picks the same projection in both pickers
- **THEN** the section SHALL allow it and render both panels with that projection

### Requirement: Both panels centered on the global location

When the user changes the global location, the projection in each panel SHALL re-center on the new location. For most projections this is implemented by adjusting the projection's `rotate` parameter; for projections such as UTM whose definition is location-dependent the projection itself SHALL rebuild as defined by the projection-engine capability.

#### Scenario: Re-centering follows the global location

- **WHEN** the global location changes
- **THEN** both panels SHALL re-render with their projections centered on the new location

### Requirement: Synchronized geometry editing across panels

Drawing and editing operations performed on one panel SHALL be reflected in the other panel in real time, because both panels render from the same shared geometry store (Section 1's `geometry-model` capability). The two panels do not maintain separate geometry copies.

#### Scenario: Drawing on the left panel appears on the right

- **WHEN** the user draws a new geometry (point / line / polygon / circle) on the left panel
- **THEN** the same geometry SHALL be rendered on the right panel as soon as it is committed to the shared store

#### Scenario: Dragging on the right panel updates the left

- **WHEN** the user drags an existing geometry's vertex or body on the right panel
- **THEN** the left panel SHALL re-render the updated geometry within the same render cycle

### Requirement: Per-projection explanation card

Each panel SHALL display a compact explanation card describing the panel's currently selected projection, sourced from the projection's metadata. The card SHALL include the projection's display name, what it preserves, what it distorts, and a one-paragraph plain-language description aimed at a beginner audience.

#### Scenario: Card updates when projection changes

- **WHEN** the user changes a panel's projection via its picker
- **THEN** the explanation card on that panel SHALL update to display the new projection's metadata-defined explanation text

#### Scenario: Card uses plain language

- **WHEN** any explanation card is displayed
- **THEN** the text SHALL avoid undefined GIS jargon; any technical terms used (e.g., "conformal", "equal-area") SHALL be either defined inline or accompanied by a tooltip with a plain-language definition

### Requirement: Drawing toolbar

The Projection Comparer SHALL display a single toolbar that controls the active drawing/editing mode for both panels (per the `geometry-model` capability). The toolbar SHALL include at minimum: select, draw-point, draw-line, draw-polygon, draw-circle, and delete modes.

#### Scenario: Switching modes affects both panels

- **WHEN** the user activates a different drawing mode in the toolbar
- **THEN** subsequent clicks and drags on either editable panel SHALL be interpreted according to that mode

#### Scenario: Toolbar reflects the active mode

- **WHEN** any tool mode is active
- **THEN** the toolbar SHALL visually indicate which mode is active (e.g., highlighted button)

