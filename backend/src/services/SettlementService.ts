import { SettlementRepository } from '../repositories/SettlementRepository';
import { getDb } from '../database';

const settlementRepo = new SettlementRepository();

export class SettlementService {
  list(page: number = 1, pageSize: number = 20) {
    const result = settlementRepo.findAll(page, pageSize);
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize } };
  }

  generate(data: { period: string; branch_id: number; courier_id: number; total_tasks: number; total_fee: number; bonus?: number; deduction?: number }) {
    const bonus = data.bonus || 0;
    const deduction = data.deduction || 0;
    const netAmount = +(data.total_fee + bonus - deduction).toFixed(2);

    const id = settlementRepo.create({
      period: data.period,
      branch_id: data.branch_id,
      courier_id: data.courier_id,
      total_tasks: data.total_tasks,
      total_fee: data.total_fee,
      bonus,
      deduction,
      net_amount: netAmount,
    });

    return { code: 0, message: '结算单生成成功', data: { id } };
  }

  confirm(id: number) {
    const settlement = settlementRepo.findById(id);
    if (!settlement) {
      return { code: 1030, message: '结算单不存在', data: null };
    }
    if (settlement.status !== 'pending') {
      return { code: 1031, message: '结算单状态不允许确认', data: null };
    }
    settlementRepo.update(id, { status: 'confirmed' });
    return { code: 0, message: '结算单已确认', data: null };
  }

  pay(id: number) {
    const settlement = settlementRepo.findById(id);
    if (!settlement) {
      return { code: 1030, message: '结算单不存在', data: null };
    }
    if (settlement.status !== 'confirmed') {
      return { code: 1031, message: '结算单状态不允许支付', data: null };
    }
    settlementRepo.update(id, { status: 'paid', paid_at: new Date().toISOString() });
    return { code: 0, message: '结算单已支付', data: null };
  }
}
