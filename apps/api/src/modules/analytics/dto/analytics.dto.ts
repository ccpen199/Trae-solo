import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackEventDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  anonymousId: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsNotEmpty()
  eventName: string;

  properties: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  pageUrl: string;

  @IsString()
  @IsNotEmpty()
  pageTitle: string;

  @IsString()
  @IsOptional()
  referrer?: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @IsString()
  @IsNotEmpty()
  os: string;

  @IsString()
  @IsNotEmpty()
  browser: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  duration?: number;
}

export class UserProfileQueryDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  tagCategory?: string;
}

export class PetProfileQueryDto {
  @IsString()
  @IsNotEmpty()
  petId: string;

  @IsString()
  @IsOptional()
  tagCategory?: string;
}

export class TagQueryDto {
  @IsOptional()
  @IsString()
  tagCategory?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 10;
}
