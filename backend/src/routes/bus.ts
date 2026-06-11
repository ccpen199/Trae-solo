import { Router } from 'express';
import db from '../database.js';
import { successResponse, errorResponse, paginate } from '../utils/common.js';

const router = Router();

router.get('/routes', (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query as any;

  let sql = 'SELECT * FROM bus_routes WHERE status = 1';
  const params: any[] = [];

  if (keyword) {
    sql += ' AND (route_no LIKE ? OR route_name LIKE ? OR start_station LIKE ? OR end_station LIKE ?)';
    const keywordParam = `%${keyword}%`;
    params.push(keywordParam, keywordParam, keywordParam, keywordParam);
  }

  sql += ' ORDER BY route_no ASC';

  const routes = db.prepare(sql).all(...params);
  
  const result = paginate(routes.map((r: any) => ({
    ...r,
    stations: r.stations ? JSON.parse(r.stations) : []
  })), parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/routes/:id', (req, res) => {
  const { id } = req.params;

  const route: any = db.prepare(
    'SELECT * FROM bus_routes WHERE id = ? AND status = 1'
  ).get(id);

  if (!route) {
    return errorResponse(res, '线路不存在', 404);
  }

  if (route.stations) {
    route.stations = JSON.parse(route.stations);
  }

  return successResponse(res, route);
});

router.get('/routes/no/:route_no', (req, res) => {
  const { route_no } = req.params;

  const route: any = db.prepare(
    'SELECT * FROM bus_routes WHERE route_no = ? AND status = 1'
  ).get(route_no);

  if (!route) {
    return errorResponse(res, '线路不存在', 404);
  }

  if (route.stations) {
    route.stations = JSON.parse(route.stations);
  }

  return successResponse(res, route);
});

router.get('/realtime/:route_id', (req, res) => {
  const { route_id } = req.params;
  const { limit = 5 } = req.query as any;

  const route = db.prepare('SELECT * FROM bus_routes WHERE id = ? AND status = 1').get(route_id);
  if (!route) {
    return errorResponse(res, '线路不存在', 404);
  }

  const realtimeData = db.prepare(
    `SELECT br.*, brt.plate_no, brt.current_station, brt.next_station, 
            brt.latitude, brt.longitude, brt.passenger_count, brt.speed, brt.timestamp
     FROM bus_routes br
     LEFT JOIN bus_realtime brt ON br.id = brt.route_id
     WHERE br.id = ?
     ORDER BY brt.timestamp DESC
     LIMIT ?`
  ).all(route_id, parseInt(limit));

  const stations = (route as any).stations ? JSON.parse((route as any).stations) : [];
  
  const result = {
    route_id: route.id,
    route_no: (route as any).route_no,
    route_name: (route as any).route_name,
    stations,
    buses: realtimeData.map((bus: any) => ({
      plate_no: bus.plate_no,
      current_station: bus.current_station,
      current_station_name: stations[bus.current_station]?.name || '未知站点',
      next_station: bus.next_station,
      next_station_name: stations[bus.next_station]?.name || '未知站点',
      latitude: bus.latitude,
      longitude: bus.longitude,
      passenger_count: bus.passenger_count,
      speed: bus.speed,
      timestamp: bus.timestamp,
      estimated_arrival: bus.current_station !== null && bus.next_station !== null 
        ? Math.round(Math.abs(bus.next_station - bus.current_station) * 3 + Math.random() * 2)
        : null
    }))
  };

  return successResponse(res, result);
});

router.get('/realtime/nearby', (req, res) => {
  const { latitude, longitude, radius = 1000 } = req.query as any;

  if (!latitude || !longitude) {
    return errorResponse(res, '经纬度参数不能为空');
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const r = parseFloat(radius) / 1000;

  const haversine = `(
    6371 * acos(
      cos(radians(?)) * cos(radians(brt.latitude)) *
      cos(radians(brt.longitude) - radians(?)) +
      sin(radians(?)) * sin(radians(brt.latitude))
    )
  )`;

  const nearbyBuses = db.prepare(
    `SELECT br.route_no, br.route_name, brt.*, ${haversine} as distance
     FROM bus_realtime brt
     LEFT JOIN bus_routes br ON brt.route_id = br.id
     WHERE ${haversine} < ?
     ORDER BY distance ASC
     LIMIT 20`
  ).all(lat, lng, lat, lat, lng, r);

  return successResponse(res, {
    center: { latitude, longitude },
    radius: r * 1000,
    buses: nearbyBuses
  });
});

router.get('/station/search', (req, res) => {
  const { keyword } = req.query as any;

  if (!keyword) {
    return errorResponse(res, '搜索关键词不能为空');
  }

  const routes = db.prepare('SELECT * FROM bus_routes WHERE status = 1').all();
  
  const matchingStations: any[] = [];
  
  routes.forEach((route: any) => {
    if (!route.stations) return;
    
    const stations = JSON.parse(route.stations);
    stations.forEach((station: any, index: number) => {
      if (station.name.includes(keyword)) {
        matchingStations.push({
          station_name: station.name,
          station_index: index,
          route_id: route.id,
          route_no: route.route_no,
          route_name: route.route_name,
          latitude: station.latitude,
          longitude: station.longitude
        });
      }
    });
  });

  return successResponse(res, matchingStations);
});

export default router;
