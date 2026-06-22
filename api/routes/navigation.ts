import { Router, type Response } from 'express';
import type { ApiResponse, Hospital } from '@shared/types';
import { getDb } from '../models/db.js';
import { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/poi', async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  
  const { keyword, type = 'hospital' } = req.query as { keyword?: string; type?: string };
  
  if (!keyword) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '请输入搜索关键词',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  let hospitals: any[] = [];
  
  if (type === 'hospital') {
    hospitals = db.prepare(`
      SELECT * FROM hospitals 
      WHERE name LIKE ? OR address LIKE ? OR area LIKE ?
      ORDER BY name
      LIMIT 20
    `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  const pois = hospitals.map(h => ({
    id: h.id,
    name: h.name,
    type: 'hospital',
    address: h.address,
    area: h.area,
    level: h.level,
    longitude: h.longitude,
    latitude: h.latitude,
    isInsurancePoint: !!h.is_insurance_point,
    distance: calculateDistance(32.0603, 118.7821, h.latitude, h.longitude)
  }));
  
  const response: ApiResponse<typeof pois> = {
    code: 0,
    message: '搜索成功',
    data: pois.sort((a, b) => a.distance - b.distance)
  };
  
  res.json(response);
});

router.get('/nearby', async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  
  const { latitude = '32.0603', longitude = '118.7821', radius = '5000', limit = '10' } = req.query as {
    latitude?: string;
    longitude?: string;
    radius?: string;
    limit?: string;
  };
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const r = parseFloat(radius);
  const l = parseInt(limit);
  
  const hospitals = db.prepare('SELECT * FROM hospitals').all() as any[];
  
  const nearbyHospitals = hospitals.map(h => {
    const distance = calculateDistance(lat, lng, h.latitude, h.longitude);
    return {
      ...h,
      distance
    };
  }).filter(h => h.distance <= r)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, l);
  
  const formattedHospitals: (Omit<Hospital, 'departments'> & { distance: number })[] = nearbyHospitals.map(h => ({
    id: h.id,
    name: h.name,
    level: h.level,
    area: h.area,
    address: h.address,
    isInsurancePoint: !!h.is_insurance_point,
    longitude: h.longitude,
    latitude: h.latitude,
    insurancePolicy: JSON.parse(h.insurance_policy || '{}'),
    departments: [],
    distance: h.distance
  }));
  
  const response: ApiResponse<typeof formattedHospitals> = {
    code: 0,
    message: '获取成功',
    data: formattedHospitals
  };
  
  res.json(response);
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default router;
