import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsInt, Min, ArrayMinSize, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@pet/shared/enums';

class ProductAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  values: string[];

  @IsOptional()
  @Type(() => Boolean)
  isVariant?: boolean = false;
}

class CreateProductSkuDto {
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

  @IsOptional()
  @Type(() => Boolean)
  status?: boolean = true;
}

export class CreateProductSpuDto {
  @IsString()
  @IsNotEmpty()
  merchantId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  mainImage: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  images: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes: ProductAttributeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSkuDto)
  skus: CreateProductSkuDto[];
}

export class UpdateProductSpuDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mainImage?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  @IsOptional()
  attributes?: ProductAttributeDto[];
}

export class UpdateProductSpuStatusDto {
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @IsString()
  @IsOptional()
  auditReason?: string;
}

export class ProductSpuQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  merchantId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

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

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
