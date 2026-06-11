import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsInt()
  @Min(1)
  @Max(3)
  level: number;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder: number = 0;

  @IsBoolean()
  @Type(() => Boolean)
  status: boolean = true;
}

export class UpdateProductCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  status?: boolean;
}

export class ProductCategoryQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  level?: number;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  status?: boolean;
}
