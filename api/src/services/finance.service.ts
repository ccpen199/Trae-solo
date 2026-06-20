import { financeRepository } from '../repositories/finance.repository';
import { waybillRepository } from '../repositories/waybill.repository';
import { AppError } from '../middleware/error';
import { db } from '../database/connection';
import type { DailyFinance, BankCard, WithdrawRecord, WithdrawStatus } from '../../../shared/types';

export interface FinanceOverview {
  totalBalance: number;
  frozenBalance: number;
  availableBalance: number;
  pendingWithdraw: number;
  totalIncome: number;
  totalWithdrawn: number;
  totalWaybillUsed: number;
  unsettledAmount: number;
  defaultCard?: BankCard;
  bankCardCount: number;
}

export const financeService = {
  getOverview(outletId?: string, role?: string): FinanceOverview {
    if (role === 'operator') {
      outletId = undefined;
    }
    if (!outletId) {
      outletId = '';
    }

    const dailyFinances = financeRepository.getDailyFinances(outletId, undefined, undefined, 1, 1000).list;
    const withdrawRecords = financeRepository.getWithdrawRecords(outletId, undefined, 1, 1000).list;
    const bankCards = financeRepository.getBankCards(outletId);

    const totalIncome = dailyFinances.reduce((s, d) => s + d.netIncome, 0);
    const totalWithdrawn = withdrawRecords
      .filter(r => ['approved', 'transferred'].includes(r.status))
      .reduce((s, r) => s + r.amount, 0);
    const pendingWithdraw = withdrawRecords
      .filter(r => r.status === 'pending')
      .reduce((s, r) => s + r.amount, 0);

    let totalWaybillUsed = 0;
    if (outletId) {
      const wa = waybillRepository.findByOutletId(outletId);
      totalWaybillUsed = wa?.totalUsed || 0;
    } else {
      const row: any = db.prepare('SELECT COALESCE(SUM(total_used), 0) as s FROM waybill_accounts').get();
      totalWaybillUsed = row?.s || 0;
    }

    const settledAmount = dailyFinances
      .filter(d => d.date <= new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10))
      .reduce((s, d) => s + d.netIncome, 0);
    const unsettledAmount = totalIncome - settledAmount;

    const availableBalance = Math.max(0, settledAmount - totalWithdrawn - pendingWithdraw);
    const frozenBalance = unsettledAmount + pendingWithdraw;

    return {
      totalBalance: totalIncome - totalWithdrawn,
      frozenBalance,
      availableBalance,
      pendingWithdraw,
      totalIncome,
      totalWithdrawn,
      totalWaybillUsed,
      unsettledAmount,
      defaultCard: bankCards.find(c => c.isDefault),
      bankCardCount: bankCards.length,
    };
  },

  getDailyFinances(
    outletId: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 30
  ): { list: DailyFinance[]; total: number } {
    return financeRepository.getDailyFinances(outletId || '', startDate, endDate, page, pageSize);
  },

  getBankCards(outletId: string): BankCard[] {
    return financeRepository.getBankCards(outletId || '');
  },

  addBankCard(
    cardData: Omit<BankCard, 'id' | 'createdAt' | 'isDefault' | 'verified'> & { outletId: string }
  ): BankCard {
    if (!cardData.outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    if (!cardData.bankName || !cardData.cardNumber || !cardData.cardHolder || !cardData.phone) {
      throw new AppError('银行卡信息不完整', 400);
    }
    return financeRepository.addBankCard(cardData);
  },

  setDefaultCard(outletId: string, cardId: string): boolean {
    if (!outletId || !cardId) {
      throw new AppError('参数不能为空', 400);
    }
    return financeRepository.setDefaultCard(outletId, cardId);
  },

  withdraw(
    outletId: string,
    amount: number,
    bankCardId: string,
    applicantId: string,
    applicantName: string
  ): WithdrawRecord {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    if (amount <= 0) {
      throw new AppError('提现金额必须大于0', 400);
    }
    if (amount < 100) {
      throw new AppError('单笔提现金额不能低于100元', 400);
    }
    if (!bankCardId) {
      throw new AppError('请选择提现银行卡', 400);
    }

    const overview = financeService.getOverview(outletId, 'admin');
    if (amount > overview.availableBalance) {
      throw new AppError(
        `可提现余额不足。当前可用余额 ¥${overview.availableBalance.toFixed(2)}，冻结 ¥${overview.frozenBalance.toFixed(2)}`,
        400
      );
    }

    return financeRepository.withdraw(outletId, amount, bankCardId, applicantId, applicantName);
  },

  getWithdrawRecords(
    outletId: string,
    status?: WithdrawStatus,
    page: number = 1,
    pageSize: number = 10
  ): { list: WithdrawRecord[]; total: number } {
    return financeRepository.getWithdrawRecords(outletId || '', status, page, pageSize);
  },

  auditWithdraw(
    id: string,
    status: 'approved' | 'rejected',
    auditorId: string,
    auditorName: string,
    remark?: string
  ): WithdrawRecord {
    if (!id) {
      throw new AppError('提现记录ID不能为空', 400);
    }
    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new AppError('审核状态无效', 400);
    }
    return financeRepository.auditWithdraw(id, status, auditorId, auditorName, remark);
  },
};

