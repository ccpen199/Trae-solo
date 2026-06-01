import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const qualityData = db.prepare(`
    SELECT dq.*, dc.title as catalog_title, d.name as assignee_department_name
    FROM data_quality dq
    LEFT JOIN data_catalogs dc ON dq.catalog_id = dc.id
    LEFT JOIN departments d ON dq.assignee_department_id = d.id
    ORDER BY dq.checked_at DESC
  `).all();
  res.json(qualityData);
});

router.get('/:id', (req, res) => {
  const quality = db.prepare(`
    SELECT dq.*, dc.title as catalog_title, d.name as assignee_department_name
    FROM data_quality dq
    LEFT JOIN data_catalogs dc ON dq.catalog_id = dc.id
    LEFT JOIN departments d ON dq.assignee_department_id = d.id
    WHERE dq.id = ?
  `).get(req.params.id);
  
  if (!quality) {
    return res.status(404).json({ error: '数据质量记录不存在' });
  }
  
  res.json(quality);
});

router.post('/', (req, res) => {
  const { catalog_id, missing_rate, update_delay, failure_count, issue_description, assignee_department_id, status } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO data_quality (catalog_id, missing_rate, update_delay, failure_count, issue_description, assignee_department_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(catalog_id, missing_rate, update_delay, failure_count, issue_description, assignee_department_id, status || 'normal');
    
    res.json({ id: result.lastInsertRowid, message: '数据质量记录创建成功' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { missing_rate, update_delay, failure_count, issue_description, assignee_department_id, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE data_quality
      SET missing_rate = ?, update_delay = ?, failure_count = ?, issue_description = ?, assignee_department_id = ?, status = ?, checked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(missing_rate, update_delay, failure_count, issue_description, assignee_department_id, status, id);
    
    res.json({ message: '数据质量记录更新成功' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/assign', (req, res) => {
  const { id } = req.params;
  const { assignee_department_id } = req.body;
  
  try {
    db.prepare(`
      UPDATE data_quality
      SET assignee_department_id = ?, status = 'warning'
      WHERE id = ?
    `).run(assignee_department_id, id);
    
    res.json({ message: '问题已派发' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
