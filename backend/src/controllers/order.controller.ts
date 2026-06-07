import { Response } from 'express';
import { AppDataSource } from '../data-source';
import { Order, OrderStatus } from '../models/Order';
import { OrderItem, ItemType } from '../models/OrderItem';
import { OrderLog, LogType } from '../models/OrderLog';
import { ServiceSKU } from '../models/ServiceSKU';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { findBestProvider } from '../utils/dispatch';
import dayjs from 'dayjs';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { items, customerAddress, latitude, longitude, scheduledTime, customerNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: '请选择服务项目' });
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const orderLogRepository = AppDataSource.getRepository(OrderLog);
    const skuRepository = AppDataSource.getRepository(ServiceSKU);
    const userRepository = AppDataSource.getRepository(User);

    const orderNo = `HS${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    let totalAmount = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      if (item.type === ItemType.SERVICE) {
        const sku = await skuRepository.findOneBy({ id: item.skuId });
        if (!sku) {
          return res.status(400).json({ error: `服务不存在: ${item.skuId}` });
        }
        const subtotal = sku.price * (item.quantity || 1);
        totalAmount += subtotal;
        orderItemsData.push({
          type: ItemType.SERVICE,
          serviceSkuId: sku.id,
          name: sku.name,
          price: sku.price,
          quantity: item.quantity || 1,
          subtotal,
        });
      }
    }

    const platformFee = totalAmount * 0.1;
    const serviceFee = 0;

    const orderData: any = {
      orderNo,
      customerId: req.user.id,
      status: OrderStatus.PENDING_DISPATCH,
      totalAmount,
      platformFee,
      serviceFee,
      customerAddress,
      latitude,
      longitude,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      customerNotes,
    };

    const savedOrder = await orderRepository.save(orderData);

    for (const itemData of orderItemsData) {
      itemData.orderId = savedOrder.id;
      await orderItemRepository.save(itemData);
    }

    const providers = await userRepository.find({
      where: { role: UserRole.PROVIDER, isVerified: true },
    });

    const bestProvider = findBestProvider(
      providers,
      latitude || 39.9042,
      longitude || 116.4074,
      [1, 2, 3]
    );

    if (bestProvider) {
      savedOrder.providerId = bestProvider.provider.id;
      savedOrder.status = OrderStatus.DISPATCHED;
      await orderRepository.save(savedOrder);

      const dispatchLogData: any = {
        orderId: savedOrder.id,
        operatorId: undefined,
        type: LogType.STATUS_CHANGE,
        message: `系统已自动派单给 ${bestProvider.provider.name}，距离 ${bestProvider.distance.toFixed(2)}km`,
        metadata: {
          providerId: bestProvider.provider.id,
          providerName: bestProvider.provider.name,
          distance: bestProvider.distance,
          score: bestProvider.score,
        },
      };
      await orderLogRepository.save(dispatchLogData);
    }

    const createLogData = {
      orderId: savedOrder.id,
      operatorId: req.user.id,
      type: LogType.STATUS_CHANGE,
      message: '订单创建成功',
    };
    await orderLogRepository.save(createLogData);

    const finalOrder = await orderRepository.findOne({
      where: { id: savedOrder.id } as any,
      relations: { items: true, logs: true, customer: true, provider: true } as any,
    });

    res.status(201).json({ order: finalOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { status, role } = req.query;
    const orderRepository = AppDataSource.getRepository(Order);

    let where: any = {};
    if (req.user.role === UserRole.ADMIN) {
      where = {};
    } else if (role === 'provider' || req.user.role === UserRole.PROVIDER) {
      where.providerId = req.user.id;
    } else {
      where.customerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    const orders = await orderRepository.find({
      where,
      relations: { items: true, customer: true, provider: true } as any,
      order: { createdAt: 'DESC' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { id } = req.params;
    const orderRepository = AppDataSource.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id: parseInt(String(id)) } as any,
      relations: { items: true, logs: { operator: true }, customer: true, provider: true } as any,
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (
      req.user.role !== UserRole.ADMIN &&
      order.customerId !== req.user.id &&
      order.providerId !== req.user.id
    ) {
      return res.status(403).json({ error: '无权访问该订单' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: '获取订单详情失败' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const orderLogRepository = AppDataSource.getRepository(OrderLog);

    const order = await orderRepository.findOneBy({ id: parseInt(String(id)) } as any);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (
      req.user.role !== UserRole.ADMIN &&
      order.customerId !== req.user.id &&
      order.providerId !== req.user.id
    ) {
      return res.status(403).json({ error: '无权操作该订单' });
    }

    const statusMessages: Record<string, string> = {
      [OrderStatus.ACCEPTED]: '师傅已接单',
      [OrderStatus.SCHEDULED]: '已预约上门时间',
      [OrderStatus.EN_ROUTE]: '师傅已出发',
      [OrderStatus.IN_PROGRESS]: '服务进行中',
      [OrderStatus.COMPLETED]: '服务已完成',
      [OrderStatus.CANCELLED]: '订单已取消',
    };

    order.status = status;

    if (status === OrderStatus.ACCEPTED) order.acceptedTime = new Date();
    if (status === OrderStatus.IN_PROGRESS) order.startedTime = new Date();
    if (status === OrderStatus.COMPLETED) order.completedTime = new Date();

    await orderRepository.save(order);

    const logData = {
      orderId: order.id,
      operatorId: req.user.id,
      type: LogType.STATUS_CHANGE,
      message: statusMessages[status] || `订单状态更新为: ${status}`,
      metadata: { notes },
    };
    await orderLogRepository.save(logData);

    res.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: '更新订单状态失败' });
  }
};

export const addOrderLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { id } = req.params;
    const { type, message, photoUrl, latitude, longitude, metadata } = req.body;

    const orderLogRepository = AppDataSource.getRepository(OrderLog);

    const logData = {
      orderId: parseInt(String(id)),
      operatorId: req.user.id,
      type: type || LogType.NOTE,
      message,
      photoUrl,
      latitude,
      longitude,
      metadata,
    };

    const log = await orderLogRepository.save(logData);

    res.status(201).json({ log });
  } catch (error) {
    console.error('Add order log error:', error);
    res.status(500).json({ error: '添加工单日志失败' });
  }
};

export const getNearbyProviders = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, maxDistance = 10 } = req.query;

    const userRepository = AppDataSource.getRepository(User);
    const providers = await userRepository.find({
      where: { role: UserRole.PROVIDER, isVerified: true },
    });

    const { rankProviders } = await import('../utils/dispatch');
    const ranked = rankProviders(
      providers,
      parseFloat(lat as string) || 39.9042,
      parseFloat(lng as string) || 116.4074,
      []
    );

    const filtered = ranked.filter(p => p.distance <= parseFloat(maxDistance as string));

    res.json({
      providers: filtered.map(p => ({
        ...p.provider,
        distance: p.distance,
        score: p.score,
        password: undefined,
      })),
    });
  } catch (error) {
    console.error('Get nearby providers error:', error);
    res.status(500).json({ error: '获取附近师傅失败' });
  }
};
