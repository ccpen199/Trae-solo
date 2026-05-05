import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { LoginDto } from '../common/dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username, isDeleted: false },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    if (!user.isActive) {
      return { success: false, message: '用户已被禁用' };
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: '用户名或密码错误' };
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const payload = {
      sub: user.id,
      username: user.username,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      success: true,
      data: {
        accessToken,
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
      },
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      return { success: false, message: '未登录' };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const permissions = new Set<string>();
    user.roles?.forEach(role => {
      role.permissions?.forEach(perm => {
        permissions.add(`${perm.module}:${perm.action}`);
      });
    });

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
        isActive: user.isActive,
        roles: user.roles?.map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
          roleType: r.roleType,
        })),
        permissions: Array.from(permissions),
      },
    };
  }

  @Post('logout')
  async logout() {
    return { success: true, message: '退出登录成功' };
  }
}
