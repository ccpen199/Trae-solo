const db = require('../db');
const { success, error, pagination } = require('../utils/response');

const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `NS${year}${month}${day}${random}`;
};

const createOrder = (req, res) => {
  const {
    service_id, patient_name, patient_phone, patient_address,
    patient_age, patient_gender, patient_condition, medical_order,
    scheduled_time, contact_name, contact_phone, address
  } = req.body;

  if (!service_id || !patient_name || !patient_address || !scheduled_time) {
    return res.status(400).json(error('缺少必要参数'));
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!service) {
    return res.status(404).json(error('服务项目不存在'));
  }

  const orderNo = generateOrderNo();
  const needApproval = service.requires_approval === 1 || service.risk_level === 'high';
  const status = needApproval ? 'pending_approval' : 'pending';
  const userId = req.user?.id || 5;

  const stmt = db.prepare(`
    INSERT INTO orders (
      order_no, user_id, service_id, patient_name, patient_phone, patient_address,
      patient_age, patient_gender, patient_condition, medical_order, scheduled_time,
      contact_name, contact_phone, price, status, need_approval, risk_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    orderNo, userId, service_id, patient_name, patient_phone || null,
    address || patient_address, patient_age || null, patient_gender || null,
    patient_condition || null, medical_order || null, scheduled_time,
    contact_name || null, contact_phone || null, service.price, status,
    needApproval ? 1 : 0, service.risk_level
  );

  if (!needApproval) {
    db.prepare(`
      INSERT INTO dispatch_tasks (order_id, status, notes)
      VALUES (?, 'waiting', '待匹配护士')
    `).run(result.lastInsertRowid);
  }

  const order = db.prepare(`
    SELECT o.*, s.name as service_name, s.description as service_description
    FROM orders o LEFT JOIN services s ON o.service_id = s.id WHERE o.id = ?
  `).get(result.lastInsertRowid);

  res.json(success(order, '订单创建成功'));
};

const getOrders = (req, res) => {
  const { user_id, nurse_id, status, page = 1, pageSize = 10 } = req.query;
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (user_id) {
    whereClause += ' AND o.user_id = ?';
    params.push(parseInt(user_id));
  }

  if (nurse_id) {
    whereClause += ' AND o.nurse_id = ?';
    params.push(parseInt(nurse_id));
  }

  if (status) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }

  if (req.user) {
    if (req.user.role === 'patient_family') {
      whereClause += ' AND o.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'nurse') {
      const nurse = db.prepare('SELECT id FROM nurses WHERE user_id = ?').get(req.user.id);
      if (nurse) {
        whereClause += ' AND o.nurse_id = ?';
        params.push(nurse.id);
      }
    }
  }

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM orders o' + whereClause);
  const { total } = countStmt.get(...params);

  const offset = (page - 1) * pageSize;
  const orders = db.prepare(`
    SELECT o.*, s.name as service_name, u.name as user_name, u.phone as user_phone
    FROM orders o LEFT JOIN services s ON o.service_id = s.id
    LEFT JOIN users u ON o.user_id = u.id
    ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json(pagination(orders, total, parseInt(page), parseInt(pageSize)));
};

const getOrderDetail = (req, res) => {
  const { id } = req.params;
  const order = db.prepare(`
    SELECT o.*, s.name as service_name, s.description as service_description,
           s.price as service_price, u.name as user_name, u.phone as user_phone,
           un.name as nurse_name, n.license_no as nurse_license
    FROM orders o LEFT JOIN services s ON o.service_id = s.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN nurses n ON o.nurse_id = n.id
    LEFT JOIN users un ON n.user_id = un.id
    WHERE o.id = ?
  `).get(id);

  if (!order) {
    return res.status(404).json(error('订单不存在'));
  }

  if (req.user) {
    if (req.user.role === 'patient_family' && order.user_id !== req.user.id) {
      return res.status(403).json(error('无权查看此订单'));
    }
    if (req.user.role === 'nurse') {
      const nurse = db.prepare('SELECT id FROM nurses WHERE user_id = ?').get(req.user.id);
      if (nurse && order.nurse_id && order.nurse_id !== nurse.id) {
        return res.status(403).json(error('无权查看此订单'));
      }
    }
  }

  const record = db.prepare('SELECT * FROM nursing_records WHERE order_id = ?').get(id);
  order.nursing_record = record || null;
  order.service = db.prepare('SELECT * FROM services WHERE id = ?').get(order.service_id);

  res.json(success(order, '查询成功'));
};

const approveOrder = (req, res) => {
  const { id } = req.params;
  const { approved, remark } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

  if (!order) {
    return res.status(404).json(error('订单不存在'));
  }

  if (order.status !== 'pending_approval') {
    return res.status(400).json(error('订单状态不允许审核'));
  }

  const newStatus = approved ? 'pending' : 'rejected';
  db.prepare(`
    UPDATE orders SET status = ?, need_approval = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, id);

  if (approved) {
    db.prepare(`
      INSERT INTO dispatch_tasks (order_id, status, notes)
      VALUES (?, 'waiting', '审核通过，待匹配护士')
    `).run(id);
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  const msg = approved ? '订单审核通过' : '订单已拒绝';

  res.json(success(updated, msg));
};

const cancelOrder = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

  if (!order) {
    return res.status(404).json(error('订单不存在'));
  }

  if (['completed', 'cancelled', 'in_progress'].includes(order.status)) {
    return res.status(400).json(error('订单状态不允许取消'));
  }

  if (req.user && req.user.role === 'patient_family' && order.user_id !== req.user.id) {
    return res.status(403).json(error('无权取消此订单'));
  }

  db.prepare(`
    UPDATE orders SET status = 'cancelled', cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason || null, id);

  db.prepare('UPDATE dispatch_tasks SET status = ? WHERE order_id = ?').run('cancelled', id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(success(updated, '订单已取消'));
};

module.exports = { createOrder, getOrders, getOrderDetail, approveOrder, cancelOrder };
