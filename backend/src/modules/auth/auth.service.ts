import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username, isDeleted: false },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('用户已被禁用');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      isSuperAdmin: user.isSuperAdmin,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
        roles: user.roles?.map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
        })),
      },
    };
  }

  async getProfile(user: User) {
    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    });

    const permissions = new Set<string>();
    fullUser.roles?.forEach(role => {
      role.permissions?.forEach(perm => {
        permissions.add(`${perm.module}:${perm.action}`);
      });
    });

    return {
      id: fullUser.id,
      username: fullUser.username,
      nickname: fullUser.nickname,
      email: fullUser.email,
      phoneNumber: fullUser.phoneNumber,
      avatarUrl: fullUser.avatarUrl,
      isSuperAdmin: fullUser.isSuperAdmin,
      isActive: fullUser.isActive,
      roles: fullUser.roles?.map(r => ({
        id: r.id,
        name: r.name,
        code: r.code,
        roleType: r.roleType,
      })),
      permissions: Array.from(permissions),
    };
  }
}
