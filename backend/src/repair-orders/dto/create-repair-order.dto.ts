import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRepairOrderDto {
  @IsString()
  machineryId: string;

  @IsString()
  faultType: string;

  @IsString()
  faultDescription: string;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsString()
  locationAddress?: string;
}

export class AssignRepairOrderDto {
  @IsString()
  assigneeId: string;
}

export class CompleteRepairOrderDto {
  @IsString()
  result: string;

  @IsOptional()
  @IsNumber()
  cost?: number;
}
