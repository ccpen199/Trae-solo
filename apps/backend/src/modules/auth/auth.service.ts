import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity, UserRole, UserStatus } from '../../database/entities/user.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    private readonly jwtService: JwtService,
    private readonly cache: CacheService,
  ) {}

  async register(dto: { username: string; email?: string; phone?: string; password: string }) {
    if (dto.password.length < 8) {
      throw new BadRequestException('密码长度至少8位');
    }
    const existing = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }, { phone: dto.phone }].filter(Boolean),
    });
    if (existing) {
      throw new BadRequestException('用户名、邮箱或手机号已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      notificationSettings: {
        push: true,
        email: true,
        sms: true,
      },
    });
    await this.userRepo.save(user);

    const home = this.homeRepo.create({
      name: `${dto.username}的家`,
      ownerId: user.id,
      members: [{ userId: user.id, role: 'owner' }],
    });
    await this.homeRepo.save(home);

    return this.generateTokens(user, home.id);
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.username }, { phone: dto.username }],
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账户已被禁用');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const home = await this.homeRepo.findOne({ where: { ownerId: user.id } });

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return this.generateTokens(user, home?.id);
  }

  private async generateTokens(user: UserEntity, homeId?: string) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      homeId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshToken = uuidv4();

    await this.cache.set(`refresh:${refreshToken}`, { userId: user.id, homeId }, 86400 * 30);

    return {
      accessToken,
      refreshToken,
      expiresIn: 60 * 60 * 24 * 7,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        homeId,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const data = await this.cache.get<{ userId: string; homeId?: string }>(`refresh:${refreshToken}`);
    if (!data) {
      throw new UnauthorizedException('刷新令牌无效');
    }
    const user = await this.userRepo.findOne({ where: { id: data.userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    return this.generateTokens(user, data.homeId);
  }

  async logout(refreshToken: string) {
    await this.cache.del(`refresh:${refreshToken}`);
    return { success: true };
  }

  async authenticateVendor(apiKey: string, apiSecret: string, clientIp?: string) {
    const vendor = await this.vendorRepo.findOne({ where: { apiKey } });
    if (!vendor) {
      throw new UnauthorizedException('Invalid vendor credentials');
    }
    if (vendor.status !== 'active') {
      throw new UnauthorizedException('Vendor account suspended');
    }
    const isSecretValid = await bcrypt.compare(apiSecret, vendor.apiSecret);
    if (!isSecretValid && vendor.apiSecret !== apiSecret) {
      throw new UnauthorizedException('Invalid vendor credentials');
    }
    if (vendor.whitelistEnabled && vendor.allowedIpRanges?.length && clientIp) {
      const allowed = vendor.allowedIpRanges.some((range) => this.isIpInRange(clientIp, range));
      if (!allowed) {
        throw new UnauthorizedException('IP not in whitelist');
      }
    }
    const token = this.jwtService.sign(
      { sub: vendor.id, vendorName: vendor.name, type: 'vendor' },
      { expiresIn: '24h' },
    );
    return { token, vendorId: vendor.id, vendorName: vendor.name };
  }

  private isIpInRange(ip: string, range: string): boolean {
    if (range.includes('/')) {
      const [network, prefixStr] = range.split('/');
      const prefix = parseInt(prefixStr, 10);
      const ipNum = this.ipToNum(ip);
      const netNum = this.ipToNum(network);
      const mask = ~((1 << (32 - prefix)) - 1);
      return (ipNum & mask) === (netNum & mask);
    }
    return ip === range;
  }

  private ipToNum(ip: string): number {
    return ip.split('.').reduce((acc, octet, i) => acc + (parseInt(octet, 10) << ((3 - i) * 8)), 0) >>> 0;
  }

  async changePassword(userId: string, oldPwd: string, newPwd: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    const valid = await bcrypt.compare(oldPwd, user.passwordHash);
    if (!valid) throw new BadRequestException('原密码错误');
    if (newPwd.length < 8) throw new BadRequestException('新密码长度至少8位');
    user.passwordHash = await bcrypt.hash(newPwd, 12);
    await this.userRepo.save(user);
    return { success: true };
  }
}
