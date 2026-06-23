import { Router, type Request, type Response } from 'express';
import { mockAppeals } from '../data/appealData.js';
import { generateId, formatDate, getRandomInt } from '../data/utils.js';
import type { Appeal } from '../../shared/types.js';

const router = Router();

let appeals: Appeal[] = [...mockAppeals];

router.get('/', (req: Request, res: Response): void => {
  const {
    status,
    category,
    district,
    page = '1',
    pageSize = '10',
    keyword,
  } = req.query as {
    status?: string;
    category?: string;
    district?: string;
    page?: string;
    pageSize?: string;
    keyword?: string;
  };

  let filtered = [...appeals];

  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }
  if (category) {
    filtered = filtered.filter((item) => item.category === category);
  }
  if (district) {
    filtered = filtered.filter((item) => item.district === district);
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

router.get('/stats', (req: Request, res: Response): void => {
  const total = appeals.length;
  const pending = appeals.filter((a) => a.status === 'pending').length;
  const processing = appeals.filter((a) => a.status === 'processing').length;
  const transferred = appeals.filter((a) => a.status === 'transferred').length;
  const resolved = appeals.filter((a) => a.status === 'resolved' || a.status === 'closed').length;

  const categoryStats: Record<string, number> = {};
  appeals.forEach((a) => {
    categoryStats[a.category] = (categoryStats[a.category] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      total,
      pending,
      processing,
      transferred,
      resolved,
      categoryStats,
    },
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const item = appeals.find((a) => a.id === id);

  if (!item) {
    res.status(404).json({ success: false, error: '诉求不存在' });
    return;
  }

  res.json({ success: true, data: item });
});

router.post('/', (req: Request, res: Response): void => {
  const { title, content, category, citizenName, citizenPhone, address, district } = req.body;
  const now = formatDate(new Date());

  const newAppeal: Appeal = {
    id: generateId('appeal'),
    title,
    content,
    category,
    status: 'pending',
    urgency: 'normal',
    citizenName,
    citizenPhone,
    address,
    district,
    createTime: now,
    logs: [
      {
        id: generateId('log'),
        action: '诉求提交',
        operator: citizenName,
        remark: '市民通过平台提交诉求',
        time: now,
      },
    ],
  };

  appeals.unshift(newAppeal);

  res.json({ success: true, data: newAppeal });
});

router.post('/transfer/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = appeals.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '诉求不存在' });
    return;
  }

  const now = formatDate(new Date());
  const platform12345Id = `XZ12345${String(Date.now()).slice(-6)}`;

  appeals[index] = {
    ...appeals[index],
    status: 'transferred',
    platform12345Id,
    transferTime: now,
    logs: [
      ...appeals[index].logs,
      {
        id: generateId('log'),
        action: '转办12345',
        operator: '平台管理员',
        remark: `已转办至12345政务服务便民热线，工单号：${platform12345Id}`,
        time: now,
      },
    ],
  };

  res.json({
    success: true,
    data: {
      platform12345Id,
      appeal: appeals[index],
    },
  });
});

router.put('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status, remark } = req.body;
  const index = appeals.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '诉求不存在' });
    return;
  }

  const now = formatDate(new Date());
  const actionMap: Record<string, string> = {
    processing: '开始处理',
    resolved: '处理完成',
    closed: '诉求关闭',
  };

  appeals[index] = {
    ...appeals[index],
    status,
    logs: [
      ...appeals[index].logs,
      {
        id: generateId('log'),
        action: actionMap[status] || '状态变更',
        operator: '承办部门',
        remark: remark || '',
        time: now,
      },
    ],
  };

  res.json({ success: true, data: appeals[index] });
});

export default router;
