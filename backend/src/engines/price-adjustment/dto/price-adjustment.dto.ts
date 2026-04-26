import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QualityLevel } from '../../common/enums';

export class QualityGradePrice {
  @IsString()
  level: QualityLevel;

  @IsNumber()
  weight: number;

  @IsNumber()
  @IsOptional()
  price?: number;
}

export class PriceAdjustmentDto {
  @IsString()
  subOrderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityGradePrice)
  gradePrices: QualityGradePrice[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class PriceAdjustmentResult {
  subOrderId: string;
  originalPrice: number;
  originalAmount: number;
  adjustedPrice: number;
  adjustedAmount: number;
  priceDifference: number;
  amountDifference: number;
  adjustmentDetails: Array<{
    level: QualityLevel;
    weight: number;
    price: number;
    amount: number;
  }>;
}
