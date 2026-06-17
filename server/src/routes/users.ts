import { Router } from 'express';
import { mockFamilyMembers, mockUser } from '../data/mockData';

const router = Router();

router.get('/profile', (req, res) => {
  res.json({ code: 0, data: mockUser });
});

router.get('/family', (req, res) => {
  res.json({ code: 0, data: mockFamilyMembers });
});

router.post('/family/invite', (req, res) => {
  const { name, role, phone } = req.body;
  const newMember = {
    id: `user_${Date.now()}`,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    role: role || 'viewer',
    permissions: role === 'admin' ? ['device:view', 'device:control', 'alert:view', 'scene:manage'] : ['device:view'],
    joinTime: new Date().toISOString(),
  };
  mockFamilyMembers.push(newMember);
  res.json({ code: 0, data: newMember });
});

router.put('/family/:id', (req, res) => {
  const member = mockFamilyMembers.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ code: 1, message: '成员不存在' });
  }
  Object.assign(member, req.body);
  res.json({ code: 0, data: member });
});

router.delete('/family/:id', (req, res) => {
  const index = mockFamilyMembers.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ code: 1, message: '成员不存在' });
  }
  mockFamilyMembers.splice(index, 1);
  res.json({ code: 0, message: '移除成功' });
});

export default router;
