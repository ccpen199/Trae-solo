import prisma from '../config/prisma';
import logger from '../utils/logger';

export interface OperatorQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  protocolType?: string;
}

export const getOperatorList = async (params: OperatorQueryParams) => {
  const { page = 1, pageSize = 10, status, protocolType } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (status) {
    where.status = status;
  }
  if (protocolType) {
    where.protocolType = protocolType;
  }

  const [operators, total] = await Promise.all([
    prisma.operator.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.operator.count({ where }),
  ]);

  return {
    list: operators,
    total,
    page,
    pageSize,
  };
};

export const getOperatorById = async (operatorId: string) => {
  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
    include: {
      stations: true,
    },
  });

  if (!operator) {
    throw new Error('运营商不存在');
  }

  return operator;
};

export const getSettlementRecords = async (operatorId: string, page: number = 1, pageSize: number = 20) => {
  const skip = (page - 1) * pageSize;

  const [records, total] = await Promise.all([
    prisma.settlementRecord.findMany({
      where: { operatorId },
      skip,
      take: pageSize,
      include: {
        order: { select: { id: true, totalAmount: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.settlementRecord.count({ where: { operatorId } }),
  ]);

  return {
    list: records,
    total,
    page,
    pageSize,
  };
};

export const createSettlement = async (operatorId: string, orderId: string) => {
  const order = await prisma.chargingOrder.findUnique({
    where: { id: orderId },
    include: { station: true },
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
  });

  if (!operator) {
    throw new Error('运营商不存在');
  }

  const amount = Number(order.totalAmount);
  const serviceFee = Number(order.serviceFee);
  const platformFee = amount * (1 - Number(operator.settlementRatio));

  const settlement = await prisma.settlementRecord.create({
    data: {
      operatorId,
      orderId,
      amount,
      serviceFee,
      platformFee,
      settlementDate: new Date(),
      status: 'completed',
    },
  });

  return settlement;
};

export default {
  getOperatorList,
  getOperatorById,
  getSettlementRecords,
  createSettlement,
};
