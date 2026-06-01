import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { logOperation, verifyBlockchain } from '../security.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tax_service_secret_key_2024';

function verifyOfficer(req: Request): { officerId: number; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.officerId) {
      return { officerId: decoded.officerId, role: decoded.role };
    }
    return null;
  } catch {
    return null;
  }
}

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalDeclarations = db.prepare('SELECT COUNT(*) as count FROM tax_declarations').get() as { count: number };
    const pendingAppeals = db.prepare("SELECT COUNT(*) as count FROM appeals WHERE status = 'pending'").get() as { count: number };
    const totalRefund = db.prepare('SELECT SUM(tax_refund) as total FROM tax_declarations WHERE status = "submitted"').get() as { total: number };
    
    const declarationByStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tax_declarations 
      GROUP BY status
    `).all();
    
    const recentDeclarations = db.prepare(`
      SELECT d.*, u.name as user_name
      FROM tax_declarations d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `).all();
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers.count,
          totalDeclarations: totalDeclarations.count,
          pendingAppeals: pendingAppeals.count,
          totalRefund: totalRefund.total || 0
        },
        declarationByStatus,
        recentDeclarations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取数据失败' });
  }
});

router.get('/appeals', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const { status } = req.query;
    
    let query = `
      SELECT a.*, u.name as user_name, u.id_card, i.income_type, i.payer_name
      FROM appeals a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN income_details i ON a.income_detail_id = i.id
    `;
    const params: any[] = [];
    
    if (status) {
      query += " WHERE a.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY a.created_at DESC";
    
    const appeals = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      data: appeals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取申诉列表失败' });
  }
});

router.post('/appeals/:id/process', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const appealId = parseInt(req.params.id);
    const { status, processorNote } = req.body;
    
    if (!status || !['approved', 'rejected', 'processing'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态' });
      return;
    }
    
    db.prepare(`
      UPDATE appeals 
      SET status = ?, assigned_to = ?, processed_at = CURRENT_TIMESTAMP, processor_note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, officer.officerId, processorNote || null, appealId);
    
    logOperation('appeal_process', undefined, officer.officerId, req.ip, undefined, { appealId, status });
    
    res.json({
      success: true,
      message: '申诉处理完成'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '处理失败' });
  }
});

router.get('/declarations', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const { status, year } = req.query;
    
    let query = `
      SELECT d.*, u.name as user_name, u.id_card
      FROM tax_declarations d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (status) {
      query += " AND d.status = ?";
      params.push(status);
    }
    
    if (year) {
      query += " AND d.tax_year = ?";
      params.push(year);
    }
    
    query += " ORDER BY d.created_at DESC LIMIT 100";
    
    const declarations = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      data: declarations
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取申报列表失败' });
  }
});

router.post('/declarations/:id/approve', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const declarationId = parseInt(req.params.id);
    
    db.prepare(`
      UPDATE tax_declarations 
      SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, refund_status = 'tbr_payment'
      WHERE id = ?
    `).run(declarationId);
    
    db.prepare(`
      INSERT INTO refund_tracking (declaration_id, status, status_text, operator, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(declarationId, 'approved', '税务审核通过', 'officer_' + officer.officerId, '申报材料审核通过，已提交国库处理');
    
    logOperation('declaration_approve', undefined, officer.officerId, req.ip, undefined, { declarationId });
    
    res.json({
      success: true,
      message: '申报审核通过'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '审核失败' });
  }
});

router.get('/policy/impact-analysis', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const { deductionType, newAmount } = req.query;
    
    const affectedUsers = db.prepare(`
      SELECT COUNT(DISTINCT d.user_id) as count
      FROM special_deductions sd
      JOIN tax_declarations d ON sd.declaration_id = d.id
      WHERE sd.deduction_type = ?
    `).get(deductionType || 'children_education') as { count: number };
    
    const currentTotal = db.prepare(`
      SELECT SUM(sd.amount) as total
      FROM special_deductions sd
      WHERE sd.deduction_type = ?
    `).get(deductionType || 'children_education') as { total: number };
    
    const newTotal = affectedUsers.count * parseInt((newAmount as string) || '12000');
    const impact = newTotal - (currentTotal.total || 0);
    
    res.json({
      success: true,
      data: {
        deductionType,
        affectedUsers: affectedUsers.count,
        currentTotalDeduction: currentTotal.total || 0,
        newTotalDeduction: newTotal,
        taxImpact: impact * 0.1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '分析失败' });
  }
});

router.get('/faq', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM faq_knowledge';
    const params: any[] = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY view_count DESC';
    
    const faqs = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取FAQ失败' });
  }
});

router.post('/faq', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const { question, answer, category, tags } = req.body;
    
    if (!question || !answer) {
      res.status(400).json({ success: false, error: '问题和答案不能为空' });
      return;
    }
    
    const result = db.prepare(`
      INSERT INTO faq_knowledge (question, answer, category, tags)
      VALUES (?, ?, ?, ?)
    `).run(question, answer, category || null, tags ? JSON.stringify(tags) : null);
    
    logOperation('faq_create', undefined, officer.officerId, req.ip, undefined, { faqId: result.lastInsertRowid });
    
    res.json({
      success: true,
      message: 'FAQ创建成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建失败' });
  }
});

router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const { operation, userId, limit } = req.query;
    
    let query = `
      SELECT ol.*, u.name as user_name, o.name as officer_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      LEFT JOIN tax_officers o ON ol.officer_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (operation) {
      query += ' AND ol.operation = ?';
      params.push(operation);
    }
    
    if (userId) {
      query += ' AND ol.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY ol.created_at DESC LIMIT ?';
    params.push(parseInt((limit as string) || '100'));
    
    const logs = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取日志失败' });
  }
});

router.get('/blockchain/verify', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const result = verifyBlockchain();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '验证失败' });
  }
});

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  const officer = verifyOfficer(req);
  if (!officer) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  
  try {
    const users = db.prepare(`
      SELECT id, id_card, name, phone, face_verified, bank_card_verified, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户列表失败' });
  }
});

export default router;
