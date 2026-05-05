import { IsString, MinLength, MaxLength, IsOptional, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { 
  SiteType, DomainType, ContentType, PublishStatus, 
} from '../common/types';

export class LoginDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}

export class CreateSiteDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsEnum(SiteType)
  @IsOptional()
  siteType?: SiteType;

  @IsEnum(DomainType)
  @IsOptional()
  domainType?: DomainType;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  directory?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SiteType)
  @IsOptional()
  siteType?: SiteType;

  @IsEnum(DomainType)
  @IsOptional()
  domainType?: DomainType;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  directory?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  siteId: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateContentDto {
  @IsString()
  title: string;

  @IsString()
  siteId: string;

  @IsString()
  categoryId: string;

  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  author?: string;
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(PublishStatus)
  @IsOptional()
  status?: PublishStatus;

  @IsBoolean()
  @IsOptional()
  isTop?: boolean;

  @IsBoolean()
  @IsOptional()
  isRecommend?: boolean;
}
