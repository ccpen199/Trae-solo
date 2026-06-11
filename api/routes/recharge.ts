import { Router, type Request, type Response } from 'express';
import { mockRechargeMethods, mockRechargeOrders, mockEtcCard } from '../../src/mock/data.js';
import type { RechargeOrder } from '../../shared/types.js';

const router = Router();

router.get('/methods', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: mockRechargeMethods,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取充值方式失败' });
  }
});

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '10', status } = req.query;
    let orders = [...mockRechargeOrders];
    
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const start = (pageNum - 1) * size;
    const end = start + size;
    const paginatedOrders = orders.slice(start, end);
    
    res.json({
      success: true,
      data: {
        orders: paginatedOrders,
        total: orders.length,
        page: pageNum,
        pageSize: size,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取充值记录失败' });
  }
});

router.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, method, payChannel } = req.body;
    
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '请输入有效的充值金额' });
      return;
    }
    
    if (!payChannel) {
      res.status(400).json({ success: false, error: '请选择支付渠道' });
      return;
    }
    
    const newOrder: RechargeOrder = {
      id: `o${Date.now()}`,
      cardId: mockEtcCard.id,
      amount: parseFloat(amount),
      method: method || '在线充值',
      payChannel: payChannel as 'wechat' | 'alipay' | 'bank',
      status: '支付中',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    
    setTimeout(() => {
      newOrder.status = '已完成';
      newOrder.completedAt = new Date().toISOString();
      mockEtcCard.balance += parseFloat(amount);
    }, 2000);
    
    mockRechargeOrders.unshift(newOrder);
    
    res.json({
      success: true,
      data: {
        order: newOrder,
        newBalance: mockEtcCard.balance + parseFloat(amount),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '创建充值订单失败' });
  }
});

router.post('/auto-recharge/bind', async (req: Request, res: Response): Promise<void> => {
  try {
    const { channel, threshold, autoAmount } = req.body;
    
    res.json({
      success: true,
      data: {
        channel,
        threshold: threshold || 100,
        autoAmount: autoAmount || 200,
        enabled: true,
      },
      message: '自动代扣已启用',
    });
  } catch {
    res.status(500).json({ success: false, error: '绑定自动代扣失败' });
  }
});

router.post('/auto-recharge/unbind', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: '自动代扣已取消',
    });
  } catch {
    res.status(500).json({ success: false, error: '取消自动代扣失败' });
  }
});

router.get('/balance', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        balance: mockEtcCard.balance,
        cardType: mockEtcCard.type,
        cardNo: mockEtcCard.cardNo,
        lowBalanceWarning: mockEtcCard.balance < 100 && mockEtcCard.type === '储值卡',
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取余额失败' });
  }
});

export default router;
