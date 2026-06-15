import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { TokenService, TokenPair } from './services/token.service';
import { NxGovAuthService } from './services/nx-gov-auth.service';
import { WechatAuthService } from './services/wechat-auth.service';
import { AlipayAuthService } from './services/alipay-auth.service';
import { Sm4Util } from '../../common/utils/sm4.util';

export interface LoginResult {
  user: UserInfo;
  tokens: TokenPair;
  isNewUser: boolean;
}

export interface UserInfo {
  id: string;
  username: string;
  realName: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  status: string;
  userType: string;
  lastLoginTime: Date | null;
}

export interface PermissionInfo {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

export interface RoleInfo {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    private readonly tokenService: TokenService,
    private readonly nxGovAuthService: NxGovAuthService,
    private readonly wechatAuthService: WechatAuthService,
    private readonly alipayAuthService: AlipayAuthService,
    private readonly sm4Util: Sm4Util,
  ) {}

  async loginWithNxGov(code: string, ip: string): Promise<LoginResult> {
    const { user, isNew } = await this.nxGovAuthService.authenticate(code);
    this.validateUserStatus(user);
    await this.updateLoginInfo(user.id, ip);
    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      username: user.username,
      userType: user.userType,
    });
    this.logger.log(`宁夏政务登录成功: userId=${user.id}`);
    return {
      user: this.toUserInfo(user),
      tokens,
      isNewUser: isNew,
    };
  }

  async loginWithWechatCode(code: string, ip: string): Promise<LoginResult> {
    const { user, isNew } = await this.wechatAuthService.loginWithCode(code);
    this.validateUserStatus(user);
    await this.updateLoginInfo(user.id, ip);
    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      username: user.username,
      userType: user.userType,
    });
    this.logger.log(`微信登录成功: userId=${user.id}`);
    return {
      user: this.toUserInfo(user),
      tokens,
      isNewUser: isNew,
    };
  }

  async loginWithAlipayCode(authCode: string, ip: string): Promise<LoginResult> {
    const { user, isNew } = await this.alipayAuthService.loginWithAuthCode(authCode);
    this.validateUserStatus(user);
    await this.updateLoginInfo(user.id, ip);
    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      username: user.username,
      userType: user.userType,
    });
    this.logger.log(`支付宝登录成功: userId=${user.id}`);
    return {
      user: this.toUserInfo(user),
      tokens,
      isNewUser: isNew,
    };
  }

  async completeWechatLogin(userId: string, ip: string): Promise<TokenPair> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    this.validateUserStatus(user);
    await this.updateLoginInfo(user.id, ip);
    return this.tokenService.generateTokenPair({
      sub: user.id,
      username: user.username,
      userType: user.userType,
    });
  }

  async completeAlipayLogin(userId: string, ip: string): Promise<TokenPair> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    this.validateUserStatus(user);
    await this.updateLoginInfo(user.id, ip);
    return this.tokenService.generateTokenPair({
      sub: user.id,
      username: user.username,
      userType: user.userType,
    });
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return this.tokenService.refreshAccessToken(refreshToken);
  }

  async logout(userId: string, accessTokenJti?: string, refreshToken?: string): Promise<void> {
    await this.tokenService.revokeTokens(userId, accessTokenJti, refreshToken);
    this.logger.log(`用户登出: userId=${userId}`);
  }

  async getUserInfo(userId: string): Promise<UserInfo> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return this.toUserInfo(user);
  }

  async getUserRoles(userId: string): Promise<RoleInfo[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles
      .filter((ur) => ur.role)
      .map((ur) => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
        description: ur.role.description,
        isSystem: ur.role.isSystem,
      }));
  }

  async getUserPermissions(userId: string): Promise<PermissionInfo[]> {
    const userRoles = await this.userRoleRepo.find({ where: { userId } });
    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return [];
    }

    const rolePermissions = await this.rolePermissionRepo
      .createQueryBuilder('rp')
      .innerJoinAndSelect('rp.permission', 'p')
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .getMany();

    const permissionMap = new Map<string, PermissionInfo>();
    for (const rp of rolePermissions) {
      if (rp.permission && !permissionMap.has(rp.permission.id)) {
        permissionMap.set(rp.permission.id, {
          id: rp.permission.id,
          code: rp.permission.code,
          name: rp.permission.name,
          module: rp.permission.module,
          action: rp.permission.action,
          description: rp.permission.description,
        });
      }
    }

    return Array.from(permissionMap.values());
  }

  async validateUserAccess(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    this.validateUserStatus(user);
    return user;
  }

  private validateUserStatus(user: User): void {
    if (user.status === 'inactive') {
      throw new ForbiddenException('用户账号未激活，请先完成实名认证');
    }
    if (user.status === 'locked') {
      throw new ForbiddenException('用户账号已被锁定，请联系管理员解锁');
    }
  }

  private async updateLoginInfo(userId: string, ip: string): Promise<void> {
    await this.userRepo.update(userId, {
      lastLoginIp: ip,
      lastLoginTime: new Date(),
    });
  }

  private toUserInfo(user: User): UserInfo {
    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      phone: user.phone ? this.sm4Util.decrypt(user.phone) : null,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      userType: user.userType,
      lastLoginTime: user.lastLoginTime,
    };
  }
}
