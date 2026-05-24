import { Router, Response } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['risk', 'operation']), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND lv.status = ?';
      params.push(status);
    }

    const verifications = await allQuery(
      `SELECT lv.*, u.real_name as user_name, u.phone as user_phone, u.id_card 
       FROM license_verifications lv 
       LEFT JOIN users u ON lv.user_id = u.id 
       ${whereClause} 
       ORDER BY lv.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const countResult = await getQuery(`SELECT COUNT(*) as total FROM license_verifications lv ${whereClause}`, params);
    
    res.json({
      code: 200,
      message: 'success',
      data: verifications,
      total: countResult?.total || 0
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const verification = await getQuery(
      'SELECT * FROM license_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [req.user!.id]
    );
    res.json({ code: 200, message: 'success', data: verification });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { license_number, license_type, issue_date, expiry_date } = req.body;
    
    const existing = await getQuery('SELECT id FROM license_verifications WHERE user_id = ? AND status = ?', [req.user!.id, 'pending']);
    if (existing) {
      return res.json({ code: 400, message: '已有审核中的申请，请耐心等待' });
    }

    const result = await runQuery(
      `INSERT INTO license_verifications (user_id, license_number, license_type, issue_date, expiry_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user!.id, license_number, license_type || 'C1', issue_date || null, expiry_date || null, 'pending']
    );

    await runQuery('UPDATE users SET license_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [license_number, req.user!.id]);

    res.json({ code: 200, message: '提交成功，等待审核', data: { id: result.lastID } });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.put('/:id/review', authMiddleware, roleMiddleware(['risk', 'operation']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, review_remark } = req.body;
    const verification = await getQuery('SELECT * FROM license_verifications WHERE id = ?', [req.params.id]);
    
    if (!verification) {
      return res.json({ code: 404, message: '审核记录不存在' });
    }
    if (verification.status !== 'pending') {
      return res.json({ code: 400, message: '该申请已审核' });
    }

    const now = new Date().toISOString();
    await runQuery(
      `UPDATE license_verifications SET status = ?, reviewer_id = ?, review_remark = ?, reviewed_at = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, req.user!.id, review_remark || '', now, req.params.id]
    );

    if (status === 'approved') {
      await runQuery('UPDATE users SET license_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [verification.user_id]);
    }

    res.json({ code: 200, message: '审核完成' });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
