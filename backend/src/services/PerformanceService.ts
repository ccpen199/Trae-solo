import { PerformanceRepository } from '../repositories/PerformanceRepository';

const performanceRepo = new PerformanceRepository();

export class PerformanceService {
  list(page: number = 1, pageSize: number = 20) {
    const result = performanceRepo.listAll(page, pageSize);
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize } };
  }

  getByUser(userId: number, page: number = 1, pageSize: number = 20) {
    const result = performanceRepo.findByUser(userId, page, pageSize);
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize } };
  }

  getByPeriod(period: string, page: number = 1, pageSize: number = 20) {
    const result = performanceRepo.findByPeriod(period, page, pageSize);
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize } };
  }

  create(data: { user_id: number; period: string; total_tasks: number; completed_tasks: number; failed_tasks: number; on_time_rate: number; customer_score: number; total_fee: number; bonus: number; deduction: number; branch_id: number }) {
    const id = performanceRepo.create(data);
    return { code: 0, message: '绩效记录创建成功', data: { id } };
  }
}
