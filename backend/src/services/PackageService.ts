import { PackageRepository, PackageFilter } from '../repositories/PackageRepository';
import { getDb } from '../database';

const packageRepo = new PackageRepository();

export class PackageService {
  list(filter: PackageFilter, page: number = 1, pageSize: number = 20) {
    const result = packageRepo.findAll(filter, page, pageSize);
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize } };
  }

  getById(id: number) {
    const pkg = packageRepo.findById(id);
    if (!pkg) {
      return { code: 1010, message: '快件不存在', data: null };
    }
    return { code: 0, message: 'ok', data: pkg };
  }

  inbound(data: { tracking_no: string; brand: string; type: string; branch_id: number; sender_name?: string; sender_phone?: string; receiver_name?: string; receiver_phone?: string; weight?: number; fee?: number }) {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM packages WHERE tracking_no = ?').get(data.tracking_no);
    if (existing) {
      return { code: 1011, message: '运单号已存在', data: null };
    }

    const id = packageRepo.create({
      tracking_no: data.tracking_no,
      brand: data.brand as any,
      type: data.type as any,
      status: 'inbound',
      branch_id: data.branch_id,
      sender_name: data.sender_name || null,
      sender_phone: data.sender_phone || null,
      receiver_name: data.receiver_name || null,
      receiver_phone: data.receiver_phone || null,
      weight: data.weight || null,
      fee: data.fee || null,
    });

    return { code: 0, message: '入库成功', data: { id } };
  }

  outbound(id: number, courierId: number) {
    const pkg = packageRepo.findById(id);
    if (!pkg) {
      return { code: 1010, message: '快件不存在', data: null };
    }
    if (pkg.status !== 'stored' && pkg.status !== 'inbound') {
      return { code: 1012, message: '快件状态不允许出库', data: null };
    }
    packageRepo.updateStatus(id, 'outbound', { courier_id: courierId });
    return { code: 0, message: '出库成功', data: null };
  }

  sign(id: number, signedBy: string) {
    const pkg = packageRepo.findById(id);
    if (!pkg) {
      return { code: 1010, message: '快件不存在', data: null };
    }
    if (pkg.status !== 'outbound') {
      return { code: 1012, message: '快件状态不允许签收', data: null };
    }
    packageRepo.updateStatus(id, 'signed', { signed_by: signedBy, signed_at: new Date().toISOString() });
    return { code: 0, message: '签收成功', data: null };
  }

  markException(id: number, exceptionType: string, exceptionNote: string) {
    const pkg = packageRepo.findById(id);
    if (!pkg) {
      return { code: 1010, message: '快件不存在', data: null };
    }
    packageRepo.updateStatus(id, 'exception', { exception_type: exceptionType, exception_note: exceptionNote });
    return { code: 0, message: '标记异常成功', data: null };
  }
}
