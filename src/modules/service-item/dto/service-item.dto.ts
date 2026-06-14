import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsObject,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Department, MaterialType } from '@prisma/client';

export class CreateServiceItemDto {
  @ApiProperty({ description: '事项名称' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '事项编码（系统自动生成）' })
  @IsString()
  @IsOptional()
  itemCode?: string;

  @ApiPropertyOptional({ description: '事项别名' })
  @IsString()
  @IsOptional()
  itemAlias?: string;

  @ApiProperty({ description: '事项分类' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: '子分类' })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({ description: '事项描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '办理部门', enum: Department })
  @IsEnum(Department)
  handlingDepartment: Department;

  @ApiPropertyOptional({ description: '办理地址' })
  @IsString()
  @IsOptional()
  handlingAddress?: string;

  @ApiProperty({ description: '办理时限（工作日）' })
  @IsInt()
  @Min(1)
  handlingTimeLimit: number;

  @ApiPropertyOptional({ description: '时限单位' })
  @IsString()
  @IsOptional()
  timeLimitUnit?: string;

  @ApiPropertyOptional({ description: '收费标准' })
  @IsString()
  @IsOptional()
  feeStandard?: string;

  @ApiPropertyOptional({ description: '收费依据' })
  @IsString()
  @IsOptional()
  feeBasis?: string;

  @ApiPropertyOptional({ description: '服务对象' })
  @IsString()
  @IsOptional()
  serviceObject?: string;

  @ApiPropertyOptional({ description: '申请条件' })
  @IsString()
  @IsOptional()
  applicationConditions?: string;

  @ApiPropertyOptional({ description: '办理流程（JSON）' })
  @IsObject()
  @IsOptional()
  handlingProcess?: any;

  @ApiPropertyOptional({ description: '父事项ID' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateServiceItemDto extends CreateServiceItemDto {
  @ApiPropertyOptional({ description: '发布人' })
  @IsString()
  @IsOptional()
  publishedBy?: string;
}

export class ServiceItemQueryDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '事项分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '子分类' })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({ description: '办理部门' })
  @IsString()
  @IsOptional()
  handlingDepartment?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class CreateMaterialTemplateDto {
  @ApiProperty({ description: '材料名称' })
  @IsString()
  @IsNotEmpty()
  materialName: string;

  @ApiProperty({ description: '材料类型', enum: MaterialType })
  @IsEnum(MaterialType)
  materialType: MaterialType;

  @ApiPropertyOptional({ description: '是否必需' })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ description: '格式要求（如PDF,JPG）' })
  @IsString()
  @IsNotEmpty()
  format: string;

  @ApiPropertyOptional({ description: '最大文件大小（MB）' })
  @IsInt()
  @IsOptional()
  @Min(1)
  maxSize?: number;

  @ApiPropertyOptional({ description: '材料说明' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '样例文件URL' })
  @IsString()
  @IsOptional()
  sampleUrl?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateMaterialTemplateDto extends CreateMaterialTemplateDto {}

export class CreateFormTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({ description: '模板编码' })
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @ApiPropertyOptional({ description: '版本号' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: '表单Schema（JSON Schema）' })
  @IsObject()
  schema: any;

  @ApiPropertyOptional({ description: 'UI配置' })
  @IsObject()
  @IsOptional()
  uiConfig?: any;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFormTemplateDto extends CreateFormTemplateDto {}
