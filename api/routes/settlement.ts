import { Router, type Request, type Response } from 'express';
import { mockSettlementRecords } from '../../src/mock/data.js';

const router = Router();

router.get('/records', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '10', status, startDate, endDate } = req.query;
    let records = [...mockSettlementRecords];
    
    if (status) {
      records = records.filter(r => r.status === status);
    }
    
    if (startDate) {
      records = records.filter(r => r.settleDate >= startDate);
    }
    
    if (endDate) {
      records = records.filter(r => r.settleDate <= endDate);
    }
    
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const start = (pageNum - 1) * size;
    const end = start + size;
    const paginatedRecords = records.slice(start, end);
    
    const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalCenterAmount = records.reduce((sum, r) => sum + r.centerAmount, 0);
    const totalMerchantAmount = records.reduce((sum, r) => sum + r.merchantAmount, 0);
    const totalDiff = records.reduce((sum, r) => sum + r.diffAmount, 0);
    
    res.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: records.length,
        page: pageNum,
        pageSize: size,
        summary: {
          totalAmount,
          totalCenterAmount,
          totalMerchantAmount,
          totalDiff,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取清分记录失败' });
  }
});

router.get('/records/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const record = mockSettlementRecords.find(r => r.id === req.params.id);
    if (!record) {
      res.status(404).json({ success: false, error: '清分记录不存在' });
      return;
    }
    
    const details = {
      ...record,
      transactionBreakdown: [
        { type: 'ETC通行费', count: 85620, amount: record.totalAmount * 0.7 },
        { type: '服务费', count: 40060, amount: record.totalAmount * 0.3 },
      ],
      centerBreakdown: [
        { name: '交通运输部路网中心', amount: record.centerAmount * 0.6 },
        { name: '广东省交通集团', amount: record.centerAmount * 0.4 },
      ],
      merchantBreakdown: [
        { name: '广州交通投资集团', amount: record.merchantAmount * 0.35 },
        { name: '深圳交通投资集团', amount: record.merchantAmount * 0.3 },
        { name: '其他运营单位', amount: record.merchantAmount * 0.35 },
      ],
    };
    
    res.json({
      success: true,
      data: details,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取清分详情失败' });
  }
});

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const last7Days = mockSettlementRecords.slice(0, 7);
    const dailyTrend = last7Days.map(r => ({
      date: r.settleDate,
      transactions: r.totalTransactions,
      amount: r.totalAmount,
    }));
    
    const totalPending = mockSettlementRecords.filter(r => r.status === '待对账').length;
    const totalDiff = mockSettlementRecords.filter(r => r.status === '有差异').reduce((sum, r) => sum + r.diffAmount, 0);
    
    res.json({
      success: true,
      data: {
        totalRecords: mockSettlementRecords.length,
        totalAmount: mockSettlementRecords.reduce((sum, r) => sum + r.totalAmount, 0),
        totalTransactions: mockSettlementRecords.reduce((sum, r) => sum + r.totalTransactions, 0),
        pendingCount: totalPending,
        diffAmount: totalDiff,
        dailyTrend,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

router.post('/records/:id/reconcile', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = mockSettlementRecords.find(r => r.id === id);
    
    if (!record) {
      res.status(404).json({ success: false, error: '清分记录不存在' });
      return;
    }
    
    record.status = '对账中';
    
    setTimeout(() => {
      record.status = '已完成';
      record.diffAmount = 0;
    }, 3000);
    
    res.json({
      success: true,
      message: '对账已启动',
      data: record,
    });
  } catch {
    res.status(500).json({ success: false, error: '启动对账失败' });
  }
});

router.post('/records/:id/resolve-diff', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolution, remark } = req.body;
    
    const record = mockSettlementRecords.find(r => r.id === id);
    if (!record) {
      res.status(404).json({ success: false, error: '清分记录不存在' });
      return;
    }
    
    record.status = '已完成';
    record.diffAmount = 0;
    
    res.json({
      success: true,
      message: '差异已处理',
      data: {
        resolution,
        remark,
        record,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '处理差异失败' });
  }
});

export default router;
