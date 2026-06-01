import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticate } from '../middleware/auth';

const router = Router();

const PARTS = [
  { code: 'front_bumper', name: '前保险杠' },
  { code: 'rear_bumper', name: '后保险杠' },
  { code: 'left_front_door', name: '左前门' },
  { code: 'right_front_door', name: '右前门' },
  { code: 'left_rear_door', name: '左后门' },
  { code: 'right_rear_door', name: '右后门' },
  { code: 'hood', name: '引擎盖' },
  { code: 'trunk', name: '后备箱盖' },
  { code: 'left_front_fender', name: '左前翼子板' },
  { code: 'right_front_fender', name: '右前翼子板' },
  { code: 'left_rear_fender', name: '左后翼子板' },
  { code: 'right_rear_fender', name: '右后翼子板' },
  { code: 'roof', name: '车顶' },
  { code: 'windshield', name: '前挡风玻璃' },
  { code: 'rear_windshield', name: '后挡风玻璃' },
  { code: 'left_headlight', name: '左前大灯' },
  { code: 'right_headlight', name: '右前大灯' },
  { code: 'left_taillight', name: '左后尾灯' },
  { code: 'right_taillight', name: '右后尾灯' },
  { code: 'grille', name: '中网' },
  { code: 'left_mirror', name: '左后视镜' },
  { code: 'right_mirror', name: '右后视镜' },
];

const PRICE_DATA: Record<string, number> = {
  front_bumper: 1500, rear_bumper: 1200, left_front_door: 2000,
  right_front_door: 2000, left_rear_door: 1800, right_rear_door: 1800,
  hood: 2500, trunk: 2200, left_front_fender: 800, right_front_fender: 800,
  left_rear_fender: 700, right_rear_fender: 700, roof: 3000,
  windshield: 1800, rear_windshield: 1500, left_headlight: 2000,
  right_headlight: 2000, left_taillight: 1200, right_taillight: 1200,
  grille: 800, left_mirror: 600, right_mirror: 600,
};

router.get('/parts', (req, res) => {
  res.json(PARTS);
});

router.get('/price/:partCode', authenticate, (req, res) => {
  const price = PRICE_DATA[req.params.partCode] || 0;
  res.json({ part: req.params.partCode, price });
});

router.get('/:taskId', authenticate, (req, res) => {
  const { version } = req.query;

  let query = `
    SELECT l.*, u.name as creator_name
    FROM loss_items l
    LEFT JOIN users u ON l.created_by = u.id
    WHERE l.task_id = ?
  `;
  const params: any[] = [req.params.taskId];

  if (version) {
    query += ' AND l.version = ?';
    params.push(version);
  }

  query += ' ORDER BY l.created_at DESC';

  const items = db.prepare(query).all(...params);
  res.json(items);
});

router.get('/:taskId/versions', authenticate, (req, res) => {
  const versions = db.prepare(`
    SELECT DISTINCT version FROM loss_items WHERE task_id = ? ORDER BY version DESC
  `).all(req.params.taskId) as { version: number }[];

  res.json(versions.map(v => v.version));
});

router.post('/:taskId', authenticate, (req, res) => {
  const taskId = req.params.taskId;
  const items = req.body.items as any[];

  const currentVersion = db.prepare(`
    SELECT MAX(version) as max_version FROM loss_items WHERE task_id = ?
  `).get(taskId) as { max_version: number | null };

  const newVersion = (currentVersion.max_version || 0) + 1;

  let totalAmount = 0;
  const results = [];

  for (const item of items) {
    const id = uuidv4();
    const basePrice = PRICE_DATA[item.part] || 0;
    const accessoryPrice = item.accessory ? 500 : 0;
    const total = basePrice + accessoryPrice + (item.labor_fee || 0) - (item.residual_value || 0);

    totalAmount += total;

    db.prepare(`
      INSERT INTO loss_items (
        id, task_id, version, part, part_name, accessory, accessory_name,
        labor_fee, residual_value, total_amount, price_source, manual_adjust_reason, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      taskId,
      newVersion,
      item.part,
      item.part_name || PARTS.find(p => p.code === item.part)?.name || item.part,
      item.accessory || null,
      item.accessory_name || null,
      item.labor_fee || 0,
      item.residual_value || 0,
      total,
      item.price_source || 'system',
      item.manual_adjust_reason || null,
      item.remarks || null,
      req.user!.id
    );

    const savedItem = db.prepare('SELECT * FROM loss_items WHERE id = ?').get(id);
    results.push(savedItem);
  }

  db.prepare(`
    INSERT INTO assessment_versions (id, task_id, version, total_amount, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, newVersion, totalAmount, 'pending', req.user!.id);

  db.prepare(`
    UPDATE claim_tasks SET status = 'assessing', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(taskId);

  res.status(201).json({ items: results, version: newVersion, total_amount: totalAmount });
});

router.put('/:itemId', authenticate, (req, res) => {
  const { labor_fee, residual_value, manual_adjust_reason, remarks } = req.body;

  const item = db.prepare('SELECT * FROM loss_items WHERE id = ?').get(req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: '损失项目不存在' });
  }

  const itemData = item as any;
  const basePrice = PRICE_DATA[itemData.part] || 0;
  const accessoryPrice = itemData.accessory ? 500 : 0;
  const total = basePrice + accessoryPrice + (labor_fee || itemData.labor_fee) - (residual_value || itemData.residual_value);

  db.prepare(`
    UPDATE loss_items
    SET labor_fee = ?, residual_value = ?, total_amount = ?,
        manual_adjust_reason = ?, remarks = ?, price_source = 'manual'
    WHERE id = ?
  `).run(
    labor_fee || itemData.labor_fee,
    residual_value || itemData.residual_value,
    total,
    manual_adjust_reason || null,
    remarks || null,
    req.params.itemId
  );

  const updatedItem = db.prepare('SELECT * FROM loss_items WHERE id = ?').get(req.params.itemId);
  res.json(updatedItem);
});

router.delete('/:itemId', authenticate, (req, res) => {
  db.prepare('DELETE FROM loss_items WHERE id = ?').run(req.params.itemId);
  res.json({ success: true });
});

export default router;
