import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { IsString, IsOptional, IsBoolean, IsUUID, IsArray, MinLength, MaxLength, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];

  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { username: createUserDto.username, isDeleted: false },
    });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    let roles: Role[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      roles = await this.roleRepository.find({
        where: { id: In(createUserDto.roleIds), isDeleted: false },
      });
    }

    const user = this.userRepository.create({
      ...createUserDto,
      roles,
      isSuperAdmin: createUserDto.isSuperAdmin || false,
    });

    return this.userRepository.save(user);
  }

  async findAll(includeInactive = false): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('user.createdAt', 'DESC');

    if (!includeInactive) {
      query.andWhere('user.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username, isDeleted: false },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.roleIds !== undefined) {
      if (updateUserDto.roleIds && updateUserDto.roleIds.length > 0) {
        user.roles = await this.roleRepository.find({
          where: { id: In(updateUserDto.roleIds), isDeleted: false },
        });
      } else {
        user.roles = [];
      }
    }

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    if (user.isSuperAdmin) {
      throw new BadRequestException('不能删除超级管理员');
    }

    user.isDeleted = true;
    await this.userRepository.save(user);
  }

  async updatePassword(
    id: string, 
    updatePasswordDto: UpdatePasswordDto
  ): Promise<void> {
    const user = await this.findOne(id);
    
    const isPasswordValid = await user.comparePassword(updatePasswordDto.oldPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    user.password = updatePasswordDto.newPassword;
    await user.hashPassword();
    await this.userRepository.save(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    
    user.password = newPassword;
    await user.hashPassword();
    await this.userRepository.save(user);
  }
}
