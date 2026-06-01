import { Router, Request, Response } from 'express';
import { getQuery, allQuery, addForce, updateCheckinDate, claimDiamond, transferDiamond, updatePassport } from '../utils/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/home', async (req: Request, res: Response) => {
  const announcements = await allQuery('SELECT * FROM announcements');
  const activities = await allQuery('SELECT * FROM activities WHERE status = ?', ['active']);

  res.json({
    announcements,
    activities,
    forceTasks: [
      { id: '1', name: '每日签到', force: 10, type: 'daily' },
      { id: '2', name: '浏览商品', force: 5, type: 'shopping' },
      { id: '3', name: '玩游戏', force: 20, type: 'game' },
      { id: '4', name: '观看视频', force: 15, type: 'entertainment' },
      { id: '5', name: '邀请好友', force: 200, type: 'invite' }
    ]
  });
});

router.get('/force', authenticate, async (req: any, res: Response) => {
  const user = await getQuery('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const tasks = await allQuery('SELECT * FROM force_tasks WHERE user_id = ?', [req.user.id]);

  res.json({
    currentForce: user?.force || 0,
    tasks
  });
});

router.post('/force/checkin', authenticate, async (req: any, res: Response) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);

  if (user?.last_checkin_date === today) {
    return res.status(400).json({ error: '今日已签到' });
  }

  addForce(userId, 10, 'daily', '每日签到');
  updateCheckinDate(userId, today);

  res.json({ success: true, forceGained: 10, message: '签到成功，获得10原力' });
});

router.post('/force/task', authenticate, async (req: any, res: Response) => {
  const { taskType, taskName, forceValue } = req.body;
  const userId = req.user.id;

  addForce(userId, forceValue, taskType, taskName);

  res.json({ success: true, forceGained: forceValue });
});

router.get('/diamond', authenticate, async (req: any, res: Response) => {
  const userId = req.user.id;
  const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);
  const records = await allQuery('SELECT * FROM diamond_records WHERE user_id = ?', [userId]);

  const now = new Date();
  const lastClaim = user?.last_diamond_claim_date ? new Date(user.last_diamond_claim_date) : null;
  const hoursSinceLastClaim = lastClaim ? (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60) : 48;

  const canClaim = hoursSinceLastClaim >= 24;
  const growthStopped = hoursSinceLastClaim >= 48;
  const availableDiamond = Math.min((hoursSinceLastClaim / 24) * 0.5, 1.0);

  res.json({
    currentDiamond: user?.black_diamond || 0,
    canClaim,
    growthStopped,
    availableDiamond: canClaim ? availableDiamond : 0,
    records
  });
});

router.post('/diamond/claim', authenticate, async (req: any, res: Response) => {
  const userId = req.user.id;
  const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);

  const lastClaim = user?.last_diamond_claim_date ? new Date(user.last_diamond_claim_date) : null;
  const hoursSinceLastClaim = lastClaim ? (new Date().getTime() - lastClaim.getTime()) / (1000 * 60 * 60) : 48;

  if (hoursSinceLastClaim < 24) {
    return res.status(400).json({ error: '距离上次领取不足24小时' });
  }

  const claimAmount = Math.min((hoursSinceLastClaim / 24) * 0.5, 1.0);
  const newTotal = claimDiamond(userId, claimAmount);

  res.json({
    success: true,
    claimed: claimAmount,
    newTotal,
    message: `成功领取 ${claimAmount.toFixed(2)} 黑钻`
  });
});

router.get('/wallet', authenticate, async (req: any, res: Response) => {
  const userId = req.user.id;
  const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);
  const transactions = await allQuery('SELECT * FROM wallet_transactions WHERE user_id = ?', [userId]);

  res.json({
    address: user?.blockchain_address,
    privateKey: user?.private_key,
    balance: user?.black_diamond || 0,
    transactions
  });
});

router.post('/wallet/transfer', authenticate, async (req: any, res: Response) => {
  const { toAddress, amount } = req.body;
  const userId = req.user.id;
  const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);

  if (!user || user.black_diamond < amount) {
    return res.status(400).json({ error: '余额不足' });
  }

  const targetUser = await getQuery('SELECT * FROM users WHERE blockchain_address = ?', [toAddress]);
  if (!targetUser) {
    return res.status(404).json({ error: '目标地址不存在' });
  }

  const txHash = transferDiamond(userId, toAddress, amount);

  if (!txHash) {
    return res.status(400).json({ error: '转账失败' });
  }

  res.json({ success: true, txHash, message: '转账成功' });
});

router.get('/passport', authenticate, async (req: any, res: Response) => {
  const userId = req.user.id;
  const passportData = await allQuery('SELECT * FROM data_passport WHERE user_id = ?', [userId]);

  const totalValue = passportData.reduce((sum: number, item: any) => sum + item.value_score, 0);

  res.json({
    categories: passportData,
    totalValue
  });
});

router.post('/passport/update', authenticate, async (req: any, res: Response) => {
  const { category, dataPoints, valueScore } = req.body;
  const userId = req.user.id;

  updatePassport(userId, category, dataPoints, valueScore);

  res.json({ success: true, message: '数据护照已更新' });
});

router.get('/tasks', async (req: Request, res: Response) => {
  const tasks = [
    { id: '1', name: '每日签到', description: '每日签到获得原力', force: 10, type: 'daily', icon: '📅' },
    { id: '2', name: '浏览商品', description: '浏览电商商品获得原力', force: 5, type: 'shopping', icon: '🛒' },
    { id: '3', name: '玩小游戏', description: '完成游戏任务获得原力', force: 20, type: 'game', icon: '🎮' },
    { id: '4', name: '观看视频', description: '观看视频获得原力', force: 15, type: 'entertainment', icon: '🎬' },
    { id: '5', name: '邀请好友', description: '邀请好友注册获得原力', force: 200, type: 'invite', icon: '👥' },
    { id: '6', name: '关注公众号', description: '关注微信公众号获得原力', force: 50, type: 'social', icon: '📱' }
  ];

  res.json({ tasks });
});

export default router;
