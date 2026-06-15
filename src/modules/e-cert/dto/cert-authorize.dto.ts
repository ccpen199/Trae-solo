import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';

export type AuthorizationScopeDto = 'all' | 'readonly' | 'specific_fields';

export class CreateCertAuthorizationDto {
  @ApiProperty({ description: '被授权委办局编码', example: 'RS' })
  @IsString()
  granteeDeptCode: string;

  @ApiPropertyOptional({ description: '被授权具体用户ID', example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  granteeUserId?: string;

  @ApiProperty({ description: '证照编码;*表示所有证照', example: 'SFZ' })
  @IsString()
  certCode: string;

  @ApiProperty({
    description: '授权范围',
    enum: ['all', 'readonly', 'specific_fields'],
    example: 'readonly',
    default: 'readonly',
  })
  @IsIn(['all', 'readonly', 'specific_fields'])
  scope: AuthorizationScopeDto = 'readonly';

  @ApiPropertyOptional({
    description: '允许访问的字段列表(当scope=specific_fields时必填)',
    type: [String],
    example: ['name', 'idCardNo'],
  })
  @ValidateIf((o) => o.scope === 'specific_fields')
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  allowedFields?: string[];

  @ApiPropertyOptional({ description: '关联事项编码', example: 'ITEM001' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ description: '关联事项名称', example: '社保缴费办理' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiProperty({ description: '授权生效时间', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: '授权失效时间', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  validTo: string;

  @ApiPropertyOptional({ description: '最大使用次数(null表示不限)', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class RevokeAuthorizationDto {
  @ApiPropertyOptional({ description: '撤销原因', example: '不再需要该授权' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ValidateAuthorizationDto {
  @ApiProperty({ description: '授权令牌', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  authorizationToken: string;

  @ApiProperty({ description: '被授权委办局编码', example: 'RS' })
  @IsString()
  granteeDeptCode: string;

  @ApiProperty({ description: '证照编码', example: 'SFZ' })
  @IsString()
  certCode: string;

  @ApiProperty({ description: '请求访问的字段列表', type: [String], example: ['name', 'idCardNo'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  requestedFields: string[];

  @ApiPropertyOptional({ description: '关联事项编码', example: 'ITEM001' })
  @IsOptional()
  @IsString()
  itemCode?: string;
}
