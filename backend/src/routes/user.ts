import { Router, Request, Response } from 'express';
import dayjs from 'dayjs';
import { getDb } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { User, InsuranceInfo } from '../types';

const router = Router();

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    return successResponse(res, {
      id: user.id,
      name: user.real_name,
      phone: user.phone,
      idCard: user.id_card,
      gender: user.gender,
      avatar: user.avatar,
      address: user.address,
      email: user.email,
      realNameVerified: !!user.real_name_verified,
      faceVerified: !!user.face_verified,
      governmentVerified: !!user.government_verified,
      userLevel: user.user_level,
      tags: JSON.parse(user.tags || '[]'),
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('[User] 获取用户信息失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { avatar, address, email } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE users SET avatar = COALESCE(?, avatar), 
                        address = COALESCE(?, address), 
                        email = COALESCE(?, email),
                        updated_at = ?
      WHERE id = ?
    `).run(avatar, address, email, dayjs().toISOString(), userId);

    return successResponse(res, { updated: true }, '更新成功');
  } catch (error) {
    console.error('[User] 更新用户信息失败:', error);
    return errorResponse(res, '更新失败，请重试', 500);
  }
});

router.get('/insurance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const db = getDb();

    const insurance = db.prepare('SELECT * FROM insurance_info WHERE user_id = ?').get(userId) as any;
    
    if (!insurance) {
      return errorResponse(res, '社保信息不存在', 404);
    }

    return successResponse(res, {
      id: insurance.id,
      type: insurance.insurance_type,
      paymentMonths: insurance.payment_months,
      pensionBalance: insurance.pension_balance,
      unemploymentMonths: insurance.unemployment_months,
      medicalType: insurance.medical_type,
      lastPaymentDate: insurance.last_payment_date
    });
  } catch (error) {
    console.error('[User] 获取社保信息失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.get('/pension-balance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const db = getDb();

    const insurance = db.prepare('SELECT * FROM insurance_info WHERE user_id = ?').get(userId) as any;
    
    if (!insurance) {
      return errorResponse(res, '社保信息不存在', 404);
    }

    return successResponse(res, {
      monthlyPension: insurance.pension_balance / insurance.payment_months * 12 || 0,
      personalAccount: insurance.pension_balance,
      totalMonths: insurance.payment_months,
      insuredYears: Math.floor(insurance.payment_months / 12)
    });
  } catch (error) {
    console.error('[User] 获取养老金信息失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.get('/payment-records', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { page = 1, pageSize = 10 } = req.query;
    
    const mockRecords = Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(i, 'month');
      return {
        id: `pay_${i + 1}`,
        period: date.format('YYYY-MM'),
        paymentDate: date.date(15).format('YYYY-MM-DD'),
        baseAmount: 4250 + Math.floor(Math.random() * 500),
        personalAmount: 340 + Math.floor(Math.random() * 50),
        companyAmount: 850 + Math.floor(Math.random() * 100),
        totalAmount: 1190 + Math.floor(Math.random() * 150),
        status: 'paid',
        insuredArea: '南京市玄武区'
      };
    });

    return paginatedResponse(res, mockRecords, mockRecords.length, Number(page), Number(pageSize));
  } catch (error) {
    console.error('[User] 获取缴费记录失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.get('/quick-stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const db = getDb();

    const matterCount = db.prepare('SELECT COUNT(*) as count FROM matters WHERE user_id = ?').get(userId) as any;
    const licenseCount = db.prepare('SELECT COUNT(*) as count FROM licenses WHERE user_id = ?').get(userId) as any;
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0').get(userId) as any;
    const recommendCount = db.prepare('SELECT COUNT(*) as count FROM recommend_services WHERE user_id = ?').get(userId) as any;

    return successResponse(res, {
      matters: matterCount.count,
      licenses: licenseCount.count,
      unreadMessages: messageCount.count,
      recommendations: recommendCount.count
    });
  } catch (error) {
    console.error('[User] 获取统计信息失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.get('/family-members', authenticateToken, async (req: Request, res: Response) => {
  try {
    const mockMembers = [
      { id: 'fm_001', name: '李四', relation: '配偶', idCard: '320101199202022345', phone: '13800138002', insuredStatus: 'normal' },
      { id: 'fm_002', name: '张小明', relation: '子女', idCard: '320101201505053456', phone: '13800138003', insuredStatus: 'normal' }
    ];

    return successResponse(res, mockMembers);
  } catch (error) {
    console.error('[User] 获取家庭成员失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.post('/behavior', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { type, targetId, targetType, categories, duration } = req.body;
    const db = getDb();

    db.prepare(`
      INSERT INTO behavior_records (user_id, service_id, service_category, action_type, page_seconds, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      targetId || null,
      categories ? JSON.stringify(categories) : null,
      type,
      duration || 0,
      req.ip,
      new Date().toISOString()
    );

    return successResponse(res, { recorded: true }, '行为记录成功');
  } catch (error) {
    console.error('[User] 记录行为失败:', error);
    return errorResponse(res, '记录失败，请重试', 500);
  }
});

export default router;
