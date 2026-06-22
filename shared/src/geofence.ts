import { BaseEntity, Coordinate } from './common';

export type GeofenceType = 'service_area' | 'restricted_area' | 'hotspot' | 'warehouse';

export interface Geofence extends BaseEntity {
  name: string;
  type: GeofenceType;
  description?: string;
  coordinates: Coordinate[];
  center: Coordinate;
  radius?: number;
  isEnabled: boolean;
  color?: string;
  properties?: Record<string, unknown>;
}

export interface GeofenceAlert extends BaseEntity {
  geofenceId: string;
  riderId: string;
  eventType: 'enter' | 'exit';
  location: Coordinate;
  timestamp: Date;
}

export interface Hotspot extends BaseEntity {
  name: string;
  location: Coordinate;
  radius: number;
  orderCount: number;
  riderCount: number;
  heatLevel: number;
  peakHours: string[];
}
