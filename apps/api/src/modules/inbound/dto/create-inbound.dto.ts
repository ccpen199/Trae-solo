import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInboundDto {
  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsString()
  @IsNotEmpty()
  expiryDate!: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
