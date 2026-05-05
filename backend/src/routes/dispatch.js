const express = require('express');
const db = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const generateInstructionNo = () => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString().slice(2, 6);
  return `INS${dateStr}${random}`;
};

router.get('/', checkPermission('dispatch', 'all'), (req, res) => {
  const { status, vehicle_id, driver_id, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];

  if (status) {
    whereClause += ' AND di.status = ?';
    params.push(status);
  }
  if (vehicle_id) {
    whereClause += ' AND di.vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (driver_id) {
    whereClause += ' AND di.driver_id = ?';
    params.push(driver_id);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM dispatch_instructions di WHERE ${whereClause}`);
  const { total } = countStmt.get(...params);

  const instructions = db.prepare(`
    SELECT di.*, 
           v.plate_number, d.real_name as driver_name, d.phone as driver_phone,
           o.order_no, o.customer_name,
           s.real_name as sent_by_name
    FROM dispatch_instructions di
    LEFT JOIN vehicles v ON di.vehicle_id = v.id
    LEFT JOIN drivers d ON di.driver_id = d.id
    LEFT JOIN orders o ON di.order_id = o.id
    LEFT JOIN users s ON di.sent_by = s.id
    WHERE ${whereClause}
    ORDER BY di.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: instructions,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', checkPermission('dispatch', 'all'), (req, res) => {
  const instruction = db.prepare(`
    SELECT di.*, 
           v.plate_number, d.real_name as driver_name, d.phone as driver_phone,
           o.order_no, o.customer_name, o.origin_address, o.dest_address,
           s.real_name as sent_by_name
    FROM dispatch_instructions di
    LEFT JOIN vehicles v ON di.vehicle_id = v.id
    LEFT JOIN drivers d ON di.driver_id = d.id
    LEFT JOIN orders o ON di.order_id = o.id
    LEFT JOIN users s ON di.sent_by = s.id
    WHERE di.id = ?
  `).get(req.params.id);

  if (!instruction) {
    return res.status(404).json({ message: '调度指令不存在' });
  }

  res.json(instruction);
});

router.post('/', checkPermission('dispatch', 'all'), (req, res) => {
  const {
    order_id, vehicle_id, driver_id, instruction_type, content, priority, send_method, title
  } = req.body;

  if (!instruction_type || !content) {
    return res.status(400).json({ message: '指令类型和内容不能为空' });
  }

  const instructionNo = generateInstructionNo();
  const finalContent = title ? `[${title}] ${content}` : content;

  try {
    const result = db.prepare(`
      INSERT INTO dispatch_instructions (
        instruction_no, order_id, vehicle_id, driver_id, instruction_type, 
        content, priority, send_method, status, sent_by, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, CURRENT_TIMESTAMP)
    `).run(instructionNo, order_id, vehicle_id, driver_id, instruction_type,
            finalContent, priority || 1, send_method || 'app', req.user.id);

    res.json({ message: '调度指令发送成功', id: result.lastInsertRowid, instruction_no: instructionNo });
  } catch (error) {
    res.status(500).json({ message: '发送失败', error: error.message });
  }
});

router.put('/:id/read', checkPermission('dispatch', 'driver_task', 'all'), (req, res) => {
  const instructionId = req.params.id;

  const instruction = db.prepare('SELECT * FROM dispatch_instructions WHERE id = ?').get(instructionId);
  
  if (!instruction) {
    return res.status(404).json({ message: '调度指令不存在' });
  }

  if (instruction.status === 'confirmed') {
    return res.status(400).json({ message: '指令已确认，无法标记已读' });
  }

  try {
    db.prepare(`
      UPDATE dispatch_instructions SET status = 'read', read_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(instructionId);

    res.json({ message: '已标记为已读' });
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.put('/:id/confirm', checkPermission('dispatch', 'driver_task', 'all'), (req, res) => {
  const { response_content } = req.body;
  const instructionId = req.params.id;

  const instruction = db.prepare('SELECT * FROM dispatch_instructions WHERE id = ?').get(instructionId);
  
  if (!instruction) {
    return res.status(404).json({ message: '调度指令不存在' });
  }

  if (instruction.status === 'confirmed') {
    return res.status(400).json({ message: '指令已确认' });
  }

  try {
    db.prepare(`
      UPDATE dispatch_instructions SET 
        status = 'confirmed', 
        confirmed_at = CURRENT_TIMESTAMP,
        response_content = ?
      WHERE id = ?
    `).run(response_content, instructionId);

    res.json({ message: '指令确认成功' });
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.get('/driver/pending', checkPermission('driver_task', 'all'), (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(req.user.id);
  
  if (driver) {
    const instructions = db.prepare(`
      SELECT di.*, 
             v.plate_number,
             o.order_no, o.customer_name, o.origin_address, o.dest_address,
             s.real_name as sent_by_name
      FROM dispatch_instructions di
      LEFT JOIN vehicles v ON di.vehicle_id = v.id
      LEFT JOIN orders o ON di.order_id = o.id
      LEFT JOIN users s ON di.sent_by = s.id
      WHERE di.driver_id = ? AND di.status IN ('sent', 'read')
      ORDER BY di.priority DESC, di.created_at DESC
    `).all(driver.id);
    res.json(instructions);
  } else {
    const instructions = db.prepare(`
      SELECT di.*, 
             v.plate_number,
             o.order_no, o.customer_name, o.origin_address, o.dest_address,
             s.real_name as sent_by_name
      FROM dispatch_instructions di
      LEFT JOIN vehicles v ON di.vehicle_id = v.id
      LEFT JOIN orders o ON di.order_id = o.id
      LEFT JOIN users s ON di.sent_by = s.id
      WHERE di.status IN ('sent', 'read')
      ORDER BY di.priority DESC, di.created_at DESC
    `).all();
    res.json(instructions);
  }
});

module.exports = router;
