import prisma from '../config/prisma';
import logger from '../utils/logger';

export interface CreateRoutePlanParams {
  userId: string;
  origin: string;
  destination: string;
  waypoints?: any;
  totalDistance?: number;
  estimatedTime?: number;
  chargingStops?: any;
  totalCost?: number;
}

export const createRoutePlan = async (params: CreateRoutePlanParams) => {
  const routePlan = await prisma.routePlan.create({
    data: params,
  });

  return routePlan;
};

export const getRoutePlansByUserId = async (userId: string, page: number = 1, pageSize: number = 10) => {
  const skip = (page - 1) * pageSize;

  const [routePlans, total] = await Promise.all([
    prisma.routePlan.findMany({
      where: { userId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.routePlan.count({ where: { userId } }),
  ]);

  return {
    list: routePlans,
    total,
    page,
    pageSize,
  };
};

export const getRoutePlanById = async (routePlanId: string) => {
  const routePlan = await prisma.routePlan.findUnique({
    where: { id: routePlanId },
  });

  if (!routePlan) {
    throw new Error('路径规划不存在');
  }

  return routePlan;
};

export const deleteRoutePlan = async (routePlanId: string) => {
  await prisma.routePlan.delete({
    where: { id: routePlanId },
  });

  return true;
};

export const planRoute = async (origin: string, destination: string, currentSoc: number = 50) => {
  const mockStops = [
    {
      stationId: 'station-1',
      stationName: '国家电网充电站(朝阳公园)',
      distance: 45.5,
      estimatedArrivalSoc: 30,
      chargeAmount: 30,
      chargeTime: 25,
      cost: 45.5,
    },
  ];

  return {
    origin,
    destination,
    totalDistance: 120.5,
    estimatedTime: 90,
    chargingStops: mockStops,
    totalCost: 45.5,
    waypoints: [],
  };
};

export default {
  createRoutePlan,
  getRoutePlansByUserId,
  getRoutePlanById,
  deleteRoutePlan,
  planRoute,
};
