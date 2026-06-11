import { Router, Response } from 'express';
import db from '../database/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { requireRole, getAccessibleSchoolIds } from '../middleware/permission.js';
import { success, error } from '../utils/response.js';
import type { GeoFenceConfig } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, operationLog('geofence', '获取围栏配置'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<GeoFenceConfig[]>([]));
    return;
  }

  const { schoolId } = req.query as { schoolId?: string };

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND school_id = ?';
      params.push(Number(schoolId));
    }
  }

  const sql = `
    SELECT g.*, s.name as school_name
    FROM geo_fences g
    LEFT JOIN schools s ON g.school_id = s.id
    ${whereClause}
    ORDER BY g.created_at DESC
  `;

  const rows = db.prepare(sql).all(...params) as Array<{
    id: number;
    school_id: number;
    center_lat: number;
    center_lng: number;
    radius: number;
    polygon?: string;
    created_at: string;
    updated_at: string;
    school_name: string;
  }>;

  const fences: GeoFenceConfig[] = rows.map(row => ({
    id: row.id,
    schoolId: row.school_id,
    centerLat: row.center_lat,
    centerLng: row.center_lng,
    radius: row.radius,
    polygon: row.polygon ? JSON.parse(row.polygon) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json(success<GeoFenceConfig[]>(fences));
});

router.put('/', authMiddleware, requireRole('school_admin'), operationLog('geofence', '更新围栏配置'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  const { schoolId, centerLat, centerLng, radius, polygon } = req.body as GeoFenceConfig;

  if (!schoolId || centerLat === undefined || centerLng === undefined || radius === undefined) {
    res.status(400).json(error('学校ID、中心坐标和半径不能为空'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(schoolId)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  const existing = db.prepare('SELECT id FROM geo_fences WHERE school_id = ?').get(schoolId) as { id: number } | undefined;
  const now = new Date().toISOString();
  const polygonJson = polygon ? JSON.stringify(polygon) : null;

  if (existing) {
    db.prepare(`
      UPDATE geo_fences
      SET center_lat = ?, center_lng = ?, radius = ?, polygon = ?, updated_at = ?
      WHERE school_id = ?
    `).run(centerLat, centerLng, radius, polygonJson, now, schoolId);
  } else {
    db.prepare(`
      INSERT INTO geo_fences (school_id, center_lat, center_lng, radius, polygon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(schoolId, centerLat, centerLng, radius, polygonJson, now, now);
  }

  const fence = db.prepare(`
    SELECT g.*, s.name as school_name
    FROM geo_fences g
    LEFT JOIN schools s ON g.school_id = s.id
    WHERE g.school_id = ?
  `).get(schoolId) as {
    id: number;
    school_id: number;
    center_lat: number;
    center_lng: number;
    radius: number;
    polygon?: string;
    created_at: string;
    updated_at: string;
    school_name: string;
  };

  const fenceConfig: GeoFenceConfig = {
    id: fence.id,
    schoolId: fence.school_id,
    centerLat: fence.center_lat,
    centerLng: fence.center_lng,
    radius: fence.radius,
    polygon: fence.polygon ? JSON.parse(fence.polygon) : undefined,
    createdAt: fence.created_at,
    updatedAt: fence.updated_at,
  };

  res.json(success<GeoFenceConfig>(fenceConfig, '围栏配置更新成功'));
});

export default router;
