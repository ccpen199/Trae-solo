import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ContentAuditStatus } from '@pet/shared/enums';

export class AuditActionDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsNotEmpty()
  operation: string;

  @IsEnum(ContentAuditStatus)
  status: ContentAuditStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class AuditQueryDto {
  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsEnum(ContentAuditStatus)
  status?: ContentAuditStatus;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}

export class AutoAuditConfigDto {
  @IsArray()
  @IsString({ each: true })
  riskKeywords: string[];

  @IsBoolean()
  @IsOptional()
  autoApproveEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  autoRejectEnabled?: boolean;
}
