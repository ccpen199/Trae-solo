import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const existingUsers = await this.usersRepository.count();
    if (existingUsers > 0) {
      this.logger.log('用户数据已存在，跳过初始化');
      return;
    }

    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
      {
        username: 'admin',
        email: 'admin@garment.com',
        name: '系统管理员',
        role: Role.ADMIN,
        password: hashedPassword,
        isActive: true,
      },
      {
        username: 'designer',
        email: 'designer@garment.com',
        name: '张设计师',
        role: Role.DESIGNER,
        password: hashedPassword,
        department: '设计部',
        isActive: true,
      },
      {
        username: 'pattern_maker',
        email: 'pattern@garment.com',
        name: '李版师',
        role: Role.PATTERN_MAKER,
        password: hashedPassword,
        department: '技术部',
        isActive: true,
      },
      {
        username: 'purchaser',
        email: 'purchaser@garment.com',
        name: '王采购',
        role: Role.PURCHASER,
        password: hashedPassword,
        department: '采购部',
        isActive: true,
      },
      {
        username: 'factory',
        email: 'factory@garment.com',
        name: '赵厂长',
        role: Role.FACTORY,
        password: hashedPassword,
        department: '生产部',
        isActive: true,
      },
    ];

    for (const userData of users) {
      const user = this.usersRepository.create(userData);
      await this.usersRepository.save(user);
      this.logger.log(`创建用户: ${userData.username} (${userData.name})`);
    }

    this.logger.log('测试用户初始化完成！所有用户密码都是: 123456');
  }
}
