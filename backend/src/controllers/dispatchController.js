const db = require("../db");
const { success, error, pagination } = require("../utils/response");

const getDispatchTasks = (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const params = [];
  let whereSql = " WHERE 1=1";
  
  if (status) {
    whereSql += " AND d.status = ?";
    params.push(status);
  }

  const total = db
    .prepare(`SELECT COUNT(*) AS count FROM dispatch_tasks d${whereSql}`)
    .get(...params).count;

  const limit = Number.parseInt(pageSize, 10);
  const pageNumber = Number.parseInt(page, 10);
  const offset = (pageNumber - 1) * limit;

  const rows = db
    .prepare(`
      SELECT d.*, o.order_no, o.scheduled_time, o.patient_name, o.patient_address,
             o.risk_level, s.name AS service_name, u.name AS user_name,
             un.name AS nurse_name, n.phone AS nurse_phone
      FROM dispatch_tasks d
      JOIN orders o ON o.id = d.order_id
      JOIN services s ON s.id = o.service_id
      JOIN users u ON u.id = o.user_id
      LEFT JOIN nurses n ON n.id = d.nurse_id
      LEFT JOIN users un ON un.id = n.user_id
      ${whereSql} ORDER BY o.scheduled_time ASC LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset);

  res.json(pagination(rows, total, pageNumber, limit));
};

const getRecommendedNurses = (req, res) => {
  const { order_id } = req.params;
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(order_id);
  
  if (!order) {
    return res.status(404).json(error("订单不存在"));
  }

  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(order.service_id);
  const requiredQuals = service.required_qualifications ? service.required_qualifications.split(',') : [];

  const nurses = db.prepare(`
    SELECT n.*, u.name, u.phone, u.status as user_status
    FROM nurses n JOIN users u ON n.user_id = u.id
    WHERE n.status = 'available'
    ORDER BY n.rating DESC, n.years_of_experience DESC
  `).all();

  const nursesWithScore = nurses.map(nurse => {
    let score = 0;
    score += nurse.rating * 10;
    score += nurse.years_of_experience * 2;
    
    const nurseQuals = nurse.qualifications ? nurse.qualifications.split(',') : [];
    const hasAllQuals = requiredQuals.every(q => 
      nurseQuals.some(nq => nq.includes(q.trim()) || q.trim().includes(nq))
    );
    
    if (hasAllQuals) score += 50;
    if (nurse.service_area && order.patient_address) {
      if (order.patient_address.includes(nurse.service_area)) {
        score += 30;
      }
    }
    
    return { ...nurse, match_score: score, has_required_qualifications: hasAllQuals };
  }).sort((a, b) => b.match_score - a.match_score);

  res.json(success(nursesWithScore, "获取推荐护士成功"));
};

const assignTask = (req, res) => {
  const { order_id } = req.params;
  const { nurse_id, eta_minutes, route, notes } = req.body;

  if (!nurse_id) {
    return res.status(400).json(error("请选择护理人员"));
  }

  const task = db.prepare("SELECT * FROM dispatch_tasks WHERE order_id = ?").get(order_id);
  if (!task) {
    return res.status(404).json(error("调度任务不存在"));
  }

  db.prepare(`
    UPDATE dispatch_tasks
    SET nurse_id = ?, status = 'assigned', eta_minutes = ?, route = ?, 
        notes = COALESCE(?, notes), assigned_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `).run(nurse_id, eta_minutes || null, route || null, notes || null, order_id);

  db.prepare(`
    UPDATE orders SET nurse_id = ?, status = 'dispatched', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nurse_id, order_id);

  db.prepare("UPDATE nurses SET status = 'busy' WHERE id = ?").run(nurse_id);

  const updated = db.prepare(`
    SELECT d.*, o.order_no, o.scheduled_time, o.patient_name,
           s.name AS service_name, un.name AS nurse_name
    FROM dispatch_tasks d
    JOIN orders o ON o.id = d.order_id
    JOIN services s ON s.id = o.service_id
    LEFT JOIN nurses n ON n.id = d.nurse_id
    LEFT JOIN users un ON un.id = n.user_id
    WHERE d.order_id = ?
  `).get(order_id);

  res.json(success(updated, "派单成功"));
};

const acceptTask = (req, res) => {
  const { id } = req.params;
  const nurse = db.prepare("SELECT id FROM nurses WHERE user_id = ?").get(req.user.id);

  if (!nurse) {
    return res.status(403).json(error("只有护士可以接单"));
  }

  const task = db.prepare("SELECT * FROM dispatch_tasks WHERE id = ?").get(id);
  if (!task) {
    return res.status(404).json(error("任务不存在"));
  }

  if (task.nurse_id !== nurse.id) {
    return res.status(403).json(error("这不是分配给您的任务"));
  }

  if (task.status !== 'assigned') {
    return res.status(400).json(error("任务状态不允许接单"));
  }

  db.prepare(`
    UPDATE dispatch_tasks SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  db.prepare(`
    UPDATE orders SET status = 'nurse_accepted', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(task.order_id);

  res.json(success(null, "接单成功"));
};

const rejectTask = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const nurse = db.prepare("SELECT id FROM nurses WHERE user_id = ?").get(req.user.id);

  if (!nurse) {
    return res.status(403).json(error("只有护士可以拒单"));
  }

  const task = db.prepare("SELECT * FROM dispatch_tasks WHERE id = ?").get(id);
  if (!task) {
    return res.status(404).json(error("任务不存在"));
  }

  if (task.nurse_id !== nurse.id) {
    return res.status(403).json(error("这不是分配给您的任务"));
  }

  db.prepare(`
    UPDATE dispatch_tasks SET status = 'rejected', notes = ?
    WHERE id = ?
  `).run(reason || '护士拒单', id);

  db.prepare("UPDATE orders SET nurse_id = NULL, status = 'pending' WHERE id = ?").run(task.order_id);
  db.prepare("UPDATE nurses SET status = 'available' WHERE id = ?").run(nurse.id);

  res.json(success(null, "已拒单"));
};

const completeTask = (req, res) => {
  const { id } = req.params;
  const task = db.prepare("SELECT * FROM dispatch_tasks WHERE id = ?").get(id);

  if (!task) {
    return res.status(404).json(error("调度任务不存在"));
  }

  db.prepare(`
    UPDATE dispatch_tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  db.prepare("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(task.order_id);
  
  if (task.nurse_id) {
    db.prepare("UPDATE nurses SET status = 'available' WHERE id = ?").run(task.nurse_id);
  }

  res.json(success(null, "任务已完成"));
};

module.exports = { getDispatchTasks, getRecommendedNurses, assignTask, acceptTask, rejectTask, completeTask };
