import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { WorkOrder } from '../entities/WorkOrder';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';
import { DispatchService } from '../services/dispatchService';
import { MessageService } from '../services/messageService';
import { Message } from '../entities/Message';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(WorkOrder);
    const user = req.user!;
    const where: any = {};
    if (user.role === 'owner') {
      where.userId = user.id;
    } else if (user.role === 'worker') {
      where.assignedToId = user.id;
    } else if (user.role !== 'admin') {
      where.communityId = user.communityId;
    }
    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;
    const workOrders = await repo.find({
      where,
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
    res.json(workOrders);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(WorkOrder);
    const workOrder = await repo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'assignedTo', 'project', 'community'],
    });
    if (!workOrder) return res.status(404).json({ message: '工单不存在' });
    res.json(workOrder);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['owner']), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const repo = AppDataSource.getRepository(WorkOrder);
    const workOrder = repo.create({
      id: uuidv4(),
      userId: user.id,
      communityId: user.communityId,
      projectId: user.projectId,
      ...req.body,
      status: 'pending',
    });
    const saved = (await repo.save(workOrder)) as unknown as WorkOrder;

    const dispatchService = new DispatchService(
      AppDataSource.getRepository(WorkOrder),
      AppDataSource.getRepository(User)
    );
    const dispatched = await dispatchService.autoDispatch(saved.id);

    if (dispatched && dispatched.assignedToId) {
      const messageService = new MessageService(AppDataSource.getRepository(Message));
      await messageService.sendMessage({
        userId: dispatched.assignedToId,
        title: '新工单分配',
        content: `您有一个新的维修工单：${dispatched.title}，请及时处理。`,
        category: 'workorder',
        channels: { inbox: true, sms: true, template: true },
      });
    }

    res.status(201).json(dispatched || saved);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/assign', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const { workerId } = req.body;
    const dispatchService = new DispatchService(
      AppDataSource.getRepository(WorkOrder),
      AppDataSource.getRepository(User)
    );
    const workOrder = await dispatchService.manualDispatch(req.params.id, workerId);
    if (!workOrder) return res.status(400).json({ message: '派单失败' });

    const messageService = new MessageService(AppDataSource.getRepository(Message));
    await messageService.sendMessage({
      userId: workerId,
      title: '新工单分配',
      content: `您有一个新的维修工单：${workOrder.title}，请及时处理。`,
      category: 'workorder',
      channels: { inbox: true, sms: true },
    });

    res.json(workOrder);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', auth(['worker', 'admin', 'property']), async (req, res, next) => {
  try {
    const dispatchService = new DispatchService(
      AppDataSource.getRepository(WorkOrder),
      AppDataSource.getRepository(User)
    );
    const workOrder = await dispatchService.completeWorkOrder(req.params.id);
    if (!workOrder) return res.status(400).json({ message: '操作失败' });

    const messageService = new MessageService(AppDataSource.getRepository(Message));
    await messageService.sendMessage({
      userId: workOrder.userId,
      title: '维修完成',
      content: `您的工单「${workOrder.title}」已完成，请对服务进行评价。`,
      category: 'workorder',
      channels: { inbox: true, template: true },
    });

    res.json(workOrder);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/rate', auth(['owner']), async (req: AuthRequest, res, next) => {
  try {
    const { rating, comment } = req.body;
    const dispatchService = new DispatchService(
      AppDataSource.getRepository(WorkOrder),
      AppDataSource.getRepository(User)
    );
    const workOrder = await dispatchService.rateWorkOrder(req.params.id, rating, comment);
    if (!workOrder) return res.status(400).json({ message: '评价失败' });
    res.json(workOrder);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(WorkOrder);
    const workOrder = await repo.findOne({ where: { id: req.params.id } });
    if (!workOrder) return res.status(404).json({ message: '工单不存在' });
    repo.merge(workOrder, req.body);
    await repo.save(workOrder);
    res.json(workOrder);
  } catch (err) {
    next(err);
  }
});

export default router;
