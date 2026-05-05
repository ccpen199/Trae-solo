import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { OrganizationType } from '../entities/organization.entity';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: '组织编码不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '组织名称不能为空' })
  name: string;

  @IsEnum(OrganizationType)
  @IsOptional()
  type?: OrganizationType;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
