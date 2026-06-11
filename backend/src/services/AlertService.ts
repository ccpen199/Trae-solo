import { AlertRepository } from '../repositories/AlertRepository';

const alertRepo = new AlertRepository();

export class AlertService {
  list(status?: string, page: number = 1, pageSize: number = 20) {
    const result = alertRepo.findAll(status, page, pageSize);
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize } };
  }

  getById(id: number) {
    const alert = alertRepo.findById(id);
    if (!alert) {
      return { code: 1040, message: '告警不存在', data: null };
    }
    return { code: 0, message: 'ok', data: alert };
  }

  create(data: { type: string; level: string; title: string; description?: string; branch_id?: number; package_id?: number }) {
    const id = alertRepo.create(data);
    return { code: 0, message: '告警创建成功', data: { id } };
  }

  resolve(id: number, resolvedBy: number) {
    const alert = alertRepo.findById(id);
    if (!alert) {
      return { code: 1040, message: '告警不存在', data: null };
    }
    if (alert.status === 'resolved') {
      return { code: 1041, message: '告警已处理', data: null };
    }
    alertRepo.resolve(id, resolvedBy);
    return { code: 0, message: '告警已处理', data: null };
  }
}
