import express from 'express';
import db from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 10, status } = req.query;

  try {
    let query = `
      SELECT a.*, i.name as item_name, i.department 
      FROM applications a
      LEFT JOIN service_items i ON a.item_id = i.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [req.user?.id];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    const total = db.prepare(query.replace('SELECT a.*, i.name as item_name, i.department', 'SELECT COUNT(*) as count')).get(...params) as any;
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const applications = db.prepare(query).all(...params);

    res.json({
      code: 200,
      data: {
        list: applications,
        total: total.count,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取办件列表失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const application = db.prepare(`
      SELECT a.*, i.name as item_name, i.department, i.processing_time
      FROM applications a
      LEFT JOIN service_items i ON a.item_id = i.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(req.params.id, req.user?.id);

    if (!application) {
      return res.status(404).json({ code: 404, message: '办件不存在' });
    }

    const nodes = db.prepare('SELECT * FROM application_nodes WHERE application_id = ? ORDER BY id').all(req.params.id);
    const materials = db.prepare('SELECT * FROM application_materials WHERE application_id = ?').all(req.params.id);

    res.json({
      code: 200,
      data: {
        ...application,
        nodes,
        materials
      }
    });
  } catch (error) {
    logger.error('获取办件详情失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { itemId, itemName, materials } = req.body;

  if (!itemId) {
    return res.status(400).json({ code: 400, message: '请选择服务事项' });
  }

  try {
    const applicationNo = 'LST' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const result = db.prepare(`
      INSERT INTO applications (application_no, user_id, item_id, item_name, status, current_node)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(applicationNo, req.user?.id, itemId, itemName, 'pending', '提交申请');

    const nodes = [
      { name: '提交申请', type: 'start', department: '系统' },
      { name: '材料预审', type: 'review', department: '受理部门' },
      { name: '部门审批', type: 'approve', department: '审批部门' },
      { name: '办结', type: 'end', department: '系统' }
    ];

    const nodeStmt = db.prepare(`
      INSERT INTO application_nodes (application_id, node_name, node_type, department, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    nodes.forEach((node, index) => {
      nodeStmt.run(
        result.lastInsertRowid, 
        node.name, 
        node.type, 
        node.department, 
        index === 0 ? 'completed' : 'pending'
      );
    });

    if (materials && materials.length > 0) {
      const materialStmt = db.prepare(`
        INSERT INTO application_materials (application_id, material_name, file_url, review_status)
        VALUES (?, ?, ?, ?)
      `);
      materials.forEach((m: any) => {
        materialStmt.run(result.lastInsertRowid, m.name, m.url || '', 'pending');
      });
    }

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '提交办件申请', '办件中心', `事项: ${itemName}, 办件号: ${applicationNo}`);

    logger.info(`办件提交成功: ${applicationNo}`);
    res.json({ 
      code: 200, 
      message: '申请提交成功', 
      data: { applicationId: result.lastInsertRowid, applicationNo } 
    });
  } catch (error) {
    logger.error('提交办件失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/:id/evaluate', authenticateToken, (req: AuthRequest, res) => {
  const { rating, comment } = req.body;

  try {
    db.prepare(`
      UPDATE applications SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(rating, comment, req.params.id, req.user?.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '办件评价', '办件中心', `评分: ${rating}`);

    res.json({ code: 200, message: '评价成功' });
  } catch (error) {
    logger.error('办件评价失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/material/pre-review', authenticateToken, (req: AuthRequest, res) => {
  const { filename, fileSize, fileType } = req.body;

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024;

  const issues: string[] = [];

  if (!allowedTypes.includes(fileType)) {
    issues.push('文件格式不支持，仅支持 PDF、JPG、PNG 格式');
  }

  if (fileSize > maxSize) {
    issues.push('文件大小超过 10MB 限制');
  }

  if (!filename || filename.trim() === '') {
    issues.push('文件名为空');
  }

  const result = {
    passed: issues.length === 0,
    issues,
    suggestions: [
      '请确保文件清晰可辨',
      'PDF 文件建议使用标准 A4 页面大小',
      '图片建议分辨率不低于 300DPI'
    ]
  };

  db.prepare(`
    INSERT INTO operation_logs (user_id, action, module, detail)
    VALUES (?, ?, ?, ?)
  `).run(req.user?.id, '材料智能预审', '材料预审', `文件: ${filename}, 结果: ${result.passed ? '通过' : '不通过'}`);

  res.json({
    code: 200,
    data: result
  });
});

export default router;
