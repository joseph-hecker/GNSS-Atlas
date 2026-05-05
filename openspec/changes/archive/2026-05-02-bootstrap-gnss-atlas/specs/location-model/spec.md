## ADDED Requirements

### Requirement: Location model with WGS-84 coordinates and UTC time

The system SHALL maintain a single global location object consisting of a WGS-84 latitude (degrees, in `[-90, 90]`), a WGS-84 longitude (degrees, in `[-180, 180]`), an explicit datum identifier (always `"WGS-84"` for this change), and a selected UTC timestamp. This object SHALL be the single source of truth for "where" and "when" across the entire application.

#### Scenario: Location has a sensible default on first load

- **WHEN** the application is opened with no prior state
- **THEN** the global location SHALL be set to a deterministic default lat/lon and the selected time SHALL be set to the current UTC time

#### Scenario: Latitude and longitude are validated

- **WHEN** any setter receives a latitude outside `[-90, 90]` or a longitude outside `[-180, 180]`
- **THEN** the system SHALL reject the update and SHALL NOT mutate the current location

### Requirement: Coordinate format display

The location panel SHALL display the current location simultaneously in at least the following formats: decimal degrees (Lat/Lon), degrees-minutes-seconds (DMS), UTM (zone, hemisphere, easting, northing), and MGRS. Conversions SHALL use `proj4` and `mgrs` libraries (or equivalent vetted implementations) and SHALL be live-updated whenever the location changes.

#### Scenario: All formats update on location change

- **WHEN** the global location is updated to a new lat/lon
- **THEN** all four displayed formats (Decimal, DMS, UTM, MGRS) SHALL update within the same render cycle to reflect the new location

#### Scenario: Edge cases display gracefully

- **WHEN** the location is set to a coordinate where UTM is undefined or ambiguous (e.g., the poles, or near the ±180° antimeridian transition)
- **THEN** the UTM and MGRS fields SHALL display a clear placeholder (e.g., `"N/A at this latitude"`) rather than crashing or showing nonsensical values

### Requirement: Location entry by clicking on a map

A user SHALL be able to set the global location by clicking anywhere on the visible map in either section.

#### Scenario: Click on the GNSS Sky map sets location

- **WHEN** the user clicks a point on the GNSS Sky section's map
- **THEN** the global location SHALL update to the lat/lon corresponding to the clicked pixel (using the projection's `.invert()`), and all displayed coordinate formats SHALL update accordingly

#### Scenario: Click on a Projection Comparer panel sets location

- **WHEN** the user clicks a point on either of the two Projection Comparer panels (in a non-drawing tool mode)
- **THEN** the global location SHALL update to the lat/lon corresponding to the clicked pixel on that panel's projection

### Requirement: Location entry by typing coordinates

A user SHALL be able to set the global location by entering coordinates in either decimal-degrees or DMS format through the location panel's input controls.

#### Scenario: Decimal-degrees entry

- **WHEN** the user types a valid latitude and longitude in decimal degrees and submits the form
- **THEN** the global location SHALL update to the entered values and all displays (including the map pin in any visible section) SHALL update to reflect the new location

#### Scenario: DMS entry

- **WHEN** the user types a valid DMS string for latitude and longitude (e.g., `51°28'40"N 0°00'05"W`) and submits the form
- **THEN** the system SHALL parse the DMS string and update the global location accordingly

#### Scenario: Invalid input is rejected with feedback

- **WHEN** the user submits a coordinate input that cannot be parsed
- **THEN** the system SHALL NOT modify the global location and SHALL display an inline validation message indicating the format problem

### Requirement: Location entry by place-name search

A user SHALL be able to set the global location by typing a place name into a search input. The system SHALL query a public geocoding service (Nominatim by default) from the browser, present matching results, and update the global location to the user-selected result.

#### Scenario: Search returns matches

- **WHEN** the user types a query of two or more characters and the geocoding service returns one or more matches
- **THEN** the system SHALL display a results list with each match's display name and lat/lon

#### Scenario: User picks a match

- **WHEN** the user selects a result from the search list
- **THEN** the global location SHALL update to that result's lat/lon and the search results list SHALL close

#### Scenario: Geocoding service unavailable

- **WHEN** the geocoding request fails (network error, rate-limit response, CORS failure)
- **THEN** the system SHALL display a non-blocking error message in the search UI and SHALL leave the global location unchanged

### Requirement: Selected time control bounded to ±7 days

The location model SHALL include a `selectedTimeUtc` value, controllable in the GNSS Sky section through a time picker. The user-selectable range SHALL be bounded to `[now - 7 days, now + 7 days]` at the moment the picker is opened, and the picker SHALL prevent values outside this range.

#### Scenario: Default time is "now"

- **WHEN** the application loads
- **THEN** `selectedTimeUtc` SHALL equal the current UTC time and the GNSS Sky section's time picker SHALL display "now"

#### Scenario: User picks a time within range

- **WHEN** the user adjusts the time picker to any moment within ±7 days of the current time
- **THEN** `selectedTimeUtc` SHALL update to that moment and dependent satellite computations SHALL re-run

#### Scenario: Out-of-range times are unreachable

- **WHEN** the user attempts to scroll, drag, or type a time outside the ±7-day window
- **THEN** the picker SHALL clamp the value to the nearest in-range bound and SHALL NOT propagate an out-of-range value to the model
