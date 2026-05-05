import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: '角色编码不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
