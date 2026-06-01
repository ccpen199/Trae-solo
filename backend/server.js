const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const db = require('./db');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.BACKEND_PORT || '53443');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '43443');

const app = express();

const logDir = path.join(__dirname, '..');
const accessLogStream = fs.createWriteStream(path.join(logDir, 'backend.log'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('combined'));

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateAlarmNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const countStmt = db.prepare('SELECT COUNT(*) as cnt FROM alarms WHERE alarm_no LIKE ?');
  const prefix = `AL${year}${month}${day}`;
  const result = countStmt.get(`${prefix}%`);
  const seq = String(result.cnt + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

function generateDispatchNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const countStmt = db.prepare('SELECT COUNT(*) as cnt FROM dispatches WHERE dispatch_no LIKE ?');
  const prefix = `DP${year}${month}${day}`;
  const result = countStmt.get(`${prefix}%`);
  const seq = String(result.cnt + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

function addTimeline(alarmId, eventType, eventContent, operator = 'system') {
  const stmt = db.prepare(`
    INSERT INTO timelines (alarm_id, event_type, event_content, event_time, operator)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(alarmId, eventType, eventContent, new Date().toISOString(), operator);
}

app.get('/api/health', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 as ok').get();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: result.ok === 1 ? 'connected' : 'error'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/stations', (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM stations';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY id';
    const stations = db.prepare(sql).all(...params);
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stations/:id', (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    const vehicles = db.prepare('SELECT * FROM vehicles WHERE station_id = ?').all(req.params.id);
    const firefighters = db.prepare('SELECT * FROM firefighters WHERE station_id = ?').all(req.params.id);
    res.json({ ...station, vehicles, firefighters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles', (req, res) => {
  try {
    const { status, station_id, available } = req.query;
    let sql = `SELECT v.*, s.station_name as station_name 
               FROM vehicles v LEFT JOIN stations s ON v.station_id = s.id WHERE 1=1`;
    const params = [];
    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }
    if (station_id) {
      sql += ' AND v.station_id = ?';
      params.push(station_id);
    }
    if (available === 'true') {
      sql += " AND v.status = '待命'";
    }
    sql += ' ORDER BY v.id';
    const vehicles = db.prepare(sql).all(...params);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/firefighters', (req, res) => {
  try {
    const { status, station_id, available } = req.query;
    let sql = `SELECT f.*, s.station_name as station_name 
               FROM firefighters f LEFT JOIN stations s ON f.station_id = s.id WHERE 1=1`;
    const params = [];
    if (status) {
      sql += ' AND f.status = ?';
      params.push(status);
    }
    if (station_id) {
      sql += ' AND f.station_id = ?';
      params.push(station_id);
    }
    if (available === 'true') {
      sql += " AND f.status = '在岗'";
    }
    sql += ' ORDER BY f.id';
    const firefighters = db.prepare(sql).all(...params);
    res.json(firefighters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/key-locations', (req, res) => {
  try {
    const locations = db.prepare('SELECT * FROM key_locations ORDER BY risk_level DESC').all();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alarms', (req, res) => {
  try {
    const { status, start_date, end_date } = req.query;
    let page = parseInt(req.query.page) || 1;
    let page_size = parseInt(req.query.page_size) || 20;
    let sql = 'SELECT * FROM alarms WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as cnt FROM alarms WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }
    if (start_date) {
      sql += ' AND alarm_time >= ?';
      countSql += ' AND alarm_time >= ?';
      params.push(start_date);
      countParams.push(start_date);
    }
    if (end_date) {
      sql += ' AND alarm_time <= ?';
      countSql += ' AND alarm_time <= ?';
      params.push(end_date);
      countParams.push(end_date);
    }
    
    sql += ' ORDER BY alarm_time DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * page_size;
    params.push(parseInt(page_size), offset);
    
    const alarms = db.prepare(sql).all(...params);
    const { cnt } = db.prepare(countSql).get(...countParams);
    
    res.json({
      list: alarms,
      total: cnt,
      page: page,
      page_size: page_size,
      total_pages: Math.ceil(cnt / page_size)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alarms/:id', (req, res) => {
  try {
    const alarm = db.prepare('SELECT * FROM alarms WHERE id = ?').get(req.params.id);
    if (!alarm) return res.status(404).json({ error: 'Alarm not found' });
    
    const dispatches = db.prepare(`
      SELECT d.*, 
        GROUP_CONCAT(DISTINCT v.plate_no) as vehicles,
        GROUP_CONCAT(DISTINCT f.name) as firefighters
      FROM dispatches d
      LEFT JOIN dispatch_vehicles dv ON d.id = dv.dispatch_id
      LEFT JOIN vehicles v ON dv.vehicle_id = v.id
      LEFT JOIN dispatch_firefighters df ON d.id = df.dispatch_id
      LEFT JOIN firefighters f ON df.firefighter_id = f.id
      WHERE d.alarm_id = ?
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `).all(req.params.id);
    
    const updates = db.prepare('SELECT * FROM scene_updates WHERE alarm_id = ? ORDER BY report_time DESC').all(req.params.id);
    const timeline = db.prepare('SELECT * FROM timelines WHERE alarm_id = ? ORDER BY event_time ASC').all(req.params.id);
    
    res.json({ ...alarm, dispatches, updates, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alarms', (req, res) => {
  const { caller_name, caller_phone, location, lng, lat, disaster_type, disaster_level, people_trapped, building_type, hazardous_materials, recording_index, receiver, notes } = req.body;
  
  if (!location || !disaster_type) {
    return res.status(400).json({ error: '地点和灾种为必填项' });
  }
  
  const tx = db.transaction(() => {
    const alarm_no = generateAlarmNo();
    const alarm_time = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO alarms (alarm_no, caller_name, caller_phone, location, lng, lat, disaster_type, disaster_level, people_trapped, building_type, hazardous_materials, recording_index, alarm_time, receiver, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      alarm_no, caller_name, caller_phone, location, lng, lat, disaster_type, disaster_level || '一般',
      people_trapped || 0, building_type, hazardous_materials, recording_index, alarm_time, receiver, notes
    );
    
    addTimeline(result.lastInsertRowid, '接警', `接警员${receiver || '系统'}记录警情：${disaster_type}，地点：${location}`, receiver);
    
    return { id: result.lastInsertRowid, alarm_no };
  });
  
  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alarms/:id/recommend', (req, res) => {
  try {
    const alarm = db.prepare('SELECT * FROM alarms WHERE id = ?').get(req.params.id);
    if (!alarm) return res.status(404).json({ error: 'Alarm not found' });
    
    const { adjust_mode } = req.body;
    
    let availableVehicles = db.prepare(`
      SELECT v.*, s.station_name, s.lng as station_lng, s.lat as station_lat
      FROM vehicles v
      JOIN stations s ON v.station_id = s.id
      WHERE v.status = '待命' AND s.status = '在岗'
    `).all();
    
    if (alarm.lng && alarm.lat) {
      availableVehicles = availableVehicles.map(v => ({
        ...v,
        distance: haversine(alarm.lat, alarm.lng, v.station_lat, v.station_lng)
      })).sort((a, b) => a.distance - b.distance);
    }
    
    let vehicleCount = 2;
    let needSpecial = false;
    let recommendReason = `根据警情等级【${alarm.disaster_level}】和灾种【${alarm.disaster_type}】`;
    
    if (alarm.disaster_level === '重大' || alarm.people_trapped >= 3) {
      vehicleCount = 4;
      recommendReason += '，人员被困或重大警情，';
    } else if (alarm.disaster_level === '较大') {
      vehicleCount = 3;
    }
    
    if (alarm.disaster_type === '危化品火灾' || alarm.hazardous_materials) {
      needSpecial = true;
      recommendReason += '涉及危化品，需要泡沫车配合，';
    }
    if (alarm.building_type === '高层建筑') {
      needSpecial = true;
      recommendReason += '高层建筑需要云梯车配合，';
    }
    
    let recommended = [];
    let waterTank = availableVehicles.filter(v => v.vehicle_type === '水罐消防车');
    let foam = availableVehicles.filter(v => v.vehicle_type === '泡沫消防车');
    let ladder = availableVehicles.filter(v => v.vehicle_type === '云梯消防车');
    let rescue = availableVehicles.filter(v => v.vehicle_type === '抢险救援车');
    
    if (adjust_mode === 'nearest') {
      recommended = availableVehicles.slice(0, vehicleCount);
      recommendReason = '按最近距离优先调派';
    } else if (adjust_mode === 'force_up') {
      vehicleCount = Math.min(vehicleCount + 2, 8);
      recommended = [...waterTank.slice(0, vehicleCount)];
      recommendReason = '指挥员要求加强力量调派';
    } else {
      let wt = waterTank.slice(0, Math.max(2, vehicleCount - (needSpecial ? 2 : 0)));
      let sp = [];
      if (needSpecial) {
        if (alarm.disaster_type === '危化品火灾' && foam.length > 0) sp.push(foam[0]);
        if (alarm.building_type === '高层建筑' && ladder.length > 0) sp.push(ladder[0]);
        if (rescue.length > 0) sp.push(rescue[0]);
      }
      recommended = [...wt, ...sp].slice(0, vehicleCount + (needSpecial ? 1 : 0));
    }
    
    if (recommended.length === 0 && availableVehicles.length > 0) {
      recommended = availableVehicles.slice(0, Math.min(2, availableVehicles.length));
    }
    
    const vehicleIds = recommended.map(v => v.id);
    const stationIds = [...new Set(recommended.map(v => v.station_id))];
    
    const firefighters = db.prepare(`
      SELECT * FROM firefighters 
      WHERE station_id IN (${stationIds.map(() => '?').join(',')}) AND status = '在岗'
      ORDER BY rank = '中队长' DESC, rank = '指导员' DESC, rank = '班长' DESC
    `).all(...stationIds);
    
    const recommendedFirefighters = firefighters.slice(0, recommended.length * 4);
    
    recommendReason += `，共推荐${recommended.length}辆车，${recommendedFirefighters.length}名指战员。`;
    
    res.json({
      success: true,
      recommend_reason: recommendReason,
      vehicles: recommended,
      firefighters: recommendedFirefighters,
      available_vehicles: availableVehicles,
      available_firefighters: firefighters
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dispatches', (req, res) => {
  const { alarm_id, commander, recommend_reason, adjust_reason, vehicle_ids, firefighter_ids } = req.body;
  
  if (!alarm_id || !vehicle_ids || vehicle_ids.length === 0) {
    return res.status(400).json({ error: '警情ID和车辆为必填项' });
  }
  
  const tx = db.transaction(() => {
    const dispatch_no = generateDispatchNo();
    const dispatch_time = new Date().toISOString();
    const estimated_arrival_time = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO dispatches (dispatch_no, alarm_id, commander, recommend_reason, adjust_reason, dispatch_time, estimated_arrival_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(dispatch_no, alarm_id, commander, recommend_reason, adjust_reason, dispatch_time, estimated_arrival_time);
    const dispatchId = result.lastInsertRowid;
    
    const vehicleStmt = db.prepare(`
      INSERT INTO dispatch_vehicles (dispatch_id, vehicle_id, departure_time)
      VALUES (?, ?, ?)
    `);
    
    vehicle_ids.forEach(vid => {
      vehicleStmt.run(dispatchId, vid, dispatch_time);
      db.prepare("UPDATE vehicles SET status = '出警中' WHERE id = ?").run(vid);
    });
    
    if (firefighter_ids && firefighter_ids.length > 0) {
      const ffStmt = db.prepare(`
        INSERT INTO dispatch_firefighters (dispatch_id, firefighter_id, role)
        VALUES (?, ?, ?)
      `);
      
      firefighter_ids.forEach((fid, idx) => {
        const role = idx === 0 ? '指挥员' : idx === 1 ? '副指挥员' : '战斗员';
        ffStmt.run(dispatchId, fid, role);
        db.prepare("UPDATE firefighters SET status = '出警中' WHERE id = ?").run(fid);
      });
    }
    
    db.prepare("UPDATE alarms SET status = '处置中', updated_at = ? WHERE id = ?").run(new Date().toISOString(), alarm_id);
    
    addTimeline(alarm_id, '派警', `已派警：${vehicle_ids.length}辆车出动，指挥员：${commander || '未指定'}`, commander);
    
    return { id: dispatchId, dispatch_no };
  });
  
  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dispatches', (req, res) => {
  try {
    const { status, alarm_id } = req.query;
    let sql = `
      SELECT d.*, a.alarm_no, a.location, a.disaster_type,
        GROUP_CONCAT(DISTINCT v.plate_no) as vehicle_plates,
        GROUP_CONCAT(DISTINCT v.vehicle_type) as vehicle_types,
        GROUP_CONCAT(DISTINCT f.name) as firefighter_names
      FROM dispatches d
      JOIN alarms a ON d.alarm_id = a.id
      LEFT JOIN dispatch_vehicles dv ON d.id = dv.dispatch_id
      LEFT JOIN vehicles v ON dv.vehicle_id = v.id
      LEFT JOIN dispatch_firefighters df ON d.id = df.dispatch_id
      LEFT JOIN firefighters f ON df.firefighter_id = f.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }
    if (alarm_id) {
      sql += ' AND d.alarm_id = ?';
      params.push(alarm_id);
    }
    sql += ' GROUP BY d.id ORDER BY d.dispatch_time DESC';
    
    const dispatches = db.prepare(sql).all(...params);
    res.json(dispatches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dispatches/:id', (req, res) => {
  try {
    const dispatch = db.prepare(`
      SELECT d.*, a.alarm_no, a.location, a.disaster_type, a.disaster_level
      FROM dispatches d JOIN alarms a ON d.alarm_id = a.id
      WHERE d.id = ?
    `).get(req.params.id);
    
    if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });
    
    const vehicles = db.prepare(`
      SELECT v.*, dv.departure_time, dv.arrival_time, dv.return_time
      FROM dispatch_vehicles dv JOIN vehicles v ON dv.vehicle_id = v.id
      WHERE dv.dispatch_id = ?
    `).all(req.params.id);
    
    const firefighters = db.prepare(`
      SELECT f.*, df.role
      FROM dispatch_firefighters df JOIN firefighters f ON df.firefighter_id = f.id
      WHERE df.dispatch_id = ?
    `).all(req.params.id);
    
    res.json({ ...dispatch, vehicles, firefighters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dispatches/:id/arrive', (req, res) => {
  const { arrival_time, reporter } = req.body;
  const dispatchId = req.params.id;
  
  try {
    const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(dispatchId);
    if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });
    
    const actualArrival = arrival_time || new Date().toISOString();
    
    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE dispatches 
        SET actual_arrival_time = ?, route_status = '已到场', updated_at = ?
        WHERE id = ?
      `).run(actualArrival, new Date().toISOString(), dispatchId);
      
      db.prepare(`
        UPDATE dispatch_vehicles SET arrival_time = ? WHERE dispatch_id = ?
      `).run(actualArrival, dispatchId);
      
      addTimeline(dispatch.alarm_id, '到场', `力量已到达现场`, reporter);
    });
    
    tx();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dispatches/:id/timeout', (req, res) => {
  const { reporter } = req.body;
  const dispatchId = req.params.id;
  
  try {
    const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(dispatchId);
    if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });
    
    db.prepare(`
      UPDATE dispatches SET timeout_reminded = timeout_reminded + 1, updated_at = ? WHERE id = ?
    `).run(new Date().toISOString(), dispatchId);
    
    addTimeline(dispatch.alarm_id, '超时提醒', `派警${dispatch.dispatch_no}出动超时，已提醒${dispatch.timeout_reminded + 1}次`, reporter);
    
    res.json({ success: true, reminded: dispatch.timeout_reminded + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scene-updates', (req, res) => {
  const { alarm_id, dispatch_id, update_type, fire_intensity, rescue_progress, reinforcement_request, casualties, reporter, notes } = req.body;
  
  if (!alarm_id || !update_type) {
    return res.status(400).json({ error: '警情ID和更新类型为必填项' });
  }
  
  const tx = db.transaction(() => {
    const report_time = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO scene_updates (alarm_id, dispatch_id, update_type, fire_intensity, rescue_progress, reinforcement_request, casualties, report_time, reporter, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      alarm_id, 
      dispatch_id ?? null, 
      update_type, 
      fire_intensity ?? null, 
      rescue_progress ?? null, 
      reinforcement_request ?? null, 
      casualties ?? null, 
      report_time, 
      reporter ?? null, 
      notes ?? null
    );
    
    let eventContent = '';
    switch (update_type) {
      case '火势报告':
        eventContent = `火势报告：${fire_intensity || '未说明'}，${rescue_progress || ''}`;
        break;
      case '救援进展':
        eventContent = `救援进展：${rescue_progress || '无详细描述'}`;
        break;
      case '增援请求':
        eventContent = `增援请求：${reinforcement_request || '需要增援'}`;
        break;
      case '伤亡报告':
        eventContent = `伤亡报告：${casualties || '无伤亡'}`;
        break;
      case '处置结束':
        eventContent = `处置结束：${notes || '现场处置完毕'}`;
        db.prepare("UPDATE alarms SET status = '已结束', updated_at = ? WHERE id = ?").run(report_time, alarm_id);
        if (dispatch_id) {
          db.prepare("UPDATE dispatches SET status = '已结束', updated_at = ? WHERE id = ?").run(report_time, dispatch_id);
        }
        break;
      default:
        eventContent = `${update_type}：${notes || '无详细描述'}`;
    }
    
    addTimeline(alarm_id, update_type, eventContent, reporter);
    
    return { id: result.lastInsertRowid };
  });
  
  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scene-updates', (req, res) => {
  try {
    const { alarm_id, dispatch_id } = req.query;
    let sql = 'SELECT * FROM scene_updates WHERE 1=1';
    const params = [];
    if (alarm_id) {
      sql += ' AND alarm_id = ?';
      params.push(alarm_id);
    }
    if (dispatch_id) {
      sql += ' AND dispatch_id = ?';
      params.push(dispatch_id);
    }
    sql += ' ORDER BY report_time DESC';
    const updates = db.prepare(sql).all(...params);
    res.json(updates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alarms/:id/false-alarm', (req, res) => {
  const { reason, confirmed_by } = req.body;
  const alarmId = req.params.id;
  
  if (!reason) {
    return res.status(400).json({ error: '误报原因必填' });
  }
  
  const tx = db.transaction(() => {
    const confirmed_at = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO false_alarms (alarm_id, reason, confirmed_by, confirmed_at)
      VALUES (?, ?, ?, ?)
    `).run(alarmId, reason, confirmed_by, confirmed_at);
    
    db.prepare("UPDATE alarms SET status = '误报', updated_at = ? WHERE id = ?").run(confirmed_at, alarmId);
    
    addTimeline(alarmId, '误报确认', `确认为误报，原因：${reason}`, confirmed_by);
  });
  
  try {
    tx();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/summary', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const params = [];
    let dateFilter = '';
    
    if (start_date) {
      dateFilter += ' AND alarm_time >= ?';
      params.push(start_date);
    }
    if (end_date) {
      dateFilter += ' AND alarm_time <= ?';
      params.push(end_date);
    }
    
    const totalAlarms = db.prepare(`SELECT COUNT(*) as cnt FROM alarms WHERE 1=1 ${dateFilter}`).get(...params).cnt;
    const falseAlarms = db.prepare(`SELECT COUNT(*) as cnt FROM alarms WHERE status = '误报' ${dateFilter}`).get(...params).cnt;
    const completedAlarms = db.prepare(`SELECT COUNT(*) as cnt FROM alarms WHERE status = '已结束' ${dateFilter}`).get(...params).cnt;
    const activeAlarms = db.prepare(`SELECT COUNT(*) as cnt FROM alarms WHERE status IN ('待研判','处置中') ${dateFilter}`).get(...params).cnt;
    
    const byDisaster = db.prepare(`
      SELECT disaster_type, COUNT(*) as cnt, AVG(people_trapped) as avg_trapped
      FROM alarms WHERE 1=1 ${dateFilter}
      GROUP BY disaster_type ORDER BY cnt DESC
    `).all(...params);
    
    const byLevel = db.prepare(`
      SELECT disaster_level, COUNT(*) as cnt
      FROM alarms WHERE 1=1 ${dateFilter}
      GROUP BY disaster_level ORDER BY cnt DESC
    `).all(...params);
    
    const avgResponse = db.prepare(`
      SELECT AVG(julianday(d.dispatch_time) - julianday(a.alarm_time)) * 24 * 60 as avg_minutes
      FROM dispatches d JOIN alarms a ON d.alarm_id = a.id
      WHERE d.dispatch_time IS NOT NULL ${dateFilter.replace('alarm_time', 'd.dispatch_time')}
    `).get(...params).avg_minutes;
    
    const avgArrival = db.prepare(`
      SELECT AVG(julianday(d.actual_arrival_time) - julianday(d.dispatch_time)) * 24 * 60 as avg_minutes
      FROM dispatches d 
      WHERE d.actual_arrival_time IS NOT NULL ${dateFilter.replace('alarm_time', 'd.dispatch_time')}
    `).get(...params).avg_minutes;
    
    const byStation = db.prepare(`
      SELECT s.station_name, COUNT(DISTINCT d.id) as dispatch_count,
        COUNT(DISTINCT dv.vehicle_id) as vehicle_count
      FROM stations s
      LEFT JOIN vehicles v ON s.id = v.station_id
      LEFT JOIN dispatch_vehicles dv ON v.id = dv.vehicle_id
      LEFT JOIN dispatches d ON dv.dispatch_id = d.id
      WHERE 1=1 ${dateFilter.replace('alarm_time', 'd.dispatch_time')}
      GROUP BY s.id ORDER BY dispatch_count DESC
    `).all(...params);
    
    const highRiskLocations = db.prepare(`
      SELECT kl.*, COUNT(a.id) as alarm_count
      FROM key_locations kl
      LEFT JOIN alarms a ON a.location LIKE '%' || kl.location_name || '%' ${dateFilter}
      GROUP BY kl.id
      ORDER BY 
        CASE risk_level 
          WHEN '极高' THEN 1 
          WHEN '高' THEN 2 
          WHEN '中' THEN 3 
          ELSE 4 
        END,
        alarm_count DESC
    `).all(...params);
    
    res.json({
      total_alarms: totalAlarms,
      false_alarms: falseAlarms,
      false_alarm_rate: totalAlarms > 0 ? (falseAlarms / totalAlarms * 100).toFixed(1) + '%' : '0%',
      completed_alarms: completedAlarms,
      active_alarms: activeAlarms,
      avg_response_minutes: avgResponse ? avgResponse.toFixed(1) : null,
      avg_arrival_minutes: avgArrival ? avgArrival.toFixed(1) : null,
      by_disaster: byDisaster,
      by_level: byLevel,
      by_station: byStation,
      high_risk_locations: highRiskLocations
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/timeline/:alarmId', (req, res) => {
  try {
    const timeline = db.prepare(`
      SELECT * FROM timelines WHERE alarm_id = ? ORDER BY event_time ASC
    `).all(req.params.alarmId);
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'API not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`Fire Dispatch Backend running on http://${HOST}:${PORT}`);
  console.log(`API Base: http://${HOST}:${PORT}/api`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});
