import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTopicDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsEnum(['discussion', 'health', 'nutrition', 'training', 'life', 'adoption', 'other'])
  category: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(['discussion', 'health', 'nutrition', 'training', 'life', 'adoption', 'other'])
  category?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  isHot?: boolean;

  @IsOptional()
  isOfficial?: boolean;

  @IsOptional()
  status?: boolean;
}

export class TopicQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(['discussion', 'health', 'nutrition', 'training', 'life', 'adoption', 'other'])
  category?: string;

  @IsOptional()
  isHot?: boolean;

  @IsOptional()
  isOfficial?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
