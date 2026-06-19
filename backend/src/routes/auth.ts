import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import { z } from 'zod';
import { getDb } from '../database.js';
import { generateToken, authMiddleware, requireRoles, type AuthRequest } from '../middleware.js';
import type { User } from '../types.js';

const router = express.Router();

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.enum(['recycler', 'producer', 'inspector', 'carrier']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  enterprise: z.object({
    company_name: z.string().min(2),
    unified_social_credit_code: z.string().length(18),
    legal_person: z.string().min(2),
    legal_person_id: z.string().length(18),
    registered_address: z.string().min(5),
    business_license_url: z.string().url(),
    qualification_cert_url: z.string().url().optional(),
    waste_management_license_url: z.string().url().optional(),
    region: z.string().min(2)
  })
});

const LoginSchema = z.object({
  username: z.string(),
  password: z.string()
});

router.post('/register', async (req, res) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const db = getDb();

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(data.username);
    if (existingUser) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    const existingCredit = db.prepare('SELECT id FROM enterprises WHERE unified_social_credit_code = ?').get(data.enterprise.unified_social_credit_code);
    if (existingCredit) {
      res.status(400).json({ error: '该统一社会信用代码已注册' });
      return;
    }

    const userId = uuidv4();
    const enterpriseId = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 12);

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, username, password_hash, role, email, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, data.username, passwordHash, data.role, data.email || null, data.phone || null);

      db.prepare(`
        INSERT INTO enterprises (
          id, user_id, company_name, unified_social_credit_code, legal_person, 
          legal_person_id, registered_address, business_license_url, 
          qualification_cert_url, waste_management_license_url, region
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        enterpriseId, userId,
        data.enterprise.company_name,
        data.enterprise.unified_social_credit_code,
        data.enterprise.legal_person,
        data.enterprise.legal_person_id,
        data.enterprise.registered_address,
        data.enterprise.business_license_url,
        data.enterprise.qualification_cert_url || null,
        data.enterprise.waste_management_license_url || null,
        data.enterprise.region
      );

      if (data.role === 'recycler') {
        db.prepare(`
          INSERT INTO recycler_profiles (id, enterprise_id, recycling_categories, annual_capacity, main_business_regions)
          VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), enterpriseId, '[]', 0, JSON.stringify([data.enterprise.region]));
      } else if (data.role === 'producer') {
        db.prepare(`
          INSERT INTO producer_profiles (id, enterprise_id, industry_type, annual_waste_volume, factory_locations, waste_types)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), enterpriseId, '制造业', 0, JSON.stringify([data.enterprise.region]), '[]');
      } else if (data.role === 'inspector') {
        db.prepare(`
          INSERT INTO inspector_profiles (id, enterprise_id, cma_cert_no, cma_valid_until, inspection_scope)
          VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), enterpriseId, 'CMA-' + Date.now(), '2028-12-31', '废金属、废塑料、二手设备检测');
      } else if (data.role === 'carrier') {
        db.prepare(`
          INSERT INTO carrier_profiles (id, enterprise_id, carrier_license_no, vehicle_count, service_regions, api_provider)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), enterpriseId, 'LIC-' + Date.now(), 10, JSON.stringify([data.enterprise.region]), '自有');
      }
    });

    transaction();

    const token = generateToken(userId, data.role);
    res.status(201).json({
      message: '注册成功，请等待企业认证审核',
      token,
      user: { id: userId, username: data.username, role: data.role }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: '数据验证失败', details: err.errors });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = LoginSchema.parse(req.body);
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(data.username) as User | undefined;
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(user.id) as any;
    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        phone: user.phone
      },
      enterprise
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: '数据验证失败', details: err.errors });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user!.id) as any;
  
  let profile = null;
  if (enterprise) {
    if (req.user!.role === 'recycler') {
      profile = db.prepare('SELECT * FROM recycler_profiles WHERE enterprise_id = ?').get(enterprise.id);
    } else if (req.user!.role === 'producer') {
      profile = db.prepare('SELECT * FROM producer_profiles WHERE enterprise_id = ?').get(enterprise.id);
    } else if (req.user!.role === 'inspector') {
      profile = db.prepare('SELECT * FROM inspector_profiles WHERE enterprise_id = ?').get(enterprise.id);
    } else if (req.user!.role === 'carrier') {
      profile = db.prepare('SELECT * FROM carrier_profiles WHERE enterprise_id = ?').get(enterprise.id);
    }
  }

  res.json({
    user: {
      id: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      email: req.user!.email,
      phone: req.user!.phone,
      created_at: req.user!.created_at
    },
    enterprise,
    profile
  });
});

router.put('/enterprise', authMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const { 
      company_name, registered_address, region,
      qualification_cert_url, waste_management_license_url,
      recycling_categories, annual_capacity, main_business_regions,
      industry_type, annual_waste_volume, factory_locations, waste_types
    } = req.body;

    db.prepare(`
      UPDATE enterprises 
      SET company_name = COALESCE(?, company_name),
          registered_address = COALESCE(?, registered_address),
          region = COALESCE(?, region),
          qualification_cert_url = COALESCE(?, qualification_cert_url),
          waste_management_license_url = COALESCE(?, waste_management_license_url),
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      company_name || null, registered_address || null, region || null,
      qualification_cert_url || null, waste_management_license_url || null,
      req.user!.id
    );

    if (req.user!.role === 'recycler' && (recycling_categories || annual_capacity || main_business_regions)) {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(req.user!.id) as any;
      db.prepare(`
        UPDATE recycler_profiles
        SET recycling_categories = COALESCE(?, recycling_categories),
            annual_capacity = COALESCE(?, annual_capacity),
            main_business_regions = COALESCE(?, main_business_regions),
            updated_at = datetime('now')
        WHERE enterprise_id = ?
      `).run(recycling_categories || null, annual_capacity || null, main_business_regions || null, enterprise.id);
    }

    if (req.user!.role === 'producer' && (industry_type || annual_waste_volume || factory_locations || waste_types)) {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(req.user!.id) as any;
      db.prepare(`
        UPDATE producer_profiles
        SET industry_type = COALESCE(?, industry_type),
            annual_waste_volume = COALESCE(?, annual_waste_volume),
            factory_locations = COALESCE(?, factory_locations),
            waste_types = COALESCE(?, waste_types),
            updated_at = datetime('now')
        WHERE enterprise_id = ?
      `).run(industry_type || null, annual_waste_volume || null, factory_locations || null, waste_types || null, enterprise.id);
    }

    res.json({ message: '企业信息更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/enterprises', authMiddleware, requireRoles('admin'), (req, res) => {
  const db = getDb();
  const { status, page = '1', pageSize = '20' } = req.query;
  
  let whereClause = '';
  const params: any[] = [];
  
  if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
    whereClause = 'WHERE verification_status = ?';
    params.push(status);
  }

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  params.push(parseInt(pageSize as string), offset);

  const enterprises = db.prepare(`
    SELECT e.*, u.username, u.role, u.email, u.phone
    FROM enterprises e
    LEFT JOIN users u ON e.user_id = u.id
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];

  const total = db.prepare(`SELECT COUNT(*) as count FROM enterprises ${whereClause}`).get(...(params.slice(0, params.length - 2))) as any;

  res.json({
    enterprises,
    total: total.count,
    page: parseInt(page as string),
    pageSize: parseInt(pageSize as string)
  });
});

router.post('/admin/enterprises/:id/verify', authMiddleware, requireRoles('admin'), (req, res) => {
  try {
    const { status, remark } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: '无效的审核状态' });
      return;
    }

    const db = getDb();
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.id) as any;
    if (!enterprise) {
      res.status(404).json({ error: '企业不存在' });
      return;
    }

    db.prepare(`
      UPDATE enterprises 
      SET verification_status = ?, verified_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(status, req.params.id);

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuidv4(), enterprise.user_id, 'system',
      status === 'approved' ? '企业认证审核通过' : '企业认证审核未通过',
      status === 'approved' ? '您的企业认证已通过审核，可以开始发布商机了。' : `审核未通过，原因：${remark || '资料不完整'}，请补充资料后重新提交。`
    );

    res.json({ message: '审核完成' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
