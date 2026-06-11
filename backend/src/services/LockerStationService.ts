import { LockerStationRepository } from '../repositories/LockerStationRepository';

const lockerStationRepo = new LockerStationRepository();

export class LockerStationService {
  list(branchId?: number) {
    const list = lockerStationRepo.findAll(branchId);
    const typeStats = lockerStationRepo.countByType();
    return { code: 0, message: 'ok', data: { list, typeStats } };
  }

  getById(id: number) {
    const station = lockerStationRepo.findById(id);
    if (!station) {
      return { code: 1100, message: '柜机/驿站不存在', data: null };
    }
    return { code: 0, message: 'ok', data: station };
  }

  create(data: { name: string; code: string; type: string; address?: string; total_slots: number; used_slots: number; branch_id: number }) {
    const id = lockerStationRepo.create(data);
    return { code: 0, message: '柜机/驿站创建成功', data: { id } };
  }

  updateSlots(id: number, totalSlots: number, usedSlots: number) {
    const station = lockerStationRepo.findById(id);
    if (!station) {
      return { code: 1100, message: '柜机/驿站不存在', data: null };
    }
    lockerStationRepo.updateSlots(id, totalSlots, usedSlots);
    return { code: 0, message: '格口信息已更新', data: null };
  }
}
