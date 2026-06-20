import { financeRepository } from '../repositories/finance.repository';
import { AppError } from '../middleware/error';
import type { DailyFinance, BankCard, WithdrawRecord, WithdrawStatus } from '../../../shared/types';

export const financeService = {
  getDailyFinances(
    outletId: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 30
  ): { list: DailyFinance[]; total: number } {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    return financeRepository.getDailyFinances(outletId, startDate, endDate, page, pageSize);
  },

  getBankCards(outletId: string): BankCard[] {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    return financeRepository.getBankCards(outletId);
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
    if (!bankCardId) {
      throw new AppError('请选择提现银行卡', 400);
    }
    return financeRepository.withdraw(outletId, amount, bankCardId, applicantId, applicantName);
  },

  getWithdrawRecords(
    outletId: string,
    status?: WithdrawStatus,
    page: number = 1,
    pageSize: number = 10
  ): { list: WithdrawRecord[]; total: number } {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    return financeRepository.getWithdrawRecords(outletId, status, page, pageSize);
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

