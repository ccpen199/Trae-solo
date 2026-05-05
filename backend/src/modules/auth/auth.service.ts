import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.module', 'module')
      .where('user.username = :username', { username })
      .andWhere('user.enabled = true')
      .getOne();

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.enabled) {
      throw new UnauthorizedException('账户已被禁用');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      code: user.code,
      name: user.name,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        code: user.code,
        username: user.username,
        name: user.name,
        organizationId: user.organizationId,
        storeId: user.storeId,
        roles: user.roles?.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
        })),
      },
    };
  }

  async getCurrentUser(userId: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.store', 'store')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.module', 'module')
      .where('user.id = :id', { id: userId })
      .getOne();
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
