const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/routes', (req, res) => {
  const { type, keyword } = req.query;
  
  let sql = 'SELECT * FROM routes WHERE status = 1';
  const params = [];
  
  if (type) {
    sql += ' AND transport_type = ?';
    params.push(type);
  }
  
  if (keyword) {
    sql += ' AND (route_name LIKE ? OR start_station LIKE ? OR end_station LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  
  sql += ' ORDER BY transport_type, route_no';
  
  const routes = db.prepare(sql).all(...params).map(r => ({
    ...r,
    stations: JSON.parse(r.stations || '[]'),
    crowding_data: JSON.parse(r.crowding_data || '{}')
  }));
  
  res.success(routes, '获取成功');
});

router.get('/routes/:id', (req, res) => {
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);
  
  if (!route) {
    return res.error('线路不存在', 404);
  }
  
  route.stations = JSON.parse(route.stations || '[]');
  route.crowding_data = JSON.parse(route.crowding_data || '{}');
  
  const now = new Date();
  const currentHour = `${now.getHours()}:00`;
  route.current_crowding = route.crowding_data[currentHour] || 0;
  
  res.success(route, '获取成功');
});

router.get('/route-planning', (req, res) => {
  const { start, end, transport_type } = req.query;
  
  if (!start || !end) {
    return res.error('起点和终点不能为空', 400);
  }
  
  const routes = db.prepare('SELECT * FROM routes WHERE status = 1').all().map(r => ({
    ...r,
    stations: JSON.parse(r.stations || '[]'),
    crowding_data: JSON.parse(r.crowding_data || '{}')
  }));
  
  function findPath(startStation, endStation) {
    const allRoutes = routes;
    const directRoutes = allRoutes.filter(r => 
      r.stations.includes(startStation) && r.stations.includes(endStation)
    );
    
    if (directRoutes.length > 0) {
      return directRoutes.map(r => {
        const startIdx = r.stations.indexOf(startStation);
        const endIdx = r.stations.indexOf(endStation);
        const stations = startIdx < endIdx 
          ? r.stations.slice(startIdx, endIdx + 1)
          : r.stations.slice(endIdx, startIdx + 1).reverse();
        const now = new Date();
        const currentHour = `${now.getHours()}:00`;
        return {
          type: 'direct',
          route: r,
          stations,
          duration: stations.length * 3,
          transfers: 0,
          fare: r.fare,
          crowding: r.crowding_data[currentHour] || 0,
          description: `乘坐 ${r.route_name}，从 ${startStation} 到 ${endStation}，共 ${stations.length} 站`
        };
      });
    }
    
    const results = [];
    for (const r1 of allRoutes) {
      if (!r1.stations.includes(startStation)) continue;
      for (const r2 of allRoutes) {
        if (r1.id === r2.id) continue;
        if (!r2.stations.includes(endStation)) continue;
        
        const transfers = r1.stations.filter(s => r2.stations.includes(s));
        if (transfers.length > 0) {
          const transferStation = transfers[0];
          const startIdx1 = r1.stations.indexOf(startStation);
          const endIdx1 = r1.stations.indexOf(transferStation);
          const startIdx2 = r2.stations.indexOf(transferStation);
          const endIdx2 = r2.stations.indexOf(endStation);
          
          const stations1 = startIdx1 < endIdx1
            ? r1.stations.slice(startIdx1, endIdx1 + 1)
            : r1.stations.slice(endIdx1, startIdx1 + 1).reverse();
          const stations2 = startIdx2 < endIdx2
            ? r2.stations.slice(startIdx2, endIdx2 + 1)
            : r2.stations.slice(endIdx2, startIdx2 + 1).reverse();
          
          const now = new Date();
          const currentHour = `${now.getHours()}:00`;
          results.push({
            type: 'transfer',
            routes: [r1, r2],
            transfer_station: transferStation,
            stations: [...stations1, ...stations2.slice(1)],
            duration: (stations1.length + stations2.length) * 3 + 5,
            transfers: 1,
            fare: r1.fare + r2.fare,
            crowding: Math.max(r1.crowding_data[currentHour] || 0, r2.crowding_data[currentHour] || 0),
            description: `乘坐 ${r1.route_name} 到 ${transferStation}，换乘 ${r2.route_name} 到 ${endStation}，共 ${stations1.length + stations2.length - 1} 站`
          });
        }
      }
    }
    
    return results.slice(0, 3);
  }
  
  const plans = findPath(start, end);
  
  plans.sort((a, b) => {
    if (a.transfers !== b.transfers) return a.transfers - b.transfers;
    if (a.duration !== b.duration) return a.duration - b.duration;
    return a.crowding - b.crowding;
  });
  
  res.success({
    start,
    end,
    plans: plans.slice(0, 3),
    timestamp: Date.now()
  }, '规划成功');
});

