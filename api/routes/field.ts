import { Router } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error, paginated } from '../utils/response.js';
import { queryMany, queryOne, execute } from '../db.js';
import crypto from 'crypto';
import type { Store, Appointment, ServiceRecord, Review } from '../../shared/types.js';

const router = Router();

router.get('/stores', authMiddleware, (req, res) => {
  try {
    const region = req.query.region as string;

    let whereClause = 'WHERE status = ?';
    const params: unknown[] = ['active'];

    if (region) {
      whereClause += ' AND address LIKE ?';
      params.push(`%${region}%`);
    }

    const stores = queryMany<Store>(
      `SELECT s.*, u.real_name as owner_name
       FROM stores s
       LEFT JOIN users u ON s.owner_id = u.id
       ${whereClause}
       ORDER BY s.rating DESC`,
      params
    );

    const transformed = stores.map(s => ({
      ...s,
      ownerName: (s as unknown as { owner_name: string }).owner_name,
      businessHours: (s as unknown as { business_hours: string }).business_hours,
      services: (s as unknown as { services: string }).services ? JSON.parse((s as unknown as { services: string }).services) : [],
    }));

    res.json(success(transformed));
  } catch {
    res.status(500).json(error('获取生活馆列表失败', 500));
  }
});

router.get('/appointments', authMiddleware, roleMiddleware(['sales', 'store_owner', 'operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;

    let whereClause = '';
    const params: unknown[] = [];

    if (req.user?.role === 'sales') {
      whereClause = 'WHERE sales_id = ?';
      params.push(req.user.userId);
    } else if (req.user?.role === 'store_owner') {
      whereClause = 'WHERE store_id IN (SELECT id FROM stores WHERE owner_id = ?)';
      params.push(req.user.userId);
    }

    if (status) {
      whereClause += whereClause ? ' AND status = ?' : 'WHERE status = ?';
      params.push(status);
    }

    const offset = (page - 1) * pageSize;

    const appointments = queryMany<Appointment>(
      `SELECT * FROM appointments ${whereClause} ORDER BY appointment_time DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM appointments ${whereClause}`,
      params
    );

    const transformed = appointments.map(a => ({
      ...a,
      customerName: (a as unknown as { customer_name: string }).customer_name,
      storeId: (a as unknown as { store_id: number }).store_id,
      storeName: (a as unknown as { store_name: string }).store_name,
      salesId: (a as unknown as { sales_id: number }).sales_id,
      serviceType: (a as unknown as { service_type: string }).service_type,
      appointmentTime: (a as unknown as { appointment_time: string }).appointment_time,
      createdAt: (a as unknown as { created_at: string }).created_at,
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取预约列表失败', 500));
  }
});

router.post('/appointments', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req: AuthRequest, res) => {
  try {
    const { customerId, customerName, storeId, storeName, serviceType, appointmentTime, remark } = req.body;
    const salesId = req.user?.userId;

    execute(
      'INSERT INTO appointments (customer_id, customer_name, store_id, store_name, sales_id, service_type, appointment_time, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customerId, customerName, storeId, storeName, salesId, serviceType, appointmentTime, remark || null]
    );

    res.json(success({ created: true }, '预约创建成功'));
  } catch {
    res.status(500).json(error('创建预约失败', 500));
  }
});

router.put('/appointments/:id', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    execute(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json(success({ updated: true }, '预约状态更新成功'));
  } catch {
    res.status(500).json(error('更新预约失败', 500));
  }
});

router.get('/services', authMiddleware, roleMiddleware(['store_owner', 'operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    let whereClause = '';
    const params: unknown[] = [];

    if (req.user?.role === 'store_owner') {
      whereClause = 'WHERE store_id IN (SELECT id FROM stores WHERE owner_id = ?)';
      params.push(req.user.userId);
    }

    const offset = (page - 1) * pageSize;

    const services = queryMany<ServiceRecord>(
      `SELECT sr.*, c.name as customer_name, s.name as store_name
       FROM service_records sr
       LEFT JOIN customers c ON sr.customer_id = c.id
       LEFT JOIN stores s ON sr.store_id = s.id
       ${whereClause}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM service_records sr ${whereClause}`,
      params
    );

    const transformed = services.map(s => ({
      ...s,
      customerId: (s as unknown as { customer_id: number }).customer_id,
      customerName: (s as unknown as { customer_name: string }).customer_name,
      storeId: (s as unknown as { store_id: number }).store_id,
      storeName: (s as unknown as { store_name: string }).store_name,
      serviceItems: (s as unknown as { service_items: string }).service_items ? JSON.parse((s as unknown as { service_items: string }).service_items) : [],
      startTime: (s as unknown as { start_time: string }).start_time,
      endTime: (s as unknown as { end_time: string }).end_time,
      onChain: !!(s as unknown as { on_chain: number }).on_chain,
      txHash: (s as unknown as { tx_hash: string }).tx_hash,
      createdAt: (s as unknown as { created_at: string }).created_at,
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取服务记录失败', 500));
  }
});

router.post('/services', authMiddleware, roleMiddleware(['store_owner']), (req, res) => {
  try {
    const { appointmentId, customerId, storeId, serviceItems, startTime, endTime, operator, notes } = req.body;

    const txHash = '0x' + crypto.randomBytes(32).toString('hex');

    execute(
      'INSERT INTO service_records (appointment_id, customer_id, store_id, service_items, start_time, end_time, operator, notes, on_chain, tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [appointmentId || null, customerId, storeId, JSON.stringify(serviceItems), startTime, endTime, operator, notes || null, txHash]
    );

    res.json(success({ created: true, txHash }, '服务记录已上链存证'));
  } catch {
    res.status(500).json(error('录入服务记录失败', 500));
  }
});

router.get('/reviews', authMiddleware, roleMiddleware(['store_owner', 'operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    let whereClause = '';
    const params: unknown[] = [];

    if (req.user?.role === 'store_owner') {
      whereClause = 'WHERE store_id IN (SELECT id FROM stores WHERE owner_id = ?)';
      params.push(req.user.userId);
    }

    const offset = (page - 1) * pageSize;

    const reviews = queryMany<Review>(
      `SELECT * FROM reviews ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM reviews ${whereClause}`,
      params
    );

    const transformed = reviews.map(r => ({
      ...r,
      serviceRecordId: (r as unknown as { service_record_id: number }).service_record_id,
      customerId: (r as unknown as { customer_id: number }).customer_id,
      customerName: (r as unknown as { customer_name: string }).customer_name,
      storeId: (r as unknown as { store_id: number }).store_id,
      createdAt: (r as unknown as { created_at: string }).created_at,
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取客户评价失败', 500));
  }
});

export default router;
