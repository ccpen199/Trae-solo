import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Department } from '@prisma/client';

export class IssueCertificateDto {
  @ApiProperty({ description: '办件ID' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ description: '证照类型' })
  @IsString()
  @IsNotEmpty()
  certType: string;

  @ApiProperty({ description: '证照名称' })
  @IsString()
  @IsNotEmpty()
  certName: string;

  @ApiProperty({ description: '持证人姓名' })
  @IsString()
  @IsNotEmpty()
  holderName: string;

  @ApiProperty({ description: '持证人身份证号' })
  @IsString()
  @IsNotEmpty()
  holderIdCard: string;

  @ApiProperty({ description: '签发人' })
  @IsString()
  @IsNotEmpty()
  issuer: string;

  @ApiProperty({ description: '签发部门', enum: Department })
  @IsEnum(Department)
  issuerDept: Department;

  @ApiPropertyOptional({ description: '有效天数' })
  @IsInt()
  @Min(1)
  @IsOptional()
  validDays?: number;

  @ApiPropertyOptional({ description: '证照扩展数据' })
  @IsObject()
  @IsOptional()
  certData?: any;
}
