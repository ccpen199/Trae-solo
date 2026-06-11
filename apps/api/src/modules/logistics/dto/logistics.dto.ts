import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LogisticsQueryDto {
  @IsString()
  @IsNotEmpty()
  trackingNo: string;

  @IsString()
  @IsOptional()
  trackingCompany?: string;
}

export class SubscribeLogisticsDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  trackingNo: string;

  @IsString()
  @IsNotEmpty()
  trackingCompany: string;
}

export class LogisticsListQueryDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  trackingNo?: string;

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
