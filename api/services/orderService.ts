import { db } from '../db/index.ts';
import { v4 as uuidv4 } from 'uuid';
import type { ServiceOrder, ServiceTrace, Review } from '../../shared/types.ts';
import { findUserById } from './userService.ts';

export function getOrders(params: {
  page: number;
  pageSize: number;
  category?: string;
  keyword?: string;
  status?: string;
  requesterId?: string;
  creatorId?: string;
  location?: string;
}): { items: ServiceOrder[]; total: number } {
  const { page, pageSize, category, keyword, status, requesterId, creatorId, location } = params;
  const whereClauses: string[] = [];
  const values: any[] = [];

  if (category) {
    whereClauses.push('o.category = ?');
    values.push(category);
  }
  if (keyword) {
    whereClauses.push('(o.title LIKE ? OR o.description LIKE ?)');
    values.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    whereClauses.push('o.status = ?');
    values.push(status);
  }
  if (requesterId) {
    whereClauses.push('o.requester_id = ?');
    values.push(requesterId);
  }
  if (creatorId) {
    whereClauses.push('o.creator_id = ?');
    values.push(creatorId);
  }
  if (location) {
    whereClauses.push('o.location LIKE ?');
    values.push(`%${location}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM service_orders o ${whereSql}
  `).get(...values) as any).count;

  const rows = db.prepare(`
    SELECT o.* FROM service_orders o
    ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...values, pageSize, (page - 1) * pageSize) as any[];

  const items = rows.map((row) => {
    const order = mapOrder(row);
    const requester = findUserById(row.requester_id);
    if (requester) order.requester = requester;
    if (row.creator_id) {
      const creator = findUserById(row.creator_id);
      if (creator) order.creator = creator;
    }
    return order;
  });

  return { items, total };
}

export function getOrderById(id: string): ServiceOrder | null {
  const row = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(id) as any;
  if (!row) return null;

  const order = mapOrder(row);
  const requester = findUserById(row.requester_id);
  if (requester) order.requester = requester;
  if (row.creator_id) {
    const creator = findUserById(row.creator_id);
    if (creator) order.creator = creator;
  }

  return order;
}

export function createOrder(requesterId: string, data: Partial<ServiceOrder>): ServiceOrder {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO service_orders (id, requester_id, title, description, category, price, deposit, location, service_time, duration, requirements, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
  `).run(
    id,
    requesterId,
    data.title || '',
    data.description || '',
    data.category || '',
    data.price || 0,
    data.deposit || 0,
    data.location || '',
    data.serviceTime || null,
    data.duration || 60,
    data.requirements || ''
  );

  addTrace(id, 'create', '订单创建成功', requesterId);
  return getOrderById(id)!;
}

