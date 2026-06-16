import { Router, type Request, type Response } from 'express';
import { mockPerformanceData, mockStatCards, type ApiResponse, type PerformanceData, type StatCardData } from '../../data/mockData.js';
import { authMiddleware, requireAdmin, type AuthRequest } from '../../middleware/auth.js';

const router = Router();

router.get('/overview', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: mockStatCards,
      message: '获取效能概览成功',
    } as ApiResponse<StatCardData[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取效能概览失败',
    } as ApiResponse);
  }
});

router.get('/trend', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, period = 'day' } = req.query;

    let data = mockPerformanceData;

    if (startDate && endDate) {
      data = data.filter(d => d.date >= String(startDate) && d.date <= String(endDate));
    }

    res.status(200).json({
      success: true,
      data: {
        list: data,
        period,
        summary: {
          totalApplications: data.reduce((sum, d) => sum + d.totalApplications, 0),
          totalCompleted: data.reduce((sum, d) => sum + d.completedCount, 0),
          averageCompletionRate: Math.round((data.reduce((sum, d) => sum + d.completionRate, 0) / data.length) * 10) / 10,
          averageHandlingTime: Math.round(data.reduce((sum, d) => sum + d.averageHandlingTime, 0) / data.length),
          totalRejections: data.reduce((sum, d) => sum + d.rejectionCount, 0),
        },
      },
      message: '获取效能趋势数据成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取效能趋势数据失败',
    } as ApiResponse);
  }
});

router.get('/rejection-reasons', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allReasons = mockPerformanceData.flatMap(d => d.rejectionReasons);
    
    const reasonSummary: Record<string, number> = {};
    allReasons.forEach(r => {
      reasonSummary[r.reason] = (reasonSummary[r.reason] || 0) + r.count;
    });

    const result = Object.entries(reasonSummary).map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / allReasons.reduce((sum, r) => sum + r.count, 0)) * 1000) / 10,
    })).sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: result,
      message: '获取退件原因统计成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取退件原因统计失败',
    } as ApiResponse);
  }
});

router.get('/department-ranking', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = [
      { id: '1', name: '人力资源和社会保障厅', totalApplications: 12580, completionRate: 97.2, averageHandlingTime: 2.1, satisfaction: 98.8 },
      { id: '2', name: '公安厅', totalApplications: 9876, completionRate: 96.5, averageHandlingTime: 1.8, satisfaction: 97.5 },
      { id: '3', name: '卫生健康委员会', totalApplications: 8543, completionRate: 95.8, averageHandlingTime: 2.5, satisfaction: 96.2 },
      { id: '4', name: '住房和城乡建设厅', totalApplications: 7654, completionRate: 94.3, averageHandlingTime: 3.2, satisfaction: 95.8 },
      { id: '5', name: '市场监督管理局', totalApplications: 10234, completionRate: 98.1, averageHandlingTime: 1.5, satisfaction: 99.1 },
      { id: '6', name: '税务局', totalApplications: 15678, completionRate: 97.8, averageHandlingTime: 1.2, satisfaction: 98.5 },
    ];

    res.status(200).json({
      success: true,
      data: departments,
      message: '获取部门效能排名成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取部门效能排名失败',
    } as ApiResponse);
  }
});

router.get('/service-ranking', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const serviceRanking = [
      { id: '6', name: '社保缴费查询', totalApplications: 45678, completionRate: 99.9, averageHandlingTime: 0.1, hotLevel: 999 },
      { id: '1', name: '社保卡申领', totalApplications: 23456, completionRate: 97.5, averageHandlingTime: 4.2, hotLevel: 985 },
      { id: '5', name: '企业开办', totalApplications: 18765, completionRate: 96.8, averageHandlingTime: 0.8, hotLevel: 932 },
      { id: '7', name: '公积金提取', totalApplications: 15432, completionRate: 95.2, averageHandlingTime: 2.5, hotLevel: 888 },
      { id: '2', name: '户口迁移', totalApplications: 12345, completionRate: 94.5, averageHandlingTime: 2.8, hotLevel: 876 },
    ].slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: serviceRanking,
      message: '获取事项办理排名成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取事项办理排名失败',
    } as ApiResponse);
  }
});

router.get('/realtime', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const realtimeData = {
      onlineUsers: Math.floor(Math.random() * 500) + 1000,
      todayApplications: Math.floor(Math.random() * 200) + 12000,
      todayCompleted: Math.floor(Math.random() * 200) + 11500,
      pendingApplications: Math.floor(Math.random() * 50) + 200,
      averageWaitTime: Math.floor(Math.random() * 30) + 10,
      systemLoad: Math.round((Math.random() * 30 + 40) * 10) / 10,
      updatedAt: new Date(),
      recentApplications: [
        { id: `app_${Date.now() - 1000}`, serviceName: '社保缴费查询', status: 'approved', time: '1分钟前' },
        { id: `app_${Date.now() - 30000}`, serviceName: '社保卡申领', status: 'submitted', time: '30秒前' },
        { id: `app_${Date.now() - 60000}`, serviceName: '企业开办', status: 'reviewing', time: '1分钟前' },
        { id: `app_${Date.now() - 120000}`, serviceName: '公积金提取', status: 'approved', time: '2分钟前' },
      ],
    };

    res.status(200).json({
      success: true,
      data: realtimeData,
      message: '获取实时效能数据成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取实时效能数据失败',
    } as ApiResponse);
  }
});

export default router;
