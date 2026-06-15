import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  MaxLength,
  IsUUID,
  IsArray,
  IsObject,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, HandlingMode, MaterialItem } from '../entities/service-item.entity';

export class MaterialItemDto implements MaterialItem {
  @ApiProperty({ description: '材料名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: '材料编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ description: '是否必需', default: true })
  required: boolean;

  @ApiPropertyOptional({ description: '材料说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '电子证照类型编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  certType?: string;

  @ApiPropertyOptional({ description: '文件格式要求' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: '份数', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateServiceItemDto {
  @ApiProperty({ description: '事项名称', example: '社会保障卡申领' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '事项编码', example: 'SBK001' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: '所属分类ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: '所属委办局编码', example: 'RSJ' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  deptCode?: string | null;

  @ApiProperty({ description: '服务类型', enum: ['administrative_license', 'administrative_confirmation', 'public_service', 'administrative_penalty', 'administrative_collection', 'other'], default: 'public_service' })
  @IsEnum(['administrative_license', 'administrative_confirmation', 'public_service', 'administrative_penalty', 'administrative_collection', 'other'])
  serviceType: ServiceType;

  @ApiProperty({ description: '办理方式', enum: ['online', 'offline', 'hybrid'], default: 'hybrid' })
  @IsEnum(['online', 'offline', 'hybrid'])
  handlingMode: HandlingMode;

  @ApiPropertyOptional({ description: '承诺办结天数', example: 5, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  promiseDays?: number;

  @ApiPropertyOptional({ description: '收费标准' })
  @IsOptional()
  @IsString()
  chargeStandard?: string | null;

  @ApiPropertyOptional({ description: '法定依据' })
  @IsOptional()
  @IsString()
  legalBasis?: string | null;

  @ApiPropertyOptional({ description: '所需材料清单', type: [MaterialItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialItemDto)
  materialsRequired?: MaterialItemDto[] | null;

  @ApiPropertyOptional({ description: '事项描述' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: '受理条件' })
  @IsOptional()
  @IsString()
  acceptCondition?: string | null;

  @ApiPropertyOptional({ description: '办理流程' })
  @IsOptional()
  @IsString()
  handlingProcess?: string | null;
}

export class UpdateServiceItemDto {
  @ApiPropertyOptional({ description: '事项名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '事项编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: '所属分类ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: '所属委办局编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  deptCode?: string | null;

  @ApiPropertyOptional({ description: '服务类型', enum: ['administrative_license', 'administrative_confirmation', 'public_service', 'administrative_penalty', 'administrative_collection', 'other'] })
  @IsOptional()
  @IsEnum(['administrative_license', 'administrative_confirmation', 'public_service', 'administrative_penalty', 'administrative_collection', 'other'])
  serviceType?: ServiceType;

  @ApiPropertyOptional({ description: '办理方式', enum: ['online', 'offline', 'hybrid'] })
  @IsOptional()
  @IsEnum(['online', 'offline', 'hybrid'])
  handlingMode?: HandlingMode;

  @ApiPropertyOptional({ description: '承诺办结天数' })
  @IsOptional()
  @IsInt()
  @Min(0)
  promiseDays?: number;

  @ApiPropertyOptional({ description: '收费标准' })
  @IsOptional()
  @IsString()
  chargeStandard?: string | null;

  @ApiPropertyOptional({ description: '法定依据' })
  @IsOptional()
  @IsString()
  legalBasis?: string | null;

  @ApiPropertyOptional({ description: '所需材料清单', type: [MaterialItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialItemDto)
  materialsRequired?: MaterialItemDto[] | null;

  @ApiPropertyOptional({ description: '事项描述' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: '受理条件' })
  @IsOptional()
  @IsString()
  acceptCondition?: string | null;

  @ApiPropertyOptional({ description: '办理流程' })
  @IsOptional()
  @IsString()
  handlingProcess?: string | null;
}

export class QueryServiceItemDto {
  @ApiPropertyOptional({ description: '事项名称（模糊查询）' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '事项编码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '所属分类ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: '所属委办局编码' })
  @IsOptional()
  @IsString()
  deptCode?: string;

  @ApiPropertyOptional({ description: '服务类型', enum: ['administrative_license', 'administrative_confirmation', 'public_service', 'administrative_penalty', 'administrative_collection', 'other'] })
  @IsOptional()
  @IsEnum(['administrative_license', 'administrative_confirmation', 'public_service', 'administrative_penalty', 'administrative_collection', 'other'])
  serviceType?: ServiceType;

  @ApiPropertyOptional({ description: '办理方式', enum: ['online', 'offline', 'hybrid'] })
  @IsOptional()
  @IsEnum(['online', 'offline', 'hybrid'])
  handlingMode?: HandlingMode;

  @ApiPropertyOptional({ description: '关键词（搜索名称和编码）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class CreateServiceSubitemDto {
  @ApiProperty({ description: '所属事项ID' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: '子项名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: '子项编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string | null;

  @ApiPropertyOptional({ description: '子项描述' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: '办理条件(JSON)' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '所需材料(JSON数组)' })
  @IsOptional()
  @IsArray()
  materials?: Record<string, unknown>[] | null;

  @ApiPropertyOptional({ description: '处理流程说明' })
  @IsOptional()
  @IsString()
  processingFlow?: string | null;

  @ApiPropertyOptional({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;
}
