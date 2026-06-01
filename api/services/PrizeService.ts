import { PrizeRepository } from '../repositories/PrizeRepository.js';
import type { Prize, PaginatedResponse, Winner, ShippingInfo } from '../../shared/types.js';
import { WinnerRepository } from '../repositories/WinnerRepository.js';

export class PrizeService {
  private prizeRepo: PrizeRepository;
  private winnerRepo: WinnerRepository;

  constructor() {
    this.prizeRepo = new PrizeRepository();
    this.winnerRepo = new WinnerRepository();
  }

  getPrizeList(page: number = 1, pageSize: number = 20, type?: Prize['type']): PaginatedResponse<Prize> {
    const where = type ? 'type = ?' : undefined;
    const params = type ? [type] : [];
    const result = this.prizeRepo.findPaginated(page, pageSize, where, params);
    
    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    };
  }

  getPrizeDetail(id: number): Prize | null {
    return this.prizeRepo.findById(id);
  }

  createPrize(data: Omit<Prize, 'id' | 'createdAt'>): number {
    return this.prizeRepo.create(data);
  }

  updatePrize(id: number, data: Partial<Prize>): boolean {
    return this.prizeRepo.update(id, data);
  }

  deletePrize(id: number): boolean {
    return this.prizeRepo.delete(id);
  }

  getAllPrizes(): Prize[] {
    return this.prizeRepo.findAll();
  }

  getAvailablePrizes(): Prize[] {
    return this.prizeRepo.findAvailable();
  }

  getWinnerList(page: number = 1, pageSize: number = 20, status?: Winner['status']): PaginatedResponse<Winner> {
    const result = this.winnerRepo.findWithDetails(page, pageSize, status);
    
    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    };
  }

  getWinnerDetail(id: number): Winner | null {
    return this.winnerRepo.findById(id);
  }

  distributePrize(winnerId: number): boolean {
    return this.winnerRepo.updateStatus(winnerId, 'distributed');
  }

  shipPrize(winnerId: number, shippingInfo: ShippingInfo): boolean {
    return this.winnerRepo.updateShippingInfo(winnerId, shippingInfo);
  }

  redeemPrize(winnerId: number): boolean {
    return this.winnerRepo.updateStatus(winnerId, 'redeemed');
  }

  cancelPrize(winnerId: number): boolean {
    return this.winnerRepo.updateStatus(winnerId, 'cancelled');
  }

  reissuePrize(winnerId: number): number {
    const winner = this.winnerRepo.findById(winnerId);
    if (!winner) return 0;

    return this.winnerRepo.create({
      lotteryRecordId: winner.lotteryRecordId,
      activityId: winner.activityId,
      userId: winner.userId,
      prizeId: winner.prizeId,
      status: 'pending'
    });
  }

  getUserWinners(userId: string, page: number = 1, pageSize: number = 20): PaginatedResponse<Winner> {
    const result = this.winnerRepo.findByUserWithDetails(userId, page, pageSize);
    
    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    };
  }

  validatePrize(prize: Partial<Prize>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prize.name || prize.name.length < 1) {
      errors.push('奖品名称不能为空');
    }
    if (!prize.type) {
      errors.push('奖品类型不能为空');
    }
    if (prize.totalStock !== undefined && prize.totalStock < 0) {
      errors.push('奖品库存不能为负数');
    }
    if (prize.value !== undefined && prize.value < 0) {
      errors.push('奖品价值不能为负数');
    }

    return { valid: errors.length === 0, errors };
  }
}
