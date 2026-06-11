import { Router, type Request, type Response } from 'express';
import { mockDashboardStats, mockMonthlyTrafficData, mockDailyTrafficData, mockTrafficRecords, mockSettlementRecords, mockExceptionEvents } from '../../src/mock/data.js';

const router = Router();

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: mockDashboardStats,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

router.get('/trend/daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = '7' } = req.query;
    const dayCount = parseInt(days as string);
    
    const data = Array.from({ length: dayCount }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (dayCount - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        transactions: Math.floor(Math.random() * 50000) + 100000,
        amount: Math.floor(Math.random() * 3000000) + 7000000,
        vehicles: Math.floor(Math.random() * 30000) + 80000,
      };
    });
    
    res.json({
      success: true,
      data,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取每日趋势失败' });
  }
});

router.get('/trend/hourly', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      transactions: Math.floor(Math.random() * 8000) + 2000,
      amount: Math.floor(Math.random() * 500000) + 100000,
    }));
    
    res.json({
      success: true,
      data,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取小时趋势失败' });
  }
});

router.get('/user/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalRecords = mockTrafficRecords.length;
    const totalDistance = mockTrafficRecords.reduce((sum, r) => sum + r.distance, 0);
    const totalFee = mockTrafficRecords.reduce((sum, r) => sum + r.actualFee, 0);
    const totalDiscount = mockTrafficRecords.reduce((sum, r) => sum + r.discountFee, 0);
    
    const recentRecords = mockTrafficRecords.slice(0, 3);
    
    res.json({
      success: true,
      data: {
        totalRecords,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalFee: Math.round(totalFee * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        recentRecords,
        monthlyData: mockMonthlyTrafficData,
        dailyData: mockDailyTrafficData,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取用户统计失败' });
  }
});

router.get('/realtime', async (req: Request, res: Response): Promise<void> => {
  try {
    const recentExceptions = mockExceptionEvents
      .filter(e => e.status === '待处理' || e.status === '处理中')
      .slice(0, 5);
    
    const recentSettlements = mockSettlementRecords.slice(0, 3);
    
    const activeLanes = Array.from({ length: 8 }, (_, i) => ({
      id: `lane-${i + 1}`,
      name: `ETC车道 ${i + 1}`,
      status: Math.random() > 0.1 ? '正常' : '异常',
      flow: Math.floor(Math.random() * 200) + 50,
    }));
    
    res.json({
      success: true,
      data: {
        recentExceptions,
        recentSettlements,
        activeLanes,
        systemLoad: Math.floor(Math.random() * 30) + 50,
        currentSpeed: Math.floor(Math.random() * 1000) + 2000,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取实时数据失败' });
  }
});

router.get('/distribution/vehicle', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = [
      { type: '客车(一类)', count: 85620, percentage: 68.1 },
      { type: '客车(二类)', count: 18450, percentage: 14.7 },
      { type: '货车(一类)', count: 12300, percentage: 9.8 },
      { type: '货车(二类)', count: 6520, percentage: 5.2 },
      { type: '其他', count: 2790, percentage: 2.2 },
    ];
    
    res.json({
      success: true,
      data,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取车型分布失败' });
  }
});

router.get('/distribution/region', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = [
      { region: '广州市', amount: 3256800, percentage: 36.4 },
      { region: '深圳市', amount: 2568900, percentage: 28.7 },
      { region: '东莞市', amount: 1256400, percentage: 14.0 },
      { region: '佛山市', amount: 985600, percentage: 11.0 },
      { region: '其他', amount: 888720, percentage: 9.9 },
    ];
    
    res.json({
      success: true,
      data,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取地区分布失败' });
  }
});

export default router;
