import { Router, type Request, type Response } from 'express';
import { mockEmergencies } from '../data/emergencyData.js';
import { generateId, formatDate, getRandomInt } from '../data/utils.js';
import type { EmergencyInfo } from '../../shared/types.js';

const router = Router();

let emergencies: EmergencyInfo[] = [...mockEmergencies];

router.get('/', (req: Request, res: Response): void => {
  const {
    level,
    status,
    type,
    page = '1',
    pageSize = '10',
    keyword,
  } = req.query as {
    level?: string;
    status?: string;
    type?: string;
    page?: string;
    pageSize?: string;
    keyword?: string;
  };

  let filtered = [...emergencies];

  if (level) {
    filtered = filtered.filter((item) => item.level === level);
  }
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }
  if (type) {
    filtered = filtered.filter((item) => item.type === type);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(kw) ||
        item.content.toLowerCase().includes(kw),
    );
  }

  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const total = filtered.length;
  const start = (pageNum - 1) * sizeNum;
  const list = filtered.slice(start, start + sizeNum);

  res.json({
    success: true,
    data: {
      list,
      total,
      page: pageNum,
      pageSize: sizeNum,
    },
  });
});

router.get('/active', (req: Request, res: Response): void => {
  const active = emergencies.filter((e) => e.status === 'published' && e.isPinned);
  res.json({ success: true, data: active });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const item = emergencies.find((e) => e.id === id);

  if (!item) {
    res.status(404).json({ success: false, error: '应急信息不存在' });
    return;
  }

  res.json({ success: true, data: item });
});

router.post('/', (req: Request, res: Response): void => {
  const { title, content, level, type, targetAreas, isPinned, expireTime } = req.body;
  const now = formatDate(new Date());

  const newEmergency: EmergencyInfo = {
    id: generateId('emergency'),
    title,
    content,
    level,
    type,
    targetAreas: targetAreas || [],
    isPinned: isPinned || false,
    status: 'draft',
    createTime: now,
    creatorId: 'user_1',
    creatorName: '系统管理员',
    reachCount: 0,
    expireTime,
  };

  emergencies.unshift(newEmergency);

  res.json({ success: true, data: newEmergency });
});

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = emergencies.findIndex((e) => e.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '应急信息不存在' });
    return;
  }

  emergencies[index] = {
    ...emergencies[index],
    ...req.body,
  };

  res.json({ success: true, data: emergencies[index] });
});

router.post('/publish/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = emergencies.findIndex((e) => e.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '应急信息不存在' });
    return;
  }

  const now = formatDate(new Date());
  emergencies[index] = {
    ...emergencies[index],
    status: 'published',
    publishTime: now,
    reachCount: getRandomInt(10000, 50000),
  };

  res.json({ success: true, data: emergencies[index] });
});

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = emergencies.findIndex((e) => e.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '应急信息不存在' });
    return;
  }

  emergencies.splice(index, 1);

  res.json({ success: true });
});

export default router;
