## ADDED Requirements

### Requirement: TLE acquisition with cache and fallback

The GNSS Sky section SHALL acquire current GPS-only Two-Line Element sets by fetching `https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json` directly from the browser. The fetched payload SHALL be cached in `localStorage` with a 6-hour TTL. If the network fetch fails for any reason, the system SHALL fall back to a static TLE JSON file bundled in the application's `public/` directory and continue to function.

#### Scenario: Successful fetch caches the payload

- **WHEN** the application loads, no fresh cached TLE payload is present, and the CelesTrak request succeeds
- **THEN** the parsed TLE list SHALL be used for all satellite computations and SHALL be written to `localStorage` with the current timestamp

#### Scenario: Fresh cache is reused

- **WHEN** the application loads and the `localStorage` cache contains a TLE payload less than 6 hours old
- **THEN** the system SHALL use the cached payload and SHALL NOT make a network request to CelesTrak

#### Scenario: Fallback on network or CORS failure

- **WHEN** the CelesTrak request fails (network error, CORS rejection, non-2xx response) and no fresh cache is present
- **THEN** the system SHALL load the bundled fallback TLE JSON, use it for computations, and display a small visible badge stating that fallback data (with its epoch) is in use

### Requirement: SGP4 propagation at the selected time

The system SHALL propagate every loaded GPS satellite TLE to the currently selected UTC time using `satellite.js` (SGP4) and produce, for each satellite, its ECI position, ECEF position, sub-satellite point (geodetic latitude, longitude, altitude), and instantaneous velocity vector. The propagation SHALL re-run whenever the selected time or the loaded TLE set changes.

#### Scenario: Time slider triggers re-propagation

- **WHEN** the user changes the selected time in the Sky section's time picker
- **THEN** all GPS satellites SHALL be re-propagated to the new time within a single render cycle and the displayed satellite positions SHALL update

#### Scenario: Each satellite produces a valid sub-point

- **WHEN** propagation completes for a given satellite
- **THEN** that satellite SHALL have a sub-point with `latitude` in `[-90, 90]`, `longitude` in `[-180, 180]`, and `altitudeKm` greater than 19,000 km (a sanity bound consistent with the GPS MEO orbit)

### Requirement: Satellite plotting on Web Mercator

The Sky section SHALL render the world in the Web Mercator projection and plot every propagated GPS satellite at its sub-satellite point as a clickable marker. Markers SHALL visually distinguish satellites that are above the horizon from the global location (visible) versus below it (not visible).

#### Scenario: All satellites are plotted

- **WHEN** propagation completes
- **THEN** every GPS satellite in the loaded TLE set SHALL be plotted exactly once at its sub-point on the Web Mercator basemap

#### Scenario: Visibility is indicated

- **WHEN** the markers are rendered
- **THEN** satellites whose elevation angle (computed from the global location) is at or above 0° SHALL be visually distinct (e.g., filled vs. outlined, or different color) from satellites below that elevation

### Requirement: Per-satellite info panel (medium depth)

When the user clicks a satellite marker, the section SHALL display an info panel for that satellite containing at minimum: PRN / catalog name, sub-satellite latitude and longitude, altitude (km), instantaneous velocity magnitude, azimuth and elevation as observed from the global location, and a `visible-from-here` boolean indicator. The info panel SHALL update whenever the selected time, global location, or selected satellite changes.

#### Scenario: Selecting a satellite opens the info panel

- **WHEN** the user clicks a satellite marker on the map
- **THEN** the info panel SHALL display all required fields for that satellite, computed at the currently selected time

#### Scenario: Info refreshes on time change

- **WHEN** the user changes the selected time while a satellite is selected
- **THEN** the info panel's altitude, velocity, sub-point, and az/el fields SHALL update to reflect the new time

#### Scenario: Info refreshes on location change

- **WHEN** the user changes the global location while a satellite is selected
- **THEN** the azimuth, elevation, and visible-from-here fields SHALL recompute against the new observer location

#### Scenario: Closing the info panel

- **WHEN** the user closes the info panel or clicks an empty area of the map
- **THEN** no satellite SHALL be selected and the info panel SHALL be hidden

### Requirement: TLE epoch display

The section SHALL display the epoch (issuance time) of the currently loaded TLE set, regardless of whether it came from the network or the fallback file, so the user can reason about propagation accuracy.

#### Scenario: Epoch is visible

- **WHEN** the Sky section is rendered and a TLE set is loaded
- **THEN** the section SHALL display the most recent TLE epoch (e.g., "TLE epoch: 2026-05-02 04:17 UTC") in a non-intrusive UI location

### Requirement: GPS-only scope

The Sky section SHALL only request, propagate, and display satellites from the GPS constellation in this change. Other constellations (GLONASS, Galileo, BeiDou) SHALL NOT be fetched or rendered.

#### Scenario: Only GPS satellites appear

- **WHEN** the user inspects the map at any selected time
- **THEN** every plotted satellite marker SHALL correspond to a GPS-constellation TLE, and no GLONASS/Galileo/BeiDou markers SHALL be present
