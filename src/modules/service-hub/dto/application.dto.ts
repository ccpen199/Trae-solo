import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  IsArray,
  IsObject,
  ValidateNested,
  MaxLength,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApplicationStatus,
  ApplicantInfo,
  ScenarioPathItem,
} from '../entities/application.entity';
import { MaterialStatus } from '../entities/application-material.entity';

export class ApplicantInfoDto implements ApplicantInfo {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: '姓名/企业名称' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '身份证号(SM4加密)' })
  @IsOptional()
  @IsString()
  idCard?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '联系地址' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '企业名称(法人用户)' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: '统一社会信用代码' })
  @IsOptional()
  @IsString()
  creditCode?: string;

  @ApiPropertyOptional({ description: '法定代表人' })
  @IsOptional()
  @IsString()
  legalPerson?: string;

  @ApiPropertyOptional({ description: '法人身份证号' })
  @IsOptional()
  @IsString()
  legalPersonIdCard?: string;

  @ApiPropertyOptional({ description: '联系人姓名' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ description: '联系人电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '用户类型', enum: ['natural', 'legal'] })
  @IsOptional()
  @IsEnum(['natural', 'legal'])
  userType?: 'natural' | 'legal';
}

export class ScenarioPathItemDto implements ScenarioPathItem {
  @ApiProperty({ description: '节点ID' })
  @IsUUID()
  nodeId: string;

  @ApiProperty({ description: '问题内容' })
  @IsString()
  question: string;

  @ApiProperty({ description: '回答键' })
  @IsString()
  answerKey: string;

  @ApiProperty({ description: '回答标签' })
  @IsString()
  answerLabel: string;
}

export class ApplicationMaterialDto {
  @ApiPropertyOptional({ description: '材料ID（更新时传入）' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: '材料名称' })
  @IsString()
  @MaxLength(200)
  materialName: string;

  @ApiPropertyOptional({ description: '材料编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  materialCode?: string | null;

  @ApiPropertyOptional({ description: '文件URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string | null;

  @ApiPropertyOptional({ description: '文件名' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileName?: string | null;

  @ApiPropertyOptional({ description: '电子证照类型编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  certType?: string | null;

  @ApiPropertyOptional({ description: '电子证照编号' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  certNo?: string | null;

  @ApiPropertyOptional({ description: '是否必传', default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;
}

export class CreateApplicationDto {
  @ApiProperty({ description: '事项ID' })
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ description: '子项ID' })
  @IsOptional()
  @IsUUID()
  subitemId?: string | null;

  @ApiProperty({ description: '申请人信息' })
  @IsObject()
  @ValidateNested()
  @Type(() => ApplicantInfoDto)
  applicantInfo: ApplicantInfoDto;

  @ApiPropertyOptional({ description: '情形引导路径', type: [ScenarioPathItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioPathItemDto)
  scenarioPath?: ScenarioPathItemDto[] | null;

  @ApiPropertyOptional({ description: '申报表单数据', type: 'object' })
  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '申报材料列表', type: [ApplicationMaterialDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationMaterialDto)
  materials?: ApplicationMaterialDto[];

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string | null;
}

export class UpdateApplicationDto {
  @ApiPropertyOptional({ description: '子项ID' })
  @IsOptional()
  @IsUUID()
  subitemId?: string | null;

  @ApiPropertyOptional({ description: '申请人信息' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ApplicantInfoDto)
  applicantInfo?: ApplicantInfoDto;

  @ApiPropertyOptional({ description: '情形引导路径', type: [ScenarioPathItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioPathItemDto)
  scenarioPath?: ScenarioPathItemDto[] | null;

  @ApiPropertyOptional({ description: '申报表单数据', type: 'object' })
  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '申报材料列表', type: [ApplicationMaterialDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationMaterialDto)
  materials?: ApplicationMaterialDto[];

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string | null;
}

export class SubmitApplicationDto {
  @ApiPropertyOptional({ description: '申报单ID（创建并提交时不传入）' })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({ description: '事项ID（创建并提交时传入）' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ description: '子项ID' })
  @IsOptional()
  @IsUUID()
  subitemId?: string | null;

  @ApiPropertyOptional({ description: '申请人信息' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ApplicantInfoDto)
  applicantInfo?: ApplicantInfoDto;

  @ApiPropertyOptional({ description: '情形引导路径', type: [ScenarioPathItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioPathItemDto)
  scenarioPath?: ScenarioPathItemDto[] | null;

  @ApiPropertyOptional({ description: '申报表单数据', type: 'object' })
  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '申报材料列表', type: [ApplicationMaterialDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationMaterialDto)
  materials?: ApplicationMaterialDto[];
}

export class QueryApplicationDto {
  @ApiPropertyOptional({ description: '事项ID' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ description: '子项ID' })
  @IsOptional()
  @IsUUID()
  subitemId?: string;

  @ApiPropertyOptional({ description: '申报状态', enum: ['draft', 'submitted', 'accepted', 'reviewing', 'approved', 'rejected', 'completed', 'revoked'] })
  @IsOptional()
  @IsEnum(['draft', 'submitted', 'accepted', 'reviewing', 'approved', 'rejected', 'completed', 'revoked'])
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: '申报单号（模糊查询）' })
  @IsOptional()
  @IsString()
  trackingNo?: string;

  @ApiPropertyOptional({ description: '所属委办局编码' })
  @IsOptional()
  @IsString()
  deptCode?: string;

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

export class RevokeApplicationDto {
  @ApiProperty({ description: '撤销原因' })
  @IsString()
  reason: string;
}

export class UpdateMaterialStatusDto {
  @ApiProperty({ description: '材料状态', enum: ['pending', 'uploaded', 'cert_filled', 'verified', 'rejected'] })
  @IsEnum(['pending', 'uploaded', 'cert_filled', 'verified', 'rejected'])
  status: MaterialStatus;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
