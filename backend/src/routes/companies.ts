import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const total = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as any).count;
    const companies = db.prepare(
      `SELECT c.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM companies c JOIN users u ON c.user_id = u.id
       ORDER BY c.contract_fulfillment_rate DESC LIMIT ? OFFSET ?`
    ).all(limit, offset);

    res.json({ success: true, data: { list: companies, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取装修公司列表失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const company = db.prepare(
      `SELECT c.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM companies c JOIN users u ON c.user_id = u.id WHERE c.id = ?`
    ).get(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: '装修公司不存在' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取装修公司信息失败' });
  }
});

router.put('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { license_number, license_verified, inspection_count, contract_fulfillment_rate, description, name, phone, email } = req.body;

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id) as any;
    if (!company) {
      return res.status(404).json({ success: false, error: '装修公司不存在' });
    }

    db.prepare(
      `UPDATE companies SET license_number = ?, license_verified = ?, inspection_count = ?, contract_fulfillment_rate = ?, description = ? WHERE id = ?`
    ).run(
      license_number ?? company.license_number,
      license_verified ?? company.license_verified,
      inspection_count ?? company.inspection_count,
      contract_fulfillment_rate ?? company.contract_fulfillment_rate,
      description ?? company.description,
      req.params.id
    );

    if (name || phone || email) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(company.user_id) as any;
      db.prepare("UPDATE users SET name = ?, phone = ?, email = ?, updated_at = datetime('now') WHERE id = ?").run(
        name ?? user.name,
        phone ?? user.phone,
        email ?? user.email,
        company.user_id
      );
    }

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新装修公司信息失败' });
  }
});

router.put('/:id/verify-license', (req: AuthenticatedRequest, res) => {
  try {
    const { verified } = req.body;
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: '装修公司不存在' });
    }

    db.prepare('UPDATE companies SET license_verified = ? WHERE id = ?').run(verified ? 1 : 0, req.params.id);
    res.json({ success: true, data: { id: req.params.id, license_verified: verified ? 1 : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: '验证执照失败' });
  }
});

router.get('/:id/inspections', (req: AuthenticatedRequest, res) => {
  try {
    const inspections = db.prepare(
      `SELECT it.* FROM inspection_tasks it
       JOIN projects p ON it.project_id = p.id
       WHERE p.company_id = (SELECT user_id FROM companies WHERE id = ?)
       ORDER BY it.scheduled_date DESC`
    ).all(req.params.id);
    res.json({ success: true, data: inspections });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取验收记录失败' });
  }
});

export default router;
