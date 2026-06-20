import { Router, type Request, type Response } from 'express';
import { mockContents } from '../data/contentData.js';
import { generateId, formatDate } from '../data/utils.js';
import type { ContentItem } from '../../shared/types.js';

const router = Router();

let contents: ContentItem[] = [...mockContents];

router.get('/', (req: Request, res: Response): void => {
  const {
    channel,
    tier,
    status,
    page = '1',
    pageSize = '10',
    keyword,
  } = req.query as {
    channel?: string;
    tier?: string;
    status?: string;
    page?: string;
    pageSize?: string;
    keyword?: string;
  };

  let filtered = [...contents];

  if (channel) {
    filtered = filtered.filter((item) => item.channel === channel);
  }
  if (tier) {
    filtered = filtered.filter((item) => item.tier === tier);
  }
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(kw) ||
        item.summary.toLowerCase().includes(kw),
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

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const item = contents.find((c) => c.id === id);

  if (!item) {
    res.status(404).json({ success: false, error: '内容不存在' });
    return;
  }

  res.json({ success: true, data: item });
});

router.post('/', (req: Request, res: Response): void => {
  const { title, summary, content, coverImage, channel, tier } = req.body;
  const now = formatDate(new Date());

  const newItem: ContentItem = {
    id: generateId('content'),
    title,
    summary,
    content,
    coverImage: coverImage || '',
    channel,
    tier,
    status: 'draft',
    source: 'manual',
    viewCount: 0,
    createTime: now,
    updateTime: now,
    creatorId: 'user_1',
    creatorName: '系统管理员',
  };

  contents.unshift(newItem);

  res.json({ success: true, data: newItem });
});

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = contents.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '内容不存在' });
    return;
  }

  contents[index] = {
    ...contents[index],
    ...req.body,
    updateTime: formatDate(new Date()),
  };

  res.json({ success: true, data: contents[index] });
});

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = contents.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '内容不存在' });
    return;
  }

  contents.splice(index, 1);

  res.json({ success: true });
});

router.post('/submit/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = contents.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '内容不存在' });
    return;
  }

  contents[index] = {
    ...contents[index],
    status: 'pending',
    updateTime: formatDate(new Date()),
  };

  res.json({ success: true, data: contents[index] });
});

export default router;
