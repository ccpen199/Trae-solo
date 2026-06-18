import prisma from '../config/prisma';
import logger from '../utils/logger';

export interface CreateOrderParams {
  userId: string;
  pileId: string;
  stationId: string;
  vin?: string;
  plateNumber?: string;
}

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  status?: string;
  stationId?: string;
  pileId?: string;
}

export const createOrder = async (params: CreateOrderParams) => {
  const { userId, pileId, stationId, vin, plateNumber } = params;

  const pile = await prisma.chargingPile.findUnique({ where: { id: pileId } });
  if (!pile) {
    throw new Error('充电桩不存在');
  }

  if (pile.status === 'charging') {
    throw new Error('充电桩正在充电中');
  }

  if (pile.status === 'fault') {
    throw new Error('充电桩故障，无法使用');
  }

  const order = await prisma.chargingOrder.create({
    data: {
      userId,
      pileId,
      stationId,
      status: 'pending',
      vin,
      plateNumber,
    },
  });

  return order;
};

export const startCharging = async (orderId: string) => {
  const order = await prisma.chargingOrder.findUnique({
    where: { id: orderId },
    include: { pile: true },
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'pending') {
    throw new Error('订单状态异常');
  }

  const updatedOrder = await prisma.chargingOrder.update({
    where: { id: orderId },
    data: {
      status: 'charging',
      startTime: new Date(),
      startSoc: order.pile.currentSoc || 0,
    },
  });

  await prisma.chargingPile.update({
    where: { id: order.pileId },
    data: { status: 'charging' },
  });

  return updatedOrder;
};

export const stopCharging = async (orderId: string) => {
  const order = await prisma.chargingOrder.findUnique({
    where: { id: orderId },
    include: { pile: true, station: true },
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'charging') {
    throw new Error('订单未在充电中');
  }

  const chargedKwh = 30.5;
  const electricFee = chargedKwh * Number(order.station.pricePerKwh);
  const serviceFee = chargedKwh * Number(order.station.serviceFee);
  const totalAmount = electricFee + serviceFee;

  const updatedOrder = await prisma.chargingOrder.update({
    where: { id: orderId },
    data: {
      status: 'completed',
      endTime: new Date(),
      endSoc: order.pile.currentSoc || 80,
      chargedKwh,
      electricFee,
      serviceFee,
      totalAmount,
    },
  });

  await prisma.chargingPile.update({
    where: { id: order.pileId },
    data: { status: 'idle' },
  });

  await prisma.userProfile.upsert({
    where: { userId: order.userId },
    update: {
      totalCharges: { increment: 1 },
      totalKwh: { increment: chargedKwh },
      totalAmount: { increment: totalAmount },
    },
    create: {
      userId: order.userId,
      totalCharges: 1,
      totalKwh: chargedKwh,
      totalAmount: totalAmount,
    },
  });

  return updatedOrder;
};

export const getOrderList = async (params: OrderQueryParams) => {
  const { page = 1, pageSize = 10, userId, status, stationId, pileId } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }
  if (status) {
    where.status = status;
  }
  if (stationId) {
    where.stationId = stationId;
  }
  if (pileId) {
    where.pileId = pileId;
  }

  const [orders, total] = await Promise.all([
    prisma.chargingOrder.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        station: { select: { id: true, name: true } },
        pile: { select: { id: true, pileNo: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chargingOrder.count({ where }),
  ]);

  return {
    list: orders,
    total,
    page,
    pageSize,
  };
};

export const getOrderById = async (orderId: string) => {
  const order = await prisma.chargingOrder.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, phone: true, nickname: true } },
      station: true,
      pile: true,
    },
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  return order;
};

export const getCurrentOrder = async (userId: string) => {
  const order = await prisma.chargingOrder.findFirst({
    where: {
      userId,
      status: { in: ['pending', 'charging'] },
    },
    include: {
      station: true,
      pile: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return order;
};

export default {
  createOrder,
  startCharging,
  stopCharging,
  getOrderList,
  getOrderById,
  getCurrentOrder,
};
