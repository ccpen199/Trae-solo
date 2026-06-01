import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { logOperation } from '../security.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tax_service_secret_key_2024';

router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const appeals = db.prepare(`
      SELECT a.*, i.income_type, i.payer_name, i.income_amount
      FROM appeals a
      LEFT JOIN income_details i ON a.income_detail_id = i.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).all(decoded.userId);
    
    res.json({
      success: true,
      data: appeals
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const appeal = db.prepare(`
      SELECT a.*, i.income_type, i.payer_name, i.income_amount, i.tax_withheld
      FROM appeals a
      LEFT JOIN income_details i ON a.income_detail_id = i.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(req.params.id, decoded.userId) as any;
    
    if (!appeal) {
      res.status(404).json({ success: false, error: '申诉记录不存在' });
      return;
    }
    
    res.json({
      success: true,
      data: appeal
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

router.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { incomeDetailId, appealType, reason, evidenceFiles } = req.body;
    
    if (!appealType || !reason) {
      res.status(400).json({ success: false, error: '申诉类型和申诉原因不能为空' });
      return;
    }
    
    const result = db.prepare(`
      INSERT INTO appeals (user_id, income_detail_id, appeal_type, reason, evidence_files, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(
      decoded.userId,
      incomeDetailId || null,
      appealType,
      reason,
      evidenceFiles ? JSON.stringify(evidenceFiles) : null
    );
    
    const appealId = result.lastInsertRowid as number;
    
    logOperation('appeal_create', decoded.userId, undefined, req.ip, undefined, { appealId, appealType });
    
    res.json({
      success: true,
      message: '申诉提交成功，请等待税务专员处理',
      data: { appealId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '提交申诉失败' });
  }
});

router.post('/:id/withdraw', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const appealId = parseInt(req.params.id);
    
    const appeal = db.prepare(`
      SELECT * FROM appeals WHERE id = ? AND user_id = ?
    `).get(appealId, decoded.userId) as any;
    
    if (!appeal) {
      res.status(404).json({ success: false, error: '申诉记录不存在' });
      return;
    }
    
    if (appeal.status !== 'pending') {
      res.status(400).json({ success: false, error: '只能撤回待处理的申诉' });
      return;
    }
    
    db.prepare(`
      UPDATE appeals SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(appealId);
    
    logOperation('appeal_withdraw', decoded.userId, undefined, req.ip, undefined, { appealId });
    
    res.json({
      success: true,
      message: '申诉已撤回'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '撤回失败' });
  }
});

export default router;
