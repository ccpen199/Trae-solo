import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { adminService } from '../services/adminService';
import { creditService } from '../services/creditService';

const router = Router();

const adminAuthMiddleware = (req: AuthRequest, res: Response, next: () => void): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: '需要管理员权限' });
    return;
  }
  next();
};

async function sendStatisticsAlias(res: Response, includeDashboard: boolean = false) {
  const result = await adminService.getSystemStatistics();
  if (!result.success) {
    res.status(500).json(result);
    return;
  }
  const statistics = result.data as {
    overview: {
      totalCompanies: number;
      totalJobseekers: number;
      totalJobs: number;
      totalMatches: number;
    };
    [key: string]: any;
  };

  res.json({
    ...result,
    data: includeDashboard
      ? {
          ...statistics,
          dashboardCards: [
            { key: 'companies', label: '入驻企业', value: statistics.overview.totalCompanies },
            { key: 'jobseekers', label: '专业人才', value: statistics.overview.totalJobseekers },
            { key: 'jobs', label: '招聘岗位', value: statistics.overview.totalJobs },
            { key: 'matches', label: '智能匹配', value: statistics.overview.totalMatches }
          ],
          modules: ['企业信用档案', '敏感词预警', '系统统计', '求职者管理']
        }
      : statistics
  });
}

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    await sendStatisticsAlias(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取系统统计失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    await sendStatisticsAlias(res, true);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取后台仪表盘失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/enterprises', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const status = req.query.status as string;
    const keyword = req.query.keyword as string;

    const result = await adminService.getEnterpriseList({
      status,
      keyword,
      page,
      pageSize
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取企业列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/enterprises/:id/credit', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: '无效的企业ID' });
      return;
    }

    const result = await creditService.generateCreditReport(companyId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取企业信用档案失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/enterprises/:id/audit', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: '无效的企业ID' });
      return;
    }

    const { status, reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: '无效的审核状态' });
      return;
    }

    const result = await adminService.auditCompany(companyId, { status, reason });
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '审核企业失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/sensitive-words', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

    const result = await adminService.getSensitiveWordList(page, pageSize);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取敏感词列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/sensitive-words', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.manageSensitiveWord('add', req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加敏感词失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.put('/sensitive-words/:id', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: '无效的敏感词ID' });
      return;
    }

    const result = await adminService.manageSensitiveWord('update', { ...req.body, id });
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新敏感词失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.delete('/sensitive-words/:id', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: '无效的敏感词ID' });
      return;
    }

    const result = await adminService.manageSensitiveWord('delete', { id, word: '' });
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除敏感词失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/statistics', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.getSystemStatistics();
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取系统统计失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/warnings', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

    const result = await adminService.getSensitiveWordWarnings(page, pageSize);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取敏感词预警列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/warnings/:id/handle', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const warningId = parseInt(req.params.id, 10);
    const { action } = req.body;

    if (!['ignore', 'delete', 'warn'].includes(action)) {
      res.status(400).json({ success: false, message: '无效的操作类型' });
      return;
    }

    const result = await adminService.handleWarningAction(warningId, action);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '处理预警失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/jobseekers', authMiddleware, adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const keyword = req.query.keyword as string;

    const result = await adminService.getJobseekerList({
      keyword,
      page,
      pageSize
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取求职者列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

export default router;
