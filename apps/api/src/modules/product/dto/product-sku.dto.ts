import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsObject, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductSkuDto {
  @IsString()
  @IsNotEmpty()
  spuId: string;

  @IsString()
  @IsNotEmpty()
  skuCode: string;

  @IsObject()
  attributes: Record<string, string>;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  originalPrice: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  cost: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  weight: number = 0;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @Type(() => Boolean)
  status: boolean = true;
}

export class UpdateProductSkuDto {
  @IsString()
  @IsOptional()
  skuCode?: string;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  originalPrice?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  cost?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  status?: boolean;
}

export class UpdateStockDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;
}

export class LockStockDto {
  @IsArray()
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
}

export class DeductStockDto {
  @IsArray()
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
}

export class UnlockStockDto {
  @IsArray()
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
}