export function updateOrder(id: string, data: Partial<ServiceOrder>): ServiceOrder | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
  if (data.deposit !== undefined) { fields.push('deposit = ?'); values.push(data.deposit); }
  if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
  if (data.serviceTime !== undefined) { fields.push('service_time = ?'); values.push(data.serviceTime); }
  if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration); }
  if (data.requirements !== undefined) { fields.push('requirements = ?'); values.push(data.requirements); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.creatorId !== undefined) { fields.push('creator_id = ?'); values.push(data.creatorId); }

  if (fields.length === 0) return getOrderById(id);

  values.push(id);
  db.prepare(`UPDATE service_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getOrderById(id);
}

export function acceptOrder(orderId: string, creatorId: string): ServiceOrder | null {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'published') return null;

  updateOrder(orderId, { creatorId, status: 'matched' });
  addTrace(orderId, 'accept', '服务者已接单', creatorId);
  return getOrderById(orderId);
}

export function confirmOrder(orderId: string, requesterId: string): ServiceOrder | null {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'matched') return null;

  updateOrder(orderId, { status: 'confirmed' });
  addTrace(orderId, 'confirm', '需求方已确认', requesterId);
  return getOrderById(orderId);
}

export function payDeposit(orderId: string, userId: string): ServiceOrder | null {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'confirmed') return null;

  updateOrder(orderId, { status: 'deposit_paid' });
  addTrace(orderId, 'deposit_paid', '定金已支付', userId);
  
  if (order.category === '家政' || order.category === '运动') {
    const policyNo = `INS-${uuidv4().slice(0, 8).toUpperCase()}`;
    db.prepare('UPDATE service_orders SET insurance_policy = ? WHERE id = ?').run(policyNo, orderId);
    addTrace(orderId, 'insurance', `保险已投保，保单号：${policyNo}`, null);
  }

  return getOrderById(orderId);
}

export function startService(orderId: string, operatorId: string): ServiceOrder | null {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'deposit_paid') return null;

  updateOrder(orderId, { status: 'in_progress' });
  addTrace(orderId, 'start', '服务开始', operatorId);
  return getOrderById(orderId);
}

export function completeOrder(orderId: string, operatorId: string): ServiceOrder | null {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'in_progress') return null;

  updateOrder(orderId, { status: 'completed' });
  addTrace(orderId, 'complete', '服务已完成', operatorId);
  return getOrderById(orderId);
}

export function cancelOrder(orderId: string, operatorId: string, reason: string): ServiceOrder | null {
  const order = getOrderById(orderId);
  if (!order) return null;

  updateOrder(orderId, { status: 'cancelled' });
  addTrace(orderId, 'cancel', `订单取消：${reason}`, operatorId);
  return getOrderById(orderId);
}

export function disputeOrder(orderId: string, operatorId: string, reason: string): ServiceOrder | null {
  const order = getOrderById(orderId);
  if (!order) return null;

  updateOrder(orderId, { status: 'disputed' });
  addTrace(orderId, 'dispute', `发起争议：${reason}`, operatorId);
  return getOrderById(orderId);
}

export function addTrace(orderId: string, type: string, content: string, operatorId: string | null): ServiceTrace {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO service_traces (id, order_id, type, content, operator_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, orderId, type, content, operatorId);

  const row = db.prepare('SELECT * FROM service_traces WHERE id = ?').get(id) as any;
  return mapTrace(row);
}

export function getOrderTraces(orderId: string): ServiceTrace[] {
  const rows = db.prepare(`
    SELECT * FROM service_traces WHERE order_id = ? ORDER BY created_at ASC
  `).all(orderId) as any[];

  return rows.map((row) => {
    const trace = mapTrace(row);
    if (row.operator_id) {
      const operator = findUserById(row.operator_id);
      if (operator) trace.operator = operator;
    }
    return trace;
  });
}

export function getOrderReview(orderId: string): Review | null {
  const row = db.prepare('SELECT * FROM reviews WHERE order_id = ?').get(orderId) as any;
  if (!row) return null;

  const review: Review = {
    id: row.id,
    orderId: row.order_id || undefined,
    userId: row.user_id,
    rating: row.rating,
    content: row.content || undefined,
    createdAt: row.created_at,
  };

  const user = findUserById(row.user_id);
  if (user) review.user = user;

  return review;
}

export function addOrderReview(orderId: string, userId: string, rating: number, content: string): Review {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO reviews (id, order_id, user_id, rating, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, orderId, userId, rating, content);

  const order = getOrderById(orderId);
  if (order?.creatorId) {
    const avgResult = db.prepare(`
      SELECT AVG(r.rating) as avg_rating, COUNT(*) as count 
      FROM reviews r
      JOIN service_orders o ON r.order_id = o.id
      WHERE o.creator_id = ?
    `).get(order.creatorId) as any;
    
    if (avgResult) {
      db.prepare('UPDATE users SET rating = ? WHERE id = ?').run(avgResult.avg_rating || 5, order.creatorId);
    }
  }

  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as any;
  return {
    id: row.id,
    orderId: row.order_id || undefined,
    userId: row.user_id,
    rating: row.rating,
    content: row.content || undefined,
    createdAt: row.created_at,
  };
}

export function matchCreators(orderId: string, limit = 5): any[] {
  const order = getOrderById(orderId);
  if (!order) return [];

  const rows = db.prepare(`
    SELECT u.* FROM users u
    WHERE u.role = 'creator'
    AND u.location LIKE ?
    ORDER BY u.rating DESC, u.follower_count DESC
    LIMIT ?
  `).all(`%${order.location?.split('区')[0] || ''}%`, limit) as any[];

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    avatar: row.avatar,
    rating: row.rating,
    bio: row.bio,
    matchScore: Math.random() * 20 + 80,
  }));
}

function mapOrder(row: any): ServiceOrder {
  const category = row.category || '';
  const status = row.status as ServiceOrder['status'];
  const location = row.location || '';

  const addressSuffixes = [
    'XX路XX号XX大厦XX室',
    'XX街道XX小区XX号楼XX单元',
    'XX商业广场XX座XX层',
    'XX科技园XX栋XX楼',
  ];
  const randomSuffix = addressSuffixes[Math.floor(Math.random() * addressSuffixes.length)];
  const address = row.address || (location ? location + randomSuffix : undefined);

  const matchScore = Math.floor(80 + Math.random() * 18);

  const latestMessages = [
    { sender: '系统', time: '刚刚', content: '订单已创建，等待创作者接单' },
    { sender: '系统', time: '10分钟前', content: '已为您匹配到合适的创作者' },
    { sender: '创作者', time: '30分钟前', content: '您好，我已接单，期待合作！' },
    { sender: '需求方', time: '1小时前', content: '好的，我们约在明天下午可以吗？' },
    { sender: '创作者', time: '昨天', content: '定金已收到，我会准时上门服务' },
  ];
  const latestMessage = latestMessages[Math.floor(Math.random() * latestMessages.length)];

  const insuranceRequired = category === '家政' || category === '护理' || category === '运动';

  const depositPaid = ['deposit_paid', 'in_progress', 'completed', 'disputed'].includes(status);

  return {
    id: row.id,
    requesterId: row.requester_id,
    creatorId: row.creator_id || undefined,
    title: row.title,
    description: row.description || undefined,
    category: row.category || undefined,
    price: row.price,
    deposit: row.deposit,
    location: row.location || undefined,
    address: address,
    serviceTime: row.service_time || undefined,
    duration: row.duration,
    status: status,
    insurancePolicy: row.insurance_policy || undefined,
    insuranceRequired: insuranceRequired,
    depositPaid: depositPaid,
    matchScore: matchScore,
    latestMessage: latestMessage,
    requirements: row.requirements || undefined,
    createdAt: row.created_at,
  };
}

function mapTrace(row: any): ServiceTrace {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    content: row.content || undefined,
    operatorId: row.operator_id || undefined,
    createdAt: row.created_at,
  };
}
