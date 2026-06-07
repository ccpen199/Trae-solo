import db from '../database';
import { generateOrderNo } from '../utils/orderNo';

export interface ScanOrderParams {
  userId: number;
  qrCode: string;
}

export interface StartOrderParams {
  orderId: number;
  programId: number;
}

export interface PayOrderParams {
  orderId: number;
  payMethod: string;
}

function toOrderStatus(order: any): string {
  if (order.order_status === 'completed') return 'completed';
  if (order.order_status === 'cancelled') return 'cancelled';
  if (order.order_status === 'running' || order.order_status === 'paused') return 'washing';
  if (order.pay_status === 'paid') return 'paid';
  return 'pending';
}

export function formatOrder(order: any): any {
  if (!order) return null;
  return {
    ...order,
    orderNo: order.order_no,
    userId: order.user_id,
    deviceId: order.device_id,
    programId: order.program_id,
    program: order.program_name || order.program || '标准洗',
    duration: order.duration_minutes || order.actual_duration || order.duration || 30,
    amount: order.pay_amount || order.total_cost || order.price || 0,
    totalCost: order.total_cost,
    payAmount: order.pay_amount,
    payMethod: order.pay_method,
    paymentMethod: order.pay_method,
    payStatus: order.pay_status,
    status: toOrderStatus(order),
    orderStatus: order.order_status,
    deviceName: order.device_name,
    deviceNo: order.device_no,
    deviceCode: order.device_no,
    deviceType: order.device_type,
    location: order.location,
    userPhone: order.user_phone,
    userName: order.user_name,
    userBalance: order.user_balance,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    startTime: order.start_time,
    startedAt: order.start_time,
    endTime: order.end_time,
    completedAt: order.end_time,
    paidAt: order.paid_at
  };
}

export function createDirectOrder(params: { userId: number; deviceId: number; program?: string; duration?: number; amount?: number }): any {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(params.deviceId) as any;
  if (!device) return { error: '设备不存在' };
  if (device.status !== 'idle') return { error: '设备不可用' };

  const programNameMap: Record<string, string> = {
    standard: '标准洗',
    quick: '快速洗',
    heavy: '大件洗',
    delicate: '标准洗',
    dry: '标准烘'
  };
  const programName = programNameMap[params.program || ''] || params.program;
  const program = db.prepare(`
    SELECT * FROM programs
    WHERE (name = ? OR id = ?) AND device_type = ?
    ORDER BY id
    LIMIT 1
  `).get(programName, Number(params.program) || 0, device.type) as any;

  const fallbackProgram = db.prepare('SELECT * FROM programs WHERE device_type = ? ORDER BY id LIMIT 1').get(device.type) as any;
  const selectedProgram = program || fallbackProgram;
  const amount = params.amount ?? selectedProgram?.price ?? 0;
  const orderNo = generateOrderNo();

  const result = db.prepare(`
    INSERT INTO orders (order_no, user_id, device_id, program_id, actual_duration, total_cost, pay_amount, pay_status, order_status)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'unpaid', 'created')
  `).run(orderNo, params.userId, device.id, selectedProgram?.id || null, params.duration || selectedProgram?.duration_minutes || 30, amount);

  return getOrderById(result.lastInsertRowid as number);
}

export function createOrderByScan(params: ScanOrderParams): any {
  const device = db.prepare('SELECT * FROM devices WHERE qr_code = ?').get(params.qrCode) as any;
  if (!device) return { error: '设备不存在' };
  if (device.status !== 'idle') return { error: '设备不可用' };

  const orderNo = generateOrderNo();
  const result = db.prepare(`
    INSERT INTO orders (order_no, user_id, device_id, order_status)
    VALUES (?, ?, ?, 'created')
  `).run(orderNo, params.userId, device.id);

  const orderId = result.lastInsertRowid as number;
  return formatOrder(db.prepare(`
    SELECT o.*, d.name as device_name, d.type as device_type, d.device_no
    FROM orders o
    LEFT JOIN devices d ON o.device_id = d.id
    WHERE o.id = ?
  `).get(orderId));
}

export function startOrder(params: StartOrderParams): any {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.orderId) as any;
  if (!order) return { error: '订单不存在' };
  if (order.order_status !== 'created') return { error: '订单状态不正确' };
  if (order.pay_status !== 'paid') return { error: '请先支付订单' };

  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(params.programId) as any;
  if (!program) return { error: '洗衣程序不存在' };

  db.prepare(`
    UPDATE orders
    SET program_id = ?, start_time = CURRENT_TIMESTAMP, order_status = 'running'
    WHERE id = ?
  `).run(params.programId, params.orderId);

  db.prepare(`
    UPDATE devices SET status = 'running', lock_status = 1 WHERE id = ?
  `).run(order.device_id);

  db.prepare(`
    INSERT INTO device_commands (device_id, command, params)
    VALUES (?, 'start', ?)
  `).run(order.device_id, JSON.stringify({ programId: params.programId, duration: program.duration_minutes }));

  return formatOrder(db.prepare(`
    SELECT o.*, p.name as program_name, p.duration_minutes, d.name as device_name
    FROM orders o
    LEFT JOIN programs p ON o.program_id = p.id
    LEFT JOIN devices d ON o.device_id = d.id
    WHERE o.id = ?
  `).get(params.orderId));
}

