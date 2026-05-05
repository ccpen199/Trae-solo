import { Repository } from 'typeorm';
import { Enterprise, EnterpriseType } from '../entities/Enterprise';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

interface EnterpriseCreateParams {
  enterpriseCode: string;
  enterpriseName: string;
  enterpriseType: EnterpriseType;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  description?: string;
}

export class EnterpriseService {
  private enterpriseRepository: Repository<Enterprise>;
  private userRepository: Repository<User>;

  constructor() {
    this.enterpriseRepository = AppDataSource.getRepository(Enterprise);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createEnterprise(params: EnterpriseCreateParams): Promise<Enterprise> {
    const existing = await this.enterpriseRepository.findOne({
      where: { enterpriseCode: params.enterpriseCode }
    });

    if (existing) {
      throw new Error('企业编号已存在');
    }

    const enterprise = this.enterpriseRepository.create(params);
    return this.enterpriseRepository.save(enterprise);
  }

  async getEnterpriseById(id: string): Promise<Enterprise | null> {
    return this.enterpriseRepository.findOne({ where: { id } });
  }

  async getEnterpriseByCode(code: string): Promise<Enterprise | null> {
    return this.enterpriseRepository.findOne({ where: { enterpriseCode: code } });
  }

  async getEnterprisesByType(type: EnterpriseType): Promise<Enterprise[]> {
    return this.enterpriseRepository.find({ where: { enterpriseType: type } });
  }

  async getAllEnterprises(query: {
    page?: number;
    pageSize?: number;
    enterpriseType?: EnterpriseType;
    keyword?: string;
  }): Promise<{ enterprises: Enterprise[]; total: number }> {
    const { page = 1, pageSize = 20, enterpriseType, keyword } = query;

    const qb = this.enterpriseRepository.createQueryBuilder('enterprise');

    if (enterpriseType) {
      qb.andWhere('enterprise.enterpriseType = :enterpriseType', { enterpriseType });
    }

    if (keyword) {
      qb.andWhere(
        '(enterprise.enterpriseCode LIKE :keyword OR enterprise.enterpriseName LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    qb.orderBy('enterprise.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [enterprises, total] = await qb.getManyAndCount();

    return { enterprises, total };
  }

  async getPendingEnterprises(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<{ enterprises: Enterprise[]; users: User[]; total: number }> {
    const { page = 1, pageSize = 20, keyword } = query;

    const qb = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.enterprise', 'enterprise')
      .where('user.status = :status', { status: 'pending' })
      .andWhere('user.role = :role', { role: 'enterprise' });

    if (keyword) {
      qb.andWhere(
        '(user.username LIKE :keyword OR enterprise.enterpriseCode LIKE :keyword OR enterprise.enterpriseName LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [users, total] = await qb.getManyAndCount();
    const enterprises = users.map(u => u.enterprise).filter(Boolean) as Enterprise[];

    return { enterprises, users, total };
  }

  async getApprovedEnterprises(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<{ enterprises: Enterprise[]; users: User[]; total: number }> {
    const { page = 1, pageSize = 20, keyword } = query;

    const qb = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.enterprise', 'enterprise')
      .where('user.status = :status', { status: 'approved' })
      .andWhere('user.role = :role', { role: 'enterprise' });

    if (keyword) {
      qb.andWhere(
        '(user.username LIKE :keyword OR enterprise.enterpriseCode LIKE :keyword OR enterprise.enterpriseName LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [users, total] = await qb.getManyAndCount();
    const enterprises = users.map(u => u.enterprise).filter(Boolean) as Enterprise[];

    return { enterprises, users, total };
  }

  async approveUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }
    user.status = 'approved';
    await this.userRepository.save(user);
  }

  async rejectUser(userId: string, reason: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }
    user.status = 'rejected';
    user.rejectReason = reason;
    await this.userRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['enterprise']
    });
    if (!user) {
      return;
    }
    await this.userRepository.remove(user);
    if (user.enterprise) {
      const otherUsers = await this.userRepository.count({
        where: { enterpriseId: user.enterprise.id }
      });
      if (otherUsers === 0) {
        await this.enterpriseRepository.remove(user.enterprise);
      }
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['enterprise']
    });
  }

  async updateEnterprise(id: string, params: Partial<EnterpriseCreateParams>): Promise<Enterprise> {
    const enterprise = await this.enterpriseRepository.findOne({ where: { id } });
    if (!enterprise) {
      throw new Error('企业不存在');
    }
    Object.assign(enterprise, params);
    return this.enterpriseRepository.save(enterprise);
  }
}

export const enterpriseService = new EnterpriseService();
