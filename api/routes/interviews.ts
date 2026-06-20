import { Router, type Request, type Response } from 'express';
import repo from '../services/repository.js';

const router = Router();

// GET /api/interviews - 获取面试订单列表
router.get('/', (req: Request, res: Response) => {
  const { workerId, brokerId, factoryId, status } = req.query;
  const orders = repo.getInterviewOrders({
    workerId: workerId as string,
    brokerId: brokerId as string,
    factoryId: factoryId as string,
    status: status as any,
  });
  res.json({ success: true, data: orders });
});

// POST /api/interviews - 创建面试预约
router.post('/', (req: Request, res: Response) => {
  const { workerId, jobId, scheduledDate, brokerId } = req.body;
  if (!workerId || !jobId) {
    return res.status(400).json({ success: false, error: '缺少必填参数: workerId, jobId' });
  }
  const job = repo.getJobById(jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: '岗位不存在' });
  }
  const order = repo.createInterviewOrder({
    workerId,
    jobId,
    factoryId: job.factoryId,
    scheduledDate: scheduledDate || new Date().toISOString(),
  });
  if (brokerId) {
    repo.assignBroker(order.id, brokerId);
  } else {
    const brokers = repo.getBrokers();
    if (brokers.length > 0) {
      repo.assignBroker(order.id, brokers[0].id);
    }
  }
  const finalOrder = repo.getInterviewOrderById(order.id);
  res.status(201).json({ success: true, data: finalOrder });
});

// GET /api/interviews/:id - 获取面试订单详情
router.get('/:id', (req: Request, res: Response) => {
  const order = repo.getInterviewOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: '面试订单不存在' });
  }
  res.json({ success: true, data: order });
});

// PATCH /api/interviews/:id/status - 更新面试/入职状态
router.patch('/:id/status', (req: Request, res: Response) => {
  const { status, event } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, error: '缺少状态参数' });
  }
  const updated = repo.updateInterviewOrderStatus(req.params.id, status, event);
  if (!updated) {
    return res.status(404).json({ success: false, error: '面试订单不存在' });
  }
  res.json({ success: true, data: updated });
});

// POST /api/interviews/:id/assign-broker - 指派经纪人
router.post('/:id/assign-broker', (req: Request, res: Response) => {
  const { brokerId } = req.body;
  if (!brokerId) {
    return res.status(400).json({ success: false, error: '缺少 brokerId' });
  }
  const updated = repo.assignBroker(req.params.id, brokerId);
  if (!updated) {
    return res.status(404).json({ success: false, error: '订单或经纪人不存在' });
  }
  res.json({ success: true, data: updated });
});

// POST /api/interviews/:id/schedule-pickup - 安排车接信息
router.post('/:id/schedule-pickup', (req: Request, res: Response) => {
  const updated = repo.schedulePickup(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: '订单不存在' });
  }
  res.json({ success: true, data: updated });
});

// POST /api/interviews/:id/check-document - 确认证件复印
router.post('/:id/check-document', (req: Request, res: Response) => {
  const updated = repo.updateInterviewOrderStatus(req.params.id, 'documents_copied', {
    type: '证件复印确认',
    description: req.body?.description || '身份证、学历证复印件已收集完成，照片6张已备齐',
    operator: req.body?.operator,
  });
  if (!updated) {
    return res.status(404).json({ success: false, error: '订单不存在' });
  }
  res.json({ success: true, data: updated });
});

// POST /api/interviews/:id/sign-training - 培训签到
router.post('/:id/sign-training', (req: Request, res: Response) => {
  const updated = repo.updateInterviewOrderStatus(req.params.id, 'training_done', {
    type: '岗前培训签到',
    description: 'EHS安全+岗位技能培训完成，已签到确认',
    operator: req.body?.operator,
  });
  if (!updated) {
    return res.status(404).json({ success: false, error: '订单不存在' });
  }
  res.json({ success: true, data: updated });
});

// POST /api/interviews/:id/arrived - 到达工厂签到
router.post('/:id/arrived', (req: Request, res: Response) => {
  const updated = repo.updateInterviewOrderStatus(req.params.id, 'arrived', {
    type: '到达工厂',
    description: '工人已到达工厂门卫，完成身份登记',
    operator: req.body?.operator,
  });
  if (!updated) {
    return res.status(404).json({ success: false, error: '订单不存在' });
  }
  res.json({ success: true, data: updated });
});

// POST /api/interviews/:id/result - 提交面试结果
router.post('/:id/result', (req: Request, res: Response) => {
  const { passed, remark, operator } = req.body;
  const status = passed ? 'passed' : 'failed';
  const updated = repo.updateInterviewOrderStatus(req.params.id, status as any, {
    type: '面试结果',
    description: passed ? `面试通过！${remark || ''}` : `面试未通过：${remark || '暂不符合要求'}`,
    operator,
  });
  if (!updated) {
    return res.status(404).json({ success: false, error: '订单不存在' });
  }
  res.json({ success: true, data: updated });
});

// POST /api/interviews/:id/employ - 确认入职并触发补贴
router.post('/:id/employ', (req: Request, res: Response) => {
  const subsidyAmount = req.body?.subsidyAmount || 1500;
  const updated = repo.updateInterviewOrderStatus(req.params.id, 'employed', {
    type: '确认入职',
    description: '工人已办理入职手续，正式上岗！在岗满7天将自动触发补贴',
    operator: req.body?.operator,
  });
  if (updated) {
    updated.subsidy = {
      triggered: false,
      amount: subsidyAmount,
      daysRequired: 7,
      daysCompleted: 0,
    };
  }
  res.json({ success: true, data: updated });
});

export default router;
