import { Router, type Request, type Response } from 'express';
import { mockUsers, mockRoles } from '../data/userData.js';
import { generateId, formatDate } from '../data/utils.js';
import type { User } from '../../shared/types.js';

const router = Router();

let users: User[] = [...mockUsers];

router.get('/', (req: Request, res: Response): void => {
  const {
    role,
    tier,
    status,
    page = '1',
    pageSize = '10',
    keyword,
  } = req.query as {
    role?: string;
    tier?: string;
    status?: string;
    page?: string;
    pageSize?: string;
    keyword?: string;
  };

  let filtered = [...users];

  if (role) {
    filtered = filtered.filter((item) => item.roleId === role);
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
        item.name.toLowerCase().includes(kw) ||
        item.username.toLowerCase().includes(kw),
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

router.get('/roles', (req: Request, res: Response): void => {
  res.json({ success: true, data: mockRoles });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id);

  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  res.json({ success: true, data: user });
});

router.post('/', (req: Request, res: Response): void => {
  const { username, name, roleId, role, tier, district, street } = req.body;
  const now = formatDate(new Date());

  const newUser: User = {
    id: generateId('user'),
    username,
    name,
    role,
    roleId,
    tier,
    district,
    street,
    status: 'active',
    createTime: now,
  };

  users.unshift(newUser);

  res.json({ success: true, data: newUser });
});

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  users[index] = {
    ...users[index],
    ...req.body,
  };

  res.json({ success: true, data: users[index] });
});

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  users.splice(index, 1);

  res.json({ success: true });
});

router.post('/:id/toggle-status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  users[index] = {
    ...users[index],
    status: users[index].status === 'active' ? 'disabled' : 'active',
  };

  res.json({ success: true, data: users[index] });
});

export default router;
