import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { keyword, department_id, category, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = ["si.status = 'active'"];
    const params = [];

    if (keyword) {
      conditions.push('(si.name LIKE ? OR si.code LIKE ? OR si.description LIKE ? OR d.name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (department_id) {
      conditions.push('si.department_id = ?');
      params.push(department_id);
    }
    if (category) {
      conditions.push('si.category = ?');
      params.push(category);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const total = db.prepare(`
      SELECT COUNT(*) as cnt FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      ${where}
    `).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT si.id, si.name, si.code, si.category, si.type, si.description,
        si.time_limit, si.time_unit, si.online_handle, si.result_type,
        d.name as department_name
      FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      ${where}
      ORDER BY si.sort_order ASC, si.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/guide', (req, res) => {
  try {
    const { scenario } = req.query;
    if (!scenario) {
      return res.status(400).json({ error: '请提供办事场景关键词' });
    }

    const db = getDB();
    const keywords = scenario.split(/[,，\s]+/).filter(Boolean);

    const conditions = ["si.status = 'active'"];
    const params = [];

    const keywordConditions = [];
    for (const kw of keywords) {
      keywordConditions.push('(si.name LIKE ? OR si.description LIKE ? OR si.category LIKE ? OR si.conditions LIKE ?)');
      params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`, `%${kw}%`);
    }
    conditions.push(`(${keywordConditions.join(' OR ')})`);

    const where = 'WHERE ' + conditions.join(' AND ');

    const list = db.prepare(`
      SELECT si.id, si.name, si.code, si.category, si.type, si.description,
        si.time_limit, si.time_unit, d.name as department_name
      FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      ${where}
      ORDER BY si.sort_order ASC
      LIMIT 10
    `).all(...params);

    res.json({ list, scenario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/precheck', (req, res) => {
  try {
    const db = getDB();
    const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: '服务事项不存在' });
    }

    const materials = db.prepare('SELECT * FROM materials WHERE item_id = ?').all(req.params.id);

    const requiredMaterials = item.required_materials ? JSON.parse(item.required_materials) : [];

    const checklist = materials.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      is_required: m.is_required,
      description: m.description,
      format_requirement: m.format_requirement,
      source_channel: m.source_channel,
      status: 'unsubmitted'
    }));

    for (const reqMat of requiredMaterials) {
      const found = checklist.find(m => m.name === reqMat || m.name.includes(reqMat));
      if (!found) {
        checklist.push({
          name: reqMat,
          is_required: 1,
          status: 'unsubmitted'
        });
      }
    }

    res.json({
      item_id: item.id,
      item_name: item.name,
      conditions: item.conditions,
      materials: checklist
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
