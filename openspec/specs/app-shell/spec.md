# app-shell Specification

## Purpose
TBD - created by archiving change bootstrap-gnss-atlas. Update Purpose after archive.
## Requirements
### Requirement: Build and tooling baseline

The application SHALL be built with Vite and use React 18 and TypeScript. The repository MUST provide standard scripts (`dev`, `build`, `preview`, `lint`, `format`) so a developer can run, build, lint, and format the project from a clean clone with only `npm install` and `npm run <script>`.

#### Scenario: Fresh clone runs the dev server

- **WHEN** a developer clones the repository, runs `npm install`, then runs `npm run dev`
- **THEN** Vite SHALL start a local dev server and serve the SPA at the printed URL with no manual configuration steps

#### Scenario: Production build emits a static bundle

- **WHEN** a developer runs `npm run build`
- **THEN** Vite SHALL produce a static `dist/` directory containing `index.html` and bundled assets that is deployable to any static host with no server runtime

#### Scenario: Lint and format scripts are wired

- **WHEN** a developer runs `npm run lint`
- **THEN** ESLint SHALL run against the source tree and report any violations using the project configuration
- **AND WHEN** the developer runs `npm run format`
- **THEN** Prettier SHALL format the source tree in place

### Requirement: Top-level layout with two sections

The application SHALL render a top-level layout consisting of (a) a persistent header or sidebar containing the location panel, (b) a navigation control to switch between the two sections, and (c) a main content area that renders the active section.

#### Scenario: Default landing route

- **WHEN** the user opens the application root URL `/`
- **THEN** the application SHALL redirect to `/sky` and render the GNSS Sky section

#### Scenario: Section switching via routes

- **WHEN** the user navigates to `/sky`
- **THEN** the application SHALL render the GNSS Sky section in the main content area
- **AND WHEN** the user navigates to `/compare`
- **THEN** the application SHALL render the Projection Comparer section in the main content area

#### Scenario: Persistent location panel

- **WHEN** the user navigates between `/sky` and `/compare`
- **THEN** the location panel SHALL remain visible and reflect the current global location across both routes

### Requirement: Global state container for shared location and time

The application SHALL provide a single global state container that holds the current location (latitude, longitude, datum) and the currently selected UTC time, exposed to descendant components through a `useLocation()` hook (or equivalent).

#### Scenario: Sections read shared state

- **WHEN** any component within either section calls the `useLocation()` hook
- **THEN** it SHALL receive the current location and selected time values without prop-drilling from the layout

#### Scenario: Updates propagate to all consumers

- **WHEN** the location is updated through the provider's setter
- **THEN** every component subscribed to the hook SHALL re-render with the new value within the same React commit cycle

### Requirement: Static SPA deployment with no backend

The application SHALL function entirely as a static SPA. It MUST NOT require a server runtime, database, environment variables, or API keys to operate.

#### Scenario: Deployment to a static host

- **WHEN** the contents of `dist/` are uploaded to any static file host (GitHub Pages, Netlify, Vercel, S3 + CloudFront, etc.)
- **THEN** the application SHALL load and function with full features available, subject only to the user's network access to public third-party services (CelesTrak, Nominatim)

#### Scenario: No required environment variables

- **WHEN** the application is built and run
- **THEN** it SHALL NOT read any required environment variables, and the absence of any `.env` file SHALL NOT prevent the application from working

