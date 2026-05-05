import {
  geoAlbers,
  geoConicConformal,
  geoConicEqualArea,
  geoEqualEarth,
  geoEquirectangular,
  geoMercator,
  geoTransverseMercator,
  type GeoProjection,
} from 'd3-geo';
import {
  geoBonne,
  geoPolyhedralWaterman,
} from 'd3-geo-projection';
import { utmCentralMeridian, utmZoneFor } from '@/lib/coordinates';
import type {
  ProjectionContext,
  ProjectionId,
  ProjectionMetadata,
} from './types';

function recenter(projection: GeoProjection, lat: number, lon: number) {
  return projection.rotate([-lon, 0]).center([0, lat]);
}

function buildWebMercator({ location }: ProjectionContext): GeoProjection {
  return geoMercator().rotate([-location.lon, 0]);
}

function buildEquirectangular({ location }: ProjectionContext): GeoProjection {
  return recenter(geoEquirectangular(), location.lat, location.lon);
}

function buildEqualEarth({ location }: ProjectionContext): GeoProjection {
  return recenter(geoEqualEarth(), 0, location.lon);
}

function buildLambertConformalConic({
  location,
}: ProjectionContext): GeoProjection {
  const lat = location.lat;
  const span = 30;
  const phi1 = Math.max(-80, lat - span);
  const phi2 = Math.min(80, lat + span);
  return geoConicConformal()
    .parallels([phi1, phi2])
    .rotate([-location.lon, 0])
    .center([0, lat]);
}

function buildAlbersEqualArea({
  location,
}: ProjectionContext): GeoProjection {
  const lat = location.lat;
  if (Math.abs(lat) < 0.01) {
    return geoConicEqualArea()
      .parallels([-30, 30])
      .rotate([-location.lon, 0])
      .center([0, lat]);
  }
  const span = 30;
  const phi1 = Math.max(-80, lat - span);
  const phi2 = Math.min(80, lat + span);
  if (Math.abs(lat) > 20) {
    return geoAlbers()
      .parallels([phi1, phi2])
      .rotate([-location.lon, 0])
      .center([0, lat]);
  }
  return geoConicEqualArea()
    .parallels([phi1, phi2])
    .rotate([-location.lon, 0])
    .center([0, lat]);
}

function buildUtm({ location }: ProjectionContext): GeoProjection {
  const zone = utmZoneFor(location.lon);
  const centralMeridian = utmCentralMeridian(zone);
  return geoTransverseMercator()
    .rotate([-centralMeridian, 0, 0])
    .center([0, location.lat]);
}

function buildBonne({ location }: ProjectionContext): GeoProjection {
  return (geoBonne().parallel(45) as GeoProjection)
    .rotate([-location.lon, 0])
    .center([0, location.lat]);
}

function buildWatermanButterfly(_ctx: ProjectionContext): GeoProjection {
  return geoPolyhedralWaterman();
}

