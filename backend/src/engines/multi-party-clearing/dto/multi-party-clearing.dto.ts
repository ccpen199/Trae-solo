import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { QualityLevel } from '../../common/enums';

export class SettlementItem {
  @IsString()
  subOrderId: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  taxAmount: number;

  @IsNumber()
  taxRate: number;
}

export class SettlementDto {
  @IsString()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettlementItem)
  items: SettlementItem[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ClearingParty {
  partyType: 'BUYER' | 'FARMER' | 'PLATFORM' | 'TAX';
  partyId?: string;
  partyName?: string;
  amount: number;
  taxAmount?: number;
  taxRate?: number;
}

export class SettlementResult {
  settlementNo: string;
  orderId: string;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  clearingParties: ClearingParty[];
  status: string;
  settledAt: Date;
}

export class ToleranceCheckResult {
  orderId: string;
  expectedWeight: number;
  actualWeight: number;
  weightDifference: number;
  weightDifferenceRate: number;
  toleranceRate: number;
  isWithinTolerance: boolean;
  suggestedAction: 'REFUND' | 'SUPPLEMENT' | 'NONE';
  refundAmount?: number;
}
