require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59012');

app.use(cors({
  origin: ['http://127.0.0.1:49012', 'http://localhost:49012'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const onlineDevices = db.prepare('SELECT COUNT(*) as count FROM devices WHERE status = ?').get('online').count;
    const totalScenes = db.prepare('SELECT COUNT(*) as count FROM scene_templates').get().count;
    const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM service_orders WHERE status = ?').get('pending').count;
    const totalEnergy = db.prepare('SELECT SUM(energy_consumption) as total FROM devices').get().total || 0;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('user').count;
    const inProgressOrders = db.prepare('SELECT COUNT(*) as count FROM service_orders WHERE status = ?').get('in_progress').count;
    const avgHealth = db.prepare('SELECT AVG(health_score) as avg FROM devices').get().avg || 0;

    res.json({
      totalDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
      totalScenes,
      pendingOrders,
      inProgressOrders,
      totalEnergy: Math.round(totalEnergy),
      totalUsers,
      avgHealth: Math.round(avgHealth)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/charts', (req, res) => {
  try {
    const slaData = db.prepare('SELECT * FROM sla_metrics ORDER BY date DESC LIMIT 7').all().reverse();
    const sceneLogs = db.prepare('SELECT * FROM scene_execution_logs ORDER BY created_at DESC LIMIT 10').all();
    res.json({ slaData, sceneLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices', (req, res) => {
  try {
    const { type, status, userId } = req.query;
    let query = `
      SELECT d.*, u.name as user_name, u.phone as user_phone 
      FROM devices d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    if (type) { query += ' AND d.type = ?'; params.push(type); }
    if (status) { query += ' AND d.status = ?'; params.push(status); }
    if (userId) { query += ' AND d.user_id = ?'; params.push(userId); }
    query += ' ORDER BY d.created_at DESC';
    const devices = db.prepare(query).all(...params);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices/:id', (req, res) => {
  try {
    const device = db.prepare(`
      SELECT d.*, u.name as user_name, u.phone as user_phone 
      FROM devices d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE d.id = ?
    `).get(req.params.id);
    if (device) {
      const logs = db.prepare('SELECT * FROM device_operation_logs WHERE device_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);
      res.json({ ...device, operation_logs: logs });
    } else {
      res.status(404).json({ error: '设备不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/devices', (req, res) => {
  try {
    const { device_id, name, type, model, user_id } = req.body;
    const result = db.prepare(
      'INSERT INTO devices (device_id, name, type, model, status, power_state, user_id, bind_time) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(device_id, name, type, model, 'online', 'off', user_id || null);
    
    db.prepare('INSERT INTO device_discovery_logs (device_id, name, type, model, bind_user_id, bind_status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(device_id, name, type, model, user_id || null, 'bound');
    
    db.prepare('INSERT INTO device_operation_logs (device_id, operation, params, operator, result, success) VALUES (?, ?, ?, ?, ?, ?)')
      .run(result.lastInsertRowid, 'device_register', JSON.stringify(req.body), 'system', '设备注册成功', 1);
    
    res.json({ id: result.lastInsertRowid, message: '设备添加成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/devices/:id', (req, res) => {
  try {
    const { name, status, power_state, running_mode, health_score } = req.body;
    db.prepare(
      'UPDATE devices SET name = COALESCE(?, name), status = COALESCE(?, status), power_state = COALESCE(?, power_state), running_mode = COALESCE(?, running_mode), health_score = COALESCE(?, health_score), last_online = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, status, power_state, running_mode, health_score, req.params.id);
    res.json({ message: '设备更新成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/devices/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
    res.json({ message: '设备删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/devices/:id/control', (req, res) => {
  try {
    const { action, params, operator } = req.body;
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
    if (!device) return res.status(404).json({ error: '设备不存在' });

    let power_state = device.power_state;
    let running_mode = device.running_mode;

    if (action === 'on') power_state = 'on';
    else if (action === 'off') power_state = 'off';
    else if (action === 'set_mode') running_mode = params?.mode || running_mode;

    db.prepare('UPDATE devices SET power_state = ?, running_mode = ?, last_online = CURRENT_TIMESTAMP WHERE id = ?')
      .run(power_state, running_mode, req.params.id);

    db.prepare('INSERT INTO device_operation_logs (device_id, operation, params, operator, result, success) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.params.id, action, JSON.stringify(params || {}), operator || 'user', '操作成功', 1);

    res.json({ message: '控制命令已发送', device: { ...device, power_state, running_mode } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/device-discovery', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM device_discovery_logs ORDER BY created_at DESC').all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/device-discovery/:id/bind', (req, res) => {
  try {
    const { user_id, device_name } = req.body;
    const discovery = db.prepare('SELECT * FROM device_discovery_logs WHERE id = ?').get(req.params.id);
    if (!discovery) return res.status(404).json({ error: '发现记录不存在' });

    db.prepare('UPDATE device_discovery_logs SET bind_user_id = ?, bind_status = ? WHERE id = ?')
      .run(user_id, 'bound', req.params.id);

    const result = db.prepare(
      'INSERT INTO devices (device_id, name, type, model, status, power_state, user_id, bind_time) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(discovery.device_id, device_name || discovery.name, discovery.type, discovery.model, 'online', 'off', user_id);

    res.json({ id: result.lastInsertRowid, message: '设备绑定成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (user) {
      const devices = db.prepare('SELECT * FROM devices WHERE user_id = ?').all(req.params.id);
      const orders = db.prepare('SELECT * FROM service_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
      res.json({ ...user, devices, orders });
    } else {
      res.status(404).json({ error: '用户不存在' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, name, phone, email, role, address } = req.body;
    const result = db.prepare(
      'INSERT INTO users (username, name, phone, email, role, address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username, name, phone, email, role || 'user', address || '');
    res.json({ id: result.lastInsertRowid, message: '用户创建成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/technicians', (req, res) => {
  try {
    const techs = db.prepare('SELECT * FROM technicians ORDER BY created_at DESC').all();
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scenes', (req, res) => {
  try {
    const scenes = db.prepare(`
      SELECT s.*, u.name as user_name 
      FROM scene_templates s 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.created_at DESC
    `).all();
    res.json(scenes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scenes/:id', (req, res) => {
  try {
    const scene = db.prepare('SELECT * FROM scene_templates WHERE id = ?').get(req.params.id);
    if (scene) {
      const logs = db.prepare('SELECT * FROM scene_execution_logs WHERE scene_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);
      res.json({ ...scene, execution_logs: logs });
    } else {
      res.status(404).json({ error: '场景不存在' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scenes', (req, res) => {
  try {
    const { name, description, conditions, actions, user_id } = req.body;
    const result = db.prepare(
      'INSERT INTO scene_templates (name, description, conditions, actions, user_id) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description, JSON.stringify(conditions || {}), JSON.stringify(actions || {}), user_id || null);
    res.json({ id: result.lastInsertRowid, message: '场景创建成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/scenes/:id', (req, res) => {
  try {
    const { name, description, conditions, actions, enabled } = req.body;
    db.prepare(
      'UPDATE scene_templates SET name = COALESCE(?, name), description = COALESCE(?, description), conditions = COALESCE(?, conditions), actions = COALESCE(?, actions), enabled = COALESCE(?, enabled) WHERE id = ?'
    ).run(name, description, JSON.stringify(conditions), JSON.stringify(actions), enabled, req.params.id);
    res.json({ message: '场景更新成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/scenes/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM scene_templates WHERE id = ?').run(req.params.id);
    res.json({ message: '场景删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/scenes/:id/execute', (req, res) => {
  try {
    const { executed_by } = req.body;
    const scene = db.prepare('SELECT * FROM scene_templates WHERE id = ?').get(req.params.id);
    if (!scene) return res.status(404).json({ error: '场景不存在' });

    db.prepare('UPDATE scene_templates SET execute_count = execute_count + 1, last_executed = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.params.id);

    db.prepare('INSERT INTO scene_execution_logs (scene_id, scene_name, trigger_type, executed_by, actions_result, success) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.params.id, scene.name, 'manual', executed_by || 'user', JSON.stringify({ executed: true }), 1);

    res.json({ message: `场景「${scene.name}」已执行`, executedAt: new Date().toISOString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/scene-execution-logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM scene_execution_logs ORDER BY created_at DESC LIMIT 50').all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const { status, type } = req.query;
    let query = `
      SELECT so.*, u.name as user_name, d.name as device_name, t.name as technician_name 
      FROM service_orders so 
      LEFT JOIN users u ON so.user_id = u.id 
      LEFT JOIN devices d ON so.device_id = d.id 
      LEFT JOIN technicians t ON so.technician_id = t.id 
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ' AND so.status = ?'; params.push(status); }
    if (type) { query += ' AND so.type = ?'; params.push(type); }
    query += ' ORDER BY so.created_at DESC';
    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT so.*, u.name as user_name, u.phone as user_phone, u.address as user_address,
             d.name as device_name, d.model as device_model, d.sn_number as device_sn,
             t.name as technician_name, t.phone as technician_phone
      FROM service_orders so 
      LEFT JOIN users u ON so.user_id = u.id 
      LEFT JOIN devices d ON so.device_id = d.id 
      LEFT JOIN technicians t ON so.technician_id = t.id 
      WHERE so.id = ?
    `).get(req.params.id);
    if (order) {
      const sopLogs = db.prepare('SELECT * FROM order_sop_logs WHERE order_id = ? ORDER BY created_at ASC').all(req.params.id);
      res.json({ ...order, sop_logs: sopLogs });
    } else {
      res.status(404).json({ error: '工单不存在' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { order_no, type, title, description, priority, user_id, device_id, scheduled_time } = req.body;
    const result = db.prepare(
      'INSERT INTO service_orders (order_no, type, title, description, priority, user_id, device_id, scheduled_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(order_no, type, title, description, priority || 'normal', user_id || null, device_id || null, scheduled_time || null);

    db.prepare('INSERT INTO order_sop_logs (order_id, step, description, operator, result) VALUES (?, ?, ?, ?, ?)')
      .run(result.lastInsertRowid, '创建工单', title || description, 'system', '成功');

    res.json({ id: result.lastInsertRowid, message: '工单创建成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id', (req, res) => {
  try {
    const { status, technician_id, scheduled_time, completed_at, diagnosis_result, solution, rating } = req.body;
    db.prepare(
      'UPDATE service_orders SET status = COALESCE(?, status), technician_id = COALESCE(?, technician_id), scheduled_time = COALESCE(?, scheduled_time), completed_at = COALESCE(?, completed_at), diagnosis_result = COALESCE(?, diagnosis_result), solution = COALESCE(?, solution), rating = COALESCE(?, rating) WHERE id = ?'
    ).run(status, technician_id, scheduled_time, completed_at, diagnosis_result, solution, rating, req.params.id);
    res.json({ message: '工单更新成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/orders/:id/dispatch', (req, res) => {
  try {
    const { technician_id } = req.body;
    db.prepare('UPDATE service_orders SET status = ?, technician_id = ? WHERE id = ?')
      .run('in_progress', technician_id, req.params.id);

    db.prepare('INSERT INTO order_sop_logs (order_id, step, description, operator, result) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, '派单', '系统自动派单', '调度引擎', '成功');

    res.json({ message: '工单派单成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/orders/:id/complete', (req, res) => {
  try {
    const { diagnosis_result, solution, labor_cost, parts_cost, rating } = req.body;
    const total_cost = (labor_cost || 0) + (parts_cost || 0);
    db.prepare('UPDATE service_orders SET status = ?, completed_at = CURRENT_TIMESTAMP, diagnosis_result = ?, solution = ?, labor_cost = ?, parts_cost = ?, total_cost = ?, rating = ? WHERE id = ?')
      .run('completed', diagnosis_result, solution, labor_cost || 0, parts_cost || 0, total_cost, rating, req.params.id);

    db.prepare('INSERT INTO order_sop_logs (order_id, step, description, operator, result) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, '工单完结', '服务完成，用户验收通过', 'system', '成功');

    res.json({ message: '工单完成' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders/:id/sop-logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM order_sop_logs WHERE order_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/parts', (req, res) => {
  try {
    const parts = db.prepare('SELECT * FROM parts_inventory ORDER BY created_at DESC').all();
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/parts/:id/use', (req, res) => {
  try {
    const { quantity, order_id, technician } = req.body;
    db.prepare('UPDATE parts_inventory SET stock = stock - ? WHERE id = ?').run(quantity, req.params.id);
    db.prepare('INSERT INTO parts_usage_logs (order_id, part_id, quantity, technician) VALUES (?, ?, ?, ?)')
      .run(order_id || null, req.params.id, quantity, technician || 'system');
    res.json({ message: '配件出库成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/voice-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT vl.*, u.name as user_name, d.name as device_name 
      FROM voice_logs vl 
      LEFT JOIN users u ON vl.user_id = u.id 
      LEFT JOIN devices d ON vl.device_id = d.id 
      ORDER BY vl.created_at DESC 
      LIMIT 50
    `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/voice-command', (req, res) => {
  try {
    const { command, user_id } = req.body;
    let intent = 'unknown';
    let result = '命令已接收';
    let device_id = null;

    if (command.includes('打开') || command.includes('开启')) intent = 'power_on';
    else if (command.includes('关闭') || command.includes('关掉')) intent = 'power_off';
    else if (command.includes('模式')) intent = 'set_mode';
    else if (command.includes('温度')) intent = 'set_temperature';
    else if (command.includes('离家') || command.includes('回家') || command.includes('睡眠') || command.includes('影院')) intent = 'activate_scene';

    if (command.includes('电视')) result = '已为您控制电视';
    else if (command.includes('空调')) result = '已为您控制空调';
    else if (command.includes('冰箱')) result = '已为您控制冰箱';
    else if (command.includes('模式')) result = '已切换运行模式';
    else if (command.includes('温度')) result = '温度已调节';

    db.prepare('INSERT INTO voice_logs (command, intent, params, result, success, user_id, device_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(command, intent, '{}', result, 1, user_id || null, device_id);

    res.json({ command, intent, result, success: 1 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/sla-metrics', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM sla_metrics ORDER BY date DESC LIMIT 30').all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`海信IoT云平台后端服务运行在 http://127.0.0.1:${PORT}`);
});
