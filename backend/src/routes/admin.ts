import { Router, Response } from 'express';
import db from '../database';
import {
  getGisHeatmapData,
  getAdminDeviceList,
  createDevice,
  updateDevice,
  getWorkOrders,
  assignWorkOrder,
  getEnergyReport,
  getSettlementBills,
  getAlerts,
  resolveAlert,
  getBrandConfig,
  updateBrandConfig,
  getPropertyList,
  getManufacturerList,
  getProgramList
} from '../services/adminService';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('admin', 'property', 'platform', 'ops', 'manufacturer'));

router.get('/dashboard', (req, res: Response) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM devices) as totalDevices,
      (SELECT COUNT(*) FROM devices WHERE status != 'fault') as onlineDevices,
      (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE('now')) as todayOrders,
      (SELECT COALESCE(SUM(pay_amount), 0) FROM orders WHERE DATE(created_at) = DATE('now')) as todayRevenue,
      (SELECT COALESCE(SUM(pay_amount), 0) FROM orders) as totalRevenue,
      (SELECT COUNT(*) FROM users) as totalUsers,
      (SELECT COUNT(*) FROM alerts WHERE status = 'active') as activeAlerts,
      (SELECT COUNT(*) FROM work_orders WHERE status = 'pending') as pendingWorkOrders
  `).get();
  success(res, stats);
});

router.get('/devices/gis', (req, res: Response) => {
  const data = getGisHeatmapData();
  success(res, data);
});

router.get('/devices', (req, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
  const filters = {
    type: req.query.type as string,
    status: req.query.status as string,
    property_id: req.query.property_id ? parseInt(req.query.property_id as string, 10) : undefined
  };

  const result = getAdminDeviceList(page, pageSize, filters);
  success(res, result);
});

router.post('/devices', (req, res: Response) => {
  const { device_no, qr_code, name, type, location, address, lat, lng, property_id, manufacturer_id } = req.body;
  if (!device_no || !qr_code || !type) {
    error(res, '设备编号、二维码和类型不能为空');
    return;
  }

  const id = createDevice({ device_no, qr_code, name, type, location, address, lat, lng, property_id, manufacturer_id });
  success(res, { id }, '创建设备成功');
});

router.put('/devices/:id', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = updateDevice(id, req.body);
  if (!updated) {
    error(res, '设备不存在', 404);
    return;
  }
  success(res, { success: true }, '更新成功');
});

router.post('/firmware/upload', (req, res: Response) => {
  success(res, { success: true }, '固件上传成功');
});

router.post('/firmware/push', (req, res: Response) => {
  success(res, { success: true }, '固件推送成功');
});

router.get('/firmware', (req, res: Response) => {
  const list = db.prepare(`
    SELECT id, version, file_path, device_type, description, status, created_at
    FROM firmware_upgrades
    ORDER BY id DESC
  `).all().map((row: any) => ({
    ...row,
    name: `固件版本 ${row.version}`,
    fileSize: 1024 * 8,
    uploadTime: row.created_at,
    uploader: '管理员',
    deviceCount: 0
  }));
  success(res, { list, total: list.length });
});

router.post('/firmware/:id/push', (req, res: Response) => {
  success(res, { success: true }, '固件推送成功');
});

router.get('/work-orders', (req, res: Response) => {
  const status = req.query.status as string;
  const orders = getWorkOrders(status);
  success(res, { list: orders, total: orders.length });
});

router.get('/workorders', (req, res: Response) => {
  const status = req.query.status as string;
  const orders = getWorkOrders(status);
  success(res, { list: orders, total: orders.length });
});

router.get('/work-orders/:id', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const order = getWorkOrders().find((item) => item.id === id);
  if (!order) {
    error(res, '工单不存在', 404);
    return;
  }
  success(res, order);
});

router.post('/work-orders', (req, res: Response) => {
  const deviceId = parseInt(req.body.deviceId || req.body.device_id, 10);
  if (!deviceId || !req.body.description) {
    error(res, '设备和问题描述不能为空');
    return;
  }
  const result = db.prepare(`
    INSERT INTO work_orders (device_id, fault_code, description, reporter_id, status, priority)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(deviceId, req.body.title || '维修工单', req.body.description, (req as AuthRequest).user!.userId, req.body.priority || 'normal');
  success(res, { id: result.lastInsertRowid }, '创建工单成功');
});

