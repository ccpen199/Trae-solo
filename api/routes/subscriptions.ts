import express, { type Request, type Response } from 'express';
import { mockSubscriptions, mockPushes } from '../data/mockData.js';

const router = express.Router();

router.get('/subscriptions', (_req: Request, res: Response) => {
  res.json({ success: true, data: mockSubscriptions });
});

router.post('/subscriptions', (req: Request, res: Response) => {
  const { type, targetId, targetName, notifyLevel } = req.body;
  if (!type || !targetId || !targetName) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  const newSub = {
    id: `sub-${Date.now()}`,
    type,
    targetId,
    targetName,
    notifyLevel: notifyLevel || 'all',
    createdAt: new Date().toISOString(),
  };
  mockSubscriptions.push(newSub);
  res.status(201).json({ success: true, data: newSub });
});

router.delete('/subscriptions/:id', (req: Request, res: Response) => {
  const idx = mockSubscriptions.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Subscription not found' });
  }
  mockSubscriptions.splice(idx, 1);
  res.json({ success: true });
});

router.get('/pushes', (req: Request, res: Response) => {
  const { unread, subscriptionId } = req.query;
  let result = [...mockPushes];

  if (unread === 'true') result = result.filter((p) => !p.read);
  if (typeof subscriptionId === 'string') {
    result = result.filter((p) => p.subscriptionId === subscriptionId);
  }

  result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  res.json({ success: true, data: result });
});

router.get('/pushes/unread-count', (_req: Request, res: Response) => {
  const count = mockPushes.filter((p) => !p.read).length;
  res.json({ success: true, data: { count } });
});

router.put('/pushes/:id/read', (req: Request, res: Response) => {
  const push = mockPushes.find((p) => p.id === req.params.id);
  if (!push) {
    return res.status(404).json({ success: false, error: 'Push not found' });
  }
  push.read = true;
  res.json({ success: true, data: push });
});

router.put('/pushes/read-all', (_req: Request, res: Response) => {
  mockPushes.forEach((p) => (p.read = true));
  res.json({ success: true });
});

export default router;
