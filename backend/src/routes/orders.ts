import { Router } from 'express';
import {
  createOrder,
  getOrderList,
  getOrderById,
  getOrderByNo,
  updateOrderStatus,
  getPlatformOrderStats,
  getPendingOrders,
} from '../services/orderService';
import { dispatchOrder, acceptAssignment, rejectAssignment } from '../services/dispatchEngine';
import { settleOrderIncome } from '../services/incomeService';
import { autoTriggerComplaint } from '../services/complaintService';
import { rewardOnTimeDelivery } from '../services/creditService';
import { nowTimestamp } from '../utils';

const router = Router();

router.get('/', (req, res) => {
  const { status, platform, rider_id, page, pageSize, startDate, endDate } = req.query;
  const result = getOrderList({
    status: status as any,
    platform: platform as any,
    rider_id: rider_id ? parseInt(rider_id as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
  });
  res.json({ code: 0, data: result });
});

router.get('/pending', (req, res) => {
  const orders = getPendingOrders();
  res.json({ code: 0, data: orders });
});

router.get('/platform-stats', (req, res) => {
  const stats = getPlatformOrderStats();
  res.json({ code: 0, data: stats });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const order = getOrderById(id);
  if (!order) {
    res.status(404).json({ code: 1, message: '订单不存在' });
    return;
  }
  res.json({ code: 0, data: order });
});

router.get('/no/:orderNo', (req, res) => {
  const order = getOrderByNo(req.params.orderNo);
  if (!order) {
    res.status(404).json({ code: 1, message: '订单不存在' });
    return;
  }
  res.json({ code: 0, data: order });
});

router.post('/', (req, res) => {
  const order = createOrder(req.body);
  const candidates = dispatchOrder(order.id);
  res.json({ code: 0, data: { order, candidates } });
});

router.post('/:id/dispatch', (req, res) => {
  const id = parseInt(req.params.id);
  const candidates = dispatchOrder(id);
  res.json({ code: 0, data: candidates });
});

router.put('/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const success = updateOrderStatus(id, status, req.body);

  if (success && status === 'delivered') {
    const order = getOrderById(id);
    if (order?.assigned_rider_id) {
      settleOrderIncome(id, order.assigned_rider_id);
      rewardOnTimeDelivery(order.assigned_rider_id, id);
    }
  }

  if (success && status === 'cancelled') {
    const order = getOrderById(id);
    if (order?.assigned_rider_id) {
      const { updateRiderStatus } = require('../services/riderService');
      updateRiderStatus(order.assigned_rider_id, 'online');
    }
  }

  res.json({ code: success ? 0 : 1, data: { success } });
});

router.post('/:id/accept', (req, res) => {
  const id = parseInt(req.params.id);
  const { rider_id, assignment_id } = req.body;
  const success = acceptAssignment(assignment_id, rider_id);
  res.json({ code: success ? 0 : 1, data: { success } });
});

router.post('/:id/reject', (req, res) => {
  const id = parseInt(req.params.id);
  const { rider_id, assignment_id } = req.body;
  const success = rejectAssignment(assignment_id, rider_id);
  res.json({ code: success ? 0 : 1, data: { success } });
});

router.post('/:id/complaint', (req, res) => {
  const id = parseInt(req.params.id);
  const { type, rider_id } = req.body;
  const complaint = autoTriggerComplaint(id, type, rider_id);
  res.json({ code: complaint ? 0 : 1, data: complaint });
});

export default router;