export const PROJECTIONS: ProjectionMetadata[] = [
  {
    id: 'web-mercator',
    displayName: 'Web Mercator',
    category: 'common',
    family: 'cylindrical',
    preserves: ['shape', 'direction'],
    distorts: ['area', 'distance'],
    supportsInvert: true,
    needsLocationContext: false,
    build: buildWebMercator,
    shortExplanation: 'The web default. Conformal but distorts area badly near the poles.',
    longExplanation:
      'Web Mercator is the projection used by virtually every web map you have ever seen. It preserves local angles and shapes, which is why streets meet at right angles and tiny features look correct. The price is enormous area distortion: Greenland appears about the size of Africa even though Africa is roughly fourteen times larger.',
  },
  {
    id: 'equirectangular',
    displayName: 'Equirectangular (Plate Carrée)',
    category: 'common',
    family: 'cylindrical',
    preserves: ['distance'],
    distorts: ['shape', 'area', 'direction'],
    supportsInvert: true,
    needsLocationContext: false,
    build: buildEquirectangular,
    shortExplanation: 'The simplest map possible: latitude is the y-axis, longitude is the x-axis.',
    longExplanation:
      'Plate Carrée maps each degree of latitude or longitude to the same number of pixels. It is the simplest projection imaginable and is often used for raster data interchange. Distances are correct only along meridians; everything else stretches as you approach the poles.',
  },
  {
    id: 'equal-earth',
    displayName: 'Equal Earth',
    category: 'common',
    family: 'pseudocylindrical',
    preserves: ['area'],
    distorts: ['shape', 'distance', 'direction'],
    supportsInvert: true,
    needsLocationContext: false,
    build: buildEqualEarth,
    shortExplanation: 'A modern equal-area projection. Greenland looks honestly small.',
    longExplanation:
      'Equal Earth (Šavrič, Patterson, and Jenny, 2018) is a contemporary replacement for older equal-area projections like Robinson. Areas are preserved exactly, so visual comparisons of country sizes are honest. Shapes near the poles are slightly squashed, but the overall look is friendly and balanced.',
  },
  {
    id: 'lambert-conformal-conic',
    displayName: 'Lambert Conformal Conic',
    category: 'common',
    family: 'conic',
    preserves: ['shape'],
    distorts: ['area', 'distance'],
    supportsInvert: true,
    needsLocationContext: true,
    build: buildLambertConformalConic,
    shortExplanation: 'Aviation favourite. Great-circle routes look almost straight.',
    longExplanation:
      'Lambert Conformal Conic preserves angles and works best across mid-latitude regions, with two standard parallels straddling the area of interest. It is the projection used by aviation charts and many national maps because long routes — which follow great circles — appear close to straight lines.',
  },
  {
    id: 'albers-equal-area',
    displayName: 'Albers Equal-Area Conic',
    category: 'common',
    family: 'conic',
    preserves: ['area'],
    distorts: ['shape', 'distance'],
    supportsInvert: true,
    needsLocationContext: true,
    build: buildAlbersEqualArea,
    shortExplanation: 'USGS standard for U.S. maps. Areas correct, shapes a little squished.',
    longExplanation:
      'Albers preserves area between two standard parallels. It is widely used by national mapping agencies, including the USGS for maps of the contiguous United States, because it lets you measure regions accurately while keeping shape distortion modest in the centre of the map.',
  },
  {
    id: 'utm',
    displayName: 'UTM (auto-zoned)',
    category: 'common',
    family: 'cylindrical',
    preserves: ['shape'],
    distorts: ['area', 'distance'],
    supportsInvert: true,
    needsLocationContext: true,
    build: buildUtm,
    shortExplanation: 'What surveyors use. The world is split into 60 zones; we picked yours.',
    longExplanation:
      'UTM (Universal Transverse Mercator) divides the world into 60 zones, each 6° of longitude wide. Within a single zone, distances and shapes are very accurate, which is why surveyors and field engineers rely on it. The zone shown here follows your selected location automatically.',
  },
  {
    id: 'bonne',
    displayName: 'Bonne',
    category: 'fun',
    family: 'pseudocylindrical',
    preserves: ['area'],
    distorts: ['shape', 'distance', 'direction'],
    supportsInvert: true,
    needsLocationContext: false,
    build: buildBonne,
    shortExplanation: 'Heart-shaped pseudoconic. Equal-area, but visually playful.',
    longExplanation:
      'Bonne is a pseudoconic equal-area projection used on old French maps. Choose any standard parallel and it will look quite normal there; far from the standard parallel, the world peels into the famous heart shape. A great example of how preserving one property can make others look wild.',
  },
  {
    id: 'waterman-butterfly',
    displayName: 'Waterman Butterfly',
    category: 'fun',
    family: 'polyhedral',
    preserves: ['area'],
    distorts: ['shape', 'distance', 'direction'],
    supportsInvert: false,
    needsLocationContext: false,
    build: buildWatermanButterfly,
    shortExplanation: "Polyhedral 'butterfly' map. View-only — clicks can't be unprojected.",
    longExplanation:
      "Steve Waterman's butterfly is an unfolding of a truncated octahedron. It makes a striking, almost organic shape that emphasises the polar regions and the connectivity of oceans. We can't reliably invert clicks back to coordinates on this projection, so panels using Waterman are view-only.",
  },
];

export const PROJECTIONS_BY_ID: Record<ProjectionId, ProjectionMetadata> =
  PROJECTIONS.reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<ProjectionId, ProjectionMetadata>,
  );

export function getProjectionMeta(id: ProjectionId): ProjectionMetadata {
  return PROJECTIONS_BY_ID[id];
}
