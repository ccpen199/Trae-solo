import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/init-demo-data', authenticate, (req, res) => {
  try {
    const existingTasks = db.prepare('SELECT COUNT(*) as count FROM claim_tasks').get() as { count: number };
    if (existingTasks.count > 0) {
      return res.json({ success: true, message: '演示数据已存在' });
    }

    const taskInsert = db.prepare(`
      INSERT INTO claim_tasks (id, task_no, source, accident_location, accident_time, policy_no, policy_holder, vehicle_info, owner_name, owner_phone, appointment_time, status, current_handler_id, is_overdue)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demoTasks = [
      {
        id: uuidv4(),
        task_no: 'CK202401010001',
        source: '电话报案',
        accident_location: '北京市朝阳区建国路88号',
        accident_time: new Date(Date.now() - 3600000 * 2).toISOString(),
        policy_no: 'POL2024000001',
        policy_holder: '张三',
        vehicle_info: '京A12345 大众帕萨特',
        owner_name: '张三',
        owner_phone: '13800138001',
        appointment_time: new Date(Date.now() + 3600000 * 24).toISOString(),
        status: 'pending',
        current_handler_id: null,
        is_overdue: 0,
      },
      {
        id: uuidv4(),
        task_no: 'CK202401010002',
        source: 'APP报案',
        accident_location: '北京市海淀区中关村大街1号',
        accident_time: new Date(Date.now() - 3600000 * 5).toISOString(),
        policy_no: 'POL2024000002',
        policy_holder: '李四',
        vehicle_info: '京B23456 丰田凯美瑞',
        owner_name: '李四',
        owner_phone: '13800138002',
        appointment_time: new Date(Date.now() + 3600000 * 12).toISOString(),
        status: 'surveying',
        current_handler_id: 'surveyor1',
        is_overdue: 0,
      },
      {
        id: uuidv4(),
        task_no: 'CK202401010003',
        source: '微信报案',
        accident_location: '北京市西城区金融街35号',
        accident_time: new Date(Date.now() - 3600000 * 24).toISOString(),
        policy_no: 'POL2024000003',
        policy_holder: '王五',
        vehicle_info: '京C34567 本田雅阁',
        owner_name: '王五',
        owner_phone: '13800138003',
        appointment_time: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'assessing',
        current_handler_id: 'assessor1',
        is_overdue: 0,
      },
      {
        id: uuidv4(),
        task_no: 'CK202401010004',
        source: '电话报案',
        accident_location: '北京市东城区王府井大街201号',
        accident_time: new Date(Date.now() - 3600000 * 48).toISOString(),
        policy_no: 'POL2024000004',
        policy_holder: '赵六',
        vehicle_info: '京D45678 奥迪A6',
        owner_name: '赵六',
        owner_phone: '13800138004',
        appointment_time: new Date(Date.now() - 3600000 * 36).toISOString(),
        status: 'reviewing',
        current_handler_id: 'reviewer1',
        is_overdue: 0,
      },
      {
        id: uuidv4(),
        task_no: 'CK202401010005',
        source: 'APP报案',
        accident_location: '北京市丰台区南三环西路16号',
        accident_time: new Date(Date.now() - 3600000 * 72).toISOString(),
        policy_no: 'POL2024000005',
        policy_holder: '钱七',
        vehicle_info: '京E56789 奔驰E级',
        owner_name: '钱七',
        owner_phone: '13800138005',
        appointment_time: new Date(Date.now() - 3600000 * 60).toISOString(),
        status: 'completed',
        current_handler_id: 'surveyor1',
        is_overdue: 1,
      },
    ];

    demoTasks.forEach(task => {
      taskInsert.run(
        task.id, task.task_no, task.source, task.accident_location, task.accident_time,
        task.policy_no, task.policy_holder, task.vehicle_info, task.owner_name, task.owner_phone,
        task.appointment_time, task.status, task.current_handler_id, task.is_overdue
      );
    });

    res.json({ success: true, message: `成功初始化 ${demoTasks.length} 条演示任务数据` });
  } catch (error) {
    console.error('初始化演示数据失败:', error);
    res.status(500).json({ error: '初始化演示数据失败' });
  }
});

router.get('/', authenticate, (req, res) => {
  const { status, handler_id, page = 1, pageSize = 20 } = req.query;
  
  let whereClause = '';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (handler_id) {
    whereClause += ' AND current_handler_id = ?';
    params.push(handler_id);
  }

  const offset = (Number(page) - 1) * Number(pageSize);
  params.push(Number(pageSize), offset);

  const tasks = db.prepare(`
    SELECT t.*, u.name as handler_name
    FROM claim_tasks t
    LEFT JOIN users u ON t.current_handler_id = u.id
    WHERE 1=1${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as total FROM claim_tasks WHERE 1=1${whereClause}`).get(...params.slice(0, params.length - 2)) as { total: number };

  res.json({
    list: tasks,
    total: total.total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/:id', authenticate, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as handler_name
    FROM claim_tasks t
    LEFT JOIN users u ON t.current_handler_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  res.json(task);
});

router.post('/', authenticate, (req, res) => {
  const {
    source,
    accident_location,
    accident_time,
    policy_no,
    policy_holder,
    vehicle_info,
    owner_name,
    owner_phone,
    appointment_time,
  } = req.body;

  const task_no = `CL${Date.now().toString().slice(-8)}`;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO claim_tasks (
      id, task_no, source, accident_location, accident_time,
      policy_no, policy_holder, vehicle_info, owner_name, owner_phone,
      appointment_time, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    task_no,
    source,
    accident_location,
    accident_time,
    policy_no,
    policy_holder,
    vehicle_info,
    owner_name,
    owner_phone,
    appointment_time || null,
    'pending'
  );

  const task = db.prepare('SELECT * FROM claim_tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

router.put('/:id/assign', authenticate, (req, res) => {
  const { handler_id, reason } = req.body;
  const taskId = req.params.id;

  const task = db.prepare('SELECT * FROM claim_tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const oldHandlerId = (task as any).current_handler_id;

  db.prepare(`
    UPDATE claim_tasks
    SET current_handler_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(handler_id, taskId);

  db.prepare(`
    INSERT INTO task_transfer_logs (id, task_id, from_handler_id, to_handler_id, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, oldHandlerId || null, handler_id, reason || '任务分配');

  const updatedTask = db.prepare('SELECT * FROM claim_tasks WHERE id = ?').get(taskId);
  res.json(updatedTask);
});

router.put('/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  const taskId = req.params.id;

  db.prepare(`
    UPDATE claim_tasks SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, taskId);

  const task = db.prepare('SELECT * FROM claim_tasks WHERE id = ?').get(taskId);
  res.json(task);
});

router.put('/:id/overdue', authenticate, (req, res) => {
  const { is_overdue, overdue_reason } = req.body;
  const taskId = req.params.id;

  db.prepare(`
    UPDATE claim_tasks
    SET is_overdue = ?, overdue_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(is_overdue ? 1 : 0, overdue_reason || null, taskId);

  const task = db.prepare('SELECT * FROM claim_tasks WHERE id = ?').get(taskId);
  res.json(task);
});

router.get('/:id/transfer-logs', authenticate, (req, res) => {
  const logs = db.prepare(`
    SELECT l.*, fu.name as from_handler_name, tu.name as to_handler_name
    FROM task_transfer_logs l
    LEFT JOIN users fu ON l.from_handler_id = fu.id
    LEFT JOIN users tu ON l.to_handler_id = tu.id
    WHERE l.task_id = ?
    ORDER BY l.created_at DESC
  `).all(req.params.id);

  res.json(logs);
});

router.get('/statistics/summary', authenticate, (req, res) => {
  const stats = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM claim_tasks
    GROUP BY status
  `).all();

  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM claim_tasks WHERE is_overdue = 1
  `).get() as { count: number };

  res.json({
    by_status: stats,
    overdue: overdue.count,
  });
});

export default router;
