import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/my', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user!.id);
    res.json({ success: true, data: { enterprise } });
  } catch (error) {
    console.error('获取企业信息错误:', error);
    res.status(500).json({ success: false, error: '获取企业信息失败' });
  }
});

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { industry, region, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE status = ?';
    const params: any[] = ['approved'];

    if (industry) {
      whereClause += ' AND industry = ?';
      params.push(industry);
    }
    if (region) {
      whereClause += ' AND region LIKE ?';
      params.push(`%${region}%`);
    }

    const enterprises = db.prepare(`
      SELECT * FROM enterprises
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM enterprises ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: enterprises,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取企业列表错误:', error);
    res.status(500).json({ success: false, error: '获取企业列表失败' });
  }
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id);

    if (!enterprise) {
      res.status(404).json({ success: false, error: '企业不存在' });
      return;
    }

    const capabilities = db.prepare('SELECT * FROM capabilities WHERE enterprise_id = ?').all(id);
    const products = db.prepare('SELECT * FROM products WHERE enterprise_id = ?').all(id);

    res.json({
      success: true,
      data: {
        enterprise,
        capabilities,
        products,
      },
    });
  } catch (error) {
    console.error('获取企业详情错误:', error);
    res.status(500).json({ success: false, error: '获取企业详情失败' });
  }
});

router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { name, credit_code, industry, scale, region, address, contact_person, contact_phone, qualifications } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: '企业名称不能为空' });
      return;
    }

    const existing = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(req.user!.id);
    if (existing) {
      res.status(400).json({ success: false, error: '已创建企业信息' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO enterprises (user_id, name, credit_code, industry, scale, region, address, contact_person, contact_phone, qualifications, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      req.user!.id,
      name,
      credit_code || null,
      industry || null,
      scale || null,
      region || null,
      address || null,
      contact_person || null,
      contact_phone || null,
      qualifications ? JSON.stringify(qualifications) : null
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '企业信息创建成功，等待审核',
      },
    });
  } catch (error) {
    console.error('创建企业信息错误:', error);
    res.status(500).json({ success: false, error: '创建企业信息失败' });
  }
});

router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, credit_code, industry, scale, region, address, contact_person, contact_phone, qualifications } = req.body;

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id) as any;
    if (!enterprise) {
      res.status(404).json({ success: false, error: '企业不存在' });
      return;
    }

    if (enterprise.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权修改此企业信息' });
      return;
    }

    db.prepare(`
      UPDATE enterprises SET
        name = ?, credit_code = ?, industry = ?, scale = ?, region = ?,
        address = ?, contact_person = ?, contact_phone = ?, qualifications = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || enterprise.name,
      credit_code || enterprise.credit_code,
      industry || enterprise.industry,
      scale || enterprise.scale,
      region || enterprise.region,
      address || enterprise.address,
      contact_person || enterprise.contact_person,
      contact_phone || enterprise.contact_phone,
      qualifications ? JSON.stringify(qualifications) : enterprise.qualifications,
      id
    );

    res.json({ success: true, message: '企业信息更新成功' });
  } catch (error) {
    console.error('更新企业信息错误:', error);
    res.status(500).json({ success: false, error: '更新企业信息失败' });
  }
});

router.post('/capabilities', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { name, category, description, equipment, capacity, certifications, region } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: '能力名称不能为空' });
      return;
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(req.user!.id) as any;
    if (!enterprise) {
      res.status(400).json({ success: false, error: '请先创建企业信息' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO capabilities (enterprise_id, name, category, description, equipment, capacity, certifications, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      enterprise.id,
      name,
      category || null,
      description || null,
      equipment || null,
      capacity || null,
      certifications ? JSON.stringify(certifications) : null,
      region || null
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '能力信息创建成功',
      },
    });
  } catch (error) {
    console.error('创建能力信息错误:', error);
    res.status(500).json({ success: false, error: '创建能力信息失败' });
  }
});

router.get('/capabilities/my', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(req.user!.id) as any;
    if (!enterprise) {
      res.json({ success: true, data: { list: [] } });
      return;
    }

    const capabilities = db.prepare('SELECT * FROM capabilities WHERE enterprise_id = ?').all(enterprise.id);
    res.json({ success: true, data: { list: capabilities } });
  } catch (error) {
    console.error('获取能力列表错误:', error);
    res.status(500).json({ success: false, error: '获取能力列表失败' });
  }
});

export default router;
