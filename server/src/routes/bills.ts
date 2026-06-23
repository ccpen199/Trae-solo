import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Bill } from '../entities/Bill';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';
import { BillService } from '../services/billService';
import { MessageService } from '../services/messageService';
import { Message } from '../entities/Message';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Bill);
    const user = req.user!;
    const where: any = {};
    if (user.role === 'owner') {
      where.userId = user.id;
    } else if (user.role !== 'admin') {
      where.communityId = user.communityId;
    }
    if (req.query.status) where.status = req.query.status;
    if (req.query.period) where.period = req.query.period;
    const bills = await repo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Bill);
    const bill = await repo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'project'],
    });
    if (!bill) return res.status(404).json({ message: '账单不存在' });
    res.json(bill);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['admin', 'property']), async (req: AuthRequest, res, next) => {
  try {
    const billService = new BillService(
      AppDataSource.getRepository(Bill),
      AppDataSource.getRepository(User)
    );
    const bill = await billService.generateCustomBill(req.body);
    res.status(201).json(bill);
  } catch (err) {
    next(err);
  }
});

router.post('/batch-generate', auth(['admin', 'property']), async (req: AuthRequest, res, next) => {
  try {
    const { communityId, projectId, period } = req.body;
    const billService = new BillService(
      AppDataSource.getRepository(Bill),
      AppDataSource.getRepository(User)
    );
    const bills = await billService.generateMonthlyBills(communityId, projectId, period);

    const messageService = new MessageService(AppDataSource.getRepository(Message));
    for (const bill of bills) {
      await messageService.sendMessage({
        userId: bill.userId,
        title: '物业费账单提醒',
        content: `您有一笔 ${bill.amount} 元的物业费账单待缴纳，请及时处理。`,
        category: 'bill',
        channels: { inbox: true, template: true, sms: true },
      });
    }

    res.json({ count: bills.length, bills });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pay', auth(), async (req: AuthRequest, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const billService = new BillService(
      AppDataSource.getRepository(Bill),
      AppDataSource.getRepository(User)
    );
    const bill = await billService.processPayment(req.params.id, paymentMethod || 'wechat');
    if (!bill) return res.status(400).json({ message: '支付失败' });

    const messageService = new MessageService(AppDataSource.getRepository(Message));
    await messageService.sendMessage({
      userId: bill.userId,
      title: '缴费成功',
      content: `您已成功缴纳 ${bill.amount} 元物业费，感谢您的配合。`,
      category: 'bill',
      channels: { inbox: true, template: true },
    });

    res.json(bill);
  } catch (err) {
    next(err);
  }
});

export default router;
