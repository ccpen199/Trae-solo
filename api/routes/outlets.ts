import { Router, type Request, type Response } from 'express';
import { mockOutlets, mockUser } from '../../src/mock/data.js';
import type { Appointment, Outlet } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessType, keyword, lat, lng } = req.query;
    let outlets = [...mockOutlets] as (Outlet & { distance?: number })[];
    
    if (businessType) {
      outlets = outlets.filter(o => o.businessTypes.includes(businessType as Outlet['businessTypes'][number]));
    }
    
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      outlets = outlets.filter(o => 
        o.name.toLowerCase().includes(kw) || 
        o.address.toLowerCase().includes(kw)
      );
    }
    
    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      outlets = outlets.map(o => {
        const distance = Math.sqrt(
          Math.pow(o.location.lat - userLat, 2) + 
          Math.pow(o.location.lng - userLng, 2)
        ) * 111;
        return { ...o, distance: Math.round(distance * 10) / 10 };
      }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    res.json({
      success: true,
      data: outlets,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取网点列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const outlet = mockOutlets.find(o => o.id === req.params.id);
    if (!outlet) {
      res.status(404).json({ success: false, error: '网点不存在' });
      return;
    }
    
    res.json({
      success: true,
      data: outlet,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取网点详情失败' });
  }
});

router.get('/:id/appointments', async (req: Request, res: Response): Promise<void> => {
  try {
    const outlet = mockOutlets.find(o => o.id === req.params.id);
    if (!outlet) {
      res.status(404).json({ success: false, error: '网点不存在' });
      return;
    }
    
    res.json({
      success: true,
      data: {
        currentQueue: outlet.currentQueue,
        avgWaitTime: outlet.avgWaitTime,
        availableTimes: [
          '09:00-09:30', '09:30-10:00', '10:00-10:30',
          '10:30-11:00', '14:00-14:30', '14:30-15:00',
        ],
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取预约信息失败' });
  }
});

router.post('/appointments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { outletId, businessType, appointmentTime } = req.body;
    
    if (!outletId || !businessType || !appointmentTime) {
      res.status(400).json({ success: false, error: '请填写完整的预约信息' });
      return;
    }
    
    const outlet = mockOutlets.find(o => o.id === outletId);
    if (!outlet) {
      res.status(404).json({ success: false, error: '网点不存在' });
      return;
    }
    
    const queueNo = `A${String(outlet.currentQueue + 1).padStart(3, '0')}`;
    const appointment: Appointment = {
      id: `apt${Date.now()}`,
      outletId,
      userId: mockUser.id,
      businessType,
      queueNo,
      appointmentTime,
      status: '等待中',
      currentNumber: outlet.currentQueue - 2,
      aheadCount: Math.max(0, outlet.currentQueue - 3),
    };
    
    outlet.currentQueue += 1;
    
    res.json({
      success: true,
      data: appointment,
      message: `预约成功！您的排队号是 ${queueNo}`,
    });
  } catch {
    res.status(500).json({ success: false, error: '创建预约失败' });
  }
});

router.get('/appointments/my', async (req: Request, res: Response): Promise<void> => {
  try {
    const appointments: Appointment[] = [
      {
        id: 'apt001',
        outletId: 'o1',
        userId: mockUser.id,
        businessType: '充值',
        queueNo: 'A025',
        appointmentTime: new Date().toISOString(),
        status: '等待中',
        currentNumber: 22,
        aheadCount: 3,
      },
    ];
    
    res.json({
      success: true,
      data: appointments,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取我的预约失败' });
  }
});

router.post('/appointments/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: '预约已取消',
    });
  } catch {
    res.status(500).json({ success: false, error: '取消预约失败' });
  }
});

export default router;
