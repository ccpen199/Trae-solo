import { Router, type Request, type Response } from 'express';
import { mockTollStations, generateRoutes } from '../../src/mock/data.js';
import { tollEngine } from '../../shared/engine/TollEngine.js';

const router = Router();

router.get('/stations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword } = req.query;
    let stations = [...mockTollStations];
    
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      stations = stations.filter(s => 
        s.name.toLowerCase().includes(kw) || 
        s.highway.toLowerCase().includes(kw)
      );
    }
    
    res.json({
      success: true,
      data: stations,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取收费站列表失败' });
  }
});

router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startStationId, endStationId, vehicleType, travelDate } = req.body;
    
    if (!startStationId || !endStationId) {
      res.status(400).json({ success: false, error: '请选择起点和终点收费站' });
      return;
    }
    
    const startStation = mockTollStations.find(s => s.id === startStationId);
    const endStation = mockTollStations.find(s => s.id === endStationId);
    
    if (!startStation || !endStation) {
      res.status(404).json({ success: false, error: '收费站不存在' });
      return;
    }
    
    const date = new Date(travelDate || Date.now());
    const holidayInfo = tollEngine.getHolidayInfo(date);
    const routes = generateRoutes(startStationId, endStationId, vehicleType || 1, date);
    
    res.json({
      success: true,
      data: {
        startStation,
        endStation,
        routes,
        holidayInfo,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '计算路费失败' });
  }
});

router.get('/holiday', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const d = date ? new Date(date as string) : new Date();
    const holidayInfo = tollEngine.getHolidayInfo(d);
    
    res.json({
      success: true,
      data: holidayInfo,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取节假日信息失败' });
  }
});

export default router;
