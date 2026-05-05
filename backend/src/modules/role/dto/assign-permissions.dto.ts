import { IsNotEmpty, IsArray, IsUUID, IsEnum } from 'class-validator';
import { PermissionType } from '../entities/role-permission.entity';

export class ModulePermissionDto {
  @IsUUID()
  @IsNotEmpty({ message: '模块ID不能为空' })
  moduleId: string;

  @IsArray()
  @IsEnum(PermissionType, { each: true })
  permissions: PermissionType[];
}

export class AssignPermissionsDto {
  @IsArray()
  modulePermissions: ModulePermissionDto[];
}
