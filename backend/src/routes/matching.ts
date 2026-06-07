import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calcDistanceScore(distance: number): number {
  if (distance <= 100) return 100;
  if (distance <= 300) return 90;
  if (distance <= 500) return 75;
  if (distance <= 1000) return 60;
  if (distance <= 2000) return 40;
  return 20;
}

function calcCapacityScore(vehicleCapacity: number, cargoWeight: number): number {
  if (cargoWeight <= 0) return 80;
  const ratio = vehicleCapacity / cargoWeight;
  if (ratio >= 1 && ratio <= 1.5) return 100;
  if (ratio > 1.5 && ratio <= 2) return 80;
  if (ratio > 2) return 60;
  return 0;
}

function calcTempScore(vehicleTemp: string, cargoTemp: string): number {
  if (cargoTemp === 'none' || cargoTemp === '') return 80;
  if (cargoTemp === 'cold') {
    return vehicleTemp === 'cold' ? 100 : 0;
  }
  if (vehicleTemp === cargoTemp) return 100;
  return 50;
}

function calcRouteScore(vehicleRoutes: string, originCity: string, destCity: string): number {
  if (!vehicleRoutes) return 50;
  const routes = vehicleRoutes.split(',').map(r => r.trim());
  for (const r of routes) {
    const parts = r.split('-');
    if (parts.length >= 2) {
      if ((parts[0].includes(originCity) || originCity.includes(parts[0])) &&
          (parts[1].includes(destCity) || destCity.includes(parts[1]))) {
        return 100;
      }
    }
  }
  return 30;
}

router.get('/cargo/:id', async (req: Request, res: Response) => {
  try {
    const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(req.params.id) as any;
    if (!cargo) {
      res.status(404).json({ error: '货源不存在' });
      return;
    }

    const vehicles = db.prepare("SELECT v.*, u.username as owner_name, u.real_name as owner_real_name, u.phone as owner_phone, u.company_name as owner_company FROM vehicles v LEFT JOIN users u ON v.user_id = u.id WHERE v.status IN ('available', 'matched')").all() as any[];

    const matches = vehicles.map(v => {
      const distance = haversineDistance(cargo.origin_lat, cargo.origin_lng, v.current_lat, v.current_lng);
      const distance_score = calcDistanceScore(distance);
      const capacity_score = calcCapacityScore(v.load_capacity, cargo.weight);
      const temp_score = calcTempScore(v.temperature_control, cargo.temperature_control);
      const route_score = calcRouteScore(v.available_routes, cargo.origin_city, cargo.dest_city);
      const match_total = distance_score * 0.4 + capacity_score * 0.3 + temp_score * 0.2 + route_score * 0.1;

      return {
        vehicle: v,
        matchDetails: {
          distance: Math.round(distance * 10) / 10,
          distance_score,
          capacity_score,
          temp_score,
          route_score,
        },
        match_total: Math.round(match_total * 10) / 10,
      };
    });

    matches.sort((a, b) => b.match_total - a.match_total);
    res.json(matches.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: '匹配车辆失败' });
  }
});

router.get('/vehicle/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id) as any;
    if (!vehicle) {
      res.status(404).json({ error: '车辆不存在' });
      return;
    }

    const cargos = db.prepare("SELECT c.*, u.username as publisher_name, u.real_name as publisher_real_name, u.phone as publisher_phone, u.company_name as publisher_company FROM cargo c LEFT JOIN users u ON c.user_id = u.id WHERE c.status IN ('pending', 'matched')").all() as any[];

    const matches = cargos.map(c => {
      const distance = haversineDistance(c.origin_lat, c.origin_lng, vehicle.current_lat, vehicle.current_lng);
      const distance_score = calcDistanceScore(distance);
      const capacity_score = calcCapacityScore(vehicle.load_capacity, c.weight);
      const temp_score = calcTempScore(vehicle.temperature_control, c.temperature_control);
      const route_score = calcRouteScore(vehicle.available_routes, c.origin_city, c.dest_city);
      const match_total = distance_score * 0.4 + capacity_score * 0.3 + temp_score * 0.2 + route_score * 0.1;

      return {
        cargo: c,
        matchDetails: {
          distance: Math.round(distance * 10) / 10,
          distance_score,
          capacity_score,
          temp_score,
          route_score,
        },
        match_total: Math.round(match_total * 10) / 10,
      };
    });

    matches.sort((a, b) => b.match_total - a.match_total);
    res.json(matches.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: '匹配货源失败' });
  }
});

export default router;
