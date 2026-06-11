import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsInt, Min, IsDate, ValidateNested, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { FlashSaleStatus } from '@pet/shared/enums';

class FlashSaleItemDto {
  @IsString()
  @IsNotEmpty()
  skuId: string;

  @IsString()
  @IsNotEmpty()
  spuId: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  originalPrice: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  saleStock: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  limitPerUser: number = 1;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder: number = 0;
}

export class CreateFlashSaleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleItemDto)
  items: FlashSaleItemDto[];
}

export class UpdateFlashSaleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startTime?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleItemDto)
  @IsOptional()
  items?: FlashSaleItemDto[];
}

export class UpdateFlashSaleStatusDto {
  @IsEnum(FlashSaleStatus)
  status: FlashSaleStatus;
}

export class FlashSaleQueryDto {
  @IsOptional()
  @IsEnum(FlashSaleStatus)
  status?: FlashSaleStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

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

export class FlashSalePurchaseDto {
  @IsString()
  @IsNotEmpty()
  flashSaleId: string;

  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number = 1;
}

export class FlashSaleItemQueryDto {
  @IsOptional()
  @IsString()
  flashSaleId?: string;

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
