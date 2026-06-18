import prisma from '../config/prisma';
import logger from '../utils/logger';

export interface StationQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  type?: string;
  longitude?: number;
  latitude?: number;
  distance?: number;
  status?: string;
}

export const getStationList = async (params: StationQueryParams) => {
  const { page = 1, pageSize = 10, keyword, type, status } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { address: { contains: keyword } },
    ];
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  const [stations, total] = await Promise.all([
    prisma.chargingStation.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        operator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chargingStation.count({ where }),
  ]);

  return {
    list: stations,
    total,
    page,
    pageSize,
  };
};

export const getStationById = async (id: string) => {
  const station = await prisma.chargingStation.findUnique({
    where: { id },
    include: {
      operator: true,
      piles: true,
    },
  });

  if (!station) {
    throw new Error('充电站不存在');
  }

  return station;
};

export const getPilesByStationId = async (stationId: string) => {
  const piles = await prisma.chargingPile.findMany({
    where: { stationId },
    orderBy: { pileNo: 'asc' },
  });

  return piles;
};

export const getPileById = async (pileId: string) => {
  const pile = await prisma.chargingPile.findUnique({
    where: { id: pileId },
    include: {
      station: true,
    },
  });

  if (!pile) {
    throw new Error('充电桩不存在');
  }

  return pile;
};

export const updatePileStatus = async (pileId: string, status: string, data?: any) => {
  const updateData: any = { status };

  if (data?.currentPower !== undefined) {
    updateData.currentPower = data.currentPower;
  }
  if (data?.currentSoc !== undefined) {
    updateData.currentSoc = data.currentSoc;
  }
  if (data?.lastHeartbeat) {
    updateData.lastHeartbeat = data.lastHeartbeat;
  }

  const pile = await prisma.chargingPile.update({
    where: { id: pileId },
    data: updateData,
  });

  return pile;
};

export default {
  getStationList,
  getStationById,
  getPilesByStationId,
  getPileById,
  updatePileStatus,
};