router.post('/workorders', (req, res: Response) => {
  const deviceId = parseInt(req.body.deviceId || req.body.device_id, 10);
  if (!deviceId || !req.body.description) {
    error(res, '设备和问题描述不能为空');
    return;
  }
  const result = db.prepare(`
    INSERT INTO work_orders (device_id, fault_code, description, reporter_id, status, priority)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(deviceId, req.body.title || '维修工单', req.body.description, (req as AuthRequest).user!.userId, req.body.priority || 'medium');
  success(res, { id: result.lastInsertRowid }, '创建工单成功');
});

router.put('/work-orders/:id', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const result = db.prepare(`
    UPDATE work_orders
    SET fault_code = COALESCE(?, fault_code),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(req.body.title || req.body.fault_code, req.body.description, req.body.priority, req.body.status, id);
  if (result.changes === 0) {
    error(res, '工单不存在', 404);
    return;
  }
  success(res, { success: true }, '更新成功');
});

router.put('/workorders/:id', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const result = db.prepare(`
    UPDATE work_orders
    SET fault_code = COALESCE(?, fault_code),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(req.body.title || req.body.fault_code, req.body.description, req.body.priority, req.body.status, id);
  if (result.changes === 0) {
    error(res, '工单不存在', 404);
    return;
  }
  success(res, { success: true }, '更新成功');
});

router.post('/work-orders/:id/assign', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const handlerId = req.body.handlerId || req.body.technicianId;
  if (!handlerId) {
    error(res, '处理人ID不能为空');
    return;
  }

  const updated = assignWorkOrder(id, handlerId);
  if (!updated) {
    error(res, '工单不存在', 404);
    return;
  }
  success(res, { success: true }, '派单成功');
});

router.post('/workorders/:id/assign', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const handlerId = req.body.handlerId || req.body.technicianId;
  if (!handlerId) {
    error(res, '处理人ID不能为空');
    return;
  }

  const updated = assignWorkOrder(id, handlerId);
  if (!updated) {
    error(res, '工单不存在', 404);
    return;
  }
  success(res, { success: true }, '派单成功');
});

router.get('/reports/energy', (req, res: Response) => {
  const startDate = req.query.startDate as string || '2024-01-01';
  const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];
  const report = getEnergyReport(startDate, endDate);
  success(res, report);
});

router.get('/reports/settlement', (req, res: Response) => {
  const bills = getSettlementBills();
  success(res, bills);
});

router.get('/alerts', (req, res: Response) => {
  const status = req.query.status as string;
  const alerts = getAlerts(status);
  success(res, alerts);
});

router.post('/alerts/:id/resolve', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = resolveAlert(id);
  if (!updated) {
    error(res, '告警不存在', 404);
    return;
  }
  success(res, { success: true }, '告警已处理');
});

router.put('/alerts/:id/handle', (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const status = req.body.status || 'resolved';
  const result = db.prepare(`
    UPDATE alerts SET status = ?, resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, id);
  if (result.changes === 0) {
    error(res, '告警不存在', 404);
    return;
  }
  success(res, { success: true }, '告警已处理');
});

router.get('/brand-config', (req: AuthRequest, res: Response) => {
  const propertyId = req.query.property_id ? parseInt(req.query.property_id as string, 10) : undefined;
  const config = getBrandConfig(propertyId);
  success(res, config);
});

router.get('/brand/config', (req: AuthRequest, res: Response) => {
  const propertyId = req.query.property_id ? parseInt(req.query.property_id as string, 10) : undefined;
  const config = getBrandConfig(propertyId);
  success(res, config);
});

router.put('/brand-config', (req, res: Response) => {
  const { id } = req.body;
  if (!id) {
    error(res, '配置ID不能为空');
    return;
  }
  const updated = updateBrandConfig(id, {
    ...req.body,
    primary_color: req.body.primary_color || req.body.primaryColor,
    logo_url: req.body.logo_url || req.body.brandLogo,
    app_name: req.body.app_name || req.body.brandName,
    welcome_text: req.body.welcome_text || req.body.brandSlogan
  });
  if (!updated) {
    error(res, '配置不存在', 404);
    return;
  }
  success(res, { success: true }, '配置更新成功');
});

router.put('/brand/config', (req, res: Response) => {
  const id = req.body.id || 1;
  const updated = updateBrandConfig(id, {
    ...req.body,
    primary_color: req.body.primary_color || req.body.primaryColor,
    logo_url: req.body.logo_url || req.body.brandLogo,
    app_name: req.body.app_name || req.body.brandName,
    welcome_text: req.body.welcome_text || req.body.brandSlogan
  });
  if (!updated) {
    error(res, '配置不存在', 404);
    return;
  }
  success(res, { success: true }, '配置更新成功');
});

router.get('/properties', (req, res: Response) => {
  const properties = getPropertyList();
  success(res, properties);
});

router.get('/manufacturers', (req, res: Response) => {
  const manufacturers = getManufacturerList();
  success(res, manufacturers);
});

router.get('/programs', (req, res: Response) => {
  const programs = getProgramList();
  success(res, programs);
});

router.get('/technicians', (req, res: Response) => {
  const technicians = db.prepare(`
    SELECT id, nickname as name, phone
    FROM users
    WHERE role IN ('ops', 'admin', 'property')
    ORDER BY id
  `).all();
  success(res, technicians);
});

export default router;
