import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IS_PUBLIC_KEY, REQUIRES_PERMISSION_KEY } from '../decorators/auth.decorator';
import { User } from '../../modules/users/entities/user.entity';
import { SitePermission } from '../../modules/users/entities/site-permission.entity';
import { CategoryPermission } from '../../modules/users/entities/category-permission.entity';
import { PermissionModule, PermissionAction } from '../types';

interface PermissionCheck {
  module: PermissionModule;
  action: PermissionAction;
}

interface JwtPayload {
  sub: string;
  username: string;
  isSuperAdmin: boolean;
}

@Injectable()
export class CombinedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SitePermission)
    private sitePermissionRepository: Repository<SitePermission>,
    @InjectRepository(CategoryPermission)
    private categoryPermissionRepository: Repository<CategoryPermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('令牌无效或已过期');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isDeleted: false, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    request.user = user;

    if (user.isSuperAdmin) {
      return true;
    }

    const permissionCheck = this.reflector.getAllAndOverride<PermissionCheck>(REQUIRES_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permissionCheck) {
      return true;
    }

    const hasGlobalPermission = this.checkRolePermission(user, permissionCheck);
    if (hasGlobalPermission) {
      return true;
    }

    const siteId = this.extractSiteId(request);
    const categoryId = this.extractCategoryId(request);

    if (siteId) {
      const hasSitePermission = await this.checkSitePermission(
        user, 
        siteId, 
        permissionCheck
      );
      if (hasSitePermission) {
        return true;
      }
    }

    if (categoryId) {
      const hasCategoryPermission = await this.checkCategoryPermission(
        user, 
        categoryId, 
        permissionCheck
      );
      if (hasCategoryPermission) {
        return true;
      }
    }

    throw new ForbiddenException('没有执行此操作的权限');
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private checkRolePermission(user: User, permission: PermissionCheck): boolean {
    if (!user.roles) return false;

    for (const role of user.roles) {
      if (!role.permissions) continue;
      for (const perm of role.permissions) {
        if (perm.module === permission.module && perm.action === permission.action) {
          return true;
        }
      }
    }
    return false;
  }

  private async checkSitePermission(
    user: User, 
    siteId: string, 
    permission: PermissionCheck
  ): Promise<boolean> {
    const permKey = `${permission.module}:${permission.action}`;

    for (const role of user.roles) {
      const sitePerm = await this.sitePermissionRepository.findOne({
        where: { siteId, roleId: role.id },
      });
      if (sitePerm && (sitePerm.isManager || sitePerm.permissions?.[permKey])) {
        return true;
      }
    }

    const userSitePerm = await this.sitePermissionRepository.findOne({
      where: { siteId, userId: user.id },
    });
    
    return userSitePerm?.isManager || userSitePerm?.permissions?.[permKey] || false;
  }

  private async checkCategoryPermission(
    user: User, 
    categoryId: string, 
    permission: PermissionCheck
  ): Promise<boolean> {
    const permKey = `${permission.module}:${permission.action}`;

    for (const role of user.roles) {
      const catPerm = await this.categoryPermissionRepository.findOne({
        where: { categoryId, roleId: role.id },
      });
      if (catPerm && catPerm.permissions?.[permKey]) {
        return true;
      }
    }

    const userCatPerm = await this.categoryPermissionRepository.findOne({
      where: { categoryId, userId: user.id },
    });
    
    return userCatPerm?.permissions?.[permKey] || false;
  }

  private extractSiteId(request: any): string | null {
    return request.query.siteId || request.body.siteId || request.params.siteId || null;
  }

  private extractCategoryId(request: any): string | null {
    return request.query.categoryId || request.body.categoryId || request.params.categoryId || null;
  }
}
