import express from 'express';
import { db } from '../database.js';

const router = express.Router();

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const validateRoute = (routeResources, resources) => {
  const issues = [];
  
  const sortedByDay = {};
  routeResources.forEach(rr => {
    if (!sortedByDay[rr.day_number]) sortedByDay[rr.day_number] = [];
    sortedByDay[rr.day_number].push({ ...rr, resource: resources.find(r => r.id === rr.resource_id) });
  });
  
  Object.keys(sortedByDay).forEach(day => {
    const dayResources = sortedByDay[day].sort((a, b) => a.order_in_day - b.order_in_day);
    
    for (let i = 0; i < dayResources.length - 1; i++) {
      const curr = dayResources[i];
      const next = dayResources[i + 1];
      
      if (curr.resource && next.resource && curr.resource.latitude && next.resource.latitude) {
        const distance = calculateDistance(
          curr.resource.latitude, curr.resource.longitude,
          next.resource.latitude, next.resource.longitude
        );
        if (distance > 100) {
          issues.push(`第${day}天：「${curr.resource.name}」到「${next.resource.name}」距离过远 (${distance.toFixed(1)}km)`);
        }
      }
      
      if (curr.end_time && next.start_time) {
        const endMin = parseInt(curr.end_time.split(':')[0]) * 60 + parseInt(curr.end_time.split(':')[1]);
        const startMin = parseInt(next.start_time.split(':')[0]) * 60 + parseInt(next.start_time.split(':')[1]);
        if (startMin < endMin) {
          issues.push(`第${day}天：「${curr.resource?.name || '活动'}」与「${next.resource?.name || '活动'}」时间冲突`);
        }
      }
    }
  });
  
  routeResources.forEach(rr => {
    const resource = resources.find(r => r.id === rr.resource_id);
    if (resource) {
      if (resource.is_closed) {
        issues.push(`资源「${resource.name}」已停业`);
      }
      if (resource.supplier_status === 'inactive') {
        issues.push(`资源「${resource.name}」的供应商已下架`);
      }
      if (resource.stock <= 0) {
        issues.push(`资源「${resource.name}」库存不足`);
      }
    }
  });
  
  return issues;
};

router.get('/', (req, res) => {
  const routes = db.prepare('SELECT * FROM routes ORDER BY created_at DESC').all();
  res.json(routes);
});

router.get('/:id', (req, res) => {
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  
  const routeResources = db.prepare(`
    SELECT rr.*, r.name as resource_name, r.type as resource_type, r.price, r.is_closed, r.stock,
           s.name as supplier_name, s.status as supplier_status
    FROM route_resources rr
    JOIN resources r ON rr.resource_id = r.id
    LEFT JOIN suppliers s ON r.supplier_id = s.id
    WHERE rr.route_id = ?
    ORDER BY rr.day_number, rr.order_in_day
  `).all(req.params.id);
  
  res.json({ ...route, resources: routeResources });
});

router.post('/', (req, res) => {
  const { name, description, duration_days, created_by } = req.body;
  
  const result = db.prepare(`
    INSERT INTO routes (name, description, duration_days, created_by)
    VALUES (?, ?, ?, ?)
  `).run(name, description, duration_days, created_by || 'system');
  
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...route, resources: [] });
});

router.post('/:id/resources', (req, res) => {
  const { resource_id, day_number, order_in_day, start_time, end_time } = req.body;
  
  db.prepare(`
    INSERT INTO route_resources (route_id, resource_id, day_number, order_in_day, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, resource_id, day_number, order_in_day, start_time, end_time);
  
  const routeResources = db.prepare(`
    SELECT rr.*, r.name as resource_name, r.type as resource_type
    FROM route_resources rr
    JOIN resources r ON rr.resource_id = r.id
    WHERE rr.route_id = ?
    ORDER BY rr.day_number, rr.order_in_day
  `).all(req.params.id);
  
  res.json(routeResources);
});

router.delete('/:id/resources/:resourceId', (req, res) => {
  db.prepare(`
    DELETE FROM route_resources 
    WHERE route_id = ? AND id = ?
  `).run(req.params.id, req.params.resourceId);
  
  res.json({ success: true });
});

router.get('/:id/validate', (req, res) => {
  const routeResources = db.prepare(`
    SELECT * FROM route_resources WHERE route_id = ?
  `).all(req.params.id);
  
  const resourceIds = routeResources.map(rr => rr.resource_id);
  const resources = db.prepare(`
    SELECT r.*, s.status as supplier_status
    FROM resources r
    LEFT JOIN suppliers s ON r.supplier_id = s.id
    WHERE r.id IN (${resourceIds.map(() => '?').join(',')})
  `).all(...resourceIds);
  
  const issues = validateRoute(routeResources, resources);
  res.json({ valid: issues.length === 0, issues });
});

router.put('/:id', (req, res) => {
  const { name, description, duration_days, status } = req.body;
  
  db.prepare(`
    UPDATE routes 
    SET name = ?, description = ?, duration_days = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, duration_days, status || 'draft', req.params.id);
  
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);
  const routeResources = db.prepare(`
    SELECT rr.*, r.name as resource_name, r.type as resource_type
    FROM route_resources rr
    JOIN resources r ON rr.resource_id = r.id
    WHERE rr.route_id = ?
    ORDER BY rr.day_number, rr.order_in_day
  `).all(req.params.id);
  
  res.json({ ...route, resources: routeResources });
});

router.delete('/:id', (req, res) => {
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  
  db.prepare('DELETE FROM routes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
