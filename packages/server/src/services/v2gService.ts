import prisma from '../config/prisma';
import logger from '../utils/logger';

export interface CreateStrategyParams {
  userId: string;
  name: string;
  type: string;
  chargeStartTime?: string;
  chargeEndTime?: string;
  dischargeStartTime?: string;
  dischargeEndTime?: string;
  targetSoc?: number;
  minSoc?: number;
  maxPower?: number;
  enabled?: boolean;
}

export const createStrategy = async (params: CreateStrategyParams) => {
  const strategy = await prisma.v2GStrategy.create({
    data: params,
  });

  return strategy;
};

export const getStrategiesByUserId = async (userId: string) => {
  const strategies = await prisma.v2GStrategy.findMany({
    where: { userId },
    orderBy: { enabled: 'desc' },
  });

  return strategies;
};

export const getStrategyById = async (strategyId: string) => {
  const strategy = await prisma.v2GStrategy.findUnique({
    where: { id: strategyId },
  });

  if (!strategy) {
    throw new Error('策略不存在');
  }

  return strategy;
};

export const updateStrategy = async (strategyId: string, params: Partial<CreateStrategyParams>) => {
  const strategy = await prisma.v2GStrategy.update({
    where: { id: strategyId },
    data: params,
  });

  return strategy;
};

export const deleteStrategy = async (strategyId: string) => {
  await prisma.v2GStrategy.delete({
    where: { id: strategyId },
  });

  return true;
};

export const toggleStrategy = async (strategyId: string, enabled: boolean) => {
  const strategy = await prisma.v2GStrategy.update({
    where: { id: strategyId },
    data: { enabled },
  });

  return strategy;
};

export const enableV2G = async (userId: string, enabled: boolean) => {
  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: { v2gEnabled: enabled },
    create: { userId, v2gEnabled: enabled },
  });

  return profile;
};

export default {
  createStrategy,
  getStrategiesByUserId,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
  toggleStrategy,
  enableV2G,
};
