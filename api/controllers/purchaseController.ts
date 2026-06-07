import { type Request, type Response } from 'express';
import crypto from 'crypto';
import db from '../db/index.js';
import type { ApiResponse, Order, EligibilityCheck } from '../types/index.js';

const generateOrderNo = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD${date}${random}`;
};

const generateBlockchainHash = (orderId: number, orderNo: string, amount: number) => {
  const data = `${orderId}-${orderNo}-${amount}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

const mockCAVerify = (userId: number, idNumber: string) => {
  return true;
};

const mockLoanApproval = (userId: number, amount: number, income: number) => {
  const monthlyPayment = (amount * 0.7 * 0.045) / 12;
  const debtToIncome = monthlyPayment / (income / 12);
  return {
    approved: debtToIncome < 0.5,
    maxAmount: income * 6,
    interestRate: 0.045,
    term: 360
  };
};

const cityPolicies: Record<string, string> = {
  '北京': '京籍家庭限购2套，非京籍需连续5年社保限购1套',
  '上海': '沪籍家庭限购2套，非沪籍需连续5年社保限购1套',
  '深圳': '深籍家庭限购2套，非深籍需连续5年社保限购1套',
  '广州': '穗籍家庭限购2套，非穗籍需连续5年社保限购1套',
  '杭州': '本地户籍限购2套，外地户籍需连续4年社保限购1套'
};

export const eligibilityCheck = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const { propertyId, idNumber, hukouStatus, houseCount } = req.body;

    if (!propertyId || !idNumber || !hukouStatus || houseCount === undefined) {
      res.status(400).json({ code: 400, message: '参数不完整', data: null } as ApiResponse);
      return;
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as any;
    if (!property) {
      res.status(404).json({ code: 404, message: '房源不存在', data: null } as ApiResponse);
      return;
    }

    const cityPolicy = cityPolicies[property.city] || '该城市暂无限购政策';
    const isLocal = hukouStatus === 'local';
    let passed = false;
    let result = '';

    if (isLocal) {
      passed = houseCount < 2;
      result = passed ? '本地户籍家庭，符合购房条件' : '本地户籍家庭已达限购上限';
    } else {
      passed = houseCount === 0;
      result = passed ? '非本地户籍，符合购房条件' : '非本地户籍已有房产，不符合限购政策';
    }

    const checkResult = db.prepare(`
      INSERT INTO eligibility_checks (user_id, property_id, city_policy, id_number, hukou_status, house_count, passed, result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, propertyId, cityPolicy, idNumber, hukouStatus, houseCount, passed ? 1 : 0, result);

    const check = db.prepare('SELECT * FROM eligibility_checks WHERE id = ?').get(checkResult.lastInsertRowid) as EligibilityCheck;

    res.json({
      code: 200,
      message: passed ? '资格核验通过' : '资格核验未通过',
      data: {
        ...check,
        passed: Boolean(check.passed)
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '资格核验失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const subscribe = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const { propertyId, advisorId } = req.body;

    if (!propertyId) {
      res.status(400).json({ code: 400, message: '请选择房源', data: null } as ApiResponse);
      return;
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as any;
    if (!property) {
      res.status(404).json({ code: 404, message: '房源不存在', data: null } as ApiResponse);
      return;
    }

    if (property.status !== 'available') {
      res.status(400).json({ code: 400, message: '该房源不可认购', data: null } as ApiResponse);
      return;
    }

    const lastCheck = db.prepare(`
      SELECT * FROM eligibility_checks 
      WHERE user_id = ? AND property_id = ? 
      ORDER BY checked_at DESC LIMIT 1
    `).get(userId, propertyId) as any;

    if (!lastCheck || !lastCheck.passed) {
      res.status(400).json({ code: 400, message: '请先完成购房资格核验', data: null } as ApiResponse);
      return;
    }

    const orderNo = generateOrderNo();
    const amount = property.price * (property.discount / 100);

    const tx = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (order_no, property_id, user_id, advisor_id, status, amount)
        VALUES (?, ?, ?, ?, 'subscribed', ?)
      `).run(orderNo, propertyId, userId, advisorId || 2, amount);

      const orderId = orderResult.lastInsertRowid as number;

      db.prepare(`
        UPDATE properties SET status = 'locked', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(propertyId);

      return orderId;
    });

    const orderId = tx();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;

    res.json({
      code: 200,
      message: '认购成功，请在7天内支付首付并签约',
      data: order
    } as ApiResponse<Order>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '认购失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const sign = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const { orderId, idNumber } = req.body;

    if (!orderId || !idNumber) {
      res.status(400).json({ code: 400, message: '参数不完整', data: null } as ApiResponse);
      return;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId) as any;
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在', data: null } as ApiResponse);
      return;
    }

    if (order.status !== 'subscribed') {
      res.status(400).json({ code: 400, message: '订单状态不正确', data: null } as ApiResponse);
      return;
    }

    const caVerified = mockCAVerify(userId, idNumber);
    if (!caVerified) {
      res.status(400).json({ code: 400, message: 'CA身份认证失败', data: null } as ApiResponse);
      return;
    }

    const blockchainHash = generateBlockchainHash(orderId, order.order_no, order.amount);

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE orders 
        SET status = 'signed', ca_verified = 1, blockchain_hash = ?
        WHERE id = ?
      `).run(blockchainHash, orderId);

      db.prepare(`
        INSERT INTO blockchain_records (order_id, hash, block_number)
        VALUES (?, ?, ?)
      `).run(orderId, blockchainHash, `0x${Math.random().toString(16).slice(2, 10)}`);

      db.prepare(`
        UPDATE properties SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(order.property_id);
    });

    tx();

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;

    res.json({
      code: 200,
      message: '签约成功，合同已上链存证',
      data: {
        ...updatedOrder,
        ca_verified: Boolean(updatedOrder.ca_verified)
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '签约失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const loanPreapproval = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const { orderId, income, employment, bankAccount } = req.body;

    if (!orderId || !income || !employment || !bankAccount) {
      res.status(400).json({ code: 400, message: '请填写完整的贷款申请信息', data: null } as ApiResponse);
      return;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId) as any;
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在', data: null } as ApiResponse);
      return;
    }

    if (order.status !== 'signed') {
      res.status(400).json({ code: 400, message: '请先完成签约', data: null } as ApiResponse);
      return;
    }

    const approvalResult = mockLoanApproval(userId, order.amount, income);

    db.prepare(`
      UPDATE orders SET status = 'loan_pending' WHERE id = ?
    `).run(orderId);

    res.json({
      code: 200,
      message: approvalResult.approved ? '贷款预审通过' : '贷款预审未通过',
      data: {
        approved: approvalResult.approved,
        maxAmount: approvalResult.maxAmount,
        interestRate: approvalResult.interestRate,
        term: approvalResult.term,
        monthlyPayment: Math.round((order.amount * 0.7 * approvalResult.interestRate) / 12),
        message: approvalResult.approved 
          ? '您的贷款预审已通过，请等待银行最终审批'
          : '您的负债收入比过高，建议增加首付或减少贷款金额'
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '贷款预审失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getMyOrders = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const orders = db.prepare(`
      SELECT o.*, p.project_name, p.address, p.city 
      FROM orders o
      LEFT JOIN properties p ON o.property_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(userId) as any[];

    const result = orders.map(o => ({
      ...o,
      ca_verified: o.ca_verified === 1 || o.ca_verified === true
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: result
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取订单列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export default {
  eligibilityCheck,
  subscribe,
  sign,
  loanPreapproval,
  getMyOrders
};
