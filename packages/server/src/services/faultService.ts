import prisma from '../config/prisma';
import logger from '../utils/logger';

export interface ReportFaultParams {
  orderId?: string;
  pileId?: string;
  userId?: string;
  faultCode: string;
  faultDesc?: string;
}

export interface FaultQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  pileId?: string;
  userId?: string;
}

export const reportFault = async (params: ReportFaultParams) => {
  const fault = await prisma.chargingFault.create({
    data: params,
  });

  if (params.pileId) {
    await prisma.chargingPile.update({
      where: { id: params.pileId },
      data: { status: 'fault' },
    });
  }

  return fault;
};

export const getFaultList = async (params: FaultQueryParams) => {
  const { page = 1, pageSize = 10, status, pileId, userId } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (status) {
    where.status = status;
  }
  if (pileId) {
    where.pileId = pileId;
  }
  if (userId) {
    where.userId = userId;
  }

  const [faults, total] = await Promise.all([
    prisma.chargingFault.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        pile: { select: { id: true, pileNo: true, stationId: true } },
        user: { select: { id: true, phone: true, nickname: true } },
        order: { select: { id: true, status: true } },
      },
      orderBy: { reportTime: 'desc' },
    }),
    prisma.chargingFault.count({ where }),
  ]);

  return {
    list: faults,
    total,
    page,
    pageSize,
  };
};

export const getFaultById = async (faultId: string) => {
  const fault = await prisma.chargingFault.findUnique({
    where: { id: faultId },
    include: {
      pile: true,
      user: { select: { id: true, phone: true, nickname: true } },
      order: true,
    },
  });

  if (!fault) {
    throw new Error('故障记录不存在');
  }

  return fault;
};

export const handleFault = async (faultId: string, handler: string, remark?: string) => {
  const fault = await prisma.chargingFault.update({
    where: { id: faultId },
    data: {
      status: 'handled',
      handleTime: new Date(),
      handler,
      remark,
    },
  });

  if (fault.pileId) {
    await prisma.chargingPile.update({
      where: { id: fault.pileId },
      data: { status: 'idle' },
    });
  }

  return fault;
};

export default {
  reportFault,
  getFaultList,
  getFaultById,
  handleFault,
};
