import { IsString, IsOptional, IsNumber, IsArray, IsInt, IsEnum } from 'class-validator';
import { StyleStatus } from '../../../common/enums/style-status.enum';

export class CreateStyleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  styleCategory?: string;

  @IsString()
  @IsOptional()
  season?: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  targetGender?: string;

  @IsString()
  @IsOptional()
  ageGroup?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  effectImageUrls?: string[];

  @IsArray()
  @IsOptional()
  detailImageUrls?: string[];

  @IsString()
  @IsOptional()
  sizeChartUrl?: string;

  @IsArray()
  @IsOptional()
  sizeSpecs?: any[];

  @IsString()
  @IsOptional()
  processRequirements?: string;

  @IsString()
  @IsOptional()
  detailNotes?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  sampleSize?: string;

  @IsNumber()
  @IsOptional()
  estimatedProductionQuantity?: number;

  @IsNumber()
  @IsOptional()
  targetUnitCost?: number;

  @IsNumber()
  @IsOptional()
  targetRetailPrice?: number;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
