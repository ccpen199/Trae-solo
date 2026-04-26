import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDecimal, IsBoolean, IsDateString } from 'class-validator';
import { OrderStatus, Role } from '../../common/enums';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  productCategory: string;

  @IsNumber()
  @IsNotEmpty()
  expectedWeight: number;

  @IsNumber()
  @IsNotEmpty()
  expectedPrice: number;

  @IsString()
  @IsNotEmpty()
  originProvince: string;

  @IsString()
  @IsNotEmpty()
  originCity: string;

  @IsString()
  @IsNotEmpty()
  originDistrict: string;

  @IsString()
  @IsOptional()
  originDetail?: string;

  @IsString()
  @IsNotEmpty()
  destinationProvince: string;

  @IsString()
  @IsNotEmpty()
  destinationCity: string;

  @IsString()
  @IsNotEmpty()
  destinationDistrict: string;

  @IsString()
  @IsOptional()
  destinationDetail?: string;

  @IsDateString()
  @IsOptional()
  expectedPickupDate?: string;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsNumber()
  @IsOptional()
  toleranceRate?: number;

  @IsBoolean()
  @IsOptional()
  hasColdChain?: boolean;

  @IsString()
  @IsOptional()
  qualityStandard?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  farmerAllocations: FarmerAllocationDto[];
}

export class FarmerAllocationDto {
  @IsString()
  @IsNotEmpty()
  farmerId: string;

  @IsNumber()
  @IsNotEmpty()
  expectedWeight: number;

  @IsNumber()
  @IsNotEmpty()
  expectedPrice: number;

  @IsString()
  @IsNotEmpty()
  farmProvince: string;

  @IsString()
  @IsNotEmpty()
  farmCity: string;

  @IsString()
  @IsNotEmpty()
  farmDistrict: string;

  @IsString()
  @IsOptional()
  farmDetail?: string;
}

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  productCategory?: string;

  @IsNumber()
  @IsOptional()
  expectedWeight?: number;

  @IsNumber()
  @IsOptional()
  expectedPrice?: number;

  @IsString()
  @IsOptional()
  qualityStandard?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class PrepayOrderDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class ReportActualWeightDto {
  @IsNumber()
  @IsNotEmpty()
  actualWeight: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @IsString()
  @IsOptional()
  remark?: string;
}
