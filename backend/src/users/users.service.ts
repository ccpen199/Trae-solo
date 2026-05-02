import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../../common/types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(
    userData: {
      username: string;
      password: string;
      name: string;
      role?: UserRole;
      phone?: string;
      avatar?: string;
    },
    createdBy?: string,
  ): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { username: userData.username },
    });

    if (existing) {
      throw new Error(`用户名已存在: ${userData.username}`);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      createdBy,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'name', 'role', 'phone', 'avatar', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'name', 'role', 'phone', 'avatar', 'status', 'createdAt'],
    });
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role, status: UserStatus.ACTIVE },
      select: ['id', 'username', 'name', 'role', 'phone', 'avatar', 'status'],
    });
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error(`用户不存在: ${id}`);
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    Object.assign(user, updates);

    await this.userRepository.save(user);

    return this.findById(id);
  }

  async updatePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error(`用户不存在: ${id}`);
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);

    if (!isValid) {
      throw new Error('原密码错误');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return true;
  }

  async deactivateUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error(`用户不存在: ${id}`);
    }

    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  async activateUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error(`用户不存在: ${id}`);
    }

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);
  }

  async countUsersByRole(): Promise<Array<{ role: string; count: number }>> {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .groupBy('user.role')
      .getRawMany();

    return results.map((r) => ({
      role: r.role,
      count: parseInt(r.count, 10),
    }));
  }

  async initDefaultUsers(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { username: 'admin' },
    });

    if (adminExists) {
      this.logger.log('默认用户已存在，跳过初始化');
      return;
    }

    const defaultUsers = [
      {
        username: 'admin',
        password: 'Admin@123',
        name: '系统管理员',
        role: UserRole.ADMIN,
        phone: '13800138000',
      },
      {
        username: 'manager',
        password: 'Manager@123',
        name: '张店长',
        role: UserRole.MANAGER,
        phone: '13800138001',
      },
      {
        username: 'cashier',
        password: 'Cashier@123',
        name: '李收银',
        role: UserRole.CASHIER,
        phone: '13800138002',
      },
      {
        username: 'waiter',
        password: 'Waiter@123',
        name: '王服务员',
        role: UserRole.WAITER,
        phone: '13800138003',
      },
      {
        username: 'chef',
        password: 'Chef@123',
        name: '赵厨师',
        role: UserRole.CHEF,
        phone: '13800138004',
      },
    ];

    for (const userData of defaultUsers) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = this.userRepository.create({
          ...userData,
          password: hashedPassword,
          status: UserStatus.ACTIVE,
        });
        await this.userRepository.save(user);
        this.logger.log(`创建默认用户: ${userData.username}`);
      } catch (error) {
        this.logger.error(`创建用户失败: ${userData.username} - ${error.message}`);
      }
    }

    this.logger.log('默认用户初始化完成');
  }
}
