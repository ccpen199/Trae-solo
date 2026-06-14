import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsObject,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Department, ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  @ApiProperty({ description: '服务事项ID' })
  @IsUUID()
  @IsNotEmpty()
  serviceItemId: string;

  @ApiPropertyOptional({ description: '表单模板ID' })
  @IsUUID()
  @IsOptional()
  formTemplateId?: string;

  @ApiPropertyOptional({ description: '表单数据' })
  @IsObject()
  @IsOptional()
  formData?: any;

  @ApiPropertyOptional({ description: '预约时间' })
  @IsDateString()
  @IsOptional()
  appointmentTime?: string;

  @ApiPropertyOptional({ description: '预约地点' })
  @IsString()
  @IsOptional()
  appointmentLocation?: string;
}

export class UpdateApplicationDto {
  @ApiPropertyOptional({ description: '表单数据' })
  @IsObject()
  @IsOptional()
  formData?: any;

  @ApiPropertyOptional({ description: '预约时间' })
  @IsDateString()
  @IsOptional()
  appointmentTime?: string;

  @ApiPropertyOptional({ description: '预约地点' })
  @IsString()
  @IsOptional()
  appointmentLocation?: string;
}

export class ApplicationQueryDto {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: '服务事项ID' })
  @IsUUID()
  @IsOptional()
  serviceItemId?: string;

  @ApiPropertyOptional({ description: '办件状态' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '当前处理部门' })
  @IsString()
  @IsOptional()
  currentDepartment?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

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

export class ApproveDto {
  @ApiProperty({ description: '审批动作', enum: ['APPROVE', 'REJECT', 'TRANSFER'] })
  @IsEnum(['APPROVE', 'REJECT', 'TRANSFER'])
  action: 'APPROVE' | 'REJECT' | 'TRANSFER';

  @ApiProperty({ description: '审批部门', enum: Department })
  @IsEnum(Department)
  department: Department;

  @ApiPropertyOptional({ description: '审批意见' })
  @IsString()
  @IsOptional()
  opinion?: string;

  @ApiPropertyOptional({ description: '签名图片URL' })
  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @ApiPropertyOptional({ description: '转交部门', enum: Department })
  @IsEnum(Department)
  @IsOptional()
  transferTo?: Department;
}
