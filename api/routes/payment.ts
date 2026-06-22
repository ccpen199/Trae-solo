import { Router, type Response } from 'express';
import type { ApiResponse, SettlementOrder, PaymentRequest, PaymentResponse, PaginationParams, PaginationResponse } from '@shared/types';
import { getDb } from '../models/db.js';
import { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const { page = 1, pageSize = 10, status } = req.query as PaginationParams & { status?: string };
  
  let sql = `
    SELECT po.*, h.name as hospital_name 
    FROM payment_orders po
    LEFT JOIN hospitals h ON po.hospital_id = h.id
    WHERE po.user_id = ?
  `;
  const params: any[] = [userId];
  
  if (status) {
    sql += ' AND po.status = ?';
    params.push(status);
  }
  
  const countSql = sql.replace('SELECT po.*, h.name as hospital_name', 'SELECT COUNT(*) as count');
  const totalResult = db.prepare(countSql).get(...params) as { count: number };
  const total = totalResult.count;
  
  sql += ' ORDER BY po.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const orders = db.prepare(sql).all(...params) as any[];
  
  const formattedOrders: SettlementOrder[] = orders.map(o => ({
    id: o.id,
    type: o.type as 'outpatient' | 'inpatient',
    hospital: o.hospital_name,
    hospitalId: o.hospital_id,
    appointmentId: o.appointment_id || undefined,
    amount: JSON.parse(o.amount || '{}'),
    items: JSON.parse(o.items || '[]'),
    status: o.status as SettlementOrder['status'],
    createdAt: o.created_at,
    paidAt: o.paid_at || undefined,
    transactionId: o.transaction_id || undefined
  }));
  
  const response: ApiResponse<PaginationResponse<SettlementOrder>> = {
    code: 0,
    message: '获取成功',
    data: {
      list: formattedOrders,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    }
  };
  
  res.json(response);
});

router.get('/orders/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { id } = req.params;
  const db = getDb();
  
  const order = db.prepare(`
    SELECT po.*, h.name as hospital_name 
    FROM payment_orders po
    LEFT JOIN hospitals h ON po.hospital_id = h.id
    WHERE po.id = ? AND po.user_id = ?
  `).get(id, userId) as any;
  
  if (!order) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '订单不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const formattedOrder: SettlementOrder = {
    id: order.id,
    type: order.type as 'outpatient' | 'inpatient',
    hospital: order.hospital_name,
    hospitalId: order.hospital_id,
    appointmentId: order.appointment_id || undefined,
    amount: JSON.parse(order.amount || '{}'),
    items: JSON.parse(order.items || '[]'),
    status: order.status as SettlementOrder['status'],
    createdAt: order.created_at,
    paidAt: order.paid_at || undefined,
    transactionId: order.transaction_id || undefined
  };
  
  const response: ApiResponse<SettlementOrder> = {
    code: 0,
    message: '获取成功',
    data: formattedOrder
  };
  
  res.json(response);
});

router.post('/pay', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { orderId, useAccount, additionalMethod, amount } = req.body as PaymentRequest;
  
  if (!orderId || amount === undefined) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '缺少必要参数',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const db = getDb();
  
  const order = db.prepare('SELECT * FROM payment_orders WHERE id = ? AND user_id = ?').get(orderId, userId) as any;
  
  if (!order) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '订单不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  if (order.status === 'paid') {
    const response: ApiResponse<null> = {
      code: 400,
      message: '订单已支付',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const orderAmount = JSON.parse(order.amount || '{}');
  
  if (useAccount) {
    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId) as any;
    if (account.personal_balance < orderAmount.accountPay) {
      const response: ApiResponse<null> = {
        code: 400,
        message: '医保账户余额不足',
        data: null
      };
      res.status(400).json(response);
      return;
    }
    
    db.prepare('UPDATE accounts SET personal_balance = personal_balance - ? WHERE user_id = ?').run(orderAmount.accountPay, userId);
  }
  
  const transactionId = `TXN${Date.now()}`;
  const paidAt = new Date().toISOString();
  
  const updateData: Record<string, any> = {
    status: 'paid',
    transaction_id: transactionId,
    paid_at: paidAt
  };
  
  if (additionalMethod === 'wechat') {
    orderAmount.wechatPay = orderAmount.selfPay;
  } else if (additionalMethod === 'alipay') {
    orderAmount.alipayPay = orderAmount.selfPay;
  }
  
  db.prepare(`
    UPDATE payment_orders 
    SET status = ?, transaction_id = ?, paid_at = ?, amount = ?
    WHERE id = ?
  `).run('paid', transactionId, paidAt, JSON.stringify(orderAmount), orderId);
  
  const response: ApiResponse<PaymentResponse> = {
    code: 0,
    message: '支付成功',
    data: {
      success: true,
      transactionId,
      paidAmount: amount,
      electronicReceiptUrl: `/api/payment/orders/${orderId}/receipt?type=electronic`,
      settlementNoteUrl: `/api/payment/orders/${orderId}/receipt?type=settlement`
    }
  };
  
  res.json(response);
});

router.get('/orders/:id/receipt', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { id } = req.params;
  const { type = 'electronic' } = req.query as { type?: string };
  const db = getDb();
  
  const order = db.prepare(`
    SELECT po.*, h.name as hospital_name 
    FROM payment_orders po
    LEFT JOIN hospitals h ON po.hospital_id = h.id
    WHERE po.id = ? AND po.user_id = ?
  `).get(id, userId) as any;
  
  if (!order) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '订单不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const receiptData = {
    orderId: order.id,
    receiptNo: `JSYB${Date.now()}`,
    receiptType: type === 'electronic' ? '电子票据' : '结算单',
    hospital: order.hospital_name,
    patientName: req.user?.name || '张伟',
    socialSecurityNo: req.user?.socialSecurityNo || '100000000001',
    amount: JSON.parse(order.amount || '{}'),
    items: JSON.parse(order.items || '[]'),
    paidAt: order.paid_at || new Date().toISOString(),
    transactionId: order.transaction_id,
    printTime: new Date().toISOString(),
    validationCode: `JS${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
  
  const response: ApiResponse<typeof receiptData> = {
    code: 0,
    message: '获取成功',
    data: receiptData
  };
  
  res.json(response);
});

export default router;
