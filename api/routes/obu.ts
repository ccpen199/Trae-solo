import { Router, type Request, type Response } from 'express';
import { mockOBUs, mockUser, mockVehicle } from '../../src/mock/data.js';
import type { OBU } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '10', status, keyword } = req.query;
    let obus = [...mockOBUs];
    
    if (status) {
      obus = obus.filter(o => o.status === status);
    }
    
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      obus = obus.filter(o => 
        o.deviceNo.toLowerCase().includes(kw) || 
        o.model.toLowerCase().includes(kw)
      );
    }
    
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const start = (pageNum - 1) * size;
    const end = start + size;
    const paginatedOBUs = obus.slice(start, end);
    
    const stats = {
      total: mockOBUs.length,
      active: mockOBUs.filter(o => o.status === '已激活').length,
      inventory: mockOBUs.filter(o => o.status === '库存').length,
      faulty: mockOBUs.filter(o => o.status === '故障').length,
      lost: mockOBUs.filter(o => o.status === '挂失').length,
    };
    
    res.json({
      success: true,
      data: {
        obus: paginatedOBUs,
        total: obus.length,
        page: pageNum,
        pageSize: size,
        stats,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取OBU列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const obu = mockOBUs.find(o => o.id === req.params.id);
    if (!obu) {
      res.status(404).json({ success: false, error: 'OBU设备不存在' });
      return;
    }
    
    const details = {
      ...obu,
      user: obu.userId === mockUser.id ? mockUser : null,
      vehicle: obu.vehicleId === mockVehicle.id ? mockVehicle : null,
      lifecycle: [
        { event: '入库', time: '2024-01-01T00:00:00Z', operator: '系统' },
        { event: '激活', time: obu.activateTime, operator: '张三' },
        { event: '最近检测', time: obu.lastCheckTime, operator: '系统自动检测' },
      ],
    };
    
    res.json({
      success: true,
      data: details,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取OBU详情失败' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceNo, model, expiryDate } = req.body;
    
    if (!deviceNo || !model) {
      res.status(400).json({ success: false, error: '请填写设备编号和型号' });
      return;
    }
    
    const newOBU: OBU = {
      id: `obu${Date.now()}`,
      deviceNo,
      model,
      status: '库存',
      userId: null,
      vehicleId: null,
      activateTime: null,
      expiryDate: expiryDate || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastCheckTime: null,
    };
    
    mockOBUs.unshift(newOBU);
    
    res.json({
      success: true,
      data: newOBU,
      message: 'OBU设备已入库',
    });
  } catch {
    res.status(500).json({ success: false, error: '创建设备失败' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, userId, vehicleId } = req.body;
    
    const obu = mockOBUs.find(o => o.id === id);
    if (!obu) {
      res.status(404).json({ success: false, error: 'OBU设备不存在' });
      return;
    }
    
    if (status) {
      obu.status = status as OBU['status'];
      if (status === '已激活') {
        obu.activateTime = new Date().toISOString();
        obu.userId = userId || obu.userId;
        obu.vehicleId = vehicleId || obu.vehicleId;
      }
    }
    
    res.json({
      success: true,
      data: obu,
      message: '设备信息已更新',
    });
  } catch {
    res.status(500).json({ success: false, error: '更新设备失败' });
  }
});

router.post('/:id/lost', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const obu = mockOBUs.find(o => o.id === id);
    
    if (!obu) {
      res.status(404).json({ success: false, error: 'OBU设备不存在' });
      return;
    }
    
    obu.status = '挂失';
    
    res.json({
      success: true,
      data: obu,
      message: '设备已挂失',
    });
  } catch {
    res.status(500).json({ success: false, error: '挂失设备失败' });
  }
});

router.post('/:id/replace', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newDeviceNo } = req.body;
    
    const oldOBU = mockOBUs.find(o => o.id === id);
    if (!oldOBU) {
      res.status(404).json({ success: false, error: '原OBU设备不存在' });
      return;
    }
    
    oldOBU.status = '已报废';
    
    const newOBU: OBU = {
      id: `obu${Date.now()}`,
      deviceNo: newDeviceNo,
      model: oldOBU.model,
      status: '已激活',
      userId: oldOBU.userId,
      vehicleId: oldOBU.vehicleId,
      activateTime: new Date().toISOString(),
      expiryDate: oldOBU.expiryDate,
      lastCheckTime: new Date().toISOString(),
    };
    
    mockOBUs.unshift(newOBU);
    
    res.json({
      success: true,
      data: {
        oldOBU,
        newOBU,
      },
      message: '设备已更换',
    });
  } catch {
    res.status(500).json({ success: false, error: '更换设备失败' });
  }
});

router.get('/my', async (req: Request, res: Response): Promise<void> => {
  try {
    const myOBUs = mockOBUs.filter(o => o.userId === mockUser.id);
    
    res.json({
      success: true,
      data: myOBUs,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取我的设备失败' });
  }
});

export default router;
