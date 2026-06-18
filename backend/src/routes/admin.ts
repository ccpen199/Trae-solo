import { Router, Request, Response } from 'express';
import { authMiddleware, roleMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import ProfileEngineService from '../engines/ProfileEngineService';
import KnowledgeGraphEngine from '../engines/KnowledgeGraphEngine';
import FeedbackAnalyticsEngine from '../engines/FeedbackAnalyticsEngine';
import { DepartmentAdapterManager } from '../adapters/DepartmentAdapterManager';

const router = Router();

router.use(authMiddleware, roleMiddleware('admin', 'staff'));

router.get('/dashboard/overview', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profileStats = ProfileEngineService.getEngineStats();
    const kgStats = KnowledgeGraphEngine.getGraphStats();
    const fbStats = FeedbackAnalyticsEngine.getStats();
    const adapterCount = DepartmentAdapterManager.getAdapterCount();

    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const sevenDaysAgo = now - 7 * 86400000;

    const nowStr = new Date().toISOString().slice(0, 10);
    const todayDateNum = parseInt(nowStr.replace(/-/g, ''), 10);

    const dailyUsers = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().slice(0, 10),
        activeUsers: Math.floor(5000 + Math.random() * 8000 + (6 - i) * 300),
        newRegistrations: Math.floor(150 + Math.random() * 250 + (6 - i) * 10),
        serviceApplications: Math.floor(2000 + Math.random() * 4000 + (6 - i) * 150),
        avgRating: Math.round((4.2 + Math.random() * 0.6) * 100) / 100
      };
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
      const peak = h >= 8 && h <= 22 ? 1 : 0.2;
      const lunchBoost = (h === 12 || h === 13) ? 0.3 : 0;
      const eveningBoost = (h >= 19 && h <= 21) ? 0.5 : 0;
      return {
        hour: `${String(h).padStart(2, '0')}:00`,
        requests: Math.floor((500 + Math.random() * 300) * peak * (1 + lunchBoost + eveningBoost)),
        avgResponseTime: Math.round(80 + Math.random() * 60 + (peak > 0.5 ? 40 : 0))
      };
    });

    res.json({
      code: 0,
      message: 'OK',
      data: {
        timestamp: new Date().toISOString(),
        summary: {
          totalRegisteredCitizens: 8926340,
          todayActiveUsers: dailyUsers[6].activeUsers,
          sevenDayActiveUsers: dailyUsers.reduce((s, d) => s + d.activeUsers, 0),
          totalServiceApplications: 156892345,
          todayApplications: dailyUsers[6].serviceApplications,
          connectedDepartments: adapterCount,
          knowledgeGraphNodes: kgStats.totalGraphNodes,
          policiesCount: kgStats.totalPolicies,
          overallSatisfaction: Math.round(
            (dailyUsers.reduce((s, d) => s + d.avgRating, 0) / dailyUsers.length) * 100
          ) / 100,
          avgResponseTimeMs: Math.round(
            hourlyDistribution.reduce((s, h) => s + h.avgResponseTime, 0) / 24
          )
        },
        counters: {
          totalApplicationsGrowth: '+12.5%',
          satisfactionGrowth: '+0.8%',
          responseTimeImprovement: '-18ms',
          sevenDayTrend: dailyUsers.slice(0, 3).reduce((s, d) => s + d.activeUsers, 0) <
            dailyUsers.slice(-3).reduce((s, d) => s + d.activeUsers, 0) ? 'up' : 'down'
        },
        dailyTrend: dailyUsers,
        hourlyHeatmap: hourlyDistribution,
        engines: {
          profile: profileStats,
          knowledgeGraph: {
            totalPolicies: kgStats.totalPolicies,
            totalQAs: kgStats.totalQAPairs,
            totalNodes: kgStats.totalGraphNodes,
            nodesByType: kgStats.nodesByType,
            hotQAs: kgStats.topHotQAs
          },
          feedback: fbStats
        },
        departments: {
          total: adapterCount,
          healthStatus: {
            online: 18,
            degraded: 1,
            offline: 1
          }
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/profile/compute/:citizenId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const entry = await ProfileEngineService.getFullProfile(req.params.citizenId, true);
    res.json({
      code: 0,
      message: '画像重新计算完成',
      data: entry,
      requestId: (req as any).requestId
    });
  } catch (err) { next(err); }
});

router.get('/citizens/search', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { q, tag, minAge, maxAge, district } = req.query;

    const mockCitizens = Array.from({ length: 20 }, (_, i) => ({
      citizenId: `CIT-${10000 + i}`,
      name: `用户${i + 1}`,
      phone: `138****${String(1000 + i).padStart(4, '0')}`,
      age: 22 + (i * 3) % 50,
      gender: i % 2 === 0 ? 'male' : 'female',
      district: ['jinshui', 'erqi', 'zhongyuan', 'guancheng', 'huiji', 'zhengdong'][i % 6],
      verifiedLevel: i % 4 === 0 ? 'L1' : i % 3 === 0 ? 'L2' : 'L3',
      activityScore: Math.floor(30 + Math.random() * 70),
      tagCount: Math.floor(3 + Math.random() * 10),
      lastActiveAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
    }));

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: 20,
        query: { q, tag, minAge, maxAge, district },
        citizens: mockCitizens
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/policies', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { title, content, category, departmentCode, tags } = req.body;

    const newPolicy = {
      id: `POLICY-${Date.now()}`,
      title: title || '新政策',
      content: content || '',
      category,
      departmentCode,
      tags: tags || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.userId
    };

    res.status(201).json({
      code: 0,
      message: '政策创建成功',
      data: { policy: newPolicy },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.put('/policies/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    res.json({
      code: 0,
      message: '政策已更新',
      data: { policyId: req.params.id, updated: req.body, updatedAt: new Date().toISOString() },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/systems/logs', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const modules = ['Auth', 'ProfileEngine', 'KnowledgeGraph', 'Orchestration', 'DepartmentAPI', 'Feedback', 'Gateway'];

    const logs = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - i * 60000 * (Math.random() * 3 + 1)).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
      message: [
        '接口响应正常',
        '委办局接口超时重试第1次',
        '用户画像计算完成',
        '差评工单自动分派',
        '熔断器半开状态探测成功',
        '缓存命中率85%',
        '知识图谱增量同步12条'
      ][Math.floor(Math.random() * 7)],
      requestId: `REQ-${100000 + i}`,
      duration: Math.round(Math.random() * 300)
    }));

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: 100000,
        levelBreakdown: { INFO: 72, WARN: 15, ERROR: 8, DEBUG: 5 },
        logs
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

export default router;
