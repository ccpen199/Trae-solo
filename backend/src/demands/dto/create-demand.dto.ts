import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateDemandDto {
  @IsString()
  cropType: string;

  @IsNumber()
  area: number;

  @IsNumber()
  locationLng: number;

  @IsNumber()
  locationLat: number;

  @IsString()
  address: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  billingMode?: 'PER_MU' | 'PER_HOUR' | 'FIXED_PRICE';

  @IsOptional()
  @IsNumber()
  pricePerUnit?: number;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;
}

export class UpdateDemandDto {
  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  billingMode?: 'PER_MU' | 'PER_HOUR' | 'FIXED_PRICE';

  @IsOptional()
  @IsNumber()
  pricePerUnit?: number;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;
}
