import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { SitePermission } from './entities/site-permission.entity';
import { CategoryPermission } from './entities/category-permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleType, PermissionModule, PermissionAction } from '../../common/types';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, SitePermission, CategoryPermission]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.initPermissions();
    await this.initRoles();
    await this.initSuperAdmin();
  }

  private async initPermissions() {
    const modules = [
      PermissionModule.SITE,
      PermissionModule.CATEGORY,
      PermissionModule.CONTENT,
      PermissionModule.TEMPLATE,
      PermissionModule.USER,
      PermissionModule.ROLE,
      PermissionModule.COMMENT,
      PermissionModule.VOTE,
      PermissionModule.ATTACHMENT,
      PermissionModule.SYSTEM,
    ];

    const actions = [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
      PermissionAction.PUBLISH,
      PermissionAction.EXPORT,
      PermissionAction.IMPORT,
      PermissionAction.MANAGE,
    ];

    const actionNames: Record<PermissionAction, string> = {
      [PermissionAction.CREATE]: '创建',
      [PermissionAction.READ]: '查看',
      [PermissionAction.UPDATE]: '编辑',
      [PermissionAction.DELETE]: '删除',
      [PermissionAction.PUBLISH]: '发布',
      [PermissionAction.EXPORT]: '导出',
      [PermissionAction.IMPORT]: '导入',
      [PermissionAction.MANAGE]: '管理',
    };

    const moduleNames: Record<PermissionModule, string> = {
      [PermissionModule.SITE]: '站点',
      [PermissionModule.CATEGORY]: '栏目',
      [PermissionModule.CONTENT]: '内容',
      [PermissionModule.TEMPLATE]: '模板',
      [PermissionModule.USER]: '用户',
      [PermissionModule.ROLE]: '角色',
      [PermissionModule.COMMENT]: '评论',
      [PermissionModule.VOTE]: '投票',
      [PermissionModule.ATTACHMENT]: '附件',
      [PermissionModule.SYSTEM]: '系统',
    };

    for (const module of modules) {
      for (const action of actions) {
        const existing = await this.permissionRepository.findOne({
          where: { module, action, isDeleted: false },
        });
        
        if (!existing) {
          const permission = this.permissionRepository.create({
            name: `${moduleNames[module]}${actionNames[action]}`,
            code: `${module}:${action}`,
            module,
            action,
            isActive: true,
          });
          await this.permissionRepository.save(permission);
        }
      }
    }
  }

  private async initRoles() {
    const existingAdmin = await this.roleRepository.findOne({
      where: { code: 'super_admin', isDeleted: false },
    });

    if (!existingAdmin) {
      const allPermissions = await this.permissionRepository.find({
        where: { isDeleted: false, isActive: true },
      });

      const adminRole = this.roleRepository.create({
        name: '超级管理员',
        code: 'super_admin',
        roleType: RoleType.SUPER_ADMIN,
        description: '系统超级管理员，拥有所有权限',
        permissions: allPermissions,
        isSystem: true,
        isActive: true,
      });
      await this.roleRepository.save(adminRole);
    }

    const existingEditor = await this.roleRepository.findOne({
      where: { code: 'editor', isDeleted: false },
    });

    if (!existingEditor) {
      const editorPermissions = await this.permissionRepository.find({
        where: [
          { module: PermissionModule.CONTENT, isDeleted: false, isActive: true },
          { module: PermissionModule.CATEGORY, action: PermissionAction.READ, isDeleted: false, isActive: true },
          { module: PermissionModule.SITE, action: PermissionAction.READ, isDeleted: false, isActive: true },
        ],
      });

      const editorRole = this.roleRepository.create({
        name: '编辑',
        code: 'editor',
        roleType: RoleType.EDITOR,
        description: '内容编辑，可管理内容',
        permissions: editorPermissions,
        isSystem: true,
        isActive: true,
      });
      await this.roleRepository.save(editorRole);
    }
  }

  private async initSuperAdmin() {
    const existing = await this.userRepository.findOne({
      where: { username: 'admin', isDeleted: false },
    });

    if (!existing) {
      const superAdminRole = await this.roleRepository.findOne({
        where: { code: 'super_admin', isDeleted: false },
      });

      const admin = this.userRepository.create({
        username: 'admin',
        password: 'admin123',
        nickname: '系统管理员',
        email: 'admin@example.com',
        isSuperAdmin: true,
        isActive: true,
        roles: superAdminRole ? [superAdminRole] : [],
      });

      await this.userRepository.save(admin);
      console.log('默认管理员账号已创建: admin / admin123');
    }
  }
}
