import express, { Request, Response } from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { UserProfile, BehaviorRecord, RecommendService } from '../types';

const router = express.Router();

router.use(authenticateToken);

interface AuthRequest extends Request {
  user?: { userId: string; idCard: string };
}

router.get('/profile', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;

    const user = db.prepare(`
      SELECT u.id, u.real_name, u.gender, u.birth_date, u.phone, 
             u.address, u.education, u.occupation, u.marital_status,
             i.insurance_type, i.payment_months, i.pension_balance,
             i.unemployment_months, i.medical_type, i.last_payment_date
      FROM users u
      LEFT JOIN insurance_info i ON u.id = i.user_id
      WHERE u.id = ?
    `).get(userId) as any;

    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    const tags = db.prepare(`
      SELECT tag, tag_value, weight, source
      FROM user_tags
      WHERE user_id = ?
      ORDER BY weight DESC
    `).all(userId) as any[];

    const behaviorStats = db.prepare(`
      SELECT 
        COUNT(*) as total_actions,
        SUM(CASE WHEN action_type = 'view' THEN 1 ELSE 0 END) as view_count,
        SUM(CASE WHEN action_type = 'apply' THEN 1 ELSE 0 END) as apply_count,
        SUM(CASE WHEN action_type = 'search' THEN 1 ELSE 0 END) as search_count,
        service_category,
        COUNT(DISTINCT service_category) as category_count
      FROM behavior_records
      WHERE user_id = ? AND created_at >= DATE('now', '-90 days')
    `).get(userId) as any;

    const recentMatters = db.prepare(`
      SELECT type, type_name, status, created_at
      FROM matters
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(userId) as any[];

    const licenses = db.prepare(`
      SELECT type, type_name, status
      FROM licenses
      WHERE user_id = ? AND status = 'active'
    `).all(userId) as any[];

    const profile: UserProfile = {
      userId: user.id,
      basicInfo: {
        name: user.real_name,
        gender: user.gender,
        age: calculateAge(user.birth_date),
        phone: user.phone,
        address: user.address,
        education: user.education,
        occupation: user.occupation,
        maritalStatus: user.marital_status,
      },
      insurance: {
        type: user.insurance_type,
        paymentMonths: user.payment_months,
        pensionBalance: user.pension_balance,
        unemploymentMonths: user.unemployment_months,
        medicalType: user.medical_type,
        lastPaymentDate: user.last_payment_date,
      },
      tags: tags.map((t: any) => ({
        tag: t.tag,
        value: t.tag_value,
        weight: t.weight,
        source: t.source,
      })),
      behavior: {
        totalActions: behaviorStats?.total_actions || 0,
        viewCount: behaviorStats?.view_count || 0,
        applyCount: behaviorStats?.apply_count || 0,
        searchCount: behaviorStats?.search_count || 0,
        categoryCount: behaviorStats?.category_count || 0,
      },
      recentActivities: recentMatters.map((m: any) => ({
        type: m.type,
        typeName: m.type_name,
        status: m.status,
        time: m.created_at,
      })),
      activeLicenses: licenses.map((l: any) => ({
        type: l.type,
        typeName: l.type_name,
      })),
    };

    return successResponse(res, profile);
  } catch (err) {
    return errorResponse(res, '获取用户画像失败', 500);
  }
});

router.get('/services', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { limit = 10, scenario } = req.query;

    const userTags = db.prepare(`
      SELECT tag, tag_value, weight FROM user_tags WHERE user_id = ?
    `).all(userId) as any[];

    const userBehaviors = db.prepare(`
      SELECT service_id, service_category, action_type, page_seconds, created_at
      FROM behavior_records
      WHERE user_id = ? AND created_at >= DATE('now', '-30 days')
      ORDER BY created_at DESC
      LIMIT 100
    `).all(userId) as any[];

    const userMatters = db.prepare(`
      SELECT type, type_name, status, created_at
      FROM matters
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(userId) as any[];

    const allServices = db.prepare(`
      SELECT id, code, name, category, sub_category, description, 
             handling_time, urgency_level, hot_level
      FROM services
      WHERE status = 'active'
    `).all() as any[];

    const scoredServices = allServices.map((service: any) => {
      let score = 0;
      const reasons: string[] = [];

      if (service.hot_level >= 4) {
        score += service.hot_level * 2;
        reasons.push('热门服务');
      }

      userTags.forEach((tag: any) => {
        if (service.category === tag.tag || service.name.includes(tag.tag_value)) {
          score += tag.weight * 3;
          reasons.push(`标签匹配: ${tag.tag}`);
        }
      });

      userBehaviors.forEach((behavior: any) => {
        if (behavior.service_id === service.id) {
          if (behavior.action_type === 'view') {
            score += 5;
            reasons.push('您曾浏览过');
          }
          if (behavior.action_type === 'apply') {
            score += 15;
            reasons.push('您曾办理过');
          }
          if (behavior.page_seconds && behavior.page_seconds > 60) {
            score += 3;
          }
        }
        if (behavior.service_category === service.category) {
          score += 2;
        }
      });

      userMatters.forEach((matter: any) => {
        if (matter.type === service.code) {
          if (matter.status === 'completed') {
            score += 8;
            reasons.push('已完成相关业务');
          } else if (matter.status === 'processing' || matter.status === 'pending') {
            score += 20;
            reasons.push('有进行中的相关业务');
          }
        }
      });

      if (scenario === 'home') {
        score += Math.random() * 5;
      }

      return {
        ...service,
        score,
        reasons: [...new Set(reasons)],
      };
    });

    scoredServices.sort((a: any, b: any) => b.score - a.score);

    const uniqueServices = scoredServices.filter((service: any, index: number, self: any[]) =>
      index === self.findIndex((s: any) => s.id === service.id)
    );

    const recommended = uniqueServices.slice(0, Number(limit));

    return successResponse(res, {
      recommended: recommended.map((s: any) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        category: s.category,
        description: s.description,
        handlingTime: s.handling_time,
        hotLevel: s.hot_level,
        reasons: s.reasons,
        matchScore: Math.min(100, Math.round(s.score * 5)),
      })),
      algorithm: {
        type: 'hybrid',
        factors: ['user_tags', 'behavior_history', 'hot_level', 'related_matters'],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(res, '获取推荐服务失败', 500);
  }
});

