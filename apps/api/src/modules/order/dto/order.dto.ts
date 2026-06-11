import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsInt, Min, ValidateNested, IsObject, IsEmail, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod } from '@pet/shared/enums';

class OrderAddressDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  detail: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  skuId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

class InvoiceInfoDto {
  @IsString()
  @IsNotEmpty()
  type: 'personal' | 'company';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  taxNo?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  content?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  merchantId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  shippingAddress: OrderAddressDto;

  @IsObject()
  @ValidateNested()
  @Type(() => InvoiceInfoDto)
  @IsOptional()
  invoiceInfo?: InvoiceInfoDto;

  @IsString()
  @IsOptional()
  couponId?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  pointUsed?: number = 0;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class OrderQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  merchantId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 10;
}

export class ConfirmReceiveDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  cancelReason: string;
}
