import express from 'express';
import db from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

const router = express.Router();

router.get('/profile', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, user_type, real_name, id_card, phone, email, 
             police_verified, police_verify_time, police_verify_result,
             business_name, credit_code, business_license_hash, portrait, created_at
      FROM users WHERE id = ?
    `).get(req.user?.id);

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const applications = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(req.user?.id) as any;
    const certificates = db.prepare('SELECT COUNT(*) as count FROM electronic_certificates WHERE user_id = ?').get(req.user?.id) as any;

    res.json({
      code: 200,
      data: {
        ...user,
        applicationCount: applications.count,
        certificateCount: certificates.count
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.put('/profile', authenticateToken, (req: AuthRequest, res) => {
  const { realName, phone, email } = req.body;

  try {
    db.prepare(`
      UPDATE users SET real_name = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(realName, phone, email, req.user?.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '更新个人信息', '用户管理', JSON.stringify(req.body));

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    logger.error('更新用户信息失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/police-verify', authenticateToken, (req: AuthRequest, res) => {
  const { idCard, realName } = req.body;

  if (!idCard || !realName) {
    return res.status(400).json({ code: 400, message: '身份证号和姓名不能为空' });
  }

  try {
    const verifyResult = idCard.length === 18 ? 'success' : 'failed';

    db.prepare(`
      UPDATE users SET police_verified = ?, police_verify_time = CURRENT_TIMESTAMP, 
             police_verify_result = ?, id_card = ?, real_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(verifyResult === 'success' ? 1 : 0, verifyResult, idCard, realName, req.user?.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '公安实名核验', '用户管理', `核验结果: ${verifyResult}`);

    res.json({
      code: 200,
      message: verifyResult === 'success' ? '核验通过' : '核验失败，请检查信息',
      data: { verified: verifyResult === 'success' }
    });
  } catch (error) {
    logger.error('实名核验失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/portrait', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.user?.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const applications = db.prepare(`
      SELECT status, COUNT(*) as count FROM applications 
      WHERE user_id = ? GROUP BY status
    `).all(req.user?.id);

    const recentApps = db.prepare(`
      SELECT a.*, i.name as item_name FROM applications a
      LEFT JOIN service_items i ON a.item_id = i.id
      WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 5
    `).all(req.user?.id);

    res.json({
      code: 200,
      data: {
        statistics: applications,
        recentApplications: recentApps,
        tags: ['高频办事', '诚信用户']
      }
    });
  } catch (error) {
    logger.error('获取用户画像失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

export default router;
