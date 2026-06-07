import express from 'express';
import db from '../config/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, keyword, category, department } = req.query;

  try {
    let query = 'SELECT * FROM service_items WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      query += ' AND (name LIKE ? OR national_code LIKE ? OR local_code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params) as any;
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const items = db.prepare(query).all(...params);

    res.json({
      code: 200,
      data: {
        list: items,
        total: total.count,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取服务事项列表失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
    
    if (!item) {
      return res.status(404).json({ code: 404, message: '事项不存在' });
    }

    const materials = db.prepare('SELECT * FROM materials WHERE item_id = ?').all(req.params.id);

    res.json({
      code: 200,
      data: {
        ...item,
        materials
      }
    });
  } catch (error) {
    logger.error('获取服务事项详情失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const { nationalCode, localCode, name, department, category, processingTime, description, materials } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO service_items (national_code, local_code, name, department, category, 
                                  granularity, processing_time, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nationalCode, localCode, name, department, category, '最小颗粒度', processingTime, description, 1);

    if (materials && materials.length > 0) {
      const materialStmt = db.prepare(`
        INSERT INTO materials (item_id, name, format_requirements, required, ocr_enabled)
        VALUES (?, ?, ?, ?, ?)
      `);
      materials.forEach((m: any) => {
        materialStmt.run(result.lastInsertRowid, m.name, m.formatRequirements, m.required ? 1 : 0, m.ocrEnabled ? 1 : 0);
      });
    }

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '创建服务事项', '事项管理', name);

    logger.info(`服务事项创建成功: ${name}`);
    res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    logger.error('创建服务事项失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/standard/mapping', authenticateToken, requireAdmin, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT id, national_code, local_code, name, department 
      FROM service_items 
      WHERE national_code IS NOT NULL
      ORDER BY department
    `).all();

    const mappingStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN national_code IS NOT NULL AND national_code != '' THEN 1 ELSE 0 END) as mapped,
        SUM(CASE WHEN national_code IS NULL OR national_code = '' THEN 1 ELSE 0 END) as unmapped
      FROM service_items
    `).get() as any;

    res.json({
      code: 200,
      data: {
        statistics: {
          total: mappingStats.total,
          mapped: mappingStats.mapped,
          unmapped: mappingStats.unmapped,
          mappingRate: ((mappingStats.mapped / mappingStats.total) * 100).toFixed(2) + '%'
        },
        items
      }
    });
  } catch (error) {
    logger.error('获取事项标准化映射失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/standard/map', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const { itemId, nationalCode } = req.body;

  try {
    db.prepare(`
      UPDATE service_items SET national_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nationalCode, itemId);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '国家事项编码映射', '标准化引擎', `事项ID:${itemId}, 编码:${nationalCode}`);

    res.json({ code: 200, message: '映射成功' });
  } catch (error) {
    logger.error('事项编码映射失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/categories/list', authenticateToken, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category as name, COUNT(*) as count 
      FROM service_items 
      GROUP BY category
    `).all();

    const departments = db.prepare(`
      SELECT DISTINCT department as name, COUNT(*) as count 
      FROM service_items 
      GROUP BY department
    `).all();

    res.json({
      code: 200,
      data: { categories, departments }
    });
  } catch (error) {
    logger.error('获取分类列表失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

export default router;
