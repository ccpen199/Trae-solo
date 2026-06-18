import { Router, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const serviceNodes = {
  nanny: [
    { name: '上门签到', description: '到达雇主家并完成GPS+人脸核验' },
    { name: '宝宝喂养', description: '完成宝宝喂奶/辅食喂养' },
    { name: '宝宝护理', description: '更换尿布、清洁护理' },
    { name: '早教互动', description: '早教游戏、智力开发' },
    { name: '午餐制作', description: '宝宝午餐/辅食制作' },
    { name: '午休照料', description: '陪伴宝宝午休' },
    { name: '下午活动', description: '户外活动或室内游戏' },
    { name: '服务完成', description: '完成当日服务并确认' },
  ],
  cleaner: [
    { name: '上门签到', description: '到达雇主家并完成GPS+人脸核验' },
    { name: '客厅清洁', description: '客厅地面、家具表面清洁' },
    { name: '厨房清洁', description: '厨房台面、灶具、餐具清洁' },
    { name: '卫生间清洁', description: '卫生间洁具、地面消毒清洁' },
    { name: '卧室整理', description: '卧室清洁、床铺整理' },
    { name: '垃圾处理', description: '垃圾分类并清运' },
    { name: '服务完成', description: '完成服务并请雇主验收' },
  ],
  maternity: [
    { name: '上门签到', description: '到达雇主家并完成GPS+人脸核验' },
    { name: '产妇护理', description: '产妇身体清洁、伤口护理' },
    { name: '宝宝护理', description: '新生儿日常护理、抚触' },
    { name: '月子餐制作', description: '为产妇制作营养月子餐' },
    { name: '喂奶指导', description: '指导产妇正确哺乳姿势' },
    { name: '新生儿早教', description: '新生儿视觉、听觉训练' },
    { name: '服务完成', description: '完成当日服务并记录' },
  ],
};

router.get('/', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 10, status, mode, service_type, city, worker_id, employer_id, keyword } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = [];
  let params: any[] = [];

  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  if (mode) {
    where.push('o.mode = ?');
    params.push(mode);
  }
  if (service_type) {
    where.push('o.service_type = ?');
    params.push(service_type);
  }
  if (city) {
    where.push('o.city = ?');
    params.push(city);
  }
  if (worker_id) {
    where.push('o.worker_id = ?');
    params.push(worker_id);
  }
  if (employer_id) {
    where.push('o.employer_id = ?');
    params.push(employer_id);
  }
  if (keyword) {
    where.push('(o.title LIKE ? OR o.description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o ${whereSql}`).get(...params) as any;
  const list = db.prepare(`
    SELECT o.*,
      w.name as worker_name, w.avatar as worker_avatar,
      e.name as employer_name, e.phone as employer_phone,
      (SELECT COUNT(*) FROM service_nodes sn WHERE sn.order_id = o.id AND sn.status = 'completed') as completed_nodes,
      (SELECT COUNT(*) FROM service_nodes sn WHERE sn.order_id = o.id) as total_nodes
    FROM orders o
    LEFT JOIN workers w ON o.worker_id = w.id
    LEFT JOIN employers e ON o.employer_id = e.id
    ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/:id', authMiddleware(), (req: AuthRequest, res: Response) => {
  const order = db.prepare(`
    SELECT o.*,
      w.name as worker_name, w.avatar as worker_avatar, w.phone as worker_phone,
      e.name as employer_name, e.phone as employer_phone, e.address as employer_address
    FROM orders o
    LEFT JOIN workers w ON o.worker_id = w.id
    LEFT JOIN employers e ON o.employer_id = e.id
    WHERE o.id = ?
  `).get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const nodes = db.prepare('SELECT * FROM service_nodes WHERE order_id = ? ORDER BY rowid').all(req.params.id);
  const grabRecords = db.prepare(`
    SELECT gr.*, w.name as worker_name, w.avatar as worker_avatar, w.rating as worker_rating
    FROM grab_order_records gr
    LEFT JOIN workers w ON gr.worker_id = w.id
    WHERE gr.order_id = ?
    ORDER BY gr.grab_time DESC
  `).all(req.params.id);
  const review = db.prepare('SELECT * FROM reviews WHERE order_id = ?').get(req.params.id);

  res.json({
    order: {
      ...order,
      work_times_data: order.work_times ? JSON.parse(order.work_times) : [],
      special_requirements_data: order.special_requirements ? JSON.parse(order.special_requirements) : [],
    },
    nodes,
    grabRecords,
    review,
  });
});

router.post('/', authMiddleware(['admin', 'employer']), (req: AuthRequest, res: Response) => {
  const { employer_id, mode, service_type, title, description, duration_hours, frequency, start_date, end_date, work_times, budget_min, budget_max, special_requirements, longitude, latitude, address, city, district } = req.body;

  if (!employer_id || !mode || !service_type || !title || !duration_hours || !frequency || !start_date || !budget_min || !budget_max || !city || !district) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  const orderId = uuidv4();
  const nodes = serviceNodes[service_type] || [];

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (id, employer_id, mode, service_type, title, description, duration_hours, frequency, start_date, end_date, work_times, budget_min, budget_max, special_requirements, status, longitude, latitude, address, city, district)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).run(
      orderId, employer_id, mode, service_type, title, description || '', duration_hours, frequency,
      start_date, end_date || null, work_times ? JSON.stringify(work_times) : null,
      budget_min, budget_max, special_requirements ? JSON.stringify(special_requirements) : null,
      longitude || 0, latitude || 0, address || '', city, district
    );

    nodes.forEach((node) => {
      db.prepare(`
        INSERT INTO service_nodes (id, order_id, node_name, node_description, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(uuidv4(), orderId, node.name, node.description);
    });
  });

  try {
    tx();
    res.json({ success: true, id: orderId, message: '订单创建成功' });
  } catch (error) {
    res.status(500).json({ error: '订单创建失败' });
  }
});

