import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  demandId: string;

  @IsString()
  machineryId: string;

  @IsString()
  billingMode: 'PER_MU' | 'PER_HOUR' | 'FIXED_PRICE';

  @IsNumber()
  pricePerUnit: number;

  @IsOptional()
  @IsNumber()
  estimatedArea?: number;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsNumber()
  estimatedPrice: number;
}

export class DispatchOrderDto {
  @IsString()
  machineryId: string;

  @IsString()
  operatorId: string;
}

export class TrackPointDto {
  @IsNumber()
  lng: number;

  @IsNumber()
  lat: number;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;
}