router.get('/parking-lots', (req, res) => {
  const { station, is_pr } = req.query;
  
  let sql = 'SELECT * FROM parking_lots WHERE status = 1';
  const params = [];
  
  if (station) {
    sql += ' AND station_nearby LIKE ?';
    params.push(`%${station}%`);
  }
  
  if (is_pr !== undefined) {
    sql += ' AND is_pr = ?';
    params.push(is_pr ? 1 : 0);
  }
  
  sql += ' ORDER BY available_spaces DESC';
  
  const lots = db.prepare(sql).all(...params);
  
  res.success(lots, '获取成功');
});

router.get('/parking-lots/:id', (req, res) => {
  const lot = db.prepare('SELECT * FROM parking_lots WHERE id = ?').get(req.params.id);
  
  if (!lot) {
    return res.error('停车场不存在', 404);
  }
  
  res.success(lot, '获取成功');
});

router.post('/parking-lots/:id/update-spaces', (req, res) => {
  const { available_spaces } = req.body;
  
  db.prepare('UPDATE parking_lots SET available_spaces = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(available_spaces, req.params.id);
  
  res.success(null, '更新成功');
});

router.get('/intercity-buses', (req, res) => {
  const { origin, destination, date } = req.query;
  
  let sql = 'SELECT * FROM intercity_buses WHERE status = 1';
  const params = [];
  
  if (origin) {
    sql += ' AND origin LIKE ?';
    params.push(`%${origin}%`);
  }
  
  if (destination) {
    sql += ' AND destination LIKE ?';
    params.push(`%${destination}%`);
  }
  
  sql += ' ORDER BY departure_time';
  
  const buses = db.prepare(sql).all(...params);
  
  res.success(buses, '获取成功');
});

router.post('/intercity-buses/book', authenticateToken, (req, res) => {
  const { bus_route_id, passenger_name, passenger_id } = req.body;
  
  if (!bus_route_id || !passenger_name || !passenger_id) {
    return res.error('参数不完整', 400);
  }
  
  const bus = db.prepare('SELECT * FROM intercity_buses WHERE id = ?').get(bus_route_id);
  
  if (!bus) {
    return res.error('班次不存在', 404);
  }
  
  if (bus.available_seats <= 0) {
    return res.error('余票不足', 400);
  }
  
  const ticketNo = 'TK' + Date.now().toString() + Math.floor(Math.random() * 1000);
  const seatNo = (bus.total_seats - bus.available_seats + 1).toString();
  
  db.prepare('BEGIN TRANSACTION');
  
  try {
    db.prepare(`
      INSERT INTO bus_tickets (ticket_no, user_id, bus_route_id, passenger_name, passenger_id, seat_no, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(ticketNo, req.user.id, bus_route_id, passenger_name, passenger_id, seatNo, bus.price);
    
    db.prepare('UPDATE intercity_buses SET available_seats = available_seats - 1 WHERE id = ?')
      .run(bus_route_id);
    
    db.prepare('COMMIT');
    
    res.success({
      ticket_no: ticketNo,
      seat_no: seatNo,
      price: bus.price,
      bus_info: bus
    }, '购票成功');
  } catch (e) {
    db.prepare('ROLLBACK');
    return res.error('购票失败: ' + e.message, 500);
  }
});

router.get('/my-tickets', authenticateToken, (req, res) => {
  const tickets = db.prepare(`
    SELECT bt.*, ib.origin, ib.destination, ib.departure_time, ib.arrival_time
    FROM bus_tickets bt
    LEFT JOIN intercity_buses ib ON bt.bus_route_id = ib.id
    WHERE bt.user_id = ?
    ORDER BY bt.created_at DESC
  `).all(req.user.id);
  
  res.success(tickets, '获取成功');
});

router.get('/crowding-prediction/:routeId', (req, res) => {
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);
  
  if (!route) {
    return res.error('线路不存在', 404);
  }
  
  const crowdingData = JSON.parse(route.crowding_data || '{}');
  
  const prediction = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const hour = `${(now.getHours() + i) % 24}:00`;
    const baseValue = crowdingData[hour] || Math.floor(Math.random() * 60);
    const variance = Math.floor(Math.random() * 20) - 10;
    prediction.push({
      time: hour,
      crowding: Math.max(0, Math.min(100, baseValue + variance)),
      level: baseValue < 30 ? '舒适' : baseValue < 60 ? '适中' : '拥挤'
    });
  }
  
  res.success({
    route_id: req.params.id,
    route_name: route.route_name,
    prediction,
    current_crowding: prediction[0].crowding
  }, '获取成功');
});

module.exports = router;
