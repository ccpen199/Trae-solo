import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { department_id, category, status, keyword, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = [];
    const params = [];

    if (department_id) {
      conditions.push('si.department_id = ?');
      params.push(department_id);
    }
    if (category) {
      conditions.push('si.category = ?');
      params.push(category);
    }
    if (status) {
      conditions.push('si.status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(si.name LIKE ? OR si.code LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM service_items si ${where}`).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT si.*, d.name as department_name
      FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      ${where}
      ORDER BY si.sort_order ASC, si.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    const parsedList = list.map(item => ({
      ...item,
      process_config: item.process_config ? JSON.parse(item.process_config) : null,
      required_materials: item.required_materials ? JSON.parse(item.required_materials) : null
    }));

    res.json({ list: parsedList, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const item = db.prepare(`
      SELECT si.*, d.name as department_name
      FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      WHERE si.id = ?
    `).get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: '服务事项不存在' });
    }

    item.process_config = item.process_config ? JSON.parse(item.process_config) : null;
    item.required_materials = item.required_materials ? JSON.parse(item.required_materials) : null;

    const materials = db.prepare('SELECT * FROM materials WHERE item_id = ?').all(req.params.id);

    res.json({ ...item, materials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const db = getDB();
    const {
      name, code, department_id, category, type, description, legal_basis,
      conditions, required_materials, process_config, time_limit, time_unit,
      charge_standard, result_type, online_handle, handle_window, status
    } = req.body;

    const result = db.prepare(`
      INSERT INTO service_items (name, code, department_id, category, type, description, legal_basis, conditions, required_materials, process_config, time_limit, time_unit, charge_standard, result_type, online_handle, handle_window, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, code, department_id, category, type || 'promise', description, legal_basis,
      conditions,
      required_materials ? JSON.stringify(required_materials) : null,
      process_config ? JSON.stringify(process_config) : null,
      time_limit || 20, time_unit || 'workday', charge_standard, result_type,
      online_handle !== undefined ? online_handle : 1, handle_window, status || 'active'
    );

    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: '事项编码已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const db = getDB();
    const existing = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '服务事项不存在' });
    }

    const {
      name, code, department_id, category, type, description, legal_basis,
      conditions, required_materials, process_config, time_limit, time_unit,
      charge_standard, result_type, online_handle, handle_window, status, sort_order
    } = req.body;

    db.prepare(`
      UPDATE service_items SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        department_id = COALESCE(?, department_id),
        category = COALESCE(?, category),
        type = COALESCE(?, type),
        description = COALESCE(?, description),
        legal_basis = COALESCE(?, legal_basis),
        conditions = COALESCE(?, conditions),
        required_materials = ?,
        process_config = ?,
        time_limit = COALESCE(?, time_limit),
        time_unit = COALESCE(?, time_unit),
        charge_standard = COALESCE(?, charge_standard),
        result_type = COALESCE(?, result_type),
        online_handle = COALESCE(?, online_handle),
        handle_window = COALESCE(?, handle_window),
        status = COALESCE(?, status),
        sort_order = COALESCE(?, sort_order),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(
      name || null, code || null, department_id || null, category || null, type || null,
      description || null, legal_basis || null, conditions || null,
      required_materials ? JSON.stringify(required_materials) : null,
      process_config ? JSON.stringify(process_config) : null,
      time_limit || null, time_unit || null, charge_standard || null, result_type || null,
      online_handle !== undefined ? online_handle : null, handle_window || null,
      status || null, sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const db = getDB();
    const { status } = req.body;
    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    const result = db.prepare(`
      UPDATE service_items SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?
    `).run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '服务事项不存在' });
    }

    res.json({ message: '状态更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
