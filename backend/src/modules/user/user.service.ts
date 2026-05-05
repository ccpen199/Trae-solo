import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../role/entities/role.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingCode = await this.userRepository.findOne({
      where: { code: createUserDto.code },
    });
    if (existingCode) {
      throw new ConflictException('人员编号已存在');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('用户名已存在');
    }

    if (createUserDto.idCard) {
      const existingIdCard = await this.userRepository.findOne({
        where: { idCard: createUserDto.idCard },
      });
      if (existingIdCard) {
        throw new ConflictException('身份证号已存在');
      }
    }

    let roles: Role[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      roles = await this.roleRepository.findBy({
        id: In(createUserDto.roleIds),
      });
    }

    const password = createUserDto.password || '123456';
    const hashedPassword = await this.authService.hashPassword(password);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles,
    });

    const saved = await this.userRepository.save(user);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['organization', 'store', 'roles'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization', 'store', 'roles', 'roles.rolePermissions', 'roles.rolePermissions.module'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByCode(code: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { code },
      relations: ['organization', 'store', 'roles'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['organization', 'store', 'roles'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByOrganization(organizationId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { organizationId, enabled: true },
      order: { createdAt: 'DESC' },
      relations: ['store', 'roles'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.code && updateUserDto.code !== user.code) {
      const existing = await this.userRepository.findOne({
        where: { code: updateUserDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('人员编号已存在');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existing = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('用户名已存在');
      }
    }

    if (updateUserDto.idCard && updateUserDto.idCard !== user.idCard) {
      const existing = await this.userRepository.findOne({
        where: { idCard: updateUserDto.idCard },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('身份证号已存在');
      }
    }

    let roles: Role[] = user.roles;
    if (updateUserDto.roleIds) {
      if (updateUserDto.roleIds.length === 0) {
        roles = [];
      } else {
        roles = await this.roleRepository.findBy({
          id: In(updateUserDto.roleIds),
        });
      }
    }

    const updateData: any = { ...updateUserDto, roles };

    if (updateUserDto.password) {
      updateData.password = await this.authService.hashPassword(updateUserDto.password);
    } else {
      delete updateData.password;
    }

    delete updateData.roleIds;

    await this.userRepository.save({
      ...user,
      ...updateData,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    const hashedPassword = await this.authService.hashPassword(newPassword);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new ConflictException('原密码错误');
    }

    const hashedPassword = await this.authService.hashPassword(newPassword);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async initDefaultAdmin(): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { username: 'admin' },
    });

    if (existing) {
      return existing;
    }

    const hashedPassword = await this.authService.hashPassword('admin123');

    const admin = this.userRepository.create({
      code: 'ADMIN001',
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      enabled: true,
      roles: [],
    });

    return this.userRepository.save(admin);
  }
}
