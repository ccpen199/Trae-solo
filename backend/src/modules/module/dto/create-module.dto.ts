import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { ModuleType } from '../entities/module.entity';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty({ message: '模块编码不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '模块名称不能为空' })
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsEnum(ModuleType)
  @IsOptional()
  type?: ModuleType;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}
