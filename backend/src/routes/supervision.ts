import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware';
import { AISupervisionRecord, DecorationContract } from '../types';

const router = Router();

const riskTypes = ['未戴安全帽', '材料混用', '违规操作', '消防隐患', '其他'];
const riskLevels = ['low', 'medium', 'high'];

router.get('/generate/:contractId', authMiddleware, roleMiddleware('supervisor', 'store_manager'), (req, res) => {
  const { contractId } = req.params;
  const contract = db.prepare('SELECT * FROM decoration_contracts WHERE id = ?').get(contractId) as DecorationContract | undefined;

  if (!contract) {
    return res.status(404).json({ error: '合同不存在' });
  }

  const now = new Date();
  const detectionTime = now.toISOString();
  const riskType = riskTypes[Math.floor(Math.random() * riskTypes.length)];
  const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  const descriptions: Record<string, string> = {
    '未戴安全帽': '检测到施工现场有2名工人未佩戴安全帽，存在安全隐患',
    '材料混用': '发现水泥堆放区域混杂了不同品牌的产品，可能影响工程质量',
    '违规操作': '发现高空作业未系安全绳，违反安全操作规程',
    '消防隐患': '检测到易燃材料堆放区附近有明火源，消防器材配备不足',
    '其他': '检测到施工现场存在其他安全风险，请及时处理',
  };

  const id = uuidv4();
  db.prepare(`
    INSERT INTO ai_supervision_records (
      id, contract_id, camera_id, detection_time, risk_type, risk_level,
      description, screenshot_url, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'detected', ?)
  `).run(
    id,
    contractId,
    `CAM-${contractId.substr(0, 8).toUpperCase()}`,
    detectionTime,
    riskType,
    riskLevel,
    descriptions[riskType],
    `/screenshots/${id}.jpg`,
    now.toISOString()
  );

  const record = db.prepare(`
    SELECT r.*, c.contract_no, o.real_name as owner_name, s.name as store_name
    FROM ai_supervision_records r
    LEFT JOIN decoration_contracts c ON r.contract_id = c.id
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE r.id = ?
  `).get(id);

  res.status(201).json(record);
});

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { contract_id, status, risk_level } = req.query;
  let query = `
    SELECT r.*, c.contract_no, o.real_name as owner_name, s.name as store_name,
      h.real_name as handler_name
    FROM ai_supervision_records r
    LEFT JOIN decoration_contracts c ON r.contract_id = c.id
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN stores s ON c.store_id = s.id
    LEFT JOIN users h ON r.handled_by = h.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (req.user!.role === 'owner') {
    query += ' AND c.owner_id = ?';
    params.push(req.user!.id);
  } else if (req.user!.role === 'store_manager') {
    const user = db.prepare('SELECT store_id FROM users WHERE id = ?').get(req.user!.id) as any;
    if (user?.store_id) {
      query += ' AND c.store_id = ?';
      params.push(user.store_id);
    }
  }

  if (contract_id) {
    query += ' AND r.contract_id = ?';
    params.push(contract_id);
  }
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (risk_level) {
    query += ' AND r.risk_level = ?';
    params.push(risk_level);
  }

  query += ' ORDER BY r.detection_time DESC';
  const records = db.prepare(query).all(...params);
  res.json(records);
});

router.post('/:id/handle', authMiddleware, roleMiddleware('supervisor', 'store_manager'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { action, remark } = req.body;

  const record = db.prepare('SELECT * FROM ai_supervision_records WHERE id = ?').get(id) as AISupervisionRecord | undefined;
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const now = new Date().toISOString();
  const status = action === 'resolve' ? 'resolved' : 'processing';

  db.prepare(`
    UPDATE ai_supervision_records
    SET status = ?, handled_by = ?, handled_at = ?, description = ? || '\\n处理备注：' || ?
    WHERE id = ?
  `).run(status, req.user!.id, now, record.description, remark || '已处理', id);

  res.json({ message: '处理完成', status });
});

router.get('/stats', authMiddleware, (req: AuthRequest, res) => {
  let contractFilter = '';
  const params: any[] = [];

  if (req.user!.role === 'owner') {
    contractFilter = ' AND c.owner_id = ?';
    params.push(req.user!.id);
  } else if (req.user!.role === 'store_manager') {
    const user = db.prepare('SELECT store_id FROM users WHERE id = ?').get(req.user!.id) as any;
    if (user?.store_id) {
      contractFilter = ' AND c.store_id = ?';
      params.push(user.store_id);
    }
  }

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN r.status = 'detected' THEN 1 ELSE 0 END) as detected,
      SUM(CASE WHEN r.status = 'processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN r.risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
      SUM(CASE WHEN r.risk_level = 'medium' THEN 1 ELSE 0 END) as medium_risk,
      SUM(CASE WHEN r.risk_level = 'low' THEN 1 ELSE 0 END) as low_risk
    FROM ai_supervision_records r
    LEFT JOIN decoration_contracts c ON r.contract_id = c.id
    WHERE 1=1 ${contractFilter}
  `).get(...params);

  res.json(stats);
});

export default router;