export function pauseOrder(orderId: number): any {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return { error: '订单不存在' };
  if (order.order_status !== 'running') return { error: '订单未运行' };

  db.prepare("UPDATE orders SET order_status = 'paused' WHERE id = ?").run(orderId);
  db.prepare(`
    INSERT INTO device_commands (device_id, command, params)
    VALUES (?, 'pause', '{}')
  `).run(order.device_id);

  return { success: true };
}

export function continueOrder(orderId: number): any {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return { error: '订单不存在' };
  if (order.order_status !== 'paused') return { error: '订单未暂停' };

  db.prepare("UPDATE orders SET order_status = 'running' WHERE id = ?").run(orderId);
  db.prepare(`
    INSERT INTO device_commands (device_id, command, params)
    VALUES (?, 'continue', '{}')
  `).run(order.device_id);

  return { success: true };
}

export function payOrder(params: PayOrderParams): any {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.orderId) as any;
  if (!order) return { error: '订单不存在' };
  if (order.pay_status === 'paid') return { error: '订单已支付' };

  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(order.program_id) as any;
  const amount = order.total_cost || (program ? program.price : 0);

  const transactionNo = `TXN${Date.now()}`;
  db.prepare(`
    UPDATE orders
    SET pay_status = 'paid', pay_method = ?, pay_amount = ?, total_cost = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(params.payMethod, amount, amount, params.orderId);

  db.prepare(`
    INSERT INTO payments (order_id, user_id, amount, method, transaction_no, status, paid_at)
    VALUES (?, ?, ?, ?, ?, 'success', CURRENT_TIMESTAMP)
  `).run(params.orderId, order.user_id, amount, params.payMethod, transactionNo);

  if (params.payMethod === 'balance') {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, order.user_id);
  }

  return { success: true, transactionNo, amount };
}

export function getOrderById(orderId: number): any {
  return formatOrder(db.prepare(`
    SELECT o.*, p.name as program_name, p.duration_minutes, p.price,
           d.name as device_name, d.device_no, d.type as device_type, d.location,
           u.phone as user_phone, u.nickname as user_name, u.balance as user_balance,
           pay.paid_at
    FROM orders o
    LEFT JOIN programs p ON o.program_id = p.id
    LEFT JOIN devices d ON o.device_id = d.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN (
      SELECT order_id, MAX(paid_at) as paid_at
      FROM payments
      WHERE status = 'success'
      GROUP BY order_id
    ) pay ON pay.order_id = o.id
    WHERE o.id = ?
  `).get(orderId));
}

export function getUserOrders(userId: number, status?: string): any[] {
  let sql = `
    SELECT o.*, p.name as program_name, p.duration_minutes, d.name as device_name, d.device_no, d.location
    FROM orders o
    LEFT JOIN programs p ON o.program_id = p.id
    LEFT JOIN devices d ON o.device_id = d.id
    WHERE o.user_id = ?
  `;
  const params: any[] = [userId];

  if (status) {
    if (status === 'pending') {
      sql += " AND o.pay_status != 'paid' AND o.order_status = 'created'";
    } else if (status === 'paid') {
      sql += " AND o.pay_status = 'paid' AND o.order_status = 'created'";
    } else if (status === 'washing') {
      sql += " AND o.order_status IN ('running', 'paused')";
    } else {
      sql += ' AND o.order_status = ?';
      params.push(status);
    }
  }

  sql += ' ORDER BY o.created_at DESC';
  return db.prepare(sql).all(...params).map(formatOrder);
}

export function getOrderStats(): any {
  const totals = db.prepare(`
    SELECT
      COUNT(*) as totalOrders,
      COALESCE(SUM(total_cost), 0) as totalRevenue,
      SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as todayOrders,
      COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total_cost ELSE 0 END), 0) as todayRevenue
    FROM orders
  `).get() as any;

  return {
    totalOrders: totals.totalOrders || 0,
    totalRevenue: totals.totalRevenue || 0,
    todayOrders: totals.todayOrders || 0,
    todayRevenue: totals.todayRevenue || 0
  };
}

export function getOrderEnergyData(orderId: number): any {
  const order = getOrderById(orderId);
  if (!order) return null;

  return {
    totalPower: 0.5,
    totalWater: 30,
    energyCost: 0.8,
    timePoints: ['0', '5', '10', '15', '20', '25', '30'],
    power: [200, 500, 800, 800, 650, 420, 180],
    temperature: [20, 30, 45, 50, 45, 35, 25]
  };
}
