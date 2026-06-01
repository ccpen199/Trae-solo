import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import db from './database.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 53422;

app.use(cors({
  origin: ['http://127.0.0.1:43422', 'http://localhost:43422'],
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stores', (req, res) => {
  const stores = db.prepare('SELECT * FROM stores ORDER BY id').all();
  res.json(stores);
});

app.post('/api/stores', (req, res) => {
  const { name, address, phone, business_hours } = req.body;
  
  const existing = db.prepare('SELECT * FROM stores WHERE name = ?').get(name);
  if (existing) {
    return res.status(400).json({ 
      error: '门店名称已存在',
      existing: existing
    });
  }
  
  const result = db.prepare(
    'INSERT INTO stores (name, address, phone, business_hours) VALUES (?, ?, ?, ?)'
  ).run(name, address, phone, business_hours);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/stores/:id/queues', (req, res) => {
  const queues = db.prepare(
    'SELECT * FROM service_queues WHERE store_id = ? ORDER BY id'
  ).all(req.params.id);
  res.json(queues);
});

app.post('/api/stores/:id/queues', (req, res) => {
  const { name, prefix, average_duration, max_waiting } = req.body;
  
  const existing = db.prepare(`
    SELECT * FROM service_queues WHERE store_id = ? AND (name = ? OR prefix = ?)
  `).get(req.params.id, name, prefix);
  
  if (existing) {
    return res.status(400).json({ 
      error: `队列${existing.name === name ? '名称' : '前缀'}已存在`,
      existing: existing
    });
  }
  
  const result = db.prepare(
    'INSERT INTO service_queues (store_id, name, prefix, average_duration, max_waiting) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, name, prefix, average_duration || 10, max_waiting || 50);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/stores/:id/windows', (req, res) => {
  const windows = db.prepare(`
    SELECT w.*, q.name as queue_name, q.prefix as queue_prefix 
    FROM windows w 
    LEFT JOIN service_queues q ON w.queue_id = q.id 
    WHERE w.store_id = ? 
    ORDER BY w.id
  `).all(req.params.id);
  res.json(windows);
});

app.post('/api/stores/:id/windows', (req, res) => {
  const { name, queue_id } = req.body;
  const result = db.prepare(
    'INSERT INTO windows (store_id, name, queue_id) VALUES (?, ?, ?)'
  ).run(req.params.id, name, queue_id);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.post('/api/tickets', (req, res) => {
  const { queue_id, customer_count, phone, notify_method } = req.body;

  const queue = db.prepare('SELECT * FROM service_queues WHERE id = ?').get(queue_id);
  if (!queue) {
    return res.status(400).json({ error: '队列不存在' });
  }

  const store_id = queue.store_id;

  if (phone) {
    const existing = db.prepare(`
      SELECT * FROM tickets 
      WHERE phone = ? AND store_id = ? AND status IN ('waiting', 'called')
    `).get(phone, store_id);
    
    if (existing) {
      return res.status(400).json({ 
        error: '您已取号，请勿重复取号', 
        ticket: existing 
      });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const maxSeq = db.prepare(`
    SELECT COALESCE(MAX(sequence_number), 0) as max_seq 
    FROM tickets 
    WHERE queue_id = ? AND DATE(created_at) = ?
  `).get(queue_id, today).max_seq;
  
  const sequence_number = maxSeq + 1;
  const ticket_number = `${queue.prefix}${String(sequence_number).padStart(3, '0')}`;
  
  const waitingCount = db.prepare(`
    SELECT COUNT(*) as count FROM tickets 
    WHERE queue_id = ? AND status = 'waiting'
  `).get(queue_id).count;
  
  const estimated_wait_time = waitingCount * queue.average_duration;

  const result = db.prepare(`
    INSERT INTO tickets 
    (store_id, queue_id, ticket_number, sequence_number, customer_count, phone, notify_method, estimated_wait_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(store_id, queue_id, ticket_number, sequence_number, customer_count || 1, phone, notify_method || 'none', estimated_wait_time);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, remark)
    VALUES (?, 'create', ?)
  `).run(ticket.id, `取号成功，预计等待${estimated_wait_time}分钟`);

  res.json({ ...ticket, queue_name: queue.name });
});

app.get('/api/stores/:id/tickets/waiting', (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, q.name as queue_name, q.prefix as queue_prefix
    FROM tickets t
    JOIN service_queues q ON t.queue_id = q.id
    WHERE t.store_id = ? AND t.status = 'waiting'
    ORDER BY t.created_at ASC
  `).all(req.params.id);
  res.json(tickets);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = db.prepare(`
    SELECT t.*, q.name as queue_name, q.prefix as queue_prefix
    FROM tickets t
    JOIN service_queues q ON t.queue_id = q.id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  res.json(ticket);
});

app.get('/api/queues/:id/status', (req, res) => {
  const queue = db.prepare('SELECT * FROM service_queues WHERE id = ?').get(req.params.id);
  const waiting = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(MIN(estimated_wait_time), 0) as min_wait
    FROM tickets WHERE queue_id = ? AND status = 'waiting'
  `).get(req.params.id);
  const called = db.prepare(`
    SELECT * FROM tickets WHERE queue_id = ? AND status = 'called'
    ORDER BY called_at DESC LIMIT 1
  `).get(req.params.id);
  
  res.json({ queue, waiting_count: waiting.count, next_wait_time: waiting.min_wait, current_called: called });
});

app.post('/api/windows/:id/call-next', (req, res) => {
  const window = db.prepare('SELECT * FROM windows WHERE id = ?').get(req.params.id);
  const { operator } = req.body;

  if (window.current_ticket_id) {
    const current = db.prepare('SELECT * FROM tickets WHERE id = ?').get(window.current_ticket_id);
    if (current && current.status === 'called') {
      return res.status(400).json({ error: '当前有正在叫号的顾客，请先处理' });
    }
  }

  const nextTicket = db.prepare(`
    SELECT t.* FROM tickets t
    WHERE t.queue_id = ? AND t.status = 'waiting'
    ORDER BY t.created_at ASC LIMIT 1
  `).get(window.queue_id);

  if (!nextTicket) {
    return res.json({ message: '没有等待的顾客' });
  }

  db.prepare(`
    UPDATE tickets SET status = 'called', called_at = CURRENT_TIMESTAMP,
    actual_wait_time = CAST((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(created_at)) * 1440 AS INTEGER)
    WHERE id = ?
  `).run(nextTicket.id);

  db.prepare('UPDATE windows SET current_ticket_id = ? WHERE id = ?').run(nextTicket.id, req.params.id);

  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, window_id, action, operator)
    VALUES (?, ?, 'call', ?)
  `).run(nextTicket.id, req.params.id, operator || '前台');

  const ticket = db.prepare(`
    SELECT t.*, q.name as queue_name FROM tickets t
    JOIN service_queues q ON t.queue_id = q.id
    WHERE t.id = ?
  `).get(nextTicket.id);

  res.json(ticket);
});

app.post('/api/tickets/:id/miss', (req, res) => {
  const { operator, remark } = req.body;
  
  db.prepare(`
    UPDATE tickets SET status = 'missed' WHERE id = ?
  `).run(req.params.id);

  const window = db.prepare('SELECT * FROM windows WHERE current_ticket_id = ?').get(req.params.id);
  if (window) {
    db.prepare('UPDATE windows SET current_ticket_id = NULL WHERE id = ?').run(window.id);
  }

  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, window_id, action, operator, remark)
    VALUES (?, ?, 'miss', ?, ?)
  `).run(req.params.id, window?.id, operator || '前台', remark || '顾客未到');

  res.json({ success: true });
});

app.post('/api/tickets/:id/recall', (req, res) => {
  const { operator } = req.body;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  
  if (ticket.status !== 'missed') {
    return res.status(400).json({ error: '只有过号的顾客可以重新叫号' });
  }

  db.prepare(`
    UPDATE tickets SET status = 'called', called_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, operator, remark)
    VALUES (?, 'recall', ?, '重新叫号')
  `).run(req.params.id, operator || '前台');

  res.json({ success: true });
});

app.post('/api/tickets/:id/complete', (req, res) => {
  const { operator } = req.body;
  
  db.prepare(`
    UPDATE tickets SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
    service_duration = CAST((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(called_at)) * 1440 AS INTEGER)
    WHERE id = ?
  `).run(req.params.id);

  const window = db.prepare('SELECT * FROM windows WHERE current_ticket_id = ?').get(req.params.id);
  if (window) {
    db.prepare('UPDATE windows SET current_ticket_id = NULL WHERE id = ?').run(window.id);
  }

  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, window_id, action, operator)
    VALUES (?, ?, 'complete', ?)
  `).run(req.params.id, window?.id, operator || '前台');

  res.json({ success: true });
});

app.post('/api/tickets/:id/transfer', (req, res) => {
  const { target_queue_id, operator, remark } = req.body;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  const targetQueue = db.prepare('SELECT * FROM service_queues WHERE id = ?').get(target_queue_id);

  db.prepare(`
    UPDATE tickets SET queue_id = ?, status = 'waiting' WHERE id = ?
  `).run(target_queue_id, req.params.id);

  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, operator, remark)
    VALUES (?, 'transfer', ?, ?)
  `).run(req.params.id, operator || '前台', remark || `转至${targetQueue.name}`);

  res.json({ success: true });
});

app.post('/api/windows/:id/toggle-status', (req, res) => {
  const window = db.prepare('SELECT * FROM windows WHERE id = ?').get(req.params.id);
  const newStatus = window.status === 'open' ? 'paused' : 'open';
  
  db.prepare('UPDATE windows SET status = ? WHERE id = ?').run(newStatus, req.params.id);
  res.json({ ...window, status: newStatus });
});

app.post('/api/complaints', (req, res) => {
  const { store_id, ticket_id, type, description } = req.body;
  const result = db.prepare(`
    INSERT INTO complaints (store_id, ticket_id, type, description)
    VALUES (?, ?, ?, ?)
  `).run(store_id, ticket_id, type, description);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/stores/:id/dashboard', (req, res) => {
  const storeId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  const totalTickets = db.prepare(`
    SELECT COUNT(*) as count FROM tickets 
    WHERE store_id = ? AND DATE(created_at) = ?
  `).get(storeId, today).count;

  const waitingTickets = db.prepare(`
    SELECT COUNT(*) as count FROM tickets 
    WHERE store_id = ? AND status = 'waiting'
  `).get(storeId).count;

  const completedTickets = db.prepare(`
    SELECT COUNT(*) as count FROM tickets 
    WHERE store_id = ? AND status = 'completed' AND DATE(created_at) = ?
  `).get(storeId, today).count;

  const missedTickets = db.prepare(`
    SELECT COUNT(*) as count FROM tickets 
    WHERE store_id = ? AND status = 'missed' AND DATE(created_at) = ?
  `).get(storeId, today).count;

  const avgWaitTime = db.prepare(`
    SELECT COALESCE(AVG(actual_wait_time), 0) as avg FROM tickets 
    WHERE store_id = ? AND actual_wait_time > 0 AND DATE(created_at) = ?
  `).get(storeId, today).avg;

  const avgServiceTime = db.prepare(`
    SELECT COALESCE(AVG(service_duration), 0) as avg FROM tickets 
    WHERE store_id = ? AND service_duration > 0 AND DATE(created_at) = ?
  `).get(storeId, today).avg;

  const missRate = totalTickets > 0 ? (missedTickets / totalTickets * 100).toFixed(1) : 0;

  const queueStats = db.prepare(`
    SELECT q.id, q.name, q.prefix,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting,
      COUNT(CASE WHEN DATE(t.created_at) = ? THEN 1 END) as today_total
    FROM service_queues q
    LEFT JOIN tickets t ON q.id = t.queue_id
    WHERE q.store_id = ?
    GROUP BY q.id
  `).all(today, storeId);

  const hourlyStats = db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as count
    FROM tickets 
    WHERE store_id = ? AND DATE(created_at) = ?
    GROUP BY hour
    ORDER BY hour
  `).all(storeId, today);

  res.json({
    total_today: totalTickets,
    waiting_now: waitingTickets,
    completed_today: completedTickets,
    missed_today: missedTickets,
    miss_rate: parseFloat(missRate),
    avg_wait_time: Math.round(avgWaitTime),
    avg_service_time: Math.round(avgServiceTime),
    queue_stats: queueStats,
    hourly_stats: hourlyStats
  });
});

app.get('/api/tickets/:id/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT tl.*, w.name as window_name
    FROM ticket_logs tl
    LEFT JOIN windows w ON tl.window_id = w.id
    WHERE tl.ticket_id = ?
    ORDER BY tl.created_at DESC
  `).all(req.params.id);
  res.json(logs);
});

app.get('/api/stores/:storeId/pause-rules', (req, res) => {
  const rules = db.prepare(`
    SELECT * FROM pause_rules WHERE store_id = ? ORDER BY created_at DESC
  `).all(req.params.storeId);
  res.json(rules);
});

app.post('/api/stores/:storeId/pause-rules', (req, res) => {
  const { name, reason, start_time, end_time, days, duration } = req.body;
  const result = db.prepare(`
    INSERT INTO pause_rules (store_id, name, reason, start_time, end_time, days, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.storeId, name, reason, start_time, end_time, days, duration);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.delete('/api/pause-rules/:id', (req, res) => {
  db.prepare('DELETE FROM pause_rules WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
