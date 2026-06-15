import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsIn, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CertCatalogQueryDto {
  @ApiPropertyOptional({ description: '证照分类', example: '身份证件' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '发证部门编码', example: 'GA' })
  @IsOptional()
  @IsString()
  deptCode?: string;

  @ApiPropertyOptional({ description: '关键词搜索(名称/编码)', example: '身份证' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class MyCertListQueryDto {
  @ApiPropertyOptional({ description: '证照编码', example: 'SFZ' })
  @IsOptional()
  @IsString()
  certCode?: string;

  @ApiPropertyOptional({ description: '证照分类', example: '身份证件' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['valid', 'invalid', 'expired', 'revoked'], example: 'valid' })
  @IsOptional()
  @IsIn(['valid', 'invalid', 'expired', 'revoked'])
  status?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class AccessLogQueryDto {
  @ApiPropertyOptional({ description: '证照记录ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  certRecordId?: string;

  @ApiPropertyOptional({ description: '调用方类型', enum: ['user', 'system', 'dept'] })
  @IsOptional()
  @IsIn(['user', 'system', 'dept'])
  callerType?: string;

  @ApiPropertyOptional({ description: '开始日期(YYYY-MM-DD)', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期(YYYY-MM-DD)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class VerifyLogQueryDto {
  @ApiPropertyOptional({ description: '证照记录ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  certRecordId?: string;

  @ApiPropertyOptional({ description: '验真结果', example: true })
  @IsOptional()
  verifyResult?: boolean;

  @ApiPropertyOptional({ description: '开始日期(YYYY-MM-DD)', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期(YYYY-MM-DD)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class AuthorizationListQueryDto {
  @ApiPropertyOptional({ description: '状态', enum: ['active', 'expired', 'revoked'] })
  @IsOptional()
  @IsIn(['active', 'expired', 'revoked'])
  status?: string;

  @ApiPropertyOptional({ description: '被授权委办局编码', example: 'RS' })
  @IsOptional()
  @IsString()
  granteeDeptCode?: string;

  @ApiPropertyOptional({ description: '证照编码', example: 'SFZ' })
  @IsOptional()
  @IsString()
  certCode?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class DeptPullCertDto {
  @ApiProperty({ description: '证照编码列表', type: [String], example: ['SFZ', 'SBK'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  certCodes: string[];
}
