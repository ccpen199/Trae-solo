const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const trains = db.prepare(`
    SELECT t.*, r.route_name 
    FROM trains t 
    LEFT JOIN routes r ON t.route_id = r.id 
    ORDER BY t.train_no
  `).all();
  res.json(trains);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const train = db.prepare(`
    SELECT t.*, r.route_name 
    FROM trains t 
    LEFT JOIN routes r ON t.route_id = r.id 
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!train) {
    return res.status(404).json({ error: '车次不存在' });
  }
  
  const requirements = db.prepare('SELECT * FROM position_requirements WHERE train_id = ?').all(req.params.id);
  res.json({ ...train, requirements });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { train_no, route_id, departure_station, arrival_station, departure_time, arrival_time, duration_minutes, train_type, marshalling } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO trains (train_no, route_id, departure_station, arrival_station, departure_time, arrival_time, duration_minutes, train_type, marshalling)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(train_no, route_id, departure_station, arrival_station, departure_time, arrival_time, duration_minutes, train_type, marshalling);
    
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { train_no, route_id, departure_station, arrival_station, departure_time, arrival_time, duration_minutes, train_type, marshalling } = req.body;
  
  const result = db.prepare(`
    UPDATE trains 
    SET train_no=?, route_id=?, departure_station=?, arrival_station=?, departure_time=?, arrival_time=?, duration_minutes=?, train_type=?, marshalling=?
    WHERE id=?
  `).run(train_no, route_id, departure_station, arrival_station, departure_time, arrival_time, duration_minutes, train_type, marshalling, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '车次不存在' });
  }
  
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM trains WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '车次不存在' });
  }
  
  res.json({ success: true });
});

router.post('/:id/requirements', (req, res) => {
  const db = getDb();
  const { position, count, qualification_required } = req.body;
  
  const result = db.prepare(`
    INSERT INTO position_requirements (train_id, position, count, qualification_required)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, position, count || 1, qualification_required);
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.delete('/requirements/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM position_requirements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/routes/list', (req, res) => {
  const db = getDb();
  const routes = db.prepare('SELECT * FROM routes ORDER BY route_no').all();
  res.json(routes);
});

router.post('/routes', (req, res) => {
  const db = getDb();
  const { route_no, route_name } = req.body;
  
  try {
    const result = db.prepare('INSERT INTO routes (route_no, route_name) VALUES (?, ?)').run(route_no, route_name);
    res.json({ id: result.lastInsertRowid, route_no, route_name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
