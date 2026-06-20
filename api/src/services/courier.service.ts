import { courierRepository } from '../repositories/courier.repository';
import { hashPassword } from '../utils/password';
import { AppError } from '../middleware/error';
import type { User } from '../../../shared/types';

export const courierService = {
  list(
    outletId?: string,
    page: number = 1,
    pageSize: number = 10
  ): { list: User[]; total: number } {
    return courierRepository.findAll({ outletId, page, pageSize });
  },

  get(id: string): (User & { outletName?: string }) | null {
    return courierRepository.findById(id);
  },

  async create(courierData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'> & { password: string }): Promise<User> {
    if (!courierData.username || !courierData.password) {
      throw new AppError('用户名和密码不能为空', 400);
    }
    if (courierData.password.length < 6) {
      throw new AppError('密码长度不能少于6位', 400);
    }

    const hashedPassword = await hashPassword(courierData.password);

    return courierRepository.create({
      ...courierData,
      password: hashedPassword,
    });
  },

  async update(
    id: string,
    courierData: Partial<User & { password: string }>
  ): Promise<User | null> {
    const data = { ...courierData };

    if (data.password) {
      if (data.password.length < 6) {
        throw new AppError('密码长度不能少于6位', 400);
      }
      data.password = await hashPassword(data.password);
    }

    return courierRepository.update(id, data);
  },

  delete(id: string): boolean {
    return courierRepository.delete(id);
  },

  getStats(courierId: string, startDate?: string, endDate?: string) {
    if (!courierId) {
      throw new AppError('快递员ID不能为空', 400);
    }
    return courierRepository.getStats(courierId, startDate, endDate);
  },
};
