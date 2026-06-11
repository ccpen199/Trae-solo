import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsDate, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  maxParticipants?: number;

  @IsArray()
  prizes: Record<string, unknown>[];

  @IsArray()
  @IsString({ each: true })
  rules: string[];

  @IsBoolean()
  @IsOptional()
  isHot?: boolean;
}

export class UpdateActivityEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startTime?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  maxParticipants?: number;

  @IsArray()
  @IsOptional()
  prizes?: Record<string, unknown>[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rules?: string[];

  @IsString()
  @IsOptional()
  status?: string;
}

export class ParticipateDto {
  @IsString()
  @IsNotEmpty()
  activityId: string;
}

export class LotteryDto {
  @IsString()
  @IsNotEmpty()
  activityId: string;
}

export class DeliverPrizeDto {
  @IsString()
  @IsNotEmpty()
  participationId: string;

  @IsString()
  @IsNotEmpty()
  trackingNo: string;

  @IsString()
  @IsNotEmpty()
  trackingCompany: string;
}

export class ActivityQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

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
