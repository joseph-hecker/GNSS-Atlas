import type { GeoProjection } from 'd3-geo';
import type { Location } from '@/state/location';

export type ProjectionId =
  | 'web-mercator'
  | 'equirectangular'
  | 'equal-earth'
  | 'lambert-conformal-conic'
  | 'albers-equal-area'
  | 'utm'
  | 'bonne'
  | 'waterman-butterfly';

export type ProjectionCategory = 'common' | 'fun';

export type ProjectionFamily =
  | 'cylindrical'
  | 'pseudocylindrical'
  | 'conic'
  | 'polyhedral'
  | 'other';

export type GeometricProperty = 'shape' | 'area' | 'distance' | 'direction';

export interface ProjectionContext {
  location: Location;
}

export interface ProjectionMetadata {
  id: ProjectionId;
  displayName: string;
  category: ProjectionCategory;
  family: ProjectionFamily;
  preserves: GeometricProperty[];
  distorts: GeometricProperty[];
  supportsInvert: boolean;
  needsLocationContext: boolean;
  build: (ctx: ProjectionContext) => GeoProjection;
  shortExplanation: string;
  longExplanation: string;
}