router.post('/:id/grab', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const workerId = (db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.user!.id) as any)?.id;

  if (!workerId) {
    return res.status(400).json({ error: '未找到阿姨档案' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  if (order.mode !== 'grab') {
    return res.status(400).json({ error: '该订单不支持抢单' });
  }
  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单已被接单或已关闭' });
  }

  try {
    db.prepare(`
      INSERT INTO grab_order_records (id, order_id, worker_id, status)
      VALUES (?, ?, ?, 'pending')
    `).run(uuidv4(), orderId, workerId);
    res.json({ success: true, message: '抢单成功,等待确认' });
  } catch (error) {
    res.status(400).json({ error: '您已抢过此订单' });
  }
});

router.post('/:id/accept', authMiddleware(['admin', 'employer']), (req: AuthRequest, res: Response) => {
  const { worker_id } = req.body;
  const orderId = req.params.id;

  if (!worker_id) {
    return res.status(400).json({ error: '请选择接单阿姨' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单状态不允许接单' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE orders SET worker_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(worker_id, 'accepted', orderId);

    if (order.mode === 'grab') {
      db.prepare('UPDATE grab_order_records SET status = ? WHERE order_id = ? AND worker_id = ?')
        .run('accepted', orderId, worker_id);
      db.prepare('UPDATE grab_order_records SET status = ? WHERE order_id = ? AND worker_id != ?')
        .run('rejected', orderId, worker_id);
    }

    db.prepare(`
      INSERT INTO insurance_policies (id, worker_id, order_id, policy_number, insurance_type, coverage_amount, premium, start_date, end_date, status)
      VALUES (?, ?, ?, ?, '家政意外险', 500000, 5, ?, ?, 'active')
    `).run(uuidv4(), worker_id, orderId, `POL${Date.now()}`, order.start_date, order.end_date || order.start_date);
  });

  try {
    tx();
    res.json({ success: true, message: '接单成功,已自动投保' });
  } catch (error) {
    res.status(500).json({ error: '接单失败' });
  }
});

router.post('/:id/checkin', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const { gps, face_verified } = req.body;

  if (!gps || !face_verified) {
    return res.status(400).json({ error: 'GPS和人脸核验为必填' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  if (order.status !== 'accepted') {
    return res.status(400).json({ error: '订单状态不允许打卡' });
  }

  db.prepare(`
    UPDATE orders SET
      status = 'in_progress',
      checkin_gps = ?,
      checkin_face_verified = ?,
      checkin_time = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(gps), face_verified ? 1 : 0, orderId);

  const firstNode = db.prepare('SELECT * FROM service_nodes WHERE order_id = ? ORDER BY rowid LIMIT 1').get(orderId) as any;
  if (firstNode) {
    db.prepare(`
      UPDATE service_nodes SET status = 'completed', completed_at = CURRENT_TIMESTAMP, note = '上户打卡完成'
      WHERE id = ?
    `).run(firstNode.id);
  }

  res.json({ success: true, message: '打卡成功,服务开始' });
});

router.post('/:id/nodes/:nodeId/complete', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const { note, image_url } = req.body;

  db.prepare(`
    UPDATE service_nodes SET
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP,
      note = ?,
      image_url = ?
    WHERE id = ?
  `).run(note || '', image_url || '', req.params.nodeId);

  res.json({ success: true, message: '节点完成' });
});

router.post('/:id/complete', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const { actual_amount } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order || order.status !== 'in_progress') {
    return res.status(400).json({ error: '订单状态不正确' });
  }

  const pendingNodes = db.prepare("SELECT COUNT(*) as count FROM service_nodes WHERE order_id = ? AND status = 'pending'").get(orderId) as any;
  if (pendingNodes.count > 0) {
    return res.status(400).json({ error: '还有未完成的服务节点' });
  }

  const amount = actual_amount || order.budget_max;

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE orders SET
        status = 'completed',
        actual_amount = ?,
        checkout_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(amount, orderId);

    db.prepare(`
      INSERT INTO salary_records (id, worker_id, order_id, amount, bank_card, bank_name, status)
      VALUES (?, ?, ?, ?, '622202********1234', '工商银行', 'pending')
    `).run(uuidv4(), order.worker_id, orderId, amount);

    db.prepare('UPDATE workers SET order_count = order_count + 1 WHERE id = ?').run(order.worker_id);
  });

  try {
    tx();
    res.json({ success: true, message: '服务完成,薪资已进入待发放队列' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.post('/:id/review', authMiddleware(['employer']), (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const { rating, content, tags } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order || order.status !== 'completed') {
    return res.status(400).json({ error: '订单未完成' });
  }

  const existing = db.prepare('SELECT * FROM reviews WHERE order_id = ?').get(orderId);
  if (existing) {
    return res.status(400).json({ error: '已评价过此订单' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO reviews (id, order_id, employer_id, worker_id, rating, content, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), orderId, order.employer_id, order.worker_id, rating, content || '', tags ? JSON.stringify(tags) : null);

    const workerStats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE worker_id = ?
    `).get(order.worker_id) as any;

    db.prepare('UPDATE workers SET rating = ?, review_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(workerStats.avg_rating, workerStats.count, order.worker_id);
  });

  try {
    tx();
    res.json({ success: true, message: '评价成功' });
  } catch (error) {
    res.status(500).json({ error: '评价失败' });
  }
});

router.get('/grab/available', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const workerId = (db.prepare('SELECT id, service_cities, role FROM workers WHERE user_id = ?').get(req.user!.id) as any);

  if (!workerId) {
    return res.status(400).json({ error: '未找到阿姨档案' });
  }

  const list = db.prepare(`
    SELECT o.*,
      e.name as employer_name, e.city as employer_city,
      (SELECT COUNT(*) FROM grab_order_records gr WHERE gr.order_id = o.id) as grab_count
    FROM orders o
    LEFT JOIN employers e ON o.employer_id = e.id
    WHERE o.mode = 'grab' AND o.status = 'pending'
      AND o.service_type = ?
    ORDER BY o.created_at DESC
    LIMIT 20
  `).all(workerId.role);

  res.json({ list });
});

export default router;
