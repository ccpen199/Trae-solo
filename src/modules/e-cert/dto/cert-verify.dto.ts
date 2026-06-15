import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  IsObject,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export type VerifyMethodDto = 'hash' | 'gateway' | 'chain';
export type VerifyLevelDto = 'basic' | 'standard' | 'strict';

export class FieldVerifyItem {
  @ApiProperty({ description: '字段名称', example: 'idCardNo' })
  @IsString()
  fieldName: string;

  @ApiProperty({ description: '待验真的字段值', example: '640101199001011234' })
  @IsString()
  fieldValue: string;
}

export class CertVerifyDto {
  @ApiProperty({ description: '证照记录ID', example: 'cert-record-uuid' })
  @IsUUID()
  certRecordId: string;

  @ApiProperty({
    description: '验真方式',
    enum: ['hash', 'gateway', 'chain'],
    example: 'standard',
    default: 'hash',
  })
  @IsIn(['hash', 'gateway', 'chain'])
  verifyMethod: VerifyMethodDto = 'hash';

  @ApiProperty({
    description: '验真级别',
    enum: ['basic', 'standard', 'strict'],
    example: 'standard',
    default: 'standard',
  })
  @IsIn(['basic', 'standard', 'strict'])
  verifyLevel: VerifyLevelDto = 'standard';

  @ApiProperty({
    description: '待验真的字段及值列表',
    type: [FieldVerifyItem],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FieldVerifyItem)
  verifyItems: FieldVerifyItem[];

  @ApiPropertyOptional({ description: '验真用途', example: '办理社保业务身份核验' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: '关联事项编码', example: 'ITEM001' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ description: '是否生成验真报告', example: true, default: false })
  @IsOptional()
  @IsBoolean()
  generateReport?: boolean = false;
}

export interface FieldVerifyResult {
  fieldName: string;
  passed: boolean;
  expectedHash?: string;
  actualHash?: string;
  message?: string;
}

export interface VerifyReportData {
  reportId: string;
  verifyTime: Date;
  verifyResult: boolean;
  verifyMethod: string;
  verifyLevel: string;
  certRecordId: string;
  certCode: string;
  verifierId: string;
  verifierName: string | null;
  fields: FieldVerifyResult[];
  signature?: string;
}

export class CertVerifyByNoDto {
  @ApiProperty({ description: '证照编码', example: 'SFZ' })
  @IsString()
  certCode: string;

  @ApiProperty({ description: '证照编号', example: '640101199001011234' })
  @IsString()
  certNo: string;

  @ApiProperty({
    description: '验真方式',
    enum: ['hash', 'gateway', 'chain'],
    example: 'gateway',
    default: 'gateway',
  })
  @IsIn(['hash', 'gateway', 'chain'])
  verifyMethod: VerifyMethodDto = 'gateway';

  @ApiProperty({
    description: '验真字段及值',
    type: Object,
    example: { name: '张三', idCardNo: '640101199001011234' },
  })
  @IsObject()
  verifyData: Record<string, string>;
}
