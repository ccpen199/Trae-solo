import express from 'express';
import userService from '../services/user-service.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    const user = await userService.register(username, password, fullName, role || 'investor');
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await userService.login(username, password);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await userService.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      riskLevel: user.risk_level,
      riskAssessmentAt: user.risk_assessment_at,
      phone: user.phone,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, email, idCard } = req.body;
    const updated = await userService.updateUser(req.user.userId, { fullName, phone, email, idCard });
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
