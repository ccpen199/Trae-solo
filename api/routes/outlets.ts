import { Router } from 'express';
import db from '../db';
import type { Outlet } from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const { city, serviceTag, openNow, lng, lat, radius = 5000 } = req.query;
  let sql = 'SELECT * FROM outlets WHERE 1=1';
  const params: any[] = [];

  if (city) {
    sql += ' AND address LIKE ?';
    params.push(`%${city}%`);
  }
  if (serviceTag) {
    sql += ' AND service_tags LIKE ?';
    params.push(`%${serviceTag}%`);
  }

  let outlets = db.prepare(sql).all(...params) as any[];

  if (lng && lat) {
    const lngNum = Number(lng);
    const latNum = Number(lat);
    const radiusKm = Number(radius) / 1000;
    outlets = outlets.filter((o) => {
      const R = 6371;
      const dLat = ((o.lat - latNum) * Math.PI) / 180;
      const dLng = ((o.lng - lngNum) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latNum * Math.PI) / 180) * Math.cos((o.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= radiusKm;
    });
  }

  const result: Outlet[] = outlets.map((o) => ({
    id: o.id,
    name: o.name,
    address: o.address,
    lng: o.lng,
    lat: o.lat,
    phone: o.phone,
    businessHours: o.business_hours,
    serviceTags: o.service_tags ? o.service_tags.split(',') : [],
    avgResponseTime: o.avg_response_time,
    complaintRate: o.complaint_rate,
    onTimeRate: o.on_time_rate,
    rating: o.rating,
  }));
  res.json(result);
});

router.get('/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM outlets WHERE id = ?').get(req.params.id) as any;
  if (!o) {
    return res.status(404).json({ error: '网点不存在' });
  }
  const outlet: Outlet = {
    id: o.id,
    name: o.name,
    address: o.address,
    lng: o.lng,
    lat: o.lat,
    phone: o.phone,
    businessHours: o.business_hours,
    serviceTags: o.service_tags ? o.service_tags.split(',') : [],
    avgResponseTime: o.avg_response_time,
    complaintRate: o.complaint_rate,
    onTimeRate: o.on_time_rate,
    rating: o.rating,
  };
  const servedOrders = db.prepare('SELECT COUNT(*) as cnt FROM waybills WHERE outlet_id = ?').get(o.id) as { cnt: number };
  res.json({ ...outlet, servedOrders: servedOrders.cnt });
});

export default router;
