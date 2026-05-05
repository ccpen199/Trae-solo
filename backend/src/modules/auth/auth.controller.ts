import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';
import { PermissionType } from '../role/entities/role-permission.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.authService.getCurrentUser(userId);
    const { password, ...result } = user;
    return result;
  }

  @Get('menus')
  async getUserMenus(@CurrentUser('id') userId: string) {
    const user = await this.authService.getCurrentUser(userId);
    
    const moduleSet = new Set<string>();
    const modules = [];

    for (const role of user.roles || []) {
      for (const rp of role.rolePermissions || []) {
        if (!moduleSet.has(rp.module.id)) {
          moduleSet.add(rp.module.id);
          modules.push(rp.module);
        }
      }
    }

    const parentModules = modules
      .filter((m) => !m.parentId && m.isVisible && m.enabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const buildMenu = (module: any) => {
      const children = modules
        .filter((m) => m.parentId === module.id && m.isVisible && m.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(buildMenu);

      return {
        id: module.id,
        code: module.code,
        name: module.name,
        icon: module.icon,
        path: module.path,
        type: module.type,
        sortOrder: module.sortOrder,
        children: children.length > 0 ? children : undefined,
      };
    };

    return parentModules.map(buildMenu);
  }
}
