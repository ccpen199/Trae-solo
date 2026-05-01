import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDate,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '../../common/enums';

export class CreateContentDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  slug?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  contentBody?: string;

  @IsString()
  @IsOptional()
  featuredImageUrl?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  scheduledPublishAt?: Date;
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  slug?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  contentBody?: string;

  @IsString()
  @IsOptional()
  featuredImageUrl?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  scheduledPublishAt?: Date;

  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class UpdateStatusDto {
  status: ContentStatus;
}

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(100)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsOptional()
  sortOrder?: number;
}
