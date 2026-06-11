import db from '../database/index.js';
import type { GeoFenceConfig } from '@shared/types';

export const geofenceService = {
  getBySchoolId(schoolId: number): GeoFenceConfig | null {
    const result = db.prepare(`
      SELECT 
        id,
        school_id,
        center_lat,
        center_lng,
        radius,
        polygon,
        created_at,
        updated_at
      FROM geo_fences
      WHERE school_id = ?
    `).get(schoolId) as any;

    if (!result) {
      return null;
    }

    let polygon: Array<{ lat: number; lng: number }> | undefined;
    if (result.polygon) {
      try {
        polygon = JSON.parse(result.polygon);
      } catch {
        polygon = undefined;
      }
    }

    return {
      id: result.id,
      schoolId: result.school_id,
      centerLat: result.center_lat,
      centerLng: result.center_lng,
      radius: result.radius,
      polygon,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  },

  update(schoolId: number, data: {
    centerLat: number;
    centerLng: number;
    radius: number;
    polygon?: Array<{ lat: number; lng: number }>;
  }, schoolIds: number[]): GeoFenceConfig | null {
    if (schoolIds.length > 0 && !schoolIds.includes(schoolId)) {
      return null;
    }

    const existing = db.prepare(`
      SELECT id, school_id FROM geo_fences WHERE school_id = ?
    `).get(schoolId) as { id: number; school_id: number } | undefined;

    const polygonJson = data.polygon ? JSON.stringify(data.polygon) : null;

    if (existing) {
      db.prepare(`
        UPDATE geo_fences
        SET 
          center_lat = ?,
          center_lng = ?,
          radius = ?,
          polygon = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE school_id = ?
      `).run(data.centerLat, data.centerLng, data.radius, polygonJson, schoolId);
    } else {
      db.prepare(`
        INSERT INTO geo_fences (
          school_id,
          center_lat,
          center_lng,
          radius,
          polygon
        ) VALUES (?, ?, ?, ?, ?)
      `).run(schoolId, data.centerLat, data.centerLng, data.radius, polygonJson);
    }

    return this.getBySchoolId(schoolId);
  },
};

export default geofenceService;
