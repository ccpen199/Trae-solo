import { waybillRepository } from '../repositories/waybill.repository';
import { AppError } from '../middleware/error';
import type { WaybillAccount, RechargeRecord } from '../../../shared/types';

export const waybillService = {
  getAccount(outletId: string): WaybillAccount | null {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    return waybillRepository.getAccount(outletId);
  },

  recharge(
    outletId: string,
    amount: number,
    paymentMethod: string,
    operatorId?: string,
    operatorName?: string
  ): RechargeRecord {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    if (amount <= 0) {
      throw new AppError('充值金额必须大于0', 400);
    }
    if (!paymentMethod) {
      throw new AppError('支付方式不能为空', 400);
    }

    const account = waybillRepository.getAccount(outletId);
    if (!account) {
      throw new AppError('面单账户不存在', 404);
    }

    return waybillRepository.recharge(
      account.id,
      amount,
      paymentMethod,
      operatorId,
      operatorName
    );
  },

  getRechargeRecords(
    outletId: string,
    page: number = 1,
    pageSize: number = 10
  ): { list: RechargeRecord[]; total: number } {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    return waybillRepository.getRechargeRecords(outletId, page, pageSize);
  },

  updateTemplate(
    outletId: string,
    templateConfig: Partial<WaybillAccount['templateConfig']>
  ): WaybillAccount | null {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    return waybillRepository.updateTemplate(outletId, templateConfig);
  },

  updateLowBalanceThreshold(outletId: string, threshold: number): WaybillAccount | null {
    if (!outletId) {
      throw new AppError('网点ID不能为空', 400);
    }
    if (threshold < 0) {
      throw new AppError('告警阈值不能小于0', 400);
    }
    return waybillRepository.updateLowBalanceThreshold(outletId, threshold);
  },
};
