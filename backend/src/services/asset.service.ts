import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface AssetOverview {
  accountBalance: {
    available: number;
    frozen: number;
    total: number;
  };
  fundShare: {
    totalShares: number;
    availableShares: number;
    frozenShares: number;
    nav: number;
    totalAmount: number;
    availableAmount: number;
  };
  totalIncome: number;
  totalAsset: number;
}

export class AssetService {
  async getOverview(userId: string): Promise<AssetOverview> {
    const [accountBalance, fundShare] = await Promise.all([
      prisma.accountBalance.findUnique({
        where: { userId },
      }),
      prisma.fundShare.findUnique({
        where: { userId },
      }),
    ]);

    if (!accountBalance || !fundShare) {
      throw new Error('用户资产信息不存在');
    }

    const nav = Number(fundShare.nav);
    const availableAmount = Number(fundShare.availableShares) * nav;
    const totalAmount = Number(fundShare.totalShares) * nav;
    const totalAsset = Number(accountBalance.available) + availableAmount;

    return {
      accountBalance: {
        available: Number(accountBalance.available),
        frozen: Number(accountBalance.frozen),
        total: Number(accountBalance.available) + Number(accountBalance.frozen),
      },
      fundShare: {
        totalShares: Number(fundShare.totalShares),
        availableShares: Number(fundShare.availableShares),
        frozenShares: Number(fundShare.frozenShares),
        nav,
        totalAmount,
        availableAmount,
      },
      totalIncome: Number(accountBalance.totalIncome),
      totalAsset,
    };
  }

  async getAccountBalance(userId: string) {
    const balance = await prisma.accountBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      throw new Error('用户账户信息不存在');
    }

    return {
      available: Number(balance.available),
      frozen: Number(balance.frozen),
      totalIncome: Number(balance.totalIncome),
    };
  }

  async getFundShare(userId: string) {
    const fundShare = await prisma.fundShare.findUnique({
      where: { userId },
    });

    if (!fundShare) {
      throw new Error('用户基金份额信息不存在');
    }

    const nav = Number(fundShare.nav);

    return {
      totalShares: Number(fundShare.totalShares),
      availableShares: Number(fundShare.availableShares),
      frozenShares: Number(fundShare.frozenShares),
      nav,
      totalAmount: Number(fundShare.totalShares) * nav,
      availableAmount: Number(fundShare.availableShares) * nav,
    };
  }

  async updateAccountBalance(userId: string, amount: Decimal, description: string) {
    const balance = await prisma.accountBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      throw new Error('用户账户信息不存在');
    }

    const newAvailable = balance.available.add(amount);
    if (newAvailable.lessThan(0)) {
      throw new Error('账户余额不足');
    }

    await prisma.accountBalance.update({
      where: { userId },
      data: {
        available: newAvailable,
      },
    });
  }

  async updateFundShare(userId: string, shares: Decimal, nav: Decimal, description: string) {
    const fundShare = await prisma.fundShare.findUnique({
      where: { userId },
    });

    if (!fundShare) {
      throw new Error('用户基金份额信息不存在');
    }

    const newAvailableShares = fundShare.availableShares.add(shares);
    if (newAvailableShares.lessThan(0)) {
      throw new Error('基金份额不足');
    }

    const newTotalShares = fundShare.totalShares.add(shares);

    await prisma.fundShare.update({
      where: { userId },
      data: {
        totalShares: newTotalShares,
        availableShares: newAvailableShares,
      },
    });
  }

  async addIncome(userId: string, incomeAmount: Decimal) {
    await prisma.accountBalance.update({
      where: { userId },
      data: {
        available: { increment: incomeAmount },
        totalIncome: { increment: incomeAmount },
      },
    });
  }
}

export default new AssetService();