router.get('/behaviors', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { page = 1, pageSize = 20, action_type } = req.query;

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (action_type && action_type !== 'all') {
      whereClause += ' AND action_type = ?';
      params.push(action_type);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM behavior_records ${whereClause}`);
    const { total } = countStmt.get(...params) as any;

    const offset = (Number(page) - 1) * Number(pageSize);
    const stmt = db.prepare(`
      SELECT * FROM behavior_records ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    params.push(Number(pageSize), offset);

    const behaviors = stmt.all(...params) as any[];

    return successResponse(res, {
      list: behaviors,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    return errorResponse(res, '获取行为轨迹失败', 500);
  }
});

router.post('/behavior', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const {
      service_id,
      service_code,
      service_name,
      service_category,
      action_type,
      action_detail,
      page_seconds,
      search_keyword,
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO behavior_records (
        user_id, service_id, service_code, service_name, service_category,
        action_type, action_detail, page_seconds, search_keyword, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      service_id || null,
      service_code || null,
      service_name || null,
      service_category || null,
      action_type,
      action_detail || null,
      page_seconds || null,
      search_keyword || null,
      new Date().toISOString()
    );

    return successResponse(res, null, '行为记录成功');
  } catch (err) {
    return errorResponse(res, '记录失败', 500);
  }
});

router.get('/hot-services', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { limit = 10, category } = req.query;

    let whereClause = 'WHERE status = ?';
    const params: any[] = ['active'];

    if (category && category !== 'all') {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    const hotServices = db.prepare(`
      SELECT s.id, s.code, s.name, s.category, s.description,
             s.handling_time, s.hot_level, s.icon,
             COUNT(b.id) as use_count
      FROM services s
      LEFT JOIN behavior_records b ON s.id = b.service_id AND b.action_type = 'apply'
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.hot_level DESC, use_count DESC
      LIMIT ?
    `).all(...params, Number(limit)) as any[];

    return successResponse(res, hotServices);
  } catch (err) {
    return errorResponse(res, '获取热门服务失败', 500);
  }
});

router.get('/related-services', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { service_code, limit = 5 } = req.query;

    if (!service_code) {
      return errorResponse(res, '缺少service_code参数', 400);
    }

    const currentService = db.prepare(`
      SELECT category, tags FROM services WHERE code = ?
    `).get(service_code as string) as any;

    if (!currentService) {
      return errorResponse(res, '服务不存在', 404);
    }

    const relatedServices = db.prepare(`
      SELECT id, code, name, category, description, handling_time, hot_level
      FROM services 
      WHERE code != ? AND status = 'active'
      AND (category = ? OR tags LIKE ?)
      ORDER BY hot_level DESC
      LIMIT ?
    `).all(
      service_code,
      currentService.category,
      `%${currentService.tags?.split(',')[0] || ''}%`,
      Number(limit)
    ) as any[];

    return successResponse(res, relatedServices);
  } catch (err) {
    return errorResponse(res, '获取相关服务失败', 500);
  }
});

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default router;
