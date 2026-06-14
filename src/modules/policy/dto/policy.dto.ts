import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsEnum,
  IsDateString,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyCategory, Department } from '@prisma/client';

export class CreatePolicyDto {
  @ApiProperty({ description: '政策标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '文号' })
  @IsString()
  @IsOptional()
  documentNo?: string;

  @ApiProperty({ description: '政策分类', enum: PolicyCategory })
  @IsEnum(PolicyCategory)
  category: PolicyCategory;

  @ApiProperty({ description: '发布部门', enum: Department })
  @IsEnum(Department)
  issuingDept: Department;

  @ApiProperty({ description: '发布日期' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({ description: '生效日期' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: '失效日期' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ description: '正文内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '关键词' })
  @IsArray()
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({ description: '附件' })
  @IsObject()
  @IsOptional()
  attachments?: any;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdatePolicyDto extends CreatePolicyDto {}

export class PolicyQueryDto {
  @ApiPropertyOptional({ description: '关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '分类', enum: PolicyCategory })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '发布部门', enum: Department })
  @IsString()
  @IsOptional()
  issuingDept?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;

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
