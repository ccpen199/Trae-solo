import { Response } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Dispute, DisputeStatus, DisputeType, ArbitrationResult } from '../models/Dispute';
import { DisputeMessage, MessageSender } from '../models/DisputeMessage';
import { Order, OrderStatus } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

export const createDispute = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { orderId, type, description, evidence, requestedRefund } = req.body;

    if (!orderId || !type || !description) {
      return res.status(400).json({ error: '订单ID、争议类型和描述不能为空' });
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const disputeRepository = AppDataSource.getRepository(Dispute);

    const order = await orderRepository.findOneBy({ id: orderId } as any);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.customerId !== req.user.id && order.providerId !== req.user.id) {
      return res.status(403).json({ error: '只能对自己的订单发起争议' });
    }

    const existingDispute = await disputeRepository.findOne({
      where: { orderId, status: DisputeStatus.OPEN } as any,
    });
    if (existingDispute) {
      return res.status(400).json({ error: '该订单已有未处理的争议' });
    }

    const disputeData = {
      orderId,
      initiatorId: req.user.id,
      type,
      description,
      evidence,
      requestedRefund,
    };

    const dispute = await disputeRepository.save(disputeData);

    order.status = OrderStatus.DISPUTED;
    await orderRepository.save(order);

    res.status(201).json({ dispute });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: '创建争议失败' });
  }
};

export const getDisputes = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const disputeRepository = AppDataSource.getRepository(Dispute);
    let where: any = {};

    if (req.user.role === UserRole.CUSTOMER) {
      const orderRepository = AppDataSource.getRepository(Order);
      const myOrders = await orderRepository.find({ where: { customerId: req.user.id } });
      if (myOrders.length > 0) {
        where.orderId = In(myOrders.map(o => o.id));
      } else {
        where.orderId = In([-1]);
      }
    } else if (req.user.role === UserRole.PROVIDER) {
      const orderRepository = AppDataSource.getRepository(Order);
      const myOrders = await orderRepository.find({ where: { providerId: req.user.id } });
      if (myOrders.length > 0) {
        where.orderId = In(myOrders.map(o => o.id));
      } else {
        where.orderId = In([-1]);
      }
    }

    const disputes = await disputeRepository.find({
      where,
      relations: { order: true, initiator: true, messages: true } as any,
      order: { createdAt: 'DESC' },
    });

    res.json({ disputes });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: '获取争议列表失败' });
  }
};

export const getDisputeById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { id } = req.params;
    const disputeRepository = AppDataSource.getRepository(Dispute);

    const dispute = await disputeRepository.findOne({
      where: { id: parseInt(String(id)) } as any,
      relations: { order: true, initiator: true, messages: { sender: true } } as any,
    });

    if (!dispute) {
      return res.status(404).json({ error: '争议不存在' });
    }

    if (req.user.role !== UserRole.ADMIN) {
      if (dispute.order.customerId !== req.user.id && dispute.order.providerId !== req.user.id) {
        return res.status(403).json({ error: '无权访问该争议' });
      }
    }

    res.json({ dispute });
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({ error: '获取争议详情失败' });
  }
};

export const addDisputeMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!content) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    const disputeRepository = AppDataSource.getRepository(Dispute);
    const messageRepository = AppDataSource.getRepository(DisputeMessage);

    const dispute = await disputeRepository.findOne({
      where: { id: parseInt(String(id)) } as any,
      relations: { order: true } as any,
    });

    if (!dispute) {
      return res.status(404).json({ error: '争议不存在' });
    }

    let senderType: MessageSender;
    if (req.user.role === UserRole.ADMIN) {
      senderType = MessageSender.PLATFORM;
    } else if (dispute.order.customerId === req.user.id) {
      senderType = MessageSender.CUSTOMER;
    } else if (dispute.order.providerId === req.user.id) {
      senderType = MessageSender.PROVIDER;
    } else {
      return res.status(403).json({ error: '无权参与该争议' });
    }

    const messageData = {
      disputeId: dispute.id,
      senderId: req.user.id,
      senderType,
      content,
      attachments,
    };

    const message = await messageRepository.save(messageData);

    if (dispute.status === DisputeStatus.OPEN) {
      dispute.status = DisputeStatus.NEGOTIATING;
      await disputeRepository.save(dispute);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Add dispute message error:', error);
    res.status(500).json({ error: '添加消息失败' });
  }
};

export const arbitrateDispute = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { id } = req.params;
    const { result, refundAmount, notes } = req.body;

    if (!result) {
      return res.status(400).json({ error: '仲裁结果不能为空' });
    }

    const disputeRepository = AppDataSource.getRepository(Dispute);

    const dispute = await disputeRepository.findOneBy({ id: parseInt(String(id)) } as any);

    if (!dispute) {
      return res.status(404).json({ error: '争议不存在' });
    }

    dispute.arbitrationResult = result;
    dispute.arbitrationRefund = refundAmount;
    dispute.arbitrationNotes = notes;
    dispute.arbitratorId = req.user.id;
    dispute.arbitrationTime = new Date();
    dispute.status = DisputeStatus.RESOLVED;

    await disputeRepository.save(dispute);

    res.json({ dispute });
  } catch (error) {
    console.error('Arbitrate dispute error:', error);
    res.status(500).json({ error: '仲裁失败' });
  }
};
