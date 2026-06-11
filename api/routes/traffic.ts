import { Router, type Request, type Response } from 'express';
import { mockTrafficRecords, mockEtcCard } from '../../src/mock/data.js';
import { pathFitter } from '../../shared/engine/TollEngine.js';

const router = Router();

router.get('/records', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '10', status } = req.query;
    let records = [...mockTrafficRecords];
    
    if (status) {
      records = records.filter(r => r.status === status);
    }
    
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const start = (pageNum - 1) * size;
    const end = start + size;
    const paginatedRecords = records.slice(start, end);
    
    res.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: records.length,
        page: pageNum,
        pageSize: size,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取通行记录失败' });
  }
});

router.get('/records/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const record = mockTrafficRecords.find(r => r.id === req.params.id);
    if (!record) {
      res.status(404).json({ success: false, error: '通行记录不存在' });
      return;
    }
    
    const fittedPath = pathFitter.fitPath(record.gantryPoints);
    
    res.json({
      success: true,
      data: {
        ...record,
        fittedPath,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取通行记录详情失败' });
  }
});

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalRecords = mockTrafficRecords.length;
    const totalDistance = mockTrafficRecords.reduce((sum, r) => sum + r.distance, 0);
    const totalFee = mockTrafficRecords.reduce((sum, r) => sum + r.actualFee, 0);
    const totalDiscount = mockTrafficRecords.reduce((sum, r) => sum + r.discountFee, 0);
    
    res.json({
      success: true,
      data: {
        totalRecords,
        totalDistance,
        totalFee,
        totalDiscount,
        cardBalance: mockEtcCard.balance,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

export default router;
