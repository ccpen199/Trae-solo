import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ColdChainStatus } from '../../common/enums';

export class ColdChainRecordDto {
  @IsString()
  orderId: string;

  @IsString()
  deviceId: string;

  @IsNumber()
  temperature: number;

  @IsNumber()
  @IsOptional()
  humidity?: number;

  @IsNumber()
  @IsOptional()
  locationLat?: number;

  @IsNumber()
  @IsOptional()
  locationLng?: number;

  @IsString()
  @IsOptional()
  locationName?: string;
}

export class ColdChainExceptionDto {
  @IsString()
  exceptionId: string;

  @IsNumber()
  @IsOptional()
  compensationAmount?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ExceptionCompensationResult {
  exceptionId: string;
  orderId: string;
  originalAmount: number;
  compensationAmount: number;
  compensatedAmount: number;
  compensationReason: string;
}
